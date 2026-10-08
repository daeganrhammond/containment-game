import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import type { BridgeAmbienceProfile } from './bridgeVistaCatalog';
import { BRIDGE_SHIP_SKINS } from './bridgeShipCatalog';

// React Native Web has no native animation module. Select its JS driver
// explicitly so browser builds do not depend on the native-driver fallback.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

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

function ShuttlePass({ width, height, trafficIndex }: { width: number; height: number; trafficIndex: number }) {
  const [progress] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(0));
  const [thrust] = useState(() => new Animated.Value(0));
  const [route, setRoute] = useState({ top: height * 0.45, direction: 1, arc: 0, drift: 0, shipIndex: 0, size: 1 });
  const ship = BRIDGE_SHIP_SKINS[route.shipIndex];
  const shuttleWidth = Math.max(34, width * 0.055 * route.size);
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
      const top = height * (0.12 + Math.random() * 0.76);
      const arc = (Math.random() < 0.5 ? -1 : 1) * height * (0.012 + Math.random() * 0.027);
      const drift = (Math.random() - 0.5) * height * 0.03;
      const shipIndex = Math.floor(Math.random() * BRIDGE_SHIP_SKINS.length);
      const size = 0.76 + Math.random() * 0.7;
      setRoute({ top, direction, arc, drift, shipIndex, size });
      progress.setValue(0);
      opacity.setValue(0);
      const delay = firstPass
        ? trafficIndex * 8500 + Math.random() * 12000
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
  }, [height, opacity, progress, trafficIndex, width]);
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
export function BridgeVistaRenderer({ source, ambience, left, top, width, height }: { source: ImageSourcePropType; ambience?: BridgeAmbienceProfile; left: number; top: number; width: number; height: number }) {
  const [fade] = useState(() => new Animated.Value(0));
  const [driftX] = useState(() => new Animated.Value(0));
  const [driftY] = useState(() => new Animated.Value(0));
  const [driftScale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    fade.setValue(0);
    const animation = Animated.timing(fade, { toValue: 1, duration: 1100, useNativeDriver: USE_NATIVE_DRIVER });
    animation.start();
    return () => animation.stop();
  }, [fade, source]);
  useEffect(() => {
    if (width <= 0 || height <= 0) return;
    let cancelled = false;
    const nextLeg = () => {
      if (cancelled) return;
      driftX.stopAnimation(() => {
        driftY.stopAnimation(() => {
          driftScale.stopAnimation(() => {
            if (cancelled) return;
            const targetX = (Math.random() < 0.5 ? -1 : 1) * width * (0.04 + Math.random() * 0.03);
            const targetY = (Math.random() < 0.5 ? -1 : 1) * height * (0.02 + Math.random() * 0.02);
            const duration = 25000 + Math.random() * 40000;
            const animation = Animated.parallel([
              Animated.timing(driftX, { toValue: targetX, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
              Animated.timing(driftY, { toValue: targetY, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
              Animated.timing(driftScale, { toValue: 1.015 + Math.random() * 0.02, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER, isInteraction: false }),
            ]);
            animation.start(({ finished }) => { if (finished && !cancelled) nextLeg(); });
          });
        });
      });
    };
    driftX.setValue((Math.random() < 0.5 ? -1 : 1) * width * (0.04 + Math.random() * 0.03));
    driftY.setValue((Math.random() < 0.5 ? -1 : 1) * height * (0.02 + Math.random() * 0.02));
    driftScale.setValue(1.015 + Math.random() * 0.02);
    nextLeg();
    return () => { cancelled = true; driftX.stopAnimation(); driftY.stopAnimation(); driftScale.stopAnimation(); };
  }, [driftScale, driftX, driftY, height, width]);
  return <View pointerEvents="none" style={{ position: 'absolute', left, top, width, height, overflow: 'hidden' }}>
    {width > 0 && height > 0 && <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width, height, overflow: 'hidden' }, { opacity: fade }]}>
      <Animated.Image source={source} resizeMode="cover" style={{ position: 'absolute', left: '-12.5%', top: '-12.5%', width: '125%', height: '125%', transform: [{ translateX: driftX }, { translateY: driftY }, { scale: driftScale }] }} />
      <View pointerEvents="none" style={styles.exteriorDecor}>
        {ambience === 'deep-space' && <>
          <TwinklingStar left="12%" top="35%" size={2} delay={200} />
          <TwinklingStar left="26%" top="22%" size={2.5} delay={1700} tint="#fff0c3" />
          <TwinklingStar left="53%" top="17%" size={1.8} delay={800} />
          <TwinklingStar left="76%" top="37%" size={2.2} delay={3100} />
          <TwinklingStar left="88%" top="56%" size={1.7} delay={1300} />
          {Array.from({ length: 4 }, (_, trafficIndex) => <ShuttlePass key={`bridge-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
        </>}
        {ambience === 'pelagic-megacity' && <>
          <SlowVeil width={width} height={height} top={0.2} delay={1200} tint="rgba(164,215,236,0.12)" />
          <SlowVeil width={width} height={height} top={0.58} delay={7900} tint="rgba(106,183,207,0.1)" />
          {Array.from({ length: 9 }, (_, index) => <RainTrace key={`pelagic-rain-${index}`} width={width} height={height} index={index} />)}
          <TwinklingStar left="12%" top="68%" size={2.4} delay={180} tint="#ffd38b" />
          <TwinklingStar left="34%" top="76%" size={2} delay={2300} tint="#ffcf79" />
          <TwinklingStar left="59%" top="65%" size={2.2} delay={1100} tint="#ffe3a6" />
          <TwinklingStar left="83%" top="79%" size={2.5} delay={3100} tint="#ffd38b" />
          {Array.from({ length: 3 }, (_, trafficIndex) => <ShuttlePass key={`pelagic-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
        </>}
        {ambience === 'emberline-shipyard' && <>
          {[['14%', '36%', 2.4, 350, '#ffc36b'], ['39%', '57%', 2, 1500, '#84dfff'], ['68%', '31%', 2.6, 2800, '#ffca7b'], ['88%', '62%', 2, 900, '#9cdfff']].map(([left, top, size, delay, tint], index) => <TwinklingStar key={`yard-beacon-${index}`} left={left as `${number}%`} top={top as `${number}%`} size={size as number} delay={delay as number} tint={tint as string} />)}
          <SlowVeil width={width} height={height} top={0.48} delay={2400} tint="rgba(255,169,92,0.055)" />
          {Array.from({ length: 4 }, (_, trafficIndex) => <ShuttlePass key={`yard-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
        </>}
        {ambience === 'nacre-ice-giant' && <>
          <SlowVeil width={width} height={height} top={0.28} delay={1800} tint="rgba(112,239,238,0.1)" />
          <SlowVeil width={width} height={height} top={0.64} delay={8400} tint="rgba(172,156,255,0.08)" />
          {Array.from({ length: 5 }, (_, index) => <TwinklingStar key={`nacre-ring-glint-${index}`} left={`${12 + index * 18}%`} top={`${54 + (index % 2) * 13}%`} size={index % 2 ? 2.4 : 1.8} delay={index * 1200} tint="#d8faff" />)}
          {Array.from({ length: 2 }, (_, trafficIndex) => <ShuttlePass key={`nacre-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
        </>}
        {ambience === 'eventide-eclipse' && <>
          <EclipseCorona width={width} height={height} />
          {Array.from({ length: 5 }, (_, index) => <TwinklingStar key={`eventide-star-${index}`} left={`${8 + index * 19}%`} top={`${19 + (index % 3) * 24}%`} size={index % 2 ? 2.3 : 1.7} delay={index * 1450} tint={index % 2 ? '#dec9ff' : '#ffe1ad'} />)}
          <SlowVeil width={width} height={height} top={0.72} delay={3600} tint="rgba(187,145,230,0.065)" />
          {Array.from({ length: 2 }, (_, trafficIndex) => <ShuttlePass key={`eventide-traffic-${trafficIndex}`} width={width} height={height} trafficIndex={trafficIndex} />)}
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
