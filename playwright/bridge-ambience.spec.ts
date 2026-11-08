import { expect, test } from '@playwright/test';

test('bridge vista renders and exterior motion advances', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('./');
  await expect(page.locator('body')).toBeVisible();
  await page.waitForTimeout(2_000);

  const vista = page.locator('img[src*="cinder-comet-shoals."]');
  await expect(vista, 'expected the initial Cinder Comet Shoals bridge vista').toBeAttached();
  await vista.evaluate(image => image.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(1_500);
  const firstFrame = await vista.evaluate(image => {
    const chain: { tag: string; transform: string; opacity: string; rect: DOMRect }[] = [];
    let element: Element | null = image;
    while (element && chain.length < 6) {
      const style = getComputedStyle(element);
      chain.push({ tag: element.tagName, transform: style.transform, opacity: style.opacity, rect: element.getBoundingClientRect() });
      element = element.parentElement;
    }
    return chain;
  });
  await page.screenshot({ path: testInfo.outputPath(`bridge-${testInfo.project.name}.png`) });
  await page.waitForTimeout(1_500);
  const secondFrame = await vista.evaluate(image => {
    const chain: { tag: string; transform: string; opacity: string }[] = [];
    let element: Element | null = image;
    while (element && chain.length < 6) {
      const style = getComputedStyle(element);
      chain.push({ tag: element.tagName, transform: style.transform, opacity: style.opacity });
      element = element.parentElement;
    }
    return chain;
  });

  expect(pageErrors, 'page should not raise runtime errors').toEqual([]);
  const changedTransforms = firstFrame.filter((element, index) => element.tag !== 'IMG' && element.transform !== secondFrame[index]?.transform).length;
  console.log(`${testInfo.project.name}: vista transform changed on ${changedTransforms} ancestor(s); page errors=${pageErrors.length}`);
  expect(changedTransforms, 'the bridge vista should drift during the sample').toBeGreaterThan(0);
});

test('bridge command screen stacks above web-only navigation', async ({ page }) => {
  await page.goto('./');
  const bridge = page.getByTestId('command-bridge-screen');
  const header = page.getByTestId('application-header');
  await expect(bridge).toBeVisible();
  await expect(header).toBeAttached();
  const [bridgeZ, headerZ] = await Promise.all([
    bridge.evaluate(element => Number(getComputedStyle(element).zIndex)),
    header.evaluate(element => Number(getComputedStyle(element).zIndex)),
  ]);
  expect(bridgeZ, 'ship bridge must layer above the web-only application header').toBeGreaterThan(headerZ);
  await page.screenshot({ path: 'playwright-output/bridge-home-layering.png' });
});

test('canonical bridge screens stay on their measured glass bounds', async ({ page }) => {
  await page.goto('./');
  const art = page.getByTestId('bridge-art-canvas');
  const score = page.getByTestId('bridge-console-scores');
  const jump = page.getByTestId('bridge-console-jump');
  const nav = page.getByTestId('bridge-console-nav');
  await expect(art).toBeVisible();
  await expect(score).toBeVisible();
  await expect(jump).toBeVisible();
  await expect(nav).toBeVisible();

  const [canvasBox, scoreBox, jumpBox, navBox] = await Promise.all([
    art.boundingBox(), score.boundingBox(), jump.boundingBox(), nav.boundingBox(),
  ]);
  expect(canvasBox).not.toBeNull();
  expect(scoreBox).not.toBeNull();
  expect(jumpBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect((scoreBox!.x - canvasBox!.x) / canvasBox!.width).toBeCloseTo(0.241, 2);
  expect(scoreBox!.width / canvasBox!.width).toBeCloseTo(0.06, 2);
  expect((jumpBox!.x - canvasBox!.x) / canvasBox!.width).toBeCloseTo(0.704, 2);
  expect(jumpBox!.width / canvasBox!.width).toBeCloseTo(0.058, 2);
  expect((navBox!.x - canvasBox!.x) / canvasBox!.width).toBeCloseTo(0.894, 2);
  expect(navBox!.width / canvasBox!.width).toBeCloseTo(0.076, 2);

});
