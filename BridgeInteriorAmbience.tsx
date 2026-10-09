import React, { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

type Props = {
  width: number;
  height: number;
  themeValue: string;
  scoreValue: string;
  playModeValue: string;
  navConsoleOpen: boolean;
  onThemes: () => void;
  onScores: () => void;
  onPlayMode: () => void;
  onNavConsole: () => void;
};

// The touch targets and screen graphics are normalized to the bridge artwork canvas.
const SCREEN_FACES = [
  { key: 'themes', x: 0.134, y: 0.722, w: 0.081, h: 0.08, angle: '-7deg', glyph: '✦', title: 'THEMES', color: '#75e8db' },
  { key: 'scores', x: 0.222, y: 0.705, w: 0.102, h: 0.083, angle: '-4deg', glyph: '⌁', title: 'SCORES', color: '#94bbff' },
  { key: 'playMode', x: 0.678, y: 0.705, w: 0.106, h: 0.083, angle: '4deg', glyph: '◈', title: 'PLAY MODE', color: '#f6cd7c' },
  { key: 'navConsole', x: 0.787, y: 0.722, w: 0.089, h: 0.08, angle: '7deg', glyph: '⇥', title: 'NAV CONSOLE', color: '#8ed4ff' },
] as const;

type ScreenKey = typeof SCREEN_FACES[number]['key'];

function ScreenActivity({ kind, color, width, height }: { kind: ScreenKey; color: string; width: number; height: number }) {
  const [motion] = useState(() => new Animated.Value(0));
  const [bars] = useState(() => Array.from({ length: 5 }, () => new Animated.Value(0.25)));
  useEffect(() => {
    const duration = kind === 'themes' ? 8400 : kind === 'scores' ? 1700 : kind === 'playMode' ? 4600 : 6800;
    const loop = Animated.loop(Animated.timing(motion, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true, isInteraction: false }));
    loop.start();
    const barLoops = bars.map((bar, index) => {
      const animation = Animated.loop(Animated.sequence([
        Animated.delay(index * 150),
        Animated.timing(bar, { toValue: 0.4 + ((index * 17) % 5) * 0.12, duration: 650 + index * 130, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
        Animated.timing(bar, { toValue: 0.25, duration: 800 + (4 - index) * 110, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      ]));
      if (kind === 'scores') animation.start();
      return animation;
    });
    return () => { loop.stop(); barLoops.forEach(animation => animation.stop()); };
  }, [bars, kind, motion]);

  const small = Math.max(5, Math.min(width * 0.18, height * 0.26));
  const ringSize = Math.max(14, Math.min(width * 0.38, height * 0.52));
  const rotate = motion.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const sweep = motion.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.18, width * 0.28] });

  if (kind === 'themes') return <View pointerEvents="none" style={{ height, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: ringSize * 1.8, height: ringSize, borderRadius: ringSize, borderWidth: 1, borderColor: `${color}66`, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: ringSize * 0.7, height: ringSize * 0.7, borderRadius: ringSize, borderWidth: 1, borderColor: `${color}55`, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: small * 0.5, height: small * 0.5, borderRadius: small, backgroundColor: color, opacity: 0.85 }} />
      </View>
      <Animated.View style={{ position: 'absolute', width: ringSize * 1.8, height: ringSize, transform: [{ rotate }] }}>
        <View style={{ position: 'absolute', top: -2, left: '48%', width: 4, height: 4, borderRadius: 4, backgroundColor: '#e4fff9', shadowColor: color, shadowOpacity: 0.9, shadowRadius: 3 }} />
      </Animated.View>
    </View>
    <View style={{ position: 'absolute', left: '12%', right: '12%', top: '50%', height: 1, backgroundColor: `${color}33` }} />
  </View>;

  if (kind === 'scores') return <View pointerEvents="none" style={{ height, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: Math.max(3, width * 0.035), paddingBottom: height * 0.14 }}>
    {bars.map((bar, index) => <View key={index} style={{ height: '72%', width: Math.max(3, width * 0.07), justifyContent: 'flex-end', borderBottomWidth: 1, borderColor: `${color}66` }}>
      <Animated.View style={{ height: '100%', backgroundColor: `${color}33`, borderTopWidth: 1, borderColor: color, transform: [{ scaleY: bar }], opacity: bar }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: color, opacity: 0.8 }} />
    </View>)}
  </View>;

  if (kind === 'playMode') return <View pointerEvents="none" style={{ height, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: '78%', height: Math.max(8, height * 0.3), flexDirection: 'row', borderWidth: 1, borderColor: `${color}77`, borderRadius: 3, overflow: 'hidden' }}>
      {['E', 'N', 'H'].map((label, index) => <View key={label} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: index < 2 ? 1 : 0, borderColor: `${color}44`, backgroundColor: index === 1 ? `${color}19` : 'transparent' }}><Text style={{ color: `${color}bb`, fontSize: Math.max(5, small * 0.48), fontWeight: '900' }}>{label}</Text></View>)}
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, width: '24%', borderWidth: 1, borderColor: color, backgroundColor: `${color}18`, transform: [{ translateX: sweep }] }} />
    </View>
    <View style={{ marginTop: 3, flexDirection: 'row', gap: 3 }}><View style={{ width: 2, height: 2, borderRadius: 2, backgroundColor: color }} /><View style={{ width: 10, height: 1, backgroundColor: `${color}88` }} /><View style={{ width: 4, height: 1, backgroundColor: `${color}55` }} /></View>
  </View>;

  return <View pointerEvents="none" style={{ height, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: ringSize * 1.22, height: ringSize * 1.22, borderRadius: ringSize, borderWidth: 1, borderColor: `${color}66`, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: `${color}44` }} />
      <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: `${color}44` }} />
      <View style={{ width: '48%', height: '48%', borderRadius: ringSize, borderWidth: 1, borderColor: `${color}55` }} />
      <Animated.View style={{ position: 'absolute', top: 1, bottom: '50%', left: '50%', width: 1, backgroundColor: color, transformOrigin: 'bottom', transform: [{ rotate }] }} />
      <Animated.View style={{ position: 'absolute', top: '25%', left: '68%', width: 3, height: 3, borderRadius: 3, backgroundColor: '#eaffff', opacity: motion.interpolate({ inputRange: [0, 0.35, 0.55, 1], outputRange: [0.35, 1, 0.45, 0.35] }) }} />
    </View>
  </View>;
}

function ConsoleScreen({ width, height, angle, glyph, title, value, color, kind, onPress, accessibleLabel }: {
  width: number; height: number; angle: string; glyph: string; title: string; value: string; color: string;
  kind: ScreenKey; onPress: () => void; accessibleLabel: string;
}) {
  const labelHeight = Math.max(18, height * 0.3);
  const activityHeight = Math.max(1, height - labelHeight);
  return <View pointerEvents="box-none" style={{ position: 'absolute', width, height }}>
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', borderRadius: 3, transform: [{ rotate: angle }], backgroundColor: 'rgba(3,18,27,0.84)', borderWidth: 1, borderColor: `${color}aa` }}>
      <ScreenActivity kind={kind} color={color} width={width} height={activityHeight} />
      <View style={{ height: labelHeight, borderTopWidth: 1, borderColor: `${color}44`, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Math.max(3, width * 0.035), paddingHorizontal: 2 }}>
        <Text style={{ color, fontSize: Math.max(7, Math.min(13, labelHeight * 0.72)), fontWeight: '900' }}>{glyph}</Text>
        <View style={{ alignItems: 'flex-start', minWidth: 0, flexShrink: 1 }}>
          <Text numberOfLines={1} style={{ color: '#e3f1f5', fontSize: Math.max(5, Math.min(8, labelHeight * 0.35)), fontWeight: '900', letterSpacing: 0.45 }}>{title}</Text>
          <Text numberOfLines={1} style={{ color, fontSize: Math.max(5, Math.min(8, labelHeight * 0.34)), fontWeight: '800', marginTop: 1 }}>{value}</Text>
        </View>
      </View>
    </View>
    <Pressable pointerEvents="auto" accessibilityRole="button" accessibilityLabel={accessibleLabel} onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, transform: [{ rotate: angle }] }} />
  </View>;
}

/** Four distinct idle holograms double as the bridge's Themes, Scores, Play Mode, and Bay Navigation controls. */
export function BridgeInteriorAmbience({ width, height, themeValue, scoreValue, playModeValue, navConsoleOpen, onThemes, onScores, onPlayMode, onNavConsole }: Props) {
  const actions = [onThemes, onScores, onPlayMode, onNavConsole];
  const values = [themeValue, scoreValue, playModeValue, navConsoleOpen ? 'CLOSE BAY' : 'OPEN BAY'];
  const labels = ['Open Themes', 'Open Scores', 'Open Play Mode', navConsoleOpen ? 'Close Bay Navigation Console' : 'Open Bay Navigation Console'];
  return <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, width, height, overflow: 'visible' }}>
    {SCREEN_FACES.map((screen, index) => <View key={screen.key} pointerEvents="box-none" style={{ position: 'absolute', left: width * screen.x, top: height * screen.y, width: width * screen.w, height: height * screen.h }}>
      <ConsoleScreen width={width * screen.w} height={height * screen.h} angle={screen.angle} glyph={screen.glyph} title={screen.title} value={values[index]} color={screen.color} kind={screen.key} onPress={actions[index]} accessibleLabel={labels[index]} />
    </View>)}
  </View>;
}
