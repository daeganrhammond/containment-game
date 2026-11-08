import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import type { RosterMember } from './progression';
import { CREW_ROLES } from './crew';

const WALK_LANES = {
  lanes: [
    [{ x: 0.355, y: 0.862 }, { x: 0.392, y: 0.902 }, { x: 0.364, y: 0.925 }],
    [{ x: 0.646, y: 0.925 }, { x: 0.681, y: 0.89 }, { x: 0.651, y: 0.858 }],
  ],
} as const;

type Props = { width: number; height: number; member: RosterMember; duty?: string; onAssign: (roleId: string) => void };

/** Generic pathing/status proxy. Future crew art plugs into this measured movement layer. */
export function BridgeCrewMember({ width, height, member, duty, onAssign }: Props) {
  const laneIndex = member.id.charCodeAt(member.id.length - 1) % 2;
  const anchors = WALK_LANES.lanes[laneIndex];
  const start = anchors[0];
  const [x] = useState(() => new Animated.Value(start.x * width));
  const [y] = useState(() => new Animated.Value(start.y * height));
  const [bob] = useState(() => new Animated.Value(0));
  const anchorIndex = useRef(0);
  const [facing, setFacing] = useState(1);
  const [open, setOpen] = useState(false);
  const [pulse] = useState(() => new Animated.Value(0.2));
  const role = CREW_ROLES.find(item => item.id === duty);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const move = () => {
      if (stopped) return;
      const current = anchors[anchorIndex.current];
      const nextIndex = (anchorIndex.current + 1) % anchors.length;
      const next = anchors[nextIndex];
      setFacing(next.x >= current.x ? 1 : -1);
      const duration = 2800 + Math.abs(next.x - current.x) * width * 9;
      Animated.parallel([
        Animated.timing(x, { toValue: next.x * width, duration, easing: Easing.inOut(Easing.cubic), useNativeDriver: false, isInteraction: false }),
        Animated.timing(y, { toValue: next.y * height, duration, easing: Easing.inOut(Easing.cubic), useNativeDriver: false, isInteraction: false }),
      ]).start(({ finished }) => {
        if (!finished || stopped) return;
        anchorIndex.current = nextIndex;
        timeout = setTimeout(move, 1200 + Math.random() * 2200);
      });
    };
    timeout = setTimeout(move, 1800 + Math.random() * 1800);
    const bobLoop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: -1.5, duration: 430, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(bob, { toValue: 0, duration: 430, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    bobLoop.start();
    return () => { stopped = true; if (timeout) clearTimeout(timeout); x.stopAnimation(); y.stopAnimation(); bobLoop.stop(); };
  }, [anchors, bob, height, width, x, y]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.58, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(pulse, { toValue: 0.2, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const markerSize = Math.max(18, height * 0.034);
  const skills = Object.entries(member.skills).filter(([, level]) => level > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([name]) => name).join(' · ');
  const dutyIndex = Math.max(0, CREW_ROLES.findIndex(item => item.id === duty));
  const nextRole = CREW_ROLES[(dutyIndex + (duty ? 1 : 0)) % CREW_ROLES.length];

  return <Animated.View pointerEvents="box-none" style={{ position: 'absolute', zIndex: 30, left: 0, top: 0, width: 1, height: 1, transform: [{ translateX: x }, { translateY: y }] }}>
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -markerSize * 0.42, top: -3, width: markerSize * 0.84, height: 3, borderRadius: 999, backgroundColor: 'rgba(5,9,12,0.72)', opacity: pulse, transform: [{ scaleX: 1.15 }] }} />
    <Pressable accessibilityRole="button" accessibilityLabel="Open generic crew duty marker" onPress={() => setOpen(value => !value)} style={{ position: 'absolute', left: -markerSize / 2, top: -markerSize, width: markerSize, height: markerSize, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ width: markerSize * 0.7, height: markerSize * 0.7, borderRadius: markerSize, borderWidth: 1, borderColor: 'rgba(127,235,221,0.9)', backgroundColor: 'rgba(19,69,71,0.92)', alignItems: 'center', justifyContent: 'center', transform: [{ translateY: bob }, { scaleX: facing }] }}><Text style={{ color: '#c7fff2', fontSize: 7, fontWeight: '900' }}>✦</Text></Animated.View>
    </Pressable>
    {open && <View style={{ position: 'absolute', left: markerSize * 0.65, top: -markerSize - 40, width: 150, padding: 7, borderWidth: 1, borderColor: 'rgba(111,212,207,0.72)', borderRadius: 7, backgroundColor: 'rgba(6,17,24,0.9)' }}>
      <Text style={{ color: '#73dfd2', fontSize: 6, fontWeight: '900', letterSpacing: 0.8 }}>CREW DUTY · GENERIC RECORD</Text>
      <Text numberOfLines={1} style={{ color: '#f1f5f2', fontSize: 10, fontWeight: '900', marginTop: 3 }}>{member.name}</Text>
      <Text numberOfLines={1} style={{ color: '#aebfc3', fontSize: 6, marginTop: 2 }}>{skills || 'NO CHARACTER DATA ASSIGNED'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Cycle crew duty" onPress={() => onAssign(nextRole.id)} style={{ marginTop: 5, paddingHorizontal: 5, paddingVertical: 4, borderWidth: 1, borderColor: '#496d68', borderRadius: 4, backgroundColor: 'rgba(18,48,45,0.9)' }}><Text style={{ color: '#c4f4e3', fontSize: 6, fontWeight: '900' }}>{role ? `${role.label} · ${role.station}` : 'ASSIGN DUTY'}  ↻</Text></Pressable>
    </View>}
  </Animated.View>;
}
