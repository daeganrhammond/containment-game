import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { CARGO_CATALOG, packCargo } from './cargo';
import type { CargoBalances, CargoItemId, CargoShapes } from './cargo';

const CARGO_TINTS: Record<CargoItemId, string> = {
  life: '#ff7193', speed: '#83d7ff', ram: '#efbd67', charge: '#78e7d0', credit: '#f2d075',
  'power-bar': '#b79aff', 'merchant-token': '#f5a66e', 'engi-pod': '#9cdaa2', 'mount-assembly': '#f2b66d',
};
/** Clickable cargo hatch with a live micro-display aligned to the bridge artwork. */
export function BridgeCargoAlcove({ width, height, balances, shapes, onOpen, inventoryOpen, holdDoorOpen = false, onHoldDoorOpenChange, onBayStateChange, hitbox = { left: 0.102, top: 0.797, width: 0.13, height: 0.105 }, display = { left: 0.119, top: 0.779, width: 0.095, height: 0.018 } }: { width: number; height: number; balances: CargoBalances; shapes?: CargoShapes; onOpen: () => void; inventoryOpen: boolean; holdDoorOpen?: boolean; onHoldDoorOpenChange?: (heldOpen: boolean) => void; onBayStateChange?: (open: boolean) => void; hitbox?: { left: number; top: number; width: number; height: number }; display?: { left: number; top: number; width: number; height: number } | null }) {
  const cargo = packCargo(balances, undefined, undefined, undefined, shapes);
  const usedPercent = Math.round(cargo.usedCells / cargo.totalCells * 100);
  const freePercent = 100 - usedPercent;
  const visibleStacks = cargo.stacks.slice(0, 5);
  const [scan] = useState(() => new Animated.Value(0));
  const [statusPulse] = useState(() => new Animated.Value(0.55));
  const [doorMotion] = useState(() => new Animated.Value(0));
  const doorOpenRef = useRef(false);
  const doorMoving = useRef(false);
  const transitionId = useRef(0);
  const pendingInventoryOpen = useRef(false);
  const wasInventoryOpen = useRef(inventoryOpen);
  const wasHoldDoorOpen = useRef(false);
  const inventoryOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fontTiny = display ? Math.max(4, Math.min(6, width * display.width * 0.06)) : 4;

  useEffect(() => {
    const scanLoop = Animated.loop(Animated.sequence([
      Animated.timing(scan, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.quad), useNativeDriver: true, isInteraction: false }),
      Animated.timing(scan, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.quad), useNativeDriver: true, isInteraction: false }),
    ]));
    const statusLoop = Animated.loop(Animated.sequence([
      Animated.timing(statusPulse, { toValue: 0.82, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(statusPulse, { toValue: 0.42, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    scanLoop.start(); statusLoop.start();
    return () => { scanLoop.stop(); statusLoop.stop(); };
  }, [scan, statusPulse]);

  useEffect(() => () => {
    transitionId.current += 1;
    doorMotion.stopAnimation();
    if (inventoryOpenTimer.current) clearTimeout(inventoryOpenTimer.current);
  }, [doorMotion]);

  const scheduleInventoryOpen = useCallback((delay: number) => {
    if (inventoryOpenTimer.current) clearTimeout(inventoryOpenTimer.current);
    pendingInventoryOpen.current = false;
    inventoryOpenTimer.current = setTimeout(() => {
      inventoryOpenTimer.current = null;
      if (doorOpenRef.current || holdDoorOpen) onOpen();
    }, delay);
  }, [holdDoorOpen, onOpen]);

  const animateDoors = useCallback((open: boolean, openInventoryAfter = false) => {
    const id = ++transitionId.current;
    doorMotion.stopAnimation();
    doorMoving.current = true;
    doorOpenRef.current = open;
    Animated.timing(doorMotion, {
      toValue: open ? 1 : 0,
      duration: open ? 560 : 460,
      easing: open ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    }).start(({ finished }) => {
      if (id !== transitionId.current) return;
      doorMoving.current = false;
      if (!finished) return;
      onBayStateChange?.(open);
      if (open && (openInventoryAfter || pendingInventoryOpen.current)) scheduleInventoryOpen(1500);
    });
  }, [doorMotion, onBayStateChange, scheduleInventoryOpen]);

  useEffect(() => {
    const justClosedInventory = wasInventoryOpen.current && !inventoryOpen;
    wasInventoryOpen.current = inventoryOpen;
    if (!justClosedInventory || !doorOpenRef.current || holdDoorOpen) return;
    animateDoors(false);
  }, [animateDoors, holdDoorOpen, inventoryOpen]);

  useEffect(() => {
    const holdChanged = wasHoldDoorOpen.current !== holdDoorOpen;
    wasHoldDoorOpen.current = holdDoorOpen;
    if (!holdChanged) return;

    if (holdDoorOpen) {
      if (doorOpenRef.current && !doorMoving.current) { onBayStateChange?.(true); return; }
      animateDoors(true);
      return;
    }

    if (inventoryOpen || !doorOpenRef.current) return;
    animateDoors(false);
  }, [animateDoors, holdDoorOpen, inventoryOpen, onBayStateChange]);

  const screenWidth = display ? width * display.width : 0;
  const bayWidth = width * hitbox.width;
  const bayHeight = height * hitbox.height;
  const doorControlWidth = Math.max(34, width * 0.046);
  const doorControlHeight = Math.max(15, height * 0.028);
  const openBay = () => {
    if (inventoryOpen) return;
    if (inventoryOpenTimer.current) clearTimeout(inventoryOpenTimer.current);
    if (doorOpenRef.current && !doorMoving.current) {
      scheduleInventoryOpen(420);
      return;
    }
    pendingInventoryOpen.current = true;
    if (doorMoving.current && doorOpenRef.current) return;
    animateDoors(true, true);
  };
  return <>
    <Pressable
      accessibilityRole="switch"
      testID="cargo-door-hold-toggle"
      accessibilityState={{ checked: holdDoorOpen }}
      accessibilityLabel={holdDoorOpen ? 'Cargo bay doors held open; turn off' : 'Hold cargo bay doors open'}
      onPress={() => onHoldDoorOpenChange?.(!holdDoorOpen)}
      style={{ position: 'absolute', zIndex: 15, left: width * hitbox.left, top: height * hitbox.top - doorControlHeight * 0.72, width: doorControlWidth, height: doorControlHeight, alignItems: 'center', justifyContent: 'center', padding: 2 }}
    >
      <View pointerEvents="none" style={{ width: '100%', height: '100%', borderWidth: 0.8, borderColor: holdDoorOpen ? '#8df4db' : '#75e8db80', borderRadius: 2, backgroundColor: holdDoorOpen ? '#12352ecc' : '#07151acc', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <View style={{ width: Math.max(12, doorControlWidth * 0.32), height: '72%', borderWidth: 0.8, borderColor: holdDoorOpen ? '#a5ffe7' : '#8bbab6', flexDirection: 'row', overflow: 'hidden' }}>
          <View style={{ flex: 1, borderRightWidth: 0.7, borderColor: holdDoorOpen ? '#a5ffe7' : '#8bbab6', backgroundColor: holdDoorOpen ? '#6ce2c855' : 'transparent' }} />
          <View style={{ flex: 1, backgroundColor: holdDoorOpen ? '#6ce2c855' : 'transparent' }} />
        </View>
        <Animated.View style={{ width: 3.5, height: 3.5, borderRadius: 4, backgroundColor: holdDoorOpen ? '#a5ffe7' : '#81969a', opacity: holdDoorOpen ? statusPulse : 0.62 }} />
      </View>
    </Pressable>
    <Pressable testID="cargo-bay-hit-target" accessibilityRole="button" accessibilityLabel={`Open Cargo Hold. ${usedPercent} percent used, ${freePercent} percent free. ${cargo.stacks.length} cargo stacks.`} disabled={inventoryOpen} onPress={openBay} style={{ position: 'absolute', zIndex: 12, left: width * hitbox.left, top: height * hitbox.top, width: bayWidth, height: bayHeight, backgroundColor: 'transparent' }} />
    {display && <View pointerEvents="none" style={{ position: 'absolute', zIndex: 13, left: width * display.left, top: height * display.top, width: screenWidth, height: height * display.height, paddingHorizontal: 4, paddingVertical: 1, overflow: 'hidden' }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <Animated.View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: '#a5e1c6', opacity: statusPulse }} />
        <Text numberOfLines={1} style={{ color: '#d4e6dc', fontSize: fontTiny, fontWeight: '900', letterSpacing: 0.25 }}>HOLD {usedPercent}%</Text>
        <View style={{ flex: 1, height: 3, borderWidth: 1, borderColor: '#78988b', backgroundColor: '#091410', overflow: 'hidden' }}>
          <View style={{ width: `${usedPercent}%`, height: '100%', backgroundColor: '#a5d7b5' }} />
        </View>
        {visibleStacks.slice(0, 3).map(stack => {
          const tint = CARGO_TINTS[stack.itemId];
          const item = CARGO_CATALOG[stack.itemId];
          return <View key={stack.id} style={{ width: Math.max(5, fontTiny * 1.1), height: Math.max(5, fontTiny * 0.8), borderWidth: 1, borderColor: tint, backgroundColor: `${tint}22`, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: tint, fontSize: Math.max(4, fontTiny - 2), fontWeight: '900', lineHeight: fontTiny - 1 }}>{item.glyph}</Text>
          </View>;
        })}
        {!visibleStacks.length && <Text style={{ color: '#92aaa0', fontSize: Math.max(4, fontTiny - 1) }}>EMPTY</Text>}
      </View>
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 2, width: 1, backgroundColor: '#cae8ce', opacity: 0.36, transform: [{ translateX: scan.interpolate({ inputRange: [0, 1], outputRange: [0, screenWidth - 4] }) }] }} />
    </View>}
  </>;
}
