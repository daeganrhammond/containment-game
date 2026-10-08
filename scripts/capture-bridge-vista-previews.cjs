// Capture time-separated screenshots of the source-linked bridge vista effects.
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 850 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(8000);
    await page.goto('http://localhost:8082/');
    console.log('Loaded local bridge');
    await page.getByRole('button', { name: /DEVELOPER/ }).first().click({ force: true });
    console.log('Opened developer settings');
    for (const scene of ['Cinder Comet Shoals', 'Copperline Orbital Foundry']) {
      await page.getByRole('button', { name: scene, exact: true }).click();
      console.log(`Pinned ${scene}`);
      await page.getByText('HOME', { exact: true }).click();
      console.log('Returned home');
      const slug = scene.toLowerCase().replaceAll(' ', '-');
      const vista = page.locator(`img[src*="${slug}."]`).first();
      await vista.waitFor({ state: 'visible' });
      await page.waitForTimeout(1500);
      const first = await vista.evaluate(image => {
        let element = image;
        const transforms = [];
        while (element && transforms.length < 6) {
          transforms.push(getComputedStyle(element).transform);
          element = element.parentElement;
        }
        return transforms;
      });
      await page.screenshot({ path: `.preview-${slug}.png` });
      await page.waitForTimeout(7000);
      const later = await vista.evaluate(image => {
        let element = image;
        const transforms = [];
        while (element && transforms.length < 6) {
          transforms.push(getComputedStyle(element).transform);
          element = element.parentElement;
        }
        return transforms;
      });
      await page.screenshot({ path: `.preview-${slug}-later.png` });
      console.log(`${scene}: transform changed on ${first.filter((value, index) => value !== later[index]).length} ancestors over 7 seconds`);
      await page.getByRole('button', { name: /DEVELOPER/ }).first().click({ force: true });
      console.log('Reopened developer settings');
    }
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
