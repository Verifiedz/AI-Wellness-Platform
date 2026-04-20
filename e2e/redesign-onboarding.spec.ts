/**
 * Wave D.2 verification — screenshots all 5 v2 onboarding screens, dark theme.
 */

import { expect, test } from '@playwright/test';

const SCREENS: Array<{ key: string; needle: string; out: string }> = [
  { key: 'welcome', needle: 'Welcome to Sakina', out: 'welcome' },
  { key: 'goal', needle: 'What brings you here?', out: 'goal' },
  { key: 'frequency', needle: 'How often will you check in?', out: 'frequency' },
  { key: 'timeofday', needle: 'When do you feel most reflective?', out: 'timeofday' },
  { key: 'firstvalue', needle: "Let\u2019s start with a moment of calm.", out: 'firstvalue' },
];

const VIEWPORT = { width: 414, height: 896 };

test.describe('Wave D.2 — onboarding screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  for (const s of SCREENS) {
    test(`${s.key} — dark theme`, async ({ page }) => {
      await page.goto(`/?onboardingpreview=1&screen=${s.key}`);
      await expect(page.getByText(s.needle).first()).toBeVisible({ timeout: 25_000 });
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: 'Toggle theme' }).click();
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `playwright-report/redesign/wave-d-onboarding-${s.out}-dark.png`,
        fullPage: true,
      });
    });
  }
});
