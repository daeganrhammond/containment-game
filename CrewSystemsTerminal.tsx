import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CompanionPet } from './mechanics';
import type { PetAssignmentPlan, PetDutyWork, RetrieverPickupId } from './pets';
import { PET_CARGO_HELPER_SPEED_PER_LEVEL_PERCENT, PET_COMPANION_RECOVERY_PER_RUN, PET_DUTIES, PET_PROFICIENCY_CAP, PET_SYSTEMS_HELPER_BASE_COOLDOWN_MS, PET_SYSTEMS_HELPER_COOLDOWN_REDUCTION_PER_LEVEL_MS, PET_SYSTEMS_HELPER_MIN_COOLDOWN_MS, RETRIEVER_PICKUP_TYPES, assignPetDuties, createPetAssignmentPlan, setRetrieverPickupAllowed } from './pets';
import type { RosterMember } from './progression';
import { CREW_ROLES } from './crew';

type Tab = 'crew' | 'pets';
type Props = {
  crew: RosterMember[];
  crewCapacity: number;
  crewAssignments: Record<string, string>;
  crewInvitePending: boolean;
  pets: CompanionPet[];
  permanentPets: RosterMember[];
  permanentPetCount: number;
  petCapacity: number;
  petAssignments: Record<string, PetAssignmentPlan>;
  petDutyWork: PetDutyWork;
  elapsedMs: number;
  crewCompanionRecoveryUsed: boolean;
  onAssignCrew: (memberId: string, roleId: string) => void;
  onAssignPet: (petId: number, plan: PetAssignmentPlan) => void;
  onFlightRecords: () => void;
  onClose: () => void;
};

const PICKUP_LABELS: Record<RetrieverPickupId, string> = { life: '♥ LIFE', speed: '◉ SPEED', ram: '◈ RAM', charge: '✦ CHARGE', credit: '◉ CREDIT' };

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.choice, active && styles.choiceActive]}><Text numberOfLines={1} style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></Pressable>;
}

export function CrewSystemsTerminal(props: Props) {
  const [tab, setTab] = useState<Tab>('crew');
  const { crew, crewCapacity, crewAssignments, crewInvitePending, pets, permanentPets, permanentPetCount, petCapacity, petAssignments, petDutyWork, elapsedMs, crewCompanionRecoveryUsed } = props;

  return <View style={styles.anchor}>
    <View style={styles.frame}>
      <View style={styles.header}>
        <View style={styles.headingCopy}><Text style={styles.eyebrow}>SHIP SYSTEMS · PERSONNEL</Text><Text style={styles.heading}>Crew Systems</Text></View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" onPress={props.onFlightRecords} style={styles.recordsButton}><Text style={styles.actionText}>⌁ LOG</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Close Crew Systems terminal" onPress={props.onClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
        </View>
      </View>
      <View style={styles.tabs}>
        <Choice label={`✧ CREW · ${crew.length}/${crewCapacity}`} active={tab === 'crew'} onPress={() => setTab('crew')} />
        <Choice label={`◉ PETS · ${permanentPetCount}/${petCapacity}`} active={tab === 'pets'} onPress={() => setTab('pets')} />
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {tab === 'crew' ? <>
          <Text style={styles.sectionTitle}>ROSTER · RUN DUTIES</Text>
          {!crew.length && <Text style={styles.empty}>{crewInvitePending ? 'A crew invitation is waiting in Flight Records.' : 'No permanent crew records yet. A future recruit can be accepted from Flight Records.'}</Text>}
          {crew.map(member => {
            const dutyId = crewAssignments[member.id];
            const duty = CREW_ROLES.find(value => value.id === dutyId);
            return <View key={member.id} style={styles.recordCard}>
              <View style={styles.recordHeader}><View style={styles.genericGlyph}><Text style={styles.glyphText}>✧</Text></View><View style={styles.recordCopy}><Text style={styles.recordTitle}>{member.name}</Text><Text style={styles.recordMeta}>{duty ? `${duty.label} · ${duty.station}` : 'NO DUTY ASSIGNED'}</Text></View><Text style={styles.statusDot}>●</Text></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>{CREW_ROLES.map(role => <Choice key={role.id} label={role.label} active={dutyId === role.id} onPress={() => props.onAssignCrew(member.id, role.id)} />)}</ScrollView>
              <Text style={styles.note}>Duty setup only · character-specific abilities are deferred.</Text>
            </View>;
          })}
        </> : <>
          <Text style={styles.sectionTitle}>ACTIVE RUN · ASSIGNMENTS</Text>
          <Text style={styles.summary}>SHIP ROSTER {permanentPetCount}/{petCapacity} · ON THIS RUN {pets.length}</Text>
          {!pets.length && <Text style={styles.empty}>No companions are traveling on this run. Existing Engi/Waldo acquisition remains unchanged.</Text>}
          {pets.map(pet => {
            const plan = petAssignments[String(pet.id)] ?? createPetAssignmentPlan();
            const rosterRecord = permanentPets.find(member => member.id === pet.rosterId);
            const activeRetriever = plan.primary === 'retriever' || plan.backup === 'retriever';
            const activeSpotter = plan.primary === 'spotter' || plan.backup === 'spotter';
            const activeCargoHelper = pet.health > 0 && (plan.primary === 'cargo-helper' || plan.backup === 'cargo-helper');
            const activeCrewCompanion = pet.health > 0 && (plan.primary === 'crew-companion' || plan.backup === 'crew-companion');
            const activeSystemsHelper = pet.health > 0 && (plan.primary === 'systems-helper' || plan.backup === 'systems-helper');
            const retrieverWork = petDutyWork[String(pet.id)]?.retriever ?? 0;
            const retrieverProficiency = rosterRecord?.proficiency.retriever ?? 0;
            const spotterWork = petDutyWork[String(pet.id)]?.spotter ?? 0;
            const spotterProficiency = rosterRecord?.proficiency.spotter ?? 0;
            const cargoHelperWork = petDutyWork[String(pet.id)]?.['cargo-helper'] ?? 0;
            const cargoHelperProficiency = Math.min(PET_PROFICIENCY_CAP, rosterRecord?.proficiency['cargo-helper'] ?? pet.dutyProficiency?.['cargo-helper'] ?? 0);
            const companionWork = petDutyWork[String(pet.id)]?.['crew-companion'] ?? 0;
            const companionProficiency = Math.min(PET_PROFICIENCY_CAP, rosterRecord?.proficiency['crew-companion'] ?? pet.dutyProficiency?.['crew-companion'] ?? 0);
            const systemsHelperWork = petDutyWork[String(pet.id)]?.['systems-helper'] ?? 0;
            const systemsHelperProficiency = Math.min(PET_PROFICIENCY_CAP, rosterRecord?.proficiency['systems-helper'] ?? pet.dutyProficiency?.['systems-helper'] ?? 0);
            const systemsHelperCooldownMs = Math.max(PET_SYSTEMS_HELPER_MIN_COOLDOWN_MS, PET_SYSTEMS_HELPER_BASE_COOLDOWN_MS - systemsHelperProficiency * PET_SYSTEMS_HELPER_COOLDOWN_REDUCTION_PER_LEVEL_MS);
            const systemsHelperWaitMs = Math.max(0, (pet.systemsHelperReadyAtMs ?? 0) - elapsedMs);
            return <View key={pet.id} style={styles.recordCard}>
              <View style={styles.recordHeader}><View style={styles.genericGlyph}><Text style={styles.glyphText}>◉</Text></View><View style={styles.recordCopy}><Text style={styles.recordTitle}>{pet.name}</Text><Text style={styles.recordMeta}>{pet.species.toUpperCase()} · LEVEL {pet.level} · RUN ONLY</Text></View><Text style={styles.statusDot}>●</Text></View>
              <Text style={styles.fieldLabel}>PRIMARY DUTY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>{PET_DUTIES.map(duty => <Choice key={duty.id} label={duty.label} active={plan.primary === duty.id} onPress={() => props.onAssignPet(pet.id, assignPetDuties(plan, duty.id, plan.backup))} />)}</ScrollView>
              <Text style={styles.fieldLabel}>BACKUP / IDLE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}><Choice label="IDLE" active={!plan.backup} onPress={() => props.onAssignPet(pet.id, assignPetDuties(plan, plan.primary, null))} />{PET_DUTIES.filter(duty => duty.id !== plan.primary).map(duty => <Choice key={duty.id} label={duty.label} active={plan.backup === duty.id} onPress={() => props.onAssignPet(pet.id, assignPetDuties(plan, plan.primary, duty.id))} />)}</ScrollView>
              <Text style={styles.fieldLabel}>PICKUP PERMISSION · RETRIEVER ONLY</Text>
              <View style={styles.filterGrid}>{RETRIEVER_PICKUP_TYPES.map(kind => <Choice key={kind} label={PICKUP_LABELS[kind]} active={plan.retrieverFilters.includes(kind)} onPress={() => props.onAssignPet(pet.id, setRetrieverPickupAllowed(plan, kind, !plan.retrieverFilters.includes(kind)))} />)}</View>
              {activeRetriever && <Text style={styles.training}>RETRIEVAL · {retrieverWork} RECOVERED THIS RUN · PROFICIENCY {retrieverProficiency}/{5}</Text>}
              {activeSpotter && <Text style={styles.training}>SPOTTED · {spotterWork} VISIBLE EVENTS THIS RUN · PROFICIENCY {spotterProficiency}/{5}</Text>}
              {activeCargoHelper && <Text style={styles.training}>FOUNDRY ASSIST · {cargoHelperProficiency * PET_CARGO_HELPER_SPEED_PER_LEVEL_PERCENT}% FASTER · {cargoHelperWork} JOBS COMPLETED · PROFICIENCY {cargoHelperProficiency}/{PET_PROFICIENCY_CAP}</Text>}
              {activeCrewCompanion && <Text style={styles.training}>COMPANION · +{PET_COMPANION_RECOVERY_PER_RUN} LIFE AT A CLEAR IF MISSING · {crewCompanionRecoveryUsed ? 'USED THIS RUN' : 'READY'} · PROFICIENCY {companionProficiency}/{PET_PROFICIENCY_CAP} · {companionWork} RECOVERIES</Text>}
              {activeSystemsHelper && <Text style={styles.training}>SYSTEMS · WALL SAVE {systemsHelperWaitMs ? `IN ${Math.ceil(systemsHelperWaitMs / 1000)}s` : 'READY'} · {systemsHelperWork} REPAIRS · PROFICIENCY {systemsHelperProficiency}/{PET_PROFICIENCY_CAP} · {Math.round(systemsHelperCooldownMs / 1000)}s RESET</Text>}
              <Text style={styles.note}>{activeSystemsHelper ? 'A living assigned helper catches one wall-breaking hit, then waits for its cooldown. Higher proficiency shortens the wait; unassigned pets do not repair walls.' : activeCrewCompanion ? 'At the first stage clear with a missing life, one assigned living companion restores a life once per run. Multiple companions do not stack the recovery.' : activeSpotter ? 'Spotter reports visible phase hazards, rare contacts, and stage clears. Hidden route outcomes stay concealed.' : activeRetriever ? 'Retriever is active for selected ordinary pickups only. Cargo space is checked and each item uses the standard destination transfer.' : activeCargoHelper ? `Cargo Helper shortens newly queued foundry cycles by ${PET_CARGO_HELPER_SPEED_PER_LEVEL_PERCENT}% per permanent proficiency level, up to ${PET_PROFICIENCY_CAP}%. Completed credits remain in the output tray for player collection.` : 'All five duty contracts are available. Assign a living pet to activate its run behavior.'} Rare and event rewards are never retrieved.</Text>
            </View>;
          })}
        </>}
      </ScrollView>
      <View style={styles.footer}><Text style={styles.footerText}>ASSIGNMENTS ARE RUN-LOCAL · NO AUTOMATIC RECRUITMENT OR RESOURCE CREATION</Text></View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', zIndex: 200, left: '2.8%', top: '70.8%', width: '36.5%', height: '27.2%', transform: [{ rotate: '-3deg' }], padding: 1 },
  frame: { flex: 1, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(112,223,214,0.72)', borderRadius: 8, backgroundColor: 'rgba(4,14,22,0.92)', shadowColor: '#55d8c7', shadowOpacity: 0.28, shadowRadius: 9, elevation: 8 },
  header: { minHeight: 33, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(81,163,166,0.32)', backgroundColor: 'rgba(8,29,38,0.74)' },
  headingCopy: { flex: 1 }, eyebrow: { color: '#6ee5d5', fontSize: 6, fontWeight: '900', letterSpacing: 1 }, heading: { color: '#edf8f5', fontSize: 12, fontWeight: '900', marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 4, alignItems: 'center' }, recordsButton: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#486a78' }, actionText: { color: '#b9dcea', fontSize: 6, fontWeight: '900' }, closeButton: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#526b74', borderRadius: 10 }, closeText: { color: '#d4e6e8', fontSize: 14, lineHeight: 16 },
  tabs: { flexDirection: 'row', paddingHorizontal: 6, paddingTop: 4, gap: 4 }, choice: { borderWidth: 1, borderColor: 'rgba(83,119,128,0.72)', borderRadius: 4, backgroundColor: 'rgba(7,20,29,0.78)', paddingHorizontal: 6, paddingVertical: 4, minHeight: 20, justifyContent: 'center' }, choiceActive: { borderColor: '#64dfcb', backgroundColor: 'rgba(15,61,58,0.88)' }, choiceText: { color: '#97b6bf', fontSize: 6, fontWeight: '900', letterSpacing: 0.3 }, choiceTextActive: { color: '#c5fff1' },
  body: { flex: 1 }, bodyContent: { paddingHorizontal: 7, paddingTop: 5, paddingBottom: 6, gap: 5 }, sectionTitle: { color: '#85dad0', fontSize: 6, fontWeight: '900', letterSpacing: 0.8 }, summary: { color: '#9ab8c1', fontSize: 6, fontWeight: '900' }, empty: { color: '#c0d1d3', fontSize: 7, lineHeight: 11, paddingVertical: 5 },
  recordCard: { padding: 6, borderWidth: 1, borderColor: 'rgba(68,112,124,0.66)', borderRadius: 5, backgroundColor: 'rgba(7,24,32,0.84)', gap: 4 }, recordHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 }, genericGlyph: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#579f9c', backgroundColor: '#102e36' }, glyphText: { color: '#a9f8e8', fontSize: 10, fontWeight: '900' }, recordCopy: { flex: 1 }, recordTitle: { color: '#eff8f6', fontSize: 8, fontWeight: '900' }, recordMeta: { color: '#8cb3be', fontSize: 6, fontWeight: '800', marginTop: 1 }, statusDot: { color: '#72e1c4', fontSize: 8 }, choiceRow: { flexDirection: 'row', gap: 3, paddingRight: 3 }, fieldLabel: { color: '#82c7ce', fontSize: 5, fontWeight: '900', letterSpacing: 0.5, marginTop: 1 }, filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 }, training: { color: '#b5f3dd', fontSize: 5, fontWeight: '900', letterSpacing: 0.3 }, note: { color: '#8ca4aa', fontSize: 5, lineHeight: 8 }, footer: { minHeight: 17, justifyContent: 'center', paddingHorizontal: 7, borderTopWidth: 1, borderTopColor: 'rgba(81,163,166,0.3)', backgroundColor: 'rgba(3,11,18,0.76)' }, footerText: { color: '#78b9b7', fontSize: 5, fontWeight: '900', letterSpacing: 0.35 },
});
