import { defineConfig, devices } from '@playwright/test';
const logicOnly = process.argv.some(arg => arg === '--project=logic');
const softwareWebGL = process.env.STUDY_SOFTWARE_WEBGL === '1' || !!process.env.CI;
export default defineConfig({
  // Full walk / outfit / return journeys take longer with the software renderer.
  testDir: './tests', timeout: 75000, expect: { timeout: 8000 },
  fullyParallel: false, workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    channel: process.env.STUDY_BROWSER_CHANNEL || undefined,
    launchOptions: { args: softwareWebGL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [] }
  },
  webServer: logicOnly ? undefined : {
    command: 'node ../scripts/preview-site.mjs', url: 'http://127.0.0.1:4173/room/',
    reuseExistingServer: !process.env.CI, timeout: 30000
  },
  projects: [
    { name: 'logic', testMatch: 'core.spec.ts' },
    { name: 'desktop', testMatch: 'desktop.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 960 } } },
    { name: 'mobile', testMatch: 'mobile.spec.ts', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }
  ]
});
