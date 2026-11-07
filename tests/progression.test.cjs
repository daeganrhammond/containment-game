// Run with node --test tests/progression.test.cjs; TypeScript is already a dev dependency.
const { readFileSync } = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const test = require('node:test');
const assert = require('node:assert/strict');
const { createProgressionStorage, PROGRESSION_KEY, ACTIVE_RUN_KEY } = require('../progressionStorage.ts');
const { createPersistentProfile, createRunProgression, ensureRunProgression, normalizePersistentProfile } = require('../progression.ts');
const { newRun } = require('../mechanics.ts');
const { buildCaptainLogReport } = require('../captainLog.ts');

function memory() {
  const data = new Map();
  let failKey;
  let failRemove = false;
  return { data, failWrite(key) { failKey = key; }, failRemoval() { failRemove = true; },
    async getItem(key) { return data.get(key) ?? null; },
    async setItem(key, value) { if (key === failKey) { failKey = undefined; throw new Error('Simulated storage failure'); } data.set(key, value); },
    async removeItem(key) { if (failRemove) { failRemove = false; throw new Error('Simulated cleanup failure'); } data.delete(key); },
  };
}
function ended(id = 'run-a') { return { ...newRun(1, 900, 1100, false, { suppressRandomEvents: true }), runId: id, ended: true, lives: 0, credits: 47 }; }

test('legacy scores migrate once; unrelated cosmetics and source records stay intact', async () => {
  const storage = memory();
  const legacy = JSON.stringify([{ score: 12, claimed: 40, timestamp: 123 }]);
  storage.data.set(`${ACTIVE_RUN_KEY}-scores`, legacy);
  storage.data.set('trap-game-picture-vista-unlocks-v1', '["cinder"]');
  const store = createProgressionStorage(storage);
  const first = await store.initialize();
  assert.equal(first.archive.scores[0].level, 12);
  assert.deepEqual(first.archive.profile, createPersistentProfile());
  assert.equal(storage.data.get(`${ACTIVE_RUN_KEY}-scores`), legacy);
  assert.equal(storage.data.get('trap-game-picture-vista-unlocks-v1'), '["cinder"]');
  assert.deepEqual((await store.initialize()).archive, first.archive);
});

test('Phase 1 reports gain a saved Phase 2 closeout without changing their sealed facts', async () => {
  const storage = memory();
  const run = ended('phase-1-report');
  const entry = { runId: run.runId, score: 9, level: 9, claimed: 50, totalTerritoryClaimed: 70, ballsDestroyed: 2, ballsContained: 4, pickupsCaptured: 5, timestamp: 123 };
  const report = buildCaptainLogReport(run, entry);
  const archive = { version: 1, profile: createPersistentProfile(), reports: [report], scores: [entry] };
  storage.data.set(PROGRESSION_KEY, JSON.stringify(archive));
  const loaded = await createProgressionStorage(storage).initialize();
  assert.equal(loaded.archive.reports[0].score.score, 9);
  assert.deepEqual(loaded.archive.reports[0].closeout, { researchAwarded: 0, researchBalance: 0, blueprintCount: 0, permanentCrewCount: 0, permanentPetCount: 0 });
  assert.ok(JSON.parse(storage.data.get(PROGRESSION_KEY)).reports[0].closeout);
});

test('old active saves gain stable identity and keep balances/upgrades on reload', async () => {
  const storage = memory();
  const old = { ...ended(), ended: undefined, runId: undefined, progression: undefined, speedCapacityBonus: 3 };
  storage.data.set(ACTIVE_RUN_KEY, JSON.stringify(old));
  const first = await createProgressionStorage(storage).initialize();
  const second = await createProgressionStorage(storage).initialize();
  assert.equal(first.active.runId, second.active.runId);
  assert.equal(second.active.credits, 47);
  assert.equal(second.active.speedCapacityBonus, 3);
  assert.deepEqual(second.active.progression, createRunProgression());
});

test('profile identity persists; new runs reset resources, installs and assignments', () => {
  const profile = normalizePersistentProfile({ ...createPersistentProfile(), engineeringResearch: 25, blueprintIds: ['claimed-mount'], capacityUpgradeLevels: { crew: 2, pets: 1 },
    crew: [{ id: 'crew-a', name: 'Ada', species: 'engi', traits: ['patient'], skills: { salvage: 2 }, relationships: {} }] });
  const progression = createRunProgression(profile);
  progression.crewAssignments['crew-a'] = 'engineer';
  progression.temporaryUpgradeLevels.range = 4;
  const fresh = { ...newRun(), progression: createRunProgression(profile) };
  assert.equal(fresh.credits, 0);
  assert.equal(fresh.ramCharges, 0);
  assert.deepEqual(fresh.cargoLayout, { version: 1, placements: [] });
  assert.equal(fresh.speedCapacityBonus, 0);
  assert.equal(fresh.overflowUpgradePurchases, 0);
  assert.deepEqual(fresh.pets, []);
  assert.deepEqual(fresh.progression.crewAssignments, {});
  assert.deepEqual(fresh.progression.temporaryUpgradeLevels, {});
  assert.deepEqual(fresh.progression.blueprintIdsAtStart, ['claimed-mount']);
  fresh.progression.blueprintIdsAtStart.push('another');
  assert.deepEqual(profile.blueprintIds, ['claimed-mount']);
  assert.equal(profile.crew[0].name, 'Ada');
  assert.equal(profile.engineeringResearch, 25);
});

test('failed archive commit recovers completed run on restart exactly once', async () => {
  const storage = memory();
  const store = createProgressionStorage(storage);
  await store.initialize();
  storage.failWrite(PROGRESSION_KEY);
  await assert.rejects(store.finishRun(ended()));
  assert.equal(JSON.parse(storage.data.get(ACTIVE_RUN_KEY)).ended, true);
  assert.equal(JSON.parse(storage.data.get(PROGRESSION_KEY)).reports.length, 0);
  const recovered = await createProgressionStorage(storage).initialize();
  assert.equal(recovered.active, null);
  assert.equal(recovered.archive.reports.length, 1);
  assert.equal(recovered.archive.reports[0].resources.credits, 47);
  assert.equal(storage.data.has(ACTIVE_RUN_KEY), false);
});

test('failure removing completed save retries without resealing or double awards', async () => {
  const storage = memory();
  const store = createProgressionStorage(storage);
  await store.initialize();
  storage.failRemoval();
  await assert.rejects(store.finishRun(ended()));
  const sealed = JSON.parse(storage.data.get(PROGRESSION_KEY));
  const recovered = await createProgressionStorage(storage).initialize();
  assert.deepEqual(recovered.archive, sealed);
  assert.equal(recovered.active, null);
});

test('manual replay cannot alter sealed score/report/profile; later distinct runs archive normally', async () => {
  const storage = memory();
  const store = createProgressionStorage(storage);
  await store.initialize();
  const first = await store.finishRun(ended());
  await store.saveActive({ ...ended(), ended: false });
  const second = await store.finishRun({ ...ended(), level: 99, credits: 9999 });
  assert.deepEqual(JSON.parse(JSON.stringify(second)), JSON.parse(JSON.stringify(first)));
  const third = await store.finishRun(ended('run-b'));
  assert.equal(third.reports.length, 2);
});

test('serialized save, seal and new run preserve the new active run', async () => {
  const storage = memory();
  const store = createProgressionStorage(storage);
  await store.initialize();
  await Promise.all([store.saveActive({ ...ended(), ended: false }), store.finishRun(ended()), store.saveActive({ ...ended('run-b'), ended: false })]);
  assert.equal(JSON.parse(storage.data.get(ACTIVE_RUN_KEY)).runId, 'run-b');
  assert.equal(JSON.parse(storage.data.get(PROGRESSION_KEY)).reports.length, 1);
});

test('unreadable/future profile versions are preserved rather than overwritten', async () => {
  for (const raw of ['{broken', JSON.stringify({ version: 99, profile: {}, reports: [], scores: [] })]) {
    const storage = memory();
    storage.data.set(PROGRESSION_KEY, raw);
    await assert.rejects(createProgressionStorage(storage).initialize());
    assert.equal(storage.data.get(PROGRESSION_KEY), raw);
  }
  assert.throws(() => ensureRunProgression({ progression: { version: 99 } }));
});
