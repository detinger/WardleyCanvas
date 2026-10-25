import { test, expect, Page } from '@playwright/test';

// Phase 3 gates: LRN-04 first-map onboarding (keyboard only), LRN-05 accessible
// feedback, LRN-02 progress, example answer only after completion.

const node = (page: Page, name: string) =>
  page.getByRole('img', { name: 'Wardley map canvas' }).getByRole('button', { name, exact: true });
const inspector = (page: Page) => page.getByRole('complementary', { name: 'Map inspector' });

async function rename(page: Page, to: string) {
  const field = inspector(page).getByLabel('Name', { exact: true });
  await field.fill(to);
  await field.press('Tab');
}

async function depend(page: Page, from: string, to: string) {
  await node(page, from).focus();
  await page.keyboard.press('Enter');
  await inspector(page).getByRole('tab', { name: /Connections/ }).click();
  await inspector(page).getByLabel(new RegExp(`${from} depends on`)).selectOption({ label: to });
  await inspector(page).getByRole('button', { name: 'Add', exact: true }).click();
  await inspector(page).getByRole('tab', { name: /Details/ }).click();
}

test('a new learner completes the first-map challenge by keyboard', async ({ page }) => {
  await page.goto('/learn/purpose-users-needs');
  await expect(page.getByText('Draft — awaiting expert review')).toBeVisible();
  await page.getByRole('button', { name: 'Start challenge' }).focus();
  await page.keyboard.press('Enter');

  // Checking straight away explains what is missing, why it matters and one next move
  const check = page.getByRole('button', { name: 'Check my map' });
  await check.focus();
  await page.keyboard.press('Enter');
  const results = page.getByRole('region', { name: 'Check results' });
  await expect(results).toContainText(/of 5 checks passed/);
  await expect(results).toContainText('Why it matters:');
  await expect(results).toContainText('Try:');
  await expect(page.getByRole('status').first()).toHaveText(/checks passed/);
  // The example answer is not revealed after a failed attempt
  await expect(page.getByText('Compare with one possible answer')).toHaveCount(0);

  // Name the anchor and describe the need
  await node(page, 'User').focus();
  await page.keyboard.press('Enter');
  await rename(page, 'Commuter');
  const description = inspector(page).getByLabel('Description', { exact: true });
  await description.fill('Is trying to get a reliable coffee on the way to work.');
  await description.press('Tab');

  // Create two components without a pointer (C shortcut), then name them
  await node(page, 'Commuter').focus();
  await page.keyboard.press('c');
  await rename(page, 'Cup of Coffee');
  await node(page, 'Cup of Coffee').focus();
  await page.keyboard.press('c');
  await rename(page, 'Coffee Machine');

  await depend(page, 'Commuter', 'Cup of Coffee');
  await depend(page, 'Cup of Coffee', 'Coffee Machine');

  await check.focus();
  await page.keyboard.press('Enter');
  await expect(results).toContainText('All checks passed');
  // Focus moves to the feedback so keyboard and screen-reader users land on it
  await expect(page.locator(':focus')).toContainText('All checks passed');

  await page.getByRole('button', { name: 'Continue to reflection' }).click();
  await page.getByLabel('Reflection notes').fill('The need is about time, not coffee.');
  await page.getByRole('button', { name: 'Complete module' }).click();
  await expect(page.getByText('Module complete')).toBeVisible();

  await page.getByText('Compare with one possible answer').click();
  await expect(page.getByText(/alternatives|entirely different/)).toBeVisible();

  // Progress is shown on the learning path and survives a reload
  await page.goto('/learn');
  await expect(page.getByRole('link', { name: /Purpose, users, and needs/ })).toContainText(/Complete|Completed|Done/i);
});

test('practice work survives reload and never appears among saved maps', async ({ page }) => {
  await page.goto('/learn/components-value-chains');
  await page.getByRole('button', { name: 'Start challenge' }).click();
  await node(page, 'Customer').focus();
  await page.keyboard.press('c');
  await rename(page, 'Shopfront');
  await page.reload();
  await page.getByRole('button', { name: 'Start challenge' }).click();
  await expect(node(page, 'Shopfront')).toBeVisible();

  await page.goto('/maps');
  await expect(page.getByText('Shopfront')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('wardleyStudio.maps') ?? '')).not.toContain('Shopfront');
});

test('progress can be exported and reset without touching maps', async ({ page }) => {
  await page.goto('/maps/new');
  await page.waitForURL(/\/maps\/map_/);
  const mapsBefore = await page.evaluate(() => localStorage.getItem('wardleyStudio.maps'));
  await page.goto('/learn/purpose-users-needs');
  await page.goto('/learn');

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export progress' }).click()]);
  expect(download.suggestedFilename()).toBe('wardley-learning-progress.json');

  await page.getByRole('button', { name: 'Reset progress…' }).click();
  await page.getByRole('button', { name: 'Yes, reset' }).click();
  await expect(page.getByRole('status').filter({ hasText: /were reset/ })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('wardleyStudio.maps'))).toBe(mapsBefore);
});

test('every module opens with its challenge editor', async ({ page }) => {
  const ids = [
    'purpose-users-needs', 'components-value-chains', 'visibility-evolution', 'reading-complete-map',
    'climate-inertia', 'doctrine-operating-context', 'gameplay-hypotheses', 'scenario-comparison-decisions',
  ];
  for (const id of ids) {
    await page.goto(`/learn/${id}`);
    await expect(page.locator('main h2').first()).toBeVisible();
    await page.getByRole('button', { name: 'Start challenge' }).click();
    await expect(page.getByRole('region', { name: 'Practice map editor' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check my map' })).toBeVisible();
  }
});
