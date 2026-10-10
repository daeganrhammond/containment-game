export type SectorType = 'Civilian' | 'Hostile' | 'Nebula' | 'Derelict';
export type BeaconEventKind = 'safe' | 'picture' | 'store' | 'repair' | 'civilian' | 'hostile' | 'nebula' | 'derelict' | 'jackpot' | 'waldo' | 'engi' | 'drift-swarm' | 'elimination';
export type BeaconResourceKind = 'life' | 'speed' | 'ram' | 'charge';
export type BeaconUpgradeKind = 'smelter-speed' | 'life-capacity' | 'speed-capacity' | 'ram-capacity' | 'charge-capacity';
export type BeaconEffect = {
  id: string;
  label: string;
  description: string;
  kind: 'boon' | 'hazard' | 'intel';
  ballCountDelta?: number;
  ballSpeedPercent?: number;
  pickupRatePercent?: number;
  creditsDelta?: number;
  livesDelta?: number;
  pictureVistaId?: string;
  compensation?: { kind: 'credits' | 'score'; amount: number };
  engiPodReward?: number;
  engiSpawnWeightMultiplier?: number;
  levelEvent?: 'elimination' | 'drift-swarm';
  resourceReward?: { kind: BeaconResourceKind; amount: number };
  upgradeReward?: BeaconUpgradeKind;
  scanChargeReward?: number;
};
export type SectorBeacon = {
  id: string;
  name: string;
  depth: number;
  x: number;
  y: number;
  links: string[];
  visited: boolean;
  expanded: boolean;
  revealed: boolean;
  start?: boolean;
  exit?: boolean;
  event: { kind: BeaconEventKind; title: string; description: string; hidden: boolean; passage?: string; markerLabel?: string };
  effects: BeaconEffect[];
  vistaId?: string;
  riskRating?: number;
  salvageRating?: number;
};
export type SectorState = {
  seed: number;
  type: SectorType;
  typeHistory: SectorType[];
  depth: number;
  targetLength: number;
  currentBeaconId: string;
  visitedBeaconIds: string[];
  beacons: SectorBeacon[];
  jumpsSinceStore: number;
  jumpsSinceRepair: number;
  hasSeenStore: boolean;
  hasSeenRepair: boolean;
  scanCount: number;
  lastScannedBeaconId?: string;
};

export type SectorRouteBeacon = Pick<SectorBeacon, 'id' | 'x' | 'y' | 'depth' | 'start' | 'exit'> & { visited: boolean };
export type SectorRouteRecord = { id: string; depth: number; type: SectorType; targetLength: number; beacons: SectorRouteBeacon[]; pathBeaconIds: string[] };

/** Compact, save-friendly snapshot of one sector's explored map and actual jump sequence. */
export function archiveSectorRoute(sector: SectorState): SectorRouteRecord {
  return {
    id: `sector-${sector.depth}-${sector.seed}`,
    depth: sector.depth,
    type: sector.type,
    targetLength: sector.targetLength,
    beacons: sector.beacons.map(({ id, x, y, depth, start, exit, visited }) => ({ id, x, y, depth, start, exit, visited: !!visited })),
    pathBeaconIds: [...sector.visitedBeaconIds],
  };
}

/** All map, event, depth, and future fuel tuning lives here. Fuel stays disabled for now. */
export const SECTOR_MAP_CONFIG = {
  maxScanCharges: 3,
  width: 1000, height: 620, marginX: 58, marginY: 56,
  minimumJumpDistance: 78, maximumJumpDistance: 450, minimumBeaconSpacing: 62,
  horizontalJitter: 36, mergeRadius: 120, mergeChance: 0.24, placementAttempts: 20,
  maximumBeaconsPerDepth: 5, maximumBeaconsPerSector: 64,
  childCountWeights: [15, 55, 30] as const,
  targetLength: (depth: number, bonus: number) => Math.max(6, Math.min(12, 6 + Math.floor(depth / 2) + bonus)),
  pityWeightIncrement: 0.15, pityGuaranteeJumpsBeforeExit: 2,
  mapOpenSingleClickJump: false,
  fuelEnabled: false, fuelCostPerJump: 1,
  sectorChoiceCount: [2, 3] as const,
  sectorTypes: {
    Civilian: { description: 'Trade lanes, repair docks, and guarded routes.', difficulty: 1, reward: 3, color: '#62dfc4' },
    Hostile: { description: 'Patrols, contested lanes, and high value salvage.', difficulty: 3, reward: 3, color: '#ee777d' },
    Nebula: { description: 'Sensor noise, strange currents, and rare discoveries.', difficulty: 2, reward: 4, color: '#b79aff' },
    Derelict: { description: 'Abandoned infrastructure with uncertain rewards.', difficulty: 2, reward: 4, color: '#e4b76d' },
  } satisfies Record<SectorType, { description: string; difficulty: number; reward: number; color: string }>,
  eventWeights: {
    Civilian: { civilian: 24, store: 15, repair: 13, picture: 11, hostile: 8, nebula: 7, derelict: 7, jackpot: 3, waldo: 2, engi: 2, 'drift-swarm': 2, elimination: 6 },
    Hostile: { hostile: 28, derelict: 13, repair: 8, store: 7, picture: 8, nebula: 7, civilian: 7, jackpot: 4, waldo: 4, engi: 2, 'drift-swarm': 4, elimination: 8 },
    Nebula: { nebula: 26, picture: 16, derelict: 10, repair: 9, store: 7, hostile: 7, civilian: 7, jackpot: 3, waldo: 2, engi: 2, 'drift-swarm': 3, elimination: 8 },
    Derelict: { derelict: 25, store: 11, repair: 11, picture: 10, hostile: 8, nebula: 7, civilian: 6, jackpot: 4, waldo: 3, engi: 3, 'drift-swarm': 3, elimination: 9 },
  } satisfies Record<SectorType, Partial<Record<BeaconEventKind, number>>>,
} as const;

export const SECTOR_VISUALS: Record<SectorType, { accent: string; route: string; tint: string; glyph: string; mood: string }> = {
  Civilian: { accent: '#67dfc4', route: '#76efb6', tint: 'rgba(16,78,72,0.17)', glyph: '✧', mood: 'TRADE LANES · OPEN COMMS' },
  Hostile: { accent: '#f08083', route: '#ffa06f', tint: 'rgba(95,24,34,0.2)', glyph: '⚠', mood: 'CONTESTED SPACE · ACTIVE CONTACT' },
  Nebula: { accent: '#b7a0ff', route: '#a5d5ff', tint: 'rgba(63,35,120,0.2)', glyph: '◌', mood: 'IONIZED CLOUD · SENSOR NOISE' },
  Derelict: { accent: '#e0b878', route: '#e9d28a', tint: 'rgba(112,73,32,0.19)', glyph: '▧', mood: 'ABANDONED STRUCTURES · SALVAGE' },
};

const EVENT_COPY: Record<BeaconEventKind, { title: string; description: string; hidden: boolean }> = {
  safe: { title: 'Clear Approach', description: 'A quiet entry lane. No known contact.', hidden: false },
  picture: { title: 'Picture Event', description: 'A new scene is recorded in this sector.', hidden: false },
  store: { title: 'Trade Relay', description: 'A supply stop may offer useful services.', hidden: false },
  repair: { title: 'Recovery Point', description: 'A calm station offers a chance to regroup.', hidden: false },
  civilian: { title: 'Civilian Traffic', description: 'Local traffic may offer aid or complicate navigation.', hidden: false },
  hostile: { title: 'Hostile Contact', description: 'An active patrol is reported in this area.', hidden: false },
  nebula: { title: 'Nebula Front', description: 'Sensor conditions and movement may be altered.', hidden: false },
  derelict: { title: 'Derelict Site', description: 'An abandoned structure holds uncertain salvage.', hidden: false },
  jackpot: { title: 'Unknown Signal', description: 'Unidentified beacon signal.', hidden: true },
  waldo: { title: 'Unknown Signal', description: 'Unidentified beacon signal.', hidden: true },
  engi: { title: 'Engi Wreckage', description: 'A damaged Engi service pod is broadcasting a low-power distress pulse.', hidden: false },
  'drift-swarm': { title: 'Drift Swarm', description: 'A dense field of drifting bodies is converging on the route.', hidden: false },
  elimination: { title: 'Elimination Zone', description: 'Hostile units are trapped inside a sealed engagement field. Clear every target to secure the route.', hidden: false },
};
const EVENT_RISK: Record<BeaconEventKind, number> = { safe: 0, picture: 1, store: 0, repair: 0, civilian: 1, hostile: 3, nebula: 2, derelict: 2, jackpot: 2, waldo: 2, engi: 1, 'drift-swarm': 4, elimination: 4 };

const PICTURE_PASSAGES: Record<string, string> = {
  'amber-ringworld': 'A broad amber ring catches the system’s dying light. Dust trapped along its orbit has turned the old transit lane into a slow, glowing current.',
  'violet-giant': 'A violet gas giant fills the scopes, its storm bands folded into deep, luminous spirals. Charged upper-atmosphere winds are pulling nearby traffic off course.',
  'emerald-ocean': 'Green water clouds wrap a world with no visible coast. The planet’s magnetic field is unusually calm, leaving a quiet pocket in an otherwise noisy system.',
  'ancient-megastructure': 'A structure wider than the local moon crosses the starfield in deliberate geometric arcs. Its failing power grid still sends a faint signal through the debris.',
  'eclipse-over-fire': 'A dark companion cuts across a red sun, revealing a corona of burning plasma. The eclipse is brief, but its charged wake is disturbing local navigation.',
  'star-nursery': 'New stars burn through a cloud of blue and rose dust. Their radiation is stirring the nebula into bright, turbulent folds.',
  'broken-halo': 'Fragments of a shattered ring drift in a precise orbital arc. Their orderly path suggests the halo broke recently, before its pieces could scatter.',
  'wandering-world': 'A lone planet crosses the system without a parent star. A thin atmosphere still glows from stored heat, making this dark route unexpectedly visible.',
  'glass-sea': 'A crystalline plain reflects the nearby star like a frozen ocean. Fine shards hang above the surface, where a recent impact has disturbed the local field.',
  'red-dwarf-shadow': 'A small red star lights only one edge of the nearby world. The long shadow hides a sheltered orbit where its sparse traffic has gathered.',
  'great-storm': 'A vast storm turns through the planet’s cloud deck, traced by a pale electric rim. Its charged outer bands are scrambling instruments across the approach.',
  'pilgrim-fleet': 'A chain of old vessels follows the same patient course through the dark. Their lights mark a safe corridor maintained by generations of passing crews.',
  'gravity-well': 'Stars bend around an unseen mass at the center of the field. Nearby wreckage has been drawn into a slow spiral, exposing a narrow and unstable route.',
  'hanging-gardens': 'Living terraces cling to the shadowed side of an orbital habitat. Their lamps remain lit, sustained by a small ecosystem that outlasted its builders.',
  'silent-wreck': 'A ship hull turns without lights or transponder. Its broken drive leaks a faint signal into the dark, drawing scavengers toward the wreck.',
  'far-lanterns': 'Scattered lights hold steady across the distant dark, each one a station or vessel too far away to hail. Their old beacon pattern still guides ships through this quiet reach.',
};

function passageFor(seed: number, kind: BeaconEventKind, title: string, effects: BeaconEffect[], vistaId?: string, vistaName?: string) {
  const random = randomFor(seed, `passage:${kind}:${vistaId ?? ''}`);
  const impacts = effects.filter(effect => effect.kind !== 'intel' || !effect.pictureVistaId);
  const whyFor = (impact: BeaconEffect) => impact.kind === 'hazard'
    ? `The ${impact.label.toLowerCase()} comes from these local conditions: ${impact.description.toLowerCase()}`
    : impact.kind === 'boon'
      ? `Local conditions provide an advantage: ${impact.description.toLowerCase()}`
      : impact.description;
  if (kind === 'picture') {
    const imageText = PICTURE_PASSAGES[vistaId ?? ''] ?? `${vistaName ?? title} appears in the scopes as a striking landmark, its unusual light drawing the few ships in this region into a loose orbit.`;
    return [imageText, ...impacts.map(whyFor)].join(' ');
  }
  const stories: Record<BeaconEventKind, string[]> = {
    safe: ['A quiet lane runs between the busier routes. Its distance from major traffic keeps the approach predictable.', 'No active signal crosses this stretch of space; only the steady markers of the old route remain.'],
    picture: [],
    store: ['The relay sits where two trade paths meet, its service lights kept alive by passing freighters. A steady flow of traffic explains the useful stores and clean approach.', 'A compact market station has grown around a refueling beacon. Crews leave supplies here in exchange for safe passage through the sector.'],
    repair: ['A recovery platform circles a sheltered moon, protected from the main traffic lanes. Its crews built the station here because damaged ships can dock without fighting the current.', 'The beacon belongs to an old maintenance dock tucked behind a field of rock. The debris that hides it also keeps the station’s repair crews safe.'],
    civilian: ['A convoy has paused along a well-charted lane, keeping its transponders open. Local pilots know the route well and are willing to share what they have seen.', 'The route passes a cluster of family haulers and small transports. Their slow, orderly traffic makes the region unusually easy to read.'],
    hostile: ['Patrol craft are holding the narrow approach, using the nearby wrecks as cover. Their formation makes the route dangerous but leaves their intentions obvious.', 'A contested lane cuts through the sector here. Fresh engine marks show that a patrol has reinforced the route and is watching for newcomers.'],
    nebula: ['Charged dust has thickened around this beacon, scattering sensor returns. The same interference that hides the route is pushing local movement into unpredictable currents.', 'The beacon is embedded in a bright nebula front where magnetic turbulence bends ordinary trajectories. Its strange calm and sudden surges come from the shifting cloud.'],
    derelict: ['An abandoned installation drifts beside the route, its outer lights failing one by one. The structure’s old power system still attracts salvage crews and stray energy.', 'A silent hull field marks a site where several vessels were left behind. Their damaged drives continue to distort the approach and scatter useful salvage.'],
    jackpot: ['A sealed cache is hidden behind an unregistered signal. Its improbable survival suggests someone went to great lengths to keep this place off the charts.'],
    waldo: ['A string of tiny course corrections appears between larger ship tracks. Something small and clever has been crossing this route unseen, while nearby crews report finding abandoned Engi equipment.'],
    engi: ['A compact Engi service pod is caught in the wreckage, still repeating a patient distress code. Its emergency cradle survived because the larger ship broke apart around it.'],
    'drift-swarm': ['Dozens of drifting bodies have collected in a slow-moving stream. Their shared trajectory comes from a recent breakup, and the field is now pulling every loose object toward the route.'],
    elimination: ['A damaged defense grid has locked its remaining targets into this pocket of space. Its tracking system will not stand down until every hostile signal is gone.'],
  };
  let story = stories[kind][Math.floor(random() * Math.max(1, stories[kind].length))] ?? `${title} marks a distinct location along this sector’s route.`;
  if (impacts.length) story += ` ${impacts.map(whyFor).join(' ')}`;
  return story;
}

const EFFECT_POOL: Omit<BeaconEffect, 'id'>[] = [
  { label: 'Quiet Approach', description: 'One fewer hostile ball enters the stage.', kind: 'boon', ballCountDelta: -1 },
  { label: 'Reinforced Patrol', description: 'One additional hostile ball enters the stage.', kind: 'hazard', ballCountDelta: 1 },
  { label: 'Calm Current', description: 'Ball movement is 10% slower.', kind: 'boon', ballSpeedPercent: -10 },
  { label: 'Turbulent Current', description: 'Ball movement is 12% faster.', kind: 'hazard', ballSpeedPercent: 12 },
  { label: 'Supply Drift', description: 'Pickups arrive about 15% more often.', kind: 'boon', pickupRatePercent: 15 },
  { label: 'Sparse Supplies', description: 'Pickups arrive about 12% less often.', kind: 'hazard', pickupRatePercent: -12 },
  { label: 'Long Range Scan', description: 'Unusual local activity is clearly detected.', kind: 'intel' },
];

// Keep one shared vocabulary for effects, but bias the rolls toward what crews
// would expect to find in each environment. This leaves room to add new event
// types without creating a separate, visually noisy UI for every type.
const EVENT_EFFECT_PREFERENCES: Partial<Record<BeaconEventKind, string[]>> = {
  store: ['Supply Drift', 'Calm Current', 'Quiet Approach'], repair: ['Quiet Approach', 'Calm Current', 'Long Range Scan'],
  civilian: ['Supply Drift', 'Quiet Approach', 'Calm Current'], hostile: ['Reinforced Patrol', 'Turbulent Current', 'Sparse Supplies'],
  nebula: ['Turbulent Current', 'Calm Current', 'Long Range Scan'], derelict: ['Sparse Supplies', 'Long Range Scan', 'Reinforced Patrol'],
  engi: ['Long Range Scan', 'Supply Drift', 'Calm Current'], waldo: ['Long Range Scan', 'Supply Drift'],
  'drift-swarm': ['Reinforced Patrol', 'Turbulent Current', 'Sparse Supplies'], elimination: ['Reinforced Patrol', 'Turbulent Current', 'Sparse Supplies'],
  jackpot: ['Supply Drift', 'Long Range Scan', 'Quiet Approach'], picture: ['Long Range Scan', 'Supply Drift', 'Calm Current'],
};

function hashSeed(seed: number, text: string) {
  let value = seed >>> 0;
  for (let index = 0; index < text.length; index++) value = Math.imul(value ^ text.charCodeAt(index), 16777619) >>> 0;
  return value || 1;
}
function randomFor(seed: number, text: string) {
  let state = hashSeed(seed, text);
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function pickWeighted<T extends string>(random: () => number, weights: Partial<Record<T, number>>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [key, weight] of entries) { roll -= weight; if (roll < 0) return key; }
  return entries[entries.length - 1][0];
}
function makeBeacon(seed: number, id: string, depth: number, x: number, y: number, sector: SectorType, pictureVistas: { id: string; name: string }[], flags: Partial<SectorBeacon> = {}, forcedKind?: BeaconEventKind, pity?: Pick<SectorState, 'jumpsSinceStore' | 'jumpsSinceRepair' | 'hasSeenStore' | 'hasSeenRepair'>): SectorBeacon {
  const random = randomFor(seed, id);
  const eventWeights = { ...SECTOR_MAP_CONFIG.eventWeights[sector] };
  const hazardScale = 1 + depth * 0.06, rewardScale = 1 + depth * 0.035;
  for (const key of ['hostile', 'nebula', 'derelict'] as const) eventWeights[key] = (eventWeights[key] ?? 0) * hazardScale;
  for (const key of ['picture', 'store', 'repair', 'jackpot', 'waldo'] as const) eventWeights[key] = (eventWeights[key] ?? 0) * rewardScale;
  if (pity && !pity.hasSeenStore) eventWeights.store = (eventWeights.store ?? 0) * (1 + pity.jumpsSinceStore * SECTOR_MAP_CONFIG.pityWeightIncrement);
  if (pity && !pity.hasSeenRepair) eventWeights.repair = (eventWeights.repair ?? 0) * (1 + pity.jumpsSinceRepair * SECTOR_MAP_CONFIG.pityWeightIncrement);
  const kind = forcedKind ?? pickWeighted<BeaconEventKind>(random, eventWeights);
  const event: { title: string; description: string; hidden: boolean; passage?: string; markerLabel?: string } = { ...EVENT_COPY[kind] };
  const effectPool = kind === 'picture' ? EFFECT_POOL.filter(effect => effect.kind !== 'intel') : EFFECT_POOL;
  const effects = Array.from({ length: kind === 'picture' ? 2 : random() < 0.5 ? 1 : 2 }, (_, index) => {
    const preferred = EVENT_EFFECT_PREFERENCES[kind]?.map(label => effectPool.find(effect => effect.label === label)).filter((effect): effect is Omit<BeaconEffect, 'id'> => !!effect) ?? [];
    const choices = preferred.length && random() < 0.68 ? preferred : effectPool;
    const effect = { ...choices[Math.floor(random() * choices.length)] };
    if (effect.ballCountDelta !== undefined) effect.ballCountDelta = effect.ballCountDelta < 0 ? (random() < 0.72 ? -1 : -2) : (random() < 0.2 ? 2 : 1);
    if (effect.ballSpeedPercent !== undefined) effect.ballSpeedPercent = effect.ballSpeedPercent < 0 ? -Math.round(6 + random() * 9) : Math.round(8 + random() * 13);
    if (effect.pickupRatePercent !== undefined) effect.pickupRatePercent = effect.pickupRatePercent < 0 ? -Math.round(7 + random() * 12) : Math.round(10 + random() * 16);
    if (effect.ballSpeedPercent !== undefined) effect.description = `Ball movement is ${Math.abs(effect.ballSpeedPercent)}% ${effect.ballSpeedPercent < 0 ? 'slower' : 'faster'}.`;
    if (effect.pickupRatePercent !== undefined) effect.description = `Pickups arrive about ${Math.abs(effect.pickupRatePercent)}% ${effect.pickupRatePercent < 0 ? 'less' : 'more'} often.`;
    if (effect.ballCountDelta !== undefined) effect.description = `${Math.abs(effect.ballCountDelta)} ${effect.ballCountDelta < 0 ? 'fewer' : 'additional'} hostile ball${Math.abs(effect.ballCountDelta) === 1 ? '' : 's'} enter the stage.`;
    const negativeImpact = effect.kind === 'hazard' || (effect.ballCountDelta ?? 0) > 0 || (effect.ballSpeedPercent ?? 0) > 0 || (effect.pickupRatePercent ?? 0) < 0 || (effect.creditsDelta ?? 0) < 0 || (effect.livesDelta ?? 0) < 0;
    if (negativeImpact) {
      const useCredits = random() < 0.55;
      const hazardPremium = 1 + EVENT_RISK[kind] * 0.11 + depth * 0.025;
      effect.compensation = { kind: useCredits ? 'credits' : 'score', amount: useCredits ? Math.round((8 + Math.floor(random() * 13)) * hazardPremium) : Math.round((40 + Math.floor(random() * 61)) * hazardPremium) };
    }
    return { ...effect, id: `${id}-effect-${index + 1}` };
  });
  let vistaId: string | undefined;
  if (kind === 'picture' && pictureVistas.length) {
    const vista = pictureVistas[Math.floor(random() * pictureVistas.length)];
    vistaId = vista.id;
    event.description = `Picture event: ${vista.name}. Clear this stage to unlock it.`;
    effects[0] = { id: `${id}-picture`, label: 'Picture Signal', description: `Discover ${vista.name} and add it to the vista library when this stage is cleared.`, kind: 'intel', pictureVistaId: vista.id };
  }
  if (kind === 'store') {
    const credits = 8 + Math.floor(random() * 18);
    effects[0] = { id: `${id}-supply-cache`, label: 'Supply Cache', description: `Gain ${credits} credits when you arrive.`, kind: 'boon', creditsDelta: credits };
  }
  if (kind === 'repair') effects[0] = { id: `${id}-repair`, label: 'Hull Recovery', description: 'Restore 1 life on arrival, up to your current life capacity.', kind: 'boon', livesDelta: 1 };
  if (kind === 'engi') effects[0] = { id: `${id}-engi-pod`, label: 'Engi Escape Pod', description: 'Recover one guaranteed Engi pod when you arrive.', kind: 'boon', engiPodReward: 1 };
  if (kind === 'waldo') effects[0] = { id: `${id}-engi-trace`, label: 'Engi Salvage Trace', description: 'Engi pod spawn weight is increased for this stage.', kind: 'boon', engiSpawnWeightMultiplier: 4 };
  if (kind === 'drift-swarm') { const rewardCredits = random() < 0.55; effects[0] = { id: `${id}-swarm`, label: 'Drift Swarm', description: 'The stage begins inside a dense, forceful drift swarm.', kind: 'hazard', levelEvent: 'drift-swarm', compensation: { kind: rewardCredits ? 'credits' : 'score', amount: rewardCredits ? 12 + Math.floor(random() * 14) : 50 + Math.floor(random() * 71) } }; }
  if (kind === 'elimination') { const rewardCredits = random() < 0.5; effects[0] = { id: `${id}-elimination`, label: 'Elimination Contract', description: 'Clear every hostile unit in the stage to claim the salvage contract.', kind: 'hazard', levelEvent: 'elimination', compensation: { kind: rewardCredits ? 'credits' : 'score', amount: rewardCredits ? 18 + Math.floor(random() * 18) : 80 + Math.floor(random() * 81) } }; }
  const rewardEffect = effects[kind === 'picture' ? 1 : 0];
  const eventHazardCount = effects.filter(effect => effect.kind === 'hazard').length;
  const resourceCacheChance = kind === 'drift-swarm' || kind === 'elimination' ? 1 : Math.min(0.84, 0.24 + (EVENT_RISK[kind] + eventHazardCount) * 0.11);
  if (rewardEffect && random() < resourceCacheChance) {
    const rewardKindsByEvent: Partial<Record<BeaconEventKind, readonly ('life' | 'speed' | 'ram' | 'charge')[]>> = {
      repair: ['life', 'life', 'charge'], civilian: ['life', 'speed', 'speed'], store: ['life', 'speed', 'ram', 'charge'],
      derelict: ['ram', 'charge', 'charge', 'speed'], engi: ['charge', 'charge', 'speed'], waldo: ['speed', 'charge', 'ram'],
      hostile: ['ram', 'charge', 'speed'], elimination: ['charge', 'ram', 'charge', 'speed'], 'drift-swarm': ['charge', 'ram', 'speed'],
      nebula: ['speed', 'charge', 'life', 'ram'], jackpot: ['life', 'speed', 'ram', 'charge'], picture: ['life', 'speed', 'ram', 'charge'],
    };
    const rewardKinds = rewardKindsByEvent[kind] ?? ['life', 'speed', 'ram', 'charge'];
    const rewardKind = rewardKinds[Math.floor(random() * rewardKinds.length)];
    const amount = rewardKind === 'life' ? 1 : 1 + Math.floor(random() * (kind === 'drift-swarm' || kind === 'elimination' ? 3 : 2));
    rewardEffect.resourceReward = { kind: rewardKind, amount };
    rewardEffect.description += ` Clear the stage to recover ${amount} ${rewardKind.toUpperCase()} pickup${amount === 1 ? '' : 's'}.`;
    const upgradeChance = kind === 'drift-swarm' || kind === 'elimination' ? 0.34 : ['derelict', 'repair', 'engi', 'jackpot', 'store', 'nebula', 'hostile'].includes(kind) ? 0.16 : 0;
    if (upgradeChance > 0 && random() < upgradeChance) {
      const upgradesByEvent: Partial<Record<BeaconEventKind, readonly ('smelter-speed' | 'life-capacity' | 'speed-capacity' | 'ram-capacity' | 'charge-capacity')[]>> = {
        repair: ['life-capacity', 'life-capacity', 'smelter-speed'], derelict: ['smelter-speed', 'charge-capacity', 'ram-capacity'],
        engi: ['charge-capacity', 'speed-capacity', 'smelter-speed'], store: ['speed-capacity', 'ram-capacity', 'charge-capacity'],
        nebula: ['speed-capacity', 'charge-capacity', 'life-capacity'], hostile: ['ram-capacity', 'charge-capacity', 'smelter-speed'],
        elimination: ['ram-capacity', 'charge-capacity', 'smelter-speed'], 'drift-swarm': ['speed-capacity', 'charge-capacity', 'smelter-speed'],
      };
      const upgrades = upgradesByEvent[kind] ?? ['smelter-speed', 'life-capacity', 'speed-capacity', 'ram-capacity', 'charge-capacity'];
      rewardEffect.upgradeReward = upgrades[Math.floor(random() * upgrades.length)];
    }
    const intelChance = ['nebula', 'derelict', 'waldo', 'engi'].includes(kind) ? 0.2 : 0.05;
    if (random() < intelChance) { rewardEffect.scanChargeReward = 1; rewardEffect.description += ' Clear the stage to recover 1 sensor scan charge.'; }
  }
  if (kind === 'picture' && vistaId) event.title = pictureVistas.find(vista => vista.id === vistaId)?.name ?? event.title;
  if (kind === 'waldo') { event.hidden = false; event.title = 'Waldo Trace'; event.description = 'An elusive signal crosses the route; clear this stage to investigate it.'; }
  if (kind === 'engi') event.title = 'Engi Wreckage';
  const markerLabels: Record<BeaconEventKind, string> = { safe: 'CLEAR', picture: (pictureVistas.find(vista => vista.id === vistaId)?.name ?? 'DISTRESS').replace(/^(the|a)\s+/i, '').toUpperCase(), store: 'STORE', repair: 'REPAIR', civilian: 'TRAFFIC', hostile: 'PATROL', nebula: 'NEBULA', derelict: 'WRECK', jackpot: 'UNKNOWN', waldo: 'WALDO TRACE', engi: 'ENGI WRECK', 'drift-swarm': 'DRIFT SWARM', elimination: 'ELIMINATION' };
  event.markerLabel = markerLabels[kind];
  event.passage = passageFor(seed, kind, event.title, effects, vistaId, pictureVistas.find(vista => vista.id === vistaId)?.name);
  const modifierRisk = effects.reduce((total, effect) => total + (effect.kind === 'hazard' ? 1 : 0) + Math.max(0, effect.ballCountDelta ?? 0) + (effect.ballSpeedPercent ?? 0) / 18 + Math.max(0, -(effect.pickupRatePercent ?? 0)) / 20, 0);
  const riskRating = Math.max(1, Math.min(5, Math.round(EVENT_RISK[kind] + modifierRisk)));
  const hasCache = effects.some(effect => effect.resourceReward || effect.creditsDelta || effect.engiPodReward || effect.upgradeReward);
  const hasUpgrade = effects.some(effect => effect.upgradeReward);
  const salvageRating = Math.max(1, Math.min(5, Math.max(Math.round(1 + riskRating * 0.58), hasCache ? 3 : 1) + (hasUpgrade ? 1 : 0)));
  return { id, name: flags.start ? 'Entry Beacon' : flags.exit ? 'Sector Exit' : event.title, depth, x, y, links: [], visited: false, expanded: false, revealed: false, event: { kind, ...event }, effects, vistaId, riskRating, salvageRating, ...flags };
}

export function createSector(depth: number, type: SectorType, pictureVistas: { id: string; name: string }[] = [], seed = Math.floor(Math.random() * 2_147_483_647), typeHistory: SectorType[] = []) {
  const targetLength = SECTOR_MAP_CONFIG.targetLength(depth, Math.floor(Math.random() * 3));
  const start = makeBeacon(seed, 'beacon-0-0', 0, 0.06, 0.5, type, pictureVistas, { start: true, visited: true, expanded: false, event: { ...EVENT_COPY.safe, kind: 'safe' } });
  start.effects = [];
  return { seed, type, typeHistory: [...typeHistory, type].slice(-2), depth, targetLength, currentBeaconId: start.id, visitedBeaconIds: [start.id], beacons: [start], jumpsSinceStore: 0, jumpsSinceRepair: 0, hasSeenStore: false, hasSeenRepair: false, scanCount: 0 } satisfies SectorState;
}

function segmentsCross(a: SectorBeacon, b: { x: number; y: number }, c: SectorBeacon, d: SectorBeacon) {
  const orient = (p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }) => (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  return orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0;
}

export function expandBeacon(sector: SectorState, beaconId: string, pictureVistas: { id: string; name: string }[] = []): SectorState {
  const source = sector.beacons.find(beacon => beacon.id === beaconId);
  if (!source || source.expanded) return sector;
  const beacons = sector.beacons.map(beacon => beacon.id === beaconId ? { ...beacon, expanded: true } : beacon);
  const current = beacons.find(beacon => beacon.id === beaconId)!;
  if (current.depth >= sector.targetLength) return { ...sector, beacons };
  const random = randomFor(sector.seed, current.id);
  if (current.depth + 1 >= sector.targetLength) {
    let exit = beacons.find(beacon => beacon.exit);
    if (!exit) {
      exit = makeBeacon(sector.seed, 'beacon-exit', sector.targetLength, 0.94, 0.5 + (random() - 0.5) * 0.18, sector.type, pictureVistas, { exit: true, event: { ...EVENT_COPY.safe, title: 'Sector Gate', description: 'The route out of this sector.', kind: 'safe' } });
      beacons.push(exit);
    }
    current.links = [...new Set([...current.links, exit.id])];
    exit.links = [...new Set([...exit.links, current.id])];
    return { ...sector, beacons };
  }

  const roll = random() * 100, weights = SECTOR_MAP_CONFIG.childCountWeights;
  const count = roll < weights[0] ? 1 : roll < weights[0] + weights[1] ? 2 : 3;
  const xBase = 0.06 + (current.depth + 1) / sector.targetLength * 0.88;
  for (let choice = 0; choice < count; choice++) {
    const pityWindow = current.depth + 1 >= sector.targetLength - SECTOR_MAP_CONFIG.pityGuaranteeJumpsBeforeExit;
    const sameDepth = beacons.filter(beacon => !beacon.start && !beacon.exit && !beacon.visited && beacon.depth === current.depth + 1);
    const layerFull = sameDepth.length >= SECTOR_MAP_CONFIG.maximumBeaconsPerDepth || beacons.length >= SECTOR_MAP_CONFIG.maximumBeaconsPerSector;
    const canMerge = layerFull || (!pityWindow && random() < SECTOR_MAP_CONFIG.mergeChance);
    let target = canMerge ? sameDepth.filter(beacon => Math.hypot((beacon.x - current.x) * SECTOR_MAP_CONFIG.width, (beacon.y - current.y) * SECTOR_MAP_CONFIG.height) <= SECTOR_MAP_CONFIG.mergeRadius).sort((a, b) => Math.hypot((a.x - current.x) * 1000, (a.y - current.y) * 620) - Math.hypot((b.x - current.x) * 1000, (b.y - current.y) * 620))[0] ?? (layerFull ? sameDepth[choice % Math.max(1, sameDepth.length)] : undefined) : undefined;
    if (!target && layerFull && sameDepth.length) target = sameDepth[0];
    if (!target && !layerFull) {
      let x = xBase, y = 0.5;
      for (let attempt = 0; attempt < SECTOR_MAP_CONFIG.placementAttempts; attempt++) {
        const candidateX = Math.max(0.07, Math.min(0.91, xBase + (random() - 0.5) * SECTOR_MAP_CONFIG.horizontalJitter / SECTOR_MAP_CONFIG.width));
        const candidateY = SECTOR_MAP_CONFIG.marginY / SECTOR_MAP_CONFIG.height + random() * (1 - 2 * SECTOR_MAP_CONFIG.marginY / SECTOR_MAP_CONFIG.height);
        const jumpDistance = Math.hypot((candidateX - current.x) * SECTOR_MAP_CONFIG.width, (candidateY - current.y) * SECTOR_MAP_CONFIG.height);
        if (jumpDistance < SECTOR_MAP_CONFIG.minimumJumpDistance || jumpDistance > SECTOR_MAP_CONFIG.maximumJumpDistance) continue;
        const spaced = beacons.every(beacon => Math.hypot((beacon.x - candidateX) * 1000, (beacon.y - candidateY) * 620) >= SECTOR_MAP_CONFIG.minimumBeaconSpacing);
        const clear = beacons.every(beacon => !beacon.links.some(link => { const other = beacons.find(node => node.id === link); return other && segmentsCross(current, { x: candidateX, y: candidateY }, beacon, other); }));
        if (spaced && clear) { x = candidateX; y = candidateY; break; }
        if (attempt === SECTOR_MAP_CONFIG.placementAttempts - 1) {
          const fallbackYDelta = Math.sqrt(Math.max(0, SECTOR_MAP_CONFIG.minimumJumpDistance ** 2 - ((xBase - current.x) * SECTOR_MAP_CONFIG.width) ** 2));
          x = xBase;
          y = Math.max(SECTOR_MAP_CONFIG.marginY / SECTOR_MAP_CONFIG.height, Math.min(1 - SECTOR_MAP_CONFIG.marginY / SECTOR_MAP_CONFIG.height, current.y + (random() < 0.5 ? -1 : 1) * fallbackYDelta / SECTOR_MAP_CONFIG.height));
        }
      }
      const id = `beacon-${current.depth + 1}-${hashSeed(sector.seed, `${current.id}:${choice}`).toString(36)}`;
      const forceStore = pityWindow && !sector.hasSeenStore && choice === 0 ? 'store' : undefined;
      const forceRepair = pityWindow && !sector.hasSeenRepair && choice === 1 ? 'repair' : undefined;
      target = makeBeacon(sector.seed, id, current.depth + 1, x, y, sector.type, pictureVistas, {}, forceStore ?? forceRepair, sector);
      beacons.push(target);
    }
    if (!target) continue;
    current.links = [...new Set([...current.links, target.id])];
    target.links = [...new Set([...target.links, current.id])];
  }
  if (!current.links.some(id => (beacons.find(node => node.id === id)?.depth ?? -1) > current.depth)) {
    const existingChild = beacons.find(beacon => !beacon.exit && beacon.depth === current.depth + 1);
    if (existingChild) { current.links.push(existingChild.id); existingChild.links.push(current.id); return { ...sector, beacons }; }
    const id = `beacon-${current.depth + 1}-${hashSeed(sector.seed, `${current.id}:safety`).toString(36)}`;
    const fallback = makeBeacon(sector.seed, id, current.depth + 1, xBase, Math.max(0.12, Math.min(0.88, current.y + (random() - 0.5) * 0.2)), sector.type, pictureVistas, {}, undefined, sector);
    beacons.push(fallback); current.links.push(fallback.id); fallback.links.push(current.id);
  }
  return { ...sector, beacons };
}

export function openSectorMap(sector: SectorState, pictureVistas: { id: string; name: string }[] = []) {
  const expanded = expandEntireSector(expandBeacon(sector, sector.currentBeaconId, pictureVistas), pictureVistas);
  const markerLabels: Record<BeaconEventKind, string> = { safe: 'CLEAR', picture: 'DISTRESS', store: 'STORE', repair: 'REPAIR', civilian: 'TRAFFIC', hostile: 'PATROL', nebula: 'NEBULA', derelict: 'WRECK', jackpot: 'UNKNOWN', waldo: 'WALDO TRACE', engi: 'ENGI WRECK', 'drift-swarm': 'DRIFT SWARM', elimination: 'ELIMINATION' };
  return { ...expanded, beacons: expanded.beacons.map(beacon => {
    const vista = pictureVistas.find(item => item.id === beacon.vistaId);
    const event = { ...beacon.event };
    if (event.kind === 'picture' && vista) {
      event.title = vista.name;
      event.description = `Picture event: ${vista.name}. Clear this stage to unlock it.`;
      event.markerLabel = vista.name.replace(/^(the|a)\s+/i, '').toUpperCase();
    } else {
      event.markerLabel ??= markerLabels[event.kind];
    }
    if (event.kind === 'waldo') { event.hidden = false; event.title = 'Waldo Trace'; event.description = 'An elusive signal crosses the route; clear this stage to investigate it.'; }
    event.passage ??= passageFor(expanded.seed, event.kind, event.title, beacon.effects, beacon.vistaId, vista?.name);
    const effects = beacon.effects.map(effect => {
      const negativeImpact = effect.kind === 'hazard' || (effect.ballCountDelta ?? 0) > 0 || (effect.ballSpeedPercent ?? 0) > 0 || (effect.pickupRatePercent ?? 0) < 0 || (effect.creditsDelta ?? 0) < 0 || (effect.livesDelta ?? 0) < 0;
      if (!negativeImpact || effect.compensation) return effect;
      const random = randomFor(expanded.seed, `${effect.id}:compensation`);
      const useCredits = random() < 0.55;
      return { ...effect, compensation: { kind: useCredits ? 'credits' as const : 'score' as const, amount: useCredits ? 8 + Math.floor(random() * 13) : 40 + Math.floor(random() * 61) } };
    });
    return { ...beacon, event, effects };
  }) };
}

export function reachableBeacons(sector: SectorState) {
  const current = sector.beacons.find(beacon => beacon.id === sector.currentBeaconId);
  return current ? current.links.map(id => sector.beacons.find(beacon => beacon.id === id)).filter((beacon): beacon is SectorBeacon => !!beacon && beacon.depth > current.depth) : [];
}

export function hiddenFrontierBeacons(sector: SectorState) {
  const nextDepth = new Set(reachableBeacons(sector).flatMap(beacon => beacon.links));
  return sector.beacons.filter(beacon => nextDepth.has(beacon.id) && beacon.depth > (sector.beacons.find(item => item.id === sector.currentBeaconId)?.depth ?? 0) + 1 && beacon.event.hidden);
}

export function scanNextFrontier(sector: SectorState) {
  const candidates = hiddenFrontierBeacons(sector).sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));
  if (!candidates.length) return { sector, revealed: undefined };
  const revealed = candidates[(sector.scanCount ?? 0) % candidates.length];
  return {
    sector: { ...sector, scanCount: (sector.scanCount ?? 0) + 1, lastScannedBeaconId: revealed.id, beacons: sector.beacons.map(beacon => beacon.id === revealed.id ? { ...beacon, revealed: true, event: { ...beacon.event, hidden: false } } : beacon) },
    revealed,
  };
}

export function visitBeacon(sector: SectorState, beaconId: string): SectorState {
  const target = reachableBeacons(sector).find(beacon => beacon.id === beaconId);
  if (!target) return sector;
  const visitedBeaconIds = [...new Set([...sector.visitedBeaconIds, target.id])];
  const visited = { ...target, visited: true, revealed: true };
  return { ...sector, currentBeaconId: target.id, visitedBeaconIds, beacons: sector.beacons.map(beacon => beacon.id === target.id ? visited : beacon), jumpsSinceStore: target.event.kind === 'store' ? 0 : sector.jumpsSinceStore + 1, jumpsSinceRepair: target.event.kind === 'repair' ? 0 : sector.jumpsSinceRepair + 1, hasSeenStore: sector.hasSeenStore || target.event.kind === 'store', hasSeenRepair: sector.hasSeenRepair || target.event.kind === 'repair' };
}

export function generateSectorChoices(current: SectorType, depth: number, seed = Math.floor(Math.random() * 2_147_483_647), history: SectorType[] = []) {
  const options: SectorType[] = [];
  const random = randomFor(seed, `sector-options-${depth}`);
  const avoidCurrent = history.slice(-2).length === 2 && history[history.length - 1] === current && history[history.length - 2] === current;
  const optionCount = SECTOR_MAP_CONFIG.sectorChoiceCount[0] + (random() < 0.5 ? 0 : 1);
  while (options.length < optionCount) {
    const candidate = pickWeighted<SectorType>(random, { Civilian: 28, Hostile: 25, Nebula: 25, Derelict: 22 });
    if (options.includes(candidate)) continue;
    if (avoidCurrent && candidate === current) continue;
    options.push(candidate);
  }
  return options;
}

export function sectorCanReachExit(sector: SectorState) {
  const exit = sector.beacons.find(beacon => beacon.exit);
  if (!exit) return false;
  const canReach = new Set([exit.id]);
  for (let depth = sector.targetLength - 1; depth >= 0; depth--) {
    for (const beacon of sector.beacons.filter(item => item.depth === depth)) {
      if (beacon.links.some(id => canReach.has(id))) canReach.add(beacon.id);
    }
  }
  return sector.beacons.every(beacon => canReach.has(beacon.id));
}

export function expandEntireSector(sector: SectorState, pictureVistas: { id: string; name: string }[] = []) {
  let expanded = sector;
  let cursor = 0;
  while (cursor < expanded.beacons.length) {
    const beacon = expanded.beacons[cursor++];
    if (!beacon.expanded) expanded = expandBeacon(expanded, beacon.id, pictureVistas);
  }
  return expanded;
}
