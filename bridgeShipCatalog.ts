import type { ImageSourcePropType } from 'react-native';

export type BridgeShipSkin = {
  id: string;
  source: ImageSourcePropType;
  aspect: number;
};

// All craft face right and are mirrored in code for reverse-direction passes.
export const BRIDGE_SHIP_SKINS: BridgeShipSkin[] = [
  { id: 'survey-shuttle', source: require('./assets/bridge-vistas/survey-shuttle-sprite.png'), aspect: 664 / 345 },
  { id: 'blue-spear-interceptor', source: require('./assets/bridge-vistas/ships/blue-spear-interceptor.png'), aspect: 1536 / 1024 },
  { id: 'ironwake-hauler', source: require('./assets/bridge-vistas/ships/ironwake-hauler.png'), aspect: 1728 / 910 },
  { id: 'needlewing-courier', source: require('./assets/bridge-vistas/ships/needlewing-courier.png'), aspect: 1723 / 913 },
  { id: 'pilgrim-courier', source: require('./assets/bridge-vistas/ships/pilgrim-courier.png'), aspect: 1983 / 793 },
  { id: 'greenline-surveyor', source: require('./assets/bridge-vistas/ships/greenline-surveyor.png'), aspect: 1774 / 887 },
  { id: 'asteroid-salvage-tug', source: require('./assets/bridge-vistas/ships/asteroid-salvage-tug.png'), aspect: 1774 / 887 },
];
