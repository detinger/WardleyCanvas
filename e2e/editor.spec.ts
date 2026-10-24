import { test, expect } from '@playwright/test';
import { mapWith, node, currentSource, selectByKeyboard, canvas, newMap } from './helpers';

// Phase 1 gates: EDT-01 layouts, EDT-02 stable coordinates, EDT-04 keyboard
// dependencies, EDT-05 drag/nudge/duplicate, themes.

test('a mouse drag is one undo step', async ({ page }) => {
  await mapWith(page);
  const before = await currentSource(page);
  const box = (await node(page, 'Kettle').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 10);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) await page.mouse.move(box.x + box.width / 2 + i * 6, box.y + 10 + i * 2);
  await page.mouse.up();
  const after = await currentSource(page);
  expect(after).not.toBe(before);

  await page.getByRole('button', { name: /^Undo/ }).click();
  expect(await currentSource(page)).toBe(before);
});

test('arrow keys nudge, shift-arrow nudges further, ⌘/Ctrl+D duplicates', async ({ page }) => {
  await mapWith(page);
  await selectByKeyboard(page, 'Kettle');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowUp');
  expect(await currentSource(page)).toContain('component Kettle [0.45, 0.36]');

  await selectByKeyboard(page, 'Kettle');
  await page.keyboard.press('ControlOrMeta+d');
  await expect(node(page, 'Kettle copy')).toBeVisible();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(node(page, 'Kettle copy')).toHaveCount(0);
});

test('a dependency can be created by keyboard and its direction is stated first', async ({ page }) => {
  await mapWith(page);
  await selectByKeyboard(page, 'Kettle');
  await page.getByRole('tab', { name: /Connections/ }).click();
  await page.getByLabel(/Kettle depends on/).selectOption({ label: 'Power' });
  await expect(page.getByText('Will add: Kettle depends on Power.')).toBeVisible();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  expect(await currentSource(page)).toContain('Kettle->Power');
});

test('zoom, pan and resize never change stored coordinates', async ({ page }) => {
  await mapWith(page);
  const before = await currentSource(page);
  await page.getByRole('button', { name: /^Zoom in/ }).click();
  await page.getByRole('button', { name: /^Zoom in/ }).click();
  const c = (await canvas(page).boundingBox())!;
  await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
  await page.mouse.wheel(0, 300);
  await page.setViewportSize({ width: 1000, height: 700 });
  await page.getByRole('button', { name: /^Zoom out/ }).click();
  expect(await currentSource(page)).toBe(before);
});

test.describe('responsive layout', () => {
  const inspector = (page: import('@playwright/test').Page) => page.getByRole('complementary', { name: 'Map inspector' });

  test('inspector is 420px wide at desktop and 340px at 1100px', async ({ page }) => {
    await mapWith(page);
    expect((await inspector(page).boundingBox())!.width).toBeCloseTo(420, 0);
    await page.setViewportSize({ width: 1100, height: 800 });
    expect((await inspector(page).boundingBox())!.width).toBeCloseTo(340, 0);
  });

  for (const width of [820, 600, 375]) {
    test(`at ${width}px the inspector sits below the canvas without horizontal page scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await mapWith(page);
      const cv = (await canvas(page).boundingBox())!;
      const ins = (await inspector(page).boundingBox())!;
      expect(ins.y).toBeGreaterThanOrEqual(cv.y + cv.height - 1);
      expect(cv.height).toBeGreaterThanOrEqual(319);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      // navigation became a horizontal bar above the content
      const nav = (await page.getByRole('complementary', { name: 'Main navigation' }).boundingBox())!;
      expect(nav.width).toBeCloseTo(width, 0);
      expect(nav.height).toBeLessThan(80);
    });
  }
});

test('switching theme keeps editor state and recolours the canvas', async ({ page }) => {
  await mapWith(page);
  await selectByKeyboard(page, 'Kettle');
  const bg = () => canvas(page).evaluate((el) => getComputedStyle(el).backgroundColor);
  const light = await bg();
  const toggle = page.getByRole('button', { name: /^(Dark|Light) theme$/ });
  await toggle.click();
  const dark = await bg();
  expect(dark).not.toBe(light);
  await expect(node(page, 'Kettle')).toHaveAttribute('aria-pressed', 'true');
  await expect(node(page, 'Power')).toBeVisible();
  await toggle.click();
  expect(await bg()).toBe(light);
});

test('an empty map shows a clear next step', async ({ page }) => {
  await newMap(page);
  await expect(page.getByText(/anchor|Add/i).first()).toBeVisible();
});
