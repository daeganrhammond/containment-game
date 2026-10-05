import { PowerKind } from './mechanics';
import { BACKGROUND_SKINS, BALL_SKINS, CREDIT_SKINS, DEFAULT_SKIN_SELECTIONS, ENGI_PET_SKINS, PICKUP_SKINS, SkinOption } from './skins';

export type SkinCategory = 'background' | 'ball' | 'credit-symbol' | 'pet' | `pickup:${PowerKind}`;
export type SkinArchiveNode = { category: SkinCategory; categoryName: string; id: string; name: string; description: string; tier: 0 | 1 | 2 | 3; theme: string };
export type SkinUnlocks = { unlocked: Record<string, string[]>; tiers: Record<string, 0 | 1 | 2 | 3> };

const categoryDefinitions: { key: SkinCategory; name: string; options: readonly SkinOption[]; defaultId: string }[] = [
  { key: 'background', name: 'Arena Backdrops', options: BACKGROUND_SKINS, defaultId: DEFAULT_SKIN_SELECTIONS.background },
  { key: 'ball', name: 'Metal Ball Shells', options: BALL_SKINS, defaultId: DEFAULT_SKIN_SELECTIONS.ball },
  { key: 'credit-symbol', name: 'Credit Insignias', options: CREDIT_SKINS, defaultId: DEFAULT_SKIN_SELECTIONS.credit },
  { key: 'pet', name: 'Companions', options: ENGI_PET_SKINS, defaultId: DEFAULT_SKIN_SELECTIONS.engiPet },
  ...Object.entries(PICKUP_SKINS).map(([kind, options]) => ({ key: `pickup:${kind}` as SkinCategory, name: `${kind.toUpperCase()} Pickups`, options, defaultId: DEFAULT_SKIN_SELECTIONS.pickups[kind as PowerKind] })),
];

const themeWords: Record<string, string[]> = {
  'Astral Cartography': ['star', 'astral', 'void', 'nebula', 'prism', 'phase', 'wayfinder', 'chart', 'cosmic', 'orbit', 'singularity', 'courier'],
  'Verdant Signal': ['seed', 'heart', 'verdant', 'forest', 'moth', 'nature', 'engi', 'cocoon', 'scarab', 'petal', 'life', 'mica'],
  'Foundry of Light': ['chrome', 'steel', 'metal', 'forge', 'charge', 'ember', 'sun', 'solar', 'circuit', 'gear', 'ledger', 'mint'],
  'Far Trader': ['merchant', 'treasure', 'coin', 'scrip', 'ship', 'compass', 'skiff', 'waldo', 'bubble', 'speed', 'ram', 'transit'],
};

function themeFor(node: Omit<SkinArchiveNode, 'theme'>): string {
  const text = `${node.id} ${node.name} ${node.categoryName}`.toLowerCase();
  const scored = Object.entries(themeWords).map(([theme, words]) => [theme, words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0)] as const).sort((a, b) => b[1] - a[1]);
  return scored[0][1] ? scored[0][0] : ['Astral Cartography', 'Verdant Signal', 'Foundry of Light', 'Far Trader'][Math.abs([...node.id].reduce((n, char) => n + char.charCodeAt(0), 0)) % 4];
}

export const SKIN_ARCHIVE: SkinArchiveNode[] = categoryDefinitions.flatMap(category => category.options.map((option, index) => {
  const categoryOptions = category.options.filter(candidate => candidate.id !== category.defaultId);
  const indexInLocked = categoryOptions.findIndex(candidate => candidate.id === option.id);
  const tier = option.id === category.defaultId ? 0 : categoryOptions.length <= 1 ? 1 : categoryOptions.length === 2 ? indexInLocked + 1 : categoryOptions.length === 3 ? indexInLocked + 1 : indexInLocked === 0 ? 1 : indexInLocked < categoryOptions.length - 1 ? 2 : 3;
  const node = { category: category.key, categoryName: category.name, id: option.id, name: option.name, description: option.description, tier: tier as 0 | 1 | 2 | 3 };
  return { ...node, theme: themeFor(node) };
}));

export const SKIN_CATEGORY_KEYS = categoryDefinitions.map(category => category.key);
export const SKIN_DEFAULTS: Record<string, string> = Object.fromEntries(categoryDefinitions.map(category => [category.key, category.defaultId]));
export const SKIN_THEME_NAMES = Object.keys(themeWords);

export function defaultSkinUnlocks(): SkinUnlocks {
  return { unlocked: Object.fromEntries(categoryDefinitions.map(category => [category.key, [category.defaultId]])), tiers: Object.fromEntries(SKIN_ARCHIVE.map(node => [`${node.category}:${node.id}`, node.tier])) };
}

export function normalizeSkinUnlocks(value: Partial<SkinUnlocks> | null | undefined): SkinUnlocks {
  const defaults = defaultSkinUnlocks();
  const unlocked: Record<string, string[]> = {};
  for (const category of categoryDefinitions) {
    const allowed = new Set(category.options.map(option => option.id));
    unlocked[category.key] = [...new Set([category.defaultId, ...(value?.unlocked?.[category.key] ?? []).filter(id => allowed.has(id))])];
  }
  const tiers = { ...defaults.tiers };
  for (const [key, tier] of Object.entries(value?.tiers ?? {})) if (tier === 0 || tier === 1 || tier === 2 || tier === 3) tiers[key] = tier;
  return { unlocked, tiers };
}

export function reachableSkin(node: SkinArchiveNode, unlocked: Record<string, string[]>, tiers: Record<string, 0 | 1 | 2 | 3>): boolean {
  if ((unlocked[node.category] ?? []).includes(node.id)) return false;
  const tier = tiers[`${node.category}:${node.id}`] ?? node.tier;
  if (tier === 1) return true;
  const hasImmediateTier = SKIN_ARCHIVE.some(candidate => candidate.category === node.category && (tiers[`${candidate.category}:${candidate.id}`] ?? candidate.tier) === tier - 1);
  const requiredTier = hasImmediateTier ? tier - 1 : Math.max(1, tier - 2);
  return (unlocked[node.category] ?? []).some(id => (tiers[`${node.category}:${id}`] ?? 0) === requiredTier);
}
