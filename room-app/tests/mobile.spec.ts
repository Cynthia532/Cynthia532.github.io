import { test, expect } from '@playwright/test';
test('mobile direct room URL uses classic page without room assets', async ({ page }) => {
  const resources: string[] = [];
  page.on('request', request => { if (/\/assets\/(room|models)\//.test(request.url())) resources.push(request.url()); });
  await page.goto('/room/?lang=zh');
  await expect(page).toHaveURL(/\/index_zh\.html$/);
  await expect(page.locator('body')).toHaveAttribute('data-lang', 'zh');
  await expect(page.locator('[data-room-link]')).not.toBeVisible();
  expect(resources).toEqual([]);
});
test('mobile root remains the ordinary homepage', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#particle-canvas')).toBeVisible();
  await expect(page.locator('#study-canvas')).toHaveCount(0);
});
