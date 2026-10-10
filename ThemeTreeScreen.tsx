import React from 'react';
import { Animated, Image, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { reachableSkin, SkinArchiveNode, SkinUnlocks, SKIN_ARCHIVE, SKIN_THEME_NAMES } from './themeCatalog';
import type { BridgeVistaScene } from './bridgeVistaCatalog';

const C = { ink: '#050913', star: '#e9f1ff', blue: '#93c9ff', mint: '#72e9d0', gold: '#ffd884', dim: '#7790aa' };
const NODE_SIZE = 30;
const NODE_H = 35;
const THEME_COLORS: Record<string, string> = {
  'Astral Cartography': '#7bb6ff',
  'Verdant Signal': '#9cd98a',
  'Foundry of Light': '#ffc879',
  'Far Trader': '#e3a7ff',
};
const THEME_FORMS: Record<string, number[][]> = {
  'Astral Cartography': [[.12,.52],[.29,.23],[.48,.43],[.72,.15],[.84,.49],[.66,.75],[.42,.65],[.25,.88],[.12,.52],[.48,.43],[.84,.49]],
  'Verdant Signal': [[.5,.9],[.49,.66],[.26,.42],[.13,.22],[.49,.66],[.7,.42],[.89,.19],[.49,.52],[.31,.31],[.66,.28],[.5,.12]],
  'Foundry of Light': [[.5,.08],[.62,.36],[.9,.47],[.65,.58],[.52,.9],[.4,.62],[.12,.5],[.38,.4],[.5,.08],[.5,.5],[.9,.47],[.12,.5]],
  'Far Trader': [[.1,.62],[.31,.61],[.49,.61],[.72,.61],[.9,.61],[.18,.55],[.3,.23],[.48,.48],[.7,.18],[.84,.54],[.31,.61],[.48,.48],[.72,.61]],
};

type PositionedNode = { node: SkinArchiveNode; tier: number; x: number; y: number; routeOnly: boolean };

function StarDot({ x, y, size = 2, delay = 0 }: { x: number; y: number; size?: number; delay?: number }) {
  const [glow] = React.useState(() => new Animated.Value(0.3));
  React.useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(glow, { toValue: 1, duration: 950 + delay, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.28, duration: 1100 + delay, useNativeDriver: true }),
    ]));
    pulse.start(); return () => pulse.stop();
  }, [delay, glow]);
  return <Animated.View pointerEvents="none" style={[s.distantStar, { left: `${x}%`, top: `${y}%`, width: size, height: size, opacity: glow }]} />;
}

function StarNode({ node, tier, selected, unlocked, reachable, equipped, routeOnly, hitboxSize = 44, onPress }: {
  node: SkinArchiveNode; tier: number; selected: boolean; unlocked: boolean; reachable: boolean; equipped: boolean; routeOnly: boolean; hitboxSize?: number; onPress: () => void;
}) {
  const [pulse] = React.useState(() => new Animated.Value(0));
  React.useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1150 + (tier * 170), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1400 + (tier * 120), useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, [pulse, tier]);
  const color = selected ? '#fff3b4' : unlocked ? C.mint : reachable ? C.gold : '#9baabd';
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: selected ? [1.05, 1.35] : unlocked ? [0.94, 1.12] : [0.88, 1.03] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: routeOnly ? [0.28, 0.56] : unlocked ? [0.74, 1] : reachable ? [0.55, 0.92] : [0.3, 0.68] });
  return <Pressable accessibilityRole="button" accessibilityLabel={`${node.name}, ${equipped ? 'equipped' : unlocked ? 'unlocked' : reachable ? 'discoverable' : 'sealed'}`} onPress={onPress} style={[s.starHitbox, { width: hitboxSize, height: hitboxSize }]}>
    <Animated.View style={[s.nodeHalo, { borderColor: color, opacity, transform: [{ scale }] }, selected && s.selectedHalo]} />
    <Text style={[s.nodeGlyph, { color, textShadowColor: color }, unlocked && s.nodeGlyphUnlocked]}>{tier === 0 ? '✦' : '✧'}</Text>
    {selected && <View style={s.selectedNameTag}><Text numberOfLines={1} style={s.selectedNameText}>{node.name.toUpperCase()}</Text><Text style={s.selectedStatusText}>{equipped ? 'EQUIPPED' : unlocked ? 'KNOWN' : reachable ? 'DISCOVERABLE' : 'SEALED'}</Text></View>}
  </Pressable>;
}

function lineStyle(x1: number, y1: number, x2: number, y2: number, color: string, opacity: number) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = `${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI}deg`;
  return { position: 'absolute' as const, left: (x1 + x2) / 2 - length / 2, top: (y1 + y2) / 2, width: length, height: 1.5, backgroundColor: color, opacity, transform: [{ rotate: angle }], shadowColor: color, shadowOpacity: opacity > .6 ? .75 : .15, shadowRadius: opacity > .6 ? 7 : 2 };
}

export function ThemeTreeScreen({ unlocks, selections, onEquip, onClose, renderPreview, vistaScenes = [], unlockedVistaIds = [], equippedVistaId = null, onSelectVista }: {
  unlocks: SkinUnlocks;
  selections: Record<string, string>;
  onEquip: (node: SkinArchiveNode) => void;
  onClose: () => void;
  renderPreview: (node: SkinArchiveNode) => React.ReactNode;
  vistaScenes?: BridgeVistaScene[];
  unlockedVistaIds?: string[];
  equippedVistaId?: string | null;
  onSelectVista?: (scene: BridgeVistaScene) => void;
}) {
  const { width, height } = useWindowDimensions();
  const [theme, setTheme] = React.useState<string | null>(null);
  const [showVistaTree, setShowVistaTree] = React.useState(false);
  const [showVistaAtlas, setShowVistaAtlas] = React.useState(false);
  const [selectedVistaId, setSelectedVistaId] = React.useState(equippedVistaId);
  const [selected, setSelected] = React.useState<SkinArchiveNode | null>(null);
  const cameraRef = React.useRef({ x: 0, y: 0 });
  const panOrigin = React.useRef({ x: 0, y: 0 });
  const [cameraMotion] = React.useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const [zoom] = React.useState(() => new Animated.Value(1));
  const [sceneFade] = React.useState(() => new Animated.Value(1));
  const [pan, setPan] = React.useState<ReturnType<typeof PanResponder.create> | null>(null);
  const wide = width > height * 1.18;
  const compact = height < 520 || width < 540;
  const skyHeaderHeight = compact ? 68 : 94;
  const skyFooterHeight = compact ? 22 : 30;
  const skyCanvasHeight = Math.max(1, height - skyHeaderHeight - skyFooterHeight);
  const treeTopHeight = compact ? 54 : 76;
  const detailHeight = compact ? 94 : 148;
  const treeViewportHeight = Math.max(1, height - treeTopHeight - detailHeight - 12);
  const unlockedVistas = vistaScenes.filter(scene => unlockedVistaIds.includes(scene.id));
  const vistaIdsKey = unlockedVistas.map(scene => scene.id).join('|');
  const foundVistaIndex = unlockedVistas.findIndex(scene => scene.id === selectedVistaId);
  const selectedVistaIndex = foundVistaIndex >= 0 ? foundVistaIndex : 0;
  const selectedVista = unlockedVistas[foundVistaIndex] ?? unlockedVistas[0] ?? null;
  const previousVista = unlockedVistas[selectedVistaIndex - 1] ?? null;
  const nextVista = unlockedVistas[selectedVistaIndex + 1] ?? null;
  const vistaSwipe = React.useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 24 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onPanResponderRelease: (_, gesture) => {
      const targetIndex = gesture.dx < -32 ? selectedVistaIndex + 1 : gesture.dx > 32 ? selectedVistaIndex - 1 : selectedVistaIndex;
      const targetId = vistaIdsKey.split('|')[targetIndex];
      if (targetId) setSelectedVistaId(targetId);
    },
  }), [selectedVistaIndex, vistaIdsKey]);
  const mapWidth = Math.max(width * 1.05, [...new Set((theme ? SKIN_ARCHIVE.filter(node => node.theme === theme) : []).map(node => node.category))].length * (compact ? 150 : 184) + 130);
  const mapHeight = compact ? Math.max(205, treeViewportHeight + 42) : Math.max(390, treeViewportHeight + 54);
  const panLimitX = Math.max(0, (mapWidth - width) / 2);
  const panLimitY = Math.max(0, (mapHeight - treeViewportHeight) / 2);

  React.useEffect(() => {
    const responder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 8,
      onPanResponderGrant: () => { panOrigin.current = cameraRef.current; },
      onPanResponderMove: (_, gesture) => {
        const next = { x: Math.max(-panLimitX, Math.min(panLimitX, panOrigin.current.x + gesture.dx)), y: Math.max(-panLimitY, Math.min(panLimitY, panOrigin.current.y + gesture.dy)) };
        cameraRef.current = next; cameraMotion.setValue(next);
      },
      onPanResponderRelease: () => {
        const settled = { x: Math.max(-panLimitX, Math.min(panLimitX, cameraRef.current.x)), y: Math.max(-panLimitY, Math.min(panLimitY, cameraRef.current.y)) };
        cameraRef.current = settled;
        Animated.spring(cameraMotion, { toValue: settled, useNativeDriver: true, speed: 16, bounciness: 7 }).start();
      },
    });
    setPan(responder);
    return () => setPan(null);
  }, [cameraMotion, panLimitX, panLimitY, theme]);

  const enterTheme = (nextTheme: string) => {
    setTheme(nextTheme);
    const first = SKIN_ARCHIVE.find(node => node.theme === nextTheme) ?? null;
    setSelected(first);
    cameraRef.current = { x: 0, y: 0 }; panOrigin.current = { x: 0, y: 0 }; cameraMotion.setValue({ x: 0, y: 0 });
    zoom.setValue(0.82); sceneFade.setValue(0.25);
    Animated.parallel([
      Animated.spring(zoom, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 7 }),
      Animated.timing(sceneFade, { toValue: 1, duration: 560, useNativeDriver: true }),
    ]).start();
  };
  const returnToSky = () => {
    setTheme(null); setSelected(null); setShowVistaTree(false);
    zoom.setValue(1.12); sceneFade.setValue(0.35);
    Animated.parallel([
      Animated.spring(zoom, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 6 }),
      Animated.timing(sceneFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const activeThemeName = theme ?? SKIN_THEME_NAMES[0];
  const themeNodes = theme ? SKIN_ARCHIVE.filter(node => node.theme === theme) : [];
  const categories = [...new Set(themeNodes.map(node => node.category))];
  const activeMapWidth = Math.max(width * 1.05, categories.length * (compact ? 150 : 184) + 130);
  const activeMapHeight = mapHeight;
  const constellationForm = theme ? THEME_FORMS[theme] ?? THEME_FORMS['Astral Cartography'] : [];
  const formWidth = activeMapWidth * .68;
  const formHeight = activeMapHeight * (compact ? .82 : .77);
  const formLeft = (activeMapWidth - formWidth) / 2;
  const formTop = (activeMapHeight - formHeight) / 2;
  const positioned: PositionedNode[] = [];
  const branchGroups: PositionedNode[][] = [];
  categories.forEach((category, branchIndex) => {
    const targetNodes = themeNodes.filter(node => node.category === category);
    const maxTier = Math.max(1, ...targetNodes.map(node => unlocks.tiers[`${node.category}:${node.id}`] ?? node.tier));
    const nodes = SKIN_ARCHIVE.filter(node => node.category === category && (unlocks.tiers[`${node.category}:${node.id}`] ?? node.tier) <= maxTier);
    const byTier = new Map<number, SkinArchiveNode[]>();
    nodes.forEach(node => {
      const tier = unlocks.tiers[`${node.category}:${node.id}`] ?? node.tier;
      byTier.set(tier, [...(byTier.get(tier) ?? []), node]);
    });
    const branchX = activeMapWidth * (branchIndex + 1) / (categories.length + 1);
    const branch: PositionedNode[] = [];
    for (const [tier, row] of byTier) {
      row.sort((a, b) => a.name.localeCompare(b.name));
      row.forEach((node, sibling) => {
        const siblingOffset = (sibling - (row.length - 1) / 2) * (compact ? 40 : 48);
        const lean = Math.sin((branchIndex + 1) * 1.17 + tier * .84) * Math.min(compact ? 32 : 43, activeMapWidth * .035) * tier;
        const tierProgress = tier / 3;
        const centerX = Math.max(42, Math.min(activeMapWidth - 42, branchX + siblingOffset + lean));
        const y = activeMapHeight * (.91 - tierProgress * .8) + Math.sin(branchIndex * 2 + tier) * (compact ? 7 : 12);
        const placed = { node, tier, x: centerX, y, routeOnly: node.theme !== activeThemeName };
        branch.push(placed); positioned.push(placed);
      });
    }
    branchGroups.push(branch);
  });

  const edges: { from: PositionedNode; to: PositionedNode; active: boolean }[] = [];
  for (const branch of branchGroups) {
    const tiers = [...new Set(branch.map(item => item.tier))].sort((a, b) => a - b);
    for (let i = 1; i < tiers.length; i++) {
      const prior = branch.filter(item => item.tier === tiers[i - 1]);
      const current = branch.filter(item => item.tier === tiers[i]);
      current.forEach(child => {
        const parent = [...prior].sort((a, b) => Math.abs(a.x - child.x) - Math.abs(b.x - child.x))[0];
        if (parent) edges.push({ from: parent, to: child, active: (unlocks.unlocked[child.node.category] ?? []).includes(parent.node.id) });
      });
    }
  }
  const selectedUnlocked = selected ? (unlocks.unlocked[selected.category] ?? []).includes(selected.id) : false;
  const selectedEquipped = selected ? selections[selected.category] === selected.id : false;
  const selectedReachable = selected ? reachableSkin(selected, unlocks.unlocked, unlocks.tiers) : false;
  const selectedTier = selected ? (unlocks.tiers[`${selected.category}:${selected.id}`] ?? selected.tier) : 1;
  const focusNode = (node: SkinArchiveNode, x: number, y: number) => {
    setSelected(node);
    const target = {
      x: Math.max(-panLimitX, Math.min(panLimitX, activeMapWidth / 2 - x)),
      y: Math.max(-panLimitY, Math.min(panLimitY, activeMapHeight / 2 - y)),
    };
    cameraRef.current = target;
    Animated.spring(cameraMotion, { toValue: target, useNativeDriver: true, speed: 10, bounciness: 5 }).start();
  };
  const constellationCenters = wide
    ? SKIN_THEME_NAMES.map((name, i) => ({ name, x: (i + 0.5) * width / SKIN_THEME_NAMES.length, y: skyCanvasHeight * .48, size: Math.min(compact ? 150 : 250, skyCanvasHeight * (compact ? .48 : .56)) }))
    : SKIN_THEME_NAMES.map((name, i) => ({ name, x: i % 2 ? width * .73 : width * .27, y: skyCanvasHeight * (i < 2 ? .29 : .68), size: Math.min(205, width * .51, skyCanvasHeight * .39) }));

  return <View style={s.scrim}>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={s.nebulaA} /><View style={s.nebulaB} /><View style={s.nebulaC} />
      {Array.from({ length: 46 }, (_, i) => <StarDot key={`distant-${i}`} x={(i * 67.73 + 4) % 100} y={(i * 41.19 + 6) % 100} size={i % 11 === 0 ? 3 : i % 3 === 0 ? 2 : 1.4} delay={(i * 83) % 900} />)}
    </View>

    {!theme && !showVistaTree ? <>
      <View style={[s.skyHeader, { height: skyHeaderHeight, minHeight: skyHeaderHeight, paddingHorizontal: compact ? 12 : 26, paddingVertical: compact ? 5 : 18 }]}>
        <View style={compact && s.compactHeading}><Text style={[s.eyebrow, compact && s.compactEyebrow]}>THEMES · COSMETIC CONSTELLATIONS</Text><Text style={[s.skyTitle, compact && s.compactSkyTitle]}>CHART THE SKINFIELD</Text>{!compact && <Text style={s.skySub}>Select a constellation to travel into its unlock paths.</Text>}</View>
        <View style={s.archiveHeaderActions}><Pressable onPress={() => setShowVistaTree(true)} style={[s.backButton, compact && s.compactBackButton]}><Text style={[s.backButtonText, compact && s.compactButtonText]}>WINDOW VISTAS · {unlockedVistaIds.length}/{vistaScenes.length}</Text></Pressable><Pressable onPress={onClose} style={[s.backButton, compact && s.compactBackButton]}><Text style={[s.backButtonText, compact && s.compactButtonText]}>BACK TO BRIDGE</Text></Pressable></View>
      </View>
      <View style={[s.skyCanvas, { top: skyHeaderHeight, bottom: skyFooterHeight }]}>
        {constellationCenters.map(({ name, x, y, size }) => {
          const color = THEME_COLORS[name] ?? C.blue;
          const points = THEME_FORMS[name] ?? THEME_FORMS['Astral Cartography'];
          const themedNodes = SKIN_ARCHIVE.filter(node => node.theme === name);
          const knownNodes = themedNodes.filter(node => (unlocks.unlocked[node.category] ?? []).includes(node.id)).length;
          return <Pressable key={name} onPress={() => enterTheme(name)} style={[s.skyConstellation, { left: x - size / 2, top: y - size / 2, width: size, height: size }]}>
            {points.slice(1).map((point, index) => {
              const a = points[index]; const x1 = a[0] * size; const y1 = a[1] * size; const x2 = point[0] * size; const y2 = point[1] * size;
              return <View key={`skyline-${index}`} style={lineStyle(x1, y1, x2, y2, color, .32)} />;
            })}
            {points.map(([px, py], index) => <View key={`sky-star-${index}`} style={[s.skyStar, { left: px * size - 4, top: py * size - 4, borderColor: color, shadowColor: color, backgroundColor: index === 0 ? color : `${color}66` }]} />)}
            <View style={[s.skyFocus, { borderColor: `${color}66`, shadowColor: color }]}><Text style={[s.skyFocusGlyph, { color }]}>✧</Text></View>
            <Text style={[s.skyThemeName, { color }]}>{name.toUpperCase()}</Text>
            <Text style={s.skyThemeProgress}>{knownNodes} / {themedNodes.length} STARS LIT</Text>
            <Text style={s.skyThemePrompt}>ENTER CONSTELLATION</Text>
          </Pressable>;
        })}
      </View>
      <Text style={[s.skyFooter, compact && s.compactFooter]}>STARS RECORD YOUR DISCOVERIES · DRAG INSIDE A TREE TO LOOK AROUND</Text>
    </> : showVistaTree ? <>
      <View style={[s.treeTopBar, { height: treeTopHeight, minHeight: treeTopHeight, paddingHorizontal: compact ? 8 : 18 }]}>
        <Pressable onPress={returnToSky} style={[s.returnSky, compact && s.compactReturnSky]}><Text style={[s.returnSkyGlyph, compact && s.compactReturnGlyph]}>‹</Text><Text style={[s.returnSkyText, compact && s.compactButtonText]}>ALL THEMES</Text></Pressable>
        <View style={s.treeTitleWrap}><Text style={[s.eyebrow, compact && s.compactEyebrow, { color: C.mint }]}>NON-LINEAR COLLECTION</Text><Text style={[s.treeTitle, compact && s.compactTreeTitle]}>WINDOW VISTAS</Text></View>
        <Pressable onPress={onClose} style={[s.backButton, compact && s.compactBackButton]}><Text style={[s.backButtonText, compact && s.compactButtonText]}>BACK</Text></Pressable>
      </View>
      <Pressable onPress={() => setShowVistaAtlas(value => !value)} style={[s.vistaModeToggle, { top: treeTopHeight + 12 }]}><Text style={s.vistaModeToggleText}>{showVistaAtlas ? '✧  PHOTO BROWSE' : '⌖  STAR ATLAS'}</Text></Pressable>
      {showVistaAtlas ? <>
      <View style={[s.vistaAtlas, { top: treeTopHeight, bottom: compact ? 158 : 182 }]}>
        <Image source={require('./assets/bridge-vistas/unmoored-moon.jpg')} resizeMode="cover" style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.vistaAtlasTint]} />
        <View pointerEvents="none" style={s.vistaAtlasTopline}><Text style={s.vistaAtlasEyebrow}>SECTOR ATLAS · {vistaScenes.length} SIGNALS CHARTED</Text><Text style={s.vistaAtlasSubline}>PICTURE EVENT VISTAS ARE ADDED WHEN THEIR LEVEL IS CLEARED</Text></View>
        <View pointerEvents="none" style={[s.vistaRoute, { left: '17%', top: '53%', width: '32%', transform: [{ rotate: '-27deg' }] }]} />
        <View pointerEvents="none" style={[s.vistaRoute, { left: '47%', top: '38%', width: '29%', transform: [{ rotate: '21deg' }] }]} />
        <View pointerEvents="none" style={[s.vistaRoute, { left: '43%', top: '59%', width: '19%', transform: [{ rotate: '49deg' }] }]} />
        <View pointerEvents="none" style={[s.vistaRegion, { left: '12%', top: '26%', width: 116, height: 116 }]}><Text style={s.vistaRegionTitle}>NEBULA FRONT</Text><Text style={s.vistaRegionSub}>SIGNAL REGION</Text></View>
        <View pointerEvents="none" style={[s.vistaRegion, { left: '40%', top: '17%', width: 96, height: 96 }]}><Text style={s.vistaRegionTitle}>WORLD SYSTEMS</Text></View>
        <View pointerEvents="none" style={[s.vistaRegion, { right: '8%', top: '48%', width: 124, height: 124 }]}><Text style={s.vistaRegionTitle}>RELICS &amp; STATIONS</Text></View>
        <View pointerEvents="none" style={[s.vistaRegion, { left: '39%', bottom: '9%', width: 86, height: 86 }]}><Text style={s.vistaRegionTitle}>ANOMALIES</Text></View>
        {[[18,53],[30,37],[47,31],[58,42],[75,54],[62,66],[39,68],[25,74],[83,35],[51,79],[69,24],[12,44]].map(([x,y], index) => <View key={`vista-beacon-${index}`} pointerEvents="none" style={[s.vistaBeacon, { left: `${x}%`, top: `${y}%` }]} />)}
        <View pointerEvents="none" style={s.vistaAtlasYou}><Text style={s.vistaAtlasYouGlyph}>✦</Text></View>
        <View pointerEvents="none" style={s.vistaAtlasFooter}><Text style={s.vistaAtlasFooterText}>✧  DISCOVERED REGIONS · UNLOCKED VISTAS CAN BE EQUIPPED BELOW</Text></View>
      </View>
      <View style={[s.vistaDock, { bottom: compact ? 28 : 32, width: Math.min(width - (compact ? 14 : 40), 900) }]}>
        <View style={s.vistaDockMeta}><View style={s.vistaDockCopy}><Text style={s.vistaDockKicker}>UNLOCKED WINDOW · {unlockedVistas.length ? `${String(selectedVistaIndex + 1).padStart(2, '0')} / ${String(unlockedVistas.length).padStart(2, '0')}` : '0 AVAILABLE'}</Text><Text numberOfLines={1} style={s.vistaDockName}>{selectedVista?.name ?? 'No discovered vistas yet'}</Text><Text numberOfLines={1} style={s.vistaDockHint}>{selectedVista ? 'PICTURE EVENT COLLECTION · CLEARED LEVEL REWARD' : 'CLEAR A PICTURE EVENT LEVEL TO DISCOVER A WINDOW VISTA'}</Text></View>
          <Pressable disabled={!selectedVista || selectedVista.id === equippedVistaId} onPress={() => selectedVista && onSelectVista?.(selectedVista)} style={[s.vistaEquipButton, (!selectedVista || selectedVista.id === equippedVistaId) && s.vistaEquipDisabled]}><Text style={s.vistaEquipText}>{selectedVista?.id === equippedVistaId ? 'CURRENT WINDOW' : 'SET AS WINDOW'}</Text></Pressable>
        </View>
        <View style={[s.vistaFilm, compact && s.compactVistaFilm]} {...vistaSwipe.panHandlers}>
          {previousVista && !(typeof previousVista.source === 'object' && 'type' in previousVista.source) ? <Image source={previousVista.source} resizeMode="cover" style={[s.vistaFilmPeek, compact && s.compactVistaFilmPeek]} /> : <View style={[s.vistaFilmPeek, s.vistaFilmPeekEmpty, compact && s.compactVistaFilmPeek]} />}
          <Pressable accessibilityRole="button" accessibilityLabel="Previous unlocked vista" disabled={selectedVistaIndex <= 0} onPress={() => previousVista && setSelectedVistaId(previousVista.id)} style={[s.vistaFilmArrow, compact && s.compactVistaFilmArrow, selectedVistaIndex <= 0 && s.vistaFilmArrowDisabled]}><Text style={s.vistaFilmArrowText}>‹</Text></Pressable>
          <View style={[s.vistaFilmCenter, compact && s.compactVistaFilmCenter]}>{selectedVista && !(typeof selectedVista.source === 'object' && 'type' in selectedVista.source) ? <Image source={selectedVista.source} resizeMode="cover" style={s.vistaFilmHero} /> : <View style={s.vistaFilmHeroEmpty}><Text style={s.vistaFilmEmptyGlyph}>✧</Text><Text style={s.vistaFilmEmptyCopy}>CLEAR A PICTURE EVENT LEVEL TO UNLOCK ITS VISTA</Text></View>}{selectedVista && <View pointerEvents="none" style={s.vistaFilmLabel}><Text numberOfLines={1} style={s.vistaFilmLabelText}>{selectedVista.name}</Text></View>}</View>
          <Pressable accessibilityRole="button" accessibilityLabel="Next unlocked vista" disabled={selectedVistaIndex >= unlockedVistas.length - 1} onPress={() => nextVista && setSelectedVistaId(nextVista.id)} style={[s.vistaFilmArrow, compact && s.compactVistaFilmArrow, selectedVistaIndex >= unlockedVistas.length - 1 && s.vistaFilmArrowDisabled]}><Text style={s.vistaFilmArrowText}>›</Text></Pressable>
          {nextVista && !(typeof nextVista.source === 'object' && 'type' in nextVista.source) ? <Image source={nextVista.source} resizeMode="cover" style={[s.vistaFilmPeek, compact && s.compactVistaFilmPeek]} /> : <View style={[s.vistaFilmPeek, s.vistaFilmPeekEmpty, compact && s.compactVistaFilmPeek]} />}
        </View>
      </View>
      </> : <View style={[s.vistaPhotoMode, { top: treeTopHeight, paddingHorizontal: compact ? 10 : 26, paddingBottom: compact ? 12 : 24 }]}>
        <View style={s.vistaPhotoHeading}><Text style={s.vistaPhotoEyebrow}>SCENES FOUND IN THE FIELD</Text><Text style={[s.vistaPhotoTitle, compact && s.compactVistaPhotoTitle]}>YOUR WINDOW LIBRARY</Text><Text style={s.vistaPhotoCopy}>Browse the vistas you have unlocked. Select one to make it your bridge view.</Text></View>
        <View style={s.vistaPhotoCarousel} {...vistaSwipe.panHandlers}>
          <Pressable disabled={!previousVista} onPress={() => previousVista && setSelectedVistaId(previousVista.id)} style={[s.vistaPhotoSideCard, compact && s.compactVistaPhotoSideCard, !previousVista && s.vistaFilmPeekEmpty]}>{previousVista && !(typeof previousVista.source === 'object' && 'type' in previousVista.source) ? <Image source={previousVista.source} resizeMode="cover" style={s.vistaPhotoSideImage} /> : <View style={s.vistaPhotoSidePlaceholder}><Text style={s.vistaPhotoSideGlyph}>✧</Text></View>}{previousVista && <Text numberOfLines={1} style={s.vistaPhotoSideName}>{previousVista.name}</Text>}</Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous unlocked vista" disabled={selectedVistaIndex <= 0} onPress={() => previousVista && setSelectedVistaId(previousVista.id)} style={[s.vistaPhotoArrow, compact && s.compactVistaPhotoArrow, selectedVistaIndex <= 0 && s.vistaFilmArrowDisabled]}><Text style={s.vistaPhotoArrowText}>‹</Text></Pressable>
          <View style={[s.vistaPhotoHeroFrame, { width: compact ? Math.max(120, width - 196) : Math.min(720, width - 510), height: compact ? Math.min(250, height * .34) : Math.min(380, height * .49) }]}>{selectedVista && !(typeof selectedVista.source === 'object' && 'type' in selectedVista.source) ? <Image source={selectedVista.source} resizeMode="cover" style={s.vistaPhotoHeroImage} /> : <View style={s.vistaPhotoEmpty}><Text style={s.vistaFilmEmptyGlyph}>✧</Text><Text style={s.vistaFilmEmptyCopy}>CLEAR A PICTURE EVENT LEVEL TO UNLOCK ITS VISTA</Text></View>}{selectedVista && <View pointerEvents="none" style={s.vistaPhotoHeroShade}><Text style={s.vistaPhotoHeroKicker}>PICTURE EVENT REWARD · WINDOW VISTA</Text><Text numberOfLines={1} style={s.vistaPhotoHeroName}>{selectedVista.name}</Text></View>}</View>
          <Pressable accessibilityRole="button" accessibilityLabel="Next unlocked vista" disabled={selectedVistaIndex >= unlockedVistas.length - 1} onPress={() => nextVista && setSelectedVistaId(nextVista.id)} style={[s.vistaPhotoArrow, compact && s.compactVistaPhotoArrow, selectedVistaIndex >= unlockedVistas.length - 1 && s.vistaFilmArrowDisabled]}><Text style={s.vistaPhotoArrowText}>›</Text></Pressable>
          <Pressable disabled={!nextVista} onPress={() => nextVista && setSelectedVistaId(nextVista.id)} style={[s.vistaPhotoSideCard, compact && s.compactVistaPhotoSideCard, !nextVista && s.vistaFilmPeekEmpty]}>{nextVista && !(typeof nextVista.source === 'object' && 'type' in nextVista.source) ? <Image source={nextVista.source} resizeMode="cover" style={s.vistaPhotoSideImage} /> : <View style={s.vistaPhotoSidePlaceholder}><Text style={s.vistaPhotoSideGlyph}>✧</Text></View>}{nextVista && <Text numberOfLines={1} style={s.vistaPhotoSideName}>{nextVista.name}</Text>}</Pressable>
        </View>
        <View style={[s.vistaPhotoFooter, compact && s.compactVistaPhotoFooter]}><View><Text style={s.vistaPhotoCounter}>{unlockedVistas.length ? `SCENE ${String(selectedVistaIndex + 1).padStart(2, '0')} OF ${String(unlockedVistas.length).padStart(2, '0')} UNLOCKED` : 'NO SCENES UNLOCKED'}</Text><Text style={s.vistaPhotoEquipped}>{selectedVista?.id === equippedVistaId ? 'CURRENT BRIDGE WINDOW' : selectedVista ? 'PREVIEWING · NOT EQUIPPED' : 'CLEAR EVENT LEVELS TO GROW YOUR COLLECTION'}</Text></View><Pressable disabled={!selectedVista || selectedVista.id === equippedVistaId} onPress={() => selectedVista && onSelectVista?.(selectedVista)} style={[s.vistaEquipButton, (!selectedVista || selectedVista.id === equippedVistaId) && s.vistaEquipDisabled]}><Text style={s.vistaEquipText}>{selectedVista?.id === equippedVistaId ? 'CURRENT WINDOW' : 'SET AS WINDOW'}</Text></Pressable></View>
      </View>}
    </> : <>
      <View style={[s.treeTopBar, { height: treeTopHeight, minHeight: treeTopHeight, paddingHorizontal: compact ? 8 : 18 }]}>
        <Pressable onPress={returnToSky} style={[s.returnSky, compact && s.compactReturnSky]}><Text style={[s.returnSkyGlyph, compact && s.compactReturnGlyph]}>‹</Text><Text style={[s.returnSkyText, compact && s.compactButtonText]}>ALL CONSTELLATIONS</Text></Pressable>
        <View style={s.treeTitleWrap}><Text style={[s.eyebrow, compact && s.compactEyebrow, { color: THEME_COLORS[activeThemeName] ?? C.blue }]}>CONSTELLATION PATH</Text><Text style={[s.treeTitle, compact && s.compactTreeTitle]}>{activeThemeName.toUpperCase()}</Text></View>
        <Pressable onPress={onClose} style={[s.backButton, compact && s.compactBackButton]}><Text style={[s.backButtonText, compact && s.compactButtonText]}>BACK</Text></Pressable>
      </View>
      <View style={[s.treeViewport, { top: treeTopHeight, bottom: detailHeight + 12 }]} {...(pan?.panHandlers ?? {})}>
        <Animated.View style={[s.treeCanvas, { width: activeMapWidth, height: activeMapHeight, opacity: sceneFade, transform: [{ translateX: cameraMotion.x }, { translateY: cameraMotion.y }, { scale: zoom }] }]}>
          <View pointerEvents="none" style={[s.themeAura, { backgroundColor: `${THEME_COLORS[activeThemeName] ?? C.blue}0a`, shadowColor: THEME_COLORS[activeThemeName] ?? C.blue, left: activeMapWidth * .22, top: activeMapHeight * .14 }]} />
          {constellationForm.slice(1).map((point, index) => {
            const previous = constellationForm[index];
            const x1 = formLeft + previous[0] * formWidth; const y1 = formTop + previous[1] * formHeight;
            const x2 = formLeft + point[0] * formWidth; const y2 = formTop + point[1] * formHeight;
            return <View key={`form-line-${index}`} pointerEvents="none" style={lineStyle(x1, y1, x2, y2, THEME_COLORS[activeThemeName] ?? C.blue, .11)} />;
          })}
          {constellationForm.map(([px, py], index) => <View key={`form-star-${index}`} pointerEvents="none" style={[s.formStar, { left: formLeft + px * formWidth - 2, top: formTop + py * formHeight - 2, backgroundColor: THEME_COLORS[activeThemeName] ?? C.blue }]} />)}
          {edges.map((edge, i) => <View key={`edge-${i}`} pointerEvents="none" style={lineStyle(edge.from.x, edge.from.y, edge.to.x, edge.to.y, THEME_COLORS[activeThemeName] ?? C.blue, edge.active ? .88 : .25)} />)}
          {positioned.map(({ node, tier, x, y, routeOnly }) => {
            const unlocked = (unlocks.unlocked[node.category] ?? []).includes(node.id);
            const reachable = reachableSkin(node, unlocks.unlocked, unlocks.tiers);
            const hitboxSize = compact ? 48 : 44;
            return <View key={`${node.category}:${node.id}`} style={[s.mapStar, { left: x - hitboxSize / 2, top: y - hitboxSize / 2, width: hitboxSize, height: hitboxSize }]}>
              <StarNode node={node} tier={tier} selected={selected?.category === node.category && selected.id === node.id} unlocked={unlocked} reachable={reachable} equipped={selections[node.category] === node.id} routeOnly={routeOnly} hitboxSize={hitboxSize} onPress={() => focusNode(node, x, y)} />
            </View>;
          })}
        </Animated.View>
        <View pointerEvents="none" style={s.panHint}><Text style={s.panHintText}>DRAG TO SCAN THE SKY</Text></View>
      </View>
      <View style={[s.detailBar, compact && s.compactDetailBar, !selected && s.detailEmpty]}>
        {selected ? <>
          <View style={[s.previewBox, compact && s.compactPreviewBox]}><View style={[s.previewStage, compact && s.compactPreviewStage]}>{renderPreview(selected)}</View></View>
          <View style={s.detailTextBlock}>
            <Text style={[s.detailKicker, { color: THEME_COLORS[activeThemeName] ?? C.blue }]}>{selected.categoryName.toUpperCase()} · {selectedTier === 0 ? 'STARTER STAR' : `TIER ${selectedTier}`}{selected.theme !== activeThemeName ? ' · ROUTE STAR' : ''}</Text>
            <Text style={s.detailTitle}>{selected.name.toUpperCase()}</Text>
            <Text numberOfLines={2} style={s.detailDescription}>{selected.description}</Text>
            <Text style={[s.unlockState, selectedUnlocked ? s.unlockedText : selectedReachable ? s.reachableText : s.sealedText]}>{selectedEquipped ? 'EQUIPPED · ACTIVE ACROSS YOUR GAME' : selectedUnlocked ? 'DISCOVERED · READY TO EQUIP' : selectedReachable ? 'THIS STAR MAY APPEAR IN A LIVE SECTOR' : 'SEALED · LIGHT THE PREVIOUS STAR FIRST'}</Text>
          </View>
          <View style={[s.detailAction, compact && s.compactDetailAction]}>{selectedUnlocked && !selectedEquipped ? <Pressable onPress={() => onEquip(selected)} style={[s.equipButton, compact && s.compactEquipButton]}><Text style={[s.equipText, compact && s.compactButtonText]}>EQUIP</Text></Pressable> : <View style={s.tierMarker}><Text style={[s.tierMarkerGlyph, compact && s.compactTierGlyph]}>{selectedUnlocked ? '✦' : '✧'}</Text><Text style={s.tierMarkerLabel}>{selectedUnlocked ? 'LIT' : 'DORMANT'}</Text></View>}</View>
        </> : <Text style={s.detailDescription}>Select a star to inspect its skin and discovery status.</Text>}
      </View>
    </>}
  </View>;
}

const s = StyleSheet.create({
  scrim: { position: 'absolute', zIndex: 100, left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', backgroundColor: C.ink },
  nebulaA: { position: 'absolute', width: 480, height: 350, top: '16%', left: '12%', borderRadius: 999, backgroundColor: '#18406a22', shadowColor: '#2964a3', shadowOpacity: .62, shadowRadius: 95 },
  nebulaB: { position: 'absolute', width: 380, height: 400, top: '30%', right: '7%', borderRadius: 999, backgroundColor: '#40235418', shadowColor: '#673780', shadowOpacity: .5, shadowRadius: 95 },
  nebulaC: { position: 'absolute', width: 280, height: 230, bottom: '8%', left: '43%', borderRadius: 999, backgroundColor: '#1d584c15', shadowColor: '#2b9d81', shadowOpacity: .4, shadowRadius: 80 },
  distantStar: { position: 'absolute', borderRadius: 999, backgroundColor: '#d9e9ff', shadowColor: '#b8d5ff', shadowOpacity: .9, shadowRadius: 4 },
  skyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, minHeight: 94, paddingHorizontal: 26, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#6b87a222', backgroundColor: '#05091366' }, compactHeading: { flex: 1, minWidth: 0 }, archiveHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 6 }, compactEyebrow: { fontSize: 6, letterSpacing: 1.2 }, compactSkyTitle: { fontSize: 15, letterSpacing: 2, marginTop: 1 }, compactBackButton: { paddingHorizontal: 9, paddingVertical: 7 }, compactButtonText: { fontSize: 6, letterSpacing: .7 },
  vistaModeToggle: { position: 'absolute', right: 16, zIndex: 5, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: '#58aa9b', borderRadius: 18, backgroundColor: '#071a23ed' }, vistaModeToggleText: { color: C.mint, fontSize: 7, fontWeight: '900', letterSpacing: .8 }, vistaPhotoMode: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }, vistaPhotoHeading: { alignItems: 'center', marginBottom: 16 }, vistaPhotoEyebrow: { color: C.mint, fontSize: 8, fontWeight: '900', letterSpacing: 1.6 }, vistaPhotoTitle: { color: '#eef6fa', fontSize: 19, fontWeight: '300', letterSpacing: 2.2, marginTop: 3 }, compactVistaPhotoTitle: { fontSize: 13, letterSpacing: 1.3 }, vistaPhotoCopy: { color: '#a4b8c3', fontSize: 8, marginTop: 5, textAlign: 'center' }, vistaPhotoCarousel: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, vistaPhotoSideCard: { width: 150, height: 144, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#52758088', borderRadius: 8, backgroundColor: '#0b1723', opacity: .64 }, compactVistaPhotoSideCard: { width: 42, height: 80, borderRadius: 5 }, vistaPhotoSideImage: { width: '100%', height: '100%' }, vistaPhotoSidePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c1a27' }, vistaPhotoSideGlyph: { color: '#7e9aaa', fontSize: 22 }, vistaPhotoSideName: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 5, paddingVertical: 4, color: '#eaf3f3', backgroundColor: '#030911bb', fontSize: 6, fontWeight: '800' }, vistaPhotoArrow: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#40616b', borderRadius: 99, backgroundColor: '#091722' }, compactVistaPhotoArrow: { width: 22, height: 30 }, vistaPhotoArrowText: { color: '#e4f5f0', fontSize: 23, lineHeight: 27 }, vistaPhotoHeroFrame: { overflow: 'hidden', borderWidth: 1, borderColor: '#74d9c4', borderRadius: 10, backgroundColor: '#081522', shadowColor: '#55ddc4', shadowOpacity: .22, shadowRadius: 20, elevation: 6 }, vistaPhotoHeroImage: { width: '100%', height: '100%' }, vistaPhotoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: '#0a1722' }, vistaPhotoHeroShade: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#030911c9' }, vistaPhotoHeroKicker: { color: C.mint, fontSize: 7, fontWeight: '900', letterSpacing: 1 }, vistaPhotoHeroName: { color: '#f4fafb', fontSize: 15, fontWeight: '900', marginTop: 3 }, vistaPhotoFooter: { width: '100%', maxWidth: 900, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 15 }, compactVistaPhotoFooter: { paddingHorizontal: 5, marginTop: 10 }, vistaPhotoCounter: { color: C.mint, fontSize: 7, fontWeight: '900', letterSpacing: .8 }, vistaPhotoEquipped: { color: '#a2b8c2', fontSize: 7, marginTop: 4 }, vistaAtlas: { position: 'absolute', left: 14, right: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#74b5bc88', backgroundColor: '#07111d' }, vistaAtlasTint: { backgroundColor: 'rgba(3, 9, 18, 0.42)' }, vistaAtlasTopline: { position: 'absolute', left: 16, top: 14, padding: 8, borderRadius: 5, backgroundColor: '#06111bdc' }, vistaAtlasEyebrow: { color: C.mint, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 }, vistaAtlasSubline: { color: '#bdd0dc', fontSize: 6, fontWeight: '700', letterSpacing: .6, marginTop: 4 }, vistaRoute: { position: 'absolute', height: 2, backgroundColor: '#79e0c1', opacity: .78, shadowColor: '#6de5cd', shadowOpacity: .9, shadowRadius: 5 }, vistaRegion: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#6baba766', borderRadius: 999, backgroundColor: '#0a1a2499', shadowColor: '#68e2d0', shadowOpacity: .3, shadowRadius: 24 }, vistaRegionTitle: { color: '#d4f4ec', fontSize: 7, fontWeight: '900', letterSpacing: .65, textAlign: 'center', paddingHorizontal: 6, textShadowColor: '#041018', textShadowRadius: 5 }, vistaRegionSub: { color: '#8eafaF', fontSize: 5, fontWeight: '800', letterSpacing: .6, marginTop: 3 }, vistaBeacon: { position: 'absolute', width: 8, height: 8, marginLeft: -4, marginTop: -4, transform: [{ rotate: '45deg' }], backgroundColor: '#c8f2db', borderWidth: 1, borderColor: '#fff', shadowColor: '#69dfc3', shadowOpacity: 1, shadowRadius: 8 }, vistaAtlasYou: { position: 'absolute', left: '47%', top: '46%', width: 34, height: 34, borderRadius: 999, borderWidth: 1, borderColor: C.mint, alignItems: 'center', justifyContent: 'center', backgroundColor: '#071723dd', shadowColor: C.mint, shadowOpacity: .9, shadowRadius: 18 }, vistaAtlasYouGlyph: { color: C.mint, fontSize: 19 }, vistaAtlasFooter: { position: 'absolute', left: 12, right: 12, bottom: 10, alignItems: 'center' }, vistaAtlasFooterText: { color: '#d5e6e6', fontSize: 6, fontWeight: '900', letterSpacing: .85, textShadowColor: '#02070d', textShadowRadius: 5 }, vistaDock: { position: 'absolute', alignSelf: 'center', padding: 10, borderWidth: 1, borderColor: '#497984', borderRadius: 11, backgroundColor: 'rgba(5, 16, 27, 0.96)', shadowColor: '#000', shadowOpacity: .65, shadowRadius: 22, elevation: 12 }, vistaDockMeta: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 7 }, vistaDockCopy: { flex: 1, minWidth: 0 }, vistaDockKicker: { color: C.mint, fontSize: 7, fontWeight: '900', letterSpacing: .9 }, vistaDockName: { color: '#f1f7f8', fontSize: 12, fontWeight: '900', marginTop: 2 }, vistaDockHint: { color: '#91aaba', fontSize: 6, letterSpacing: .35, marginTop: 2 }, vistaEquipButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6, backgroundColor: C.mint }, vistaEquipDisabled: { opacity: .35 }, vistaEquipText: { color: '#06211e', fontSize: 7, fontWeight: '900', letterSpacing: .7 }, vistaFilm: { height: 77, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' }, compactVistaFilm: { height: 68, gap: 4 }, vistaFilmPeek: { width: 76, height: 55, borderRadius: 5, borderWidth: 1, borderColor: '#65828c', opacity: .53 }, compactVistaFilmPeek: { width: 40, height: 42 }, vistaFilmPeekEmpty: { opacity: .12 }, vistaFilmArrow: { width: 28, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#365963', borderRadius: 20, backgroundColor: '#0c202b' }, compactVistaFilmArrow: { width: 24, height: 30 }, vistaFilmArrowDisabled: { opacity: .35 }, vistaFilmArrowText: { color: '#d7f3ed', fontSize: 21, lineHeight: 24 }, vistaFilmCenter: { width: 190, height: 75, overflow: 'hidden', borderWidth: 1, borderColor: C.mint, borderRadius: 6, backgroundColor: '#0c1922' }, compactVistaFilmCenter: { width: 148, height: 64 }, vistaFilmHero: { width: '100%', height: '100%' }, vistaFilmHeroEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101b29' }, vistaFilmEmptyGlyph: { color: '#7893a3', fontSize: 26 }, vistaFilmEmptyCopy: { color: '#89a6b4', fontSize: 5, fontWeight: '800', textAlign: 'center', paddingHorizontal: 12 }, vistaFilmLabel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 7, paddingVertical: 5, backgroundColor: '#030911bb' }, vistaFilmLabelText: { color: '#f3fbfc', fontSize: 7, fontWeight: '900', letterSpacing: .5 },
  eyebrow: { color: '#a2c7ec', fontSize: 8, fontWeight: '900', letterSpacing: 2 }, skyTitle: { color: '#edf4ff', fontSize: 24, fontWeight: '300', letterSpacing: 3, marginTop: 4 }, skySub: { color: '#8b9eb4', fontSize: 10, marginTop: 4 }, backButton: { borderWidth: 1, borderColor: '#7892ab66', borderRadius: 5, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#08111dbb' }, backButtonText: { color: '#c9d9ea', fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  skyCanvas: { position: 'absolute', top: 94, bottom: 30, left: 0, right: 0 }, skyConstellation: { position: 'absolute', alignItems: 'center', justifyContent: 'center' }, skyStar: { position: 'absolute', width: 7, height: 7, borderRadius: 999, borderWidth: 1, shadowOpacity: .9, shadowRadius: 8 }, skyFocus: { position: 'absolute', width: 44, height: 44, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a142378', shadowOpacity: .7, shadowRadius: 22 }, skyFocusGlyph: { fontSize: 28, textShadowColor: '#fff', textShadowRadius: 12 }, skyThemeName: { position: 'absolute', bottom: -13, fontSize: 8, fontWeight: '900', letterSpacing: 1.35, textShadowColor: '#000', textShadowRadius: 6 }, skyThemeProgress: { position: 'absolute', bottom: -22, color: '#8396aa', fontSize: 5, fontWeight: '900', letterSpacing: .8 }, skyThemePrompt: { position: 'absolute', bottom: -32, color: '#657a91', fontSize: 5, fontWeight: '800', letterSpacing: .8 }, skyFooter: { position: 'absolute', bottom: 9, alignSelf: 'center', color: '#577089', fontSize: 7, fontWeight: '800', letterSpacing: 1.1 }, compactFooter: { fontSize: 5, bottom: 5, letterSpacing: .5 },
  treeTopBar: { position: 'absolute', zIndex: 4, top: 0, left: 0, right: 0, minHeight: 76, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#6b87a222', backgroundColor: '#05091370' }, returnSky: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 150 }, compactReturnSky: { minWidth: 0, gap: 3 }, returnSkyGlyph: { color: C.blue, fontSize: 28, fontWeight: '300' }, compactReturnGlyph: { fontSize: 21 }, returnSkyText: { color: '#a6bed4', fontSize: 7, fontWeight: '900', letterSpacing: .8 }, treeTitleWrap: { alignItems: 'center', minWidth: 0 }, treeTitle: { color: '#f0f5fc', fontSize: 18, fontWeight: '300', letterSpacing: 2, marginTop: 2 }, compactTreeTitle: { fontSize: 11, letterSpacing: 1, marginTop: 0 },
  treeViewport: { position: 'absolute', top: 76, left: 0, right: 0, bottom: 148, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, treeCanvas: { position: 'relative', overflow: 'visible' }, themeAura: { position: 'absolute', width: 380, height: 280, borderRadius: 999, shadowOpacity: .38, shadowRadius: 90 }, formStar: { position: 'absolute', width: 4, height: 4, borderRadius: 99, opacity: .2, shadowOpacity: .7, shadowRadius: 9 }, mapStar: { position: 'absolute', width: NODE_SIZE, height: NODE_H, zIndex: 2 }, starHitbox: { width: NODE_SIZE, height: NODE_H, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }, nodeHalo: { position: 'absolute', width: 26, height: 26, borderRadius: 999, borderWidth: 1, backgroundColor: '#13223a88', shadowOpacity: .85, shadowRadius: 9 }, selectedHalo: { width: 34, height: 34, borderWidth: 2, backgroundColor: '#fff2b833', shadowOpacity: 1, shadowRadius: 15 }, nodeGlyph: { fontSize: 23, lineHeight: 27, textShadowRadius: 9, textShadowOffset: { width: 0, height: 0 } }, nodeGlyphUnlocked: { textShadowRadius: 14 }, selectedNameTag: { position: 'absolute', top: 31, left: -43, width: 120, alignItems: 'center' }, selectedNameText: { color: '#e7f2ff', fontSize: 6, fontWeight: '900', letterSpacing: .45, textShadowColor: '#030913', textShadowRadius: 4 }, selectedStatusText: { color: '#8eabc5', fontSize: 5, fontWeight: '800', letterSpacing: .5, marginTop: 2 }, panHint: { position: 'absolute', bottom: 8, right: 16, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: '#06101bbd' }, panHintText: { color: '#607991', fontSize: 6, fontWeight: '900', letterSpacing: .8 },
  detailBar: { position: 'absolute', zIndex: 5, bottom: 10, left: 14, right: 14, minHeight: 130, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#7892ab44', backgroundColor: '#06101be8' }, compactDetailBar: { minHeight: 0, height: 94, left: 6, right: 6, bottom: 4, padding: 5, gap: 6 }, detailEmpty: { justifyContent: 'center' }, previewBox: { width: 172, height: 104, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRightWidth: 1, borderColor: '#7892ab33' }, compactPreviewBox: { width: 74, height: 80, flexShrink: 0 }, previewStage: { width: 220, height: 130, position: 'relative', alignItems: 'center', justifyContent: 'center' }, compactPreviewStage: { transform: [{ scale: .34 }] }, detailTextBlock: { flex: 1, minWidth: 0 }, detailKicker: { fontSize: 7, fontWeight: '900', letterSpacing: 1.1 }, detailTitle: { color: '#f0f5fc', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginTop: 5 }, detailDescription: { color: '#9cacc0', fontSize: 9, lineHeight: 14, marginTop: 5 }, unlockState: { fontSize: 7, fontWeight: '900', letterSpacing: .6, marginTop: 7 }, unlockedText: { color: C.mint }, reachableText: { color: C.gold }, sealedText: { color: '#75879b' }, detailAction: { width: 104, alignItems: 'center', justifyContent: 'center' }, compactDetailAction: { width: 56, flexShrink: 0 }, equipButton: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.mint, backgroundColor: '#153832', borderRadius: 3 }, compactEquipButton: { paddingHorizontal: 7, paddingVertical: 8 }, equipText: { color: '#b8ffe8', fontSize: 7, fontWeight: '900', letterSpacing: .8 }, tierMarker: { alignItems: 'center' }, tierMarkerGlyph: { color: C.gold, fontSize: 24, textShadowColor: C.gold, textShadowRadius: 10 }, compactTierGlyph: { fontSize: 17 }, tierMarkerLabel: { color: '#8296aa', fontSize: 6, fontWeight: '900', letterSpacing: .8, marginTop: 3 },
});
