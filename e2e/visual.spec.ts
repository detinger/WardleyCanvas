import { expect, Page, test } from './fixtures';
import { makeNewMap, Scenario, WardleyMap } from '../src/domain/types';
import { parseOWM } from '../src/parser/owm';
import { largeMap } from '../tests/fixtures/large-map';
import { TEA_SHOP } from './helpers';

const now = new Date().toISOString();
const fixedScenarioDate = '2026-10-25T12:00:00.000Z';

function fixed(map: WardleyMap): WardleyMap {
  return { ...map, createdAt: now, updatedAt: now };
}

const teaMap = fixed(parseOWM(TEA_SHOP, 'map_visual').map);
const emptyMap = fixed(makeNewMap('map_empty', 'New service map'));
const denseMap = fixed(largeMap());
const kettleId = teaMap.elements.find((element) => element.name === 'Kettle')!.id;
const userId = teaMap.elements.find((element) => element.name === 'Public')!.id;

const analysisMap: WardleyMap = {
  ...teaMap,
  id: 'map_analysis',
  title: 'Tea Shop strategy',
  analysis: {
    evidence: [{
      id: 'evidence-1',
      claim: 'Supplier interviews show kettle specifications converging.',
      sourceLabel: 'Procurement review',
      confidence: 'medium',
      observedAt: '2026-10-01',
    }],
    climate: [{
      id: 'climate-1', catalogId: 'cp-001', appliesToIds: [kettleId], state: 'applies',
      rationale: 'Kettles continue to move toward commodity supply.', evidenceIds: ['evidence-1'], confidence: 'medium',
    }],
    doctrine: [{
      id: 'doctrine-1', catalogId: 'dc-101', appliesToIds: [userId], state: 'applies',
      rationale: 'Customer interviews happen before roadmap reviews.', evidenceIds: ['evidence-1'], confidence: 'medium',
      capabilityState: 'practiced',
    }],
    gameplay: [{
      id: 'gameplay-1', catalogId: 'gp-001', appliesToIds: [kettleId], state: 'considering',
      rationale: 'Opening the kettle specification could shift value to tea.', evidenceIds: ['evidence-1'], confidence: 'low',
      category: 'ecosystem', intendedEffect: 'Increase compatible suppliers', leadingSignals: ['Two suppliers adopt it'],
      risks: ['Quality may diverge'], humanReviewed: false,
    }],
    decisions: [],
  },
};

const scenario: Scenario = {
  id: 'sc_visual',
  name: 'Commodity kettle',
  baselineMapId: teaMap.id,
  baselineRevision: teaMap.revision,
  baseline: teaMap,
  description: 'Explore buying a standardized kettle rather than building one.',
  horizonLabel: 'Next 12 months',
  assumptions: [{
    id: 'assumption-1', statement: 'At least three qualified suppliers remain available.', confidence: 'medium',
    evidenceIds: [], invalidationSignals: ['Lead time exceeds four weeks'],
  }],
  changes: [{
    kind: 'move-evolution', elementId: kettleId, from: 0.35, to: 0.9,
    rationale: 'Kettles are widely available as a commodity.',
  }],
  consequences: [{
    id: 'consequence-1', affectedIds: [kettleId], description: 'Procurement gets cheaper but supplier dependence increases.',
    direction: 'mixed', magnitude: 'medium', confidence: 'medium', evidenceIds: [],
    uncertaintyNotes: 'Pricing may change after consolidation.',
  }],
  createdAt: fixedScenarioDate,
  updatedAt: fixedScenarioDate,
};

async function installState(
  page: Page,
  options: { theme?: 'light' | 'dark'; maps?: WardleyMap[]; scenarios?: Scenario[] } = {}
) {
  const theme = options.theme ?? 'light';
  const maps = options.maps ?? [teaMap];
  const scenarios = options.scenarios ?? [];
  await page.addInitScript(({ theme, maps, scenarios }) => {
    localStorage.setItem('wardleyStudio.theme', theme);
    localStorage.setItem('wardleyStudio.maps', JSON.stringify(Object.fromEntries(maps.map((map) => [
      map.id,
      { current: map, versions: [{ map, note: 'Visual baseline', savedAt: map.updatedAt }] },
    ]))));
    localStorage.setItem('wardleyStudio.scenarios', JSON.stringify(Object.fromEntries(
      maps.map((map) => [map.id, scenarios.filter((item) => item.baselineMapId === map.id)])
    )));
  }, { theme, maps, scenarios });
}

async function settle(page: Page, theme: 'light' | 'dark') {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction((expected) => document.documentElement.getAttribute('data-theme') === expected, theme);
  await page.evaluate(() => document.fonts.ready);
}

test('overview — light desktop, hover and keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await installState(page, { maps: [teaMap] });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Map, understand/ })).toBeVisible();
  await settle(page, 'light');
  const mapCard = page.getByRole('link', { name: /Tea Shop/ });
  await mapCard.hover();
  await mapCard.focus();
  await expect(page).toHaveScreenshot('overview-light-1440.png');
});

test('map collection — dark 1100px layout', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await installState(page, { theme: 'dark', maps: [teaMap, analysisMap] });
  await page.goto('/maps');
  await expect(page.getByRole('heading', { name: 'Maps' })).toBeVisible();
  await settle(page, 'dark');
  await page.getByRole('link', { name: /Tea Shop/ }).first().hover();
  await expect(page).toHaveScreenshot('maps-dark-1100.png');
});

test('empty editor — light 900px with disabled and focused controls', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await installState(page, { maps: [emptyMap] });
  await page.goto(`/maps/${emptyMap.id}`);
  await expect(page.getByText('Start by adding an anchor (user or stakeholder)')).toBeVisible();
  await settle(page, 'light');
  await page.getByRole('button', { name: 'Add component (C)' }).focus();
  await expect(page.getByRole('button', { name: /^Undo/ })).toBeDisabled();
  await expect(page).toHaveScreenshot('editor-empty-light-900.png');
});

test('dense editor — dark 820px reflow with selection', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1000 });
  await installState(page, { theme: 'dark', maps: [denseMap] });
  await page.goto(`/maps/${denseMap.id}`);
  const component = page.getByRole('group', { name: 'Wardley map canvas' }).getByRole('button', { name: 'Component 199', exact: true });
  await expect(component).toBeVisible();
  await settle(page, 'dark');
  await component.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('complementary', { name: 'Map inspector' }).getByLabel('Name', { exact: true })).toHaveValue('Component 199');
  await expect(page).toHaveScreenshot('editor-dense-dark-820.png');
});

test('learning feedback — light smallest viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await installState(page);
  await page.goto('/learn/purpose-users-needs');
  await page.getByRole('button', { name: 'Start challenge' }).click();
  await page.getByRole('button', { name: 'Check my map' }).click();
  await expect(page.getByRole('region', { name: 'Check results' })).toContainText(/of 5 checks passed/);
  await settle(page, 'light');
  await expect(page).toHaveScreenshot('learning-feedback-light-375.png');
});

test('editor errors and dialogs — light desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await installState(page, { maps: [teaMap] });
  await page.goto(`/maps/${teaMap.id}`);
  await expect(page.getByRole('toolbar', { name: 'Map editor toolbar' })).toBeVisible();
  await settle(page, 'light');

  await page.getByRole('button', { name: 'Import OWM or JSON' }).click();
  const dialog = page.getByRole('dialog', { name: 'Import map' });
  await dialog.getByLabel(/paste OWM/).fill('component A [0.5, 0.5]\nA->Ghost\n');
  await dialog.getByRole('button', { name: 'Preview import' }).click();
  await expect(dialog.getByRole('status')).toHaveText(/cannot import/);
  await expect(page).toHaveScreenshot('import-error-dialog-light-1440.png');

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Split mode' }).click();
  await page.getByRole('textbox', { name: 'OWM source editor' }).fill('component Broken [oops]\n');
  await expect(page.getByText('1 error')).toBeVisible();
  await expect(page).toHaveScreenshot('source-error-split-light-1440.png');
});

test('analysis summary — light desktop tables', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await installState(page, { maps: [analysisMap] });
  await page.goto(`/maps/${analysisMap.id}`);
  await page.getByRole('complementary', { name: 'Map inspector' }).getByRole('tab', { name: /Analysis/ }).click();
  await expect(page.getByRole('table', { name: 'All assessments' })).toBeVisible();
  await settle(page, 'light');
  await expect(page).toHaveScreenshot('analysis-summary-light-1440.png');
});

test('scenario comparison — dark 1100px layout', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await installState(page, { theme: 'dark', maps: [teaMap], scenarios: [scenario] });
  await page.goto(`/maps/${teaMap.id}/scenarios/${scenario.id}`);
  await page.getByRole('button', { name: 'Overlay', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Scenario overlaid on baseline' })).toBeVisible();
  await settle(page, 'dark');
  await expect(page).toHaveScreenshot('scenario-comparison-dark-1100.png');
});
