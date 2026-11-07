import { expect, test } from '@playwright/test';
import { newRun } from '../mechanics';
import { createSector } from '../sectorMap';
import { ACTIVE_RUN_KEY, PROGRESSION_KEY } from '../progressionStorage';

test('recover completed run report from persistent archive after reload', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const completed = { ...newRun(1, 900, 1100, false, { suppressRandomEvents: true }),
    runId: 'recovery-ui-fixture', sector: createSector(0, 'Civilian', [], 42), ended: true, lives: 0,
    credits: 47, ramCharges: 2, speedCapacityBonus: 3 };
  await page.addInitScript(({ key, run }) => {
    if (!sessionStorage.getItem('progression-fixture-seeded')) {
      localStorage.setItem(key, JSON.stringify(run));
      sessionStorage.setItem('progression-fixture-seeded', 'true');
    }
  }, { key: ACTIVE_RUN_KEY, run: completed });
  await page.goto('./');
  await expect.poll(() => page.evaluate(key => !!localStorage.getItem(key), PROGRESSION_KEY)).toBe(true);
  await page.getByRole('button', { name: /Open Scores and Captain/ }).click();
  await expect(page.getByText('SHIP LEGACY · PERMANENT PROFILE', { exact: true })).toBeVisible();
  await page.getByText('RUN ARCHIVE · 1', { exact: true }).click();
  await page.getByText('OPEN SEALED REPORT', { exact: false }).click();
  await expect(page.getByText('PERSISTENCE \u00b7 RUN CLOSEOUT', { exact: true })).toBeAttached();
  await expect(page.getByText('47', { exact: true })).toBeAttached();
  await expect(page.getByText('PERSISTENCE \u00b7 RUN CLOSEOUT', { exact: true })).toBeAttached();
  await page.screenshot({ path: testInfo.outputPath('closeout.png') });
  await page.reload();
  await page.getByRole('button', { name: /Open Scores and Captain/ }).click();
  await page.getByText('RUN ARCHIVE · 1', { exact: true }).click();
  await expect(page.getByText('OPEN SEALED REPORT', { exact: false })).toBeVisible();
  await page.getByText('OPEN SEALED REPORT', { exact: false }).click();
  await expect(page.getByText('PERSISTENCE \u00b7 RUN CLOSEOUT', { exact: true })).toBeAttached();
  await expect(page.getByText('47', { exact: true })).toBeAttached();
  expect(errors).toEqual([]);
});
