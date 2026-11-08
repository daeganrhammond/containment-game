import React, { ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { BridgeCargoAlcove } from './BridgeCargoAlcove';
import type { CargoBalances, CargoShapes } from './cargo';
import { BridgeCreditReadout, BridgeFoundryStation, BridgePanelButtons } from './BridgeFoundryStation';
import type { FoundryPayout, OverflowJob, PowerKind } from './mechanics';
import type { SectorState } from './sectorMap';

type Props = {
  width: number;
  height: number;
  themeValue: string;
  scoreValue: string;
  navConsoleOpen: boolean;
  cargoOpen: boolean;
  cargoDoorHeldOpen: boolean;
  cargoBalances: CargoBalances;
  cargoShapes?: CargoShapes;
  foundryJobs: OverflowJob[];
  foundryPayouts: FoundryPayout[];
  currentCredits: number;
  foundryProcessingMs: number;
  foundrySelectedMaterial: 'life' | 'speed' | 'ram' | 'charge';
  foundryCanSmelt: boolean;
  renderFoundryPickup: (kind: PowerKind, size: number) => ReactNode;
  renderCreditIcon: (size: number) => ReactNode;
  stageFeed?: ReactNode;
  sector?: SectorState;
  onCargo: () => void;
  onFoundry: () => void;
  onFoundrySmelt: () => void;
  onFoundryCollect: (payoutIds: readonly number[]) => void;
  onCargoBayStateChange?: (open: boolean) => void;
  onCargoDoorHoldChange: (heldOpen: boolean) => void;
  onThemes: () => void;
  onScores: () => void;
  onJump: () => void;
  onResume: () => void;
  onStartRun: () => void;
  onNavConsole: () => void;
  onDeveloper: () => void;
  jumpReady: boolean;
  canResume: boolean;
  canStartRun: boolean;
};

// Normalized to the single canonical 1672×941 bridge art. Each screen and hit
// target stays inside its own measured glass inset and follows its physical tilt.
const PANEL = {
  original: {
    credits: { x: 0.025, y: 0.744, w: 0.068, h: 0.05 },
    themes: { x: 0.128, y: 0.727, w: 0.084, h: 0.041, angle: '-3deg' },
    scores: { x: 0.241, y: 0.72, w: 0.06, h: 0.047, angle: '-7deg' },
    jump: { x: 0.704, y: 0.718, w: 0.058, h: 0.046, angle: '6deg' },
    live: { x: 0.785, y: 0.738, w: 0.078, h: 0.039, angle: '4deg' },
    nav: { x: 0.894, y: 0.75, w: 0.076, h: 0.05, angle: '4deg' },
    cargoHit: { x: 0.119, y: 0.765, w: 0.11, h: 0.115 },
  },
} as const;

type MainPanel = 'themes' | 'scores' | 'jump' | 'nav';
function ConsolePanel({ kind, x, y, w, h, angle, color, headline, onPress, onAtlas, accessibilityLabel, sector }: {
  kind: MainPanel; x: number; y: number; w: number; h: number; angle: string; color: string;
  headline: string; onPress: () => void; onAtlas?: () => void; accessibilityLabel: string; sector?: SectorState;
}) {
  const [atlasMode, setAtlasMode] = useState(false);
  const [motion] = useState(() => new Animated.Value(0));
  const [bars] = useState(() => Array.from({ length: 6 }, (_, i) => new Animated.Value(0.18 + (i % 3) * 0.1)));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(motion, { toValue: 1, duration: kind === 'themes' ? 11800 : kind === 'scores' ? 7600 : 10400, easing: Easing.linear, useNativeDriver: true, isInteraction: false }),
      Animated.delay(kind === 'scores' ? 700 : 1500),
      Animated.timing(motion, { toValue: 0, duration: 1, useNativeDriver: true, isInteraction: false }),
    ]));
    loop.start();
    const barLoops = bars.map((bar, index) => {
      const animation = Animated.loop(Animated.sequence([
        Animated.delay(index * 170),
        Animated.timing(bar, { toValue: 0.34 + ((index * 13) % 5) * 0.12, duration: 1500 + index * 130, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
        Animated.timing(bar, { toValue: 0.18 + (index % 3) * 0.1, duration: 1750, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      ]));
      if (kind === 'scores') animation.start();
      return animation;
    });
    return () => { loop.stop(); barLoops.forEach(animation => animation.stop()); };
  }, [bars, kind, motion]);

  const px = (fraction: number) => Math.max(3, w * fraction);
  const contentInsetX = Math.max(1, w * 0.045), contentInsetY = Math.max(1, h * 0.06);
  const contentWidth = Math.max(1, w - contentInsetX * 2), contentHeight = Math.max(1, h - contentInsetY * 2);
  const scanX = motion.interpolate({ inputRange: [0, 1], outputRange: [-px(0.12), w * 0.82] });
  const rotate = motion.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scanOpacity = motion.interpolate({ inputRange: [0, 0.035, 0.94, 1], outputRange: [0, 0.64, 0.64, 0] });
  const scoreLabel = headline.match(/\d+/)?.[0] ?? '—';
  const themeGlyph = headline.includes('CUSTOM') ? '✧' : '✦';
  return <View testID={`bridge-console-${kind}`} pointerEvents="box-none" style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', transform: [{ rotate: angle }], paddingHorizontal: contentInsetX, paddingVertical: contentInsetY }}>
      {kind === 'themes' ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ position: 'absolute', width: '48%', height: '82%', borderWidth: 0.7, borderColor: `${color}75`, borderRadius: 40, transform: [{ rotate }] }} />
        <Animated.Text style={{ color, fontSize: Math.max(11, h * 0.52), opacity: motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 1, 0.7] }), transform: [{ rotate }] }}>{themeGlyph}</Animated.Text>
        <Animated.View style={{ position: 'absolute', right: '28%', top: '22%', width: 2.5, height: 2.5, borderRadius: 2, backgroundColor: '#fff2bc', opacity: motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.38, 0.92, 0.38] }) }} />
      </View> : kind === 'scores' ? <View style={{ flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', maxHeight: '40%' }}>{bars.map((bar, index) => <Animated.View key={index} style={{ width: Math.max(2, w * 0.04), height: '100%', transform: [{ scaleY: bar }], backgroundColor: `${color}dd`, opacity: 0.82 }} />)}</View>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#eff6f8', fontSize: px(0.15), fontWeight: '900' }}>TOP <Text style={{ color }}>{scoreLabel}</Text></Text>
      </View> : kind === 'jump' ? <View style={{ flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {(() => {
            const inset = Math.max(3, contentWidth * 0.045);
            const chartWidth = Math.max(1, contentWidth - inset * 2);
            const chartHeight = Math.max(1, contentHeight * 0.91 - inset * 2);
            const fallbackNodes = [
              { id: 'origin', x: 0.09, y: 0.66, links: ['relay', 'shard'], exit: false },
              { id: 'relay', x: 0.34, y: 0.31, links: ['gate'], exit: false },
              { id: 'shard', x: 0.38, y: 0.75, links: ['gate'], exit: false },
              { id: 'quiet', x: 0.61, y: 0.49, links: [], exit: false },
              { id: 'gate', x: 0.91, y: 0.53, links: [], exit: true },
            ];
            const nodes = sector?.beacons ?? fallbackNodes;
            const currentId = sector?.currentBeaconId ?? 'origin';
            const visitedIds = sector?.visitedBeaconIds ?? ['origin'];
            const pointFor = (id: string) => {
              const beacon = nodes.find(item => item.id === id);
              return beacon ? { x: inset + beacon.x * chartWidth, y: inset + beacon.y * chartHeight } : undefined;
            };
            const visitedEdges = visitedIds.slice(1).map((id, index) => [visitedIds[index], id] as const);
            const currentEdges = nodes.find(beacon => beacon.id === currentId)?.links.map(id => [currentId, id] as const) ?? [];
            const edges = [...visitedEdges, ...currentEdges];
            return <>
              {[0.25, 0.5, 0.75].map(position => <React.Fragment key={`atlas-grid-${position}`}><View style={{ position: 'absolute', left: chartWidth * position + inset, top: inset, bottom: inset, width: 0.8, backgroundColor: `${color}40` }} /><View style={{ position: 'absolute', left: inset, right: inset, top: chartHeight * position + inset, height: 0.8, backgroundColor: `${color}40` }} /></React.Fragment>)}
              {edges.map(([fromId, toId], index) => {
                const from = pointFor(fromId), to = pointFor(toId);
                if (!from || !to) return null;
                const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy), angle = `${Math.atan2(dy, dx) * 180 / Math.PI}deg`;
                const historical = index < visitedEdges.length;
                return <View key={`atlas-link-${fromId}-${toId}`} style={{ position: 'absolute', left: (from.x + to.x - length) / 2, top: (from.y + to.y) / 2, width: length, height: historical ? 2 : 1.6, borderRadius: 2, backgroundColor: historical ? '#a0ffe0' : '#ffd991', opacity: historical ? 0.98 : 0.9, transform: [{ rotate: angle }] }} />;
              })}
              {nodes.map(beacon => {
                const point = pointFor(beacon.id)!;
                const current = beacon.id === currentId;
                const reachable = nodes.some(item => item.id === currentId && item.links.includes(beacon.id));
                const visited = visitedIds.includes(beacon.id);
                const size = current ? 7.5 : reachable || visited || beacon.exit ? 5.5 : 3.5;
                return <React.Fragment key={`atlas-beacon-${beacon.id}`}>
                  {current && <Animated.View style={{ position: 'absolute', left: point.x - 6, top: point.y - 6, width: 12, height: 12, borderWidth: 1, borderColor: '#fff0ad', borderRadius: 6, opacity: motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] }) }} />}
                  <View style={{ position: 'absolute', left: point.x - size / 2, top: point.y - size / 2, width: size, height: size, borderRadius: beacon.exit ? 0 : size, borderWidth: 0.6, borderColor: current || beacon.exit ? '#fff4c5' : 'rgba(5,16,20,0.9)', backgroundColor: current ? '#fff0ad' : beacon.exit ? '#ffe17c' : reachable || visited ? '#8df4db' : '#9eabb1' }} />
                </React.Fragment>;
              })}
              <Animated.View style={{ position: 'absolute', left: 0, top: 1, bottom: 1, width: 1.2, backgroundColor: '#fff3bd', opacity: scanOpacity, transform: [{ translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-2, contentWidth - 4] }) }] }} />
            </>;
          })()}
        </View>
        <View style={{ height: Math.max(9, contentHeight * 0.2), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 12, height: '100%' }}>
            <Text style={{ color: atlasMode ? `${color}70` : '#fff0bd', fontSize: Math.max(8, px(0.16)), fontWeight: '900' }}>⇢</Text>
            {!atlasMode && <View style={{ width: 5, height: 1.5, marginTop: -1, borderRadius: 2, backgroundColor: color }} />}
          </View>
          <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 12, height: '100%' }}>
            <Text style={{ color: atlasMode ? '#fff0bd' : `${color}70`, fontSize: Math.max(8, px(0.16)), fontWeight: '900' }}>⌖</Text>
            {atlasMode && <View style={{ width: 5, height: 1.5, marginTop: -1, borderRadius: 2, backgroundColor: color }} />}
          </View>
        </View>
      </View> : kind === 'nav' ? <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', overflow: 'hidden' }}>
        <Animated.Text style={{ color, fontSize: Math.max(8, h * 0.48), opacity: motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.58, 1, 0.58] }), transform: [{ rotate }] }}>⌖</Animated.Text>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginHorizontal: 2 }}>
          {[0, 1, 2, 3].map((point, i) => <React.Fragment key={point}>{i > 0 && <View style={{ flex: 1, height: 1, backgroundColor: `${color}66` }} />}<Animated.View style={{ width: i === 3 ? 4 : 2.5, height: i === 3 ? 4 : 2.5, backgroundColor: i === 3 ? '#fff0ad' : color, borderRadius: i === 3 ? 0 : 3, opacity: motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] }) }} /></React.Fragment>)}
        </View>
      </View> : <View style={{ flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
          {[0, 1, 2, 3, 4].map((point, i) => <React.Fragment key={point}>{i > 0 && <View style={{ flex: 1, height: 1, backgroundColor: `${color}55` }} />}<Animated.View style={{ width: i === 2 ? 5 : 3, height: i === 2 ? 5 : 3, borderRadius: i === 2 ? 0 : 3, backgroundColor: i === 2 ? '#fff0ad' : color, transform: [{ rotate: '45deg' }], opacity: motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] }) }} /></React.Fragment>)}
          <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, backgroundColor: `${color}cc`, opacity: scanOpacity, transform: [{ translateX: scanX }] }} />
        </View>
        <View style={{ height: 2, width: '34%', alignSelf: 'center', backgroundColor: `${color}65`, borderRadius: 2 }} />
      </View>}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={atlasMode ? (onAtlas ?? onPress) : onPress} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, transform: [{ rotate: angle }] }} />
    {kind === 'jump' && <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h * 0.22, flexDirection: 'row', transform: [{ rotate: angle }] }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Keep Starmap Jump on this screen" onPress={() => setAtlasMode(false)} style={{ flex: 1 }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Open Route Atlas from this screen" onPress={() => { setAtlasMode(true); onAtlas?.(); }} style={{ flex: 1 }} />
    </View>}
  </View>;
}

/** Interactive controls are rendered flush onto blank glass in the rebuilt console assembly. */
export function BridgeInteriorAmbience({ width, height, themeValue, scoreValue, jumpReady, canResume, canStartRun, navConsoleOpen, cargoOpen, cargoDoorHeldOpen, cargoBalances, cargoShapes, foundryJobs, foundryPayouts, currentCredits, foundryProcessingMs, foundrySelectedMaterial, foundryCanSmelt, renderFoundryPickup, renderCreditIcon, stageFeed, sector, onCargo, onFoundry, onFoundrySmelt, onFoundryCollect, onCargoBayStateChange, onCargoDoorHoldChange, onThemes, onScores, onJump, onResume, onStartRun, onNavConsole, onDeveloper }: Props) {
  const panel = PANEL.original;
  const navPanel = PANEL.original.nav;
  const jumpAction = jumpReady ? onJump : canResume ? onResume : onStartRun;
  const jumpHeadline = jumpReady ? 'BEACON AVAILABLE' : canResume ? 'RUN IN PROGRESS' : canStartRun ? 'SYSTEMS READY' : 'UNAVAILABLE';
  return <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, width, height, overflow: 'visible' }}>
    <ConsolePanel kind="themes" x={width * panel.themes.x} y={height * panel.themes.y} w={width * panel.themes.w} h={height * panel.themes.h} angle={panel.themes.angle} color="#75e8db" headline={themeValue} onPress={onThemes} accessibilityLabel="Open Themes" />
    <ConsolePanel kind="scores" x={width * panel.scores.x} y={height * panel.scores.y} w={width * panel.scores.w} h={height * panel.scores.h} angle={panel.scores.angle} color="#94bbff" headline={scoreValue} onPress={onScores} accessibilityLabel="Open Scores and Captain’s Log" />
    <ConsolePanel kind="jump" x={width * panel.jump.x} y={height * panel.jump.y} w={width * panel.jump.w} h={height * panel.jump.h} angle={panel.jump.angle} color="#f6cd7c" headline={jumpHeadline} sector={sector} onPress={jumpAction} onAtlas={onNavConsole} accessibilityLabel={jumpReady ? 'Open Starmap Jump or Route Atlas' : canResume ? 'Resume active run or open Route Atlas' : canStartRun ? 'Start a new run or open Route Atlas' : 'Starmap Jump unavailable; open Route Atlas'} />
    {navPanel && <ConsolePanel kind="nav" x={width * navPanel.x} y={height * navPanel.y} w={width * navPanel.w} h={height * navPanel.h} angle={navPanel.angle} color="#79d9ea" headline="NAVIGATION" onPress={onNavConsole} accessibilityLabel="Open Bay Navigation" />}
    {stageFeed}
    {!navConsoleOpen && <BridgeFoundryStation width={width} height={height} jobs={foundryJobs} payouts={foundryPayouts} balances={cargoBalances} processingMs={foundryProcessingMs} selectedMaterial={foundrySelectedMaterial} canSmelt={foundryCanSmelt} onSmelt={onFoundrySmelt} onCollect={onFoundryCollect} onOpen={onFoundry} renderPickup={renderFoundryPickup} renderCredit={renderCreditIcon} />}
    {!navConsoleOpen && <BridgeCreditReadout width={width} height={height} credits={currentCredits} renderCredit={renderCreditIcon} bounds={PANEL.original.credits} />}
    {!navConsoleOpen && <BridgePanelButtons width={width} height={height} />}
    {!navConsoleOpen && <BridgeCargoAlcove width={width} height={height} balances={cargoBalances} shapes={cargoShapes} onOpen={onCargo} inventoryOpen={cargoOpen} holdDoorOpen={cargoDoorHeldOpen} onHoldDoorOpenChange={onCargoDoorHoldChange} onBayStateChange={onCargoBayStateChange} hitbox={{ left: panel.cargoHit.x, top: panel.cargoHit.y, width: panel.cargoHit.w, height: panel.cargoHit.h }} display={null} />}
  </View>;
}

export const BRIDGE_CONSOLE_PANELS = PANEL;
