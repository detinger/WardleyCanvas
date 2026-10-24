import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:9003',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: 'NEXT_DIST_DIR=.next-e2e npx next dev --turbopack -p 9003',
    url: 'http://localhost:9003',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
