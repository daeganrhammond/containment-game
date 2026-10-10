import React, { useMemo, useState } from 'react';
import { Image, ImageBackground, ImageSourcePropType, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { BeaconRouteTrail } from './BeaconRouteTrail';
import { archiveSectorRoute, hiddenFrontierBeacons, SECTOR_MAP_CONFIG, SECTOR_VISUALS, SectorRouteRecord, SectorState, SectorType, reachableBeacons } from './sectorMap';

type PicturePreview = { id: string; name: string; source: ImageSourcePropType };
type MapProps = { sector: SectorState; routeAtlas: SectorRouteRecord[]; pictureVistas: PicturePreview[]; scanCharges: number; beaconStreak: number; onBack: () => void; onJump: (beaconId: string) => void; onScan: () => void };

export function SectorMapScreen({ sector, routeAtlas, pictureVistas, scanCharges, beaconStreak, onBack, onJump, onScan }: MapProps) {
  const available = useMemo(() => reachableBeacons(sector), [sector]);
  const [selectedId, setSelectedId] = useState<string | null>(() => available[0]?.id ?? null);
  const [canvas, setCanvas] = useState({ width: 0, height: 0 });
  const [showAtlas, setShowAtlas] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 820;
  const selected = available.find(beacon => beacon.id === selectedId) ?? available[0] ?? null;
  const current = sector.beacons.find(beacon => beacon.id === sector.currentBeaconId)!;
  const mapWidth = canvas.width, mapHeight = canvas.height;
  const known = sector.beacons;
  const visuals = SECTOR_VISUALS[sector.type];
  const scanAvailable = scanCharges > 0 && hiddenFrontierBeacons(sector).length > 0;
  const picturePreview = selected?.vistaId ? pictureVistas.find(vista => vista.id === selected.vistaId) : undefined;
  return <View style={styles.scrim}><View style={[styles.panel, compact && styles.panelCompact]}>
    <View style={styles.header}>
      <View style={[styles.emblem, { borderColor: visuals.accent }]}><Text style={[styles.emblemGlyph, { color: visuals.accent }]}>{visuals.glyph}</Text></View>
      <View style={{ flex: 1, minWidth: 0 }}><Text style={[styles.eyebrow, { color: visuals.accent }]}>ASTROGATION · SECTOR {String(sector.depth + 1).padStart(2, '0')}</Text><Text style={styles.title}>{sector.type.toUpperCase()} NAVIGATION</Text><Text style={styles.sub}>{visuals.mood} · {known.length} BEACONS · {Math.max(0, sector.targetLength - current.depth)} JUMPS TO GATE</Text></View>
      <View style={styles.headerReadout}><Text style={styles.headerReadoutLabel}>CURRENT BEACON · RISK STREAK ×{beaconStreak}</Text><Text numberOfLines={1} style={styles.headerReadoutValue}>{current.name.toUpperCase()}</Text><Text style={styles.scanReadout}>SCANS STORED · {scanCharges}</Text></View>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.smallButton}><Text style={styles.smallButtonText}>RETURN</Text></Pressable>
    </View>
    <View style={[styles.content, compact && styles.contentCompact]}>
      <View style={styles.mapColumn}>
        <View style={styles.mapBar}><Text style={[styles.mapBarTitle, { color: visuals.accent }]}>{visuals.glyph}  {showAtlas ? 'RUN ROUTE ATLAS' : 'SECTOR CHART'}</Text><View style={styles.mapBarActions}><Pressable accessibilityRole="button" onPress={() => setShowAtlas(value => !value)} style={[styles.scanButton, { borderColor: visuals.accent }]}><Text style={[styles.scanButtonText, { color: visuals.accent }]}>{showAtlas ? 'CURRENT SECTOR' : `FULL ATLAS · ${routeAtlas.length + 1}`}</Text></Pressable>{!showAtlas && <><Text style={styles.mapBarHint}>DIRECT ROUTES ONLY</Text><Pressable accessibilityRole="button" accessibilityLabel={`Scan hidden frontier; ${scanCharges} charges stored`} disabled={!scanAvailable} onPress={onScan} style={[styles.scanButton, { borderColor: visuals.accent }, !scanAvailable && styles.scanDisabled]}><Text style={[styles.scanButtonText, { color: visuals.accent }]}>⌕ SCAN FRONTIER · {scanCharges}</Text></Pressable></>}</View></View>
        {showAtlas ? <RouteAtlasPane routeAtlas={routeAtlas} activeSector={sector} compact={compact} /> : <ImageBackground source={require('./assets/picture-events/astral-nebula.jpg')} resizeMode="cover" imageStyle={{ opacity: 0.72 }} style={styles.mapArea} onLayout={event => setCanvas(event.nativeEvent.layout)}>
          <View pointerEvents="none" style={[styles.sectorWash, { backgroundColor: visuals.tint }]} />
          <View style={styles.mapVeil}><View style={[styles.mapCanvas, { width: mapWidth, height: mapHeight }]}>
            {Array.from({ length: 48 }, (_, index) => <View key={`star-${index}`} pointerEvents="none" style={[styles.star, { left: `${(index * 37 + 11) % 100}%`, top: `${(index * 61 + 7) % 100}%`, opacity: 0.2 + ((index * 19) % 7) / 10 }]} />)}
            {sector.visitedBeaconIds.slice(1).flatMap((targetId, index) => {
              const from = known.find(beacon => beacon.id === sector.visitedBeaconIds[index]), to = known.find(beacon => beacon.id === targetId); if (!from || !to) return [];
              return <BeaconRouteTrail key={`trail:${from.id}:${to.id}`} id={`trail:${from.id}:${to.id}`} from={from} to={to} width={mapWidth} height={mapHeight} color={visuals.route} minDots={8} />;
            })}
            {current.links.flatMap(targetId => {
              const to = known.find(beacon => beacon.id === targetId); if (!to) return [];
              const reachable = available.some(beacon => beacon.id === to.id);
              return <BeaconRouteTrail key={`${current.id}:${to.id}`} id={`${current.id}:${to.id}`} from={current} to={to} width={mapWidth} height={mapHeight} color={reachable ? visuals.route : '#94bba9'} spacing={12} minDots={6} maxDots={36} opacity={reachable ? 1 : 0.62} />;
            })}
            {known.map(beacon => {
              const isCurrent = beacon.id === current.id, isReachable = available.some(item => item.id === beacon.id), isVisited = sector.visitedBeaconIds.includes(beacon.id);
              const label = beacon.exit ? 'SECTOR GATE' : isCurrent ? 'YOU ARE HERE' : beacon.event.hidden ? 'UNIDENTIFIED SIGNAL' : beacon.event.markerLabel ?? beacon.event.title.toUpperCase();
              const opacity = isCurrent || isReachable || isVisited || beacon.exit ? 1 : 0.48;
              return <React.Fragment key={beacon.id}>
                <Pressable accessibilityRole="button" accessibilityLabel={beacon.exit ? 'Sector exit beacon' : isCurrent ? 'Current beacon' : isReachable ? `Select ${beacon.event.hidden ? 'unidentified beacon' : beacon.event.title}` : `Unreachable ${label} beacon`} accessibilityState={{ disabled: !isReachable }} disabled={!isReachable} onPress={() => setSelectedId(beacon.id)} style={[styles.beacon, { left: beacon.x * mapWidth - 17, top: beacon.y * mapHeight - 17, opacity }, isCurrent && styles.beaconCurrent, beacon.id === sector.lastScannedBeaconId && styles.beaconScanned, selectedId === beacon.id && styles.beaconSelected]}>
                  <View style={[styles.beaconDiamond, beacon.exit && styles.exitDiamond, isCurrent && styles.currentDiamond, isReachable && !beacon.exit && styles.reachableDiamond]} />
                  {isCurrent && <Text pointerEvents="none" style={styles.shipMark}>◁</Text>}
                </Pressable>
                <Text pointerEvents="none" numberOfLines={1} style={[styles.mapLabel, beacon.exit && styles.exitLabel, isCurrent && styles.currentLabel, !isReachable && !isCurrent && !beacon.exit && styles.distantLabel, { left: Math.max(3, Math.min(mapWidth - 130, beacon.x * mapWidth + 12)), top: Math.max(2, Math.min(mapHeight - 16, beacon.y * mapHeight - 17)), opacity }]}>{label}</Text>
              </React.Fragment>;
            })}
          </View></View>
          <View pointerEvents="none" style={styles.mapLegend}><View style={styles.legendDot} /><Text style={styles.legendText}>REACHABLE</Text><View style={[styles.legendDot, styles.legendMuted]} /><Text style={styles.legendText}>OUT OF RANGE</Text><Text style={styles.legendTail}>UNCHARTED LINKS HIDDEN</Text></View>
        </ImageBackground>}
      </View>
      <View style={[styles.preview, compact && styles.previewCompact]}>
        {selected ? <>
          <View style={styles.previewTopline}><Text style={styles.eyebrow}>INCOMING JUMP · BEACON {String(selected.depth).padStart(2, '0')}</Text><Text style={styles.signalReadout}>SIGNAL LOCKED</Text></View>
          <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewBody}>
            {picturePreview && <View style={styles.pictureFrame}><Image source={picturePreview.source} resizeMode="cover" style={styles.previewImage} /><Text style={styles.pictureCaption}>{picturePreview.name.toUpperCase()} · VISUAL ID</Text></View>}
            <Text style={styles.previewTitle}>{selected.event.hidden ? 'Unidentified Beacon' : selected.event.title}</Text>
            <Text style={styles.copy}>{selected.event.hidden ? 'Event details are masked.' : selected.event.description}</Text>
            <View style={styles.forecastRow}><View style={styles.forecastCell}><Text style={styles.forecastLabel}>RISK · {selected.event.hidden ? '—' : `${selected.riskRating ?? 1}/5`}</Text>{selected.event.hidden ? <Text style={styles.forecastUnknown}>SIGNAL MASKED</Text> : <View style={styles.ratingTrack}>{Array.from({ length: 5 }, (_, i) => <View key={`risk-${i}`} style={[styles.ratingSegment, i < (selected.riskRating ?? 1) && styles.riskSegment]} />)}</View>}</View><View style={styles.forecastDivider} /><View style={styles.forecastCell}><Text style={styles.forecastLabel}>SALVAGE OUTLOOK · {selected.event.hidden ? '—' : `${selected.salvageRating ?? 1}/5`}</Text>{selected.event.hidden ? <Text style={styles.forecastUnknown}>SIGNAL MASKED</Text> : <View style={styles.ratingTrack}>{Array.from({ length: 5 }, (_, i) => <View key={`salvage-${i}`} style={[styles.ratingSegment, i < (selected.salvageRating ?? 1) && styles.salvageSegment]} />)}</View>}</View></View>
            {!selected.event.hidden && selected.event.passage && <Text style={styles.passage}>{selected.event.passage}</Text>}
            {!selected.event.hidden && selected.effects.length > 0 && <View style={styles.effectRow}>{selected.effects.map(effect => <View key={effect.id} style={[styles.effect, { borderColor: effect.kind === 'hazard' ? '#794249' : effect.kind === 'boon' ? '#32695f' : '#425879' }]}>
              <Text style={[styles.effectTitle, { color: effect.kind === 'hazard' ? '#f19391' : effect.kind === 'boon' ? '#7ce6cd' : '#a8c7ff' }]}>{effect.label.toUpperCase()}</Text><Text style={styles.effectCopy}>{effect.description}</Text>
              {effect.compensation && <RewardLine label={effect.compensation.kind === 'credits' ? 'CLEAR PAYOUT · CREDITS' : 'CLEAR PAYOUT · HIGH SCORE'} glyph={effect.compensation.kind === 'credits' ? '◉' : '✦'} amount={effect.compensation.amount} />}
              {effect.creditsDelta !== undefined && effect.creditsDelta > 0 && <RewardLine label="ARRIVAL CACHE · CREDITS" glyph="◉" amount={effect.creditsDelta} />}
              {effect.livesDelta !== undefined && effect.livesDelta > 0 && <RewardLine label="HULL RECOVERY · LIFE" glyph="♥" amount={effect.livesDelta} />}
              {effect.engiPodReward !== undefined && effect.engiPodReward > 0 && <RewardLine label="CREW RECOVERY · ENGI POD" glyph="◈" amount={effect.engiPodReward} />}
              {effect.scanChargeReward !== undefined && effect.scanChargeReward > 0 && <RewardLine label="SENSOR DATA · SCAN CHARGE" glyph="⌕" amount={effect.scanChargeReward} />}
              {effect.resourceReward && <RewardLine label={`SALVAGE · ${effect.resourceReward.kind.toUpperCase()} PICKUP${effect.resourceReward.amount === 1 ? '' : 'S'}`} glyph={resourceGlyph(effect.resourceReward.kind)} amount={effect.resourceReward.amount} />}
              {effect.upgradeReward && <RewardLine label={`TECH RECOVERY · ${({ 'smelter-speed': 'SMELTER SPEED', 'life-capacity': 'LIFE CAPACITY', 'speed-capacity': 'SPEED CAPACITY', 'ram-capacity': 'RAM CAPACITY', 'charge-capacity': 'CHARGE CAPACITY' } as Record<string, string>)[effect.upgradeReward]}`} glyph="⚙" amount={1} />}
            </View>)}</View>}
            {!selected.event.hidden && selected.event.kind === 'picture' && selected.vistaId && <RewardLine label="CLEAR REWARD · WINDOW VISTA UNLOCK" glyph="▣" amount={1} />}
            <View style={styles.previewRule}><View style={styles.ruleLine} /><Text style={styles.previewRuleText}>ROUTE INTEL</Text><View style={styles.ruleLine} /></View>
            <Text style={styles.tacticalCopy}>This beacon is within jump range. Its visible event and stage conditions are confirmed by sector scans.</Text>
          </ScrollView>
          <View style={styles.jumpDock}><View style={{ flex: 1 }}><Text style={styles.jumpDockLabel}>DRIVE STATUS · {SECTOR_MAP_CONFIG.fuelEnabled ? 'FUEL COST · 1' : 'READY'}</Text><Text style={styles.jumpDockValue}>RISK STREAK ×{beaconStreak} · CLEAR TO BANK REWARDS</Text></View><Pressable accessibilityRole="button" onPress={() => onJump(selected.id)} style={[styles.jumpButton, { backgroundColor: visuals.accent }]}><Text style={styles.jumpButtonText}>ENGAGE JUMP  ›</Text></Pressable></View>
        </> : <View style={styles.emptyPreview}><Text style={styles.eyebrow}>NO ROUTE LOCK</Text><Text style={styles.copy}>Select one of the green connected beacons to open its destination dossier.</Text></View>}
      </View>
    </View>
    <View style={styles.footer}><Text style={styles.footerText}>SECTOR ROUTE · {current.name.toUpperCase()}  /  {Math.max(0, sector.targetLength - current.depth)} JUMPS TO GATE</Text><Text style={styles.footerText}>CHARTED {known.length}  ·  VISITED {sector.visitedBeaconIds.length}</Text></View>
  </View></View>;
}

function resourceGlyph(kind: string) {
  return ({ life: '♥', speed: 'ϟ', ram: '◢', charge: '✹' } as Record<string, string>)[kind] ?? '◆';
}

function RewardLine({ label, glyph, amount }: { label: string; glyph: string; amount: number }) {
  return <View style={styles.rewardLine}><Text style={styles.rewardLabel}>{label}</Text><View style={styles.rewardCount}><Text style={styles.rewardGlyph}>{glyph}</Text><Text style={styles.rewardNumber}>+{amount}</Text></View></View>;
}

type SectorSelectProps = { options: SectorType[]; currentType: SectorType; depth: number; onChoose: (type: SectorType) => void; onCancel: () => void };
function MiniSectorRoute({ record, index, count, compact }: { record: SectorRouteRecord; index: number; count: number; compact?: boolean }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const byId = new Map(record.beacons.map(beacon => [beacon.id, beacon]));
  return <View style={[styles.atlasCard, compact && styles.atlasCardCompact]}>
    <View style={styles.atlasCardHeading}><Text style={styles.atlasCardTitle}>SECTOR {String(record.depth + 1).padStart(2, '0')} · {record.type.toUpperCase()}</Text><Text style={styles.atlasCardStatus}>{index === count - 1 ? 'LIVE' : 'LOGGED'}</Text></View>
    <View style={styles.atlasMap} onLayout={event => setSize(event.nativeEvent.layout)}>
      {record.pathBeaconIds.slice(1).flatMap((id, pathIndex) => {
        const from = byId.get(record.pathBeaconIds[pathIndex]), to = byId.get(id); if (!from || !to) return [];
        return <BeaconRouteTrail key={`atlas-${record.id}-${pathIndex}`} id={`atlas-${record.id}-${pathIndex}`} from={from} to={to} width={size.width} height={size.height} color={SECTOR_VISUALS[record.type].route} minDots={5} />;
      })}
      {record.beacons.map(beacon => <View key={beacon.id} style={[styles.atlasBeacon, { left: beacon.x * size.width - (beacon.start || beacon.exit ? 4 : 2.5), top: beacon.y * size.height - (beacon.start || beacon.exit ? 4 : 2.5), backgroundColor: beacon.exit ? '#ffe07a' : beacon.visited ? SECTOR_VISUALS[record.type].accent : '#788892', width: beacon.start || beacon.exit ? 8 : 5, height: beacon.start || beacon.exit ? 8 : 5 }]} />)}
    </View>
    <Text style={styles.atlasCardFooter}>PLAYER TRACK · {Math.max(0, record.pathBeaconIds.length - 1)} JUMPS{index < count - 1 ? '   ⇢   NEXT SECTOR' : '   ·   CURRENT POSITION'}</Text>
  </View>;
}

function RouteAtlasPane({ routeAtlas, activeSector, compact = false }: { routeAtlas: SectorRouteRecord[]; activeSector: SectorState; compact?: boolean }) {
  const records = [...routeAtlas, archiveSectorRoute(activeSector)];
  return <View style={styles.atlasPane}>
    <Text style={styles.atlasIntro}>RUN ROUTE · {records.length} SECTORS · PATH SAVED THROUGH EVERY VISITED BEACON</Text>
    <Text style={styles.atlasSequence}>{records.map((record, index) => `${String(record.depth + 1).padStart(2, '0')} ${record.type.toUpperCase()}${index === records.length - 1 ? ' · LIVE' : ''}`).join('   ➜   ')}</Text>
    <ScrollView style={styles.atlasScroll} contentContainerStyle={[styles.atlasGrid, compact && styles.atlasGridCompact]}>
      {records.map((record, index) => <MiniSectorRoute key={record.id} record={record} index={index} count={records.length} compact={compact} />)}
    </ScrollView>
  </View>;
}

export function RouteAtlasScreen({ routeAtlas, activeSector, onBack }: { routeAtlas: SectorRouteRecord[]; activeSector: SectorState; onBack: () => void }) {
  const { width } = useWindowDimensions();
  return <View style={styles.scrim}><View style={styles.panel}>
    <View style={styles.header}><View style={[styles.emblem, { borderColor: SECTOR_VISUALS[activeSector.type].accent }]}><Text style={[styles.emblemGlyph, { color: SECTOR_VISUALS[activeSector.type].accent }]}>⌁</Text></View><View style={{ flex: 1 }}><Text style={styles.eyebrow}>NAVIGATION ARCHIVE · CURRENT RUN</Text><Text style={styles.title}>FLIGHT PATH ATLAS</Text><Text style={styles.sub}>Completed sector trails stay on record until this run ends.</Text></View><Pressable accessibilityRole="button" onPress={onBack} style={styles.smallButton}><Text style={styles.smallButtonText}>RETURN TO BRIDGE</Text></Pressable></View>
    <RouteAtlasPane routeAtlas={routeAtlas} activeSector={activeSector} compact={width < 820} />
  </View></View>;
}

export function SectorSelectScreen({ options, currentType, depth, onChoose, onCancel }: SectorSelectProps) {
  const [selected, setSelected] = useState<SectorType | null>(null);
  return <View style={styles.scrim}><View style={styles.selectPanel}>
    <View style={styles.header}><View style={{ flex: 1 }}><Text style={styles.eyebrow}>SECTOR GATE · DEPTH {String(depth + 1).padStart(2, '0')}</Text><Text style={styles.title}>Select Next Sector</Text><Text style={styles.sub}>Choose a route. The next sector map will open before its first stage.</Text></View><Pressable accessibilityRole="button" onPress={onCancel} style={styles.smallButton}><Text style={styles.smallButtonText}>CANCEL</Text></Pressable></View>
    <ScrollView contentContainerStyle={styles.cards}>{options.map(type => { const info = SECTOR_MAP_CONFIG.sectorTypes[type]; const active = selected === type; return <Pressable key={type} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setSelected(type)} style={[styles.card, { borderColor: active ? info.color : '#294353' }, active && styles.cardActive]}><Text style={[styles.cardIcon, { color: info.color }]}>{type === 'Civilian' ? '✧' : type === 'Hostile' ? '⚠' : type === 'Nebula' ? '◌' : '▧'}</Text><Text style={styles.cardTitle}>{type}</Text><Text style={styles.cardDescription}>{info.description}</Text><Text style={styles.cardStats}>THREAT {['I','II','III'][info.difficulty - 1]}  ·  SALVAGE {['I','II','III','IV'][info.reward - 1]}</Text>{type === currentType && <Text style={styles.currentType}>CURRENT ROUTE TYPE</Text>}</Pressable>; })}</ScrollView>
    <Pressable disabled={!selected} accessibilityRole="button" onPress={() => selected && onChoose(selected)} style={[styles.jumpButton, !selected && styles.disabledJump]}><Text style={styles.jumpButtonText}>CONFIRM SECTOR  ›</Text></Pressable>
  </View></View>;
}

const styles = {
  scrim: { position: 'absolute' as const, zIndex: 180, left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(2,8,15,0.94)', alignItems: 'center' as const, justifyContent: 'center' as const, padding: 12 },
  panel: { width: '100%' as const, maxWidth: 1500, height: '98%' as const, maxHeight: 1100, borderWidth: 1, borderColor: '#3b6971', borderRadius: 8, backgroundColor: '#06101a', padding: 14, overflow: 'hidden' as const }, panelCompact: { padding: 8 },
  selectPanel: { width: '100%' as const, maxWidth: 820, maxHeight: '92%' as const, borderWidth: 1, borderColor: '#2d6671', borderRadius: 12, backgroundColor: '#06121d', padding: 18 },
  header: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, minHeight: 76, paddingHorizontal: 4, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#24414c' }, emblem: { width: 44, height: 44, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: '#64dec5', borderRadius: 22, backgroundColor: '#0b282d' }, emblemGlyph: { color: '#86ffe2', fontSize: 25 }, headerReadout: { minWidth: 130, paddingHorizontal: 10, paddingVertical: 7, borderLeftWidth: 1, borderColor: '#24414c' }, headerReadoutLabel: { color: '#829ba9', fontSize: 7, fontWeight: '900' as const, letterSpacing: 1 }, headerReadoutValue: { color: '#b5f4df', fontSize: 9, fontWeight: '900' as const, marginTop: 4 }, scanReadout: { color: '#76cbe0', fontSize: 6, fontWeight: '900' as const, letterSpacing: 0.6, marginTop: 4 },
  eyebrow: { color: '#b9e5d6', fontSize: 9, fontWeight: '900' as const, letterSpacing: 1.3, fontFamily: 'monospace' as const }, title: { color: '#edf5fc', fontSize: 23, fontWeight: '900' as const, marginTop: 3, fontFamily: 'monospace' as const }, sub: { color: '#a5b8b7', fontSize: 10, marginTop: 3 },
  smallButton: { borderWidth: 1, borderColor: '#365366', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 6 }, smallButtonText: { color: '#9bead9', fontSize: 9, fontWeight: '900' as const, letterSpacing: 0.8 },
  content: { flex: 1, minHeight: 0, flexDirection: 'row' as const, gap: 10, paddingTop: 10, paddingBottom: 6 }, contentCompact: { flexDirection: 'column' as const, gap: 8 }, mapColumn: { flex: 1.75, minWidth: 0, minHeight: 0, borderWidth: 1, borderColor: '#355866', backgroundColor: '#07121a' }, mapBar: { minHeight: 34, paddingHorizontal: 10, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, borderBottomWidth: 1, borderColor: '#263d49', backgroundColor: '#0a1822' }, mapBarTitle: { color: '#c3f3e4', fontSize: 8, fontWeight: '900' as const, letterSpacing: 1.3 }, mapBarActions: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 9 }, mapBarHint: { color: '#79949e', fontSize: 6, fontWeight: '800' as const, letterSpacing: 0.8 }, scanButton: { paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, backgroundColor: '#0d2024' }, scanButtonText: { fontSize: 6, fontWeight: '900' as const, letterSpacing: 0.4 }, scanDisabled: { opacity: 0.35 }, mapArea: { flex: 1, minHeight: 180, width: '100%' as const, alignItems: 'stretch' as const, overflow: 'hidden' as const, backgroundColor: '#040d16' }, mapVeil: { flex: 1, width: '100%' as const, alignItems: 'stretch' as const, backgroundColor: 'rgba(3,8,14,0.18)' }, sectorWash: { ...({ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const) },
  mapCanvas: { position: 'relative' as const, overflow: 'hidden' as const }, star: { position: 'absolute' as const, width: 2, height: 2, borderRadius: 2, backgroundColor: '#e0e3d5' },
  routeDot: { position: 'absolute' as const, width: 3, height: 3, transform: [{ rotate: '45deg' }] }, routeTrailDot: { position: 'absolute' as const, width: 4, height: 4, borderRadius: 3, opacity: 0.95 },
  atlasPane: { flex: 1, minHeight: 180, width: '100%' as const, padding: 9, backgroundColor: '#050e17' }, atlasIntro: { color: '#86cabc', fontSize: 7, fontWeight: '900' as const, letterSpacing: 0.8, paddingBottom: 4 }, atlasSequence: { color: '#d9c77b', fontSize: 7, fontWeight: '900' as const, letterSpacing: 0.45, paddingBottom: 8 }, atlasScroll: { flex: 1, minHeight: 0 }, atlasGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, paddingBottom: 8 }, atlasGridCompact: { flexDirection: 'column' as const }, atlasCard: { width: '48%' as const, minWidth: 150, flexGrow: 1, borderWidth: 1, borderColor: '#34535d', backgroundColor: '#091722', padding: 6 }, atlasCardCompact: { width: '100%' as const }, atlasCardHeading: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, minHeight: 16 }, atlasCardTitle: { color: '#d8e9e8', fontSize: 7, fontWeight: '900' as const, letterSpacing: 0.5 }, atlasCardStatus: { color: '#7ce4c3', fontSize: 6, fontWeight: '900' as const, letterSpacing: 0.8 }, atlasMap: { height: 102, width: '100%' as const, marginTop: 4, overflow: 'hidden' as const, backgroundColor: '#030a11', borderWidth: 1, borderColor: '#1d3542' }, atlasBeacon: { position: 'absolute' as const, borderRadius: 6 }, atlasTrailDot: { position: 'absolute' as const, width: 4, height: 4, borderRadius: 4 }, atlasCardFooter: { color: '#89a5af', fontSize: 6, fontWeight: '800' as const, letterSpacing: 0.35, marginTop: 5 },
  beacon: { position: 'absolute' as const, width: 34, height: 34, alignItems: 'center' as const, justifyContent: 'center' as const }, beaconDiamond: { width: 8, height: 8, borderWidth: 1, borderColor: '#b8c7a2', transform: [{ rotate: '45deg' }], backgroundColor: '#9aa68c' }, currentDiamond: { width: 11, height: 11, borderColor: '#aaffeb', backgroundColor: '#50eac3' }, reachableDiamond: { borderColor: '#efffc5', backgroundColor: '#abf19c' }, exitDiamond: { width: 11, height: 11, borderColor: '#fff0a7', backgroundColor: '#f5c95d' }, beaconCurrent: { borderWidth: 1, borderColor: '#78f3d6', borderRadius: 18 }, beaconScanned: { borderWidth: 1, borderColor: '#88d8ff', borderRadius: 18, borderStyle: 'dashed' as const }, beaconSelected: { borderWidth: 1, borderColor: '#fff6b1', borderRadius: 18, backgroundColor: 'rgba(230,255,205,0.14)' }, shipMark: { position: 'absolute' as const, left: -4, top: 7, color: '#80ffe3', fontSize: 12, fontWeight: '900' as const },
  mapLabel: { position: 'absolute' as const, maxWidth: 125, color: '#d9fff2', fontSize: 7, fontWeight: '900' as const, letterSpacing: 0.6, paddingHorizontal: 4, paddingVertical: 2, fontFamily: 'monospace' as const, backgroundColor: 'rgba(5,15,18,0.94)', borderWidth: 1, borderColor: '#8dc8b3' }, distantLabel: { color: '#9aa9a3', borderColor: '#5c756e', backgroundColor: 'rgba(5,12,17,0.8)' }, currentLabel: { color: '#92ffe4', borderColor: '#62dbc0' }, exitLabel: { color: '#caff9c', borderColor: '#a1dc6c' }, mapLegend: { position: 'absolute' as const, left: 8, right: 8, bottom: 7, minHeight: 24, paddingHorizontal: 8, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, backgroundColor: 'rgba(3,10,16,0.85)', borderWidth: 1, borderColor: '#345159' }, legendDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: '#72f0aa' }, legendMuted: { marginLeft: 8, backgroundColor: '#7d9588' }, legendText: { color: '#afc0bb', fontSize: 6, fontWeight: '900' as const, letterSpacing: 0.5 }, legendTail: { marginLeft: 'auto' as const, color: '#718895', fontSize: 6, fontWeight: '800' as const, letterSpacing: 0.3 },
  preview: { flex: 1, minWidth: 290, maxWidth: 410, minHeight: 0, padding: 12, borderWidth: 1, borderColor: '#3a6570', backgroundColor: '#081722' }, previewCompact: { flex: 0, minWidth: 0, maxWidth: '100%' as const, minHeight: 210, maxHeight: '43%' as const, padding: 9 }, previewTopline: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#213d49' }, signalReadout: { color: '#70e5ba', fontSize: 6, fontWeight: '900' as const, letterSpacing: 0.8 }, previewTitle: { color: '#e5f1f8', fontSize: 20, fontWeight: '900' as const, marginTop: 10 }, previewScroll: { flex: 1, marginTop: 2 }, previewBody: { alignItems: 'stretch' as const, paddingBottom: 10 }, pictureFrame: { width: '100%' as const, height: 146, borderWidth: 1, borderColor: '#62898a', backgroundColor: '#02070b', padding: 3, marginTop: 8 }, previewImage: { width: '100%' as const, height: 112, backgroundColor: '#07121a' }, pictureCaption: { color: '#c7f5e8', fontSize: 7, fontWeight: '900' as const, letterSpacing: 0.8, paddingTop: 5, textAlign: 'center' as const }, copy: { color: '#adc1c4', fontSize: 9, lineHeight: 14, marginTop: 6 }, passage: { color: '#dbe5e0', fontSize: 9, lineHeight: 14, marginTop: 8, padding: 8, borderLeftWidth: 2, borderColor: '#4a9e89', backgroundColor: '#0b1e25' }, tacticalCopy: { color: '#738a99', fontSize: 7, lineHeight: 11 }, previewRule: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 7, marginTop: 12, marginBottom: 5 }, previewRuleText: { color: '#78929b', fontSize: 6, fontWeight: '900' as const, letterSpacing: 1 }, ruleLine: { height: 1, flex: 1, backgroundColor: '#29434c' }, forecastRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: 10, padding: 8, backgroundColor: '#0b1b24', borderWidth: 1, borderColor: '#243f49' }, forecastCell: { flex: 1 }, forecastDivider: { width: 1, height: 30, marginHorizontal: 10, backgroundColor: '#29434c' }, forecastLabel: { color: '#8296a1', fontSize: 6, fontWeight: '900' as const, letterSpacing: 0.9 }, forecastUnknown: { color: '#bdad82', fontSize: 7, fontWeight: '900' as const, marginTop: 6 }, ratingTrack: { flexDirection: 'row' as const, gap: 3, marginTop: 7 }, ratingSegment: { width: 18, height: 5, backgroundColor: '#263640' }, riskSegment: { backgroundColor: '#eb7778' }, salvageSegment: { backgroundColor: '#70e597' },
  effectRow: { gap: 7, marginTop: 9 }, effect: { width: '100%' as const, padding: 8, borderWidth: 1, backgroundColor: 'rgba(5,14,22,0.9)' }, effectTitle: { fontSize: 8, fontWeight: '900' as const, letterSpacing: 0.7 }, effectCopy: { color: '#b6c3c5', fontSize: 8, lineHeight: 12, marginTop: 3 }, compensation: { color: '#c5e5b0', fontSize: 7, fontWeight: '900' as const, letterSpacing: 0.45, marginTop: 5 }, rewardLine: { minHeight: 22, marginTop: 5, paddingHorizontal: 6, paddingVertical: 3, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, borderWidth: 1, borderColor: '#315b4d', backgroundColor: 'rgba(14,35,31,0.82)' }, rewardLabel: { flex: 1, color: '#c5e5d4', fontSize: 7, fontWeight: '900' as const, letterSpacing: 0.45 }, rewardCount: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, minWidth: 34, justifyContent: 'flex-end' as const }, rewardGlyph: { color: '#73ecc6', fontSize: 11, fontWeight: '900' as const }, rewardNumber: { color: '#70f28c', fontWeight: '900' as const, fontSize: 9 },
  emptyPreview: { flex: 1, justifyContent: 'center' as const }, jumpDock: { minHeight: 56, marginTop: 5, paddingTop: 8, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, borderTopWidth: 1, borderColor: '#27424d' }, jumpDockLabel: { color: '#718995', fontSize: 6, fontWeight: '900' as const, letterSpacing: 1 }, jumpDockValue: { color: '#9adacb', fontSize: 8, fontWeight: '900' as const, marginTop: 4 }, jumpButton: { minWidth: 140, alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 3, backgroundColor: '#67dfb8' }, jumpButtonText: { color: '#06131c', fontSize: 9, fontWeight: '900' as const, letterSpacing: 0.7 }, disabledJump: { opacity: 0.38 },
  footer: { minHeight: 28, flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingHorizontal: 4, borderTopWidth: 1, borderColor: '#203742', gap: 8 }, footerText: { color: '#829aa9', fontSize: 7, fontWeight: '800' as const, letterSpacing: 0.6 },
  cards: { flexDirection: 'row' as const, gap: 10, flexWrap: 'wrap' as const, justifyContent: 'center' as const, paddingVertical: 16 }, card: { flex: 1, minWidth: 180, maxWidth: 260, minHeight: 190, padding: 14, borderWidth: 1, borderRadius: 8, backgroundColor: '#091925' }, cardActive: { backgroundColor: '#102733' }, cardIcon: { fontSize: 28 }, cardTitle: { color: '#eef5fa', fontSize: 16, fontWeight: '900' as const, marginTop: 8 }, cardDescription: { color: '#97adbd', fontSize: 10, lineHeight: 15, marginTop: 6 }, cardStats: { color: '#7ddfce', fontSize: 8, fontWeight: '900' as const, letterSpacing: 0.5, marginTop: 11 }, currentType: { color: '#ddbd73', fontSize: 7, fontWeight: '900' as const, marginTop: 8 },
};
