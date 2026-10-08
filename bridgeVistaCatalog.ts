import type { ImageSourcePropType } from 'react-native';

export type BridgeAmbienceProfile = 'deep-space' | 'pelagic-megacity' | 'emberline-shipyard' | 'nacre-ice-giant' | 'eventide-eclipse' | 'glass-desert' | 'pilgrim-beacons' | 'aurora-reef' | 'comet-caravan' | 'blue-meridian' | 'vesper-horizon' | 'blueworld-patrol' | 'dawnward-escort' | 'emberfall-frontier' | 'leviathan-orbit' | 'nebula-clouds' | 'asteroid-belt';
export type BridgeVistaScene = {
  id: string;
  name: string;
  source: ImageSourcePropType;
  ambience?: BridgeAmbienceProfile;
};

// Built-in vista art is a clean exterior plate. The ship interior and window
// mask stay in App.tsx; gentle motion is composed by BridgeVistaRenderer.
export const BUILT_IN_BRIDGE_VISTAS: BridgeVistaScene[] = [
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
];
