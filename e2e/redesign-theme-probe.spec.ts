/**
 * Wave A verification — screenshots the v2 ThemeProbe in light + dark.
 * The probe page renders every design token (palette, typography, spacing,
 * radius, elevation, motion). These screenshots become the Wave A baseline
 * and let later waves catch unintended token regressions.
 */

import { expect, test } from '@playwright/test';

const PROBE_URL = '/?probe=1';
const VIEWPORT = { width: 414, height: 896 };

test.describe('Wave A — v2 design tokens', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  test('probe renders in default theme', async ({ page }) => {
    await page.goto(PROBE_URL);
    // Allow fonts + first paint to settle.
    await expect(page.getByText('Sakina v2')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(800);

    await page.screenshot({
      path: 'playwright-report/redesign/wave-a-theme-probe-default.png',
      fullPage: true,
    });
  });

  test('probe renders in opposite theme after toggle', async ({ page }) => {
    await page.goto(PROBE_URL);
    await expect(page.getByText('Sakina v2')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);

    const toggle = page.getByRole('button', { name: 'Toggle theme' });
    await toggle.click();
    await page.waitForTimeout(600);

    await page.screenshot({
      path: 'playwright-report/redesign/wave-a-theme-probe-toggled.png',
      fullPage: true,
    });
  });
});
