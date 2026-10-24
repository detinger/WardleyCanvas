import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

try {
  await page.goto('http://localhost:9002/', { timeout: 15000 });
  await page.waitForTimeout(2000);
  const homeTitle = await page.title();
  await page.screenshot({ path: '/tmp/ss-home.png' });
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => 'missing');
  console.log('HOME title:', homeTitle);
  console.log('HOME h1:', h1?.slice(0, 80));

  const createBtn = page.locator('button', { hasText: 'Create map' }).first();
  await createBtn.click({ timeout: 5000 });
  await page.waitForURL('**/maps/**', { timeout: 10000 });
  await page.waitForTimeout(2500);
  console.log('EDITOR url:', page.url());
  await page.screenshot({ path: '/tmp/ss-editor.png' });

  const toolbars = await page.locator('[role="toolbar"]').count();
  const complems = await page.locator('[role="complementary"]').count();
  console.log('Toolbar count:', toolbars, '| Complementary count:', complems);

  // list all buttons in toolbar
  const btnLabels = await page.locator('[role="toolbar"] button').evaluateAll(els =>
    els.map(b => b.getAttribute('aria-label') || b.getAttribute('title') || b.textContent?.trim()).slice(0, 20)
  );
  console.log('Toolbar buttons:', JSON.stringify(btnLabels));

  // find anchor button
  const anchorBtn = page.locator('[role="toolbar"] button').filter({ hasText: /anchor/i }).first();
  const ariaAnchor = page.locator('[role="toolbar"] button[aria-label*="anchor" i]').first();
  const titleAnchor = page.locator('[role="toolbar"] button[title*="anchor" i]').first();
  const aCnt = await anchorBtn.count() + await ariaAnchor.count() + await titleAnchor.count();
  console.log('Anchor button matches:', aCnt);

  if (await ariaAnchor.count() > 0) {
    await ariaAnchor.click();
  } else if (await titleAnchor.count() > 0) {
    await titleAnchor.click();
  } else if (await anchorBtn.count() > 0) {
    await anchorBtn.click();
  }

  const svg = page.locator('svg[role="img"]').first();
  const svgCount = await svg.count();
  console.log('SVG[role=img] count:', svgCount);
  const box = svgCount > 0 ? await svg.boundingBox() : null;
  if (box) {
    await page.mouse.click(box.x + 150, box.y + 100);
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: '/tmp/ss-anchor.png' });
  const polys = await page.locator('polygon').count();
  const circles1 = await page.locator('circle').count();
  console.log('After anchor — polygons:', polys, 'circles:', circles1);

  // component
  const compBtn = page.locator('[role="toolbar"] button[aria-label*="component" i], [role="toolbar"] button[title*="component" i]').first();
  if (await compBtn.count() > 0) {
    await compBtn.click();
    if (box) {
      await page.mouse.click(box.x + 450, box.y + 360);
      await page.waitForTimeout(800);
    }
  }
  await page.screenshot({ path: '/tmp/ss-component.png' });
  const circles2 = await page.locator('circle').count();
  console.log('After component — circles:', circles2);

  await page.keyboard.press('Meta+z');
  await page.waitForTimeout(500);
  const circles3 = await page.locator('circle').count();
  console.log('After undo — circles:', circles3);

  // theme toggle
  const themeBtn = page.locator('button[aria-label*="theme" i], button[title*="theme" i], button[aria-label*="dark" i]').first();
  if (await themeBtn.count() > 0) {
    await themeBtn.click();
    await page.waitForTimeout(500);
    const dt = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log('data-theme after toggle:', dt);
    await page.screenshot({ path: '/tmp/ss-dark.png' });
  } else {
    console.log('Theme button not found');
  }

  await page.goto('http://localhost:9002/maps', { timeout: 10000 });
  await page.waitForTimeout(1500);
  const mapsH1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => 'missing');
  console.log('MAPS page h1:', mapsH1?.trim());
  const mapLinks = await page.locator('a[href^="/maps/"]').count();
  console.log('Map links on /maps:', mapLinks);
  await page.screenshot({ path: '/tmp/ss-maps.png' });

} catch(e) {
  console.error('ERROR:', e.message);
  await page.screenshot({ path: '/tmp/ss-error.png' }).catch(() => {});
} finally {
  await browser.close();
  console.log('--- DONE ---');
}
