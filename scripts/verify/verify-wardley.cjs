const { chromium } = require('playwright');

(async () => {
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

try {
  // 1. Home
  await page.goto('http://localhost:9002/', { timeout: 15000 });
  await page.waitForTimeout(2500);
  const homeTitle = await page.title();
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 });
  await page.screenshot({ path: '/tmp/ss-home.png' });
  console.log('1. HOME title:', homeTitle, '| H1:', h1?.trim().slice(0, 50));

  // 2. Create map -> editor
  await page.locator('button', { hasText: 'Create map' }).first().click();
  await page.waitForURL('**/maps/**', { timeout: 10000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/ss-editor.png' });
  console.log('2. EDITOR url:', page.url().replace('http://localhost:9002', ''));

  // 3. Canvas present
  const canvasSvg = page.locator('svg[aria-label="Wardley map canvas"]');
  const canvasBox = await canvasSvg.boundingBox();
  console.log('3. Canvas box:', canvasBox ? `${canvasBox.width.toFixed(0)}x${canvasBox.height.toFixed(0)}` : 'null');

  // 4. Add anchor
  await page.getByRole('toolbar').getByLabel('Add anchor/user (A)').click();
  if (canvasBox) await page.mouse.click(canvasBox.x + canvasBox.width * 0.2, canvasBox.y + canvasBox.height * 0.3);
  await page.waitForTimeout(800);
  const polys = await canvasSvg.locator('polygon').count();
  console.log('4. Polygons after anchor:', polys, '(expect ≥1 = anchor diamond + optional selection glow)');
  await page.screenshot({ path: '/tmp/ss-anchor.png' });

  // 5. Add component
  await page.getByRole('toolbar').getByLabel('Add component (C)').click();
  if (canvasBox) await page.mouse.click(canvasBox.x + canvasBox.width * 0.5, canvasBox.y + canvasBox.height * 0.6);
  await page.waitForTimeout(800);
  const compCircles = await canvasSvg.locator('circle[r="8"]').count();
  console.log('5. Component circles (r=8) after add:', compCircles, '(expect 1)');
  await page.screenshot({ path: '/tmp/ss-component.png' });

  // 6. Undo removes component
  await page.keyboard.press('Meta+z');
  await page.waitForTimeout(500);
  const circlesAfterUndo = await canvasSvg.locator('circle[r="8"]').count();
  console.log('6. After undo component circles:', circlesAfterUndo, '(expect 0)');

  // 7. Theme toggle
  await page.waitForTimeout(500);
  const themeBtn = page.locator('button[aria-label*="theme" i]').first();
  const themeBtnCount = await themeBtn.count();
  console.log('7. Theme button found:', themeBtnCount > 0);
  if (themeBtnCount > 0) {
    await themeBtn.click();
    await page.waitForTimeout(600);
    const dt = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log('   data-theme after toggle:', dt, '(expect "dark")');
    await page.screenshot({ path: '/tmp/ss-dark.png' });
    // Toggle back
    await themeBtn.click();
    const dt2 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log('   data-theme after 2nd toggle:', dt2, '(expect "light")');
  }

  // 8. Maps list
  await page.goto('http://localhost:9002/maps', { timeout: 10000 });
  await page.waitForTimeout(1500);
  const mapsH1 = await page.locator('h1').first().textContent({ timeout: 3000 });
  const mapLinks = await page.locator('a[href^="/maps/"]').count();
  console.log('8. Maps page h1:', mapsH1?.trim(), '| Map links:', mapLinks);
  await page.screenshot({ path: '/tmp/ss-maps.png' });

  console.log('\n=== ALL VERIFICATION STEPS COMPLETE ===');

} catch(e) {
  console.error('ERROR:', e.message);
  await page.screenshot({ path: '/tmp/ss-error.png' }).catch(() => {});
} finally {
  await browser.close();
}
})();
