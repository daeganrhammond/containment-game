import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright',
  outputDir: './playwright-output',
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8082',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'phone-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
  reporter: 'list',
});
