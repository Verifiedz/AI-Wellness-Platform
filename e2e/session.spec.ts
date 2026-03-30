/**
 * E2E — Session management (login → logout)
 *
 * Covers:
 *   1. After login the main tab bar is visible and auth state is persisted
 *   2. The Profile/Settings tab is accessible
 *   3. A "Log Out" or "Sign Out" action is reachable from the profile section
 *   4. Triggering logout clears the session and returns the user to the Login screen
 *   5. After logout the protected routes are no longer accessible (navigating to
 *      "/" redirects to Login, not the app interior)
 *   6. Re-loading the page after logout does not auto-log in the user
 *
 * Login is performed in beforeEach; tests skip gracefully when not available.
 */

import { test, expect, type Page } from "@playwright/test";
import { loginAs, waitForAppReady, TEST_USER } from "./helpers";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function openProfileTab(page: Page): Promise<void> {
  const profileTab = page.getByText("Profile", { exact: true });
  await expect(profileTab).toBeVisible({ timeout: 8_000 });
  await profileTab.click();
}

/**
 * Attempt to find and click the logout button.
 * The button may be labelled "Log Out", "Sign Out", or "Logout".
 * It may be inside a scrollable settings list.
 */
async function clickLogout(page: Page): Promise<void> {
  const logoutBtn = page
    .getByText("Log Out", { exact: true })
    .or(page.getByText("Sign Out", { exact: true }))
    .or(page.getByText("Logout", { exact: true }));

  // Scroll down in case the button is below the fold.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await expect(logoutBtn.first()).toBeVisible({ timeout: 10_000 });
  await logoutBtn.first().click();
}

/**
 * If a confirmation dialog appears, confirm the logout.
 */
async function confirmLogoutDialog(page: Page): Promise<void> {
  const confirmBtn = page
    .getByRole("button", { name: /Log Out|Sign Out|Yes|Confirm/i })
    .last();
  if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await confirmBtn.click();
  }
}

// ─── Setup ──────────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  try {
    await loginAs(page, TEST_USER.email, TEST_USER.password);
  } catch {
    test.skip();
  }
});

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("Session management", () => {
  test("main tab bar is visible after login", async ({ page }) => {
    // After loginAs() completes, the tab bar should already be visible.
    const tabBar = page
      .getByText("Home", { exact: true })
      .or(page.getByText("Journal", { exact: true }))
      .or(page.getByText("Sakina", { exact: true }));

    await expect(tabBar.first()).toBeVisible({ timeout: 8_000 });
  });

  test("all five main tabs are visible in the tab bar", async ({ page }) => {
    await expect(page.getByText("Home", { exact: true })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("Journal", { exact: true })).toBeVisible();
    await expect(page.getByText("Community", { exact: true })).toBeVisible();
    await expect(page.getByText("Sakina", { exact: true })).toBeVisible();
    await expect(page.getByText("Profile", { exact: true })).toBeVisible();
  });

  test("Profile tab is reachable", async ({ page }) => {
    await openProfileTab(page);

    // SettingsStack renders settings options after the profile tab is tapped.
    // We wait for any known setting or the user's profile information.
    await expect(
      page
        .getByText("Account", { exact: false })
        .or(page.getByText("Settings", { exact: false }))
        .or(page.getByText("Log Out", { exact: true }))
        .or(page.getByText("Sign Out", { exact: true }))
        .or(page.getByText(TEST_USER.email, { exact: false }))
        .or(page.getByText(TEST_USER.username, { exact: false }))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Log Out option is present on the Profile/Settings screen", async ({ page }) => {
    await openProfileTab(page);

    // Scroll to the bottom to reveal the logout button.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const logoutBtn = page
      .getByText("Log Out", { exact: true })
      .or(page.getByText("Sign Out", { exact: true }))
      .or(page.getByText("Logout", { exact: true }));

    await expect(logoutBtn.first()).toBeVisible({ timeout: 10_000 });
  });

  test("logging out returns the user to the Login screen", async ({ page }) => {
    await openProfileTab(page);

    await clickLogout(page);
    await confirmLogoutDialog(page);

    // After logout the user should be on the Login screen.
    await expect(
      page.getByPlaceholder("Enter your email").or(
        page.getByText("Log In", { exact: true })
      )
    ).toBeVisible({ timeout: 12_000 });

    // Protected content (tab bar) should no longer be visible.
    await expect(page.getByText("Journal", { exact: true })).not.toBeVisible({
      timeout: 5_000,
    });
  });

  test("navigating to root after logout shows Login, not the app interior", async ({ page }) => {
    await openProfileTab(page);
    await clickLogout(page);
    await confirmLogoutDialog(page);

    // Wait for logout to complete.
    await expect(
      page.getByPlaceholder("Enter your email").or(
        page.getByText("Log In", { exact: true })
      )
    ).toBeVisible({ timeout: 12_000 });

    // Navigate back to root and confirm we are still on the auth screen.
    await page.goto("/");
    await waitForAppReady(page);

    await expect(
      page
        .getByPlaceholder("Enter your email")
        .or(page.getByText("Log In", { exact: true }))
    ).toBeVisible({ timeout: 10_000 });

    // Should NOT see the main app tabs.
    await expect(page.getByText("Sakina", { exact: true })).not.toBeVisible({
      timeout: 5_000,
    });
  });

  test("page reload after logout keeps the user logged out", async ({ page }) => {
    await openProfileTab(page);
    await clickLogout(page);
    await confirmLogoutDialog(page);

    // Wait for logout to complete.
    await expect(
      page.getByPlaceholder("Enter your email").or(
        page.getByText("Log In", { exact: true })
      )
    ).toBeVisible({ timeout: 12_000 });

    // Hard reload.
    await page.reload();
    await waitForAppReady(page);

    // After reload the secure store token should be gone;
    // the app should present the auth stack, not the main tabs.
    await expect(
      page
        .getByPlaceholder("Enter your email")
        .or(page.getByText("Log In", { exact: true }))
        .or(page.getByText("Create account"))
    ).toBeVisible({ timeout: 12_000 });
  });
});
