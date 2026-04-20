/**
 * Wave D.3 verification — screenshots the v2 home dashboard in 4 states × 2 themes.
 */

import { expect, test } from '@playwright/test';

const STATES = ['loaded', 'loading', 'empty', 'error'];
const VIEWPORT = { width: 414, height: 896 };

test.describe('Wave D.3 — home dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  for (const state of STATES) {
    test(`home (${state}) — dark theme`, async ({ page }) => {
      await page.goto(`/?homepreview=1&state=${state}`);
      await expect(page.getByText('Good morning,').first()).toBeVisible({ timeout: 25_000 });
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: 'Toggle theme' }).click();
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `playwright-report/redesign/wave-d-home-${state}-dark.png`,
        fullPage: true,
      });
    });
  }
});
