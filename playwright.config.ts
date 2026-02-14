import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4228',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // 8.5" x 11" paper landscape at 150 DPI (suitable for print/PDF)
    viewport: { width: 1650, height: 1275 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: true,
      },
    },
  ],
  webServer: {
    command: 'ng serve --port 4228',
    url: 'http://localhost:4228',
    reuseExistingServer: true,
  },
});
