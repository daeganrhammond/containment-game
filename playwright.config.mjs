import { existsSync, readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const exportedHtml = existsSync('dist/index.html') ? readFileSync('dist/index.html', 'utf8') : '';
const exportedBasePath = exportedHtml.match(/src=["'](\/.*?)\/_expo\/static\/js\/web\//)?.[1] ?? '';
const basePath = process.env.PLAYWRIGHT_BASE_PATH ?? exportedBasePath;
const baseURLValue = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:8182${basePath}`;
const baseURL = baseURLValue.endsWith('/') ? baseURLValue : `${baseURLValue}/`;

export default defineConfig({
  testDir: './playwright',
  outputDir: './playwright-output',
  timeout: 60_000,
  workers: 2,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'phone-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
  reporter: 'list',
  webServer: baseURL.startsWith('http://localhost:8182') ? {
    command: 'node playwright/static-server.mjs',
    url: 'http://localhost:8182',
    reuseExistingServer: false,
    timeout: 15_000,
  } : undefined,
});
