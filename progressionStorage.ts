import { advanceOfflineFoundry } from './mechanics';
import type { Run, ScoreEntry } from './mechanics';
import { buildCaptainLogReport, normalizeCaptainLogReport } from './captainLog';
import type { CaptainLogReport } from './captainLog';
import { createPersistentProfile, ensureRunProgression, normalizePersistentProfile } from './progression';
import type { PersistentProfile, RosterMember } from './progression';
import { crewCandidateForRun, crewCapacity } from './crew';
import { PET_DUTIES, PET_PROFICIENCY_CAP, petCapacity } from './pets';
import type { PetDutyWork } from './pets';

export const ACTIVE_RUN_KEY = 'trap-game-save-v1';
export const PROGRESSION_KEY = 'trap-game-progression-v1';
const LEGACY_REPORT_KEY = 'trap-game-captain-log-v1';
const LEGACY_SCORE_KEY = `${ACTIVE_RUN_KEY}-scores`;

export type ProgressionArchive = { version: 1; profile: PersistentProfile; reports: CaptainLogReport[]; scores: ScoreEntry[] };
type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown>; removeItem(key: string): Promise<unknown> };

function list(raw: string | null): unknown[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('Saved records could not be read. Existing data has been preserved.');
  return value;
}
function score(raw: unknown): ScoreEntry {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid saved score.');
  const value = raw as Partial<ScoreEntry>;
  const finite = (v: unknown, fallback = 0) => typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  const level = finite(value.level, finite(value.score));
  return { runId: typeof value.runId === 'string' ? value.runId : undefined, score: finite(value.score, level), level,
    claimed: finite(value.claimed), totalTerritoryClaimed: finite(value.totalTerritoryClaimed, finite(value.claimed)),
    ballsContained: finite(value.ballsContained), ballsDestroyed: finite(value.ballsDestroyed), pickupsCaptured: finite(value.pickupsCaptured), timestamp: finite(value.timestamp) };
}
const COMPLETED_RUN_RESEARCH_AWARD = 1;
const EARLY_RESEARCH_BALANCE_CAP = 3;
function closeout(profile: PersistentProfile, researchAwarded = 0) {
  return { researchAwarded, researchBalance: profile.engineeringResearch, blueprintCount: profile.blueprintIds.length,
    permanentCrewCount: profile.crew.length, permanentPetCount: profile.pets.length };
}
function reports(values: unknown[], profile: PersistentProfile): CaptainLogReport[] {
  const byId = new Map<string, CaptainLogReport>();
  for (const raw of values) {
    const report = normalizeCaptainLogReport(raw as Partial<CaptainLogReport>);
    if (!report) throw new Error('A saved report could not be read. Existing data has been preserved.');
    if (!byId.has(report.id)) byId.set(report.id, report.closeout ? report : { ...report, closeout: closeout(profile) });
  }
  return [...byId.values()].sort((a, b) => b.recordedAt - a.recordedAt);
}
function rank(values: ScoreEntry[]) {
  return [...values].sort((a, b) => b.score - a.score || b.ballsContained - a.ballsContained || a.timestamp - b.timestamp).slice(0, 5);
}

function petRosterRecord(runId: string, pet: NonNullable<Run['pets']>[number], work: Record<string, number> = {}): RosterMember {
  const id = pet.rosterId ?? `${runId}-pet-${pet.id}`;
  const proficiency = Object.fromEntries(PET_DUTIES.map(duty => [duty.id, Math.min(PET_PROFICIENCY_CAP, Math.max(0, Math.floor(work[duty.id] ?? 0)))]));
  return { id, name: pet.name, species: pet.species, ...(pet.skinId ? { skinId: pet.skinId } : {}), traits: [], skills: {}, proficiency, individualBonuses: {}, relationships: {} };
}

function applyPetDutyWork(member: RosterMember, work: Record<string, number> | undefined): RosterMember {
  if (!work) return member;
  const proficiency = { ...member.proficiency };
  for (const duty of PET_DUTIES) {
    const completed = Math.max(0, Math.floor(work[duty.id] ?? 0));
    if (completed) proficiency[duty.id] = Math.min(PET_PROFICIENCY_CAP, (proficiency[duty.id] ?? 0) + completed);
  }
  return { ...member, proficiency };
}

function activeRun(raw: string): Run {
  const value = JSON.parse(raw) as Run;
  // `ended` was optional in historical Run saves; absent means the run is active.
  if (!value || (value.ended !== undefined && typeof value.ended !== 'boolean') || !Number.isFinite(value.level) || !Array.isArray(value.balls) || !Array.isArray(value.walls)) {
    throw new Error('The active run could not be read. Existing data has been preserved.');
  }
  return ensureRunProgression(value);
}

/** One writer owns active-run and progression writes, including run-end recovery.
 * Profile + sealed reports + ranking share ONE storage value, so they commit together.
 * The ended active save is written first and is the recovery record if that commit fails.
 */
export function createProgressionStorage(storage: Storage) {
  let queue: Promise<unknown> = Promise.resolve();
  function serial<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation);
    queue = result.catch(() => undefined);
    return result;
  }
  async function read(): Promise<ProgressionArchive> {
    const raw = await storage.getItem(PROGRESSION_KEY);
    if (raw !== null) {
      const value = JSON.parse(raw) as ProgressionArchive;
      if (!value || value.version !== 1 || !value.profile || !Array.isArray(value.reports) || !Array.isArray(value.scores)) throw new Error('Progression data cannot be opened by this version.');
      const profile = normalizePersistentProfile(value.profile);
      const normalizedReports = reports(value.reports, profile);
      const migratedReports = value.reports.some((report: Partial<CaptainLogReport>) => !report.closeout) || !Array.isArray(value.profile.petAdoptionOffers);
      const archive = { version: 1 as const, profile, reports: normalizedReports, scores: rank(value.scores.map(score)) };
      if (migratedReports) await storage.setItem(PROGRESSION_KEY, JSON.stringify(archive));
      return archive;
    }
    const [oldReports, oldScores] = await Promise.all([storage.getItem(LEGACY_REPORT_KEY), storage.getItem(LEGACY_SCORE_KEY)]);
    const profile = createPersistentProfile();
    const migrated: ProgressionArchive = { version: 1, profile, reports: reports(list(oldReports), profile), scores: rank(list(oldScores).map(score)) };
    await storage.setItem(PROGRESSION_KEY, JSON.stringify(migrated));
    return migrated;
  }
  async function seal(run: Run): Promise<ProgressionArchive> {
    if (!run.ended || !run.runId) throw new Error('Only an identified, completed run can be sealed.');
    const archive = await read();
    const existing = archive.reports.find(report => report.id === run.runId);
    if (!existing) {
      const researchAwarded = Math.min(COMPLETED_RUN_RESEARCH_AWARD, Math.max(0, EARLY_RESEARCH_BALANCE_CAP - archive.profile.engineeringResearch));
      archive.profile = { ...archive.profile, engineeringResearch: archive.profile.engineeringResearch + researchAwarded };
      const entry: ScoreEntry = { runId: run.runId, score: run.level + (run.beaconBonusScore ?? 0), level: run.level, claimed: run.claimed,
        totalTerritoryClaimed: run.totalTerritoryClaimed, ballsDestroyed: run.ballsDestroyed, ballsContained: run.ballsContained, pickupsCaptured: run.pickupsCaptured, timestamp: Date.now() };
      const report = buildCaptainLogReport(run, entry);
      report.closeout = closeout(archive.profile, researchAwarded);
      const capacity = crewCapacity(archive.profile.capacityUpgradeLevels.crew);
      if (!archive.profile.crewInvite && archive.profile.crew.length < capacity) archive.profile = { ...archive.profile, crewInvite: crewCandidateForRun(run.runId) };
      const dutyWork = run.progression?.petDutyWork as PetDutyWork | undefined;
      archive.profile = { ...archive.profile, pets: archive.profile.pets.map(member => {
        const pet = (run.pets ?? []).find(candidate => candidate.rosterId === member.id);
        return pet ? applyPetDutyWork(member, dutyWork?.[String(pet.id)]) : member;
      }) };
      const existingPetIds = new Set(archive.profile.pets.map(pet => pet.id));
      const adoptionOffers = (run.pets ?? []).map(pet => petRosterRecord(run.runId!, pet, dutyWork?.[String(pet.id)]))
        .filter((member, index, values) => !existingPetIds.has(member.id) && values.findIndex(candidate => candidate.id === member.id) === index)
        .map(member => ({ id: member.id, sourceRunId: run.runId!, member }));
      if (adoptionOffers.length) archive.profile = { ...archive.profile, petAdoptionOffers: [...archive.profile.petAdoptionOffers, ...adoptionOffers] };
      archive.reports = [report, ...archive.reports];
      archive.scores = rank([...archive.scores.filter(value => value.runId !== run.runId), entry]);
      // Future Research awards and invitations must update this same archive commit.
      await storage.setItem(PROGRESSION_KEY, JSON.stringify(archive));
    }
    const active = await storage.getItem(ACTIVE_RUN_KEY);
    if (active) {
      const saved = JSON.parse(active) as Run;
      if (saved.runId === run.runId && saved.ended) await storage.removeItem(ACTIVE_RUN_KEY);
    }
    return archive;
  }
  return {
    initialize: () => serial(async () => {
      let archive = await read();
      const raw = await storage.getItem(ACTIVE_RUN_KEY);
      let active: Run | null = raw ? activeRun(raw) : null;
      if (active) {
        const now = Date.now();
        const previousSaveAt = Number.isFinite(active.foundryLastSavedAt) ? active.foundryLastSavedAt! : now;
        if (!active.ended) active = advanceOfflineFoundry(active, Math.max(0, now - previousSaveAt));
        active.foundryLastSavedAt = now;
        await storage.setItem(ACTIVE_RUN_KEY, JSON.stringify(active));
        if (active.ended) { archive = await seal(active); active = null; }
      }
      return { archive, active };
    }),
    saveActive: (run: Run) => {
      const snapshot = JSON.stringify({ ...run, foundryLastSavedAt: Date.now() }); // Capture at call time, not when the queue runs.
      return serial(async () => {
        const active = JSON.parse(snapshot) as Run;
        if (active.ended) throw new Error('Completed runs must use the closeout path.');
        await storage.setItem(ACTIVE_RUN_KEY, snapshot);
      });
    },
    finishRun: (run: Run) => {
      const snapshot = JSON.stringify(run);
      return serial(async () => {
        const ended = ensureRunProgression(JSON.parse(snapshot) as Run);
        if (!ended.ended) throw new Error('This run is still active.');
        await storage.setItem(ACTIVE_RUN_KEY, JSON.stringify(ended));
        return seal(ended);
      });
    },
    purchaseBlueprint: (blueprintId: string, cost: number) => serial(async () => {
      const archive = await read();
      if (archive.profile.blueprintIds.includes(blueprintId)) return { archive, unlocked: true };
      if (archive.profile.engineeringResearch < cost) return { archive, unlocked: false };
      archive.profile = { ...archive.profile, engineeringResearch: archive.profile.engineeringResearch - cost, blueprintIds: [...archive.profile.blueprintIds, blueprintId] };
      await storage.setItem(PROGRESSION_KEY, JSON.stringify(archive));
      return { archive, unlocked: true };
    }),
    acceptCrewInvite: () => serial(async () => {
      const archive = await read();
      const invite = archive.profile.crewInvite;
      const capacity = crewCapacity(archive.profile.capacityUpgradeLevels.crew);
      if (!invite || archive.profile.crew.some(member => member.id === invite.id) || archive.profile.crew.length >= capacity) return { archive, recruited: false };
      archive.profile = { ...archive.profile, crew: [...archive.profile.crew, invite], crewInvite: null };
      await storage.setItem(PROGRESSION_KEY, JSON.stringify(archive));
      return { archive, recruited: true, member: invite };
    }),
    declineCrewInvite: () => serial(async () => {
      const archive = await read();
      if (!archive.profile.crewInvite) return archive;
      archive.profile = { ...archive.profile, crewInvite: null };
      await storage.setItem(PROGRESSION_KEY, JSON.stringify(archive));
      return archive;
    }),
    adoptPetOffer: (offerId: string) => serial(async () => {
      const archive = await read();
      const offer = archive.profile.petAdoptionOffers.find(value => value.id === offerId);
      const capacity = petCapacity(archive.profile.capacityUpgradeLevels.pets);
      if (!offer || archive.profile.pets.some(pet => pet.id === offer.member.id) || archive.profile.pets.length >= capacity) return { archive, adopted: false };
      archive.profile = { ...archive.profile, pets: [...archive.profile.pets, offer.member], petAdoptionOffers: archive.profile.petAdoptionOffers.filter(value => value.id !== offerId) };
      await storage.setItem(PROGRESSION_KEY, JSON.stringify(archive));
      return { archive, adopted: true, member: offer.member };
    }),
    releasePetOffer: (offerId: string) => serial(async () => {
      const archive = await read();
      if (!archive.profile.petAdoptionOffers.some(value => value.id === offerId)) return archive;
      archive.profile = { ...archive.profile, petAdoptionOffers: archive.profile.petAdoptionOffers.filter(value => value.id !== offerId) };
      await storage.setItem(PROGRESSION_KEY, JSON.stringify(archive));
      return archive;
    }),
  };
}
