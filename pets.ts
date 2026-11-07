/** Pet-system contracts. This module defines reusable duties, not pet identities or abilities. */
export const PET_DUTIES = [
  { id: 'spotter', label: 'SPOTTER', intent: 'Call out visible phase hazards, rare contacts, and stage clears; never reveal hidden beacons.' },
  { id: 'retriever', label: 'RETRIEVER', intent: 'Recover only player-allowed pickups that fit available cargo capacity.' },
  { id: 'cargo-helper', label: 'CARGO HELPER', intent: 'Support cargo workflows without creating items or capacity.' },
  { id: 'crew-companion', label: 'CREW COMPANION', intent: 'Provide a small run-only recovery or companionship effect.' },
  { id: 'systems-helper', label: 'SYSTEMS HELPER', intent: 'Provide limited, cooldown-bound maintenance support.' },
] as const;

export type PetDutyId = typeof PET_DUTIES[number]['id'];
export type RetrieverPickupId = 'life' | 'speed' | 'ram' | 'charge' | 'credit';
export type PetDutyWork = Record<string, Partial<Record<PetDutyId, number>>>;

/** Rare, event, pet, and exit rewards are deliberately absent from this allowlist. */
export const RETRIEVER_PICKUP_TYPES: readonly RetrieverPickupId[] = ['life', 'speed', 'ram', 'charge', 'credit'];

export type PetAssignmentPlan = {
  primary: PetDutyId | null;
  backup: PetDutyId | null;
  /** Empty means automatic retrieval is off until the player explicitly opts in. */
  retrieverFilters: RetrieverPickupId[];
};

export function createPetAssignmentPlan(): PetAssignmentPlan {
  return { primary: null, backup: null, retrieverFilters: [] };
}

export function normalizePetDutyWork(value: unknown): PetDutyWork {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([petId, raw]) => {
    if (!petId || !raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
    const work = Object.fromEntries(Object.entries(raw as Record<string, unknown>).flatMap(([duty, amount]) =>
      isPetDutyId(duty) && typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? [[duty, Math.floor(amount)]] : []));
    return [[petId, work]];
  }));
}

export function recordPetDutyWork(work: PetDutyWork, petId: number | string, duty: PetDutyId): PetDutyWork {
  const key = String(petId);
  return { ...work, [key]: { ...work[key], [duty]: (work[key]?.[duty] ?? 0) + 1 } };
}

export const PET_PROFICIENCY_CAP = 5;
export const PET_SPOTTER_COOLDOWN_MS = 5000;
export const PET_CARGO_HELPER_SPEED_PER_LEVEL_PERCENT = 1;
export const PET_COMPANION_RECOVERY_PER_RUN = 1;
export const PET_SYSTEMS_HELPER_BASE_COOLDOWN_MS = 30_000;
export const PET_SYSTEMS_HELPER_COOLDOWN_REDUCTION_PER_LEVEL_MS = 2_000;
export const PET_SYSTEMS_HELPER_MIN_COOLDOWN_MS = 20_000;

export type AssignedDutyPet = { id: number; health: number; dutyProficiency?: Partial<Record<PetDutyId, number>> };

export function petDutyProficiency(pet: AssignedDutyPet, duty: PetDutyId) {
  return Math.min(PET_PROFICIENCY_CAP, Math.max(0, Math.floor(pet.dutyProficiency?.[duty] ?? 0)));
}

/** Living primary or backup workers, strongest proficiency first; effects never stack. */
export function assignedPetsForDuty<T extends AssignedDutyPet>(pets: readonly T[], assignments: Record<string, PetAssignmentPlan> | undefined, duty: PetDutyId): T[] {
  return pets.filter(pet => {
    if (pet.health <= 0) return false;
    const plan = assignments?.[String(pet.id)];
    return plan?.primary === duty || plan?.backup === duty;
  }).slice().sort((a, b) => petDutyProficiency(b, duty) - petDutyProficiency(a, duty));
}

export function systemsHelperCooldownMs(proficiency: number) {
  const level = Math.min(PET_PROFICIENCY_CAP, Math.max(0, Math.floor(proficiency)));
  return Math.max(PET_SYSTEMS_HELPER_MIN_COOLDOWN_MS, PET_SYSTEMS_HELPER_BASE_COOLDOWN_MS - level * PET_SYSTEMS_HELPER_COOLDOWN_REDUCTION_PER_LEVEL_MS);
}

export type CargoHelperPet = { id: number; health: number; dutyProficiency?: Partial<Record<PetDutyId, number>> };
export type CargoHelperAssignment = { petId: number; proficiency: number; reductionPercent: number };

/** One living assigned pet assists a foundry job; proficiency never stacks between pets. */
export function cargoHelperForRun(pets: readonly CargoHelperPet[], assignments: Record<string, PetAssignmentPlan> | undefined): CargoHelperAssignment | null {
  let selected: CargoHelperAssignment | null = null;
  for (const pet of pets) {
    if (pet.health <= 0) continue;
    const plan = assignments?.[String(pet.id)];
    if (plan?.primary !== 'cargo-helper' && plan?.backup !== 'cargo-helper') continue;
    const proficiency = Math.min(PET_PROFICIENCY_CAP, Math.max(0, Math.floor(pet.dutyProficiency?.['cargo-helper'] ?? 0)));
    if (!selected || proficiency > selected.proficiency) selected = {
      petId: pet.id,
      proficiency,
      reductionPercent: proficiency * PET_CARGO_HELPER_SPEED_PER_LEVEL_PERCENT,
    };
  }
  return selected;
}

export function foundryDurationWithCargoHelper(baseDurationMs: number, helper: CargoHelperAssignment | null): number {
  const duration = Math.max(0, Math.floor(baseDurationMs));
  if (!duration || !helper?.reductionPercent) return duration;
  return Math.max(1, Math.round(duration * (100 - helper.reductionPercent) / 100));
}

export function petCapacity(upgradeLevel: number) {
  return 1 + Math.max(0, Math.floor(Number.isFinite(upgradeLevel) ? upgradeLevel : 0));
}

export function isPetDutyId(value: unknown): value is PetDutyId {
  return typeof value === 'string' && PET_DUTIES.some(duty => duty.id === value);
}

export function isRetrieverPickupId(value: unknown): value is RetrieverPickupId {
  return typeof value === 'string' && RETRIEVER_PICKUP_TYPES.includes(value as RetrieverPickupId);
}

/** Defensive normalization also migrates the old `petId: dutyId` map shape. */
export function normalizePetAssignmentPlans(value: unknown): Record<string, PetAssignmentPlan> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([petId, raw]) => {
    if (!petId) return [];
    if (typeof raw === 'string') {
      return [[petId, { ...createPetAssignmentPlan(), primary: isPetDutyId(raw) ? raw : null }]];
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
    const plan = raw as Partial<PetAssignmentPlan>;
    const primary = isPetDutyId(plan.primary) ? plan.primary : null;
    const backup = isPetDutyId(plan.backup) && plan.backup !== primary ? plan.backup : null;
    const retrieverFilters = Array.isArray(plan.retrieverFilters)
      ? [...new Set(plan.retrieverFilters.filter(isRetrieverPickupId))]
      : [];
    return [[petId, { primary, backup, retrieverFilters }]];
  }));
}

export function canRetrievePickup(plan: PetAssignmentPlan, kind: string, hasCargoCapacity: boolean) {
  return hasCargoCapacity && (plan.primary === 'retriever' || plan.backup === 'retriever') && isRetrieverPickupId(kind) && plan.retrieverFilters.includes(kind);
}

export function assignPetDuties(plan: PetAssignmentPlan, primary: PetDutyId | null, backup: PetDutyId | null): PetAssignmentPlan {
  return { ...plan, primary, backup: backup === primary ? null : backup, retrieverFilters: [...plan.retrieverFilters] };
}

export function setRetrieverPickupAllowed(plan: PetAssignmentPlan, kind: RetrieverPickupId, allowed: boolean): PetAssignmentPlan {
  const retrieverFilters = new Set(plan.retrieverFilters);
  if (allowed) retrieverFilters.add(kind); else retrieverFilters.delete(kind);
  return { ...plan, retrieverFilters: [...retrieverFilters] };
}
