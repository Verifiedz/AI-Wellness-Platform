/**
 * Wave C verification — screenshots the v2 nav shell preview in light + dark.
 * Renders ScreenScaffold + AuroraBackground + ScreenHeader + bento content + TabBar.
 */

import { expect, test } from '@playwright/test';

const URL = '/?navshell=1';
const VIEWPORT = { width: 414, height: 896 };

test.describe('Wave C — v2 navigation shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  test('nav shell renders in default theme', async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByText('Today is enough.')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: 'playwright-report/redesign/wave-c-navshell-default.png',
      fullPage: true,
    });
  });

  test('nav shell renders in opposite theme after toggle', async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByText('Today is enough.')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: 'playwright-report/redesign/wave-c-navshell-toggled.png',
      fullPage: true,
    });
  });

  test('nav shell tab change moves indicator', async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByText('Today is enough.')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(600);
    await page.getByRole('tab', { name: 'Sakina' }).click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: 'playwright-report/redesign/wave-c-navshell-tab-sakina.png',
      fullPage: true,
    });
  });
});
