/**
 * Wave D.5 verification — screenshots editor + 3 calendar modes in dark theme.
 */

import { expect, test } from '@playwright/test';

const SCREENS: Array<{ key: string; needle: string; out: string }> = [
  { key: 'editor', needle: 'How are you feeling?', out: 'editor' },
  { key: 'calendar', needle: 'Mood calendar', out: 'calendar-month' },
  { key: 'calendar-week', needle: 'Mood calendar', out: 'calendar-week' },
  { key: 'calendar-year', needle: 'Mood calendar', out: 'calendar-year' },
];

const VIEWPORT = { width: 414, height: 896 };

test.describe('Wave D.5 — journal screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  for (const s of SCREENS) {
    test(`journal (${s.key}) — dark theme`, async ({ page }) => {
      await page.goto(`/?journalpreview=1&screen=${s.key}`);
      await expect(page.getByText(s.needle).first()).toBeVisible({ timeout: 25_000 });
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: 'Toggle theme' }).click();
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `playwright-report/redesign/wave-d-journal-${s.out}-dark.png`,
        fullPage: true,
      });
    });
  }
});
