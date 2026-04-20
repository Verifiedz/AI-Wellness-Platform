/**
 * Wave D.1 verification — screenshots all 6 v2 auth screens in light + dark.
 */

import { expect, test } from '@playwright/test';

const SCREENS: Array<{ key: string; needle: string; out: string }> = [
  { key: 'login', needle: 'Welcome back', out: 'login' },
  { key: 'register', needle: 'Create account', out: 'register' },
  { key: 'forgot', needle: 'Forgot password', out: 'forgot' },
  { key: 'reset', needle: 'Reset password', out: 'reset' },
  { key: 'verify', needle: 'Verify email', out: 'verify' },
  { key: 'twofa', needle: 'Two-factor', out: 'twofa' },
];

const VIEWPORT = { width: 414, height: 896 };

test.describe('Wave D.1 — auth screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  for (const s of SCREENS) {
    test(`${s.key} — light theme`, async ({ page }) => {
      await page.goto(`/?authpreview=1&screen=${s.key}`);
      await expect(page.getByText(s.needle).first()).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `playwright-report/redesign/wave-d-auth-${s.out}-light.png`,
        fullPage: true,
      });
    });

    test(`${s.key} — dark theme`, async ({ page }) => {
      await page.goto(`/?authpreview=1&screen=${s.key}`);
      await expect(page.getByText(s.needle).first()).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: 'Toggle theme' }).click();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: `playwright-report/redesign/wave-d-auth-${s.out}-dark.png`,
        fullPage: true,
      });
    });
  }
});
