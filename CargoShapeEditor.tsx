import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CARGO_CATALOG, defaultCargoShape } from './cargo';
import type { CargoItemId, CargoShapes } from './cargo';

const ITEM_IDS = Object.keys(CARGO_CATALOG) as CargoItemId[];

export function CargoShapeEditor({ shapes, onChange }: { shapes: CargoShapes; onChange: (shapes: CargoShapes) => void }) {
  const [itemId, setItemId] = useState<CargoItemId>('speed');
  const [draft, setDraft] = useState<number[]>(shapes.speed?.cells ?? defaultCargoShape('speed').cells);
  const [notice, setNotice] = useState('Tap cells to draw the item footprint. Each filled cell uses one cargo cell.');
  const activeItem = CARGO_CATALOG[itemId];
  const saved = shapes[itemId]?.cells ?? defaultCargoShape(itemId).cells;
  const selectedCells = useMemo(() => draft, [draft]);
  const selectItem = (next: CargoItemId) => { setItemId(next); setDraft(shapes[next]?.cells ?? defaultCargoShape(next).cells); setNotice('Tap cells to draw the item footprint. Each filled cell uses one cargo cell.'); };
  const toggle = (cell: number) => {
    setDraft(current => current.includes(cell) ? current.filter(value => value !== cell) : [...current, cell].sort((a, b) => a - b));
    setNotice('Unsaved footprint · save when the shape is ready.');
  };
  const save = () => {
    if (!draft.length) { setNotice('An item must occupy at least one cargo cell.'); return; }
    const remaining = new Set(draft), queue = [draft[0]], visited = new Set<number>();
    while (queue.length) {
      const current = queue.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const x = current % 4, y = Math.floor(current / 4);
      for (const neighbor of [x > 0 ? current - 1 : -1, x < 3 ? current + 1 : -1, y > 0 ? current - 4 : -1, y < 3 ? current + 4 : -1]) if (neighbor >= 0 && remaining.has(neighbor) && !visited.has(neighbor)) queue.push(neighbor);
    }
    if (visited.size !== remaining.size) { setNotice('Connect every filled cell into one shape before saving.'); return; }
    onChange({ ...shapes, [itemId]: { cells: [...draft] } });
    setNotice(`${activeItem.name} footprint saved for this device and active run.`);
  };
  const reset = () => { const defaults = defaultCargoShape(itemId).cells; const next = { ...shapes }; delete next[itemId]; setDraft(defaults); onChange(next); setNotice(`${activeItem.name} reset to its built-in footprint.`); };
  const count = selectedCells.length;
  return <View>
    <View style={styles.header}><View><Text style={styles.kicker}>DEVELOPER TOOLS · CARGO CATALOG</Text><Text style={styles.title}>Cargo Shape Editor</Text><Text style={styles.copy}>Draw each item’s footprint on a 4 × 4 canvas. Changes affect cargo packing and pickup capacity.</Text></View></View>
    <View style={styles.body}>
      <Text style={styles.section}>SELECT ITEM</Text>
      <View style={styles.items}>{ITEM_IDS.map(id => <Pressable key={id} onPress={() => selectItem(id)} style={[styles.itemChoice, itemId === id && styles.itemChoiceActive]}><Text style={[styles.itemName, itemId === id && styles.itemNameActive]}>{CARGO_CATALOG[id].name}</Text><Text style={styles.itemFootprint}>{(shapes[id]?.cells ?? defaultCargoShape(id).cells).length} CELLS</Text></Pressable>)}</View>
      <View style={styles.editor}>
        <View style={styles.canvasColumn}><Text style={styles.section}>FOOTPRINT · {activeItem.name.toUpperCase()}</Text><View style={styles.canvas}>{Array.from({ length: 16 }, (_, cell) => <Pressable key={cell} accessibilityRole="button" accessibilityLabel={`Shape cell ${cell + 1}${selectedCells.includes(cell) ? ', occupied' : ', empty'}`} accessibilityState={{ selected: selectedCells.includes(cell) }} onPress={() => toggle(cell)} style={[styles.canvasCell, selectedCells.includes(cell) && styles.canvasCellFilled]}><Text style={styles.cellMark}>{selectedCells.includes(cell) ? activeItem.glyph : ''}</Text></Pressable>)}</View><Text style={styles.usage}>{count} / 16 CELLS · MAX FOOTPRINT 4 × 4</Text></View>
        <View style={styles.controls}><Text style={styles.selectedName}>{activeItem.name}</Text><Text style={styles.detail}>Stack limit {activeItem.stackLimit} · each filled square occupies one hold cell.</Text><Text style={styles.saved}>SAVED: {saved.length} CELLS</Text><Text style={styles.notice}>{notice}</Text><View style={styles.actions}><Pressable accessibilityRole="button" onPress={save} style={styles.save}><Text style={styles.saveText}>SAVE FOOTPRINT</Text></Pressable><Pressable accessibilityRole="button" onPress={reset} style={styles.reset}><Text style={styles.resetText}>RESET ITEM</Text></Pressable></View></View>
      </View>
      <Text style={styles.footer}>A saved footprint must be one connected shape. Existing cargo auto-packs around the new footprint; items that no longer fit remain visible as unplaced cargo.</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  header: { padding: 20, borderBottomWidth: 1, borderColor: '#233b4a' }, kicker: { color: '#53dbc5', fontSize: 9, fontWeight: '900', letterSpacing: 2 }, title: { color: '#eef5ff', fontSize: 25, fontWeight: '900', marginTop: 5 }, copy: { color: '#9ab0c0', fontSize: 11, lineHeight: 18, marginTop: 5, maxWidth: 760 }, body: { padding: 18, gap: 13 }, section: { color: '#54ddc6', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, items: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, itemChoice: { minWidth: 130, paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: '#2b4655', borderRadius: 6, backgroundColor: '#0b1b27' }, itemChoiceActive: { borderColor: '#56d9c2', backgroundColor: '#113333' }, itemName: { color: '#b7c6d1', fontSize: 9, fontWeight: '900' }, itemNameActive: { color: '#b4f5e5' }, itemFootprint: { color: '#7992a3', fontSize: 7, fontWeight: '800', marginTop: 3 }, editor: { flexDirection: 'row', flexWrap: 'wrap', gap: 22, alignItems: 'flex-start', marginTop: 8 }, canvasColumn: { width: 250 }, canvas: { width: 232, height: 232, marginTop: 8, padding: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 4, borderWidth: 1, borderColor: '#456577', borderRadius: 8, backgroundColor: '#050d15' }, canvasCell: { width: '22.5%', height: '22.5%', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#233c4b', borderRadius: 4, backgroundColor: '#0a1923' }, canvasCellFilled: { backgroundColor: '#145148', borderColor: '#53d8bd' }, cellMark: { color: '#bbffe9', fontSize: 17, fontWeight: '900' }, usage: { color: '#8299a8', fontSize: 8, fontWeight: '900', letterSpacing: 0.7, marginTop: 7 }, controls: { flex: 1, minWidth: 220, maxWidth: 500, padding: 14, borderWidth: 1, borderColor: '#2b4655', borderRadius: 8, backgroundColor: '#0a1b27' }, selectedName: { color: '#eef5ff', fontSize: 17, fontWeight: '900' }, detail: { color: '#9ab0bd', fontSize: 10, lineHeight: 17, marginTop: 8 }, saved: { color: '#8be3b6', fontSize: 8, fontWeight: '900', marginTop: 10 }, notice: { color: '#adc4d0', fontSize: 9, lineHeight: 15, marginTop: 9 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }, save: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 5, backgroundColor: '#51d7bd' }, saveText: { color: '#061a1d', fontSize: 8, fontWeight: '900', letterSpacing: 0.6 }, reset: { paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderColor: '#486373', borderRadius: 5 }, resetText: { color: '#b6c8d2', fontSize: 8, fontWeight: '900' }, footer: { color: '#7e94a3', fontSize: 9, lineHeight: 16, maxWidth: 850 },
});
