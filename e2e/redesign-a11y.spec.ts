/**
 * Wave F.2 verification — axe a11y sweep across v2 preview surfaces.
 *
 * Fails on serious/critical violations. Logs moderate ones for triage.
 */

import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SURFACES: Array<{ url: string; label: string }> = [
  { url: '/?settingspreview=1&screen=hub', label: 'settings-hub' },
  { url: '/?communitypreview=1&screen=hub', label: 'community-hub' },
  { url: '/?homepreview=1&screen=loaded', label: 'home-loaded' },
  { url: '/?authpreview=1&screen=login', label: 'auth-login' },
];

const VIEWPORT = { width: 414, height: 896 };

test.describe('Wave F.2 — accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  for (const s of SURFACES) {
    test(`${s.label} — no critical/serious axe violations`, async ({ page }) => {
      await page.goto(s.url);
      await page.waitForTimeout(2000);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      const moderate = results.violations.filter(
        (v) => v.impact === 'moderate' || v.impact === 'minor'
      );

      if (moderate.length > 0) {
        console.log(`[a11y][${s.label}] moderate/minor:`, moderate.map((v) => v.id));
      }

      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });
  }
});
