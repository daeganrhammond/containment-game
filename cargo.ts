import type { OverflowJob, PowerKind, Run } from './mechanics';
import { cargoHelperForRun, foundryDurationWithCargoHelper } from './pets';

export type CargoItemId = 'life' | 'speed' | 'ram' | 'charge' | 'credit' | 'power-bar' | 'merchant-token' | 'engi-pod' | 'mount-assembly';
export type CargoBalances = Record<CargoItemId, number>;
export type CargoStackBonuses = Partial<Record<'speed' | 'ram' | 'charge', number>>;
export type CargoShape = { cells: number[] };
export type CargoShapes = Partial<Record<CargoItemId, CargoShape>>;
export type CargoMinimumKeep = Partial<Record<'life' | 'speed' | 'ram' | 'charge', number>>;
export type CargoStack = { id: string; itemId: CargoItemId; quantity: number; x: number; y: number; width: number; height: number; cells: number[]; rotation: 0 | 90 };
export type CargoLayout = { version: 1; placements: { id: string; itemId: string; x: number; y: number; rotation?: 0 | 90 }[] };
export type CargoRefiningMode = 'overflow' | 'manual';

export type CargoItemDefinition = {
  id: CargoItemId;
  name: string;
  shortName: string;
  shape: { width: number; height: number };
  stackLimit: number;
  glyph: string;
  tint: string;
  /** Visual breakup family used by the physical foundry when refining this item. */
  refinerAnimation?: 'dissolve' | 'arc' | 'shatter';
  powerKind?: PowerKind;
  /** Existing overflow recipe value. Missing means no conversion is defined yet. */
  refinerCreditsPerItem?: number;
  minKeep: number;
  protectedByDefault?: boolean;
};

/** Expand this catalog as real pickup/resource mechanics are added. */
export const CARGO_CATALOG: Record<CargoItemId, CargoItemDefinition> = {
  life: { id: 'life', name: 'Life Reserve', shortName: 'LIFE', shape: { width: 1, height: 1 }, stackLimit: 3, glyph: '♥', tint: '#ff718e', refinerAnimation: 'dissolve', powerKind: 'life', refinerCreditsPerItem: 5, minKeep: 1, protectedByDefault: true },
  speed: { id: 'speed', name: 'Speed Charge', shortName: 'SPEED', shape: { width: 1, height: 2 }, stackLimit: 3, glyph: 'ϟ', tint: '#82d8ff', refinerAnimation: 'arc', powerKind: 'speed', refinerCreditsPerItem: 5, minKeep: 0 },
  ram: { id: 'ram', name: 'RAM Charge', shortName: 'RAM', shape: { width: 2, height: 1 }, stackLimit: 3, glyph: '✹', tint: '#f3bf69', refinerAnimation: 'shatter', powerKind: 'ram', refinerCreditsPerItem: 5, minKeep: 0 },
  charge: { id: 'charge', name: 'Charge Cell', shortName: 'CHARGE', shape: { width: 1, height: 1 }, stackLimit: 3, glyph: '◈', tint: '#78e7d0', refinerAnimation: 'arc', powerKind: 'charge', refinerCreditsPerItem: 5, minKeep: 0 },
  credit: { id: 'credit', name: 'Credit Cache', shortName: 'CREDITS', shape: { width: 2, height: 1 }, stackLimit: 99, glyph: '¢', tint: '#f2d075', minKeep: 0 },
  'power-bar': { id: 'power-bar', name: 'Reactor Power Bar', shortName: 'POWER', shape: { width: 1, height: 2 }, stackLimit: 5, glyph: '▥', tint: '#b79aff', minKeep: 0 },
  'merchant-token': { id: 'merchant-token', name: 'Merchant Token', shortName: 'TOKEN', shape: { width: 1, height: 1 }, stackLimit: 1, glyph: '✥', tint: '#f5a66e', minKeep: 0 },
  'engi-pod': { id: 'engi-pod', name: 'Engi Pod', shortName: 'ENGI POD', shape: { width: 2, height: 2 }, stackLimit: 2, glyph: '▣', tint: '#9cdaa2', minKeep: 0 },
  'mount-assembly': { id: 'mount-assembly', name: 'Sentry Mount Assembly', shortName: 'MOUNT', shape: { width: 2, height: 2 }, stackLimit: 1, glyph: '⚙', tint: '#f2b66d', minKeep: 0, protectedByDefault: true },
};

export const DEFAULT_CARGO_GRID = { columns: 10, rows: 8 } as const;

export function defaultCargoShape(itemId: CargoItemId): CargoShape {
  const { width, height } = CARGO_CATALOG[itemId].shape;
  return { cells: Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => y * 4 + x)).flat() };
}

export function normalizeCargoShape(shape: CargoShape | undefined, fallbackItem: CargoItemId): { width: number; height: number; cells: number[] } {
  const valid = [...new Set((shape?.cells ?? defaultCargoShape(fallbackItem).cells).filter(cell => Number.isInteger(cell) && cell >= 0 && cell < 16))];
  const source = valid.length ? valid : defaultCargoShape(fallbackItem).cells;
  const xs = source.map(cell => cell % 4), ys = source.map(cell => Math.floor(cell / 4));
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const width = maxX - minX + 1, height = maxY - minY + 1;
  return { width, height, cells: source.map(cell => (Math.floor(cell / 4) - minY) * width + (cell % 4 - minX)) };
}

export function cargoBalancesFromRun(run: {
  lives: number; speedCharges: number; ramCharges: number; chargeCharges?: number;
  credits: number; powerBars: number; merchantTokens: number; petEggs: number; mountAssemblies?: number;
}): CargoBalances {
  return {
    life: Math.max(0, Math.floor(run.lives ?? 0)),
    speed: Math.max(0, Math.floor(run.speedCharges ?? 0)),
    ram: Math.max(0, Math.floor(run.ramCharges ?? 0)),
    charge: Math.max(0, Math.floor(run.chargeCharges ?? 0)),
    credit: Math.max(0, Math.floor(run.credits ?? 0)),
    'power-bar': Math.max(0, Math.floor(run.powerBars ?? 0)),
    'merchant-token': Math.max(0, Math.floor(run.merchantTokens ?? 0)),
    'engi-pod': Math.max(0, Math.floor(run.petEggs ?? 0)),
    'mount-assembly': Math.max(0, Math.floor(run.mountAssemblies ?? 0)),
  };
}

/** Stable first-fit packing; unplaced stacks are reported, never hidden or discarded. */
export function packCargo(balances: CargoBalances, grid = DEFAULT_CARGO_GRID, layout?: CargoLayout, stackBonuses: CargoStackBonuses = {}, shapes: CargoShapes = {}) {
  const occupied = Array.from({ length: grid.rows }, () => Array<boolean>(grid.columns).fill(false));
  const stacks: CargoStack[] = [];
  const unplaced: CargoStack[] = [];
  const ids = Object.keys(CARGO_CATALOG) as CargoItemId[];
  const fits = (x: number, y: number, width: number, height: number, cells: number[]) => {
    if (x < 0 || y < 0 || x + width > grid.columns || y + height > grid.rows) return false;
    for (const cell of cells) if (occupied[y + Math.floor(cell / width)][x + cell % width]) return false;
    return true;
  };
  const pending: Omit<CargoStack, 'x' | 'y'>[] = [];
  for (const itemId of ids) {
    const definition = CARGO_CATALOG[itemId];
    let remaining = Math.max(0, Math.floor(balances[itemId] ?? 0));
    let stackIndex = 0;
    while (remaining > 0) {
      const quantity = Math.min(remaining, definition.stackLimit + Math.max(0, Math.floor(stackBonuses[itemId as keyof CargoStackBonuses] ?? 0)));
      const shape = normalizeCargoShape(shapes[itemId], itemId);
      const base = { id: `${itemId}-${stackIndex}`, itemId, quantity, ...shape, rotation: 0 as const };
      pending.push(base);
      remaining -= quantity;
      stackIndex++;
    }
  }
  const layoutById = new Map((layout?.placements ?? []).map(placement => [placement.id, placement]));
  const place = (stack: Omit<CargoStack, 'x' | 'y'>, position: { x: number; y: number }) => {
    for (const cell of stack.cells) occupied[position.y + Math.floor(cell / stack.width)][position.x + cell % stack.width] = true;
    stacks.push({ ...stack, ...position });
  };
  for (const stack of pending) {
    const saved = layoutById.get(stack.id);
      const rotation = saved?.rotation === 90 ? 90 : 0;
      const width = rotation === 90 ? stack.height : stack.width;
      const height = rotation === 90 ? stack.width : stack.height;
      const cells = rotation === 90 ? stack.cells.map(cell => (cell % stack.width) * width + (stack.height - 1 - Math.floor(cell / stack.width))) : stack.cells;
      if (saved && saved.itemId === stack.itemId && fits(saved.x, saved.y, width, height, cells)) place({ ...stack, width, height, cells, rotation }, saved);
  }
  for (const stack of pending) {
    if (stacks.some(placed => placed.id === stack.id)) continue;
    let position: { x: number; y: number } | undefined;
    for (let y = 0; y < grid.rows && !position; y++) for (let x = 0; x < grid.columns && !position; x++) if (fits(x, y, stack.width, stack.height, stack.cells)) position = { x, y };
    if (!position) unplaced.push({ ...stack, x: -1, y: -1 });
    else place({ ...stack, rotation: 0 }, position);
  }
  return { stacks, unplaced, usedCells: occupied.flat().filter(Boolean).length, totalCells: grid.columns * grid.rows, grid };
}

/** True when one more unit can be packed without displacing existing cargo. */
export function canFitCargoItem(balances: CargoBalances, itemId: CargoItemId, layout?: CargoLayout, stackBonuses?: CargoStackBonuses, shapes?: CargoShapes) {
  const projected = { ...balances, [itemId]: Math.max(0, Math.floor(balances[itemId] ?? 0)) + 1 };
  return packCargo(projected, DEFAULT_CARGO_GRID, layout, stackBonuses, shapes).unplaced.length === 0;
}

function occupiedShape(stack: CargoStack, x: number, y: number) {
  return new Set(stack.cells.map(cell => `${x + cell % stack.width},${y + Math.floor(cell / stack.width)}`));
}

/** Move one stack by grid cells if the destination remains in-bounds and collision-free. */
export function moveCargoStack(layout: CargoLayout | undefined, stacks: CargoStack[], stackId: string, dx: number, dy: number, grid = DEFAULT_CARGO_GRID): CargoLayout | undefined {
  const selected = stacks.find(stack => stack.id === stackId);
  if (!selected) return layout;
  const x = selected.x + Math.trunc(dx), y = selected.y + Math.trunc(dy);
  if (x < 0 || y < 0 || x + selected.width > grid.columns || y + selected.height > grid.rows) return layout;
  const target = occupiedShape(selected, x, y);
  const overlaps = stacks.some(stack => stack.id !== stackId && [...occupiedShape(stack, stack.x, stack.y)].some(cell => target.has(cell)));
  if (overlaps) return layout;
  const placements = stacks.map(stack => ({ id: stack.id, itemId: stack.itemId, x: stack.id === stackId ? x : stack.x, y: stack.id === stackId ? y : stack.y, rotation: stack.rotation }));
  return { version: 1, placements };
}

/** Rotate a selected footprint 90 degrees in place when the new shape fits. */
export function rotateCargoStack(layout: CargoLayout | undefined, stacks: CargoStack[], stackId: string, grid = DEFAULT_CARGO_GRID): CargoLayout | undefined {
  const selected = stacks.find(stack => stack.id === stackId);
  if (!selected) return layout;
  const width = selected.height, height = selected.width;
  const cells = selected.cells.map(cell => (cell % selected.width) * width + (selected.height - 1 - Math.floor(cell / selected.width)));
  if (selected.x + width > grid.columns || selected.y + height > grid.rows) return layout;
  const rotated = { ...selected, width, height, cells };
  const target = occupiedShape(rotated, selected.x, selected.y);
  const overlaps = stacks.some(stack => stack.id !== stackId && [...occupiedShape(stack, stack.x, stack.y)].some(cell => target.has(cell)));
  if (overlaps) return layout;
  const placements = stacks.map(stack => ({ id: stack.id, itemId: stack.itemId, x: stack.x, y: stack.y, rotation: stack.id === stackId ? (stack.rotation === 90 ? 0 : 90) as 0 | 90 : stack.rotation }));
  return { version: 1, placements };
}

export function isRefinable(itemId: CargoItemId, recipeValues: Partial<Record<PowerKind, number>> = {}) {
  const kind = CARGO_CATALOG[itemId].powerKind;
  return !!kind && Math.max(0, recipeValues[kind] ?? CARGO_CATALOG[itemId].refinerCreditsPerItem ?? 0) > 0;
}

/** Queue chosen cargo without changing the existing automatic overflow path. */
export function enqueueManualRefining(run: Run, itemId: CargoItemId, requested: number): Run {
  const definition = CARGO_CATALOG[itemId];
  const kind = definition.powerKind;
  if (!kind || !isRefinable(itemId, run.mechanics.overflowCreditValues)) return run;
  const refineKey = itemId === 'life' || itemId === 'speed' || itemId === 'ram' || itemId === 'charge' ? itemId : undefined;
  if (!refineKey) return run;
  const balance = cargoBalancesFromRun(run)[itemId];
  const alreadyReserved = (run.overflowJobs ?? []).filter(job => job.source === 'manual' && job.holdsCargo && job.kind === kind).length;
  const keep = Math.max(0, Math.floor(run.cargoMinimumKeep?.[refineKey] ?? definition.minKeep));
  const available = Math.max(0, balance - keep - alreadyReserved);
  const quantity = Math.min(available, Math.max(0, Math.floor(requested)), 20 - (run.overflowJobs ?? []).length);
  if (!quantity) return run;

  const creditsPerItem = Math.max(0, Math.floor(run.mechanics.overflowCreditValues[kind] ?? definition.refinerCreditsPerItem ?? 0));
  const cargoHelper = cargoHelperForRun(run.pets ?? [], run.progression?.petAssignments);
  const durationMs = foundryDurationWithCargoHelper(run.mechanics.overflowProcessingMs, cargoHelper);
  const jobs: OverflowJob[] = Array.from({ length: quantity }, (_, index) => ({
    id: run.nextId + index,
    kind,
    credits: creditsPerItem,
    remainingMs: durationMs,
    durationMs,
    sourceX: run.boardWidth / 2,
    sourceY: run.boardHeight / 2,
    source: 'manual',
    holdsCargo: true,
    ...(cargoHelper ? { cargoHelperPetId: cargoHelper.petId } : {}),
  }));
  const balanceField = refineKey === 'life' ? 'lives' : refineKey === 'speed' ? 'speedCharges' : refineKey === 'ram' ? 'ramCharges' : refineKey === 'charge' ? 'chargeCharges' : undefined;
  if (!balanceField) return run;
  return {
    ...run,
    overflowJobs: [...(run.overflowJobs ?? []), ...jobs],
    nextId: run.nextId + quantity,
  };
}

/** Remove a queued job. Held manual cargo unlocks; overflow and legacy manual items return to stores. */
export function cancelFoundryJob(run: Run, jobId: number): Run {
  const job = (run.overflowJobs ?? []).find(candidate => candidate.id === jobId);
  if (!job) return run;
  const overflowJobs = run.overflowJobs.filter(candidate => candidate.id !== jobId);
  if (job.source === 'manual' && job.holdsCargo) return { ...run, overflowJobs };
  if (job.kind === 'life') return { ...run, overflowJobs, lives: run.lives + 1 };
  if (job.kind === 'speed') return { ...run, overflowJobs, speedCharges: run.speedCharges + 1 };
  if (job.kind === 'ram') return { ...run, overflowJobs, ramCharges: run.ramCharges + 1 };
  if (job.kind === 'charge') return { ...run, overflowJobs, chargeCharges: (run.chargeCharges ?? 0) + 1 };
  return { ...run, overflowJobs };
}
