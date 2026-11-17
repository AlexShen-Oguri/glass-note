import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './artifacts/e2e',
  reporter: [['list']],
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4176',
    browserName: 'chromium',
    channel: 'chromium',
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {name: 'desktop', use: {viewport: {width: 1280, height: 800}}},
    {name: 'phone', use: {viewport: {width: 390, height: 844}}},
  ],
  webServer: {
    command: `"${process.execPath}" scripts/serve.mjs --port=4176`,
    url: 'http://127.0.0.1:4176',
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
