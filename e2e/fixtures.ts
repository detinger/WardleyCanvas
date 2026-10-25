import { test as base, expect } from '@playwright/test';

/**
 * Section 15.7: no console errors or unhandled rejections in core flows.
 * Every spec imports `test` from here, so any console error fails the test.
 */
export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', async (m) => {
        if (m.type() !== 'error') return;
        // React passes details as %s arguments; include them so failures are actionable
        const args = await Promise.all(m.args().slice(1, 4).map((a) => a.jsonValue().catch(() => '?')));
        errors.push(`${m.text().slice(0, 160)} | ${args.map(String).join(' | ')}`);
      });
      page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
      await use();
      expect(errors, 'console errors during test').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
export type { Page, Download } from '@playwright/test';
