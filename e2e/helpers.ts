import { expect, type Page } from '@playwright/test';

/** Opens the app as a fresh device and accepts the mandatory disclaimer gate. */
export async function openApp(page: Page): Promise<void> {
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'قبل الاستخدام' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'أفهم وأوافق' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'الحالات', level: 1 })).toBeVisible();
}

/** Creates one deterministic demo case and leaves the browser on its detail page. */
export async function createDemoCase(page: Page): Promise<string> {
  await page.getByRole('link', { name: 'حالة جديدة' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'حالة جديدة', level: 1 }),
  ).toBeVisible();

  await page.locator('#age').fill('64');
  await page.locator('#sex').selectOption('female');
  await page.locator('#weight').fill('70');
  await page.locator('#height').fill('175');
  await page.locator('#complaint').selectOption({ label: 'جلطة / TIA' });
  await page.getByRole('button', { name: 'إنشاء الحالة' }).click();

  await expect(page).toHaveURL(/#\/cases\/[0-9a-f-]{20,}/);
  await expect(page.getByRole('heading', { name: '64 سنة', level: 1 })).toBeVisible();
  return page.url();
}
