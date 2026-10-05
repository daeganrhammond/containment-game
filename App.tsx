import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, ImageSourcePropType, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { activateCharge, activateSpeed, Ball, BallModifier, CaptureEvent, chargeCapacity, chargeStorageUpgradeCost, CompanionPet, ContainmentPickupKind, CreditGainEvent, DEFAULT_MECHANICS, deployEngi, engiUpgradeCost, enforceChargeCapacities, getMechanicsSettings, hireEngi, lifeStorageUpgradeCost, MechanicsSettings, MECHANICS, merchantPowerBarCost as getMerchantPowerBarCost, newRun, OverflowJob, OverflowResult, overflowProcessingUpgradeCost, overflowRefineryUpgradeCost, PictureLibraryEntry, PowerKind, PowerUp, powerupCollisionRadius, powerupDespawnAt, randomBetween, randomEngiCocoonSkin, ramAt, startEngiIncubation, tapPickupAt, resizeRunBoard, Run, ScoreEntry, setMechanicsSettings, setPictureLibrary, setWaldoLibrary, startWall, stepRun, TerritoryGainEvent, upgradeEngi, WaldoLibraryEntry, Wall, WallBreakEvent } from './mechanics';
import { BACKGROUND_SKINS, BALL_SKINS, CREDIT_SKINS, DEFAULT_SKIN_SELECTIONS, ENGI_PET_SKINS, LEVEL_CLEAR_ANIMATIONS, normalizeSkinSelections, PICKUP_SKINS, SkinOption, SkinSelections, CaptureAnimation } from './skins';
import { defaultSkinUnlocks, normalizeSkinUnlocks, reachableSkin, SKIN_ARCHIVE, SKIN_CATEGORY_KEYS, SKIN_DEFAULTS, SkinArchiveNode, SkinUnlocks } from './themeCatalog';
import { ThemeTreeScreen } from './ThemeTreeScreen';

const SAVE_KEY = 'trap-game-save-v1';
const SETTINGS_KEY = 'trap-game-dev-settings-v1';
const PROFILES_KEY = 'trap-game-dev-profiles-v1';
const SKINS_KEY = 'trap-game-skin-selections-v1';
const PICTURE_LIBRARY_KEY = 'trap-game-picture-library-v1';
const WALDO_LIBRARY_KEY = 'trap-game-waldo-library-v1';
const SKIN_UNLOCKS_V2_KEY = 'trap-game-skin-unlocks-v2';
const MANUAL_SAVE_KEY = 'trap-game-manual-save-v1';
const COMMAND_BRIDGE_ART = require('./assets/bridge-command-full.png');
const CREDIT_SYMBOL_ART: Record<string, number> = {
  sunshard: require('./assets/credits/sunshard.png'),
  'circuit-chit': require('./assets/credits/circuit-chit.png'),
  'void-prism': require('./assets/credits/void-prism.png'),
};
const GENERATED_PICTURE_BACKDROPS = [
  require('./assets/picture-events/astral-nebula.jpg'), require('./assets/picture-events/ringworld-horizon.jpg'), require('./assets/picture-events/stellar-clouds.jpg'),
  require('./assets/picture-events/alpine-lake.jpg'), require('./assets/picture-events/red-rock-canyon.jpg'), require('./assets/picture-events/alien-coast.jpg'),
  require('./assets/picture-events/misty-pines.jpg'), require('./assets/picture-events/bioluminescent-forest.jpg'), require('./assets/picture-events/autumn-woods.jpg'),
];
const FULL_STAGE_IMAGE_STYLE = { position: 'absolute' as const, left: 0, top: 0, width: '100%' as const, height: '100%' as const };
const FULL_BOARD_ART_STYLE = { ...FULL_STAGE_IMAGE_STYLE, overflow: 'hidden' as const };
const SELECTED_BALL_ART: Record<string, number> = {
  'singularity-reliquary': require('./assets/skins/selected/selected-1.png'),
  'clockwork-sun': require('./assets/skins/selected/selected-2.png'),
  asteroid: require('./assets/skins/selected/selected-3.png'),
};
const SELECTED_PICKUP_ART: Record<string, number> = {
  'phoenix-ember': require('./assets/skins/selected/selected-4.png'),
  'moth-lantern': require('./assets/skins/selected/selected-5.png'),
  'thunder-lattice': require('./assets/skins/selected/selected-6.png'),
  'ion-skiff': require('./assets/skins/selected/selected-7.png'),
  'mantis-breacher': require('./assets/skins/selected/selected-8.png'),
  'meteor-maul': require('./assets/skins/selected/selected-9.png'),
  'radiant-coin': require('./assets/skins/selected/selected-10.png'),
  'star-reliquary': require('./assets/skins/selected/selected-11.png'),
  'orbital-astrolabe': require('./assets/skins/selected/selected-12.png'),
  'compass-wheel': require('./assets/skins/selected/selected-13.png'),
  'merchant-sailing-coin': require('./assets/skins/selected/selected-14.png'),
  'star-chart-astrolabe': require('./assets/skins/selected/selected-15.png'),
  'skyglass-merchant': require('./assets/skins/selected/selected-16.png'),
  'lantern-gate-token': require('./assets/skins/lantern-gate-token.png'),
  'aurora-crown': require('./assets/skins/selected-2/selected-1.png'),
  'tiny-glassworld': require('./assets/skins/selected-2/selected-2.png'),
  'inkblot-comet': require('./assets/skins/selected-2/selected-3.png'),
  'striped-scout': require('./assets/skins/selected-2/selected-4.png'),
  'finder-badge': require('./assets/skins/selected-2/selected-5.png'),
  'solar-mint-seal': require('./assets/skins/selected-2/selected-6.png'),
  'circuit-ledger-relay': require('./assets/skins/selected-2/selected-7.png'),
  'void-prism-scrip': require('./assets/skins/selected-2/selected-8.png'),
  'engi-cocoon': require('./assets/skins/selected-2/selected-9.png'),
  'engi-seed-pod': require('./assets/skins/selected-2/selected-10.png'),
  'engi-scarab-capsule': require('./assets/skins/selected-2/selected-11.png'),
  'courier-skiff': require('./assets/skins/selected-2/selected-15.png'),
  'folded-transit': require('./assets/skins/selected-2/selected-16.png'),
};
const ENGI_CONCEPT_ART: Record<string, number> = {
  'salvage-engi': require('./assets/skins/selected-2/selected-12.png'),
  'verdant-engi': require('./assets/skins/selected-2/selected-13.png'),
  'cobalt-engi': require('./assets/skins/selected-2/selected-14.png'),
};
const PICTURE_PALETTES = [
  { sky: '#101c3a', haze: '#5b5ac5', sun: '#ffc77b', far: '#5961aa', mid: '#394582', near: '#232c5e', water: '#14234a', star: '#fff0d0', accents: ['#8d86ed', '#58c7ca', '#ec7caa'] },
  { sky: '#261339', haze: '#d64e88', sun: '#ffcf73', far: '#77366c', mid: '#512a64', near: '#38204f', water: '#211842', star: '#ffe6b5', accents: ['#ff845d', '#be66dc', '#ffbd72'] },
  { sky: '#082c3a', haze: '#23b1a4', sun: '#e4ffb8', far: '#267477', mid: '#20575e', near: '#143e51', water: '#082b3c', star: '#ddfff0', accents: ['#39cfb7', '#7ed4ed', '#b0ed9a'] },
  { sky: '#221b25', haze: '#b2474b', sun: '#ffd17e', far: '#803f46', mid: '#502e42', near: '#342538', water: '#251c31', star: '#fff0dc', accents: ['#ff674f', '#ffba61', '#ce5f87'] },
  { sky: '#111c2d', haze: '#2f82b2', sun: '#c5f5ff', far: '#376c93', mid: '#284e77', near: '#203754', water: '#102c4b', star: '#e8fbff', accents: ['#59cbed', '#788cff', '#80e5c1'] },
  { sky: '#21183b', haze: '#9560c9', sun: '#ffd8a0', far: '#62519b', mid: '#41356d', near: '#2d2858', water: '#1e2050', star: '#fff0e0', accents: ['#c080f5', '#70d2d4', '#f18bad'] },
  { sky: '#18302d', haze: '#8ab85b', sun: '#fff0a8', far: '#547451', mid: '#3a5948', near: '#294740', water: '#183e3a', star: '#f4ffdb', accents: ['#a8d65f', '#4bc8a7', '#e5ba62'] },
  { sky: '#301c24', haze: '#d07a55', sun: '#fff0c0', far: '#965647', mid: '#663d45', near: '#472c40', water: '#30263d', star: '#fff2db', accents: ['#ffb45c', '#e77369', '#e6c76f'] },
  { sky: '#071b2b', haze: '#287c9b', sun: '#f3ffcb', far: '#276b7c', mid: '#1c4e69', near: '#16394f', water: '#0a2638', star: '#e6ffff', accents: ['#50d5c7', '#92e89e', '#84b9f5'] },
  { sky: '#2c1422', haze: '#ae3c69', sun: '#ffd197', far: '#74334f', mid: '#552941', near: '#3b203d', water: '#25182e', star: '#ffecd9', accents: ['#ff6c8c', '#ed9e67', '#c77dce'] },
  { sky: '#17152f', haze: '#5651bc', sun: '#ffe990', far: '#514c92', mid: '#39396c', near: '#282c51', water: '#191c3d', star: '#f1efff', accents: ['#9796ff', '#53c7ef', '#d28af4'] },
  { sky: '#282314', haze: '#a77932', sun: '#fff0ae', far: '#705a2c', mid: '#52452a', near: '#393526', water: '#28251e', star: '#fff5d3', accents: ['#edc75f', '#dd8d4c', '#a9b969'] },
  { sky: '#10272b', haze: '#36877c', sun: '#fff2c3', far: '#38675b', mid: '#294c4e', near: '#203a45', water: '#122e35', star: '#eefff3', accents: ['#66dbab', '#74cbd5', '#f0ca71'] },
  { sky: '#211527', haze: '#844488', sun: '#ffcb8c', far: '#643c70', mid: '#482f5d', near: '#352544', water: '#241b37', star: '#fff0ee', accents: ['#d879b8', '#8e9af3', '#f0a768'] },
  { sky: '#0e1d32', haze: '#3f789f', sun: '#ffd2a0', far: '#405f86', mid: '#30466f', near: '#253655', water: '#172940', star: '#e9f7ff', accents: ['#6ca9d2', '#d39377', '#b0d892'] },
] as const;
// These are procedural Picture-event art directions, not arena background skins.
const PICTURE_EVENT_THEMES = [
  { id: 'stellar-nebula', layout: 'astral' },
  { id: 'cosmic-forest', layout: 'forest' },
  { id: 'fractal-sky', layout: 'fractal' },
] as const;
const WALL_BREAK_SKINS: SkinOption[] = [
  { id: 'glass-shards', name: 'Glass Shards', description: 'Bright angular fragments shoot out and fade' },
  { id: 'ember-snap', name: 'Ember Snap', description: 'A hot burst with sparks that rise and cool' },
  { id: 'sonic-shear', name: 'Sonic Shear', description: 'A wide cyan pressure ring and slicing streaks' },
  { id: 'wall-crack', name: 'Wall Crack', description: 'A jagged fracture races across the full struck wall before fading' },
  { id: 'wall-crumble', name: 'Wall Crumble', description: 'The full struck wall sheds glowing fragments and dust' },
];
const BOARD_W = 900;
const BOARD_H = 1100;
const CLAIM_SWATCHES = ['#071019', '#17372f', '#25203e', '#40202c', '#45515e'];
type Gesture = { x: number; y: number };
type TuningProfile = { name: string; settings: MechanicsSettings; skins?: SkinSelections };
type SkinProgression = SkinUnlocks;

function discoveryGroup(category: string): string {
  return category;
}

function attachSkinDiscovery(run: Run, progression: SkinProgression): Run {
  if (run.levelEvent === 'elimination' || Math.random() >= run.mechanics.skinDiscoveryChance) return { ...run, skinDiscovery: null };
  const eligible = SKIN_ARCHIVE.filter(node => reachableSkin(node, progression.unlocked, progression.tiers));
  const candidates = [...new Set(eligible.map(node => node.category))].map(category => ({ category, nodes: eligible.filter(node => node.category === category), weight: Math.max(0, run.mechanics.skinDiscoveryCategoryWeights[discoveryGroup(category)] ?? 0) })).filter(item => item.weight > 0 && item.nodes.length > 0);
  const totalWeight = candidates.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight) return { ...run, skinDiscovery: null };
  let roll = Math.random() * totalWeight;
  const category = candidates.find(item => (roll -= item.weight) < 0) ?? candidates[candidates.length - 1];
  const selected = category.nodes[Math.floor(Math.random() * category.nodes.length)];
  const key = `${selected.category}:${selected.id}`;
  return { ...run, skinDiscovery: { category: selected.category, skinId: selected.id, requiredClaimed: Math.min(100, run.mechanics.clearPercentOfOriginalBoard + Math.max(0, run.mechanics.skinDiscoveryClaimBonusPercent[key] ?? 12)), requiresIsotypes: run.mechanics.skinDiscoveryRequiresIsotypes[key] ?? true } };
}

function normalizeMechanicsSettings(settings: Partial<MechanicsSettings> | undefined): MechanicsSettings {
  const ballRadius = settings?.ballRadius ?? DEFAULT_MECHANICS.ballRadius;
  const ballSpeedMin = settings?.ballSpeedMin ?? DEFAULT_MECHANICS.ballSpeedMin;
  const ballSpeedMax = Math.max(ballSpeedMin, settings?.ballSpeedMax ?? DEFAULT_MECHANICS.ballSpeedMax);
  const ballRecoveryThreshold = Math.max(0, Math.min(ballSpeedMax - 1, settings?.ballRecoveryThreshold ?? DEFAULT_MECHANICS.ballRecoveryThreshold));
  const powerupRadiusMultiplier = settings?.powerupRadiusMultiplier ?? DEFAULT_MECHANICS.powerupRadiusMultiplier;
  const bubbleSizeMultiplier = settings?.bubbleSizeMultiplier ?? DEFAULT_MECHANICS.bubbleSizeMultiplier;
  const powerupSizeMultipliers = Object.fromEntries((Object.keys(DEFAULT_MECHANICS.powerupSizeMultipliers) as PowerKind[]).map(kind => {
    const legacyValue = powerupRadiusMultiplier * (kind === 'bubble' ? bubbleSizeMultiplier : 1);
    const configured = settings?.powerupSizeMultipliers?.[kind] ?? legacyValue;
    return [kind, Math.max(0.5, Math.min(3, configured))];
  })) as MechanicsSettings['powerupSizeMultipliers'];
  const powerupRadius = ballRadius * powerupSizeMultipliers.life;
  return {
    ...DEFAULT_MECHANICS,
    ...settings,
    ballSpeedMin,
    ballSpeedMax,
    ballRecoveryThreshold,
    ballRecoverySpeed: Math.max(ballRecoveryThreshold + 1, Math.min(ballSpeedMax, settings?.ballRecoverySpeed ?? DEFAULT_MECHANICS.ballRecoverySpeed)),
    ballRecoveryModifierChance: Math.max(0, Math.min(1, settings?.ballRecoveryModifierChance ?? DEFAULT_MECHANICS.ballRecoveryModifierChance)),
    normalCaptureBallCount: settings?.normalCaptureBallCount ?? DEFAULT_MECHANICS.normalCaptureBallCount,
    normalCaptureBallChance: settings?.normalCaptureBallChance ?? DEFAULT_MECHANICS.normalCaptureBallChance,
    easyMode: settings?.easyMode ?? DEFAULT_MECHANICS.easyMode,
    hardCaptureBallCount: settings?.hardCaptureBallCount ?? DEFAULT_MECHANICS.hardCaptureBallCount,
    hardCaptureBallChance: settings?.hardCaptureBallChance ?? DEFAULT_MECHANICS.hardCaptureBallChance,
    ballRadius,
    ballModifiers: Object.fromEntries((Object.keys(DEFAULT_MECHANICS.ballModifiers) as BallModifier[]).map(modifier => { const merged = { ...DEFAULT_MECHANICS.ballModifiers[modifier], ...settings?.ballModifiers?.[modifier] }; const phaseBlastScaleMin = Math.max(0.25, Math.min(3, merged.phaseBlastScaleMin ?? 0.75)); const phaseBlastScaleMax = Math.max(phaseBlastScaleMin, Math.min(3, merged.phaseBlastScaleMax ?? 1.25)); return [modifier, { ...merged, splitMinimumRadius: Math.max(1, merged.splitMinimumRadius ?? ballRadius * 0.4), phaseBlastScaleMin, phaseBlastScaleMax }]; })) as MechanicsSettings['ballModifiers'],
    modifierMutationRates: Object.fromEntries((['easy', 'normal', 'hard'] as const).map(mode => [mode, Math.max(0, Math.min(1, settings?.modifierMutationRates?.[mode] ?? DEFAULT_MECHANICS.modifierMutationRates[mode]))])) as MechanicsSettings['modifierMutationRates'],
    modifierInfectionRates: Object.fromEntries((['easy', 'normal', 'hard'] as const).map(mode => [mode, Math.max(0, Math.min(1, settings?.modifierInfectionRates?.[mode] ?? DEFAULT_MECHANICS.modifierInfectionRates[mode]))])) as MechanicsSettings['modifierInfectionRates'],
    modifierCompatibility: Object.fromEntries((Object.keys(DEFAULT_MECHANICS.modifierCompatibility) as BallModifier[]).map(modifier => [modifier, { ...DEFAULT_MECHANICS.modifierCompatibility[modifier], ...settings?.modifierCompatibility?.[modifier] }])) as MechanicsSettings['modifierCompatibility'],
    pictureAssetBackdropChance: Math.max(0, Math.min(1, settings?.pictureAssetBackdropChance ?? DEFAULT_MECHANICS.pictureAssetBackdropChance)),
    powerupRadiusMultiplier,
    powerupSizeMultipliers,
    powerupRadius,
    lifePowerupRadius: powerupRadius,
    bubbleSizeMultiplier,
    comboBubbleCountVariance: settings?.comboBubbleCountVariance ?? DEFAULT_MECHANICS.comboBubbleCountVariance,
    bubbleCreditsPerPop: settings?.bubbleCreditsPerPop ?? DEFAULT_MECHANICS.bubbleCreditsPerPop,
    creditPickupBaseAmount: settings?.creditPickupBaseAmount ?? DEFAULT_MECHANICS.creditPickupBaseAmount,
    creditPickupBounceDespawnChance: settings?.creditPickupBounceDespawnChance ?? DEFAULT_MECHANICS.creditPickupBounceDespawnChance,
    lifeStorageBaseCapacity: Math.max(1, settings?.lifeStorageBaseCapacity ?? DEFAULT_MECHANICS.lifeStorageBaseCapacity),
    lifeStorageUpgradeBaseCost: settings?.lifeStorageUpgradeBaseCost ?? DEFAULT_MECHANICS.lifeStorageUpgradeBaseCost,
    lifeStorageCostIncreasePercent: settings?.lifeStorageCostIncreasePercent ?? DEFAULT_MECHANICS.lifeStorageCostIncreasePercent,
    resourceStorageUpgradeBaseCost: settings?.resourceStorageUpgradeBaseCost ?? DEFAULT_MECHANICS.resourceStorageUpgradeBaseCost,
    resourceStorageCostIncreasePercent: settings?.resourceStorageCostIncreasePercent ?? DEFAULT_MECHANICS.resourceStorageCostIncreasePercent,
    overflowCreditValues: { ...DEFAULT_MECHANICS.overflowCreditValues, ...settings?.overflowCreditValues },
    overflowProcessingMs: settings?.overflowProcessingMs ?? DEFAULT_MECHANICS.overflowProcessingMs,
    overflowProcessingUpgradeBaseCost: settings?.overflowProcessingUpgradeBaseCost ?? DEFAULT_MECHANICS.overflowProcessingUpgradeBaseCost,
    overflowProcessingUpgradeCostIncreasePercent: settings?.overflowProcessingUpgradeCostIncreasePercent ?? DEFAULT_MECHANICS.overflowProcessingUpgradeCostIncreasePercent,
    overflowProcessingReductionPercent: settings?.overflowProcessingReductionPercent ?? DEFAULT_MECHANICS.overflowProcessingReductionPercent,
    overflowProcessingMinimumMs: settings?.overflowProcessingMinimumMs ?? DEFAULT_MECHANICS.overflowProcessingMinimumMs,
    levelClearBubbleRatePerSecond: settings?.levelClearBubbleRatePerSecond ?? DEFAULT_MECHANICS.levelClearBubbleRatePerSecond,
    levelClearBubbleDurationMs: settings?.levelClearBubbleDurationMs ?? DEFAULT_MECHANICS.levelClearBubbleDurationMs,
    levelClearAnimationDurationMs: Math.max(500, settings?.levelClearAnimationDurationMs ?? DEFAULT_MECHANICS.levelClearAnimationDurationMs),
    containmentMutationChance: Math.max(0, Math.min(1, settings?.containmentMutationChance ?? DEFAULT_MECHANICS.containmentMutationChance)),
    containmentMutationDelayMinSeconds: Math.max(0, settings?.containmentMutationDelayMinSeconds ?? DEFAULT_MECHANICS.containmentMutationDelayMinSeconds),
    containmentMutationDelayMaxSeconds: Math.max(settings?.containmentMutationDelayMinSeconds ?? DEFAULT_MECHANICS.containmentMutationDelayMinSeconds, settings?.containmentMutationDelayMaxSeconds ?? DEFAULT_MECHANICS.containmentMutationDelayMaxSeconds),
    containmentMutationDecayChance: Math.max(0, Math.min(1, settings?.containmentMutationDecayChance ?? DEFAULT_MECHANICS.containmentMutationDecayChance)),
    containmentMutationBaseSpawnChance: Math.max(0, Math.min(1, settings?.containmentMutationBaseSpawnChance ?? DEFAULT_MECHANICS.containmentMutationBaseSpawnChance)),
    containmentMutationPickupEnabled: { ...DEFAULT_MECHANICS.containmentMutationPickupEnabled, ...settings?.containmentMutationPickupEnabled },
    eliminationEventChance: Math.max(0, Math.min(1, settings?.eliminationEventChance ?? DEFAULT_MECHANICS.eliminationEventChance)),
    driftSwarmEventChance: Math.max(0, Math.min(1, settings?.driftSwarmEventChance ?? DEFAULT_MECHANICS.driftSwarmEventChance)),
    skinDiscoveryChance: Math.max(0, Math.min(1, settings?.skinDiscoveryChance ?? DEFAULT_MECHANICS.skinDiscoveryChance)),
    skinDiscoveryCategoryWeights: { ...DEFAULT_MECHANICS.skinDiscoveryCategoryWeights, ...settings?.skinDiscoveryCategoryWeights },
    skinDiscoveryClaimBonusPercent: { ...settings?.skinDiscoveryClaimBonusPercent },
    skinDiscoveryRequiresIsotypes: { ...settings?.skinDiscoveryRequiresIsotypes },
    driftSwarmBannerDurationMs: Math.max(0, settings?.driftSwarmBannerDurationMs ?? DEFAULT_MECHANICS.driftSwarmBannerDurationMs),
    eliminationChargeSpawnChance: Math.max(0, Math.min(1, settings?.eliminationChargeSpawnChance ?? DEFAULT_MECHANICS.eliminationChargeSpawnChance)),
    driftSwarmVariationMin: Math.max(0.1, Math.min(settings?.driftSwarmVariationMin ?? DEFAULT_MECHANICS.driftSwarmVariationMin, settings?.driftSwarmVariationMax ?? DEFAULT_MECHANICS.driftSwarmVariationMax)),
    driftSwarmVariationMax: Math.max(settings?.driftSwarmVariationMin ?? DEFAULT_MECHANICS.driftSwarmVariationMin, settings?.driftSwarmVariationMax ?? DEFAULT_MECHANICS.driftSwarmVariationMax),
    overflowBaseSuccessChance: Math.max(0, Math.min(100, settings?.overflowBaseSuccessChance ?? DEFAULT_MECHANICS.overflowBaseSuccessChance)),
    overflowUpgradeBaseCost: Math.max(0, settings?.overflowUpgradeBaseCost ?? DEFAULT_MECHANICS.overflowUpgradeBaseCost),
    overflowUpgradeChanceIncrease: Math.max(0, Math.min(100, settings?.overflowUpgradeChanceIncrease ?? DEFAULT_MECHANICS.overflowUpgradeChanceIncrease)),
    overflowUpgradeCostIncreasePercent: Math.max(0, settings?.overflowUpgradeCostIncreasePercent ?? DEFAULT_MECHANICS.overflowUpgradeCostIncreasePercent),
    powerupSpawnWeights: { ...DEFAULT_MECHANICS.powerupSpawnWeights, ...settings?.powerupSpawnWeights },
    powerupDespawnEnabled: { ...DEFAULT_MECHANICS.powerupDespawnEnabled, ...settings?.powerupDespawnEnabled },
    powerupDespawnSeconds: { ...DEFAULT_MECHANICS.powerupDespawnSeconds, ...settings?.powerupDespawnSeconds },
    merchantCreditsPerTenPercent: settings?.merchantCreditsPerTenPercent ?? DEFAULT_MECHANICS.merchantCreditsPerTenPercent,
    creditGainStyle: settings?.creditGainStyle === 'ticker' ? 'ticker' : 'orbiting',
    levelClearStyle: settings?.levelClearStyle === 'prism' || settings?.levelClearStyle === 'rift' ? settings.levelClearStyle : 'nova',
    merchantPowerBarCost: settings?.merchantPowerBarCost ?? DEFAULT_MECHANICS.merchantPowerBarCost,
    merchantPowerBarCostIncreasePercent: settings?.merchantPowerBarCostIncreasePercent ?? DEFAULT_MECHANICS.merchantPowerBarCostIncreasePercent,
    merchantSkinUnlockBaseCost: settings?.merchantSkinUnlockBaseCost ?? DEFAULT_MECHANICS.merchantSkinUnlockBaseCost,
    merchantSkinTierMultipliers: { ...DEFAULT_MECHANICS.merchantSkinTierMultipliers, ...settings?.merchantSkinTierMultipliers },
    merchantRewardsEnabled: { ...DEFAULT_MECHANICS.merchantRewardsEnabled, ...settings?.merchantRewardsEnabled },
    merchantUpgradePerBar: { ...DEFAULT_MECHANICS.merchantUpgradePerBar, ...settings?.merchantUpgradePerBar },
    waldoPetPaintingCredits: settings?.waldoPetPaintingCredits ?? DEFAULT_MECHANICS.waldoPetPaintingCredits,
    waldoPetPaintingIntervalMs: settings?.waldoPetPaintingIntervalMs ?? DEFAULT_MECHANICS.waldoPetPaintingIntervalMs,
    speedBoostMultiplier: settings?.speedBoostMultiplier ?? DEFAULT_MECHANICS.speedBoostMultiplier,
    pictureEventChance: Math.max(0, Math.min(1, settings?.pictureEventChance ?? DEFAULT_MECHANICS.pictureEventChance)),
    pictureLibrarySelectionChance: Math.max(0, Math.min(1, settings?.pictureLibrarySelectionChance ?? DEFAULT_MECHANICS.pictureLibrarySelectionChance)),
    waldoLibrarySelectionChance: Math.max(0, Math.min(1, settings?.waldoLibrarySelectionChance ?? DEFAULT_MECHANICS.waldoLibrarySelectionChance)),
    treasureLevelEligibilityChance: Math.max(0, Math.min(1, settings?.treasureLevelEligibilityChance ?? DEFAULT_MECHANICS.treasureLevelEligibilityChance)),
    backgroundColors: (() => {
      const pictureThemeColors = new Set(['#080f22', '#061a1d', '#080d19']);
      const saved = settings?.backgroundColors ?? DEFAULT_MECHANICS.backgroundColors;
      const filtered = saved.filter(color => !pictureThemeColors.has(color.toLowerCase()));
      return filtered.length ? [...filtered] : BACKGROUND_SKINS.map(skin => skin.color);
    })(),
  };
}

function boardLayoutFor(width: number, height: number) {
  if (!width || !height) return { displayWidth: 0, displayHeight: 0, worldWidth: BOARD_W, worldHeight: BOARD_H };
  if (Platform.OS === 'web') {
    const displayHeight = height;
    const displayWidth = width;
    return { displayWidth, displayHeight, worldWidth: BOARD_H * displayWidth / displayHeight, worldHeight: BOARD_H };
  }
  const displayWidth = width;
  const displayHeight = height;
  const scale = Math.min(displayWidth / BOARD_W, displayHeight / BOARD_H);
  return { displayWidth, displayHeight, worldWidth: displayWidth / scale, worldHeight: displayHeight / scale };
}

function normalizeScoreEntry(entry: Partial<ScoreEntry>): ScoreEntry {
  const level = entry.level ?? entry.score ?? 0;
  return { score: entry.score ?? level, level, claimed: entry.claimed ?? 0, totalTerritoryClaimed: entry.totalTerritoryClaimed ?? entry.claimed ?? 0, ballsDestroyed: entry.ballsDestroyed ?? 0, ballsContained: entry.ballsContained ?? 0, pickupsCaptured: entry.pickupsCaptured ?? 0, timestamp: entry.timestamp ?? Date.now() };
}
function formatScore(entry: ScoreEntry) { return `LV ${entry.level}  ·  ${entry.claimed.toFixed(2)}% claimed`; }
function pickupDisplayName(kind: PowerKind) {
  const titles: Record<PowerKind, string> = { life: 'EXTRA LIFE', speed: 'SPEED BOOST', ram: 'BATTERING RAM', charge: 'CHARGE', treasure: 'TREASURE', merchant: 'MERCHANT', bubble: 'COSMIC BUBBLE', waldo: 'WALDO PICKUP', credit: 'CREDIT CACHE', 'engi-egg': 'ENGI COCOON', exit: 'WAYFINDER COURIER' };
  return titles[kind];
}

function BridgePulse({ delay = 0, color = '#75f4dc' }: { delay?: number; color?: string }) {
  const [pulse] = useState(() => new Animated.Value(0.35));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(pulse, { toValue: 1, duration: 720, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.3, duration: 1080, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, [delay, pulse]);
  return <Animated.View style={[styles.bridgePulse, { backgroundColor: color, shadowColor: color, opacity: pulse }]} />;
}

function BridgeStagePreview({ run, hasActiveRun, simulationRunning, pictureSource, defaultBackground, onPress }: {
  run: Run;
  hasActiveRun: boolean;
  simulationRunning: boolean;
  pictureSource?: ImageSourcePropType;
  defaultBackground?: ImageSourcePropType;
  onPress: () => void;
}) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [scan] = useState(() => new Animated.Value(0));
  const claimedRects = React.useMemo(() => {
    const rects: { id: string; x: number; y: number; width: number }[] = [];
    for (let y = 0; y < run.gridRows; y++) {
      let x = 0;
      while (x < run.gridCols) {
        if (!run.claimMask?.[y * run.gridCols + x]) { x++; continue; }
        const start = x;
        while (x < run.gridCols && run.claimMask?.[y * run.gridCols + x]) x++;
        rects.push({ id: `${y}-${start}`, x: start, y, width: x - start });
      }
    }
    return rects;
  }, [run.claimMask, run.gridCols, run.gridRows]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scan, { toValue: 1, duration: 3600, useNativeDriver: true }),
      Animated.delay(650),
      Animated.timing(scan, { toValue: 0, duration: 1, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, [scan]);
  const aspect = Math.max(1.2, Math.min(2.35, run.boardWidth / Math.max(1, run.boardHeight)));
  // Keep the preview compact and dock it to the bridge console instead of
  // letting it dominate the panoramic window.
  const boardWidth = Math.min(viewport.width * 0.46, viewport.height * 0.3 * aspect);
  const boardHeight = boardWidth / aspect;
  const scanY = scan.interpolate({ inputRange: [0, 1], outputRange: [-10, Math.max(1, boardHeight)] });
  const activeBackground = run.pictureEvent ? pictureSource : defaultBackground;
  return <View style={styles.bridgePreviewRegion} onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    setViewport(current => Math.abs(current.width - width) < 1 && Math.abs(current.height - height) < 1 ? current : { width, height });
  }}>
    {boardWidth > 0 && boardHeight > 0 && <Pressable accessibilityRole="button" accessibilityLabel={hasActiveRun ? `Resume active run, stage ${run.level}` : 'Start a new run'} onPress={onPress} style={[styles.bridgeMiniFrame, { width: boardWidth, height: boardHeight }]}>
      {activeBackground && <Image source={activeBackground} resizeMode={run.pictureEvent ? 'stretch' : 'cover'} style={StyleSheet.absoluteFill} />}
      <View pointerEvents="none" style={styles.bridgeMiniTint} />
      {claimedRects.map(rect => <View key={`claim-${rect.id}`} pointerEvents="none" style={[styles.bridgeMiniClaim, { left: `${rect.x / run.gridCols * 100}%`, top: `${rect.y / run.gridRows * 100}%`, width: `${rect.width / run.gridCols * 100}%`, height: `${100 / run.gridRows}%` }]} />)}
      {run.walls.map(wall => <View key={`wall-${wall.id}`} pointerEvents="none" style={[styles.bridgeMiniWall, wall.axis === 'vertical'
        ? { left: `${wall.at / run.boardWidth * 100}%`, top: `${wall.low / run.boardHeight * 100}%`, width: wall.active ? 2 : 1.5, height: `${Math.max(0.5, (wall.high - wall.low) / run.boardHeight * 100)}%` }
        : { left: `${wall.low / run.boardWidth * 100}%`, top: `${wall.at / run.boardHeight * 100}%`, width: `${Math.max(0.5, (wall.high - wall.low) / run.boardWidth * 100)}%`, height: wall.active ? 2 : 1.5 }]} />)}
      {run.powerups.map((powerup, index) => <View key={`pickup-${powerup.id}`} pointerEvents="none" style={[styles.bridgeMiniPickup, { left: `${powerup.x / run.boardWidth * 100}%`, top: `${powerup.y / run.boardHeight * 100}%`, backgroundColor: powerup.kind === 'exit' ? '#fff0a1' : index % 2 ? '#edb65f' : '#78e9d1' }]} />)}
      {run.balls.map(ball => {
        const diameter = Math.max(4, Math.min(10, 2 * ball.r / run.boardWidth * boardWidth));
        return <View key={`ball-${ball.id}`} pointerEvents="none" style={[styles.bridgeMiniBall, { width: diameter, height: diameter, borderRadius: diameter / 2, left: `${ball.x / run.boardWidth * 100}%`, top: `${ball.y / run.boardHeight * 100}%`, marginLeft: -diameter / 2, marginTop: -diameter / 2 }]} />;
      })}
      <Animated.View pointerEvents="none" style={[styles.bridgeMiniScan, { transform: [{ translateY: scanY }] }]} />
      <View pointerEvents="none" style={styles.bridgeMiniTop}><View><Text style={styles.bridgeMiniEyebrow}>{simulationRunning ? 'LIVE SECTOR FEED' : 'SAVED SECTOR VIEW'}</Text><Text style={styles.bridgeMiniStage}>STAGE {String(run.level).padStart(2, '0')}</Text></View><Text style={styles.bridgeMiniPercent}>{run.claimed.toFixed(1)}%</Text></View>
      <View pointerEvents="none" style={styles.bridgeMiniBottom}><Text style={styles.bridgeMiniResume}>{hasActiveRun ? 'TAP TO RESUME ACTIVE RUN' : 'TAP TO LAUNCH A NEW SECTOR'}</Text><Text style={styles.bridgeMiniReadouts}>{run.balls.length} BALLS  ·  {run.credits.toLocaleString()} CREDITS</Text></View>
      <View pointerEvents="none" style={styles.bridgeMiniPulse}><BridgePulse delay={180} /></View>
    </Pressable>}
  </View>;
}

function BridgeArtifact({ title, detail, glyph, color = '#78ead4', onPress }: {
  title: string; detail: string; glyph: string; color?: string; onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}: ${detail}`} onPress={onPress} style={[styles.bridgeArtifact, { borderColor: `${color}77` }]}>
    <View style={styles.bridgeArtifactHead}><Text style={[styles.bridgeArtifactGlyph, { color, textShadowColor: color }]}>{glyph}</Text><BridgePulse color={color} /></View>
    <Text style={styles.bridgeArtifactTitle}>{title}</Text><Text numberOfLines={1} style={styles.bridgeArtifactDetail}>{detail}</Text>
  </Pressable>;
}
function attachCaptureSkins(events: CaptureEvent[], selections: SkinSelections, discovery: Run['skinDiscovery'] = null) {
  return events.map(event => ({ ...event, skinId: discovery?.category === `pickup:${event.kind}` ? discovery.skinId : event.skinId ?? (event.kind === 'jackpot' ? selections.pickups.treasure : event.kind === 'chargeBallBreak' ? selections.pickups.charge : event.kind === 'ramBlast' ? selections.pickups.ram : event.kind === 'merchantBreak' ? selections.pickups.merchant : event.kind === 'bubbleLost' ? selections.pickups.bubble : event.kind === 'creditLost' ? selections.pickups.credit : event.kind === 'engiEggBreak' ? selections.pickups['engi-egg'] : event.kind === 'explosion' || event.kind === 'overflowFailed' || event.kind === 'phaseRupture' || event.kind === 'phaseChestBreak' || event.kind === 'anchorBreak' || event.kind === 'combo' || event.kind === 'waldoFound' || event.kind === 'petRepair' || event.kind === 'petLost' || event.kind === 'petHatched' ? undefined : selections.pickups[event.kind]) }));
}

export default function App() {
  const nativeDimensions = useWindowDimensions();
  const [run, setRun] = useState<Run>(() => newRun());
  const runRef = useRef<Run>(run);
  const gestures = useRef<Record<string, Gesture>>({});
  const savedRef = useRef(false);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const queuedWalls = useRef<{ x: number; y: number; axis: Wall['axis'] }[]>([]);
  const [queuedWallPreview, setQueuedWallPreview] = useState<{ x: number; y: number; axis: Wall['axis'] }[]>([]);
  const [hasSave, setHasSave] = useState(false);
  const [board, setBoard] = useState({ width: 0, height: 0 });
  const boardRef = useRef<View>(null);
  const boardScreenRect = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [desktopStageArea, setDesktopStageArea] = useState({ width: 0, height: 0 });
  const stageSizeRef = useRef({ width: 0, height: 0 });
  const [viewport, setViewport] = useState(() => ({ width: typeof window === 'undefined' ? 1280 : (window.visualViewport?.width ?? window.innerWidth), height: typeof window === 'undefined' ? 800 : (window.visualViewport?.height ?? window.innerHeight) }));
  const portraitAutoPaused = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const resize = () => {
      const width = window.visualViewport?.width ?? window.innerWidth;
      const height = window.visualViewport?.height ?? window.innerHeight;
      setViewport({ width, height });
      const phone = Math.min(width, height) <= 600 && Math.max(width, height) <= 1200;
      if (phone && height > width && running && !paused) {
        portraitAutoPaused.current = true;
        setRunning(false);
        setPaused(true);
      } else if (height <= width && portraitAutoPaused.current) {
        portraitAutoPaused.current = false;
        setPaused(false);
        setRunning(true);
      }
    };
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    window.visualViewport?.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      window.visualViewport?.removeEventListener('resize', resize);
    };
  }, [running, paused]);
  const [mouseControl, setMouseControl] = useState(Platform.OS === 'web');
  const [notice, setNotice] = useState(Platform.OS === 'web' ? 'Click and drag vertically or horizontally to draw a wall' : 'Swipe vertically or horizontally to draw a wall');
  const [ramArmed, setRamArmed] = useState(false);
  const [captureEffects, setCaptureEffects] = useState<CaptureEvent[]>([]);
  const [wallBreakEffects, setWallBreakEffects] = useState<WallBreakEvent[]>([]);
  const [territoryEffects, setTerritoryEffects] = useState<TerritoryGainEvent[]>([]);
  const [creditGainEffects, setCreditGainEffects] = useState<CreditGainEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'game' | 'developer'>('game');
  const [developerOverlay, setDeveloperOverlay] = useState(false);
  const [cursorSkin, setCursorSkin] = useState<'crosshair' | 'spark' | 'halo'>('crosshair');
  const [mouseCursor, setMouseCursor] = useState<{ x: number; y: number; down: boolean } | null>(null);
  const [devTab, setDevTab] = useState<'gameplay' | 'events' | 'pickups' | 'metal-balls' | 'economy' | 'merchant' | 'pets'>('gameplay');
  const [metalBallTab, setMetalBallTab] = useState<'base' | 'modifiers'>('base');
  const [modifierPairFocus, setModifierPairFocus] = useState<BallModifier>('splitter');
  const modifierTypes = Object.keys(DEFAULT_MECHANICS.ballModifiers) as BallModifier[];
  const [expandedPickupSettings, setExpandedPickupSettings] = useState<PowerKind | null>(null);
  const [merchantOpen, setMerchantOpen] = useState(false);
  const [merchantOpenedAtClear, setMerchantOpenedAtClear] = useState(false);
  const [skinProgression, setSkinProgression] = useState<SkinProgression>(() => defaultSkinUnlocks());
  const skinProgressionRef = useRef(skinProgression);
  const [menuPage, setMenuPage] = useState<'home' | 'themes' | 'scores' | 'settings' | null>('home');
  const [bridgeRailVisible, setBridgeRailVisible] = useState(true);
  const [manualSave, setManualSave] = useState<Run | null>(null);
  const [confirmOverwriteSave, setConfirmOverwriteSave] = useState(false);
  const [confirmNewRun, setConfirmNewRun] = useState(false);
  const [skinAchievement, setSkinAchievement] = useState<SkinArchiveNode | null>(null);
  const [profileSaveOpen, setProfileSaveOpen] = useState(false);
  const [tuning, setTuning] = useState<MechanicsSettings>(() => getMechanicsSettings());
  const [skinSelections, setSkinSelections] = useState<SkinSelections>(() => DEFAULT_SKIN_SELECTIONS);
  const skinSelectionsRef = useRef(skinSelections);
  const visualSkinSelectionsRef = useRef(skinSelections);
  const levelClearSequence = useRef(0);
  const exitTransitionPending = useRef(false);
  const exitTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [levelClearAnimation, setLevelClearAnimation] = useState<{ id: number; level: number; style: MechanicsSettings['levelClearStyle']; durationMs: number } | null>(null);
  const commit = useCallback((next: Run, playCaptureEvents = false) => { const oldCredits = new Set((runRef.current.creditGainEvents ?? []).map(event => event.id)); const newCreditEvents = (next.creditGainEvents ?? []).filter(event => !oldCredits.has(event.id)); runRef.current = next; setRun({ ...next, balls: [...next.balls], walls: [...next.walls], powerups: [...next.powerups] }); if (newCreditEvents.length) setCreditGainEffects(old => [...old, ...newCreditEvents].slice(-6)); if (playCaptureEvents && next.captureEvents.length) setCaptureEffects(old => [...old, ...attachCaptureSkins(next.captureEvents, visualSkinSelectionsRef.current, next.skinDiscovery)].slice(-8)); }, []);
  const [profiles, setProfiles] = useState<TuningProfile[]>([]);
  const [profileName, setProfileName] = useState('');
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(null);
  const [pictureLibrary, setPictureLibraryState] = useState<PictureLibraryEntry[]>([]);
  const pictureLibraryRef = useRef(pictureLibrary);
  const [pictureLibraryNotice, setPictureLibraryNotice] = useState('Saved scenes are reused on future Picture levels. Import your own image files here too.');
  const [waldoLibrary, setWaldoLibraryState] = useState<WaldoLibraryEntry[]>([]);
  const waldoLibraryRef = useRef(waldoLibrary);
  const [waldoLibraryNotice, setWaldoLibraryNotice] = useState('Generated Waldo puzzles saved here can appear only in future Waldo events.');

  useEffect(() => {
    (async () => {
      try {
        const [save, boardScores, settingsSave, profilesSave, skinsSave, pictureLibrarySave, waldoLibrarySave, skinUnlocksSave, legacySkinUnlocksSave, manualSaveData] = await Promise.all([AsyncStorage.getItem(SAVE_KEY), AsyncStorage.getItem(`${SAVE_KEY}-scores`), AsyncStorage.getItem(SETTINGS_KEY), AsyncStorage.getItem(PROFILES_KEY), AsyncStorage.getItem(SKINS_KEY), AsyncStorage.getItem(PICTURE_LIBRARY_KEY), AsyncStorage.getItem(WALDO_LIBRARY_KEY), AsyncStorage.getItem(SKIN_UNLOCKS_V2_KEY), AsyncStorage.getItem('trap-game-skin-unlocks-v1'), AsyncStorage.getItem(MANUAL_SAVE_KEY)]);
        if (settingsSave) {
          const rawSettings = JSON.parse(settingsSave) as Partial<MechanicsSettings>; const legacyStorageSettings = rawSettings.resourceStorageUpgradeBaseCost === undefined; const savedSettings = normalizeMechanicsSettings(rawSettings); if (legacyStorageSettings) { if (savedSettings.overflowCreditValues.speed === 0) savedSettings.overflowCreditValues.speed = DEFAULT_MECHANICS.overflowCreditValues.speed; if (savedSettings.overflowCreditValues.ram === 0) savedSettings.overflowCreditValues.ram = DEFAULT_MECHANICS.overflowCreditValues.ram; }
          setTuning(savedSettings);
        }
        if (profilesSave) setProfiles((JSON.parse(profilesSave) as TuningProfile[]).map(profile => ({ ...profile, settings: normalizeMechanicsSettings(profile.settings), skins: normalizeSkinSelections(profile.skins ?? DEFAULT_SKIN_SELECTIONS) })));
        let loadedSkinSelections = skinsSave ? normalizeSkinSelections(JSON.parse(skinsSave)) : DEFAULT_SKIN_SELECTIONS;
        const progression = normalizeSkinUnlocks(skinUnlocksSave ? JSON.parse(skinUnlocksSave) : undefined);
        if (!skinUnlocksSave && legacySkinUnlocksSave) {
          const legacy = JSON.parse(legacySkinUnlocksSave) as { tiers?: Record<string, 1 | 2 | 3> };
          for (const [key, tier] of Object.entries(legacy.tiers ?? {})) {
            if (tier !== 1 && tier !== 2 && tier !== 3) continue;
            const [kind, ...idParts] = key.split(':'); const id = idParts.join(':');
            const target = `pickup:${kind}:${id}`;
            if (progression.tiers[target] !== undefined) progression.tiers[target] = tier;
          }
        }
        if (!skinUnlocksSave) loadedSkinSelections = DEFAULT_SKIN_SELECTIONS;
        for (const [category, selectedId] of Object.entries({ background: loadedSkinSelections.background, ball: loadedSkinSelections.ball, 'credit-symbol': loadedSkinSelections.credit, pet: loadedSkinSelections.engiPet, ...Object.fromEntries(Object.entries(loadedSkinSelections.pickups).map(([kind, id]) => [`pickup:${kind}`, id])) })) {
          if (!progression.unlocked[category]?.includes(selectedId)) {
            const fallback = SKIN_DEFAULTS[category];
            if (category === 'background') loadedSkinSelections = { ...loadedSkinSelections, background: fallback };
            else if (category === 'ball') loadedSkinSelections = { ...loadedSkinSelections, ball: fallback };
            else if (category === 'credit-symbol') loadedSkinSelections = { ...loadedSkinSelections, credit: fallback };
            else if (category === 'pet') loadedSkinSelections = { ...loadedSkinSelections, engiPet: fallback };
            else { const kind = category.slice('pickup:'.length) as PowerKind; loadedSkinSelections = { ...loadedSkinSelections, pickups: { ...loadedSkinSelections.pickups, [kind]: fallback } }; }
          }
        }
        setSkinSelections(loadedSkinSelections);
        skinProgressionRef.current = progression;
        setSkinProgression(progression);
        if (pictureLibrarySave) { const entries = JSON.parse(pictureLibrarySave) as PictureLibraryEntry[]; pictureLibraryRef.current = entries; setPictureLibraryState(entries); setPictureLibrary(entries); }
        if (waldoLibrarySave) { const entries = JSON.parse(waldoLibrarySave) as WaldoLibraryEntry[]; waldoLibraryRef.current = entries; setWaldoLibraryState(entries); setWaldoLibrary(entries); }
        if (save) { const parsed = JSON.parse(save) as Run; const legacyStorageRun = parsed.speedCapacityBonus === undefined; parsed.speedCharges ??= 0; parsed.ramCharges ??= 0; parsed.chargeCharges ??= 0; parsed.chargeCapacityBonus ??= 0; parsed.chargeCapacityPurchases ??= 0; parsed.overflowProcessingUpgradePurchases ??= 0; parsed.levelClearBubbleTimerMs ??= 0; parsed.levelClearBubbleAccumulatorMs ??= 0; parsed.levelClearAnimationRemainingMs ??= 0; parsed.levelEvent ??= 'none'; parsed.levelEventBannerUntilMs ??= 0; parsed.containmentMutations ??= []; parsed.containmentMutationScanRemainingMs ??= 0; parsed.chargeReadyUntil ??= null; parsed.speedCapacityBonus ??= 0; parsed.speedCapacityPurchases ??= parsed.speedCapacityBonus; parsed.ramCapacityBonus ??= 0; parsed.ramCapacityPurchases ??= parsed.ramCapacityBonus; parsed.waldoEventPending ??= false; parsed.mechanics = normalizeMechanicsSettings(parsed.mechanics); parsed.skinDiscovery ??= null; parsed.totalTerritoryClaimed ??= 0; parsed.ballsDestroyed ??= 0; parsed.ballsContained ??= 0; parsed.pickupsCaptured ??= 0; parsed.containedBallIds ??= []; parsed.containedCountedThisLevel ??= false; if (legacyStorageRun) { if (parsed.mechanics.overflowCreditValues.speed === 0) parsed.mechanics.overflowCreditValues.speed = DEFAULT_MECHANICS.overflowCreditValues.speed; if (parsed.mechanics.overflowCreditValues.ram === 0) parsed.mechanics.overflowCreditValues.ram = DEFAULT_MECHANICS.overflowCreditValues.ram; } parsed.lifeCapacity = Math.max(parsed.lives, parsed.lifeCapacity ?? parsed.mechanics.lifeStorageBaseCapacity); parsed.lifeCapacityPurchases ??= Math.max(0, parsed.lifeCapacity - parsed.mechanics.lifeStorageBaseCapacity); parsed.overflowJobs ??= []; parsed.overflowSuccessChance = Math.max(0, Math.min(100, parsed.overflowSuccessChance ?? parsed.mechanics.overflowBaseSuccessChance)); parsed.overflowUpgradePurchases ??= Math.max(0, Math.floor((parsed.overflowSuccessChance - parsed.mechanics.overflowBaseSuccessChance) / Math.max(1, parsed.mechanics.overflowUpgradeChanceIncrease))); parsed.waldoEligible ??= Math.random() >= parsed.mechanics.waldoIneligibleChance; parsed.merchantTokens ??= 0; parsed.credits ??= 0; parsed.powerBars ??= 0; parsed.powerBarsPurchased ??= 0; parsed.merchantUpgrades ??= { life: 0, speed: 0, ram: 0, treasure: 0, waldo: 0 }; parsed.merchantUpgrades.waldo ??= 0; for (const kind of Object.keys(DEFAULT_MECHANICS.containmentMutationPickupEnabled)) { parsed.merchantUpgrades[`mutationAffinity:${kind}`] ??= 0; parsed.merchantUpgrades[`mutationAttraction:${kind}`] ??= 0; } parsed.petEggs ??= 0; parsed.petEggVisitProgress ??= 0; parsed.pets ??= []; parsed.pets = parsed.pets.map(pet => ({ ...pet, species: pet.species ?? 'engi', paintings: pet.paintings ?? [] })); parsed.petIncubations ??= []; parsed.isotypesContained ??= false; parsed.isotypesNoticeUntilMs ??= 0; parsed.petNotice ??= null; parsed.petNoticeUntilMs ??= 0; parsed.levelClearPending ??= false; parsed.speedReadyUntil ??= null; parsed.captureEvents ??= []; parsed.wallBreakEvents ??= []; parsed.territoryGainEvents ??= []; parsed.creditGainEvents ??= []; parsed.treasureEligible ??= Math.random() < MECHANICS.treasureLevelEligibilityChance; parsed.treasureHuntPending ??= false; parsed.treasureHunt ??= null; if (parsed.treasureHunt) parsed.treasureHunt.revealed ??= false; parsed.pictureEvent ??= null; parsed.boardWidth ??= BOARD_W; parsed.boardHeight ??= 1100; parsed.gridCols ??= 48; parsed.gridRows ??= 72; parsed.walls = parsed.walls.map(w => ({ ...w, speedMultiplier: w.speedMultiplier ?? 1 })); parsed.powerups = (parsed.powerups ?? []).map(p => ({ ...p, skinId: p.kind === 'engi-egg' ? p.skinId ?? randomEngiCocoonSkin() : p.skinId, despawnAtMs: p.despawnAtMs ?? powerupDespawnAt(p.kind, parsed.elapsedMs ?? 0, parsed.mechanics) })); if (parsed.levelClearPending && !parsed.powerups.some(p => p.kind === 'exit')) parsed.powerups.push({ id: parsed.nextId++, kind: 'exit', x: parsed.boardWidth * 0.5, y: parsed.boardHeight * 0.5, vx: 0, vy: 0 }); if (!parsed.ended) { setMechanicsSettings(parsed.mechanics); const layout = boardLayoutFor(stageSizeRef.current.width, stageSizeRef.current.height); const restored = layout.displayWidth ? resizeRunBoard(parsed, layout.worldWidth, layout.worldHeight) : parsed; const capacitySafe = enforceChargeCapacities(restored); runRef.current = capacitySafe; setRun(capacitySafe); setHasSave(true); } }
        if (manualSaveData) setManualSave(JSON.parse(manualSaveData) as Run);
        if (boardScores) { const parsedScores = JSON.parse(boardScores) as Partial<ScoreEntry>[]; setScores(parsedScores.map(normalizeScoreEntry).sort((a, b) => b.score - a.score || b.ballsContained - a.ballsContained).slice(0, 5)); }
      } catch { setNotice('Could not load the saved run'); }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(tuning)).catch(() => {}); }, [loaded, tuning]);
  useEffect(() => { if (loaded) AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)).catch(() => {}); }, [loaded, profiles]);
  useEffect(() => {
    const settings = normalizeMechanicsSettings(tuning);
    setMechanicsSettings(settings);
    if (!loaded || activeTab !== 'developer' || runRef.current.ended) return;
    const current = runRef.current;
    const radiusScale = settings.ballRadius / Math.max(0.001, current.mechanics.ballRadius);
    const updated = { ...current, mechanics: settings, balls: current.balls.map(ball => ({ ...ball, r: ball.r * radiusScale })) };
    runRef.current = updated;
    setRun(updated);
  }, [activeTab, loaded, tuning]);
  useEffect(() => { pictureLibraryRef.current = pictureLibrary; setPictureLibrary(pictureLibrary); if (loaded) AsyncStorage.setItem(PICTURE_LIBRARY_KEY, JSON.stringify(pictureLibrary)).catch(() => {}); }, [loaded, pictureLibrary]);
  useEffect(() => { waldoLibraryRef.current = waldoLibrary; setWaldoLibrary(waldoLibrary); if (loaded) AsyncStorage.setItem(WALDO_LIBRARY_KEY, JSON.stringify(waldoLibrary)).catch(() => {}); }, [loaded, waldoLibrary]);
  useEffect(() => { skinSelectionsRef.current = skinSelections; }, [skinSelections]);
  useEffect(() => { if (loaded) AsyncStorage.setItem(SKINS_KEY, JSON.stringify(skinSelections)).catch(() => {}); }, [loaded, skinSelections]);
  useEffect(() => { skinProgressionRef.current = skinProgression; if (loaded) AsyncStorage.setItem(SKIN_UNLOCKS_V2_KEY, JSON.stringify(skinProgression)).catch(() => {}); }, [loaded, skinProgression]);

  const nextLevelAfterClear = useCallback((current: Run) => {
    exitTransitionPending.current = false;
    if (!current.levelClearPending || current.ended) return;
    const discovery = current.skinDiscovery;
    if (discovery && current.claimed >= discovery.requiredClaimed && (!discovery.requiresIsotypes || current.isotypesContained) && !skinProgressionRef.current.unlocked[discovery.category]?.includes(discovery.skinId)) {
      const updated = { ...skinProgressionRef.current, unlocked: { ...skinProgressionRef.current.unlocked, [discovery.category]: [...(skinProgressionRef.current.unlocked[discovery.category] ?? []), discovery.skinId] } };
      skinProgressionRef.current = updated; setSkinProgression(updated);
      const unlockedNode = SKIN_ARCHIVE.find(node => node.category === discovery.category && node.id === discovery.skinId);
      setSkinAchievement(unlockedNode ? { ...unlockedNode, tier: updated.tiers[`${discovery.category}:${discovery.skinId}`] ?? unlockedNode.tier } : null);
    }
    const pendingTreasure = current.treasureHuntPending;
    const next = newRun(current.level + 1, current.boardWidth, current.boardHeight, current.waldoEventPending);
    const continued = attachSkinDiscovery({ ...next, lives: current.lives, lifeCapacity: current.lifeCapacity, lifeCapacityPurchases: current.lifeCapacityPurchases, speedCapacityBonus: current.speedCapacityBonus, speedCapacityPurchases: current.speedCapacityPurchases, ramCapacityBonus: current.ramCapacityBonus, ramCapacityPurchases: current.ramCapacityPurchases, chargeCapacityBonus: current.chargeCapacityBonus, chargeCapacityPurchases: current.chargeCapacityPurchases, chargeCharges: current.chargeCharges, overflowProcessingUpgradePurchases: current.overflowProcessingUpgradePurchases, overflowJobs: current.overflowJobs, overflowSuccessChance: current.overflowSuccessChance, overflowUpgradePurchases: current.overflowUpgradePurchases, speedCharges: current.speedCharges, ramCharges: current.ramCharges, merchantTokens: current.merchantTokens, credits: current.credits, powerBars: current.powerBars, powerBarsPurchased: current.powerBarsPurchased, merchantUpgrades: current.merchantUpgrades, petEggs: current.petEggs, petEggVisitProgress: current.petEggVisitProgress, petIncubations: current.petIncubations, pets: current.pets.map(pet => ({ ...pet, deployed: false, vx: 0, vy: 0, repairedThisLevel: false, ...(pet.species === 'waldo' ? { paintings: [], nextPaintingAtMs: next.elapsedMs + next.mechanics.waldoPetPaintingIntervalMs } : {}) })), totalTerritoryClaimed: current.totalTerritoryClaimed, ballsDestroyed: current.ballsDestroyed, ballsContained: current.ballsContained, pickupsCaptured: current.pickupsCaptured, containedBallIds: [], isotypesContained: false, containedCountedThisLevel: false, isotypesNoticeUntilMs: 0, treasureHunt: pendingTreasure ? { x: randomBetween(40, current.boardWidth - 40), y: randomBetween(40, current.boardHeight - 40), remainingMs: current.mechanics.treasureHuntDurationMs, revealed: false } : null, territoryGainEvents: [], creditGainEvents: current.creditGainEvents, levelClearPending: false }, skinProgressionRef.current);
    commit(continued); setLevelClearAnimation(null); setMerchantOpenedAtClear(false); setPaused(false); queuedWalls.current = []; setQueuedWallPreview([]); setRunning(true); setNotice(`Stage ${String(continued.level).padStart(2, '0')} underway`);
  }, [commit, setLevelClearAnimation, setSkinAchievement, setSkinProgression]);

  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const current = runRef.current;
      const next = stepRun(current, Math.min(40, now - last), current.boardWidth, current.boardHeight);
      last = now;
      if (exitTransitionPending.current) return;
      if (!next.ended && next.captureEvents.some(event => event.kind === 'exit')) {
        exitTransitionPending.current = true;
        runRef.current = next;
        setRun({ ...next, balls: [...next.balls], walls: [...next.walls], powerups: [...next.powerups] });
        setCaptureEffects(old => [...old, ...attachCaptureSkins(next.captureEvents, visualSkinSelectionsRef.current, next.skinDiscovery)].slice(-8));
        exitTransitionTimer.current = setTimeout(() => nextLevelAfterClear(next), 1450);
        return;
      }
      if ((!current.levelClearPending && next.levelClearPending) || next.level > current.level) setLevelClearAnimation({ id: ++levelClearSequence.current, level: current.level, style: current.mechanics.levelClearStyle, durationMs: current.mechanics.levelClearAnimationDurationMs });
      if (!current.levelClearPending && next.levelClearPending) setNotice('Sector clear · capture the route beacon to continue');
      runRef.current = next;
      setRun({ ...next, balls: [...next.balls], walls: [...next.walls], powerups: [...next.powerups] });
      if (next.creditGainEvents.length) setCreditGainEffects(old => [...old, ...next.creditGainEvents].slice(-6));
      if (next.captureEvents.length) setCaptureEffects(old => [...old, ...attachCaptureSkins(next.captureEvents, visualSkinSelectionsRef.current, next.skinDiscovery)].slice(-8));
      if (next.wallBreakEvents.length) setWallBreakEffects(old => [...old, ...next.wallBreakEvents].slice(-6));
      if (next.territoryGainEvents.length) setTerritoryEffects(old => [...old, ...next.territoryGainEvents].slice(-4));
      if (next.ended) {
        setRunning(false);
        setNotice('Run over — start a new run when you are ready');
      }
    }, 33);
    return () => { clearInterval(timer); if (exitTransitionTimer.current) clearTimeout(exitTransitionTimer.current); exitTransitionTimer.current = null; exitTransitionPending.current = false; };
  }, [running, nextLevelAfterClear]);

  useEffect(() => {
    if (!loaded || run.ended) return;
    const timer = setInterval(() => { AsyncStorage.setItem(SAVE_KEY, JSON.stringify(runRef.current)).catch(() => {}); }, 2500);
    return () => clearInterval(timer);
  }, [loaded, run.ended]);

  useEffect(() => {
    if (!run.ended || savedRef.current) return;
    savedRef.current = true;
    (async () => {
      const entry: ScoreEntry = { score: run.level, level: run.level, claimed: run.claimed, totalTerritoryClaimed: run.totalTerritoryClaimed, ballsDestroyed: run.ballsDestroyed, ballsContained: run.ballsContained, pickupsCaptured: run.pickupsCaptured, timestamp: Date.now() };
      const previous = await AsyncStorage.getItem(`${SAVE_KEY}-scores`);
      const next = [...(previous ? (JSON.parse(previous) as Partial<ScoreEntry>[]).map(normalizeScoreEntry) : []), entry]
        .sort((a, b) => b.score - a.score || b.ballsContained - a.ballsContained || a.timestamp - b.timestamp)
        .slice(0, 5);
      setScores(next);
      await AsyncStorage.setItem(`${SAVE_KEY}-scores`, JSON.stringify(next));
      await AsyncStorage.removeItem(SAVE_KEY);
      setHasSave(false);
    })().catch(() => {});
  }, [run]);

  const startFresh = () => {
    const backgroundIndex = BACKGROUND_SKINS.findIndex(skin => skin.id === skinSelections.background);
    const runTuning = { ...tuning, backgroundColorIndex: backgroundIndex >= 0 ? backgroundIndex : 0, backgroundColors: BACKGROUND_SKINS.map(skin => skin.color) };
    setMechanicsSettings(runTuning);
    const layout = boardLayoutFor(stageSize.width, stageSize.height);
    const fresh = attachSkinDiscovery(newRun(1, layout.worldWidth, layout.worldHeight), skinProgressionRef.current);
    runRef.current = fresh; setRun(fresh); setHasSave(true); savedRef.current = false; void AsyncStorage.setItem(SAVE_KEY, JSON.stringify(fresh)); queuedWalls.current = []; setQueuedWallPreview([]); setPaused(false); setLevelClearAnimation(null); setMenuPage(null); setActiveTab('game'); setRunning(true);
    setNotice('Complete walls to claim regions without balls');
  };
  const saveActiveRunToSlot = async () => {
    const snapshot = JSON.parse(JSON.stringify(runRef.current)) as Run;
    await AsyncStorage.setItem(MANUAL_SAVE_KEY, JSON.stringify(snapshot));
    setManualSave(snapshot); setConfirmOverwriteSave(false); setNotice('Active run saved to the manual slot');
  };
  const loadManualRun = () => {
    if (!manualSave) return;
    const restored = { ...manualSave, mechanics: normalizeMechanicsSettings(manualSave.mechanics), skinDiscovery: manualSave.skinDiscovery ?? null, totalTerritoryClaimed: manualSave.totalTerritoryClaimed ?? 0, ballsDestroyed: manualSave.ballsDestroyed ?? 0, ballsContained: manualSave.ballsContained ?? 0, pickupsCaptured: manualSave.pickupsCaptured ?? 0, containedBallIds: manualSave.containedBallIds ?? [], containedCountedThisLevel: manualSave.containedCountedThisLevel ?? false };
    setMechanicsSettings(restored.mechanics); runRef.current = restored; setRun(restored); setHasSave(true); savedRef.current = false; void AsyncStorage.setItem(SAVE_KEY, JSON.stringify(restored)); setMenuPage(null); setActiveTab('game'); setPaused(false); setRunning(!restored.ended); setNotice('Manual run save loaded');
  };
  const openMainMenu = (page: 'home' | 'themes' | 'scores' | 'settings' = 'home') => { setMerchantOpen(false); setMenuPage(page); setConfirmOverwriteSave(false); };
  const resume = () => { setMenuPage(null); setActiveTab('game'); setPaused(false); setRunning(!runRef.current.ended); setNotice(runRef.current.ended ? 'Run ended · start a new run to continue' : 'Run resumed'); };
  const togglePause = useCallback(() => {
    if (running) { setRunning(false); setPaused(true); setRamArmed(false); setNotice('Draw a wall now to queue it for resume'); return; }
    if (!paused || runRef.current.ended) return;
    let next = runRef.current;
    const queued = queuedWalls.current.splice(0);
    setQueuedWallPreview([]);
    for (const wall of queued) next = startWall(next, wall.x, wall.y, wall.axis);
    if (next !== runRef.current) commit(next);
    setPaused(false); setRunning(true); setNotice(queued.length ? 'Run resumed · queued wall drawing started' : 'Run resumed');
  }, [running, paused, commit]);
  const togglePauseRef = useRef(togglePause);
  useEffect(() => { togglePauseRef.current = togglePause; }, [togglePause]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) return;
      if (event.code === 'Space') { if (target?.closest('button,[role="button"]')) return; event.preventDefault(); if (running || paused) togglePauseRef.current(); return; }
      if (activeTab !== 'game' || !running) return;
      if (event.repeat) return;
      if (event.key.toLowerCase() === 'w') { if (runRef.current.speedCharges > 0 && runRef.current.speedReadyUntil === null) commit(activateSpeed(runRef.current)); }
      else if (event.key === 'Shift' && runRef.current.ramCharges > 0) setRamArmed(value => !value);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, running, paused, commit]);
  const openMerchant = (atClear: boolean) => {
    const current = runRef.current;
    if (!current.merchantTokens) return;
    commit({ ...current, merchantTokens: current.merchantTokens - 1 });
    setMerchantOpenedAtClear(atClear); setMerchantOpen(true); setRunning(false);
  };
  const closeMerchant = () => { setMerchantOpen(false); setPaused(false); setMerchantOpenedAtClear(false); setRunning(!runRef.current.ended); };
  const upgradeOverflowRefinery = () => { const current = runRef.current; const cost = overflowRefineryUpgradeCost(current); if (current.credits < cost || current.overflowSuccessChance >= 100) return; commit({ ...current, credits: current.credits - cost, overflowSuccessChance: Math.min(100, current.overflowSuccessChance + current.mechanics.overflowUpgradeChanceIncrease), overflowUpgradePurchases: current.overflowUpgradePurchases + 1 }); };
  const saveCurrentSettingsProfile = () => {
    const name = profileName.trim();
    if (!name) return;
    const profile: TuningProfile = { name, settings: normalizeMechanicsSettings(tuning), skins: normalizeSkinSelections(skinSelections) };
    setProfiles(old => [...old.filter(saved => saved.name.toLowerCase() !== name.toLowerCase()), profile]);
    setSelectedProfileName(name);
    setProfileName(''); setProfileSaveOpen(false);
  };
  const updateSelectedSettingsProfile = () => {
    if (!selectedProfileName) return;
    const profile: TuningProfile = { name: selectedProfileName, settings: normalizeMechanicsSettings(tuning), skins: normalizeSkinSelections(skinSelections) };
    setProfiles(old => old.map(saved => saved.name === selectedProfileName ? profile : saved));
  };
  const equipSettingsProfile = (profile: TuningProfile) => {
    const settings = normalizeMechanicsSettings(profile.settings);
    const skins = normalizeSkinSelections(profile.skins ?? DEFAULT_SKIN_SELECTIONS);
    setTuning(settings); setSkinSelections(skins); setMechanicsSettings(settings);
    setSelectedProfileName(profile.name);
    commit({ ...runRef.current, mechanics: settings });
  };
  const equipArchiveSkin = (node: SkinArchiveNode) => {
    if (!skinProgressionRef.current.unlocked[node.category]?.includes(node.id)) return;
    if (node.category === 'background') { const index = BACKGROUND_SKINS.findIndex(skin => skin.id === node.id); setSkinSelections(old => ({ ...old, background: node.id })); setTuning(old => ({ ...old, autoBackground: false, backgroundColorIndex: Math.max(0, index), backgroundColors: BACKGROUND_SKINS.map(skin => skin.color) })); }
    else if (node.category === 'ball') setSkinSelections(old => ({ ...old, ball: node.id }));
    else if (node.category === 'credit-symbol') setSkinSelections(old => ({ ...old, credit: node.id }));
    else if (node.category === 'pet') setSkinSelections(old => ({ ...old, engiPet: node.id }));
    else if (node.category.startsWith('pickup:')) { const kind = node.category.slice(7) as PowerKind; setSkinSelections(old => ({ ...old, pickups: { ...old.pickups, [kind]: node.id } })); }
  };
  const unlockAllArchiveSkins = () => {
    const unlocked = { ...skinProgressionRef.current.unlocked };
    for (const category of SKIN_CATEGORY_KEYS) unlocked[category] = [...new Set([...(unlocked[category] ?? []), ...SKIN_ARCHIVE.filter(node => node.category === category).map(node => node.id)])];
    const next = { ...skinProgressionRef.current, unlocked };
    skinProgressionRef.current = next; setSkinProgression(next);
  };
  const beginEngiIncubation = () => { const skin = ENGI_PET_SKINS[Math.floor(Math.random() * ENGI_PET_SKINS.length)]; commit(startEngiIncubation(runRef.current, skin.id), true); };
  const purchaseEngi = () => { const skin = ENGI_PET_SKINS[Math.floor(Math.random() * ENGI_PET_SKINS.length)]; commit(hireEngi(runRef.current, skin.id)); };
  const upgradeEngiPet = (id: number) => commit(upgradeEngi(runRef.current, id));
  const renameEngiPet = (id: number, name: string) => commit({ ...runRef.current, pets: runRef.current.pets.map(pet => pet.id === id ? { ...pet, name } : pet) });
  const buyPowerBar = () => { const current = runRef.current; const cost = getMerchantPowerBarCost(current); if (current.credits < cost) return; commit({ ...current, credits: current.credits - cost, powerBars: current.powerBars + 1, powerBarsPurchased: current.powerBarsPurchased + 1 }); };
  const expandLifeVault = () => { const current = runRef.current; const cost = lifeStorageUpgradeCost(current); if (current.credits < cost) return; commit({ ...current, credits: current.credits - cost, lifeCapacity: current.lifeCapacity + 1, lifeCapacityPurchases: current.lifeCapacityPurchases + 1 }); };
  const expandChargeCapacity = (kind: 'speed' | 'ram' | 'charge') => { const current = runRef.current; const cost = chargeStorageUpgradeCost(current, kind); if (current.credits < cost) return; const update = kind === 'speed' ? { speedCapacityBonus: current.speedCapacityBonus + 1, speedCapacityPurchases: current.speedCapacityPurchases + 1 } : kind === 'ram' ? { ramCapacityBonus: current.ramCapacityBonus + 1, ramCapacityPurchases: current.ramCapacityPurchases + 1 } : { chargeCapacityBonus: current.chargeCapacityBonus + 1, chargeCapacityPurchases: current.chargeCapacityPurchases + 1 }; commit({ ...current, ...update, credits: current.credits - cost }); };
  const upgradeSmelterSpeed = () => { const current = runRef.current; const cost = overflowProcessingUpgradeCost(current); if (current.credits < cost || current.mechanics.overflowProcessingMs <= current.mechanics.overflowProcessingMinimumMs) return; const nextMs = Math.max(current.mechanics.overflowProcessingMinimumMs, Math.ceil(current.mechanics.overflowProcessingMs * (1 - current.mechanics.overflowProcessingReductionPercent / 100))); const mechanics = { ...current.mechanics, overflowProcessingMs: nextMs }; setMechanicsSettings(mechanics); setTuning(mechanics); commit({ ...current, credits: current.credits - cost, mechanics, overflowProcessingUpgradePurchases: current.overflowProcessingUpgradePurchases + 1 }); };
  const installPowerBar = (kind: UpgradeKind) => {
    const current = runRef.current;
    const containmentTrack = kind.startsWith('mutationAffinity:') || kind.startsWith('mutationAttraction:');
    if (current.powerBars <= 0 || (!containmentTrack && !current.mechanics.merchantRewardsEnabled[kind as keyof MechanicsSettings['merchantRewardsEnabled']])) return;
    const settings = current.mechanics, perBar = settings.merchantUpgradePerBar;
    if (containmentTrack) {
      const branch = kind.startsWith('mutationAffinity:') ? 'mutationAffinity' : 'mutationAttraction';
      const itemKind = kind.slice(branch.length + 1) as ContainmentPickupKind;
      const step = branch === 'mutationAffinity' ? perBar.mutationAffinityPercent : perBar.mutationAttractionPercent;
      if (Math.min(60, ((current.merchantUpgrades[kind] ?? 0) + 1) * step) <= Math.min(60, (current.merchantUpgrades[kind] ?? 0) * step)) return;
      if (!settings.containmentMutationPickupEnabled[itemKind]) return;
    }
    const nextSettings = normalizeMechanicsSettings({ ...settings,
      powerupSpawnWeights: kind === 'life' ? { ...settings.powerupSpawnWeights, life: settings.powerupSpawnWeights.life + perBar.lifeSpawnWeight } : settings.powerupSpawnWeights,
      powerupDespawnSeconds: kind === 'life' ? { ...settings.powerupDespawnSeconds, life: settings.powerupDespawnSeconds.life + perBar.lifeLifetimeSeconds } : settings.powerupDespawnSeconds,
      speedBoostMultiplier: kind === 'speed' ? settings.speedBoostMultiplier + perBar.speedPercent / 100 : settings.speedBoostMultiplier,
      missExplosionRadius: kind === 'ram' ? settings.missExplosionRadius * (1 + perBar.ramPercent / 100) : settings.missExplosionRadius,
      missExplosionStrength: kind === 'ram' ? settings.missExplosionStrength * (1 + perBar.ramPercent / 100) : settings.missExplosionStrength,
      treasureRewardMin: kind === 'treasure' ? settings.treasureRewardMin + perBar.treasureRewards : settings.treasureRewardMin,
      treasureRewardMax: kind === 'treasure' ? settings.treasureRewardMax + perBar.treasureRewards : settings.treasureRewardMax,
      waldoPetPaintingCredits: kind === 'waldo' ? settings.waldoPetPaintingCredits + perBar.waldoPaintingCredits : settings.waldoPetPaintingCredits,
    });
    setMechanicsSettings(nextSettings);
    commit({ ...current, mechanics: nextSettings, powerBars: current.powerBars - 1, merchantUpgrades: { ...current.merchantUpgrades, [kind]: (current.merchantUpgrades[kind] ?? 0) + 1 } });
  };
  const spawnTestPickup = (kind: PowerKind) => {
    const current = runRef.current;
    const nextId = current.nextId;
    commit({ ...current, nextId: nextId + 1, powerups: [...current.powerups, { id: nextId, kind, skinId: kind === 'engi-egg' ? randomEngiCocoonSkin() : undefined, x: randomBetween(current.boardWidth / 2 - 40, current.boardWidth / 2 + 40), y: randomBetween(current.boardHeight / 2 - 40, current.boardHeight / 2 + 40), vx: randomBetween(-45, 45), vy: randomBetween(-45, 45), despawnAtMs: powerupDespawnAt(kind, current.elapsedMs, current.mechanics) }] });
  };
  const saveCurrentPicture = async () => {
    if (!run.pictureEvent) { setPictureLibraryNotice('Start a run to generate a Picture event scene first.'); return; }
    const existing = pictureLibraryRef.current.some(entry => entry.id === run.pictureEvent?.pictureId || (!run.pictureEvent?.pictureId && entry.seed === run.pictureEvent?.seed));
    if (existing) { setPictureLibraryNotice('This picture is already in your library.'); return; }
    const entry: PictureLibraryEntry = { id: `scene-${run.pictureEvent.seed}-${Date.now()}`, name: `Picture scene ${pictureLibraryRef.current.length + 1}`, seed: run.pictureEvent.seed, generatedBackdropId: run.pictureEvent.generatedBackdropId };
    if (Platform.OS !== 'web') {
      try {
        const directory = new Directory(Paths.document, 'ContainmentPictureLibrary');
        if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
        const sceneFile = new File(directory, `${entry.id}.scene.json`);
        sceneFile.create({ overwrite: true, intermediates: true });
        sceneFile.write(JSON.stringify({ type: entry.generatedBackdropId === undefined ? 'procedural-picture' : 'generated-image-picture', name: entry.name, seed: entry.seed, generatedBackdropId: entry.generatedBackdropId }));
      } catch { setPictureLibraryNotice('Could not write this scene to the local picture folder.'); return; }
    }
    setPictureLibraryState(old => [...old, entry]);
    setPictureLibraryNotice(`Saved “${entry.name}” to the saved backgrounds used by future Picture events.`);
  };
  const removePicture = (entry: PictureLibraryEntry) => {
    if (Platform.OS !== 'web' && entry.uri) {
      try {
        const folderUri = new Directory(Paths.document, 'ContainmentPictureLibrary').uri;
        if (entry.uri.startsWith(folderUri)) new File(entry.uri).delete();
      } catch { /* Keep the collection usable if an old image file is already missing. */ }
    }
    if (Platform.OS !== 'web' && entry.id.startsWith('scene-')) {
      try { const file = new File(new Directory(Paths.document, 'ContainmentPictureLibrary'), `${entry.id}.scene.json`); if (file.exists) file.delete(); } catch { /* The collection remains authoritative if a scene file is missing. */ }
    }
    setPictureLibraryState(old => old.filter(item => item.id !== entry.id));
  };
  const saveCurrentWaldo = async () => {
    const event = runRef.current.pictureEvent;
    if (!event?.isWaldo || event.waldoX === undefined || event.waldoY === undefined) { setWaldoLibraryNotice('Start a Waldo Picture level to save its puzzle.'); return; }
    if (waldoLibraryRef.current.some(entry => entry.seed === event.seed && Math.abs(entry.waldoX - event.waldoX!) < 0.0001 && Math.abs(entry.waldoY - event.waldoY!) < 0.0001)) { setWaldoLibraryNotice('This Waldo puzzle is already saved.'); return; }
    const entry: WaldoLibraryEntry = { id: `waldo-${event.seed}-${Date.now()}`, name: `Waldo crowd ${waldoLibraryRef.current.length + 1}`, seed: event.seed, waldoX: event.waldoX, waldoY: event.waldoY };
    if (Platform.OS !== 'web') {
      try {
        const directory = new Directory(Paths.document, 'ContainmentWaldoLibrary');
        if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
        const file = new File(directory, `${entry.id}.scene.json`);
        file.create({ overwrite: true, intermediates: true });
        file.write(JSON.stringify({ type: 'waldo-picture', ...entry }));
      } catch { setWaldoLibraryNotice('Could not save this Waldo puzzle to the local event folder.'); return; }
    }
    setWaldoLibraryState(old => [...old, entry]);
    setWaldoLibraryNotice(`Saved “${entry.name}” to the Waldo-only puzzle library.`);
  };
  const removeWaldo = (entry: WaldoLibraryEntry) => {
    if (Platform.OS !== 'web' && entry.id.startsWith('waldo-')) {
      try { const file = new File(new Directory(Paths.document, 'ContainmentWaldoLibrary'), `${entry.id}.scene.json`); if (file.exists) file.delete(); } catch { /* Keep the saved list usable if its recipe file is missing. */ }
    }
    setWaldoLibraryState(old => old.filter(item => item.id !== entry.id));
  };
  const importPicture = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/png', 'image/jpeg', 'image/webp'], copyToCacheDirectory: true, base64: Platform.OS === 'web', multiple: false });
      if (result.canceled || !result.assets.length) return;
      const asset = result.assets[0];
      const id = `import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      let uri = asset.uri;
      if (Platform.OS === 'web') {
        if (!asset.base64) { setPictureLibraryNotice('The browser could not read that image. Try a PNG or JPEG.'); return; }
        if (asset.base64.length > 1_000_000 || pictureLibraryRef.current.reduce((sum, entry) => sum + (entry.uri?.startsWith('data:') ? entry.uri.length : 0), 0) + asset.base64.length > 2_000_000) {
          setPictureLibraryNotice('That image exceeds the browser library limit. Use images under about 750 KB each; the library stores about 1.5 MB total in browser storage.'); return;
        }
        uri = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
      } else {
        const directory = new Directory(Paths.document, 'ContainmentPictureLibrary');
        if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
        const extension = asset.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'img';
        const destination = new File(directory, `${id}.${extension}`);
        await new File(asset.uri).copy(destination);
        uri = destination.uri;
      }
      const entry: PictureLibraryEntry = { id, name: asset.name.replace(/\.[^.]+$/, ''), seed: Math.floor(Math.random() * 2_147_483_647), uri };
      setPictureLibraryState(old => [...old, entry]);
      setPictureLibraryNotice(`Imported “${entry.name}” into your Picture Library.`);
    } catch (error) {
      setPictureLibraryNotice(error instanceof Error ? `Could not import image: ${error.message}` : 'Could not import that image.');
    }
  };
  const handleStageLayout = (width: number, height: number) => {
    stageSizeRef.current = { width, height };
    setStageSize({ width, height });
    if (!width || !height) return;
    const layout = boardLayoutFor(width, height), current = runRef.current;
    if (Math.abs((current.boardWidth || BOARD_W) - layout.worldWidth) > 0.1 || Math.abs((current.boardHeight || BOARD_H) - layout.worldHeight) > 0.1) commit(resizeRunBoard(current, layout.worldWidth, layout.worldHeight));
  };
  const handleTapAt = (x: number, y: number) => {
    if (running) {
      const current = runRef.current;
      const tappedPickup = tapPickupAt(current, x, y);
      if (tappedPickup !== current) { commit(tappedPickup, true); setRamArmed(false); return; }
    }
    if (ramArmed && running) { commit(ramAt(runRef.current, x, y), true); setRamArmed(false); }
  };
  const finishGesture = (origin: Gesture | undefined, x: number, y: number) => {
    if (!origin || (!running && !paused)) return;
    const dx = x - origin.x, dy = y - origin.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) { if (!paused) handleTapAt(origin.x, origin.y); return; }
    if (ramArmed) return;
    const axis = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
    if (paused) { queuedWalls.current.push({ x: origin.x, y: origin.y, axis }); setQueuedWallPreview([...queuedWalls.current]); setNotice(`Wall queued · ${queuedWalls.current.length} will start when resumed`); return; }
    const next = startWall(runRef.current, origin.x, origin.y, axis);
    runRef.current = next; setRun({ ...next, walls: [...next.walls] });
  };
  const collectTouches = (event: any, phase: 'start' | 'end' | 'cancel') => {
    const native = event.nativeEvent;
    const list = native.changedTouches?.length ? native.changedTouches : [native];
    for (const touch of list) {
      const id = String(touch.identifier ?? 0);
      const rect = boardScreenRect.current;
      const pageX = touch.pageX ?? native.pageX;
      const pageY = touch.pageY ?? native.pageY;
      const scrollX = Platform.OS === 'web' && typeof window !== 'undefined' ? window.scrollX : 0;
      const scrollY = Platform.OS === 'web' && typeof window !== 'undefined' ? window.scrollY : 0;
      const px = typeof pageX === 'number' && rect.width > 0 ? pageX - scrollX - rect.x : touch.locationX ?? native.locationX ?? 0;
      const py = typeof pageY === 'number' && rect.height > 0 ? pageY - scrollY - rect.y : touch.locationY ?? native.locationY ?? 0;
      if (phase === 'start') gestures.current[id] = { x: px / Math.max(1, board.width) * runRef.current.boardWidth, y: py / Math.max(1, board.height) * runRef.current.boardHeight };
      else {
        const origin = gestures.current[id];
        delete gestures.current[id];
        if (phase === 'cancel') continue;
        const x = px / Math.max(1, board.width) * runRef.current.boardWidth;
        const y = py / Math.max(1, board.height) * runRef.current.boardHeight;
        finishGesture(origin, x, y);
      }
    }
  };
  const pointerGesture = (event: any, phase: 'start' | 'end' | 'cancel') => {
    const native = event.nativeEvent;
    if (!mouseControl || native.pointerType !== 'mouse') return;
    event.preventDefault?.();
    const id = `pointer-${native.pointerId ?? 0}`;
    if (phase === 'start') {
      const x = native.locationX ?? native.offsetX ?? 0;
      const y = native.locationY ?? native.offsetY ?? 0;
      gestures.current[id] = { x: x / Math.max(1, board.width) * runRef.current.boardWidth, y: y / Math.max(1, board.height) * runRef.current.boardHeight };
      if (typeof native.pointerId === 'number') {
        try { event.currentTarget?.setPointerCapture?.(native.pointerId); } catch { /* pointer capture is optional */ }
      }
    } else {
      const origin = gestures.current[id];
      delete gestures.current[id];
      if (phase === 'cancel') return;
      const x = native.locationX ?? native.offsetX ?? 0;
      const y = native.locationY ?? native.offsetY ?? 0;
      finishGesture(origin, x / Math.max(1, board.width) * runRef.current.boardWidth, y / Math.max(1, board.height) * runRef.current.boardHeight);
    }
  };

  const worldLayout = boardLayoutFor(stageSize.width, stageSize.height);
  const sx = board.width / run.boardWidth;
  const sy = board.height / run.boardHeight;
  // Desktop classification follows the live browser viewport; board geometry
  // itself is allocated by the flex layout from the remaining content height.
  const webViewportHeight = viewport.height;
  const webViewportWidth = viewport.width;
  const phoneViewport = Platform.OS === 'web' && Math.min(webViewportWidth, webViewportHeight) <= 600 && Math.max(webViewportWidth, webViewportHeight) <= 1200;
  const isPhonePortrait = phoneViewport && webViewportHeight > webViewportWidth;
  const isPhoneLandscape = phoneViewport && webViewportWidth >= webViewportHeight;
  const desktopBoardHeight = Math.max(0, Math.min(desktopStageArea.height, desktopStageArea.width / 1.6));
  const arenaWidth = worldLayout.displayWidth;
  const arenaHeight = worldLayout.displayHeight;
  const lifeCapacity = Math.max(run.lives, run.lifeCapacity ?? run.mechanics.lifeStorageBaseCapacity);
  const runSettings = run.mechanics ?? getMechanicsSettings();
  const visualSkins = useMemo(() => {
    const discovery = run.skinDiscovery;
    if (!discovery) return skinSelections;
    if (discovery.category === 'background') return { ...skinSelections, background: discovery.skinId };
    if (discovery.category === 'ball') return { ...skinSelections, ball: discovery.skinId };
    if (discovery.category === 'credit-symbol') return { ...skinSelections, credit: discovery.skinId };
    if (discovery.category === 'pet') return { ...skinSelections, engiPet: discovery.skinId };
    if (discovery.category.startsWith('pickup:')) { const kind = discovery.category.slice(7) as PowerKind; return { ...skinSelections, pickups: { ...skinSelections.pickups, [kind]: discovery.skinId } }; }
    return skinSelections;
  }, [run.skinDiscovery, skinSelections]);
  useEffect(() => { visualSkinSelectionsRef.current = visualSkins; }, [visualSkins]);
  const discoveryNode = run.skinDiscovery ? SKIN_ARCHIVE.find(node => node.category === run.skinDiscovery?.category && node.id === run.skinDiscovery?.skinId) : undefined;
  const selectedBackground = BACKGROUND_SKINS.find(skin => skin.id === visualSkins.background) ?? BACKGROUND_SKINS[0];
  const legacyDefaultPalette = runSettings.backgroundColors.length === 5 && runSettings.backgroundColors.every((color, index) => color === ['#0b1728', '#17112b', '#102321', '#251623', '#17202a'][index]);
  const backgroundCycleIndex = (run.level - 1) % BACKGROUND_SKINS.length;
  const discoveryBackground = run.skinDiscovery?.category === 'background';
  const pictureEntry = run.pictureEvent?.pictureId ? pictureLibrary.find(entry => entry.id === run.pictureEvent?.pictureId) : undefined;
  const tint = discoveryBackground ? selectedBackground.color : tuning.autoBackground
    ? legacyDefaultPalette ? BACKGROUND_SKINS[backgroundCycleIndex].color : runSettings.backgroundColors[(run.level - 1) % runSettings.backgroundColors.length]
    : selectedBackground.color;
  const activeBackground = discoveryBackground ? selectedBackground : tuning.autoBackground
    ? BACKGROUND_SKINS.find(skin => skin.color === tint) ?? BACKGROUND_SKINS[backgroundCycleIndex]
    : selectedBackground;
  const uiWidth = Platform.OS === 'web' ? viewport.width : nativeDimensions.width;
  const uiHeight = Platform.OS === 'web' ? viewport.height : nativeDimensions.height;
  const compactBridge = uiWidth < 920 || uiHeight < 650;
  const portraitBridge = uiHeight > uiWidth;
  const bridgePictureSource: ImageSourcePropType | undefined = run.pictureEvent?.isWaldo ? undefined
    : pictureEntry?.uri ? { uri: pictureEntry.uri }
      : (pictureEntry?.generatedBackdropId ?? run.pictureEvent?.generatedBackdropId) !== undefined
        ? GENERATED_PICTURE_BACKDROPS[(pictureEntry?.generatedBackdropId ?? run.pictureEvent?.generatedBackdropId ?? 0) % GENERATED_PICTURE_BACKDROPS.length]
        : undefined;
  const claimRects = useMemo(() => {
    const cols = run.gridCols, rows = run.gridRows, rects: { key: string; x: number; y: number; width: number }[] = [];
    for (let y = 0; y < rows; y++) {
      let x = 0;
      while (x < cols) {
        if (!run.claimMask?.[y * cols + x]) { x++; continue; }
        const start = x;
        while (x < cols && run.claimMask[y * cols + x]) x++;
        rects.push({ key: `${y}-${start}`, x: start, y, width: x - start });
      }
    }
    return rects;
  }, [run.claimMask, run.gridCols, run.gridRows]);
  const openRects = useMemo(() => {
    const cols = run.gridCols, rows = run.gridRows, rects: { key: string; x: number; y: number; width: number }[] = [];
    for (let y = 0; y < rows; y++) {
      let x = 0;
      while (x < cols) {
        if (run.claimMask?.[y * cols + x]) { x++; continue; }
        const start = x;
        while (x < cols && !run.claimMask?.[y * cols + x]) x++;
        rects.push({ key: `${y}-${start}`, x: start, y, width: x - start });
      }
    }
    return rects;
  }, [run.claimMask, run.gridCols, run.gridRows]);
  // Size reveal masks as percentages of the actual stage container. Using
  // cached onLayout pixels here can truncate the art/mask when the stage flexes.
  const openRectFractions = useMemo(() => openRects.map(rect => ({
    key: rect.key,
    left: rect.x / run.gridCols,
    top: rect.y / run.gridRows,
    width: rect.width / run.gridCols,
    height: 1 / run.gridRows,
  })), [openRects, run.gridCols, run.gridRows]);
  const finishPetDrag = (pet: CompanionPet, event: any) => {
    event?.stopPropagation?.();
    const point = event?.nativeEvent ?? event ?? {};
    const px = point.pageX ?? point.clientX ?? 0, py = point.pageY ?? point.clientY ?? 0;
    const rect = boardScreenRect.current;
    if (px >= rect.x && py >= rect.y && px <= rect.x + rect.width && py <= rect.y + rect.height) {
      const x = (px - rect.x) / rect.width * runRef.current.boardWidth;
      const y = (py - rect.y) / rect.height * runRef.current.boardHeight;
      const current = runRef.current, deployed = deployEngi(current, pet.id, x, y, true);
      if (deployed === current && pet.species === 'waldo') commit({ ...current, petNotice: 'WALDO NEEDS OPEN, UNCLAIMED SPACE', petNoticeUntilMs: current.elapsedMs + 2600 });
      else commit(deployed);
    } else if (pet.deployed) commit(deployEngi(runRef.current, pet.id, pet.x, pet.y, false));
  };
  const petDragHandlers = (pet: CompanionPet) => ({
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (event: any) => event.stopPropagation?.(),
    onResponderRelease: (event: any) => finishPetDrag(pet, event),
    onTouchStart: (event: any) => event.stopPropagation?.(),
    onTouchEnd: (event: any) => finishPetDrag(pet, event),
    onPointerDown: (event: any) => event.stopPropagation?.(),
    onPointerUp: (event: any) => finishPetDrag(pet, event),
  } as any);

  const abilityRail = <View style={[styles.abilityRail, isPhoneLandscape && styles.phoneAbilityRail, Platform.OS === 'web' && !phoneViewport && desktopHudStyles.abilityRail]}>
    <View style={[styles.railAbility, isPhoneLandscape && styles.phoneRailAbility]}>
      <Text style={styles.abilityLabel}>SPEED</Text><Pressable accessibilityRole="button" accessibilityLabel="Queue one no-capture wall, W on keyboard" onTouchStart={(e: any) => e.stopPropagation()} onPointerDown={(e: any) => e.stopPropagation()} disabled={!running || run.speedCharges < 1 || run.speedReadyUntil !== null} onPress={() => commit(activateSpeed(runRef.current))} style={[styles.abilityButton, isPhoneLandscape && styles.phoneAbilityButton, run.speedReadyUntil !== null && (run.speedReadyUntil - run.elapsedMs < 2000 ? styles.speedExpiring : styles.speedReady), run.speedCharges < 1 && styles.abilityDisabled]}><Text pointerEvents="none" style={styles.abilityKeyHint}>W</Text><HudPickupIcon kind="speed" skinId={visualSkins.pickups.speed} size={17} /><HudChargeIcons kind="speed" skinId={visualSkins.pickups.speed} count={run.speedCharges} /></Pressable>
      <Text style={styles.storageReadout}>{run.speedCharges} / {chargeCapacity(run, 'speed')} STORED</Text><Pressable accessibilityRole="button" accessibilityLabel={`Expand Speed storage for ${chargeStorageUpgradeCost(run, 'speed')} Credits`} disabled={run.credits < chargeStorageUpgradeCost(run, 'speed')} onPress={() => expandChargeCapacity('speed')} style={[styles.storageUpgrade, run.credits < chargeStorageUpgradeCost(run, 'speed') && styles.storageUpgradeDisabled]}><Text style={styles.storageUpgradeText}>+ SLOT · {chargeStorageUpgradeCost(run, 'speed')} C</Text></Pressable>
      {run.speedReadyUntil !== null && <Text style={styles.readyTimer}>NO CLAIM · {Math.max(0, (run.speedReadyUntil - run.elapsedMs) / 1000).toFixed(1)}s</Text>}
    </View>
    <View style={[styles.railAbility, isPhoneLandscape && styles.phoneRailAbility]}>
      <Text style={styles.abilityLabel}>RAM</Text><Pressable accessibilityRole="button" accessibilityLabel="Activate RAM, Shift on keyboard" onTouchStart={(e: any) => e.stopPropagation()} onPointerDown={(e: any) => e.stopPropagation()} disabled={!running || run.ramCharges < 1} onPress={() => setRamArmed(value => !value)} style={[styles.abilityButton, isPhoneLandscape && styles.phoneAbilityButton, styles.ramButton, ramArmed && styles.ramArmed, run.ramCharges < 1 && styles.abilityDisabled]}><Text pointerEvents="none" style={styles.abilityKeyHint}>SHIFT</Text><HudPickupIcon kind="ram" skinId={visualSkins.pickups.ram} size={17} /><HudChargeIcons kind="ram" skinId={visualSkins.pickups.ram} count={run.ramCharges} /></Pressable>
      <Text style={styles.storageReadout}>{run.ramCharges} / {chargeCapacity(run, 'ram')} STORED</Text><Pressable accessibilityRole="button" accessibilityLabel={`Expand RAM storage for ${chargeStorageUpgradeCost(run, 'ram')} Credits`} disabled={run.credits < chargeStorageUpgradeCost(run, 'ram')} onPress={() => expandChargeCapacity('ram')} style={[styles.storageUpgrade, run.credits < chargeStorageUpgradeCost(run, 'ram') && styles.storageUpgradeDisabled]}><Text style={styles.storageUpgradeText}>+ SLOT · {chargeStorageUpgradeCost(run, 'ram')} C</Text></Pressable>
      {ramArmed && <Text style={styles.readyTimer}>{run.pictureEvent?.isWaldo && !run.pictureEvent.waldoFound ? 'TAP WALDO IN THE CROWD' : run.treasureHunt?.revealed && run.ramCharges < 3 ? '3 RAM TO OPEN · MISS COSTS 1' : 'TAP A BALL OR JACKPOT'}</Text>}
    </View>
    <View style={[styles.railAbility, isPhoneLandscape && styles.phoneRailAbility]}>
      <Text style={styles.abilityLabel}>CHARGE</Text><Pressable accessibilityRole="button" accessibilityLabel="Arm a charge wall" onTouchStart={(e: any) => e.stopPropagation()} onPointerDown={(e: any) => e.stopPropagation()} disabled={!running || run.chargeCharges < 1 || (run.chargeReadyUntil !== null && run.chargeReadyUntil > run.elapsedMs)} onPress={() => commit(activateCharge(runRef.current, visualSkinSelectionsRef.current.pickups.charge))} style={[styles.abilityButton, isPhoneLandscape && styles.phoneAbilityButton, styles.chargeButton, run.chargeCharges < 1 && styles.abilityDisabled]}><HudPickupIcon kind="charge" skinId={visualSkins.pickups.charge} size={17} /><HudChargeIcons kind="charge" skinId={visualSkins.pickups.charge} count={run.chargeCharges} /></Pressable>
      <Text style={styles.storageReadout}>{run.chargeCharges} / {chargeCapacity(run, 'charge')} STORED</Text><Pressable accessibilityRole="button" accessibilityLabel={`Expand Charge storage for ${chargeStorageUpgradeCost(run, 'charge')} Credits`} disabled={run.credits < chargeStorageUpgradeCost(run, 'charge')} onPress={() => expandChargeCapacity('charge')} style={[styles.storageUpgrade, run.credits < chargeStorageUpgradeCost(run, 'charge') && styles.storageUpgradeDisabled]}><Text style={styles.storageUpgradeText}>+ SLOT · {chargeStorageUpgradeCost(run, 'charge')} C</Text></Pressable>
      {run.chargeReadyUntil !== null && <Text style={styles.readyTimer}>CHARGED · {Math.max(0, (run.chargeReadyUntil - run.elapsedMs) / 1000).toFixed(1)}s</Text>}
    </View>
  </View>;
  const smelterSpeedUpgrade = <Pressable accessibilityRole="button" accessibilityLabel={`Reduce smelter duration for ${overflowProcessingUpgradeCost(run)} Credits`} disabled={run.credits < overflowProcessingUpgradeCost(run) || run.mechanics.overflowProcessingMs <= run.mechanics.overflowProcessingMinimumMs} onPress={upgradeSmelterSpeed} style={[styles.smelterSpeedUpgrade, (run.credits < overflowProcessingUpgradeCost(run) || run.mechanics.overflowProcessingMs <= run.mechanics.overflowProcessingMinimumMs) && styles.storageUpgradeDisabled]}><Text style={styles.smelterSpeedLabel}>SMELTER CYCLE · {Math.ceil(run.mechanics.overflowProcessingMs / 1000)}s</Text><Text style={styles.smelterSpeedAction}>−{run.mechanics.overflowProcessingReductionPercent}% TIME · {overflowProcessingUpgradeCost(run)} C</Text></Pressable>;
  const themeSelectionMap = { background: skinSelections.background, ball: skinSelections.ball, 'credit-symbol': skinSelections.credit, pet: skinSelections.engiPet, ...Object.fromEntries(Object.entries(skinSelections.pickups).map(([kind, id]) => [`pickup:${kind}`, id])) };
  const renderThemePreview = (node: SkinArchiveNode) => {
    if (node.category === 'background') { const skin = BACKGROUND_SKINS.find(item => item.id === node.id); return <View style={{ width: '100%', height: '100%', backgroundColor: skin?.color ?? '#101e2e', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#d5f8f3', fontWeight: '900', letterSpacing: 2 }}>ARENA</Text></View>; }
    if (node.category === 'ball') { const skin = BALL_SKINS.find(item => item.id === node.id) ?? BALL_SKINS[0]; return <BallArtwork skin={skin} diameter={82} left={69} top={24} preview />; }
    if (node.category === 'credit-symbol') return <CreditSymbol skinId={node.id} size={76} />;
    if (node.category === 'pet') return <EngiPetArtwork skinId={node.id} task="inspect" size={92} />;
    if (node.category.startsWith('pickup:')) { const kind = node.category.slice(7) as PowerKind; return <PowerOrb power={{ id: -900, kind, x: 110, y: 65, vx: 0, vy: 0 }} sx={1} sy={1} skinId={node.id} staticDisplay />; }
    return null;
  };

  return (
    <View style={[styles.screen, Platform.OS === 'web' && styles.screenWeb]}>
      <StatusBar style="light" />
      <View style={[styles.header, Platform.OS === 'web' && styles.headerWeb, isPhoneLandscape && styles.phoneHeader]}>
        <View><Text style={[styles.kicker, isPhoneLandscape && styles.phoneKicker]}>TRAP / SURVIVAL</Text><Text style={[styles.title, isPhoneLandscape && styles.phoneTitle]}>Containment</Text></View>
        <Text style={styles.best}>BEST RUNS{scores.length ? `  ${scores[0].level}` : '  —'}</Text>
      </View>
      <View style={[styles.tabBar, Platform.OS === 'web' && styles.tabBarWeb, isPhoneLandscape && styles.phoneTabBar]}>
        <Pressable onPress={() => openMainMenu('home')} style={[styles.tabButton, menuPage !== null && styles.tabSelected]}><Text style={[styles.tabText, menuPage !== null && styles.tabTextSelected]}>HOME</Text></Pressable>
        <Pressable onPress={() => { setMenuPage(null); setActiveTab('game'); }} style={[styles.tabButton, activeTab === 'game' && styles.tabSelected]}><Text style={[styles.tabText, activeTab === 'game' && styles.tabTextSelected]}>GAME</Text></Pressable>
        <Pressable onPress={() => { setMenuPage(null); setRunning(false); setPaused(true); setActiveTab('developer'); }} style={[styles.tabButton, activeTab === 'developer' && styles.tabSelected]}><Text style={[styles.tabText, activeTab === 'developer' && styles.tabTextSelected]}>DEVELOPER</Text></Pressable>
        {Platform.OS === 'web' && <Pressable onPress={() => setDeveloperOverlay(value => !value)} style={[styles.tabButton, developerOverlay && styles.tabSelected]}><Text style={[styles.tabText, developerOverlay && styles.tabTextSelected]}>DEV OVERLAY {developerOverlay ? 'ON' : 'OFF'}</Text></Pressable>}
      </View>
      {activeTab === 'game' && developerOverlay && !isPhonePortrait && <View style={styles.devOverlayQuick}><Text style={styles.devOverlayTitle}>DEV SPAWNS</Text>{(Object.keys(PICKUP_SKINS) as PowerKind[]).filter(kind => kind !== 'exit').map(kind => <Pressable key={kind} style={styles.devOverlayButton} onPress={() => spawnTestPickup(kind)}><HudPickupIcon kind={kind} skinId={skinSelections.pickups[kind]} size={18} /><Text style={styles.devOverlayButtonText}>{kind.toUpperCase()}</Text></Pressable>)}<Pressable style={styles.devOverlayButton} onPress={() => { void saveCurrentPicture(); }}><Text style={styles.devOverlayButtonText}>SAVE PICTURE</Text></Pressable></View>}
      {activeTab === 'game' && !isPhonePortrait && !running && !paused && <View style={[styles.buttonRow, styles.topGameActions, Platform.OS === 'web' && styles.topGameActionsWeb, isPhoneLandscape && styles.phoneTopActions]}>
        {hasSave && !run.ended && !run.levelClearPending && <Pressable style={styles.secondaryButton} onPress={resume}><Text style={styles.secondaryText}>RESUME RUN</Text></Pressable>}
        <Pressable style={styles.primaryButton} onPress={startFresh}><Text style={styles.primaryText}>{run.ended || hasSave ? 'NEW RUN' : 'START RUN'}</Text></Pressable>
      </View>}
      {activeTab === 'game' ? (isPhonePortrait ? <View style={styles.rotatePrompt}><Text style={styles.rotateGlyph}>↻</Text><Text style={styles.rotateTitle}>ROTATE DEVICE</Text><Text style={styles.rotateCopy}>Containment is designed to play in landscape.</Text></View> : <View style={[Platform.OS === 'web' ? styles.webGameContent : { flex: 1 }, isPhoneLandscape && styles.phoneGameContent]}>
      <View style={[styles.hud, Platform.OS === 'web' && styles.hudWeb, isPhoneLandscape && styles.phoneHud]}>
        <View style={Platform.OS === 'web' ? styles.stageFocus : undefined}><Text style={styles.hudLabel}>STAGE</Text><Text style={styles.hudValue}>{String(run.level).padStart(2, '0')}</Text></View>
        <View style={styles.eventBadges}>
          {run.merchantTokens > 0 && <Pressable style={styles.merchantTokenButton} onPress={() => openMerchant(runRef.current.levelClearPending)}><HudPickupIcon kind="merchant" skinId={visualSkins.pickups.merchant} size={22} /><Text style={styles.merchantTokenText}>MERCHANT · ENTER</Text></Pressable>}
          {run.pictureEvent && <Text style={styles.pictureEventLabel}>{run.pictureEvent.isWaldo ? run.pictureEvent.waldoFound ? 'WALDO FOUND · TREASURE SPAWNED' : 'WALDO CROWD · ARM RAM TO SEARCH' : 'PICTURE · CLAIM TO REVEAL'}</Text>}
          {run.skinDiscovery && discoveryNode && <Text style={styles.skinDiscoveryLabel}>SKIN SIGNAL · {discoveryNode.name} · CLEAR {run.skinDiscovery.requiredClaimed.toFixed(0)}%{run.skinDiscovery.requiresIsotypes ? ' + ISOTYPES CONTAINED' : ''}</Text>}
          {run.levelEvent === 'elimination' && <Text style={styles.eliminationEventLabel}>ELIMINATION · CLEAR ALL BALLS</Text>}
          {run.levelEvent === 'drift-swarm' && run.elapsedMs < run.levelEventBannerUntilMs && <Text style={styles.driftSwarmEventLabel}>DRIFT SWARM ANOMALY DETECTED</Text>}
          {run.treasureHunt && <Text style={styles.treasureEventLabel}>{run.treasureHunt.revealed ? 'JACKPOT FOUND · USE 3 RAM TO OPEN' : 'TREASURE HUNT'} · {Math.ceil(run.treasureHunt.remainingMs / 1000)}s</Text>}
          {(run.pets.length > 0 || run.petEggs > 0 || run.petIncubations.length > 0) && <Text style={styles.crewReadout}>CREW {run.pets.length} · COCOONS {run.petEggs + run.petIncubations.length}</Text>}
        </View>
        <View style={creditStyles.runReadouts}>
          <View style={[creditStyles.runReadout, creditStyles.claimReadout]}><View style={creditStyles.claimGlyph}><Text style={creditStyles.claimGlyphText}>▧</Text></View><View><Text style={creditStyles.readoutLabel}>TERRITORY</Text><Text style={creditStyles.readoutValue}>{run.claimed.toFixed(2)}<Text style={creditStyles.readoutUnit}>%</Text></Text></View></View>
          <View style={[creditStyles.runReadout, creditStyles.creditReadout]}><CreditSymbol skinId={visualSkins.credit} size={20} /><View><Text style={creditStyles.readoutLabel}>CREDITS</Text><Text style={creditStyles.readoutValue}>{run.credits.toLocaleString()}</Text></View></View>
          {(running || paused) && <Pressable accessibilityRole="button" accessibilityLabel={paused ? 'Resume run' : 'Pause run'} onPress={togglePause} style={[styles.pauseButton, paused && styles.pauseButtonActive]}><Text style={styles.pauseButtonText}>{paused ? '▶' : 'Ⅱ'}</Text><Text style={styles.pauseButtonLabel}>{paused ? 'RESUME' : 'PAUSE'}</Text></Pressable>}
        </View>
      </View>
      {!isPhoneLandscape && Platform.OS !== 'web' && <View style={styles.lifeHud}><LifeVaultDisplay lives={run.lives} capacity={lifeCapacity} skinId={visualSkins.pickups.life} pickupSkins={visualSkins.pickups} creditSkin={visualSkins.credit} overflowJobs={run.overflowJobs} overflowResult={run.overflowResult} elapsedMs={run.elapsedMs} processingMs={run.mechanics.overflowProcessingMs} overflowChance={run.overflowSuccessChance} overflowIncrease={run.mechanics.overflowUpgradeChanceIncrease} overflowUpgradeCost={overflowRefineryUpgradeCost(run)} credits={run.credits} onUpgrade={upgradeOverflowRefinery} />{smelterSpeedUpgrade}</View>}
      <View onLayout={Platform.OS === 'web' && !phoneViewport ? event => {
        const { width, height } = event.nativeEvent.layout;
        setDesktopStageArea(current => Math.abs(current.width - width) < 1 && Math.abs(current.height - height) < 1 ? current : { width, height });
      } : undefined} style={[styles.stageRow, Platform.OS === 'web' && styles.stageRowWeb, isPhoneLandscape && styles.phoneStageRow, Platform.OS === 'web' && !phoneViewport && desktopHudStyles.stageRow]}>
        {isPhoneLandscape && <ScrollView style={styles.phoneResourceRail} contentContainerStyle={styles.phoneResourceRailContent} showsVerticalScrollIndicator><LifeVaultDisplay lives={run.lives} capacity={lifeCapacity} skinId={visualSkins.pickups.life} pickupSkins={visualSkins.pickups} creditSkin={visualSkins.credit} overflowJobs={run.overflowJobs} overflowResult={run.overflowResult} elapsedMs={run.elapsedMs} processingMs={run.mechanics.overflowProcessingMs} overflowChance={run.overflowSuccessChance} overflowIncrease={run.mechanics.overflowUpgradeChanceIncrease} overflowUpgradeCost={overflowRefineryUpgradeCost(run)} credits={run.credits} onUpgrade={upgradeOverflowRefinery} compact phoneLayout />{smelterSpeedUpgrade}{abilityRail}</ScrollView>}
        <View style={[styles.boardWrap, isPhoneLandscape ? styles.phoneBoardWrap : Platform.OS === 'web' ? [desktopHudStyles.board, { height: desktopBoardHeight }] : { width: arenaWidth, height: arenaHeight, flexGrow: 1, flexShrink: 1, minHeight: 0 }]} onLayout={e => handleStageLayout(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}>
          <View ref={boardRef} style={[styles.board, { backgroundColor: tint }, { touchAction: 'none', ...(Platform.OS === 'web' && !phoneViewport ? { cursor: 'none' } : {}) } as any]} onLayout={e => { setBoard({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height }); requestAnimationFrame(() => boardRef.current?.measureInWindow((x, y, width, height) => { boardScreenRect.current = { x, y, width, height }; })); }}
          onTouchStart={e => collectTouches(e, 'start')} onTouchEnd={e => collectTouches(e, 'end')} onTouchCancel={e => collectTouches(e, 'cancel')}
          {...(Platform.OS === 'web' ? { onPointerDown: (e: any) => { if (e.nativeEvent.pointerType === 'mouse') setMouseCursor({ x: e.nativeEvent.offsetX ?? 0, y: e.nativeEvent.offsetY ?? 0, down: true }); pointerGesture(e, 'start'); }, onPointerMove: (e: any) => { if (e.nativeEvent.pointerType === 'mouse') setMouseCursor({ x: e.nativeEvent.offsetX ?? 0, y: e.nativeEvent.offsetY ?? 0, down: mouseCursor?.down ?? false }); }, onPointerUp: (e: any) => { if (e.nativeEvent.pointerType === 'mouse') setMouseCursor(point => point ? { ...point, down: false } : null); pointerGesture(e, 'end'); }, onPointerCancel: (e: any) => { setMouseCursor(null); pointerGesture(e, 'cancel'); }, onPointerLeave: () => setMouseCursor(null) } : {}) as any}>
          {run.pictureEvent?.isWaldo ? <WaldoArtwork seed={run.pictureEvent.seed} width={board.width} height={board.height} waldoX={run.pictureEvent.waldoX ?? 0.5} waldoY={run.pictureEvent.waldoY ?? 0.5} found={!!run.pictureEvent.waldoFound} /> : run.pictureEvent && (pictureEntry?.uri ? <View pointerEvents="none" style={[FULL_BOARD_ART_STYLE, { backgroundColor: tint }]}><Image source={{ uri: pictureEntry.uri }} resizeMode="stretch" style={FULL_STAGE_IMAGE_STYLE} /></View> : (pictureEntry?.generatedBackdropId ?? run.pictureEvent.generatedBackdropId) !== undefined ? <View pointerEvents="none" style={[FULL_BOARD_ART_STYLE, { backgroundColor: tint }]}><Image source={GENERATED_PICTURE_BACKDROPS[(pictureEntry?.generatedBackdropId ?? run.pictureEvent.generatedBackdropId ?? 0) % GENERATED_PICTURE_BACKDROPS.length]} resizeMode="stretch" style={[FULL_STAGE_IMAGE_STYLE, { opacity: 0.92 }]} /></View> : <PictureArtwork seed={run.pictureEvent.seed} width={board.width} height={board.height} />)}
          {run.pictureEvent
            ? openRectFractions.map(rect => <View key={rect.key} pointerEvents="none" style={[styles.unclaimedMask, { backgroundColor: tint, left: `${rect.left * 100}%`, top: `${rect.top * 100}%`, width: `${rect.width * 100}%`, height: `${rect.height * 100}%` }]} />)
            : claimRects.map(rect => <View key={rect.key} pointerEvents="none" style={[styles.claimedCell, { backgroundColor: runSettings.claimedColor, opacity: runSettings.claimedFillOpacity, left: rect.x * run.boardWidth / run.gridCols * sx, top: rect.y * run.boardHeight / run.gridRows * sy, width: rect.width * run.boardWidth / run.gridCols * sx, height: run.boardHeight / run.gridRows * sy }]} />)}
          {!run.pictureEvent && activeBackground.asset && <><View pointerEvents="none" style={StyleSheet.absoluteFill}><Image source={activeBackground.asset} resizeMode="cover" style={[StyleSheet.absoluteFill, { opacity: 0.58 }]} /></View><ArenaBackgroundEffects id={activeBackground.id} /></>}
          {runSettings.showGrid && <View pointerEvents="none" style={[styles.grid, { opacity: runSettings.gridOpacity, borderColor: runSettings.gridColor }]} />}
          {run.walls.map((wall: Wall) => <WallView key={wall.id} wall={wall} sx={sx} sy={sy} mutation={run.containmentMutations?.find(box => box.active && box.wallIds.includes(wall.id))} elapsedMs={run.elapsedMs} />)}
          {paused && queuedWallPreview.map((wall, index) => <View key={`queued-wall-${index}`} pointerEvents="none" style={{ position: 'absolute', zIndex: 8, left: wall.x * sx - 6, top: wall.y * sy - 6, width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}><View style={{ position: 'absolute', width: wall.axis === 'vertical' ? 2 : 12, height: wall.axis === 'vertical' ? 12 : 2, borderRadius: 2, backgroundColor: '#78f6dc', shadowColor: '#78f6dc', shadowOpacity: 1, shadowRadius: 5 }} /><View style={{ width: 4, height: 4, borderRadius: 4, borderWidth: 1, borderColor: '#f1fff9', backgroundColor: '#35cbaa' }} /></View>)}
          {run.balls.map((ball: Ball) => {
            const sphereSize = 2 * ball.r * Math.min(sx, sy);
            const skin = BALL_SKINS.find(option => option.id === visualSkins.ball) ?? BALL_SKINS[0];
            return <BallArtwork key={ball.id} skin={skin} diameter={sphereSize} left={ball.x * sx - sphereSize / 2} top={ball.y * sy - sphereSize / 2} rammed={ball.rammed} modifier={ball.modifier} extraModifiers={ball.modifiers?.length ?? 0} drifting={ball.drifting} skimming={ball.skimmerWallId !== undefined} />;
          })}
          {run.pets.filter(pet => pet.species === 'waldo').flatMap(pet => (pet.paintings ?? []).map(painting => {
            const wall = run.walls.find(candidate => candidate.id === painting.wallId && !candidate.active && candidate.axis === painting.axis && Math.abs(candidate.at - painting.at) < 1 && painting.along >= candidate.low - 2 && painting.along <= candidate.high + 2);
            if (painting.wallId >= 0 && !wall) return null;
            const left = painting.axis === 'vertical' ? painting.at * sx - 11 : painting.along * sx - 11;
            const top = painting.axis === 'vertical' ? painting.along * sy - 9 : painting.at * sy - 9;
            return <WaldoPaintingView key={`painting-${painting.id}`} left={left} top={top} styleId={painting.style} />;
          }))}
          {run.pets.map(pet => <View key={`pet-${pet.id}`} {...petDragHandlers(pet)} style={[styles.deployedEngi, !pet.deployed && styles.roamingPet, { left: pet.x * sx - 20, top: pet.y * sy - 22 }]}>{pet.species === 'waldo' ? <WaldoPetArtwork pet={pet} size={40} /> : <EngiPetArtwork skinId={visualSkins.engiPet} task={pet.task as any} size={40} />}</View>)}
          {run.powerups.map((p: PowerUp) => <PowerOrb key={p.id} power={p} sx={sx} sy={sy} skinId={run.skinDiscovery?.category === `pickup:${p.kind}` ? visualSkins.pickups[p.kind] : p.skinId ?? visualSkins.pickups[p.kind]} creditBaseAmount={run.mechanics.creditPickupBaseAmount} />)}
          {run.treasureHunt?.revealed && <PowerOrb key="revealed-jackpot" power={{ id: -2, kind: 'treasure', x: run.treasureHunt.x, y: run.treasureHunt.y, vx: 0, vy: 0 }} sx={sx} sy={sy} skinId={visualSkins.pickups.treasure} />}
          {captureEffects.map((effect, index) => <CaptureBurst key={`${effect.id}-${index}`} event={effect} sx={sx} sy={sy} creditSkin={skinSelections.credit} stageWidth={board.width} stageHeight={board.height} onDone={() => setCaptureEffects(old => old.filter(e => e !== effect))} />)}
          {wallBreakEffects.map((effect, index) => <WallBreakBurst key={`${effect.id}-${index}`} event={effect} sx={sx} sy={sy} onDone={() => setWallBreakEffects(old => old.filter(e => e !== effect))} />)}
          {territoryEffects.map((effect, index) => <TerritoryGainPopup key={`${effect.id}-${index}`} event={effect} sx={sx} sy={sy} placement={runSettings.territoryPopupPlacement} onDone={() => setTerritoryEffects(old => old.filter(e => e !== effect))} />)}
          {creditGainEffects.map((effect, index) => <CreditGainPopup key={`${effect.id}-${index}`} event={effect} sx={sx} sy={sy} stageWidth={run.boardWidth * sx} stageHeight={run.boardHeight * sy} creditSkin={visualSkins.credit} style={run.mechanics.creditGainStyle} onDone={() => setCreditGainEffects(old => old.filter(item => item !== effect))} />)}
          {!running && !paused && !run.levelClearPending && <View pointerEvents="none" style={styles.pauseBadge}><Text style={styles.pauseText}>{run.ended ? 'RUN ENDED' : 'READY'}</Text></View>}
          {run.isotypesContained && run.isotypesNoticeUntilMs > run.elapsedMs && <View pointerEvents="none" style={styles.isotypesBanner}><Text style={styles.isotypesBannerText}>Isotypes Contained</Text></View>}
          {Platform.OS === 'web' && !phoneViewport && mouseCursor && <View pointerEvents="none" style={{ position: 'absolute', zIndex: 60, left: mouseCursor.x - 11, top: mouseCursor.y - 11, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 99, borderWidth: cursorSkin === 'halo' ? 2 : 0, borderColor: '#7af3dc', transform: [{ scale: mouseCursor.down ? 0.72 : 1 }] }}><Text style={{ color: cursorSkin === 'spark' ? '#ffe39a' : '#c9fff2', fontSize: cursorSkin === 'crosshair' ? 21 : 18, fontWeight: '900', textShadowColor: cursorSkin === 'spark' ? '#ffab42' : '#43e5cb', textShadowRadius: 8 }}>{cursorSkin === 'crosshair' ? '⌖' : cursorSkin === 'spark' ? '✦' : '◉'}</Text></View>}
          </View>
        </View>
      </View>
      <View style={[styles.stageInfoRow, Platform.OS === 'web' && styles.stageInfoRowWeb, isPhoneLandscape && styles.phoneStageInfoRow]}>{Platform.OS !== 'web' && abilityRail}<View pointerEvents="none" style={styles.boardFooter}><Text style={styles.footerText}>{run.balls.length} METAL BALLS</Text></View></View>
      {Platform.OS === 'web' && !phoneViewport && <View style={desktopHudStyles.bottomResources}>
        <View style={desktopHudStyles.vaultGroup}><LifeVaultDisplay lives={run.lives} capacity={lifeCapacity} skinId={visualSkins.pickups.life} pickupSkins={visualSkins.pickups} creditSkin={visualSkins.credit} overflowJobs={run.overflowJobs} overflowResult={run.overflowResult} elapsedMs={run.elapsedMs} processingMs={run.mechanics.overflowProcessingMs} overflowChance={run.overflowSuccessChance} overflowIncrease={run.mechanics.overflowUpgradeChanceIncrease} overflowUpgradeCost={overflowRefineryUpgradeCost(run)} credits={run.credits} onUpgrade={upgradeOverflowRefinery} compact />{smelterSpeedUpgrade}</View>
        {abilityRail}
      </View>}
      <View style={[styles.controls, Platform.OS === 'web' && styles.controlsWeb, isPhoneLandscape && styles.phoneControls]}>
        <Text style={styles.notice}>{notice}</Text>
        {Platform.OS === 'web' && <View style={styles.inputOptions}>
          <Text style={styles.inputLabel}>DRAW WITH</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: mouseControl }} onPress={() => { setMouseControl(true); setNotice('Click and drag vertically or horizontally to draw a wall'); }} style={[styles.inputButton, mouseControl && styles.inputButtonSelected]}><Text style={[styles.inputButtonText, mouseControl && styles.inputButtonTextSelected]}>TOUCH</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: !mouseControl }} onPress={() => { setMouseControl(false); setNotice('Swipe vertically or horizontally to draw a wall'); }} style={[styles.inputButton, !mouseControl && styles.inputButtonSelected]}><Text style={[styles.inputButtonText, !mouseControl && styles.inputButtonTextSelected]}>MOUSE</Text></Pressable>
        </View>}
        <View style={[styles.rulesRow, Platform.OS === 'web' && styles.rulesRowWeb]}><Text style={styles.rule}>{Platform.OS === 'web' && mouseControl ? 'DRAG — DRAW' : 'SWIPE — DRAW'}</Text><Text style={styles.rule}>NO BALLS — CLAIM</Text><Text style={styles.rule}>PICKUPS — ABILITIES</Text></View>
      </View>
      <View style={[styles.scores, Platform.OS === 'web' && styles.scoresWeb]}>
        <Text style={styles.scoresTitle}>PERSONAL BEST RUNS</Text>
        {scores.length === 0 ? <Text style={styles.empty}>Your runs will appear here</Text> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scoreList}>
          {scores.slice(0, 5).map((s, i) => <View key={`${s.timestamp}-${i}`} style={styles.scoreCard}><Text style={styles.scoreRank}>#{i + 1}</Text><Text style={styles.scoreValue}>{formatScore(s)}</Text></View>)}
        </ScrollView>}
      </View>
      </View>) : <>
      <View style={styles.profileManager}>
        <View style={styles.profileManagerHeading}><View><Text style={styles.pickupSettingsTitle}>BALANCE PROFILES</Text><Text style={styles.profileManagerHint}>{selectedProfileName ? `ACTIVE · ${selectedProfileName}` : 'Unsaved live settings'}</Text></View><View style={styles.profileManagerActions}>
          {selectedProfileName && <Pressable style={styles.smallAction} onPress={updateSelectedSettingsProfile}><Text style={styles.smallActionText}>SAVE CHANGES</Text></Pressable>}
          <Pressable style={styles.smallAction} onPress={() => { setProfileSaveOpen(value => !value); setProfileName(''); }}><Text style={styles.smallActionText}>{profileSaveOpen ? 'CANCEL' : 'SAVE AS NEW'}</Text></Pressable>
          <Pressable style={styles.smallAction} onPress={() => { const settings = normalizeMechanicsSettings(DEFAULT_MECHANICS); setTuning(settings); setSkinSelections(DEFAULT_SKIN_SELECTIONS); setSelectedProfileName(null); }}><Text style={styles.smallActionText}>RESET DEFAULTS</Text></Pressable>
        </View></View>
        {profileSaveOpen && <View style={styles.profileRow}><TextInput autoFocus value={profileName} maxLength={28} onChangeText={setProfileName} onSubmitEditing={saveCurrentSettingsProfile} placeholder="Name this profile" placeholderTextColor="#708199" style={styles.profileInput} /><Pressable style={styles.smallAction} onPress={saveCurrentSettingsProfile}><Text style={styles.smallActionText}>CREATE</Text></Pressable></View>}
        {profiles.length === 0 ? <Text style={styles.profileManagerHint}>Create a profile to save all current tuning and selected skins.</Text> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileScroller}>{profiles.map(profile => <View key={profile.name} style={[styles.profileCard, selectedProfileName === profile.name && styles.profileCardSelected]}><Pressable onPress={() => equipSettingsProfile(profile)} style={styles.profileCardApply}><Text numberOfLines={1} style={styles.profileCardName}>{profile.name}</Text><Text style={styles.profileCardApplyText}>{selectedProfileName === profile.name ? 'ACTIVE' : 'APPLY'}</Text></Pressable><View style={styles.profileCardActions}><Pressable onPress={() => { const updated: TuningProfile = { name: profile.name, settings: normalizeMechanicsSettings(tuning), skins: normalizeSkinSelections(skinSelections) }; setProfiles(old => old.map(saved => saved.name === profile.name ? updated : saved)); setSelectedProfileName(profile.name); }}><Text style={styles.profileCardActionText}>SAVE OVER</Text></Pressable><Pressable onPress={() => { setProfiles(old => old.filter(item => item.name !== profile.name)); if (selectedProfileName === profile.name) setSelectedProfileName(null); }}><Text style={styles.deleteText}>DELETE</Text></Pressable></View></View>)}</ScrollView>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.devSubtabs} contentContainerStyle={styles.devSubtabScroller}>{(['gameplay', 'events', 'pickups', 'metal-balls', 'economy', 'merchant', 'pets'] as const).map(tab => <Pressable key={tab} onPress={() => setDevTab(tab)} style={[styles.devSubtab, devTab === tab && styles.tabSelected]}><Text style={[styles.tabText, devTab === tab && styles.tabTextSelected]}>{tab === 'metal-balls' ? 'METAL BALLS' : tab.toUpperCase()}</Text></Pressable>)}</ScrollView>
      <ScrollView style={styles.devPanel} contentContainerStyle={styles.devContent} keyboardShouldPersistTaps="handled">
      {devTab === 'gameplay' && <>
        <Text style={styles.devTitle}>DEVELOPER SETTINGS</Text>
        <Text style={styles.devHint}>Most tuning updates the active run immediately. Starting population and other run-start values apply to the next run. Use Balance Profiles above to save, overwrite, or restore complete tuning and skin setups.</Text>
        <Text style={styles.sectionTitle}>SKIN CATALOG</Text>
        <SkinSelectRow label="Arena background" value={skinSelections.background} previewKind="background" options={BACKGROUND_SKINS} onChange={id => {
          const index = BACKGROUND_SKINS.findIndex(skin => skin.id === id);
          setSkinSelections(old => ({ ...old, background: id }));
          setTuning(old => ({ ...old, autoBackground: false, backgroundColorIndex: Math.max(0, index), backgroundColors: BACKGROUND_SKINS.map(skin => skin.color) }));
        }} />
        <SkinSelectRow label="Credit symbol" value={skinSelections.credit} previewKind="credit" options={CREDIT_SKINS} onChange={id => setSkinSelections(old => ({ ...old, credit: id }))} />
        <SettingChoiceRow label="Credit gain pop-up animation" value={tuning.creditGainStyle} options={[{ id: 'orbiting', label: 'ORBITING SPARK' }, { id: 'ticker', label: 'FLUX TICKER' }]} onChange={value => setTuning(old => ({ ...old, creditGainStyle: value as MechanicsSettings['creditGainStyle'] }))} />
        <Text style={styles.sectionTitle}>ARENA APPEARANCE</Text>
        <ToggleRow label="Cycle background by level" value={tuning.autoBackground} onChange={value => setTuning(old => ({ ...old, autoBackground: value }))} />
        <ToggleRow label="Show arena grid" value={tuning.showGrid} onChange={value => setTuning(old => ({ ...old, showGrid: value }))} />
        <Text style={styles.settingLabel}>Claimed territory color</Text>
        <View style={styles.swatchRow}>{CLAIM_SWATCHES.map(color => <Pressable key={color} onPress={() => setTuning(old => ({ ...old, claimedColor: color }))} style={[styles.swatch, { backgroundColor: color }, tuning.claimedColor === color && styles.swatchSelected]} />)}</View>
        <Text style={styles.settingLabel}>Grid line color</Text>
        <View style={styles.swatchRow}>{['#6a879c', '#64e2c5', '#ba91ed', '#eaa56b', '#e5eaf0'].map(color => <Pressable key={color} onPress={() => setTuning(old => ({ ...old, gridColor: color }))} style={[styles.swatch, { backgroundColor: color }, tuning.gridColor === color && styles.swatchSelected]} />)}</View>
        <NumberRow label="Wall growth speed" value={tuning.wallGrowthSpeed} step={10} min={10} max={2000} onChange={value => setTuning(old => ({ ...old, wallGrowthSpeed: value }))} />
        <NumberRow label="Claim target (%)" value={tuning.clearPercentOfOriginalBoard} step={1} min={1} max={99} onChange={value => setTuning(old => ({ ...old, clearPercentOfOriginalBoard: value }))} />
        <NumberRow label="Maximum growing walls" value={tuning.maximumActiveWalls} step={1} min={1} max={20} onChange={value => setTuning(old => ({ ...old, maximumActiveWalls: value }))} />
        <Text style={styles.sectionTitle}>TERRITORY, HUD & TEST TOOLS</Text>
        {Platform.OS === 'web' && <SettingChoiceRow label="Mouse cursor skin" value={cursorSkin} options={[{ id: 'crosshair', label: 'Crosshair' }, { id: 'spark', label: 'Spark' }, { id: 'halo', label: 'Halo' }]} onChange={value => setCursorSkin(value as typeof cursorSkin)} />}
        <SettingChoiceRow label="Percentage animation location" value={tuning.territoryPopupPlacement} options={[{ id: 'wall', label: 'On claiming wall' }, { id: 'captured-area', label: 'Within captured area' }]} onChange={value => setTuning(old => ({ ...old, territoryPopupPlacement: value as MechanicsSettings['territoryPopupPlacement'] }))} />
        <NumberRow label="Claimed-area opacity (%)" value={tuning.claimedFillOpacity * 100} step={5} min={0} max={100} onChange={value => setTuning(old => ({ ...old, claimedFillOpacity: value / 100 }))} />
        <NumberRow label="Grid opacity (%)" value={tuning.gridOpacity * 100} step={5} min={0} max={100} onChange={value => setTuning(old => ({ ...old, gridOpacity: value / 100 }))} />
        <NumberRow label="Starting lives" value={tuning.startLives} step={1} min={1} max={99} onChange={value => setTuning(old => ({ ...old, startLives: value }))} />
        <Text style={styles.sectionTitle}>PICKUP TEST SPAWNER</Text>
        <View style={styles.profileRow}>{(['life', 'speed', 'ram', 'charge', 'treasure', 'merchant', 'bubble', 'waldo', 'credit', 'engi-egg'] as const).map(kind => <Pressable key={kind} style={styles.smallAction} onPress={() => spawnTestPickup(kind)}><Text style={styles.smallActionText}>{kind.toUpperCase()}</Text></Pressable>)}</View>
      </>}
      {devTab === 'events' && <>
        <Text style={styles.devTitle}>EVENTS</Text>
        <Text style={styles.devHint}>Tune level events, their procedural or saved art, containment mutations, and level-clear sequences in one place. Event chance rolls apply when a new level starts unless a setting says otherwise.</Text>
        <Text style={styles.sectionTitle}>EVENT FREQUENCY & SOURCES</Text>
        <Text style={styles.devHint}>Treasure and Picture events roll independently, so both can occur together. Elimination and Drift Swarm are mutually exclusive. A collected Waldo pickup guarantees the next Picture event is Waldo.</Text>
        <Text style={styles.sectionTitle}>SKIN DISCOVERY</Text>
        <Text style={styles.devHint}>One global roll per new level. A discovered skin temporarily replaces its category&apos;s equipped skin for that level. Unlock it by meeting the optional clear target and, by default, isolating every ball when you collect the route beacon. Failed objectives never block progression.</Text>
        <NumberRow label="Skin Discovery chance per level (%)" value={tuning.skinDiscoveryChance * 100} step={0.1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, skinDiscoveryChance: value / 100 }))} />
        {SKIN_CATEGORY_KEYS.map(category => <NumberRow key={category} label={`${category.toUpperCase()} discovery weight`} value={tuning.skinDiscoveryCategoryWeights[category] ?? 0} step={0.25} min={0} max={20} onChange={value => setTuning(old => ({ ...old, skinDiscoveryCategoryWeights: { ...old.skinDiscoveryCategoryWeights, [category]: value } }))} />)}
        <Text style={styles.devHint}>Per-skin conditions are keyed by archive node. Defaults are +12 percentage points above the clear threshold and Isotypes Contained.</Text>
        {SKIN_ARCHIVE.filter(node => node.id !== SKIN_DEFAULTS[node.category]).map(node => { const key = `${node.category}:${node.id}`; return <View key={key} style={styles.profileCard}><Text style={styles.settingLabel}>{node.categoryName} · {node.name} · T{node.tier}</Text><NumberRow label="Additional capture above base (%)" value={tuning.skinDiscoveryClaimBonusPercent[key] ?? 12} step={1} min={0} max={35} onChange={value => setTuning(old => ({ ...old, skinDiscoveryClaimBonusPercent: { ...old.skinDiscoveryClaimBonusPercent, [key]: value } }))} /><ToggleRow label="Require Isotypes Contained at exit" value={tuning.skinDiscoveryRequiresIsotypes[key] ?? true} onChange={value => setTuning(old => ({ ...old, skinDiscoveryRequiresIsotypes: { ...old.skinDiscoveryRequiresIsotypes, [key]: value } }))} /></View>; })}
        <NumberRow label="Treasure hunt eligible level chance (%)" value={tuning.treasureLevelEligibilityChance * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, treasureLevelEligibilityChance: value / 100 }))} />
        <NumberRow label="Picture event chance per level (%)" value={tuning.pictureEventChance * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, pictureEventChance: value / 100 }))} />
        <NumberRow label="Asset-backed generated-scene chance (%)" value={tuning.pictureAssetBackdropChance * 100} step={5} min={0} max={100} onChange={value => setTuning(old => ({ ...old, pictureAssetBackdropChance: value / 100 }))} />
        <NumberRow label="Use saved Picture backgrounds (%)" value={tuning.pictureLibrarySelectionChance * 100} step={5} min={0} max={100} onChange={value => setTuning(old => ({ ...old, pictureLibrarySelectionChance: value / 100 }))} />
        <NumberRow label="Use saved Waldo puzzles (%)" value={tuning.waldoLibrarySelectionChance * 100} step={5} min={0} max={100} onChange={value => setTuning(old => ({ ...old, waldoLibrarySelectionChance: value / 100 }))} />
        <NumberRow label="Waldo pickup chance per pickup roll (%)" value={tuning.waldoSpawnChance * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, waldoSpawnChance: value / 100 }))} />
        <NumberRow label="Chance Waldo is ineligible this level (%)" value={tuning.waldoIneligibleChance * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, waldoIneligibleChance: value / 100 }))} />
        <Text style={styles.devHint}>Saved-image chances apply only when the matching library contains entries; otherwise a new procedural scene or puzzle is generated.</Text>
        <Text style={styles.sectionTitle}>PICTURE LIBRARY</Text>
        <Text style={styles.devHint}>{pictureLibraryNotice}</Text>
        <View style={styles.profileRow}><Pressable style={styles.smallAction} onPress={() => { void saveCurrentPicture(); }}><Text style={styles.smallActionText}>SAVE SCENE TO BACKGROUNDS</Text></Pressable><Pressable style={styles.smallAction} onPress={() => { void importPicture(); }}><Text style={styles.smallActionText}>IMPORT IMAGE</Text></Pressable></View>
        {pictureLibrary.map(entry => <View key={entry.id} style={styles.profileRow}>{entry.uri ? <Image source={{ uri: entry.uri }} style={styles.pictureThumb} resizeMode="cover" /> : <View style={styles.pictureThumbFallback}><Text style={styles.pictureThumbGlyph}>✦</Text></View>}<Text numberOfLines={1} style={styles.settingLabel}>{entry.name}</Text><Pressable onPress={() => removePicture(entry)}><Text style={styles.deleteText}>REMOVE</Text></Pressable></View>)}
        <Text style={styles.sectionTitle}>WALDO PUZZLE LIBRARY</Text>
        <Text style={styles.devHint}>{waldoLibraryNotice} Saved puzzles are selected only by Waldo Picture events.</Text>
        <Pressable style={styles.smallAction} onPress={() => { void saveCurrentWaldo(); }}><Text style={styles.smallActionText}>SAVE CURRENT WALDO PUZZLE</Text></Pressable>
        {waldoLibrary.map(entry => <View key={entry.id} style={styles.profileRow}><View style={styles.pictureThumbFallback}><Text style={styles.pictureThumbGlyph}>W</Text></View><Text numberOfLines={1} style={styles.settingLabel}>{entry.name}</Text><Pressable onPress={() => removeWaldo(entry)}><Text style={styles.deleteText}>REMOVE</Text></Pressable></View>)}
        <Text style={styles.sectionTitle}>LEVEL ANOMALIES</Text>
        <Text style={styles.devHint}>At default settings, Elimination and Drift Swarm each have a 5% direct chance. Picture and Treasure may run alongside these anomalies.</Text>
        <NumberRow label="Elimination event chance per level (%)" value={tuning.eliminationEventChance * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, eliminationEventChance: value / 100 }))} />
        <NumberRow label="Elimination Charge share of random pickups (%)" value={tuning.eliminationChargeSpawnChance * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, eliminationChargeSpawnChance: value / 100 }))} />
        <NumberRow label="Drift Swarm event chance per level (%)" value={tuning.driftSwarmEventChance * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, driftSwarmEventChance: value / 100 }))} />
        <NumberRow label="Drift Swarm banner duration (seconds)" value={tuning.driftSwarmBannerDurationMs / 1000} step={0.5} min={0} max={30} onChange={value => setTuning(old => ({ ...old, driftSwarmBannerDurationMs: value * 1000 }))} />
        <NumberRow label="Drift Swarm radius / strength variation minimum (×)" value={tuning.driftSwarmVariationMin} step={0.05} min={0.1} max={5} onChange={value => setTuning(old => ({ ...old, driftSwarmVariationMin: Math.min(value, old.driftSwarmVariationMax) }))} />
        <NumberRow label="Drift Swarm radius / strength variation maximum (×)" value={tuning.driftSwarmVariationMax} step={0.05} min={0.1} max={5} onChange={value => setTuning(old => ({ ...old, driftSwarmVariationMax: Math.max(value, old.driftSwarmVariationMin) }))} />
        <Text style={styles.sectionTitle}>CONTAINMENT MUTATION</Text>
        <Text style={styles.devHint}>One roll per qualifying enclosure, after its randomized wait. A qualifying box has exactly one ball, four solid player walls, and the run is not fully isolated. Its active walls show chromatic or growing-vine markings. Mutated boxes only spawn their selected pickup type; per-pickup eligibility stays with that pickup&apos;s settings.</Text>
        <NumberRow label="Mutation chance per eligible box (%)" value={tuning.containmentMutationChance * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, containmentMutationChance: value / 100 }))} />
        <NumberRow label="Random qualification wait minimum (seconds)" value={tuning.containmentMutationDelayMinSeconds} step={1} min={0} max={600} onChange={value => setTuning(old => ({ ...old, containmentMutationDelayMinSeconds: Math.min(value, old.containmentMutationDelayMaxSeconds) }))} />
        <NumberRow label="Random qualification wait maximum (seconds)" value={tuning.containmentMutationDelayMaxSeconds} step={1} min={0} max={600} onChange={value => setTuning(old => ({ ...old, containmentMutationDelayMaxSeconds: Math.max(value, old.containmentMutationDelayMinSeconds) }))} />
        <NumberRow label="Chance mutation ends after next spawn (%)" value={tuning.containmentMutationDecayChance * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, containmentMutationDecayChance: value / 100 }))} />
        <NumberRow label="Base chance spawn is attracted to a mutated box (%)" value={tuning.containmentMutationBaseSpawnChance * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, containmentMutationBaseSpawnChance: value / 100 }))} />
        <Text style={styles.sectionTitle}>LEVEL TRANSITIONS & TREASURE</Text>
        <NumberRow label="Level-complete animation duration (seconds)" value={tuning.levelClearAnimationDurationMs / 1000} step={0.25} min={0.5} max={20} onChange={value => setTuning(old => ({ ...old, levelClearAnimationDurationMs: value * 1000 }))} />
        <NumberRow label="Clear animation bubble rate per second" value={tuning.levelClearBubbleRatePerSecond} step={1} min={0} max={20} onChange={value => setTuning(old => ({ ...old, levelClearBubbleRatePerSecond: value }))} />
        <NumberRow label="Bubble spawn window after animation (seconds)" value={tuning.levelClearBubbleDurationMs / 1000} step={0.5} min={0} max={15} onChange={value => setTuning(old => ({ ...old, levelClearBubbleDurationMs: value * 1000 }))} />
        <SettingChoiceRow label="Level-complete transition" value={tuning.levelClearStyle} options={LEVEL_CLEAR_ANIMATIONS.map(animation => ({ id: animation.id, label: animation.name }))} onChange={value => setTuning(old => ({ ...old, levelClearStyle: value as MechanicsSettings['levelClearStyle'] }))} />
        <Text style={styles.devHint}>{LEVEL_CLEAR_ANIMATIONS.find(animation => animation.id === tuning.levelClearStyle)?.description} This transition catalog is ready for more styles.</Text>
        <LevelClearStylePreview styleId={tuning.levelClearStyle} />
        <NumberRow label="Treasure hunt timeout (sec)" value={tuning.treasureHuntDurationMs / 1000} step={15} min={15} max={1800} onChange={value => setTuning(old => ({ ...old, treasureHuntDurationMs: value * 1000 }))} />
      </>}
      {devTab === 'pickups' && <>
        <Text style={styles.devTitle}>PICKUP BALANCE</Text>
        <Text style={styles.devHint}>Tune each pickup independently. Size is shown as a percentage of the metal-ball diameter; appearance, hitbox, spawn weight, despawn, and type-specific behavior are grouped in each card.</Text>
        <Text style={styles.sectionTitle}>SPAWN PACING</Text>
        <NumberRow label="Spawn interval minimum (sec)" value={tuning.powerupSpawnEverySecondsMin} step={1} min={1} max={600} onChange={value => setTuning(old => ({ ...old, powerupSpawnEverySecondsMin: value, powerupSpawnEverySecondsMax: Math.max(value, old.powerupSpawnEverySecondsMax) }))} />
        <NumberRow label="Spawn interval maximum (sec)" value={tuning.powerupSpawnEverySecondsMax} step={1} min={1} max={600} onChange={value => setTuning(old => ({ ...old, powerupSpawnEverySecondsMax: value, powerupSpawnEverySecondsMin: Math.min(value, old.powerupSpawnEverySecondsMin) }))} />
        <Text style={styles.devHint}>Each pickup&apos;s skin, spawn weight, despawn behavior, and special tuning are grouped below. Bubbles and Treasure coins on already-claimed cells stay there until tapped.</Text>
        {(Object.keys(PICKUP_SKINS) as PowerKind[]).map(kind => <View key={kind} style={styles.pickupSettingsCard}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: expandedPickupSettings === kind }} onPress={() => setExpandedPickupSettings(current => current === kind ? null : kind)} style={styles.pickupCardHeading}>
            <HudPickupIcon kind={kind} skinId={skinSelections.pickups[kind]} size={30} />
            <View style={styles.pickupCardHeadingText}><Text style={styles.pickupSettingsTitle}>{pickupDisplayName(kind)}</Text><Text style={styles.pickupCardSubline}>{PICKUP_SKINS[kind].length} skins · {kind === 'exit' ? 'special route item' : 'base spawn tuning'}</Text></View>
            <Text style={styles.pickupSizeBadge}>{Math.round(tuning.powerupSizeMultipliers[kind] * 100)}%</Text>
            <Text style={styles.pickupCardChevron}>{expandedPickupSettings === kind ? '−' : '+'}</Text>
          </Pressable>
          {expandedPickupSettings === kind && <>
          <TuningSliderRow label="Pickup size (% of metal-ball diameter)" value={tuning.powerupSizeMultipliers[kind]} min={0.5} max={3} step={0.05} formatValue={value => `${Math.round(value * 100)}%`} onChange={value => setTuning(old => ({ ...old, powerupSizeMultipliers: { ...old.powerupSizeMultipliers, [kind]: value }, ...(kind === 'life' ? { powerupRadius: old.ballRadius * value, lifePowerupRadius: old.ballRadius * value } : {}) }))} />
          <SkinSelectRow label="Skin" value={skinSelections.pickups[kind]} previewKind={kind} options={PICKUP_SKINS[kind]} onChange={id => setSkinSelections(old => ({ ...old, pickups: { ...old.pickups, [kind]: id } }))} />
          {(['life', 'speed', 'ram', 'charge', 'treasure', 'merchant', 'credit', 'engi-egg'] as PowerKind[]).includes(kind) && <ToggleRow label="Eligible for Containment Mutation boxes" value={(tuning.containmentMutationPickupEnabled as Record<string, boolean>)[kind]} onChange={value => setTuning(old => ({ ...old, containmentMutationPickupEnabled: { ...old.containmentMutationPickupEnabled, [kind]: value } }))} />}
          {kind === 'exit' ? <Text style={styles.devHint}>Appears after the clear animation as a normal moving pickup. It cannot expire or be destroyed; capturing it launches the next stage.</Text> : <>{kind === 'waldo' ? <Text style={styles.devHint}>Spawn chance and level eligibility are configured in the Events tab. Collecting this pickup queues the next Picture event as a Waldo puzzle; the pet joins only when Waldo is found.</Text> : <NumberRow label="Base spawn weight (next run)" value={tuning.powerupSpawnWeights[kind]} step={kind === 'treasure' || kind === 'merchant' ? 0.1 : 1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, powerupSpawnWeights: { ...old.powerupSpawnWeights, [kind]: value } }))} />}
          <ToggleRow label={kind === 'credit' ? 'Enable bounce-triggered expiry' : 'Base: despawn this pickup next run'} value={tuning.powerupDespawnEnabled[kind]} onChange={value => setTuning(old => ({ ...old, powerupDespawnEnabled: { ...old.powerupDespawnEnabled, [kind]: value } }))} />
          <NumberRow label={kind === 'credit' ? 'Expiry duration after trigger (seconds)' : 'Base lifetime (next run, seconds)'} value={tuning.powerupDespawnSeconds[kind]} step={1} min={1} max={3600} onChange={value => setTuning(old => ({ ...old, powerupDespawnSeconds: { ...old.powerupDespawnSeconds, [kind]: value } }))} />
          {kind === 'speed' && <NumberRow label="Base wall speed boost (next run, %)" value={(tuning.speedBoostMultiplier - 1) * 100} step={5} min={0} max={500} onChange={value => setTuning(old => ({ ...old, speedBoostMultiplier: 1 + value / 100 }))} />}
          {kind === 'ram' && <><NumberRow label="Base blast radius (next run)" value={tuning.missExplosionRadius} step={10} min={0} max={1000} onChange={value => setTuning(old => ({ ...old, missExplosionRadius: value }))} /><NumberRow label="Base blast strength (next run)" value={tuning.missExplosionStrength} step={20} min={0} max={2000} onChange={value => setTuning(old => ({ ...old, missExplosionStrength: value }))} /></>}
          {kind === 'treasure' && <><NumberRow label="Base jackpot reward minimum" value={tuning.treasureRewardMin} step={1} min={1} max={20} onChange={value => setTuning(old => ({ ...old, treasureRewardMin: value, treasureRewardMax: Math.max(value, old.treasureRewardMax) }))} /><NumberRow label="Base jackpot reward maximum" value={tuning.treasureRewardMax} step={1} min={1} max={20} onChange={value => setTuning(old => ({ ...old, treasureRewardMax: value, treasureRewardMin: Math.min(value, old.treasureRewardMin) }))} /></>}
          {kind === 'bubble' && <><Text style={styles.devHint}>Bubbles drift past arena edges and burst without a payout if another projectile touches them. Tap a Bubble to pop it for Credits; one resting over claimed land is not auto-collected.</Text><NumberRow label="Credits earned per Bubble pop" value={tuning.bubbleCreditsPerPop} step={1} min={0} max={10000} onChange={value => setTuning(old => ({ ...old, bubbleCreditsPerPop: value }))} /><NumberRow label="Combo Bubble count variation (±)" value={tuning.comboBubbleCountVariance} step={1} min={0} max={20} onChange={value => setTuning(old => ({ ...old, comboBubbleCountVariance: value }))} /></>}
          {kind === 'credit' && <><Text style={styles.devHint}>Each arena-edge bounce adds one credit to its stored payout. Only the arena perimeter triggers the expiry roll. A metal-ball collision destroys the cache without paying out; Drifters seek it.</Text><NumberRow label="Base Credits per pickup" value={tuning.creditPickupBaseAmount} step={1} min={0} max={10000} onChange={value => setTuning(old => ({ ...old, creditPickupBaseAmount: value }))} /><NumberRow label="Chance to start expiry on edge bounce (%)" value={tuning.creditPickupBounceDespawnChance * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, creditPickupBounceDespawnChance: value / 100 }))} /></>}
          </>}
          </>}
        </View>)}
        <Text style={styles.sectionTitle}>PICKUP TEST SPAWNER</Text>
        <View style={styles.profileRow}>{(['life', 'speed', 'ram', 'charge', 'treasure', 'merchant', 'bubble', 'waldo', 'credit', 'engi-egg'] as const).map(kind => <Pressable key={kind} style={styles.smallAction} onPress={() => spawnTestPickup(kind)}><Text style={styles.smallActionText}>{kind.toUpperCase()}</Text></Pressable>)}</View>
      </>}
      {devTab === 'metal-balls' && <>
        <Text style={styles.devTitle}>METAL BALLS</Text>
        <Text style={styles.devHint}>All ball appearance, movement, and spawn tuning lives here. These values apply to new runs.</Text>
        <View style={styles.devSubtabs}>{(['base', 'modifiers'] as const).map(tab => <Pressable key={tab} onPress={() => setMetalBallTab(tab)} style={[styles.devSubtab, metalBallTab === tab && styles.tabSelected]}><Text style={[styles.tabText, metalBallTab === tab && styles.tabTextSelected]}>{tab === 'base' ? 'BASE' : 'MODIFIERS'}</Text></Pressable>)}</View>
        {metalBallTab === 'base' ? <>
          <Text style={styles.sectionTitle}>BALL SKIN & WALL IMPACT</Text>
          <SkinSelectRow label="Metal ball skin" value={skinSelections.ball} previewKind="ball" options={BALL_SKINS} onChange={id => setSkinSelections(old => ({ ...old, ball: id }))} />
          <SkinSelectRow label="Forming-wall break effect" value={tuning.wallBreakStyle} previewKind="wallBreak" options={WALL_BREAK_SKINS} onChange={id => setTuning(old => ({ ...old, wallBreakStyle: id }))} />
          <Text style={styles.sectionTitle}>GAME MODE & BASE RUN POPULATION</Text>
          <SettingChoiceRow label="Mode for the next run" value={tuning.easyMode ? 'easy' : tuning.hardMode ? 'hard' : 'normal'} options={[{ id: 'easy', label: 'Easy' }, { id: 'normal', label: 'Normal' }, { id: 'hard', label: 'Hard' }]} onChange={value => setTuning(old => ({ ...old, easyMode: value === 'easy', hardMode: value === 'hard' }))} />
          <Text style={styles.devHint}>{tuning.easyMode ? 'Easy never adds bonus balls after territory captures. The usual per-level ball increase still applies.' : 'The per-level population increase is always applied. Normal and Hard can also roll bonus balls after territory captures.'}</Text>
          <NumberRow label="Starting balls" value={tuning.startingBalls} step={1} min={1} max={30} onChange={value => setTuning(old => ({ ...old, startingBalls: value }))} />
          <NumberRow label="Balls added each level" value={tuning.ballsAddedPerLevel} step={1} min={0} max={10} onChange={value => setTuning(old => ({ ...old, ballsAddedPerLevel: value }))} />
          <NumberRow label="Ball radius" value={tuning.ballRadius} step={0.5} min={4} max={35} onChange={value => setTuning(old => ({ ...old, ballRadius: value, powerupRadius: value * old.powerupSizeMultipliers.life, lifePowerupRadius: value * old.powerupSizeMultipliers.life }))} />
          <NumberRow label="Ball speed minimum" value={tuning.ballSpeedMin} step={5} min={10} max={1000} onChange={value => setTuning(old => { const ballSpeedMin = value, ballSpeedMax = Math.max(value, old.ballSpeedMax); return { ...old, ballSpeedMin, ballSpeedMax, ballRecoveryThreshold: Math.min(old.ballRecoveryThreshold, ballSpeedMax - 1), ballRecoverySpeed: Math.max(Math.min(old.ballRecoverySpeed, ballSpeedMax), Math.min(old.ballRecoveryThreshold + 1, ballSpeedMax)) }; })} />
          <NumberRow label="Ball speed maximum" value={tuning.ballSpeedMax} step={5} min={10} max={1000} onChange={value => setTuning(old => { const ballSpeedMax = Math.max(value, old.ballSpeedMin), ballRecoveryThreshold = Math.min(old.ballRecoveryThreshold, ballSpeedMax - 1); return { ...old, ballSpeedMax, ballRecoveryThreshold, ballRecoverySpeed: Math.max(ballRecoveryThreshold + 1, Math.min(old.ballRecoverySpeed, ballSpeedMax)) }; })} />
          <Text style={styles.sectionTitle}>SLOW BALL RECOVERY</Text>
          <NumberRow label="Recovery speed threshold (units/sec)" value={tuning.ballRecoveryThreshold} step={5} min={0} max={Math.max(0, tuning.ballSpeedMax - 1)} onChange={value => setTuning(old => ({ ...old, ballRecoveryThreshold: Math.min(value, old.ballSpeedMax - 1), ballRecoverySpeed: Math.max(old.ballRecoverySpeed, value + 1) }))} />
          <NumberRow label="Speed after recovery (units/sec)" value={tuning.ballRecoverySpeed} step={5} min={tuning.ballRecoveryThreshold + 1} max={tuning.ballSpeedMax} onChange={value => setTuning(old => ({ ...old, ballRecoverySpeed: value }))} />
          <NumberRow label="Chance to gain an eligible modifier (%)" value={tuning.ballRecoveryModifierChance * 100} step={5} min={0} max={100} onChange={value => setTuning(old => ({ ...old, ballRecoveryModifierChance: value / 100 }))} />
          <Text style={styles.sectionTitle}>TERRITORY SPAWN MODES</Text>
          <Text style={styles.devHint}>After each territory capture, Normal/Hard roll once and successful bonus spawns go to the largest open area. Easy skips these rolls. All modes still gain the regular ball increase per level.</Text>
          <Text style={styles.pickupSettingsTitle}>EASY MODE</Text>
          <Text style={styles.devHint}>No balls spawn when territory is captured. Base population still increases between levels.</Text>
          <Text style={styles.pickupSettingsTitle}>NORMAL MODE</Text>
          <NumberRow label="Balls on a successful roll" value={tuning.normalCaptureBallCount} step={1} min={0} max={30} onChange={value => setTuning(old => ({ ...old, normalCaptureBallCount: value }))} />
          <NumberRow label="Spawn chance per territory capture (%)" value={tuning.normalCaptureBallChance * 100} step={5} min={0} max={100} onChange={value => setTuning(old => ({ ...old, normalCaptureBallChance: value / 100 }))} />
          <Text style={styles.pickupSettingsTitle}>HARD MODE</Text>
          <NumberRow label="Balls on a successful roll" value={tuning.hardCaptureBallCount} step={1} min={0} max={30} onChange={value => setTuning(old => ({ ...old, hardCaptureBallCount: value }))} />
          <NumberRow label="Spawn chance per territory capture (%)" value={tuning.hardCaptureBallChance * 100} step={5} min={0} max={100} onChange={value => setTuning(old => ({ ...old, hardCaptureBallChance: value / 100 }))} />
        </> : <>
          <Text style={styles.sectionTitle}>BALL MODIFIERS</Text>
          <Text style={styles.devHint}>Each base ball spawn rolls enabled modifiers by chance. Optional eligibility rules can be switched off independently. Modifier values here are stored with the base tuning profile.</Text>
          {modifierTypes.map(modifier => {
            const setting = tuning.ballModifiers[modifier];
            const title = modifier.toUpperCase();
            const rule = modifier === 'splitter' ? 'Limit to one active Splitter at a time.' : modifier === 'skimmer' ? 'Each tick can apply Skimmer to a random unmodified ball for a random duration. It glides when a solid player wall is available.' : modifier === 'drifter' ? 'Requires a forming player wall to drift toward.' : modifier === 'anchor' ? 'Limit to one active Anchor. Above its speed threshold, it severs the struck wall section to the nearest junction, then slows below threshold.' : modifier === 'phase' ? 'Each ball must occupy its own disconnected open region; a successful roll phases one random ball when a new wall is started.' : 'Uses this modifier’s own eligibility and collision rules.';
            const update = (patch: Partial<typeof setting>) => setTuning(old => ({ ...old, ballModifiers: { ...old.ballModifiers, [modifier]: { ...old.ballModifiers[modifier], ...patch } } }));
            return <View key={modifier} style={styles.pickupSettingsCard}>
              <Text style={styles.pickupSettingsTitle}>{title}</Text>
              <ToggleRow label="Enable modifier" value={setting.enabled} onChange={enabled => update({ enabled })} />
              {modifier !== 'phase' && <><ToggleRow label="Can be gained by collision mutation" value={setting.mutationEnabled} onChange={mutationEnabled => update({ mutationEnabled })} /><ToggleRow label="Can infect another ball" value={setting.infectiousEnabled} onChange={infectiousEnabled => update({ infectiousEnabled })} /></>}
              {(modifier === 'anchor' || modifier === 'splitter') && setting.infectiousEnabled && <Text style={styles.devHint}>With infection enabled, this modifier can exceed its normal one-ball spawn cap for balance testing.</Text>}
              {modifier === 'phase' && <Text style={styles.devHint}>Phase stays exclusive to its all-balls-isolated wall-start rule and cannot spread through collisions.</Text>}
              {modifier === 'skimmer' && setting.periodic
                ? <><NumberRow label="Periodic activation chance per second (%)" value={setting.periodic.chancePerSecond * 100} step={0.1} min={0} max={100} onChange={value => update({ periodic: { ...setting.periodic!, chancePerSecond: value / 100 } })} /><NumberRow label="Temporary modifier duration minimum (seconds)" value={setting.periodic.durationMinSeconds} step={1} min={1} max={600} onChange={value => update({ periodic: { ...setting.periodic!, durationMinSeconds: Math.min(value, setting.periodic!.durationMaxSeconds) } })} /><NumberRow label="Temporary modifier duration maximum (seconds)" value={setting.periodic.durationMaxSeconds} step={1} min={1} max={600} onChange={value => update({ periodic: { ...setting.periodic!, durationMaxSeconds: Math.max(value, setting.periodic!.durationMinSeconds) } })} /></>
                : <NumberRow label={modifier === 'phase' ? 'Phase chance each wall start (%)' : 'Spawn chance per eligible ball (%)'} value={setting.spawnChance * 100} step={1} min={0} max={100} onChange={value => update({ spawnChance: value / 100 })} />}
              {modifier !== 'skimmer' && <ToggleRow label="Use this modifier's spawn rule" value={setting.spawnRuleEnabled} onChange={spawnRuleEnabled => update({ spawnRuleEnabled })} />}
              <Text style={styles.devHint}>{rule}</Text>
              {modifier === 'splitter' && <><NumberRow label="Split ball size (× original)" value={setting.splitSizeMultiplier ?? 0.65} step={0.05} min={0.25} max={0.95} onChange={value => update({ splitSizeMultiplier: value })} /><NumberRow label="Minimum child radius" value={setting.splitMinimumRadius ?? tuning.ballRadius * 0.4} step={0.5} min={1} max={tuning.ballRadius * 2} onChange={value => update({ splitMinimumRadius: value })} /></>}
              {modifier === 'skimmer' && <NumberRow label="Glide duration along solid walls (ms)" value={setting.glideDurationMs ?? 900} step={100} min={100} max={10000} onChange={value => update({ glideDurationMs: value })} />}
              {modifier === 'drifter' && <><NumberRow label="Pull strength" value={setting.attractionStrength ?? 240} step={20} min={0} max={2000} onChange={value => update({ attractionStrength: value })} /><NumberRow label="Wall attraction range" value={setting.attractionRange ?? 360} step={20} min={0} max={2000} onChange={value => update({ attractionRange: value })} /></>}
              {modifier === 'anchor' && <><NumberRow label="Anchor size (× normal ball)" value={setting.sizeMultiplier ?? 1.6} step={0.1} min={1} max={4} onChange={value => update({ sizeMultiplier: value })} /><NumberRow label="Wall-break speed threshold (units/sec)" value={setting.breakSpeedThreshold ?? 190} step={10} min={0} max={2000} onChange={value => update({ breakSpeedThreshold: value })} /></>}
              {modifier === 'phase' && <><NumberRow label="Phase duration (ms)" value={setting.phaseDurationMs ?? 8000} step={500} min={500} max={60000} onChange={value => update({ phaseDurationMs: value })} /><NumberRow label="Unclaim blast radius" value={setting.phaseUnclaimRadius ?? 65} step={5} min={10} max={400} onChange={value => update({ phaseUnclaimRadius: value })} /><SettingChoiceRow label="Blast footprint" value={setting.phaseBlastShape ?? 'ellipse'} options={[{ id: 'circle', label: 'Circle' }, { id: 'ellipse', label: 'Ellipse' }]} onChange={value => update({ phaseBlastShape: value as 'circle' | 'ellipse' })} /><NumberRow label="Random blast scale minimum (%)" value={(setting.phaseBlastScaleMin ?? 0.75) * 100} step={5} min={25} max={(setting.phaseBlastScaleMax ?? 1.25) * 100} onChange={value => update({ phaseBlastScaleMin: value / 100 })} /><NumberRow label="Random blast scale maximum (%)" value={(setting.phaseBlastScaleMax ?? 1.25) * 100} step={5} min={(setting.phaseBlastScaleMin ?? 0.75) * 100} max={300} onChange={value => update({ phaseBlastScaleMax: value / 100 })} /><NumberRow label="Chest reward minimum" value={setting.chestRewardMin ?? 3} step={1} min={0} max={50} onChange={value => update({ chestRewardMin: Math.min(value, setting.chestRewardMax ?? 6) })} /><NumberRow label="Chest reward maximum" value={setting.chestRewardMax ?? 6} step={1} min={0} max={50} onChange={value => update({ chestRewardMax: Math.max(value, setting.chestRewardMin ?? 3) })} /></>}
            </View>;
          })}
          <View style={styles.pickupSettingsCard}>
            <Text style={styles.pickupSettingsTitle}>MUTATION & INFECTION RATES</Text>
            <Text style={styles.devHint}>Each rate rolls on eligible ball-to-ball collisions. Existing spawn rules retain priority.</Text>
            {(['easy', 'normal', 'hard'] as const).map(mode => <View key={mode} style={styles.pickupSettingsCard}><Text style={styles.settingLabel}>{mode.toUpperCase()}</Text><NumberRow label="Mutation chance (%)" value={tuning.modifierMutationRates[mode] * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, modifierMutationRates: { ...old.modifierMutationRates, [mode]: value / 100 } }))} /><NumberRow label="Infection chance (%)" value={tuning.modifierInfectionRates[mode] * 100} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, modifierInfectionRates: { ...old.modifierInfectionRates, [mode]: value / 100 } }))} /></View>)}
          </View>
          <View style={styles.pickupSettingsCard}>
            <Text style={styles.pickupSettingsTitle}>MODIFIER COMPATIBILITY</Text>
            <Text style={styles.devHint}>Select a modifier, then choose which other modifiers may coexist with it. Pair settings work in both directions.</Text>
            <View style={styles.profileRow}>{modifierTypes.map(modifier => <Pressable key={modifier} style={[styles.smallAction, modifierPairFocus === modifier && styles.tabSelected]} onPress={() => setModifierPairFocus(modifier)}><Text style={styles.smallActionText}>{modifier.toUpperCase()}</Text></Pressable>)}</View>
            {modifierTypes.filter(modifier => modifier !== modifierPairFocus).map(modifier => <ToggleRow key={`${modifierPairFocus}-${modifier}`} label={`${modifierPairFocus.toUpperCase()} + ${modifier.toUpperCase()}`} value={!!(tuning.modifierCompatibility[modifierPairFocus]?.[modifier] || tuning.modifierCompatibility[modifier]?.[modifierPairFocus])} onChange={enabled => setTuning(old => ({ ...old, modifierCompatibility: { ...old.modifierCompatibility, [modifierPairFocus]: { ...old.modifierCompatibility[modifierPairFocus], [modifier]: enabled }, [modifier]: { ...old.modifierCompatibility[modifier], [modifierPairFocus]: enabled } } }))} />)}
          </View>
        </>}
      </>}
      {devTab === 'economy' && <>
        <Text style={styles.devTitle}>RUN ECONOMY</Text><Text style={styles.devHint}>Values marked BASE are saved as the starting point for the next run. Merchant upgrades only change the active run and reset when it ends. Territory awards Credits at each 10% milestone.</Text>
        <NumberRow label="Credits per 10% claimed" value={tuning.merchantCreditsPerTenPercent} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, merchantCreditsPerTenPercent: value }))} />
        <Text style={styles.sectionTitle}>RESOURCE VAULTS & SMELTER</Text>
        <NumberRow label="BASE · starting visible heart slots" value={tuning.lifeStorageBaseCapacity} step={1} min={1} max={100} onChange={value => setTuning(old => ({ ...old, lifeStorageBaseCapacity: value }))} />
        <NumberRow label="Life Vault expansion base cost (Credits)" value={tuning.lifeStorageUpgradeBaseCost} step={5} min={0} max={100000} onChange={value => setTuning(old => ({ ...old, lifeStorageUpgradeBaseCost: value }))} />
        <NumberRow label="Expansion price growth (%)" value={tuning.lifeStorageCostIncreasePercent} step={5} min={0} max={1000} onChange={value => setTuning(old => ({ ...old, lifeStorageCostIncreasePercent: value }))} />
        <Text style={styles.pickupSettingsTitle}>SPEED / RAM STORAGE</Text>
        <Text style={styles.devHint}>Base capacity is current stage + 2 for each resource. HUD slot calibrators add permanent capacity for this run; overflow enters the smelter.</Text>
        <NumberRow label="Base cost per added slot (Credits)" value={tuning.resourceStorageUpgradeBaseCost} step={5} min={0} max={100000} onChange={value => setTuning(old => ({ ...old, resourceStorageUpgradeBaseCost: value }))} />
        <NumberRow label="Slot price growth per purchase (%)" value={tuning.resourceStorageCostIncreasePercent} step={5} min={0} max={1000} onChange={value => setTuning(old => ({ ...old, resourceStorageCostIncreasePercent: value }))} />
        <NumberRow label="Overflow processing time (seconds)" value={tuning.overflowProcessingMs / 1000} step={1} min={1} max={3600} onChange={value => setTuning(old => ({ ...old, overflowProcessingMs: value * 1000 }))} />
        <NumberRow label="Smelter time reduction per upgrade (%)" value={tuning.overflowProcessingReductionPercent} step={1} min={0} max={50} onChange={value => setTuning(old => ({ ...old, overflowProcessingReductionPercent: value }))} />
        <NumberRow label="Smelter upgrade base cost (Credits)" value={tuning.overflowProcessingUpgradeBaseCost} step={5} min={0} max={10000} onChange={value => setTuning(old => ({ ...old, overflowProcessingUpgradeBaseCost: value }))} />
        <NumberRow label="Smelter upgrade cost increase (%)" value={tuning.overflowProcessingUpgradeCostIncreasePercent} step={5} min={0} max={500} onChange={value => setTuning(old => ({ ...old, overflowProcessingUpgradeCostIncreasePercent: value }))} />
        <NumberRow label="Smelter minimum processing time (seconds)" value={tuning.overflowProcessingMinimumMs / 1000} step={1} min={1} max={600} onChange={value => setTuning(old => ({ ...old, overflowProcessingMinimumMs: value * 1000 }))} />
        <NumberRow label="BASE · smelter yield chance (%)" value={tuning.overflowBaseSuccessChance} step={5} min={0} max={100} onChange={value => setTuning(old => ({ ...old, overflowBaseSuccessChance: value }))} />
        <NumberRow label="BASE · smelter calibration gain (%)" value={tuning.overflowUpgradeChanceIncrease} step={1} min={1} max={100} onChange={value => setTuning(old => ({ ...old, overflowUpgradeChanceIncrease: value }))} />
        <NumberRow label="BASE · smelter calibration cost (Credits)" value={tuning.overflowUpgradeBaseCost} step={5} min={0} max={100000} onChange={value => setTuning(old => ({ ...old, overflowUpgradeBaseCost: value }))} />
        <NumberRow label="Smelter upgrade cost increase (%)" value={tuning.overflowUpgradeCostIncreasePercent} step={5} min={0} max={1000} onChange={value => setTuning(old => ({ ...old, overflowUpgradeCostIncreasePercent: value }))} />
        <Text style={styles.devHint}>Overflow resources are consumed by the timed smelting cycle. Only a successful yield awards Credits; failure consumes the item. Calibrate from the HUD during a run, separate from the Merchant reactor.</Text>
        {(Object.keys(PICKUP_SKINS) as PowerKind[]).map(kind => <NumberRow key={`overflow-${kind}`} label={`${kind.toUpperCase()} overflow yield (Credits)`} value={tuning.overflowCreditValues[kind] ?? 0} step={1} min={0} max={10000} onChange={value => setTuning(old => ({ ...old, overflowCreditValues: { ...old.overflowCreditValues, [kind]: value } }))} />)}
        <NumberRow label="Power Bar price (Credits)" value={tuning.merchantPowerBarCost} step={1} min={0} max={10000} onChange={value => setTuning(old => ({ ...old, merchantPowerBarCost: value }))} />
        <NumberRow label="Power Bar price growth per purchase (%)" value={tuning.merchantPowerBarCostIncreasePercent} step={1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, merchantPowerBarCostIncreasePercent: value }))} />
        <Text style={styles.sectionTitle}>RUN MODULE SCALING · PER POWER BAR</Text>
        <NumberRow label="Life: spawn-weight increase" value={tuning.merchantUpgradePerBar.lifeSpawnWeight} step={0.5} min={0} max={100} onChange={value => setTuning(old => ({ ...old, merchantUpgradePerBar: { ...old.merchantUpgradePerBar, lifeSpawnWeight: value } }))} />
        <NumberRow label="Life: lifetime increase (sec)" value={tuning.merchantUpgradePerBar.lifeLifetimeSeconds} step={1} min={0} max={600} onChange={value => setTuning(old => ({ ...old, merchantUpgradePerBar: { ...old.merchantUpgradePerBar, lifeLifetimeSeconds: value } }))} />
        <NumberRow label="Speed boost increase (%)" value={tuning.merchantUpgradePerBar.speedPercent} step={1} min={0} max={500} onChange={value => setTuning(old => ({ ...old, merchantUpgradePerBar: { ...old.merchantUpgradePerBar, speedPercent: value } }))} />
        <NumberRow label="Ram radius and force increase (%)" value={tuning.merchantUpgradePerBar.ramPercent} step={1} min={0} max={500} onChange={value => setTuning(old => ({ ...old, merchantUpgradePerBar: { ...old.merchantUpgradePerBar, ramPercent: value } }))} />
        <NumberRow label="Treasure rewards per bar" value={tuning.merchantUpgradePerBar.treasureRewards} step={1} min={0} max={20} onChange={value => setTuning(old => ({ ...old, merchantUpgradePerBar: { ...old.merchantUpgradePerBar, treasureRewards: value } }))} />
        <NumberRow label="Waldo: credits added per painting / bar" value={tuning.merchantUpgradePerBar.waldoPaintingCredits} step={1} min={0} max={10000} onChange={value => setTuning(old => ({ ...old, merchantUpgradePerBar: { ...old.merchantUpgradePerBar, waldoPaintingCredits: value } }))} />
        <Text style={styles.sectionTitle}>CONTAINMENT MUTATION MERCHANT UPGRADES</Text>
        <NumberRow label="Pickup selection affinity increase per bar (%)" value={tuning.merchantUpgradePerBar.mutationAffinityPercent} step={1} min={0} max={60} onChange={value => setTuning(old => ({ ...old, merchantUpgradePerBar: { ...old.merchantUpgradePerBar, mutationAffinityPercent: value } }))} />
        <NumberRow label="Local spawn attraction increase per bar (%)" value={tuning.merchantUpgradePerBar.mutationAttractionPercent} step={1} min={0} max={60} onChange={value => setTuning(old => ({ ...old, merchantUpgradePerBar: { ...old.merchantUpgradePerBar, mutationAttractionPercent: value } }))} />
        <Text style={styles.devHint}>Each upgrade branch per pickup type has its own run-local 60% relative increase cap.</Text>
        <Text style={styles.devHint}>The reward list is data-driven so new pickup reward types can be added here later.</Text>
      </>}
      {devTab === 'merchant' && <>
        <Text style={styles.devTitle}>MERCHANT DEVELOPMENT</Text><Text style={styles.devHint}>Merchant tokens are capped at one. A Merchant pickup breaks on ball contact and expires after its configured lifetime.</Text>
        <NumberRow label="Merchant spawn weight" value={tuning.powerupSpawnWeights.merchant} step={0.1} min={0} max={100} onChange={value => setTuning(old => ({ ...old, powerupSpawnWeights: { ...old.powerupSpawnWeights, merchant: value } }))} />
        <ToggleRow label="Despawn merchant pickup" value={tuning.powerupDespawnEnabled.merchant} onChange={value => setTuning(old => ({ ...old, powerupDespawnEnabled: { ...old.powerupDespawnEnabled, merchant: value } }))} />
        <NumberRow label="Merchant pickup lifetime (seconds)" value={tuning.powerupDespawnSeconds.merchant} step={1} min={1} max={3600} onChange={value => setTuning(old => ({ ...old, powerupDespawnSeconds: { ...old.powerupDespawnSeconds, merchant: value } }))} />
        <SkinSelectRow label="Merchant pickup skin" value={skinSelections.pickups.merchant} previewKind="merchant" options={PICKUP_SKINS.merchant} onChange={id => setSkinSelections(old => ({ ...old, pickups: { ...old.pickups, merchant: id } }))} />
        <Text style={styles.sectionTitle}>SHOP REWARD TYPES</Text>
        {(Object.keys(tuning.merchantRewardsEnabled) as (keyof MechanicsSettings['merchantRewardsEnabled'])[]).map(kind => <ToggleRow key={kind} label={`${kind.toUpperCase()} upgrades in shop`} value={tuning.merchantRewardsEnabled[kind]} onChange={value => setTuning(old => ({ ...old, merchantRewardsEnabled: { ...old.merchantRewardsEnabled, [kind]: value } }))} />)}
        <Text style={styles.sectionTitle}>SKIN TREE PLAYTESTING</Text>
        <View style={styles.profileRow}><Pressable style={styles.smallAction} onPress={unlockAllArchiveSkins}><Text style={styles.smallActionText}>UNLOCK ALL ARCHIVE SKINS</Text></Pressable><Pressable style={styles.smallAction} onPress={() => { const next = defaultSkinUnlocks(); skinProgressionRef.current = next; setSkinProgression(next); setSkinSelections(DEFAULT_SKIN_SELECTIONS); }}><Text style={styles.smallActionText}>RESET OPTIONAL UNLOCKS</Text></Pressable></View>
      </>}
      {devTab === 'pets' && <>
        <Text style={styles.devTitle}>COMPANIONS · ENGI</Text>
        <Text style={styles.devHint}>Engi cocoons hatch after the configured Credits are contributed across Merchant visits, then 120 seconds of active run time. Each Engi can restore one broken forming wall per level. Saved base settings apply to future runs.</Text>
        <NumberRow label="BASE · cocoon payment per Merchant visit" value={tuning.petEggIncubationInstallment} step={5} min={0} max={100000} onChange={value => setTuning(old => ({ ...old, petEggIncubationInstallment: value }))} />
        <NumberRow label="BASE · required Merchant visits" value={tuning.petEggIncubationVisits} step={1} min={1} max={20} onChange={value => setTuning(old => ({ ...old, petEggIncubationVisits: value }))} />
        <NumberRow label="BASE · incubation active-play time (seconds)" value={tuning.petEggIncubationDurationMs / 1000} step={10} min={0} max={3600} onChange={value => setTuning(old => ({ ...old, petEggIncubationDurationMs: value * 1000 }))} />
        <NumberRow label="BASE · direct hire cost" value={tuning.engiHireCost} step={10} min={0} max={100000} onChange={value => setTuning(old => ({ ...old, engiHireCost: value }))} />
        <Text style={styles.sectionTitle}>WALDO COMPANION</Text>
        <NumberRow label="BASE · credits per wall painting" value={tuning.waldoPetPaintingCredits} step={1} min={0} max={10000} onChange={value => setTuning(old => ({ ...old, waldoPetPaintingCredits: value }))} />
        <NumberRow label="BASE · deployed painting interval (seconds)" value={tuning.waldoPetPaintingIntervalMs / 1000} step={5} min={5} max={3600} onChange={value => setTuning(old => ({ ...old, waldoPetPaintingIntervalMs: value * 1000 }))} />
        <NumberRow label="BASE · credits for finding Waldo" value={tuning.waldoRewardCredits} step={5} min={0} max={10000} onChange={value => setTuning(old => ({ ...old, waldoRewardCredits: value }))} />
        <Text style={styles.devHint}>Finding Waldo in a queued Waldo event adds the pet to the crew. Its deployed area stays unclaimed; paintings award credits when hung.</Text>
        <NumberRow label="BASE · upgrade cost at level 1" value={tuning.engiUpgradeBaseCost} step={10} min={0} max={100000} onChange={value => setTuning(old => ({ ...old, engiUpgradeBaseCost: value }))} />
        <Text style={styles.sectionTitle}>ENGI SKINS</Text>
        <View style={styles.engiSkinChoices}>{ENGI_PET_SKINS.map(skin => <View key={skin.id} style={styles.engiSkinChoice}><EngiPetArtwork skinId={skin.id} task="inspect" size={48} /><Text style={styles.settingLabel}>{skin.name}</Text><Text style={styles.devHint}>{skin.description}</Text></View>)}</View>
        <Text style={styles.sectionTitle}>PET RULES</Text><Text style={styles.devHint}>Multiple Engi can be active at once. Deploy by dragging from the crew rail onto the arena; drag back outside the arena to recall. Arena pets have gravity, jump/climb walls and lose health to ball contact.</Text>
      </>}
      </ScrollView>
      </>}
    {activeTab === 'game' && merchantOpen && <MerchantScreen run={run} baseSettings={tuning} skinSelections={skinSelections} openedAtClear={merchantOpenedAtClear} onBuy={buyPowerBar} onExpandLifeVault={expandLifeVault} onInstall={installPowerBar} onClose={closeMerchant} onIncubate={beginEngiIncubation} onHireEngi={purchaseEngi} onUpgradeEngi={upgradeEngiPet} onRenameEngi={renameEngiPet} />}
    {levelClearAnimation && <LevelClearTransition key={levelClearAnimation.id} event={levelClearAnimation} onDone={() => setLevelClearAnimation(current => current?.id === levelClearAnimation.id ? null : current)} />}
    {menuPage === 'home' && <View style={styles.commandScrim}>
      <Image source={COMMAND_BRIDGE_ART} resizeMode="contain" style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.commandImageShade} />
      <View style={[styles.commandLayout, { flexDirection: portraitBridge ? 'column' : 'row' }]}>
        {bridgeRailVisible && <View style={[styles.commandRail, { width: portraitBridge ? '100%' : uiWidth < 620 ? 166 : uiWidth < 920 ? 205 : 258, maxHeight: portraitBridge ? '48%' : undefined, paddingHorizontal: compactBridge ? 11 : 19, paddingVertical: compactBridge ? 10 : 18 }]}>
          <ScrollView style={styles.commandRailScroll} contentContainerStyle={styles.commandRailContent} showsVerticalScrollIndicator={false}>
            <View style={styles.bridgeBrandBlock}><View style={styles.bridgeBrandGlyph}><Text style={styles.bridgeBrandGlyphText}>✧</Text></View><View><Text style={styles.menuEyebrow}>TRAP / SURVIVAL</Text><Text style={[styles.commandBrand, compactBridge && styles.commandBrandCompact]}>Containment</Text><Text style={styles.commandSubBrand}>STARSHIP COMMAND</Text></View></View>
            <Text style={[styles.commandSectionLabel, styles.bridgeSectionLabel]}>RUN CONTROL</Text>
            <Pressable disabled={!hasSave || run.ended} style={[styles.bridgeRailAction, styles.bridgeRailResume, (!hasSave || run.ended) && styles.bridgeRailDisabled]} onPress={resume}><Text style={styles.bridgeRailGlyph}>▶</Text><View style={styles.bridgeRailCopy}><Text style={styles.bridgeRailTitle}>RESUME ACTIVE RUN</Text><Text style={styles.bridgeRailDetail}>{hasSave && !run.ended ? `Stage ${String(run.level).padStart(2, '0')} · ${running ? 'simulation live' : paused ? 'simulation paused' : 'ready to resume'}` : 'No active sector'}</Text></View><BridgePulse /></Pressable>
            {!!manualSave && <Pressable style={styles.bridgeRailAction} onPress={loadManualRun}><Text style={styles.bridgeRailGlyph}>◫</Text><View style={styles.bridgeRailCopy}><Text style={styles.bridgeRailTitle}>LOAD SAVED RUN</Text><Text style={styles.bridgeRailDetail}>Checkpoint · stage {String(manualSave.level).padStart(2, '0')}</Text></View></Pressable>}
            {!!hasSave && !run.ended && <Pressable style={styles.bridgeRailAction} onPress={() => manualSave ? confirmOverwriteSave ? void saveActiveRunToSlot() : setConfirmOverwriteSave(true) : void saveActiveRunToSlot()}><Text style={styles.bridgeRailGlyph}>▣</Text><View style={styles.bridgeRailCopy}><Text style={styles.bridgeRailTitle}>{confirmOverwriteSave ? 'CONFIRM SAVE OVERWRITE' : manualSave ? 'SAVE ACTIVE RUN OVER SLOT' : 'SAVE ACTIVE RUN'}</Text><Text style={styles.bridgeRailDetail}>{confirmOverwriteSave ? 'Replace the manual checkpoint' : 'Copy the live sector to your save slot'}</Text></View></Pressable>}
            {confirmOverwriteSave && <Text style={styles.bridgeRailWarning}>This replaces the saved checkpoint.</Text>}
            <Pressable style={[styles.bridgeRailAction, styles.bridgeRailNew, confirmNewRun && styles.commandActionWarn]} onPress={() => { if (hasSave && !run.ended && !confirmNewRun) setConfirmNewRun(true); else { setConfirmNewRun(false); startFresh(); } }}><Text style={styles.bridgeRailGlyph}>✧</Text><View style={styles.bridgeRailCopy}><Text style={styles.bridgeRailTitle}>{confirmNewRun ? 'CONFIRM NEW RUN' : 'START NEW RUN'}</Text><Text style={styles.bridgeRailDetail}>{confirmNewRun ? 'The active run will be replaced' : 'Deploy into a fresh sector'}</Text></View></Pressable>
            <Pressable disabled={!hasSave || run.ended || (!running && !paused)} style={[styles.bridgePauseLink, (!running && !paused) && styles.bridgeRailDisabled]} onPress={togglePause}><Text style={styles.bridgePauseGlyph}>{running ? 'Ⅱ' : '▶'}</Text><Text style={styles.bridgePauseText}>{running ? 'PAUSE LIVE SIMULATION' : paused ? 'RESUME LIVE SIMULATION' : 'SIMULATION STANDBY'}</Text></Pressable>
            <View style={styles.bridgeReadoutGroup}>
              <Pressable style={styles.bridgeReadout} onPress={() => setMenuPage('settings')}><View style={styles.bridgeReadoutHeading}><Text style={styles.bridgeReadoutGlyph}>◈</Text><Text style={styles.bridgeReadoutLabel}>PLAY MODE</Text></View><Text style={styles.bridgeReadoutValue}>{tuning.easyMode ? 'EASY' : tuning.hardMode ? 'HARD' : 'NORMAL'}</Text></Pressable>
              <Pressable style={styles.bridgeReadout} onPress={() => setMenuPage('themes')}><View style={styles.bridgeReadoutHeading}><Text style={styles.bridgeReadoutGlyph}>✦</Text><Text style={styles.bridgeReadoutLabel}>THEME LOADOUT</Text></View><Text style={styles.bridgeReadoutValue}>{Object.entries(themeSelectionMap).filter(([category, id]) => id !== SKIN_DEFAULTS[category]).length || 'STANDARD'}</Text></Pressable>
              <Pressable style={styles.bridgeReadout} onPress={() => setMenuPage('scores')}><View style={styles.bridgeReadoutHeading}><Text style={styles.bridgeReadoutGlyph}>⌁</Text><Text style={styles.bridgeReadoutLabel}>BEST RUN</Text></View><Text style={styles.bridgeReadoutValue}>{scores[0] ? `STAGE ${String(scores[0].level).padStart(2, '0')}` : 'NO RECORD'}</Text></Pressable>
            </View>
          </ScrollView>
          <View style={styles.commandFooterRow}><BridgePulse delay={450} color="#ffc879" /><Text style={styles.commandFooter}>FLIGHT SYSTEMS ONLINE</Text></View>
        </View>}
        <View style={[styles.commandMain, compactBridge && styles.commandMainCompact]}>
          <View style={styles.bridgeWelcome}><View><Text style={styles.menuEyebrow}>COMMAND BRIDGE · DEEP SPACE</Text><Text style={[styles.bridgeWelcomeTitle, compactBridge && styles.bridgeWelcomeTitleCompact]}>Welcome aboard</Text></View><View style={styles.bridgeReady}><BridgePulse delay={240} /><Text style={styles.bridgeReadyText}>{running ? 'SECTOR LIVE' : paused ? 'SECTOR PAUSED' : 'SYSTEMS READY'}</Text></View></View>
          <BridgeStagePreview run={run} hasActiveRun={hasSave && !run.ended} simulationRunning={running} pictureSource={bridgePictureSource} defaultBackground={activeBackground.asset ?? undefined} onPress={hasSave && !run.ended ? resume : startFresh} />
          <View style={styles.bridgeArtifactDock}>
            <Text style={styles.bridgeDockHeading}>SHIP SYSTEMS · SELECT A CONSOLE</Text>
            <View style={styles.bridgeArtifactRow}>
              <BridgeArtifact title="THEMES" detail="SKIN CONSTELLATIONS" glyph="✦" color="#75e8db" onPress={() => setMenuPage('themes')} />
              <BridgeArtifact title="SCORES" detail="FLIGHT RECORDS" glyph="⌁" color="#94bbff" onPress={() => setMenuPage('scores')} />
              <BridgeArtifact title="PLAY MODE" detail="SECTOR RULES" glyph="◈" color="#f6cd7c" onPress={() => setMenuPage('settings')} />
              <BridgeArtifact title="DEVELOPER" detail="SYSTEMS ACCESS" glyph="⌘" color="#c9a5ff" onPress={() => { setMenuPage(null); setActiveTab('developer'); }} />
              <BridgeArtifact title="NAV CONSOLE" detail={bridgeRailVisible ? 'HIDE SIDE PANEL' : 'RESTORE SIDE PANEL'} glyph={bridgeRailVisible ? '⇤' : '⇥'} color="#8ed4ff" onPress={() => setBridgeRailVisible(visible => !visible)} />
            </View>
          </View>
        </View>
      </View>
    </View>}
    {menuPage === 'scores' && <View style={styles.mainMenuScrim}><View style={styles.scorePanel}><View style={styles.menuPanelHeader}><View><Text style={styles.menuEyebrow}>RUN ARCHIVE · TOP FIVE</Text><Text style={styles.menuTitle}>Scores</Text></View><Pressable style={styles.menuBack} onPress={() => setMenuPage('home')}><Text style={styles.menuBackText}>HOME</Text></Pressable></View><Text style={styles.menuSubhead}>Ranked by Score (currently the level reached), then by total balls contained.</Text>{scores.length ? scores.map((entry, index) => <View key={`${entry.timestamp}-${index}`} style={styles.menuScoreCard}><View style={styles.menuScoreRank}><Text style={styles.menuScoreRankText}>{String(index + 1).padStart(2, '0')}</Text></View><View style={styles.scoreMain}><Text style={styles.scoreLevel}>SCORE {entry.score} · STAGE {String(entry.level).padStart(2, '0')}</Text><Text style={styles.scoreDetails}>{entry.totalTerritoryClaimed.toFixed(1)}% total claimed · {entry.ballsContained} balls contained · {entry.ballsDestroyed} destroyed · {entry.pickupsCaptured} pickups</Text></View><Text style={styles.scoreClaim}>{entry.claimed.toFixed(1)}%</Text></View>) : <Text style={styles.menuEmpty}>No completed runs yet. Scores are recorded when a run ends.</Text>}</View></View>}
    {menuPage === 'settings' && <View style={styles.mainMenuScrim}><View style={styles.scorePanel}><View style={styles.menuPanelHeader}><View><Text style={styles.menuEyebrow}>PLAYER SETTINGS</Text><Text style={styles.menuTitle}>Play mode</Text></View><Pressable style={styles.menuBack} onPress={() => setMenuPage('home')}><Text style={styles.menuBackText}>HOME</Text></Pressable></View><Text style={styles.menuSubhead}>Choose the baseline rules for your next run. Active runs keep their saved settings.</Text><View style={styles.modeRow}>{(['easy', 'normal', 'hard'] as const).map(mode => { const active = mode === 'easy' ? tuning.easyMode : mode === 'hard' ? tuning.hardMode : !tuning.easyMode && !tuning.hardMode; return <Pressable key={mode} style={[styles.modeCard, active && styles.modeCardActive]} onPress={() => setTuning(old => ({ ...old, easyMode: mode === 'easy', hardMode: mode === 'hard' }))}><Text style={[styles.modeTitle, active && styles.modeTitleActive]}>{mode.toUpperCase()}</Text><Text style={styles.menuButtonCopy}>{mode === 'easy' ? 'Balls added between levels only.' : mode === 'normal' ? 'A chance to add a ball after capture.' : 'Additional ball on every completed wall.'}</Text></Pressable>; })}</View></View></View>}
    {menuPage === 'themes' && <ThemeTreeScreen unlocks={skinProgression} selections={themeSelectionMap} onEquip={equipArchiveSkin} onClose={() => setMenuPage('home')} renderPreview={renderThemePreview} />}
    {skinAchievement && <Pressable style={styles.skinAchievementScrim} onPress={() => setSkinAchievement(null)}><View style={styles.skinAchievementCard}><Text style={styles.menuEyebrow}>CONSTELLATION DISCOVERED</Text><Text style={styles.achievementGlyph}>✦</Text><Text style={styles.menuTitle}>{skinAchievement.name}</Text><Text style={styles.menuSubhead}>{skinAchievement.categoryName} · TIER {skinAchievement.tier}</Text><Text style={styles.menuButtonCopy}>This skin is permanently available in THEMES.</Text><Text style={styles.menuConfirmText}>TAP TO CONTINUE</Text></View></Pressable>}
    </View>
  );
}

type BaseUpgradeKind = 'life' | 'speed' | 'ram' | 'treasure' | 'waldo';
type UpgradeKind = BaseUpgradeKind | `mutationAffinity:${ContainmentPickupKind}` | `mutationAttraction:${ContainmentPickupKind}`;

function MerchantScreen({ run, baseSettings, skinSelections, onBuy, onExpandLifeVault, onInstall, onClose, onIncubate, onHireEngi, onUpgradeEngi, onRenameEngi, openedAtClear }: { run: Run; baseSettings: MechanicsSettings; skinSelections: SkinSelections; onBuy: () => void; onExpandLifeVault: () => void; onInstall: (kind: UpgradeKind) => void; onClose: () => void; onIncubate: () => void; onHireEngi: () => void; onUpgradeEngi: (id: number) => void; onRenameEngi: (id: number, name: string) => void; openedAtClear: boolean }) {
  const [contributedThisVisit, setContributedThisVisit] = useState(false);
  const lifeCapacity = Math.max(run.lives, run.lifeCapacity ?? run.mechanics.lifeStorageBaseCapacity);
  const lifeExpansionCost = lifeStorageUpgradeCost(run);
  const assigned = (Object.values(run.merchantUpgrades) as number[]).reduce((sum, count) => sum + count, 0);
  const totalBars = assigned + run.powerBars;
  const powerBarCost = getMerchantPowerBarCost(run);
  const currentStats: Record<BaseUpgradeKind, { title: string; nextRunBase: string; runStart: string; live: string; effect: string }> = {
    life: {
      title: 'LIFE / VITALITY',
      nextRunBase: `Weight ${baseSettings.powerupSpawnWeights.life.toFixed(1)} · ${baseSettings.powerupDespawnEnabled.life ? `${baseSettings.powerupDespawnSeconds.life}s` : 'no expiry'}`,
      runStart: `Weight ${(run.mechanics.powerupSpawnWeights.life - run.merchantUpgrades.life * run.mechanics.merchantUpgradePerBar.lifeSpawnWeight).toFixed(1)} · ${run.mechanics.powerupDespawnEnabled.life ? `${Math.max(0, run.mechanics.powerupDespawnSeconds.life - run.merchantUpgrades.life * run.mechanics.merchantUpgradePerBar.lifeLifetimeSeconds)}s` : 'no expiry'}`,
      live: `Weight ${run.mechanics.powerupSpawnWeights.life.toFixed(1)} · ${run.mechanics.powerupDespawnEnabled.life ? `${run.mechanics.powerupDespawnSeconds.life}s` : 'no expiry'}`,
      effect: `Each bar: +${run.mechanics.merchantUpgradePerBar.lifeSpawnWeight} spawn weight; +${run.mechanics.merchantUpgradePerBar.lifeLifetimeSeconds}s lifetime when despawn is enabled.`,
    },
    speed: {
      title: 'SPEED / MOMENTUM',
      nextRunBase: `${Math.round((baseSettings.speedBoostMultiplier - 1) * 100)}% boost`,
      runStart: `${Math.round((run.mechanics.speedBoostMultiplier - 1 - run.merchantUpgrades.speed * run.mechanics.merchantUpgradePerBar.speedPercent / 100) * 100)}% boost`,
      live: `${Math.round((run.mechanics.speedBoostMultiplier - 1) * 100)}% boost`,
      effect: `Each bar adds ${run.mechanics.merchantUpgradePerBar.speedPercent}% to the line speed boost.`,
    },
    ram: {
      title: 'RAM / IMPACT',
      nextRunBase: `${baseSettings.missExplosionRadius.toFixed(0)} radius · ${baseSettings.missExplosionStrength.toFixed(0)} force`,
      runStart: `${(run.mechanics.missExplosionRadius / Math.pow(1 + run.mechanics.merchantUpgradePerBar.ramPercent / 100, run.merchantUpgrades.ram)).toFixed(0)} radius · ${(run.mechanics.missExplosionStrength / Math.pow(1 + run.mechanics.merchantUpgradePerBar.ramPercent / 100, run.merchantUpgrades.ram)).toFixed(0)} force`,
      live: `${run.mechanics.missExplosionRadius.toFixed(0)} radius · ${run.mechanics.missExplosionStrength.toFixed(0)} force`,
      effect: `Each bar adds ${run.mechanics.merchantUpgradePerBar.ramPercent}% radius and impulse force.`,
    },
    treasure: {
      title: 'TREASURE / CACHE',
      nextRunBase: `${baseSettings.treasureRewardMin}–${baseSettings.treasureRewardMax} rewards`,
      runStart: `${run.mechanics.treasureRewardMin - run.merchantUpgrades.treasure * run.mechanics.merchantUpgradePerBar.treasureRewards}–${run.mechanics.treasureRewardMax - run.merchantUpgrades.treasure * run.mechanics.merchantUpgradePerBar.treasureRewards} rewards`,
      live: `${run.mechanics.treasureRewardMin}–${run.mechanics.treasureRewardMax} rewards`,
      effect: `Each bar adds ${run.mechanics.merchantUpgradePerBar.treasureRewards} item to both ends of the jackpot range.`,
    },
    waldo: {
      title: 'WALDO / GALLERY',
      nextRunBase: `${baseSettings.waldoPetPaintingCredits} credits per painting`,
      runStart: `${run.mechanics.waldoPetPaintingCredits - run.merchantUpgrades.waldo * run.mechanics.merchantUpgradePerBar.waldoPaintingCredits} credits per painting`,
      live: `${run.mechanics.waldoPetPaintingCredits} credits per painting`,
      effect: `Each bar adds ${run.mechanics.merchantUpgradePerBar.waldoPaintingCredits} credits to every painting Waldo hangs.`,
    },
  };
  const visibleRewards = (Object.keys(currentStats) as BaseUpgradeKind[]).filter(kind => run.mechanics.merchantRewardsEnabled[kind]);
  const mutationUpgradeKinds = (Object.keys(run.mechanics.containmentMutationPickupEnabled) as ContainmentPickupKind[]).filter(kind => run.mechanics.containmentMutationPickupEnabled[kind]);
  return <View style={styles.overlay}><View style={styles.merchantPanel}>
    <View style={styles.stationBackground}>
      <View style={styles.stationGrid} /><View style={styles.stationBeam} /><MerchantFigure style={styles.figureOne} /><MerchantFigure style={styles.figureTwo} amber /><MerchantFigure style={styles.figureThree} />
      <Text style={styles.stationSign}>WAYFARER EXCHANGE · DOCK 04</Text>
      <View style={styles.marketHeader}><View><Text style={styles.merchantEyebrow}>RUN-LOCAL TRADE NETWORK</Text><Text style={styles.merchantHeading}>The Merchant</Text><Text style={styles.stationSubhead}>Trade credits for reactor power, upgrades, and crew support.</Text></View><View style={styles.marketWallet}><View style={creditStyles.marketCreditBalance}><CreditSymbol skinId={skinSelections.credit} size={19} /><Text style={styles.walletValue}>{run.credits.toLocaleString()}</Text></View><Text style={styles.walletLabel}>RUN CREDITS</Text></View></View>
      <View style={styles.stationTicker}><Text style={styles.tickerText}>STAGE {String(run.level).padStart(2, '0')}</Text><Text style={styles.tickerText}>POWER {totalBars}</Text><Text style={styles.tickerText}>AVAILABLE {run.powerBars}</Text><Text style={styles.tickerReset}>THEMES DISCOVERED IN PLAY</Text></View>
    </View>
    <ScrollView style={styles.marketBody} contentContainerStyle={styles.reactorContent}>
      <View style={styles.bankPanel}>
        <View style={styles.bankHeader}><View><Text style={styles.areaEyebrow}>REACTOR CORE</Text><Text style={styles.areaTitle}>Power bank</Text><Text style={styles.marketHint}>Each bar is one unit of run power.</Text></View><View style={styles.bankTotal}><Text style={styles.readoutBig}>{totalBars}</Text><Text style={styles.readoutSmall}>TOTAL POWER</Text></View></View>
        <View style={styles.bankLegend}><Text style={styles.bankLegendGreen}>● AVAILABLE {run.powerBars}</Text><Text style={styles.bankLegendGrey}>● ASSIGNED {assigned}</Text></View>
        <View style={styles.reactorBank}>{Array.from({ length: Math.min(totalBars, 80) }, (_, index) => <View key={index} style={[styles.reactorBar, index < assigned ? styles.reactorBarAssigned : styles.reactorBarAvailable]} />)}{totalBars > 80 && <Text style={styles.extraPips}>+{totalBars - 80}</Text>}{totalBars === 0 && <Text style={styles.marketHint}>The reactor is empty. Buy a Power Bar to energize an upgrade.</Text>}</View>
        <View style={styles.bankActionRow}><View style={creditStyles.bankPriceReadout}><Text style={styles.bankPriceLabel}>NEXT BAR</Text><View style={creditStyles.marketCreditBalance}><CreditSymbol skinId={skinSelections.credit} size={16} /><Text style={styles.bankPriceLabel}>{powerBarCost}</Text></View></View><Pressable disabled={run.credits < powerBarCost} style={[styles.buyBarButton, run.credits < powerBarCost && styles.abilityDisabled]} onPress={onBuy}><Text style={styles.buyBarTitle}>BUY REACTOR POWER</Text><Text style={styles.buyBarCost}>{run.powerBarsPurchased ? `COST RISES EACH PURCHASE · ${run.mechanics.merchantPowerBarCostIncreasePercent}%` : 'FIRST BAR · BASE PRICE'}</Text></Pressable></View>
      </View>
      <View style={lifeVaultUiStyles.lifeExpansionCard}>
        <View style={lifeVaultUiStyles.lifeExpansionHeading}><View><Text style={styles.areaEyebrow}>VITALITY MODULE</Text><Text style={styles.areaTitle}>Expand the Life Vault</Text></View><View style={lifeVaultUiStyles.lifeCapacityReadout}><Text style={lifeVaultUiStyles.lifeCapacityValue}>{lifeCapacity}</Text><Text style={lifeVaultUiStyles.lifeCapacityCaption}>HEART SLOTS</Text></View></View>
        <LifeVaultDisplay lives={run.lives} capacity={lifeCapacity} skinId={skinSelections.pickups.life} compact />
        <View style={lifeVaultUiStyles.lifeExpansionFooter}><Text style={lifeVaultUiStyles.lifeExpansionHint}>Each upgrade adds one visible storage slot. Capacity lasts this run and follows you between levels.</Text><Pressable disabled={run.credits < lifeExpansionCost} style={[lifeVaultUiStyles.lifeExpansionButton, run.credits < lifeExpansionCost && styles.abilityDisabled]} onPress={onExpandLifeVault}><Text style={lifeVaultUiStyles.lifeExpansionButtonTitle}>EXPAND +1</Text><View style={creditStyles.marketCreditBalance}><CreditSymbol skinId={skinSelections.credit} size={14} /><Text style={lifeVaultUiStyles.lifeExpansionButtonCost}>{lifeExpansionCost}</Text></View></Pressable></View>
        <Text style={lifeVaultUiStyles.lifeExpansionScaling}>PRICE INCREASES {run.mechanics.lifeStorageCostIncreasePercent}% EACH EXPANSION · RUN CREDITS</Text>
      </View>
      <View style={styles.areaHeading}><View><Text style={styles.areaEyebrow}>POWER DISTRIBUTION</Text><Text style={styles.areaTitle}>Upgrade sockets</Text></View><Text style={styles.socketHint}>{assigned} POWER ASSIGNED</Text></View>
      <Text style={styles.marketHint}>Developer BASE values are saved for the next run. Assigned Power Bars only change this run; they remain grey in the bank.</Text>
      <View style={styles.moduleGrid}>{visibleRewards.map(kind => {
        const count = run.merchantUpgrades[kind]; const info = currentStats[kind];
        return <View key={kind} style={styles.moduleCard}>
          <View style={styles.moduleTop}><HudPickupIcon kind={kind} skinId={skinSelections.pickups[kind]} size={43} /><View style={styles.moduleHeading}><Text style={styles.moduleTitle}>{info.title}</Text><Text style={styles.moduleLevel}>MODULE LEVEL {String(count).padStart(2, '0')}</Text></View><Text style={styles.moduleBars}>{count}×</Text></View>
          <Text style={styles.moduleEffect}>{info.effect}</Text>
          <View style={styles.statCompare}><View style={styles.statCell}><Text style={styles.statLabel}>SAVED BASE</Text><Text style={styles.statValue}>{info.nextRunBase}</Text></View><Text style={styles.statArrow}>›</Text><View style={styles.statCell}><Text style={styles.statLabel}>THIS RUN</Text><Text style={styles.statValueLive}>{info.live}</Text></View></View>
          <View style={styles.assignmentRow}><Text style={styles.assignmentLabel}>BANK LOAD</Text><View style={styles.assignmentPips}>{Array.from({ length: Math.min(count, 10) }, (_, index) => <View key={index} style={[styles.assignmentPip, styles.assignmentPipGrey]} />)}{Array.from({ length: Math.max(0, 10 - count) }, (_, index) => <View key={`empty-${index}`} style={styles.assignmentPip} />)}{count > 10 && <Text style={styles.extraPips}>+{count - 10}</Text>}</View><Text style={styles.assignmentCount}>{count} BAR{count === 1 ? '' : 'S'}</Text></View>
          <Pressable disabled={run.powerBars < 1} style={[styles.moduleInstall, run.powerBars < 1 && styles.abilityDisabled]} onPress={() => onInstall(kind)}><Text style={styles.moduleInstallText}>{run.powerBars ? 'ROUTE 1 AVAILABLE BAR HERE' : 'NO AVAILABLE POWER'}</Text></Pressable>
        </View>;
      })}</View>
      {mutationUpgradeKinds.length > 0 && <><View style={styles.areaHeading}><View><Text style={styles.areaEyebrow}>CONTAINMENT RESEARCH</Text><Text style={styles.areaTitle}>Mutation tuning</Text></View></View><Text style={styles.marketHint}>Route separate Power Bars into pickup affinity or local attraction. Each track grows up to +60% this run; upgrades follow you between levels, then reset with the run.</Text><View style={styles.moduleGrid}>{mutationUpgradeKinds.flatMap(kind => (['mutationAffinity', 'mutationAttraction'] as const).map(branch => {
        const key = `${branch}:${kind}` as UpgradeKind, count = run.merchantUpgrades[key] ?? 0;
        const perBar = branch === 'mutationAffinity' ? run.mechanics.merchantUpgradePerBar.mutationAffinityPercent : run.mechanics.merchantUpgradePerBar.mutationAttractionPercent;
        const bonus = Math.min(60, count * perBar);
        const title = branch === 'mutationAffinity' ? 'MUTATION AFFINITY' : 'LOCAL SPAWN ATTRACTION';
        const effect = branch === 'mutationAffinity' ? 'Increases this pickup’s weight when a qualifying box selects its exclusive pickup.' : 'Increases the chance a normal pickup spawn is routed into boxes carrying this mutation.';
        return <View key={key} style={styles.moduleCard}><View style={styles.moduleTop}><HudPickupIcon kind={kind} skinId={skinSelections.pickups[kind]} size={38} /><View style={styles.moduleHeading}><Text style={styles.moduleTitle}>{kind.toUpperCase()} · {title}</Text><Text style={styles.moduleLevel}>MODULE LEVEL {String(count).padStart(2, '0')}</Text></View><Text style={styles.moduleBars}>{count}×</Text></View><Text style={styles.moduleEffect}>{effect}</Text><View style={styles.statCompare}><View style={styles.statCell}><Text style={styles.statLabel}>BASE</Text><Text style={styles.statValue}>0%</Text></View><Text style={styles.statArrow}>›</Text><View style={styles.statCell}><Text style={styles.statLabel}>THIS RUN</Text><Text style={styles.statValueLive}>+{bonus.toFixed(0)}% / +60%</Text></View></View><View style={styles.assignmentRow}><Text style={styles.assignmentLabel}>BANK LOAD</Text><View style={styles.assignmentPips}>{Array.from({ length: Math.min(count, 10) }, (_, index) => <View key={index} style={[styles.assignmentPip, styles.assignmentPipGrey]} />)}{Array.from({ length: Math.max(0, 10 - count) }, (_, index) => <View key={`empty-${index}`} style={styles.assignmentPip} />)}</View><Text style={styles.assignmentCount}>{count} BAR{count === 1 ? '' : 'S'}</Text></View><Pressable disabled={run.powerBars < 1 || bonus >= 60} style={[styles.moduleInstall, (run.powerBars < 1 || bonus >= 60) && styles.abilityDisabled]} onPress={() => onInstall(key)}><Text style={styles.moduleInstallText}>{bonus >= 60 ? 'TRACK MAXED · +60%' : run.powerBars ? 'ROUTE 1 AVAILABLE BAR HERE' : 'NO AVAILABLE POWER'}</Text></Pressable></View>;
      }))}</View></>}
      <View style={styles.futureModule}><Text style={styles.futureModuleGlyph}>＋</Text><View style={styles.futureModuleCopy}><Text style={styles.moduleTitle}>OPEN MODULE BAY</Text><Text style={styles.moduleEffect}>Reserved for future pickup types and new upgrade branches.</Text></View><Text style={styles.comingSoon}>STANDBY</Text></View>
      <View style={styles.skinResearchSection}>
        <View style={styles.areaHeading}><View><Text style={styles.areaEyebrow}>CREW BAY · RUN-LOCAL</Text><Text style={styles.areaTitle}>Companions</Text></View><Text style={styles.permanentTag}>{run.pets.length} ACTIVE</Text></View>
        <Text style={styles.marketHint}>Engi cocoons need {run.mechanics.petEggIncubationVisits} Merchant visits × {run.mechanics.petEggIncubationInstallment} Credits, then {Math.round(run.mechanics.petEggIncubationDurationMs / 1000)} seconds of active play. Each Engi repairs a wall break once per level. Waldo stays in open territory when deployed and earns credits from gallery paintings.</Text>
        {run.petEggs > 0 && <Pressable disabled={contributedThisVisit || run.credits < run.mechanics.petEggIncubationInstallment} style={[styles.engiAction, (contributedThisVisit || run.credits < run.mechanics.petEggIncubationInstallment) && styles.abilityDisabled]} onPress={() => { onIncubate(); setContributedThisVisit(true); }}><Text style={styles.engiActionText}>{contributedThisVisit ? 'CONTRIBUTION RECORDED · RETURN NEXT VISIT' : `CONTRIBUTE ${run.mechanics.petEggIncubationInstallment} CREDITS · VISIT ${run.petEggVisitProgress + 1}/${run.mechanics.petEggIncubationVisits}`}</Text><Text style={styles.marketHint}>{run.petEggs} cocoon{run.petEggs === 1 ? '' : 's'} in storage</Text></Pressable>}
        {run.petIncubations.map(egg => <View key={egg.id} style={styles.engiRosterCard}><EngiPetArtwork skinId={egg.skinId} task="tinker" size={46} /><View style={styles.moduleHeading}><Text style={styles.moduleTitle}>ENGI COCOON</Text><Text style={styles.moduleEffect}>INCUBATING · {Math.min(100, egg.progressMs / egg.durationMs * 100).toFixed(0)}%</Text><View style={styles.engiProgressTrack}><View style={[styles.engiProgressFill, { width: `${Math.min(100, egg.progressMs / egg.durationMs * 100)}%` }]} /></View></View></View>)}
        {run.pets.filter(pet => pet.species === 'waldo').map(pet => <View key={pet.id} style={styles.engiRosterCard}><WaldoPetArtwork pet={pet} size={46} /><View style={styles.moduleHeading}><Text style={styles.moduleTitle}>WALDO · GALLERY KEEPER</Text><Text style={styles.moduleEffect}>HEALTH {pet.health}/{pet.maxHealth} · {pet.deployed ? 'DEPLOYED IN OPEN SPACE' : 'TENDING THE LIFE HUD'}</Text><Text style={styles.moduleEffect}>{pet.paintings?.length ?? 0} PAINTINGS · {run.mechanics.waldoPetPaintingCredits} CREDITS EACH</Text></View></View>)}
        {run.pets.filter(pet => pet.species === 'engi').map(pet => { const cost = engiUpgradeCost(pet.level, run.mechanics); return <View key={pet.id} style={styles.engiRosterCard}><EngiPetArtwork skinId={pet.skinId} task={pet.task} size={52} /><View style={styles.moduleHeading}><Text style={styles.moduleTitle}>ENGI · LV {pet.level}</Text><TextInput value={pet.name} onChangeText={name => onRenameEngi(pet.id, name)} placeholder="Name your Engi" placeholderTextColor="#708199" style={styles.engiNameInput} /><Text style={styles.moduleEffect}>HEALTH {pet.health}/{pet.maxHealth} · REPAIR READY {pet.repairedThisLevel ? 'NO' : 'YES'}</Text></View><Pressable disabled={run.credits < cost} style={[styles.engiUpgrade, run.credits < cost && styles.abilityDisabled]} onPress={() => onUpgradeEngi(pet.id)}><Text style={styles.engiActionText}>UPGRADE</Text><Text style={styles.engiCost}>{cost} C</Text></Pressable></View>; })}
        <Pressable disabled={run.credits < run.mechanics.engiHireCost} style={[styles.engiAction, run.credits < run.mechanics.engiHireCost && styles.abilityDisabled]} onPress={onHireEngi}><Text style={styles.engiActionText}>HIRE AN ENGI · {run.mechanics.engiHireCost} CREDITS</Text></Pressable>
      </View>
    </ScrollView>
    <View style={styles.marketFooter}><View style={styles.marketStatusRow}><View style={styles.statusDot} /><Text style={styles.footerMarketStatus}>MARKET SECURE · {run.credits.toLocaleString()} RUN CREDITS</Text><CreditSymbol skinId={skinSelections.credit} size={13} /></View><Pressable style={styles.shopExit} onPress={onClose}><Text style={styles.shopActionText}>{openedAtClear ? 'RETURN TO CLEARED SECTOR' : 'RETURN TO ACTIVE STAGE'}</Text></Pressable></View>
  </View></View>;
}

function MerchantFigure({ style, amber = false }: { style: object; amber?: boolean }) {
  const [step] = useState(() => new Animated.Value(0));
  useEffect(() => { const walk = Animated.loop(Animated.sequence([Animated.timing(step, { toValue: 1, duration: 820, useNativeDriver: true }), Animated.timing(step, { toValue: 0, duration: 820, useNativeDriver: true })])); walk.start(); return () => walk.stop(); }, [step]);
  return <Animated.View style={[styles.stationFigure, style, { transform: [{ translateY: step.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }, { rotate: step.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) }] }]}><View style={styles.figureHead} /><View style={[styles.figureBody, amber && styles.figureAmber]} /><View style={[styles.figureBody, styles.figureArm, { transform: [{ rotate: step.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '25deg'] }) }] }]} /></Animated.View>;
}

function BallArtwork({ skin, diameter, left, top, rammed = false, preview = false, modifier, extraModifiers = 0, drifting = false, skimming = false }: { skin: typeof BALL_SKINS[number]; diameter: number; left: number; top: number; rammed?: boolean; preview?: boolean; modifier?: BallModifier; extraModifiers?: number; drifting?: boolean; skimming?: boolean }) {
  const [skinPulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (skin.visualStyle !== 'singularity' && skin.visualStyle !== 'clockwork') return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(skinPulse, { toValue: 1, duration: skin.visualStyle === 'singularity' ? 1500 : 2100, useNativeDriver: true }),
      Animated.timing(skinPulse, { toValue: 0, duration: skin.visualStyle === 'singularity' ? 1500 : 2100, useNativeDriver: true }),
    ]));
    animation.start(); return () => animation.stop();
  }, [skin.visualStyle, skinPulse]);
  const shell = { backgroundColor: skin.base, borderColor: rammed ? '#ffb347' : skin.border, left, top, width: diameter, height: diameter, borderRadius: diameter / 2 };
  const conceptArt = SELECTED_BALL_ART[skin.id];
  if (conceptArt) return <View pointerEvents="none" style={[styles.ball, shell, preview && styles.ballPreview, { backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0, overflow: 'visible' }]}>
    <Animated.Image source={conceptArt} resizeMode="contain" style={{ position: 'absolute', width: diameter, height: diameter, left: 0, top: 0, transform: [{ scale: skinPulse.interpolate({ inputRange: [0, 1], outputRange: skin.visualStyle === 'asteroid' ? [0.99, 1.01] : [0.985, 1.015] }) }] }} />
    <BallModifierArtwork modifier={modifier} drifting={drifting} skimming={skimming} diameter={diameter} skinStyle={skin.visualStyle} />
    <ModifierStackIndicator count={extraModifiers} diameter={diameter} />
  </View>;
  if (skin.visualStyle === 'metal') return <View pointerEvents="none" style={[styles.ball, shell]}>
    <View style={[styles.ballCore, { backgroundColor: skin.core, borderColor: skin.coreBorder }]} />
    <View style={[styles.ballShade, { backgroundColor: skin.id === 'machined-gunmetal' ? '#080d12' : '#263640' }]} />
    <View style={[styles.ballReflection, { backgroundColor: skin.reflection }]} />
    <View style={[styles.ballHighlight, { backgroundColor: skin.highlight, opacity: skin.id === 'brushed-steel' ? 0.68 : 0.95 }]} />
    <View style={[styles.ballGlint, { backgroundColor: skin.glint }]} />
    {skin.id === 'brushed-steel' && <View style={styles.steelGrain} />}
    {skin.id === 'machined-gunmetal' && <View style={styles.gunmetalRing} />}
    <BallModifierArtwork modifier={modifier} drifting={drifting} skimming={skimming} diameter={diameter} />
    <ModifierStackIndicator count={extraModifiers} diameter={diameter} />
  </View>;
  if (skin.visualStyle === 'asteroid') return <View pointerEvents="none" style={[styles.ball, shell, silhouetteStyles.asteroidBall, preview && styles.ballPreview]}>
    <View style={silhouetteStyles.asteroidRidgeOne} /><View style={silhouetteStyles.asteroidRidgeTwo} />
    <View style={silhouetteStyles.asteroidCraterLarge}><View style={silhouetteStyles.asteroidCraterShade} /></View>
    <View style={silhouetteStyles.asteroidCraterSmall} /><View style={silhouetteStyles.asteroidFissureOne} /><View style={silhouetteStyles.asteroidFissureTwo} />
    <View style={silhouetteStyles.asteroidGlint} />
    <BallModifierArtwork modifier={modifier} drifting={drifting} skimming={skimming} diameter={diameter} />
    <ModifierStackIndicator count={extraModifiers} diameter={diameter} />
  </View>;
  if (skin.visualStyle === 'singularity') return <View pointerEvents="none" style={[styles.ball, shell, preview && styles.ballPreview, { overflow: 'visible', borderWidth: 1.5 }]}>
    <View style={{ position: 'absolute', left: '8%', top: '8%', right: '8%', bottom: '8%', borderRadius: 999, backgroundColor: '#020811', borderWidth: Math.max(1, diameter * 0.035), borderColor: '#27617b' }} />
    <Animated.View style={{ position: 'absolute', left: '18%', top: '18%', width: '64%', height: '64%', borderRadius: 999, backgroundColor: '#06314a', borderWidth: 1, borderColor: '#6ee9ff', shadowColor: '#1acfff', shadowOpacity: 0.95, shadowRadius: diameter * 0.22, transform: [{ scale: skinPulse.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1.08] }) }] }} />
    <Animated.Text style={{ position: 'absolute', left: '28%', top: '21%', width: '44%', textAlign: 'center', color: '#e7ffff', fontSize: diameter * 0.53, fontWeight: '900', textShadowColor: '#3ddcff', textShadowRadius: diameter * 0.36, transform: [{ scale: skinPulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.14] }) }] }}>✦</Animated.Text>
    <View style={{ position: 'absolute', left: '-9%', top: '22%', width: '118%', height: '55%', borderWidth: Math.max(1, diameter * 0.035), borderColor: '#a2f5ff', borderRadius: 999, transform: [{ rotate: '-32deg' }] }} />
    <View style={{ position: 'absolute', left: '6%', top: '5%', width: '24%', height: '24%', backgroundColor: '#d6fbff', borderWidth: 1, borderColor: '#ffffff', transform: [{ rotate: '45deg' }] }} />
    <BallModifierArtwork modifier={modifier} drifting={drifting} skimming={skimming} diameter={diameter} skinStyle="singularity" />
    <ModifierStackIndicator count={extraModifiers} diameter={diameter} />
  </View>;
  if (skin.visualStyle === 'clockwork') return <View pointerEvents="none" style={[styles.ball, shell, preview && styles.ballPreview, { overflow: 'visible', borderWidth: 1.5 }]}>
    <View style={{ position: 'absolute', left: '7%', top: '7%', right: '7%', bottom: '7%', borderRadius: 999, borderWidth: Math.max(1.5, diameter * 0.055), borderColor: '#b87932', backgroundColor: '#1b1511' }} />
    <View style={{ position: 'absolute', left: '21%', top: '21%', width: '58%', height: '58%', borderRadius: 999, borderWidth: Math.max(1, diameter * 0.04), borderColor: '#ffda82', backgroundColor: '#b75116', shadowColor: '#ff8a24', shadowOpacity: 1, shadowRadius: diameter * 0.23 }} />
    <Animated.View style={{ position: 'absolute', left: '31%', top: '31%', width: '38%', height: '38%', borderRadius: 999, borderWidth: 1, borderColor: '#fff1b7', backgroundColor: '#ffbc43', shadowColor: '#fff0a3', shadowOpacity: 1, shadowRadius: diameter * 0.28, transform: [{ scale: skinPulse.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1.1] }) }] }} />
    <View style={{ position: 'absolute', left: '4%', top: '47%', width: '92%', height: Math.max(1, diameter * 0.045), backgroundColor: '#e9b75f', transform: [{ rotate: '42deg' }] }} />
    <View style={{ position: 'absolute', left: '4%', top: '47%', width: '92%', height: Math.max(1, diameter * 0.045), backgroundColor: '#9a5c2b', transform: [{ rotate: '-42deg' }] }} />
    <View style={{ position: 'absolute', left: '7%', top: '8%', width: '20%', height: '20%', borderRadius: 999, backgroundColor: '#fff0b9', borderWidth: 1, borderColor: '#fff8d9' }} />
    <BallModifierArtwork modifier={modifier} drifting={drifting} skimming={skimming} diameter={diameter} skinStyle="clockwork" />
    <ModifierStackIndicator count={extraModifiers} diameter={diameter} />
  </View>;
  return <View pointerEvents="none" style={[styles.ball, shell, preview && styles.ballPreview]}>
    {skin.visualStyle === 'plasma' && <>
      <View style={styles.plasmaHalo} /><View style={styles.plasmaCore} />
      <View style={styles.plasmaOrbit} /><View style={styles.plasmaOrbitHighlight} />
      <View style={styles.plasmaGlint} /><View style={styles.plasmaSpark} />
    </>}
    {skin.visualStyle === 'seed' && <>
      <View style={styles.seedOrbShade} /><View style={styles.seedOrbLight} />
      <View style={styles.seedOrbSeam} /><View style={styles.seedOrbVein} />
      <View style={styles.seedOrbLeaf} /><View style={styles.seedOrbGlint} />
    </>}
    {skin.visualStyle === 'crystal' && <>
      <View style={styles.voidFacet} /><View style={styles.voidFacetInner} />
      <View style={styles.voidFacetShade} /><View style={styles.voidFacetGlint} />
    </>}
    <BallModifierArtwork modifier={modifier} drifting={drifting} skimming={skimming} diameter={diameter} />
    <ModifierStackIndicator count={extraModifiers} diameter={diameter} />
  </View>;
}

function ModifierStackIndicator({ count, diameter }: { count: number; diameter: number }) {
  if (count <= 0) return null;
  const size = Math.max(8, diameter * 0.38);
  return <View pointerEvents="none" style={{ position: 'absolute', right: -size * 0.24, top: -size * 0.22, minWidth: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, backgroundColor: '#132537', borderWidth: 1, borderColor: '#c6f7ff', shadowColor: '#42d9ff', shadowOpacity: 0.9, shadowRadius: 5 }}><Text style={{ color: '#f2ffff', fontSize: Math.max(6, size * 0.58), fontWeight: '900' }}>+{count}</Text></View>;
}

function BallModifierArtwork({ modifier, drifting, skimming, diameter, skinStyle }: { modifier?: BallModifier; drifting: boolean; skimming: boolean; diameter: number; skinStyle?: string }) {
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: modifier === 'anchor' ? 1500 : 520, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: modifier === 'phase' ? 380 : 650, useNativeDriver: true }),
    ]));
    animation.start(); return () => animation.stop();
  }, [modifier, pulse]);
  if (skinStyle === 'singularity' || skinStyle === 'clockwork') {
    const isSingularity = skinStyle === 'singularity';
    const accent = isSingularity ? '#a9f7ff' : '#ffe09a';
    const energy = isSingularity ? '#25cfff' : '#ff8b24';
    const shadow = isSingularity ? '#00cfff' : '#ff9a2c';
    if (modifier === 'drifter' && !drifting) return null;
    if (modifier === 'skimmer' && !skimming) return <View pointerEvents="none" style={{ position: 'absolute', right: '5%', top: '24%', width: '12%', height: '52%', borderRadius: 999, backgroundColor: accent }} />;
    return <>
      {(modifier === 'anchor' || modifier === 'splitter' || modifier === 'phase' || (modifier === 'drifter' && drifting)) && <Animated.View pointerEvents="none" style={{ position: 'absolute', left: modifier === 'phase' ? '-24%' : '-15%', top: modifier === 'phase' ? '-24%' : '-15%', width: modifier === 'phase' ? '148%' : '130%', height: modifier === 'phase' ? '148%' : '130%', borderRadius: 999, borderWidth: modifier === 'anchor' ? Math.max(2, diameter * 0.11) : Math.max(2, diameter * 0.07), borderStyle: modifier === 'phase' ? 'dashed' : 'solid', borderColor: accent, backgroundColor: modifier === 'phase' ? `${energy}22` : 'transparent', shadowColor: shadow, shadowOpacity: 1, shadowRadius: diameter * 0.38, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: modifier === 'anchor' ? [0.5, 0.96] : [0.65, 1] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: modifier === 'anchor' ? [0.93, 1.05] : [0.84, 1.12] }) }] }} />}
      {modifier === 'anchor' && <><View pointerEvents="none" style={{ position: 'absolute', left: '13%', top: '13%', width: '74%', height: '74%', borderRadius: 999, borderWidth: Math.max(1, diameter * 0.045), borderColor: accent, backgroundColor: '#030a10aa' }} /><Text pointerEvents="none" style={{ position: 'absolute', color: accent, fontSize: diameter * 0.48, fontWeight: '900', textShadowColor: shadow, textShadowRadius: 10 }}>⬡</Text></>}
      {modifier === 'splitter' && <><Animated.View pointerEvents="none" style={{ position: 'absolute', left: '48%', top: '5%', width: Math.max(2, diameter * 0.08), height: '90%', backgroundColor: accent, shadowColor: shadow, shadowOpacity: 1, shadowRadius: 8, transform: [{ rotate: pulse.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] }) }] }} /><Text pointerEvents="none" style={{ position: 'absolute', color: accent, fontSize: diameter * 0.35, fontWeight: '900', textShadowColor: shadow, textShadowRadius: 9 }}>✦</Text></>}
      {modifier === 'skimmer' && skimming && <><Animated.View pointerEvents="none" style={{ position: 'absolute', left: '-32%', top: '16%', width: '92%', height: Math.max(2, diameter * 0.08), backgroundColor: accent, shadowColor: shadow, shadowOpacity: 1, shadowRadius: 8, transform: [{ translateX: pulse.interpolate({ inputRange: [0, 1], outputRange: [diameter * 0.18, -diameter * 0.2] }) }] }} /><Text pointerEvents="none" style={{ position: 'absolute', left: '6%', top: '6%', color: accent, fontSize: diameter * 0.35, textShadowColor: shadow, textShadowRadius: 8 }}>✧</Text></>}
      {modifier === 'drifter' && drifting && <><View pointerEvents="none" style={{ position: 'absolute', left: '8%', top: '26%', width: '84%', height: '48%', borderTopWidth: 2, borderBottomWidth: 2, borderColor: accent, borderRadius: 999, transform: [{ scaleX: 0.72 }] }} /><Text pointerEvents="none" style={{ position: 'absolute', right: '-14%', top: '-23%', color: accent, fontSize: diameter * 0.44, fontWeight: '900', textShadowColor: shadow, textShadowRadius: 10 }}>{isSingularity ? '↗' : '➤'}</Text></>}
      {modifier === 'phase' && <><Animated.View pointerEvents="none" style={{ position: 'absolute', left: '28%', top: '28%', width: '44%', height: '44%', borderRadius: 999, borderWidth: 1, borderColor: accent, backgroundColor: `${energy}55`, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.85] }), transform: [{ translateX: pulse.interpolate({ inputRange: [0, 1], outputRange: [-diameter * 0.22, diameter * 0.22] }) }] }} /><Text pointerEvents="none" style={{ position: 'absolute', left: '12%', bottom: '-28%', color: accent, fontSize: Math.max(6, diameter * 0.18), fontWeight: '900', letterSpacing: 1, textShadowColor: shadow, textShadowRadius: 7 }}>PHASE</Text></>}
    </>;
  }
  if (modifier === 'anchor') return <><View pointerEvents="none" style={{ position: 'absolute', left: '12%', top: '12%', width: '76%', height: '76%', borderRadius: 999, borderWidth: Math.max(1, diameter * 0.055), borderColor: '#212b32', alignItems: 'center', justifyContent: 'center' }}><View style={{ width: '44%', height: '44%', borderRadius: 999, backgroundColor: '#1e2930', borderWidth: 1, borderColor: '#c6d4d9' }} /><View style={{ position: 'absolute', width: '100%', height: 2, backgroundColor: '#d8e3e7', transform: [{ rotate: '35deg' }] }} /><View style={{ position: 'absolute', width: '100%', height: 2, backgroundColor: '#748792', transform: [{ rotate: '-35deg' }] }} /></View><Animated.View pointerEvents="none" style={{ position: 'absolute', left: '-10%', top: '-10%', width: '120%', height: '120%', borderRadius: 999, borderWidth: 1, borderColor: '#b4c4ca', opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.48] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.12] }) }] }} /></>;
  if (modifier === 'splitter') return <><Animated.View pointerEvents="none" style={{ position: 'absolute', left: '-18%', top: '-18%', width: '136%', height: '136%', borderRadius: 999, borderWidth: Math.max(2, diameter * 0.09), borderColor: '#ff8a35', backgroundColor: '#ff6b2c52', shadowColor: '#ff5d2e', shadowOpacity: 1, shadowRadius: diameter * 0.35, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.1] }) }] }} /><View pointerEvents="none" style={{ position: 'absolute', width: '78%', height: '78%', borderWidth: 2, borderColor: '#fff0cf', transform: [{ rotate: '45deg' }] }} /><Animated.Text pointerEvents="none" style={{ position: 'absolute', color: '#fff7d4', fontSize: diameter * 0.64, lineHeight: diameter * 0.7, fontWeight: '900', textShadowColor: '#ff4b1f', textShadowRadius: 10, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }), transform: [{ rotate: pulse.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }, { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.1] }) }] }}>✣</Animated.Text><Animated.Text pointerEvents="none" style={{ position: 'absolute', top: '-27%', right: '-18%', color: '#fff4c4', fontSize: diameter * 0.34, textShadowColor: '#ff4b1f', textShadowRadius: 8, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }}>⚡</Animated.Text></>;
  if (modifier === 'skimmer') return <><View pointerEvents="none" style={{ position: 'absolute', right: '10%', top: '20%', width: '22%', height: '60%', borderRadius: 99, backgroundColor: '#b6fbff', opacity: 0.9 }} />{skimming && <><Animated.View pointerEvents="none" style={{ position: 'absolute', left: '-30%', top: '24%', width: '80%', height: 2, backgroundColor: '#c5fbff', shadowColor: '#53e9ff', shadowOpacity: 1, shadowRadius: 6, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.95] }), transform: [{ translateX: pulse.interpolate({ inputRange: [0, 1], outputRange: [diameter * 0.12, -diameter * 0.15] }) }] }} /><Animated.Text pointerEvents="none" style={{ position: 'absolute', left: '2%', top: '8%', color: '#c9fbff', fontSize: diameter * 0.36, textShadowColor: '#54eaff', textShadowRadius: 8, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] }), transform: [{ translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [diameter * 0.12, -diameter * 0.16] }) }, { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.1] }) }] }}>✦</Animated.Text><View pointerEvents="none" style={{ position: 'absolute', left: '18%', bottom: '3%', width: '42%', height: 1, backgroundColor: '#73efff', opacity: 0.75 }} /></>}</>;
  if (modifier === 'drifter' && drifting) return <><Animated.View pointerEvents="none" style={{ position: 'absolute', left: '-19%', top: '-19%', width: '138%', height: '138%', borderRadius: 999, borderWidth: Math.max(2.5, diameter * 0.1), borderColor: '#ff3c57', backgroundColor: '#ef284a66', shadowColor: '#ff284c', shadowOpacity: 1, shadowRadius: diameter * 0.42, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }] }} /><View pointerEvents="none" style={{ position: 'absolute', left: '10%', top: '10%', width: '80%', height: '80%', borderRadius: 999, borderWidth: 2, borderColor: '#ffe1d9', transform: [{ scaleX: 0.66 }] }} /><View pointerEvents="none" style={{ position: 'absolute', left: '19%', top: '29%', width: '62%', height: '42%', borderTopWidth: Math.max(2, diameter * 0.065), borderColor: '#ffb09e', borderTopLeftRadius: 999, borderTopRightRadius: 999, transform: [{ rotate: '180deg' }] }} /><Animated.Text pointerEvents="none" style={{ position: 'absolute', right: '-8%', top: '-20%', color: '#fff5da', fontSize: diameter * 0.38, fontWeight: '900', textShadowColor: '#ff214a', textShadowRadius: 12, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }}>ϟ</Animated.Text><Animated.Text pointerEvents="none" style={{ position: 'absolute', left: '32%', top: '31%', color: '#fff2e8', fontSize: diameter * 0.34, fontWeight: '900', opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) }}>N</Animated.Text></>;
  if (modifier === 'phase') return <><Animated.View pointerEvents="none" style={{ position: 'absolute', left: '-22%', top: '-22%', width: '144%', height: '144%', borderRadius: 999, borderWidth: Math.max(3, diameter * 0.1), borderColor: '#adfbff', backgroundColor: '#24dcff70', shadowColor: '#31deff', shadowOpacity: 1, shadowRadius: diameter * 0.45, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) }] }} /><Animated.View pointerEvents="none" style={{ position: 'absolute', left: '4%', top: '4%', width: '92%', height: '92%', borderRadius: 999, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#f3d4ff', transform: [{ rotate: pulse.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '22deg'] }) }] }} /><View pointerEvents="none" style={{ position: 'absolute', left: '13%', top: '20%', width: '74%', height: '18%', backgroundColor: '#f4fbff', opacity: 0.78, transform: [{ rotate: '-31deg' }] }} /><View pointerEvents="none" style={{ position: 'absolute', left: '48%', top: '48%', width: '18%', height: '18%', borderWidth: 2, borderColor: '#fff', backgroundColor: '#b5eaff', transform: [{ rotate: '45deg' }] }} /><Animated.Text pointerEvents="none" style={{ position: 'absolute', left: '12%', bottom: '-18%', color: '#f6eaff', fontSize: Math.max(7, diameter * 0.2), fontWeight: '900', letterSpacing: 1, textShadowColor: '#a54dff', textShadowRadius: 8, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }}>PHASE</Animated.Text></>;
  return null;
}

function WallView({ wall, sx, sy, mutation, elapsedMs }: { wall: Wall; sx: number; sy: number; mutation?: Run['containmentMutations'][number]; elapsedMs: number }) {
  const [chargePulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!wall.chargeWall) return;
    const loop = Animated.loop(Animated.sequence([Animated.timing(chargePulse, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.timing(chargePulse, { toValue: 0, duration: 420, useNativeDriver: true })]));
    loop.start(); return () => loop.stop();
  }, [chargePulse, wall.chargeWall]);
  const vertical = wall.axis === 'vertical';
  const chargeColor = wall.chargeSkinId === 'voltaic-cartridge' ? '#66e9ff' : wall.chargeSkinId === 'singularity-charge' ? '#c39aff' : '#ffad55';
  const vineColor = mutation?.kind === 'life' ? '#ef7e9d' : mutation?.kind === 'speed' ? '#9be9ff' : mutation?.kind === 'ram' || mutation?.kind === 'charge' ? '#ffc36a' : mutation?.kind === 'treasure' || mutation?.kind === 'merchant' ? '#f4d46f' : mutation?.kind === 'credit' ? '#b99aff' : '#98e98e';
  const vineCount = mutation?.style === 'vines' ? Math.min(14, Math.floor(Math.max(0, elapsedMs - (mutation.startedAtMs ?? elapsedMs)) / 900) + 1) : 0;
  return <View pointerEvents="none" style={[styles.wall, wall.active ? styles.activeWall : styles.fixedWall, wall.chargeWall && { backgroundColor: chargeColor, borderColor: '#fff1d2', shadowColor: chargeColor, shadowOpacity: 1, shadowRadius: 11, elevation: 5 }, mutation?.style === 'chromatic' && { backgroundColor: mutation.color, borderColor: '#eaffff', shadowColor: mutation.color, shadowOpacity: 1, shadowRadius: 13, elevation: 6 },
    vertical ? { left: wall.at * sx - 2, top: wall.low * sy, height: (wall.high - wall.low) * sy, width: 4 }
      : { left: wall.low * sx, top: wall.at * sy - 2, width: (wall.high - wall.low) * sx, height: 4 }]}>
      {wall.chargeWall && <><Animated.View style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', backgroundColor: chargeColor, opacity: chargePulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.95] }) }} />{[0, 1, 2, 3, 4].map(index => <View key={index} style={vertical ? { position: 'absolute', left: -2, top: `${8 + index * 19}%`, width: 8, height: 2, backgroundColor: index % 2 ? '#fff3d3' : chargeColor } : { position: 'absolute', left: `${8 + index * 19}%`, top: -2, width: 2, height: 8, backgroundColor: index % 2 ? '#fff3d3' : chargeColor }} />)}</>}
      {mutation?.style === 'vines' && <View style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>{Array.from({ length: vineCount }, (_, index) => {
        const along = `${((index + 0.5) / Math.max(1, vineCount)) * 100}%` as `${number}%`, side = index % 2 ? 1 : -1;
        return <View key={index} style={vertical ? { position: 'absolute', left: side * 5 - 1, top: along, width: 3, height: 9 + (index % 3) * 3, borderLeftWidth: 1.5, borderColor: vineColor, transform: [{ rotate: `${side * 28}deg` }] } : { position: 'absolute', left: along, top: side * 5 - 1, width: 9 + (index % 3) * 3, height: 3, borderTopWidth: 1.5, borderColor: vineColor, transform: [{ rotate: `${side * 28}deg` }] }}><View style={{ position: 'absolute', left: vertical ? side * 3 : 2, top: vertical ? 2 : side * 2, width: 6 + index % 3, height: 4 + index % 2, borderRadius: 99, backgroundColor: index % 2 ? vineColor : '#d9ffab', transform: [{ rotate: `${index * 31}deg` }], shadowColor: vineColor, shadowOpacity: 0.9, shadowRadius: 4 }} /></View>;
      })}</View>}
    </View>;
}

function WallBreakBurst({ event, sx, sy, onDone }: { event: WallBreakEvent; sx: number; sy: number; onDone: () => void }) {
  const [progress] = useState(() => new Animated.Value(0));
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);
  const crack = event.style === 'wall-crack', crumble = event.style === 'wall-crumble';
  const onWall = crack || crumble;
  useEffect(() => { Animated.timing(progress, { toValue: 1, duration: onWall ? 1050 : 680, useNativeDriver: true }).start(() => onDoneRef.current()); }, [progress, onWall]);
  const ember = event.style === 'ember-snap', sonic = event.style === 'sonic-shear';
  const size = sonic ? 154 : ember ? 104 : 124;
  const color = sonic ? '#79f3ff' : ember ? '#ff733e' : crack ? '#ff6f7c' : crumble ? '#e9bd79' : '#aeeaff';
  const accent = sonic ? '#e9ffff' : ember ? '#ffd574' : '#f8fdff';
  const ringScale = progress.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0.15, sonic ? 0.72 : 0.34, sonic ? 1.35 : 1.7] });
  if (onWall && event.axis && event.at !== undefined && event.low !== undefined && event.high !== undefined) {
    const vertical = event.axis === 'vertical';
    const span = Math.max(8, event.high - event.low);
    const length = span * (vertical ? sy : sx);
    const wallOpacity = progress.interpolate({ inputRange: [0, 0.08, 0.75, 1], outputRange: [0, 1, 0.95, 0] });
    const reveal = progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.02, 1, 0.92] });
    return <Animated.View pointerEvents="none" style={[styles.wallLengthBurst, vertical
      ? { left: event.at * sx - 14, top: event.low * sy, width: 28, height: length }
      : { left: event.low * sx, top: event.at * sy - 14, width: length, height: 28 }, { opacity: wallOpacity }]}>
      <Animated.View style={[styles.wallLengthCore, vertical ? { width: 4, height: '100%', transform: [{ scaleY: reveal }] } : { height: 4, width: '100%', transform: [{ scaleX: reveal }] }, { backgroundColor: color, shadowColor: color }]} />
      {crack && Array.from({ length: 13 }, (_, i) => {
        const start = 0.025 + i * 0.031;
        const markOpacity = progress.interpolate({ inputRange: [0, start, start + 0.16, 1], outputRange: [0, 1, 0.85, 0] });
        return <Animated.View key={i} style={[styles.longCrackMark, vertical ? { left: i % 2 ? 0 : 3, top: `${5 + i * 7}%`, width: 22, height: 2 } : { left: `${5 + i * 7}%`, top: i % 2 ? 0 : 3, width: 2, height: 22 }, { backgroundColor: i % 3 ? color : accent, opacity: markOpacity, transform: [{ rotate: `${i % 2 ? -30 : 30}deg` }] }]} />;
      })}
      {crumble && Array.from({ length: 17 }, (_, i) => {
        const along = `${3 + i * 5.8}%` as `${number}%`;
        const distance = 7 + (i % 5) * 4;
        const drift = progress.interpolate({ inputRange: [0, 0.28, 1], outputRange: [0, i % 2 ? distance : -distance, (i % 2 ? 1 : -1) * distance * 1.6] });
        const shrink = progress.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0.45, 1, 0.18] });
        return <Animated.View key={i} style={[styles.longCrumbleChip, vertical ? { top: along, left: 10 + (i % 3) * 3, transform: [{ translateX: drift }, { scale: shrink }, { rotate: `${i * 37}deg` }] } : { left: along, top: 10 + (i % 3) * 3, transform: [{ translateY: drift }, { scale: shrink }, { rotate: `${i * 37}deg` }] }, { backgroundColor: i % 3 ? color : accent, opacity: progress.interpolate({ inputRange: [0, 0.12, 0.65, 1], outputRange: [0, 1, 0.86, 0] }) }]} />;
      })}
    </Animated.View>;
  }
  return <Animated.View pointerEvents="none" style={[styles.breakBurst, { left: event.x * sx - size / 2, top: event.y * sy - size / 2, width: size, height: size, opacity: progress.interpolate({ inputRange: [0, 0.12, 0.72, 1], outputRange: [0, 1, 0.86, 0] }) }]}>
    {onWall ? <Animated.View style={[styles.breakWallTrack, { width: size, backgroundColor: `${color}35`, borderColor: color, transform: [{ rotate: event.axis === 'vertical' ? '90deg' : '0deg' }, { scale: progress.interpolate({ inputRange: [0, 0.1, 0.5, 1], outputRange: [0.12, 1, 0.92, 0.15] }) }] }]}>
      {crack ? <><View style={[styles.breakWallCore, { backgroundColor: color }]} />{Array.from({ length: 9 }, (_, i) => <Animated.View key={i} style={[styles.crackMark, { left: `${8 + i * 10}%`, backgroundColor: i % 2 ? accent : color, transform: [{ rotate: `${i % 2 ? 38 : -38}deg` }, { scaleY: progress.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0.1, 1.2, 0.15] }) }] }]} />)}</>
        : Array.from({ length: 13 }, (_, i) => <Animated.View key={i} style={[styles.crumbleChip, { left: `${4 + i * 7}%`, backgroundColor: i % 3 ? color : accent, opacity: progress.interpolate({ inputRange: [0, 0.12, 0.42, 1], outputRange: [0, 1, 0.95, 0] }), transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, (i % 2 ? 1 : -1) * (12 + i % 5 * 7)] }) }, { rotate: `${i * 41}deg` }, { scale: progress.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0.2, 1.1, 0.25] }) }] }]} />)}
    </Animated.View> : <>
      <Animated.View style={[sonic ? styles.breakSonicRing : styles.breakRing, { borderColor: color, backgroundColor: sonic ? `${color}20` : 'transparent', transform: [{ scale: ringScale }, ...(sonic ? [{ scaleX: 1.45 }] : [])] }]} />
      {Array.from({ length: 10 }, (_, i) => {
        const angle = Math.PI * 2 * i / 10;
        const dx = sonic ? Math.cos(angle) * size * 0.43 : ember ? Math.cos(angle) * size * 0.31 : Math.cos(angle) * size * 0.43;
        const dy = sonic ? Math.sin(angle) * size * 0.16 : ember ? -size * (0.12 + (i % 4) * 0.09) : Math.sin(angle) * size * 0.43;
        const tx = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
        const ty = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
        const glyph = sonic ? '━' : ember ? (i % 3 ? '✦' : '·') : '◆';
        return <Animated.Text key={i} style={[styles.breakShard, { color: i % 2 ? color : accent, fontSize: sonic ? 10 + i % 3 * 2 : ember ? 10 + i % 4 * 2 : 8 + i % 3 * 3, left: size / 2 - 8, top: size / 2 - 8, transform: [{ translateX: tx }, { translateY: ty }, { rotate: `${i * 47}deg` }, { scale: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.25, 1.25, 0.2] }) }] }]}>{glyph}</Animated.Text>;
      })}
    </>}
  </Animated.View>;
}

function TerritoryGainPopup({ event, sx, sy, placement, onDone }: { event: TerritoryGainEvent; sx: number; sy: number; placement: MechanicsSettings['territoryPopupPlacement']; onDone: () => void }) {
  const [progress] = useState(() => new Animated.Value(0));
  const [styleId] = useState(() => ['classic', 'signal-plate', 'prism-pulse'][Math.floor(Math.random() * 3)]);
  const [drift] = useState(() => ({ x: (Math.random() - 0.5) * 46, y: (Math.random() - 0.5) * 36 }));
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);
  useEffect(() => { Animated.timing(progress, { toValue: 1, duration: 1450, useNativeDriver: true }).start(() => onDoneRef.current()); }, [progress]);
  const rise = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -56] });
  const scale = progress.interpolate({ inputRange: [0, 0.14, 0.34, 0.62, 1], outputRange: [0.55, 1.2, 1, 1.07, 0.82] });
  const opacity = progress.interpolate({ inputRange: [0, 0.08, 0.72, 1], outputRange: [0, 1, 0.94, 0] });
  const flash = progress.interpolate({ inputRange: [0, 0.2, 0.34, 0.5, 0.64, 0.78, 1], outputRange: [0, 1, 0, 0.85, 0, 0.65, 0] });
  const x = placement === 'captured-area' ? event.areaX ?? event.x : event.wallX ?? event.x;
  const y = placement === 'captured-area' ? event.areaY ?? event.y : event.wallY ?? event.y;
  const signalPlate = styleId === 'signal-plate';
  const prismPulse = styleId === 'prism-pulse';
  return <Animated.View pointerEvents="none" style={[territoryStyles.territoryPopup, signalPlate && territoryStyles.territorySignalPlate, prismPulse && territoryStyles.territoryPrism, { left: x * sx - 48 + drift.x, top: y * sy - 14 + drift.y, opacity, transform: [{ translateY: rise }, { scale }] }]}>
    {prismPulse && <Animated.View style={[territoryStyles.territoryPrismHalo, { opacity: flash, transform: [{ scale: progress.interpolate({ inputRange: [0, 0.22, 0.55, 1], outputRange: [0.35, 0.8, 1.35, 1.8] }) }] }]} />}
    {signalPlate && <View style={territoryStyles.territorySignalMark} />}
    <Text style={[territoryStyles.territoryText, signalPlate && territoryStyles.territorySignalText, prismPulse && territoryStyles.territoryPrismText]}>+{event.percent.toFixed(2)}%</Text>
    <Animated.Text style={[territoryStyles.territoryFlash, { opacity: flash }]}>+{event.percent.toFixed(2)}%</Animated.Text>
  </Animated.View>;
}

function PictureArtwork({ seed, width, height }: { seed: number; width: number; height: number }) {
  const scene = PICTURE_PALETTES[Math.abs(seed) % PICTURE_PALETTES.length];
  const layout = Math.floor(Math.abs(seed) / 13) % 10;
  const theme = PICTURE_EVENT_THEMES[Math.floor(Math.abs(seed) / 101) % PICTURE_EVENT_THEMES.length];
  const generated = useMemo(() => {
    const random = (index: number) => { const value = Math.sin((seed + 1) * 0.000001 + (index + 1) * 12.9898) * 43758.5453; return value - Math.floor(value); };
    const stars = Array.from({ length: 52 + Math.floor(random(0) * 34) }, (_, i) => ({ key: i, x: random(i * 4 + 1), y: random(i * 4 + 2) * 0.56, size: 0.8 + random(i * 4 + 3) * 2.7, opacity: 0.25 + random(i * 4 + 4) * 0.7 }));
    const peaks = Array.from({ length: 12 + Math.floor(random(1000) * 13) }, (_, i) => ({ key: i, x: random(1100 + i * 5), bottom: 0.08 + random(1101 + i * 5) * 0.25, width: 0.09 + random(1102 + i * 5) * 0.38, height: 0.16 + random(1103 + i * 5) * 0.5, color: scene.accents[Math.floor(random(1104 + i * 5) * scene.accents.length)], opacity: 0.24 + random(1105 + i * 5) * 0.6 }));
    const rings = Array.from({ length: 4 + Math.floor(random(2000) * 8) }, (_, i) => ({ key: i, x: 0.15 + random(2100 + i * 5) * 0.7, y: 0.15 + random(2101 + i * 5) * 0.72, size: 0.07 + random(2102 + i * 5) * 0.55, color: scene.accents[Math.floor(random(2103 + i * 5) * scene.accents.length)], opacity: 0.15 + random(2104 + i * 5) * 0.38, rotate: Math.floor(random(2105 + i * 5) * 90) }));
    const ribbons = Array.from({ length: 7 + Math.floor(random(3000) * 9) }, (_, i) => ({ key: i, y: random(3100 + i * 5), width: 0.35 + random(3101 + i * 5) * 1.1, thickness: 1 + random(3102 + i * 5) * Math.min(16, width * 0.025), angle: -38 + random(3103 + i * 5) * 76, color: scene.accents[Math.floor(random(3104 + i * 5) * scene.accents.length)], opacity: 0.12 + random(3105 + i * 5) * 0.34 }));
    const branches: { key: number; x: number; y: number; length: number; angle: number; depth: number }[] = [];
    const grow = (x: number, y: number, length: number, angle: number, depth: number) => {
      if (depth <= 0) return;
      const x2 = x + Math.cos(angle) * length / Math.max(1, width);
      const y2 = y + Math.sin(angle) * length / Math.max(1, height);
      branches.push({ key: branches.length, x: (x + x2) / 2, y: (y + y2) / 2, length, angle: angle * 180 / Math.PI, depth });
      const key = branches.length;
      const turn = 0.28 + random(4100 + key * 3) * 0.48;
      grow(x2, y2, length * (0.62 + random(4101 + key * 3) * 0.12), angle - turn, depth - 1);
      grow(x2, y2, length * (0.62 + random(4102 + key * 3) * 0.12), angle + turn, depth - 1);
    };
    const roots = 2 + Math.floor(random(5000) * 3);
    for (let i = 0; i < roots; i++) grow(0.16 + 0.68 * (i + random(5001 + i * 4) * 0.5) / roots, 0.55 + random(5002 + i * 4) * 0.38, Math.min(width, height) * (0.09 + random(5003 + i * 4) * 0.07), -Math.PI / 2 + (random(5004 + i * 4) - 0.5) * 0.8, 4 + Math.floor(random(5005 + i * 4) * 2));
    const planets = Array.from({ length: 1 + Math.floor(random(7000) * 3) }, (_, i) => ({ key: i, x: 0.12 + random(7100 + i * 4) * 0.76, y: 0.12 + random(7101 + i * 4) * 0.55, size: 0.035 + random(7102 + i * 4) * 0.14, color: scene.accents[Math.floor(random(7103 + i * 4) * scene.accents.length)], ringed: random(7104 + i * 4) > 0.52 }));
    const trees = Array.from({ length: 24 + Math.floor(random(8000) * 32) }, (_, i) => ({ key: i, x: random(8100 + i * 4), height: 0.07 + random(8101 + i * 4) * 0.31, width: 0.009 + random(8102 + i * 4) * 0.026, color: scene.accents[Math.floor(random(8103 + i * 4) * scene.accents.length)], layer: random(8104 + i * 4) }));
    const auroras = Array.from({ length: 3 + Math.floor(random(9000) * 5) }, (_, i) => ({ key: i, x: random(9100 + i * 4), y: 0.08 + random(9101 + i * 4) * 0.42, width: 0.22 + random(9102 + i * 4) * 0.7, angle: -25 + random(9103 + i * 4) * 50, color: scene.accents[Math.floor(random(9104 + i * 4) * scene.accents.length)] }));
    return { stars, peaks, rings, ribbons, branches, planets, trees, auroras, sun: { x: 0.12 + random(6000) * 0.76, y: 0.12 + random(6001) * 0.47, size: 0.06 + random(6002) * 0.18 } };
  }, [seed, scene.accents, width, height]);
  const isRidge = [0, 3, 8].includes(layout);
  const isFractal = theme.layout === 'fractal' || [1, 4, 9].includes(layout);
  const isRibbon = [2, 5, 6, 9].includes(layout);
  const isSpace = theme.layout === 'astral' || theme.layout === 'forest' || [6, 9].includes(layout);
  const isForest = theme.layout === 'forest' || [7, 8].includes(layout);
  return <View pointerEvents="none" style={[FULL_BOARD_ART_STYLE, { backgroundColor: scene.sky }]}>
    <View style={[styles.pictureHaze, { backgroundColor: scene.haze, left: `${layout % 2 ? 42 : -15}%`, top: `${16 + (layout * 7) % 30}%`, width: '88%', height: '25%', opacity: 0.18 + (layout % 3) * 0.08 }]} />
    {generated.stars.map(star => <View key={`s${star.key}`} style={[styles.pictureStar, { left: `${star.x * 100}%`, top: `${star.y * 100}%`, width: star.size, height: star.size, opacity: star.opacity, backgroundColor: scene.star }]} />)}
    {isSpace && generated.auroras.map(band => <View key={`a${band.key}`} style={{ position: 'absolute', left: `${band.x * 100}%`, top: `${band.y * 100}%`, width: `${band.width * 100}%`, height: Math.max(8, height * 0.045), borderRadius: 999, backgroundColor: band.color, opacity: 0.14, transform: [{ rotate: `${band.angle}deg` }] }} />)}
    {isSpace && generated.planets.map(planet => <View key={`p${planet.key}`} style={{ position: 'absolute', left: `${planet.x * 100}%`, top: `${planet.y * 100}%`, width: `${planet.size * 100}%`, aspectRatio: 1, borderRadius: 999, backgroundColor: planet.color, opacity: 0.76, borderWidth: 1, borderColor: scene.star, transform: [{ rotate: `${planet.key * 23}deg` }] }}>
      {planet.ringed && <View style={{ position: 'absolute', left: '-35%', top: '39%', width: '170%', height: '24%', borderWidth: 1.5, borderColor: scene.sun, borderRadius: 999, transform: [{ rotate: '-18deg' }] }} />}
      <View style={{ position: 'absolute', left: '16%', top: '23%', width: '26%', height: '15%', borderRadius: 999, backgroundColor: scene.haze, opacity: 0.5 }} />
    </View>)}
    <View style={[styles.pictureSun, { left: `${generated.sun.x * 100}%`, top: `${generated.sun.y * 100}%`, width: `${generated.sun.size * 100}%`, borderRadius: layout % 2 ? 12 : 999, aspectRatio: layout % 2 ? 1.7 : 1, backgroundColor: scene.sun, opacity: 0.88, transform: [{ rotate: `${layout * 11}deg` }] }]} />
    {isRidge && generated.peaks.map(peak => <View key={`m${peak.key}`} style={[styles.picturePeak, { left: `${peak.x * 100}%`, bottom: `${peak.bottom * 100}%`, borderLeftWidth: width * peak.width / 2, borderRightWidth: width * peak.width / 2, borderBottomWidth: height * peak.height, borderBottomColor: peak.color, opacity: peak.opacity, transform: [{ rotate: `${(peak.key % 2 ? -1 : 1) * (2 + peak.key % 7)}deg` }] }]} />)}
    {isForest && generated.trees.map(tree => <View key={`t${tree.key}`} style={{ position: 'absolute', left: `${tree.x * 100}%`, bottom: `${tree.layer > 0.5 ? 0 : 0.08}%`, width: `${tree.width * 100}%`, height: `${tree.height * 100}%`, backgroundColor: tree.color, opacity: tree.layer > 0.5 ? 0.68 : 0.42, borderTopLeftRadius: 999, borderTopRightRadius: 999, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }}><View style={{ position: 'absolute', left: '43%', top: '60%', width: '14%', height: '42%', backgroundColor: scene.sky, opacity: 0.45 }} /></View>)}
    {isFractal && generated.branches.map(branch => <View key={`f${branch.key}`} style={[styles.pictureBranch, { left: branch.x * width - branch.length / 2, top: branch.y * height - (1 + branch.depth * 0.42) / 2, width: branch.length, height: 1 + branch.depth * 0.42, backgroundColor: scene.accents[branch.depth % scene.accents.length], opacity: 0.3 + branch.depth * 0.12, transform: [{ rotate: `${branch.angle}deg` }] }]} />)}
    {(isFractal || isRibbon) && generated.rings.map(ring => <View key={`r${ring.key}`} style={[styles.picturePatternRing, { left: `${ring.x * 100}%`, top: `${ring.y * 100}%`, width: `${ring.size * 100}%`, aspectRatio: layout === 4 ? 0.62 : 1, borderColor: ring.color, opacity: ring.opacity, borderWidth: ring.key % 3 === 0 ? 2 : 1, borderRadius: layout === 4 ? 16 : 999, transform: [{ rotate: `${ring.rotate + (layout === 4 ? 45 : 0)}deg` }] }]} />)}
    {isRibbon && generated.ribbons.map(ribbon => <View key={`w${ribbon.key}`} style={[styles.pictureRibbon, { top: `${ribbon.y * 100}%`, height: ribbon.thickness, width: `${ribbon.width * 100}%`, backgroundColor: ribbon.color, opacity: ribbon.opacity, transform: [{ rotate: `${ribbon.angle}deg` }] }]} />)}
    {isRidge && <View style={[styles.pictureLake, { backgroundColor: scene.water, opacity: 0.8 }]} />}
    {generated.rings.slice(0, 8).map(ring => <View key={`g${ring.key}`} style={[styles.pictureWaterGlint, { left: `${ring.x * 100}%`, top: `${ring.y * 100}%`, width: `${Math.max(3, ring.size * 34)}%`, opacity: ring.opacity * 0.68, backgroundColor: ring.color }]} />)}
  </View>;
}

function WaldoArtwork({ seed, width, height, waldoX, waldoY, found }: { seed: number; width: number; height: number; waldoX: number; waldoY: number; found: boolean }) {
  const palette = [['#c7a77d', '#496b75', '#a35142', '#dccb9b'], ['#829b88', '#735677', '#c38b58', '#e0d2aa'], ['#8a7770', '#476e8b', '#bd514e', '#d4c2a0']][Math.abs(seed) % 3];
  const crowd = useMemo(() => {
    const random = (n: number) => { const v = Math.sin((seed + 9) * 0.000013 + (n + 1) * 78.233) * 43758.5453; return v - Math.floor(v); };
    return Array.from({ length: 210 }, (_, i) => {
      let x = 0.015 + random(i * 5) * 0.97, y = 0.04 + random(i * 5 + 1) * 0.92;
      if (Math.hypot(x - waldoX, y - waldoY) < 0.045) x = (x + 0.12 + random(i * 5 + 4) * 0.18) % 0.98;
      return { id: i, x, y, scale: 0.58 + random(i * 5 + 2) * 0.75, tint: palette[Math.floor(random(i * 5 + 3) * palette.length)], tilt: -18 + random(i * 5 + 4) * 36, hat: random(i * 5 + 5) > 0.48 };
    });
  }, [seed, waldoX, waldoY, palette]);
  const unit = Math.max(0.45, Math.min(width, height) / 900);
  return <View pointerEvents="none" style={[FULL_BOARD_ART_STYLE, { backgroundColor: '#8a8066' }]}>
    <View style={styles.waldoCrowdBackdrop} />
    {Array.from({ length: 18 }, (_, i) => <View key={`stall-${i}`} style={[styles.waldoCrowdStall, { left: `${(i * 37 + Math.abs(seed % 19) * 5) % 100}%`, top: `${(i * 53 + 11) % 100}%`, backgroundColor: i % 2 ? '#665b4d' : '#b09369', transform: [{ rotate: `${(i % 5 - 2) * 9}deg` }] }]} />)}
    {crowd.map(person => <View key={person.id} style={{ position: 'absolute', left: `${person.x * 100}%`, top: `${person.y * 100}%`, width: 11 * unit * person.scale, height: 17 * unit * person.scale, alignItems: 'center', transform: [{ rotate: `${person.tilt}deg` }] }}>
      {person.hat && <View style={{ width: 8 * unit * person.scale, height: 3 * unit * person.scale, borderRadius: 3, backgroundColor: person.id % 3 ? '#514738' : '#a05245' }} />}
      <View style={{ width: 5 * unit * person.scale, height: 5 * unit * person.scale, borderRadius: 4, backgroundColor: '#d8b68b', borderWidth: 0.5, borderColor: '#594c3f' }} />
      <View style={{ width: 9 * unit * person.scale, height: 8 * unit * person.scale, borderRadius: 2, backgroundColor: person.tint, borderWidth: 0.5, borderColor: '#403c35' }} />
      <View style={{ position: 'absolute', top: 8 * unit * person.scale, left: 0, width: 2 * unit, height: 7 * unit, backgroundColor: '#544b42', transform: [{ rotate: '-12deg' }] }} />
    </View>)}
    <View style={[styles.waldoPuzzleTarget, { left: `${waldoX * 100}%`, top: `${waldoY * 100}%`, width: 25 * unit, height: 35 * unit, marginLeft: -12.5 * unit, marginTop: -17.5 * unit }]}>
      <View style={styles.waldoPuzzleCap}><View style={styles.waldoPuzzleCapStripe} /></View>
      <View style={styles.waldoPuzzleFace}><View style={styles.waldoPuzzleGlasses} /><View style={styles.waldoPuzzleNose} /></View>
      <View style={styles.waldoPuzzleBody}>{Array.from({ length: 5 }, (_, i) => <View key={i} style={[styles.waldoPuzzleStripe, i % 2 === 0 && styles.waldoPuzzleRedStripe]} />)}</View>
      <View style={styles.waldoPuzzleLegs}><View style={styles.waldoPuzzleLeg} /><View style={styles.waldoPuzzleLeg} /></View>
      {found && <View style={styles.waldoFoundRing}><Text style={styles.waldoFoundGlyph}>✦</Text></View>}
    </View>
  </View>;
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <Pressable onPress={() => onChange(!value)} style={styles.settingRow}><Text style={styles.settingLabel}>{label}</Text><Text style={[styles.toggleValue, value && styles.toggleOn]}>{value ? 'ON' : 'OFF'}</Text></Pressable>;
}

function NumberRow({ label, value, step, min, max, onChange }: { label: string; value: number; step: number; min: number; max: number; onChange: (value: number) => void }) {
  const displayValue = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  const commit = (raw: string) => {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
  };
  return <View style={styles.settingRow}>
    <Text style={styles.settingLabel}>{label}</Text>
    <Pressable style={styles.stepButton} onPress={() => onChange(Math.min(max, Math.max(min, Number((value - step).toFixed(2)))))}><Text style={styles.stepText}>−</Text></Pressable>
    <TextInput key={`${label}-${displayValue}`} defaultValue={displayValue} onEndEditing={event => commit(event.nativeEvent.text)} onSubmitEditing={event => commit(event.nativeEvent.text)} keyboardType="decimal-pad" selectTextOnFocus style={styles.numberInput} />
    <Pressable style={styles.stepButton} onPress={() => onChange(Math.min(max, Math.max(min, Number((value + step).toFixed(2)))))}><Text style={styles.stepText}>+</Text></Pressable>
  </View>;
}

function TuningSliderRow({ label, value, min, max, step, formatValue, onChange }: { label: string; value: number; min: number; max: number; step: number; formatValue?: (value: number) => string; onChange: (value: number) => void }) {
  const [width, setWidth] = useState(1);
  const fraction = Math.max(0, Math.min(1, (value - min) / Math.max(0.0001, max - min)));
  const setFromX = (x: number) => {
    const raw = min + Math.max(0, Math.min(1, (x - 9) / Math.max(1, width - 18))) * (max - min);
    onChange(Math.max(min, Math.min(max, Number((Math.round(raw / step) * step).toFixed(3)))));
  };
  return <View style={styles.sliderRow}>
    <View style={styles.sliderHeading}><Text style={styles.settingLabel}>{label}</Text><Text style={styles.settingValue}>{formatValue ? formatValue(value) : value.toFixed(2)}</Text></View>
    <View accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ min, max, now: value }} onLayout={event => setWidth(event.nativeEvent.layout.width)} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={event => setFromX(event.nativeEvent.locationX)} onResponderMove={event => setFromX(event.nativeEvent.locationX)} style={[styles.sliderHitArea, Platform.OS === 'web' && ({ touchAction: 'none' } as any)]}>
      <View pointerEvents="none" style={styles.sliderTrack}><View style={[styles.sliderFill, { width: `${fraction * 100}%` }]} /></View>
      <View pointerEvents="none" style={[styles.sliderThumb, { left: 9 + fraction * Math.max(0, width - 18) }]} />
    </View>
    <View style={styles.sliderRangeLabels}><Text style={styles.sliderRangeText}>{formatValue ? formatValue(min) : min}</Text><Text style={styles.sliderRangeText}>{formatValue ? formatValue(max) : max}</Text></View>
  </View>;
}

function SettingChoiceRow({ label, value, options, onChange }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (value: string) => void }) {
  return <View style={territoryStyles.choiceSetting}><Text style={styles.settingLabel}>{label}</Text><View style={territoryStyles.choiceSettingOptions}>{options.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: value === option.id }} onPress={() => onChange(option.id)} style={[territoryStyles.choiceSettingOption, value === option.id && territoryStyles.choiceSettingSelected]}><Text style={[territoryStyles.choiceSettingText, value === option.id && territoryStyles.choiceSettingTextSelected]}>{option.label}</Text></Pressable>)}</View></View>;
}

function ChargePickupArt({ skinId, diameter, idle, symbol }: { skinId: string; diameter: number; idle: Animated.Value; symbol: string }) {
  const color = skinId === 'voltaic-cartridge' ? '#58dcff' : skinId === 'singularity-charge' ? '#b58aff' : '#ffad42';
  return <><View pointerEvents="none" style={{ position: 'absolute', left: '16%', top: '20%', width: '68%', height: '60%', borderRadius: skinId === 'breach-cell' ? 5 : 999, borderWidth: 2, borderColor: color, backgroundColor: skinId === 'singularity-charge' ? '#21183e' : skinId === 'voltaic-cartridge' ? '#123b4a' : '#512d21', transform: [{ rotate: skinId === 'breach-cell' ? '45deg' : '0deg' }], shadowColor: color, shadowOpacity: 0.9, shadowRadius: 9 }} /><Animated.Text pointerEvents="none" style={{ position: 'absolute', alignSelf: 'center', top: '27%', color: '#fff5d8', fontSize: diameter * 0.4, fontWeight: '900', textShadowColor: color, textShadowRadius: 8, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.08] }) }] }}>{symbol}</Animated.Text>{[0, 1, 2].map(i => <Animated.Text key={`charge-spark-${i}`} pointerEvents="none" style={{ position: 'absolute', left: `${10 + i * 34}%`, top: i === 1 ? '1%' : '72%', color: i % 2 ? '#fff4cb' : color, fontSize: diameter * 0.2, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.95] }), transform: [{ translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [3, -5] }) }] }}>✦</Animated.Text>)}</>;
}

function PowerOrb({ power, sx, sy, skinId, staticDisplay = false, creditBaseAmount = MECHANICS.creditPickupBaseAmount }: { power: PowerUp; sx: number; sy: number; skinId: string; staticDisplay?: boolean; creditBaseAmount?: number }) {
  const [idle] = useState(() => new Animated.Value(0));
  const [spin] = useState(() => new Animated.Value(0));
  // Continuous loops animate the orb artwork while its physics momentum remains unchanged.
  useEffect(() => {
    if (staticDisplay) return;
    const beat = power.kind === 'exit'
      ? Animated.sequence([Animated.timing(idle, { toValue: 1, duration: 620, useNativeDriver: true }), Animated.timing(idle, { toValue: 0, duration: 780, useNativeDriver: true })])
      : power.kind === 'bubble'
      ? Animated.sequence([Animated.timing(idle, { toValue: 1, duration: 820, useNativeDriver: true }), Animated.timing(idle, { toValue: 0, duration: 1180, useNativeDriver: true })])
      : power.kind === 'merchant' || power.kind === 'treasure' || power.kind === 'credit'
      ? Animated.sequence([Animated.timing(idle, { toValue: 1, duration: 900, useNativeDriver: true }), Animated.timing(idle, { toValue: 0, duration: 900, useNativeDriver: true })])
      : power.kind === 'ram'
      ? Animated.sequence([Animated.timing(idle, { toValue: 1, duration: 360, useNativeDriver: true }), Animated.timing(idle, { toValue: 0, duration: 680, useNativeDriver: true })])
      : power.kind === 'life' && skinId === 'vital-seed'
      ? Animated.sequence([
        Animated.timing(idle, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(idle, { toValue: 0, duration: 620, useNativeDriver: true }),
      ])
      : power.kind === 'life' && skinId === 'phoenix-ember'
      ? Animated.sequence([Animated.timing(idle, { toValue: 1, duration: 260, useNativeDriver: true }), Animated.timing(idle, { toValue: 0.3, duration: 180, useNativeDriver: true }), Animated.timing(idle, { toValue: 0.85, duration: 240, useNativeDriver: true }), Animated.timing(idle, { toValue: 0, duration: 700, useNativeDriver: true })])
      : power.kind === 'life' && skinId === 'moth-lantern'
      ? Animated.sequence([Animated.timing(idle, { toValue: 1, duration: 720, useNativeDriver: true }), Animated.timing(idle, { toValue: 0, duration: 760, useNativeDriver: true })])
      : power.kind === 'waldo'
      ? Animated.sequence([Animated.timing(idle, { toValue: 1, duration: 740, useNativeDriver: true }), Animated.timing(idle, { toValue: 0, duration: 1080, useNativeDriver: true })])
      : power.kind === 'life' && (skinId === 'ruby-prism' || skinId === 'necrotic-heart' || skinId === 'crimson-orb')
      ? Animated.sequence([
        Animated.timing(idle, { toValue: 1, duration: skinId === 'ruby-prism' ? 520 : 880, useNativeDriver: true }),
        Animated.timing(idle, { toValue: 0, duration: skinId === 'ruby-prism' ? 560 : 920, useNativeDriver: true }),
      ])
      : power.kind === 'life'
      ? Animated.sequence([
        Animated.timing(idle, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(idle, { toValue: 0.25, duration: 90, useNativeDriver: true }),
        Animated.timing(idle, { toValue: 0.9, duration: 110, useNativeDriver: true }),
        Animated.timing(idle, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
      : Animated.sequence([
        Animated.timing(idle, { toValue: 1, duration: power.kind === 'speed' ? 340 : 520, useNativeDriver: true }),
        Animated.timing(idle, { toValue: 0, duration: power.kind === 'speed' ? 340 : 520, useNativeDriver: true }),
      ]);
    const pulse = Animated.loop(beat);
    const orbitDuration = power.kind === 'exit' ? 2600 : 650;
    const rotation = Animated.loop(Animated.sequence([
      Animated.timing(spin, { toValue: 1, duration: orbitDuration, useNativeDriver: true }),
      Animated.timing(spin, { toValue: 2, duration: orbitDuration, useNativeDriver: true }),
    ]));
    pulse.start(); if (power.kind === 'exit' || power.kind === 'speed' || (power.kind === 'merchant' && skinId === 'compass-wheel') || (power.kind === 'treasure' && skinId === 'orbital-astrolabe')) rotation.start();
    return () => { pulse.stop(); rotation.stop(); };
  }, [idle, spin, power.kind, skinId, staticDisplay]);
  const rotate = spin.interpolate({ inputRange: [0, 2], outputRange: ['0deg', '720deg'] });
  const pulseOpacity = idle.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  const floatOffset = staticDisplay ? 0 : idle.interpolate({ inputRange: [0, 1], outputRange: [2, -2] });
  const tiltOffset = staticDisplay || power.kind !== 'ram' ? '0deg' : idle.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });
  const merchantSway = staticDisplay || power.kind !== 'merchant' ? 0 : idle.interpolate({ inputRange: [0, 1], outputRange: [-1.5, 1.5] });
  const heartBeat = power.kind === 'life' && skinId === 'vital-seed'
    ? idle.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] })
    : power.kind === 'life' && skinId === 'ruby-prism'
      ? idle.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.08] })
      : power.kind === 'life' && skinId === 'necrotic-heart'
        ? idle.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.04] })
        : power.kind === 'life' && skinId === 'crimson-orb'
          ? idle.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] })
        : power.kind === 'life' && skinId === 'phoenix-ember'
          ? idle.interpolate({ inputRange: [0, 0.3, 0.85, 1], outputRange: [0.94, 1.02, 1.08, 1.1] })
          : power.kind === 'life' && skinId === 'moth-lantern'
            ? idle.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.04] })
        : idle.interpolate({ inputRange: [0, 0.25, 0.9, 1], outputRange: [1, 1.04, 1.01, 1.08] });
  const symbol = power.kind === 'life' ? '♥' : power.kind === 'speed' ? 'ϟ' : power.kind === 'ram' ? '✹' : power.kind === 'charge' ? skinId === 'singularity-charge' ? '◈' : skinId === 'voltaic-cartridge' ? 'ϟ' : '✹' : power.kind === 'merchant' ? skinId === 'merchant-sailing-coin' || skinId === 'skyglass-merchant' ? '⛵' : skinId === 'lantern-gate-token' ? '⌂' : '✥' : power.kind === 'bubble' ? '◉' : power.kind === 'credit' ? skinId === 'ledger-relay' ? '¤' : '¢' : power.kind === 'treasure' && skinId === 'moon-silver' ? '☾' : power.kind === 'treasure' && (skinId === 'suncoin' || skinId === 'radiant-coin') ? '✦' : power.kind === 'treasure' && skinId === 'orbital-astrolabe' ? '◆' : power.kind === 'exit' ? '›' : '▣';
  const radius = powerupCollisionRadius(power.kind);
  const diameter = 2 * radius * Math.min(sx, sy);
  const exitHeading = `${Math.atan2(power.vy, power.vx) + Math.PI / 2}rad`;
  const isSeed = power.kind === 'life' && skinId === 'vital-seed';
  const isGoldCoin = power.kind === 'treasure' && (skinId === 'suncoin' || skinId === 'radiant-coin');
  const isRadiantCoin = power.kind === 'treasure' && skinId === 'radiant-coin';
  const isSilverCoin = power.kind === 'treasure' && skinId === 'moon-silver';
  const isStarReliquary = power.kind === 'treasure' && skinId === 'star-reliquary';
  const isOrbitalAstrolabe = power.kind === 'treasure' && skinId === 'orbital-astrolabe';
  const isCompass = power.kind === 'merchant' && skinId === 'compass-wheel';
  const isNewMerchant = power.kind === 'merchant' && ['star-chart-astrolabe', 'skyglass-merchant', 'lantern-gate-token'].includes(skinId);
  const isBubble = power.kind === 'bubble';
  const isNewBubble = power.kind === 'bubble' && ['aurora-crown', 'tiny-glassworld', 'inkblot-comet'].includes(skinId);
  const isCrimsonOrb = power.kind === 'life' && skinId === 'crimson-orb';
  const isPhoenixEmber = power.kind === 'life' && skinId === 'phoenix-ember';
  const isMothLantern = power.kind === 'life' && skinId === 'moth-lantern';
  const isWaldoPickup = power.kind === 'waldo';
  const isEngiEgg = power.kind === 'engi-egg';
  const isCreditPickup = power.kind === 'credit';
  const isNewCredit = isCreditPickup && ['solar-mint-seal', 'circuit-ledger-relay', 'void-prism-scrip'].includes(skinId);
  const conceptArt = SELECTED_PICKUP_ART[skinId];
  const isPhaseChest = !!power.phaseChest;
  const usesFreeformSilhouette = PICKUP_SKINS[power.kind].some(option => option.id === skinId && option.silhouette === 'freeform');
  const bubbleSkinStyle = skinId === 'aurora-crown' || skinId === 'tiny-glassworld' || skinId === 'inkblot-comet' ? { backgroundColor: 'transparent', borderColor: 'transparent', shadowOpacity: 0, elevation: 0 } : skinId === 'prismatic-soap' ? styles.bubblePrismatic : skinId === 'nebula-cell' ? styles.bubbleNebula : styles.bubbleCosmic;
  const coinGlint = idle.interpolate({ inputRange: [0, 1], outputRange: [-diameter * 0.45, diameter * 0.45] });
  const heartSkin = power.kind === 'life' ? skinId : '';
  const ramStyle = power.kind === 'ram' ? skinId === 'wedge-core' ? styles.ramWedgeSkin : skinId === 'flanged-mauler' ? styles.ramMaulerSkin : skinId === 'shock-piston' ? styles.ramPistonSkin : skinId === 'cinder-meteor' ? styles.ramMeteorSkin : skinId === 'mantis-breacher' || skinId === 'meteor-maul' ? { backgroundColor: 'transparent', borderColor: 'transparent', shadowOpacity: 0, elevation: 0 } : styles.ramPickup : null;
  return <Animated.View pointerEvents="none" style={[styles.power, power.kind === 'exit' ? styles.exitBeacon : power.kind === 'speed' ? styles.speedPickup : power.kind === 'ram' ? ramStyle : power.kind === 'charge' ? { backgroundColor: 'transparent', borderColor: 'transparent', shadowOpacity: 0, elevation: 0 } : power.kind === 'bubble' ? bubbleSkinStyle : power.kind === 'credit' ? isNewCredit ? silhouetteStyles.freeformRoot : skinId === 'ledger-relay' ? styles.creditLedgerPickup : styles.creditMintPickup : power.kind === 'treasure' ? isPhaseChest ? specialFxStyles.phaseChestPickup : isStarReliquary || isOrbitalAstrolabe ? { backgroundColor: 'transparent', borderColor: 'transparent', shadowOpacity: 0, elevation: 0 } : isGoldCoin ? styles.treasureGoldCoin : isSilverCoin ? styles.treasureSilverCoin : styles.treasurePickup : power.kind === 'merchant' ? isNewMerchant ? { backgroundColor: 'transparent', borderColor: 'transparent', shadowOpacity: 0, elevation: 0 } : isCompass ? styles.merchantCompass : styles.merchantSailingCoin : isSeed ? styles.seedPickup : isCrimsonOrb ? styles.crimsonLifeOrb : isWaldoPickup ? skinId === 'finder-badge' ? { backgroundColor: 'transparent', borderColor: 'transparent', shadowOpacity: 0, elevation: 0 } : styles.waldoPickup : isEngiEgg ? styles.engiEggPickup : null, usesFreeformSilhouette ? silhouetteStyles.freeformRoot : null, { left: power.x * sx - diameter / 2, top: power.y * sy - diameter / 2, width: diameter, height: diameter, borderRadius: usesFreeformSilhouette ? 0 : diameter / 2, borderWidth: usesFreeformSilhouette ? 0 : power.kind === 'life' && (!isSeed || isCrimsonOrb) ? 0 : isBubble ? 2 : 1.25, opacity: staticDisplay ? 1 : Animated.multiply(pulseOpacity, power.despawnOpacity ?? 1), transform: [{ rotate: staticDisplay || power.kind !== 'speed' ? '0deg' : rotate }, { translateY: floatOffset }, { translateX: merchantSway }, { rotate: tiltOffset }] }]}>
    {conceptArt ? <>
      <Animated.Image source={conceptArt} resizeMode="contain" style={{ position: 'absolute', width: diameter, height: diameter, left: 0, top: 0, transform: [{ rotate: power.kind === 'exit' ? exitHeading : '0deg' }, { scale: power.kind === 'life' ? heartBeat : idle.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1.01] }) }] }} />
      {power.kind === 'speed' && <Animated.View style={{ position: 'absolute', left: '-11%', top: '43%', width: '46%', height: '13%', borderRadius: 999, backgroundColor: '#e9fdff', shadowColor: '#55eaff', shadowOpacity: 1, shadowRadius: 10, opacity: idle.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.18, 0.9, 0.3] }), transform: [{ scaleX: idle.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1.12] }) }] }} />}
      {power.kind === 'charge' && <ChargePickupArt skinId={skinId} diameter={diameter} idle={idle} symbol={symbol} />}{power.kind === 'ram' && [0, 1, 2].map(i => <Animated.Text key={`ram-spark-${i}`} style={{ position: 'absolute', left: `${14 + i * 31}%`, top: i === 1 ? '5%' : '72%', color: i % 2 ? '#fff0b3' : '#ffad48', fontSize: diameter * 0.22, opacity: idle.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.14, 0.95, 0.22] }), transform: [{ translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [3 + i, -5 - i] }) }, { scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.1] }) }] }}>✦</Animated.Text>)}
      {(power.kind === 'treasure' || power.kind === 'merchant') && <Animated.View style={{ position: 'absolute', left: '-6%', top: '7%', width: '112%', height: '86%', borderRadius: diameter * 0.24, borderWidth: 1, borderColor: power.kind === 'treasure' ? '#ffe7a2' : '#a8fff4', opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.45] }), transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }] }} />}
      {power.kind === 'life' && <Animated.Text style={{ position: 'absolute', right: '-5%', top: '-9%', color: skinId === 'phoenix-ember' ? '#ffe69b' : '#fff0b8', fontSize: diameter * 0.27, opacity: idle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.24, 0.95, 0.32] }), transform: [{ translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [3, -4] }) }] }}>✦</Animated.Text>}
      {power.kind === 'bubble' && <>
        <Animated.View style={{ position: 'absolute', left: '14%', top: '16%', width: '20%', height: '8%', borderRadius: 999, backgroundColor: '#fff', opacity: idle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.34, 0.94, 0.4] }), transform: [{ rotate: '-34deg' }] }} />
        {[0, 1, 2].map(i => <Animated.View key={`bubble-drift-${i}`} style={{ position: 'absolute', left: `${18 + i * 24}%`, top: `${20 + (i % 2) * 48}%`, width: diameter * 0.08, height: diameter * 0.08, borderRadius: 999, borderWidth: 1, borderColor: '#eaffff', backgroundColor: '#baf7ff88', opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.85] }), transform: [{ translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [3 + i, -4 - i] }) }] }} />)}
      </>}
      {power.kind === 'waldo' && <Animated.View style={{ position: 'absolute', right: '3%', bottom: '5%', width: '38%', height: '38%', borderRadius: 999, borderWidth: 2, borderColor: '#ffe2a1', backgroundColor: '#71e4ff44', shadowColor: '#eafcff', shadowOpacity: 0.9, shadowRadius: 8, opacity: idle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.55] }), transform: [{ rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '14deg'] }) }, { scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }] }} />}
      {power.kind === 'engi-egg' && <Animated.View style={{ position: 'absolute', left: '37%', top: '34%', width: '26%', height: '26%', borderRadius: 999, borderWidth: 1, borderColor: '#d9fff0', backgroundColor: '#b9ffe277', shadowColor: '#8affe0', shadowOpacity: 1, shadowRadius: 8, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0.95] }), transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.76, 1.16] }) }] }} />}
      {power.kind === 'credit' && <Text style={{ position: 'absolute', alignSelf: 'center', bottom: '-10%', color: skinId === 'void-prism-scrip' ? '#f0ddff' : skinId === 'circuit-ledger-relay' ? '#d8fffa' : '#fff1b2', fontSize: Math.max(8, diameter * 0.24), fontWeight: '900', textShadowColor: skinId === 'void-prism-scrip' ? '#a77aff' : '#e6ad4a', textShadowRadius: 6 }}>+{creditBaseAmount + (power.bounceCredits ?? 0)}</Text>}
    </> : <>
    {power.kind === 'exit' && skinId === 'sector-beacon' && <>
      <Animated.View style={[styles.exitBeaconOuter, { opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.82] }), transform: [{ rotate }] }]} />
      <Animated.View pointerEvents="none" style={[styles.exitShipArt, { transform: [{ rotate: exitHeading }, { translateY: floatOffset }] }]}>
        <Animated.View style={[styles.exitShipEngine, { opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }), transform: [{ scaleY: idle.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.2] }) }] }]} />
        <View style={styles.exitShipWingLeft} /><View style={styles.exitShipWingRight} />
        <View style={styles.exitShipWingInsetLeft} /><View style={styles.exitShipWingInsetRight} />
        <View style={styles.exitShipHull}><View style={styles.exitShipSpine} /><View style={styles.exitShipCanopy} /><View style={styles.exitShipCanopyGlint} /><View style={styles.exitShipNose} /></View>
        <Animated.View style={[styles.exitShipSignal, { opacity: idle.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.15, 0.95, 0.25] }) }]} />
      </Animated.View>
      <Animated.View style={[styles.exitBeaconSpark, { opacity: pulseOpacity, transform: [{ translateX: coinGlint }] }]} />
    </>}
    {power.kind === 'exit' && skinId === 'courier-skiff' && <Animated.View pointerEvents="none" style={[styles.exitShipArt, { transform: [{ rotate: exitHeading }, { translateY: floatOffset }] }]}>
      <Animated.View style={{ position: 'absolute', left: '-3%', top: '43%', width: '28%', height: '16%', borderRadius: 999, backgroundColor: '#7ffff1', shadowColor: '#44e9ff', shadowOpacity: 1, shadowRadius: 11, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }), transform: [{ scaleX: idle.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.4] }) }] }} />
      <View style={{ position: 'absolute', left: '4%', top: '31%', width: '48%', height: '39%', borderWidth: 2, borderColor: '#e1ffff', backgroundColor: '#1b6171', transform: [{ skewX: '-28deg' }, { rotate: '-10deg' }], shadowColor: '#4ee8ed', shadowOpacity: 0.8, shadowRadius: 6 }} />
      <View style={{ position: 'absolute', right: '4%', top: '31%', width: '48%', height: '39%', borderWidth: 2, borderColor: '#bdeaff', backgroundColor: '#26566a', transform: [{ skewX: '28deg' }, { rotate: '10deg' }], shadowColor: '#6adfff', shadowOpacity: 0.8, shadowRadius: 6 }} />
      <View style={{ position: 'absolute', left: '19%', top: '35%', width: '62%', height: '32%', borderWidth: 2, borderColor: '#f2ffff', borderRadius: 8, backgroundColor: '#9edbdc', transform: [{ skewX: '-18deg' }] }} />
      <View style={{ position: 'absolute', left: '39%', top: '39%', width: '28%', height: '21%', borderWidth: 1.5, borderColor: '#c8ffff', borderRadius: 999, backgroundColor: '#0d3959' }} />
      <View style={{ position: 'absolute', right: '12%', top: '44%', width: '17%', height: '12%', backgroundColor: '#f7ffff', borderRadius: 999, shadowColor: '#a5ffff', shadowOpacity: 1, shadowRadius: 8 }} />
      {[0, 1].map(i => <Animated.View key={`skiff-fin-light-${i}`} style={{ position: 'absolute', left: i ? '72%' : '13%', top: i ? '27%' : '69%', width: '13%', height: 3, borderRadius: 99, backgroundColor: '#fff2b2', opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.22, 1] }), transform: [{ scaleX: idle.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1.15] }) }] }} />)}
    </Animated.View>}
    {power.kind === 'exit' && skinId === 'folded-transit' && <Animated.View pointerEvents="none" style={[styles.exitShipArt, { transform: [{ rotate: exitHeading }, { translateY: floatOffset }] }]}>
      <Animated.View style={{ position: 'absolute', left: '11%', top: '12%', width: '78%', height: '76%', borderWidth: 2, borderColor: '#b6a8ff', borderRadius: 999, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0.9] }), transform: [{ rotate: '-25deg' }, { scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.08] }) }], shadowColor: '#74dfff', shadowOpacity: 0.8, shadowRadius: 8 }} />
      <View style={{ position: 'absolute', left: '24%', top: '30%', width: '52%', height: '40%', borderWidth: 2, borderColor: '#c8faff', backgroundColor: '#183d5d', transform: [{ skewX: '-24deg' }] }} />
      <View style={{ position: 'absolute', left: '35%', top: '35%', width: '31%', height: '30%', borderWidth: 2, borderColor: '#a6f8ff', backgroundColor: '#4e91c3', transform: [{ rotate: '45deg' }] }} />
      <Animated.View style={{ position: 'absolute', left: '43%', top: '41%', width: '15%', height: '18%', borderRadius: 999, backgroundColor: '#f4ffff', shadowColor: '#8ceaff', shadowOpacity: 1, shadowRadius: 10, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.2] }) }] }} />
      {[0, 1, 2].map(i => <Animated.View key={`fold-layer-${i}`} style={{ position: 'absolute', left: `${21 + i * 21}%`, top: `${25 + i * 13}%`, width: '18%', height: '50%', borderWidth: 1.5, borderColor: i % 2 ? '#d9cfff' : '#a6f8ff', backgroundColor: i % 2 ? '#754ec455' : '#37accb55', transform: [{ skewX: '-22deg' }, { translateX: idle.interpolate({ inputRange: [0, 1], outputRange: [-2, 2] }) }] }} />)}
      <Animated.Text style={{ position: 'absolute', right: '9%', top: '7%', color: '#fff', fontSize: diameter * 0.22, opacity: idle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 1, 0.2] }), textShadowColor: '#9ceeff', textShadowRadius: 8 }}>✦</Animated.Text>
    </Animated.View>}
    {power.kind === 'speed' && <Animated.View style={[styles.speedElectric, skinId === 'ion-comet' ? styles.speedComet : skinId === 'phase-ribbon' ? silhouetteStyles.phaseRibbonFrame : skinId === 'pulse-engine' ? silhouetteStyles.engineFrame : skinId === 'solar-dash' ? styles.speedSolar : skinId === 'thunder-lattice' || skinId === 'ion-skiff' ? { width: '100%', height: '100%', borderWidth: 0, borderColor: 'transparent', backgroundColor: 'transparent' } : null, { opacity: pulseOpacity }]}>
      {skinId === 'ion-comet' && <><View style={styles.cometTail} /><View style={styles.cometCore} /></>}
      {skinId === 'phase-ribbon' && <><View style={silhouetteStyles.ribbonTail} /><View style={silhouetteStyles.ribbonLoop} /><View style={silhouetteStyles.ribbonLoopInner} /><View style={silhouetteStyles.ribbonWake} /></>}
      {skinId === 'pulse-engine' && <><View style={silhouetteStyles.engineFinTop} /><View style={silhouetteStyles.engineFinBottom} /><View style={silhouetteStyles.engineChamber}><View style={styles.engineRing}><View style={styles.engineHub} /></View></View><View style={styles.engineTick} /></>}
      {skinId === 'solar-dash' && <><View style={styles.solarSlash} /><View style={styles.solarCore} /></>}
      {skinId === 'thunder-lattice' && <>
        <View style={{ position: 'absolute', left: '4%', top: '39%', width: '92%', height: '22%', backgroundColor: '#2f185f', borderWidth: 1, borderColor: '#d8c5ff', transform: [{ skewY: '-27deg' }], shadowColor: '#9e79ff', shadowOpacity: 1, shadowRadius: 9 }} />
        <View style={{ position: 'absolute', left: '13%', top: '15%', width: '13%', height: '30%', backgroundColor: '#c4a9ff', transform: [{ rotate: '28deg' }, { skewY: '-18deg' }] }} />
        <View style={{ position: 'absolute', left: '37%', top: '10%', width: '10%', height: '29%', backgroundColor: '#f0eaff', transform: [{ rotate: '24deg' }, { skewY: '-18deg' }] }} />
        <View style={{ position: 'absolute', right: '16%', bottom: '13%', width: '12%', height: '31%', backgroundColor: '#8c63f1', transform: [{ rotate: '28deg' }, { skewY: '-18deg' }] }} />
        <Animated.Text style={{ position: 'absolute', alignSelf: 'center', color: '#ffffff', fontSize: diameter * 0.46, fontWeight: '900', textShadowColor: '#b28aff', textShadowRadius: 12, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.12] }) }] }}>ϟ</Animated.Text>
      </>}
      {skinId === 'ion-skiff' && <>
        <Animated.View style={{ position: 'absolute', left: '-7%', top: '39%', width: '32%', height: '22%', borderRadius: 999, backgroundColor: '#56e8ff', shadowColor: '#4fe7ff', shadowOpacity: 1, shadowRadius: 9, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }), transform: [{ scaleX: idle.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1.45] }) }] }} />
        <View style={{ position: 'absolute', left: '22%', top: '31%', width: '60%', height: '38%', borderRadius: 5, borderWidth: 2, borderColor: '#e3ffff', backgroundColor: '#126079', transform: [{ skewX: '-22deg' }], shadowColor: '#25dfff', shadowOpacity: 0.9, shadowRadius: 8 }} />
        <View style={{ position: 'absolute', left: '43%', top: '15%', width: '36%', height: '20%', borderRadius: 3, backgroundColor: '#38c7e9', borderWidth: 1, borderColor: '#c8fbff', transform: [{ rotate: '22deg' }, { skewX: '-25deg' }] }} />
        <View style={{ position: 'absolute', left: '43%', bottom: '15%', width: '36%', height: '20%', borderRadius: 3, backgroundColor: '#1684ad', borderWidth: 1, borderColor: '#9ff5ff', transform: [{ rotate: '-22deg' }, { skewX: '-25deg' }] }} />
        <View style={{ position: 'absolute', right: '14%', top: '43%', width: '15%', height: '14%', borderRadius: 999, backgroundColor: '#f2ffff', shadowColor: '#42dfff', shadowOpacity: 1, shadowRadius: 8 }} />
      </>}
      {skinId === 'electric-star' && <Text style={[styles.electricArc, { fontSize: diameter * 0.44 }]}>ϟ</Text>}
    </Animated.View>}
    {power.kind === 'life' && isSeed && <><Animated.View style={[styles.seedAura, { opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.3] }), transform: [{ scale: heartBeat }] }]} /><View style={[styles.seedLeaf, styles.seedLeafLeft]} /><View style={[styles.seedLeaf, styles.seedLeafRight]} /><View style={[styles.seedVein, styles.seedVeinLeft]} /><View style={[styles.seedVein, styles.seedVeinRight]} /><Animated.View style={[styles.seedOrbit, { transform: [{ rotate }] }]}><View style={[styles.seedDot, styles.seedDotTop]} /><View style={[styles.seedDot, styles.seedDotRight]} /><View style={[styles.seedDot, styles.seedDotBottom]} /><View style={[styles.seedDot, styles.seedDotLeft]} /></Animated.View></>}
    {isCrimsonOrb && <><Animated.View style={[styles.crimsonOrbAura, { opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.72] }), transform: [{ scale: heartBeat }] }]} /><View style={styles.crimsonOrbRim} /><View style={styles.crimsonOrbInnerRim} /><Animated.View style={[styles.crimsonOrbCore, { transform: [{ scale: heartBeat }] }]} /><View style={styles.crimsonOrbGlint} /><Animated.View style={[styles.crimsonOrbOrbit, { transform: [{ rotate }] }]}><View style={styles.crimsonOrbSpark} /><View style={styles.crimsonOrbSparkTwo} /></Animated.View><View style={styles.crimsonOrbPupil} /></>}
    {isWaldoPickup && skinId === 'striped-scout' && <WaldoScoutFigure size={diameter} idle={idle} />}
    {isWaldoPickup && skinId === 'finder-badge' && <><Animated.View style={{ position: 'absolute', left: '7%', top: '7%', width: '86%', height: '86%', borderWidth: 3, borderColor: '#d4a756', borderRadius: 999, backgroundColor: '#173443', shadowColor: '#ffdc7b', shadowOpacity: 0.9, shadowRadius: 8, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }] }} /><View style={{ position: 'absolute', left: '24%', top: '22%', width: '50%', height: '56%', borderRadius: 999, borderWidth: 2, borderColor: '#f5e4be', backgroundColor: '#b8404b' }} /><View style={{ position: 'absolute', left: '29%', top: '33%', width: '42%', height: '34%', borderRadius: 999, borderWidth: 1, borderColor: '#f7dfbb', backgroundColor: '#dfbd91' }} /><View style={{ position: 'absolute', left: '27%', top: '48%', width: '46%', height: '21%', backgroundColor: '#f1eadb', borderWidth: 1, borderColor: '#bd4050' }} /><View style={{ position: 'absolute', left: '27%', top: '52%', width: '46%', height: '5%', backgroundColor: '#bd4050' }} /><View style={{ position: 'absolute', left: '27%', top: '62%', width: '46%', height: '5%', backgroundColor: '#bd4050' }} /><View style={{ position: 'absolute', left: '37%', top: '41%', width: '10%', height: '10%', borderRadius: 999, borderWidth: 1.5, borderColor: '#17191b' }} /><View style={{ position: 'absolute', right: '37%', top: '41%', width: '10%', height: '10%', borderRadius: 999, borderWidth: 1.5, borderColor: '#17191b' }} /><View style={{ position: 'absolute', left: '34%', top: '24%', width: '32%', height: '13%', borderRadius: 5, backgroundColor: '#c63d4a', borderWidth: 1, borderColor: '#fff0d1' }} /><Animated.View style={{ position: 'absolute', right: '7%', bottom: '9%', width: '36%', height: '36%', borderRadius: 999, borderWidth: 2, borderColor: '#fff0b2', backgroundColor: '#70d7df66', opacity: idle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.42, 1, 0.52] }), transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.15] }) }], shadowColor: '#d8ffff', shadowOpacity: 0.9, shadowRadius: 7 }} /></>}
    {isEngiEgg && skinId === 'engi-cocoon' && <>
      <Animated.View style={{ position: 'absolute', left: '18%', top: '18%', width: '64%', height: '64%', borderRadius: 999, borderWidth: 2, borderColor: '#a7ffcf', backgroundColor: '#13342d', opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0.78] }), transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) }], shadowColor: '#70ffc3', shadowOpacity: 1, shadowRadius: 8 }} />
      {[0, 1, 2, 3].map(i => <Animated.View key={`engi-petal-${i}`} style={{ position: 'absolute', left: '39%', top: '5%', width: '22%', height: '48%', borderWidth: 1.5, borderColor: '#e2d7b5', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, backgroundColor: '#756d57', transform: [{ rotate: `${i * 90}deg` }, { translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [0, -diameter * 0.025] }) }] }} />)}
      <Animated.View style={{ position: 'absolute', left: '31%', top: '31%', width: '38%', height: '38%', borderRadius: 999, borderWidth: 2, borderColor: '#c8fff0', backgroundColor: '#58dcae', shadowColor: '#7bffd0', shadowOpacity: 1, shadowRadius: 10, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.76, 1.06] }) }] }} />
      <Text style={{ position: 'absolute', alignSelf: 'center', top: '41%', color: '#effff0', fontSize: diameter * 0.19 }}>⌘</Text>
    </>}
    {isEngiEgg && skinId === 'engi-seed-pod' && <>
      <Animated.View style={{ position: 'absolute', left: '21%', top: '8%', width: '58%', height: '83%', borderWidth: 2, borderColor: '#dbc49a', borderRadius: 13, backgroundColor: '#74684c', transform: [{ rotate: '45deg' }, { scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }) }], shadowColor: '#65dfc4', shadowOpacity: 0.9, shadowRadius: 7 }} />
      <View style={{ position: 'absolute', left: '24%', top: '22%', width: '52%', height: '56%', borderWidth: 2, borderColor: '#303d38', borderRadius: 9, backgroundColor: '#454d42', transform: [{ rotate: '-8deg' }] }} />
      <Animated.View style={{ position: 'absolute', left: '31%', top: '31%', width: '38%', height: '38%', borderRadius: 999, borderWidth: 3, borderColor: '#caffef', backgroundColor: '#24b99d', shadowColor: '#78ffe6', shadowOpacity: 1, shadowRadius: 10, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1.16] }) }] }} />
      <View style={{ position: 'absolute', left: '44%', top: '44%', width: '12%', height: '12%', borderRadius: 999, backgroundColor: '#eafff9' }} />
      <View style={{ position: 'absolute', left: '43%', top: '9%', width: '14%', height: '17%', borderTopWidth: 3, borderColor: '#d8c393' }} /><View style={{ position: 'absolute', left: '43%', bottom: '9%', width: '14%', height: '17%', borderBottomWidth: 3, borderColor: '#d8c393' }} />
    </>}
    {isEngiEgg && skinId === 'engi-scarab-capsule' && <>
      <Animated.View style={{ position: 'absolute', left: '16%', top: '14%', width: '68%', height: '70%', borderWidth: 2, borderColor: '#d9c79e', borderRadius: 15, backgroundColor: '#554a39', transform: [{ rotate: '-18deg' }, { scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }], shadowColor: '#5be2b7', shadowOpacity: 0.85, shadowRadius: 8 }} />
      <Animated.View style={{ position: 'absolute', left: '39%', top: '19%', width: '24%', height: '61%', borderLeftWidth: 3, borderRightWidth: 3, borderColor: '#80f4c7', borderRadius: 999, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }), shadowColor: '#73ffd0', shadowOpacity: 1, shadowRadius: 8 }} />
      {[0, 1, 2, 3].map(i => <Animated.View key={`scarab-leg-${i}`} style={{ position: 'absolute', left: i < 2 ? '8%' : '78%', top: `${29 + (i % 2) * 34}%`, width: '18%', height: '14%', borderWidth: 2, borderColor: '#d7c69c', borderRadius: 7, backgroundColor: '#625643', transform: [{ rotate: i % 2 ? '24deg' : '-24deg' }, { translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [1, -2] }) }] }} />)}
      <Animated.View style={{ position: 'absolute', left: '36%', top: '38%', width: '28%', height: '28%', borderRadius: 999, borderWidth: 2, borderColor: '#defff3', backgroundColor: '#53d5aa', shadowColor: '#66ffd0', shadowOpacity: 1, shadowRadius: 9, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.1] }) }] }} />
    </>}
    {power.kind === 'ram' && skinId === 'wedge-core' && <View style={[styles.wedgeArt, { width: diameter * 0.76, height: diameter * 0.62, borderTopWidth: diameter * 0.31, borderBottomWidth: diameter * 0.31, borderLeftWidth: diameter * 0.76 }]}><View style={styles.wedgeCoreMark} /></View>}
    {power.kind === 'ram' && skinId === 'flanged-mauler' && <><Text style={[styles.maulerSpokes, { fontSize: diameter * 1.48 }]}>✹</Text><View style={silhouetteStyles.maulerProngTop} /><View style={silhouetteStyles.maulerProngBottom} /><View style={silhouetteStyles.maulerProngLeft} /><View style={silhouetteStyles.maulerProngRight} /><View style={styles.maulerHub}><View style={styles.maulerPin} /></View></>}
    {power.kind === 'ram' && skinId === 'shock-piston' && <View style={[styles.pistonArt, { width: diameter * 1.5, height: diameter * 0.62 }]}><View style={styles.pistonBase} /><View style={styles.pistonSpring}><View style={styles.pistonCoil} /><View style={styles.pistonCoil} /><View style={styles.pistonCoil} /></View><View style={styles.pistonRod} /><View style={styles.pistonHead} /></View>}
    {power.kind === 'ram' && skinId === 'cinder-meteor' && <><Text style={[styles.meteorMark, { fontSize: diameter * 0.92 }]}>✹</Text><View style={styles.meteorCrackOne} /><View style={styles.meteorCrackTwo} /></>}
    {power.kind === 'ram' && skinId === 'mantis-breacher' && <>
      <Animated.View style={{ position: 'absolute', left: '13%', top: '12%', width: '74%', height: '34%', borderWidth: 2, borderColor: '#ffcf75', borderBottomWidth: 4, borderRadius: 8, backgroundColor: '#71431e', transform: [{ rotate: '-10deg' }, { translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [2, -3] }) }], shadowColor: '#ff9c32', shadowOpacity: 0.8, shadowRadius: 6 }} />
      <Animated.View style={{ position: 'absolute', left: '13%', bottom: '12%', width: '74%', height: '34%', borderWidth: 2, borderColor: '#e9b45f', borderTopWidth: 4, borderRadius: 8, backgroundColor: '#49301d', transform: [{ rotate: '10deg' }, { translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [-2, 3] }) }], shadowColor: '#ff8c25', shadowOpacity: 0.8, shadowRadius: 6 }} />
      <Animated.View style={{ position: 'absolute', left: '34%', top: '34%', width: '32%', height: '32%', borderRadius: 999, borderWidth: 2, borderColor: '#fff0b1', backgroundColor: '#ff9a2f', shadowColor: '#ffb33d', shadowOpacity: 1, shadowRadius: diameter * 0.22, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.12] }) }] }} />
      <Text style={{ position: 'absolute', left: '7%', top: '33%', color: '#ffe9b5', fontSize: diameter * 0.18 }}>⚙</Text><Text style={{ position: 'absolute', right: '7%', top: '33%', color: '#ffe9b5', fontSize: diameter * 0.18 }}>⚙</Text>
    </>}
    {power.kind === 'ram' && skinId === 'meteor-maul' && <>
      <View style={{ position: 'absolute', left: '12%', top: '17%', width: '75%', height: '68%', borderRadius: diameter * 0.36, borderWidth: 2, borderColor: '#b75b37', backgroundColor: '#372723', transform: [{ rotate: '28deg' }], shadowColor: '#f36a35', shadowOpacity: 0.85, shadowRadius: diameter * 0.14 }} />
      <View style={{ position: 'absolute', left: '23%', top: '22%', width: '48%', height: '48%', borderRadius: 4, borderWidth: 2, borderColor: '#ff9b43', backgroundColor: '#a53e20', transform: [{ rotate: '45deg' }] }} />
      <Animated.View style={{ position: 'absolute', left: '36%', top: '35%', width: '29%', height: '29%', borderRadius: 999, backgroundColor: '#ffc457', shadowColor: '#ff5d29', shadowOpacity: 1, shadowRadius: diameter * 0.24, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.62, 1] }), transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.76, 1.14] }) }] }} />
      <View style={{ position: 'absolute', left: '23%', top: '19%', width: '4%', height: '37%', borderRadius: 99, backgroundColor: '#ffd17b', transform: [{ rotate: '35deg' }] }} /><View style={{ position: 'absolute', right: '25%', bottom: '15%', width: '4%', height: '34%', borderRadius: 99, backgroundColor: '#ef6935', transform: [{ rotate: '35deg' }] }} />
      <Animated.Text style={{ position: 'absolute', right: '-4%', top: '4%', color: '#ff9a46', fontSize: diameter * 0.25, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }), textShadowColor: '#ff682f', textShadowRadius: 7 }}>✦</Animated.Text>
    </>}
    {power.kind === 'ram' && skinId === 'spark-orb' && <Animated.View pointerEvents="none" style={[styles.ramSparks, { opacity: pulseOpacity, transform: [{ rotate }] }]}><Text style={[styles.ramSpark, styles.sparkOne, { fontSize: diameter * 0.32 }]}>✦</Text><Text style={[styles.ramSpark, styles.sparkTwo, { fontSize: diameter * 0.28 }]}>✦</Text><Text style={[styles.ramSpark, styles.sparkThree, { fontSize: diameter * 0.38 }]}>·</Text></Animated.View>}
    {power.kind === 'treasure' && isPhaseChest ? <><Animated.View style={[specialFxStyles.phaseChestAura, { opacity: pulseOpacity, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.12] }) }] }]} /><View style={specialFxStyles.phaseChestLid} /><View style={specialFxStyles.phaseChestBody}><Text style={specialFxStyles.phaseChestGlyph}>✦</Text></View><View style={specialFxStyles.phaseChestLock} /><Animated.View style={[specialFxStyles.phaseChestGlint, { opacity: idle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.95, 0.15] }) }]} /></> : power.kind === 'treasure' && isSilverCoin ? <><View style={silhouetteStyles.moonRelic}><Text style={silhouetteStyles.moonGlyph}>☾</Text><View style={silhouetteStyles.moonGem} /><View style={silhouetteStyles.moonTail} /><View style={silhouetteStyles.moonEtching} /></View><Animated.View style={[styles.coinGlint, { opacity: pulseOpacity, transform: [{ translateX: coinGlint }, { rotate: '-28deg' }] }]} /></> : power.kind === 'treasure' && isGoldCoin ? <><View style={styles.coinFace}><View style={styles.coinInset}><Text style={[styles.coinGlyph, { color: '#fff1a6', fontSize: diameter * 0.48 }]}>{symbol}</Text></View></View><Animated.View style={[styles.coinGlint, { opacity: pulseOpacity, transform: [{ translateX: coinGlint }, { rotate: '-28deg' }] }]} /></> : power.kind === 'treasure' && !isStarReliquary && !isOrbitalAstrolabe ? <><Animated.View style={[styles.treasureShine, { opacity: pulseOpacity }]} /><View style={styles.treasureChest}><View style={styles.chestLid} /><View style={styles.chestBody} /><View style={[styles.chestLock, { width: diameter * 0.12, height: diameter * 0.17 }]} /></View></> : null}
    {isRadiantCoin && <>
      <Animated.View style={{ position: 'absolute', left: '6%', top: '6%', width: '88%', height: '88%', borderWidth: 1.5, borderColor: '#fff1a3', borderRadius: 999, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.88] }), transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.1] }) }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '-5%', color: '#fff8ce', fontSize: diameter * 0.27, textShadowColor: '#ffdb60', textShadowRadius: 9, opacity: idle.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.12, 1, 0.2] }), transform: [{ translateX: coinGlint }] }}>✦</Animated.Text>
      <Animated.View style={{ position: 'absolute', right: '9%', bottom: '5%', width: '14%', height: '14%', borderRadius: 999, backgroundColor: '#fffbe4', opacity: pulseOpacity, shadowColor: '#fff1a6', shadowOpacity: 1, shadowRadius: 8 }} />
    </>}    {isStarReliquary && <>
      <View style={{ position: 'absolute', left: '18%', top: '31%', width: '64%', height: '48%', borderWidth: 2, borderColor: '#f4c868', borderRadius: 5, backgroundColor: '#392d30', shadowColor: '#ffbd56', shadowOpacity: 0.8, shadowRadius: 8 }} />
      <View style={{ position: 'absolute', left: '23%', top: '49%', width: '54%', height: '26%', borderWidth: 1, borderColor: '#ffe9a0', backgroundColor: '#a96827' }} />
      <Animated.View style={{ position: 'absolute', left: '18%', top: '22%', width: '64%', height: '24%', borderWidth: 2, borderColor: '#fff0b2', borderRadius: 7, backgroundColor: '#6f5438', transform: [{ rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '5deg'] }) }, { translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [2, -5] }) }], shadowColor: '#ffd46b', shadowOpacity: 0.9, shadowRadius: 7 }} />
      <Animated.View style={{ position: 'absolute', left: '40%', top: '34%', width: '20%', height: '24%', borderRadius: 999, backgroundColor: '#fff3ae', opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.34, 1] }), shadowColor: '#ffc64d', shadowOpacity: 1, shadowRadius: 11, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.32] }) }] }} />
      <Animated.Text style={{ position: 'absolute', right: '8%', top: '11%', color: '#fff3b0', fontSize: diameter * 0.28, textShadowColor: '#ffd45a', textShadowRadius: 8, opacity: idle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1, 0.25] }) }}>✦</Animated.Text>
    </>}
    {isOrbitalAstrolabe && <>
      <Animated.View style={{ position: 'absolute', left: '12%', top: '33%', width: '76%', height: '34%', borderWidth: 2, borderColor: '#f2d38e', borderRadius: 999, transform: [{ rotate: rotate }, { scaleY: 0.72 }], shadowColor: '#9de9f4', shadowOpacity: 0.9, shadowRadius: 6 }} />
      <Animated.View style={{ position: 'absolute', left: '17%', top: '27%', width: '66%', height: '46%', borderWidth: 1.5, borderColor: '#76dce7', borderRadius: 999, transform: [{ rotate: spin.interpolate({ inputRange: [0, 2], outputRange: ['-55deg', '665deg'] }) }, { scaleX: 0.68 }], shadowColor: '#85edff', shadowOpacity: 0.8, shadowRadius: 7 }} />
      <View style={{ position: 'absolute', left: '38%', top: '38%', width: '24%', height: '24%', borderWidth: 2, borderColor: '#fff4c2', backgroundColor: '#edb94d', transform: [{ rotate: '45deg' }], shadowColor: '#ffe78b', shadowOpacity: 1, shadowRadius: 11 }} />
      <Animated.View style={{ position: 'absolute', left: '73%', top: '26%', width: '12%', height: '12%', borderRadius: 999, backgroundColor: '#d9fbff', opacity: pulseOpacity, shadowColor: '#9cefff', shadowOpacity: 1, shadowRadius: 8, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.35] }) }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '4%', color: '#ffeab0', fontSize: diameter * 0.2, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }}>✦</Animated.Text>
    </>}    {power.kind === 'merchant' && !isNewMerchant && <><View style={styles.merchantCoinRim} />{isCompass ? <><Animated.View style={[styles.merchantCompassAura, { opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.62] }), transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.18] }) }] }]} /><View style={styles.compassInner} /><Animated.View style={[styles.compassNeedle, { transform: [{ rotate }] }]}><View style={styles.compassNorth} /><View style={styles.compassSouth} /></Animated.View><View style={styles.compassWheel}><View style={[styles.wheelSpoke, styles.wheelSpokeNorth]} /><View style={[styles.wheelSpoke, styles.wheelSpokeSouth]} /><View style={[styles.wheelSpoke, styles.wheelSpokeEast]} /><View style={[styles.wheelSpoke, styles.wheelSpokeWest]} /><View style={styles.wheelHub} /></View><Animated.Text style={[styles.compassBearing, { opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.95] }), transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.12] }) }] }]}>✦</Animated.Text><Text style={styles.compassMark}>N</Text></> : <><View style={styles.sailingCoinInset} /><Animated.Text style={[styles.sailingShip, { transform: [{ translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [1.5, -1.5] }) }, { rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) }] }]}>{symbol}</Animated.Text><Animated.View style={[styles.sailingWake, { opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.86] }), transform: [{ scaleX: idle.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1.15] }) }] }]} /><View style={styles.sailingWave}><View style={styles.waveLeft} /><View style={styles.waveRight} /></View><Animated.View style={[styles.merchantCoinGlint, { opacity: idle.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.12, 0.95, 0.18] }), transform: [{ translateX: coinGlint }, { rotate: '-25deg' }] }]} /></>}</>}
    {power.kind === 'merchant' && skinId === 'star-chart-astrolabe' && <>
      <Animated.View style={{ position: 'absolute', left: '10%', top: '17%', width: '80%', height: '63%', borderWidth: 2, borderColor: '#bd9c59', borderRadius: 999, backgroundColor: '#102c31', shadowColor: '#3ed8c8', shadowOpacity: 0.8, shadowRadius: 8, transform: [{ rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) }] }} />
      <View style={{ position: 'absolute', left: '17%', top: '25%', width: '66%', height: '48%', borderWidth: 1, borderColor: '#e6cc83', borderRadius: 999 }} />
      <Animated.View style={{ position: 'absolute', left: '47%', top: '28%', width: '6%', height: '45%', backgroundColor: '#f1d681', transform: [{ rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '18deg'] }) }] }} />
      <View style={{ position: 'absolute', alignSelf: 'center', top: '42%', width: '18%', height: '18%', borderRadius: 999, borderWidth: 2, borderColor: '#fff3b5', backgroundColor: '#36bba9' }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '4%', color: '#b4fff0', fontSize: diameter * 0.23, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }), transform: [{ rotate }] }}>✦</Animated.Text>
      <View style={{ position: 'absolute', left: '14%', bottom: '2%', width: '18%', height: '18%', borderWidth: 1, borderColor: '#ddb96b', backgroundColor: '#325b53', transform: [{ rotate: '45deg' }] }} />
    </>}
    {power.kind === 'merchant' && skinId === 'skyglass-merchant' && <>
      <View style={{ position: 'absolute', left: '13%', top: '12%', width: '74%', height: '76%', borderWidth: 2, borderColor: '#b8f4f1', borderRadius: 12, backgroundColor: '#17424c99', transform: [{ rotate: '-8deg' }], shadowColor: '#62e4e8', shadowOpacity: 0.9, shadowRadius: 9 }} />
      <View style={{ position: 'absolute', left: '26%', top: '54%', width: '50%', height: '18%', backgroundColor: '#a7773f', borderWidth: 1, borderColor: '#ffdf98', transform: [{ skewX: '-18deg' }] }} />
      <View style={{ position: 'absolute', left: '35%', top: '27%', width: '20%', height: '29%', backgroundColor: '#fff0c5', borderWidth: 1, borderColor: '#f9d37d', transform: [{ skewX: '-12deg' }] }} />
      <View style={{ position: 'absolute', right: '31%', top: '31%', width: '16%', height: '25%', backgroundColor: '#4bc7c4', borderWidth: 1, borderColor: '#d8ffff', transform: [{ skewX: '13deg' }] }} />
      <View style={{ position: 'absolute', left: '44%', top: '15%', width: 2, height: '49%', backgroundColor: '#ffeab1' }} />
      <Animated.View style={{ position: 'absolute', left: '19%', bottom: '12%', width: '64%', height: 3, backgroundColor: '#8df4f0', opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.85] }), transform: [{ scaleX: idle.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.2] }) }] }} />
    </>}
    {power.kind === 'merchant' && skinId === 'lantern-gate-token' && <>
      <View style={{ position: 'absolute', left: '20%', top: '14%', width: '60%', height: '71%', borderWidth: 5, borderBottomWidth: 2, borderColor: '#246e68', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#071c25', shadowColor: '#26c7a8', shadowOpacity: 0.9, shadowRadius: 8 }} />
      <Animated.View style={{ position: 'absolute', left: '36%', top: '24%', width: '28%', height: '44%', borderWidth: 1, borderColor: '#c9f0c7', borderRadius: 999, backgroundColor: '#164943', opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.48, 0.95] }), transform: [{ scaleX: idle.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.08] }) }] }} />
      <Animated.View style={{ position: 'absolute', alignSelf: 'center', top: '34%', width: '17%', height: '23%', borderRadius: 4, borderWidth: 2, borderColor: '#ffe39a', backgroundColor: '#dc9a3f', shadowColor: '#ffbd54', shadowOpacity: 1, shadowRadius: 10, transform: [{ translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [-2, 3] }) }] }} />
      <View style={{ position: 'absolute', left: '9%', top: '46%', width: '15%', height: '21%', borderWidth: 1, borderColor: '#f0d58b', backgroundColor: '#987346', transform: [{ rotate: '-14deg' }] }} />
      <View style={{ position: 'absolute', right: '9%', top: '50%', width: '15%', height: '21%', borderWidth: 1, borderColor: '#f0d58b', backgroundColor: '#987346', transform: [{ rotate: '14deg' }] }} />
    </>}
    {isCreditPickup && skinId === 'solar-mint-seal' && <>
      <Animated.View style={{ position: 'absolute', left: '8%', top: '8%', width: '84%', height: '84%', borderRadius: 999, borderWidth: 3, borderColor: '#ffdb75', backgroundColor: '#87551f', shadowColor: '#ffb83e', shadowOpacity: 0.95, shadowRadius: 10, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }] }} />
      <View style={{ position: 'absolute', left: '19%', top: '19%', width: '62%', height: '62%', borderRadius: 999, borderWidth: 2, borderColor: '#ffe9a3', backgroundColor: '#c68127', alignItems: 'center', justifyContent: 'center' }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '24%', color: '#fff2bd', fontSize: diameter * 0.5, fontWeight: '900', textShadowColor: '#ffd34d', textShadowRadius: 8, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.12] }) }] }}>☼</Animated.Text>
      {[0, 1, 2, 3].map(i => <Animated.View key={`mint-ray-${i}`} style={{ position: 'absolute', left: '47%', top: '7%', width: '6%', height: '16%', borderRadius: 99, backgroundColor: '#fff1ae', opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.95] }), transform: [{ rotate: `${i * 90}deg` }, { translateY: -diameter * 0.03 }] }} />)}
      <Animated.View style={[styles.creditScripGlint, { opacity: idle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.08, 0.8, 0.12] }), transform: [{ translateX: coinGlint }, { rotate: '35deg' }] }]} />
      <Text style={styles.creditPickupValue}>+{creditBaseAmount + (power.bounceCredits ?? 0)}</Text>
    </>}
    {isCreditPickup && skinId === 'circuit-ledger-relay' && <>
      <Animated.View style={{ position: 'absolute', left: '9%', top: '22%', width: '82%', height: '56%', borderWidth: 2, borderColor: '#b9fff5', borderRadius: 6, backgroundColor: '#103c46', transform: [{ rotate: '-12deg' }], shadowColor: '#3de9d6', shadowOpacity: 0.95, shadowRadius: 8 }} />
      <View style={{ position: 'absolute', left: '15%', top: '31%', width: '70%', height: '38%', borderWidth: 1, borderColor: '#36b9b7', borderRadius: 4, transform: [{ rotate: '-12deg' }] }} />
      {[0, 1, 2].map(i => <Animated.View key={`ledger-trace-${i}`} style={{ position: 'absolute', left: `${18 + i * 18}%`, top: `${31 + (i % 2) * 30}%`, width: '18%', height: 2, backgroundColor: '#aafff0', opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }), transform: [{ translateX: idle.interpolate({ inputRange: [0, 1], outputRange: [-diameter * 0.04, diameter * 0.06] }) }] }} />)}
      <Animated.View style={{ position: 'absolute', left: '41%', top: '34%', width: '20%', height: '32%', borderRadius: 3, borderWidth: 1, borderColor: '#e1ffff', backgroundColor: '#45dacb', shadowColor: '#7afff0', shadowOpacity: 1, shadowRadius: 8, transform: [{ translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [diameter * 0.06, -diameter * 0.06] }) }] }} />
      <Text style={[styles.creditPickupValue, { color: '#d8fffa', textShadowColor: '#28d9cb' }]}>+{creditBaseAmount + (power.bounceCredits ?? 0)}</Text>
    </>}
    {isCreditPickup && skinId === 'void-prism-scrip' && <>
      <Animated.View style={{ position: 'absolute', left: '20%', top: '8%', width: '60%', height: '82%', borderWidth: 2, borderColor: '#e2caff', backgroundColor: '#422b75', transform: [{ rotate: '45deg' }, { scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.04] }) }], shadowColor: '#a77aff', shadowOpacity: 1, shadowRadius: 10 }} />
      <View style={{ position: 'absolute', left: '30%', top: '20%', width: '40%', height: '56%', borderWidth: 1, borderColor: '#f4eaff', backgroundColor: '#7854bd', transform: [{ rotate: '45deg' }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '27%', color: '#fff3ff', fontSize: diameter * 0.42, fontWeight: '900', textShadowColor: '#c9a1ff', textShadowRadius: 10, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }) }}>◆</Animated.Text>
      {[0, 1, 2].map(i => <Animated.Text key={`prism-mote-${i}`} style={{ position: 'absolute', left: `${17 + i * 27}%`, top: i % 2 ? '12%' : '72%', color: '#f4eaff', fontSize: diameter * 0.18, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.9] }), transform: [{ translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [3, -4] }) }] }}>◇</Animated.Text>)}
      <Text style={[styles.creditPickupValue, { color: '#f0ddff', textShadowColor: '#a77aff' }]}>+{creditBaseAmount + (power.bounceCredits ?? 0)}</Text>
    </>}
    {isCreditPickup && !isNewCredit && (skinId === 'ledger-relay'
      ? <><View style={styles.creditRelayFrame} /><Animated.View style={[styles.creditRelayCore, { opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.62, 1] }), transform: [{ translateX: idle.interpolate({ inputRange: [0, 1], outputRange: [-diameter * 0.08, diameter * 0.08] }) }] }]} /><View style={styles.creditRelayLineOne} /><View style={styles.creditRelayLineTwo} /><Animated.Text style={[styles.creditPickupValue, styles.creditRelayValue, { opacity: pulseOpacity }]}>+{creditBaseAmount + (power.bounceCredits ?? 0)}</Animated.Text><Animated.View style={[styles.creditRelayGlint, { transform: [{ translateX: coinGlint }] }]} /></>
      : <><View style={styles.creditScripOuter}><View style={styles.creditScripInner}><Text style={styles.creditScripGlyph}>¢</Text></View></View><View style={styles.creditScripNotchTop} /><View style={styles.creditScripNotchBottom} /><Animated.View style={[styles.creditScripGlint, { opacity: idle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.16, 0.9, 0.18] }), transform: [{ translateX: coinGlint }] }]} /><Text style={styles.creditPickupValue}>+{creditBaseAmount + (power.bounceCredits ?? 0)}</Text></>)}
    {isBubble && !isNewBubble && (skinId === 'nebula-cell' ? <><View style={silhouetteStyles.nebulaWisp} /><View style={silhouetteStyles.nebulaCloud}><View style={silhouetteStyles.nebulaCore} /><View style={silhouetteStyles.nebulaDust} /></View><View style={silhouetteStyles.nebulaLoop} /><Animated.View style={[styles.bubbleSheen, { opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.7] }), transform: [{ translateX: idle.interpolate({ inputRange: [0, 1], outputRange: [-diameter * 0.22, diameter * 0.22] }) }, { scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.06] }) }] }]} /><View style={silhouetteStyles.nebulaStar}><Text style={styles.bubbleSparkleText}>✦</Text></View></> : <><View style={styles.bubbleInner}><View style={styles.bubbleNebulaSwirl} /><Text style={styles.bubbleStar}>{skinId === 'prismatic-soap' ? '✧' : '✶'}</Text></View><Animated.View style={[styles.bubbleSheen, { opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.36, 0.95] }), transform: [{ translateX: idle.interpolate({ inputRange: [0, 1], outputRange: [-diameter * 0.22, diameter * 0.22] }) }, { scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.06] }) }] }]} /><View style={styles.bubbleHighlight} /><View style={styles.bubbleSparkle}><Text style={styles.bubbleSparkleText}>✧</Text></View></>)}
    {isBubble && skinId === 'aurora-crown' && <>
      <Animated.View style={{ position: 'absolute', left: '6%', top: '20%', width: '88%', height: '63%', borderWidth: 2, borderColor: '#b4fff7', borderRadius: 999, backgroundColor: '#16437166', shadowColor: '#72fff0', shadowOpacity: 0.9, shadowRadius: 9, transform: [{ rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] }) }, { scaleY: idle.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }] }} />
      <Animated.View style={{ position: 'absolute', left: '0%', top: '25%', width: '100%', height: '48%', borderTopWidth: 3, borderBottomWidth: 2, borderColor: '#b58cff', borderRadius: 999, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] }), transform: [{ rotate: '28deg' }, { scaleX: idle.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.12] }) }] }} />
      <Animated.View style={{ position: 'absolute', left: '31%', top: '34%', width: '38%', height: '34%', borderRadius: 999, borderWidth: 1, borderColor: '#f2d9ff', backgroundColor: '#7c69eaa8', opacity: pulseOpacity, shadowColor: '#a7fff8', shadowOpacity: 1, shadowRadius: 10, transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] }) }] }} />
      {[[15, 20], [76, 19], [12, 68], [80, 72]].map(([left, top], i) => <Animated.View key={`aurora-drop-${i}`} style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, width: '10%', height: '10%', borderRadius: 999, backgroundColor: i % 2 ? '#c7a8ff' : '#aaffef', opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }), transform: [{ translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [2, -3] }) }] }} />)}
    </>}
    {isBubble && skinId === 'tiny-glassworld' && <>
      <View style={{ position: 'absolute', left: '9%', top: '9%', width: '82%', height: '82%', borderWidth: 2, borderColor: '#d8ffff', borderRadius: 999, backgroundColor: '#68d7ff2b', shadowColor: '#86e9ff', shadowOpacity: 0.8, shadowRadius: 9 }} />
      <View style={{ position: 'absolute', left: '17%', top: '61%', width: '66%', height: '13%', borderRadius: 999, backgroundColor: '#c9f3ff', opacity: 0.72 }} />
      <Animated.View style={{ position: 'absolute', left: '24%', top: '26%', width: '52%', height: '52%', borderWidth: 2, borderColor: '#f2ddad', borderRadius: 999, backgroundColor: '#5b8ad9', transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.04] }) }] }} />
      <Animated.View style={{ position: 'absolute', left: '12%', top: '38%', width: '76%', height: '24%', borderWidth: 2, borderColor: '#ffe6a5', borderRadius: 999, transform: [{ rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] }) }, { scaleY: 0.7 }] }} />
      <View style={{ position: 'absolute', left: '40%', top: '41%', width: '20%', height: '18%', borderRadius: 999, backgroundColor: '#c7f6ff' }} />
      <Animated.View style={{ position: 'absolute', left: '19%', top: '20%', width: '13%', height: '13%', borderRadius: 999, backgroundColor: '#ffffff', opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.95] }) }} />
      <Animated.View style={{ position: 'absolute', right: '13%', top: '27%', width: '8%', height: '8%', borderRadius: 999, backgroundColor: '#fff3c9', transform: [{ translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [2, -3] }) }] }} />
    </>}
    {isBubble && skinId === 'inkblot-comet' && <>
      <Animated.View style={{ position: 'absolute', left: '28%', top: '25%', width: '55%', height: '56%', borderRadius: 999, backgroundColor: '#241538', borderWidth: 2, borderColor: '#b490ff', shadowColor: '#a77aff', shadowOpacity: 0.95, shadowRadius: 10, transform: [{ rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] }) }, { scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }) }] }} />
      <Animated.View style={{ position: 'absolute', left: '-10%', top: '40%', width: '57%', height: '25%', borderTopWidth: 4, borderBottomWidth: 3, borderColor: '#76eaff', borderRadius: 999, backgroundColor: '#2368a755', transform: [{ skewX: '-24deg' }, { scaleX: idle.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.18] }) }] }} />
      <Animated.View style={{ position: 'absolute', left: '38%', top: '36%', width: '29%', height: '29%', borderRadius: 999, backgroundColor: '#090d21', borderWidth: 1, borderColor: '#e3c7ff', shadowColor: '#4fdcff', shadowOpacity: 1, shadowRadius: 8, opacity: pulseOpacity }} />
      <View style={{ position: 'absolute', left: '68%', top: '19%', width: '14%', height: '14%', borderRadius: 999, backgroundColor: '#a6f8ff', borderWidth: 1, borderColor: '#f5ffff' }} />
      <Animated.View style={{ position: 'absolute', left: '83%', top: '71%', width: '9%', height: '9%', borderRadius: 999, backgroundColor: '#efc0ff', transform: [{ translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [2, -3] }) }] }} />
    </>}
    {isPhoenixEmber && <>
      <Animated.View style={{ position: 'absolute', left: '-9%', top: '13%', width: '53%', height: '49%', borderTopLeftRadius: diameter, borderTopRightRadius: diameter * 0.3, borderWidth: Math.max(1, diameter * 0.055), borderColor: '#ffc15f', backgroundColor: '#c83727', transform: [{ rotate: '-28deg' }, { scaleY: idle.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.12] }) }], shadowColor: '#ff5b28', shadowOpacity: 0.9, shadowRadius: diameter * 0.15 }} />
      <Animated.View style={{ position: 'absolute', right: '-9%', top: '13%', width: '53%', height: '49%', borderTopLeftRadius: diameter * 0.3, borderTopRightRadius: diameter, borderWidth: Math.max(1, diameter * 0.055), borderColor: '#ffc15f', backgroundColor: '#c83727', transform: [{ rotate: '28deg' }, { scaleY: idle.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.12] }) }], shadowColor: '#ff5b28', shadowOpacity: 0.9, shadowRadius: diameter * 0.15 }} />
      <Animated.View style={{ position: 'absolute', left: '22%', top: '22%', width: '56%', height: '58%', borderRadius: diameter * 0.5, backgroundColor: '#8d1525', borderWidth: 2, borderColor: '#ffe4a1', alignItems: 'center', justifyContent: 'center', shadowColor: '#ff5b28', shadowOpacity: 1, shadowRadius: diameter * 0.25, transform: [{ scale: heartBeat }] }}><Text style={{ color: '#fff2c1', fontSize: diameter * 0.47, fontWeight: '900', textShadowColor: '#ffb33e', textShadowRadius: 8 }}>♥</Text></Animated.View>
      <Animated.Text style={{ position: 'absolute', left: '20%', bottom: '-9%', color: '#ffe198', fontSize: diameter * 0.25, textShadowColor: '#ff5427', textShadowRadius: 7, opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }}>✧　✧　✧</Animated.Text>
    </>}
    {isMothLantern && <>
      <Animated.View style={{ position: 'absolute', left: '-4%', top: '5%', width: '46%', height: '47%', borderTopLeftRadius: diameter, borderTopRightRadius: diameter * 0.5, borderBottomLeftRadius: diameter * 0.5, backgroundColor: '#b8efc1', borderWidth: 1, borderColor: '#f4ffe0', opacity: 0.9, transform: [{ rotate: '-28deg' }, { scaleX: idle.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1.08] }) }] }} />
      <Animated.View style={{ position: 'absolute', right: '-4%', top: '5%', width: '46%', height: '47%', borderTopLeftRadius: diameter * 0.5, borderTopRightRadius: diameter, borderBottomRightRadius: diameter * 0.5, backgroundColor: '#b8efc1', borderWidth: 1, borderColor: '#f4ffe0', opacity: 0.9, transform: [{ rotate: '28deg' }, { scaleX: idle.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1.08] }) }] }} />
      <Animated.View style={{ position: 'absolute', left: '35%', top: '28%', width: '30%', height: '56%', borderRadius: 8, borderWidth: 1.5, borderColor: '#ffe6a6', backgroundColor: '#916536', alignItems: 'center', justifyContent: 'center', shadowColor: '#fff0aa', shadowOpacity: 0.95, shadowRadius: diameter * 0.3, transform: [{ scale: heartBeat }] }}><View style={{ width: '62%', height: '70%', borderRadius: 99, backgroundColor: '#fff1bd', shadowColor: '#fff4c9', shadowOpacity: 1, shadowRadius: 7 }} /></Animated.View>
      <Text style={{ position: 'absolute', left: '14%', top: '-6%', color: '#fff1bc', fontSize: diameter * 0.23 }}>✦　✦</Text>
    </>}
    {power.kind === 'life' && !isCrimsonOrb && !isPhoenixEmber && !isMothLantern && <>
      {heartSkin === 'ruby-prism' && <><View style={silhouetteStyles.rubyShardLeft} /><View style={silhouetteStyles.rubyShardRight} /><View style={styles.rubyHeartFacet} /><View style={styles.rubyHeartGlint} /></>}
      {heartSkin === 'ember-bloom' && <><View style={silhouetteStyles.emberPetalTop} /><View style={[styles.emberHeartFlame, styles.emberFlameLeft]} /><View style={[styles.emberHeartFlame, styles.emberFlameRight]} /><View style={styles.emberHeartCore} /><View style={silhouetteStyles.emberCinder} /></>}
      {heartSkin === 'necrotic-heart' && <><View style={[styles.necroticRoot, styles.rootLeft]} /><View style={[styles.necroticRoot, styles.rootRight]} /><View style={styles.necroticVein} /><View style={[styles.necroticSpore, styles.sporeLeft]} /><View style={[styles.necroticSpore, styles.sporeRight]} /></>}
      <Animated.Text style={[styles.powerText, isSeed ? styles.seedHeart : styles.classicHeart, heartSkin === 'ruby-prism' ? styles.rubyHeart : null, heartSkin === 'ember-bloom' ? styles.emberHeart : null, heartSkin === 'necrotic-heart' ? styles.necroticHeart : null, { fontSize: diameter * 1.08, lineHeight: diameter, transform: [{ scale: heartBeat }] }]}>{symbol}</Animated.Text>
    </>}
    {power.kind !== 'treasure' && power.kind !== 'life' && power.kind !== 'ram' && power.kind !== 'merchant' && power.kind !== 'waldo' && power.kind !== 'credit' && (power.kind !== 'speed' || skinId === 'electric-star') && <Text style={[styles.energyText, { color: power.kind === 'speed' ? '#eff3ff' : '#f6c15d', fontSize: diameter * (power.kind === 'speed' ? 0.85 : 0.72), lineHeight: diameter }]}>{symbol}</Text>}
    </>}
  </Animated.View>;
}

function WaldoScoutFigure({ size, idle }: { size: number; idle: Animated.Value }) {
  return <><Animated.View style={[silhouetteStyles.waldoGlow, { opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.38] }), transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }] }]} /><View style={[silhouetteStyles.waldoFigure, { width: size * 0.68, height: size * 0.98, left: size * 0.15 }]}><View style={silhouetteStyles.waldoCap}><View style={silhouetteStyles.waldoCapBand} /></View><View style={silhouetteStyles.waldoFace}><View style={silhouetteStyles.waldoHair} /><View style={silhouetteStyles.waldoGlasses}><View style={silhouetteStyles.waldoLensLeft} /><View style={silhouetteStyles.waldoLensRight} /></View><View style={silhouetteStyles.waldoNose} /></View><View style={silhouetteStyles.waldoArms}><View style={silhouetteStyles.waldoArm} /><View style={silhouetteStyles.waldoArm} /></View><View style={silhouetteStyles.waldoShirt}>{Array.from({ length: 5 }, (_, index) => <View key={index} style={[silhouetteStyles.waldoStripe, index % 2 === 0 && silhouetteStyles.waldoStripeRed]} />)}</View><View style={silhouetteStyles.waldoBelt} /><View style={silhouetteStyles.waldoLegs}><View style={silhouetteStyles.waldoLeg} /><View style={silhouetteStyles.waldoLeg} /></View><View style={silhouetteStyles.waldoBoots}><View style={silhouetteStyles.waldoBoot} /><View style={silhouetteStyles.waldoBoot} /></View></View><Animated.View style={[silhouetteStyles.waldoFinder, { transform: [{ rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] }) }] }]}><View style={silhouetteStyles.waldoFinderGlass} /><View style={silhouetteStyles.waldoFinderShine} /></Animated.View></>;
}

function WaldoPetArtwork({ pet, size }: { pet: CompanionPet; size: number }) {
  const [motion] = useState(() => new Animated.Value(0));
  useEffect(() => { const animation = Animated.loop(Animated.sequence([Animated.timing(motion, { toValue: 1, duration: pet.task === 'paint' ? 520 : 760, useNativeDriver: true }), Animated.timing(motion, { toValue: 0, duration: pet.task === 'paint' ? 450 : 620, useNativeDriver: true })])); animation.start(); return () => animation.stop(); }, [motion, pet.task]);
  const bob = motion.interpolate({ inputRange: [0, 1], outputRange: [1, -2] });
  return <Animated.View style={{ width: size, height: size * 1.12, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: bob }] }}><WaldoScoutFigure size={size * 0.82} idle={motion} />{pet.task === 'paint' && <Animated.Text style={{ position: 'absolute', right: 1, top: 3, color: '#ffe5a0', fontSize: size * 0.28, opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }}>✦</Animated.Text>}</Animated.View>;
}

function WaldoPaintingView({ left, top, styleId }: { left: number; top: number; styleId: number }) {
  const palettes = [['#3e8f93', '#f0c76a', '#f7e6bf'], ['#b94d52', '#273a60', '#e9d7a5'], ['#355c45', '#df9c54', '#e4d5bc'], ['#51417c', '#48a4aa', '#f1ca70'], ['#8c593e', '#3c6670', '#f3dfa2']];
  const [ground, accent, light] = palettes[styleId % palettes.length];
  return <View pointerEvents="none" style={{ position: 'absolute', left, top, zIndex: 8, width: 22, height: 17, borderWidth: 1.5, borderColor: '#dec995', borderRadius: 2, backgroundColor: '#171a24', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: styleId % 2 ? '90deg' : '0deg' }] }}><View style={{ width: 14, height: 10, backgroundColor: ground, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><View style={{ position: 'absolute', left: -2, bottom: -5, width: 12, height: 12, borderRadius: 12, backgroundColor: accent }} /><Text style={{ color: light, fontSize: 7, fontWeight: '900' }}>{styleId % 2 ? '✦' : '☼'}</Text></View></View>;
}

function LifeVaultDisplay({ lives, capacity, skinId, pickupSkins = DEFAULT_SKIN_SELECTIONS.pickups, creditSkin = 'mint-ledger', overflowJobs = [], overflowResult, elapsedMs = 0, processingMs = 6000, overflowChance = 50, overflowIncrease = 5, overflowUpgradeCost = 25, credits = 0, onUpgrade, compact = false, phoneLayout = false }: { lives: number; capacity: number; skinId: string; pickupSkins?: Record<PowerKind, string>; creditSkin?: string; overflowJobs?: OverflowJob[]; overflowResult?: OverflowResult; elapsedMs?: number; processingMs?: number; overflowChance?: number; overflowIncrease?: number; overflowUpgradeCost?: number; credits?: number; onUpgrade?: () => void; compact?: boolean; phoneLayout?: boolean }) {
  const [flameMotion] = useState(() => new Animated.Value(0));
  useEffect(() => { const loop = Animated.loop(Animated.sequence([Animated.timing(flameMotion, { toValue: 1, duration: 520, useNativeDriver: true }), Animated.timing(flameMotion, { toValue: 0, duration: 430, useNativeDriver: true })])); loop.start(); return () => loop.stop(); }, [flameMotion]);
  const activeJob = overflowJobs[0];
  const result = overflowResult && overflowResult.untilMs > elapsedMs ? overflowResult : undefined;
  const progress = activeJob ? Math.max(0, Math.min(1, 1 - activeJob.remainingMs / Math.max(1, processingMs))) : 0;
  const fire = <Animated.Text style={[lifeVaultUiStyles.smelterFire, { opacity: flameMotion.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }), transform: [{ translateY: flameMotion.interpolate({ inputRange: [0, 1], outputRange: [1, -2] }) }, { scale: flameMotion.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.14] }) as any }] }]}>♨</Animated.Text>;
  return <View style={[lifeVaultUiStyles.lifeVaultCase, compact && lifeVaultUiStyles.lifeVaultCompact, phoneLayout && lifeVaultUiStyles.lifeVaultPhone]}>
    {compact ? <View style={lifeVaultUiStyles.compactVaultHeader}><Text style={lifeVaultUiStyles.lifeVaultTitle}>LIFE VAULT</Text><Text style={lifeVaultUiStyles.lifeVaultCount}>{lives}<Text style={lifeVaultUiStyles.lifeVaultCountDim}> / {capacity}</Text></Text></View> : <View style={lifeVaultUiStyles.lifeVaultHeader}><View style={lifeVaultUiStyles.lifeVaultSeal}><Text style={lifeVaultUiStyles.lifeVaultSealText}>✚</Text></View><View style={lifeVaultUiStyles.lifeVaultHeading}><Text style={lifeVaultUiStyles.lifeVaultTitle}>LIFE VAULT</Text><Text style={lifeVaultUiStyles.lifeVaultSubtitle}>VITALITY CONTAINMENT</Text></View><Text style={lifeVaultUiStyles.lifeVaultCount}>{lives}<Text style={lifeVaultUiStyles.lifeVaultCountDim}> / {capacity}</Text></Text></View>}
    <View style={lifeVaultUiStyles.lifeVaultSlots}>{Array.from({ length: capacity }, (_, index) => <View key={`life-slot-${index}`} style={[lifeVaultUiStyles.lifeVaultSlot, index < lives ? lifeVaultUiStyles.lifeVaultSlotFilled : lifeVaultUiStyles.lifeVaultSlotEmpty]}>{index < lives ? <HudPickupIcon kind="life" skinId={skinId} size={20} /> : <Text style={lifeVaultUiStyles.lifeVaultEmptyHeart}>♡</Text>}</View>)}</View>
    {compact && <View style={lifeVaultUiStyles.compactSmelter}><View style={[lifeVaultUiStyles.compactFurnace, phoneLayout && { minWidth: 40 }]}>{fire}<View style={{ flex: 1 }}><Text style={lifeVaultUiStyles.compactStatus}>{activeJob ? `${activeJob.kind.toUpperCase()} → CREDITS · ${overflowJobs.length} QUEUED` : 'SMELTER STANDBY'}</Text><View style={lifeVaultUiStyles.lifeRefineryTrack}><View style={[lifeVaultUiStyles.lifeRefineryFill, { width: `${progress * 100}%` }]} /></View></View></View><Text style={lifeVaultUiStyles.refineryChance}>{Math.round(overflowChance)}%</Text>{onUpgrade && <Pressable accessibilityRole="button" accessibilityLabel={`Upgrade smelter yield chance for ${overflowUpgradeCost} credits`} disabled={overflowChance >= 100 || credits < overflowUpgradeCost} onPress={onUpgrade} style={[lifeVaultUiStyles.refineryUpgradeButton, phoneLayout && lifeVaultUiStyles.phoneRefineryUpgradeButton, (overflowChance >= 100 || credits < overflowUpgradeCost) && lifeVaultUiStyles.refineryUpgradeDisabled]}><Text style={lifeVaultUiStyles.refineryUpgradeLabel}>{overflowChance >= 100 ? 'MAX' : `+${Math.min(overflowIncrease, 100 - Math.round(overflowChance))}%`}</Text><Text style={lifeVaultUiStyles.refineryUpgradeCost}>{overflowChance >= 100 ? 'SECURE' : `${overflowUpgradeCost} C`}</Text></Pressable>}</View>}
    {!compact && <View style={lifeVaultUiStyles.lifeRefinery}><View style={lifeVaultUiStyles.lifeRefineryHeader}><Text style={lifeVaultUiStyles.lifeRefineryLabel}>{activeJob ? `SMELTER · ${overflowJobs.length} RESOURCE${overflowJobs.length === 1 ? '' : 'S'} IN QUEUE` : 'SMELTER · STANDBY'}</Text><Text style={lifeVaultUiStyles.lifeRefineryPayout}>{activeJob ? `+${activeJob.credits} C POTENTIAL` : 'OVERFLOW → CREDITS'}</Text></View><View style={lifeVaultUiStyles.smelterFlow}><View style={lifeVaultUiStyles.smelterSource}><Text style={lifeVaultUiStyles.smelterGlyph}>{activeJob?.kind === 'life' ? '♥' : activeJob?.kind === 'speed' ? '✦' : activeJob?.kind === 'ram' ? '✹' : '·'}</Text><Text style={lifeVaultUiStyles.smelterCaption}>{activeJob?.kind.toUpperCase() ?? 'RESOURCE'}</Text></View><Text style={lifeVaultUiStyles.smelterArrow}>›</Text><View style={lifeVaultUiStyles.smelterFurnace}>{fire}<Text style={lifeVaultUiStyles.smelterCaption}>MELT</Text></View><Text style={lifeVaultUiStyles.smelterArrow}>›</Text><View style={lifeVaultUiStyles.smelterOutput}><CreditSymbol skinId={creditSkin} size={18} /><Text style={lifeVaultUiStyles.smelterCaption}>CREDITS</Text></View></View><View style={lifeVaultUiStyles.lifeRefineryTrack}><View style={[lifeVaultUiStyles.lifeRefineryFill, { width: `${progress * 100}%` }]} /></View><View style={lifeVaultUiStyles.refineryUpgradeRow}><Text style={lifeVaultUiStyles.refineryChance}>YIELD CHANCE {Math.round(overflowChance)}%</Text>{onUpgrade && <Pressable accessibilityRole="button" accessibilityLabel={overflowChance >= 100 ? 'Smelter yield chance maximized' : `Upgrade smelter yield chance for ${overflowUpgradeCost} credits`} disabled={overflowChance >= 100 || credits < overflowUpgradeCost} onPress={onUpgrade} style={[lifeVaultUiStyles.refineryUpgradeButton, (overflowChance >= 100 || credits < overflowUpgradeCost) && lifeVaultUiStyles.refineryUpgradeDisabled]}><Text style={lifeVaultUiStyles.refineryUpgradeLabel}>{overflowChance >= 100 ? 'MAX' : `CALIBRATE +${Math.min(overflowIncrease, 100 - Math.round(overflowChance))}%`}</Text><Text style={lifeVaultUiStyles.refineryUpgradeCost}>{overflowChance >= 100 ? 'SECURE' : `${overflowUpgradeCost} C`}</Text></Pressable>}</View></View>}
    {result && <SmelterOutcome key={`${result.untilMs}-${result.success}`} result={result} creditSkin={creditSkin} pickupSkin={pickupSkins[result.kind] ?? skinId} />}
  </View>;
}

function SmelterOutcome({ result, creditSkin, pickupSkin }: { result: OverflowResult; creditSkin: string; pickupSkin: string }) {
  const [arrival] = useState(() => new Animated.Value(0));
  useEffect(() => { Animated.spring(arrival, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start(); }, [arrival]);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', right: 8, bottom: 8, zIndex: 30, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, borderWidth: 1, borderColor: result.success ? '#e4bd68' : '#bd5967', backgroundColor: result.success ? '#332a19ee' : '#321a24ee', opacity: arrival, transform: [{ scale: arrival as any }] }}>
    {result.success ? <><Text style={{ color: '#ffe096', fontSize: 12, fontWeight: '900' }}>+{result.credits}</Text><CreditSymbol skinId={creditSkin} size={15} /><Text style={{ color: '#f4d88f', fontSize: 6, fontWeight: '900', letterSpacing: 0.5 }}>REFINED</Text></> : <><HudPickupIcon kind={result.kind} skinId={pickupSkin} size={16} /><Text style={{ color: '#ff9da7', fontSize: 7, fontWeight: '900', letterSpacing: 0.6 }}>WASTED</Text><Text style={{ color: '#ff6579', fontSize: 11, fontWeight: '900' }}>✕</Text></>}
  </Animated.View>;
}

function HudPickupIcon({ kind, skinId, size }: { kind: PowerKind; skinId: string; size: number }) {
  const diameter = powerupCollisionRadius(kind) * 2;
  const scale = size / diameter;
  const center = size / (2 * scale);
  return <View style={{ width: size, height: size, position: 'relative' }}><PowerOrb power={{ id: -1, kind, x: center, y: center, vx: 0, vy: 0 }} sx={scale} sy={scale} skinId={skinId} staticDisplay /></View>;
}

function EngiPetArtwork({ skinId, task, size = 42 }: { skinId: string; task: CompanionPet['task']; size?: number }) {
  const [motion] = useState(() => new Animated.Value(0));
  useEffect(() => { const duration = task === 'weld' ? 360 : task === 'scan' ? 1150 : 1750; const loop = Animated.loop(Animated.sequence([Animated.timing(motion, { toValue: 1, duration, useNativeDriver: true }), Animated.timing(motion, { toValue: 0, duration: duration * 0.82, useNativeDriver: true })])); loop.start(); return () => loop.stop(); }, [motion, task, skinId]);
  const skin = ENGI_PET_SKINS.find(item => item.id === skinId) ?? ENGI_PET_SKINS[0];
  const conceptArt = ENGI_CONCEPT_ART[skinId];
  const pulse = motion.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.18] });
  const bob = motion.interpolate({ inputRange: [0, 1], outputRange: [1, task === 'rest' ? -0.7 : -2.2] });
  const lean = motion.interpolate({ inputRange: [0, 1], outputRange: skin.form === 'pilgrim' ? ['-3deg', '3deg'] : ['-2deg', '2deg'] });
  const shell = skin.shell, trim = skin.trim, glow = skin.glow;
  const plate = { position: 'absolute' as const, borderWidth: Math.max(1, size * 0.025), borderColor: trim, backgroundColor: shell, shadowColor: glow, shadowOpacity: 0.26, shadowRadius: size * 0.08 };
  const joint = { position: 'absolute' as const, width: size * 0.095, height: size * 0.095, borderRadius: size, backgroundColor: trim, borderWidth: 1, borderColor: '#f6dfb2' };
  const legs = <><View style={[plate, { left: size * 0.13, top: size * 0.68, width: size * 0.33, height: size * 0.11, borderRadius: size, transform: [{ rotate: '27deg' }] }]} /><View style={[plate, { right: size * 0.12, top: size * 0.68, width: size * 0.33, height: size * 0.11, borderRadius: size, transform: [{ rotate: '-27deg' }] }]} /><View style={[plate, { left: size * 0.42, top: size * 0.7, width: size * 0.16, height: size * 0.12, borderRadius: size, backgroundColor: '#17232a' }]} /><View style={[joint, { left: size * 0.12, top: size * 0.64 }]} /><View style={[joint, { right: size * 0.11, top: size * 0.64 }]} /></>;
  const art = skin.form === 'aegis'
    ? <>
      <Animated.View style={[{ position: 'absolute', left: size * 0.1, top: size * 0.08, width: size * 0.8, height: size * 0.12, borderTopWidth: size * 0.05, borderColor: trim, borderTopLeftRadius: size, borderTopRightRadius: size }, { transform: [{ rotate: lean }] }]} />
      <View style={[plate, { left: size * 0.39, top: size * 0.15, width: size * 0.22, height: size * 0.52, borderRadius: size * 0.13, transform: [{ rotate: '45deg' }], backgroundColor: '#26373a' }]} />
      <View style={[plate, { left: size * 0.26, top: size * 0.28, width: size * 0.48, height: size * 0.37, borderRadius: size * 0.16, backgroundColor: shell }]} />
      <View style={{ position: 'absolute', left: size * 0.37, top: size * 0.38, width: size * 0.26, height: size * 0.2, borderRadius: size * 0.1, backgroundColor: '#15232a', borderWidth: 1, borderColor: trim, alignItems: 'center', justifyContent: 'center' }}><Animated.View style={{ width: size * 0.1, height: size * 0.1, borderRadius: size, backgroundColor: glow, shadowColor: glow, shadowOpacity: 1, shadowRadius: size * 0.16, transform: [{ scale: pulse }] }} /></View>
      <View style={[plate, { left: size * 0.05, top: size * 0.34, width: size * 0.25, height: size * 0.09, borderRadius: size, transform: [{ rotate: '-24deg' }] }]} /><View style={[plate, { right: size * 0.04, top: size * 0.33, width: size * 0.26, height: size * 0.08, borderRadius: size, transform: [{ rotate: '22deg' }] }]} />
      <Animated.View style={{ position: 'absolute', left: size * 0.68, top: size * 0.21, width: size * 0.17, height: size * 0.17, borderRadius: size, backgroundColor: trim, borderWidth: 2, borderColor: '#ffe7ba', transform: [{ rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '145deg'] }) }] }}><View style={{ flex: 1, margin: size * 0.04, borderRadius: size, backgroundColor: glow, opacity: 0.9 }} /></Animated.View>
      {legs}
    </>
    : skin.form === 'cartographer'
      ? <>
        <View style={[plate, { left: size * 0.12, top: size * 0.49, width: size * 0.76, height: size * 0.25, borderRadius: size * 0.18, backgroundColor: '#263b35' }]} />
        {[[0.08, 0.57, '-22deg'], [0.75, 0.57, '22deg'], [0.2, 0.72, '22deg'], [0.68, 0.72, '-22deg']].map(([x, y, angle], index) => <View key={index} style={[plate, { left: size * Number(x), top: size * Number(y), width: size * 0.25, height: size * 0.08, borderRadius: size, transform: [{ rotate: String(angle) }] }]} />)}
        <View style={[joint, { left: size * 0.06, top: size * 0.55 }]} /><View style={[joint, { right: size * 0.06, top: size * 0.55 }]} />
        <Animated.View style={{ position: 'absolute', left: size * 0.23, top: size * 0.13, width: size * 0.54, height: size * 0.48, borderRadius: size * 0.27, backgroundColor: '#24372e', borderWidth: 2, borderColor: trim, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] }) }] }}><View style={{ width: size * 0.39, height: size * 0.31, borderRadius: size * 0.2, borderWidth: 2, borderColor: glow, alignItems: 'center', justifyContent: 'center', backgroundColor: '#14231f' }}><Animated.Text style={{ color: glow, fontSize: size * 0.26, fontWeight: '900', transform: [{ rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '35deg'] }) }, { scale: pulse }] }}>✣</Animated.Text></View></Animated.View>
        <View style={[plate, { left: size * 0.43, top: size * 0.53, width: size * 0.14, height: size * 0.15, borderRadius: size * 0.06, backgroundColor: '#18231f' }]}><View style={{ margin: 2, flex: 1, borderRadius: size, backgroundColor: glow }} /></View>
        <View style={{ position: 'absolute', left: size * 0.17, top: size * 0.28, width: size * 0.18, height: 1, backgroundColor: glow, opacity: 0.8 }} />
      </>
      : <>
        <Animated.View style={{ position: 'absolute', left: size * 0.43, top: size * 0.12, width: size * 0.14, height: size * 0.22, borderRadius: size, borderWidth: 2, borderColor: trim, backgroundColor: '#1b2b36', transform: [{ rotate: lean }] }}><Animated.View style={{ position: 'absolute', left: size * 0.04, top: size * 0.05, width: size * 0.065, height: size * 0.065, borderRadius: size, backgroundColor: glow, transform: [{ scale: pulse }] }} /></Animated.View>
        <View style={[plate, { left: size * 0.3, top: size * 0.31, width: size * 0.4, height: size * 0.42, borderRadius: size * 0.12, backgroundColor: '#304451' }]} />
        {[0, 1, 2, 3].map(index => <View key={index} style={{ position: 'absolute', left: size * 0.34, top: size * (0.37 + index * 0.075), width: size * 0.32, height: size * 0.045, borderRadius: size, backgroundColor: index === 1 ? glow : trim, opacity: index === 1 ? 0.9 : 0.78 }} />)}
        <View style={[plate, { left: size * 0.39, top: size * 0.57, width: size * 0.22, height: size * 0.13, borderRadius: size * 0.07, backgroundColor: '#14232e' }]}><Animated.View style={{ flex: 1, margin: size * 0.03, borderRadius: size, backgroundColor: glow, transform: [{ scaleX: pulse }] }} /></View>
        <View style={[plate, { left: size * 0.11, top: size * 0.4, width: size * 0.25, height: size * 0.07, borderRadius: size, transform: [{ rotate: '-40deg' }] }]} /><View style={[plate, { right: size * 0.11, top: size * 0.4, width: size * 0.25, height: size * 0.07, borderRadius: size, transform: [{ rotate: '40deg' }] }]} />
        <View style={[plate, { left: size * 0.23, top: size * 0.71, width: size * 0.54, height: size * 0.1, borderRadius: size, backgroundColor: '#15212a' }]} />
      </>;
  const effects = task === 'inspect'
    ? <Animated.View style={{ position: 'absolute', left: size * 0.53, top: size * 0.38, width: size * 0.48, height: size * 0.15, borderTopWidth: 1.5, borderTopColor: glow, backgroundColor: `${glow}24`, opacity: motion.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.08, 0.72, 0.12] }), transform: [{ rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '28deg'] }) }, { scaleX: pulse }] }} />
    : task === 'weld'
      ? <><Animated.Text style={{ position: 'absolute', right: size * 0.02, top: size * 0.28, color: '#fff0ad', fontSize: size * 0.34, opacity: motion.interpolate({ inputRange: [0, 0.16, 0.65, 1], outputRange: [0, 1, 0.15, 0] }), transform: [{ scale: pulse }, { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [3, -5] }) }] }}>✦</Animated.Text><Animated.View style={{ position: 'absolute', right: size * 0.14, top: size * 0.34, width: size * 0.12, height: size * 0.12, borderRadius: size, borderWidth: 1, borderColor: glow, opacity: motion.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.9, 0] }) }} /></>
      : task === 'scan'
        ? <Animated.View style={{ position: 'absolute', left: size * 0.26, top: size * 0.11, width: size * 0.5, height: size * 0.5, borderRadius: size, borderWidth: 1, borderColor: glow, opacity: motion.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 0.8, 0] }), transform: [{ scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.55] }) }] }} />
        : task === 'tinker'
          ? <Animated.Text style={{ position: 'absolute', left: size * 0.05, top: size * 0.05, color: trim, fontSize: size * 0.28, opacity: 0.95, transform: [{ rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ['-45deg', '315deg'] }) }] }}>⚙</Animated.Text>
          : <Animated.View style={{ position: 'absolute', left: size * 0.35, top: size * 0.28, width: size * 0.3, height: size * 0.36, borderRadius: size * 0.12, borderWidth: 1, borderColor: glow, opacity: 0.35, transform: [{ scaleY: motion.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.12] }) }] }} />;
  return <Animated.View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center', transform: [{ translateY: bob }, { rotate: lean }] }}>
    <Animated.View style={{ position: 'absolute', left: size * 0.2, top: size * 0.79, width: size * 0.6, height: size * 0.11, borderRadius: size, backgroundColor: glow, opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.09, 0.2] }), transform: [{ scaleX: pulse }] }} />
    {conceptArt ? <><Animated.Image source={conceptArt} resizeMode="contain" style={{ position: 'absolute', width: size * 1.3, height: size * 1.3, left: -size * 0.15, top: -size * 0.15, transform: [{ scale: pulse }] }} />{effects}</> : <>{art}{effects}</>}
  </Animated.View>;
}

function LevelClearStylePreview({ styleId }: { styleId: MechanicsSettings['levelClearStyle'] }) {
  const color = styleId === 'nova' ? '#ffda82' : styleId === 'prism' ? '#dcaaff' : '#86ecff';
  return <View style={{ height: 66, overflow: 'hidden', borderWidth: 1, borderColor: `${color}88`, borderRadius: 7, backgroundColor: styleId === 'nova' ? '#182331' : styleId === 'prism' ? '#211731' : '#0d2632', alignItems: 'center', justifyContent: 'center' }}>
    {styleId === 'nova' ? <><View style={{ position: 'absolute', width: 54, height: 54, borderRadius: 99, borderWidth: 2, borderColor: color }} /><Text style={{ color, fontSize: 18 }}>✦　✧　✦</Text></> : styleId === 'prism' ? <><View style={{ position: 'absolute', left: '34%', top: -15, width: 32, height: 96, backgroundColor: '#a457d477', transform: [{ rotate: '25deg' }] }} /><View style={{ position: 'absolute', right: '34%', top: -15, width: 32, height: 96, backgroundColor: '#51d8e777', transform: [{ rotate: '-25deg' }] }} /><Text style={{ color, fontSize: 15 }}>◇　GATE　◇</Text></> : <><View style={{ position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: color, shadowColor: color, shadowOpacity: 1, shadowRadius: 12 }} /><Text style={{ color, fontSize: 13, letterSpacing: 3 }}>—　SIGNAL　—</Text></>}
    <Text style={{ position: 'absolute', bottom: 4, color: '#aab9cc', fontSize: 7, fontWeight: '900', letterSpacing: 1.5 }}>{LEVEL_CLEAR_ANIMATIONS.find(animation => animation.id === styleId)?.name.toUpperCase()}</Text>
  </View>;
}

function LevelClearTransition({ event, onDone }: { event: { id: number; level: number; style: MechanicsSettings['levelClearStyle']; durationMs: number }; onDone: () => void }) {
  const [progress] = useState(() => new Animated.Value(0));
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);
  useEffect(() => { Animated.timing(progress, { toValue: 1, duration: event.durationMs, useNativeDriver: true }).start(({ finished }) => { if (finished) done.current(); }); }, [progress, event.durationMs]);
  const fade = progress.interpolate({ inputRange: [0, 0.08, 0.72, 1], outputRange: [0, 1, 0.9, 0] });
  const ring = progress.interpolate({ inputRange: [0, 0.22, 1], outputRange: [0.12, 1, 2.8] });
  const titleScale = progress.interpolate({ inputRange: [0, 0.18, 0.62, 1], outputRange: [0.72, 1.08, 1, 0.9] });
  const prism = event.style === 'prism', rift = event.style === 'rift';
  const color = prism ? '#e6baff' : rift ? '#82eaff' : '#ffe09a';
  return <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 80, alignItems: 'center', justifyContent: 'center' }}>
    <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: prism ? '#2a1646' : rift ? '#08273a' : '#162331', opacity: fade }} />
    {prism
      ? <><Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '51%', backgroundColor: '#a557dc77', opacity: fade, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-120, -520] }) }, { skewX: '-12deg' }] }} /><Animated.View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '51%', backgroundColor: '#54d9eb77', opacity: fade, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [120, 520] }) }, { skewX: '12deg' }] }} /><Animated.View style={{ position: 'absolute', width: 90, height: '130%', borderWidth: 2, borderColor: '#f1d3ff', opacity: fade, transform: [{ rotate: '32deg' }, { scale: ring }] }} /></>
      : rift
        ? <><Animated.View style={{ position: 'absolute', top: 0, bottom: 0, width: 3, backgroundColor: '#d7faff', shadowColor: '#62deff', shadowOpacity: 1, shadowRadius: 26, opacity: fade, transform: [{ scaleX: progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 1, 120] }) }] }} /><Animated.View style={{ position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#baf8ff', opacity: fade, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-240, 260] }) }, { scaleX: ring }] }} /><Animated.Text style={{ position: 'absolute', color: '#eaffff', fontSize: 25, letterSpacing: 8, opacity: fade, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-190, 190] }) }] }}>· ϟ · ϟ ·</Animated.Text></>
        : <><Animated.View style={{ position: 'absolute', width: 76, height: 76, borderRadius: 999, borderWidth: 3, borderColor: '#fff1bb', shadowColor: '#ffc965', shadowOpacity: 1, shadowRadius: 24, opacity: fade, transform: [{ scale: ring }] }} /><Animated.View style={{ position: 'absolute', width: 36, height: 36, borderRadius: 999, backgroundColor: '#fff0bd', opacity: progress.interpolate({ inputRange: [0, 0.12, 0.45, 1], outputRange: [0, 0.92, 0.14, 0] }), transform: [{ scale: progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.2, 1.8, 3.2] }) }] }} />{Array.from({ length: 10 }, (_, index) => { const angle = index / 10 * Math.PI * 2; return <Animated.Text key={index} style={{ position: 'absolute', color: '#ffe8a8', fontSize: 16 + index % 3 * 3, opacity: fade, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * 190] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * 230] }) }, { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${index % 2 ? 180 : -180}deg`] }) }] }}>✦</Animated.Text>; })}</>}
    <Animated.View style={{ alignItems: 'center', paddingHorizontal: 22, paddingVertical: 14, backgroundColor: '#06111de8', borderWidth: 1, borderColor: color, borderRadius: 12, opacity: fade, shadowColor: color, shadowOpacity: 0.8, shadowRadius: 20, transform: [{ scale: titleScale }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [24, -18] }) }] }}>
      <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 3 }}>CONTAINMENT CLEARED</Text><Text style={{ color: '#f5f8ff', fontSize: 26, fontWeight: '900', letterSpacing: 2 }}>STAGE {String(event.level).padStart(2, '0')}</Text><Text style={{ color: '#99adc0', fontSize: 8, fontWeight: '800', letterSpacing: 2 }}>{prism ? 'GATE SYNCHRONIZED' : rift ? 'NEXT SIGNAL ACQUIRED' : 'NOVA CHARGED'}</Text>
    </Animated.View>
  </View>;
}

function CreditGainPopup({ event, sx, sy, stageWidth, stageHeight, creditSkin, style, onDone }: { event: CreditGainEvent; sx: number; sy: number; stageWidth: number; stageHeight: number; creditSkin: string; style: MechanicsSettings['creditGainStyle']; onDone: () => void }) {
  const [progress] = useState(() => new Animated.Value(0));
  const [drift] = useState(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 38 + Math.random() * 34;
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  });
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);
  useEffect(() => { Animated.timing(progress, { toValue: 1, duration: 1050, useNativeDriver: true }).start(({ finished }) => { if (finished) done.current(); }); }, [progress]);
  const opacity = progress.interpolate({ inputRange: [0, 0.12, 0.72, 1], outputRange: [0, 1, 0.95, 0] });
  const lift = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -42] });
  const pop = progress.interpolate({ inputRange: [0, 0.16, 0.74, 1], outputRange: [0.55, 1.12, 1, 0.78] });
  const tickerDrift = progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [-9, 4, 22] });
  const tickerTilt = progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: ['-8deg', '2deg', '7deg'] });
  const orbitTurn = progress.interpolate({ inputRange: [0, 1], outputRange: ['-140deg', '220deg'] });
  const ticker = style === 'ticker';
  const popupWidth = ticker ? 60 : 54;
  const left = Math.max(0, Math.min(stageWidth - popupWidth, event.x * sx + drift.x - popupWidth / 2));
  const top = Math.max(0, Math.min(stageHeight - 24, event.y * sy + drift.y - 12));
  const tickerLift = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -29] });
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', zIndex: 30, left, top, minWidth: popupWidth, height: 23, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, opacity, transform: [{ translateY: ticker ? tickerLift : lift }, { translateX: ticker ? tickerDrift : 0 }, { scale: pop }, { rotate: ticker ? tickerTilt : '0deg' }], shadowColor: ticker ? '#ffc65b' : '#4bdcff', shadowOpacity: 0.45, shadowRadius: 4 }}>
    {!ticker && <Animated.Text style={{ position: 'absolute', right: 2, top: 0, color: '#dfffff', fontSize: 7, opacity, transform: [{ rotate: orbitTurn }, { translateX: 15 }] }}>✦</Animated.Text>}
    <Text style={{ color: ticker ? '#ffe4a0' : '#b8fbff', fontSize: 11, fontWeight: '900', letterSpacing: 0.25, textShadowColor: ticker ? '#ffb944' : '#42dfff', textShadowRadius: 5 }}>+{event.amount.toLocaleString()}</Text>
    <CreditSymbol skinId={creditSkin} size={ticker ? 15 : 16} />
    {ticker && <Text style={{ color: '#f4c461', fontSize: 8, fontWeight: '900' }}>C</Text>}
  </Animated.View>;
}

function CreditSymbol({ skinId, size }: { skinId: string; size: number }) {
  const [motion] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const cycle = skinId === 'tidal-pearl'
      ? Animated.sequence([Animated.timing(motion, { toValue: 1, duration: 1450, useNativeDriver: true }), Animated.timing(motion, { toValue: 0, duration: 1450, useNativeDriver: true })])
      : skinId === 'ember-scrip'
        ? Animated.sequence([Animated.timing(motion, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.timing(motion, { toValue: 0, duration: 540, useNativeDriver: true })])
        : skinId === 'sunshard'
          ? Animated.sequence([Animated.timing(motion, { toValue: 1, duration: 720, useNativeDriver: true }), Animated.timing(motion, { toValue: 0, duration: 960, useNativeDriver: true })])
          : skinId === 'circuit-chit'
            ? Animated.sequence([Animated.timing(motion, { toValue: 1, duration: 960, useNativeDriver: true }), Animated.timing(motion, { toValue: 0, duration: 420, useNativeDriver: true })])
            : skinId === 'void-prism'
              ? Animated.sequence([Animated.timing(motion, { toValue: 1, duration: 1280, useNativeDriver: true }), Animated.timing(motion, { toValue: 0, duration: 640, useNativeDriver: true })])
        : Animated.sequence([Animated.timing(motion, { toValue: 1, duration: 780, useNativeDriver: true }), Animated.timing(motion, { toValue: 0, duration: 900, useNativeDriver: true })]);
    const loop = Animated.loop(cycle); loop.start(); return () => loop.stop();
  }, [motion, skinId]);
  const detailedArt = CREDIT_SYMBOL_ART[skinId];
  if (detailedArt) {
    const imageScale = motion.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.04] });
    const shineOpacity = motion.interpolate({ inputRange: [0, 0.3, 0.58, 1], outputRange: [0, 0.88, 0.16, 0] });
    const shineX = motion.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.3, size * 0.3] });
    const scanY = motion.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.24, size * 0.24] });
    return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
      <Animated.Image source={detailedArt} resizeMode="contain" style={{ width: size * 0.98, height: size * 0.98, transform: [{ scale: imageScale }] }} />
      {skinId === 'sunshard' && <>
        <Animated.View style={{ position: 'absolute', left: '14%', top: '17%', width: '72%', height: '8%', borderRadius: 999, backgroundColor: '#fff8d8', shadowColor: '#fff0a3', shadowOpacity: 1, shadowRadius: 8, opacity: shineOpacity, transform: [{ rotate: '-34deg' }, { translateX: shineX }] }} />
        <Animated.View style={{ position: 'absolute', width: '86%', height: '86%', borderRadius: 999, borderWidth: 1, borderColor: '#ffe69b', opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.52] }), transform: [{ scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.05] }) }] }} />
      </>}
      {skinId === 'circuit-chit' && <>
        <Animated.View style={{ position: 'absolute', left: '20%', top: '20%', width: '60%', height: '5%', backgroundColor: '#dfffff', shadowColor: '#3cecff', shadowOpacity: 1, shadowRadius: 8, opacity: shineOpacity, transform: [{ translateY: scanY }] }} />
        {[0, 1, 2, 3].map(i => <Animated.View key={`chit-node-${i}`} style={{ position: 'absolute', left: i % 2 ? '79%' : '18%', top: i < 2 ? '22%' : '76%', width: Math.max(2, size * 0.09), height: Math.max(2, size * 0.09), borderRadius: 2, backgroundColor: '#dbffff', opacity: motion.interpolate({ inputRange: [0, i * 0.17, Math.min(0.9, i * 0.17 + 0.25), 1], outputRange: [0.3, 0.4, 1, 0.3] }) }} />)}
      </>}
      {skinId === 'void-prism' && <Animated.View style={{ position: 'absolute', left: '38%', top: '6%', width: '13%', height: '88%', borderRadius: 999, backgroundColor: '#fff', shadowColor: '#d2b0ff', shadowOpacity: 1, shadowRadius: 9, opacity: shineOpacity, transform: [{ rotate: '31deg' }, { translateX: shineX }] }} />}
    </View>;
  }
  if (skinId === 'tidal-pearl') return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><Animated.View style={[creditStyles.creditPearlHalo, { width: size * 0.92, height: size * 0.92, borderRadius: size, opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.82] }), transform: [{ scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.08] }) }] }]} /><Animated.View style={[creditStyles.creditPearl, { width: size * 0.7, height: size * 0.7, borderRadius: size, transform: [{ scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.04] }) }] }]}><View style={[creditStyles.creditPearlCore, { width: size * 0.26, height: size * 0.26, borderRadius: size }]} /><View style={[creditStyles.creditPearlGleam, { width: size * 0.25, height: Math.max(1.5, size * 0.07), borderRadius: size }]} /></Animated.View><Animated.View style={[creditStyles.creditTideArc, { width: size * 0.94, height: size * 0.38, borderRadius: size, opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.95] }), transform: [{ rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ['-28deg', '28deg'] }) }] }]} /><Animated.Text style={[creditStyles.creditPearlBubble, { fontSize: size * 0.2, right: size * 0.05, top: size * 0.02, opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.28, 1] }), transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [size * 0.12, -size * 0.08] }) }] }]}>·</Animated.Text></View>;
  if (skinId === 'ember-scrip') return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><Animated.View style={[creditStyles.creditEmberHalo, { width: size * 0.96, height: size * 0.96, borderRadius: size * 0.2, opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.68] }), transform: [{ rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] }) }, { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.08] }) }] }]} /><View style={[creditStyles.creditEmberPlate, { width: size * 0.68, height: size * 0.8, borderRadius: size * 0.12, transform: [{ rotate: '18deg' }] }]}><Animated.View style={[creditStyles.creditEmberCore, { width: size * 0.27, height: size * 0.27, borderRadius: size, opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.48, 1] }), transform: [{ scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.28] }) }]}]} /></View><Animated.Text style={[creditStyles.creditEmberSpark, { fontSize: size * 0.32, right: size * 0.02, top: size * 0.03, opacity: motion.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.12, 1, 0.1] }), transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [size * 0.1, -size * 0.1] }) }, { rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '25deg'] }) }] }]}>✦</Animated.Text><View style={[creditStyles.creditEmberStamp, { width: size * 0.42, height: size * 0.12, borderRadius: size }]} /></View>;
  if (skinId === 'circuit-chit') return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Animated.View style={[creditStyles.creditHex, { width: size * 0.74, height: size * 0.74, borderRadius: size * 0.16, transform: [{ rotate: '45deg' }, { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }) }] }]}><Animated.View style={[creditStyles.creditHexCore, { width: size * 0.27, height: size * 0.27, transform: [{ rotate: '-45deg' }, { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.24] }) }], opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.62, 1] }) }]} /></Animated.View>
    {[0, 1, 2, 3].map(i => <Animated.View key={`credit-node-${i}`} style={{ position: 'absolute', left: i % 2 ? '77%' : '15%', top: i < 2 ? '15%' : '77%', width: size * 0.13, height: size * 0.13, borderRadius: size, backgroundColor: i % 2 ? '#c9ffff' : '#42efff', shadowColor: '#58efff', shadowOpacity: 1, shadowRadius: 4, opacity: motion.interpolate({ inputRange: [0, 0.12 + i * 0.13, 0.55 + i * 0.1, 1], outputRange: [0.25, 1, 0.38, 0.25] }) }} />)}
    <Animated.View style={{ position: 'absolute', left: '13%', top: '47%', width: '74%', height: 2, backgroundColor: '#dcffff', opacity: motion.interpolate({ inputRange: [0, 0.45, 0.62, 1], outputRange: [0, 0, 0.95, 0] }), transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.24, size * 0.24] }) }] }} />
  </View>;
  if (skinId === 'void-prism') return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Animated.View style={[creditStyles.creditPrism, { width: size * 0.68, height: size * 0.82, borderTopLeftRadius: size * 0.4, borderTopRightRadius: size * 0.12, borderBottomLeftRadius: size * 0.14, borderBottomRightRadius: size * 0.38, transform: [{ rotate: '38deg' }, { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.04] }) }] }]}><View style={[creditStyles.creditPrismFacet, { width: size * 0.19, height: size * 0.57, transform: [{ rotate: '23deg' }] }]} /><View style={[creditStyles.creditPrismGlint, { width: size * 0.12, height: size * 0.25 }]} /><Animated.View style={{ position: 'absolute', left: '36%', top: '33%', width: '28%', height: '32%', borderRadius: size, backgroundColor: '#f4dcff', shadowColor: '#d9a7ff', shadowOpacity: 1, shadowRadius: size * 0.22, opacity: motion.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.4, 1, 0.55] }), transform: [{ scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.16] }) }] }} /></Animated.View>
    <Animated.View style={{ position: 'absolute', left: '10%', top: '45%', width: '80%', height: Math.max(1, size * 0.07), borderRadius: size, backgroundColor: '#fff', opacity: motion.interpolate({ inputRange: [0, 0.3, 0.55, 1], outputRange: [0, 0.9, 0.15, 0] }), transform: [{ rotate: '-38deg' }, { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.4, size * 0.42] }) }] }} />
  </View>;
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Animated.View style={[creditStyles.creditSun, { width: size * 0.74, height: size * 0.74, borderRadius: size / 2, transform: [{ scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.06] }) }] }]} />
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <Animated.View key={`sunshard-ray-${i}`} style={{ position: 'absolute', left: '45%', top: '3%', width: '10%', height: '21%', borderRadius: size, backgroundColor: i % 2 ? '#ffb431' : '#ffe68b', transform: [{ rotate: `${i * 45}deg` }, { scaleY: motion.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.08] }) }], opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1] }), shadowColor: '#ffc74f', shadowOpacity: 0.8, shadowRadius: 4 }} />)}
    <Animated.View style={[creditStyles.creditSunInner, { width: size * 0.57, height: size * 0.57, borderRadius: size / 2, transform: [{ rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }]}><Text style={{ color: '#fff9db', fontSize: size * 0.44, lineHeight: size * 0.57, fontWeight: '900', textAlign: 'center', textShadowColor: '#fff7ba', textShadowRadius: 6 }}>✦</Text></Animated.View>
    <Animated.View style={[creditStyles.creditSunGlint, { width: size * 0.14, height: size * 0.72, borderRadius: size, left: '42%', top: '14%', opacity: motion.interpolate({ inputRange: [0, 0.35, 0.62, 1], outputRange: [0, 0.78, 0.15, 0] }), transform: [{ rotate: '28deg' }, { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.35, size * 0.35] }) }] }]} />
  </View>;
}

function HudChargeIcons({ kind, skinId, count }: { kind: 'speed' | 'ram' | 'charge'; skinId: string; count: number }) {
  const iconSize = 14;
  const [capacity, setCapacity] = useState(3);
  return <View style={styles.chargeIcons} onLayout={event => setCapacity(Math.max(1, Math.floor((event.nativeEvent.layout.width + 2) / (iconSize + 2))))}>
    {count === 0 ? <Text style={styles.abilityCount}>0</Text> : count > capacity ? <Text style={styles.abilityCount}>{count.toLocaleString()}</Text> : Array.from({ length: count }, (_, index) => <HudPickupIcon key={`${kind}-${index}`} kind={kind} skinId={skinId} size={iconSize} />)}
  </View>;
}

type SkinPreviewKind = PowerKind | 'background' | 'ball' | 'wallBreak' | 'credit';

function SkinOptionPreview({ option, kind }: { option: SkinOption; kind: SkinPreviewKind }) {
  const [previewId, setPreviewId] = useState(0);
  const isPickup = kind === 'life' || kind === 'speed' || kind === 'ram' || kind === 'treasure' || kind === 'merchant' || kind === 'bubble' || kind === 'waldo' || kind === 'credit' || kind === 'exit';
  const data = option as SkinOption & { color?: string; asset?: number | null; base?: string; border?: string; fxColor?: string; fxGlyph?: string };
  const glyph = data.fxGlyph ?? (kind === 'wallBreak' ? option.id === 'sonic-shear' ? '〰' : option.id === 'ember-snap' ? '✦' : option.id === 'wall-crack' ? 'ϟ' : option.id === 'wall-crumble' ? '▧' : '◇' : '•');
  return <Pressable accessibilityRole="button" accessibilityLabel={isPickup ? `Preview ${option.name} pickup and capture effect` : `Preview ${option.name}`} onPress={() => { if (isPickup) setPreviewId(id => id + 1); }} style={[styles.skinPreviewButton, previewId > 0 && styles.skinPreviewActive]}>
    <View style={styles.skinPreviewStage}>
      {isPickup && <PowerOrb power={{ id: 0, x: 28, y: 28, vx: 0, vy: 0, kind }} sx={1} sy={1} skinId={option.id} />}
      {kind === 'background' && <View style={[styles.skinPreviewBackground, { backgroundColor: data.color ?? '#17202a', borderColor: `${data.color ?? '#17202a'}` }]}>{data.asset && <Image source={data.asset} resizeMode="cover" style={StyleSheet.absoluteFill} />}<View style={styles.skinPreviewHorizon} /></View>}
      {kind === 'ball' && <BallArtwork skin={option as typeof BALL_SKINS[number]} diameter={30} left={10} top={10} preview />}
      {kind === 'credit' && <View style={creditStyles.creditSkinPreview}><CreditSymbol skinId={option.id} size={42} /></View>}
      {kind === 'wallBreak' && <View style={[styles.skinBreakPreview, option.id === 'sonic-shear' ? styles.skinBreakSonic : option.id === 'ember-snap' ? styles.skinBreakEmber : option.id === 'wall-crack' ? styles.skinBreakCrack : option.id === 'wall-crumble' ? styles.skinBreakCrumble : styles.skinBreakGlass]}><Text style={[styles.skinBreakGlyph, { color: option.id === 'ember-snap' ? '#ffba58' : option.id === 'sonic-shear' ? '#70eeff' : option.id === 'wall-crack' ? '#ff7b8b' : option.id === 'wall-crumble' ? '#e9bd79' : '#d8fbff' }]}>{glyph}</Text></View>}
      {isPickup && <Text style={styles.skinPreviewTap}>▶ FX</Text>}
      {isPickup && previewId > 0 && <CaptureBurst key={previewId} event={{ id: previewId, x: 28, y: 28, kind, skinId: option.id }} sx={1} sy={1} onDone={() => {}} />}
    </View>
  </Pressable>;
}

function ArenaBackgroundEffects({ id }: { id: string }) {
  const grove = id === 'cosmic-forest';
  const fractal = id === 'fractal-sky';
  const motes = grove
    ? [[7, 18], [91, 23], [14, 38], [84, 44], [5, 62], [93, 70], [17, 85], [79, 92]]
    : fractal
      ? [[8, 12], [89, 17], [16, 31], [94, 43], [6, 58], [85, 66], [12, 83], [92, 89]]
      : [[9, 14], [88, 26], [17, 42], [93, 55], [6, 72], [79, 84], [24, 91], [91, 8]];
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {motes.map(([x, y], index) => <ArenaMote key={`${id}-${index}`} id={id} x={x} y={y} index={index} />)}
  </View>;
}

function ArenaMote({ id, x, y, index }: { id: string; x: number; y: number; index: number }) {
  const [motion] = useState(() => new Animated.Value(0));
  const grove = id === 'cosmic-forest';
  const fractal = id === 'fractal-sky';
  const hue = grove ? (index % 3 === 0 ? '#dcf4a0' : '#6fffe1') : fractal ? (index % 2 ? '#b6a1ff' : '#84e8ff') : (index % 2 ? '#d7c0ff' : '#a4f7ff');
  const diameter = grove ? 3 + index % 3 : fractal ? 2 + index % 2 : 2 + index % 2;
  useEffect(() => {
    motion.setValue(0);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(motion, { toValue: 1, duration: 1900 + index * 360, useNativeDriver: true }),
      Animated.timing(motion, { toValue: 0, duration: 2100 + index * 290, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [index, motion, id]);
  return <Animated.View style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: diameter, height: grove ? diameter * 1.6 : diameter, borderRadius: fractal ? 1 : 999, backgroundColor: hue, shadowColor: hue, shadowOpacity: 0.85, shadowRadius: grove ? 7 : 5, opacity: motion.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.12, 0.78, 0.18] }), transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, grove ? -15 : -8] }) }, { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [0, fractal ? 5 : 2] }) }, { rotate: fractal ? '45deg' : '0deg' }, { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.18] }) }] }} />;
}

function SkinSelectRow({ label, value, options, onChange, previewKind }: { label: string; value: string; options: readonly SkinOption[]; onChange: (id: string) => void; previewKind: SkinPreviewKind }) {
  const [expanded, setExpanded] = useState(false);
  const selected = options.find(option => option.id === value) ?? options[0];
  return <View style={styles.skinSelectWrap}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(open => !open)} style={styles.skinSelectButton}>
      <View style={styles.skinSelectText}><Text style={styles.settingLabel}>{label}</Text><Text style={styles.skinSelectedName}>{selected.name}</Text></View>
      <Text style={styles.skinChevron}>{expanded ? '−' : '+'}</Text>
    </Pressable>
    {expanded && <View style={styles.skinOptions}>{options.map(option => <View key={option.id} style={[styles.skinOption, option.id === value && styles.skinOptionSelected]}>
      <SkinOptionPreview option={option} kind={previewKind} />
      <Pressable accessibilityRole="button" onPress={() => { onChange(option.id); setExpanded(false); }} style={styles.skinOptionCopy}><Text style={styles.skinOptionName}>{option.name}</Text><Text style={styles.skinOptionDescription}>{option.description}</Text></Pressable>
      {option.id === value && <Text style={styles.skinCheck}>✓</Text>}
    </View>)}</View>}
  </View>;
}

function CaptureBurst({ event, sx, sy, creditSkin = DEFAULT_SKIN_SELECTIONS.credit, stageWidth = 900, stageHeight = 1000, onDone }: { event: CaptureEvent; sx: number; sy: number; creditSkin?: string; stageWidth?: number; stageHeight?: number; onDone: () => void }) {
  const [progress] = useState(() => new Animated.Value(0));
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);
  useEffect(() => { Animated.timing(progress, { toValue: 1, duration: event.skewered ? 2100 : event.kind === 'chargeBallBreak' ? event.skinId === 'voltaic-cartridge' ? 1380 : event.skinId === 'singularity-charge' ? 1760 : 1120 : event.skinId === 'phoenix-ember' ? 1550 : event.skinId === 'moth-lantern' ? 1650 : event.skinId === 'thunder-lattice' ? 1280 : event.skinId === 'ion-skiff' ? 1160 : event.skinId === 'mantis-breacher' ? 1360 : event.skinId === 'meteor-maul' ? 1480 : event.skinId === 'star-reliquary' ? 1580 : event.skinId === 'orbital-astrolabe' ? 1720 : event.skinId === 'radiant-coin' ? 1640 : event.skinId === 'star-chart-astrolabe' ? 1480 : event.skinId === 'skyglass-merchant' ? 1560 : event.skinId === 'lantern-gate-token' ? 1420 : event.skinId === 'aurora-crown' ? 1580 : event.skinId === 'tiny-glassworld' ? 1680 : event.skinId === 'inkblot-comet' ? 1460 : event.skinId === 'finder-badge' ? 1620 : event.skinId === 'solar-mint-seal' ? 1420 : event.skinId === 'circuit-ledger-relay' ? 1540 : event.skinId === 'void-prism-scrip' ? 1660 : event.skinId === 'engi-cocoon' ? 1380 : event.skinId === 'engi-seed-pod' ? 1480 : event.skinId === 'engi-scarab-capsule' ? 1600 : event.skinId === 'courier-skiff' ? 1360 : event.skinId === 'folded-transit' ? 1410 : event.kind === 'merchantBreak' ? 1250 : event.kind === 'exit' ? 1450 : event.kind === 'petHatched' ? 1450 : event.kind === 'petRepair' ? 1050 : event.kind === 'engiEggBreak' ? 780 : event.kind === 'phaseChestBreak' ? 1350 : event.kind === 'phaseRupture' ? 1150 : event.kind === 'waldoFound' ? 1450 : event.kind === 'waldo' ? 1250 : event.kind === 'jackpot' ? 1100 : event.kind === 'bubble' ? 1450 : event.kind === 'credit' ? 1050 : event.kind === 'creditLost' ? 620 : event.kind === 'combo' ? 980 : event.kind === 'bubbleLost' ? 460 : 720, useNativeDriver: true }).start(({ finished }) => { if (finished) onDoneRef.current(); }); }, [progress, event.kind, event.skinId, event.skewered]);
  const pickupKind: PowerKind | undefined = event.kind === 'jackpot' ? 'treasure' : event.kind === 'chargeBallBreak' ? 'charge' : event.kind === 'engiEggBreak' || event.kind === 'petHatched' ? 'engi-egg' : event.kind === 'explosion' || event.kind === 'overflowFailed' || event.kind === 'phaseRupture' || event.kind === 'phaseChestBreak' || event.kind === 'anchorBreak' || event.kind === 'combo' || event.kind === 'waldoFound' || event.kind === 'petRepair' || event.kind === 'petLost' ? undefined : event.kind === 'ramBlast' ? 'ram' : event.kind === 'merchantBreak' ? 'merchant' : event.kind === 'bubbleLost' ? 'bubble' : event.kind === 'creditLost' ? 'credit' : event.kind;
  const option = pickupKind ? PICKUP_SKINS[pickupKind].find(skin => skin.id === event.skinId) ?? PICKUP_SKINS[pickupKind][0] : undefined;
  const isChargeBreak = event.kind === 'chargeBallBreak';
  const isBlast = event.kind === 'explosion' || event.kind === 'ramBlast' || isChargeBreak;
  const isBubblePop = event.kind === 'bubble';
  const isCombo = event.kind === 'combo';
  const skewerAnimation: CaptureAnimation | undefined = event.skewered ? 'skewer-pierce' : undefined;
  const skewerAxis = event.skeweredWall?.axis ?? event.skeweredAxis;
  const wall = event.skeweredWall;
  const animation = event.kind === 'bubbleLost' ? 'bubble-pop' : event.kind === 'creditLost' || event.kind === 'engiEggBreak' || event.kind === 'merchantBreak' || event.kind === 'chargeBallBreak' ? option?.breakAnimation ?? 'token-fracture' : option?.captureAnimation;
  const isWaldoFound = event.kind === 'waldoFound';
  const isPhaseRupture = event.kind === 'phaseRupture';
  const isPhaseChestBreak = event.kind === 'phaseChestBreak';
  const isAnchorBreak = event.kind === 'anchorBreak';
  const isOverflowFailure = event.kind === 'overflowFailed';
  const isPetRepair = event.kind === 'petRepair';
  const isPetHatched = event.kind === 'petHatched';
  const isPetLost = event.kind === 'petLost';
  const isEngiEggBreak = event.kind === 'engiEggBreak';
  const color = isPetRepair || isPetHatched ? '#81efc4' : isPetLost || isEngiEggBreak ? '#b7a88d' : isOverflowFailure ? '#ff7888' : event.kind === 'explosion' ? '#ff762f' : isPhaseRupture ? '#74edff' : isPhaseChestBreak ? '#f2b95b' : isAnchorBreak ? '#9fb7c4' : event.kind === 'jackpot' ? '#ffd76a' : isCombo ? '#7ce9ff' : isWaldoFound ? '#f04a55' : event.kind === 'bubbleLost' ? '#b9e9f1' : option?.fxColor ?? '#ffffff';
  const accent = isPetRepair || isPetHatched ? '#e1fff0' : isPetLost || isEngiEggBreak ? '#ece0c8' : event.kind === 'explosion' ? '#fff1a5' : isPhaseRupture ? '#f3fcff' : isPhaseChestBreak ? '#fff0ae' : isAnchorBreak ? '#fff0cb' : event.kind === 'jackpot' ? '#fff0b0' : isCombo || isWaldoFound ? '#fff3bb' : event.kind === 'bubbleLost' ? '#f4ffff' : option?.fxAccent ?? '#ffffff';
  const glyph = isPetRepair ? '⚒' : isPetHatched ? '⌂' : isPetLost || isEngiEggBreak ? '▰' : isOverflowFailure ? '×' : event.kind === 'explosion' ? '✹' : isPhaseRupture ? '◈' : isPhaseChestBreak ? '▣' : isAnchorBreak ? '✹' : event.kind === 'jackpot' ? '♛' : isCombo || isWaldoFound ? '✦' : event.kind === 'bubbleLost' ? '○' : option?.fxGlyph ?? '✦';
  const particle = event.kind === 'explosion' ? '✦' : isPhaseRupture ? 'ϟ' : isPhaseChestBreak ? '◆' : isAnchorBreak ? '▰' : option?.fxParticle ?? '✦';
  const merchantBreak = event.kind === 'merchantBreak';
  const particleCount = isChargeBreak ? animation === 'charge-detonate' ? 24 : animation === 'charge-implosion' ? 16 : 20 : event.kind === 'exit' ? 18 : isPetRepair || isPetHatched ? 14 : isPhaseRupture || isPhaseChestBreak ? 18 : isWaldoFound || animation === 'orb-burst' ? 16 : animation === 'phoenix-rise' || animation === 'thunder-collapse' || animation === 'meteor-reform' ? 18 : animation === 'moth-bloom' ? 15 : animation === 'ion-launch' ? 12 : animation === 'mantis-snap' ? 14 : animation === 'reliquary-unseal' ? 18 : animation === 'astrolabe-awaken' ? 16 : animation === 'radiant-flare' || animation === 'chart-unfold' ? 18 : animation === 'ship-launch' ? 16 : animation === 'bazaar-opening' ? 15 : animation === 'chart-shatter' ? 14 : animation === 'glass-fracture' ? 18 : animation === 'gate-collapse' ? 13 : animation === 'aurora-bloom' ? 16 : animation === 'glassworld-pop' ? 18 : animation === 'inkblot-pop' ? 17 : animation === 'finder-spark' ? 15 : animation === 'waldo-triumph' ? 13 : animation === 'mint-solarburst' ? 20 : animation === 'ledger-rain' ? 16 : animation === 'prism-cascade' ? 18 : animation === 'mint-fracture' ? 13 : animation === 'ledger-fracture' ? 15 : animation === 'prism-fracture' ? 17 : animation === 'cocoon-unfurl' ? 16 : animation === 'eye-awakening' ? 12 : animation === 'scarab-emerge' ? 15 : animation === 'cocoon-crack' ? 10 : animation === 'pod-fracture' ? 12 : animation === 'shell-scatter' ? 14 : isBlast || merchantBreak ? 12 : event.kind === 'jackpot' ? 14 : animation === 'bubble-pop' ? (isBubblePop ? 14 : 8) : isCombo ? 12 : animation === 'credit-cascade' ? 16 : animation === 'credit-surge' ? 11 : event.kind === 'creditLost' || isEngiEggBreak ? 9 : animation === 'heart-beat' ? 6 : animation === 'seed-bloom' ? 12 : animation === 'electric-surge' ? 6 : animation === 'metal-shatter' ? 6 : animation === 'gear-shock' ? 10 : animation === 'piston-strike' ? 6 : animation === 'meteor-burst' || animation === 'heart-flare' ? 9 : animation === 'golden-cache' ? 8 : animation === 'ruby-shatter' ? 8 : animation === 'necrotic-spores' ? 10 : animation === 'speed-comet' ? 7 : animation === 'speed-ribbon' ? 8 : animation === 'speed-pulse' ? 10 : animation === 'coin-glint' ? 12 : animation === 'silver-shimmer' ? 10 : animation === 'compass-pulse' ? 8 : animation === 'sailcoin-glint' ? 11 : 7;
  const size = event.kind === 'exit' ? 172 : isPhaseRupture ? Math.max(100, Math.min(220, (event.amount ?? 65) * 2.4 * Math.min(sx, sy))) : isPhaseChestBreak ? 140 : isAnchorBreak ? 104 : isWaldoFound ? 138 : isBlast ? 132 : merchantBreak ? 112 : isCombo ? 106 : isBubblePop ? 96 : event.kind === 'bubbleLost' ? 60 : event.kind === 'creditLost' ? 110 : event.kind === 'jackpot' ? 150 : animation === 'mint-solarburst' ? 150 : animation === 'ledger-rain' ? 154 : animation === 'prism-cascade' ? 166 : animation === 'mint-fracture' ? 132 : animation === 'ledger-fracture' ? 142 : animation === 'prism-fracture' ? 158 : animation === 'cocoon-unfurl' ? 142 : animation === 'eye-awakening' ? 148 : animation === 'scarab-emerge' ? 158 : animation === 'cocoon-crack' ? 112 : animation === 'pod-fracture' ? 124 : animation === 'shell-scatter' ? 140 : animation === 'phoenix-rise' ? 158 : animation === 'moth-bloom' ? 164 : animation === 'thunder-collapse' ? 146 : animation === 'ion-launch' ? 142 : animation === 'mantis-snap' ? 148 : animation === 'meteor-reform' ? 156 : animation === 'reliquary-unseal' ? 162 : animation === 'astrolabe-awaken' ? 168 : animation === 'radiant-flare' ? 150 : animation === 'chart-unfold' ? 148 : animation === 'ship-launch' ? 156 : animation === 'bazaar-opening' ? 150 : animation === 'chart-shatter' ? 122 : animation === 'glass-fracture' ? 144 : animation === 'gate-collapse' ? 136 : animation === 'aurora-bloom' ? 160 : animation === 'glassworld-pop' ? 166 : animation === 'inkblot-pop' ? 154 : animation === 'finder-spark' ? 142 : animation === 'seed-bloom' || animation === 'heart-flare' || animation === 'orb-burst' ? 146 : animation === 'waldo-triumph' ? 132 : animation === 'heart-beat' || animation === 'ruby-shatter' || animation === 'necrotic-spores' ? 108 : animation === 'speed-comet' ? 116 : animation === 'speed-ribbon' ? 124 : animation === 'speed-pulse' ? 132 : animation === 'coin-glint' ? 126 : animation === 'silver-shimmer' ? 122 : animation === 'compass-pulse' ? 142 : animation === 'sailcoin-glint' ? 128 : 78;
  const burstLeft = event.x * sx - size / 2;
  const burstTop = event.y * sy - size / 2;
  const crackleCount = wall ? Math.max(4, Math.min(12, Math.ceil((wall.high - wall.low) / 46))) : 0;
  const opacity = progress.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 0] });
  const ringScale = event.kind === 'exit'
    ? progress.interpolate({ inputRange: [0, 0.12, 0.3, 0.56, 1], outputRange: [0.08, 0.76, 0.42, 1.18, 2] })
    : animation === 'charge-detonate'
    ? progress.interpolate({ inputRange: [0, 0.12, 0.34, 1], outputRange: [0.06, 0.42, 1.2, 2.4] })
    : animation === 'charge-shatter'
    ? progress.interpolate({ inputRange: [0, 0.16, 0.46, 1], outputRange: [0.12, 1.18, 0.76, 1.9] })
    : animation === 'charge-implosion'
    ? progress.interpolate({ inputRange: [0, 0.3, 0.62, 1], outputRange: [1.6, 0.2, 0.58, 2.1] })
    : animation === 'mantis-snap'
    ? progress.interpolate({ inputRange: [0, 0.18, 0.34, 0.7, 1], outputRange: [0.15, 0.7, 0.42, 1.15, 1.8] })
    : animation === 'meteor-reform'
    ? progress.interpolate({ inputRange: [0, 0.2, 0.43, 0.78, 1], outputRange: [0.12, 1.25, 0.55, 1.4, 1.95] })
    : animation === 'reliquary-unseal'
    ? progress.interpolate({ inputRange: [0, 0.16, 0.42, 0.72, 1], outputRange: [0.08, 0.55, 1.18, 1.7, 2.15] })
    : animation === 'astrolabe-awaken'
    ? progress.interpolate({ inputRange: [0, 0.2, 0.5, 0.8, 1], outputRange: [0.1, 0.85, 0.5, 1.35, 2.1] })
    : animation === 'chart-unfold'
    ? progress.interpolate({ inputRange: [0, 0.18, 0.42, 0.72, 1], outputRange: [0.08, 0.5, 1.1, 1.6, 2] })
    : animation === 'ship-launch'
    ? progress.interpolate({ inputRange: [0, 0.2, 0.48, 0.72, 1], outputRange: [0.08, 0.68, 0.9, 1.38, 2.1] })
    : animation === 'bazaar-opening'
    ? progress.interpolate({ inputRange: [0, 0.18, 0.4, 0.68, 1], outputRange: [0.12, 0.55, 1.15, 1.5, 2] })
    : animation === 'aurora-bloom'
    ? progress.interpolate({ inputRange: [0, 0.16, 0.38, 0.7, 1], outputRange: [0.08, 0.48, 1.22, 1.58, 2.05] })
    : animation === 'glassworld-pop'
    ? progress.interpolate({ inputRange: [0, 0.18, 0.4, 0.68, 1], outputRange: [0.12, 0.7, 1.45, 1.1, 2.1] })
    : animation === 'inkblot-pop'
    ? progress.interpolate({ inputRange: [0, 0.14, 0.36, 0.62, 1], outputRange: [0.08, 0.9, 1.35, 0.82, 2.2] })
    : animation === 'finder-spark'
    ? progress.interpolate({ inputRange: [0, 0.16, 0.42, 0.72, 1], outputRange: [0.1, 0.68, 1.3, 1.05, 2] })
    : animation === 'thunder-collapse'
    ? progress.interpolate({ inputRange: [0, 0.22, 0.52, 1], outputRange: [1.65, 0.42, 1.1, 1.75] })
    : animation === 'ion-launch'
    ? progress.interpolate({ inputRange: [0, 0.18, 0.58, 1], outputRange: [0.12, 0.7, 1.15, 1.9] })
    : animation === 'phoenix-rise'
    ? progress.interpolate({ inputRange: [0, 0.2, 0.58, 1], outputRange: [0.08, 0.72, 1.28, 1.95] })
    : animation === 'moth-bloom'
    ? progress.interpolate({ inputRange: [0, 0.22, 0.62, 1], outputRange: [0.08, 0.58, 1.15, 1.9] })
    : isCombo
    ? progress.interpolate({ inputRange: [0, 0.18, 0.5, 1], outputRange: [0.1, 0.72, 1.08, 1.7] })
    : animation === 'bubble-pop'
    ? progress.interpolate({ inputRange: [0, 0.28, 0.52, 1], outputRange: [0.12, 0.72, 1.55, 1.9] })
    : animation === 'compass-pulse'
    ? progress.interpolate({ inputRange: [0, 0.2, 0.42, 0.67, 1], outputRange: [0.15, 0.65, 1.1, 0.86, 1.7] })
    : animation === 'coin-glint' || animation === 'silver-shimmer' || animation === 'sailcoin-glint'
    ? progress.interpolate({ inputRange: [0, 0.18, 0.5, 1], outputRange: [0.1, 0.82, 1.2, 1.65] })
    : animation === 'radiant-flare'
    ? progress.interpolate({ inputRange: [0, 0.14, 0.38, 0.68, 1], outputRange: [0.08, 0.6, 1.4, 1.1, 2.25] })
    : animation === 'heart-beat'
    ? progress.interpolate({ inputRange: [0, 0.18, 0.34, 0.52, 0.7, 1], outputRange: [0.12, 0.7, 0.5, 1, 1.15, 1.5] })
    : animation === 'seed-bloom'
      ? progress.interpolate({ inputRange: [0, 0.22, 0.58, 1], outputRange: [0.12, 0.7, 1.25, 1.65] })
      : progress.interpolate({ inputRange: [0, 1], outputRange: [0.12, isBlast ? 1.65 : 1.35] });
  const coreScale = event.kind === 'exit'
    ? progress.interpolate({ inputRange: [0, 0.16, 0.34, 0.62, 1], outputRange: [0.1, 1.28, 0.64, 1.16, 0.02] })
    : animation === 'mantis-snap'
    ? progress.interpolate({ inputRange: [0, 0.24, 0.42, 0.68, 1], outputRange: [0.15, 1, 0.15, 1.18, 0.2] })
    : animation === 'meteor-reform'
    ? progress.interpolate({ inputRange: [0, 0.18, 0.45, 0.72, 1], outputRange: [0.45, 1.35, 0.18, 1.1, 0.22] })
    : animation === 'radiant-flare'
    ? progress.interpolate({ inputRange: [0, 0.12, 0.28, 0.5, 0.78, 1], outputRange: [0.08, 1.35, 0.72, 1.42, 1, 0.02] })
    : animation === 'reliquary-unseal'
    ? progress.interpolate({ inputRange: [0, 0.12, 0.35, 0.58, 1], outputRange: [0.1, 0.8, 1.35, 0.42, 0.05] })
    : animation === 'astrolabe-awaken'
    ? progress.interpolate({ inputRange: [0, 0.18, 0.4, 0.7, 1], outputRange: [0.08, 0.45, 1.3, 0.92, 0.02] })
    : animation === 'chart-unfold'
    ? progress.interpolate({ inputRange: [0, 0.12, 0.3, 0.6, 1], outputRange: [0.08, 0.5, 1.24, 0.9, 0.03] })
    : animation === 'ship-launch'
    ? progress.interpolate({ inputRange: [0, 0.15, 0.42, 0.7, 1], outputRange: [0.02, 0.68, 1.3, 0.82, 0.04] })
    : animation === 'bazaar-opening'
    ? progress.interpolate({ inputRange: [0, 0.16, 0.4, 0.72, 1], outputRange: [0.04, 0.75, 1.2, 0.72, 0.02] })
    : animation === 'aurora-bloom'
    ? progress.interpolate({ inputRange: [0, 0.14, 0.32, 0.58, 1], outputRange: [0.05, 1.24, 0.72, 1.18, 0.02] })
    : animation === 'glassworld-pop'
    ? progress.interpolate({ inputRange: [0, 0.16, 0.38, 0.62, 1], outputRange: [0.04, 1.36, 0.64, 1.1, 0.02] })
    : animation === 'inkblot-pop'
    ? progress.interpolate({ inputRange: [0, 0.12, 0.34, 0.66, 1], outputRange: [0.04, 1.28, 0.36, 1.18, 0.02] })
    : animation === 'finder-spark'
    ? progress.interpolate({ inputRange: [0, 0.14, 0.32, 0.6, 1], outputRange: [0.08, 1.3, 0.62, 1.18, 0.04] })
    : animation === 'thunder-collapse'
    ? progress.interpolate({ inputRange: [0, 0.25, 0.43, 1], outputRange: [0.85, 0.12, 1.45, 0.06] })
    : animation === 'ion-launch'
    ? progress.interpolate({ inputRange: [0, 0.22, 0.65, 1], outputRange: [0.25, 1.15, 0.92, 0.08] })
    : animation === 'phoenix-rise'
    ? progress.interpolate({ inputRange: [0, 0.14, 0.36, 0.72, 1], outputRange: [0.18, 1.35, 0.82, 1.12, 0.06] })
    : animation === 'moth-bloom'
    ? progress.interpolate({ inputRange: [0, 0.2, 0.5, 0.78, 1], outputRange: [0.15, 0.84, 1.2, 1.45, 0.1] })
    : animation === 'bubble-pop'
    ? progress.interpolate({ inputRange: [0, 0.34, 0.52, 1], outputRange: [0.72, 0.62, 1.55, 0.12] })
    : animation === 'heart-beat'
    ? progress.interpolate({ inputRange: [0, 0.15, 0.3, 0.47, 0.63, 1], outputRange: [0.35, 1.24, 0.91, 1.16, 0.98, 0.25] })
    : animation === 'seed-bloom'
      ? progress.interpolate({ inputRange: [0, 0.18, 0.48, 0.72, 1], outputRange: [0.25, 1.1, 1.42, 1.18, 0.35] })
      : progress.interpolate({ inputRange: [0, 0.16, 0.34, 1], outputRange: [0.25, 1.3, 1, 0.45] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '155deg'] });
  const ringStyle = event.kind === 'exit' ? sectorCaptureStyles.ring : isPhaseRupture ? specialFxStyles.burstPhaseRing : isPhaseChestBreak ? specialFxStyles.burstTreasureRing : isAnchorBreak ? specialFxStyles.burstAnchorRing : skewerAnimation ? styles.burstSkewerRing : isWaldoFound || animation === 'orb-burst' || animation === 'waldo-triumph' ? styles.burstOrbitRing : animation === 'bubble-pop' || animation === 'credit-surge' || animation === 'drone-spark' || animation === 'thunder-collapse' ? styles.burstElectricRing : animation === 'heart-beat' || animation === 'heart-flare' || animation === 'phoenix-rise' ? styles.burstHeartRing : animation === 'seed-bloom' || animation === 'necrotic-spores' || animation === 'moth-bloom' ? styles.burstSeedRing : animation === 'electric-surge' || animation === 'speed-pulse' ? styles.burstElectricRing : animation === 'metal-shatter' || animation === 'ruby-shatter' || animation === 'reliquary-unseal' || animation === 'astrolabe-awaken' || animation === 'radiant-flare' || animation === 'coin-glint' || animation === 'silver-shimmer' || animation === 'sailcoin-glint' || animation === 'token-fracture' || animation === 'credit-cascade' || animation === 'meteor-reform' ? styles.burstMetalRing : animation === 'gear-shock' || animation === 'speed-ribbon' || animation === 'compass-pulse' || animation === 'ion-launch' || animation === 'mantis-snap' ? styles.burstGearRing : styles.burstRing;
  return <Animated.View pointerEvents="none" style={[styles.burstStage, { left: burstLeft, top: burstTop, width: size, height: size, opacity }]}>
    {animation === 'skiff-warp' && <>
      <Animated.View style={{ position: 'absolute', left: '10%', top: '42%', width: '80%', height: 8, borderRadius: 999, backgroundColor: accent, shadowColor: color, shadowOpacity: 1, shadowRadius: 18, opacity, transform: [{ scaleX: progress.interpolate({ inputRange: [0, 0.12, 0.7, 1], outputRange: [0.05, 1.1, 1.4, 0.05] }) }, { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.22, size * 0.36] }) }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '26%', color: accent, fontSize: size * 0.58, fontWeight: '900', textShadowColor: color, textShadowRadius: 20, transform: [{ scale: coreScale }, { translateX: progress.interpolate({ inputRange: [0, 0.26, 0.7, 1], outputRange: [-size * 0.12, 0, size * 0.18, size * 0.55] }) }] }}>➤</Animated.Text>
      <Animated.View style={{ position: 'absolute', left: '21%', top: '22%', width: '58%', height: '56%', borderWidth: 2, borderColor: accent, borderRadius: 18, opacity, transform: [{ skewX: '-16deg' }, { scale: ringScale }] }} />
      {Array.from({ length: 5 }, (_, i) => <Animated.View key={`skiff-streak-${i}`} style={{ position: 'absolute', left: '14%', top: `${22 + i * 13}%`, width: '46%', height: 2, backgroundColor: i % 2 ? color : accent, opacity, transform: [{ scaleX: progress.interpolate({ inputRange: [0, 0.2 + i * 0.04, 1], outputRange: [0.04, 1, 0.05] }) }] }} />)}
    </>}
    {animation === 'folded-transit' && <>
      {[0, 1, 2].map(i => <Animated.View key={`foldgate-${i}`} style={{ position: 'absolute', left: `${21 + i * 7}%`, top: `${18 + i * 7}%`, width: `${58 - i * 14}%`, height: `${64 - i * 14}%`, borderWidth: 3 - i * 0.5, borderColor: i % 2 ? color : accent, borderRadius: i === 1 ? 999 : 8, opacity: progress.interpolate({ inputRange: [0, 0.15 + i * 0.08, 0.7, 1], outputRange: [0, 0.95, 0.85, 0] }), transform: [{ rotate: `${i % 2 ? -45 : 45}deg` }, { scale: progress.interpolate({ inputRange: [0, 0.22 + i * 0.06, 0.65, 1], outputRange: [0.35, 1.05, 0.8, i === 2 ? 0.06 : 1.65] }) }] }} />)}
      <Animated.View style={{ position: 'absolute', left: '38%', top: '38%', width: '24%', height: '24%', borderWidth: 2, borderColor: '#fff', backgroundColor: `${color}99`, opacity, transform: [{ rotate: '45deg' }, { scale: progress.interpolate({ inputRange: [0, 0.25, 0.55, 1], outputRange: [0.3, 1.15, 0.72, 0.02] }) }], shadowColor: accent, shadowOpacity: 1, shadowRadius: 15 }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '28%', color: accent, fontSize: size * 0.44, fontWeight: '900', textShadowColor: color, textShadowRadius: 18, opacity, transform: [{ scale: coreScale }] }}>»</Animated.Text>
    </>}
    {animation === 'mint-solarburst' && <>
      {[0, 1, 2].map(i => <Animated.View key={`mint-ring-${i}`} style={{ position: 'absolute', left: '18%', top: '18%', width: '64%', height: '64%', borderRadius: 999, borderWidth: i === 1 ? 2 : 4, borderColor: i === 1 ? accent : color, opacity: progress.interpolate({ inputRange: [0, 0.16 + i * 0.1, 1], outputRange: [0, 0.95, 0] }), transform: [{ scale: progress.interpolate({ inputRange: [0, 0.18 + i * 0.08, 1], outputRange: [0.3, 0.72, 1.85 + i * 0.18] }) }] }} />)}
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '25%', color: accent, fontSize: size * 0.48, fontWeight: '900', textShadowColor: color, textShadowRadius: 18, transform: [{ scale: coreScale }] }}>☼</Animated.Text>
      {Array.from({ length: 8 }, (_, i) => <Animated.Text key={`mint-ray-${i}`} style={{ position: 'absolute', left: '45%', top: '44%', color: i % 2 ? accent : color, fontSize: 17, opacity, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(i * Math.PI / 4) * size * 0.45] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(i * Math.PI / 4) * size * 0.45] }) }, { rotate: `${i * 45}deg` }] }}>¤</Animated.Text>)}
    </>}
    {animation === 'ledger-rain' && <>
      <Animated.View style={{ position: 'absolute', left: '16%', top: '28%', width: '68%', height: '46%', borderWidth: 2, borderColor: accent, borderRadius: 8, opacity, transform: [{ skewX: '-12deg' }, { scale: ringScale }] }} />
      {[0, 1, 2, 3, 4].map(i => <Animated.Text key={`ledger-drop-${i}`} style={{ position: 'absolute', left: `${19 + i * 14}%`, top: '16%', color: i % 2 ? accent : color, fontSize: 15, fontWeight: '900', opacity: progress.interpolate({ inputRange: [0, 0.12 + i * 0.06, 0.72 + i * 0.035, 1], outputRange: [0, 1, 0.9, 0] }), transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-8, size * (0.48 + (i % 2) * 0.12)] }) }] }}>{i % 2 ? '¤' : '▱'}</Animated.Text>)}
      {[0, 1, 2].map(i => <Animated.View key={`ledger-lane-${i}`} style={{ position: 'absolute', left: '24%', top: `${38 + i * 11}%`, width: '52%', height: 2, backgroundColor: accent, opacity: progress.interpolate({ inputRange: [0, 0.24 + i * 0.1, 0.8, 1], outputRange: [0, 1, 0.7, 0] }), transform: [{ scaleX: progress.interpolate({ inputRange: [0, 0.32 + i * 0.08, 1], outputRange: [0.05, 1, 0.3] }) }] }} />)}
    </>}
    {animation === 'prism-cascade' && <>
      <Animated.View style={{ position: 'absolute', left: '24%', top: '18%', width: '52%', height: '66%', borderWidth: 3, borderColor: accent, backgroundColor: `${color}55`, transform: [{ rotate: '45deg' }, { scale: coreScale }], shadowColor: color, shadowOpacity: 1, shadowRadius: 18 }} />
      <Animated.View style={{ position: 'absolute', left: '37%', top: '30%', width: '26%', height: '42%', borderWidth: 2, borderColor: '#fff', backgroundColor: `${accent}66`, transform: [{ rotate: '45deg' }, { scale: coreScale }] }} />
      {Array.from({ length: 6 }, (_, i) => <Animated.View key={`prism-facet-${i}`} style={{ position: 'absolute', left: '45%', top: '42%', width: 8 + (i % 2) * 4, height: 18 + (i % 3) * 5, borderWidth: 1, borderColor: accent, backgroundColor: `${color}99`, opacity, transform: [{ rotate: `${i * 60}deg` }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -size * (0.32 + (i % 3) * 0.08)] }) }, { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(i * Math.PI / 3) * size * 0.22] }) }] }} />)}
    </>}
    {animation === 'mint-fracture' && Array.from({ length: 9 }, (_, i) => <Animated.View key={`mint-shard-${i}`} style={{ position: 'absolute', left: '47%', top: '47%', width: 5 + (i % 3) * 2, height: 14 + (i % 2) * 8, borderRadius: 2, backgroundColor: i % 2 ? accent : color, opacity, transform: [{ rotate: `${i * 40}deg` }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -size * (0.24 + (i % 3) * 0.07)] }) }, { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(i * Math.PI / 4.5) * size * 0.34] }) }] }}/>)}
    {animation === 'ledger-fracture' && <>
      <Animated.View style={{ position: 'absolute', left: '22%', top: '29%', width: '56%', height: '42%', borderWidth: 2, borderColor: accent, opacity, transform: [{ rotate: '-12deg' }, { scale: ringScale }] }} />
      {Array.from({ length: 6 }, (_, i) => <Animated.View key={`ledger-crack-${i}`} style={{ position: 'absolute', left: '49%', top: '27%', width: 2, height: size * 0.25, backgroundColor: i % 2 ? accent : color, opacity, transform: [{ rotate: `${i * 58 - 120}deg` }, { scaleY: progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.05, 1, 1.3] }) }] }} />)}
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '28%', color: accent, fontSize: size * 0.36, fontWeight: '900', opacity, transform: [{ scale: coreScale }] }}>¤</Animated.Text>
    </>}
    {animation === 'prism-fracture' && <>
      <Animated.View style={{ position: 'absolute', left: '31%', top: '20%', width: '38%', height: '60%', borderWidth: 2, borderColor: accent, backgroundColor: `${color}55`, transform: [{ rotate: '45deg' }, { scale: ringScale }] }} />
      {Array.from({ length: 7 }, (_, i) => <Animated.View key={`prism-shard-${i}`} style={{ position: 'absolute', left: '46%', top: '43%', width: 8, height: 18 + (i % 3) * 5, backgroundColor: i % 2 ? accent : color, borderWidth: 1, borderColor: '#fff', opacity, transform: [{ rotate: `${i * 51}deg` }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -size * (0.28 + (i % 3) * 0.08)] }) }, { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(i) * size * 0.4] }) }] }} />)}
    </>}
    {animation === 'cocoon-unfurl' && <>
      <Animated.View style={{ position: 'absolute', left: '28%', top: '27%', width: '44%', height: '46%', borderWidth: 3, borderColor: accent, borderRadius: 999, backgroundColor: `${color}66`, opacity, transform: [{ scale: coreScale }] }} />
      {[0, 1, 2, 3].map(i => <Animated.View key={`hatch-petal-${i}`} style={{ position: 'absolute', left: '43%', top: '10%', width: '14%', height: '37%', borderWidth: 2, borderColor: accent, borderTopLeftRadius: 18, borderTopRightRadius: 18, backgroundColor: `${color}bb`, opacity, transform: [{ rotate: `${i * 90}deg` }, { translateY: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, -size * 0.12, -size * 0.4] }) }] }} />)}
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '34%', color: accent, fontSize: size * 0.38, textShadowColor: color, textShadowRadius: 16, opacity, transform: [{ scale: coreScale }] }}>⌘</Animated.Text>
    </>}
    {animation === 'eye-awakening' && <>
      <Animated.View style={{ position: 'absolute', left: '15%', top: '27%', width: '70%', height: '46%', borderWidth: 3, borderColor: accent, borderRadius: 999, opacity, transform: [{ scaleX: ringScale }, { scaleY: coreScale }] }} />
      <Animated.View style={{ position: 'absolute', left: '33%', top: '33%', width: '34%', height: '34%', borderWidth: 3, borderColor: accent, borderRadius: 999, backgroundColor: color, shadowColor: accent, shadowOpacity: 1, shadowRadius: 20, transform: [{ scale: progress.interpolate({ inputRange: [0, 0.2, 0.4, 0.7, 1], outputRange: [0.05, 0.4, 1.25, 1, 0.05] }) }] }} />
      <Animated.View style={{ position: 'absolute', left: '46%', top: '43%', width: '8%', height: '14%', borderRadius: 999, backgroundColor: '#fff', opacity, transform: [{ scaleY: progress.interpolate({ inputRange: [0, 0.3, 0.52, 0.8, 1], outputRange: [0.1, 0.1, 1.1, 1, 0.1] }) }] }} />
    </>}
    {animation === 'scarab-emerge' && <>
      {[0, 1].map(i => <Animated.View key={`scarab-shell-${i}`} style={{ position: 'absolute', left: i ? '49%' : '17%', top: '22%', width: '34%', height: '56%', borderWidth: 3, borderColor: accent, borderRadius: 18, backgroundColor: `${color}99`, opacity, transform: [{ rotate: i ? '25deg' : '-25deg' }, { translateX: progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, i ? size * 0.16 : -size * 0.16, i ? size * 0.38 : -size * 0.38] }) }] }} />)}
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '38%', color: accent, fontSize: size * 0.4, textShadowColor: color, textShadowRadius: 18, opacity, transform: [{ scale: coreScale }, { translateY: progress.interpolate({ inputRange: [0, 0.32, 1], outputRange: [size * 0.18, 0, -size * 0.18] }) }] }}>⌑</Animated.Text>
    </>}
    {animation === 'cocoon-crack' && <>
      <Animated.View style={{ position: 'absolute', left: '24%', top: '24%', width: '52%', height: '52%', borderWidth: 3, borderColor: accent, borderRadius: 13, opacity, transform: [{ rotate: '8deg' }, { scale: ringScale }] }} />
      {[0, 1, 2, 3].map(i => <Animated.View key={`cocoon-split-${i}`} style={{ position: 'absolute', left: '49%', top: '25%', width: 3, height: size * 0.31, backgroundColor: i % 2 ? accent : color, opacity, transform: [{ rotate: `${i * 45 - 67}deg` }, { scaleY: ringScale }] }} />)}
    </>}
    {animation === 'pod-fracture' && <>
      <Animated.View style={{ position: 'absolute', left: '28%', top: '29%', width: '44%', height: '44%', borderWidth: 3, borderColor: accent, borderRadius: 999, opacity, transform: [{ scale: ringScale }] }} />
      {[0, 1, 2, 3, 4, 5].map(i => <Animated.View key={`pod-facet-${i}`} style={{ position: 'absolute', left: '47%', top: '25%', width: 7, height: 20, borderWidth: 1, borderColor: accent, backgroundColor: color, opacity, transform: [{ rotate: `${i * 60}deg` }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.4] }) }] }} />)}
    </>}
    {animation === 'shell-scatter' && <>
      {Array.from({ length: 8 }, (_, i) => <Animated.View key={`shell-piece-${i}`} style={{ position: 'absolute', left: '45%', top: '42%', width: 8 + i % 3 * 3, height: 14 + i % 2 * 7, borderWidth: 1.5, borderColor: accent, borderRadius: 5, backgroundColor: color, opacity, transform: [{ rotate: `${i * 45}deg` }, { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(i * Math.PI / 4) * size * 0.42] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(i * Math.PI / 4) * size * 0.42] }) }] }} />)}
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '37%', color: accent, fontSize: size * 0.27, fontWeight: '900', opacity, transform: [{ scale: coreScale }] }}>⌑</Animated.Text>
    </>}
    {isBlast && <><Animated.View style={[styles.blastFlash, { backgroundColor: event.kind === 'ramBlast' ? color : '#ffb43d', transform: [{ scale: progress.interpolate({ inputRange: [0, 0.13, 1], outputRange: [0.1, 1, 0.05] }) }] }]} /><Animated.View style={[styles.blastInnerRing, { borderColor: accent, transform: [{ scale: ringScale }] }]} /></>}
    {skewerAnimation && wall && <>
      <Animated.View style={[styles.skewerWallFlash, wall.axis === 'vertical'
        ? { left: wall.at * sx - burstLeft - 5, top: wall.low * sy - burstTop, width: 10, height: Math.max(1, (wall.high - wall.low) * sy) }
        : { left: wall.low * sx - burstLeft, top: wall.at * sy - burstTop - 5, width: Math.max(1, (wall.high - wall.low) * sx), height: 10 },
        { opacity: progress.interpolate({ inputRange: [0, 0.08, 0.22, 0.38, 0.52, 0.68, 0.84, 1], outputRange: [0, 1, 0.22, 0.92, 0.28, 1, 0.16, 0] }), transform: wall.axis === 'vertical'
          ? [{ scaleY: progress.interpolate({ inputRange: [0, 0.12, 0.8, 1], outputRange: [0.15, 1, 1, 1.06] }) }]
          : [{ scaleX: progress.interpolate({ inputRange: [0, 0.12, 0.8, 1], outputRange: [0.15, 1, 1, 1.06] }) }] }]} />
      {Array.from({ length: crackleCount }, (_, i) => {
        const fraction = (i + 0.5) / crackleCount;
        const flicker = progress.interpolate({ inputRange: [0, 0.09 + (i % 3) * 0.025, 0.18 + (i % 2) * 0.035, 0.31, 0.43 + (i % 3) * 0.02, 0.57, 0.7 + (i % 2) * 0.03, 0.86, 1], outputRange: [0, 1, 0.12, 0.85, 0.1, 1, 0.16, 0.9, 0] });
        return <Animated.Text key={`wall-crackle-${i}`} style={[styles.skewerCrackle, wall.axis === 'vertical'
          ? { left: wall.at * sx - burstLeft - 9 + (i % 2 ? 5 : -4), top: wall.low * sy - burstTop + fraction * (wall.high - wall.low) * sy - 9 }
          : { left: wall.low * sx - burstLeft + fraction * (wall.high - wall.low) * sx - 9, top: wall.at * sy - burstTop - 12 + (i % 2 ? 4 : -3) },
          { opacity: flicker, transform: [{ rotate: `${(i % 2 ? 1 : -1) * (16 + i * 9)}deg` }, { scale: progress.interpolate({ inputRange: [0, 0.12, 0.25, 1], outputRange: [0.35, 1.3, 0.8, 0.2] }) }] }]}>{i % 2 ? 'ϟ' : '⚡'}</Animated.Text>;
      })}
    </>}
    {skewerAnimation && <Animated.View style={[styles.burstSkewerLine, { backgroundColor: '#e6fcff', shadowColor: '#278dff', transform: [{ rotate: skewerAxis === 'vertical' ? '90deg' : '0deg' }, { scaleX: progress.interpolate({ inputRange: [0, 0.12, 0.72, 1], outputRange: [0.02, 1.18, 0.9, 1.35] }) }] }]} />}
    {animation === 'mantis-snap' && <>
      <Animated.View style={[{ position: 'absolute', left: '18%', top: '20%', width: '64%', height: '23%', borderWidth: 3, borderColor: accent, borderRadius: 8, backgroundColor: color, shadowColor: color, shadowOpacity: 1, shadowRadius: 13 }, { transform: [{ rotate: '-8deg' }, { translateY: progress.interpolate({ inputRange: [0, 0.2, 0.38, 0.62, 1], outputRange: [-size * 0.22, -size * 0.22, size * 0.1, -size * 0.17, -size * 0.28] }) }] }]} />
      <Animated.View style={[{ position: 'absolute', left: '18%', bottom: '20%', width: '64%', height: '23%', borderWidth: 3, borderColor: accent, borderRadius: 8, backgroundColor: color, shadowColor: color, shadowOpacity: 1, shadowRadius: 13 }, { transform: [{ rotate: '8deg' }, { translateY: progress.interpolate({ inputRange: [0, 0.2, 0.38, 0.62, 1], outputRange: [size * 0.22, size * 0.22, -size * 0.1, size * 0.17, size * 0.28] }) }] }]} />
      <Animated.View style={{ position: 'absolute', width: '24%', height: '24%', alignSelf: 'center', top: '38%', borderRadius: 999, backgroundColor: accent, shadowColor: color, shadowOpacity: 1, shadowRadius: 18, opacity, transform: [{ scale: coreScale }] }} />
    </>}
    {animation === 'meteor-reform' && <>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y], index) => <Animated.View key={`meteor-chip-${index}`} style={{ position: 'absolute', left: '43%', top: '43%', width: '16%', height: '16%', borderWidth: 1.5, borderColor: accent, backgroundColor: color, transform: [{ rotate: `${index * 31}deg` }, { translateX: progress.interpolate({ inputRange: [0, 0.18, 0.46, 0.76, 1], outputRange: [0, x * size * 0.38, x * size * 0.5, x * size * 0.16, 0] }) }, { translateY: progress.interpolate({ inputRange: [0, 0.18, 0.46, 0.76, 1], outputRange: [0, y * size * 0.38, y * size * 0.5, y * size * 0.16, 0] }) }, { scale: progress.interpolate({ inputRange: [0, 0.18, 0.5, 0.78, 1], outputRange: [0.2, 1.2, 1, 1.1, 0.15] }) }] }} />)}
      <Animated.View style={{ position: 'absolute', width: '28%', height: '28%', alignSelf: 'center', top: '36%', borderRadius: 999, backgroundColor: accent, shadowColor: color, shadowOpacity: 1, shadowRadius: 20, opacity, transform: [{ scale: coreScale }] }} />
    </>}
    {animation === 'thunder-collapse' && <>
      <Animated.View style={{ position: 'absolute', left: '12%', top: '47%', width: '76%', height: 4, borderRadius: 99, backgroundColor: accent, shadowColor: color, shadowOpacity: 1, shadowRadius: 12, transform: [{ rotate: '-38deg' }, { scaleX: progress.interpolate({ inputRange: [0, 0.28, 0.65, 1], outputRange: [1.2, 0.35, 1.25, 0.12] }) }] }} />
      <Animated.View style={{ position: 'absolute', left: '12%', top: '47%', width: '76%', height: 3, borderRadius: 99, backgroundColor: color, shadowColor: accent, shadowOpacity: 1, shadowRadius: 10, transform: [{ rotate: '38deg' }, { scaleX: progress.interpolate({ inputRange: [0, 0.25, 0.68, 1], outputRange: [1.1, 0.28, 1.3, 0.08] }) }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '23%', color: accent, fontSize: size * 0.52, fontWeight: '900', textShadowColor: color, textShadowRadius: 18, transform: [{ scale: coreScale }] }}>ϟ</Animated.Text>
    </>}
    {animation === 'ion-launch' && <>
      <Animated.View style={{ position: 'absolute', left: '-10%', top: '45%', width: '120%', height: 6, borderRadius: 999, backgroundColor: color, shadowColor: accent, shadowOpacity: 1, shadowRadius: 14, opacity, transform: [{ scaleX: progress.interpolate({ inputRange: [0, 0.2, 0.55, 1], outputRange: [0.04, 1.1, 1.45, 0.18] }) }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '23%', color: accent, fontSize: size * 0.54, fontWeight: '900', textShadowColor: color, textShadowRadius: 16, transform: [{ scale: coreScale }, { translateX: progress.interpolate({ inputRange: [0, 0.24, 1], outputRange: [-size * 0.08, size * 0.12, size * 0.42] }) }] }}>➤</Animated.Text>
      <Animated.View style={{ position: 'absolute', left: '27%', top: '30%', width: '46%', height: '40%', borderWidth: 2, borderColor: accent, borderRadius: 8, opacity, transform: [{ skewX: '-25deg' }, { scale: progress.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0.4, 1.05, 0.2] }) }] }} />
    </>}
    {animation === 'phoenix-rise' && <>
      <Animated.View style={{ position: 'absolute', left: '8%', top: '28%', width: '42%', height: '30%', borderTopWidth: 5, borderColor: accent, borderRadius: 999, shadowColor: color, shadowOpacity: 1, shadowRadius: 12, opacity, transform: [{ rotate: '-34deg' }, { scale: progress.interpolate({ inputRange: [0, 0.22, 1], outputRange: [0.2, 1.1, 1.6] }) }] }} />
      <Animated.View style={{ position: 'absolute', right: '8%', top: '28%', width: '42%', height: '30%', borderTopWidth: 5, borderColor: accent, borderRadius: 999, shadowColor: color, shadowOpacity: 1, shadowRadius: 12, opacity, transform: [{ rotate: '34deg' }, { scale: progress.interpolate({ inputRange: [0, 0.22, 1], outputRange: [0.2, 1.1, 1.6] }) }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '22%', color: accent, fontSize: size * 0.43, fontWeight: '900', textShadowColor: color, textShadowRadius: 14, opacity, transform: [{ scale: coreScale }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, -size * 0.25] }) }] }}>♨</Animated.Text>
    </>}
    {animation === 'moth-bloom' && <>
      <Animated.View style={{ position: 'absolute', left: '10%', top: '24%', width: '42%', height: '38%', borderTopLeftRadius: 999, borderTopRightRadius: 999, borderWidth: 2, borderColor: accent, backgroundColor: `${color}44`, shadowColor: accent, shadowOpacity: 1, shadowRadius: 14, opacity, transform: [{ rotate: '-28deg' }, { scaleX: progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.2, 1.25, 1.65] }) }] }} />
      <Animated.View style={{ position: 'absolute', right: '10%', top: '24%', width: '42%', height: '38%', borderTopLeftRadius: 999, borderTopRightRadius: 999, borderWidth: 2, borderColor: accent, backgroundColor: `${color}44`, shadowColor: accent, shadowOpacity: 1, shadowRadius: 14, opacity, transform: [{ rotate: '28deg' }, { scaleX: progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.2, 1.25, 1.65] }) }] }} />
      <Animated.View style={{ position: 'absolute', width: '18%', height: '26%', alignSelf: 'center', top: '41%', borderWidth: 2, borderColor: accent, backgroundColor: `${accent}bb`, shadowColor: accent, shadowOpacity: 1, shadowRadius: 16, opacity, transform: [{ scale: coreScale }] }} />
    </>}
    {isCombo && <Animated.Text style={[styles.comboBadge, { opacity, transform: [{ scale: progress.interpolate({ inputRange: [0, 0.2, 0.65, 1], outputRange: [0.3, 1.18, 1, 0.75] }) }] }]}>COMBO ×{event.comboCount ?? 2}</Animated.Text>}
    {(isPetRepair || isPetHatched || isPetLost || isEngiEggBreak) && <Animated.Text style={[styles.engiBurstLabel, { color: accent, textShadowColor: color, opacity, transform: [{ scale: coreScale }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [7, -24] }) }] }]}>{isPetRepair ? 'WALL RESTORED' : isPetHatched ? 'ENGI HATCHED' : isPetLost ? 'ENGI LOST' : 'COCOON BROKEN'}</Animated.Text>}
    {event.kind !== 'explosion' && <Animated.View style={[ringStyle, { borderColor: color, transform: [...(isPhaseRupture ? [{ scaleX: Math.max(0.65, Math.min(1.35, ((event.amountY ?? event.amount ?? 1) * sy) / ((event.amount ?? 1) * sx))) } as const] : []), { scale: ringScale }, ...(animation === 'gear-shock' || animation === 'compass-pulse' ? [{ rotate } as const] : [])] }]} />}
    {event.kind === 'exit' && <>
      <Animated.View style={[sectorCaptureStyles.inner, { borderColor: accent, opacity, transform: [{ scale: progress.interpolate({ inputRange: [0, 0.2, 0.62, 1], outputRange: [0.2, 0.72, 1.12, 1.8] }) }, { rotate }] }]} />
      <Animated.View style={[sectorCaptureStyles.wake, { backgroundColor: accent, opacity: progress.interpolate({ inputRange: [0, 0.08, 0.42, 0.7, 1], outputRange: [0, 0.95, 0.65, 0.22, 0] }), transform: [{ rotate: '-28deg' }, { scaleX: progress.interpolate({ inputRange: [0, 0.12, 0.45, 1], outputRange: [0.05, 1.25, 1, 1.8] }) }] }]} />
      <Animated.Text style={[sectorCaptureStyles.label, { color: accent, opacity, transform: [{ scale: coreScale }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [3, -size * 0.27] }) }] }]}>ROUTE SYNCHRONIZED</Animated.Text>
    </>}
    {(animation === 'orb-burst' || animation === 'waldo-triumph') && <Animated.View style={[styles.burstOrbitInner, { borderColor: accent, opacity, transform: [{ scale: ringScale }, { rotate }] }]} />}
    {animation === 'orb-burst' && <Animated.View style={[styles.burstOrbCore, { backgroundColor: '#a31332', borderColor: accent, opacity, transform: [{ scale: coreScale }] }]} />}
    {animation === 'waldo-triumph' && <Animated.Text style={[styles.waldoFoundText, { opacity, transform: [{ scale: coreScale }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [9, -35] }) }] }]}>SCOUT ACQUIRED</Animated.Text>}
    {isWaldoFound && event.amount && <Animated.Text style={[styles.waldoFoundText, { opacity, transform: [{ scale: progress.interpolate({ inputRange: [0, 0.16, 0.55, 1], outputRange: [0.55, 1.15, 1, 0.82] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [7, -32] }) }] }]}>WALDO FOUND</Animated.Text>}
    {animation === 'heart-beat' && <Animated.View style={[styles.burstHeartInner, { borderColor: accent, transform: [{ scale: progress.interpolate({ inputRange: [0, 0.23, 0.48, 0.75, 1], outputRange: [0.12, 0.45, 0.8, 1.2, 1.55] }) }] }]} />}
    {animation === 'seed-bloom' && Array.from({ length: 6 }, (_, i) => <Animated.View key={`petal-${i}`} style={[styles.burstPetal, { backgroundColor: i % 2 ? accent : color, left: size / 2 - 8, top: size / 2 - 22, opacity: progress.interpolate({ inputRange: [0, 0.12, 0.5, 1], outputRange: [0, 1, 0.9, 0] }), transform: [{ rotate: `${i * 60}deg` }, { translateY: progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, -size * 0.26, -size * 0.4] }) }, { scale: progress.interpolate({ inputRange: [0, 0.18, 0.48, 1], outputRange: [0.1, 1.1, 0.9, 0.25] }) }] }]} />)}
    {(animation === 'heart-flare' || animation === 'speed-pulse') && <Animated.View style={[{ position: 'absolute', width: '54%', height: '54%', borderWidth: 3, borderRadius: 999, shadowOpacity: 0.9, shadowRadius: 12 }, { borderColor: accent, transform: [{ scale: progress.interpolate({ inputRange: [0, 0.2, 0.48, 1], outputRange: [0.15, 0.7, 1.1, 1.6] }) }, ...(animation === 'speed-pulse' ? [{ rotate }] : [])] }]} />}
    {animation === 'chart-unfold' && <>
      <Animated.View style={{ position: 'absolute', left: '18%', top: '27%', width: '64%', height: '47%', borderWidth: 2, borderColor: accent, backgroundColor: '#143c3bb8', transform: [{ scaleY: progress.interpolate({ inputRange: [0, 0.18, 0.42, 1], outputRange: [0.12, 0.35, 1, 1.5] }) }, { rotate: '-7deg' }], shadowColor: color, shadowOpacity: 1, shadowRadius: 14 }} />
      <Animated.View style={{ position: 'absolute', left: '24%', top: '23%', width: '52%', height: '52%', borderWidth: 2, borderColor: accent, borderRadius: 999, opacity, transform: [{ rotate }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '34%', color: accent, fontSize: size * 0.4, textShadowColor: color, textShadowRadius: 14, transform: [{ scale: coreScale }, { rotate }] }}>✥</Animated.Text>
      <Animated.Text style={{ position: 'absolute', right: '16%', top: '14%', color: accent, fontSize: 20, opacity, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.32] }) }] }}>✦</Animated.Text>
    </>}
    {animation === 'ship-launch' && <>
      <Animated.View style={{ position: 'absolute', left: '12%', top: '28%', width: '76%', height: '47%', borderWidth: 2, borderColor: accent, borderRadius: 15, opacity, transform: [{ rotate: '12deg' }, { scale: ringScale }] }} />
      <Animated.View style={{ position: 'absolute', left: '30%', top: '46%', width: '46%', height: '18%', borderWidth: 1, borderColor: accent, backgroundColor: color, transform: [{ skewX: '-18deg' }, { translateY: progress.interpolate({ inputRange: [0, 0.24, 0.62, 1], outputRange: [size * 0.15, 0, -size * 0.18, -size * 0.48] }) }] }} />
      <Animated.Text style={{ position: 'absolute', left: '34%', top: '24%', color: accent, fontSize: size * 0.4, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [size * 0.08, -size * 0.3] }) }, { scale: coreScale }] }}>⛵</Animated.Text>
      <Animated.View style={{ position: 'absolute', left: '16%', top: '65%', width: '68%', height: 4, backgroundColor: accent, opacity, transform: [{ scaleX: progress.interpolate({ inputRange: [0, 0.18, 0.65, 1], outputRange: [0.1, 1, 1.35, 0.08] }) }] }} />
    </>}
    {animation === 'bazaar-opening' && <>
      <Animated.View style={{ position: 'absolute', left: '22%', top: '16%', width: '56%', height: '72%', borderWidth: 4, borderColor: color, borderTopLeftRadius: 60, borderTopRightRadius: 60, borderBottomWidth: 2, transform: [{ scaleX: progress.interpolate({ inputRange: [0, 0.2, 0.54, 1], outputRange: [0.12, 0.68, 1.12, 1.8] }) }], shadowColor: color, shadowOpacity: 1, shadowRadius: 16 }} />
      <Animated.View style={{ position: 'absolute', left: '39%', top: '35%', width: '22%', height: '25%', borderWidth: 2, borderColor: accent, borderRadius: 6, backgroundColor: '#ffb94b', opacity, shadowColor: accent, shadowOpacity: 1, shadowRadius: 18, transform: [{ scale: coreScale }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.22] }) }] }} />
      <Animated.Text style={{ position: 'absolute', left: '14%', top: '37%', color: accent, fontSize: 19, opacity, transform: [{ rotate: '-25deg' }, { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.3] }) }] }}>▱</Animated.Text>
      <Animated.Text style={{ position: 'absolute', right: '14%', top: '44%', color: accent, fontSize: 19, opacity, transform: [{ rotate: '25deg' }, { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.3] }) }] }}>▱</Animated.Text>
    </>}
    {animation === 'chart-shatter' && Array.from({ length: 8 }, (_, i) => <Animated.Text key={`chart-glass-${i}`} style={{ position: 'absolute', left: '44%', top: '44%', color: i % 2 ? '#c7ffff' : color, fontSize: 17, opacity, transform: [{ translateX: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, Math.cos(i * Math.PI / 4) * size * 0.22, Math.cos(i * Math.PI / 4) * size * 0.52] }) }, { translateY: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, Math.sin(i * Math.PI / 4) * size * 0.22, Math.sin(i * Math.PI / 4) * size * 0.52] }) }, { rotate: `${i * 45}deg` }] }}>◇</Animated.Text>)}
    {animation === 'glass-fracture' && <>
      <Animated.View style={{ position: 'absolute', left: '22%', top: '22%', width: '56%', height: '56%', borderWidth: 2, borderColor: '#d9ffff', borderRadius: 10, opacity, transform: [{ rotate: '-8deg' }, { scale: ringScale }] }} />
      {Array.from({ length: 5 }, (_, i) => <Animated.View key={`glass-crack-${i}`} style={{ position: 'absolute', left: '48%', top: '42%', width: 2, height: size * 0.3, backgroundColor: accent, opacity, transform: [{ rotate: `${i * 72}deg` }, { scaleY: ringScale }] }} />)}
    </>}
    {animation === 'gate-collapse' && <>
      <Animated.View style={{ position: 'absolute', left: '25%', top: '13%', width: '50%', height: '74%', borderWidth: 4, borderColor: color, borderTopLeftRadius: 50, borderTopRightRadius: 50, opacity, transform: [{ scaleX: progress.interpolate({ inputRange: [0, 0.24, 0.56, 1], outputRange: [1.1, 0.86, 0.28, 0.03] }) }, { scaleY: progress.interpolate({ inputRange: [0, 0.26, 0.58, 1], outputRange: [0.45, 1, 1.14, 0.2] }) }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '38%', color: accent, fontSize: size * 0.38, opacity, transform: [{ scale: coreScale }] }}>⌂</Animated.Text>
    </>}
    {animation === 'finder-spark' && <>
      <Animated.View style={{ position: 'absolute', left: '13%', top: '13%', width: '74%', height: '74%', borderWidth: 3, borderColor: accent, borderRadius: 999, opacity, transform: [{ scale: ringScale }] }} />
      <Animated.View style={{ position: 'absolute', left: '29%', top: '30%', width: '42%', height: '42%', borderWidth: 2, borderColor: color, borderRadius: 999, backgroundColor: '#ac374766', opacity, transform: [{ scale: coreScale }] }} />
      <Animated.View style={{ position: 'absolute', right: '21%', top: '42%', width: '28%', height: '28%', borderWidth: 2, borderColor: '#fff5c5', borderRadius: 999, backgroundColor: '#8fe7ed66', shadowColor: accent, shadowOpacity: 1, shadowRadius: 14, opacity, transform: [{ scale: ringScale }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '22%', color: accent, fontSize: size * 0.42, textShadowColor: color, textShadowRadius: 15, opacity, transform: [{ scale: coreScale }] }}>◉</Animated.Text>
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '76%', color: accent, fontSize: 10, fontWeight: '900', letterSpacing: 1, opacity, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [4, -12] }) }] }}>FINDER CHARGED</Animated.Text>
    </>}
    {animation === 'aurora-bloom' && <>
      <Animated.View style={{ position: 'absolute', left: '12%', top: '17%', width: '76%', height: '66%', borderWidth: 2, borderColor: accent, borderRadius: 999, opacity, transform: [{ scale: ringScale }, { rotate: '-12deg' }] }} />
      <Animated.View style={{ position: 'absolute', left: '0%', top: '34%', width: '100%', height: '34%', borderTopWidth: 5, borderBottomWidth: 4, borderColor: color, borderRadius: 999, opacity, transform: [{ rotate: '24deg' }, { scaleX: ringScale }, { scaleY: coreScale }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '28%', color: accent, fontSize: size * 0.44, textShadowColor: color, textShadowRadius: 20, transform: [{ scale: coreScale }] }}>✧</Animated.Text>
    </>}
    {animation === 'glassworld-pop' && <>
      <Animated.View style={{ position: 'absolute', left: '12%', top: '12%', width: '76%', height: '76%', borderWidth: 2, borderColor: accent, borderRadius: 999, opacity, transform: [{ scale: ringScale }] }} />
      <Animated.View style={{ position: 'absolute', left: '23%', top: '30%', width: '54%', height: '40%', borderWidth: 2, borderColor: color, borderRadius: 999, transform: [{ rotate: '18deg' }, { scale: coreScale }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '34%', color: accent, fontSize: size * 0.4, textShadowColor: color, textShadowRadius: 18, transform: [{ scale: coreScale }, { rotate }] }}>◉</Animated.Text>
      <Animated.Text style={{ position: 'absolute', left: '18%', top: '20%', color: accent, opacity, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.32] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.28] }) }] }}>✦</Animated.Text>
      <Animated.Text style={{ position: 'absolute', right: '15%', bottom: '21%', color: accent, opacity, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.32] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.3] }) }] }}>✧</Animated.Text>
    </>}
    {animation === 'inkblot-pop' && <>
      <Animated.View style={{ position: 'absolute', left: '27%', top: '27%', width: '46%', height: '46%', borderRadius: 999, backgroundColor: '#170e2b', borderWidth: 2, borderColor: accent, opacity: progress.interpolate({ inputRange: [0, 0.18, 0.44, 1], outputRange: [0.8, 1, 0.35, 0] }), transform: [{ scale: progress.interpolate({ inputRange: [0, 0.18, 0.42, 1], outputRange: [0.8, 1.12, 0.72, 0.08] }) }] }} />
      <Animated.View style={{ position: 'absolute', left: '-4%', top: '41%', width: '64%', height: '18%', borderTopWidth: 4, borderColor: accent, borderRadius: 999, opacity, transform: [{ skewX: '-22deg' }, { scaleX: ringScale }] }} />
      <Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '28%', color: accent, fontSize: size * 0.42, textShadowColor: color, textShadowRadius: 18, transform: [{ scale: coreScale }, { rotate }] }}>✧</Animated.Text>
    </>}
    {(animation === 'reliquary-unseal' || animation === 'astrolabe-awaken' || animation === 'radiant-flare') && <><Animated.View style={{ position: 'absolute', width: '72%', height: '72%', alignSelf: 'center', top: '14%', borderWidth: 2, borderColor: accent, borderRadius: animation === 'reliquary-unseal' ? 10 : 999, opacity: progress.interpolate({ inputRange: [0, 0.16, 0.7, 1], outputRange: [0, 0.95, 0.7, 0] }), transform: [{ rotate }, { scale: ringScale }] }} /><Animated.Text style={{ position: 'absolute', alignSelf: 'center', top: '22%', color: accent, fontSize: size * 0.42, textShadowColor: color, textShadowRadius: 20, opacity, transform: [{ scale: coreScale }, { rotate }] }}>{animation === 'reliquary-unseal' ? '✦' : '✧'}</Animated.Text><Animated.View style={{ position: 'absolute', left: '39%', top: '39%', width: '22%', height: '22%', borderWidth: 2, borderColor: accent, backgroundColor: color, transform: [{ rotate: '45deg' }, { scale: coreScale }], shadowColor: accent, shadowOpacity: 1, shadowRadius: 18 }} /></>}
    {animation === 'coin-glint' || animation === 'silver-shimmer' || animation === 'sailcoin-glint' ? <Animated.View style={[styles.captureCoinFlash, { borderColor: accent, opacity, transform: [{ scale: ringScale }, { rotate: animation === 'silver-shimmer' ? '-45deg' : '35deg' }] }]} /> : null}
    {Array.from({ length: particleCount }, (_, i) => {
      const angle = (Math.PI * 2 * i) / particleCount + (animation === 'piston-strike' ? Math.PI / 2 : 0);
      const x = Math.cos(angle), y = Math.sin(angle);
      const heartBurst = animation === 'heart-beat' || animation === 'heart-flare';
      const phoenixBurst = animation === 'phoenix-rise';
      const travelX = progress.interpolate({ inputRange: [0, 1], outputRange: [x * size * 0.08, heartBurst || phoenixBurst ? (i % 2 ? 1 : -1) * size * (phoenixBurst ? 0.36 : 0.18 + (i % 3) * 0.045) : x * size * (isBlast ? 0.49 : animation === 'speed-comet' ? 0.48 : 0.39)] });
      const travelY = progress.interpolate({ inputRange: [0, 1], outputRange: [y * size * 0.08, heartBurst || phoenixBurst ? -size * (phoenixBurst ? 0.43 + (i % 2) * 0.04 : 0.2 + (i % 2) * 0.08) : y * size * (isBlast ? 0.49 : 0.39)] });
      const particleRotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(i % 2 ? 1 : -1) * 190}deg`] });
      const burstGlyph = event.kind === 'jackpot' ? (i % 4 === 0 ? '✦' : i % 2 ? '●' : '◆') : merchantBreak ? option?.breakAnimation === 'drone-spark' ? 'ϟ' : option?.breakAnimation === 'capsule-split' ? '▰' : option?.breakAnimation === 'compass-break' ? '✥' : option?.breakAnimation === 'shipcoin-break' ? '◇' : option?.breakAnimation === 'chart-shatter' ? '✧' : option?.breakAnimation === 'glass-fracture' ? '◇' : option?.breakAnimation === 'gate-collapse' ? '⌂' : '◆' : event.kind === 'creditLost' ? animation === 'drone-spark' ? 'ϟ' : i % 2 ? '¢' : '▱' : animation === 'credit-cascade' ? (i % 2 ? '¢' : '¤') : animation === 'credit-surge' ? (i % 2 ? 'ϟ' : '▱') : animation === 'coin-glint' ? (i % 2 ? '●' : '✦') : animation === 'silver-shimmer' ? (i % 2 ? '◇' : '✧') : animation === 'compass-pulse' ? (i % 2 ? '✧' : '✥') : animation === 'sailcoin-glint' ? (i % 2 ? '⚓' : '◇') : particle;
      return <Animated.Text key={i} style={[styles.burstParticle, { color: event.kind === 'jackpot' ? (i % 2 ? '#ffd45f' : '#fff2bc') : i % 2 ? color : accent, fontSize: event.kind === 'jackpot' ? 15 : animation === 'piston-strike' ? 17 : 13, left: size / 2 - 8, top: size / 2 - 8, opacity, transform: [{ translateX: travelX }, { translateY: travelY }, { rotate: particleRotate }] }]}>{burstGlyph}</Animated.Text>;
    })}
    {isBubblePop && Array.from({ length: Math.min(9, Math.max(0, event.amount ?? 0)) }, (_, i) => {
      const offset = ((i % 3) - 1) * 11;
      const drop = progress.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0, 3, Math.max(24, stageHeight - event.y * sy - size / 2)] });
      const drift = progress.interpolate({ inputRange: [0, 1], outputRange: [0, offset * 1.8] });
      return <Animated.View key={`credit-${i}`} style={[creditStyles.bubbleCredit, { left: size / 2 - 11 + offset, top: size / 2, opacity: progress.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateX: drift }, { translateY: drop }, { rotate: `${i % 2 ? 16 : -16}deg` }] }]}><CreditSymbol skinId={creditSkin} size={18} /></Animated.View>;
    })}
    {!isWaldoFound && animation !== 'orb-burst' && animation !== 'waldo-triumph' && <Animated.Text style={[styles.burstCore, { color: accent, fontSize: isBlast ? 35 : event.kind === 'jackpot' ? 25 : 23, textShadowColor: color, opacity, transform: [{ scale: coreScale }, ...(animation === 'electric-surge' || animation === 'meteor-burst' ? [{ rotate }] : [])] }]}>{glyph}</Animated.Text>}
  </Animated.View>;
}

const sectorCaptureStyles = StyleSheet.create({
  ring: { position: 'absolute', width: '80%', height: '80%', borderWidth: 4, borderRadius: 999, borderStyle: 'dashed', shadowColor: '#66f4df', shadowOpacity: 1, shadowRadius: 18 },
  inner: { position: 'absolute', width: '52%', height: '92%', borderWidth: 2, borderRadius: 999, shadowColor: '#d2ffff', shadowOpacity: 1, shadowRadius: 12 },
  wake: { position: 'absolute', top: '48%', width: '86%', height: 3, borderRadius: 999, shadowColor: '#74f9ed', shadowOpacity: 1, shadowRadius: 12 },
  label: { position: 'absolute', top: '76%', width: '100%', textAlign: 'center', fontSize: 9, fontWeight: '900', letterSpacing: 1.4, textShadowColor: '#31dcd1', textShadowRadius: 8 },
});

const silhouetteStyles = StyleSheet.create({
  asteroidBall: { borderColor: '#a98a70', backgroundColor: '#34302e' },
  asteroidRidgeOne: { position: 'absolute', left: '-6%', top: '23%', width: '76%', height: '30%', borderRadius: 99, backgroundColor: '#685444', borderWidth: 1, borderColor: '#a98769', transform: [{ rotate: '-28deg' }] },
  asteroidRidgeTwo: { position: 'absolute', right: '-8%', bottom: '20%', width: '71%', height: '27%', borderRadius: 99, backgroundColor: '#262526', borderWidth: 1, borderColor: '#57483f', transform: [{ rotate: '-28deg' }] },
  asteroidCraterLarge: { position: 'absolute', right: '14%', top: '19%', width: '35%', height: '32%', borderRadius: 99, backgroundColor: '#241f1d', borderWidth: 3, borderColor: '#997759', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '18deg' }] },
  asteroidCraterShade: { width: '65%', height: '56%', borderRadius: 99, backgroundColor: '#171719', borderWidth: 1, borderColor: '#4b3a31' },
  asteroidCraterSmall: { position: 'absolute', left: '18%', bottom: '21%', width: '20%', height: '18%', borderRadius: 99, backgroundColor: '#252121', borderWidth: 2, borderColor: '#8b6c55' },
  asteroidFissureOne: { position: 'absolute', left: '25%', top: '17%', width: '4%', height: '29%', backgroundColor: '#f29a49', borderRadius: 9, shadowColor: '#ff9d47', shadowOpacity: 1, shadowRadius: 4, transform: [{ rotate: '36deg' }] },
  asteroidFissureTwo: { position: 'absolute', left: '42%', top: '36%', width: '3%', height: '24%', backgroundColor: '#d8783d', borderRadius: 9, shadowColor: '#ff8c43', shadowOpacity: 0.9, shadowRadius: 3, transform: [{ rotate: '-38deg' }] },
  asteroidGlint: { position: 'absolute', left: '19%', top: '13%', width: '20%', height: '5%', borderRadius: 99, backgroundColor: '#ffe3c5', opacity: 0.7, transform: [{ rotate: '-28deg' }] },
  freeformRoot: { backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0, overflow: 'visible', shadowOpacity: 0, elevation: 0 },
  phaseRibbonFrame: { width: '112%', height: '40%', borderRadius: 5, borderWidth: 0, borderColor: 'transparent', backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  ribbonTail: { position: 'absolute', left: '-13%', top: '20%', width: '39%', height: '30%', backgroundColor: '#7b54dd', borderTopLeftRadius: 20, borderBottomLeftRadius: 20, transform: [{ skewY: '-28deg' }] },
  ribbonLoop: { position: 'absolute', left: '18%', top: '-36%', width: '64%', height: '170%', borderWidth: 4, borderColor: '#d9b5ff', borderRadius: 999, transform: [{ rotate: '-28deg' }] },
  ribbonLoopInner: { position: 'absolute', left: '31%', top: '-10%', width: '39%', height: '120%', borderWidth: 2, borderColor: '#8df5ff', borderRadius: 999, transform: [{ rotate: '-28deg' }] },
  ribbonWake: { position: 'absolute', right: '-19%', top: '34%', width: '31%', height: 3, backgroundColor: '#f1dcff', borderRadius: 9, transform: [{ rotate: '-12deg' }] },
  engineFrame: { width: '83%', height: '57%', borderRadius: 5, borderWidth: 2, borderColor: '#b9fff4', backgroundColor: '#173b42', shadowColor: '#54e4cb', shadowOpacity: 0.9, shadowRadius: 8, elevation: 5 },
  engineChamber: { width: '62%', height: '72%', borderRadius: 4, borderWidth: 2, borderColor: '#68f2df', backgroundColor: '#102832', alignItems: 'center', justifyContent: 'center' },
  engineFinTop: { position: 'absolute', right: '-15%', top: '-13%', width: '20%', height: '34%', backgroundColor: '#54e4cb', borderRadius: 2, transform: [{ skewY: '-20deg' }] },
  engineFinBottom: { position: 'absolute', right: '-15%', bottom: '-13%', width: '20%', height: '34%', backgroundColor: '#54e4cb', borderRadius: 2, transform: [{ skewY: '20deg' }] },
  rubyShardLeft: { position: 'absolute', left: '0%', top: '18%', width: '24%', height: '34%', backgroundColor: '#ffafd7', borderColor: '#ffe4f1', borderWidth: 1, transform: [{ rotate: '32deg' }, { skewY: '-17deg' }] },
  rubyShardRight: { position: 'absolute', right: '1%', bottom: '17%', width: '21%', height: '29%', backgroundColor: '#b52c72', borderColor: '#ff9dc9', borderWidth: 1, transform: [{ rotate: '35deg' }, { skewY: '18deg' }] },
  emberPetalTop: { position: 'absolute', left: '40%', top: '-15%', width: '21%', height: '37%', backgroundColor: '#ff9a37', borderColor: '#ffe39b', borderWidth: 1, borderTopLeftRadius: 90, borderTopRightRadius: 8, transform: [{ rotate: '12deg' }] },
  emberCinder: { position: 'absolute', right: '0%', bottom: '4%', width: '13%', height: '13%', borderRadius: 99, backgroundColor: '#ffd05e', shadowColor: '#ff7132', shadowOpacity: 1, shadowRadius: 5 },
  maulerProngTop: { position: 'absolute', left: '40%', top: '-18%', width: '20%', height: '34%', backgroundColor: '#d4dfe0', borderWidth: 1, borderColor: '#fff0bf', borderRadius: 3, transform: [{ rotate: '45deg' }] },
  maulerProngBottom: { position: 'absolute', left: '40%', bottom: '-18%', width: '20%', height: '34%', backgroundColor: '#d4dfe0', borderWidth: 1, borderColor: '#fff0bf', borderRadius: 3, transform: [{ rotate: '45deg' }] },
  maulerProngLeft: { position: 'absolute', left: '-18%', top: '40%', width: '34%', height: '20%', backgroundColor: '#d4dfe0', borderWidth: 1, borderColor: '#fff0bf', borderRadius: 3, transform: [{ rotate: '45deg' }] },
  maulerProngRight: { position: 'absolute', right: '-18%', top: '40%', width: '34%', height: '20%', backgroundColor: '#d4dfe0', borderWidth: 1, borderColor: '#fff0bf', borderRadius: 3, transform: [{ rotate: '45deg' }] },
  moonRelic: { position: 'absolute', left: '-13%', top: '4%', width: '112%', height: '92%', alignItems: 'center', justifyContent: 'center' },
  moonGlyph: { color: '#d6f2ff', fontSize: 42, lineHeight: 48, fontWeight: '900', textShadowColor: '#a4dcff', textShadowRadius: 8, transform: [{ rotate: '-22deg' }] },
  moonGem: { position: 'absolute', right: '12%', bottom: '5%', width: '23%', height: '25%', backgroundColor: '#dffaff', borderColor: '#83bdd4', borderWidth: 2, borderRadius: 4, transform: [{ rotate: '45deg' }] },
  moonTail: { position: 'absolute', left: '7%', bottom: '11%', width: '37%', height: 4, backgroundColor: '#a9d4e2', borderRadius: 5, transform: [{ rotate: '-34deg' }] },
  moonEtching: { position: 'absolute', left: '29%', top: '18%', width: '2%', height: '42%', backgroundColor: '#fff', opacity: 0.75, transform: [{ rotate: '32deg' }] },
  nebulaWisp: { position: 'absolute', left: '-22%', top: '55%', width: '58%', height: '24%', borderRadius: 99, backgroundColor: '#8557dc', opacity: 0.8, transform: [{ rotate: '-32deg' }] },
  nebulaCloud: { position: 'absolute', left: '12%', top: '12%', width: '80%', height: '72%', borderRadius: 99, backgroundColor: '#5936a9', borderWidth: 2, borderColor: '#d4bcff', transform: [{ rotate: '18deg' }], alignItems: 'center', justifyContent: 'center' },
  nebulaCore: { width: '42%', height: '46%', borderRadius: 99, backgroundColor: '#86eaff', shadowColor: '#f1caff', shadowOpacity: 1, shadowRadius: 8 },
  nebulaDust: { position: 'absolute', left: '4%', top: '21%', width: 5, height: 5, borderRadius: 99, backgroundColor: '#fff2b7', shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 4 },
  nebulaLoop: { position: 'absolute', left: '13%', top: '27%', width: '102%', height: '47%', borderRadius: 99, borderWidth: 2, borderColor: '#a8faff', transform: [{ rotate: '-36deg' }] },
  nebulaStar: { position: 'absolute', right: '-5%', top: '1%' },
  waldoGlow: { position: 'absolute', left: '9%', top: '2%', width: '82%', height: '96%', borderRadius: 40, backgroundColor: '#ffe7ab', shadowColor: '#ffdb81', shadowOpacity: 0.7, shadowRadius: 9 },
  waldoFigure: { position: 'absolute', left: '15%', top: '1%', width: '68%', height: '98%', alignItems: 'center' },
  waldoCap: { position: 'absolute', left: '12%', top: '1%', width: '76%', height: '17%', borderRadius: 8, borderTopLeftRadius: 20, backgroundColor: '#d82736', borderWidth: 1, borderColor: '#ff9a8e', transform: [{ rotate: '-7deg' }] },
  waldoCapBand: { position: 'absolute', left: '4%', bottom: '19%', width: '93%', height: '25%', backgroundColor: '#fff3db', borderRadius: 3 },
  waldoFace: { position: 'absolute', top: '16%', left: '25%', width: '50%', height: '21%', borderRadius: 15, backgroundColor: '#ffd49c', borderWidth: 1, borderColor: '#fff0cc' },
  waldoHair: { position: 'absolute', left: '-12%', top: '8%', width: '20%', height: '55%', backgroundColor: '#77462c', borderRadius: 5 },
  waldoGlasses: { position: 'absolute', left: '15%', top: '39%', width: '77%', height: '30%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  waldoLensLeft: { width: '42%', height: '91%', borderRadius: 99, borderWidth: 2, borderColor: '#202833', backgroundColor: '#c4edee88' },
  waldoLensRight: { width: '42%', height: '91%', borderRadius: 99, borderWidth: 2, borderColor: '#202833', backgroundColor: '#c4edee88' },
  waldoNose: { position: 'absolute', right: '24%', top: '62%', width: '14%', height: '16%', borderRadius: 99, backgroundColor: '#e99a79' },
  waldoArms: { position: 'absolute', top: '39%', left: '1%', width: '98%', height: '30%', flexDirection: 'row', justifyContent: 'space-between' },
  waldoArm: { width: '18%', height: '78%', backgroundColor: '#fff1d4', borderColor: '#d82736', borderWidth: 2, borderRadius: 6, transform: [{ rotate: '12deg' }] },
  waldoShirt: { position: 'absolute', top: '36%', left: '20%', width: '60%', height: '34%', overflow: 'hidden', backgroundColor: '#fff4df', borderWidth: 1, borderColor: '#9b2934', borderRadius: 5, transform: [{ rotate: '-2deg' }] },
  waldoStripe: { flex: 1, width: '100%', backgroundColor: '#fff4df' },
  waldoStripeRed: { backgroundColor: '#d8293a' },
  waldoBelt: { position: 'absolute', top: '69%', left: '19%', width: '62%', height: '5%', backgroundColor: '#66452f', borderColor: '#d2aa60', borderWidth: 1 },
  waldoLegs: { position: 'absolute', top: '72%', left: '27%', width: '48%', height: '20%', flexDirection: 'row', justifyContent: 'space-between' },
  waldoLeg: { width: '42%', height: '100%', backgroundColor: '#2862a0', borderColor: '#82b9ef', borderWidth: 1, borderRadius: 3 },
  waldoBoots: { position: 'absolute', top: '88%', left: '20%', width: '64%', height: '11%', flexDirection: 'row', justifyContent: 'space-between' },
  waldoBoot: { width: '46%', height: '100%', backgroundColor: '#473a34', borderColor: '#d9ba88', borderWidth: 1, borderRadius: 5 },
  waldoFinder: { position: 'absolute', right: '-6%', bottom: '12%', width: '35%', height: '36%', borderRadius: 99, borderWidth: 4, borderColor: '#a56a27', backgroundColor: '#d6a84b55', alignItems: 'center', justifyContent: 'center', shadowColor: '#ffe18a', shadowOpacity: 0.8, shadowRadius: 6 },
  waldoFinderGlass: { width: '63%', height: '63%', borderRadius: 99, borderWidth: 2, borderColor: '#fff2c4', backgroundColor: '#8de2ec88' },
  waldoFinderShine: { position: 'absolute', top: '20%', left: '25%', width: '21%', height: '11%', borderRadius: 9, backgroundColor: '#fff' },
});

const creditStyles = StyleSheet.create({
  runReadouts: { flexDirection: 'row', alignItems: 'stretch', gap: 5 }, runReadout: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderRadius: 8, backgroundColor: '#0b1724' }, claimReadout: { borderColor: '#376758' }, creditReadout: { borderColor: '#645333' }, readoutLabel: { color: '#8297a8', fontSize: 6, fontWeight: '900', letterSpacing: 1 }, readoutValue: { color: '#f0f5f6', fontSize: 13, lineHeight: 16, fontWeight: '900', marginTop: 2 }, readoutUnit: { color: '#65ddbb', fontSize: 8 }, claimGlyph: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#53cda9', borderRadius: 6, backgroundColor: '#123126' }, claimGlyphText: { color: '#a8f4d9', fontSize: 16, fontWeight: '900' },
  creditSun: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffe7a1', backgroundColor: '#b87927', shadowColor: '#ffd15c', shadowOpacity: 0.8, shadowRadius: 6 }, creditSunInner: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fff3bd', backgroundColor: '#e1a83f' }, creditSunGlint: { position: 'absolute', backgroundColor: '#fff9d8', transform: [{ rotate: '-35deg' }] },
  creditPearlHalo: { position: 'absolute', borderWidth: 1.5, borderColor: '#86eaff', shadowColor: '#49caff', shadowOpacity: 0.9, shadowRadius: 7 }, creditPearl: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#f5ffff', backgroundColor: '#9dd8df', shadowColor: '#91efff', shadowOpacity: 1, shadowRadius: 6, elevation: 3 }, creditPearlCore: { backgroundColor: '#d8fbff', shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 5 }, creditPearlGleam: { position: 'absolute', top: '20%', left: '20%', backgroundColor: '#ffffff', transform: [{ rotate: '-38deg' }] }, creditTideArc: { position: 'absolute', borderTopWidth: 2, borderColor: '#c5ffff', shadowColor: '#5be5ff', shadowOpacity: 0.9, shadowRadius: 5 }, creditPearlBubble: { position: 'absolute', color: '#e3ffff', fontWeight: '900', textShadowColor: '#5adfff', textShadowRadius: 5 },
  creditEmberHalo: { position: 'absolute', borderWidth: 2, borderColor: '#f28a42', shadowColor: '#ff5a29', shadowOpacity: 0.9, shadowRadius: 7 }, creditEmberPlate: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e6b265', backgroundColor: '#29231f', shadowColor: '#ff672c', shadowOpacity: 0.85, shadowRadius: 4 }, creditEmberCore: { backgroundColor: '#ff8a31', borderWidth: 1, borderColor: '#ffe18c', shadowColor: '#ff4d25', shadowOpacity: 1, shadowRadius: 6 }, creditEmberSpark: { position: 'absolute', color: '#fff2a7', textShadowColor: '#ff5a23', textShadowRadius: 7 }, creditEmberStamp: { position: 'absolute', bottom: '19%', backgroundColor: '#b96f36', borderWidth: 1, borderColor: '#ffd18a' },
  creditHex: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#b5fff0', backgroundColor: '#087c82', shadowColor: '#3bf4db', shadowOpacity: 0.9, shadowRadius: 6 }, creditHexCore: { borderRadius: 2, borderWidth: 2, borderColor: '#e0fff7', backgroundColor: '#42e3c5' }, creditCircuitPin: { position: 'absolute', backgroundColor: '#f4ffca', shadowColor: '#e5ff73', shadowOpacity: 1, shadowRadius: 4 },
  creditPrism: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#723ed1', borderWidth: 1, borderColor: '#e6d6ff', shadowColor: '#a875ff', shadowOpacity: 1, shadowRadius: 8 }, creditPrismFacet: { position: 'absolute', left: '16%', backgroundColor: '#b98bff', opacity: 0.9 }, creditPrismGlint: { position: 'absolute', right: '12%', top: '10%', backgroundColor: '#fff', opacity: 0.95 }, creditSkinPreview: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#07111c' },
  marketCreditBalance: { flexDirection: 'row', alignItems: 'center', gap: 6 }, bankPriceReadout: { alignItems: 'flex-start', gap: 3 }, skinNodeActionWithCredit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  bubbleCredit: { position: 'absolute', width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }, bubbleCreditTotal: { position: 'absolute', top: '68%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#e6c36f', backgroundColor: '#302313' }, bubbleCreditTotalLabel: { color: '#fff3b3', fontSize: 9, fontWeight: '900', letterSpacing: 1, textShadowColor: '#e6ac42', textShadowRadius: 7 },
});

const territoryStyles = StyleSheet.create({
  choiceSetting: { borderBottomWidth: 1, borderColor: '#172332', paddingVertical: 7, gap: 5 }, choiceSettingOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, choiceSettingOption: { borderWidth: 1, borderColor: '#344356', borderRadius: 5, backgroundColor: '#0b1521', paddingHorizontal: 8, paddingVertical: 6 }, choiceSettingSelected: { borderColor: '#55daba', backgroundColor: '#12342c' }, choiceSettingText: { color: '#9cacc0', fontSize: 8, fontWeight: '800' }, choiceSettingTextSelected: { color: '#aaf5df' },
  territoryPopup: { position: 'absolute', width: 96, alignItems: 'center', zIndex: 16 }, territorySignalPlate: { width: 96, height: 28, justifyContent: 'center' }, territorySignalMark: { position: 'absolute', left: 16, top: 8, bottom: 8, width: 1, borderRadius: 99, backgroundColor: '#f2db86', opacity: 0.8 }, territorySignalText: { color: '#cffff3', fontSize: 14, textShadowColor: '#45ffe0', textShadowRadius: 7 }, territoryPrism: { width: 96, height: 34, justifyContent: 'center' }, territoryPrismHalo: { position: 'absolute', width: 82, height: 25, borderWidth: 1, borderRadius: 999, borderColor: '#be8cff', shadowColor: '#ae73ff', shadowOpacity: 0.55, shadowRadius: 5 }, territoryPrismText: { color: '#f1e1ff', fontSize: 17, letterSpacing: 0.5, textShadowColor: '#b167ff', textShadowRadius: 8 }, territoryText: { color: '#e9fff9', fontSize: 16, fontWeight: '900', letterSpacing: 0.4, textShadowColor: '#23e4be', textShadowRadius: 6 }, territoryFlash: { position: 'absolute', color: '#ffd87b', fontSize: 16, fontWeight: '900', letterSpacing: 0.4, textShadowColor: '#fff0ad', textShadowRadius: 8 },
});

const specialFxStyles = StyleSheet.create({
  burstPhaseRing: { position: 'absolute', width: '88%', height: '88%', borderWidth: 5, borderRadius: 999, borderStyle: 'dashed', shadowColor: '#6feaff', shadowOpacity: 1, shadowRadius: 24 },
  burstTreasureRing: { position: 'absolute', width: '82%', height: '82%', borderWidth: 5, borderRadius: 12, transform: [{ rotate: '45deg' }], shadowColor: '#ffd16b', shadowOpacity: 1, shadowRadius: 22 },
  burstAnchorRing: { position: 'absolute', width: '76%', height: '76%', borderWidth: 6, borderRadius: 999, borderColor: '#b4c2c8', shadowColor: '#ffae5a', shadowOpacity: 1, shadowRadius: 14 },
  phaseChestPickup: { backgroundColor: '#37234f', borderColor: '#d5b2ff', shadowColor: '#bd8aff', shadowOpacity: 0.95, shadowRadius: 9, elevation: 5 },
  phaseChestAura: { position: 'absolute', width: '100%', height: '100%', borderRadius: 999, borderWidth: 1.5, borderColor: '#b58cff', shadowColor: '#e6cfff', shadowOpacity: 1, shadowRadius: 12 },
  phaseChestLid: { position: 'absolute', top: '22%', width: '75%', height: '25%', backgroundColor: '#b98548', borderWidth: 2, borderColor: '#ffe5a2', borderTopLeftRadius: 9, borderTopRightRadius: 9, transform: [{ rotate: '-8deg' }] },
  phaseChestBody: { position: 'absolute', top: '42%', width: '70%', height: '39%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#75462e', borderWidth: 2, borderColor: '#ffd77f', borderRadius: 5 },
  phaseChestGlyph: { color: '#fff1ae', fontSize: 19, fontWeight: '900', textShadowColor: '#fff6c7', textShadowRadius: 9 },
  phaseChestLock: { position: 'absolute', top: '49%', width: '12%', height: '20%', borderRadius: 3, backgroundColor: '#f8d77b', borderWidth: 1, borderColor: '#fff6ce' },
  phaseChestGlint: { position: 'absolute', top: '15%', left: '17%', width: '22%', height: 3, borderRadius: 99, backgroundColor: '#ffffff', transform: [{ rotate: '-35deg' }], shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 5 },
});

const desktopHudStyles = StyleSheet.create({
  stageRow: { flex: 1, minHeight: 0, width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  board: { width: '100%', maxHeight: '100%', minWidth: 0, minHeight: 0, flexGrow: 0, flexShrink: 0, alignSelf: 'center', borderWidth: 1, borderColor: '#263446', borderRadius: 10, overflow: 'hidden' },
  bottomResources: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexShrink: 0, paddingTop: 3, paddingBottom: 2 },
  vaultGroup: { width: 248, maxWidth: '42%', flexShrink: 0, gap: 5 },
  abilityRail: { flex: 1, minWidth: 290, justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 },
});

const styles = StyleSheet.create({
  engiArt: { alignItems: 'center', justifyContent: 'center', position: 'relative' }, engiBackpack: { position: 'absolute', right: '4%', top: '31%', width: '24%', height: '40%', borderRadius: 4, borderWidth: 1, borderColor: '#ddd0a1' }, engiBody: { width: '72%', height: '67%', borderWidth: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden', shadowColor: '#75e5c3', shadowOpacity: 0.25, shadowRadius: 4 }, engiFace: { width: '76%', height: '31%', marginTop: '12%', borderWidth: 1.5, borderRadius: 4, backgroundColor: '#18252a', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }, engiEye: { width: '18%', height: '28%', borderRadius: 3, shadowOpacity: 1, shadowRadius: 4 }, engiBelly: { width: '48%', height: '26%', marginTop: '9%', borderWidth: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#252d2b' }, engiBellyLight: { width: '34%', height: '32%', borderRadius: 4 }, engiFoot: { position: 'absolute', bottom: '2%', width: '24%', height: '17%', borderRadius: 4, borderWidth: 1, borderColor: '#e3dbb7' }, engiFootLeft: { left: '15%' }, engiFootRight: { right: '15%' }, engiTaskGlyph: { position: 'absolute', right: '-2%', top: '-9%', fontSize: 15, fontWeight: '900', textShadowColor: '#caffef', textShadowRadius: 7 }, engiEggPickup: { backgroundColor: '#25312e', borderColor: '#b9d2a4', borderWidth: 2, overflow: 'visible', shadowColor: '#8dffc6', shadowOpacity: 0.8, shadowRadius: 7, elevation: 4 }, engiEggAura: { position: 'absolute', width: '90%', height: '90%', borderRadius: 8, borderWidth: 1.5, borderColor: '#a7ffce' }, engiEggPlate: { width: '66%', height: '72%', borderWidth: 2, borderColor: '#b5c6a0', borderRadius: 8, backgroundColor: '#505a4c', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] }, engiEggBand: { position: 'absolute', left: '-9%', width: '118%', height: '16%', backgroundColor: '#78826d', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#d2d8b7' }, engiEggLens: { width: '34%', height: '34%', borderRadius: 999, borderWidth: 2, borderColor: '#d8f5c0', backgroundColor: '#86f2bd', shadowColor: '#84ffca', shadowOpacity: 1, shadowRadius: 8 }, engiEggBoltTop: { position: 'absolute', top: '8%', left: '13%', width: '13%', height: '9%', backgroundColor: '#dfdec2', borderRadius: 2 }, engiEggBoltBottom: { position: 'absolute', bottom: '8%', right: '13%', width: '13%', height: '9%', backgroundColor: '#dfdec2', borderRadius: 2 }, petRail: { width: '100%', minHeight: 48, marginBottom: 6, paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, borderColor: '#3b5c56', borderRadius: 7, backgroundColor: '#0b171a' }, petRailTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, petRailNotice: { color: '#9af3d5', fontSize: 8, fontWeight: '900' }, petRailItems: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 }, petRailItem: { minWidth: 55, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#304943', borderRadius: 5, backgroundColor: '#101e20' }, petRailName: { color: '#afc7bd', fontSize: 7, fontWeight: '800' }, petEggCount: { padding: 6, borderWidth: 1, borderColor: '#88764c', borderRadius: 5 }, petEggCountText: { color: '#f0cf81', fontSize: 8, fontWeight: '900' }, deployedEngi: { position: 'absolute', width: 40, height: 44, zIndex: 9, alignItems: 'center', justifyContent: 'center' }, isotypesBanner: { position: 'absolute', zIndex: 20, left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }, isotypesBannerText: { color: '#caffed', fontSize: 14, fontWeight: '900', letterSpacing: 1.5, textShadowColor: '#50e8c0', textShadowRadius: 11 }, engiSkinChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, engiSkinChoice: { width: 105, minHeight: 90, alignItems: 'center', justifyContent: 'center', padding: 7, borderWidth: 1, borderColor: '#334b44', borderRadius: 7, backgroundColor: '#0b1718' }, engiRosterCard: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 8, marginTop: 6, borderWidth: 1, borderColor: '#324944', borderRadius: 7, backgroundColor: '#101b20' }, engiProgressTrack: { width: '100%', height: 5, marginTop: 5, borderRadius: 5, backgroundColor: '#263632', overflow: 'hidden' }, engiProgressFill: { height: '100%', backgroundColor: '#73e3b5' }, engiNameInput: { minWidth: 90, color: '#e5f3ed', paddingVertical: 2, fontSize: 9, borderBottomWidth: 1, borderColor: '#425d55' }, engiAction: { alignItems: 'center', padding: 10, marginTop: 8, borderWidth: 1, borderColor: '#5cae90', borderRadius: 6, backgroundColor: '#163a2e' }, engiUpgrade: { alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#627b70', borderRadius: 6, backgroundColor: '#18312b' }, engiActionText: { color: '#cffff0', fontSize: 8, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' }, engiCost: { color: '#eacb81', fontSize: 8, fontWeight: '800', marginTop: 3 }, engiBurstLabel: { position: 'absolute', left: 0, right: 0, top: '38%', textAlign: 'center', fontSize: 10, fontWeight: '900', letterSpacing: 0.7, textShadowRadius: 9 },
  bankPanel: { padding: 12, borderWidth: 1, borderColor: '#52665d', borderRadius: 9, backgroundColor: '#101c1d' }, bankHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, bankTotal: { minWidth: 70, padding: 7, alignItems: 'center', borderWidth: 1, borderColor: '#52675f', borderRadius: 6, backgroundColor: '#0a1315' }, bankLegend: { flexDirection: 'row', gap: 15, marginTop: 10 }, bankLegendGreen: { color: '#72e9ad', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 }, bankLegendGrey: { color: '#9ba7a7', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 }, reactorBank: { minHeight: 48, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 8, padding: 8, borderWidth: 1, borderColor: '#30413e', borderRadius: 7, backgroundColor: '#081112' }, reactorBar: { width: 10, height: 29, borderRadius: 3, borderWidth: 1, padding: 2 }, reactorBarAvailable: { borderColor: '#62dd9e', backgroundColor: '#163a2a', shadowColor: '#5fe1a0', shadowOpacity: 0.85, shadowRadius: 5 }, reactorBarAssigned: { borderColor: '#657374', backgroundColor: '#30393a' }, bankActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 9 }, bankPriceLabel: { color: '#e5cb82', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, socketHint: { color: '#94a7a2', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 }, assignmentPipGrey: { backgroundColor: '#727e80', borderColor: '#a6b1b1' },
  skinResearchSection: { marginTop: 9, padding: 11, borderWidth: 1, borderColor: '#394b4c', borderRadius: 9, backgroundColor: '#0d171d' }, permanentTag: { color: '#dbbf7a', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 }, skinLane: { marginTop: 11, paddingTop: 9, borderTopWidth: 1, borderColor: '#26383b' }, skinLaneHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, skinLaneTitle: { color: '#d7e5dd', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 }, skinLanePath: { color: '#728782', fontSize: 6, fontWeight: '900', letterSpacing: 0.5 }, skinNodeTrack: { alignItems: 'stretch', gap: 5, paddingVertical: 7 }, treeConnector: { alignSelf: 'center', color: '#b69b5d', fontSize: 21, fontWeight: '900' }, skinNode: { width: 140, minHeight: 185, padding: 8, borderWidth: 1, borderColor: '#394c4e', borderRadius: 7, backgroundColor: '#111e23' }, skinNodeEquipped: { borderColor: '#66d9b7', backgroundColor: '#132720' }, skinNodeLocked: { borderColor: '#4d4839', backgroundColor: '#191a19' }, skinNodeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, skinTierTag: { color: '#d7bd77', fontSize: 6, fontWeight: '900', letterSpacing: 0.8 }, permanentCheck: { color: '#6ae2bc', fontSize: 10, fontWeight: '900' }, skinNodePreview: { height: 47, alignItems: 'center', justifyContent: 'center', marginTop: 3, marginBottom: 3 }, skinNodeName: { color: '#e0e8df', fontSize: 8, fontWeight: '900' }, skinNodeDescription: { minHeight: 28, color: '#859692', fontSize: 6, lineHeight: 9, marginTop: 3 }, skinNodeAction: { alignItems: 'center', justifyContent: 'center', minHeight: 24, marginTop: 'auto', paddingHorizontal: 4, borderWidth: 1, borderColor: '#977c43', borderRadius: 4, backgroundColor: '#332b1b' }, skinNodeActive: { borderColor: '#58b896', backgroundColor: '#153d31' }, skinNodeActionText: { color: '#ead59b', fontSize: 6, fontWeight: '900', letterSpacing: 0.45 },
  coinFace: { width: '82%', height: '82%', borderWidth: 2, borderColor: '#fff0a0', borderRadius: 999, backgroundColor: '#d59625', alignItems: 'center', justifyContent: 'center', shadowColor: '#ffcf51', shadowOpacity: 0.9, shadowRadius: 8 }, coinInset: { width: '72%', height: '72%', borderWidth: 1, borderColor: '#ffe7a0', borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#bd791c' }, coinGlyph: { fontWeight: '900', textShadowColor: '#fff9d4', textShadowRadius: 5 }, coinGlint: { position: 'absolute', left: '42%', top: '-5%', width: '16%', height: '110%', borderRadius: 999, backgroundColor: '#ffffffbd', shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 7 }, treasureGoldCoin: { backgroundColor: '#9a6119', borderColor: '#ffe078' }, treasureSilverCoin: { backgroundColor: '#607e89', borderColor: '#eafcff' },
  creditMintPickup: { overflow: 'visible', backgroundColor: '#8c6328', borderColor: '#ffdf90', shadowColor: '#f4bd5c', shadowOpacity: 0.9, shadowRadius: 7, elevation: 4 }, creditScripOuter: { width: '77%', height: '74%', borderWidth: 2, borderColor: '#f3d58b', borderRadius: 5, backgroundColor: '#9b6725', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-12deg' }], shadowColor: '#ffe5a0', shadowOpacity: 0.85, shadowRadius: 5 }, creditScripInner: { width: '78%', height: '76%', borderWidth: 1, borderColor: '#d8ad60', borderRadius: 3, backgroundColor: '#c08a39', alignItems: 'center', justifyContent: 'center' }, creditScripGlyph: { color: '#fff1b6', fontSize: 20, fontWeight: '900', textShadowColor: '#fff6d8', textShadowRadius: 5 }, creditScripNotchTop: { position: 'absolute', width: 5, height: 5, top: '19%', borderRadius: 5, backgroundColor: '#231b14' }, creditScripNotchBottom: { position: 'absolute', width: 5, height: 5, bottom: '19%', borderRadius: 5, backgroundColor: '#231b14' }, creditScripGlint: { position: 'absolute', left: '43%', top: '8%', width: '12%', height: '80%', borderRadius: 99, backgroundColor: '#fff6ce', shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 6 }, creditLedgerPickup: { overflow: 'visible', backgroundColor: '#133c44', borderColor: '#8cfff0', shadowColor: '#45e4d2', shadowOpacity: 0.95, shadowRadius: 8, elevation: 5 }, creditRelayFrame: { position: 'absolute', width: '78%', height: '65%', borderWidth: 2, borderColor: '#8affea', borderRadius: 5, backgroundColor: '#16454b', transform: [{ rotate: '8deg' }] }, creditRelayCore: { position: 'absolute', width: '30%', height: '34%', borderWidth: 1, borderColor: '#e1fff9', borderRadius: 4, backgroundColor: '#58e3cb', shadowColor: '#6effe1', shadowOpacity: 1, shadowRadius: 8 }, creditRelayLineOne: { position: 'absolute', left: '17%', top: '28%', width: '18%', height: 2, backgroundColor: '#d3fff7' }, creditRelayLineTwo: { position: 'absolute', right: '17%', bottom: '28%', width: '18%', height: 2, backgroundColor: '#d3fff7' }, creditRelayGlint: { position: 'absolute', left: '44%', top: '10%', width: '10%', height: '80%', borderRadius: 99, backgroundColor: '#effffc99' }, creditPickupValue: { position: 'absolute', bottom: '-17%', color: '#fff2bd', backgroundColor: '#08131ddd', borderRadius: 6, overflow: 'hidden', paddingHorizontal: 4, fontSize: 7, fontWeight: '900', textShadowColor: '#b77d27', textShadowRadius: 3 }, creditRelayValue: { color: '#a9fff0', textShadowColor: '#37e5d4' },
  merchantCompass: { backgroundColor: '#26443f', borderColor: '#d5ae5e' }, merchantSailingCoin: { backgroundColor: '#55351f', borderColor: '#cb9453' }, merchantCoinRim: { position: 'absolute', width: '84%', height: '84%', borderWidth: 2, borderColor: '#e1bb6c', borderRadius: 999 }, merchantCompassAura: { position: 'absolute', width: '105%', height: '105%', borderRadius: 999, borderWidth: 1, borderColor: '#9cffe2', shadowColor: '#66f5dd', shadowOpacity: 0.85, shadowRadius: 8 }, compassInner: { position: 'absolute', width: '61%', height: '61%', borderWidth: 1, borderColor: '#9ce3d0', borderRadius: 999 }, compassNorth: { position: 'absolute', top: '25%', width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 12, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#f3d27b' }, compassSouth: { position: 'absolute', bottom: '25%', width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 12, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#7dcfc4' }, compassWheel: { position: 'absolute', width: '94%', height: '94%', borderWidth: 2, borderColor: '#b4823f', borderRadius: 999 }, wheelSpoke: { position: 'absolute', backgroundColor: '#e0bd72', borderRadius: 2 }, wheelSpokeNorth: { width: 2, height: '18%', top: '-6%', left: '48%' }, wheelSpokeSouth: { width: 2, height: '18%', bottom: '-6%', left: '48%' }, wheelSpokeEast: { height: 2, width: '18%', right: '-6%', top: '48%' }, wheelSpokeWest: { height: 2, width: '18%', left: '-6%', top: '48%' }, wheelHub: { position: 'absolute', left: '42%', top: '42%', width: '16%', height: '16%', borderRadius: 999, backgroundColor: '#f0d27d', borderWidth: 1, borderColor: '#fff4c1' }, compassMark: { position: 'absolute', top: '21%', color: '#f9e5a3', fontSize: 6, fontWeight: '900' }, compassBearing: { position: 'absolute', right: '3%', top: '17%', color: '#e6ffff', fontSize: 7, textShadowColor: '#82fff1', textShadowRadius: 5 }, sailingCoinInset: { position: 'absolute', width: '69%', height: '69%', borderWidth: 1, borderColor: '#d6a665', borderRadius: 999, backgroundColor: '#6b4627' }, sailingShip: { color: '#f0ce91', fontSize: 17, textShadowColor: '#f5dfa7', textShadowRadius: 4, zIndex: 1 }, sailingWake: { position: 'absolute', bottom: '17%', width: '70%', height: '22%', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f2d69a', borderRadius: 999 }, sailingWave: { position: 'absolute', bottom: '24%', width: '55%', height: '12%', flexDirection: 'row', alignItems: 'center' }, waveLeft: { flex: 1, height: 3, borderTopWidth: 1, borderColor: '#e6c88d', borderRadius: 999 }, waveRight: { flex: 1, height: 3, borderTopWidth: 1, borderColor: '#e6c88d', borderRadius: 999 }, merchantCoinGlint: { position: 'absolute', left: '43%', width: '12%', height: '80%', backgroundColor: '#fff4cb99', borderRadius: 999 }, captureCoinFlash: { position: 'absolute', width: '43%', height: '43%', borderWidth: 2, borderRadius: 999, backgroundColor: '#fff7d022' },
  stationBeam: { position: 'absolute', top: '62%', left: 0, right: 0, height: 2, backgroundColor: '#58dfd2', opacity: 0.75, shadowColor: '#59efdc', shadowOpacity: 1, shadowRadius: 9 }, figureThree: { left: '49%', top: 48 }, marketHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 17 }, stationSubhead: { maxWidth: 360, marginTop: 4, color: '#a0b5b2', fontSize: 9, lineHeight: 14 }, marketWallet: { minWidth: 110, alignItems: 'flex-end', padding: 8, borderWidth: 1, borderColor: '#768371', borderRadius: 7, backgroundColor: '#101c20dd' }, walletValue: { color: '#f6d27d', fontSize: 14, fontWeight: '900' }, walletLabel: { color: '#91aaa8', fontSize: 6, fontWeight: '900', letterSpacing: 1 }, walletDivider: { width: '100%', height: 1, marginVertical: 5, backgroundColor: '#526260' }, stationTicker: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 12, paddingTop: 7, borderTopWidth: 1, borderColor: '#62726b' }, tickerText: { color: '#b8c7bb', fontSize: 7, fontWeight: '900', letterSpacing: 0.9 }, tickerReset: { marginLeft: 'auto', color: '#f0b969', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 }, marketNav: { flexDirection: 'row', backgroundColor: '#0c141c', borderBottomWidth: 1, borderColor: '#36454a' }, marketNavButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' }, marketNavActive: { borderBottomColor: '#61e1c6', backgroundColor: '#132721' }, marketNavText: { color: '#73878b', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, marketNavTextActive: { color: '#a2f3df' }, marketBody: { flex: 1, backgroundColor: '#0b141c' }, reactorContent: { padding: 12, gap: 10, paddingBottom: 20 }, exchangeContent: { padding: 14, gap: 12, paddingBottom: 22 }, areaHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, areaEyebrow: { color: '#62d9c0', fontSize: 7, fontWeight: '900', letterSpacing: 1.7 }, areaTitle: { color: '#eef3f1', fontSize: 18, fontWeight: '900', marginTop: 2 }, reactorReadout: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#49635c', borderRadius: 6, backgroundColor: '#101d20' }, readoutBig: { color: '#e9c676', fontSize: 16, fontWeight: '900' }, readoutSmall: { color: '#879b97', fontSize: 6, fontWeight: '900', letterSpacing: 1 }, marketHint: { color: '#819394', fontSize: 8, lineHeight: 13 }, moduleGrid: { gap: 8 }, moduleCard: { padding: 10, borderWidth: 1, borderColor: '#35464a', borderRadius: 9, backgroundColor: '#111d24' }, moduleTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, moduleHeading: { flex: 1 }, moduleTitle: { color: '#e2ece9', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }, moduleLevel: { color: '#78d8c2', fontSize: 7, fontWeight: '800', marginTop: 3, letterSpacing: 0.8 }, moduleBars: { color: '#f0c878', fontSize: 12, fontWeight: '900' }, moduleEffect: { color: '#93a4a2', fontSize: 8, lineHeight: 13, marginTop: 5 }, statCompare: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 9, padding: 8, borderRadius: 6, backgroundColor: '#0a1319' }, statCell: { flex: 1 }, statLabel: { color: '#829392', fontSize: 6, fontWeight: '900', letterSpacing: 1 }, statValue: { color: '#aebcb6', fontSize: 8, fontWeight: '800', marginTop: 3 }, statValueLive: { color: '#a4f0d8', fontSize: 8, fontWeight: '900', marginTop: 3 }, statArrow: { color: '#d5b76c', fontSize: 18, fontWeight: '800' }, assignmentRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 }, assignmentLabel: { color: '#819394', fontSize: 6, fontWeight: '900', letterSpacing: 0.6 }, assignmentPips: { flex: 1, flexDirection: 'row', gap: 3, alignItems: 'center' }, assignmentPip: { width: 8, height: 5, borderRadius: 2, borderWidth: 1, borderColor: '#42575a', backgroundColor: '#172327' }, assignmentPipFilled: { backgroundColor: '#62e2c5', borderColor: '#b1ffe9', shadowColor: '#61dfc4', shadowOpacity: 0.8, shadowRadius: 4 }, assignmentCount: { minWidth: 37, textAlign: 'right', color: '#e0c476', fontSize: 6, fontWeight: '900' }, extraPips: { color: '#f2cb74', fontSize: 7, fontWeight: '900' }, moduleInstall: { alignItems: 'center', marginTop: 8, padding: 9, borderRadius: 5, borderWidth: 1, borderColor: '#4a9a83', backgroundColor: '#15362f' }, moduleInstallText: { color: '#adf5df', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 }, futureModule: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: '#435550', borderRadius: 8, backgroundColor: '#0c171b' }, futureModuleGlyph: { width: 35, color: '#76b9a9', fontSize: 25, textAlign: 'center' }, futureModuleCopy: { flex: 1 }, comingSoon: { color: '#b49357', fontSize: 6, fontWeight: '900', letterSpacing: 0.9 }, exchangeHero: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderWidth: 1, borderColor: '#596255', borderRadius: 9, backgroundColor: '#172126' }, exchangeIcon: { width: 22, height: 39, borderWidth: 2, borderColor: '#e1c27a', borderRadius: 5, padding: 4, backgroundColor: '#253b39' }, exchangeCopy: { flex: 1 }, exchangeCount: { alignItems: 'center' }, pricePanel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 13, borderWidth: 1, borderColor: '#3b4d4c', borderRadius: 8, backgroundColor: '#101a20' }, priceValue: { color: '#f4d17a', fontSize: 18, fontWeight: '900', marginTop: 4 }, priceCurrency: { color: '#99a8a0', fontSize: 7, letterSpacing: 1 }, buyBarButton: { alignItems: 'center', paddingHorizontal: 15, paddingVertical: 11, borderRadius: 6, backgroundColor: '#1b6555', borderWidth: 1, borderColor: '#6ce1bd' }, buyBarTitle: { color: '#e5fff4', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, buyBarCost: { color: '#a6d9c9', fontSize: 7, marginTop: 3 }, stockPanel: { padding: 11, borderWidth: 1, borderColor: '#344448', borderRadius: 8, backgroundColor: '#101a20' }, inventoryStack: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center', minHeight: 32, marginTop: 7 }, inventoryBar: { width: 12, height: 27, padding: 2, borderWidth: 1, borderColor: '#d5b96e', borderRadius: 3, backgroundColor: '#273735' }, inventoryBarGlow: { flex: 1, borderRadius: 2, backgroundColor: '#67e2c4', shadowColor: '#67e2c4', shadowOpacity: 0.9, shadowRadius: 4 }, kioskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, kioskCard: { flexGrow: 1, flexBasis: '30%', minWidth: 100, padding: 9, borderWidth: 1, borderColor: '#334448', borderRadius: 7, backgroundColor: '#10191f' }, kioskGlyph: { color: '#e3bd6c', fontSize: 20, marginBottom: 4 }, marketCreditTag: { padding: 8, borderWidth: 1, borderColor: '#665639', borderRadius: 5, color: '#f0d080', fontSize: 8, fontWeight: '900' }, manifestSummary: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#4d6359', borderRadius: 8, backgroundColor: '#13211e' }, manifestNumber: { color: '#65e4c6', fontSize: 28, fontWeight: '900' }, manifestRow: { minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderBottomWidth: 1, borderColor: '#29383c' }, manifestCopy: { flex: 1 }, manifestPips: { flexDirection: 'row', gap: 2 }, manifestLevel: { color: '#efd080', fontSize: 7, fontWeight: '900' }, resetNotice: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 7, padding: 12, borderWidth: 1, borderColor: '#3a4b4d', borderRadius: 7, backgroundColor: '#10191f' }, resetGlyph: { color: '#73dfc1', fontSize: 25 }, marketStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, marketFooter: { paddingHorizontal: 12, paddingTop: 7, borderTopWidth: 1, borderColor: '#2e4144', backgroundColor: '#0c151c' }, footerMarketStatus: { color: '#94aaa5', fontSize: 7, fontWeight: '900', letterSpacing: 0.7, marginBottom: 4 }, statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#56ddb9' },
  devSubtabs: { flexDirection: 'row', gap: 7, marginBottom: 7 }, devSubtab: { borderWidth: 1, borderColor: '#26394b', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 30, backgroundColor: '#03080eef', alignItems: 'center', justifyContent: 'center', padding: 15 }, choicePanel: { width: '100%', maxWidth: 520, padding: 20, borderWidth: 1, borderColor: '#4cbda5', borderRadius: 14, backgroundColor: '#0d1926', gap: 10 }, merchantPanel: { flex: 1, width: '100%', maxWidth: 720, borderWidth: 1, borderColor: '#477d79', borderRadius: 14, overflow: 'hidden', backgroundColor: '#0b131b' }, stationBackground: { minHeight: 160, padding: 20, justifyContent: 'flex-end', backgroundColor: '#1b2427', overflow: 'hidden' }, stationGrid: { ...StyleSheet.absoluteFill, opacity: 0.22, borderWidth: 1, borderColor: '#5c736c' }, stationSign: { position: 'absolute', top: 10, right: 14, color: '#f1bd61', fontSize: 8, letterSpacing: 1.5, fontWeight: '900' }, stationFigure: { position: 'absolute', top: 42, width: 25, height: 48, alignItems: 'center', opacity: 0.86 }, figureOne: { left: '25%' }, figureTwo: { left: '69%', top: 58 }, figureHead: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#8ed8cf', borderWidth: 2, borderColor: '#d1bb78' }, figureBody: { width: 18, height: 29, marginTop: 3, borderRadius: 7, backgroundColor: '#485d5b', borderWidth: 1, borderColor: '#80c8be' }, figureAmber: { backgroundColor: '#786343', borderColor: '#d0a25b' }, figureArm: { position: 'absolute', width: 5, height: 15, right: -2, top: 19, marginTop: 0 }, merchantEyebrow: { color: '#5be0c1', fontSize: 9, fontWeight: '900', letterSpacing: 1.7 }, merchantHeading: { color: '#f2f6ff', fontSize: 23, fontWeight: '900' }, merchantBalance: { color: '#f0c874', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, shopScroll: { flex: 1 }, shopCards: { padding: 12, gap: 8 }, powerBarStack: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 28, marginTop: 5 }, powerBarIcon: { width: 12, height: 24, borderWidth: 1, borderColor: '#e5c471', borderRadius: 3, backgroundColor: '#263a3b', justifyContent: 'center', padding: 2 }, powerBarCore: { flex: 1, backgroundColor: '#65e2c8', borderRadius: 2, shadowColor: '#65e2c8', shadowOpacity: 0.8, shadowRadius: 4 }, shopStock: { padding: 12, borderWidth: 1, borderColor: '#394d54', borderRadius: 8, backgroundColor: '#101d25' }, shopCardTitle: { color: '#ecf2f3', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }, shopDescription: { color: '#99a9aa', fontSize: 9, lineHeight: 14, marginTop: 3, flex: 1 }, shopAction: { marginTop: 9, padding: 10, alignItems: 'center', borderRadius: 5, backgroundColor: '#176354', borderWidth: 1, borderColor: '#55cbb0' }, shopActionText: { color: '#edfff8', fontSize: 9, fontWeight: '900', letterSpacing: 0.7, textAlign: 'center' }, shopSecondary: { padding: 11, alignItems: 'center', borderWidth: 1, borderColor: '#b38d4f', borderRadius: 6 }, rewardSlot: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderWidth: 1, borderColor: '#35464c', borderRadius: 8, backgroundColor: '#121e27' }, rewardCopy: { flex: 1 }, installButton: { minWidth: 62, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', borderRadius: 5, backgroundColor: '#704e22' }, futureReward: { width: 38, textAlign: 'center', color: '#5be0c1', fontSize: 27, fontWeight: '400' }, shopExit: { margin: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#58706d', borderRadius: 6 }, merchantTokenButton: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#9b8149', borderRadius: 6 }, merchantTokenText: { color: '#f0d38a', fontSize: 8, fontWeight: '900' },
  profileManager: { paddingHorizontal: 8, paddingVertical: 6, marginBottom: 5, borderWidth: 1, borderColor: '#29434a', borderRadius: 8, backgroundColor: '#09151d' }, profileManagerHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, profileManagerHint: { color: '#8096a8', fontSize: 7, marginTop: 2 }, profileManagerActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 4 }, profileScroller: { gap: 5, paddingTop: 6, paddingBottom: 1 }, profileCard: { width: 128, padding: 5, borderWidth: 1, borderColor: '#29394a', borderRadius: 6, backgroundColor: '#0c1823' }, profileCardSelected: { borderColor: '#4fc7a9', backgroundColor: '#102720' }, profileCardApply: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }, profileCardName: { flex: 1, color: '#d1e0e7', fontSize: 8, fontWeight: '800' }, profileCardApplyText: { color: '#7ee9d0', fontSize: 7, fontWeight: '900' }, profileCardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, borderTopWidth: 1, borderColor: '#253440', paddingTop: 2 }, profileCardActionText: { color: '#94b6c1', fontSize: 6, fontWeight: '900', padding: 4 },
  devSubtabScroller: { flexDirection: 'row', gap: 7, paddingBottom: 2 }, devSection: { borderWidth: 1, borderColor: '#233345', borderRadius: 8, overflow: 'hidden', marginTop: 5 }, devSectionHeader: { minHeight: 38, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0c1623' }, devSectionTitle: { color: '#73e6cb', fontSize: 9, fontWeight: '900', letterSpacing: 1.15 }, devSectionChevron: { color: '#9bb2c7', fontSize: 17, fontWeight: '700' }, devSectionBody: { paddingHorizontal: 8, paddingBottom: 8 }, pickupSettingsCard: { borderWidth: 1, borderColor: '#29394a', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 5, marginTop: 8, backgroundColor: '#09131f' }, pickupCardHeading: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 7 }, pickupCardHeadingText: { flex: 1 }, pickupCardSubline: { color: '#71889a', fontSize: 6, letterSpacing: 0.25, marginBottom: 2 }, pickupSizeBadge: { color: '#ffe193', fontSize: 9, fontWeight: '900', minWidth: 38, textAlign: 'right' }, pickupCardChevron: { width: 18, color: '#72d7be', fontSize: 17, textAlign: 'center' }, pickupSettingsTitle: { color: '#b6c7d9', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, paddingVertical: 2 }, sliderRow: { paddingVertical: 5, borderBottomWidth: 1, borderColor: '#172332' }, sliderHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sliderHitArea: { height: 28, justifyContent: 'center', marginHorizontal: 2 }, sliderTrack: { position: 'absolute', left: 9, right: 9, height: 5, borderRadius: 99, backgroundColor: '#263746', overflow: 'hidden' }, sliderFill: { height: '100%', borderRadius: 99, backgroundColor: '#54d7b6' }, sliderThumb: { position: 'absolute', top: 7, width: 14, height: 14, marginLeft: -7, borderWidth: 2, borderColor: '#c7fff0', borderRadius: 99, backgroundColor: '#168d78', shadowColor: '#4cf3cd', shadowOpacity: 0.7, shadowRadius: 5 }, sliderRangeLabels: { flexDirection: 'row', justifyContent: 'space-between' }, sliderRangeText: { color: '#71899a', fontSize: 6, fontWeight: '700' },
  breakWallTrack: { position: 'absolute', height: 12, top: '50%', marginTop: -6, borderTopWidth: 2, borderBottomWidth: 2, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }, breakWallCore: { width: '100%', height: 3, shadowColor: '#ff8b9a', shadowOpacity: 1, shadowRadius: 8 }, crackMark: { position: 'absolute', top: -5, width: 4, height: 22, borderRadius: 2, shadowColor: '#fff', shadowOpacity: 0.8, shadowRadius: 4 }, crumbleChip: { position: 'absolute', top: -4, width: 8, height: 8, borderRadius: 2, shadowColor: '#ffd89d', shadowOpacity: 0.8, shadowRadius: 5 }, skinBreakCrack: { height: 9, width: 38, borderColor: '#ff7b8b', borderRadius: 1, borderStyle: 'dashed' }, skinBreakCrumble: { height: 17, width: 36, borderColor: '#e9bd79', borderRadius: 3 },
  wallLengthBurst: { position: 'absolute', zIndex: 14, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }, wallLengthCore: { position: 'absolute', shadowOpacity: 1, shadowRadius: 7, elevation: 3 }, longCrackMark: { position: 'absolute', shadowColor: '#fff5ef', shadowOpacity: 1, shadowRadius: 5, elevation: 2 }, longCrumbleChip: { position: 'absolute', width: 7, height: 7, borderRadius: 1, shadowColor: '#fff1cb', shadowOpacity: 0.9, shadowRadius: 5, elevation: 2 },
  ballPreview: { overflow: 'visible' }, plasmaHalo: { position: 'absolute', left: '11%', top: '11%', width: '78%', height: '78%', borderRadius: 999, backgroundColor: '#6b43d755', shadowColor: '#a477ff', shadowOpacity: 1, shadowRadius: 8 }, plasmaCore: { position: 'absolute', left: '24%', top: '25%', width: '52%', height: '52%', borderRadius: 999, backgroundColor: '#5ce9ff', borderWidth: 1, borderColor: '#fff0ff', shadowColor: '#4deaff', shadowOpacity: 1, shadowRadius: 5 }, plasmaOrbit: { position: 'absolute', left: '7%', top: '34%', width: '86%', height: '34%', borderRadius: 999, borderWidth: 2, borderColor: '#d7a5ff', transform: [{ rotate: '-34deg' }], shadowColor: '#ba8dff', shadowOpacity: 0.95, shadowRadius: 4 }, plasmaOrbitHighlight: { position: 'absolute', left: '19%', top: '28%', width: '18%', height: '14%', borderRadius: 999, backgroundColor: '#fff', transform: [{ rotate: '-34deg' }] }, plasmaGlint: { position: 'absolute', left: '27%', top: '28%', width: '25%', height: '9%', borderRadius: 999, backgroundColor: '#fff', transform: [{ rotate: '-28deg' }] }, plasmaSpark: { position: 'absolute', right: '17%', bottom: '24%', width: '13%', height: '13%', borderRadius: 999, backgroundColor: '#fff6ac', shadowColor: '#fff6ac', shadowOpacity: 1, shadowRadius: 4 },
  seedOrbShade: { position: 'absolute', left: '10%', top: '14%', width: '78%', height: '76%', borderRadius: 999, backgroundColor: '#163c2d', transform: [{ rotate: '-28deg' }] }, seedOrbLight: { position: 'absolute', left: '20%', top: '14%', width: '58%', height: '57%', borderRadius: 999, backgroundColor: '#78c65a', borderWidth: 1, borderColor: '#c9f394' }, seedOrbSeam: { position: 'absolute', left: '48%', top: '17%', width: '9%', height: '68%', borderRadius: 999, backgroundColor: '#f4d66e', transform: [{ rotate: '22deg' }], shadowColor: '#fff0a3', shadowOpacity: 0.9, shadowRadius: 3 }, seedOrbVein: { position: 'absolute', left: '27%', top: '56%', width: '45%', height: 2, backgroundColor: '#d5f098', transform: [{ rotate: '-31deg' }] }, seedOrbLeaf: { position: 'absolute', right: '10%', top: '10%', width: '27%', height: '20%', borderRadius: 999, borderTopRightRadius: 2, backgroundColor: '#b5e77b', borderWidth: 1, borderColor: '#e1f8ae', transform: [{ rotate: '-25deg' }] }, seedOrbGlint: { position: 'absolute', left: '22%', top: '19%', width: '29%', height: '8%', borderRadius: 999, backgroundColor: '#fff5c3', transform: [{ rotate: '-28deg' }] },
  voidFacet: { position: 'absolute', left: '18%', top: '18%', width: '64%', height: '64%', backgroundColor: '#49438c', borderWidth: 1, borderColor: '#d5c9ff', transform: [{ rotate: '45deg' }] }, voidFacetInner: { position: 'absolute', left: '30%', top: '28%', width: '42%', height: '48%', backgroundColor: '#25234e', borderWidth: 1, borderColor: '#98ecff', transform: [{ rotate: '45deg' }] }, voidFacetShade: { position: 'absolute', left: '16%', top: '53%', width: '53%', height: '34%', backgroundColor: '#0d1024a8', transform: [{ rotate: '-24deg' }] }, voidFacetGlint: { position: 'absolute', left: '26%', top: '17%', width: '29%', height: '8%', borderRadius: 999, backgroundColor: '#f6fbff', transform: [{ rotate: '-32deg' }], shadowColor: '#b8efff', shadowOpacity: 1, shadowRadius: 4 },
  screen: { flex: 1, backgroundColor: '#060a11', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 },
  screenWeb: { height: '100dvh' as any, maxHeight: '100dvh' as any, minHeight: 0, overflow: 'hidden', paddingHorizontal: 16, paddingTop: 7, paddingBottom: 5 }, headerWeb: { marginBottom: 4 }, tabBarWeb: { marginBottom: 3 }, topGameActionsWeb: { marginTop: 0, marginBottom: 3 }, webGameContent: { flex: 1, minHeight: 0, position: 'relative', flexDirection: 'column' },
  phoneHeader: { marginBottom: 2 }, phoneKicker: { fontSize: 7, letterSpacing: 2 }, phoneTitle: { fontSize: 18 }, phoneTabBar: { marginBottom: 2, gap: 5 }, phoneTopActions: { marginBottom: 2 }, phoneGameContent: { gap: 2 }, phoneHud: { minHeight: 34, marginBottom: 2, alignItems: 'center' }, phoneStageRow: { flex: 1, minHeight: 0, flexDirection: 'row', alignItems: 'stretch', gap: 7 }, phoneResourceRail: { width: 136, height: '100%', maxHeight: '100%', maxWidth: '24%', minWidth: 116, flexShrink: 0 }, phoneResourceRailContent: { flexDirection: 'column', gap: 5, paddingBottom: 4 }, webResourceRail: { width: 226, flexShrink: 0, flexDirection: 'column', gap: 7, overflow: 'hidden', paddingRight: 4 }, phoneAbilityRail: { flexDirection: 'column', alignItems: 'stretch', gap: 5 }, phoneRailAbility: { width: '100%' }, phoneAbilityButton: { width: '100%', minHeight: 40, borderRadius: 7, paddingVertical: 2 }, phoneBoardWrap: { flex: 1, minWidth: 0, minHeight: 0, alignSelf: 'stretch', borderWidth: 1, borderColor: '#263446', borderRadius: 10, overflow: 'hidden' }, phoneStageInfoRow: { paddingTop: 1, paddingBottom: 0, minHeight: 12, flexShrink: 0 }, phoneControls: { display: 'none' }, rotatePrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#080e17', borderWidth: 1, borderColor: '#203245', borderRadius: 12 }, rotateGlyph: { color: '#63e1c7', fontSize: 48, fontWeight: '700', lineHeight: 58 }, rotateTitle: { color: '#e9f3f2', fontSize: 16, fontWeight: '900', letterSpacing: 2, marginTop: 8 }, rotateCopy: { color: '#8ea4b2', fontSize: 11, textAlign: 'center', marginTop: 7 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  kicker: { color: '#57e2c2', fontSize: 10, letterSpacing: 3, fontWeight: '800' },
  title: { color: '#f2f6ff', fontSize: 25, fontWeight: '800', letterSpacing: 0.3 },
  tabBar: { flexDirection: 'row', gap: 8, marginBottom: 9 }, tabButton: { borderWidth: 1, borderColor: '#344356', borderRadius: 7, paddingVertical: 6, paddingHorizontal: 13 }, tabSelected: { borderColor: '#55dfbf', backgroundColor: '#10251f' }, tabText: { color: '#8393a7', fontSize: 9, fontWeight: '800', letterSpacing: 1 }, tabTextSelected: { color: '#7ee9d0' },
  devOverlayQuick: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, padding: 5, marginBottom: 4, borderWidth: 1, borderColor: '#456456', borderRadius: 6, backgroundColor: '#0b1718' }, devOverlayTitle: { color: '#8fe8c5', fontSize: 7, fontWeight: '900', letterSpacing: 0.8, marginHorizontal: 3 }, devOverlayButton: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, borderWidth: 1, borderColor: '#38534a', borderRadius: 4, backgroundColor: '#12221e' }, devOverlayButtonText: { color: '#d1e4d9', fontSize: 6, fontWeight: '900', letterSpacing: 0.35 },
  best: { color: '#94a2b8', fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  hud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, hudWeb: { position: 'relative', alignItems: 'center', minHeight: 38, marginBottom: 0, flexShrink: 0 }, stageFocus: { position: 'absolute', left: '50%', transform: [{ translateX: -32 }], alignItems: 'center', zIndex: 2 }, crewReadout: { color: '#a1c0be', fontSize: 7, fontWeight: '900', letterSpacing: 0.8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#385652', borderRadius: 5, backgroundColor: '#0a1618' }, eventBadges: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 4, paddingLeft: 8 }, pictureEventLabel: { color: '#c4e8ff', backgroundColor: '#081321d9', borderWidth: 1, borderColor: '#86a7c1', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, eliminationEventLabel: { color: '#ffb6c2', backgroundColor: '#2a1018e8', borderWidth: 1, borderColor: '#ce536d', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, driftSwarmEventLabel: { color: '#f5f3ff', backgroundColor: '#451e55ed', borderWidth: 1, borderColor: '#d187ff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, fontSize: 9, fontWeight: '900', letterSpacing: 1, shadowColor: '#cf7dff', shadowOpacity: 0.85, shadowRadius: 8 }, treasureEventLabel: { color: '#ffe6a4', backgroundColor: '#211707e8', borderWidth: 1, borderColor: '#af8643', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  lifeHud: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8, marginBottom: 8 }, lifeHudWeb: { width: 245, flexDirection: 'column', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 0, gap: 5 }, hudPickupIcons: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2 },
  hudLabel: { color: '#77869d', letterSpacing: 1.5, fontSize: 9, fontWeight: '800', marginBottom: 3 },
  hudValue: { color: '#f1f5ff', fontSize: 17, fontWeight: '800' },
  hearts: { color: '#ff637c', fontSize: 17, fontWeight: '800', width: '100%', flexWrap: 'wrap', flexShrink: 1, textAlign: 'left' },
  lifeCount: { color: '#f2f6ff', fontSize: 16, fontWeight: '800' },
  stageRow: { flex: 1, minHeight: 300, flexDirection: 'row', alignItems: 'stretch' }, stageRowWeb: { flex: 1, minHeight: 0, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-start', gap: 12 },
  boardWrap: { minHeight: 300, borderWidth: 1, borderColor: '#263446', borderRadius: 12, overflow: 'hidden' },
  stageInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 7, paddingBottom: 2, gap: 8 }, stageInfoRowWeb: { paddingTop: 2, paddingBottom: 0, gap: 4, flexShrink: 0 }, controlsWeb: { paddingTop: 2, paddingBottom: 2, flexShrink: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, rulesRowWeb: { display: 'none' }, scoresWeb: { display: 'none' },
  abilityRail: { flexDirection: 'row', alignItems: 'center', gap: 8 }, phoneAbilityItem: { width: '100%', alignItems: 'stretch' }, railAbility: { alignItems: 'center' }, storageReadout: { marginTop: 2, color: '#92a7b4', fontSize: 6, fontWeight: '900', letterSpacing: 0.25 }, storageUpgrade: { minWidth: 64, marginTop: 2, paddingHorizontal: 4, paddingVertical: 3, alignItems: 'center', borderWidth: 1, borderColor: '#557b75', borderRadius: 4, backgroundColor: '#102521' }, storageUpgradeDisabled: { opacity: 0.4 }, storageUpgradeText: { color: '#9cebd6', fontSize: 6, fontWeight: '900', letterSpacing: 0.2 }, waldoWalkHud: { width: '100%', height: 42, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -2, marginBottom: 7, paddingHorizontal: 9, borderWidth: 1, borderColor: '#5f342f', borderRadius: 8, backgroundColor: '#171c26' }, waldoWalkLabel: { minWidth: 116, alignItems: 'flex-start', justifyContent: 'center', gap: 2 }, waldoPetLabel: { color: '#f0d7ad', fontSize: 8, fontWeight: '900', letterSpacing: 0.4 }, waldoPetDrag: { color: '#9cb0b7', fontSize: 6, fontWeight: '800', letterSpacing: 0.5 }, waldoWalkTrack: { height: 38, flex: 1, position: 'relative', justifyContent: 'center' }, waldoWalkDashes: { position: 'absolute', top: '60%', left: 0, right: 0, height: 1, borderTopWidth: 1, borderColor: '#725b50', borderStyle: 'dashed', opacity: 0.8 }, waldoWalkSprite: { position: 'absolute', top: 1, left: 0, width: 34, height: 36 }, waldoHeartDust: { position: 'absolute', color: '#ff6f88', fontSize: 9, opacity: 0.46, textShadowColor: '#ffc1d0', textShadowRadius: 3 },
  board: { flex: 1, overflow: 'hidden', position: 'relative' },
  pictureArt: { ...StyleSheet.absoluteFill, overflow: 'hidden' }, waldoCrowdBackdrop: { ...StyleSheet.absoluteFill, opacity: 0.5, backgroundColor: '#9d8967', borderWidth: 8, borderColor: '#594e42' }, waldoCrowdStall: { position: 'absolute', width: '12%', height: '5%', opacity: 0.65, borderWidth: 2, borderColor: '#403b34', borderRadius: 3 }, waldoPuzzleTarget: { position: 'absolute', zIndex: 3, alignItems: 'center', justifyContent: 'flex-start' }, waldoPuzzleCap: { width: '88%', height: '16%', backgroundColor: '#ce3d44', borderRadius: 7, borderWidth: 1, borderColor: '#ffd7bd', alignItems: 'center', justifyContent: 'center' }, waldoPuzzleCapStripe: { width: '82%', height: 2, backgroundColor: '#fff3dd' }, waldoPuzzleFace: { width: '48%', height: '19%', backgroundColor: '#e8c599', borderRadius: 8, borderWidth: 1, borderColor: '#604d3b', alignItems: 'center' }, waldoPuzzleGlasses: { position: 'absolute', top: '32%', width: '90%', height: '38%', borderWidth: 1.2, borderColor: '#292b30', borderRadius: 7 }, waldoPuzzleNose: { position: 'absolute', bottom: '3%', width: 3, height: 3, borderRadius: 3, backgroundColor: '#b88768' }, waldoPuzzleBody: { width: '74%', height: '32%', marginTop: 1, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: '#f5e0c6', backgroundColor: '#f6e8d0' }, waldoPuzzleStripe: { height: '20%', backgroundColor: '#eee0c6' }, waldoPuzzleRedStripe: { backgroundColor: '#c8323f' }, waldoPuzzleLegs: { width: '54%', height: '25%', flexDirection: 'row', justifyContent: 'space-between' }, waldoPuzzleLeg: { width: '34%', height: '100%', backgroundColor: '#38404a', borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }, waldoFoundRing: { position: 'absolute', left: '-60%', top: '-25%', width: '220%', height: '180%', borderWidth: 3, borderColor: '#fff2a4', borderRadius: 999, alignItems: 'center', justifyContent: 'center', shadowColor: '#ffd65e', shadowOpacity: 1, shadowRadius: 12 }, waldoFoundGlyph: { color: '#fff4b3', fontSize: 20, textShadowColor: '#ffb33c', textShadowRadius: 9 }, pictureSky: { ...StyleSheet.absoluteFill }, pictureHaze: { position: 'absolute', top: '27%', left: '-15%', width: '130%', height: '23%', borderRadius: 999, opacity: 0.28 }, pictureCloud: { position: 'absolute', height: '2.5%', borderRadius: 999, opacity: 0.24 }, pictureCloudOne: { top: '18%', left: '8%', width: '25%' }, pictureCloudTwo: { top: '34%', right: '7%', width: '18%', opacity: 0.16 }, pictureStar: { position: 'absolute', borderRadius: 999 }, pictureSun: { position: 'absolute', width: '17%', aspectRatio: 1, borderRadius: 999, left: '42%', top: '27%', opacity: 0.94, shadowColor: '#ffe0a1', shadowOpacity: 0.8, shadowRadius: 20 }, pictureBranch: { position: 'absolute', borderRadius: 999 }, picturePatternRing: { position: 'absolute', borderWidth: 1, backgroundColor: 'transparent' }, pictureRibbon: { position: 'absolute', left: '-25%', borderRadius: 999 },
  picturePeak: { position: 'absolute', width: 0, height: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0, borderStyle: 'solid' }, picturePeakFarLeft: { left: '-24%', bottom: '24%', borderLeftWidth: 225, borderRightWidth: 225, borderBottomWidth: 355 }, picturePeakFarRight: { right: '-25%', bottom: '24%', borderLeftWidth: 260, borderRightWidth: 260, borderBottomWidth: 400 }, picturePeakMidLeft: { left: '-38%', bottom: '16%', borderLeftWidth: 255, borderRightWidth: 255, borderBottomWidth: 315 }, picturePeakMidRight: { right: '-30%', bottom: '16%', borderLeftWidth: 280, borderRightWidth: 280, borderBottomWidth: 330 }, picturePeakNear: { left: '-48%', bottom: '9%', borderLeftWidth: 340, borderRightWidth: 340, borderBottomWidth: 310 }, pictureSnow: { position: 'absolute', width: 0, height: 0, borderLeftWidth: 18, borderRightWidth: 18, borderBottomWidth: 30, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#dce9e7', opacity: 0.64 }, pictureSnowLeft: { left: '14%', bottom: '57%', transform: [{ rotate: '12deg' }] }, pictureSnowRight: { right: '19%', bottom: '60%', borderLeftWidth: 14, borderRightWidth: 14, borderBottomWidth: 24, opacity: 0.48 }, pictureLake: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '28%', opacity: 0.95 }, pictureWaterGlint: { position: 'absolute', height: 1.5, borderRadius: 999 }, pictureReflection: { position: 'absolute', left: '43%', top: '73%', width: '14%', height: '2%', borderRadius: 999, opacity: 0.72 }, pictureReflectionShort: { top: '79%', left: '46%', width: '8%', height: '1.3%', opacity: 0.55 }, pictureReflectionLower: { top: '85%', left: '40%', width: '20%', height: '1%', opacity: 0.3 },
  grid: { ...StyleSheet.absoluteFill, opacity: 0.16, borderWidth: 1, borderColor: '#6a879c' },
  claimedCell: { position: 'absolute', backgroundColor: '#071019', opacity: 0.94 }, unclaimedMask: { position: 'absolute' },
  ball: { position: 'absolute', backgroundColor: '#647580', borderWidth: 1.25, borderColor: '#eef5f9', shadowOpacity: 0, elevation: 0, overflow: 'hidden' }, ballCore: { position: 'absolute', left: '6%', top: '6%', width: '88%', height: '88%', borderRadius: 999, backgroundColor: '#9caab3', borderWidth: 1, borderColor: '#dce6ec' }, ballShade: { position: 'absolute', right: '7%', bottom: '5%', width: '55%', height: '53%', borderRadius: 999, backgroundColor: '#263640', opacity: 0.55, transform: [{ rotate: '18deg' }] }, ballReflection: { position: 'absolute', left: '36%', top: '43%', width: '30%', height: '10%', borderRadius: 999, backgroundColor: '#fbfdff', opacity: 0.8, transform: [{ rotate: '-28deg' }] }, ballHighlight: { position: 'absolute', left: '16%', top: '12%', width: '43%', height: '23%', borderRadius: 999, backgroundColor: '#ffffff', opacity: 0.95, transform: [{ rotate: '-28deg' }] }, ballGlint: { position: 'absolute', left: '25%', top: '15%', width: '20%', height: '9%', borderRadius: 999, backgroundColor: '#ffffff', opacity: 0.95, transform: [{ rotate: '-28deg' }] }, steelGrain: { position: 'absolute', left: '13%', top: '54%', width: '69%', height: 1, backgroundColor: '#ecf5f7', opacity: 0.28, transform: [{ rotate: '-20deg' }] }, gunmetalRing: { position: 'absolute', left: '24%', top: '25%', width: '52%', height: '52%', borderRadius: 999, borderWidth: 1, borderColor: '#c8d7de', opacity: 0.22 }, rammedBall: { borderColor: '#ffb347' },
  wall: { position: 'absolute', zIndex: 3 }, activeWall: { backgroundColor: '#ff6681', shadowColor: '#ff6681', shadowOpacity: 0.8, shadowRadius: 8 }, fixedWall: { backgroundColor: '#5de6c6', shadowColor: '#5de6c6', shadowOpacity: 0.8, shadowRadius: 8 },
  power: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  exitBeacon: { borderWidth: 0, backgroundColor: 'transparent', overflow: 'visible' }, exitBeaconOuter: { position: 'absolute', width: '96%', height: '96%', borderRadius: 999, borderWidth: 1.5, borderColor: '#6af3d7', shadowColor: '#55efdb', shadowOpacity: 0.85, shadowRadius: 8 }, exitBeaconSpark: { position: 'absolute', width: '9%', height: '9%', right: '5%', top: '13%', borderRadius: 99, backgroundColor: '#fff', shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 7 }, exitShipArt: { position: 'absolute', width: '88%', height: '88%', alignItems: 'center', justifyContent: 'center' }, exitShipEngine: { position: 'absolute', width: '15%', height: '18%', bottom: '2%', borderRadius: 999, backgroundColor: '#75fff0', shadowColor: '#66edff', shadowOpacity: 1, shadowRadius: 9 }, exitShipWingLeft: { position: 'absolute', left: '4%', top: '36%', width: '43%', height: '39%', backgroundColor: '#176879', borderWidth: 1.5, borderColor: '#a0fff1', borderTopLeftRadius: 5, borderBottomLeftRadius: 15, borderBottomRightRadius: 4, transform: [{ skewY: '-16deg' }] }, exitShipWingRight: { position: 'absolute', right: '4%', top: '36%', width: '43%', height: '39%', backgroundColor: '#176879', borderWidth: 1.5, borderColor: '#a0fff1', borderTopRightRadius: 5, borderBottomRightRadius: 15, borderBottomLeftRadius: 4, transform: [{ skewY: '16deg' }] }, exitShipWingInsetLeft: { position: 'absolute', left: '14%', top: '44%', width: '24%', height: '7%', backgroundColor: '#52dfd1', borderRadius: 99, transform: [{ rotate: '-27deg' }] }, exitShipWingInsetRight: { position: 'absolute', right: '14%', top: '44%', width: '24%', height: '7%', backgroundColor: '#52dfd1', borderRadius: 99, transform: [{ rotate: '27deg' }] }, exitShipHull: { position: 'absolute', top: '10%', width: '38%', height: '75%', alignItems: 'center', backgroundColor: '#d2f8ee', borderRadius: 999, borderWidth: 1.5, borderColor: '#f0ffff', shadowColor: '#89fff0', shadowOpacity: 0.9, shadowRadius: 5, overflow: 'hidden' }, exitShipSpine: { position: 'absolute', top: '34%', width: '72%', height: '42%', backgroundColor: '#187c8b', borderRadius: 99 }, exitShipCanopy: { position: 'absolute', top: '21%', width: '66%', height: '27%', borderRadius: 99, backgroundColor: '#0e2d49', borderWidth: 1.5, borderColor: '#91ffff' }, exitShipCanopyGlint: { position: 'absolute', top: '25%', left: '39%', width: '20%', height: '4%', borderRadius: 99, backgroundColor: '#fff', transform: [{ rotate: '-28deg' }] }, exitShipNose: { position: 'absolute', top: '-9%', width: '68%', height: '22%', borderRadius: 99, backgroundColor: '#fff', shadowColor: '#a6ffff', shadowOpacity: 1, shadowRadius: 4 }, exitShipSignal: { position: 'absolute', top: '31%', width: '6%', height: '6%', borderRadius: 99, backgroundColor: '#fff3a1', shadowColor: '#ffe58a', shadowOpacity: 1, shadowRadius: 4 }, sectorBeaconTap: { position: 'absolute', zIndex: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 999 }, sectorBeaconPressed: { transform: [{ scale: 0.9 }], opacity: 0.75 }, roamingPet: { opacity: 0.82 },
  crimsonLifeOrb: { backgroundColor: 'transparent', borderColor: 'transparent', overflow: 'visible' }, crimsonOrbAura: { position: 'absolute', width: '108%', height: '108%', borderRadius: 999, backgroundColor: '#498fff66', shadowColor: '#7bbdff', shadowOpacity: 1, shadowRadius: 11 }, crimsonOrbRim: { position: 'absolute', width: '93%', height: '93%', borderRadius: 999, borderWidth: 4, borderColor: '#edfaff', shadowColor: '#b6e7ff', shadowOpacity: 1, shadowRadius: 6 }, crimsonOrbInnerRim: { position: 'absolute', width: '72%', height: '72%', borderRadius: 999, borderWidth: 2, borderColor: '#3d83bd', backgroundColor: '#091323' }, crimsonOrbCore: { position: 'absolute', width: '43%', height: '43%', borderRadius: 999, backgroundColor: '#94182f', borderWidth: 2, borderColor: '#fb4652', shadowColor: '#f52d51', shadowOpacity: 1, shadowRadius: 9 }, crimsonOrbGlint: { position: 'absolute', width: '25%', height: '9%', left: '26%', top: '20%', borderRadius: 999, backgroundColor: '#fff', transform: [{ rotate: '-25deg' }] }, crimsonOrbOrbit: { position: 'absolute', width: '115%', height: '42%', borderWidth: 1, borderColor: '#bbddff', borderRadius: 999, transform: [{ rotate: '-28deg' }] }, crimsonOrbSpark: { position: 'absolute', left: '5%', top: '14%', width: '8%', height: '8%', borderRadius: 999, backgroundColor: '#fff', shadowColor: '#9bd5ff', shadowOpacity: 1, shadowRadius: 5 }, crimsonOrbSparkTwo: { position: 'absolute', right: '4%', bottom: '12%', width: '6%', height: '6%', borderRadius: 999, backgroundColor: '#ffb8c1' }, crimsonOrbPupil: { position: 'absolute', width: '15%', height: '15%', borderRadius: 999, backgroundColor: '#ff8d99', opacity: 0.82 },
  waldoPickup: { backgroundColor: '#263039', borderColor: '#e8d9bc', overflow: 'visible' }, waldoLensGlow: { position: 'absolute', width: '86%', height: '86%', borderRadius: 999, backgroundColor: '#f3cf76', shadowColor: '#ffe39a', shadowOpacity: 1, shadowRadius: 7 }, waldoHead: { position: 'absolute', top: '22%', width: '38%', height: '36%', borderRadius: 999, backgroundColor: '#e8c6a0', borderWidth: 1, borderColor: '#fff1d4', zIndex: 2 }, waldoHair: { position: 'absolute', top: 0, width: '100%', height: '30%', borderTopLeftRadius: 99, borderTopRightRadius: 99, backgroundColor: '#50392f' }, waldoGlassesLeft: { position: 'absolute', top: '43%', left: '5%', width: '42%', height: '34%', borderRadius: 999, borderWidth: 1.2, borderColor: '#17191b' }, waldoGlassesRight: { position: 'absolute', top: '43%', right: '5%', width: '42%', height: '34%', borderRadius: 999, borderWidth: 1.2, borderColor: '#17191b' }, waldoNose: { position: 'absolute', width: 3, height: 3, left: '47%', bottom: '10%', borderRadius: 3, backgroundColor: '#b48163' }, waldoHat: { position: 'absolute', top: '10%', width: '47%', height: '20%', borderRadius: 5, backgroundColor: '#d43543', borderWidth: 1, borderColor: '#f8e4c8', zIndex: 3, alignItems: 'center', justifyContent: 'center' }, waldoHatStripe: { width: '80%', height: 2, backgroundColor: '#fff1d7' }, waldoShirt: { position: 'absolute', bottom: '11%', width: '42%', height: '35%', backgroundColor: '#f0e4ce', overflow: 'hidden', borderWidth: 1, borderColor: '#493c32' }, waldoStripe: { height: '25%', backgroundColor: '#f4ead7' }, waldoStripeRed: { backgroundColor: '#c93643' }, waldoScarf: { position: 'absolute', bottom: '14%', right: '26%', width: '13%', height: '23%', backgroundColor: '#c93643', transform: [{ rotate: '-22deg' }], zIndex: 2 }, waldoLens: { position: 'absolute', right: '7%', bottom: '8%', width: '48%', height: '48%', borderRadius: 999, borderWidth: 2, borderColor: '#e4c779', backgroundColor: '#7cd7d633', zIndex: 4 }, waldoLensShine: { position: 'absolute', left: '18%', top: '18%', width: '35%', height: '12%', borderRadius: 999, backgroundColor: '#fff', transform: [{ rotate: '-30deg' }] },
  merchantSeal: { backgroundColor: '#263a38', borderColor: '#dbb95f' }, merchantDrone: { backgroundColor: '#172d35', borderColor: '#55d8df' }, merchantCapsule: { backgroundColor: '#1d3233', borderColor: '#79e5c7' }, merchantShine: { position: 'absolute', width: '83%', height: '83%', borderWidth: 1, borderColor: '#ffe39a', borderRadius: 999 }, sealRing: { position: 'absolute', width: '64%', height: '64%', borderWidth: 2, borderColor: '#8ce9d4', borderRadius: 999 }, sealDot: { position: 'absolute', width: '14%', height: '14%', borderRadius: 999, backgroundColor: '#ffe39a' }, droneEye: { width: '31%', height: '31%', borderRadius: 999, backgroundColor: '#bafff4', borderWidth: 2, borderColor: '#55d8df', shadowColor: '#55d8df', shadowOpacity: 1, shadowRadius: 5 }, droneFinLeft: { position: 'absolute', width: '15%', height: '30%', left: '8%', top: '10%', borderRadius: 4, backgroundColor: '#c28c4c', transform: [{ rotate: '-30deg' }] }, droneFinRight: { position: 'absolute', width: '15%', height: '30%', right: '8%', top: '10%', borderRadius: 4, backgroundColor: '#c28c4c', transform: [{ rotate: '30deg' }] }, capsuleWindow: { position: 'absolute', width: '36%', height: '36%', borderRadius: 999, backgroundColor: '#a3fff0', borderWidth: 2, borderColor: '#e7c16e' }, capsuleBand: { position: 'absolute', width: '84%', height: '18%', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e7c16e' }, capsuleDock: { position: 'absolute', width: '12%', height: '12%', right: '15%', bottom: '20%', backgroundColor: '#f3ca70', borderRadius: 2 },
  speedPickup: { backgroundColor: '#211e35', borderColor: '#aa96de' }, ramPickup: { backgroundColor: '#101115', borderColor: '#ffb54d' }, ramWedgeSkin: { backgroundColor: '#191e22', borderColor: '#aeb9bc' }, ramMaulerSkin: { backgroundColor: '#202124', borderColor: '#c29a5c' }, ramPistonSkin: { backgroundColor: '#14202a', borderColor: '#d39b47' }, ramMeteorSkin: { backgroundColor: '#281611', borderColor: '#f37b32' }, treasurePickup: { backgroundColor: '#704817', borderColor: '#ffdc76' },
  classicHeart: { color: '#ff416a', textShadowColor: '#ff9aad', textShadowRadius: 6 }, seedPickup: { backgroundColor: '#173b2d', borderColor: '#91c67b' }, seedAura: { position: 'absolute', width: '86%', height: '86%', borderRadius: 999, backgroundColor: '#69bc70' }, seedHeart: { color: '#fa546c', textShadowColor: '#f89d73', textShadowRadius: 6 }, seedLeaf: { position: 'absolute', width: '23%', height: '35%', borderRadius: 999, backgroundColor: '#71bb69', borderWidth: 1, borderColor: '#b5e28a' }, seedLeafLeft: { left: '15%', top: '18%', transform: [{ rotate: '-42deg' }] }, seedLeafRight: { right: '14%', bottom: '15%', transform: [{ rotate: '45deg' }] }, seedVein: { position: 'absolute', width: '3%', height: '24%', borderRadius: 2, backgroundColor: '#d7e998' }, seedVeinLeft: { left: '25%', top: '20%', transform: [{ rotate: '-42deg' }] }, seedVeinRight: { right: '23%', bottom: '17%', transform: [{ rotate: '42deg' }] }, seedOrbit: { position: 'absolute', width: '91%', height: '91%', borderWidth: 1, borderColor: '#e0ce6d', borderStyle: 'dotted', borderRadius: 999 }, seedDot: { position: 'absolute', width: 3.5, height: 3.5, borderRadius: 999, backgroundColor: '#ffdb63', shadowColor: '#ffdb63', shadowOpacity: 0.9, shadowRadius: 3 }, seedDotTop: { top: -2, left: '48%' }, seedDotRight: { right: -2, top: '48%' }, seedDotBottom: { bottom: -2, left: '48%' }, seedDotLeft: { left: -2, top: '48%' },
  rubyHeart: { color: '#f583b3', textShadowColor: '#ffb5dd', textShadowRadius: 7 }, rubyHeartFacet: { position: 'absolute', width: '47%', height: '54%', top: '18%', left: '27%', borderRadius: 4, borderWidth: 1, borderColor: '#ffd0e5', backgroundColor: '#ef75aa66', transform: [{ rotate: '45deg' }] }, rubyHeartGlint: { position: 'absolute', width: 3, height: '24%', left: '32%', top: '22%', borderRadius: 3, backgroundColor: '#fff1f8', transform: [{ rotate: '35deg' }] }, emberHeart: { color: '#ff7042', textShadowColor: '#ffc264', textShadowRadius: 8 }, emberHeartFlame: { position: 'absolute', width: '18%', height: '42%', borderRadius: 999, backgroundColor: '#ffb542', borderWidth: 1, borderColor: '#ffe39b' }, emberFlameLeft: { left: '14%', top: '22%', transform: [{ rotate: '-35deg' }] }, emberFlameRight: { right: '14%', top: '22%', transform: [{ rotate: '35deg' }] }, emberHeartCore: { position: 'absolute', width: '24%', height: '24%', left: '38%', top: '38%', borderRadius: 999, backgroundColor: '#fff0aa', opacity: 0.82 }, necroticHeart: { color: '#806274', textShadowColor: '#99c46b', textShadowRadius: 6 }, necroticRoot: { position: 'absolute', width: '4%', height: '48%', top: '21%', borderRadius: 4, backgroundColor: '#a2c56c' }, rootLeft: { left: '27%', transform: [{ rotate: '-32deg' }] }, rootRight: { right: '27%', transform: [{ rotate: '32deg' }] }, necroticVein: { position: 'absolute', width: '38%', height: 2, top: '55%', left: '31%', backgroundColor: '#bdd781', transform: [{ rotate: '-18deg' }] }, necroticSpore: { position: 'absolute', width: 4, height: 4, borderRadius: 999, backgroundColor: '#d4e994', shadowColor: '#aad576', shadowOpacity: 0.9, shadowRadius: 4 }, sporeLeft: { left: '14%', top: '19%' }, sporeRight: { right: '13%', bottom: '18%' },
  wedgeArt: { position: 'absolute', left: '12%', top: '19%', borderTopColor: 'transparent', borderBottomColor: 'transparent', alignItems: 'center', justifyContent: 'center' }, wedgeCoreMark: { position: 'absolute', left: -15, width: 13, height: 13, borderRadius: 7, backgroundColor: '#ffbc53', borderWidth: 2, borderColor: '#fff0ae' }, maulerSpokes: { color: '#bac2c3', fontWeight: '900', textShadowColor: '#ffb94c', textShadowRadius: 4 }, maulerHub: { position: 'absolute', width: '36%', height: '36%', borderRadius: 999, backgroundColor: '#20252a', borderWidth: 3, borderColor: '#f1b354', alignItems: 'center', justifyContent: 'center' }, maulerPin: { width: '43%', height: '43%', borderRadius: 999, backgroundColor: '#ffd36a', borderWidth: 1, borderColor: '#fff4c7' }, pistonArt: { position: 'absolute', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, pistonBase: { width: '17%', height: '75%', backgroundColor: '#a67a3b', borderWidth: 1, borderColor: '#ffd47a', borderRadius: 4 }, pistonSpring: { width: '31%', height: '64%', justifyContent: 'space-around' }, pistonCoil: { height: 3, backgroundColor: '#ffcb68', borderRadius: 2 }, pistonRod: { width: '22%', height: '35%', backgroundColor: '#aebbc0', borderWidth: 1, borderColor: '#f3f5ed' }, pistonHead: { width: '23%', height: '80%', backgroundColor: '#d8ddda', borderWidth: 2, borderColor: '#fff3c1', borderRadius: 4 }, meteorMark: { color: '#df6e30', fontWeight: '900', textShadowColor: '#ff992f', textShadowRadius: 5 }, meteorCrackOne: { position: 'absolute', width: '43%', height: 2, backgroundColor: '#ffe08a', left: '24%', top: '45%', transform: [{ rotate: '-55deg' }] }, meteorCrackTwo: { position: 'absolute', width: '33%', height: 2, backgroundColor: '#ffae43', right: '20%', bottom: '38%', transform: [{ rotate: '42deg' }] },
  speedElectric: { position: 'absolute', width: '78%', height: '78%', borderWidth: 1, borderColor: '#a992ea', borderStyle: 'dashed', borderRadius: 999, alignItems: 'center', justifyContent: 'center' }, electricArc: { color: '#eff3ff', fontWeight: '900', textShadowColor: '#bf91ff', textShadowRadius: 2 }, speedComet: { borderColor: '#72dfff', borderStyle: 'solid', borderWidth: 2 }, cometTail: { position: 'absolute', width: '58%', height: '18%', left: '0%', top: '40%', borderRadius: 999, backgroundColor: '#64d9ff', opacity: 0.75, transform: [{ rotate: '-34deg' }] }, cometCore: { width: '30%', height: '30%', borderRadius: 999, backgroundColor: '#ecffff', shadowColor: '#6de7ff', shadowOpacity: 1, shadowRadius: 8 }, speedRibbon: { borderColor: '#c89aff', borderStyle: 'solid', borderWidth: 2, borderRadius: 9, transform: [{ rotate: '45deg' }] }, ribbonLoop: { width: '62%', height: '34%', borderWidth: 3, borderColor: '#f2d8ff', borderRadius: 999, transform: [{ rotate: '-35deg' }] }, ribbonLoopInner: { position: 'absolute', width: '22%', height: '22%', borderRadius: 999, backgroundColor: '#bc83ff' }, speedEngine: { borderColor: '#55e4ca', borderStyle: 'solid', borderWidth: 2 }, engineRing: { width: '66%', height: '66%', borderWidth: 3, borderColor: '#aafff2', borderRadius: 999, alignItems: 'center', justifyContent: 'center' }, engineHub: { width: '36%', height: '36%', borderRadius: 999, backgroundColor: '#e0fff9' }, engineTick: { position: 'absolute', width: '14%', height: '20%', top: '-7%', backgroundColor: '#54e4cb' }, speedSolar: { borderColor: '#efb651', borderStyle: 'solid', borderWidth: 2 }, solarSlash: { width: '88%', height: '20%', borderRadius: 999, backgroundColor: '#ffe29a', transform: [{ rotate: '-42deg' }] }, solarCore: { position: 'absolute', width: '29%', height: '29%', borderRadius: 999, backgroundColor: '#fff2c2', shadowColor: '#ffc254', shadowOpacity: 1, shadowRadius: 7 },
  ramSparks: { position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%' }, ramSpark: { position: 'absolute', color: '#ffd16a', fontWeight: '900' }, sparkOne: { top: 0, right: '15%' }, sparkTwo: { left: '12%', bottom: '8%' }, sparkThree: { right: '5%', bottom: '25%' },
  treasureShine: { position: 'absolute', width: '75%', height: '75%', borderTopWidth: 1, borderColor: '#fff2bd', borderRadius: 999, top: '7%', left: '12%' }, treasureChest: { width: '62%', height: '48%', alignItems: 'center', justifyContent: 'center' }, chestLid: { position: 'absolute', top: '8%', width: '94%', height: '30%', borderWidth: 1, borderColor: '#fff0a6', borderRadius: 4, backgroundColor: '#edb83d' }, chestBody: { position: 'absolute', bottom: '7%', width: '84%', height: '52%', borderWidth: 1, borderColor: '#ffe18a', borderRadius: 3, backgroundColor: '#bc7a21' }, chestLock: { position: 'absolute', top: '40%', borderWidth: 1, borderColor: '#fff2ba', borderRadius: 2, backgroundColor: '#fff0a6' },
  energyText: { color: '#0a0d12', fontWeight: '900', textShadowColor: '#ffffff', textShadowRadius: 7 },
  powerText: { color: '#ff416a', fontWeight: '900', fontSize: 17, lineHeight: 19 },
  abilityLabel: { color: '#c0cbd9', fontSize: 8, fontWeight: '900', letterSpacing: 1, backgroundColor: '#071019dd', paddingHorizontal: 4, borderRadius: 3, marginBottom: 3 }, abilityButton: { width: 64, minHeight: 50, alignItems: 'center', justifyContent: 'center', gap: 1, borderRadius: 10, backgroundColor: '#14242aee', borderColor: '#cfffff', borderWidth: 1, paddingHorizontal: 5, paddingVertical: 3 }, abilityKeyHint: { position: 'absolute', top: 2, right: 4, color: '#d1e0ed', fontSize: 6, fontWeight: '900', letterSpacing: 0.4 }, chargeIcons: { width: 52, height: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, overflow: 'hidden' }, speedReady: { borderColor: '#dfffff', shadowColor: '#cfffff', shadowOpacity: 0.9, shadowRadius: 8 }, speedExpiring: { borderColor: '#ffbd55', opacity: 0.55 }, chargeButton: { borderColor: '#a879ff', backgroundColor: '#17132b' }, ramButton: { backgroundColor: '#171719ee', borderColor: '#d99540' }, ramArmed: { borderColor: '#ff4b51', borderWidth: 2 }, abilityDisabled: { opacity: 0.62 }, speedOrb: { color: '#f3ffff', fontSize: 20, textShadowColor: '#b9ffff', textShadowRadius: 8 }, ramOrb: { color: '#ffc35b', fontSize: 19 }, abilityCount: { color: '#f3f6fa', fontSize: 10, fontWeight: '900' }, readyTimer: { color: '#cfffff', backgroundColor: '#071019dd', fontSize: 9, marginTop: 3, paddingHorizontal: 4, borderRadius: 4 },
  smelterSpeedUpgrade: { width: '100%', minHeight: 31, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 1, borderColor: '#a05a38', borderRadius: 5, backgroundColor: '#211714' }, smelterSpeedLabel: { color: '#ffbc76', fontSize: 6, fontWeight: '900', letterSpacing: 0.5 }, smelterSpeedAction: { color: '#ffe4bd', fontSize: 6, fontWeight: '800' },
  burstStage: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 12 }, burstRing: { position: 'absolute', width: '76%', height: '76%', borderWidth: 3, borderRadius: 999, shadowOpacity: 0.85, shadowRadius: 12 }, burstOrbitRing: { position: 'absolute', width: '82%', height: '82%', borderWidth: 4, borderRadius: 999, borderStyle: 'dashed', shadowColor: '#a6dfff', shadowOpacity: 1, shadowRadius: 17 }, burstOrbitInner: { position: 'absolute', width: '55%', height: '91%', borderWidth: 2, borderRadius: 999, shadowColor: '#e4f6ff', shadowOpacity: 0.95, shadowRadius: 8 }, burstOrbCore: { position: 'absolute', width: '26%', height: '26%', borderRadius: 999, borderWidth: 3, shadowColor: '#ed4e67', shadowOpacity: 1, shadowRadius: 12 }, waldoFoundText: { position: 'absolute', top: '16%', alignSelf: 'center', color: '#fff2bb', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textShadowColor: '#e63d48', textShadowRadius: 12 }, burstHeartRing: { position: 'absolute', width: '82%', height: '82%', borderWidth: 4, borderRadius: 999, shadowColor: '#ff5278', shadowOpacity: 1, shadowRadius: 18 }, burstHeartInner: { position: 'absolute', width: '48%', height: '48%', borderWidth: 3, borderRadius: 999, shadowColor: '#ffc0d0', shadowOpacity: 1, shadowRadius: 10 }, burstSeedRing: { position: 'absolute', width: '84%', height: '84%', borderWidth: 4, borderStyle: 'dashed', borderRadius: 999, shadowColor: '#72db89', shadowOpacity: 0.9, shadowRadius: 16 }, burstPetal: { position: 'absolute', width: 16, height: 30, borderRadius: 999, borderWidth: 1, borderColor: '#fff1a6', shadowColor: '#8de6a1', shadowOpacity: 0.9, shadowRadius: 8 }, burstElectricRing: { position: 'absolute', width: '74%', height: '74%', borderWidth: 3, borderStyle: 'dashed', borderRadius: 999 }, burstMetalRing: { position: 'absolute', width: '76%', height: '76%', borderWidth: 4, borderRadius: 8, transform: [{ rotate: '45deg' }] }, burstGearRing: { position: 'absolute', width: '76%', height: '76%', borderWidth: 5, borderRadius: 999, borderStyle: 'dotted' }, blastFlash: { position: 'absolute', width: '48%', height: '48%', borderRadius: 999, shadowColor: '#ff5d27', shadowOpacity: 1, shadowRadius: 22, elevation: 10 }, blastInnerRing: { position: 'absolute', width: '82%', height: '82%', borderWidth: 4, borderRadius: 999, shadowColor: '#ff7a2d', shadowOpacity: 1, shadowRadius: 12 }, burstParticle: { position: 'absolute', fontWeight: '900', textAlign: 'center', textShadowColor: '#fff0b0', textShadowRadius: 5 }, burstCore: { width: '60%', textAlign: 'center', textAlignVertical: 'center', fontWeight: '900', textShadowRadius: 12, includeFontPadding: false }, breakBurst: { position: 'absolute', zIndex: 14, alignItems: 'center', justifyContent: 'center' }, breakRing: { position: 'absolute', width: '70%', height: '70%', borderWidth: 3, borderRadius: 999, shadowOpacity: 1, shadowRadius: 14 }, breakSonicRing: { position: 'absolute', width: '92%', height: '38%', borderWidth: 4, borderRadius: 999, shadowColor: '#69f5ff', shadowOpacity: 1, shadowRadius: 20 }, breakShard: { position: 'absolute', textAlign: 'center', fontWeight: '900', textShadowColor: '#ffffff', textShadowRadius: 6 }, territoryPopup: { position: 'absolute', width: 104, alignItems: 'center', justifyContent: 'center' }, territoryText: { color: '#e9fff9', fontSize: 17, fontWeight: '900', letterSpacing: 0.5, textShadowColor: '#23e4be', textShadowRadius: 9 }, territoryFlash: { position: 'absolute', color: '#ffd87b', fontSize: 17, fontWeight: '900', letterSpacing: 0.5, textShadowColor: '#fff0ad', textShadowRadius: 15 }, pictureThumb: { width: 42, height: 30, borderRadius: 4, backgroundColor: '#132333' }, pictureThumbFallback: { width: 42, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: '#173b2d' }, pictureThumbGlyph: { color: '#ffd96b', fontSize: 18 },
  pauseButton: { minWidth: 44, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderRadius: 8, borderWidth: 1, borderColor: '#405267', backgroundColor: '#101a27' }, pauseButtonActive: { borderColor: '#58dfbc', backgroundColor: '#123329' }, pauseButtonText: { color: '#d9e8f4', fontSize: 14, lineHeight: 16, fontWeight: '900' }, pauseButtonLabel: { color: '#94a9bc', fontSize: 6, fontWeight: '900', letterSpacing: 0.6 },
  pauseBadge: { position: 'absolute', top: '44%', alignSelf: 'center', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#06101ccc', borderWidth: 1, borderColor: '#44576a' },
  pauseText: { color: '#bbcad9', fontSize: 10, letterSpacing: 2, fontWeight: '800' }, pauseQueueText: { color: '#68e3c0', fontSize: 7, fontWeight: '800', letterSpacing: 1, marginTop: 3 },
  boardFooter: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  footerText: { color: '#8ea0b4', fontSize: 8, letterSpacing: 1.1, fontWeight: '800' },
  controls: { paddingTop: 11 },
  notice: { color: '#9badc0', textAlign: 'center', fontSize: 11, marginBottom: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 9 }, topGameActions: { justifyContent: 'flex-end', marginTop: -3, marginBottom: 7 },
  inputOptions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 8 },
  inputLabel: { color: '#67778b', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginRight: 3 },
  inputButton: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#344356' },
  inputButtonSelected: { borderColor: '#55dfbf', backgroundColor: '#10251f' },
  inputButtonText: { color: '#8393a7', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  inputButtonTextSelected: { color: '#7ee9d0' },
  primaryButton: { backgroundColor: '#5be0c1', paddingVertical: 11, paddingHorizontal: 24, borderRadius: 8 },
  primaryText: { color: '#06231d', letterSpacing: 1, fontWeight: '900', fontSize: 12 },
  secondaryButton: { borderWidth: 1, borderColor: '#5be0c1', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  secondaryText: { color: '#7ee9d0', letterSpacing: 1, fontWeight: '900', fontSize: 11 },
  rulesRow: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 10 },
  rule: { color: '#67778b', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  scores: { borderTopWidth: 1, borderColor: '#1b2734', paddingTop: 9, minHeight: 58 },
  devPanel: { flex: 1 }, devContent: { paddingBottom: 20, gap: 6 }, devTitle: { color: '#f2f6ff', fontSize: 16, fontWeight: '900', letterSpacing: 1.3, marginBottom: 2 }, devHint: { color: '#8ea0b4', fontSize: 10, lineHeight: 15, marginBottom: 7 }, profileRow: { flexDirection: 'row', alignItems: 'center', gap: 7, borderBottomWidth: 1, borderColor: '#1b2734', paddingVertical: 5 }, profileInput: { flex: 1, minWidth: 80, color: '#eef3fc', fontSize: 11, borderWidth: 1, borderColor: '#344356', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 6 }, smallAction: { backgroundColor: '#14322d', borderWidth: 1, borderColor: '#3c9d88', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 7 }, smallActionText: { color: '#8fead2', fontSize: 8, fontWeight: '900' }, profileSaveButton: { alignSelf: 'flex-start', marginVertical: 4 }, profileLoad: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }, deleteText: { color: '#ef8491', fontSize: 8, fontWeight: '900', padding: 5 }, sectionTitle: { color: '#57e2c2', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 11, marginBottom: 3 }, settingRow: { minHeight: 35, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderColor: '#172332' }, settingLabel: { color: '#c4d0df', flex: 1, fontSize: 10 }, settingValue: { color: '#7ee9d0', fontSize: 9, fontWeight: '900' }, toggleValue: { minWidth: 38, textAlign: 'center', color: '#ef8491', fontSize: 9, fontWeight: '900' }, toggleOn: { color: '#7ee9d0' }, stepButton: { width: 27, height: 26, borderRadius: 5, borderWidth: 1, borderColor: '#344356', alignItems: 'center', justifyContent: 'center' }, stepText: { color: '#7ee9d0', fontSize: 16, fontWeight: '800', lineHeight: 19 }, numberInput: { width: 64, height: 28, color: '#f2f6ff', textAlign: 'center', fontSize: 10, borderWidth: 1, borderColor: '#26394b', borderRadius: 4, paddingVertical: 2 }, swatchRow: { flexDirection: 'row', gap: 9, paddingVertical: 5 }, swatch: { width: 28, height: 28, borderRadius: 999, borderWidth: 1, borderColor: '#66778c' }, swatchSelected: { borderColor: '#fff', borderWidth: 3 },
  skinSelectWrap: { borderBottomWidth: 1, borderColor: '#172332' }, skinSelectButton: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 8 }, skinSelectText: { flex: 1 }, skinSelectedName: { color: '#7ee9d0', fontSize: 10, fontWeight: '800', marginTop: 2 }, skinChevron: { color: '#7ee9d0', fontSize: 17, fontWeight: '700', width: 25, textAlign: 'center' }, skinOptions: { backgroundColor: '#0a121d', borderWidth: 1, borderColor: '#26394b', borderRadius: 6, marginBottom: 6, paddingHorizontal: 7 }, skinOption: { minHeight: 40, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#172332', paddingVertical: 5, gap: 8 }, skinOptionSelected: { backgroundColor: '#10251f' }, skinOptionCopy: { flex: 1 }, skinOptionName: { color: '#e4edf5', fontSize: 10, fontWeight: '800' }, skinOptionDescription: { color: '#8799aa', fontSize: 9, marginTop: 2 }, skinCheck: { color: '#7ee9d0', fontWeight: '900', paddingHorizontal: 4 },
  skinPreviewButton: { width: 52, height: 52, borderWidth: 1, borderColor: '#34485a', borderRadius: 7, backgroundColor: '#080f18', alignItems: 'center', justifyContent: 'center', zIndex: 1 }, skinPreviewActive: { zIndex: 20, borderColor: '#7ee9d0' }, skinPreviewStage: { position: 'relative', width: 50, height: 50, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }, skinPreviewTap: { position: 'absolute', bottom: 1, right: 1, color: '#d8fff8', backgroundColor: '#071019dd', fontSize: 6, fontWeight: '900', paddingHorizontal: 3, borderRadius: 3 }, skinPreviewBackground: { position: 'absolute', width: 40, height: 40, borderWidth: 1, borderRadius: 5, overflow: 'hidden' }, skinPreviewHorizon: { position: 'absolute', left: -3, right: -3, bottom: '28%', height: 1, backgroundColor: '#ffffff66' }, skinPreviewBall: { width: 30, height: 30, borderWidth: 1, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, skinPreviewBallGlint: { position: 'absolute', left: '20%', top: '16%', width: '45%', height: '20%', borderRadius: 999, backgroundColor: '#ffffffcc', transform: [{ rotate: '-28deg' }] }, skinBreakPreview: { width: 33, height: 33, alignItems: 'center', justifyContent: 'center', borderWidth: 2 }, skinBreakGlass: { borderColor: '#bdeeff', borderRadius: 2, transform: [{ rotate: '45deg' }] }, skinBreakEmber: { borderColor: '#ff962e', borderRadius: 999, borderStyle: 'dashed' }, skinBreakSonic: { width: 42, height: 18, borderColor: '#70eeff', borderRadius: 999 }, skinBreakGlyph: { fontSize: 15, fontWeight: '900' },
  scoresTitle: { color: '#75869a', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  empty: { color: '#4c5b6c', fontSize: 10 },
  scoreList: { gap: 7 },
  scoreCard: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: '#111a26', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 6 },
  scoreRank: { color: '#54ddbd', fontSize: 9, fontWeight: '900' }, scoreValue: { color: '#b4c0cf', fontSize: 9 },
  bubbleCosmic: { backgroundColor: '#58cde944', borderColor: '#c4fbff', shadowColor: '#58dcff', shadowOpacity: 0.92, shadowRadius: 10, elevation: 5 }, bubblePrismatic: { backgroundColor: '#d06ce955', borderColor: '#fff1ff', shadowColor: '#92fff1', shadowOpacity: 0.9, shadowRadius: 11, elevation: 5 }, bubbleNebula: { backgroundColor: '#8256df55', borderColor: '#decaff', shadowColor: '#b092ff', shadowOpacity: 0.95, shadowRadius: 11, elevation: 5 }, bubbleInner: { width: '58%', height: '58%', borderRadius: 999, backgroundColor: '#32185b55', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, bubbleNebulaSwirl: { position: 'absolute', width: '130%', height: '45%', borderWidth: 2, borderColor: '#d7fcff99', borderRadius: 999, transform: [{ rotate: '-38deg' }] }, bubbleStar: { color: '#f5ffff', fontSize: 15, fontWeight: '900', textShadowColor: '#d1ffff', textShadowRadius: 6 }, bubbleSheen: { position: 'absolute', width: '30%', height: '88%', borderRadius: 999, backgroundColor: '#ffffff66', transform: [{ rotate: '32deg' }] }, bubbleHighlight: { position: 'absolute', width: '27%', height: '12%', top: '16%', left: '18%', borderRadius: 999, backgroundColor: '#ffffffdd', transform: [{ rotate: '-34deg' }] }, bubbleSparkle: { position: 'absolute', right: '13%', top: '15%' }, bubbleSparkleText: { color: '#f7ffff', fontSize: 9, textShadowColor: '#fff', textShadowRadius: 6 },
  compassNeedle: { position: 'absolute', width: '60%', height: '60%', alignItems: 'center', justifyContent: 'center' },
  burstSkewerRing: { position: 'absolute', width: '86%', height: '86%', borderWidth: 3, borderRadius: 999, borderStyle: 'dashed', shadowOpacity: 1, shadowRadius: 13 }, burstSkewerLine: { position: 'absolute', width: '108%', height: 5, borderRadius: 99, shadowOpacity: 1, shadowRadius: 16, elevation: 10 }, skewerWallFlash: { position: 'absolute', backgroundColor: '#36aaff', borderRadius: 8, shadowColor: '#5adfff', shadowOpacity: 1, shadowRadius: 16, elevation: 12 }, skewerCrackle: { position: 'absolute', width: 18, height: 20, color: '#c9f7ff', fontSize: 20, lineHeight: 20, textAlign: 'center', fontWeight: '900', textShadowColor: '#299aff', textShadowRadius: 11, elevation: 12 }, comboBadge: { position: 'absolute', top: '14%', alignSelf: 'center', color: '#f0fdff', fontSize: 12, fontWeight: '900', letterSpacing: 2, textShadowColor: '#70eaff', textShadowRadius: 12 }, bubbleCredit: { position: 'absolute', width: 22, height: 22, textAlign: 'center', color: '#ffe9a4', fontSize: 16, fontWeight: '900', textShadowColor: '#fff3c1', textShadowRadius: 8 }, bubbleCreditTotal: { position: 'absolute', top: '68%', alignSelf: 'center', color: '#fff3b3', fontSize: 9, fontWeight: '900', letterSpacing: 1, textShadowColor: '#e6ac42', textShadowRadius: 7 },
  commandScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 90, overflow: 'hidden', backgroundColor: '#050b13' }, commandImageShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(3,8,15,0.16)' },
  commandLayout: { width: '100%', maxWidth: 1800, height: '100%', alignSelf: 'center', flexDirection: 'row', overflow: 'hidden', backgroundColor: 'transparent' },
  commandRail: { flexDirection: 'column', justifyContent: 'space-between', borderRightWidth: 1, borderColor: '#80c4e046', backgroundColor: 'rgba(3,12,20,0.78)' }, commandRailScroll: { flex: 1, minHeight: 0 }, commandRailContent: { paddingBottom: 7, gap: 7 }, bridgeBrandBlock: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }, bridgeBrandGlyph: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#73e9d599', backgroundColor: '#102b35bb', shadowColor: '#73e9d5', shadowOpacity: 0.35, shadowRadius: 10 }, bridgeBrandGlyphText: { color: '#d6fff6', fontSize: 22 },
  commandBrand: { color: '#eef4fb', fontSize: 23, fontWeight: '900', letterSpacing: -0.5, marginTop: 3 }, commandBrandCompact: { fontSize: 18 }, commandSubBrand: { color: '#8bb7c3', fontSize: 7, fontWeight: '900', letterSpacing: 1.7, marginTop: 2 }, commandSectionLabel: { color: '#9ab3c4', fontSize: 7, fontWeight: '900', letterSpacing: 1.4, marginBottom: 1 }, bridgeSectionLabel: { marginTop: 2 },
  bridgeRailAction: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: '#68cbb459', borderRadius: 6, backgroundColor: 'rgba(8,28,37,0.82)' }, bridgeRailResume: { minHeight: 43, borderColor: '#72efda', backgroundColor: 'rgba(13,52,51,0.88)' }, bridgeRailNew: { borderColor: '#d7a95777', backgroundColor: 'rgba(35,29,18,0.86)' }, bridgeRailDisabled: { opacity: 0.56 }, bridgeRailGlyph: { width: 17, color: '#8af4df', fontSize: 13, textAlign: 'center' }, bridgeRailCopy: { flex: 1, minWidth: 0 }, bridgeRailTitle: { color: '#e7f3f5', fontSize: 7, fontWeight: '900', letterSpacing: 0.55 }, bridgeRailDetail: { color: '#94adba', fontSize: 6, marginTop: 2 }, bridgeRailWarning: { color: '#f4cd79', fontSize: 7, lineHeight: 10 }, bridgePauseLink: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 7, borderWidth: 1, borderColor: '#6885a15c', borderRadius: 5, backgroundColor: '#0b192788' }, bridgePauseGlyph: { color: '#c3d8e8', fontSize: 10, fontWeight: '900' }, bridgePauseText: { color: '#a6c0d1', fontSize: 6, fontWeight: '900', letterSpacing: 0.55 }, bridgeReadoutGroup: { gap: 4, marginTop: 2 }, bridgeReadout: { paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: '#7fa5b534', borderRadius: 5, backgroundColor: 'rgba(5,17,26,0.68)' }, bridgeReadoutHeading: { flexDirection: 'row', alignItems: 'center', gap: 5 }, bridgeReadoutGlyph: { color: '#80e7db', fontSize: 9, width: 11, textAlign: 'center' }, bridgeReadoutLabel: { color: '#809eae', fontSize: 5, fontWeight: '900', letterSpacing: 0.8 }, bridgeReadoutValue: { color: '#d6e7ed', fontSize: 8, fontWeight: '900', letterSpacing: 0.45, marginTop: 2 }, commandFooterRow: { minHeight: 18, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 }, commandFooter: { color: '#89aaa9', fontSize: 6, fontWeight: '900', letterSpacing: 0.9 },
  commandMain: { flex: 1, minWidth: 0, paddingHorizontal: 24, paddingVertical: 16, justifyContent: 'space-between' }, commandMainCompact: { paddingHorizontal: 10, paddingVertical: 8 }, bridgeWelcome: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, bridgeWelcomeTitle: { color: '#eff7ff', fontSize: 23, fontWeight: '300', letterSpacing: 1.7, marginTop: 3, textShadowColor: '#112d43', textShadowRadius: 14 }, bridgeWelcomeTitleCompact: { fontSize: 16, letterSpacing: 1.1 }, bridgeReady: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#8dd9cf61', backgroundColor: '#071923aa' }, bridgeReadyText: { color: '#b3e9df', fontSize: 6, fontWeight: '900', letterSpacing: 0.9 }, bridgePreviewRegion: { flex: 1, minHeight: 120, width: '100%', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 3, overflow: 'hidden' }, bridgeMiniFrame: { alignSelf: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#86e8dbbb', borderRadius: 7, backgroundColor: '#061322', shadowColor: '#71e4db', shadowOpacity: 0.38, shadowRadius: 14, elevation: 8 }, bridgeMiniTint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(3,14,25,0.28)' }, bridgeMiniClaim: { position: 'absolute', backgroundColor: 'rgba(62,215,187,0.2)', borderWidth: 0.5, borderColor: '#65ecd244' }, bridgeMiniWall: { position: 'absolute', backgroundColor: '#72f2d6', shadowColor: '#69eed4', shadowOpacity: 0.9, shadowRadius: 5, elevation: 3 }, bridgeMiniBall: { position: 'absolute', borderWidth: 1, borderColor: '#ecf7ff', backgroundColor: '#90a7be', shadowColor: '#c8eaff', shadowOpacity: 0.95, shadowRadius: 5, elevation: 4 }, bridgeMiniPickup: { position: 'absolute', width: 5, height: 5, borderRadius: 4, marginLeft: -2.5, marginTop: -2.5, shadowColor: '#ffe4a8', shadowOpacity: 0.9, shadowRadius: 4, elevation: 3 }, bridgeMiniScan: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: '#a9fff1aa', shadowColor: '#5af1dc', shadowOpacity: 1, shadowRadius: 6 }, bridgeMiniTop: { position: 'absolute', top: 0, left: 0, right: 0, minHeight: 30, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(4,13,22,0.67)' }, bridgeMiniEyebrow: { color: '#8cb8c3', fontSize: 5, fontWeight: '900', letterSpacing: 1 }, bridgeMiniStage: { color: '#f0f7fa', fontSize: 9, fontWeight: '900', marginTop: 1 }, bridgeMiniPercent: { color: '#82eddb', fontSize: 10, fontWeight: '900' }, bridgeMiniBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(4,13,22,0.74)' }, bridgeMiniResume: { color: '#cbfff1', fontSize: 6, fontWeight: '900', letterSpacing: 0.8 }, bridgeMiniReadouts: { color: '#9cb5c5', fontSize: 5, fontWeight: '800', letterSpacing: 0.4 }, bridgeMiniPulse: { position: 'absolute', top: 6, right: 7 }, bridgePulse: { width: 6, height: 6, borderRadius: 99, shadowOpacity: 0.92, shadowRadius: 5, elevation: 4 },
  bridgeArtifactDock: { minHeight: 88, paddingTop: 5, paddingBottom: 2 }, bridgeDockHeading: { color: '#9bb9c7', fontSize: 6, fontWeight: '900', letterSpacing: 1, marginBottom: 5 }, bridgeArtifactRow: { width: '100%', flexDirection: 'row', gap: 7 }, bridgeArtifact: { flex: 1, minWidth: 62, minHeight: 58, justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderRadius: 5, backgroundColor: 'rgba(4,15,23,0.78)' }, bridgeArtifactHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 }, bridgeArtifactGlyph: { fontSize: 15, fontWeight: '900', textShadowRadius: 8 }, bridgeArtifactTitle: { color: '#e8f1f4', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 }, bridgeArtifactDetail: { color: '#93a8b4', fontSize: 5, fontWeight: '700', letterSpacing: 0.4, marginTop: 2 },
  commandTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }, commandHeadline: { color: '#f0f5fb', fontSize: 29, fontWeight: '900', letterSpacing: 1.3, marginTop: 8 }, commandStageBadge: { minWidth: 92, padding: 11, borderWidth: 1, borderColor: '#315667', borderRadius: 10, backgroundColor: '#0d202d', alignItems: 'center' }, commandStageLabel: { color: '#7f9aaa', fontSize: 7, fontWeight: '900', letterSpacing: 1 }, commandStageValue: { color: '#6cebd1', fontSize: 24, fontWeight: '900', marginTop: 2 }, commandDescription: { color: '#91a6b5', fontSize: 11, lineHeight: 17, marginTop: 13, marginBottom: 16, maxWidth: 590 }, commandActions: { width: '100%', maxWidth: 700, gap: 8 }, commandResume: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#57dabb', borderRadius: 11, backgroundColor: '#103a38' }, commandAction: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, borderWidth: 1, borderColor: '#263e4e', borderRadius: 10, backgroundColor: '#0b1a27' }, commandNewRun: { borderColor: '#b78c4f', backgroundColor: '#211e17' }, commandActionWarn: { borderColor: '#e4ba63', backgroundColor: '#292315' }, commandActionGlyph: { width: 22, color: '#72e9d1', fontSize: 17, textAlign: 'center' }, commandActionTitle: { color: '#e7eff6', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, commandActionDetail: { color: '#8da2b2', fontSize: 8, marginTop: 4 }, commandChevron: { marginLeft: 'auto', color: '#71909f', fontSize: 22 }, commandStatusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 19, maxWidth: 700 }, commandStatus: { minWidth: 112, paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: '#1f3948', borderRadius: 8, backgroundColor: '#091722' }, commandStatusLabel: { color: '#718b9a', fontSize: 7, fontWeight: '900', letterSpacing: 1 }, commandStatusValue: { color: '#d7e3ec', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 },
  mainMenuScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 90, backgroundColor: 'rgba(3,8,15,0.88)', alignItems: 'center', justifyContent: 'center', padding: 16 }, mainMenuPanel: { width: '100%', maxWidth: 620, maxHeight: '94%', padding: 24, borderWidth: 1, borderColor: '#315469', borderRadius: 18, backgroundColor: '#081521ee' }, scorePanel: { width: '100%', maxWidth: 760, maxHeight: '92%', padding: 22, borderWidth: 1, borderColor: '#315469', borderRadius: 18, backgroundColor: '#081521' }, menuPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, menuEyebrow: { color: '#64e8cc', fontSize: 9, fontWeight: '900', letterSpacing: 2 }, menuTitle: { color: '#f1f6ff', fontSize: 32, fontWeight: '900', letterSpacing: 1, marginTop: 3 }, menuSubhead: { color: '#a3b5c7', fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 14 }, menuPrimary: { minHeight: 49, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#5be0c1', marginTop: 7, padding: 12 }, menuPrimaryText: { color: '#07151a', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textAlign: 'center' }, menuButton: { padding: 12, marginTop: 7, borderRadius: 10, borderWidth: 1, borderColor: '#344b5c', backgroundColor: '#0d1d2a' }, menuButtonTitle: { color: '#e8f0f7', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, menuButtonCopy: { color: '#91a6b6', fontSize: 9, lineHeight: 14, marginTop: 4 }, menuConfirmText: { color: '#f1c96e', fontSize: 9, fontWeight: '900', marginTop: 9, letterSpacing: 1 }, menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }, menuTile: { width: '48%', minHeight: 88, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#283d4e', backgroundColor: '#0c1b29' }, menuTileGlyph: { color: '#68e8d0', fontSize: 20, fontWeight: '900', marginBottom: 4 }, menuWarning: { color: '#efc979', fontSize: 10, lineHeight: 15, marginTop: 8, textAlign: 'center' }, menuBack: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#365263' }, menuBackText: { color: '#70e8d1', fontSize: 9, fontWeight: '900', letterSpacing: 1 }, menuEmpty: { color: '#92a8b9', fontSize: 12, padding: 22, textAlign: 'center' }, menuScoreCard: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, padding: 10, borderWidth: 1, borderColor: '#22394a', borderRadius: 10, backgroundColor: '#0c1b29' }, menuScoreRank: { width: 33, height: 33, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#103c39' }, menuScoreRankText: { color: '#74f2da', fontWeight: '900' }, scoreMain: { flex: 1 }, scoreLevel: { color: '#e7eff6', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }, scoreDetails: { color: '#8fa4b3', fontSize: 8, marginTop: 4 }, scoreClaim: { color: '#edc96f', fontSize: 11, fontWeight: '900' }, modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 9 }, modeCard: { flex: 1, minWidth: 140, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#2a4052', backgroundColor: '#0c1b29' }, modeCardActive: { borderColor: '#5be0c1', backgroundColor: '#0d2a2a' }, modeTitle: { color: '#cad5df', fontSize: 12, fontWeight: '900', letterSpacing: 1 }, modeTitleActive: { color: '#70f1d5' }, skinAchievementScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 110, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,8,14,0.78)', padding: 18 }, skinAchievementCard: { width: '100%', maxWidth: 390, alignItems: 'center', padding: 25, borderRadius: 17, borderWidth: 1, borderColor: '#e6c56f', backgroundColor: '#101b29', shadowColor: '#67eed2', shadowOpacity: 0.5, shadowRadius: 22 }, achievementGlyph: { color: '#f1d57d', fontSize: 48, marginTop: 14, textShadowColor: '#57efd4', textShadowRadius: 18 }, skinDiscoveryLabel: { color: '#f1d57d', backgroundColor: '#1d1b13', borderWidth: 1, borderColor: '#86713d', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 8, fontWeight: '900', letterSpacing: 0.55 },
});


const lifeVaultUiStyles = StyleSheet.create({
  lifeVaultCase: { alignSelf: 'flex-start', maxWidth: '100%', minWidth: 158, padding: 7, borderWidth: 1, borderColor: '#4f7773', borderRadius: 8, backgroundColor: '#0c1820', shadowColor: '#48cdb9', shadowOpacity: 0.22, shadowRadius: 8, elevation: 2 }, lifeVaultCompact: { alignSelf: 'flex-start', minWidth: 0, padding: 5, backgroundColor: '#0a151a', shadowOpacity: 0 }, lifeVaultPhone: { width: '100%', alignSelf: 'stretch', overflow: 'hidden' }, lifeVaultHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 }, compactVaultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }, compactSmelter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }, compactFurnace: { flex: 1, minWidth: 72, flexDirection: 'row', alignItems: 'center', gap: 4 }, phoneRefineryUpgradeButton: { minWidth: 32, paddingHorizontal: 2, paddingVertical: 2 }, compactStatus: { color: '#caa87e', fontSize: 5, fontWeight: '900', letterSpacing: 0.15 }, lifeVaultSeal: { width: 20, height: 20, borderWidth: 1, borderColor: '#d0aa5b', borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#292317' }, lifeVaultSealText: { color: '#f4d57e', fontSize: 11, fontWeight: '900' }, lifeVaultHeading: { flex: 1 }, lifeVaultTitle: { color: '#eaf4f2', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, lifeVaultSubtitle: { color: '#789696', fontSize: 6, fontWeight: '800', letterSpacing: 1.1, marginTop: 1 }, lifeVaultCount: { color: '#f1d684', fontSize: 12, fontWeight: '900' }, lifeVaultCountDim: { color: '#82969a', fontSize: 9 }, lifeVaultSlots: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 3 }, lifeVaultSlot: { width: 24, height: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 5 }, lifeVaultSlotFilled: { borderColor: '#a14e67', backgroundColor: '#24151e', shadowColor: '#ff6889', shadowOpacity: 0.38, shadowRadius: 4 }, lifeVaultSlotEmpty: { borderColor: '#344b52', backgroundColor: '#0a131a' }, lifeVaultEmptyHeart: { color: '#465b63', fontSize: 16, fontWeight: '700', lineHeight: 20 },
  lifeRefinery: { marginTop: 6, paddingTop: 5, borderTopWidth: 1, borderColor: '#4a3c2d' }, smelterFlow: { minHeight: 30, marginTop: 4, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#493b2d', borderRadius: 5, backgroundColor: '#171713' }, smelterSource: { minWidth: 42, alignItems: 'center', justifyContent: 'center' }, smelterGlyph: { color: '#ffb762', fontSize: 17, fontWeight: '900', textShadowColor: '#ff7b39', textShadowRadius: 5 }, smelterCaption: { color: '#af9b7a', fontSize: 5, fontWeight: '900', letterSpacing: 0.45 }, smelterArrow: { color: '#bd8a50', fontSize: 17, fontWeight: '900' }, smelterFurnace: { width: 40, height: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#b87536', borderRadius: 4, backgroundColor: '#39251b' }, smelterFire: { color: '#ffb64f', fontSize: 13, fontWeight: '900', textShadowColor: '#ff5d22', textShadowRadius: 5 }, smelterOutput: { minWidth: 40, alignItems: 'center', justifyContent: 'center' }, lifeRefineryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, lifeRefineryLabel: { color: '#d3a774', fontSize: 6, fontWeight: '900', letterSpacing: 0.7, flexShrink: 1 }, lifeRefineryPayout: { color: '#f0cb74', fontSize: 7, fontWeight: '900' }, lifeRefineryTrack: { height: 3, marginTop: 4, overflow: 'hidden', borderRadius: 9, backgroundColor: '#26353a' }, lifeRefineryFill: { height: '100%', backgroundColor: '#f09947', shadowColor: '#ffbf61', shadowOpacity: 0.9, shadowRadius: 5 }, refineryUpgradeRow: { marginTop: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 }, refineryChance: { color: '#9fe5d8', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 }, refineryUpgradeButton: { minWidth: 78, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: '#527f86', borderRadius: 4, backgroundColor: '#0c2630', alignItems: 'center', justifyContent: 'center' }, refineryUpgradeDisabled: { opacity: 0.42 }, refineryUpgradeLabel: { color: '#a7f8ee', fontSize: 6, fontWeight: '900', letterSpacing: 0.4 }, refineryUpgradeCost: { color: '#e9cc82', fontSize: 6, fontWeight: '900', marginTop: 1 },
  lifeExpansionCard: { padding: 11, borderWidth: 1, borderColor: '#62563b', borderRadius: 9, backgroundColor: '#171b1b' }, lifeExpansionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, lifeCapacityReadout: { minWidth: 60, paddingHorizontal: 8, paddingVertical: 5, alignItems: 'center', borderWidth: 1, borderColor: '#8a7042', borderRadius: 5, backgroundColor: '#211d14' }, lifeCapacityValue: { color: '#ffe19a', fontSize: 16, fontWeight: '900' }, lifeCapacityCaption: { color: '#a99568', fontSize: 6, fontWeight: '900', letterSpacing: 0.5 }, lifeExpansionFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }, lifeExpansionHint: { flex: 1, color: '#a8b1a6', fontSize: 8, lineHeight: 12 }, lifeExpansionButton: { minWidth: 95, paddingHorizontal: 9, paddingVertical: 7, alignItems: 'center', borderWidth: 1, borderColor: '#a7894c', borderRadius: 6, backgroundColor: '#302819' }, lifeExpansionButtonTitle: { color: '#ffe2a0', fontSize: 8, fontWeight: '900', letterSpacing: 0.6 }, lifeExpansionButtonCost: { color: '#efd080', fontSize: 8, fontWeight: '900' }, lifeExpansionScaling: { color: '#8f8060', fontSize: 6, fontWeight: '800', letterSpacing: 0.5, marginTop: 6 },
});
