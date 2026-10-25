import { test, expect } from './fixtures';
import { readFile } from 'node:fs/promises';
import { mapWith, node } from './helpers';

// Section 3.1/3.2 routes: every navigation item works; history, settings,
// reference, challenges, scenarios and help pages.

test('every navigation link resolves to a working page', async ({ page }) => {
  await page.goto('/');
  // Let route prefetches settle before replacing the document. WebKit reports
  // deliberately aborted RSC prefetches as console errors on rapid page.goto.
  await page.waitForLoadState('networkidle');
  const nav = page.getByRole('complementary', { name: 'Main navigation' });
  const hrefs = await nav.getByRole('link').evaluateAll((links) => links.map((l) => (l as HTMLAnchorElement).getAttribute('href')!));
  expect(hrefs).toEqual(expect.arrayContaining(['/learn', '/learn/challenges', '/reference', '/scenarios', '/settings', '/help']));
  for (const href of new Set(hrefs.map((h) => h.split('#')[0]))) {
    const res = await page.goto(href);
    expect(res?.status(), href).toBeLessThan(400);
    await expect(page.locator('main h1').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
  }
});

test('version history: preview and restore as a new version', async ({ page }) => {
  const url = await mapWith(page);
  await page.getByRole('button', { name: 'Save version' }).click();
  await page.getByLabel('What changed? (optional)').fill('First draft');
  await page.getByRole('dialog', { name: 'Save version' }).getByRole('button', { name: 'Save version' }).click();
  await expect(page.getByText(/Revision \d+ saved/).first()).toBeVisible();

  await node(page, 'Power').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Delete');
  await page.getByRole('button', { name: 'Save version' }).click();
  await page.getByRole('dialog', { name: 'Save version' }).getByRole('button', { name: 'Save version' }).click();
  await expect(page.getByText(/Revision \d+ saved/).first()).toBeVisible();

  await page.getByRole('button', { name: 'Version history' }).click();
  await page.waitForURL(/\/history$/);
  const table = page.getByRole('table');
  await expect(table).toContainText('First draft');
  await page.getByRole('button', { name: /Preview revision 2/ }).click();
  await expect(page.getByRole('img', { name: 'Map at revision 2' })).toContainText('Power');
  await page.getByRole('button', { name: /Restore as new version from revision 2/ }).click();
  await page.waitForURL(url);
  await expect(node(page, 'Power')).toBeVisible();

  await page.goto(`${url}/history`);
  await expect(page.getByRole('row')).toHaveCount(4); // header + 3 versions: history never rewritten
  await expect(page.getByRole('table')).toContainText('Restored from revision 2');
});

test('settings: theme, export all data, delete local data', async ({ page }) => {
  await mapWith(page);
  await page.goto('/settings');
  await page.getByLabel('Dark').check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByText(/Stored now: 1 map/)).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export all data' }).click()]);
  const backup = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(backup.format).toBe('wardley-studio-backup');
  expect(Object.keys(backup.data.maps)).toHaveLength(1);

  await page.getByRole('button', { name: 'Delete local data…' }).click();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  await expect(page.getByText(/Stored now: 0 maps/)).toBeVisible();
  // Preferences survive unless explicitly included
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/maps');
  await expect(page.getByText('Tea Shop')).toHaveCount(0);
});

test('reference lists catalogs with cautions and attribution', async ({ page }) => {
  await page.goto('/reference#gameplay');
  await expect(page.getByRole('heading', { name: 'Gameplay', level: 2 })).toBeVisible();
  await expect(page.getByRole('note').filter({ hasText: 'competition law' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sources and licence' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'CC BY-SA 4.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/');
});

test('challenges index opens a module straight on its challenge', async ({ page }) => {
  await page.goto('/learn/challenges');
  await page.getByRole('link', { name: 'Open challenge: Read and annotate a map' }).click();
  await page.waitForURL(/reading-complete-map\?tab=challenge/);
  await expect(page.getByRole('region', { name: 'Practice map editor' })).toBeVisible();
});

test('scenarios index lists scenarios across maps', async ({ page }) => {
  await page.goto('/scenarios');
  await expect(page.getByText('No scenarios yet.')).toBeVisible();
  const url = await mapWith(page);
  await page.getByRole('button', { name: 'Save version' }).click();
  await page.getByRole('dialog', { name: 'Save version' }).getByRole('button', { name: 'Save version' }).click();
  await page.goto(`${url}/scenarios`);
  await page.getByRole('button', { name: /Create first scenario/ }).click();
  await page.getByLabel('Name *').fill('Cloud');
  await page.getByRole('button', { name: 'Create scenario' }).click();
  await page.waitForURL(/\/scenarios\/sc_/);
  await page.goto('/scenarios');
  await page.getByRole('link', { name: 'Cloud' }).click();
  await expect(page.getByRole('heading', { name: 'Cloud', level: 2 })).toBeVisible();
});
