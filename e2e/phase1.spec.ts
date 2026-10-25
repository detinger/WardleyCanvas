import { test, expect, Page } from './fixtures';

// Phase 1 release slice: create, connect, position, validate, save, reopen, recover.

const SOURCE = `title Tea Shop
// Purpose: Serve tea to the public

anchor Public [0.95, 0.70]
component Cup of Tea [0.80, 0.60]
component Hot Water [0.50, 0.80]
component Kettle [0.40, 0.35]

Public->Cup of Tea
Cup of Tea->Hot Water
Hot Water->Kettle
`;

async function newMap(page: Page) {
  await page.goto('/maps/new');
  await page.waitForURL(/\/maps\/map_/);
  await expect(page.getByRole('toolbar', { name: 'Map editor toolbar' })).toBeVisible();
  return page.url();
}

async function typeSource(page: Page, text: string) {
  await page.getByRole('button', { name: 'Split mode' }).click();
  const editor = page.getByRole('textbox', { name: 'OWM source editor' });
  await editor.fill(text);
  return editor;
}

const canvas = (page: Page) => page.getByRole('img', { name: 'Wardley map canvas' });

test('source edits render, autosave, and survive reload', async ({ page }) => {
  const url = await newMap(page);
  await typeSource(page, SOURCE);

  for (const name of ['Public', 'Cup of Tea', 'Hot Water', 'Kettle']) {
    await expect(canvas(page).getByRole('button', { name, exact: true })).toBeVisible();
  }

  // Source edits are undoable
  await page.getByRole('button', { name: /^Undo/ }).click();
  await expect(canvas(page).getByRole('button', { name: 'Kettle', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /^Redo/ }).click();
  await expect(canvas(page).getByRole('button', { name: 'Kettle', exact: true })).toBeVisible();

  // Autosaved without committing a version
  await page.waitForTimeout(2000);
  await page.goto(url);
  await page.getByRole('button', { name: 'Split mode' }).click();
  await expect(page.getByRole('textbox', { name: 'OWM source editor' })).toHaveValue(/Hot Water->Kettle/);
  await expect(page.getByRole('textbox', { name: 'OWM source editor' })).toHaveValue(/Purpose: Serve tea/);
});

test('invalid source never destroys the rendered map', async ({ page }) => {
  await newMap(page);
  const editor = await typeSource(page, SOURCE);
  await expect(canvas(page).getByRole('button', { name: 'Kettle', exact: true })).toBeVisible();

  await editor.fill(SOURCE + 'Kettle->Nowhere\n');
  await expect(page.getByText(/not found/).first()).toBeVisible();
  await expect(canvas(page).getByRole('button', { name: 'Kettle', exact: true })).toBeVisible();
  // The invalid draft text is kept
  await expect(editor).toHaveValue(/Kettle->Nowhere/);
});

test('save version, reopen, and no spurious recovery prompt', async ({ page }) => {
  const url = await newMap(page);
  await typeSource(page, SOURCE);
  await expect(canvas(page).getByRole('button', { name: 'Kettle', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Save version' }).click();
  await expect(page.getByText(/Revision \d+ saved/).first()).toBeVisible();

  await page.goto(url);
  await expect(canvas(page).getByRole('button', { name: 'Kettle', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /recover draft/i })).toHaveCount(0);

  await page.goto('/maps');
  await expect(page.getByText('Tea Shop').first()).toBeVisible();
});

test('a newer draft is offered and actually restored', async ({ page }) => {
  const url = await newMap(page);
  await typeSource(page, SOURCE);
  await page.getByRole('button', { name: 'Save version' }).click();
  await expect(page.getByText(/Revision \d+ saved/).first()).toBeVisible();

  // Simulate a crash: a draft that differs from the saved map
  const mapId = url.split('/maps/')[1];
  await page.evaluate((id) => {
    const store = JSON.parse(localStorage.getItem('wardleyStudio.maps')!);
    const draft = structuredClone(store[id].current);
    draft.elements.push({ id: 'el_draft', kind: 'component', name: 'Recovered Thing', componentType: 'unspecified', visibility: 0.3, evolution: 0.5 });
    localStorage.setItem('wardleyStudio.drafts', JSON.stringify({ [id]: draft }));
  }, mapId);

  await page.goto(url);
  await expect(canvas(page).getByRole('button', { name: 'Recovered Thing' })).toHaveCount(0);
  await page.getByRole('button', { name: /recover draft/i }).click();
  await expect(canvas(page).getByRole('button', { name: 'Recovered Thing' })).toBeVisible();
});

test('keyboard: select an element and delete it, then undo', async ({ page }) => {
  await newMap(page);
  await typeSource(page, SOURCE);
  await page.getByRole('button', { name: 'Visual mode' }).click();
  const kettle = canvas(page).getByRole('button', { name: 'Kettle', exact: true });
  await kettle.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Delete');
  await expect(kettle).toHaveCount(0);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(canvas(page).getByRole('button', { name: 'Kettle', exact: true })).toBeVisible();
});
