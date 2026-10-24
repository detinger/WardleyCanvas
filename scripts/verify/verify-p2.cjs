const { chromium } = require('playwright');

(async () => {
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

try {
  // Go to editor
  await page.goto('http://localhost:9002/', { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.locator('button', { hasText: 'Create map' }).first().click();
  await page.waitForURL('**/maps/**', { timeout: 10000 });
  await page.waitForTimeout(2500);
  console.log('EDITOR:', page.url().replace('http://localhost:9002', ''));

  // Check new toolbar buttons are present
  const btnLabels = await page.locator('[role="toolbar"] button').evaluateAll(els =>
    els.map(b => (b.getAttribute('aria-label') || '').trim()).filter(Boolean)
  );
  console.log('Toolbar buttons:', JSON.stringify(btnLabels));
  const hasVisual = btnLabels.includes('Visual mode');
  const hasSplit  = btnLabels.includes('Split mode');
  const hasSource = btnLabels.includes('Source mode');
  const hasImport = btnLabels.includes('Import OWM or JSON');
  const hasExport = btnLabels.includes('Export map');
  console.log('Mode buttons — Visual:', hasVisual, '| Split:', hasSplit, '| Source:', hasSource);
  console.log('Import:', hasImport, '| Export:', hasExport);
  await page.screenshot({ path: '/tmp/ss-p2-toolbar.png' });

  // Switch to split mode
  await page.getByRole('toolbar').getByLabel('Split mode').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/ss-p2-split.png' });
  const sourceEditorVisible = await page.locator('textarea[aria-label="OWM source editor"]').isVisible();
  console.log('Source editor in split mode:', sourceEditorVisible);

  // Check OWM content in source editor
  const owmContent = await page.locator('textarea[aria-label="OWM source editor"]').inputValue();
  console.log('OWM source starts with:', owmContent.slice(0, 60).trim());

  // Switch to source mode
  await page.getByRole('toolbar').getByLabel('Source mode').click();
  await page.waitForTimeout(600);
  const sourceOnlyVisible = await page.locator('textarea[aria-label="OWM source editor"]').isVisible();
  console.log('Source editor in source-only mode:', sourceOnlyVisible);
  await page.screenshot({ path: '/tmp/ss-p2-source.png' });

  // Switch back to visual
  await page.getByRole('toolbar').getByLabel('Visual mode').click();
  await page.waitForTimeout(400);

  // Open export dialog
  await page.getByRole('toolbar').getByLabel('Export map').click();
  await page.waitForTimeout(600);
  const exportDialog = await page.locator('[role="dialog"]').isVisible();
  console.log('Export dialog opens:', exportDialog);
  const exportOptions = await page.locator('[role="dialog"] button').evaluateAll(els =>
    els.map(b => (b.textContent || '').trim().slice(0, 30)).filter(s => s.length > 2)
  );
  console.log('Export options:', JSON.stringify(exportOptions));
  await page.screenshot({ path: '/tmp/ss-p2-export.png' });
  await page.keyboard.press('Escape');
  await page.locator('[role="dialog"]').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});

  // Close dialog by clicking X
  if (await page.locator('[role="dialog"]').isVisible()) {
    await page.locator('[role="dialog"] button[aria-label="Close"]').click();
    await page.waitForTimeout(400);
  }

  // Open import dialog
  await page.getByRole('toolbar').getByLabel('Import OWM or JSON').click();
  await page.waitForTimeout(600);
  const importDialog = await page.locator('[role="dialog"]').isVisible();
  console.log('Import dialog opens:', importDialog);
  await page.screenshot({ path: '/tmp/ss-p2-import.png' });

  // Paste OWM into import textarea
  const owmSample = `title Tea Shop\n\nanchor Customer [0.95, 0.1]\ncomponent Tea Cup [0.8, 0.5]\ncomponent Hot Water [0.6, 0.3]\n\nCustomer->Tea Cup\nTea Cup->Hot Water\n\ninertia Tea Cup\nevolve Hot Water 0.7\n`;
  await page.locator('[role="dialog"] textarea').fill(owmSample);
  await page.waitForTimeout(300);

  // Click preview
  await page.locator('[role="dialog"] button', { hasText: 'Preview import' }).click();
  await page.waitForTimeout(800);
  const previewVisible = await page.locator('[role="dialog"]').textContent().catch(() => '');
  const hasPreviewStats = previewVisible.includes('Tea Shop') || previewVisible.includes('Anchors') || previewVisible.includes('Components');
  console.log('Import preview shows map info:', hasPreviewStats);
  await page.screenshot({ path: '/tmp/ss-p2-import-preview.png' });

  // Confirm import
  await page.locator('[role="dialog"] button', { hasText: 'Confirm import' }).click();
  await page.waitForTimeout(1000);
  const dialogGone = !(await page.locator('[role="dialog"]').isVisible());
  console.log('Dialog closed after import:', dialogGone);

  // Check canvas now has the imported map
  const canvasSvg = page.locator('svg[aria-label="Wardley map canvas"]');
  const polys = await canvasSvg.locator('polygon').count();
  const circles = await canvasSvg.locator('circle[r="8"]').count();
  console.log('After import — polygons (anchors):', polys, '| circles (components):', circles);
  await page.screenshot({ path: '/tmp/ss-p2-imported.png' });

  // Check source mode shows imported map
  await page.getByRole('toolbar').getByLabel('Split mode').click();
  await page.waitForTimeout(600);
  const importedSource = await page.locator('textarea[aria-label="OWM source editor"]').inputValue();
  const sourceHasTitle = importedSource.includes('Tea Shop');
  const sourceHasInertia = importedSource.includes('inertia');
  const sourceHasEvolve = importedSource.includes('evolve');
  console.log('Imported source — has title:', sourceHasTitle, '| inertia:', sourceHasInertia, '| evolve:', sourceHasEvolve);
  console.log('Source preview:', importedSource.slice(0, 200));
  await page.screenshot({ path: '/tmp/ss-p2-split-imported.png' });

  console.log('\n=== PHASE 2 VERIFICATION COMPLETE ===');

} catch(e) {
  console.error('ERROR:', e.message);
  await page.screenshot({ path: '/tmp/ss-p2-error.png' }).catch(() => {});
} finally {
  await browser.close();
}
})();
