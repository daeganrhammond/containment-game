import type { RosterMember } from './progression';

export const CREW_ROLES = [
  { id: 'engineer', label: 'ENGINEER', station: 'FOUNDRY WATCH' },
  { id: 'quartermaster', label: 'QUARTERMASTER', station: 'CARGO MANIFEST' },
  { id: 'navigator', label: 'NAVIGATOR', station: 'ROUTE WATCH' },
  { id: 'defense-specialist', label: 'DEFENSE SPECIALIST', station: 'SENTRY WATCH' },
  { id: 'field-salvager', label: 'FIELD SALVAGER', station: 'SALVAGE REVIEW' },
  { id: 'medic', label: 'MEDIC', station: 'CREW CHECK' },
  { id: 'research-analyst', label: 'RESEARCH ANALYST', station: 'ANOMALY REVIEW' },
  { id: 'pilot', label: 'PILOT', station: 'FLIGHT CHECK' },
  { id: 'communications', label: 'COMMUNICATIONS', station: 'SIGNAL WATCH' },
  { id: 'life-support', label: 'LIFE SUPPORT', station: 'ENVIRONMENT CHECK' },
] as const;

/** Generic roster record only. Character identity, species, traits, and art are future content. */
export function crewCandidateForRun(runId: string): RosterMember {
  return {
    id: `crew-${runId}`,
    name: 'Unassigned Crew Record',
    species: 'unassigned',
    traits: [],
    skills: {},
    proficiency: {},
    individualBonuses: {},
    relationships: {},
  };
}

export function crewCapacity(upgradeLevel: number) { return 1 + Math.max(0, Math.floor(upgradeLevel)); }
