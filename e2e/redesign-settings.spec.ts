/**
 * Wave D.8 verification — screenshots all 8 settings surfaces dark theme.
 */

import { expect, test } from '@playwright/test';

const SCREENS: Array<{ key: string; needle: string; out: string }> = [
  { key: 'hub', needle: 'Day streak', out: 'settings-hub' },
  { key: 'profile', needle: 'Change password', out: 'settings-profile' },
  { key: 'notifications', needle: 'Daily wellness tips', out: 'settings-notifications' },
  { key: 'privacy', needle: 'Delete account', out: 'settings-privacy' },
  { key: 'wearable', needle: 'Health data', out: 'settings-wearable' },
  { key: 'blocked', needle: 'Anonymous user', out: 'settings-blocked' },
  { key: 'help', needle: 'Frequently asked questions', out: 'settings-help' },
  { key: 'export', needle: 'DATE RANGE', out: 'settings-export' },
];

const VIEWPORT = { width: 414, height: 896 };

test.describe('Wave D.8 — settings screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  for (const s of SCREENS) {
    test(`${s.key} — dark theme`, async ({ page }) => {
      await page.goto(`/?settingspreview=1&screen=${s.key}`);
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
