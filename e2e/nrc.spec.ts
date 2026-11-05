import { promises as fs } from 'node:fs';
import { expect, test } from '@playwright/test';
import { createDemoCase, openApp } from './helpers';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('disclaimer gate blocks the app until accepted and stays accepted', async ({
  page,
}) => {
  await page.goto('/');

  const dialog = page.getByRole('dialog', { name: 'قبل الاستخدام' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'أفهم وأوافق' })).toBeEnabled();

  await dialog.getByRole('button', { name: 'أفهم وأوافق' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'الحالات', level: 1 })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'الحالات', level: 1 })).toBeVisible();
});

test('creates a case with autosave, list entry, and copyable handover', async ({
  page,
}) => {
  await openApp(page);
  const caseUrl = await createDemoCase(page);

  await expect(page.getByText('أنثى', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('70 kg', { exact: true })).toBeVisible();
  await expect(page.getByText('175 cm', { exact: true })).toBeVisible();
  await expect(page.getByText('22.9', { exact: true })).toBeVisible();

  const handover = page.locator('pre');
  await expect(handover).toContainText('Age: 64 y');
  await expect(handover).toContainText('Weight: 70 kg');
  await expect(handover).toContainText('Sex: أنثى');

  await page.getByRole('button', { name: 'نسخ الملخص' }).click();
  await expect(page.getByRole('button', { name: 'تم نسخ الملخص' })).toBeVisible();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('NEURO RESIDENT COMPANION');
  expect(clipboard).toContain('Age: 64 y');

  await page.locator('#case-notes').fill('صداع مفاجئ منذ ساعتين');
  await expect(page.getByText('محفوظ', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('#case-notes')).toHaveValue('صداع مفاجئ منذ ساعتين');

  await page.goto('/#/cases');
  await expect(page.getByText('1 حالة')).toBeVisible();
  await expect(page.getByText('64 سنة')).toBeVisible();
  await expect(page.locator('main a[href*="#/cases/"]')).toHaveCount(2);
  expect(caseUrl).toContain('#/cases/');
});

test('rejects an out-of-range age before creating a case', async ({ page }) => {
  await openApp(page);
  await page.getByRole('link', { name: 'حالة جديدة' }).first().click();

  await page.locator('#age').fill('150');
  await page.locator('#sex').selectOption('male');
  await page.getByRole('button', { name: 'إنشاء الحالة' }).click();

  await expect(page.getByText('العمر يجب أن يكون بين 0 و120.')).toBeVisible();
  await expect(page).toHaveURL(/#\/cases\/new$/);
  await expect(page.locator('#age')).toBeFocused();
});

test('settings switch language/theme, export a backup, and guard the wipe', async ({
  page,
}) => {
  await openApp(page);
  await page.getByRole('link', { name: 'الإعدادات' }).click();
  await expect(page.getByRole('heading', { name: 'الإعدادات', level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByRole('button', { name: 'العربية', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'الإعدادات', level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  await page.getByRole('button', { name: 'ليلي' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('button', { name: 'فاتح' }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'تصدير نسخة احتياطية' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^nrc-backup-\d{4}-\d{2}-\d{2}\.json$/);

  const filePath = await download.path();
  const raw = await fs.readFile(filePath, 'utf8');
  const backup = JSON.parse(raw) as {
    app: string;
    schemaVersion: number;
    cases: unknown[];
    settings: unknown[];
  };
  expect(backup.app).toBe('nrc');
  expect(backup.schemaVersion).toBe(1);
  expect(Array.isArray(backup.cases)).toBe(true);
  expect(Array.isArray(backup.settings)).toBe(true);

  await page.getByRole('button', { name: 'مسح كل البيانات' }).click();
  const wipeDialog = page.getByRole('dialog', { name: 'مسح كل البيانات؟' });
  await expect(wipeDialog).toBeVisible();
  const confirm = wipeDialog.getByRole('button', { name: 'امسح نهائيًا' });
  await expect(confirm).toBeDisabled();
  await page.locator('#wipe-confirm').fill('delete');
  await expect(confirm).toBeEnabled();
  await page.locator('#wipe-confirm').fill('DELETE');
  await expect(confirm).toBeEnabled();
  await wipeDialog.getByRole('button', { name: 'إلغاء' }).click();
  await expect(wipeDialog).toBeHidden();
});

test('exports the handover as a real PDF from the print view', async ({ page }) => {
  await openApp(page);
  await createDemoCase(page);

  const [printPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('link', { name: 'طباعة / PDF' }).click(),
  ]);
  await printPage.waitForLoadState('load');

  await expect(
    printPage.getByRole('heading', { name: 'رفيق المقيم العصبي', level: 1 }),
  ).toBeVisible();
  await expect(printPage.locator('pre')).toContainText('Age: 64 y');
  await expect(printPage.locator('pre')).toContainText('Sex: أنثى');
  await expect(printPage.getByRole('button', { name: 'طباعة / PDF' })).toBeVisible();

  await printPage.emulateMedia({ media: 'print' });
  await expect(printPage.getByRole('button', { name: 'طباعة / PDF' })).toBeHidden();

  const pdf = await printPage.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  expect(pdf.byteLength).toBeGreaterThan(1_000);
});

test('loads a cached case and route with the network offline', async ({
  page,
  context,
}) => {
  await openApp(page);
  await createDemoCase(page);

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload();
    await expect(page.getByRole('heading', { name: '64 سنة', level: 1 })).toBeVisible();
  }
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole('heading', { name: '64 سنة', level: 1 })).toBeVisible();

    await page.goto('/#/sources');
    await expect(
      page.getByRole('heading', { name: 'سجل المصادر', level: 1 }),
    ).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
