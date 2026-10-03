/** Central place for playtest tuning. Values are intentionally provisional. */
export type MechanicsSettings = {
  startLives: number; startingBalls: number; ballsAddedPerLevel: number; hardMode: boolean; easyMode: boolean;
  normalCaptureBallCount: number; normalCaptureBallChance: number; hardCaptureBallCount: number; hardCaptureBallChance: number;
  clearPercentOfOriginalBoard: number; maximumActiveWalls: number;
  ballRadius: number; powerupRadiusMultiplier: number; powerupRadius: number; lifePowerupRadius: number; bubbleSizeMultiplier: number; comboBubbleCountVariance: number; bubbleCreditsPerPop: number; ballSpeedMin: number; ballSpeedMax: number; ballRecoveryThreshold: number; ballRecoverySpeed: number; ballRecoveryModifierChance: number; wallGrowthSpeed: number;
  ballModifiers: Record<BallModifier, BallModifierSettings>;
  powerupSpawnEverySecondsMin: number; powerupSpawnEverySecondsMax: number;
  creditPickupBaseAmount: number; creditPickupBounceDespawnChance: number;
  petEggIncubationInstallment: number; petEggIncubationVisits: number; petEggIncubationDurationMs: number; engiHireCost: number; engiUpgradeBaseCost: number;
  lifeStorageBaseCapacity: number; lifeStorageUpgradeBaseCost: number; lifeStorageCostIncreasePercent: number;
  resourceStorageUpgradeBaseCost: number; resourceStorageCostIncreasePercent: number;
  overflowCreditValues: Record<PowerKind, number>; overflowProcessingMs: number; overflowBaseSuccessChance: number; overflowUpgradeBaseCost: number; overflowUpgradeChanceIncrease: number; overflowUpgradeCostIncreasePercent: number;
  powerupSpawnWeights: Record<PowerKind, number>;
  powerupDespawnEnabled: Record<PowerKind, boolean>;
  powerupDespawnSeconds: Record<PowerKind, number>;
  merchantCreditsPerTenPercent: number; merchantPowerBarCost: number;
  creditGainStyle: 'orbiting' | 'ticker';
  levelClearStyle: 'nova' | 'prism' | 'rift';
  merchantPowerBarCostIncreasePercent: number; merchantSkinUnlockBaseCost: number;
  merchantSkinTierMultipliers: { tier1: number; tier2: number; tier3: number };
  merchantRewardsEnabled: Record<'life' | 'speed' | 'ram' | 'treasure' | 'waldo', boolean>;
  merchantUpgradePerBar: { lifeSpawnWeight: number; lifeLifetimeSeconds: number; speedPercent: number; ramPercent: number; treasureRewards: number; waldoPaintingCredits: number };
  waldoSpawnChance: number; waldoIneligibleChance: number; waldoRewardCredits: number;
  waldoPetPaintingCredits: number; waldoPetPaintingIntervalMs: number;
  speedBoostMultiplier: number;
  treasureLevelEligibilityChance: number; treasureHuntDurationMs: number; treasureRewardMin: number; treasureRewardMax: number;
  ramDisplayIconLimit: number; missExplosionRadius: number; missExplosionStrength: number; pictureEventChance: number; leaderboardSize: number; wallBreakStyle: string;
  territoryPopupPlacement: 'wall' | 'captured-area';
  backgroundColors: string[]; backgroundColorIndex: number; autoBackground: boolean; showGrid: boolean; gridOpacity: number; gridColor: string; claimedFillOpacity: number; claimedColor: string;
};

export type BallModifier = 'splitter' | 'skimmer' | 'drifter' | 'anchor' | 'phase';
/** Reusable shorthand for modifiers periodically applied for a random duration. Chance is per second and dt-adjusted in the sim tick. */
export type PeriodicModifierRule = { chancePerSecond: number; durationMinSeconds: number; durationMaxSeconds: number };
export type BallModifierSettings = {
  enabled: boolean; spawnChance: number; spawnRuleEnabled: boolean;
  periodic?: PeriodicModifierRule;
  sizeMultiplier?: number; splitSizeMultiplier?: number; glideDurationMs?: number;
  attractionStrength?: number; attractionRange?: number;
  phaseDurationMs?: number; phaseUnclaimRadius?: number; chestRewardMin?: number; chestRewardMax?: number; breakSpeedThreshold?: number;
};

export const DEFAULT_MECHANICS: MechanicsSettings = {
  startLives: 3,
  startingBalls: 3,
  ballsAddedPerLevel: 1,
  hardMode: false,
  easyMode: false,
  normalCaptureBallCount: 1,
  normalCaptureBallChance: 0.2,
  hardCaptureBallCount: 1,
  hardCaptureBallChance: 1,
  clearPercentOfOriginalBoard: 65,
  maximumActiveWalls: 4,
  ballRadius: 12.5,
  powerupRadiusMultiplier: 1.4,
  powerupRadius: 17.5,
  lifePowerupRadius: 17.5,
  bubbleSizeMultiplier: 1.2,
  comboBubbleCountVariance: 1,
  bubbleCreditsPerPop: 5,
  ballSpeedMin: 90,
  ballSpeedMax: 150,
  ballRecoveryThreshold: 35,
  ballRecoverySpeed: 90,
  ballRecoveryModifierChance: 0.2,
  ballModifiers: {
    splitter: { enabled: true, spawnChance: 0.04, spawnRuleEnabled: true, splitSizeMultiplier: 0.65 },
    skimmer: { enabled: true, spawnChance: 0, spawnRuleEnabled: true, glideDurationMs: 900, periodic: { chancePerSecond: 0.01, durationMinSeconds: 8, durationMaxSeconds: 15 } },
    drifter: { enabled: true, spawnChance: 0.08, spawnRuleEnabled: true, attractionStrength: 240, attractionRange: 360 },
    anchor: { enabled: true, spawnChance: 0.06, spawnRuleEnabled: true, sizeMultiplier: 1.6, breakSpeedThreshold: 190 },
    phase: { enabled: true, spawnChance: 0.05, spawnRuleEnabled: true, phaseDurationMs: 8000, phaseUnclaimRadius: 65, chestRewardMin: 3, chestRewardMax: 6 },
  },
  wallGrowthSpeed: 250,
  powerupSpawnEverySecondsMin: 16,
  powerupSpawnEverySecondsMax: 28,
  creditPickupBaseAmount: 5,
  creditPickupBounceDespawnChance: 0.1,
  petEggIncubationInstallment: 20, petEggIncubationVisits: 2, petEggIncubationDurationMs: 120_000, engiHireCost: 120, engiUpgradeBaseCost: 80,
  lifeStorageBaseCapacity: 5, lifeStorageUpgradeBaseCost: 35, lifeStorageCostIncreasePercent: 35,
  resourceStorageUpgradeBaseCost: 25, resourceStorageCostIncreasePercent: 35,
  overflowCreditValues: { life: 5, speed: 5, ram: 5, treasure: 0, merchant: 0, bubble: 0, waldo: 0, credit: 0, 'engi-egg': 0, exit: 0 }, overflowProcessingMs: 6000, overflowBaseSuccessChance: 50, overflowUpgradeBaseCost: 25, overflowUpgradeChanceIncrease: 5, overflowUpgradeCostIncreasePercent: 35,
  powerupSpawnWeights: { life: 49.5, speed: 34.65, ram: 14.85, treasure: 1, merchant: 1, bubble: 0, waldo: 0, credit: 5, 'engi-egg': 1, exit: 0 },
  powerupDespawnEnabled: { life: false, speed: true, ram: true, treasure: true, merchant: true, bubble: false, waldo: true, credit: true, 'engi-egg': true, exit: false },
  powerupDespawnSeconds: { life: 0, speed: 20, ram: 10, treasure: 10, merchant: 30, bubble: 0, waldo: 30, credit: 5, 'engi-egg': 30, exit: 0 },
  merchantCreditsPerTenPercent: 2, merchantPowerBarCost: 10, merchantPowerBarCostIncreasePercent: 15, creditGainStyle: 'orbiting', levelClearStyle: 'nova',
  merchantSkinUnlockBaseCost: 100, merchantSkinTierMultipliers: { tier1: 1, tier2: 2.5, tier3: 5 },
  merchantRewardsEnabled: { life: true, speed: true, ram: true, treasure: true, waldo: true },
  merchantUpgradePerBar: { lifeSpawnWeight: 1, lifeLifetimeSeconds: 2, speedPercent: 10, ramPercent: 10, treasureRewards: 1, waldoPaintingCredits: 2 },
  waldoSpawnChance: 0.05, waldoIneligibleChance: 0.5, waldoRewardCredits: 25,
  waldoPetPaintingCredits: 5, waldoPetPaintingIntervalMs: 45_000,
  speedBoostMultiplier: 1.4,
  treasureLevelEligibilityChance: 1,
  treasureHuntDurationMs: 180_000,
  treasureRewardMin: 3,
  treasureRewardMax: 6,
  ramDisplayIconLimit: 10,
  missExplosionRadius: 145,
  missExplosionStrength: 280,
  pictureEventChance: 0.5,
  leaderboardSize: 10,
  wallBreakStyle: 'glass-shards',
  territoryPopupPlacement: 'wall',
  backgroundColors: ['#0b1728', '#17112b', '#102321', '#251623', '#17202a'],
  backgroundColorIndex: 0,
  autoBackground: true,
  showGrid: true,
  gridOpacity: 0.16,
  gridColor: '#6a879c',
  claimedFillOpacity: 0.94,
  claimedColor: '#071019',
};

export let MECHANICS: MechanicsSettings = { ...DEFAULT_MECHANICS, ballModifiers: Object.fromEntries(Object.entries(DEFAULT_MECHANICS.ballModifiers).map(([key, value]) => [key, { ...value }])) as MechanicsSettings['ballModifiers'], powerupSpawnWeights: { ...DEFAULT_MECHANICS.powerupSpawnWeights }, backgroundColors: [...DEFAULT_MECHANICS.backgroundColors] };
export function getMechanicsSettings(): MechanicsSettings { return { ...MECHANICS, ballModifiers: Object.fromEntries(Object.entries(MECHANICS.ballModifiers).map(([key, value]) => [key, { ...value }])) as MechanicsSettings['ballModifiers'], powerupSpawnWeights: { ...MECHANICS.powerupSpawnWeights }, powerupDespawnEnabled: { ...MECHANICS.powerupDespawnEnabled }, powerupDespawnSeconds: { ...MECHANICS.powerupDespawnSeconds }, overflowCreditValues: { ...MECHANICS.overflowCreditValues }, merchantRewardsEnabled: { ...MECHANICS.merchantRewardsEnabled }, merchantUpgradePerBar: { ...MECHANICS.merchantUpgradePerBar }, merchantSkinTierMultipliers: { ...MECHANICS.merchantSkinTierMultipliers }, backgroundColors: [...MECHANICS.backgroundColors] }; }
export function setMechanicsSettings(settings: MechanicsSettings) { MECHANICS = { ...settings, ballModifiers: Object.fromEntries(Object.entries(settings.ballModifiers).map(([key, value]) => [key, { ...value }])) as MechanicsSettings['ballModifiers'], powerupSpawnWeights: { ...settings.powerupSpawnWeights }, powerupDespawnEnabled: { ...settings.powerupDespawnEnabled }, powerupDespawnSeconds: { ...settings.powerupDespawnSeconds }, overflowCreditValues: { ...settings.overflowCreditValues }, merchantRewardsEnabled: { ...settings.merchantRewardsEnabled }, merchantUpgradePerBar: { ...settings.merchantUpgradePerBar }, merchantSkinTierMultipliers: { ...settings.merchantSkinTierMultipliers }, backgroundColors: [...settings.backgroundColors] }; }

export type Ball = { id: number; x: number; y: number; vx: number; vy: number; r: number; rammed?: boolean; modifier?: BallModifier; modifierExpiresAtMs?: number; phaseEndsAtMs?: number; skimmerWallId?: number; skimmerRemainingMs?: number; skimmerResumeVx?: number; skimmerResumeVy?: number; drifting?: boolean };
export type Wall = {
  id: number;
  axis: 'vertical' | 'horizontal';
  at: number;
  center: number;
  low: number;
  high: number;
  lowTarget: number;
  highTarget: number;
  lowState: 'growing' | 'grounded' | 'connected';
  highState: 'growing' | 'grounded' | 'connected';
  connections: number[];
  active: boolean;
  speedMultiplier: number;
  /** This wall becomes solid normally, but its completion does not claim territory. */
  noCapture?: boolean;
};
export type PowerKind = 'life' | 'speed' | 'ram' | 'treasure' | 'merchant' | 'bubble' | 'waldo' | 'credit' | 'engi-egg' | 'exit';
export type EngiTask = 'inspect' | 'weld' | 'scan' | 'tinker' | 'rest';
export type PetTask = EngiTask | 'clean' | 'paint' | 'wander';
export type WaldoPainting = { id: number; wallId: number; axis: Wall['axis']; at: number; along: number; style: number };
export type CompanionPet = { id: number; species: 'engi' | 'waldo'; name: string; skinId: string; health: number; maxHealth: number; level: number; deployed: boolean; x: number; y: number; vx: number; vy: number; task: PetTask; taskUntilMs: number; climbUntilMs?: number; repairedThisLevel: boolean; nextPaintingAtMs?: number; paintings?: WaldoPainting[] };
export type PetIncubation = { id: number; species: 'engi'; progressMs: number; durationMs: number; nameSeed: number; skinId: string };
export type PowerUp = { id: number; x: number; y: number; vx: number; vy: number; kind: PowerKind; phaseChest?: boolean; bounceCredits?: number; despawnAtMs?: number; despawnOpacity?: number };
export type SkeweredWall = Pick<Wall, 'axis' | 'at' | 'low' | 'high'>;
export type CaptureEvent = { id: number; x: number; y: number; kind: PowerKind | 'explosion' | 'phaseRupture' | 'phaseChestBreak' | 'ramBlast' | 'jackpot' | 'merchantBreak' | 'anchorBreak' | 'combo' | 'bubbleLost' | 'creditLost' | 'overflowFailed' | 'waldoFound' | 'petRepair' | 'petLost' | 'petHatched' | 'engiEggBreak'; skinId?: string; skewered?: boolean; skeweredAxis?: Wall['axis']; skeweredWall?: SkeweredWall; amount?: number; comboCount?: number };
export type WallBreakEvent = { id: number; x: number; y: number; style: string; axis?: Wall['axis']; at?: number; low?: number; high?: number };
export type TerritoryGainEvent = { id: number; x: number; y: number; percent: number; wallX?: number; wallY?: number; areaX?: number; areaY?: number };
export type CreditGainEvent = { id: number; x: number; y: number; amount: number };
export type OverflowJob = { id: number; kind: PowerKind; credits: number; remainingMs: number; sourceX: number; sourceY: number };
export type PictureLibraryEntry = { id: string; name: string; seed: number; uri?: string };
export type WaldoLibraryEntry = { id: string; name: string; seed: number; waldoX: number; waldoY: number };
export type PictureEvent = { seed: number; pictureId?: string; isWaldo?: boolean; waldoX?: number; waldoY?: number; waldoLibraryId?: string; waldoFound?: boolean };
let pictureLibrary: PictureLibraryEntry[] = [];
let waldoLibrary: WaldoLibraryEntry[] = [];
export function setPictureLibrary(entries: PictureLibraryEntry[]) { pictureLibrary = [...entries]; }
export function setWaldoLibrary(entries: WaldoLibraryEntry[]) { waldoLibrary = [...entries]; }
function nextPictureEvent(waldoRequested = false): PictureEvent | null {
  if (Math.random() >= MECHANICS.pictureEventChance) return null;
  if (waldoRequested) {
    if (waldoLibrary.length && Math.random() < 0.5) {
      const saved = waldoLibrary[Math.floor(Math.random() * waldoLibrary.length)];
      return { seed: saved.seed, isWaldo: true, waldoX: saved.waldoX, waldoY: saved.waldoY, waldoLibraryId: saved.id, waldoFound: false };
    }
    const seed = Math.floor(Math.random() * 2_147_483_647);
    return { seed, isWaldo: true, ...generatedWaldoLocation(seed), waldoFound: false };
  }
  const chooseSavedBackground = Math.random() >= 0.5;
  const favorite = chooseSavedBackground && pictureLibrary.length ? pictureLibrary[Math.floor(Math.random() * pictureLibrary.length)] : undefined;
  return favorite ? { seed: favorite.seed, pictureId: favorite.id } : { seed: Math.floor(Math.random() * 2_147_483_647) };
}
function generatedWaldoLocation(seed: number) {
  const value = (index: number) => { const raw = Math.sin((seed + 13) * 0.000001 + (index + 1) * 78.233) * 43758.5453; return raw - Math.floor(raw); };
  return { waldoX: 0.08 + value(0) * 0.84, waldoY: 0.09 + value(1) * 0.82 };
}
export type Run = {
  level: number;
  lives: number;
  claimed: number;
  claimMask: number[];
  balls: Ball[];
  walls: Wall[];
  powerups: PowerUp[];
  speedCharges: number;
  ramCharges: number;
  speedCapacityBonus: number; speedCapacityPurchases: number;
  ramCapacityBonus: number; ramCapacityPurchases: number;
  merchantTokens: number; credits: number; powerBars: number;
  lifeCapacity: number; lifeCapacityPurchases: number;
  overflowJobs: OverflowJob[]; overflowSuccessChance: number; overflowUpgradePurchases: number;
  powerBarsPurchased: number;
  merchantUpgrades: Record<'life' | 'speed' | 'ram' | 'treasure' | 'waldo', number>;
  petEggs: number; petEggVisitProgress: number; pets: CompanionPet[]; petIncubations: PetIncubation[];
  isotypesContained: boolean; isotypesNoticeUntilMs: number; petNotice: string | null; petNoticeUntilMs: number;
  levelClearPending: boolean;
  speedReadyUntil: number | null;
  captureEvents: CaptureEvent[];
  wallBreakEvents: WallBreakEvent[];
  territoryGainEvents: TerritoryGainEvent[];
  creditGainEvents: CreditGainEvent[];
  treasureEligible: boolean;
  treasureHuntPending: boolean;
  treasureHunt: { x: number; y: number; remainingMs: number; revealed: boolean } | null;
  pictureEvent: PictureEvent | null;
  waldoEventPending: boolean; waldoEligible: boolean;
  mechanics: MechanicsSettings;
  boardWidth: number;
  boardHeight: number;
  gridCols: number;
  gridRows: number;
  nextId: number;
  elapsedMs: number;
  spawnInMs: number;
  ended?: boolean;
};

export type ScoreEntry = { level: number; claimed: number; timestamp: number };

export function randomBetween(a: number, b: number) { return a + Math.random() * (b - a); }

export function merchantPowerBarCost(run: Pick<Run, 'powerBarsPurchased' | 'mechanics'>) {
  const scaled = run.mechanics.merchantPowerBarCost * Math.pow(1 + run.mechanics.merchantPowerBarCostIncreasePercent / 100, run.powerBarsPurchased ?? 0);
  return Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.ceil(scaled)));
}

export function lifeStorageUpgradeCost(run: Pick<Run, 'lifeCapacityPurchases' | 'mechanics'>) {
  const scaled = run.mechanics.lifeStorageUpgradeBaseCost * Math.pow(1 + run.mechanics.lifeStorageCostIncreasePercent / 100, run.lifeCapacityPurchases ?? 0);
  return Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.ceil(scaled)));
}

export type ChargeKind = 'speed' | 'ram';
export function chargeCapacity(run: Pick<Run, 'level' | 'speedCapacityBonus' | 'ramCapacityBonus'>, kind: ChargeKind) {
  return Math.max(0, Math.floor(run.level)) + 2 + Math.max(0, Math.floor(kind === 'speed' ? run.speedCapacityBonus ?? 0 : run.ramCapacityBonus ?? 0));
}
export function chargeStorageUpgradeCost(run: Pick<Run, 'speedCapacityPurchases' | 'ramCapacityPurchases' | 'mechanics'>, kind: ChargeKind) {
  const purchases = kind === 'speed' ? run.speedCapacityPurchases ?? 0 : run.ramCapacityPurchases ?? 0;
  const scaled = run.mechanics.resourceStorageUpgradeBaseCost * Math.pow(1 + run.mechanics.resourceStorageCostIncreasePercent / 100, purchases);
  return Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.ceil(scaled)));
}

/** Enforce level-scaled Speed/Ram storage for old saves as well as new reward paths. */
export function enforceChargeCapacities(run: Run): Run {
  const speedCapacity = chargeCapacity(run, 'speed'), ramCapacity = chargeCapacity(run, 'ram');
  const overflow: { kind: PowerKind; x: number; y: number }[] = [];
  for (let i = speedCapacity; i < run.speedCharges; i++) overflow.push({ kind: 'speed', x: run.boardWidth / 2, y: run.boardHeight / 2 });
  for (let i = ramCapacity; i < run.ramCharges; i++) overflow.push({ kind: 'ram', x: run.boardWidth / 2, y: run.boardHeight / 2 });
  const queued = queueOverflowJobs(run, overflow, run.nextId);
  return { ...run, speedCharges: Math.min(run.speedCharges, speedCapacity), ramCharges: Math.min(run.ramCharges, ramCapacity), overflowJobs: [...(run.overflowJobs ?? []), ...queued.jobs], nextId: queued.nextId };
}

export function overflowRefineryUpgradeCost(run: Pick<Run, 'overflowUpgradePurchases' | 'mechanics'>) {
  const scaled = run.mechanics.overflowUpgradeBaseCost * Math.pow(1 + run.mechanics.overflowUpgradeCostIncreasePercent / 100, run.overflowUpgradePurchases ?? 0);
  return Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.ceil(scaled)));
}

export function powerupDespawnAt(kind: PowerKind, elapsedMs: number, settings: MechanicsSettings = MECHANICS): number | undefined {
  if (kind === 'exit') return undefined;
  // Credit tokens only begin a lifespan after the random board-edge trigger.
  if (kind === 'credit') return undefined;
  if (settings.powerupDespawnEnabled?.[kind] === false) return undefined;
  const seconds = settings.powerupDespawnSeconds[kind] ?? 0;
  return seconds > 0 ? elapsedMs + seconds * 1000 : undefined;
}

export function powerupCollisionRadius(kind: PowerKind, settings: MechanicsSettings = MECHANICS) {
  return settings.ballRadius * settings.powerupRadiusMultiplier * (kind === 'bubble' ? settings.bubbleSizeMultiplier : 1);
}

function powerupRadius(kind: PowerKind = 'life', settings: MechanicsSettings = MECHANICS) {
  return powerupCollisionRadius(kind, settings);
}

function randomPowerKind(treasureEligible: boolean, merchantAllowed = true, settings: MechanicsSettings = MECHANICS): PowerKind {
  const weights = settings.powerupSpawnWeights;
  const treasure = treasureEligible ? weights.treasure : 0;
  const merchant = merchantAllowed ? weights.merchant : 0;
  const bubble = weights.bubble ?? 0;
  const credit = weights.credit ?? 0;
  const engiEgg = weights['engi-egg'] ?? 0;
  const total = weights.life + weights.speed + weights.ram + treasure + merchant + bubble + credit + engiEgg;
  if (total <= 0) return 'ram';
  const value = Math.random() * total;
  return value < weights.life ? 'life' : value < weights.life + weights.speed ? 'speed' : value < weights.life + weights.speed + weights.ram ? 'ram' : value < weights.life + weights.speed + weights.ram + treasure ? 'treasure' : value < weights.life + weights.speed + weights.ram + treasure + merchant ? 'merchant' : value < weights.life + weights.speed + weights.ram + treasure + merchant + bubble ? 'bubble' : value < weights.life + weights.speed + weights.ram + treasure + merchant + bubble + credit ? 'credit' : 'engi-egg';
}

function ballModifierRuleAllows(run: Pick<Run, 'balls' | 'walls'>, modifier: BallModifier) {
  // Phase is event-triggered when a wall starts, so it does not use spawn or
  // slow-ball recovery eligibility checks here.
  if (modifier === 'phase') return false;
  if (modifier === 'anchor' || modifier === 'splitter') return !run.balls.some(ball => ball.modifier === modifier);
  if (modifier === 'skimmer') return run.walls.some(wall => !wall.active);
  if (modifier === 'drifter') return run.walls.some(wall => wall.active);
  return false;
}

function applyBallModifier(run: Pick<Run, 'balls' | 'walls' | 'mechanics'>, ball: Ball): Ball {
  const choices: BallModifier[] = [];
  for (const modifier of ['splitter', 'drifter', 'anchor'] as const) {
    const settings = run.mechanics.ballModifiers?.[modifier];
    if (!settings?.enabled || Math.random() >= settings.spawnChance) continue;
    if (settings.spawnRuleEnabled && !ballModifierRuleAllows(run, modifier)) continue;
    choices.push(modifier);
  }
  if (!choices.length) return ball;
  const modifier = choices[Math.floor(Math.random() * choices.length)];
  const modified = { ...ball, modifier };
  if (modifier === 'anchor') modified.r *= run.mechanics.ballModifiers.anchor.sizeMultiplier ?? 1.6;
  return modified;
}

/** Restore a ball that has nearly stalled, with a modest heading wobble and an optional eligible modifier. */
function recoverSlowBall(run: Run, ball: Ball): Ball {
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed >= run.mechanics.ballRecoveryThreshold) return ball;
  const targetSpeed = Math.max(0, Math.min(run.mechanics.ballSpeedMax, run.mechanics.ballRecoverySpeed));
  const angle = (speed > 0.001 ? Math.atan2(ball.vy, ball.vx) : Math.random() * Math.PI * 2) + randomBetween(-Math.PI / 15, Math.PI / 15);
  let recovered: Ball = { ...ball, vx: Math.cos(angle) * targetSpeed, vy: Math.sin(angle) * targetSpeed };
  if (ball.modifier || Math.random() >= run.mechanics.ballRecoveryModifierChance) return recovered;
  const candidates: BallModifier[] = ['splitter', 'drifter', 'anchor'];
  const eligible = candidates.filter(modifier => {
    const settings = run.mechanics.ballModifiers[modifier];
    return settings.enabled && (!settings.spawnRuleEnabled || ballModifierRuleAllows(run, modifier));
  });
  if (!eligible.length) return recovered;
  const modifier = eligible[Math.floor(Math.random() * eligible.length)];
  recovered = { ...recovered, modifier };
  if (modifier === 'anchor') recovered.r *= run.mechanics.ballModifiers.anchor.sizeMultiplier ?? 1.6;
  return recovered;
}

/** Periodic modifier rule shorthand: chance is normalized per second so it behaves consistently across sim tick sizes. */
function rollPeriodicModifier(balls: Ball[], modifier: BallModifier, rule: PeriodicModifierRule, nowMs: number, dtMs: number, requireUnmodified: boolean): Ball[] {
  const eligible = requireUnmodified ? balls.filter(ball => !ball.modifier) : balls;
  if (!eligible.length) return balls;
  const chancePerSecond = Math.max(0, Math.min(1, rule.chancePerSecond));
  const tickChance = 1 - Math.pow(1 - chancePerSecond, dtMs / 1000);
  if (Math.random() >= tickChance) return balls;
  const targetId = eligible[Math.floor(Math.random() * eligible.length)].id;
  const durationSeconds = randomBetween(Math.min(rule.durationMinSeconds, rule.durationMaxSeconds), Math.max(rule.durationMinSeconds, rule.durationMaxSeconds));
  return balls.map(ball => ball.id === targetId ? { ...ball, modifier, modifierExpiresAtMs: nowMs + durationSeconds * 1000 } : ball);
}

const ENGI_NAME_PREFIXES = ['Ari', 'Bo', 'Cobalt', 'Dax', 'Eko', 'Fenn', 'Glim', 'Hux', 'Iri', 'Juno', 'Kip', 'Lumen', 'Mica', 'Nix', 'Orbi', 'Pip', 'Quin', 'Rho', 'Sprocket', 'Tavi', 'Uma', 'Vex', 'Weld', 'Xeno', 'Yori', 'Zed'];
const ENGI_NAME_SUFFIXES = ['bit', 'by', 'core', 'dot', 'ee', 'fix', 'gear', 'ix', 'joy', 'kit', 'loop', 'mender', 'node', 'nut', 'patch', 'quill', 'relay', 'spark', 'tinker', 'unit', 'volt', 'whirr', 'x', 'y'];
const ENGI_TASKS: EngiTask[] = ['inspect', 'weld', 'scan', 'tinker', 'rest'];
export function engiUpgradeCost(level: number, settings: MechanicsSettings = MECHANICS) { return Math.ceil(settings.engiUpgradeBaseCost * Math.pow(1.65, Math.max(0, level - 1))); }
export function startEngiIncubation(run: Run, skinId: string): Run {
  if (run.petEggs <= 0 || run.credits < run.mechanics.petEggIncubationInstallment) return run;
  const progress = run.petEggVisitProgress + 1;
  const required = Math.max(1, Math.floor(run.mechanics.petEggIncubationVisits));
  const completes = progress >= required;
  const seed = Math.floor(Math.random() * 2_147_483_647);
  const incubation: PetIncubation = { id: run.nextId, species: 'engi', progressMs: 0, durationMs: run.mechanics.petEggIncubationDurationMs, nameSeed: seed, skinId };
  return { ...run, credits: run.credits - run.mechanics.petEggIncubationInstallment, petEggs: run.petEggs - (completes ? 1 : 0), petEggVisitProgress: completes ? 0 : progress, petIncubations: completes ? [...run.petIncubations, incubation] : run.petIncubations, nextId: run.nextId + (completes ? 1 : 0), petNotice: completes ? 'ENGI COCOON INCUBATION STARTED' : `ENGI COCOON PAYMENT ${progress}/${required}`, petNoticeUntilMs: run.elapsedMs + 3200 };
}
export function hireEngi(run: Run, skinId: string): Run {
  if (run.credits < run.mechanics.engiHireCost) return run;
  const seed = Math.floor(Math.random() * 2_147_483_647);
  const pet: CompanionPet = { id: run.nextId, species: 'engi', name: `${ENGI_NAME_PREFIXES[seed % ENGI_NAME_PREFIXES.length]}${ENGI_NAME_SUFFIXES[Math.floor(seed / ENGI_NAME_PREFIXES.length) % ENGI_NAME_SUFFIXES.length]}`, skinId, health: 1, maxHealth: 1, level: 1, deployed: false, x: run.boardWidth * (0.18 + (seed % 64) / 100), y: 0, vx: 0, vy: 0, task: 'inspect', taskUntilMs: run.elapsedMs + 2400, repairedThisLevel: false };
  return { ...run, credits: run.credits - run.mechanics.engiHireCost, pets: [...run.pets, pet], nextId: run.nextId + 1, petNotice: `${pet.name} JOINED THE CREW`, petNoticeUntilMs: run.elapsedMs + 3200 };
}
export function upgradeEngi(run: Run, petId: number): Run {
  const pet = run.pets.find(candidate => candidate.id === petId);
  if (!pet || run.credits < engiUpgradeCost(pet.level, run.mechanics)) return run;
  const cost = engiUpgradeCost(pet.level, run.mechanics);
  return { ...run, credits: run.credits - cost, pets: run.pets.map(candidate => candidate.id === petId ? { ...candidate, level: candidate.level + 1, maxHealth: candidate.maxHealth + 1, health: Math.min(candidate.maxHealth + 1, candidate.health + 1) } : candidate) };
}
export function deployEngi(run: Run, petId: number, x: number, y: number, deployed: boolean): Run {
  const target = run.pets.find(pet => pet.id === petId);
  if (!target) return run;
  const safeX = Math.max(14, Math.min(run.boardWidth - 14, x)), safeY = Math.max(14, Math.min(run.boardHeight - 14, y));
  return { ...run, pets: run.pets.map(pet => pet.id === petId ? { ...pet, deployed, x: safeX, y: safeY, vx: deployed ? 30 : 0, vy: 0 } : pet) };
}

function advancePetIncubations(run: Run, dt: number) {
  const remaining: PetIncubation[] = [];
  let nextId = run.nextId;
  const hatched: CompanionPet[] = [];
  for (const incubation of run.petIncubations) {
    const progressMs = incubation.progressMs + dt;
    if (progressMs < incubation.durationMs) { remaining.push({ ...incubation, progressMs }); continue; }
    const name = `${ENGI_NAME_PREFIXES[incubation.nameSeed % ENGI_NAME_PREFIXES.length]}${ENGI_NAME_SUFFIXES[Math.floor(incubation.nameSeed / ENGI_NAME_PREFIXES.length) % ENGI_NAME_SUFFIXES.length]}`;
    hatched.push({ id: nextId++, species: 'engi', name, skinId: incubation.skinId, health: 1, maxHealth: 1, level: 1, deployed: false, x: run.boardWidth * (0.18 + (incubation.nameSeed % 64) / 100), y: 0, vx: 0, vy: 0, task: 'scan', taskUntilMs: run.elapsedMs + 2400, repairedThisLevel: false });
    run.captureEvents.push({ id: nextId++, kind: 'petHatched', x: run.boardWidth / 2, y: run.boardHeight * 0.12 });
    run.petNotice = `${name} HATCHED`;
    run.petNoticeUntilMs = run.elapsedMs + 3800;
  }
  run.nextId = nextId;
  run.petIncubations = remaining;
  run.pets = [...run.pets, ...hatched];
}

function advancePetBodies(run: Run, dt: number, width: number, height: number) {
  const dtSeconds = dt / 1000;
  const pets: CompanionPet[] = [];
  for (const original of run.pets) {
    let pet = { ...original };
    if (!pet.deployed) {
      if (run.elapsedMs >= pet.taskUntilMs) {
        const idleTasks: PetTask[] = pet.species === 'waldo' ? ['clean', 'wander', 'rest'] : ['inspect', 'scan', 'tinker', 'rest', 'wander'];
        pet.task = idleTasks[Math.floor(Math.random() * idleTasks.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = randomBetween(18, 38);
        pet.vx = Math.cos(angle) * speed; pet.vy = Math.sin(angle) * speed;
        pet.taskUntilMs = run.elapsedMs + randomBetween(2600, 5600);
      }
      let nextX = pet.x + pet.vx * dtSeconds, nextY = pet.y + pet.vy * dtSeconds;
      const edge = 20;
      if (nextX < edge || nextX > width - edge) { pet.vx *= -1; nextX = Math.max(edge, Math.min(width - edge, nextX)); }
      if (nextY < edge || nextY > height - edge) { pet.vy *= -1; nextY = Math.max(edge, Math.min(height - edge, nextY)); }
      pet.x = nextX; pet.y = nextY;
      if (run.balls.some(ball => Math.hypot(ball.x - pet.x, ball.y - pet.y) <= ball.r + 13)) {
        pet.health -= 1;
        if (pet.health <= 0) {
          run.captureEvents.push({ id: run.nextId++, kind: 'petLost', x: pet.x, y: pet.y });
          run.petNotice = `${pet.name} WAS LOST`;
          run.petNoticeUntilMs = run.elapsedMs + 3600;
          continue;
        }
        pet.vx *= -1; pet.vy *= -1;
      }
      pets.push(pet);
      continue;
    }
    if (pet.deployed && run.elapsedMs >= pet.taskUntilMs) {
      const choices: PetTask[] = pet.species === 'waldo' ? ['wander', 'paint'] : ENGI_TASKS;
      const available = choices.filter(task => task !== pet.task);
      pet.task = available[Math.floor(Math.random() * available.length)];
      pet.taskUntilMs = run.elapsedMs + randomBetween(2200, 5200);
    }
    if (pet.deployed) {
      const r = 13;
      const previousY = pet.y;
      let nextX = pet.x + pet.vx * dtSeconds;
      let nextY = pet.y + pet.vy * dtSeconds + 0.5 * 460 * dtSeconds * dtSeconds;
      pet.vy += 460 * dtSeconds;
      if (nextX < r || nextX > width - r) { pet.vx *= -1; nextX = Math.max(r, Math.min(width - r, nextX)); }
      if (pet.climbUntilMs !== undefined && run.elapsedMs < pet.climbUntilMs) {
        nextY = pet.y - 48 * dtSeconds; pet.vy = 0;
        if (run.elapsedMs >= pet.climbUntilMs - 180) pet.task = 'inspect';
      }
      for (const wall of run.walls) {
        if (wall.axis === 'horizontal' && nextX >= wall.low - r && nextX <= wall.high + r) {
          const crossedFromAbove = previousY + r <= wall.at && nextY + r >= wall.at && pet.vy >= 0;
          const crossedFromBelow = previousY - r >= wall.at && nextY - r <= wall.at && pet.vy <= 0;
          // Territory color/claim state never changes pet movement. Physical
          // walls bound its current space from both directions, including when
          // it jumps into the underside of a horizontal wall.
          if (crossedFromAbove) { nextY = wall.at - r; pet.vy = 0; }
          else if (crossedFromBelow) { nextY = wall.at + r; pet.vy = 0; }
        } else if (wall.axis === 'vertical' && nextY + r > wall.low && nextY - r < wall.high && (pet.x - r <= wall.at && nextX + r >= wall.at || pet.x + r >= wall.at && nextX - r <= wall.at)) {
          nextX = pet.x < wall.at ? wall.at - r : wall.at + r;
          pet.vx *= -1; pet.vy = -36; pet.climbUntilMs = run.elapsedMs + 760; pet.task = 'weld';
        }
      }
      if (nextY > height - r) { nextY = height - r; pet.vy = 0; }
      if (nextY < r) { nextY = r; pet.vy = 0; }
      if (nextY >= height - r - 0.2 && Math.abs(pet.vx) < 4) pet.vx = 30;
      pet.x = nextX; pet.y = nextY;
      if (pet.species === 'waldo') {
        pet.paintings ??= [];
        pet.nextPaintingAtMs ??= run.elapsedMs + run.mechanics.waldoPetPaintingIntervalMs;
        if (run.elapsedMs >= pet.nextPaintingAtMs) {
          const segments = [
            ...run.walls.filter(wall => !wall.active).map(wall => ({ wallId: wall.id, axis: wall.axis, at: wall.at, low: wall.low, high: wall.high })),
            { wallId: -1, axis: 'vertical' as const, at: 0, low: 0, high: height },
            { wallId: -2, axis: 'vertical' as const, at: width, low: 0, high: height },
            { wallId: -3, axis: 'horizontal' as const, at: 0, low: 0, high: width },
            { wallId: -4, axis: 'horizontal' as const, at: height, low: 0, high: width },
          ];
          const nearest = segments.map(segment => {
            const along = Math.max(segment.low + 12, Math.min(segment.high - 12, segment.axis === 'vertical' ? pet.y : pet.x));
            const distance = segment.axis === 'vertical' ? Math.hypot(pet.x - segment.at, pet.y - along) : Math.hypot(pet.x - along, pet.y - segment.at);
            return { ...segment, along, distance };
          }).sort((a, b) => a.distance - b.distance)[0];
          if (nearest && nearest.distance <= 34) {
            const paintingId = run.nextId++;
            pet.paintings.push({ id: paintingId, wallId: nearest.wallId, axis: nearest.axis, at: nearest.at, along: nearest.along, style: Math.floor(Math.random() * 5) });
            pet.task = 'paint'; pet.taskUntilMs = run.elapsedMs + 3200;
            run = awardCredits(run, run.mechanics.waldoPetPaintingCredits, pet.x, pet.y);
            run.petNotice = `WALDO HUNG A PAINTING · +${run.mechanics.waldoPetPaintingCredits} CREDITS`;
            run.petNoticeUntilMs = run.elapsedMs + 2200;
            pet.nextPaintingAtMs = run.elapsedMs + run.mechanics.waldoPetPaintingIntervalMs;
          }
        }
      }
      const hit = run.balls.some(ball => Math.hypot(ball.x - pet.x, ball.y - pet.y) <= ball.r + r);
      if (hit) {
        pet.health -= 1;
        if (pet.health <= 0) {
          run.captureEvents.push({ id: run.nextId++, kind: 'petLost', x: pet.x, y: pet.y });
          run.petNotice = `${pet.name} WAS LOST`;
          run.petNoticeUntilMs = run.elapsedMs + 3600;
          continue;
        }
        pet.deployed = false; pet.vx = 0; pet.vy = 0;
      }
    }
    pets.push(pet);
  }
  run.pets = pets;
  if (run.petNoticeUntilMs <= run.elapsedMs) run.petNotice = null;
}

export function newRun(level = 1, boardWidth = 900, boardHeight = 1100, waldoRequested = false): Run {
  const count = MECHANICS.startingBalls + (level - 1) * MECHANICS.ballsAddedPerLevel;
  const gridCols = Math.max(48, Math.round(48 * boardWidth / 900));
  const gridRows = Math.max(72, Math.round(72 * boardHeight / 1100));
  const pictureEvent = nextPictureEvent(waldoRequested);
  const balls: Ball[] = [];
  for (let i = 0; i < count; i++) {
    const speed = randomBetween(MECHANICS.ballSpeedMin, MECHANICS.ballSpeedMax);
    const angle = Math.random() * Math.PI * 2;
    balls.push(applyBallModifier({ balls, walls: [], mechanics: MECHANICS }, { id: i + 1, x: randomBetween(boardWidth * 0.1, boardWidth * 0.9), y: randomBetween(boardHeight * 0.1, boardHeight * 0.9), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: MECHANICS.ballRadius }));
  }
  return {
    level, lives: MECHANICS.startLives, lifeCapacity: Math.max(MECHANICS.startLives, MECHANICS.lifeStorageBaseCapacity), lifeCapacityPurchases: 0, speedCapacityBonus: 0, speedCapacityPurchases: 0, ramCapacityBonus: 0, ramCapacityPurchases: 0, overflowJobs: [], overflowSuccessChance: MECHANICS.overflowBaseSuccessChance, overflowUpgradePurchases: 0, claimed: 0, claimMask: Array(gridCols * gridRows).fill(0), walls: [], powerups: [], speedCharges: 0, ramCharges: 0, merchantTokens: 0, credits: 0, powerBars: 0, powerBarsPurchased: 0, merchantUpgrades: { life: 0, speed: 0, ram: 0, treasure: 0, waldo: 0 }, petEggs: 0, petEggVisitProgress: 0, pets: [], petIncubations: [], isotypesContained: false, isotypesNoticeUntilMs: 0, petNotice: null, petNoticeUntilMs: 0, levelClearPending: false, speedReadyUntil: null, captureEvents: [], wallBreakEvents: [], territoryGainEvents: [], creditGainEvents: [], treasureEligible: Math.random() < MECHANICS.treasureLevelEligibilityChance, treasureHuntPending: false, treasureHunt: null, pictureEvent, waldoEventPending: waldoRequested && !pictureEvent?.isWaldo, waldoEligible: Math.random() >= MECHANICS.waldoIneligibleChance, mechanics: getMechanicsSettings(), boardWidth, boardHeight, gridCols, gridRows, nextId: count + 1,
    balls,
    elapsedMs: 0,
    spawnInMs: Math.floor(randomBetween(MECHANICS.powerupSpawnEverySecondsMin, MECHANICS.powerupSpawnEverySecondsMax + 1)) * 1000,
  };
}

/** Rescale a saved board uniformly in game units to fit a new display aspect. */
export function resizeRunBoard(run: Run, boardWidth: number, boardHeight: number): Run {
  const oldWidth = run.boardWidth || 900, oldHeight = run.boardHeight || 1100;
  const sx = boardWidth / oldWidth, sy = boardHeight / oldHeight;
  const oldCols = run.gridCols || 48, oldRows = run.gridRows || 72;
  const gridCols = Math.max(48, Math.round(48 * boardWidth / 900));
  const gridRows = Math.max(72, Math.round(72 * boardHeight / 1100));
  if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001 && oldCols === gridCols && oldRows === gridRows) return run;
  const claimMask = Array.from({ length: gridRows }, (_, row) => Array.from({ length: gridCols }, (_, col) => {
    const oldCol = Math.min(oldCols - 1, Math.floor((col + 0.5) / gridCols * oldCols));
    const oldRow = Math.min(oldRows - 1, Math.floor((row + 0.5) / gridRows * oldRows));
    return run.claimMask[oldRow * oldCols + oldCol] ?? 0;
  })).flat();
  return {
    ...run,
    boardWidth, boardHeight, gridCols, gridRows, claimMask,
    balls: run.balls.map(ball => ({ ...ball, x: ball.x * sx, y: ball.y * sy })),
    powerups: run.powerups.map(power => ({ ...power, x: power.x * sx, y: power.y * sy })),
    overflowJobs: (run.overflowJobs ?? []).map(job => ({ ...job, sourceX: job.sourceX * sx, sourceY: job.sourceY * sy })),
    pets: (run.pets ?? []).map(pet => ({ ...pet, x: pet.x * sx, y: pet.y * sy, paintings: pet.paintings?.map(painting => ({ ...painting, at: painting.at * (painting.axis === 'vertical' ? sx : sy), along: painting.along * (painting.axis === 'vertical' ? sy : sx) })) })),
    walls: run.walls.map(wall => wall.axis === 'vertical'
      ? { ...wall, at: wall.at * sx, center: wall.center * sy, low: wall.low * sy, high: wall.high * sy, lowTarget: wall.lowTarget * sy, highTarget: wall.highTarget * sy }
      : { ...wall, at: wall.at * sy, center: wall.center * sx, low: wall.low * sx, high: wall.high * sx, lowTarget: wall.lowTarget * sx, highTarget: wall.highTarget * sx }),
    treasureHunt: run.treasureHunt ? { ...run.treasureHunt, x: run.treasureHunt.x * sx, y: run.treasureHunt.y * sy } : null,
    captureEvents: run.captureEvents.map(event => ({ ...event, x: event.x * sx, y: event.y * sy })),
    wallBreakEvents: (run.wallBreakEvents ?? []).map(event => ({ ...event, x: event.x * sx, y: event.y * sy,
      at: event.at === undefined ? undefined : event.at * (event.axis === 'vertical' ? sx : sy),
      low: event.low === undefined ? undefined : event.low * (event.axis === 'vertical' ? sy : sx),
      high: event.high === undefined ? undefined : event.high * (event.axis === 'vertical' ? sy : sx),
    })),
    territoryGainEvents: (run.territoryGainEvents ?? []).map(event => ({ ...event, x: event.x * sx, y: event.y * sy, wallX: event.wallX === undefined ? undefined : event.wallX * sx, wallY: event.wallY === undefined ? undefined : event.wallY * sy, areaX: event.areaX === undefined ? undefined : event.areaX * sx, areaY: event.areaY === undefined ? undefined : event.areaY * sy })),
  };
}

function pointOnWall(w: Wall, x: number, y: number, radius: number) {
  // Match collisions to the rendered projectile circle plus the wall's 4-unit width.
  const reach = radius + 2;
  if (w.axis === 'vertical') return Math.abs(x - w.at) <= reach && y + radius >= w.low && y - radius <= w.high;
  return Math.abs(y - w.at) <= reach && x + radius >= w.low && x - radius <= w.high;
}

function isClaimed(run: Run, x: number, y: number, width: number, height: number) {
  if (x < 0 || y < 0 || x >= width || y >= height) return false;
  const cols = run.gridCols || 48, rows = run.gridRows || 72;
  const col = Math.min(cols - 1, Math.floor(x / width * cols));
  const row = Math.min(rows - 1, Math.floor(y / height * rows));
  return !!run.claimMask?.[row * cols + col];
}

export function everyBallHasItsOwnRegion(run: Run, width: number, height: number) {
  if (run.balls.length === 0) return false;
  const cols = run.gridCols || 48, rows = run.gridRows || 72;
  const solidWalls = run.walls.filter(wall => !wall.active);
  const labels = new Int32Array(cols * rows);
  let nextLabel = 0;
  const crossesWall = (x: number, y: number, nx: number, ny: number) => {
    const mx = (x + nx + 1) / 2 * width / cols, my = (y + ny + 1) / 2 * height / rows;
    return solidWalls.some(wall => x !== nx
      ? wall.axis === 'vertical' && Math.abs(wall.at - Math.max(x, nx) * width / cols) < width / cols * 0.7 && my >= wall.low && my <= wall.high
      : wall.axis === 'horizontal' && Math.abs(wall.at - Math.max(y, ny) * height / rows) < height / rows * 0.7 && mx >= wall.low && mx <= wall.high);
  };
  const queue = new Int32Array(cols * rows);
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || run.claimMask[start]) continue;
    const label = ++nextLabel;
    let head = 0, tail = 0;
    queue[tail++] = start; labels[start] = label;
    while (head < tail) {
      const cell = queue[head++], x = cell % cols, y = Math.floor(cell / cols);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]] as const) {
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || crossesWall(x, y, nx, ny)) continue;
        const neighbor = ny * cols + nx;
        if (!labels[neighbor] && !run.claimMask[neighbor]) { labels[neighbor] = label; queue[tail++] = neighbor; }
      }
    }
  }
  const occupied = run.balls.map(ball => {
    const col = Math.max(0, Math.min(cols - 1, Math.floor(ball.x / width * cols)));
    const row = Math.max(0, Math.min(rows - 1, Math.floor(ball.y / height * rows)));
    return labels[row * cols + col];
  });
  return occupied.every(label => label > 0) && new Set(occupied).size === occupied.length;
}

function overlapsClaimed(run: Run, x: number, y: number, radius: number, width: number, height: number) {
  const offset = radius * 0.72;
  return [[0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius], [offset, offset], [offset, -offset], [-offset, offset], [-offset, -offset]]
    .some(([dx, dy]) => isClaimed(run, x + dx, y + dy, width, height));
}

function randomUnclaimedPoint(run: Run, width: number, height: number) {
  const openCells: number[] = [];
  for (let index = 0; index < run.claimMask.length; index++) if (!run.claimMask[index]) openCells.push(index);
  if (!openCells.length) return { x: width * 0.5, y: height * 0.5 };
  const cell = openCells[Math.floor(Math.random() * openCells.length)];
  return { x: ((cell % run.gridCols) + 0.5) * width / run.gridCols, y: (Math.floor(cell / run.gridCols) + 0.5) * height / run.gridRows };
}

/** Precomputes which adjacent grid cells are separated by solid walls. This keeps
 * territory flood fills linear in grid size instead of rescanning every wall per edge. */
function buildWallBarrierGrid(walls: Wall[], width: number, height: number, cols: number, rows: number, mode: 'edge-tolerance' | 'cell-centers') {
  const stepX = width / cols, stepY = height / rows;
  const vertical = new Uint8Array(rows * Math.max(0, cols - 1));
  const horizontal = new Uint8Array(Math.max(0, rows - 1) * cols);
  for (const wall of walls) {
    if (wall.axis === 'vertical') {
      const minEdge = mode === 'edge-tolerance' ? Math.ceil((wall.at - stepX * 0.7) / stepX) : Math.ceil(wall.at / stepX - 0.5);
      const maxEdge = mode === 'edge-tolerance' ? Math.floor((wall.at + stepX * 0.7) / stepX) : Math.floor(wall.at / stepX + 0.5);
      for (let edge = Math.max(1, minEdge); edge <= Math.min(cols - 1, maxEdge); edge++) {
        const edgeX = edge * stepX;
        if (mode === 'edge-tolerance' && Math.abs(wall.at - edgeX) >= stepX * 0.7) continue;
        for (let row = 0; row < rows; row++) {
          const y = (row + 0.5) * stepY;
          // Cell-center coverage closes endpoint gaps in the discrete flood grid
          // while preserving the actual wall segment's extent.
          if (y >= wall.low - stepY * 0.5 && y <= wall.high + stepY * 0.5) vertical[row * (cols - 1) + edge - 1] = 1;
        }
      }
    } else {
      const minEdge = mode === 'edge-tolerance' ? Math.ceil((wall.at - stepY * 0.7) / stepY) : Math.ceil(wall.at / stepY - 0.5);
      const maxEdge = mode === 'edge-tolerance' ? Math.floor((wall.at + stepY * 0.7) / stepY) : Math.floor(wall.at / stepY + 0.5);
      for (let edge = Math.max(1, minEdge); edge <= Math.min(rows - 1, maxEdge); edge++) {
        const edgeY = edge * stepY;
        if (mode === 'edge-tolerance' && Math.abs(wall.at - edgeY) >= stepY * 0.7) continue;
        for (let col = 0; col < cols; col++) {
          const x = (col + 0.5) * stepX;
          if (x >= wall.low - stepX * 0.5 && x <= wall.high + stepX * 0.5) horizontal[(edge - 1) * cols + col] = 1;
        }
      }
    }
  }
  return { vertical, horizontal };
}

/** Places one capture-spawned ball in the largest currently open component. */
function spawnCaptureBall(run: Run, width: number, height: number): Run {
  const cols = run.gridCols || 48, rows = run.gridRows || 72;
  const stepX = width / cols, stepY = height / rows;
  const solidWalls = run.walls.filter(wall => !wall.active);
  const visited = new Uint8Array(cols * rows);
  const queue = new Int32Array(cols * rows);
  const components: number[][] = [];
  const barriers = buildWallBarrierGrid(solidWalls, width, height, cols, rows, 'edge-tolerance');
  const blocked = (x1: number, y1: number, x2: number, y2: number) => x1 !== x2
    ? !!barriers.vertical[y1 * (cols - 1) + Math.min(x1, x2)]
    : !!barriers.horizontal[Math.min(y1, y2) * cols + x1];
  for (let start = 0; start < cols * rows; start++) {
    if (visited[start] || run.claimMask[start]) continue;
    let head = 0, tail = 0;
    const cells: number[] = [];
    visited[start] = 1; queue[tail++] = start;
    while (head < tail) {
      const index = queue[head++], x = index % cols, y = Math.floor(index / cols);
      cells.push(index);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]] as const) {
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const next = ny * cols + nx;
        if (!visited[next] && !run.claimMask[next] && !blocked(x, y, nx, ny)) { visited[next] = 1; queue[tail++] = next; }
      }
    }
    components.push(cells);
  }
  if (!components.length) return run;
  const largestSize = Math.max(...components.map(component => component.length));
  const largestComponents = components.filter(component => component.length === largestSize);
  const cells = largestComponents[Math.floor(Math.random() * largestComponents.length)];
  const radius = run.mechanics.ballRadius;
  const offset = Math.floor(Math.random() * cells.length);
  for (let index = 0; index < cells.length; index++) {
    const cell = cells[(offset + index) % cells.length];
    const x = ((cell % cols) + 0.5) * stepX, y = (Math.floor(cell / cols) + 0.5) * stepY;
    if (x < radius || x > width - radius || y < radius || y > height - radius || overlapsClaimed(run, x, y, radius, width, height)) continue;
    if (solidWalls.some(wall => pointOnWall(wall, x, y, radius))) continue;
    if (run.balls.some(ball => Math.hypot(ball.x - x, ball.y - y) < ball.r + radius + 2)) continue;
    if (run.powerups.some(power => Math.hypot(power.x - x, power.y - y) < powerupCollisionRadius(power.kind, run.mechanics) + radius + 2)) continue;
    const speed = randomBetween(run.mechanics.ballSpeedMin, run.mechanics.ballSpeedMax);
    const angle = Math.random() * Math.PI * 2;
    const ball = applyBallModifier(run, { id: run.nextId, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: radius });
    return { ...run, balls: [...run.balls, ball], nextId: run.nextId + 1 };
  }
  return run;
}

/** Flood-fill from all metal balls: every region cut off by solidified walls with no ball in it is claimed, whichever side of a new line it occupies. */
export function claimEmptyRegions(run: Run, width: number, height: number, additionalCaptured: PowerUp[] = [], skeweredIds = new Set<number>(), skeweredWalls = new Map<number, SkeweredWall>()): Run {
  const cols = run.gridCols || 48;
  const rows = run.gridRows || 72;
  const walls = run.walls.filter(w => !w.active);
  const seen = new Uint8Array(cols * rows);
  const queue = new Int32Array(cols * rows);
  let head = 0, tail = 0;
  const cell = (x: number, y: number) => y * cols + x;
  for (const b of run.balls) {
    const x = Math.max(0, Math.min(cols - 1, Math.floor(b.x / width * cols)));
    const y = Math.max(0, Math.min(rows - 1, Math.floor(b.y / height * rows)));
    const i = cell(x, y);
    if (!seen[i]) { seen[i] = 1; queue[tail++] = i; }
  }
  const barriers = buildWallBarrierGrid(walls, width, height, cols, rows, 'edge-tolerance');
  const blocked = (x1: number, y1: number, x2: number, y2: number) => x1 !== x2
    ? !!barriers.vertical[y1 * (cols - 1) + Math.min(x1, x2)]
    : !!barriers.horizontal[Math.min(y1, y2) * cols + x1];
  while (head < tail) {
    const i = queue[head++], x = i % cols, y = Math.floor(i / cols);
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]] as const) {
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const ni = cell(nx, ny);
      if (!seen[ni] && !blocked(x, y, nx, ny)) { seen[ni] = 1; queue[tail++] = ni; }
    }
  }
  const claimMask = Array.from(seen, (v, i) => v ? (run.claimMask?.[i] ?? 0) : 1);
  const claimedCells = claimMask.reduce((total, value) => total + value, 0);
  const newClaimed = claimedCells / (cols * rows) * 100;
  const open = (x: number, y: number) => {
    const cx = Math.max(0, Math.min(cols - 1, Math.floor(x / width * cols)));
    const cy = Math.max(0, Math.min(rows - 1, Math.floor(y / height * rows)));
    return !!seen[cell(cx, cy)];
  };
  const newlyEnclosed = run.powerups.filter(power => {
    if (open(power.x, power.y)) return false;
    if (power.kind === 'bubble' || power.kind === 'treasure') return !isClaimed(run, power.x, power.y, width, height);
    return true;
  });
  const captured = [...new Map([...newlyEnclosed, ...additionalCaptured].map(power => [power.id, power])).values()];
  return applyPickupCaptures({ ...run, claimed: newClaimed, claimMask }, captured, skeweredIds, skeweredWalls);
}

function bubbleSpawnPoints(run: Run, count: number) {
  const spawned: PowerUp[] = [];
  const radius = powerupRadius('bubble', run.mechanics);
  for (let index = 0; index < count; index++) {
    let point: { x: number; y: number } | undefined;
    for (let attempt = 0; attempt < 120; attempt++) {
      const candidate = { x: randomBetween(radius + 8, run.boardWidth - radius - 8), y: randomBetween(radius + 8, run.boardHeight - radius - 8) };
      if (isClaimed(run, candidate.x, candidate.y, run.boardWidth, run.boardHeight)) continue;
      if (run.balls.some(ball => Math.hypot(ball.x - candidate.x, ball.y - candidate.y) < ball.r + radius + 10)) continue;
      if ([...run.powerups, ...spawned].some(power => Math.hypot(power.x - candidate.x, power.y - candidate.y) < radius + powerupRadius(power.kind, run.mechanics) + 10)) continue;
      point = candidate;
      break;
    }
    if (!point) continue;
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(36, 66);
    spawned.push({ id: run.nextId + spawned.length, kind: 'bubble', ...point, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
  }
  return spawned;
}

function queueOverflowJobs(run: Run, overflowed: { kind: PowerKind; x: number; y: number }[], firstId: number) {
  let nextId = firstId;
  const jobs: OverflowJob[] = [];
  for (const resource of overflowed) {
    const credits = Math.max(0, Math.floor(run.mechanics.overflowCreditValues[resource.kind] ?? 0));
    if (!credits) continue;
    jobs.push({ id: nextId++, kind: resource.kind, credits, remainingMs: Math.max(0, run.mechanics.overflowProcessingMs), sourceX: resource.x, sourceY: resource.y });
  }
  return { jobs, nextId };
}

function applyPickupCaptures(run: Run, captured: PowerUp[], skeweredIds = new Set<number>(), skeweredWalls = new Map<number, SkeweredWall>()): Run {
  if (!captured.length) return run;
  const capturedIds = new Set(captured.map(p => p.id));
  const creditsPerBubble = run.mechanics.bubbleCreditsPerPop;
  const creditPayout = (power: PowerUp) => power.kind === 'credit' ? Math.max(0, run.mechanics.creditPickupBaseAmount) + Math.max(0, power.bounceCredits ?? 0) : 0;
  const captureEvents: CaptureEvent[] = captured.map((p, index) => ({ id: run.nextId + index, x: p.x, y: p.y, kind: p.kind, amount: p.kind === 'bubble' ? creditsPerBubble : p.kind === 'credit' ? creditPayout(p) : undefined, skewered: skeweredIds.has(p.id), skeweredAxis: skeweredWalls.get(p.id)?.axis, skeweredWall: skeweredWalls.get(p.id) }));
  const regularCombo = captured.filter(p => p.kind !== 'bubble');
  const combo = regularCombo.length > 1;
  let nextId = run.nextId + captureEvents.length;
  let spawnedBubbles: PowerUp[] = [];
  if (combo) {
    const x = regularCombo.reduce((sum, power) => sum + power.x, 0) / regularCombo.length;
    const y = regularCombo.reduce((sum, power) => sum + power.y, 0) / regularCombo.length;
    captureEvents.push({ id: nextId++, x, y, kind: 'combo', comboCount: regularCombo.length });
    const variance = Math.max(0, Math.floor(run.mechanics.comboBubbleCountVariance));
    const adjustment = Math.floor(randomBetween(-variance, variance + 1));
    const bubbleCount = Math.max(1, regularCombo.length + adjustment);
    spawnedBubbles = bubbleSpawnPoints({ ...run, powerups: run.powerups.filter(power => !capturedIds.has(power.id)), nextId }, bubbleCount);
    nextId += spawnedBubbles.length;
  }
  const payouts = captured.map(power => ({ power, amount: power.kind === 'bubble' ? creditsPerBubble : creditPayout(power) })).filter(payout => payout.amount > 0);
  const creditGainEvents = [...run.creditGainEvents, ...payouts.map((payout, index) => ({ id: nextId + index, x: payout.power.x, y: payout.power.y, amount: payout.amount }))];
  nextId += payouts.length;
  const lifePowerups = captured.filter(power => power.kind === 'life');
  const speedPowerups = captured.filter(power => power.kind === 'speed');
  const ramPowerups = captured.filter(power => power.kind === 'ram');
  const overflowResources = [
    ...lifePowerups.slice(Math.max(0, run.lifeCapacity - run.lives)),
    ...speedPowerups.slice(Math.max(0, chargeCapacity(run, 'speed') - run.speedCharges)),
    ...ramPowerups.slice(Math.max(0, chargeCapacity(run, 'ram') - run.ramCharges)),
  ];
  const queuedOverflow = queueOverflowJobs(run, overflowResources.map(power => ({ kind: power.kind, x: power.x, y: power.y })), nextId);
  const overflowJobs = [...(run.overflowJobs ?? []), ...queuedOverflow.jobs];
  nextId = queuedOverflow.nextId;
  return { ...run,
    lives: Math.min(run.lifeCapacity, run.lives + lifePowerups.length),
    speedCharges: Math.min(chargeCapacity(run, 'speed'), run.speedCharges + speedPowerups.length),
    ramCharges: Math.min(chargeCapacity(run, 'ram'), run.ramCharges + ramPowerups.length),
    waldoEventPending: run.waldoEventPending || captured.some(p => p.kind === 'waldo'),
    merchantTokens: Math.min(1, run.merchantTokens + captured.filter(p => p.kind === 'merchant').length),
    treasureHuntPending: run.treasureHuntPending || captured.some(p => p.kind === 'treasure'),
    credits: run.credits + payouts.reduce((sum, payout) => sum + payout.amount, 0), creditGainEvents, overflowJobs,
    petEggs: run.petEggs + captured.filter(p => p.kind === 'engi-egg').length,
    captureEvents: [...run.captureEvents, ...captureEvents], nextId,
    powerups: [...run.powerups.filter(p => !capturedIds.has(p.id)), ...spawnedBubbles],
  };
}

function awardCredits(run: Run, amount: number, x: number, y: number): Run {
  const payout = Math.max(0, Math.floor(amount));
  if (!payout) return run;
  return { ...run, credits: run.credits + payout, creditGainEvents: [...run.creditGainEvents, { id: run.nextId, x, y, amount: payout }], nextId: run.nextId + 1 };
}

function advanceOverflowProcessor(run: Run, dt: number): Run {
  const jobs = run.overflowJobs ?? [];
  if (!jobs.length) return run;
  const [active, ...queued] = jobs;
  active.remainingMs -= dt;
  if (active.remainingMs > 0) return { ...run, overflowJobs: [active, ...queued] };
  const completed = { ...run, overflowJobs: queued };
  if (Math.random() * 100 < run.overflowSuccessChance) return awardCredits(completed, active.credits, active.sourceX, active.sourceY);
  return { ...completed, captureEvents: [...completed.captureEvents, { id: completed.nextId, x: active.sourceX, y: active.sourceY, kind: 'overflowFailed' }], nextId: completed.nextId + 1 };
}

export function tapPickupAt(run: Run, x: number, y: number): Run {
  const target = [...run.powerups].reverse().find(power => !power.phaseChest && (power.kind === 'bubble' || (power.kind === 'treasure' && isClaimed(run, power.x, power.y, run.boardWidth, run.boardHeight))) && Math.hypot(power.x - x, power.y - y) <= powerupCollisionRadius(power.kind, run.mechanics));
  if (!target) return run;
  return applyPickupCaptures(run, [target]);
}

/** Pickups that drift into already-claimed cells are collected immediately. */
function collectClaimedPickups(run: Run, width: number, height: number): Run {
  const captured = run.powerups.filter(p => p.kind !== 'bubble' && p.kind !== 'treasure' && isClaimed(run, p.x, p.y, width, height));
  return applyPickupCaptures(run, captured);
}

function pickupIntersectsWall(powerup: PowerUp, wall: Wall, settings: MechanicsSettings = MECHANICS) {
  const radius = powerupRadius(powerup.kind, settings) + 2;
  return wall.axis === 'vertical'
    ? Math.abs(powerup.x - wall.at) <= radius && powerup.y >= wall.low - radius && powerup.y <= wall.high + radius
    : Math.abs(powerup.y - wall.at) <= radius && powerup.x >= wall.low - radius && powerup.x <= wall.high + radius;
}

export function weightedPowerKind(merchantAllowed = true, settings: MechanicsSettings = MECHANICS): PowerKind {
  return randomPowerKind(true, merchantAllowed, settings);
}

function nearestAnchor(run: Run, axis: Wall['axis'], at: number, start: number, direction: -1 | 1, extent: number) {
  let stop = direction < 0 ? 0 : extent;
  for (const w of run.walls) {
    if (w.active) continue;
    if (axis === 'vertical' && w.axis === 'horizontal' && at >= w.low && at <= w.high) {
      if (direction < 0 && w.at < start && w.at > stop) stop = w.at;
      if (direction > 0 && w.at > start && w.at < stop) stop = w.at;
    }
    if (axis === 'horizontal' && w.axis === 'vertical' && at >= w.low && at <= w.high) {
      if (direction < 0 && w.at < start && w.at > stop) stop = w.at;
      if (direction > 0 && w.at > start && w.at < stop) stop = w.at;
    }
  }
  return stop;
}

export function startWall(run: Run, x: number, y: number, axis: Wall['axis']): Run {
  const width = run.boardWidth || 900, height = run.boardHeight || 1100;
  if (run.ended || isClaimed(run, x, y, width, height) || run.walls.filter(w => w.active).length >= run.mechanics.maximumActiveWalls) return run;
  const at = axis === 'vertical' ? x : y;
  const start = axis === 'vertical' ? y : x;
  const extent = axis === 'vertical' ? height : width;
  const low = Math.abs(start) < 3 ? 0 : nearestAnchor(run, axis, at, start, -1, extent);
  const high = Math.abs(extent - start) < 3 ? extent : nearestAnchor(run, axis, at, start, 1, extent);
  const noCapture = run.speedReadyUntil !== null && run.speedReadyUntil > run.elapsedMs;
  const walls = [...run.walls, {
    id: run.nextId, axis, at, center: start, low: start, high: start, lowTarget: low, highTarget: high,
    lowState: Math.abs(low - start) < 0.1 ? 'grounded' as const : 'growing' as const,
    highState: Math.abs(high - start) < 0.1 ? 'grounded' as const : 'growing' as const,
    connections: [], active: true, speedMultiplier: 1, noCapture,
  }];
  const phaseSettings = run.mechanics.ballModifiers.phase;
  let balls = run.balls;
  const phaseRulePasses = !phaseSettings.spawnRuleEnabled || everyBallHasItsOwnRegion(run, width, height);
  const phaseAlreadyActive = balls.some(ball => ball.modifier === 'phase');
  if (phaseSettings.enabled && phaseRulePasses && !phaseAlreadyActive && balls.length && Math.random() < phaseSettings.spawnChance) {
    const target = Math.floor(Math.random() * balls.length);
    balls = balls.map((ball, index) => index === target ? { ...ball, modifier: 'phase', phaseEndsAtMs: run.elapsedMs + (phaseSettings.phaseDurationMs ?? 8000), skimmerWallId: undefined, skimmerRemainingMs: undefined, skimmerResumeVx: undefined, skimmerResumeVy: undefined, rammed: false } : ball);
  }
  return { ...run, nextId: run.nextId + 1, walls, balls, speedReadyUntil: noCapture ? null : run.speedReadyUntil };
}

export function activateSpeed(run: Run): Run {
  if (run.speedCharges <= 0 || (run.speedReadyUntil !== null && run.speedReadyUntil > run.elapsedMs)) return run;
  const active = run.walls.filter(w => w.active).sort((a, b) => b.id - a.id)[0];
  const multiplier = run.mechanics.speedBoostMultiplier ?? 1.4;
  if (active) return { ...run, speedCharges: run.speedCharges - 1, walls: run.walls.map(w => w.id === active.id ? { ...w, speedMultiplier: w.speedMultiplier * multiplier } : w) };
  return { ...run, speedCharges: run.speedCharges - 1, speedReadyUntil: run.elapsedMs + 6000 };
}

export function ramAt(run: Run, x: number, y: number): Run {
  if (!run.ramCharges) return run;
  const puzzle = run.pictureEvent;
  if (puzzle?.isWaldo && !puzzle.waldoFound && puzzle.waldoX !== undefined && puzzle.waldoY !== undefined
    && isClaimed(run, puzzle.waldoX * run.boardWidth, puzzle.waldoY * run.boardHeight, run.boardWidth, run.boardHeight)
    && Math.hypot(puzzle.waldoX * run.boardWidth - x, puzzle.waldoY * run.boardHeight - y) <= powerupCollisionRadius('waldo', run.mechanics) * 1.35) {
    const foundX = puzzle.waldoX * run.boardWidth, foundY = puzzle.waldoY * run.boardHeight;
    const fireworks: CaptureEvent[] = [{ id: run.nextId, kind: 'waldoFound', x: foundX, y: foundY, amount: 1 }, ...Array.from({ length: 6 }, (_, index) => {
      const angle = index / 6 * Math.PI * 2;
      return { id: run.nextId + index + 1, kind: 'waldoFound' as const, x: Math.max(60, Math.min(run.boardWidth - 60, foundX + Math.cos(angle) * run.boardWidth * 0.22)), y: Math.max(60, Math.min(run.boardHeight - 60, foundY + Math.sin(angle) * run.boardHeight * 0.22)) };
    })];
    const treasure: PowerUp = { id: run.nextId + fireworks.length, kind: 'treasure', x: foundX, y: foundY, vx: 0, vy: 0, despawnAtMs: powerupDespawnAt('treasure', run.elapsedMs, run.mechanics) };
    const rewarded = awardCredits(run, run.mechanics.waldoRewardCredits, foundX, foundY);
    const shiftedFireworks = fireworks.map(event => ({ ...event, id: event.id + 1 }));
    const waldoPet: CompanionPet = { id: rewarded.nextId + fireworks.length + 1, species: 'waldo', name: 'Waldo', skinId: 'classic-waldo', health: 1, maxHealth: 1, level: 1, deployed: false, x: run.boardWidth * 0.5, y: 0, vx: 0, vy: 0, task: 'clean', taskUntilMs: run.elapsedMs + 4200, repairedThisLevel: false, nextPaintingAtMs: run.elapsedMs + run.mechanics.waldoPetPaintingIntervalMs, paintings: [] };
    return { ...rewarded, ramCharges: run.ramCharges - 1, pictureEvent: { ...puzzle, waldoFound: true }, powerups: [...run.powerups, { ...treasure, id: treasure.id + 1 }], pets: [...run.pets, waldoPet], petNotice: 'WALDO JOINED THE CREW', petNoticeUntilMs: run.elapsedMs + 4000, captureEvents: [...run.captureEvents, ...shiftedFireworks], nextId: waldoPet.id + 1 };
  }
  if (run.treasureHunt?.revealed && Math.hypot(run.treasureHunt.x - x, run.treasureHunt.y - y) <= powerupRadius('treasure', run.mechanics)) {
    if (run.ramCharges >= 3) {
      const count = Math.floor(randomBetween(run.mechanics.treasureRewardMin, run.mechanics.treasureRewardMax + 1));
      const rewards = Array.from({ length: count }, () => randomPowerKind(true, run.merchantTokens === 0, run.mechanics));
      const rewardEvents: CaptureEvent[] = rewards.map((kind, index) => ({ id: run.nextId + index + 2, x: randomBetween(40, run.boardWidth - 40), y: randomBetween(40, run.boardHeight - 40), kind }));
      const rewardCreditPayouts = rewards.map((kind, index) => ({ kind, event: rewardEvents[index], amount: kind === 'bubble' ? run.mechanics.bubbleCreditsPerPop : kind === 'credit' ? run.mechanics.creditPickupBaseAmount : 0 })).filter(reward => reward.amount > 0);
      const creditGainEvents = [...(run.creditGainEvents ?? []), ...rewardCreditPayouts.map((reward, index) => ({ id: run.nextId + count + 2 + index, x: reward.event.x, y: reward.event.y, amount: reward.amount }))];
      const rewardResources = rewards.flatMap((kind, index) => kind === 'life' || kind === 'speed' || kind === 'ram' ? [{ kind, x: rewardEvents[index].x, y: rewardEvents[index].y }] : []);
      const overflowStartId = run.nextId + count + 2 + rewardCreditPayouts.length;
      const afterRamSpend = { ...run, ramCharges: run.ramCharges - 3 };
      const overflowResources = [
        ...rewardResources.filter(reward => reward.kind === 'life').slice(Math.max(0, run.lifeCapacity - run.lives)),
        ...rewardResources.filter(reward => reward.kind === 'speed').slice(Math.max(0, chargeCapacity(run, 'speed') - run.speedCharges)),
        ...rewardResources.filter(reward => reward.kind === 'ram').slice(Math.max(0, chargeCapacity(run, 'ram') - afterRamSpend.ramCharges)),
      ];
      const queuedOverflow = queueOverflowJobs(run, overflowResources, overflowStartId);
      return { ...run, treasureHunt: null,
        lives: Math.min(run.lifeCapacity, run.lives + rewards.filter(kind => kind === 'life').length),
        speedCharges: Math.min(chargeCapacity(run, 'speed'), run.speedCharges + rewards.filter(kind => kind === 'speed').length),
        ramCharges: Math.min(chargeCapacity(run, 'ram'), afterRamSpend.ramCharges + rewards.filter(kind => kind === 'ram').length),
        merchantTokens: Math.min(1, run.merchantTokens + rewards.filter(kind => kind === 'merchant').length),
        treasureHuntPending: run.treasureHuntPending || rewards.includes('treasure'),
        credits: run.credits + rewardCreditPayouts.reduce((sum, reward) => sum + reward.amount, 0), creditGainEvents,
        overflowJobs: [...(run.overflowJobs ?? []), ...queuedOverflow.jobs],
        captureEvents: [...run.captureEvents, { id: run.nextId, x, y, kind: 'ramBlast' }, { id: run.nextId + 1, x, y, kind: 'jackpot' }, ...rewardEvents], nextId: queuedOverflow.nextId };
    }
    return ramMissAt(run, x, y);
  }
  const target = run.balls.find(b => Math.hypot(b.x - x, b.y - y) <= b.r);
  if (target) return { ...run, ramCharges: run.ramCharges - 1, balls: run.balls.map(b => b.id === target.id ? { ...b, rammed: true } : b) };
  return ramMissAt(run, x, y);
}

function ramMissAt(run: Run, x: number, y: number): Run {
  const blasted = applyRamBlast(run, x, y);
  return { ...blasted, ramCharges: run.ramCharges - 1 };
}

function applyRamBlast(run: Run, x: number, y: number): Run {
  const impulse = <T extends { id: number; x: number; y: number; vx: number; vy: number }>(projectile: T): T => {
    const dx = projectile.x - x, dy = projectile.y - y;
    const distance = Math.hypot(dx, dy);
    const radius = run.mechanics.missExplosionRadius;
    if (distance > radius || radius <= 0) return projectile;
    const angle = distance > 0 ? Math.atan2(dy, dx) : (projectile.id * 2.399963229728653) % (Math.PI * 2);
    const falloff = 1 - distance / radius;
    const magnitude = run.mechanics.missExplosionStrength * falloff;
    return { ...projectile, vx: projectile.vx + Math.cos(angle) * magnitude, vy: projectile.vy + Math.sin(angle) * magnitude };
  };
  const balls = run.balls.map(impulse);
  const powerups = run.powerups.map(impulse);
  return { ...run, balls, powerups,
    captureEvents: [...run.captureEvents, { id: run.nextId, x, y, kind: 'explosion' }], nextId: run.nextId + 1 };
}

export function stepRun(previous: Run, dt: number, width: number, height: number): Run {
  if (previous.ended || width <= 0 || height <= 0) return previous;
  let run: Run = { ...previous, elapsedMs: previous.elapsedMs + dt, balls: previous.balls.map(b => ({ ...b })), walls: previous.walls.map(w => ({ ...w })), powerups: previous.powerups.map(p => ({ ...p })), overflowJobs: (previous.overflowJobs ?? []).map(job => ({ ...job })), pets: (previous.pets ?? []).map(pet => ({ ...pet })), petIncubations: (previous.petIncubations ?? []).map(incubation => ({ ...incubation })), captureEvents: [], wallBreakEvents: [], territoryGainEvents: [], creditGainEvents: [], speedReadyUntil: previous.speedReadyUntil !== null && previous.speedReadyUntil <= previous.elapsedMs + dt ? null : previous.speedReadyUntil,
    treasureHunt: previous.treasureHunt ? { ...previous.treasureHunt, remainingMs: previous.treasureHunt.remainingMs - dt } : null };
  // Repair interrupted clear saves without freezing the live simulation.
  if (run.levelClearPending && !run.powerups.some(power => power.kind === 'exit')) {
    const point = randomUnclaimedPoint(run, width, height), angle = Math.random() * Math.PI * 2, speed = 70;
    run.powerups.push({ id: run.nextId++, kind: 'exit', ...point, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
  }
  const skimmerRule = run.mechanics.ballModifiers.skimmer.periodic;
  if (run.mechanics.ballModifiers.skimmer.enabled && skimmerRule) run.balls = rollPeriodicModifier(run.balls, 'skimmer', skimmerRule, run.elapsedMs, dt, true);
  run.balls = run.balls.map(ball => {
    if (ball.modifierExpiresAtMs === undefined || ball.modifierExpiresAtMs > run.elapsedMs) return ball;
    const { modifierExpiresAtMs: _expiry, ...rest } = ball;
    return { ...rest, modifier: undefined, vx: ball.skimmerResumeVx ?? ball.vx, vy: ball.skimmerResumeVy ?? ball.vy, skimmerWallId: undefined, skimmerRemainingMs: undefined, skimmerResumeVx: undefined, skimmerResumeVy: undefined };
  });
  if (run.treasureHunt && run.treasureHunt.remainingMs <= 0) run.treasureHunt = null;
  for (const ball of run.balls) {
    if (ball.modifier !== 'phase' || (ball.phaseEndsAtMs ?? Infinity) > run.elapsedMs) continue;
    const { phaseEndsAtMs: _phaseEndsAtMs, ...normalBall } = ball;
    normalBall.modifier = undefined;
    run.balls = run.balls.map(candidate => candidate.id === ball.id ? normalBall : candidate);
    if (!isClaimed(run, ball.x, ball.y, width, height)) continue;
    const radius = run.mechanics.ballModifiers.phase.phaseUnclaimRadius ?? 65;
    const cols = run.gridCols || 48, rows = run.gridRows || 72;
    run.claimMask = run.claimMask.map((claimed, index) => {
      if (!claimed) return 0;
      const x = ((index % cols) + 0.5) * width / cols, y = (Math.floor(index / cols) + 0.5) * height / rows;
      return Math.hypot(x - ball.x, y - ball.y) <= radius ? 0 : 1;
    });
    run.claimed = run.claimMask.reduce((sum, claimed) => sum + claimed, 0) / run.claimMask.length * 100;
    const angle = Math.random() * Math.PI * 2, speed = 70;
    const chestOffset = ball.r + powerupRadius('treasure', run.mechanics) + 8;
    const chestX = Math.max(powerupRadius('treasure', run.mechanics), Math.min(width - powerupRadius('treasure', run.mechanics), ball.x + Math.cos(angle) * chestOffset));
    const chestY = Math.max(powerupRadius('treasure', run.mechanics), Math.min(height - powerupRadius('treasure', run.mechanics), ball.y + Math.sin(angle) * chestOffset));
    run.powerups.push({ id: run.nextId++, x: chestX, y: chestY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, kind: 'treasure', phaseChest: true });
    run.captureEvents.push({ id: run.nextId++, x: ball.x, y: ball.y, kind: 'phaseRupture', amount: radius });
  }
  // Grow each free endpoint toward its nearest grounded wall or board edge.
  run.walls = run.walls.map(w => {
    if (!w.active) return w;
    const delta = run.mechanics.wallGrowthSpeed * w.speedMultiplier * dt / 1000;
    const low = w.lowState === 'growing' ? Math.max(w.lowTarget, w.low - delta) : w.low;
    const high = w.highState === 'growing' ? Math.min(w.highTarget, w.high + delta) : w.high;
    const lowState = w.lowState === 'growing' && low <= w.lowTarget + 0.1 ? 'grounded' : w.lowState;
    const highState = w.highState === 'growing' && high >= w.highTarget - 0.1 ? 'grounded' : w.highState;
    return { ...w, low, high, lowState, highState };
  });

  // Perpendicular active walls connect when their growing spans meet. Stop the
  // endpoints at the junction, but keep the whole connected network breakable.
  const connectWalls = (aId: number, bId: number) => {
    run.walls = run.walls.map(w => w.id === aId || w.id === bId
      ? { ...w, connections: w.connections.includes(w.id === aId ? bId : aId) ? w.connections : [...w.connections, w.id === aId ? bId : aId] }
      : w);
  };
  const clampEndpoint = (wallId: number, side: 'low' | 'high', coordinate: number, otherId: number) => {
    run.walls = run.walls.map(w => {
      if (w.id !== wallId) return w;
      const connection = w.connections.includes(otherId) ? w.connections : [...w.connections, otherId];
      return side === 'low'
        ? { ...w, low: coordinate, lowTarget: coordinate, lowState: 'connected', connections: connection }
        : { ...w, high: coordinate, highTarget: coordinate, highState: 'connected', connections: connection };
    });
  };
  const sideToward = (wall: Wall, coordinate: number): 'low' | 'high' | undefined =>
    coordinate < wall.center - 0.1 ? 'low' : coordinate > wall.center + 0.1 ? 'high' : undefined;
  for (let i = 0; i < run.walls.length; i++) for (let j = i + 1; j < run.walls.length; j++) {
    const a = run.walls[i], b = run.walls[j];
    if (!a.active || !b.active || a.axis === b.axis) continue;
    const vertical = a.axis === 'vertical' ? a : b;
    const horizontal = a.axis === 'horizontal' ? a : b;
    const x = vertical.at, y = horizontal.at;
    if (x < horizontal.low - 0.1 || x > horizontal.high + 0.1 || y < vertical.low - 0.1 || y > vertical.high + 0.1) continue;
    connectWalls(vertical.id, horizontal.id);
    const verticalSide = sideToward(vertical, y);
    if (verticalSide && (verticalSide === 'low' ? vertical.lowState : vertical.highState) === 'growing') {
      clampEndpoint(vertical.id, verticalSide, y, horizontal.id);
    }
    const horizontalSide = sideToward(horizontal, x);
    if (horizontalSide && (horizontalSide === 'low' ? horizontal.lowState : horizontal.highState) === 'growing') {
      clampEndpoint(horizontal.id, horizontalSide, x, vertical.id);
    }
  }

  // A connected network solidifies when all of its endpoints have stopped and
  // it is anchored at two arena edges or the connections form a closed cycle.
  // Cycles matter for redirected walls that are deliberately joined back into
  // themselves; those endpoints are `connected`, not `grounded`.
  const solidify = new Set<number>();
  const visited = new Set<number>();
  for (const wall of run.walls) {
    if (!wall.active || visited.has(wall.id)) continue;
    const component: Wall[] = [];
    const pending = [wall.id];
    while (pending.length) {
      const id = pending.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const member = run.walls.find(w => w.id === id);
      if (!member?.active) continue;
      component.push(member);
      for (const otherId of member.connections) if (!visited.has(otherId)) pending.push(otherId);
    }
    const endpoints = component.flatMap(member => [member.lowState, member.highState]);
    const groundedEnds = endpoints.filter(state => state === 'grounded').length;
    const edgeCount = component.reduce((sum, member) => sum + member.connections.filter(id => component.some(other => other.id === id)).length, 0) / 2;
    const closedLoop = edgeCount >= component.length && component.length > 1;
    if (endpoints.every(state => state !== 'growing') && (groundedEnds >= 2 || closedLoop)) {
      for (const member of component) solidify.add(member.id);
    }
  }
  const broken = new Set<number>();
  const repairedWalls = new Set<number>();
  const breakPoints: { x: number; y: number; axis: Wall['axis']; at: number; low: number; high: number }[] = [];
  const anchorCuts = new Map<number, { wall: Wall; low: number; high: number }>();
  const anchorUsed = new Set<number>();
  for (const b of run.balls) {
    if (b.modifier === 'drifter') {
      const settings = run.mechanics.ballModifiers.drifter;
      const wallTargets = run.walls.filter(wall => wall.active).map(wall => {
        const x = wall.axis === 'vertical' ? wall.at : Math.max(wall.low, Math.min(wall.high, b.x));
        const y = wall.axis === 'horizontal' ? wall.at : Math.max(wall.low, Math.min(wall.high, b.y));
        return { x, y, distance: Math.hypot(x - b.x, y - b.y) };
      });
      const creditTargets = run.powerups.filter(power => power.kind === 'credit').map(power => ({ x: power.x, y: power.y, distance: Math.hypot(power.x - b.x, power.y - b.y) }));
      const targets = [...wallTargets, ...creditTargets].sort((a, c) => a.distance - c.distance);
      const target = targets[0];
      b.drifting = !!target && target.distance <= (settings.attractionRange ?? 360);
      if (b.drifting && target && target.distance > 0) {
        const acceleration = settings.attractionStrength ?? 240;
        b.vx += (target.x - b.x) / target.distance * acceleration * dt / 1000;
        b.vy += (target.y - b.y) / target.distance * acceleration * dt / 1000;
        const speed = Math.hypot(b.vx, b.vy), maxSpeed = run.mechanics.ballSpeedMax * 1.75;
        if (speed > maxSpeed) { b.vx *= maxSpeed / speed; b.vy *= maxSpeed / speed; }
      }
    } else b.drifting = false;
    let skimmingWall = b.skimmerWallId === undefined ? undefined : run.walls.find(wall => wall.id === b.skimmerWallId && !wall.active);
    if (!skimmingWall || (b.skimmerRemainingMs ?? 0) <= dt) {
      if (b.skimmerWallId !== undefined) {
        b.vx = b.skimmerResumeVx ?? b.vx; b.vy = b.skimmerResumeVy ?? b.vy;
        b.skimmerWallId = undefined; b.skimmerRemainingMs = undefined; b.skimmerResumeVx = undefined; b.skimmerResumeVy = undefined;
      }
      skimmingWall = undefined;
    } else b.skimmerRemainingMs = (b.skimmerRemainingMs ?? 0) - dt;
    const oldX = b.x, oldY = b.y;
    let nextX = b.x + b.vx * dt / 1000, nextY = b.y + b.vy * dt / 1000;
    if (skimmingWall?.axis === 'vertical') nextX = skimmingWall.at + (oldX < skimmingWall.at ? -b.r - 2 : b.r + 2);
    if (skimmingWall?.axis === 'horizontal') nextY = skimmingWall.at + (oldY < skimmingWall.at ? -b.r - 2 : b.r + 2);
    if (nextX < b.r || nextX > width - b.r) { b.vx *= -1; nextX = Math.max(b.r, Math.min(width - b.r, nextX)); }
    if (nextY < b.r || nextY > height - b.r) { b.vy *= -1; nextY = Math.max(b.r, Math.min(height - b.r, nextY)); }
    // Captured cells are solid: reflect the ball at their boundary and keep it in open territory.
    if (b.modifier !== 'phase' && overlapsClaimed(run, nextX, oldY, b.r, width, height)) { nextX = oldX; b.vx *= -1; }
    if (b.modifier !== 'phase' && overlapsClaimed(run, nextX, nextY, b.r, width, height)) { nextY = oldY; b.vy *= -1; }
    b.x = nextX; b.y = nextY;
    if (b.modifier === 'phase') continue;
    for (const w of run.walls) {
      if (anchorUsed.has(b.id)) break;
      if (!pointOnWall(w, b.x, b.y, b.r)) continue;
      if (b.rammed) {
        if (w.active) breakPoints.push({ x: b.x, y: b.y, axis: w.axis, at: w.at, low: w.low, high: w.high });
        run.walls = run.walls.filter(candidate => candidate.id !== w.id).map(candidate => ({ ...candidate, connections: candidate.connections.filter(id => id !== w.id) }));
        b.rammed = false;
      }
      else if (b.modifier === 'anchor' && Math.hypot(b.vx, b.vy) >= (run.mechanics.ballModifiers.anchor.breakSpeedThreshold ?? 190) && !anchorCuts.has(w.id)) {
        const along = w.axis === 'vertical' ? b.y : b.x;
        const joins = run.walls.flatMap(other => {
          if (other.id === w.id || other.axis === w.axis) return [];
          const crosses = w.axis === 'vertical'
            ? w.at >= other.low - 0.1 && w.at <= other.high + 0.1
            : other.at >= w.low - 0.1 && other.at <= w.high + 0.1;
          return crosses && other.at >= w.low - 0.1 && other.at <= w.high + 0.1 ? [other.at] : [];
        });
        const clearance = Math.max(3, b.r * 0.35);
        const candidates = [...joins, w.low, w.high].filter(point => point >= w.low - 0.1 && point <= w.high + 0.1 && Math.abs(point - along) >= clearance).sort((a, c) => Math.abs(a - along) - Math.abs(c - along));
        let junction = candidates[0] ?? (along < w.center ? w.high : w.low);
        let cutLow = Math.max(w.low, Math.min(along, junction)), cutHigh = Math.min(w.high, Math.max(along, junction));
        if (cutHigh - cutLow < clearance) { cutLow = Math.max(w.low, along - clearance / 2); cutHigh = Math.min(w.high, along + clearance / 2); }
        anchorCuts.set(w.id, { wall: w, low: cutLow, high: cutHigh });
        breakPoints.push({ x: b.x, y: b.y, axis: w.axis, at: w.at, low: cutLow, high: cutHigh });
        const speed = Math.hypot(b.vx, b.vy), targetSpeed = (run.mechanics.ballModifiers.anchor.breakSpeedThreshold ?? 190) * 0.7;
        const scale = speed > 0 ? targetSpeed / speed : 0;
        b.vx *= scale; b.vy *= scale;
        if (w.axis === 'vertical') b.x = w.at + Math.sign(b.vx || (oldX < w.at ? 1 : -1)) * (b.r + 3);
        else b.y = w.at + Math.sign(b.vy || (oldY < w.at ? 1 : -1)) * (b.r + 3);
        anchorUsed.add(b.id);
      }
      else if (w.active && !broken.has(w.id) && !repairedWalls.has(w.id)) {
        const mechanic = run.pets.find(pet => pet.species === 'engi' && pet.health > 0 && !pet.repairedThisLevel);
        if (mechanic) {
          run.pets = run.pets.map(pet => pet.id === mechanic.id ? { ...pet, repairedThisLevel: true, task: 'weld', taskUntilMs: run.elapsedMs + 1800 } : pet);
          repairedWalls.add(w.id);
          run.captureEvents.push({ id: run.nextId++, x: b.x, y: b.y, kind: 'petRepair' });
          run.petNotice = `${mechanic.name} REPAIRED THE WALL`;
          run.petNoticeUntilMs = run.elapsedMs + 3000;
          if (w.axis === 'vertical') { b.vx = Math.abs(b.vx) * (oldX < w.at ? -1 : 1); b.x = w.at + Math.sign(oldX < w.at ? -1 : 1) * (b.r + 3); }
          else { b.vy = Math.abs(b.vy) * (oldY < w.at ? -1 : 1); b.y = w.at + Math.sign(oldY < w.at ? -1 : 1) * (b.r + 3); }
          break;
        }
        broken.add(w.id); breakPoints.push({ x: b.x, y: b.y, axis: w.axis, at: w.at, low: w.low, high: w.high });
      }
      else if (b.modifier === 'skimmer' && !w.active && b.skimmerWallId === undefined) {
        const speed = Math.max(run.mechanics.ballSpeedMin, Math.hypot(b.vx, b.vy));
        b.skimmerWallId = w.id; b.skimmerRemainingMs = run.mechanics.ballModifiers.skimmer.glideDurationMs ?? 900;
        b.skimmerResumeVx = w.axis === 'vertical' ? (oldX < w.at ? -1 : 1) * Math.abs(b.vx || speed) : b.vx;
        b.skimmerResumeVy = w.axis === 'horizontal' ? (oldY < w.at ? -1 : 1) * Math.abs(b.vy || speed) : b.vy;
        if (w.axis === 'vertical') { b.vx = 0; b.vy = b.vy === 0 ? speed : Math.sign(b.vy) * speed; }
        else { b.vy = 0; b.vx = b.vx === 0 ? speed : Math.sign(b.vx) * speed; }
      }
      else if (w.axis === 'vertical') { b.vx *= -1; b.x += b.vx > 0 ? 4 : -4; }
      else { b.vy *= -1; b.y += b.vy > 0 ? 4 : -4; }
    }
  }
  if (anchorCuts.size) {
    for (const wallId of anchorCuts.keys()) {
      const pending = [wallId], visitedNetwork = new Set<number>();
      while (pending.length) {
        const currentId = pending.pop()!;
        if (visitedNetwork.has(currentId)) continue;
        visitedNetwork.add(currentId); solidify.delete(currentId);
        const member = run.walls.find(wall => wall.id === currentId);
        for (const linkedId of member?.connections ?? []) if (!visitedNetwork.has(linkedId)) pending.push(linkedId);
      }
    }
    const replacements = new Map<number, Wall[]>();
    for (const [id, cut] of anchorCuts) {
      const { wall, low: cutLow, high: cutHigh } = cut;
      const intervals = [[wall.low, cutLow], [cutHigh, wall.high]].filter(([low, high]) => high - low > Math.max(2, wall.active ? 2 : 0));
      const pieces = intervals.map(([low, high], index): Wall => ({
        ...wall,
        id: index === 0 ? wall.id : run.nextId++,
        low, high, center: Math.max(low, Math.min(high, wall.center)),
        lowTarget: low === wall.low ? wall.lowTarget : low,
        highTarget: high === wall.high ? wall.highTarget : high,
        lowState: low === wall.low ? wall.lowState : 'grounded',
        highState: high === wall.high ? wall.highState : 'grounded',
        connections: [],
      }));
      replacements.set(id, pieces);
    }
    run.walls = run.walls.flatMap(wall => replacements.has(wall.id) ? replacements.get(wall.id)! : wall);
    // Rebuild only geometric junctions; this keeps neighboring branches intact while the cut itself stays open.
    run.walls = run.walls.map(wall => ({ ...wall, connections: [] }));
    for (let i = 0; i < run.walls.length; i++) for (let j = i + 1; j < run.walls.length; j++) {
      const a = run.walls[i], b = run.walls[j];
      if (a.axis === b.axis) continue;
      const vertical = a.axis === 'vertical' ? a : b, horizontal = a.axis === 'horizontal' ? a : b;
      if (vertical.at < horizontal.low - 0.1 || vertical.at > horizontal.high + 0.1 || horizontal.at < vertical.low - 0.1 || horizontal.at > vertical.high + 0.1) continue;
      if (!vertical.connections.includes(horizontal.id)) vertical.connections.push(horizontal.id);
      if (!horizontal.connections.includes(vertical.id)) horizontal.connections.push(vertical.id);
    }
    const cols = run.gridCols, rows = run.gridRows;
    const reachable = new Uint8Array(cols * rows), queue: number[] = [];
    const barriers = buildWallBarrierGrid(run.walls.filter(wall => !wall.active), width, height, cols, rows, 'cell-centers');
    const canCross = (from: number, to: number) => {
      const fromX = from % cols, toX = to % cols;
      if (fromX !== toX) return !barriers.vertical[Math.floor(from / cols) * (cols - 1) + Math.min(fromX, toX)];
      return !barriers.horizontal[Math.min(Math.floor(from / cols), Math.floor(to / cols)) * cols + fromX];
    };
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) {
      const index = y * cols + x;
      if (!reachable[index]) { reachable[index] = 1; queue.push(index); }
    }
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head], x = index % cols, y = Math.floor(index / cols);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const neighbor = ny * cols + nx;
        if (reachable[neighbor] || !canCross(index, neighbor)) continue;
        reachable[neighbor] = 1; queue.push(neighbor);
      }
    }
    let reclaimed = 0;
    run.claimMask = run.claimMask.map((claimed, index) => {
      if (claimed && reachable[index]) { reclaimed++; return 0; }
      return claimed;
    });
    if (reclaimed) run.claimed = Math.max(0, run.claimed - reclaimed / (cols * rows) * 100);
  }
  const brokenNetwork = new Set(broken);
  const pendingBroken = [...broken];
  while (pendingBroken.length) {
    const wallId = pendingBroken.pop()!;
    const wall = run.walls.find(w => w.id === wallId);
    for (const connectedId of wall?.connections ?? []) {
      if (!brokenNetwork.has(connectedId) && run.walls.some(w => w.id === connectedId && w.active)) {
        brokenNetwork.add(connectedId);
        pendingBroken.push(connectedId);
      }
    }
  }
  if (brokenNetwork.size) {
    run.walls = run.walls.filter(w => !brokenNetwork.has(w.id));
    run.lives -= broken.size;
    if (run.lives <= 0) run.ended = true;
  }
  if (breakPoints.length) {
    run.wallBreakEvents = breakPoints.map((point, index) => ({ id: run.nextId + index, ...point, style: run.mechanics.wallBreakStyle ?? 'glass-shards' }));
    run.nextId += run.wallBreakEvents.length;
  }
  let completedNow = false;
  let pendingSkewered: PowerUp[] = [];
  let pendingSkeweredWalls = new Map<number, SkeweredWall>();
  const solidifiedWalls: Wall[] = [];
  const solidifiedGroups: Wall[][] = [];
  const grouped = new Set<number>();
  for (const wall of run.walls) {
    if (!solidify.has(wall.id) || grouped.has(wall.id)) continue;
    const group: Wall[] = [], pending = [wall.id];
    while (pending.length) {
      const id = pending.pop()!;
      if (grouped.has(id)) continue;
      grouped.add(id);
      const member = run.walls.find(candidate => candidate.id === id);
      if (!member || !solidify.has(id)) continue;
      group.push(member);
      for (const connectedId of member.connections) if (solidify.has(connectedId) && !grouped.has(connectedId)) pending.push(connectedId);
    }
    if (group.length) solidifiedGroups.push(group);
  }
  run.walls = run.walls.map(w => {
    if (!w.active || !solidify.has(w.id)) return w;
    completedNow = true;
    const fixed = { ...w, active: false };
    solidifiedWalls.push(fixed);
    return fixed;
  });
  if (solidifiedWalls.length) {
    const skewered = run.powerups.filter(p => !p.phaseChest && solidifiedWalls.some(w => pickupIntersectsWall(p, w, run.mechanics)));
    pendingSkewered = skewered;
    pendingSkeweredWalls = new Map(skewered.map(power => {
      const wall = solidifiedWalls.find(candidate => pickupIntersectsWall(power, candidate, run.mechanics)) ?? solidifiedWalls[0];
      return [power.id, { axis: wall.axis, at: wall.at, low: wall.low, high: wall.high }];
    }));
  }
  const splitBalls = new Set<number>();
  const splitOffspring: Ball[] = [];
  for (let i = 0; i < run.balls.length; i++) for (let j = i + 1; j < run.balls.length; j++) {
    const a = run.balls[i], b = run.balls[j], dx = b.x - a.x, dy = b.y - a.y;
    if (splitBalls.has(a.id) || splitBalls.has(b.id)) continue;
    const d = Math.hypot(dx, dy), minD = a.r + b.r;
    if (d > 0 && d < minD && a.modifier !== 'phase' && b.modifier !== 'phase') {
      const nx = dx / d, ny = dy / d;
      const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      const massA = a.r * a.r, massB = b.r * b.r;
      const invMassA = 1 / massA, invMassB = 1 / massB;
      if (rel > 0) {
        const impulse = rel / (invMassA + invMassB);
        a.vx -= impulse * invMassA * nx; a.vy -= impulse * invMassA * ny;
        b.vx += impulse * invMassB * nx; b.vy += impulse * invMassB * ny;
      }
      const overlap = Math.max(0, minD - d) / (invMassA + invMassB);
      a.x -= nx * overlap * invMassA; a.y -= ny * overlap * invMassA; b.x += nx * overlap * invMassB; b.y += ny * overlap * invMassB;
      const splitter = a.modifier === 'splitter' ? a : b.modifier === 'splitter' ? b : undefined;
      if (splitter) {
        splitBalls.add(splitter.id);
        const angle = Math.random() * Math.PI * 2;
        const radius = splitter.r * (run.mechanics.ballModifiers.splitter.splitSizeMultiplier ?? 0.65);
        const speed = Math.max(run.mechanics.ballSpeedMin, Math.hypot(splitter.vx, splitter.vy));
        for (const direction of [1, -1]) {
          const childAngle = angle + (direction < 0 ? Math.PI : 0);
          splitOffspring.push({ id: run.nextId++, x: splitter.x + Math.cos(childAngle) * radius * 0.6, y: splitter.y + Math.sin(childAngle) * radius * 0.6,
            vx: Math.cos(childAngle) * speed, vy: Math.sin(childAngle) * speed, r: radius });
        }
      }
    }
  }
  if (splitBalls.size) run.balls = [...run.balls.filter(ball => !splitBalls.has(ball.id)), ...splitOffspring];
  run.balls = run.balls.map(ball => recoverSlowBall(run, ball));
  if (completedNow) {
    let captureSpawnCount = 0;
    for (const group of solidifiedGroups) {
      const groupSkewered = pendingSkewered.filter(power => group.some(wall => pickupIntersectsWall(power, wall, run.mechanics)));
      const groupSkeweredIds = new Set(groupSkewered.map(power => power.id));
      const groupSkeweredWalls = new Map(groupSkewered.map(power => [power.id, pendingSkeweredWalls.get(power.id)!]));
      // Queued Speed is consumed by one newly drawn wall: it still solidifies,
      // but this completion deliberately leaves all territory unclaimed.
      if (group.some(wall => wall.noCapture)) {
        run = applyPickupCaptures(run, groupSkewered, groupSkeweredIds, groupSkeweredWalls);
        continue;
      }
      const previousClaimed = run.claimed;
      const previousClaimMask = run.claimMask;
      run = claimEmptyRegions(run, width, height, groupSkewered, groupSkeweredIds, groupSkeweredWalls);
      const percent = Math.max(0, run.claimed - previousClaimed);
      if (percent > 0.005) {
        const newTenPercentMilestones = Math.max(0, Math.floor(run.claimed / 10) - Math.floor(previousClaimed / 10));
        const center = group.reduce((sum, wall) => ({ x: sum.x + wall.at, y: sum.y + (wall.axis === 'vertical' ? (wall.low + wall.high) / 2 : wall.at) }), { x: 0, y: 0 });
        const newCells: number[] = [];
        run.claimMask.forEach((claimed, index) => { if (claimed && !previousClaimMask[index]) newCells.push(index); });
        const areaCell = newCells.length ? newCells[Math.floor(Math.random() * newCells.length)] : -1;
        const areaX = areaCell < 0 ? center.x / group.length : (areaCell % run.gridCols + 0.5) * width / run.gridCols;
        const areaY = areaCell < 0 ? center.y / group.length : (Math.floor(areaCell / run.gridCols) + 0.5) * height / run.gridRows;
        const wallX = center.x / group.length, wallY = center.y / group.length;
        run = awardCredits(run, newTenPercentMilestones * run.mechanics.merchantCreditsPerTenPercent, wallX, wallY);
        run.territoryGainEvents.push({ id: run.nextId++, x: wallX, y: wallY, wallX, wallY, areaX, areaY, percent });
        if (!run.mechanics.easyMode) {
          const captureBallCount = run.mechanics.hardMode ? run.mechanics.hardCaptureBallCount : run.mechanics.normalCaptureBallCount;
          const captureBallChance = run.mechanics.hardMode ? run.mechanics.hardCaptureBallChance : run.mechanics.normalCaptureBallChance;
          if (Math.random() < captureBallChance) captureSpawnCount += captureBallCount;
        }
      }
    }
    for (let index = 0; index < captureSpawnCount; index++) run = spawnCaptureBall(run, width, height);
    if (run.treasureHunt && !run.treasureHunt.revealed && isClaimed(run, run.treasureHunt.x, run.treasureHunt.y, width, height)) run = { ...run, treasureHunt: { ...run.treasureHunt, revealed: true } };
    if (run.claimed >= run.mechanics.clearPercentOfOriginalBoard && !run.levelClearPending) {
      run.levelClearPending = true;
      const point = randomUnclaimedPoint(run, width, height), angle = Math.random() * Math.PI * 2, speed = 70;
      const exit = { id: run.nextId++, kind: 'exit' as const, ...point, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
      run.powerups = [...run.powerups.filter(power => power.kind !== 'exit'), exit];
    }
  }
  run.spawnInMs -= dt;
  if (run.spawnInMs <= 0) {
    const speed = 70;
    const angle = Math.random() * Math.PI * 2;
    const spawnWaldo = run.waldoEligible && !run.waldoEventPending && !run.pictureEvent?.isWaldo && Math.random() < run.mechanics.waldoSpawnChance;
    const kind = spawnWaldo ? 'waldo' : randomPowerKind(run.treasureEligible, run.merchantTokens === 0, run.mechanics);
    const radius = powerupRadius(kind, run.mechanics);
    let x = 0, y = 0;
    for (let attempt = 0; attempt < 30; attempt++) {
      const candidateX = randomBetween(70, width - 70), candidateY = randomBetween(70, height - 70);
      if (!overlapsClaimed(run, candidateX, candidateY, radius, width, height)) { x = candidateX; y = candidateY; break; }
    }
    if (x > 0) run.powerups.push({ id: run.nextId++, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, kind, despawnAtMs: powerupDespawnAt(kind, run.elapsedMs, run.mechanics) });
    run.spawnInMs = Math.floor(randomBetween(run.mechanics.powerupSpawnEverySecondsMin, run.mechanics.powerupSpawnEverySecondsMax + 1)) * 1000;
  }
  const movingPowerups = run.powerups.filter(p => p.despawnAtMs === undefined || p.despawnAtMs > run.elapsedMs).map(p => {
    const radius = powerupRadius(p.kind, run.mechanics);
    let vx = p.vx, vy = p.vy;
    if (p.kind === 'exit') {
      // The route ship gently trims its course with a deterministic, id-offset thrust cycle.
      // Its normal collision response remains unchanged; this only bends its travel between bounces.
      const thrustPhase = run.elapsedMs / 1450 + p.id * 2.17;
      vx += Math.cos(thrustPhase) * 18 * dt / 1000;
      vy += Math.sin(thrustPhase * 0.83) * 18 * dt / 1000;
      const speed = Math.hypot(vx, vy);
      if (speed > 110) { vx = vx / speed * 110; vy = vy / speed * 110; }
    }
    let x = p.x + vx * dt / 1000, y = p.y + vy * dt / 1000;
    const bouncedOnVerticalBoardEdge = p.kind !== 'bubble' && (x < radius || x > width - radius);
    const bouncedOnHorizontalBoardEdge = p.kind !== 'bubble' && (y < radius || y > height - radius);
    const boardWallBounceCount = Number(bouncedOnVerticalBoardEdge) + Number(bouncedOnHorizontalBoardEdge);
    if (p.kind !== 'bubble') {
      if (x < radius || x > width - radius) vx *= -1;
      if (y < radius || y > height - radius) vy *= -1;
      x = Math.max(radius, Math.min(width - radius, x)); y = Math.max(radius, Math.min(height - radius, y));
    }
    if (overlapsClaimed(run, x, y, radius, width, height)) { x = p.x; y = p.y; vx = -vx; vy = -vy; }
    for (const w of p.kind === 'bubble' ? [] : run.walls.filter(w => !w.active)) if (pointOnWall(w, x, y, radius)) {
      if (w.axis === 'vertical') vx *= -1; else vy *= -1;
    }
    if (p.kind !== 'ram' && p.kind !== 'merchant' && p.kind !== 'credit' && p.kind !== 'speed' && !p.phaseChest) for (const b of run.balls) {
      if (b.modifier === 'phase' || (b.modifier === 'anchor' && !p.phaseChest && p.kind !== 'exit')) continue;
      if (Math.hypot(b.x - x, b.y - y) < b.r + radius) { vx *= -1; vy *= -1; }
    }
    let bounceCredits = p.bounceCredits ?? 0;
    let despawnAtMs = p.despawnAtMs;
    if (p.kind === 'credit') {
      for (let bounce = 0; bounce < boardWallBounceCount; bounce++) {
        bounceCredits += 1;
        if (despawnAtMs === undefined && run.mechanics.powerupDespawnEnabled.credit && Math.random() < run.mechanics.creditPickupBounceDespawnChance) {
          const timerSeconds = run.mechanics.powerupDespawnSeconds.credit ?? 5;
          if (timerSeconds > 0) despawnAtMs = run.elapsedMs + timerSeconds * 1000;
        }
      }
    }
    const timeRemaining = despawnAtMs === undefined ? Infinity : despawnAtMs - run.elapsedMs;
    const warningProgress = Math.max(0, Math.min(1, (5000 - timeRemaining) / 5000));
    const pulseOpacity = warningProgress > 0 ? 1 - warningProgress * (0.2 + 0.55 * ((Math.sin(run.elapsedMs / 135) + 1) / 2)) : 1;
    return { ...p, x, y, vx, vy, ...(p.kind === 'credit' ? { bounceCredits } : {}), despawnAtMs, despawnOpacity: pulseOpacity };
  });
  const anchorBroken = new Set<number>();
  const speedBroken = new Set<number>();
  const engiEggBroken = new Set<number>();
  const chestBroken = new Set<number>();
  const creditBroken = new Set<number>();
  const chestRewards: PowerUp[] = [];
  for (const power of movingPowerups) {
    const ball = run.balls.find(candidate => candidate.modifier !== 'phase' && Math.hypot(candidate.x - power.x, candidate.y - power.y) <= candidate.r + powerupRadius(power.kind, run.mechanics));
    if (!ball) continue;
    if (power.kind === 'exit') {
      // The route pickup follows ordinary bounce physics but is never broken.
      continue;
    } else if (power.kind === 'credit') {
      creditBroken.add(power.id);
      run.captureEvents.push({ id: run.nextId++, x: power.x, y: power.y, kind: 'creditLost' });
    } else if (power.kind === 'engi-egg') {
      engiEggBroken.add(power.id);
      run.captureEvents.push({ id: run.nextId++, x: power.x, y: power.y, kind: 'engiEggBreak' });
    } else if (power.phaseChest) {
      chestBroken.add(power.id);
      run.captureEvents.push({ id: run.nextId++, x: power.x, y: power.y, kind: 'phaseChestBreak' });
      const settings = run.mechanics.ballModifiers.phase;
      const count = Math.floor(randomBetween(settings.chestRewardMin ?? 3, (settings.chestRewardMax ?? 6) + 1));
      for (let index = 0; index < count; index++) {
        const kind = randomPowerKind(true, run.merchantTokens === 0, run.mechanics);
        const angle = Math.random() * Math.PI * 2, speed = randomBetween(45, 110), radius = powerupRadius(kind, run.mechanics);
        let rewardX = power.x, rewardY = power.y;
        for (let attempt = 0; attempt < 24; attempt++) {
          const candidateX = randomBetween(radius, width - radius), candidateY = randomBetween(radius, height - radius);
          if (!overlapsClaimed(run, candidateX, candidateY, radius, width, height) && !run.balls.some(candidate => Math.hypot(candidate.x - candidateX, candidate.y - candidateY) <= candidate.r + radius)) {
            rewardX = candidateX; rewardY = candidateY; break;
          }
        }
        chestRewards.push({ id: run.nextId++, x: rewardX, y: rewardY,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, kind, despawnAtMs: powerupDespawnAt(kind, run.elapsedMs, run.mechanics) });
      }
    } else if (power.kind === 'speed') {
      speedBroken.add(power.id);
      const oldSpeed = Math.hypot(ball.vx, ball.vy);
      const angle = oldSpeed > 0.001 ? Math.atan2(ball.vy, ball.vx) : 0;
      const maxSpeed = run.mechanics.ballSpeedMax;
      run.balls = run.balls.map(candidate => candidate.id === ball.id ? { ...candidate, vx: Math.cos(angle) * maxSpeed, vy: Math.sin(angle) * maxSpeed } : candidate);
      run.captureEvents.push({ id: run.nextId++, x: power.x, y: power.y, kind: 'speed' });
      if (ball.modifier === 'anchor') run.captureEvents.push({ id: run.nextId++, x: (ball.x + power.x) / 2, y: (ball.y + power.y) / 2, kind: 'anchorBreak' });
    } else if (ball.modifier === 'anchor') {
      anchorBroken.add(power.id);
      run.captureEvents.push({ id: run.nextId++, x: (ball.x + power.x) / 2, y: (ball.y + power.y) / 2, kind: 'anchorBreak' });
    }
  }
  // Ram pickups detonate on contact with any moving projectile instead of
  // reflecting away. The impulse and effect use the normal Ram blast tuning.
  const impactEvents: { x: number; y: number }[] = [];
  const explodedRams = new Set<number>();
  for (const ram of movingPowerups.filter(p => p.kind === 'ram' && !anchorBroken.has(p.id) && !chestBroken.has(p.id))) {
    if (explodedRams.has(ram.id)) continue;
    const ramRadius = powerupRadius(ram.kind, run.mechanics);
    const ball = run.balls.find(b => b.modifier !== 'phase' && Math.hypot(b.x - ram.x, b.y - ram.y) <= b.r + ramRadius);
    const other = movingPowerups.find(p => p.id !== ram.id && !anchorBroken.has(p.id) && !chestBroken.has(p.id) && Math.hypot(p.x - ram.x, p.y - ram.y) <= ramRadius + powerupRadius(p.kind, run.mechanics));
    const target = ball ?? other;
    if (!target) continue;
    explodedRams.add(ram.id);
    if ('kind' in target && target.kind === 'ram') explodedRams.add(target.id);
    const dx = target.x - ram.x, dy = target.y - ram.y, distance = Math.hypot(dx, dy);
    const targetRadius = 'r' in target ? target.r : powerupRadius(target.kind, run.mechanics);
    const contactDistance = distance > 0 ? Math.max(0, Math.min(distance, (distance + ramRadius - targetRadius) / 2)) : 0;
    impactEvents.push({ x: ram.x + (distance > 0 ? dx / distance * contactDistance : 0), y: ram.y + (distance > 0 ? dy / distance * contactDistance : 0) });
  }
  const lostBubbles = new Set<number>();
  const bubbleLossPoints: { x: number; y: number }[] = [];
  for (const bubble of movingPowerups.filter(power => power.kind === 'bubble' && !anchorBroken.has(power.id) && !chestBroken.has(power.id))) {
    if (bubble.x < 0 || bubble.y < 0 || bubble.x > width || bubble.y > height) { lostBubbles.add(bubble.id); continue; }
    const radius = powerupRadius('bubble', run.mechanics);
    const hitBall = run.balls.some(ball => ball.modifier !== 'phase' && Math.hypot(ball.x - bubble.x, ball.y - bubble.y) <= ball.r + radius);
    const hitProjectile = movingPowerups.some(power => power.id !== bubble.id && !explodedRams.has(power.id) && !anchorBroken.has(power.id) && !chestBroken.has(power.id) && Math.hypot(power.x - bubble.x, power.y - bubble.y) <= radius + powerupRadius(power.kind, run.mechanics));
    if (hitBall || hitProjectile) { lostBubbles.add(bubble.id); bubbleLossPoints.push({ x: bubble.x, y: bubble.y }); }
  }
  run.powerups = [...movingPowerups.filter(p => !explodedRams.has(p.id) && !lostBubbles.has(p.id) && !anchorBroken.has(p.id) && !speedBroken.has(p.id) && !chestBroken.has(p.id) && !creditBroken.has(p.id) && !engiEggBroken.has(p.id)), ...chestRewards];
  for (const point of bubbleLossPoints) run.captureEvents.push({ id: run.nextId++, ...point, kind: 'bubbleLost' });
  for (const impact of impactEvents) run = applyRamBlast(run, impact.x, impact.y);
  const brokenMerchants = new Set<number>();
  for (const merchant of movingPowerups.filter(p => p.kind === 'merchant' && !anchorBroken.has(p.id) && !chestBroken.has(p.id))) {
    const ball = run.balls.find(b => b.modifier !== 'phase' && Math.hypot(b.x - merchant.x, b.y - merchant.y) <= b.r + powerupRadius(merchant.kind, run.mechanics));
    if (!ball) continue;
    brokenMerchants.add(merchant.id);
    run.captureEvents.push({ id: run.nextId++, x: (ball.x + merchant.x) / 2, y: (ball.y + merchant.y) / 2, kind: 'merchantBreak' });
  }
  if (brokenMerchants.size) run.powerups = run.powerups.filter(p => !brokenMerchants.has(p.id));
  run = collectClaimedPickups(run, width, height);
  const contained = everyBallHasItsOwnRegion(run, width, height);
  if (contained && !run.isotypesContained) run.isotypesNoticeUntilMs = run.elapsedMs + 2200;
  run.isotypesContained = contained;
  run = advanceOverflowProcessor(run, dt);
  advancePetIncubations(run, dt);
  advancePetBodies(run, dt, width, height);
  return run;
}


