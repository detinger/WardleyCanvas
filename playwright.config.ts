import { defineConfig, devices } from '@playwright/test';

const projects = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
];

// Playwright Firefox cannot start on macOS 27 because the OS protects the
// installed Firefox app-data directory. Linux CI still runs the Firefox gate;
// PLAYWRIGHT_FIREFOX=1 is an explicit local override for other macOS versions.
if (process.platform !== 'darwin' || process.env.PLAYWRIGHT_FIREFOX === '1') {
  projects.push({ name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } });
}

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:9003',
    trace: 'retain-on-failure',
  },
  projects,
  webServer: {
    // The pretest:e2e lifecycle builds this isolated production bundle. A
    // production server avoids dev-HMR chunk failures in Playwright WebKit.
    command: 'NEXT_DIST_DIR=.next-e2e npx next start -p 9003',
    url: 'http://localhost:9003',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
