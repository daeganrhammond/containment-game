import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { CARGO_CATALOG } from './cargo';
import type { CargoBalances, CargoItemId } from './cargo';
import type { FoundryPayout, OverflowJob, PowerKind } from './mechanics';

const REFINABLE: CargoItemId[] = ['life', 'speed', 'ram', 'charge'];

/** Live inventory, process, and output interactions fitted to the foundry cut into the bridge deck. */
export function BridgeFoundryStation({ width, height, jobs, payouts, balances, processingMs, selectedMaterial, canSmelt, onSmelt, onCollect, onOpen, renderPickup, renderCredit }: {
  width: number; height: number; jobs: OverflowJob[]; payouts: FoundryPayout[]; balances: CargoBalances; processingMs: number;
  selectedMaterial: 'life' | 'speed' | 'ram' | 'charge'; canSmelt: boolean; onSmelt: () => void; onCollect: (payoutIds: readonly number[]) => void; onOpen: () => void;
  renderPickup: (kind: PowerKind, size: number) => React.ReactNode; renderCredit: (size: number) => React.ReactNode;
}) {
  const [heat] = useState(() => new Animated.Value(0.3));
  const [trayPulse] = useState(() => new Animated.Value(0.4));
  const [arrival] = useState(() => new Animated.Value(0));
  const [coinFlight] = useState(() => Array.from({ length: 5 }, () => new Animated.Value(0)));
  const [collectionAmount, setCollectionAmount] = useState(0);
  const payoutIds = useRef(new Set(payouts.map(payout => payout.id)));
  const active = jobs[0];
  const isActive = !!active;
  const activeItem = active ? Object.values(CARGO_CATALOG).find(item => item.powerKind === active.kind) : undefined;
  const progress = active ? Math.max(0, Math.min(1, 1 - active.remainingMs / Math.max(1, active.durationMs ?? processingMs))) : 0;
  const totalPayout = payouts.reduce((sum, payout) => sum + Math.max(0, Math.floor(payout.credits)), 0);
  const payoutCount = payouts.length;
  const totalQueued = jobs.length;
  const geometry = { machine: { x: 0.286, y: 0.596, w: 0.43, h: 0.21 }, status: { x: 0.426, y: 0.607, w: 0.148, h: 0.035 }, crucible: { x: 0.481, y: 0.681, w: 0.05, h: 0.073 }, conveyor: { x: 0.345, y: 0.696, w: 0.09, h: 0.03 }, smeltButton: { x: 0.613, y: 0.779, w: 0.03, h: 0.022 }, rack: { x: 0.602, y: 0.651, w: 0.056, h: 0.122 }, tray: { x: 0.566, y: 0.738, w: 0.066, h: 0.036 } };

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heat, { toValue: 0.95, duration: isActive ? 540 : 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(heat, { toValue: isActive ? 0.54 : 0.22, duration: isActive ? 620 : 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isActive, heat]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(trayPulse, { toValue: totalPayout ? 0.9 : 0.58, duration: totalPayout ? 1500 : 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(trayPulse, { toValue: totalPayout ? 0.68 : 0.4, duration: totalPayout ? 1800 : 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [trayPulse, totalPayout]);

  // A completed smelt gets one gentle output reveal; pre-existing save data is quiet on mount.
  useEffect(() => {
    const known = payoutIds.current;
    const arrived = payouts.some(payout => !known.has(payout.id));
    payouts.forEach(payout => known.add(payout.id));
    if (!arrived) return;
    arrival.stopAnimation();
    arrival.setValue(0);
    Animated.sequence([
      Animated.timing(arrival, { toValue: 1, duration: 720, easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false }),
      Animated.timing(arrival, { toValue: 0, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]).start();
  }, [arrival, payouts]);

  const stockTiles = useMemo(() => REFINABLE.map((itemId, index) => {
    const kind = CARGO_CATALOG[itemId].powerKind!;
    const reserved = jobs.filter(job => job.kind === kind && job.holdsCargo).length;
    const waiting = jobs.filter(job => job.kind === kind).length;
    const x = geometry.rack.x + (index % 2) * 0.029;
    const y = geometry.rack.y + Math.floor(index / 2) * 0.061;
    const stored = Math.max(0, balances[itemId] - reserved);
    return { itemId, kind, x, y, stored, waiting, visibleStack: Math.min(3, stored + waiting) };
  }), [balances, geometry.rack.x, geometry.rack.y, jobs]);

  // The selected parcel moves from its rack shelf into the fire during the opening fifth
  // of the smelt cycle, then the matching pickup dissolves in the chamber.
  const feedProgress = Math.min(1, progress / 0.2);
  const activeStock = active ? stockTiles.find(tile => tile.kind === active.kind) : undefined;
  const feedStartX = width * ((activeStock?.x ?? geometry.rack.x) + geometry.rack.w * 0.24);
  const feedStartY = height * ((activeStock?.y ?? geometry.rack.y) + 0.025);
  const feedX = (width * (geometry.crucible.x + geometry.crucible.w * 0.5) - feedStartX) * feedProgress;
  const feedY = (height * (geometry.crucible.y + geometry.crucible.h * 0.5) - feedStartY) * feedProgress;
  const feedOpacity = Math.max(0, 1 - feedProgress);

  const machine = geometry.machine;
  const fire = geometry.crucible;
  const animationFamily = activeItem?.refinerAnimation ?? 'dissolve';
  const materialScale = 0.88 + progress * 0.72;
  const materialOpacity = Math.max(0, 1 - progress * 1.12);
  const fragmentsOpacity = Math.max(0, Math.min(1, (progress - 0.44) / 0.56));
  const machineX = width * machine.x, machineY = height * machine.y;
  const rackBounds = geometry.rack;
  const tray = geometry.tray;
  const collectOutput = () => {
    if (!totalPayout || collectionAmount > 0) return;
    const selectedPayouts = payouts.map(payout => payout.id);
    const amountInFlight = payouts.reduce((sum, payout) => sum + Math.max(0, Math.floor(payout.credits)), 0);
    setCollectionAmount(amountInFlight);
    coinFlight.forEach(value => { value.stopAnimation(); value.setValue(0); });
    Animated.stagger(100, coinFlight.map(value => Animated.timing(value, { toValue: 1, duration: 1120, easing: Easing.inOut(Easing.cubic), useNativeDriver: true, isInteraction: false }))).start(({ finished }) => {
      if (finished) { onCollect(selectedPayouts); setCollectionAmount(0); }
    });
  };

  return <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, width, height, overflow: 'visible', zIndex: 14 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open foundry. ${active ? `${activeItem?.name ?? active.kind} is being refined; ${Math.ceil(active.remainingMs / 1000)} seconds remain. ` : 'The refining chamber is ready. '}${totalQueued} queued and ${payoutCount} output waiting.`} onPress={onOpen}
      style={{ position: 'absolute', left: machineX, top: machineY, width: width * machine.w, height: height * machine.h, backgroundColor: 'transparent' }} />

    {/* Each small pickup and queue marker sits on the corresponding physical rack shelf. */}
    <View pointerEvents="none" style={{ position: 'absolute', left: width * rackBounds.x, top: height * rackBounds.y, width: width * rackBounds.w, height: height * rackBounds.h }}>
      {stockTiles.map(({ itemId, kind, x, y, visibleStack }) => {
        const itemSize = Math.max(9, Math.min(width * 0.016, height * 0.029));
        return <View key={itemId} style={{ position: 'absolute', left: width * (x - rackBounds.x), top: height * (y - rackBounds.y), width: width * 0.027, height: height * 0.047, borderBottomWidth: 0.5, borderBottomColor: visibleStack ? `${CARGO_CATALOG[itemId].tint}75` : 'rgba(91,112,113,0.25)' }}>
          {Array.from({ length: visibleStack }, (_, stackIndex) => {
            const stackOffset = Math.max(1, width * 0.002);
            const stackWidth = itemSize + stackOffset * Math.max(0, visibleStack - 1);
            return <View key={`${itemId}-shelf-item-${stackIndex}`} style={{ position: 'absolute', left: (width * 0.027 - stackWidth) / 2 + stackIndex * stackOffset, bottom: height * 0.002 + stackIndex * height * 0.003, width: itemSize, height: itemSize, alignItems: 'center', justifyContent: 'center', opacity: stackIndex === visibleStack - 1 ? 1 : 0.82 }}>{renderPickup(kind, itemSize)}</View>;
          })}
        </View>;
      })}
    </View>

    {/* Live process readout is inset into the foundry's upper fascia. */}
    <View pointerEvents="none" style={{ position: 'absolute', left: width * geometry.status.x, top: height * geometry.status.y, width: width * geometry.status.w, height: height * geometry.status.h, paddingHorizontal: 4, paddingVertical: 2, borderWidth: 1, borderColor: `${activeItem?.tint ?? '#73e5d0'}88`, borderRadius: 2, backgroundColor: 'rgba(3,18,25,0.88)', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 3 }}><Text numberOfLines={1} adjustsFontSizeToFit style={{ flexShrink: 1, color: activeItem?.tint ?? '#8fe7d3', fontSize: Math.max(6, width * 0.009), fontWeight: '900', letterSpacing: 0.2 }}>{active ? `SMELT · ${active.kind.toUpperCase()}` : totalQueued ? `FEED · ${totalQueued}` : 'FOUNDRY · READY'}</Text><Text numberOfLines={1} style={{ color: '#f1e1ba', fontSize: Math.max(6, width * 0.009), fontWeight: '900' }}>{active ? `${Math.ceil(active.remainingMs / 1000)}s` : `${Math.ceil(processingMs / 1000)}s`}</Text></View>
      <View style={{ height: 2, marginTop: 2, backgroundColor: '#19323a', overflow: 'hidden' }}><View style={{ width: `${active ? Math.floor(progress * 100) : 0}%`, height: '100%', backgroundColor: activeItem?.tint ?? '#65d9c5' }} /></View>
    </View>

    {/* The fire glyph, breakup particles, and progress all derive from the same live job timer. */}
    <View pointerEvents="none" style={{ position: 'absolute', left: width * fire.x, top: height * fire.y, width: width * fire.w, height: height * fire.h, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: active ? '78%' : '42%', height: active ? '78%' : '42%', borderRadius: 100, backgroundColor: active ? `${activeItem?.tint ?? '#ffc05d'}45` : '#ffc05d55', opacity: heat, transform: [{ scale: heat.interpolate({ inputRange: [0.22, 0.95], outputRange: [0.84, 1.18] }) }] }} />
      {active
        ? <View style={{ opacity: materialOpacity, transform: [{ scale: materialScale }, { translateY: -height * progress * (animationFamily === 'dissolve' ? 0.1 : 0.03) }, { rotate: `${progress * (animationFamily === 'arc' ? 270 : animationFamily === 'shatter' ? 45 : 0)}deg` }] }}>{renderPickup(active.kind, Math.max(14, Math.min(width * 0.035, height * 0.072)))}</View>
        : <Animated.View style={{ width: Math.max(3, width * 0.004), height: Math.max(5, height * 0.012), borderRadius: 3, backgroundColor: '#ffe7a3', opacity: heat, transform: [{ translateY: heat.interpolate({ inputRange: [0.22, 0.95], outputRange: [height * 0.01, -height * 0.01] }) }] }} />}
      {active && Array.from({ length: 6 }, (_, index) => {
        const angle = index * Math.PI / 3;
        const distance = (animationFamily === 'shatter' ? 0.027 : 0.02) * fragmentsOpacity;
        return <View key={`${active.id}-fragment-${index}`} style={{ position: 'absolute', width: Math.max(2, width * 0.003), height: Math.max(2, width * 0.003), borderRadius: animationFamily === 'dissolve' ? 10 : 1, backgroundColor: activeItem?.tint ?? '#ffe3a0', opacity: fragmentsOpacity * 0.9, transform: [{ translateX: Math.cos(angle) * width * distance }, { translateY: Math.sin(angle) * height * distance }, { rotate: `${index * 37 + progress * 140}deg` }] }} />;
      })}
    </View>

    {active && <View pointerEvents="none" style={{ position: 'absolute', left: feedStartX - width * 0.009, top: feedStartY - height * 0.013, width: Math.max(4, width * 0.018), height: Math.max(4, width * 0.018), alignItems: 'center', justifyContent: 'center', opacity: feedOpacity, transform: [{ translateX: feedX }, { translateY: feedY }] }}>{renderPickup(active.kind, Math.max(7, width * 0.013))}</View>}

    {/* Empty physical tray in the artwork is populated only by completed, uncollected runs. */}
    <View pointerEvents="none" style={{ position: 'absolute', left: width * tray.x, top: height * tray.y, width: width * tray.w, height: height * tray.h, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', left: '15%', right: '15%', top: '22%', bottom: '22%', borderRadius: 30, backgroundColor: '#ffd27b', opacity: trayPulse.interpolate({ inputRange: [0.4, 0.9], outputRange: [0.015, 0.12] }), transform: [{ scale: trayPulse.interpolate({ inputRange: [0.4, 0.9], outputRange: [0.78, 1.08] }) }] }} />
      <Animated.View style={{ position: 'absolute', left: '8%', right: '8%', top: '4%', bottom: '4%', borderRadius: 24, backgroundColor: '#ffdc91', opacity: arrival.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.11, 0.03] }), transform: [{ scale: arrival.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.04] }) }] }} />
      {totalPayout > 0 && <Animated.View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, opacity: arrival.interpolate({ inputRange: [0, 0.25, 1], outputRange: [1, 1, 0.9] }), transform: [{ scale: arrival.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 1.09, 1] }) }] }}>{renderCredit(Math.max(11, width * 0.016))}<Text adjustsFontSizeToFit numberOfLines={1} style={{ color: '#fff0c5', fontSize: Math.max(8, width * 0.011), fontWeight: '900', textShadowColor: '#241604', textShadowRadius: 2 }}>+{totalPayout}</Text></Animated.View>}
    </View>
    {!!collectionAmount && coinFlight.map((flight, index) => {
      const originX = width * (tray.x + tray.w * (0.28 + index * 0.14));
      const originY = height * (tray.y + tray.h * 0.5);
      const targetX = width * 0.061;
      const targetY = height * 0.744;
      return <Animated.View key={`credit-flight-${index}`} pointerEvents="none" style={{ position: 'absolute', zIndex: 25, left: originX - 5, top: originY - 5, opacity: flight.interpolate({ inputRange: [0, 0.18, 0.78, 1], outputRange: [0, 1, 0.92, 0] }), transform: [
        { translateX: flight.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, (targetX - originX) * 0.52, targetX - originX] }) },
        { translateY: flight.interpolate({ inputRange: [0, 0.32, 0.68, 1], outputRange: [0, -height * (0.045 + index * 0.004), -height * (0.025 + index * 0.003), targetY - originY] }) },
        { scale: flight.interpolate({ inputRange: [0, 0.12, 0.82, 1], outputRange: [0.48, 1.28, 0.92, 0.3] }) },
      ] }}>{renderCredit(Math.max(11, Math.min(18, width * 0.016)))}</Animated.View>;
    })}
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !totalPayout || collectionAmount > 0 }} accessibilityLabel={collectionAmount > 0 ? `Collecting ${collectionAmount} foundry credits` : totalPayout ? `Collect ${totalPayout} foundry credits from ${payoutCount} completed smelts` : 'Foundry output tray empty'} disabled={!totalPayout || collectionAmount > 0} onPress={collectOutput} style={{ position: 'absolute', zIndex: 22, left: width * tray.x, top: height * tray.y, width: width * tray.w, height: height * tray.h, backgroundColor: 'transparent' }} />

    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSmelt }} accessibilityLabel={canSmelt ? `Smelt one selected ${selectedMaterial} item` : 'SMELT unavailable. Select an item, switch to manual selection, and keep one item above reserves.'} disabled={!canSmelt} onPress={onSmelt}
      style={{ position: 'absolute', zIndex: 18, left: width * geometry.smeltButton.x, top: height * geometry.smeltButton.y, width: width * geometry.smeltButton.w, height: height * geometry.smeltButton.h, backgroundColor: 'transparent' }} />
  </View>;
}

/** Physical glass readout for credits already collected into the current run wallet. */
export function BridgeCreditReadout({ width, height, credits, renderCredit, bounds = { x: 0.025, y: 0.744, w: 0.068, h: 0.05 } }: { width: number; height: number; credits: number; renderCredit: (size: number) => React.ReactNode; bounds?: { x: number; y: number; w: number; h: number; angle?: string } }) {
  const [pulse] = useState(() => new Animated.Value(0.4));
  const [gainFlash] = useState(() => new Animated.Value(0));
  const previous = useRef(credits);
  const [gain, setGain] = useState(0);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.88, duration: 1850, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(pulse, { toValue: 0.38, duration: 2150, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  useEffect(() => {
    const delta = credits - previous.current;
    previous.current = credits;
    if (delta <= 0) return;
    setGain(delta);
    gainFlash.stopAnimation();
    gainFlash.setValue(1);
    Animated.timing(gainFlash, { toValue: 0, duration: 1700, easing: Easing.out(Easing.quad), useNativeDriver: true, isInteraction: false }).start(({ finished }) => { if (finished) setGain(0); });
  }, [credits, gainFlash]);
  const x = width * bounds.x, y = height * bounds.y, w = width * bounds.w, h = height * bounds.h;
  return <View pointerEvents="none" style={{ position: 'absolute', zIndex: 19, left: x, top: y, width: w, height: h, paddingHorizontal: Math.max(2, w * 0.055), paddingVertical: Math.max(1, h * 0.08), overflow: 'hidden', justifyContent: 'center', transform: [{ rotate: bounds.angle ?? '0deg' }] }}>
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Math.max(2, w * 0.035) }}>
      {renderCredit(Math.max(12, Math.min(h * 0.52, w * 0.22)))}
      <Animated.Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#ffe0a0', fontSize: Math.max(12, Math.min(18, h * 0.5)), fontWeight: '900', textShadowColor: '#ffc35e', textShadowRadius: 4, opacity: pulse }}>{Math.max(0, Math.floor(credits)).toLocaleString()}</Animated.Text>
    </View>
    {!!gain && <Animated.Text style={{ position: 'absolute', right: 3, top: 0, color: '#8ff2c1', fontSize: Math.max(8, h * 0.25), fontWeight: '900', opacity: gainFlash, transform: [{ translateY: gainFlash.interpolate({ inputRange: [0, 1], outputRange: [-5, 1] }) }] }}>+{gain}</Animated.Text>}
    <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, backgroundColor: '#ffeab3', opacity: pulse.interpolate({ inputRange: [0.38, 0.88], outputRange: [0.18, 0.58] }), transform: [{ translateX: pulse.interpolate({ inputRange: [0.38, 0.88], outputRange: [0, w] }) }] }} />
  </View>;
}

/** Staggered status switches fitted into the lower control pads beneath the bridge glass. */
export function BridgePanelButtons({ width, height }: { width: number; height: number }) {
  const rows = [
    { id: 'credits', x: 0.028, y: 0.777, w: 0.064, h: 0.018, angle: '-8deg' },
    { id: 'themes', x: 0.13, y: 0.779, w: 0.083, h: 0.019, angle: '-8deg' },
    { id: 'flight-log', x: 0.238, y: 0.777, w: 0.084, h: 0.019, angle: '-12deg' },
    { id: 'jump-atlas', x: 0.696, y: 0.786, w: 0.176, h: 0.018, angle: '5deg' },
    { id: 'live-sector', x: 0.901, y: 0.784, w: 0.074, h: 0.018, angle: '7deg' },
  ];
  const colors = ['#67d7ed', '#eab56b', '#70d6bd', '#d58a62'];
  const [lamps] = useState(() => rows.flatMap(() => Array.from({ length: 4 }, () => new Animated.Value(0.24))));
  useEffect(() => {
    const loops = lamps.map((lamp, index) => {
      const rowIndex = Math.floor(index / 4), lampIndex = index % 4;
      const loop = Animated.loop(Animated.sequence([
        Animated.delay(rowIndex * 370 + lampIndex * 210),
        Animated.timing(lamp, { toValue: lampIndex === 1 ? 0.82 : 0.64, duration: 260 + (lampIndex % 2) * 110, easing: Easing.out(Easing.quad), useNativeDriver: true, isInteraction: false }),
        Animated.delay(180 + ((index * 3) % 4) * 120),
        Animated.timing(lamp, { toValue: 0.2, duration: 650 + (lampIndex % 2) * 180, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
        Animated.delay(1050 + ((index * 7) % 4) * 320),
      ]));
      loop.start();
      return loop;
    });
    return () => loops.forEach(loop => loop.stop());
  }, [lamps]);

  return <View pointerEvents="none" style={{ position: 'absolute', zIndex: 19, left: 0, top: 0, width, height }}>
    {rows.map((row, rowIndex) => {
      const rowWidth = width * row.w, rowHeight = height * row.h;
      return <View key={row.id} style={{ position: 'absolute', left: width * row.x, top: height * row.y, width: rowWidth, height: rowHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: rowWidth * 0.05, transform: [{ rotate: row.angle }] }}>
        {Array.from({ length: 4 }, (_, lampIndex) => {
          const index = rowIndex * 4 + lampIndex, color = colors[(lampIndex + rowIndex) % colors.length];
          return <Animated.View key={`${row.id}-switch-${lampIndex}`} style={{ width: rowWidth * 0.065, height: Math.max(2, rowHeight * 0.32), borderRadius: 1, backgroundColor: color, opacity: lamps[index], shadowColor: color, shadowOpacity: 0.7, shadowRadius: 2 }} />;
        })}
      </View>;
    })}
  </View>;
}
