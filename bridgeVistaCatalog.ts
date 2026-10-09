import type { ImageSourcePropType } from 'react-native';

export type BridgeAmbienceProfile = 'none' | 'deep-space' | 'pelagic-megacity' | 'emberline-shipyard' | 'nacre-ice-giant' | 'eventide-eclipse' | 'glass-desert' | 'pilgrim-beacons' | 'aurora-reef' | 'comet-caravan' | 'blue-meridian' | 'vesper-horizon' | 'blueworld-patrol' | 'dawnward-escort' | 'emberfall-frontier' | 'leviathan-orbit' | 'nebula-clouds' | 'asteroid-belt' | 'cinder-comet-shoals' | 'copperline-orbital-foundry';
export type BridgeVistaSource = ImageSourcePropType | { type: 'video'; asset: number };
export type BridgeVistaScene = {
  id: string;
  name: string;
  source: BridgeVistaSource;
  ambience?: BridgeAmbienceProfile;
  /** Opt-in pairing for future Picture Event rewards. Existing vistas stay public. */
  pictureEventUnlock?: boolean;
};

// Built-in vista art is a clean exterior plate. The ship interior and window
// mask stay in App.tsx; gentle motion is composed by BridgeVistaRenderer.
export const BUILT_IN_BRIDGE_VISTAS: BridgeVistaScene[] = [
  { id: 'cinder-comet-shoals', name: 'Cinder Comet Shoals', source: require('./assets/bridge-vistas/cinder-comet-shoals.png'), ambience: 'cinder-comet-shoals' },
  { id: 'copperline-orbital-foundry', name: 'Copperline Orbital Foundry', source: require('./assets/bridge-vistas/copperline-orbital-foundry.jpg'), ambience: 'copperline-orbital-foundry' },
  { id: 'blue-ringworld', name: 'Blue Ringworld', source: require('./assets/bridge-vistas/blue-ringworld-vista.jpg'), ambience: 'blue-meridian' },
  { id: 'astral-nebula', name: 'Astral Nebula', source: require('./assets/picture-events/astral-nebula.jpg'), ambience: 'nebula-clouds' },
  { id: 'ringworld-horizon', name: 'Ringworld Horizon', source: require('./assets/picture-events/ringworld-horizon.jpg'), ambience: 'nacre-ice-giant' },
  { id: 'stellar-clouds', name: 'Stellar Clouds', source: require('./assets/picture-events/stellar-clouds.jpg'), ambience: 'nebula-clouds' },
  { id: 'pelagic-megacity', name: 'Pelagic Megacity', source: require('./assets/bridge-vistas/pelagic-megacity.jpg'), ambience: 'pelagic-megacity' },
  { id: 'emberline-shipyard', name: 'Emberline Shipyard', source: require('./assets/bridge-vistas/emberline-shipyard.jpg'), ambience: 'emberline-shipyard' },
  { id: 'nacre-ice-giant', name: 'Nacre Ice Giant', source: require('./assets/bridge-vistas/nacre-ice-giant.jpg'), ambience: 'nacre-ice-giant' },
  { id: 'eventide-binary-eclipse', name: 'Eventide Binary Eclipse', source: require('./assets/bridge-vistas/eventide-binary-eclipse.jpg'), ambience: 'eventide-eclipse' },
  { id: 'glass-desert-dawn', name: 'Glass Desert at Dawn', source: require('./assets/bridge-vistas/glass-desert-dawn.png'), ambience: 'glass-desert' },
  { id: 'pilgrim-beacons', name: 'The Pilgrim Beacons', source: require('./assets/bridge-vistas/pilgrim-beacons.png'), ambience: 'pilgrim-beacons' },
  { id: 'aurora-reef', name: 'The Aurora Reef', source: require('./assets/bridge-vistas/aurora-reef.png'), ambience: 'aurora-reef' },
  { id: 'comet-caravan', name: 'Comet Caravan', source: require('./assets/bridge-vistas/comet-caravan.png'), ambience: 'comet-caravan' },
  { id: 'blue-meridian', name: 'Blue Meridian', source: require('./assets/bridge-vistas/blue-meridian.png'), ambience: 'blue-meridian' },
  { id: 'vesper-horizon', name: 'Vesper Horizon', source: require('./assets/bridge-vistas/vesper-horizon.png'), ambience: 'vesper-horizon' },
  { id: 'blueworld-patrol', name: 'Blueworld Patrol', source: require('./assets/bridge-vistas/blueworld-patrol.png'), ambience: 'blueworld-patrol' },
  { id: 'dawnward-escort', name: 'Dawnward Escort', source: require('./assets/bridge-vistas/dawnward-escort.png'), ambience: 'dawnward-escort' },
  { id: 'emberfall-frontier', name: 'Emberfall Frontier', source: require('./assets/bridge-vistas/emberfall-frontier.png'), ambience: 'emberfall-frontier' },
  { id: 'leviathan-orbit', name: 'Leviathan Orbit', source: require('./assets/bridge-vistas/leviathan-orbit.png'), ambience: 'leviathan-orbit' },
  { id: 'krea-space-scape', name: 'Krea Space Scape', source: { type: 'video', asset: require('./assets/bridge-vistas/krea-space-scape.mp4') } },
  { id: 'violet-rimlands', name: 'Violet Rimlands', source: require('./assets/bridge-vistas/violet-rimlands.jpg'), ambience: 'none' },
  { id: 'quiet-supernova', name: 'Quiet Supernova', source: require('./assets/bridge-vistas/quiet-supernova.jpg'), ambience: 'none' },
  { id: 'pilgrim-ring-station', name: 'Pilgrim Ring Station', source: require('./assets/bridge-vistas/pilgrim-ring-station.jpg'), ambience: 'none' },
  { id: 'umbral-shardfield', name: 'Umbral Shardfield', source: require('./assets/bridge-vistas/umbral-shardfield.jpg'), ambience: 'none' },
  { id: 'roseglass-observation-deck', name: 'Roseglass Observation Deck', source: require('./assets/bridge-vistas/roseglass-observation-deck.jpg'), ambience: 'none' },
  { id: 'midnight-anchorage', name: 'Midnight Anchorage', source: require('./assets/bridge-vistas/midnight-anchorage.jpg'), ambience: 'none' },
  { id: 'somber-nebula', name: 'Somber Nebula', source: require('./assets/bridge-vistas/somber-nebula.jpg'), ambience: 'none' },
  { id: 'amber-ringworld', name: 'Amber Ringworld', source: require('./assets/bridge-vistas/amber-ringworld.png'), ambience: 'none', pictureEventUnlock: true },
  { id: 'violet-giant', name: 'Violet Giant', source: require('./assets/bridge-vistas/violet-giant.png'), ambience: 'none', pictureEventUnlock: true },
  { id: 'emerald-ocean', name: 'Emerald Ocean', source: require('./assets/bridge-vistas/emerald-ocean.png'), ambience: 'none', pictureEventUnlock: true },
  { id: 'ancient-megastructure', name: 'Ancient Megastructure', source: require('./assets/bridge-vistas/ancient-megastructure.png'), ambience: 'none', pictureEventUnlock: true },
  { id: 'eclipse-over-fire', name: 'Eclipse over Fire', source: require('./assets/bridge-vistas/eclipse-over-fire.png'), ambience: 'none', pictureEventUnlock: true },
  { id: 'star-nursery', name: 'Star Nursery', source: require('./assets/bridge-vistas/star-nursery.png'), ambience: 'none', pictureEventUnlock: true },
  { id: 'broken-halo', name: 'The Broken Halo', source: require('./assets/bridge-vistas/broken-halo.jpg'), ambience: 'none', pictureEventUnlock: true },
  { id: 'wandering-world', name: 'The Wandering World', source: require('./assets/bridge-vistas/wandering-world.jpg'), ambience: 'none', pictureEventUnlock: true },
  { id: 'glass-sea', name: 'The Glass Sea', source: require('./assets/bridge-vistas/glass-sea.jpg'), ambience: 'none', pictureEventUnlock: true },
  { id: 'red-dwarf-shadow', name: 'The Red Dwarf’s Shadow', source: require('./assets/bridge-vistas/red-dwarf-shadow.jpg'), ambience: 'none', pictureEventUnlock: true },
  { id: 'great-storm', name: 'The Great Storm', source: require('./assets/bridge-vistas/great-storm.jpg'), ambience: 'none', pictureEventUnlock: true },
  { id: 'pilgrim-fleet', name: 'The Pilgrim Fleet', source: require('./assets/bridge-vistas/pilgrim-fleet.jpg'), ambience: 'none', pictureEventUnlock: true },
  { id: 'gravity-well', name: 'The Gravity Well', source: require('./assets/bridge-vistas/gravity-well.jpg'), ambience: 'none', pictureEventUnlock: true },
  { id: 'hanging-gardens', name: 'The Hanging Gardens', source: require('./assets/bridge-vistas/hanging-gardens.jpg'), ambience: 'none', pictureEventUnlock: true },
  { id: 'silent-wreck', name: 'The Silent Wreck', source: require('./assets/bridge-vistas/silent-wreck.jpg'), ambience: 'none', pictureEventUnlock: true },
  { id: 'far-lanterns', name: 'The Far Lanterns', source: require('./assets/bridge-vistas/far-lanterns.jpg'), ambience: 'none', pictureEventUnlock: true },
];
