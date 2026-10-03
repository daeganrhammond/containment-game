import { PowerKind } from './mechanics';

export type SkinOption = { id: string; name: string; description: string };
export type CaptureAnimation = 'heart-beat' | 'seed-bloom' | 'electric-surge' | 'ember-impact' | 'metal-shatter' | 'gear-shock' | 'piston-strike' | 'meteor-burst' | 'golden-cache' | 'ruby-shatter' | 'heart-flare' | 'necrotic-spores' | 'orb-burst' | 'waldo-triumph' | 'speed-comet' | 'speed-ribbon' | 'speed-pulse' | 'coin-glint' | 'silver-shimmer' | 'compass-pulse' | 'sailcoin-glint' | 'bubble-pop' | 'credit-cascade' | 'credit-surge' | 'skewer-pierce' | 'engi-hatch' | 'sector-warp';
// Silhouette is visual only: every pickup keeps its circular physics/collision radius.
export type PickupSkinOption = SkinOption & { captureAnimation: CaptureAnimation; breakAnimation?: 'token-fracture' | 'drone-spark' | 'capsule-split' | 'compass-break' | 'shipcoin-break'; silhouette?: 'orb' | 'freeform'; fxColor: string; fxAccent: string; fxGlyph: string; fxParticle: string };
export type SkinSelections = {
  background: string;
  ball: string;
  pickups: Record<PowerKind, string>;
  credit: string;
};
export type EngiSkinOption = SkinOption & { shell: string; trim: string; glow: string; form: 'aegis' | 'cartographer' | 'pilgrim' };
export const LEVEL_CLEAR_ANIMATIONS = [
  { id: 'nova', name: 'Starforge Nova', description: 'A brilliant core flash sends an expanding luminous ring across the arena.' },
  { id: 'prism', name: 'Prismatic Gate', description: 'Layered color panes fold open like a crystalline doorway into the next stage.' },
  { id: 'rift', name: 'Signal Rift', description: 'A narrow beacon line blooms into a wide scanning aperture with drifting sparks.' },
] as const;

export const ENGI_PET_SKINS: readonly EngiSkinOption[] = [
  { id: 'salvage-engi', name: 'Aegis Scaffold', description: 'A three-legged field foundry carrying a suspended repair heart beneath a folding gantry. Its counterweight swings as tiny weld-lights trace the shell seams.', shell: '#727d77', trim: '#d3a66d', glow: '#7ff5d1', form: 'aegis' },
  { id: 'verdant-engi', name: 'Mica Cartographer', description: 'A low survey crawler with four articulated feet, a rotating brass map-dial, and layered mica shutters. It continually charts the arena with a soft emerald scan.', shell: '#466b58', trim: '#c28e51', glow: '#c9f17e', form: 'cartographer' },
  { id: 'cobalt-engi', name: 'Bellows Pilgrim', description: 'A tall, folded ceramic service automaton with a breathing bellows core, cable-hung lantern eye, and long instrument arms. Its idle cycle feels patient and deliberate.', shell: '#3a5268', trim: '#c68b70', glow: '#8beaff', form: 'pilgrim' },
];

export const CREDIT_SKINS: readonly SkinOption[] = [
  { id: 'sunshard', name: 'Sunshard Seal', description: 'A radiant, stamped gold sunburst used as a minted credit mark' },
  { id: 'circuit-chit', name: 'Circuit Chit', description: 'A precise teal hexagonal chip with a luminous data core' },
  { id: 'void-prism', name: 'Void Prism', description: 'A faceted violet crystal shard that refracts light like a rare token' },
  { id: 'tidal-pearl', name: 'Tidal Pearl', description: 'A nacre trade pearl with an orbiting blue tide and drifting bubbles' },
  { id: 'ember-scrip', name: 'Ember Scrip', description: 'A scorched brass-and-obsidian credit wafer with a living coal core' },
];

export const BACKGROUND_SKINS = [
  { id: 'abyss', name: 'Abyss', color: '#0b1728', description: 'Deep navy' },
  { id: 'violet', name: 'Violet Vault', color: '#17112b', description: 'Dark violet' },
  { id: 'verdant', name: 'Verdant', color: '#102321', description: 'Deep green' },
  { id: 'ember', name: 'Ember', color: '#251623', description: 'Charcoal plum' },
  { id: 'slate', name: 'Slate', color: '#17202a', description: 'Steel blue gray' },
] as const;

export const BALL_SKINS = [
  { id: 'polished-chrome', name: 'Polished Chrome', description: 'Bright mirror-polished sphere', visualStyle: 'metal', base: '#647580', border: '#eef5f9', core: '#9caab3', coreBorder: '#dce6ec', shade: '#263640', reflection: '#fbfdff', highlight: '#ffffff', glint: '#ffffff' },
  { id: 'brushed-steel', name: 'Brushed Steel', description: 'Satin steel with soft directional grain', visualStyle: 'metal', base: '#566976', border: '#d7e2e7', core: '#8798a1', coreBorder: '#bdcbd1', shade: '#263640', reflection: '#e1edf1', highlight: '#f2f8fa', glint: '#ffffff' },
  { id: 'machined-gunmetal', name: 'Machined Gunmetal', description: 'Dark alloy with a restrained cold glint', visualStyle: 'metal', base: '#28323a', border: '#9cabb4', core: '#4a5963', coreBorder: '#75858e', shade: '#080d12', reflection: '#d5e0e6', highlight: '#c8d3d9', glint: '#ffffff' },
  { id: 'celestial-plasma', name: 'Celestial Plasma', description: 'A luminous blue-violet stellar core wrapped in an orbiting energy band', visualStyle: 'plasma', base: '#211747', border: '#c3a5ff', core: '#53dfff', coreBorder: '#f1caff', shade: '#100d28', reflection: '#ffffff', highlight: '#e8d4ff', glint: '#ffffff' },
  { id: 'verdant-seed', name: 'Verdant Seed', description: 'An ancient living seed with a jade shell, golden seam, and tiny leaves', visualStyle: 'seed', base: '#285b38', border: '#b4e88a', core: '#79b84d', coreBorder: '#d6f39a', shade: '#173b2a', reflection: '#fff0ad', highlight: '#dbffa6', glint: '#fff8cd' },
  { id: 'voidglass', name: 'Voidglass', description: 'A dark faceted crystal with sharp amethyst and ice-blue reflections', visualStyle: 'crystal', base: '#17152d', border: '#a9a3f5', core: '#413b77', coreBorder: '#d3d0ff', shade: '#090b19', reflection: '#c6f7ff', highlight: '#fff6ff', glint: '#ffffff' },
  { id: 'asteroid', name: 'Ironwake Asteroid', description: 'A cratered charcoal meteorite with rusty ridges and ember-lit fissures', visualStyle: 'asteroid', base: '#34302e', border: '#aa8b72', core: '#504640', coreBorder: '#826b59', shade: '#18191b', reflection: '#c4a88e', highlight: '#e4c4a1', glint: '#ffc47a' },
] as const;

export const PICKUP_SKINS: Record<PowerKind, readonly PickupSkinOption[]> = {
  life: [
    { id: 'classic-heart', name: 'Classic Heart', description: 'Glossed crimson heart with a distinct double-beat pulse', captureAnimation: 'heart-beat', fxColor: '#ff5c78', fxAccent: '#ffafc0', fxGlyph: '♥', fxParticle: '♥' },
    { id: 'vital-seed', name: 'Vital Seed', description: 'Leaf-veined heart seed with drifting golden motes and a green bloom', captureAnimation: 'seed-bloom', fxColor: '#71d48a', fxAccent: '#f5d76c', fxGlyph: '♥', fxParticle: '✦' },
    { id: 'ruby-prism', name: 'Ruby Prism', description: 'A faceted ruby heart with sharp crystal shoulders and floating splinters', captureAnimation: 'ruby-shatter', silhouette: 'freeform', fxColor: '#e64c99', fxAccent: '#ffc0e1', fxGlyph: '◆', fxParticle: '◇' },
    { id: 'ember-bloom', name: 'Ember Bloom', description: 'A bright heart carried by long flame petals and a drifting cinder trail', captureAnimation: 'heart-flare', silhouette: 'freeform', fxColor: '#fa6327', fxAccent: '#ffc264', fxGlyph: '♥', fxParticle: '✧' },
    { id: 'necrotic-heart', name: 'Necrotic Heart', description: 'Root-bound heart of muted violet tissue and drifting green spores', captureAnimation: 'necrotic-spores', fxColor: '#739b58', fxAccent: '#c2dd8d', fxGlyph: '♥', fxParticle: '●' },
    { id: 'crimson-orb', name: 'Crimson Star Orb', description: 'A deep red stellar core held in a luminous blue-white containment ring', captureAnimation: 'orb-burst', fxColor: '#6c9dff', fxAccent: '#fff0e9', fxGlyph: '✦', fxParticle: '✧' },
  ],
  speed: [
    { id: 'electric-star', name: 'Electric Star', description: 'Dark violet speed core with a bright electric spark', captureAnimation: 'electric-surge', fxColor: '#ad8bff', fxAccent: '#effaff', fxGlyph: 'ϟ', fxParticle: 'ϟ' },
    { id: 'ion-comet', name: 'Ion Comet', description: 'A bright ion core with a swept, accelerating tail', captureAnimation: 'speed-comet', fxColor: '#64d9ff', fxAccent: '#efffff', fxGlyph: '✦', fxParticle: '›' },
    { id: 'phase-ribbon', name: 'Phase Ribbon', description: 'An open-ended violet acceleration ribbon folded into an asymmetric slipstream', captureAnimation: 'speed-ribbon', silhouette: 'freeform', fxColor: '#ba83ff', fxAccent: '#f6dfff', fxGlyph: '∞', fxParticle: '∿' },
    { id: 'pulse-engine', name: 'Pulse Engine', description: 'A compact rectangular kinetic reactor with exposed side vanes and a bright core', captureAnimation: 'speed-pulse', silhouette: 'freeform', fxColor: '#54e4cb', fxAccent: '#d8fff8', fxGlyph: '◉', fxParticle: '○' },
    { id: 'solar-dash', name: 'Solar Dash', description: 'A dark amber speed cell streaked with sharp golden light', captureAnimation: 'speed-comet', fxColor: '#f6b84e', fxAccent: '#fff2bd', fxGlyph: '➤', fxParticle: '✦' },
  ],
  ram: [
    { id: 'spark-orb', name: 'Spark Orb', description: 'Original black energy orb with amber sparks', captureAnimation: 'ember-impact', fxColor: '#ff992e', fxAccent: '#fff0a5', fxGlyph: '✹', fxParticle: '✦' },
    { id: 'wedge-core', name: 'Wedge Core', description: 'Armored breaching wedge driven by a dark core', captureAnimation: 'metal-shatter', fxColor: '#c9d4da', fxAccent: '#ffbd53', fxGlyph: '◀', fxParticle: '◆' },
    { id: 'flanged-mauler', name: 'Flanged Mauler', description: 'An exposed six-prong impact head around a heavy amber strike hub', captureAnimation: 'gear-shock', silhouette: 'freeform', fxColor: '#d3a55e', fxAccent: '#fff0bd', fxGlyph: '✹', fxParticle: '✦' },
    { id: 'shock-piston', name: 'Shock Piston', description: 'An elongated breaching ram with a visible spring, sliding rod, and broad piston face', captureAnimation: 'piston-strike', silhouette: 'freeform', fxColor: '#ffba4d', fxAccent: '#e4edf0', fxGlyph: '▰', fxParticle: '━' },
    { id: 'cinder-meteor', name: 'Cinder Meteor', description: 'Cracked impact stone glowing through hot seams', captureAnimation: 'meteor-burst', fxColor: '#ff682e', fxAccent: '#ffe18a', fxGlyph: '✹', fxParticle: '✧' },
  ],
  treasure: [
    { id: 'gilded-coffer', name: 'Gilded Coffer', description: 'Small gold-trimmed treasure chest', captureAnimation: 'golden-cache', fxColor: '#ffd45f', fxAccent: '#fff2bc', fxGlyph: '▣', fxParticle: '●' },
    { id: 'suncoin', name: 'Suncoin', description: 'An unmistakable polished gold coin with a sharp traveling glint', captureAnimation: 'coin-glint', fxColor: '#f5bb42', fxAccent: '#fff2ad', fxGlyph: '✦', fxParticle: '●' },
    { id: 'moon-silver', name: 'Moon Silver', description: 'A sweeping silver crescent relic with a dangling moonstone and gliding glint', captureAnimation: 'silver-shimmer', silhouette: 'freeform', fxColor: '#a9d4e2', fxAccent: '#f2ffff', fxGlyph: '☾', fxParticle: '◇' },
  ],
  merchant: [
    { id: 'compass-wheel', name: 'Wayfinder Compass', description: 'An aged navigator compass framed by a brass ship wheel', captureAnimation: 'compass-pulse', breakAnimation: 'compass-break', fxColor: '#7ac8c0', fxAccent: '#e7bf69', fxGlyph: '✥', fxParticle: '✧' },
    { id: 'merchant-sailing-coin', name: 'Merchant Fleet Coin', description: 'A worn brown trade coin embossed with a merchant sailing ship', captureAnimation: 'sailcoin-glint', breakAnimation: 'shipcoin-break', fxColor: '#b9824d', fxAccent: '#f2d08a', fxGlyph: '⚓', fxParticle: '◇' },
  ],
  bubble: [
    { id: 'cosmic-pearl', name: 'Cosmic Pearl', description: 'A cool blue soap bubble holding a tiny starfield', captureAnimation: 'bubble-pop', fxColor: '#70deff', fxAccent: '#f5ffff', fxGlyph: '◌', fxParticle: '✦' },
    { id: 'prismatic-soap', name: 'Prismatic Soap', description: 'An iridescent rose-and-cyan bubble with rainbow soap sheen', captureAnimation: 'bubble-pop', fxColor: '#df91ff', fxAccent: '#9fffee', fxGlyph: '◉', fxParticle: '◇' },
    { id: 'nebula-cell', name: 'Nebula Cell', description: 'An asymmetric violet nebula wisp with a luminous spiral and trailing stardust', captureAnimation: 'bubble-pop', silhouette: 'freeform', fxColor: '#ac91ff', fxAccent: '#ffd3f4', fxGlyph: '✧', fxParticle: '✦' },
  ],
  waldo: [
    { id: 'striped-scout', name: 'Striped Scout', description: 'A recognizable red-and-white striped traveler with red cap, blue trousers, glasses, and a brass finder lens', captureAnimation: 'waldo-triumph', silhouette: 'freeform', fxColor: '#e64656', fxAccent: '#fff1c9', fxGlyph: '◉', fxParticle: '✦' },
  ],
  credit: [
    { id: 'mint-scrip', name: 'Mint Scrip', description: 'A brass-edged credit wafer that sheds stamped tokens in a bright payout cascade', captureAnimation: 'credit-cascade', breakAnimation: 'token-fracture', silhouette: 'freeform', fxColor: '#e8bc67', fxAccent: '#fff1b2', fxGlyph: '¢', fxParticle: '¤' },
    { id: 'ledger-relay', name: 'Ledger Relay', description: 'A teal holographic trade key with a sliding data core and a clean credit surge', captureAnimation: 'credit-surge', breakAnimation: 'drone-spark', silhouette: 'freeform', fxColor: '#53e2cf', fxAccent: '#e3ffff', fxGlyph: '¤', fxParticle: '▱' },
  ],
  'engi-egg': [
    { id: 'engi-cocoon', name: 'Engi Repair Cocoon', description: 'A compact, segmented maintenance pod with a mint status light and sealed tool petals', captureAnimation: 'engi-hatch', breakAnimation: 'token-fracture', silhouette: 'freeform', fxColor: '#9ec7a2', fxAccent: '#93ffe3', fxGlyph: '⌘', fxParticle: '▰' },
  ],
  exit: [
    { id: 'sector-beacon', name: 'Wayfinder Courier', description: 'A compact abstract starship that gently steers between bounces and launches through a route gate when collected', captureAnimation: 'sector-warp', silhouette: 'freeform', fxColor: '#63f0d1', fxAccent: '#c7fbff', fxGlyph: '›', fxParticle: '✦' },
  ],
};

export const DEFAULT_SKIN_SELECTIONS: SkinSelections = {
  background: 'abyss',
  ball: 'polished-chrome',
  credit: 'sunshard',
  pickups: {
    life: 'classic-heart',
    speed: 'electric-star',
    ram: 'spark-orb',
    treasure: 'gilded-coffer',
    merchant: 'compass-wheel',
    bubble: 'cosmic-pearl',
    waldo: 'striped-scout',
    credit: 'mint-scrip',
    'engi-egg': 'engi-cocoon',
    exit: 'sector-beacon',
  },
};

export function normalizeSkinSelections(value: Partial<SkinSelections> | null | undefined): SkinSelections {
  const background = BACKGROUND_SKINS.some(skin => skin.id === value?.background) ? value!.background! : DEFAULT_SKIN_SELECTIONS.background;
  const ball = BALL_SKINS.some(skin => skin.id === value?.ball) ? value!.ball! : DEFAULT_SKIN_SELECTIONS.ball;
  const pickups = Object.fromEntries((Object.keys(PICKUP_SKINS) as PowerKind[]).map(kind => {
    const candidate = value?.pickups?.[kind];
    const valid = PICKUP_SKINS[kind].some(skin => skin.id === candidate);
    return [kind, valid ? candidate! : DEFAULT_SKIN_SELECTIONS.pickups[kind]];
  })) as SkinSelections['pickups'];
  const credit = CREDIT_SKINS.some(skin => skin.id === value?.credit) ? value!.credit! : DEFAULT_SKIN_SELECTIONS.credit;
  return { background, ball, pickups, credit };
}

