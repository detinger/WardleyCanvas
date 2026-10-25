import { expect, Page } from '@playwright/test';

export const TEA_SHOP = `title Tea Shop
// Purpose: Serve tea to the public

anchor Public [0.95, 0.70]
component Cup of Tea [0.80, 0.60]
component Hot Water [0.50, 0.80]
component Kettle [0.40, 0.35]
component Power [0.10, 0.70]

Public->Cup of Tea
Cup of Tea->Hot Water
Hot Water->Kettle
`;

export async function newMap(page: Page) {
  await page.goto('/maps/new');
  await page.waitForURL(/\/maps\/map_/);
  await expect(page.getByRole('toolbar', { name: 'Map editor toolbar' })).toBeVisible();
  return page.url();
}

export const sourceBox = (page: Page) => page.getByRole('textbox', { name: 'OWM source editor' });
export const canvas = (page: Page) => page.getByRole('group', { name: 'Wardley map canvas' });
export const node = (page: Page, name: string) => canvas(page).getByRole('button', { name, exact: true });

export async function typeSource(page: Page, text: string) {
  await page.getByRole('button', { name: 'Split mode' }).click();
  await sourceBox(page).fill(text);
  await expect(node(page, 'Hot Water')).toBeVisible();
}

export async function mapWith(page: Page, text = TEA_SHOP) {
  const url = await newMap(page);
  await typeSource(page, text);
  await page.getByRole('button', { name: 'Visual mode' }).click();
  return url;
}

/** Current OWM source as the editor serializes it. */
export async function currentSource(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Split mode' }).click();
  const value = await sourceBox(page).inputValue();
  await page.getByRole('button', { name: 'Visual mode' }).click();
  return value;
}

export async function selectByKeyboard(page: Page, name: string) {
  await node(page, name).focus();
  await page.keyboard.press('Enter');
}
