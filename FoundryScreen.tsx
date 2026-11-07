import React, { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARGO_CATALOG, isRefinable } from './cargo';
import type { CargoBalances, CargoItemId, CargoMinimumKeep } from './cargo';
import type { FoundryPayout, OverflowJob, PowerKind } from './mechanics';

const REFINABLE: ('life' | 'speed' | 'ram' | 'charge')[] = ['life', 'speed', 'ram', 'charge'];
const MARK: Record<CargoItemId, { glyph: string; tint: string }> = {
  life: { glyph: '♥', tint: '#ff718e' }, speed: { glyph: 'ϟ', tint: '#82d8ff' }, ram: { glyph: '✹', tint: '#f3bf69' }, charge: { glyph: '◈', tint: '#78e7d0' },
  credit: { glyph: '¢', tint: '#f2d075' }, 'power-bar': { glyph: '▥', tint: '#b79aff' }, 'merchant-token': { glyph: '✥', tint: '#f5a66e' }, 'engi-pod': { glyph: '▣', tint: '#9cdaa2' }, 'mount-assembly': { glyph: '⚙', tint: '#f2b66d' },
};

export function FoundryScreen({ balances, jobs, payouts, credits, minimumKeep = {}, processingMs, successChance, refiningMode, recipes, selectedItemId, onSelectItem, onQueue, onCancel, onModeChange, onOpenCargo, onCollectOutput, onClose, renderIcon }: {
  balances: CargoBalances; jobs: OverflowJob[]; payouts: FoundryPayout[]; credits: number; minimumKeep?: CargoMinimumKeep; processingMs: number; successChance: number;
  refiningMode: 'overflow' | 'manual'; recipes: Partial<Record<PowerKind, number>>;
  selectedItemId: 'life' | 'speed' | 'ram' | 'charge'; onSelectItem: (itemId: 'life' | 'speed' | 'ram' | 'charge') => void;
  onQueue: (itemId: CargoItemId, count: number) => void; onCancel: (jobId: number) => void;
  onModeChange: (mode: 'overflow' | 'manual') => void; onOpenCargo: () => void; onCollectOutput: () => void; onClose: () => void;
  renderIcon: (itemId: CargoItemId, size: number) => React.ReactNode;
}) {
  const [heat] = useState(() => new Animated.Value(0.35));
  const [spin] = useState(() => new Animated.Value(0));
  const active = jobs[0];
  const activeKind = REFINABLE.find(kind => kind === active?.kind);
  const activeItem = activeKind ? CARGO_CATALOG[activeKind] : undefined;
  const activeColor = activeKind ? MARK[activeKind].tint : '#6adbc2';
  const duration = Math.max(1, active?.durationMs ?? processingMs);
  const progress = active ? Math.max(0, Math.min(1, 1 - active.remainingMs / duration)) : 0;
  const breakup = activeItem?.refinerAnimation ?? 'dissolve';
  const itemOpacity = Math.max(0.05, 1 - progress * 0.96);
  const fragmentOpacity = Math.max(0, Math.min(1, (progress - 0.38) / 0.62));
  const readyCredits = payouts.reduce((sum, payout) => sum + Math.max(0, Math.floor(payout.credits)), 0);

  useEffect(() => {
    const heatLoop = Animated.loop(Animated.sequence([
      Animated.timing(heat, { toValue: 0.95, duration: 1150, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(heat, { toValue: 0.32, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    const spinLoop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true, isInteraction: false }));
    heatLoop.start(); spinLoop.start();
    return () => { heatLoop.stop(); spinLoop.stop(); };
  }, [heat, spin]);

  const queuedFor = (itemId: CargoItemId) => jobs.filter(job => job.source === 'manual' && job.holdsCargo && job.kind === itemId).length;
  const queueItems = REFINABLE.map(itemId => {
    const defaultKeep = CARGO_CATALOG[itemId].minKeep;
    const keep = Math.max(defaultKeep, Math.floor(minimumKeep[itemId] ?? defaultKeep));
    const reserved = queuedFor(itemId);
    const available = Math.max(0, balances[itemId] - keep - reserved);
    const hasRecipe = isRefinable(itemId, recipes);
    return { itemId, keep, reserved, available, hasRecipe };
  });
  const spinAngle = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return <View style={styles.scrim}>
    <View style={styles.panel}>
      <View style={styles.header}>
        <View><Text style={styles.kicker}>SHIP SYSTEMS · MATERIALS PROCESSING</Text><Text style={styles.title}>Foundry</Text><Text style={styles.subtitle}>Live feed · serial processing · {Math.ceil(processingMs / 1000)} seconds per item</Text></View>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}><Text style={styles.closeText}>RETURN TO BRIDGE</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator>
        <View style={styles.modeRow}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: refiningMode === 'overflow' }} onPress={() => onModeChange('overflow')} style={[styles.modeCard, refiningMode === 'overflow' && styles.modeActive]}><Text style={[styles.modeTitle, refiningMode === 'overflow' && styles.modeTitleActive]}>OVERFLOW FEED</Text><Text style={styles.modeCopy}>At-capacity pickups feed directly into the foundry queue.</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: refiningMode === 'manual' }} onPress={() => onModeChange('manual')} style={[styles.modeCard, refiningMode === 'manual' && styles.modeActive]}><Text style={[styles.modeTitle, refiningMode === 'manual' && styles.modeTitleActive]}>MANUAL SELECTION</Text><Text style={styles.modeCopy}>Choose stored items to refine while protecting your reserve.</Text></Pressable>
        </View>

        <View style={styles.workArea}>
          <View style={styles.forgeCard}>
            <View style={styles.forgeHeader}><Text style={styles.sectionTitle}>ACTIVE REFINING CELL</Text><Text style={styles.liveTag}>{active ? 'LIVE' : 'STANDBY'}</Text></View>
            <View style={styles.forgeVisual}>
              <Animated.View style={[styles.heatGlow, { opacity: heat, backgroundColor: `${activeColor}30` }]} />
              <View style={[styles.chamber, { borderColor: activeColor }]}>
                <Animated.View style={[styles.chamberRing, { borderColor: `${activeColor}9a`, transform: [{ rotate: spinAngle }] }]} />
                <View style={[styles.chamberInner, { borderColor: `${activeColor}77` }]}>
                  {activeKind ? <Animated.View style={{ opacity: itemOpacity, transform: [{ scale: 0.9 + progress * 0.55 }, { translateY: -progress * (breakup === 'dissolve' ? 15 : 4) }, { rotate: `${progress * (breakup === 'arc' ? 240 : breakup === 'shatter' ? 35 : 0)}deg` }] }}>{renderIcon(activeKind, 62)}</Animated.View> : <Text style={styles.standbyGlyph}>◇</Text>}
                  {activeKind && Array.from({ length: 8 }, (_, index) => {
                    const angle = index * Math.PI / 4;
                    const spread = (breakup === 'shatter' ? 30 : 22) * fragmentOpacity;
                    return <View key={`${active?.id}-fragment-${index}`} style={{ position: 'absolute', width: 4, height: 4, borderRadius: breakup === 'dissolve' ? 3 : 0, backgroundColor: activeColor, opacity: fragmentOpacity * 0.92, transform: [{ translateX: Math.cos(angle) * spread }, { translateY: Math.sin(angle) * spread }, { rotate: `${index * 45 + progress * 120}deg` }] }} />;
                  })}
                </View>
                <Animated.View style={[styles.chamberCore, { backgroundColor: activeColor, opacity: heat }]} />
              </View>
              <View style={styles.forgeLabels}><Text style={styles.activeMaterial}>{activeItem?.name ?? 'READY FOR MATERIAL'}</Text><Text style={styles.activeSource}>{active ? `${active.source === 'manual' ? 'CARGO RESERVE' : 'OVERFLOW PICKUP'} · ${Math.max(0, Math.ceil(active.remainingMs / 1000))}s REMAINING` : 'FEED HATCH SEALED · NO ACTIVE JOB'}</Text></View>
            </View>
            <View style={styles.progressHeader}><Text style={styles.progressLabel}>REFINING CYCLE</Text><Text style={styles.progressPercent}>{Math.floor(progress * 100)}%</Text></View>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: activeColor }]} /></View>
            <View style={styles.forgeFoot}><Text style={styles.forgeFootText}>YIELD SUCCESS · {Math.round(successChance)}%</Text><Text style={styles.forgeFootText}>{jobs.length ? `${jobs.length} IN FEED · SERIAL` : 'SERIAL CELL · READY'}</Text></View>
          </View>

          <View style={styles.queueCard}>
            <View style={styles.queueHeader}><Text style={styles.sectionTitle}>MATERIAL QUEUE</Text><Text style={styles.queueCount}>{jobs.length} JOB{jobs.length === 1 ? '' : 'S'}</Text></View>
            {jobs.length ? jobs.slice(0, 8).map((job, index) => {
              const kind = REFINABLE.find(itemId => itemId === job.kind);
              const tint = kind ? MARK[kind].tint : '#a8c2cb';
              const jobDuration = Math.max(1, job.durationMs ?? processingMs);
              const jobProgress = index === 0 ? progress : 0;
              return <View key={job.id} style={[styles.queueRow, index === 0 && styles.queueRowActive]}>
                <View style={[styles.queueNumber, { borderColor: `${tint}88` }]}><Text style={{ color: tint, fontSize: 9, fontWeight: '900' }}>{String(index + 1).padStart(2, '0')}</Text></View>
                {kind ? renderIcon(kind, 28) : <Text style={[styles.queueGlyph, { color: tint }]}>{MARK[job.kind as CargoItemId]?.glyph ?? '◇'}</Text>}
                <View style={styles.queueInfo}><Text numberOfLines={1} style={styles.queueName}>{job.kind.toUpperCase()} · {job.source === 'manual' ? 'MANUAL' : 'OVERFLOW'}</Text><Text style={styles.queueDetail}>{job.credits} CR ON SUCCESS · {index === 0 ? `${Math.floor(jobProgress * 100)}%` : `${Math.ceil(jobDuration / 1000)}s`}</Text>{index === 0 && <View style={styles.miniTrack}><View style={[styles.miniFill, { width: `${jobProgress * 100}%`, backgroundColor: tint }]} /></View>}</View>
                <Pressable accessibilityRole="button" accessibilityLabel={`Cancel ${job.kind} foundry job${job.holdsCargo ? ', return item to cargo' : ''}`} onPress={() => onCancel(job.id)} style={styles.cancelButton}><Text style={styles.cancelText}>×</Text></Pressable>
              </View>;
            }) : <View style={styles.emptyQueue}><Text style={styles.emptyGlyph}>⌁</Text><Text style={styles.emptyTitle}>FEED IS QUIET</Text><Text style={styles.emptyCopy}>Queued material will arrive here. Manual jobs stay visible in cargo until the cycle completes.</Text></View>}
            {jobs.length > 8 && <Text style={styles.moreQueue}>+ {jobs.length - 8} additional jobs in feed</Text>}
          </View>
        </View>

        <View style={styles.outputCard}>
          <View style={styles.outputCopy}><Text style={styles.sectionTitle}>OUTPUT TRAY · MANUAL COLLECTION</Text><Text style={styles.outputBalance}>RUN BALANCE · {Math.max(0, Math.floor(credits)).toLocaleString()} CR</Text><Text style={styles.outputDetail}>{readyCredits ? `${payouts.length} completed smelt${payouts.length === 1 ? '' : 's'} waiting · ${readyCredits} CR ready` : 'Completed smelts will wait here until collected.'}</Text></View>
          <View style={styles.outputItems}>{payouts.slice(0, 5).map(payout => <View key={payout.id} style={styles.outputItem}>{renderIcon('credit', 18)}<Text style={styles.outputItemText}>+{payout.credits}</Text></View>)}{payouts.length > 5 && <Text style={styles.moreQueue}>+{payouts.length - 5}</Text>}</View>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !readyCredits }} accessibilityLabel={readyCredits ? `Collect ${readyCredits} foundry credits` : 'No foundry credits ready to collect'} disabled={!readyCredits} onPress={onCollectOutput} style={[styles.collectButton, !readyCredits && styles.disabled]}><Text style={styles.collectButtonText}>{readyCredits ? `COLLECT +${readyCredits} CR` : 'TRAY EMPTY'}</Text></Pressable>
        </View>

        <View style={styles.resourceHeader}><View><Text style={styles.sectionTitle}>CARGO FEED SELECTOR</Text><Text style={styles.resourceHint}>Select a material here, then press the physical SMELT control on the bridge. Protected reserves stay aboard.</Text></View><Pressable accessibilityRole="button" onPress={onOpenCargo} style={styles.cargoLink}><Text style={styles.cargoLinkText}>OPEN CARGO HOLD ›</Text></Pressable></View>
        <View style={styles.resources}>
          {queueItems.map(({ itemId, keep, reserved, available, hasRecipe }) => <View key={itemId} style={[styles.resourceCard, selectedItemId === itemId && styles.resourceCardSelected]}>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedItemId === itemId }} accessibilityLabel={`Select ${CARGO_CATALOG[itemId].name} as bridge foundry material`} onPress={() => onSelectItem(itemId)} style={styles.resourceSelect}>
              <View style={styles.resourceIcon}>{renderIcon(itemId, 34)}</View>
              <View style={styles.resourceCopy}><Text style={styles.resourceName}>{CARGO_CATALOG[itemId].name}</Text><Text style={styles.resourceDetail}>{balances[itemId]} aboard · {keep} protected · {reserved} queued</Text><Text style={styles.resourceRecipe}>{selectedItemId === itemId ? 'SELECTED FOR BRIDGE SMELT BUTTON' : hasRecipe ? `${recipes[CARGO_CATALOG[itemId].powerKind!] ?? CARGO_CATALOG[itemId].refinerCreditsPerItem ?? 0} CREDITS ON SUCCESS` : 'NO ACTIVE RECIPE'}</Text></View>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Queue one ${CARGO_CATALOG[itemId].name} for refining`} disabled={!available || !hasRecipe || refiningMode !== 'manual'} onPress={() => onQueue(itemId, 1)} style={[styles.queueOne, (!available || !hasRecipe || refiningMode !== 'manual') && styles.disabled]}><Text style={styles.queueOneText}>＋ 1</Text><Text style={styles.queueOneHint}>{refiningMode === 'manual' ? `${available} AVAILABLE` : 'SELECT MANUAL'}</Text></Pressable>
          </View>)}
        </View>
        <Text style={styles.footer}>A COMPLETED CYCLE CONSUMES ITS MATERIAL. FAILED YIELDS CONSUME THE MATERIAL WITHOUT CREDIT PAYOUT. CANCELED JOBS RETURN THEIR MATERIAL TO STORES.</Text>
      </ScrollView>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', zIndex: 150, left: 0, right: 0, top: 0, bottom: 0, padding: 12, backgroundColor: 'rgba(2,8,13,0.18)', alignItems: 'flex-end', justifyContent: 'center' },
  panel: { width: '79%', minWidth: 310, maxWidth: 1120, maxHeight: '96%', borderWidth: 1, borderColor: '#597581', borderRadius: 12, backgroundColor: 'rgba(5,16,24,0.91)', overflow: 'hidden', shadowColor: '#53e0c0', shadowOpacity: 0.14, shadowRadius: 22 },
  header: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#29414b', backgroundColor: 'rgba(7,22,30,0.9)' },
  kicker: { color: '#59dcc4', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, title: { color: '#eff7f5', fontSize: 24, fontWeight: '900', marginTop: 3 }, subtitle: { color: '#b1c2c6', fontSize: 10, marginTop: 3 },
  close: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#43616e', borderRadius: 5, backgroundColor: 'rgba(8,22,31,0.88)' }, closeText: { color: '#a7e9db', fontSize: 8, fontWeight: '900', letterSpacing: 0.6 }, body: { padding: 14, gap: 12 },
  modeRow: { flexDirection: 'row', gap: 8 }, modeCard: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#2e4853', borderRadius: 6, backgroundColor: 'rgba(7,20,28,0.82)' }, modeActive: { borderColor: '#59b8a8', backgroundColor: 'rgba(16,48,48,0.84)' }, modeTitle: { color: '#b2c3c7', fontSize: 9, fontWeight: '900', letterSpacing: 0.65 }, modeTitleActive: { color: '#a4f0dc' }, modeCopy: { color: '#a3b3b8', fontSize: 9, marginTop: 5, lineHeight: 14 },
  outputCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderColor: '#6c5b3a', borderRadius: 8, backgroundColor: 'rgba(35,27,15,0.74)' }, outputCopy: { flex: 1, minWidth: 0 }, outputBalance: { color: '#ffe1a0', fontSize: 11, fontWeight: '900', marginTop: 5 }, outputDetail: { color: '#c0c7b7', fontSize: 9, marginTop: 4 }, outputItems: { flexDirection: 'row', alignItems: 'center', gap: 4 }, outputItem: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 4, paddingVertical: 3, borderWidth: 1, borderColor: '#755c31', borderRadius: 4, backgroundColor: 'rgba(67,47,18,0.6)' }, outputItemText: { color: '#ffe0a0', fontSize: 8, fontWeight: '900' }, collectButton: { minWidth: 98, paddingHorizontal: 10, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#c49c50', borderRadius: 5, backgroundColor: 'rgba(98,68,22,0.75)' }, collectButtonText: { color: '#ffe6ab', fontSize: 9, fontWeight: '900' },
  workArea: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, forgeCard: { flex: 1.1, minWidth: 250, padding: 12, borderWidth: 1, borderColor: '#526670', borderRadius: 8, backgroundColor: 'rgba(10,24,32,0.88)' }, forgeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { color: '#63ddc7', fontSize: 9, fontWeight: '900', letterSpacing: 1 }, liveTag: { color: '#f2bd74', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, forgeVisual: { minHeight: 128, flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 7, overflow: 'hidden' }, heatGlow: { position: 'absolute', left: 22, top: 16, width: 120, height: 96, borderRadius: 70 }, chamber: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 50, backgroundColor: '#07131a' }, chamberRing: { position: 'absolute', width: 78, height: 78, borderWidth: 1, borderRadius: 40, borderStyle: 'dashed' }, chamberInner: { width: 65, height: 65, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 34, backgroundColor: 'rgba(8,26,34,0.9)' }, chamberCore: { position: 'absolute', bottom: 12, width: 7, height: 7, borderRadius: 5 }, standbyGlyph: { color: '#78929a', fontSize: 34 }, forgeLabels: { flex: 1, gap: 5 }, activeMaterial: { color: '#eef6f2', fontSize: 14, fontWeight: '900' }, activeSource: { color: '#b1c2c6', fontSize: 9, lineHeight: 14, fontWeight: '800', letterSpacing: 0.35 }, progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }, progressLabel: { color: '#b1c1c5', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }, progressPercent: { color: '#a8f0d8', fontSize: 10, fontWeight: '900' }, progressTrack: { height: 9, marginTop: 5, borderWidth: 1, borderColor: '#355660', borderRadius: 5, backgroundColor: '#07141c', overflow: 'hidden' }, progressFill: { height: '100%', borderRadius: 4 }, forgeFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }, forgeFootText: { color: '#9aafb4', fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  queueCard: { flex: 1, minWidth: 245, maxHeight: 285, padding: 11, borderWidth: 1, borderColor: '#354f5b', borderRadius: 8, backgroundColor: 'rgba(6,18,26,0.88)' }, queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }, queueCount: { color: '#c0cdd0', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 }, queueRow: { minHeight: 47, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 5, borderTopWidth: 1, borderColor: '#243b46' }, queueRowActive: { backgroundColor: 'rgba(25,53,54,0.42)' }, queueNumber: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 5, backgroundColor: '#0b1d24' }, queueGlyph: { width: 28, textAlign: 'center', fontSize: 20 }, queueInfo: { flex: 1, minWidth: 0 }, queueName: { color: '#e3efec', fontSize: 9, fontWeight: '900' }, queueDetail: { color: '#b1c1c5', fontSize: 8, marginTop: 4 }, miniTrack: { height: 3, marginTop: 4, borderRadius: 2, backgroundColor: '#12252d', overflow: 'hidden' }, miniFill: { height: '100%' }, cancelButton: { width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#645558', borderRadius: 5, backgroundColor: 'rgba(51,25,29,0.5)' }, cancelText: { color: '#e9aaa3', fontSize: 18, lineHeight: 21 }, emptyQueue: { flex: 1, minHeight: 150, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }, emptyGlyph: { color: '#74b9aa', fontSize: 28 }, emptyTitle: { color: '#d7e7e2', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 4 }, emptyCopy: { color: '#aab9bd', fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 5 }, moreQueue: { color: '#b1c1c5', fontSize: 8, textAlign: 'center', paddingTop: 5 },
  resourceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, resourceHint: { color: '#aab9bd', fontSize: 8, marginTop: 4 }, cargoLink: { paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: '#3e625e', borderRadius: 5, backgroundColor: 'rgba(13,41,39,0.7)' }, cargoLinkText: { color: '#9ee8d4', fontSize: 8, fontWeight: '900', letterSpacing: 0.35 }, resources: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, resourceCard: { flexGrow: 1, flexBasis: 240, minWidth: 210, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 65, padding: 8, borderWidth: 1, borderColor: '#2d4652', borderRadius: 6, backgroundColor: 'rgba(8,22,30,0.82)' }, resourceCardSelected: { borderColor: '#74e6c7', backgroundColor: 'rgba(13,43,42,0.9)' }, resourceSelect: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }, resourceIcon: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#294953', borderRadius: 5, backgroundColor: 'rgba(8,20,28,0.9)' }, resourceCopy: { flex: 1, minWidth: 0 }, resourceName: { color: '#e7f1ee', fontSize: 9, fontWeight: '900' }, resourceDetail: { color: '#b3c1c4', fontSize: 8, marginTop: 4 }, resourceRecipe: { color: '#9ce5c6', fontSize: 8, fontWeight: '900', marginTop: 4, letterSpacing: 0.2 }, queueOne: { minWidth: 75, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 7, borderWidth: 1, borderColor: '#4f9785', borderRadius: 5, backgroundColor: 'rgba(17,49,44,0.8)' }, queueOneText: { color: '#a9f0d8', fontSize: 9, fontWeight: '900' }, queueOneHint: { color: '#a5c2b5', fontSize: 7, marginTop: 3 }, disabled: { opacity: 0.4 }, footer: { color: '#91a4aa', fontSize: 7, lineHeight: 11, textAlign: 'center', fontWeight: '800', letterSpacing: 0.25 },
});
