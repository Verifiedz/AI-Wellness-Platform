/**
 * Wave D.7 verification — screenshots community surfaces dark theme.
 */

import { expect, test } from '@playwright/test';

const SCREENS: Array<{ key: string; needle: string; out: string }> = [
  { key: 'hub', needle: 'Anonymous, supportive, kind', out: 'community-hub' },
  { key: 'feed', needle: 'tough day at work today', out: 'community-feed' },
  { key: 'professionals', needle: 'Professional help', out: 'community-pros' },
];

const VIEWPORT = { width: 414, height: 896 };

test.describe('Wave D.7 — community screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  for (const s of SCREENS) {
    test(`${s.key} — dark theme`, async ({ page }) => {
      await page.goto(`/?communitypreview=1&screen=${s.key}`);
      // Each screen has a unique stable string we can detect.
      if (s.key === 'feed') {
        await expect(page.getByText('Sapphire Owl')).toBeVisible({ timeout: 25_000 });
      } else if (s.key === 'professionals') {
        await expect(page.getByText('988 Suicide')).toBeVisible({ timeout: 25_000 });
      } else {
        await expect(page.getByText(s.needle).first()).toBeVisible({ timeout: 25_000 });
      }
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
