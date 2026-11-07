const { readFileSync } = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const test = require('node:test');
const assert = require('node:assert/strict');
const { cargoHelperForRun, foundryDurationWithCargoHelper } = require('../pets.ts');
const { advanceOfflineFoundry, completePickupTransit, newRun, stepRun, collectFoundryOutput } = require('../mechanics.ts');
const { enqueueManualRefining } = require('../cargo.ts');

function runWithHelper(proficiency = 0) {
  const run = newRun(1, 900, 1100, false, { suppressRandomEvents: true });
  run.pets = [{ id: 71, rosterId: 'pet-71', species: 'engi', name: 'Existing pet', skinId: 'default', health: 1, maxHealth: 1, level: 1,
    deployed: false, x: 80, y: 80, vx: 0, vy: 0, task: 'inspect', taskUntilMs: 0, repairedThisLevel: false,
    dutyProficiency: { 'cargo-helper': proficiency } }];
  run.progression = { ...run.progression, petAssignments: { '71': { primary: 'cargo-helper', backup: null, retrieverFilters: [] } } };
  return run;
}

test('Cargo Helper duration uses bounded permanent proficiency and does not stack', () => {
  const pets = [
    { id: 1, health: 1, dutyProficiency: { 'cargo-helper': 3 } },
    { id: 2, health: 1, dutyProficiency: { 'cargo-helper': 5 } },
  ];
  const assignments = {
    '1': { primary: 'cargo-helper', backup: null, retrieverFilters: [] },
    '2': { primary: null, backup: 'cargo-helper', retrieverFilters: [] },
  };
  const helper = cargoHelperForRun(pets, assignments);
  assert.equal(helper.petId, 2);
  assert.equal(helper.reductionPercent, 5);
  assert.equal(foundryDurationWithCargoHelper(10_000, helper), 9_500);
  assert.equal(foundryDurationWithCargoHelper(10_000, null), 10_000);
  assert.equal(cargoHelperForRun([{ id: 2, health: 0, dutyProficiency: { 'cargo-helper': 5 } }], assignments), null);
});

test('manual and overflow jobs snapshot Cargo Helper time and helper identity', () => {
  const run = runWithHelper(3);
  run.speedCharges = 1;
  run.cargoMinimumKeep = { speed: 0 };
  const queued = enqueueManualRefining(run, 'speed', 1);
  assert.equal(queued.overflowJobs[0].durationMs, 9_700);
  assert.equal(queued.overflowJobs[0].cargoHelperPetId, 71);
  assert.equal(queued.speedCharges, 1, 'queueing holds rather than immediately consumes the selected item');

  const transitRun = runWithHelper(3);
  transitRun.pickupTransits = [{ id: 88, captureEventId: 88, kind: 'speed', x: 12, y: 15, destination: 'foundry', amount: 5, startedAtMs: 0, durationMs: 1 }];
  const arrived = completePickupTransit(transitRun, 88);
  assert.equal(arrived.overflowJobs[0].durationMs, 9_700);
  assert.equal(arrived.overflowJobs[0].cargoHelperPetId, 71);
});

test('completed assisted smelt trains the queued helper but leaves credits for player collection', () => {
  const run = runWithHelper(0);
  run.speedCharges = 2;
  run.overflowSuccessChance = 100;
  run.overflowJobs = [{ id: 41, kind: 'speed', credits: 5, durationMs: 1, remainingMs: 1, sourceX: 0, sourceY: 0,
    source: 'manual', holdsCargo: true, cargoHelperPetId: 71 }];

  const processed = stepRun(run, 5, run.boardWidth, run.boardHeight);
  assert.equal(processed.speedCharges, 1);
  assert.equal(processed.credits, 0);
  assert.equal(processed.foundryPayouts.length, 1);
  assert.equal(processed.progression.petDutyWork['71']['cargo-helper'], 1);

  const collected = collectFoundryOutput(processed);
  assert.equal(collected.credits, 5);
  assert.equal(collected.foundryPayouts.length, 0);
});

test('offline completion credits the queued helper without collecting its payout', () => {
  const run = runWithHelper(0);
  run.overflowSuccessChance = 100;
  run.overflowJobs = [{ id: 42, kind: 'speed', credits: 5, durationMs: 1, remainingMs: 1, sourceX: 0, sourceY: 0,
    source: 'overflow', cargoHelperPetId: 71 }];

  const advanced = advanceOfflineFoundry(run, 5);
  assert.equal(advanced.progression.petDutyWork['71']['cargo-helper'], 1);
  assert.equal(advanced.credits, 0);
  assert.equal(advanced.foundryPayouts.length, 1);
});
