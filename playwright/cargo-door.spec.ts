import { expect, test, type Locator } from '@playwright/test';

async function useLandscapeViewport(page: import('@playwright/test').Page, projectName: string) {
  if (projectName === 'phone-chromium') await page.setViewportSize({ width: 844, height: 390 });
}

async function waitForArtOpacity(locator: Locator, expected: number) {
  await expect.poll(async () => locator.evaluate(element => Number(getComputedStyle(element).opacity)), {
    message: `expected cargo-bay artwork opacity to reach ${expected}`,
    timeout: 5_000,
  }).toBeGreaterThan(expected - 0.02);
}

async function artworkSource(locator: Locator) {
  return locator.evaluate(element => (element instanceof HTMLImageElement ? element : element.querySelector('img'))?.getAttribute('src'));
}

test('cargo hatch art opens and queues a cargo request made during the door animation', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await useLandscapeViewport(page, testInfo.project.name);
  await page.goto('./');

  const closedArt = page.getByTestId('bridge-cargo-bay-closed-art');
  const openArt = page.getByTestId('bridge-cargo-bay-open-art');
  await expect(closedArt).toBeVisible();
  await expect(openArt).toBeVisible();
  await waitForArtOpacity(closedArt, 1);
  const closedSource = await artworkSource(closedArt);
  expect(closedSource).toBeTruthy();

  // Request the hold while its doors are still moving. This used to be dropped.
  await page.getByTestId('cargo-bay-hit-target').click();
  await waitForArtOpacity(openArt, 1);
  const openSource = await artworkSource(openArt);
  expect(openSource).toBeTruthy();
  expect(openSource).not.toBe(closedSource);
  await expect.poll(async () => closedArt.evaluate(element => Number(getComputedStyle(element).opacity))).toBeLessThan(0.02);
  await page.screenshot({ path: testInfo.outputPath('cargo-hatch-open-before-inventory.png') });
  await expect(page.getByTestId('cargo-hold-screen')).toBeVisible({ timeout: 4_000 });
  expect(pageErrors, 'published browser build should not raise runtime errors').toEqual([]);
});

test('aesthetic door hold visibly opens and closes the physical cargo bay without opening inventory', async ({ page }, testInfo) => {
  await useLandscapeViewport(page, testInfo.project.name);
  await page.goto('./');
  const closedArt = page.getByTestId('bridge-cargo-bay-closed-art');
  const openArt = page.getByTestId('bridge-cargo-bay-open-art');
  await page.getByTestId('cargo-door-hold-toggle').click();
  await waitForArtOpacity(openArt, 1);
  await expect(page.getByTestId('cargo-hold-screen')).toHaveCount(0);
  await page.getByTestId('cargo-door-hold-toggle').click();
  await waitForArtOpacity(closedArt, 1);
  await expect(page.getByTestId('cargo-hold-screen')).toHaveCount(0);
});
