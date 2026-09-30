import { test, expect, type Page } from '@playwright/test';
async function boot(page: Page) {
  await page.goto('/room/?lang=en');
  await expect(page.locator('#room-root')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#room-root')).toHaveAttribute('data-phase', 'explore');
  await expect(page.locator('#room-loading')).not.toBeVisible();
}
async function enter(page: Page) {
  await clickObject(page, 'door');
  await expect(page.locator('#room-root')).toHaveAttribute('data-area', 'room');
  await expect(page.locator('#room-root')).toHaveAttribute('data-phase', 'explore');
}
async function clickObject(page: Page, id: string) {
  const target = page.locator(`[data-target="${id}"]`);
  await expect(target).toHaveAttribute('data-screen-x', /\d/);
  const point = await target.evaluate(el => ({ x: Number(el.dataset.screenX), y: Number(el.dataset.screenY) }));
  await page.mouse.move(point.x, point.y);
  await page.mouse.click(point.x, point.y);
}
async function position(page: Page) {
  return page.locator('#room-root').evaluate(el => ({ x: Number(el.dataset.avatarX), z: Number(el.dataset.avatarZ) }));
}
async function hold(page: Page, key: string, milliseconds: number) {
  await page.locator('#study-canvas').focus(); await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds); await page.keyboard.up(key); await page.waitForTimeout(110);
}
async function walkTo(page: Page, x: number, z: number) {
  for (let i = 0; i < 50; i++) {
    const p = await position(page); const dx = x - p.x; const dz = z - p.z;
    if (Math.abs(dx) < 0.2 && Math.abs(dz) < 0.2) return;
    const horizontal = Math.abs(dx) >= 0.2;
    const distance = horizontal ? dx : dz;
    const key = horizontal ? (dx > 0 ? 'd' : 'a') : (dz > 0 ? 's' : 'w');
    await page.locator('#study-canvas').focus(); await page.keyboard.down(key);
    // Walk most of this axis in one hold. Tiny repeated pulses become unstable
    // when software WebGL delays the sampled position and key release.
    try {
      await page.waitForFunction(({ axis, start, travel }) => {
        const value = Number(document.querySelector<HTMLElement>('#room-root')!.dataset[axis]);
        return Math.abs(value - start) >= travel;
      }, { axis: horizontal ? 'avatarX' : 'avatarZ', start: horizontal ? p.x : p.z, travel: Math.max(0.1, Math.abs(distance) - 0.16) }, { timeout: 10000 });
    } finally { await page.keyboard.up(key); }
    await page.waitForTimeout(110);
  }
  throw new Error(`Could not walk to ${x}, ${z}`);
}
test('keyboard movement, mouse pickup, readable resumes and browser history', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await boot(page); await page.screenshot({ path: testInfo.outputPath('porch.png') }); await enter(page);
  await clickObject(page, 'cv-en');
  await expect(page.locator('#room-notice')).toContainText('closer');
  await walkTo(page, 0, 1.35); await page.screenshot({ path: testInfo.outputPath('room.png') });
  const beforeReading = await position(page);
  const point = await page.locator('[data-target="cv-en"]').evaluate(el => ({ x: Number(el.dataset.screenX), y: Number(el.dataset.screenY) }));
  await page.mouse.click(point.x, point.y);
  await expect(page.locator('#study-dialog')).toBeVisible();
  await expect(page.locator('#document-body')).toContainText('Zhixin Zhu');
  await page.keyboard.down('w'); await page.waitForTimeout(300); await page.keyboard.up('w');
  expect(await position(page)).toEqual(beforeReading);
  await page.screenshot({ path: testInfo.outputPath('resume.png') });
  await page.goBack(); await expect(page.locator('#study-dialog')).not.toBeVisible();
  await expect(page.locator('#room-root')).toHaveAttribute('data-phase', 'explore');
  await page.goForward(); await expect(page.locator('#study-dialog')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('#room-root')).toHaveAttribute('data-phase', 'explore');
  await clickObject(page, 'cv-zh');
  await expect(page.locator('#document-body')).toContainText('朱祉昕');
  expect(errors).toEqual([]);
});
test('collision, focus loss, and mouse clicks never initiate walking', async ({ page }) => {
  await boot(page); await enter(page);
  await hold(page, 'w', 1600); expect((await position(page)).z).toBeGreaterThanOrEqual(0.68);
  await page.locator('#study-canvas').focus(); await page.keyboard.down('d'); await page.waitForTimeout(150);
  await page.locator('#room-language').focus(); await page.keyboard.up('d');
  await page.waitForTimeout(110); // Position attributes are sampled every 80 ms.
  const stopped = await position(page); await page.waitForTimeout(350); expect(await position(page)).toEqual(stopped);
  await page.mouse.click(1250, 700); const clicked = await position(page); await page.waitForTimeout(350);
  expect(await position(page)).toEqual(clicked);
});
test('outfit slots stay independent and persist', async ({ page }, testInfo) => {
  await boot(page); await enter(page); await walkTo(page, 2.25, 2.1); await walkTo(page, 2.25, 0.3);
  const beforeDressing = await position(page);
  await clickObject(page, 'wardrobe'); await expect(page.locator('#study-dialog')).toBeVisible();
  await page.locator('[data-outfit-value="beret"]').click(); await page.locator('[data-outfit-value="pink"]').click();
  await expect(page.locator('[data-outfit-value="beret"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-outfit-value="pink"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('study.outfit.v1')!))).toEqual({ version: 1, hat: 'beret', top: 'pink' });
  await page.screenshot({ path: testInfo.outputPath('wardrobe.png') });
  await page.locator('[data-outfit-value="none"]').click();
  await expect(page.locator('[data-outfit-value="none"]')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: testInfo.outputPath('no-hat.png') });
  await page.locator('[data-outfit-value="cap"]').click();
  await page.screenshot({ path: testInfo.outputPath('cap.png') });
  await page.locator('[data-outfit-value="bucket"]').click();
  await page.screenshot({ path: testInfo.outputPath('bucket.png') });
  await page.locator('[data-outfit-value="beret"]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#room-root')).toHaveAttribute('data-phase', 'explore');
  const afterDressing = await position(page);
  expect(afterDressing.x).toBeCloseTo(beforeDressing.x, 2);
  expect(afterDressing.z).toBeCloseTo(beforeDressing.z, 2);
  await page.reload(); await expect(page.locator('#room-root')).toHaveAttribute('data-ready', 'true');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('study.outfit.v1')!).hat)).toBe('beret');
});
test('failed assets retain classic links', async ({ page }) => {
  await page.route('**/assets/room/**', route => route.abort());
  await page.goto('/room/?lang=en');
  await expect(page.locator('#loading-message')).toContainText('unavailable');
  await expect(page.locator('#room-loading a').last()).toHaveAttribute('href', '/');
});

test('loading progress waits for assets and the first rendered frame', async ({ page }, testInfo) => {
  let releaseAssets = () => {};
  const gate = new Promise<void>(resolve => { releaseAssets = resolve; });
  await page.route('**/assets/room/*.css', async route => { await gate; await route.continue(); });
  await page.goto('/room/?lang=zh', { waitUntil: 'domcontentloaded' });
  try {
    await expect(page.locator('#loading-progress')).toHaveAttribute('aria-valuenow', '28');
    await expect(page.locator('#loading-title')).toHaveText('小屋正在醒来');
    await expect(page.locator('.loading-fallback')).not.toBeVisible();
    await expect(page.locator('#room-root')).not.toHaveAttribute('data-ready', 'true');
    await page.waitForTimeout(400); // Let the visible progress-bar easing settle for the screenshot.
    await page.screenshot({ path: testInfo.outputPath('loading.png') });
  } finally { releaseAssets(); }
  await expect(page.locator('#room-root')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#room-loading')).not.toBeVisible();
  await expect(page.locator('#loading-progress')).toHaveAttribute('aria-valuenow', '100');
  await expect(page.locator('#study-canvas')).toBeFocused();
});
test('explicit language wins and narrow desktop stays in the room', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lang', 'zh'));
  await page.goto('/'); await expect(page.locator('body')).toHaveAttribute('data-lang', 'en');
  await boot(page); await page.setViewportSize({ width: 640, height: 850 });
  await expect(page.locator('#study-canvas')).toBeVisible(); await expect(page).toHaveURL(/\/room\//);
});
test('unavailable storage does not prevent navigation or dressing', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('disabled'); };
    Storage.prototype.setItem = () => { throw new Error('disabled'); };
  });
  await boot(page); await enter(page); await walkTo(page, 2.25, 2.1); await walkTo(page, 2.25, 0.3);
  await clickObject(page, 'wardrobe'); await page.locator('[data-outfit-value="bucket"]').click();
  await expect(page.locator('#outfit-note')).toContainText('cannot save');
});
test('minimal game HUD and mouse doorway exit', async ({ page }, testInfo) => {
  await boot(page);
  await expect(page.locator('.study-header button')).toHaveCount(1);
  await expect(page.locator('#room-language')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('#porch-intro, #porch-back, #object-actions, #room-caption, #classic-link')).toHaveCount(0);
  await expect(page.locator('#study-canvas')).toBeFocused();
  await enter(page); await walkTo(page, 2.25, 2.1);
  await clickObject(page, 'exit');
  await expect(page.locator('#room-root')).toHaveAttribute('data-area', 'porch');
  await expect(page.locator('#room-root')).toHaveAttribute('data-phase', 'explore');
  await page.screenshot({ path: testInfo.outputPath('exit-return.png') });
  await walkTo(page, 1.3, 4.3); await clickObject(page, 'bell');
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
});
async function view(page: Page) {
  return page.locator('#room-root').evaluate(el => ({ yaw: Number(el.dataset.viewYaw), tilt: Number(el.dataset.viewTilt) }));
}
test('Q/E rotate, movement follows the camera, and panels preserve the angle', async ({ page }) => {
  await boot(page); await enter(page);
  const start = await position(page);
  await page.keyboard.down('e');
  try { await expect.poll(async () => (await view(page)).yaw).toBeGreaterThan(0.35); }
  finally { await page.keyboard.up('e'); }
  await page.waitForTimeout(110);
  expect(await position(page)).toEqual(start);
  await page.keyboard.down('w');
  try { await expect.poll(async () => (await position(page)).z).toBeLessThan(start.z - 0.35); }
  finally { await page.keyboard.up('w'); }
  await page.waitForTimeout(110);
  expect((await position(page)).x).toBeLessThan(start.x - 0.06);
  expect((await position(page)).z).toBeLessThan(start.z - 0.1);
  const turned = await view(page);
  await clickObject(page, 'cv-zh'); await expect(page.locator('#study-dialog')).toBeVisible();
  await page.keyboard.down('q'); await page.waitForTimeout(220); await page.keyboard.up('q');
  expect(await view(page)).toEqual(turned);
  await page.keyboard.press('Escape'); await expect(page.locator('#room-root')).toHaveAttribute('data-phase', 'explore');
  expect(await view(page)).toEqual(turned);
  await page.keyboard.down('q');
  try { await expect.poll(async () => (await view(page)).yaw).toBeLessThan(turned.yaw - 0.1); }
  finally { await page.keyboard.up('q'); }
  await page.keyboard.down('e'); await page.waitForTimeout(160); await page.locator('#room-language').focus();
  await page.keyboard.up('e'); await page.waitForTimeout(120); const stopped = await view(page);
  await page.waitForTimeout(250); expect(await view(page)).toEqual(stopped);
});
test('left drag rotates without opening objects and releases cleanly', async ({ page }, testInfo) => {
  await boot(page); await enter(page); await walkTo(page, 0, 1.35);
  const paper = await page.locator('[data-target="cv-en"]').evaluate(el => ({ x: Number(el.dataset.screenX), y: Number(el.dataset.screenY) }));
  await page.mouse.move(paper.x, paper.y); await page.mouse.down(); await page.waitForTimeout(250);
  await page.mouse.move(paper.x + 230, paper.y + 55, { steps: 14 }); await page.mouse.up();
  await expect.poll(async () => (await view(page)).yaw).toBeLessThan(-1);
  expect((await view(page)).tilt).toBeGreaterThan(0.1);
  await expect(page.locator('#study-dialog')).not.toBeVisible();
  await expect(page.locator('#room-root')).toHaveAttribute('data-phase', 'explore');
  const rotated = await view(page);
  await page.mouse.move(700, 700, { steps: 5 }); await page.waitForTimeout(160);
  expect(await view(page)).toEqual(rotated);
  await page.screenshot({ path: testInfo.outputPath('rotated-room.png') });
  await clickObject(page, 'cv-en'); await expect(page.locator('#study-dialog')).toBeVisible();
});
test('shared house keeps its interior outdoors and reveals the entrance wall on orbit', async ({ page }, testInfo) => {
  await boot(page);
  await expect(page.locator('#room-root')).toHaveAttribute('data-interior-mounted', 'true');
  await expect(page.locator('#room-root')).toHaveAttribute('data-entrance-wall-visible', 'true');
  await expect(page.locator('[data-target="wardrobe"]')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('house-exterior.png') });
  await enter(page);
  await expect(page.locator('#room-root')).toHaveAttribute('data-entrance-wall-visible', 'false');
  await page.mouse.move(1100, 700); await page.mouse.down();
  await page.mouse.move(670, 700, { steps: 24 }); await page.mouse.up();
  await expect(page.locator('#room-root')).toHaveAttribute('data-entrance-wall-visible', 'true');
  await expect(page.locator('#room-root')).toHaveAttribute('data-interior-mounted', 'true');
  await page.screenshot({ path: testInfo.outputPath('entrance-interior.png') });
  console.log('Rendered house:', await page.locator('#room-root').evaluate(el => ({ drawCalls: el.dataset.drawCalls, triangles: el.dataset.triangles })));
  await clickObject(page, 'exit');
  await expect(page.locator('#room-root')).toHaveAttribute('data-area', 'porch');
  await expect(page.locator('#room-root')).toHaveAttribute('data-phase', 'explore');
});
