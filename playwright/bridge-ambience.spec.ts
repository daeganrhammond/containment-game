import { expect, test } from '@playwright/test';

test('bridge vista renders and exterior motion advances', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await page.waitForTimeout(2_000);

  const vista = page.locator('img[src*="blue-ringworld-vista.jpg"]');
  await expect(vista, 'expected the initial Blue Ringworld bridge vista').toBeAttached();
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
