import { test, expect, Page } from './fixtures';
import { readFile } from 'node:fs/promises';
import { mapWith, node } from './helpers';

// Phase 5 gates (E2E scenario 5): branch scenarios, compare deltas, record a
// decision and export a decision packet; the baseline can never change.

async function saveVersion(page: Page) {
  await page.getByRole('button', { name: 'Save version' }).click();
  await expect(page.getByText(/Revision \d+ saved/).first()).toBeVisible();
}

async function createScenario(page: Page, name: string) {
  const create = page.getByRole('button', { name: /Create first scenario|New scenario/ }).first();
  await create.click();
  await page.getByLabel('Name *').fill(name);
  await page.getByRole('button', { name: 'Create scenario' }).click();
  await page.waitForURL(/\/scenarios\/sc_/);
}

test('branch, compare, decide and export; the baseline never changes', async ({ page }) => {
  const mapUrl = await mapWith(page);
  await saveVersion(page);
  const scenariosUrl = `${mapUrl}/scenarios`;

  // An alternative to reject later
  await page.goto(scenariosUrl);
  await createScenario(page, 'Modernise in place');

  await page.goto(scenariosUrl);
  await createScenario(page, 'Move to commodity');

  // Typed change with a rationale
  await page.getByRole('button', { name: 'Add change' }).click();
  await page.getByLabel('Change type').selectOption('move-evolution');
  await page.getByLabel('Element', { exact: true }).selectOption({ label: 'Kettle (component)' });
  await page.getByLabel('Target value (0–1)').fill('0.9');
  await page.getByLabel('Rationale *').fill('Kettles are a commodity now');
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  // Delta list is readable as text, and the comparison offers both views
  const deltas = page.getByRole('table', { name: /All changes \(1\)/ });
  await expect(deltas).toContainText('Kettle');
  await expect(deltas).toContainText('Kettles are a commodity now');
  await expect(page.getByRole('img', { name: /Baseline map/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Scenario map/ })).toBeVisible();
  await page.getByRole('button', { name: 'Overlay', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Overlay', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('img', { name: 'Scenario overlaid on baseline' })).toContainText('was');
  await expect(page.getByText(/not predictions/).first()).toBeVisible();

  // Edit the live map after branching: the scenario's baseline must not change
  const scenarioUrl = page.url();
  await page.goto(mapUrl);
  await node(page, 'Power').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Delete');
  await expect(node(page, 'Power')).toHaveCount(0);
  await page.waitForTimeout(500);
  await page.goto(scenarioUrl);
  await page.getByRole('button', { name: 'Side by side' }).click();
  await expect(page.getByRole('img', { name: /Baseline map/ })).toContainText('Power');
  await expect(page.getByText(/fixed snapshot/)).toBeVisible();

  // Record a decision, rejecting the alternative
  await page.getByRole('tab', { name: /Decision/ }).click();
  await page.getByRole('button', { name: 'Record decision' }).click();
  await page.getByLabel('Rationale (required)').fill('Buying kettles is cheaper than building them');
  await page.getByLabel('Owner').fill('Head of operations');
  await page.getByLabel(/Expected signals/).fill('Procurement cost falls\nNo quality complaints');
  await page.getByLabel(/Stop conditions/).fill('Supplier lead time over 4 weeks');
  await page.getByLabel('Modernise in place').check();
  await page.getByRole('button', { name: /Save decision/ }).click();
  const record = page.getByRole('article', { name: /Decision of/ });
  await expect(record).toContainText('Rejected: Modernise in place');
  await expect(record).toContainText('Expected: Procurement cost falls; No quality complaints');

  // Supersede rather than edit
  await page.getByRole('button', { name: 'Record decision' }).click();
  await page.getByLabel('Rationale (required)').fill('Revised after supplier review');
  await page.getByLabel('Supersedes').selectOption({ index: 1 });
  await page.getByRole('button', { name: /Save decision/ }).click();
  await expect(page.getByRole('article', { name: /Decision of/ })).toHaveCount(2);
  await expect(page.getByText('Decision (superseded)')).toBeVisible();

  // Decision packet
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export decision packet' }).click()]);
  expect(download.suggestedFilename()).toBe('move-to-commodity-decision-packet.md');
  const md = await readFile((await download.path())!, 'utf8');
  expect(md).toContain('# Decision packet: Move to commodity');
  expect(md).toContain('Rejected alternatives: Modernise in place');
  expect(md).toContain('Stop condition: Supplier lead time over 4 weeks');
  expect(md).toContain('Supersedes:');
});

test('scenario page stacks into one column at 1100px and below', async ({ page }) => {
  const mapUrl = await mapWith(page);
  await saveVersion(page);
  await page.goto(`${mapUrl}/scenarios`);
  await createScenario(page, 'Narrow');
  await page.setViewportSize({ width: 1000, height: 800 });
  const config = await page.getByRole('tablist').first().boundingBox();
  const heading = await page.getByRole('heading', { name: 'Narrow' }).boundingBox();
  expect(heading!.y).toBeGreaterThan(config!.y + config!.height);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
