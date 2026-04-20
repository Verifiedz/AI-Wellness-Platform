/**
 * Wave B verification — screenshots the v2 design system playground in light + dark.
 * Renders every primitive (Text, Buttons, Inputs, Cards, animations, states, etc.).
 */

import { expect, test } from '@playwright/test';

const PLAYGROUND_URL = '/?playground=1';
const VIEWPORT = { width: 414, height: 896 };

test.describe('Wave B — v2 design system playground', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  test('playground renders in default theme', async ({ page }) => {
    await page.goto(PLAYGROUND_URL);
    await expect(page.getByText('Sakina v2')).toBeVisible({ timeout: 20_000 });
    // Wait for fonts + first paint to settle.
    await page.waitForTimeout(1200);

    await page.screenshot({
      path: 'playwright-report/redesign/wave-b-playground-default.png',
      fullPage: true,
    });
  });

  test('playground renders in opposite theme after toggle', async ({ page }) => {
    await page.goto(PLAYGROUND_URL);
    await expect(page.getByText('Sakina v2')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(600);

    const toggle = page.getByRole('button', { name: 'Toggle theme' });
    await toggle.click();
    await page.waitForTimeout(800);

    await page.screenshot({
      path: 'playwright-report/redesign/wave-b-playground-toggled.png',
      fullPage: true,
    });
  });
});
