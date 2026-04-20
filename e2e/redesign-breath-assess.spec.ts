/**
 * Wave D.6 verification — screenshots breathing setup + assessment surfaces.
 */

import { expect, test } from '@playwright/test';

const SCREENS: Array<{ key: string; needle: string; out: string }> = [
  { key: 'breathing', needle: 'Breathe', out: 'breathing-setup' },
  { key: 'active', needle: 'Cycle 3', out: 'breathing-active' },
  { key: 'assessment', needle: 'QUESTION 3', out: 'assessment' },
  { key: 'result', needle: 'results', out: 'assessment-result' },
  { key: 'history', needle: 'Your progress', out: 'assessment-history' },
];

const VIEWPORT = { width: 414, height: 896 };

test.describe('Wave D.6 — breathing + assessment screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  for (const s of SCREENS) {
    test(`${s.key} — dark theme`, async ({ page }) => {
      await page.goto(`/?breathassesspreview=1&screen=${s.key}`);
      await expect(page.getByText(s.needle).first()).toBeVisible({ timeout: 25_000 });
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: 'Toggle theme' }).click();
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `playwright-report/redesign/wave-d-${s.out}-dark.png`,
        fullPage: true,
      });
    });
  }
});
