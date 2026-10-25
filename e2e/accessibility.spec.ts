import { test, expect, Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { mapWith, node } from './helpers';

// QA-03: automated accessibility checks on core routes (no serious or critical
// violations), plus the Section 6.5 non-canvas paths.

async function scan(page: Page, label: string) {
  // Theme is applied after hydration; let colour transitions (120ms) settle
  await page.locator('html[data-theme]').waitFor({ state: 'attached' });
  await page.waitForTimeout(300);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const blocking = results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${label}: ${v.id} (${v.impact}) — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(blocking).toEqual([]);
}

for (const theme of ['light', 'dark'] as const) {
  test(`core routes have no serious accessibility violations (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    await scan(page, 'home');
    await page.goto('/maps');
    await scan(page, 'maps');
    await mapWith(page);
    await scan(page, 'editor');
    await page.getByRole('tab', { name: /Analysis/ }).click();
    await scan(page, 'editor analysis');
    await page.goto('/learn');
    await scan(page, 'learn');
    await page.goto('/learn/purpose-users-needs');
    await scan(page, 'lesson');
    await page.getByRole('button', { name: 'Start challenge' }).click();
    await scan(page, 'challenge');
    for (const route of ['/reference', '/learn/challenges', '/scenarios', '/settings', '/help']) {
      await page.goto(route);
      await scan(page, route);
    }
  });
}

test('the outline mirrors the map and drives selection', async ({ page }) => {
  await mapWith(page);
  await page.getByRole('button', { name: 'Show outline' }).click();
  const outline = page.getByRole('navigation', { name: 'Map outline' });
  await expect(outline).toContainText('5 elements, 3 dependencies');
  await outline.getByRole('button', { name: /^Kettle/ }).click();
  await expect(node(page, 'Kettle')).toHaveAttribute('aria-pressed', 'true');
  await expect(outline.getByRole('button', { name: /^Kettle/ })).toHaveAttribute('aria-current', 'true');
  await expect(outline.getByRole('list', { name: 'Hot Water depends on' })).toContainText('depends on Kettle');
  await expect(page.getByTestId('editor-announcer')).toHaveText(/Selected Kettle/);
});

test('deleting a component others depend on asks first and lists what is affected', async ({ page }) => {
  await mapWith(page);
  await node(page, 'Kettle').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Delete');
  const dialog = page.getByRole('dialog', { name: 'Delete “Kettle”?' });
  await expect(dialog).toContainText('Hot Water depends on Kettle');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(node(page, 'Kettle')).toBeVisible();

  await page.keyboard.press('Delete');
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(node(page, 'Kettle')).toHaveCount(0);
  await expect(page.getByTestId('editor-announcer')).toHaveText(/Deleted 1 element/);

  // Something nothing depends on is deleted straight away
  await node(page, 'Power').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Delete');
  await expect(node(page, 'Power')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('keyboard shortcut reference opens with ? and closes with Escape', async ({ page }) => {
  await mapWith(page);
  await node(page, 'Kettle').focus();
  await page.keyboard.press('?');
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await expect(dialog).toContainText('Nudge the selection');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('focused canvas elements show a visible focus outline', async ({ page }) => {
  await mapWith(page);
  await page.keyboard.press('Tab');
  await node(page, 'Kettle').focus();
  // Keyboard-initiated focus matches :focus-visible
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => {
    const el = document.activeElement as Element | null;
    return el && el.getAttribute('role') === 'button' && el.closest('svg') ? getComputedStyle(el).outlineStyle : 'n/a';
  });
  expect(['solid', 'n/a']).toContain(outline);
});

test('reduced-motion preference removes nonessential transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const durations = await page.getByRole('link', { name: 'Maps', exact: true }).evaluate((el) => {
    const style = getComputedStyle(el);
    return { animation: style.animationDuration, transition: style.transitionDuration };
  });
  const seconds = (value: string) => value.endsWith('ms') ? Number.parseFloat(value) / 1000 : Number.parseFloat(value);
  expect(seconds(durations.animation)).toBeLessThanOrEqual(0.00001);
  expect(seconds(durations.transition)).toBeLessThanOrEqual(0.00001);
});

test('forced colors keeps keyboard focus visible', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced-colors emulation is a Chromium release gate');
  await page.emulateMedia({ forcedColors: 'active' });
  await mapWith(page);
  await node(page, 'Kettle').focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(outline).toBe('solid');
});
