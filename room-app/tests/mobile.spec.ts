import { test, expect } from '@playwright/test';
test('mobile direct room URL uses classic page without room assets', async ({ page }) => {
  const resources: string[] = [];
  page.on('request', request => { if (/\/assets\/(room|models)\//.test(request.url())) resources.push(request.url()); });
  await page.goto('/room/?lang=zh');
  await expect(page).toHaveURL(/\/classic\/zh\/$/);
  await expect(page.locator('body')).toHaveAttribute('data-lang', 'zh');
  await expect(page.locator('[data-room-link]')).not.toBeVisible();
  expect(resources).toEqual([]);
});
for (const lang of ['en', 'zh']) test(`mobile homepage uses ${lang} classic without room downloads`, async ({ page }) => {
  const resources: string[] = [];
  page.on('request', request => { if (/\/assets\/(room|models)\//.test(request.url())) resources.push(request.url()); });
  await page.goto(`/?lang=${lang}`);
  await expect(page).toHaveURL(`/classic/${lang}/`);
  await expect(page.locator('body')).toHaveAttribute('data-lang', lang);
  await expect(page.locator('#particle-canvas')).toBeVisible();
  await expect(page.locator('#study-canvas')).toHaveCount(0);
  expect(resources).toEqual([]);
});
