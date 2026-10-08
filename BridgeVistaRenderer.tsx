import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import type { BridgeAmbienceProfile } from './bridgeVistaCatalog';
import { BRIDGE_SHIP_SKINS } from './bridgeShipCatalog';

// React Native Web has no native animation module. Select its JS driver
// explicitly so browser builds do not depend on the native-driver fallback.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

function hashSceneKey(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0 || 1;
}

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function inferAmbience(sceneId: string, sceneName: string, seed: number): BridgeAmbienceProfile {
  const description = `${sceneId} ${sceneName}`.toLowerCase();
  if (/nebula|galaxy|cosmic cloud|stellar cloud/.test(description)) return 'nebula-clouds';
  if (/asteroid|debris|meteor|rock field/.test(description)) return 'asteroid-belt';
  if (/comet/.test(description)) return 'comet-caravan';
  if (/ship|fleet|cruiser|patrol|escort|battleship/.test(description)) return 'blueworld-patrol';
  if (/desert|dune|mars|frontier/.test(description)) return 'glass-desert';
  if (/rain|ocean|city|pelagic|water/.test(description)) return 'pelagic-megacity';
  if (/beacon|station|colony|outpost/.test(description)) return 'pilgrim-beacons';
  if (/ice|ring|giant|planet|orbit|moon/.test(description)) return 'nacre-ice-giant';
  const random = seededRandom(seed);
  const fallbackProfiles: BridgeAmbienceProfile[] = ['deep-space', 'nebula-clouds', 'asteroid-belt', 'eventide-eclipse', 'glass-desert', 'pilgrim-beacons', 'aurora-reef', 'comet-caravan', 'blue-meridian', 'vesper-horizon', 'blueworld-patrol', 'dawnward-escort', 'emberfall-frontier', 'leviathan-orbit', 'pelagic-megacity', 'nacre-ice-giant', 'emberline-shipyard'];
  return fallbackProfiles[Math.floor(random() * fallbackProfiles.length)];
}

function TwinklingStar({ left, top, size, delay, tint = '#c9eaff' }: { left: `${number}%`; top: `${number}%`; size: number; delay: number; tint?: string }) {
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(pulse, { toValue: 1, duration: 2600 + delay % 1700, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.delay(1200 + delay % 2300),
      Animated.timing(pulse, { toValue: 0, duration: 3400 + delay % 1100, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.delay(900 + delay % 2600),
    ]));
    loop.start();
    return () => loop.stop();
  }, [delay, pulse]);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.82] });
  return <Animated.View pointerEvents="none" style={[styles.star, { left, top, width: size, height: size, backgroundColor: tint, opacity }]} />;
}

function SlowVeil({ width, height, top, delay, tint }: { width: number; height: number; top: number; delay: number; tint: string }) {
  const [phase] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(phase, { toValue: 1, duration: 36000 + delay * 2, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
      Animated.timing(phase, { toValue: 0, duration: 42000 + delay * 2, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [delay, phase]);
  const opacity = phase.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0.9] });
  const translateX = phase.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.035, width * 0.035] });
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -width * 0.14, top: height * top, width: width * 1.28, height: Math.max(12, height * 0.12), borderRadius: 999, backgroundColor: tint, opacity, transform: [{ translateX }, { scaleX: 1.08 }] }} />;
}

function NebulaCloudDrift({ width, height, index, tint, sceneSeed }: { width: number; height: number; index: number; tint: string; sceneSeed: number }) {
  const [phase] = useState(() => new Animated.Value(0));
  const variation = seededRandom(sceneSeed + index * 7919);
  const startLeft = width * (0.06 + index * 0.23 + variation() * 0.08);
  const startTop = height * (0.14 + (index % 3) * 0.23 + variation() * 0.1);
  const moveSeconds = 45000 + variation() * 30000;
  const delay = index * 5100 + Math.floor(variation() * 6000);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(phase, { toValue: 1, duration: moveSeconds, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
      Animated.timing(phase, { toValue: 0, duration: moveSeconds + 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [delay, index, phase, sceneSeed, moveSeconds]);
  const opacity = phase.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.06, 0.19, 0.09] });
  const translateX = phase.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.075, width * 0.08] });
  const translateY = phase.interpolate({ inputRange: [0, 1], outputRange: [height * 0.025, -height * 0.035] });
  const scale = phase.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.13] });
  const cloudWidth = width * (0.38 + (index % 2) * 0.12);
  const cloudHeight = height * (0.22 + (index % 3) * 0.035);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: startLeft, top: startTop, width: cloudWidth, height: cloudHeight, borderRadius: 999, backgroundColor: tint, opacity, shadowColor: tint, shadowOpacity: 0.85, shadowRadius: cloudHeight * 0.42, transform: [{ translateX }, { translateY }, { scale }] }} />;
}

function DriftingAsteroid({ width, height, index, sceneSeed, prominent = false }: { width: number; height: number; index: number; sceneSeed: number; prominent?: boolean }) {
  const [phase] = useState(() => new Animated.Value(0));
  const variation = seededRandom(sceneSeed + index * 104729);
  const fromLeft = variation() < 0.5;
  const size = Math.max(prominent ? 7 : 4, width * (prominent ? 0.0065 + variation() * 0.006 : 0.0035 + variation() * 0.003));
  const top = height * (0.16 + variation() * 0.68);
  const duration = prominent ? 19000 + variation() * 19000 : 30000 + variation() * 36000;
  const driftY = height * ((variation() - 0.5) * 0.18);
  const delay = index * 7100 + Math.floor(variation() * 5000);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(phase, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
      Animated.timing(phase, { toValue: 0, duration: 1, useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [delay, duration, index, phase, sceneSeed]);
  const translateX = phase.interpolate({ inputRange: [0, 1], outputRange: [0, fromLeft ? width * 1.18 : -width * 1.18] });
  const translateY = phase.interpolate({ inputRange: [0, 1], outputRange: [0, driftY] });
  const rotate = phase.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', `${55 + variation() * 95}deg`] });
  const opacity = phase.interpolate({ inputRange: [0, 0.08, 0.88, 1], outputRange: [0, prominent ? 0.9 : 0.64, prominent ? 0.8 : 0.6, 0] });
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: fromLeft ? -size : width, top, width: size, height: size * (0.72 + variation() * 0.24), borderRadius: size * 0.3, backgroundColor: prominent ? (index % 2 ? '#b47654' : '#e6b47a') : (index % 2 ? '#81909e' : '#a0aab4'), opacity, shadowColor: prominent ? '#ff9d54' : '#b8d2e8', shadowOpacity: prominent ? 0.95 : 0.7, shadowRadius: size * (prominent ? 0.95 : 0.6), transform: [{ translateX }, { translateY }, { rotate }] }} />;
}

function RainTrace({ width, height, index }: { width: number; height: number; index: number }) {
  const [phase] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(index * 790),
      Animated.timing(phase, { toValue: 1, duration: 7400 + index * 310, easing: Easing.linear, useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
      Animated.timing(phase, { toValue: 0, duration: 1, useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [index, phase]);
  const translateY = phase.interpolate({ inputRange: [0, 1], outputRange: [-height * 0.2, height * 0.9] });
  const opacity = phase.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 0.45, 0.32, 0] });
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: `${8 + (index * 17) % 88}%`, top: height * (0.08 + (index % 3) * 0.11), width: Math.max(1, width * 0.0012), height: height * (0.025 + (index % 2) * 0.018), backgroundColor: '#aee9ff', opacity, transform: [{ translateY }] }} />;
}

function DesertDust({ width, height, index }: { width: number; height: number; index: number }) {
  const [phase] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(index * 1750),
      Animated.timing(phase, { toValue: 1, duration: 18000 + index * 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
      Animated.timing(phase, { toValue: 0, duration: 1, useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [index, phase]);
  const opacity = phase.interpolate({ inputRange: [0, 0.12, 0.82, 1], outputRange: [0, 0.5, 0.35, 0] });
  const translateX = phase.interpolate({ inputRange: [0, 1], outputRange: [0, width * (0.08 + (index % 3) * 0.025)] });
  const translateY = phase.interpolate({ inputRange: [0, 1], outputRange: [0, -height * (0.035 + (index % 2) * 0.025)] });
  const size = 1 + (index % 3) * 0.5;
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: `${12 + (index * 19) % 78}%`, top: height * (0.54 + (index % 4) * 0.085), width: size, height: size, borderRadius: 99, backgroundColor: index % 2 ? '#ffe4b7' : '#d8f2ff', shadowColor: '#ffd49c', shadowOpacity: 0.8, shadowRadius: 5, opacity, transform: [{ translateX }, { translateY }] }} />;
}

function CometPass({ width, height, index }: { width: number; height: number; index: number }) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(index * 5200),
      Animated.timing(progress, { toValue: 1, duration: 17000 + index * 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
      Animated.timing(progress, { toValue: 0, duration: 1, useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [index, progress]);
  const fromLeft = index % 2 === 0;
  const travelX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, fromLeft ? width * 1.2 : -width * 1.2] });
  const travelY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, height * (index % 2 ? 0.07 : -0.06)] });
  const opacity = progress.interpolate({ inputRange: [0, 0.08, 0.84, 1], outputRange: [0, 0.58, 0.5, 0] });
  const streakWidth = Math.max(30, width * (0.09 + (index % 2) * 0.025));
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: fromLeft ? -streakWidth : width, top: height * (0.16 + index * 0.17), width: streakWidth, height: 1.5, borderRadius: 99, backgroundColor: '#d9edff', shadowColor: '#b7dcff', shadowOpacity: 0.95, shadowRadius: 6, opacity, transform: [{ translateX: travelX }, { translateY: travelY }, { rotateZ: fromLeft ? '-4deg' : '4deg' }] }} />;
}

function EclipseCorona({ width, height }: { width: number; height: number }) {
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 5100, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
      Animated.timing(pulse, { toValue: 0, duration: 5100, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const size = Math.min(width, height) * 0.18;
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.36] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.13] });
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: width * 0.28 - size / 2, top: height * 0.42 - size / 2, width: size, height: size, borderRadius: size, borderWidth: 2, borderColor: '#ffe3a0', opacity, shadowColor: '#ffd88e', shadowOpacity: 0.7, shadowRadius: size * 0.18, transform: [{ scale }] }} />;
}

function ShuttlePass({ width, height, trafficIndex, laneY, sizeMultiplier = 1, firstDelayStepMs = 8500, firstDelayJitterMs = 12000 }: { width: number; height: number; trafficIndex: number; laneY?: number; sizeMultiplier?: number; firstDelayStepMs?: number; firstDelayJitterMs?: number }) {
  const [progress] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(0));
  const [thrust] = useState(() => new Animated.Value(0));
  const [route, setRoute] = useState({ top: height * 0.45, direction: 1, arc: 0, drift: 0, shipIndex: 0, size: 1 });
  const ship = BRIDGE_SHIP_SKINS[route.shipIndex];
  const shuttleWidth = Math.max(24, width * 0.055 * route.size * sizeMultiplier);
  const shuttleHeight = shuttleWidth / ship.aspect;
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(thrust, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
      Animated.timing(thrust, { toValue: 0.35, duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [thrust]);
  useEffect(() => {
    if (width <= 0) return;
    let cancelled = false;
    let firstPass = true;
    const schedulePass = () => {
      const direction = Math.random() < 0.5 ? -1 : 1;
      const duration = 22000 + Math.random() * 26000;
      const top = laneY === undefined ? height * (0.12 + Math.random() * 0.76) : height * (laneY + (Math.random() - 0.5) * 0.035);
      const arc = (Math.random() < 0.5 ? -1 : 1) * height * (0.012 + Math.random() * 0.027);
      const drift = (Math.random() - 0.5) * height * 0.03;
      const shipIndex = Math.floor(Math.random() * BRIDGE_SHIP_SKINS.length);
      const size = 0.76 + Math.random() * 0.7;
      setRoute({ top, direction, arc, drift, shipIndex, size });
      progress.setValue(0);
      opacity.setValue(0);
      const delay = firstPass
        ? trafficIndex * firstDelayStepMs + Math.random() * firstDelayJitterMs
        : 9000 + Math.random() * 22000;
      firstPass = false;
      const fadeInMs = 1500;
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(progress, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.92, duration: fadeInMs, useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
            Animated.delay(duration - fadeInMs),
          ]),
        ]),
      ]).start(({ finished }) => {
        if (!finished || cancelled) return;
        // The sprite is fully beyond the window at progress=1. Hide it only
        // after the crossing ends, then schedule the next independent pass.
        opacity.setValue(0);
        schedulePass();
      });
    };
    schedulePass();
    return () => { cancelled = true; progress.stopAnimation(); opacity.stopAnimation(); };
  }, [firstDelayJitterMs, firstDelayStepMs, height, laneY, opacity, progress, trafficIndex, width]);
  const glowOpacity = thrust.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1] });
  const glowScale = thrust.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.38] });
  const pathStops = [0, 0.22, 0.5, 0.78, 1];
  const startX = route.direction > 0 ? -shuttleWidth : width + shuttleWidth;
  const exitX = route.direction > 0 ? width + shuttleWidth : -shuttleWidth;
  const midX = width / 2;
  const travelX = progress.interpolate({ inputRange: pathStops, outputRange: [startX, startX + (midX - startX) * 0.42, midX, midX + (exitX - midX) * 0.58, exitX] });
  const travelY = progress.interpolate({ inputRange: pathStops, outputRange: [0, route.arc, route.arc * -0.42, route.drift, route.drift * 0.65] });
  const bank = progress.interpolate({ inputRange: pathStops, outputRange: [0, route.direction * 1.4, route.direction * -0.8, route.direction * 0.6, 0].map(degrees => `${degrees}deg`) });
  // The shuttle art faces right, with its engines at the left. Flip the full
  // craft so the light and its short exhaust plume stay attached to the engine.
  return <Animated.View pointerEvents="none" style={[styles.shuttleTrack, { top: route.top, width: shuttleWidth, height: shuttleHeight, opacity, transform: [{ translateX: travelX }, { translateY: travelY }, { scaleX: route.direction }, { rotateZ: bank }] }]}>
    <Animated.View style={[styles.thrusterBloom, { left: shuttleWidth * 0.015, top: shuttleHeight * 0.395, width: shuttleWidth * 0.16, height: shuttleHeight * 0.19, opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
    <Animated.View style={[styles.thrusterPlume, { left: -shuttleWidth * 0.075, top: shuttleHeight * 0.48, width: shuttleWidth * 0.13, height: shuttleHeight * 0.035, opacity: glowOpacity }]} />
    <Animated.View style={[styles.thrusterCore, { left: shuttleWidth * 0.035, top: shuttleHeight * 0.46, width: shuttleWidth * 0.08, height: shuttleHeight * 0.08, opacity: glowOpacity }]} />
    <Image source={ship.source} resizeMode="contain" style={styles.shuttleArt} />
  </Animated.View>;
}

/** Renders a vista plate and its quiet, separately timed exterior motion. */
export function BridgeVistaRenderer({ source, ambience, sceneId = 'unnamed-vista', sceneName = '', left, top, width, height }: { source: ImageSourcePropType; ambience?: BridgeAmbienceProfile; sceneId?: string; sceneName?: string; left: number; top: number; width: number; height: number }) {
  const [fade] = useState(() => new Animated.Value(0));
  const [driftX] = useState(() => new Animated.Value(0));
  const [driftY] = useState(() => new Animated.Value(0));
  const [driftScale] = useState(() => new Animated.Value(1));
  const sceneSeed = hashSceneKey(`${sceneId}:${sceneName}`);
  const resolvedAmbience = ambience ?? inferAmbience(sceneId, sceneName, sceneSeed);
  useEffect(() => {
    fade.setValue(0);
    const animation = Animated.timing(fade, { toValue: 1, duration: 1100, useNativeDriver: USE_NATIVE_DRIVER });
    animation.start();
    return () => animation.stop();
  }, [fade, source]);
  useEffect(() => {
    if (width <= 0 || height <= 0) return;
    let cancelled = false;
    const random = seededRandom(sceneSeed);
    const nextLeg = () => {
      if (cancelled) return;
      driftX.stopAnimation(() => {
        driftY.stopAnimation(() => {
          driftScale.stopAnimation(() => {
            if (cancelled) return;
            // Change the drift character over time: long lateral glides,
            // slow vertical rolls, and wider diagonal voyages all remain
            // inside the overscan around the window mask.
            const routeStyle = Math.floor(random() * 4);
            const directionX = random() < 0.5 ? -1 : 1;
            const directionY = random() < 0.5 ? -1 : 1;
            const horizontalTravel = routeStyle === 0 ? 0.045 + random() * 0.05
              : routeStyle === 1 ? 0.015 + random() * 0.035
                : 0.03 + random() * 0.06;
            const verticalTravel = routeStyle === 0 ? 0.004 + random() * 0.018
              : routeStyle === 1 ? 0.035 + random() * 0.035
                : 0.014 + random() * 0.05;
            const targetX = directionX * width * horizontalTravel;
            const targetY = directionY * height * verticalTravel;
            const duration = 18000 + random() * 68000;
            const easingChoice = random();
            const easing = easingChoice < 0.25 ? Easing.inOut(Easing.quad)
              : easingChoice < 0.5 ? Easing.inOut(Easing.cubic)
                : Easing.inOut(Easing.sin);
            const animation = Animated.parallel([
              Animated.timing(driftX, { toValue: targetX, duration, easing, useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
              Animated.timing(driftY, { toValue: targetY, duration, easing, useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
              Animated.timing(driftScale, { toValue: 1.006 + random() * 0.036, duration, easing, useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
            ]);
            animation.start(({ finished }) => {
              if (!finished || cancelled) return;
              Animated.delay(250 + random() * 1450).start(({ finished: delayFinished }) => {
                if (delayFinished && !cancelled) nextLeg();
              });
            });
          });
        });
      });
    };
    driftX.setValue((random() < 0.5 ? -1 : 1) * width * (0.025 + random() * 0.055));
    driftY.setValue((random() < 0.5 ? -1 : 1) * height * (0.012 + random() * 0.045));
    driftScale.setValue(1.006 + random() * 0.036);
    nextLeg();
    return () => { cancelled = true; driftX.stopAnimation(); driftY.stopAnimation(); driftScale.stopAnimation(); };
  }, [driftScale, driftX, driftY, height, sceneSeed, width]);
  return <View pointerEvents="none" style={{ position: 'absolute', left, top, width, height, overflow: 'hidden' }}>
    {width > 0 && height > 0 && <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width, height, overflow: 'hidden' }, { opacity: fade }]}>
      <Animated.View style={{ position: 'absolute', left: '-12.5%', top: '-12.5%', width: '125%', height: '125%', transform: [{ translateX: driftX }, { translateY: driftY }, { scale: driftScale }] }}>
        <Animated.Image source={source} resizeMode="cover" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }} />
      </Animated.View>
      <View pointerEvents="none" style={styles.exteriorDecor}>
        {resolvedAmbience === 'deep-space' && <>
          <TwinklingStar left="12%" top="35%" size={2} delay={200} />
          <TwinklingStar left="26%" top="22%" size={2.5} delay={1700} tint="#fff0c3" />
          <TwinklingStar left="53%" top="17%" size={1.8} delay={800} />
          <TwinklingStar left="76%" top="37%" size={2.2} delay={3100} />
          <TwinklingStar left="88%" top="56%" size={1.7} delay={1300} />
          {Array.from({ length: 4 }, (_, trafficIndex) => <ShuttlePass key={`bridge-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
        </>}
        {resolvedAmbience === 'pelagic-megacity' && <>
          <SlowVeil width={width} height={height} top={0.2} delay={1200} tint="rgba(164,215,236,0.12)" />
          <SlowVeil width={width} height={height} top={0.58} delay={7900} tint="rgba(106,183,207,0.1)" />
          {Array.from({ length: 9 }, (_, index) => <RainTrace key={`pelagic-rain-${index}`} width={width} height={height} index={index} />)}
          <TwinklingStar left="12%" top="68%" size={2.4} delay={180} tint="#ffd38b" />
          <TwinklingStar left="34%" top="76%" size={2} delay={2300} tint="#ffcf79" />
          <TwinklingStar left="59%" top="65%" size={2.2} delay={1100} tint="#ffe3a6" />
          <TwinklingStar left="83%" top="79%" size={2.5} delay={3100} tint="#ffd38b" />
          {Array.from({ length: 3 }, (_, trafficIndex) => <ShuttlePass key={`pelagic-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
        </>}
        {resolvedAmbience === 'emberline-shipyard' && <>
          {[['14%', '36%', 2.4, 350, '#ffc36b'], ['39%', '57%', 2, 1500, '#84dfff'], ['68%', '31%', 2.6, 2800, '#ffca7b'], ['88%', '62%', 2, 900, '#9cdfff']].map(([left, top, size, delay, tint], index) => <TwinklingStar key={`yard-beacon-${index}`} left={left as `${number}%`} top={top as `${number}%`} size={size as number} delay={delay as number} tint={tint as string} />)}
          <SlowVeil width={width} height={height} top={0.48} delay={2400} tint="rgba(255,169,92,0.055)" />
          {Array.from({ length: 4 }, (_, trafficIndex) => <ShuttlePass key={`yard-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
        </>}
        {resolvedAmbience === 'nacre-ice-giant' && <>
          <SlowVeil width={width} height={height} top={0.28} delay={1800} tint="rgba(112,239,238,0.1)" />
          <SlowVeil width={width} height={height} top={0.64} delay={8400} tint="rgba(172,156,255,0.08)" />
          {Array.from({ length: 5 }, (_, index) => <TwinklingStar key={`nacre-ring-glint-${index}`} left={`${12 + index * 18}%`} top={`${54 + (index % 2) * 13}%`} size={index % 2 ? 2.4 : 1.8} delay={index * 1200} tint="#d8faff" />)}
          {Array.from({ length: 2 }, (_, trafficIndex) => <ShuttlePass key={`nacre-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
        </>}
        {resolvedAmbience === 'eventide-eclipse' && <>
          <EclipseCorona width={width} height={height} />
          {Array.from({ length: 5 }, (_, index) => <TwinklingStar key={`eventide-star-${index}`} left={`${8 + index * 19}%`} top={`${19 + (index % 3) * 24}%`} size={index % 2 ? 2.3 : 1.7} delay={index * 1450} tint={index % 2 ? '#dec9ff' : '#ffe1ad'} />)}
          <SlowVeil width={width} height={height} top={0.72} delay={3600} tint="rgba(187,145,230,0.065)" />
          {Array.from({ length: 2 }, (_, trafficIndex) => <ShuttlePass key={`eventide-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
        </>}
        {resolvedAmbience === 'glass-desert' && <>
          <SlowVeil width={width} height={height} top={0.79} delay={2100} tint="rgba(255,207,147,0.08)" />
          {Array.from({ length: 7 }, (_, index) => <DesertDust key={`desert-dust-${index}`} width={width} height={height} index={index} />)}
          <TwinklingStar left="16%" top="75%" size={2} delay={900} tint="#ffdba8" />
          <TwinklingStar left="72%" top="68%" size={1.8} delay={2400} tint="#c8eaff" />
        </>}
        {resolvedAmbience === 'pilgrim-beacons' && <>
          {[
            ['20%', '39%', 3.2, 100, '#ffc879'], ['31%', '56%', 2, 1200, '#9edcff'],
            ['48%', '43%', 2.4, 2200, '#ffd18b'], ['70%', '41%', 3, 700, '#83d9ff'],
            ['84%', '62%', 2.2, 1800, '#ffc879'],
          ].map(([left, top, size, delay, tint], index) => <TwinklingStar key={`beacon-pulse-${index}`} left={left as `${number}%`} top={top as `${number}%`} size={size as number} delay={delay as number} tint={tint as string} />)}
          <SlowVeil width={width} height={height} top={0.3} delay={4800} tint="rgba(105,165,227,0.055)" />
        </>}
        {resolvedAmbience === 'aurora-reef' && <>
          <SlowVeil width={width} height={height} top={0.24} delay={1400} tint="rgba(96,244,235,0.09)" />
          <SlowVeil width={width} height={height} top={0.52} delay={6800} tint="rgba(165,128,255,0.08)" />
          <SlowVeil width={width} height={height} top={0.76} delay={11200} tint="rgba(116,187,255,0.065)" />
          {Array.from({ length: 6 }, (_, index) => <TwinklingStar key={`reef-particle-${index}`} left={`${9 + index * 16}%`} top={`${26 + (index % 4) * 16}%`} size={index % 2 ? 2.1 : 1.6} delay={index * 830} tint={index % 2 ? '#8bfff1' : '#d3bfff'} />)}
        </>}
        {resolvedAmbience === 'comet-caravan' && <>
          {Array.from({ length: 4 }, (_, index) => <CometPass key={`comet-pass-${index}`} width={width} height={height} index={index} />)}
          {Array.from({ length: 5 }, (_, index) => <TwinklingStar key={`comet-glint-${index}`} left={`${14 + index * 17}%`} top={`${21 + (index % 3) * 25}%`} size={index % 2 ? 2 : 1.6} delay={index * 1100} tint="#d7ecff" />)}
        </>}
        {resolvedAmbience === 'blue-meridian' && <>
          <SlowVeil width={width} height={height} top={0.66} delay={2400} tint="rgba(127,211,255,0.065)" />
          {Array.from({ length: 5 }, (_, index) => <TwinklingStar key={`meridian-star-${index}`} left={`${11 + index * 19}%`} top={`${16 + (index % 3) * 18}%`} size={index % 2 ? 2.2 : 1.6} delay={index * 1370} tint="#c9efff" />)}
          {Array.from({ length: 2 }, (_, trafficIndex) => <ShuttlePass key={`meridian-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
        </>}
        {resolvedAmbience === 'vesper-horizon' && <>
          <SlowVeil width={width} height={height} top={0.72} delay={1700} tint="rgba(255,185,122,0.075)" />
          {Array.from({ length: 4 }, (_, index) => <TwinklingStar key={`vesper-star-${index}`} left={`${15 + index * 22}%`} top={`${20 + (index % 2) * 21}%`} size={index % 2 ? 2.4 : 1.8} delay={index * 1580} tint={index % 2 ? '#ffd59b' : '#b9e8ff'} />)}
          {Array.from({ length: 2 }, (_, trafficIndex) => <ShuttlePass key={`vesper-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
        </>}
        {resolvedAmbience === 'blueworld-patrol' && <>
          <SlowVeil width={width} height={height} top={0.63} delay={3400} tint="rgba(114,195,255,0.06)" />
          {Array.from({ length: 5 }, (_, index) => <TwinklingStar key={`patrol-star-${index}`} left={`${8 + index * 20}%`} top={`${15 + (index % 3) * 22}%`} size={index % 2 ? 2.1 : 1.6} delay={index * 1210} tint="#d7f2ff" />)}
          {Array.from({ length: 3 }, (_, trafficIndex) => <ShuttlePass key={`patrol-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
        </>}
        {resolvedAmbience === 'dawnward-escort' && <>
          <SlowVeil width={width} height={height} top={0.3} delay={2800} tint="rgba(132,205,255,0.055)" />
          {Array.from({ length: 5 }, (_, index) => <TwinklingStar key={`dawnward-star-${index}`} left={`${10 + index * 18}%`} top={`${17 + (index % 3) * 20}%`} size={index % 2 ? 2.1 : 1.6} delay={index * 1450} tint="#c6eaff" />)}
          <ShuttlePass width={width} height={height} trafficIndex={2} />
        </>}
        {resolvedAmbience === 'emberfall-frontier' && <>
          <SlowVeil width={width} height={height} top={0.73} delay={2200} tint="rgba(255,177,95,0.075)" />
          {Array.from({ length: 7 }, (_, index) => <DesertDust key={`emberfall-dust-${index}`} width={width} height={height} index={index} />)}
          {Array.from({ length: 4 }, (_, index) => <TwinklingStar key={`emberfall-beacon-${index}`} left={`${18 + index * 21}%`} top={`${48 + (index % 2) * 16}%`} size={index % 2 ? 2.4 : 1.8} delay={index * 1780} tint={index % 2 ? '#ffd09a' : '#ffb976'} />)}
        </>}
        {resolvedAmbience === 'leviathan-orbit' && <>
          <SlowVeil width={width} height={height} top={0.42} delay={5200} tint="rgba(134,202,255,0.055)" />
          {Array.from({ length: 6 }, (_, index) => <TwinklingStar key={`leviathan-star-${index}`} left={`${9 + index * 16}%`} top={`${14 + (index % 3) * 20}%`} size={index % 2 ? 2.2 : 1.6} delay={index * 1430} tint="#caeaff" />)}
          <ShuttlePass width={width} height={height} trafficIndex={3} />
        </>}
        {resolvedAmbience === 'nebula-clouds' && <>
          <NebulaCloudDrift width={width} height={height} index={0} tint="rgba(144,116,255,0.9)" sceneSeed={sceneSeed} />
          <NebulaCloudDrift width={width} height={height} index={1} tint="rgba(65,181,255,0.82)" sceneSeed={sceneSeed} />
          <NebulaCloudDrift width={width} height={height} index={2} tint="rgba(255,111,202,0.74)" sceneSeed={sceneSeed} />
          {Array.from({ length: 6 }, (_, index) => <TwinklingStar key={`nebula-star-${index}`} left={`${9 + index * 16}%`} top={`${14 + (index % 4) * 18}%`} size={index % 2 ? 2.3 : 1.6} delay={index * 1310} tint={index % 2 ? '#e5d6ff' : '#c5eaff'} />)}
        </>}
        {resolvedAmbience === 'asteroid-belt' && <>
          {Array.from({ length: 4 }, (_, index) => <DriftingAsteroid key={`asteroid-drift-${index}`} width={width} height={height} index={index} sceneSeed={sceneSeed} />)}
          {Array.from({ length: 3 }, (_, index) => <TwinklingStar key={`asteroid-star-${index}`} left={`${18 + index * 28}%`} top={`${23 + (index % 2) * 28}%`} size={1.7} delay={index * 1800} tint="#d9e6f2" />)}
        </>}
      </View>
    </Animated.View>}
  </View>;
}

const styles = StyleSheet.create({
  exteriorDecor: { ...StyleSheet.absoluteFill },
  star: { position: 'absolute', borderRadius: 10, shadowColor: '#b9edff', shadowOpacity: 0.9, shadowRadius: 7, elevation: 3 },
  shuttleTrack: { position: 'absolute', left: 0 },
  shuttleArt: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  thrusterBloom: { position: 'absolute', borderRadius: 99, backgroundColor: 'rgba(20,135,255,0.12)', shadowColor: '#178bff', shadowOpacity: 0.55, shadowRadius: 16, elevation: 8 },
  thrusterPlume: { position: 'absolute', borderRadius: 99, backgroundColor: 'rgba(45,174,255,0.48)', shadowColor: '#35aaff', shadowOpacity: 0.8, shadowRadius: 9, elevation: 9 },
  thrusterCore: { position: 'absolute', borderRadius: 99, backgroundColor: '#8be4ff', shadowColor: '#44c4ff', shadowOpacity: 1, shadowRadius: 8, elevation: 11 },
});
