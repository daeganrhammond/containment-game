require.extensions['.ts'] = (module, filename) => { const { readFileSync } = require('node:fs'); const ts = require('typescript'); module._compile(ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const test = require('node:test');
const assert = require('node:assert/strict');
const { CARGO_CATALOG, cargoBalancesFromRun, isRefinable, moveCargoStack, packCargo, rotateCargoStack } = require('../cargo.ts');

test('cargo catalog includes all current shared resources and existing foundry recipes only', () => {
  assert.deepEqual(Object.keys(CARGO_CATALOG), ['life', 'speed', 'ram', 'charge', 'credit', 'power-bar', 'merchant-token', 'engi-pod']);
  assert.equal(isRefinable('speed'), true);
  assert.equal(isRefinable('credit'), false);
  assert.equal(isRefinable('power-bar'), false);
  assert.equal(isRefinable('merchant-token'), false);
  assert.equal(isRefinable('engi-pod'), false);
  assert.equal(isRefinable('speed', { speed: 0 }), false);
});

test('cargo balances adapt legacy run counters without mutating them', () => {
  const run = { lives: 2, speedCharges: 4, ramCharges: 1, chargeCharges: 3, credits: 151, powerBars: 2, merchantTokens: 1, petEggs: 3 };
  assert.deepEqual(cargoBalancesFromRun(run), { life: 2, speed: 4, ram: 1, charge: 3, credit: 151, 'power-bar': 2, 'merchant-token': 1, 'engi-pod': 3 });
  assert.equal(run.credits, 151);
});

test('cargo packing respects footprints and stack limits with deterministic placements', () => {
  const balances = { life: 4, speed: 7, ram: 3, charge: 2, credit: 250, 'power-bar': 6, 'merchant-token': 2, 'engi-pod': 3 };
  const first = packCargo(balances);
  const second = packCargo(balances);
  assert.deepEqual(first, second);
  assert.equal(first.unplaced.length, 0);
  assert.equal(first.stacks.reduce((sum, stack) => sum + stack.quantity, 0), Object.values(balances).reduce((sum, count) => sum + count, 0));
  for (const stack of first.stacks) {
    const item = CARGO_CATALOG[stack.itemId];
    assert.ok(stack.quantity <= item.stackLimit);
    assert.ok(stack.x + stack.width <= first.grid.columns);
    assert.ok(stack.y + stack.height <= first.grid.rows);
  }
});

test('small grids surface overflow stacks instead of losing item counts', () => {
  const balances = { life: 2, speed: 0, ram: 0, charge: 0, credit: 0, 'power-bar': 0, 'merchant-token': 0, 'engi-pod': 0 };
  const packed = packCargo(balances, { columns: 1, rows: 1 });
  assert.equal(packed.stacks[0].quantity, 2);
  assert.equal(packed.unplaced.length, 0);
  assert.equal(packCargo({ ...balances, 'engi-pod': 1 }, { columns: 1, rows: 1 }).unplaced.length, 1);
});

test('cargo layout preserves valid manual placements and rejects collisions or out-of-bounds moves', () => {
  const balances = { life: 1, speed: 1, ram: 0, charge: 0, credit: 0, 'power-bar': 0, 'merchant-token': 0, 'engi-pod': 0 };
  const packed = packCargo(balances);
  const life = packed.stacks.find(stack => stack.itemId === 'life');
  const speed = packed.stacks.find(stack => stack.itemId === 'speed');
  const shifted = moveCargoStack(undefined, packed.stacks, life.id, 5, 0);
  const repacked = packCargo(balances, undefined, shifted);
  assert.deepEqual(repacked.stacks.find(stack => stack.id === life.id).x, life.x + 5);
  assert.equal(moveCargoStack(shifted, repacked.stacks, life.id, 0, -1), shifted);
  assert.equal(moveCargoStack(shifted, repacked.stacks, life.id, -6, 0), shifted);
  assert.equal(moveCargoStack(shifted, repacked.stacks, life.id, -4, 0), shifted);
  assert.equal(speed.x, packed.stacks.find(stack => stack.id === speed.id).x);
});

test('cargo stacks rotate in place, persist their footprint, and reject collisions', () => {
  const balances = { life: 1, speed: 1, ram: 0, charge: 0, credit: 0, 'power-bar': 0, 'merchant-token': 0, 'engi-pod': 0 };
  const packed = packCargo(balances);
  const speed = packed.stacks.find(stack => stack.itemId === 'speed');
  const rotated = rotateCargoStack(undefined, packed.stacks, speed.id);
  const repacked = packCargo(balances, undefined, rotated);
  const turned = repacked.stacks.find(stack => stack.id === speed.id);
  assert.equal(turned.rotation, 90);
  assert.equal(turned.width, 2);
  assert.equal(turned.height, 1);
  const twice = rotateCargoStack(rotated, repacked.stacks, speed.id);
  assert.equal(packCargo(balances, undefined, twice).stacks.find(stack => stack.id === speed.id).rotation, 0);

  const crowdedBalances = { ...balances, credit: 1 };
  const crowded = packCargo(crowdedBalances);
  const crowdedSpeed = crowded.stacks.find(stack => stack.itemId === 'speed');
  const blocked = rotateCargoStack(undefined, crowded.stacks, crowdedSpeed.id);
  assert.equal(blocked, undefined);
});
