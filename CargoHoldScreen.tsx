import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARGO_CATALOG, isRefinable, moveCargoStack, packCargo, rotateCargoStack } from './cargo';
import type { CargoBalances, CargoItemId, CargoLayout, CargoMinimumKeep, CargoRefiningMode, CargoShapes, CargoStackBonuses } from './cargo';
import type { OverflowJob, PowerKind } from './mechanics';

export function CargoHoldScreen({ balances, renderIcon, onBack, overflowJobs = [], processingMs = 10_000, overflowChance = 50, layout, stackBonuses, shapes, minimumKeep = {}, onLayoutChange, onMinimumKeepChange, onCancelJob, refiningMode = 'overflow', recipeValues, onRefiningModeChange, onManualRefine }: {
  balances: CargoBalances;
  renderIcon: (itemId: CargoItemId, size: number) => React.ReactNode;
  onBack: () => void;
  overflowJobs?: OverflowJob[];
  processingMs?: number;
  overflowChance?: number;
  onCancelJob?: (jobId: number) => void;
  layout?: CargoLayout;
  stackBonuses?: CargoStackBonuses;
  shapes?: CargoShapes;
  minimumKeep?: CargoMinimumKeep;
  onLayoutChange: (layout: CargoLayout) => void;
  onMinimumKeepChange?: (itemId: 'life' | 'speed' | 'ram' | 'charge', quantity: number) => void;
  refiningMode?: CargoRefiningMode;
  recipeValues?: Partial<Record<PowerKind, number>>;
  onRefiningModeChange?: (mode: CargoRefiningMode) => void;
  onManualRefine?: (itemId: CargoItemId, quantity: number) => void;
}) {
  const cargo = packCargo(balances, undefined, layout, stackBonuses, shapes);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedStack = selected ? cargo.stacks.find(stack => stack.id === selected) : undefined;
  const selectedItem = selectedStack ? CARGO_CATALOG[selectedStack.itemId] : undefined;
  const [refineSelection, setRefineSelection] = useState<{ id: string | null; quantity: number }>({ id: null, quantity: 1 });
  const refineQuantity = refineSelection.id === selected ? refineSelection.quantity : 1;
  const setRefineQuantity = (quantity: number) => setRefineSelection({ id: selected, quantity });
  const selectedRefinerValue = selectedItem?.powerKind ? Math.max(0, recipeValues?.[selectedItem.powerKind] ?? selectedItem.refinerCreditsPerItem ?? 0) : 0;
  const defaultMinimum = selectedItem?.minKeep ?? 0;
  const protectedMinimum = selectedItem?.powerKind ? Math.max(defaultMinimum, Math.floor(minimumKeep[selectedItem.id as 'life' | 'speed' | 'ram' | 'charge'] ?? defaultMinimum)) : defaultMinimum;
  const reservedCount = selectedItem?.powerKind ? overflowJobs.filter(job => job.source === 'manual' && job.holdsCargo && job.kind === selectedItem.powerKind).length : 0;
  const refinableCount = selectedStack && selectedItem && isRefinable(selectedItem.id, recipeValues)
    ? Math.max(0, balances[selectedItem.id] - protectedMinimum - reservedCount)
    : 0;
  const queueRoom = Math.max(0, 20 - overflowJobs.length);
  const refineLimit = Math.min(refinableCount, queueRoom);
  const selectStack = (stackId: string) => setSelected(stackId);
  const moveStack = useCallback((stackId: string, dx: number, dy: number) => {
    const next = moveCargoStack(layout, cargo.stacks, stackId, dx, dy);
    if (next && next !== layout) onLayoutChange(next);
  }, [cargo.stacks, layout, onLayoutChange]);
  const rotateStack = useCallback((stackId: string) => {
    const next = rotateCargoStack(layout, cargo.stacks, stackId);
    if (next && next !== layout) onLayoutChange(next);
  }, [cargo.stacks, layout, onLayoutChange]);
  const totalItems = Object.values(balances).reduce((sum, count) => sum + count, 0);
  const reservedByStack = new Map<string, number>();
  for (const itemId of ['life', 'speed', 'ram', 'charge'] as const) {
    let reserved = overflowJobs.filter(job => job.source === 'manual' && job.holdsCargo && job.kind === itemId).length;
    for (const stack of cargo.stacks.filter(candidate => candidate.itemId === itemId)) {
      const amount = Math.min(stack.quantity, reserved);
      if (amount) reservedByStack.set(stack.id, amount);
      reserved -= amount;
    }
  }
  const activeKind = overflowJobs[0]?.kind;
  const activeCargoItem: CargoItemId | undefined = activeKind === 'life' || activeKind === 'speed' || activeKind === 'ram' || activeKind === 'charge' ? activeKind : undefined;
  return <View style={styles.scrim}>
    <View style={styles.panel}>
      <View style={styles.header}>
        <View><Text style={styles.kicker}>SHIP SYSTEMS · SHARED STORES</Text><Text style={styles.title}>Cargo Hold</Text><Text style={styles.subtitle}>Run cargo · organized by item footprint and stack limit</Text></View>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><Text style={styles.backText}>BACK</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator>
        <View style={styles.summaryRow}>
          <View style={styles.summary}><Text style={styles.summaryLabel}>ITEM UNITS</Text><Text style={styles.summaryValue}>{totalItems}</Text></View>
          <View style={styles.summary}><Text style={styles.summaryLabel}>STACKS</Text><Text style={styles.summaryValue}>{cargo.stacks.length}</Text></View>
          <View style={styles.summary}><Text style={styles.summaryLabel}>HOLD CELLS</Text><Text style={styles.summaryValue}>{cargo.usedCells} / {cargo.totalCells}</Text></View>
          <View style={[styles.summary, styles.summaryFoundry]}><Text style={styles.summaryLabel}>FOUNDRY</Text><Text style={styles.summaryValue}>{overflowJobs.length ? 'PROCESSING' : 'STANDBY'}</Text></View>
        </View>
        <View style={styles.content}>
          <View style={styles.gridColumn}>
            <View style={styles.gridHeading}><Text style={styles.sectionTitle}>RUN MANIFEST</Text><Text style={styles.hint}>STACKS PACKED BY FOOTPRINT</Text></View>
            <View style={styles.grid}>
              {Array.from({ length: cargo.totalCells }, (_, index) => <View key={`cell-${index}`} style={styles.emptyCell} />)}
              {cargo.stacks.map(stack => {
                const item = CARGO_CATALOG[stack.itemId];
                const active = selected === stack.id;
                const activeHeldJob = overflowJobs[0]?.holdsCargo && overflowJobs[0].kind === stack.itemId ? overflowJobs[0] : undefined;
                const activeProgress = activeHeldJob ? Math.max(0, Math.min(1, 1 - activeHeldJob.remainingMs / Math.max(1, activeHeldJob.durationMs ?? processingMs))) : 0;
                return <CargoStackCell key={stack.id} stack={stack} columns={cargo.grid.columns} rows={cargo.grid.rows} active={active} reserved={reservedByStack.get(stack.id) ?? 0} processingProgress={activeProgress} onSelect={selectStack} renderIcon={renderIcon} item={item} />;
              })}
            </View>
            {cargo.unplaced.length > 0 && <Text style={styles.bufferWarning}>{cargo.unplaced.length} stack{cargo.unplaced.length === 1 ? '' : 's'} need hold expansion or foundry handling. No cargo was discarded.</Text>}
          </View>
          <View style={styles.detail}>
            <Text style={styles.sectionTitle}>MANIFEST DETAILS</Text>
            {selectedItem && selectedStack ? <>
              <View style={styles.detailIcon}>{renderIcon(selectedItem.id, 58)}</View>
              <Text style={styles.detailName}>{selectedItem.name}</Text>
              <Text style={styles.detailCopy}>Quantity {selectedStack.quantity} · stack limit {selectedItem.stackLimit + Math.max(0, stackBonuses?.[selectedItem.id as keyof CargoStackBonuses] ?? 0)} · footprint {selectedStack.width} × {selectedStack.height} · {selectedStack.cells.length} cells{selectedStack.rotation ? ' · rotated' : ''}{reservedCount ? ` · ${reservedCount} in foundry, still aboard` : ''}</Text>
              {selectedRefinerValue ? <Text style={styles.recipe}>FOUNDRY RECIPE · {selectedRefinerValue} CREDITS / ITEM</Text> : <Text style={styles.noRecipe}>NO REFINERY RECIPE DEFINED</Text>}
              {selectedItem.powerKind && <View style={styles.keepControl}><View style={styles.keepCopy}><Text style={styles.keepTitle}>PROTECT FROM REFINING</Text><Text style={styles.keepDetail}>Keep at least this many in cargo · default {defaultMinimum}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Protect one fewer ${selectedItem.name}`} disabled={protectedMinimum <= defaultMinimum} onPress={() => onMinimumKeepChange?.(selectedItem.id as 'life' | 'speed' | 'ram' | 'charge', Math.max(defaultMinimum, protectedMinimum - 1))} style={[styles.keepStep, protectedMinimum <= defaultMinimum && styles.refineDisabled]}><Text style={styles.keepStepText}>−</Text></Pressable><Text style={styles.keepValue}>{protectedMinimum}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Protect one more ${selectedItem.name}`} disabled={protectedMinimum >= 9999} onPress={() => onMinimumKeepChange?.(selectedItem.id as 'life' | 'speed' | 'ram' | 'charge', Math.min(9999, protectedMinimum + 1))} style={[styles.keepStep, protectedMinimum >= 9999 && styles.refineDisabled]}><Text style={styles.keepStepText}>+</Text></Pressable></View>}
              {isRefinable(selectedItem.id, recipeValues) && <>
                <View style={styles.refineControl}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Refine one fewer item" disabled={refineQuantity <= 1} onPress={() => setRefineQuantity(Math.max(1, refineQuantity - 1))} style={[styles.refineStep, refineQuantity <= 1 && styles.refineDisabled]}><Text style={styles.refineStepText}>−</Text></Pressable>
                  <View style={styles.refineAmount}><Text style={styles.refineAmountValue}>{refineLimit ? Math.min(refineQuantity, refineLimit) : 0} / {refinableCount}</Text><Text style={styles.refineAmountLabel}>AVAILABLE · KEEP {protectedMinimum}{reservedCount ? ` · QUEUED ${reservedCount}` : ''}</Text></View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Refine one more item" disabled={refineQuantity >= refineLimit} onPress={() => setRefineQuantity(Math.min(refineLimit, refineQuantity + 1))} style={[styles.refineStep, refineQuantity >= refineLimit && styles.refineDisabled]}><Text style={styles.refineStepText}>+</Text></Pressable>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={refiningMode === 'manual' ? `Refine ${refineLimit ? Math.min(refineQuantity, refineLimit) : 0} ${selectedItem.name}` : 'Switch to manual refining'} disabled={refiningMode === 'manual' && (refineLimit < 1 || !onManualRefine)} onPress={() => refiningMode === 'manual' ? onManualRefine?.(selectedItem.id, Math.min(refineQuantity, refineLimit)) : onRefiningModeChange?.('manual')} style={[styles.refineButton, refiningMode === 'manual' && (refineLimit < 1 || !onManualRefine) && styles.refineDisabled]}><Text style={styles.refineButtonText}>{refiningMode === 'manual' ? 'REFINE SELECTED CARGO' : 'SWITCH TO MANUAL'}</Text><Text style={styles.refineButtonDetail}>{refiningMode === 'manual' ? `−${refineLimit ? Math.min(refineQuantity, refineLimit) : 0} · +${refineLimit ? Math.min(refineQuantity, refineLimit) * selectedRefinerValue : 0} CREDITS ON SUCCESS` : 'CHOOSE A STORED RESOURCE FIRST'}</Text></Pressable>
              </>}
              <Text style={styles.hint}>New stacks auto-pack. Use the arrows to rearrange this stack.</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Rotate cargo stack 90 degrees" onPress={() => rotateStack(selectedStack.id)} style={styles.rotateButton}><Text style={styles.rotateLabel}>↻  ROTATE 90°</Text></Pressable>
              <View style={styles.movePad}>
                <Pressable accessibilityRole="button" accessibilityLabel="Move cargo stack up" onPress={() => moveStack(selectedStack.id, 0, -1)} style={styles.moveButton}><Text style={styles.moveLabel}>↑</Text></Pressable>
                <View style={styles.moveRow}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Move cargo stack left" onPress={() => moveStack(selectedStack.id, -1, 0)} style={styles.moveButton}><Text style={styles.moveLabel}>←</Text></Pressable>
                  <View style={styles.moveCenter}><Text style={styles.hint}>MOVE</Text></View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Move cargo stack right" onPress={() => moveStack(selectedStack.id, 1, 0)} style={styles.moveButton}><Text style={styles.moveLabel}>→</Text></Pressable>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Move cargo stack down" onPress={() => moveStack(selectedStack.id, 0, 1)} style={styles.moveButton}><Text style={styles.moveLabel}>↓</Text></Pressable>
              </View>
            </> : <Text style={styles.detailEmpty}>Select an item stack to inspect its shape, limit, and any existing foundry recipe.</Text>}
            <View style={styles.detailRule} />
            <Text style={styles.sectionTitle}>FOUNDRY QUEUE</Text>
            <View style={styles.refiningModes}>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: refiningMode === 'overflow' }} onPress={() => onRefiningModeChange?.('overflow')} style={[styles.refiningMode, refiningMode === 'overflow' && styles.refiningModeActive]}><Text style={[styles.refiningModeText, refiningMode === 'overflow' && styles.refiningModeTextActive]}>OVERFLOW</Text><Text style={styles.refiningModeHint}>AUTO AT CAPACITY</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: refiningMode === 'manual' }} onPress={() => onRefiningModeChange?.('manual')} style={[styles.refiningMode, refiningMode === 'manual' && styles.refiningModeActive]}><Text style={[styles.refiningModeText, refiningMode === 'manual' && styles.refiningModeTextActive]}>MANUAL</Text><Text style={styles.refiningModeHint}>CHOOSE WHAT TO REFINE</Text></Pressable>
            </View>
            {overflowJobs[0] ? <>
              <View style={styles.queueActiveItem}>{activeCargoItem ? renderIcon(activeCargoItem, 34) : <Text style={styles.queueGlyph}>{CARGO_CATALOG[overflowJobs[0].kind as CargoItemId]?.glyph ?? '◇'}</Text>}<View style={styles.queueActiveCopy}><Text style={styles.detailName}>{overflowJobs[0].kind.toUpperCase()} · {overflowJobs[0].source === 'manual' ? 'MANUAL' : 'OVERFLOW'}</Text><Text style={styles.detailCopy}>{overflowJobs.length} item{overflowJobs.length === 1 ? '' : 's'} queued · {Math.ceil(processingMs / 1000)}s per item</Text></View></View>
              <Text style={styles.detailCopy}>Active yield: {overflowJobs[0].credits} Credits · {Math.round(overflowChance)}% success. Queue expectation: +{Math.floor(overflowJobs.reduce((sum, job) => sum + job.credits, 0) * Math.max(0, Math.min(100, overflowChance)) / 100)} Credits across {overflowJobs.length} jobs.</Text>
              <View style={styles.queueTrack}><View style={[styles.queueFill, { width: `${Math.max(0, Math.min(100, (1 - overflowJobs[0].remainingMs / Math.max(1, overflowJobs[0].durationMs ?? processingMs)) * 100))}%` }]} /></View>
              <Text style={styles.hint}>{Math.max(0, Math.ceil(overflowJobs[0].remainingMs / 1000))}s remaining · following items process in order. Held manual items leave cargo only at 100%.</Text>
              <View style={{ gap: 4, marginTop: 8 }}>{overflowJobs.slice(0, 4).map((job, index) => <View key={job.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, borderTopWidth: index ? 1 : 0, borderColor: '#263f4e' }}><Text style={{ flex: 1, color: '#a5bbca', fontSize: 7, fontWeight: '800' }}>{index ? 'QUEUED' : 'ACTIVE'} · {job.kind.toUpperCase()} · {job.source === 'manual' ? 'CARGO' : 'FEED'}{job.holdsCargo ? ' · HELD' : ''}</Text>{onCancelJob && <Pressable accessibilityRole="button" accessibilityLabel={`Cancel ${job.kind} foundry job`} onPress={() => onCancelJob(job.id)} style={{ paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#645558', borderRadius: 4 }}><Text style={{ color: '#e9aaa3', fontSize: 7, fontWeight: '900' }}>CANCEL</Text></Pressable>}</View>)}</View>
            </> : <Text style={styles.detailEmpty}>{refiningMode === 'overflow' ? 'Queue empty · new pickups beyond a resource limit are sent here automatically.' : 'Queue empty · at-capacity pickups remain on the board until you refine cargo or free storage.'}</Text>}
          </View>
        </View>
        <Text style={styles.footer}>CARGO HOLD · TEMPORARY STORES RESET WHEN A NEW RUN DEPARTS</Text>
      </ScrollView>
    </View>
  </View>;
}

function CargoStackCell({ stack, columns, rows, active, reserved = 0, processingProgress = 0, onSelect, renderIcon, item }: {
  stack: { id: string; itemId: CargoItemId; quantity: number; x: number; y: number; width: number; height: number; cells: number[]; rotation: 0 | 90 };
  columns: number; rows: number; active: boolean; reserved?: number; processingProgress?: number;
  onSelect: (stackId: string) => void;
  renderIcon: (itemId: CargoItemId, size: number) => React.ReactNode; item: (typeof CARGO_CATALOG)[CargoItemId];
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.name}, ${stack.quantity}${reserved ? `, ${reserved} being refined` : ''}`} onPress={() => onSelect(stack.id)} style={[styles.item, { left: `${stack.x / columns * 100}%`, top: `${stack.y / rows * 100}%`, width: `${stack.width / columns * 100}%`, height: `${stack.height / rows * 100}%` }]}>
    {/* Cell origins are fractions of the whole footprint; dividing by its dimensions keeps adjacent cells touching when rotated. */}
    {stack.cells.map(cell => <View key={`${stack.id}-cell-${cell}`} style={[styles.itemShapeCell, { left: `${(cell % stack.width) * 100 / stack.width}%`, top: `${Math.floor(cell / stack.width) * 100 / stack.height}%`, width: `${100 / stack.width}%`, height: `${100 / stack.height}%` }, active && styles.itemShapeCellActive]} />)}
    <View style={styles.itemContents}>{renderIcon(stack.itemId, 24)}<Text numberOfLines={1} style={styles.itemName}>{item.shortName}</Text></View>
    <Text style={styles.itemQuantity}>×{stack.quantity}</Text>
    {reserved > 0 && <><Text style={styles.itemRefiningTag}>FOUNDRY ×{reserved}</Text><View style={styles.itemRefiningTrack}><View style={[styles.itemRefiningFill, { width: `${processingProgress * 100}%` }]} /></View></>}
  </Pressable>;
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', zIndex: 90, left: 0, right: 0, top: 0, bottom: 0, padding: 12, backgroundColor: 'rgba(2,9,16,0.25)', alignItems: 'flex-end', justifyContent: 'center' },
  panel: { width: '74%', minWidth: 280, maxWidth: 1000, maxHeight: '100%', borderWidth: 1, borderColor: '#527080', borderRadius: 14, backgroundColor: 'rgba(7,19,30,0.88)', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderColor: '#203847' },
  kicker: { color: '#52ddc4', fontSize: 9, fontWeight: '900', letterSpacing: 2 }, title: { color: '#eef5ff', fontSize: 26, fontWeight: '900', marginTop: 4 }, subtitle: { color: '#91a9bc', fontSize: 11, marginTop: 2 },
  back: { paddingHorizontal: 17, paddingVertical: 11, borderWidth: 1, borderColor: '#385669', borderRadius: 7 }, backText: { color: '#9feadf', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  body: { padding: 16, gap: 14 }, summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, summary: { flexGrow: 1, minWidth: 105, padding: 10, borderWidth: 1, borderColor: '#244152', borderRadius: 8, backgroundColor: 'rgba(10,27,40,0.8)' }, summaryFoundry: { borderColor: '#715b32' }, summaryLabel: { color: '#8aa7ba', fontSize: 8, fontWeight: '900', letterSpacing: 1 }, summaryValue: { color: '#eff5ff', fontSize: 17, fontWeight: '900', marginTop: 4 },
  content: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, gridColumn: { flex: 1.5, minWidth: 220 }, gridHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }, sectionTitle: { color: '#54ddc6', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, hint: { color: '#71899a', fontSize: 8, lineHeight: 13 },
  grid: { width: '100%', aspectRatio: 10 / 8, position: 'relative', flexDirection: 'row', flexWrap: 'wrap', padding: 2, borderWidth: 1, borderColor: '#456577', borderRadius: 8, backgroundColor: 'rgba(5,13,21,0.88)' }, emptyCell: { width: '10%', height: '12.5%', borderWidth: 0.5, borderColor: '#122734', borderRadius: 3 },
  item: { position: 'absolute', margin: 2, alignItems: 'center', justifyContent: 'center' }, itemShapeCell: { position: 'absolute', borderWidth: 1, borderColor: '#4c7c86', borderRadius: 3, backgroundColor: '#102b34' }, itemShapeCellActive: { borderColor: '#63f2d6', backgroundColor: '#17413f' }, itemContents: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 2 }, itemName: { maxWidth: 50, color: '#afd6df', fontSize: 6, fontWeight: '900', letterSpacing: 0.5 }, itemQuantity: { position: 'absolute', right: 3, top: 2, color: '#d9ffb1', fontSize: 8, fontWeight: '900' }, itemRefiningTag: { position: 'absolute', left: 3, bottom: 4, color: '#ffc176', fontSize: 5, fontWeight: '900', letterSpacing: 0.2 }, itemRefiningTrack: { position: 'absolute', left: 3, right: 3, bottom: 2, height: 2, backgroundColor: '#1c2427', overflow: 'hidden' }, itemRefiningFill: { height: '100%', backgroundColor: '#f4ae5c' }, bufferWarning: { color: '#ffca75', fontSize: 9, marginTop: 8 },
  detail: { flex: 1, minWidth: 220, padding: 13, borderWidth: 1, borderColor: '#436173', borderRadius: 9, backgroundColor: 'rgba(9,27,40,0.84)' }, detailIcon: { height: 62, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, detailName: { color: '#f1f6ff', fontSize: 17, fontWeight: '900', textAlign: 'center', marginTop: 4 }, detailCopy: { color: '#a5bbca', fontSize: 10, lineHeight: 17, textAlign: 'center', marginTop: 7 }, keepControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 11, padding: 8, borderWidth: 1, borderColor: '#2d4b55', borderRadius: 6, backgroundColor: 'rgba(7,20,28,0.7)' }, keepCopy: { flex: 1 }, keepTitle: { color: '#84dcca', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 }, keepDetail: { color: '#8196a3', fontSize: 7, marginTop: 3 }, keepStep: { width: 24, height: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#365968', borderRadius: 4, backgroundColor: '#10232e' }, keepStepText: { color: '#b4f5e0', fontSize: 14, fontWeight: '900' }, keepValue: { minWidth: 22, color: '#eef5ff', textAlign: 'center', fontSize: 11, fontWeight: '900' }, queueActiveItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 }, queueActiveCopy: { maxWidth: '80%' }, queueGlyph: { color: '#a8f2df', fontSize: 26, fontWeight: '900' }, recipe: { color: '#8be3b6', fontSize: 8, fontWeight: '900', textAlign: 'center', marginTop: 10 }, noRecipe: { color: '#748da0', fontSize: 8, fontWeight: '900', textAlign: 'center', marginTop: 10 }, detailEmpty: { color: '#92a9ba', fontSize: 10, lineHeight: 16, marginTop: 10 }, detailRule: { height: 1, backgroundColor: '#263f4e', marginVertical: 13 }, refiningModes: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 9 }, refiningMode: { flex: 1, minWidth: 95, paddingHorizontal: 8, paddingVertical: 7, borderWidth: 1, borderColor: '#2b4655', borderRadius: 6, backgroundColor: 'rgba(5,16,24,0.72)' }, refiningModeActive: { borderColor: '#4d9d91', backgroundColor: 'rgba(20,54,57,0.72)' }, refiningModeText: { color: '#829bab', fontSize: 8, fontWeight: '900', letterSpacing: 0.6 }, refiningModeTextActive: { color: '#a8f2df' }, refiningModeHint: { color: '#758c99', fontSize: 6, marginTop: 3 }, refineControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 9 }, refineStep: { width: 26, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#365968', borderRadius: 5, backgroundColor: '#10232e' }, refineStepText: { color: '#b4f5e0', fontSize: 15, fontWeight: '800', lineHeight: 18 }, refineAmount: { minWidth: 105, alignItems: 'center' }, refineAmountValue: { color: '#eff8f6', fontSize: 10, fontWeight: '900' }, refineAmountLabel: { color: '#7b94a0', fontSize: 6, marginTop: 2 }, refineButton: { alignItems: 'center', marginTop: 7, paddingHorizontal: 8, paddingVertical: 7, borderWidth: 1, borderColor: '#4c8175', borderRadius: 5, backgroundColor: 'rgba(15,44,43,0.88)' }, refineButtonText: { color: '#a8f2df', fontSize: 7, fontWeight: '900', letterSpacing: 0.45 }, refineButtonDetail: { color: '#819e9e', fontSize: 6, marginTop: 3 }, refineDisabled: { opacity: 0.4 }, rotateButton: { alignSelf: 'center', marginTop: 9, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#557063', borderRadius: 5, backgroundColor: 'rgba(16,42,40,0.9)' }, rotateButtonDisabled: { opacity: 0.45 }, rotateLabel: { color: '#b6f5d4', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, rotateLabelDisabled: { color: '#82949a' }, movePad: { alignItems: 'center', gap: 4, marginTop: 8 }, moveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, moveButton: { width: 30, height: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#38596a', borderRadius: 5, backgroundColor: 'rgba(16,36,49,0.9)' }, moveLabel: { color: '#a9eee0', fontSize: 14, fontWeight: '900' }, moveCenter: { width: 45, alignItems: 'center' },
  footer: { color: '#607b8d', fontSize: 8, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginTop: 3 },
  queueTrack: { height: 7, marginTop: 12, overflow: 'hidden', borderRadius: 5, backgroundColor: '#142732' }, queueFill: { height: '100%', backgroundColor: '#58d8bd' },
});
