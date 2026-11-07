import type { Run, ScoreEntry } from './mechanics';
import { archiveSectorRoute, SectorRouteRecord } from './sectorMap';

export type CaptainLogReport = {
  version: 1;
  id: string;
  recordedAt: number;
  score: ScoreEntry;
  outcome: 'lost';
  finalLives: number;
  lifeCapacity: number;
  finalLevelEvent: Run['levelEvent'];
  pictureVistaId?: string;
  resources: {
    credits: number;
    merchantTokens: number;
    powerBars: number;
    speedCharges: number;
    ramCharges: number;
    chargeCharges: number;
    petEggs: number;
  };
  foundry?: {
    processedItems: Partial<Record<'life' | 'speed' | 'ram' | 'charge', number>>;
    manualProcessedItems: Partial<Record<'life' | 'speed' | 'ram' | 'charge', number>>;
    pendingJobs: number;
  };
  route: SectorRouteRecord[];
  narrative: string[];
  closeout?: {
    researchAwarded: number;
    researchBalance: number;
    blueprintCount: number;
    permanentCrewCount: number;
    permanentPetCount: number;
  };
};

export function buildCaptainLogReport(run: Run, score: ScoreEntry): CaptainLogReport {
  const currentRoute = run.sector ? archiveSectorRoute(run.sector) : undefined;
  const route = [...(run.routeAtlas ?? []), ...(currentRoute ? [currentRoute] : [])]
    .filter((segment, index, all) => all.findIndex(candidate => candidate.id === segment.id) === index);
  const visitedBeacons = route.reduce((count, segment) => count + segment.pathBeaconIds.length, 0);
  const sectorCount = route.length;
  const scoreTotal = score.score;
  const narrative = [
    `The run ended at Stage ${score.level} with ${Math.max(0, run.lives)} lives remaining. Final score: ${scoreTotal}.`,
    `The flight crossed ${sectorCount} recorded ${sectorCount === 1 ? 'sector' : 'sectors'} and followed ${visitedBeacons} beacon ${visitedBeacons === 1 ? 'visit' : 'visits'}. The ship contained ${score.ballsContained} balls, destroyed ${score.ballsDestroyed}, captured ${score.pickupsCaptured} pickups, and claimed ${score.totalTerritoryClaimed.toFixed(1)}% total territory.`,
    ...(run.levelEvent !== 'none' ? [`The final stage carried a ${run.levelEvent === 'elimination' ? 'Containment Elimination' : 'Drift Swarm'} event.`] : []),
  ];

  return {
    version: 1,
    id: score.runId ?? `run-${score.timestamp}`,
    recordedAt: score.timestamp,
    score,
    outcome: 'lost',
    finalLives: Math.max(0, run.lives),
    lifeCapacity: Math.max(0, run.lifeCapacity ?? run.lives),
    finalLevelEvent: run.levelEvent,
    pictureVistaId: run.pictureEvent?.vistaId,
    resources: {
      credits: Math.max(0, run.credits ?? 0),
      merchantTokens: Math.max(0, run.merchantTokens ?? 0),
      powerBars: Math.max(0, run.powerBars ?? 0),
      speedCharges: Math.max(0, run.speedCharges ?? 0),
      ramCharges: Math.max(0, run.ramCharges ?? 0),
      chargeCharges: Math.max(0, run.chargeCharges ?? 0),
      petEggs: Math.max(0, run.petEggs ?? 0),
    },
    foundry: {
      processedItems: { ...(run.foundryProcessedItems ?? {}) },
      manualProcessedItems: { ...(run.manualRefinedItems ?? {}) },
      pendingJobs: (run.overflowJobs ?? []).length,
    },
    route,
    narrative,
  };
}

export function normalizeCaptainLogReport(value: Partial<CaptainLogReport>): CaptainLogReport | null {
  if (!value || value.version !== 1 || !value.id || !value.score || !Array.isArray(value.route)) return null;
  if (!value.score.timestamp || !Number.isFinite(value.score.score) || !Number.isFinite(value.recordedAt)) return null;
  if (!Array.isArray(value.narrative) || !value.narrative.every(line => typeof line === 'string') || !value.resources) return null;
  if (!Number.isFinite(value.score.claimed) || !Number.isFinite(value.score.totalTerritoryClaimed)) return null;
  if (!value.route.every(segment => segment && Array.isArray(segment.beacons) && segment.beacons.every(beacon => beacon && typeof beacon.id === 'string') && Array.isArray(segment.pathBeaconIds))) return null;
  return { ...value, foundry: value.foundry ?? { processedItems: {}, manualProcessedItems: {}, pendingJobs: 0 } } as CaptainLogReport;
}

