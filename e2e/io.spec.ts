import { test, expect, Page, Download } from './fixtures';
import { readFile } from 'node:fs/promises';
import { mapWith, node, currentSource, TEA_SHOP } from './helpers';

// Phase 2 gates: IO-03 atomic import preview, IO-04 deterministic exports,
// hostile input handling (E2E scenario 7).

const importDialog = (page: Page) => page.getByRole('dialog', { name: 'Import map' });
const exportDialog = (page: Page) => page.getByRole('dialog', { name: 'Export map' });

async function openImport(page: Page) {
  await page.getByRole('button', { name: 'Import OWM or JSON' }).click();
  await expect(importDialog(page)).toBeVisible();
}

async function download(page: Page, title: RegExp): Promise<{ d: Download; body: Buffer }> {
  const [d] = await Promise.all([
    page.waitForEvent('download'),
    exportDialog(page).getByRole('button', { name: title }).click(),
  ]);
  return { d, body: await readFile((await d.path())!) };
}

test('import preview: cancel and Escape leave the map unchanged; confirm applies; undo reverts', async ({ page }) => {
  await mapWith(page);
  const before = await currentSource(page);
  const replacement = 'title Other\nanchor User [0.9, 0.5]\ncomponent Thing [0.5, 0.5]\nUser->Thing\n';

  await openImport(page);
  await importDialog(page).getByLabel(/paste OWM/).fill(replacement);
  await importDialog(page).getByRole('button', { name: 'Preview import' }).click();
  await expect(importDialog(page).getByRole('status')).toHaveText(/Ready to import/);
  await importDialog(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(importDialog(page)).toHaveCount(0);
  expect(await currentSource(page)).toBe(before);

  await openImport(page);
  await importDialog(page).getByLabel(/paste OWM/).fill(replacement);
  await importDialog(page).getByRole('button', { name: 'Preview import' }).click();
  await page.keyboard.press('Escape');
  await expect(importDialog(page)).toHaveCount(0);
  expect(await currentSource(page)).toBe(before);

  await openImport(page);
  await importDialog(page).getByLabel(/paste OWM/).fill(replacement);
  await importDialog(page).getByRole('button', { name: 'Preview import' }).click();
  await importDialog(page).getByRole('button', { name: 'Confirm import' }).click();
  await expect(node(page, 'Thing')).toBeVisible();
  await expect(node(page, 'Kettle')).toHaveCount(0);

  await page.getByRole('button', { name: /^Undo/ }).click();
  await expect(node(page, 'Kettle')).toBeVisible();
});

test('an import with errors cannot be confirmed', async ({ page }) => {
  await mapWith(page);
  await openImport(page);
  await importDialog(page).getByLabel(/paste OWM/).fill('component A [0.5, 0.5]\nA->Ghost\n');
  await importDialog(page).getByRole('button', { name: 'Preview import' }).click();
  await expect(importDialog(page).getByRole('status')).toHaveText(/cannot import/);
  await expect(importDialog(page).getByRole('button', { name: 'Confirm import' })).toBeDisabled();
});

test('JSON files are previewed, not applied immediately', async ({ page }) => {
  await mapWith(page);
  await openImport(page);
  const json = JSON.stringify({
    schemaVersion: 1, id: 'x', title: 'From JSON',
    evolutionLabels: ['a', 'b', 'c', 'd'], stageBoundaries: [0.25, 0.5, 0.75],
    elements: [{ id: 'u', kind: 'anchor', name: 'JSON User', componentType: 'unspecified', visibility: 0.9, evolution: 0.5 }],
    dependencies: [], evolutions: [], pipelines: [], annotations: [],
    analysis: { climate: [], doctrine: [], gameplay: [], evidence: [], decisions: [] },
    createdAt: '', updatedAt: '', revision: 1,
  });
  await importDialog(page).locator('input[type=file]').setInputFiles({ name: 'm.json', mimeType: 'application/json', buffer: Buffer.from(json) });
  await expect(importDialog(page).getByRole('status')).toHaveText(/Ready to import/);
  await expect(node(page, 'JSON User')).toHaveCount(0);
  await importDialog(page).getByRole('button', { name: 'Confirm import' }).click();
  await expect(node(page, 'JSON User')).toBeVisible();
});

test('hostile input: oversized files are refused and scripts never run', async ({ page }) => {
  await mapWith(page);
  let dialogFired = false;
  page.on('dialog', (d) => { dialogFired = true; void d.dismiss(); });

  await openImport(page);
  await importDialog(page).locator('input[type=file]').setInputFiles({ name: 'big.owm', mimeType: 'text/plain', buffer: Buffer.alloc(2_100_000, 'a') });
  await expect(importDialog(page).getByRole('status')).toHaveText(/cannot import/);
  await expect(importDialog(page).getByText(/too large/)).toBeVisible();
  await importDialog(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(node(page, 'Kettle')).toBeVisible();

  await openImport(page);
  await importDialog(page).getByLabel(/paste OWM/).fill(
    'anchor <img src=x onerror=alert(1)> [0.9, 0.5]\nsubmap S [0.5, 0.5] url [javascript:alert(1)]\n<img src=x onerror=alert(1)>->S\n'
  );
  await importDialog(page).getByRole('button', { name: 'Preview import' }).click();
  await expect(importDialog(page).getByText(/only http\(s\) links are allowed/)).toBeVisible();
  await importDialog(page).getByRole('button', { name: 'Confirm import' }).click();
  await expect(node(page, '<img src=x onerror=alert(1)>')).toBeVisible();
  expect(await page.locator('img[src="x"]').count()).toBe(0);
  expect(dialogFired).toBe(false);
});

test('exports are deterministic and independent of zoom', async ({ page }) => {
  await mapWith(page, TEA_SHOP + 'inertia Kettle\nevolve Kettle 0.62 as Electric Kettle\n');
  await page.getByRole('button', { name: 'Export map' }).click();

  const svg1 = await download(page, /^SVG/);
  const svg2 = await download(page, /^SVG/);
  expect(svg1.d.suggestedFilename()).toBe('tea-shop.svg');
  expect(svg1.body.equals(svg2.body)).toBe(true);
  expect(svg1.body.toString()).toContain('Electric Kettle');

  const owm = await download(page, /^OWM source/);
  expect(owm.body.toString()).toContain('evolve Kettle 0.62 as Electric Kettle');
  const json1 = await download(page, /^Wardley JSON/);

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^Zoom in/ }).click();
  await page.getByRole('button', { name: /^Zoom in/ }).click();
  await page.getByRole('button', { name: 'Export map' }).click();
  const svg3 = await download(page, /^SVG/);
  expect(svg3.body.equals(svg1.body)).toBe(true);
  const json2 = await download(page, /^Wardley JSON/);
  expect(json2.body.equals(json1.body)).toBe(true);

  // Dark theme changes the image, deterministically
  await exportDialog(page).getByLabel('Theme').selectOption('dark');
  const dark1 = await download(page, /^SVG/);
  const dark2 = await download(page, /^SVG/);
  expect(dark1.body.equals(svg1.body)).toBe(false);
  expect(dark1.body.equals(dark2.body)).toBe(true);
});

test('PNG export honours the chosen scale', async ({ page }) => {
  await mapWith(page);
  await page.getByRole('button', { name: 'Export map' }).click();
  await exportDialog(page).getByLabel('PNG scale').selectOption('1');
  const png = await download(page, /^PNG/);
  expect(png.body.subarray(1, 4).toString()).toBe('PNG');
  // IHDR width/height are big-endian uint32 at offsets 16 and 20
  expect(png.body.readUInt32BE(16)).toBe(1110);
  expect(png.body.readUInt32BE(20)).toBe(726);
});

test('export dialog reports what OWM leaves out and traps focus', async ({ page }) => {
  await mapWith(page);
  await page.getByRole('button', { name: 'Export map' }).click();
  await expect(exportDialog(page).getByLabel('OWM loss report')).toHaveText(/Everything in this map is representable/);
  for (let i = 0; i < 25; i++) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Export map' })).toBeFocused();
});
