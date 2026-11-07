import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CaptainLogReport } from './captainLog';
import type { ScoreEntry } from './mechanics';
import type { PersistentProfile } from './progression';

type Props = { scores: ScoreEntry[]; reports: CaptainLogReport[]; profile: PersistentProfile; saveStatus: 'idle' | 'saving' | 'saved' | 'error'; onRetry: () => void; onAcceptCrewInvite: () => void; onDeclineCrewInvite: () => void; onAdoptPet: (offerId: string) => void; onReleasePet: (offerId: string) => void; onClose: () => void };
type Tab = 'best' | 'archive';

function dateLabel(timestamp: number) {
  try { return new Date(timestamp).toLocaleString(); } catch { return 'DATE UNAVAILABLE'; }
}

function formatScore(entry: ScoreEntry) { return `${entry.score} · STAGE ${String(entry.level).padStart(2, '0')}`; }

export function CaptainLogScreen({ scores, reports, profile, saveStatus, onRetry, onAcceptCrewInvite, onDeclineCrewInvite, onAdoptPet, onReleasePet, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('best');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const reportById = useMemo(() => new Map(reports.map(report => [report.id, report])), [reports]);
  const selected = selectedId ? reportById.get(selectedId) : undefined;

  return <View style={styles.scrim}>
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{selected ? 'FLIGHT RECORD · SEALED COPY' : 'COMMAND ARCHIVE · TOP FIVE + RUN HISTORY'}</Text>
          <Text style={styles.title}>{selected ? 'Captain’s Log' : 'Flight Records'}</Text>
          <Text style={styles.subhead}>{selected ? dateLabel(selected.recordedAt) : 'Ranked scores and the complete archive of recorded run reports.'}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => selected ? setSelectedId(null) : onClose()} style={styles.backButton}>
          <Text style={styles.backText}>{selected ? 'RECORDS' : 'HOME'}</Text>
        </Pressable>
      </View>

      {saveStatus === 'saving' && <Text style={styles.saveNotice}>Sealing your run report…</Text>}
      {saveStatus === 'error' && <Pressable accessibilityRole="button" onPress={onRetry} style={styles.saveNotice}>
        <Text style={styles.paragraph}>Closeout save failed. Your completed run is held for retry.</Text>
        <Text style={styles.recordStatus}>RETRY SAVE ›</Text>
      </Pressable>}
      {selected ? <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.cover}>
          <Text style={styles.coverEyebrow}>MISSION DOSSIER · {selected.outcome === 'lost' ? 'RUN CONCLUDED' : 'OUTCOME'}</Text>
          <Text style={styles.coverTitle}>STAGE {String(selected.score.level).padStart(2, '0')}</Text>
          <Text style={styles.coverDetail}>SCORE {selected.score.score}  ·  {dateLabel(selected.recordedAt)}</Text>
        </View>

        <Section title="CAPTAIN’S RECAP">
          {selected.narrative.map((paragraph, index) => <Text key={index} style={styles.paragraph}>{paragraph}</Text>)}
        </Section>

        <Section title="MISSION LEDGER">
          <View style={styles.statGrid}>
            <Stat label="SCORE" value={String(selected.score.score)} />
            <Stat label="STAGE REACHED" value={String(selected.score.level)} />
            <Stat label="TERRITORY · FINAL STAGE" value={`${selected.score.claimed.toFixed(1)}%`} />
            <Stat label="TERRITORY · TOTAL" value={`${selected.score.totalTerritoryClaimed.toFixed(1)}%`} />
            <Stat label="BALLS CONTAINED" value={String(selected.score.ballsContained)} />
            <Stat label="BALLS DESTROYED" value={String(selected.score.ballsDestroyed)} />
            <Stat label="PICKUPS CAPTURED" value={String(selected.score.pickupsCaptured)} />
            <Stat label="LIVES REMAINING" value={`${selected.finalLives} / ${selected.lifeCapacity}`} />
          </View>
        </Section>

        <Section title="FLIGHT PATH · VISITED BEACONS">
          {selected.route.length ? selected.route.map(segment => {
            const byId = new Map(segment.beacons.map(beacon => [beacon.id, beacon]));
            const path = segment.pathBeaconIds.map(id => byId.get(id)).filter(Boolean);
            return <View key={segment.id} style={styles.sectorCard}>
              <Text style={styles.sectorHeading}>SECTOR {String(segment.depth + 1).padStart(2, '0')} · {segment.type.toUpperCase()}</Text>
              {path.length ? path.map((beacon, index) => <View key={beacon!.id} style={styles.beaconRow}>
                <View style={styles.pathSpine}><View style={styles.pathDot} />{index < path.length - 1 && <View style={styles.pathLine} />}</View>
                <View style={styles.beaconCopy}>
                  <Text style={styles.beaconTitle}>{beacon!.eventTitle ?? beacon!.name ?? (beacon!.exit ? 'Sector Gate' : 'Beacon details not captured')}</Text>
                  {beacon!.eventDescription ? <Text style={styles.beaconDetail}>{beacon!.eventDescription}</Text> : !beacon!.eventTitle && <Text style={styles.beaconDetail}>This older route record did not preserve the beacon description.</Text>}
                  {beacon!.eventPassage ? <Text style={styles.beaconPassage}>{beacon!.eventPassage}</Text> : null}
                </View>
              </View>) : <Text style={styles.muted}>No visited-beacon route was recorded for this sector.</Text>}
            </View>;
          }) : <Text style={styles.muted}>No route data was saved with this report.</Text>}
        </Section>

        {selected.closeout && <Section title="PERSISTENCE · RUN CLOSEOUT">
          <View style={styles.statGrid}>
            <Stat label="RESEARCH AWARDED" value={`+${selected.closeout.researchAwarded}`} />
            <Stat label="RESEARCH BALANCE AT CLOSEOUT" value={String(selected.closeout.researchBalance)} />
            <Stat label="BLUEPRINTS RETAINED" value={String(selected.closeout.blueprintCount)} />
            <Stat label="PERMANENT ROSTER · CREW / PETS" value={`${selected.closeout.permanentCrewCount} / ${selected.closeout.permanentPetCount}`} />
          </View>
          <Text style={styles.paragraph}>Run resources and temporary upgrades reset for the next departure. Permanent Research, blueprints, roster progress, and cosmetic discoveries remain aboard.</Text>
          <Text style={styles.futureNote}>Replaying a manual save keeps this original sealed report and cannot award permanent progression or repeat its invitation.</Text>
        </Section>}
        <Section title="RUN-END HOLDINGS">
          <View style={styles.statGrid}>
            <Stat label="CREDITS" value={String(selected.resources.credits)} />
            <Stat label="UPGRADE BARS" value={String(selected.resources.powerBars)} />
            <Stat label="MERCHANT TOKENS" value={String(selected.resources.merchantTokens)} />
            <Stat label="SPEED CHARGES" value={String(selected.resources.speedCharges)} />
            <Stat label="RAM CHARGES" value={String(selected.resources.ramCharges)} />
            <Stat label="CHARGE CELLS" value={String(selected.resources.chargeCharges)} />
            <Stat label="ENGI PODS" value={String(selected.resources.petEggs)} />
            <Stat label="FOUNDRY ITEMS PROCESSED" value={String(Object.values(selected.foundry?.processedItems ?? {}).reduce((sum, count) => sum + (count ?? 0), 0))} />
            <Stat label="MANUAL REFINES COMPLETED" value={String(Object.values(selected.foundry?.manualProcessedItems ?? {}).reduce((sum, count) => sum + (count ?? 0), 0))} />
            <Stat label="FOUNDRY JOBS STILL QUEUED" value={String(selected.foundry?.pendingJobs ?? 0)} />
            <Stat label="FINAL STAGE EVENT" value={selected.finalLevelEvent === 'none' ? 'NONE RECORDED' : selected.finalLevelEvent === 'elimination' ? 'ELIMINATION' : 'DRIFT SWARM'} />
          </View>
          <Text style={styles.futureNote}>The log records completed refining separately from queued jobs, so unfinished work is not counted as recovered Credits.</Text>
        </Section>
      </ScrollView> : <>
        <View style={styles.tabs}>
          <TabButton label="TOP FIVE" active={tab === 'best'} onPress={() => setTab('best')} />
          <TabButton label={`RUN ARCHIVE · ${reports.length}`} active={tab === 'archive'} onPress={() => setTab('archive')} />
        </View>
        <ScrollView style={styles.body} contentContainerStyle={styles.listContent}>
          <View style={styles.sectorCard}>
            <Text style={styles.sectionTitle}>SHIP LEGACY · PERMANENT PROFILE</Text>
            <Text style={styles.paragraph}>Research {profile.engineeringResearch} · Blueprints {profile.blueprintIds.length} · Crew {profile.crew.length} · Pets {profile.pets.length}</Text>
            <Text style={styles.muted}>Your profile persists between runs. Run assignments reset at the next departure.</Text>
          </View>
          {profile.crewInvite && <View style={styles.inviteCard}><Text style={styles.inviteEyebrow}>POST-RUN CREW RECRUITMENT</Text><Text style={styles.inviteName}>One open crew record</Text><Text style={styles.paragraph}>Accept this recruit slot to add a generic crew record to the roster. Character, species, appearance, traits, and personal story are intentionally undefined.</Text><Text style={styles.muted}>Crew capacity {profile.crew.length} / {1 + profile.capacityUpgradeLevels.crew} · Duty assignments are run-local.</Text><View style={styles.inviteActions}><Pressable accessibilityRole="button" onPress={onAcceptCrewInvite} style={styles.inviteAccept}><Text style={styles.inviteAcceptText}>ADD CREW SLOT</Text></Pressable><Pressable accessibilityRole="button" onPress={onDeclineCrewInvite} style={styles.inviteDecline}><Text style={styles.inviteDeclineText}>DECLINE</Text></Pressable></View></View>}
          {profile.petAdoptionOffers.map(offer => {
            const capacity = 1 + profile.capacityUpgradeLevels.pets;
            const full = profile.pets.length >= capacity;
            return <View key={offer.id} style={styles.petOfferCard}>
              <Text style={styles.petOfferEyebrow}>POST-RUN COMPANION · RUN {offer.sourceRunId.slice(-8).toUpperCase()}</Text>
              <Text style={styles.inviteName}>{offer.member.name}</Text>
              <Text style={styles.paragraph}>This existing run companion can join the persistent roster. Adoption saves its current identity record only; run health, position, task, and upgrades are not carried over.</Text>
              <Text style={styles.muted}>Pet capacity {profile.pets.length} / {capacity}{full ? ' · CAPACITY FULL' : ''}</Text>
              <View style={styles.inviteActions}>
                <Pressable accessibilityRole="button" accessibilityState={{ disabled: full }} disabled={full} onPress={() => onAdoptPet(offer.id)} style={[styles.inviteAccept, full && styles.disabledAction]}><Text style={styles.inviteAcceptText}>{full ? 'ROSTER FULL' : 'ADOPT'}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => onReleasePet(offer.id)} style={styles.inviteDecline}><Text style={styles.inviteDeclineText}>RELEASE</Text></Pressable>
              </View>
            </View>;
          })}
          {tab === 'best' ? scores.length ? scores.map((entry, index) => {
            const reportId = entry.runId ?? `run-${entry.timestamp}`;
            const available = reportById.get(reportId);
            return <Pressable key={`${reportId}-${index}`} accessibilityRole="button" accessibilityState={{ disabled: !available }} onPress={() => available && setSelectedId(available.id)} style={[styles.recordCard, !available && styles.recordCardLegacy]}>
              <View style={styles.rank}><Text style={styles.rankText}>{String(index + 1).padStart(2, '0')}</Text></View>
              <View style={styles.recordCopy}>
                <Text style={styles.recordTitle}>{formatScore(entry)}</Text>
                <Text style={styles.recordDetail}>{entry.totalTerritoryClaimed.toFixed(1)}% territory · {entry.ballsContained} contained · {entry.ballsDestroyed} destroyed · {entry.pickupsCaptured} pickups</Text>
                <Text style={styles.recordStatus}>{available ? 'OPEN CAPTAIN’S LOG  ›' : 'LEGACY SCORE · NO REPORT SNAPSHOT'}</Text>
              </View>
              <Text style={styles.recordClaim}>{entry.claimed.toFixed(1)}%</Text>
            </Pressable>;
          }) : <Text style={styles.empty}>Scores will appear here when a run ends.</Text> : reports.length ? reports.map(report => <Pressable key={report.id} accessibilityRole="button" onPress={() => setSelectedId(report.id)} style={styles.recordCard}>
            <View style={styles.rank}><Text style={styles.rankGlyph}>⌖</Text></View>
            <View style={styles.recordCopy}>
              <Text style={styles.recordTitle}>{formatScore(report.score)}</Text>
              <Text style={styles.recordDetail}>{dateLabel(report.recordedAt)} · {report.route.length} recorded sectors</Text>
              <Text style={styles.recordStatus}>OPEN SEALED REPORT  ›</Text>
            </View>
          </Pressable>) : <Text style={styles.empty}>No archived reports yet. Every future run report will remain here even when its score leaves the Top Five.</Text>}
        </ScrollView>
      </>}
    </View>
  </View>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}
function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>;
}
function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.tab, active && styles.tabActive]}><Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  saveNotice: { padding: 16, backgroundColor: '#17343d' },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 92, backgroundColor: 'rgba(2,7,13,0.93)', alignItems: 'center', justifyContent: 'center', padding: 12 },
  panel: { width: '100%', maxWidth: 820, height: '94%', maxHeight: 820, borderWidth: 1, borderColor: '#365b67', borderRadius: 13, backgroundColor: '#07131e', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 18, paddingTop: 17, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#203746' },
  headerCopy: { flex: 1 }, eyebrow: { color: '#63e3ca', fontSize: 8, fontWeight: '900', letterSpacing: 1.7 }, title: { color: '#eff4f7', fontSize: 26, fontWeight: '900', marginTop: 4 }, subhead: { color: '#99aeba', fontSize: 10, marginTop: 4 },
  backButton: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#38515f', borderRadius: 6 }, backText: { color: '#75e7d2', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 }, tab: { paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 2, borderBottomColor: 'transparent' }, tabActive: { borderBottomColor: '#6be3cc' }, tabText: { color: '#7e96a4', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 }, tabTextActive: { color: '#b7fff0' },
  body: { flex: 1 }, listContent: { padding: 16, gap: 8, paddingBottom: 24 }, bodyContent: { padding: 18, paddingTop: 14, paddingBottom: 30 },
  recordCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, borderWidth: 1, borderColor: '#29414f', borderRadius: 8, backgroundColor: '#0b1b27' }, recordCardLegacy: { opacity: 0.78 }, rank: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#103633' }, rankText: { color: '#7cf1dc', fontWeight: '900', fontSize: 11 }, rankGlyph: { color: '#7cf1dc', fontSize: 17 }, recordCopy: { flex: 1 }, recordTitle: { color: '#e6eef3', fontWeight: '900', fontSize: 10, letterSpacing: 0.4 }, recordDetail: { color: '#91a5b1', fontSize: 8, marginTop: 4 }, recordStatus: { color: '#65d7c2', fontSize: 7, fontWeight: '900', letterSpacing: 0.5, marginTop: 5 }, recordClaim: { color: '#e4c879', fontSize: 10, fontWeight: '900' }, empty: { color: '#8da2ae', fontSize: 11, lineHeight: 17, padding: 24, textAlign: 'center' },
  cover: { padding: 16, borderWidth: 1, borderColor: '#42616a', borderRadius: 8, backgroundColor: '#0c202b' }, coverEyebrow: { color: '#6be3cc', fontSize: 8, fontWeight: '900', letterSpacing: 1.4 }, coverTitle: { color: '#f2f5f5', fontSize: 24, fontWeight: '900', marginTop: 8 }, coverDetail: { color: '#a6b8c1', fontSize: 9, marginTop: 4 },
  section: { marginTop: 16 }, sectionTitle: { color: '#72e2cb', fontSize: 8, fontWeight: '900', letterSpacing: 1.3, marginBottom: 8 }, paragraph: { color: '#c0ccd1', fontSize: 10, lineHeight: 16, marginBottom: 7 }, statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, stat: { width: '48%', minHeight: 48, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: '#213946', borderRadius: 6, backgroundColor: '#0a1923' }, statLabel: { color: '#7f9aa7', fontSize: 7, fontWeight: '800', letterSpacing: 0.5 }, statValue: { color: '#e0e9eb', fontSize: 11, fontWeight: '900', marginTop: 4 },
  inviteCard: { padding: 12, borderWidth: 1, borderColor: '#806b3c', borderRadius: 8, backgroundColor: '#1b1a15' }, inviteEyebrow: { color: '#e7c879', fontSize: 7, fontWeight: '900', letterSpacing: 1 }, inviteName: { color: '#f3eee0', fontSize: 15, fontWeight: '900', marginTop: 5, marginBottom: 4 }, inviteActions: { flexDirection: 'row', gap: 8, marginTop: 8 }, inviteAccept: { paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: '#67d8b7', borderRadius: 5, backgroundColor: '#13392f' }, inviteAcceptText: { color: '#b6f8df', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 }, inviteDecline: { paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: '#53616a', borderRadius: 5, backgroundColor: '#121c22' }, inviteDeclineText: { color: '#a5b4bc', fontSize: 7, fontWeight: '900' },
  petOfferCard: { padding: 12, borderWidth: 1, borderColor: '#436a7a', borderRadius: 8, backgroundColor: '#0c1d29' }, petOfferEyebrow: { color: '#82dff0', fontSize: 7, fontWeight: '900', letterSpacing: 1 }, disabledAction: { opacity: 0.45 },
  sectorCard: { padding: 11, marginTop: 7, borderWidth: 1, borderColor: '#263f4a', borderRadius: 7, backgroundColor: '#091821' }, sectorHeading: { color: '#e0c77e', fontSize: 8, fontWeight: '900', letterSpacing: 0.9, marginBottom: 6 }, beaconRow: { minHeight: 48, flexDirection: 'row', gap: 9 }, pathSpine: { width: 10, alignItems: 'center' }, pathDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#73e4ca', marginTop: 5 }, pathLine: { width: 1, flex: 1, backgroundColor: '#356d65' }, beaconCopy: { flex: 1, paddingBottom: 9 }, beaconTitle: { color: '#dce8e9', fontSize: 9, fontWeight: '900' }, beaconDetail: { color: '#95aab2', fontSize: 8, lineHeight: 13, marginTop: 3 }, beaconPassage: { color: '#b6c6c8', fontSize: 8, lineHeight: 13, marginTop: 3, fontStyle: 'italic' }, muted: { color: '#8197a2', fontSize: 9, lineHeight: 14 }, futureNote: { color: '#79909b', fontSize: 8, lineHeight: 13, marginTop: 9, fontStyle: 'italic' },
});

