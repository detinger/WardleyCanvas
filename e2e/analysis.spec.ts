import { test, expect, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { mapWith, node } from './helpers';

// Phase 4 gates (E2E scenario 4): a strategist assesses one climate pattern, one
// doctrine principle and one gameplay hypothesis with evidence.

const inspector = (page: Page) => page.getByRole('complementary', { name: 'Map inspector' });

async function openAnalysis(page: Page, sub: 'Summary' | 'Climate' | 'Doctrine' | 'Gameplay') {
  await page.keyboard.press('Escape');
  await inspector(page).getByRole('tab', { name: /Analysis/ }).click();
  await inspector(page).getByRole('button', { name: new RegExp(`^${sub}`) }).click();
}

test('climate, doctrine and gameplay assessments with evidence, summarised and exported', async ({ page }) => {
  await mapWith(page);

  // Climate: decide, explain, link components and evidence
  await openAnalysis(page, 'Climate');
  const climateCard = inspector(page).getByRole('group', { name: 'Everything evolves' });
  await climateCard.getByRole('button', { name: 'applies', exact: true }).click();
  await climateCard.getByLabel(/Rationale/).fill('Kettles are moving to commodity');
  await climateCard.getByLabel(/Rationale/).press('Tab');
  await climateCard.getByLabel('Kettle').check();
  // The affected component is called out on the canvas
  await expect(node(page, 'Kettle').locator('rect[stroke="var(--accent)"]')).toHaveCount(1);
  await climateCard.getByRole('button', { name: 'New evidence' }).click();
  await climateCard.getByLabel('Claim').fill('Three suppliers now sell identical kettles');
  await climateCard.getByLabel(/Link/).fill('javascript:alert(1)');
  await expect(climateCard.getByText('Only http(s) links are allowed.')).toBeVisible();
  await climateCard.getByLabel(/Link/).fill('https://example.com/report');
  await climateCard.getByRole('button', { name: 'Add and link evidence' }).click();
  await expect(climateCard.getByLabel(/Three suppliers/)).toBeChecked();

  // Changing the state keeps rationale and evidence
  await climateCard.getByRole('button', { name: 'uncertain', exact: true }).click();
  await expect(climateCard.getByRole('button', { name: 'uncertain', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(climateCard.getByLabel(/Rationale/)).toHaveValue('Kettles are moving to commodity');
  await expect(climateCard.getByLabel(/Three suppliers/)).toBeChecked();

  // Doctrine
  await openAnalysis(page, 'Doctrine');
  const doctrineCard = inspector(page).getByRole('group', { name: 'Know your users' });
  await doctrineCard.getByRole('button', { name: 'emerging', exact: true }).click();
  await doctrineCard.getByLabel(/Rationale/).fill('We interview customers twice a year');
  await doctrineCard.getByLabel(/Rationale/).press('Tab');
  await doctrineCard.getByLabel(/Three suppliers/).check();

  // Gameplay: hypothesis with signals, risks and explicit review
  await openAnalysis(page, 'Gameplay');
  await inspector(page).getByRole('button', { name: /Open approach/ }).click();
  await inspector(page).getByRole('button', { name: 'Add as hypothesis' }).click();
  const play = inspector(page);
  await play.getByLabel(/Rationale — why this play/).fill('Opening the kettle spec shifts value to tea');
  await play.getByLabel(/Rationale — why this play/).press('Tab');
  await play.getByLabel(/Leading signals/).fill('Two rivals adopt the spec');
  await play.getByLabel(/Leading signals/).press('Tab');
  await expect(play.getByLabel(/Risks and possible harms/)).not.toHaveValue('');

  // Sensitive plays carry a caution
  await inspector(page).getByRole('button', { name: /Raising barriers to entry/ }).click();
  await expect(inspector(page).getByRole('note').filter({ hasText: 'Caution' })).toBeVisible();

  // Summary: transparent counts and attention items, no score
  await openAnalysis(page, 'Summary');
  const summary = inspector(page);
  await expect(summary.getByRole('table', { name: 'All assessments' }).getByRole('row')).toHaveCount(4);
  await expect(summary.getByRole('note', { name: 'Needs attention' })).toContainText('not yet reviewed for risks and ethics');
  await expect(summary.getByRole('table', { name: /Doctrine by phase/ })).toBeVisible();
  await expect(summary).not.toContainText('%');

  // Exports
  await page.getByRole('button', { name: 'Export map' }).click();
  const dialog = page.getByRole('dialog', { name: 'Export map' });
  const [csv] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: /Analysis table/ }).click()]);
  const csvText = await readFile((await csv.path())!, 'utf8');
  expect(csvText.split('\r\n')[0]).toMatch(/^kind,catalog_id,title/);
  expect(csvText).toContain('Everything evolves');
  const [json] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: /Analysis JSON/ }).click()]);
  const payload = JSON.parse(await readFile((await json.path())!, 'utf8'));
  expect(payload.catalogs.license).toMatch(/CC BY-SA 4\.0/);
  expect(payload.assessments.find((a: { kind: string }) => a.kind === 'gameplay').humanReviewed).toBe(false);
  expect(payload.analysis.evidence[0].sourceUrl).toBe('https://example.com/report');
});

test('evolve arrows, pipelines, notes and sourcing are editable without the source view', async ({ page }) => {
  await mapWith(page);
  await node(page, 'Kettle').focus();
  await page.keyboard.press('Enter');
  await inspector(page).getByLabel('Sourcing').selectOption('build');
  await inspector(page).getByRole('tab', { name: /Evolution/ }).click();
  await inspector(page).getByRole('button', { name: 'Add evolve arrow' }).click();
  await inspector(page).getByLabel(/Target evolution/).fill('0.7');
  await inspector(page).getByLabel(/New name after the move/).fill('Electric Kettle');
  await inspector(page).getByLabel(/New name after the move/).press('Tab');
  await inspector(page).getByLabel(/Rationale — why will it move/).fill('Standard power makes kettles a product');
  await inspector(page).getByLabel(/Rationale — why will it move/).press('Tab');
  await inspector(page).getByRole('button', { name: /Make Kettle a pipeline/ }).click();

  await page.keyboard.press('Escape');
  await inspector(page).getByRole('tab', { name: /Details/ }).click();
  await inspector(page).getByRole('button', { name: 'Add numbered annotation' }).click();

  await page.getByRole('button', { name: 'Split mode' }).click();
  const source = await page.getByRole('textbox', { name: 'OWM source editor' }).inputValue();
  expect(source).toContain('evolve Kettle 0.70 as Electric Kettle');
  expect(source).toContain('build Kettle');
  expect(source).toMatch(/pipeline Kettle \[/);
  expect(source).toMatch(/annotation 1 \[/);
});
