import { normalizePetAssignmentPlans, normalizePetDutyWork } from './pets';
import type { PetAssignmentPlan, PetDutyWork } from './pets';

/** Permanent identity and progression. Runtime health, jobs and bonuses belong to Run. */
export type RosterMember = {
  id: string;
  name: string;
  species: string;
  skinId?: string;
  traits: string[];
  skills: Record<string, number>;
  proficiency: Record<string, number>;
  individualBonuses: Record<string, number>;
  relationships: Record<string, { rapport: number; respect: number }>;
};

/** A completed run can offer its existing run pets for explicit, capacity-limited adoption. */
export type PetAdoptionOffer = { id: string; sourceRunId: string; member: RosterMember };

export type PersistentProfile = {
  version: 1;
  engineeringResearch: number;
  blueprintIds: string[];
  capacityUpgradeLevels: { crew: number; pets: number };
  permanentUpgradeLevels: Record<string, number>;
  crew: RosterMember[];
  crewInvite: RosterMember | null;
  pets: RosterMember[];
  petAdoptionOffers: PetAdoptionOffer[];
};

/** New systems attach their runtime state here as their implementation phases land. */
export type RunProgression = {
  version: 1;
  blueprintIdsAtStart: string[];
  crewAssignments: Record<string, string>;
  petAssignments: Record<string, PetAssignmentPlan>;
  petDutyWork: PetDutyWork;
  crewCompanionRecoveryUsed: boolean;
  temporaryUpgradeLevels: Record<string, number>;
};

export function createPersistentProfile(): PersistentProfile {
  return { version: 1, engineeringResearch: 0, blueprintIds: [], capacityUpgradeLevels: { crew: 0, pets: 0 }, permanentUpgradeLevels: {}, crew: [], crewInvite: null, pets: [], petAdoptionOffers: [] };
}

export function createRunProgression(profile?: PersistentProfile): RunProgression {
  return { version: 1, blueprintIdsAtStart: [...(profile?.blueprintIds ?? [])], crewAssignments: {}, petAssignments: {}, petDutyWork: {}, crewCompanionRecoveryUsed: false, temporaryUpgradeLevels: {} };
}

export function createRunId() {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function number(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : 0; }
function count(value: unknown) { return Math.max(0, Math.floor(number(value))); }
function strings(value: unknown): string[] { return Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string' && v.length > 0))] : []; }
function numericRecord(value: unknown, signed = false): Record<string, number> {
  return Object.fromEntries(Object.entries(object(value)).map(([key, v]) => [key, signed ? number(v) : count(v)]));
}
function assignments(value: unknown): Record<string, string> {
  return Object.fromEntries(Object.entries(object(value)).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}
function roster(value: unknown): RosterMember[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap(raw => {
    const member = object(raw);
    if (typeof member.id !== 'string' || typeof member.name !== 'string' || !member.id || seen.has(member.id)) return [];
    seen.add(member.id);
    return [{ id: member.id, name: member.name, species: typeof member.species === 'string' ? member.species : 'unknown', ...(typeof member.skinId === 'string' ? { skinId: member.skinId } : {}),
      traits: strings(member.traits), skills: numericRecord(member.skills), proficiency: numericRecord(member.proficiency), individualBonuses: numericRecord(member.individualBonuses, true),
      relationships: Object.fromEntries(Object.entries(object(member.relationships)).map(([id, rawRelationship]) => {
        const relation = object(rawRelationship);
        return [id, { rapport: number(relation.rapport), respect: number(relation.respect) }];
      })),
    }];
  });
}

function petAdoptionOffers(value: unknown): PetAdoptionOffer[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap(raw => {
    const offer = object(raw);
    const id = typeof offer.id === 'string' && offer.id ? offer.id : '';
    const sourceRunId = typeof offer.sourceRunId === 'string' ? offer.sourceRunId : '';
    const member = roster([offer.member])[0];
    if (!id || !sourceRunId || !member || seen.has(id) || member.id !== id) return [];
    seen.add(id);
    return [{ id, sourceRunId, member }];
  });
}

export function normalizePersistentProfile(raw: unknown): PersistentProfile {
  const value = object(raw);
  if (value.version !== undefined && value.version !== 1) throw new Error('This profile requires a newer game version.');
  const capacities = object(value.capacityUpgradeLevels);
  return { version: 1, engineeringResearch: count(value.engineeringResearch), blueprintIds: strings(value.blueprintIds),
    capacityUpgradeLevels: { crew: count(capacities.crew), pets: count(capacities.pets) }, permanentUpgradeLevels: numericRecord(value.permanentUpgradeLevels),
    crew: roster(value.crew), crewInvite: roster(value.crewInvite ? [value.crewInvite] : [])[0] ?? null, pets: roster(value.pets), petAdoptionOffers: petAdoptionOffers(value.petAdoptionOffers) };
}

export function normalizeRunProgression(raw: unknown): RunProgression {
  const value = object(raw);
  if (value.version !== undefined && value.version !== 1) throw new Error('This run requires a newer game version.');
  return { version: 1, blueprintIdsAtStart: strings(value.blueprintIdsAtStart), crewAssignments: assignments(value.crewAssignments),
    petAssignments: normalizePetAssignmentPlans(value.petAssignments), petDutyWork: normalizePetDutyWork(value.petDutyWork), crewCompanionRecoveryUsed: value.crewCompanionRecoveryUsed === true, temporaryUpgradeLevels: numericRecord(value.temporaryUpgradeLevels) };
}

/** Apply once on load, not once per simulation tick. Old saves retain all gameplay fields. */
export function ensureRunProgression<T extends { runId?: string; progression?: RunProgression }>(run: T): T & { runId: string; progression: RunProgression } {
  return { ...run, runId: run.runId || createRunId(), progression: normalizeRunProgression(run.progression) };
}
