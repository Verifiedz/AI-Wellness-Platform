/**
 * Wave D.4 verification — screenshots the v2 chat sub-components
 * (empty hero, conversation, sending, sessions list) in dark theme.
 */

import { expect, test } from '@playwright/test';

const STATES: Array<{ key: string; needle: string; out: string }> = [
  { key: 'empty', needle: 'Hi Aria.', out: 'empty' },
  { key: 'conversation', needle: 'tough day at work', out: 'conversation' },
  { key: 'sending', needle: 'Sakina is gathering', out: 'sending' },
  { key: 'sessions', needle: 'Tough day at work', out: 'sessions' },
];

const VIEWPORT = { width: 414, height: 896 };

test.describe('Wave D.4 — chat screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  for (const s of STATES) {
    test(`chat (${s.key}) — dark theme`, async ({ page }) => {
      await page.goto(`/?chatpreview=1&state=${s.key}`);
      await expect(page.getByText(s.needle).first()).toBeVisible({ timeout: 25_000 });
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: 'Toggle theme' }).click();
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `playwright-report/redesign/wave-d-chat-${s.out}-dark.png`,
        fullPage: true,
      });
    });
  }
});
