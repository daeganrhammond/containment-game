import React from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { reachableSkin, SkinArchiveNode, SkinUnlocks, SKIN_ARCHIVE, SKIN_THEME_NAMES } from './themeCatalog';

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

export function ThemeTreeScreen({ unlocks, selections, onEquip, onClose, renderPreview }: {
  unlocks: SkinUnlocks;
  selections: Record<string, string>;
  onEquip: (node: SkinArchiveNode) => void;
  onClose: () => void;
  renderPreview: (node: SkinArchiveNode) => React.ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const [theme, setTheme] = React.useState<string | null>(null);
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
    setTheme(null); setSelected(null);
    zoom.setValue(1.12); sceneFade.setValue(0.35);
    Animated.parallel([
      Animated.spring(zoom, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 6 }),
      Animated.timing(sceneFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  };

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
        const placed = { node, tier, x: centerX, y, routeOnly: node.theme !== theme };
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

    {!theme ? <>
      <View style={[s.skyHeader, { height: skyHeaderHeight, minHeight: skyHeaderHeight, paddingHorizontal: compact ? 12 : 26, paddingVertical: compact ? 5 : 18 }]}>
        <View style={compact && s.compactHeading}><Text style={[s.eyebrow, compact && s.compactEyebrow]}>THEMES · COSMETIC CONSTELLATIONS</Text><Text style={[s.skyTitle, compact && s.compactSkyTitle]}>CHART THE SKINFIELD</Text>{!compact && <Text style={s.skySub}>Select a constellation to travel into its unlock paths.</Text>}</View>
        <Pressable onPress={onClose} style={[s.backButton, compact && s.compactBackButton]}><Text style={[s.backButtonText, compact && s.compactButtonText]}>BACK TO BRIDGE</Text></Pressable>
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
    </> : <>
      <View style={[s.treeTopBar, { height: treeTopHeight, minHeight: treeTopHeight, paddingHorizontal: compact ? 8 : 18 }]}>
        <Pressable onPress={returnToSky} style={[s.returnSky, compact && s.compactReturnSky]}><Text style={[s.returnSkyGlyph, compact && s.compactReturnGlyph]}>‹</Text><Text style={[s.returnSkyText, compact && s.compactButtonText]}>ALL CONSTELLATIONS</Text></Pressable>
        <View style={s.treeTitleWrap}><Text style={[s.eyebrow, compact && s.compactEyebrow, { color: THEME_COLORS[theme] ?? C.blue }]}>CONSTELLATION PATH</Text><Text style={[s.treeTitle, compact && s.compactTreeTitle]}>{theme.toUpperCase()}</Text></View>
        <Pressable onPress={onClose} style={[s.backButton, compact && s.compactBackButton]}><Text style={[s.backButtonText, compact && s.compactButtonText]}>BACK</Text></Pressable>
      </View>
      <View style={[s.treeViewport, { top: treeTopHeight, bottom: detailHeight + 12 }]} {...(pan?.panHandlers ?? {})}>
        <Animated.View style={[s.treeCanvas, { width: activeMapWidth, height: activeMapHeight, opacity: sceneFade, transform: [{ translateX: cameraMotion.x }, { translateY: cameraMotion.y }, { scale: zoom }] }]}>
          <View pointerEvents="none" style={[s.themeAura, { backgroundColor: `${THEME_COLORS[theme] ?? C.blue}0a`, shadowColor: THEME_COLORS[theme] ?? C.blue, left: activeMapWidth * .22, top: activeMapHeight * .14 }]} />
          {constellationForm.slice(1).map((point, index) => {
            const previous = constellationForm[index];
            const x1 = formLeft + previous[0] * formWidth; const y1 = formTop + previous[1] * formHeight;
            const x2 = formLeft + point[0] * formWidth; const y2 = formTop + point[1] * formHeight;
            return <View key={`form-line-${index}`} pointerEvents="none" style={lineStyle(x1, y1, x2, y2, THEME_COLORS[theme] ?? C.blue, .11)} />;
          })}
          {constellationForm.map(([px, py], index) => <View key={`form-star-${index}`} pointerEvents="none" style={[s.formStar, { left: formLeft + px * formWidth - 2, top: formTop + py * formHeight - 2, backgroundColor: THEME_COLORS[theme] ?? C.blue }]} />)}
          {edges.map((edge, i) => <View key={`edge-${i}`} pointerEvents="none" style={lineStyle(edge.from.x, edge.from.y, edge.to.x, edge.to.y, THEME_COLORS[theme] ?? C.blue, edge.active ? .88 : .25)} />)}
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
            <Text style={[s.detailKicker, { color: THEME_COLORS[theme] ?? C.blue }]}>{selected.categoryName.toUpperCase()} · {selectedTier === 0 ? 'STARTER STAR' : `TIER ${selectedTier}`}{selected.theme !== theme ? ' · ROUTE STAR' : ''}</Text>
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
  skyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, minHeight: 94, paddingHorizontal: 26, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#6b87a222', backgroundColor: '#05091366' }, compactHeading: { flex: 1, minWidth: 0 }, compactEyebrow: { fontSize: 6, letterSpacing: 1.2 }, compactSkyTitle: { fontSize: 15, letterSpacing: 2, marginTop: 1 }, compactBackButton: { paddingHorizontal: 9, paddingVertical: 7 }, compactButtonText: { fontSize: 6, letterSpacing: .7 },
  eyebrow: { color: '#a2c7ec', fontSize: 8, fontWeight: '900', letterSpacing: 2 }, skyTitle: { color: '#edf4ff', fontSize: 24, fontWeight: '300', letterSpacing: 3, marginTop: 4 }, skySub: { color: '#8b9eb4', fontSize: 10, marginTop: 4 }, backButton: { borderWidth: 1, borderColor: '#7892ab66', borderRadius: 5, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#08111dbb' }, backButtonText: { color: '#c9d9ea', fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  skyCanvas: { position: 'absolute', top: 94, bottom: 30, left: 0, right: 0 }, skyConstellation: { position: 'absolute', alignItems: 'center', justifyContent: 'center' }, skyStar: { position: 'absolute', width: 7, height: 7, borderRadius: 999, borderWidth: 1, shadowOpacity: .9, shadowRadius: 8 }, skyFocus: { position: 'absolute', width: 44, height: 44, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a142378', shadowOpacity: .7, shadowRadius: 22 }, skyFocusGlyph: { fontSize: 28, textShadowColor: '#fff', textShadowRadius: 12 }, skyThemeName: { position: 'absolute', bottom: -13, fontSize: 8, fontWeight: '900', letterSpacing: 1.35, textShadowColor: '#000', textShadowRadius: 6 }, skyThemeProgress: { position: 'absolute', bottom: -22, color: '#8396aa', fontSize: 5, fontWeight: '900', letterSpacing: .8 }, skyThemePrompt: { position: 'absolute', bottom: -32, color: '#657a91', fontSize: 5, fontWeight: '800', letterSpacing: .8 }, skyFooter: { position: 'absolute', bottom: 9, alignSelf: 'center', color: '#577089', fontSize: 7, fontWeight: '800', letterSpacing: 1.1 }, compactFooter: { fontSize: 5, bottom: 5, letterSpacing: .5 },
  treeTopBar: { position: 'absolute', zIndex: 4, top: 0, left: 0, right: 0, minHeight: 76, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#6b87a222', backgroundColor: '#05091370' }, returnSky: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 150 }, compactReturnSky: { minWidth: 0, gap: 3 }, returnSkyGlyph: { color: C.blue, fontSize: 28, fontWeight: '300' }, compactReturnGlyph: { fontSize: 21 }, returnSkyText: { color: '#a6bed4', fontSize: 7, fontWeight: '900', letterSpacing: .8 }, treeTitleWrap: { alignItems: 'center', minWidth: 0 }, treeTitle: { color: '#f0f5fc', fontSize: 18, fontWeight: '300', letterSpacing: 2, marginTop: 2 }, compactTreeTitle: { fontSize: 11, letterSpacing: 1, marginTop: 0 },
  treeViewport: { position: 'absolute', top: 76, left: 0, right: 0, bottom: 148, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, treeCanvas: { position: 'relative', overflow: 'visible' }, themeAura: { position: 'absolute', width: 380, height: 280, borderRadius: 999, shadowOpacity: .38, shadowRadius: 90 }, formStar: { position: 'absolute', width: 4, height: 4, borderRadius: 99, opacity: .2, shadowOpacity: .7, shadowRadius: 9 }, mapStar: { position: 'absolute', width: NODE_SIZE, height: NODE_H, zIndex: 2 }, starHitbox: { width: NODE_SIZE, height: NODE_H, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }, nodeHalo: { position: 'absolute', width: 26, height: 26, borderRadius: 999, borderWidth: 1, backgroundColor: '#13223a88', shadowOpacity: .85, shadowRadius: 9 }, selectedHalo: { width: 34, height: 34, borderWidth: 2, backgroundColor: '#fff2b833', shadowOpacity: 1, shadowRadius: 15 }, nodeGlyph: { fontSize: 23, lineHeight: 27, textShadowRadius: 9, textShadowOffset: { width: 0, height: 0 } }, nodeGlyphUnlocked: { textShadowRadius: 14 }, selectedNameTag: { position: 'absolute', top: 31, left: -43, width: 120, alignItems: 'center' }, selectedNameText: { color: '#e7f2ff', fontSize: 6, fontWeight: '900', letterSpacing: .45, textShadowColor: '#030913', textShadowRadius: 4 }, selectedStatusText: { color: '#8eabc5', fontSize: 5, fontWeight: '800', letterSpacing: .5, marginTop: 2 }, panHint: { position: 'absolute', bottom: 8, right: 16, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: '#06101bbd' }, panHintText: { color: '#607991', fontSize: 6, fontWeight: '900', letterSpacing: .8 },
  detailBar: { position: 'absolute', zIndex: 5, bottom: 10, left: 14, right: 14, minHeight: 130, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#7892ab44', backgroundColor: '#06101be8' }, compactDetailBar: { minHeight: 0, height: 94, left: 6, right: 6, bottom: 4, padding: 5, gap: 6 }, detailEmpty: { justifyContent: 'center' }, previewBox: { width: 172, height: 104, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRightWidth: 1, borderColor: '#7892ab33' }, compactPreviewBox: { width: 74, height: 80, flexShrink: 0 }, previewStage: { width: 220, height: 130, position: 'relative', alignItems: 'center', justifyContent: 'center' }, compactPreviewStage: { transform: [{ scale: .34 }] }, detailTextBlock: { flex: 1, minWidth: 0 }, detailKicker: { fontSize: 7, fontWeight: '900', letterSpacing: 1.1 }, detailTitle: { color: '#f0f5fc', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginTop: 5 }, detailDescription: { color: '#9cacc0', fontSize: 9, lineHeight: 14, marginTop: 5 }, unlockState: { fontSize: 7, fontWeight: '900', letterSpacing: .6, marginTop: 7 }, unlockedText: { color: C.mint }, reachableText: { color: C.gold }, sealedText: { color: '#75879b' }, detailAction: { width: 104, alignItems: 'center', justifyContent: 'center' }, compactDetailAction: { width: 56, flexShrink: 0 }, equipButton: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.mint, backgroundColor: '#153832', borderRadius: 3 }, compactEquipButton: { paddingHorizontal: 7, paddingVertical: 8 }, equipText: { color: '#b8ffe8', fontSize: 7, fontWeight: '900', letterSpacing: .8 }, tierMarker: { alignItems: 'center' }, tierMarkerGlyph: { color: C.gold, fontSize: 24, textShadowColor: C.gold, textShadowRadius: 10 }, compactTierGlyph: { fontSize: 17 }, tierMarkerLabel: { color: '#8296aa', fontSize: 6, fontWeight: '900', letterSpacing: .8, marginTop: 3 },
});
