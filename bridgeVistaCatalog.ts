import type { ImageSourcePropType } from 'react-native';

export type BridgeAmbienceProfile = 'deep-space' | 'pelagic-megacity' | 'emberline-shipyard' | 'nacre-ice-giant' | 'eventide-eclipse';
export type BridgeVistaScene = {
  id: string;
  name: string;
  source: ImageSourcePropType;
  ambience?: BridgeAmbienceProfile;
};

// Built-in vista art is a clean exterior plate. The ship interior and window
// mask stay in App.tsx; gentle motion is composed by BridgeVistaRenderer.
export const BUILT_IN_BRIDGE_VISTAS: BridgeVistaScene[] = [
  { id: 'blue-ringworld', name: 'Blue Ringworld', source: require('./assets/bridge-vistas/blue-ringworld-vista.jpg'), ambience: 'deep-space' },
  { id: 'astral-nebula', name: 'Astral Nebula', source: require('./assets/picture-events/astral-nebula.jpg'), ambience: 'deep-space' },
  { id: 'ringworld-horizon', name: 'Ringworld Horizon', source: require('./assets/picture-events/ringworld-horizon.jpg'), ambience: 'deep-space' },
  { id: 'stellar-clouds', name: 'Stellar Clouds', source: require('./assets/picture-events/stellar-clouds.jpg'), ambience: 'deep-space' },
  { id: 'pelagic-megacity', name: 'Pelagic Megacity', source: require('./assets/bridge-vistas/pelagic-megacity.jpg'), ambience: 'pelagic-megacity' },
  { id: 'emberline-shipyard', name: 'Emberline Shipyard', source: require('./assets/bridge-vistas/emberline-shipyard.jpg'), ambience: 'emberline-shipyard' },
  { id: 'nacre-ice-giant', name: 'Nacre Ice Giant', source: require('./assets/bridge-vistas/nacre-ice-giant.jpg'), ambience: 'nacre-ice-giant' },
  { id: 'eventide-binary-eclipse', name: 'Eventide Binary Eclipse', source: require('./assets/bridge-vistas/eventide-binary-eclipse.jpg'), ambience: 'eventide-eclipse' },
];
