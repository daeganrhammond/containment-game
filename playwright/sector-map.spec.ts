import { expect, test } from '@playwright/test';
import { createSector, expandEntireSector, sectorCanReachExit, SECTOR_MAP_CONFIG, SectorType } from '../sectorMap';

test('every generated sector connects every beacon to its single exit', () => {
  const types: SectorType[] = ['Civilian', 'Hostile', 'Nebula', 'Derelict'];
  for (let seed = 1; seed <= 100; seed++) {
    const initial = createSector(seed % 9, types[seed % types.length], [], seed);
    expect(initial.beacons).toHaveLength(1);
    const expanded = expandEntireSector(initial);
    expect(expanded.beacons.filter(beacon => beacon.exit)).toHaveLength(1);
    expect(expanded.beacons.find(beacon => beacon.exit)?.depth).toBe(expanded.targetLength);
    expect(sectorCanReachExit(expanded), `seed ${seed} should have no dead ends`).toBe(true);
    for (const beacon of expanded.beacons.filter(item => !item.exit)) {
      expect(beacon.links.some(id => (expanded.beacons.find(other => other.id === id)?.depth ?? -1) > beacon.depth), `${beacon.id} should have a forward route`).toBe(true);
    }
    expect(SECTOR_MAP_CONFIG.targetLength(expanded.depth, 0)).toBeGreaterThanOrEqual(6);
  }
});
