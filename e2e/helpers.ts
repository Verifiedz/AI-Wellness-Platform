/**
 * Shared helpers for Sakina E2E tests.
 *
 * Expo web renders React Native components as DOM elements. The Input
 * component wraps a <TextInput> which becomes a plain <input> on web.
 * Labels are rendered as <Text> siblings above the input group; Playwright
 * can locate inputs by the visible label text.
 *
 * Selector strategy (in priority order):
 *   1. Accessible role + name (most robust with React Native Web)
 *   2. Placeholder text (stable across layout changes)
 *   3. Visible text content (buttons, headings)
 *   4. CSS class / aria attribute (last resort)
 */

import { type Page, expect } from "@playwright/test";

export const TEST_USER = {
  username: "e2etestuser",
  email: "e2etest@sakina.local",
  password: "E2eTest@123",
};

/**
 * Wait for the Expo web app to finish bootstrapping. The splash screen fades
 * out once the JS bundle is parsed, leaving the root navigator mounted.
 * We wait for a well-known element that only appears after auth state is
 * resolved: either the Login screen heading or the Home tab bar.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  // Either the login form or the main tab bar should appear.
  await expect(
    page.locator("text=Log In, text=Home").first()
  ).toBeVisible({ timeout: 20_000 }).catch(async () => {
    // Fallback: wait for any text rendered by the app (avoids blank page race).
    await page.waitForSelector("body *", { state: "attached", timeout: 20_000 });
  });
}

/**
 * Fill an Input component field by its placeholder text.
 * On Expo web, <TextInput> renders as <input> or <textarea>.
 */
export async function fillByPlaceholder(
  page: Page,
  placeholder: string,
  value: string
): Promise<void> {
  const field = page.getByPlaceholder(placeholder);
  await field.waitFor({ state: "visible" });
  await field.clear();
  await field.fill(value);
}

/**
 * Click a Button component by its visible title text.
 */
export async function clickButton(page: Page, title: string): Promise<void> {
  // Button renders text inside a <Text> element inside a <Pressable>.
  // On web the Pressable becomes a <div role="button"> or a plain <div>.
  // Matching by exact text gives the best signal.
  const btn = page.getByRole("button", { name: title, exact: true }).or(
    page.locator(`text="${title}"`).first()
  );
  await btn.waitFor({ state: "visible" });
  await btn.click();
}

/**
 * Perform a login through the UI and wait for the Home tab to appear.
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/");
  await waitForAppReady(page);

  // Navigate to Login if we land elsewhere (e.g. onboarding already seen).
  const loginText = page.getByText("Log In", { exact: true });
  if (!(await loginText.isVisible())) {
    // Try the "Log in" link if on Register or another screen.
    const altLogin = page.getByText("Log in", { exact: true });
    if (await altLogin.isVisible()) {
      await altLogin.click();
    }
  }

  await fillByPlaceholder(page, "Enter your email", email);
  await fillByPlaceholder(page, "Enter your password", password);
  await clickButton(page, "Log In");

  // Wait for successful navigation to the main app (Home tab visible).
  await expect(page.getByText("Home", { exact: true })).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Assert that a visible error banner or text matching `pattern` is shown.
 */
export async function expectErrorMessage(
  page: Page,
  pattern: string | RegExp
): Promise<void> {
  const matcher =
    typeof pattern === "string"
      ? page.getByText(pattern)
      : page.locator(`text=${pattern}`);
  await expect(matcher.first()).toBeVisible({ timeout: 8_000 });
}
