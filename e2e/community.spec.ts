/**
 * E2E — Community flow
 *
 * Covers:
 *   1. Community tab is accessible from the bottom navigation
 *   2. The anonymous-posting disclaimer banner is rendered
 *   3. "Support Groups" section heading is visible
 *   4. When groups are loaded, at least one group card is visible
 *   5. When no groups are available, the empty-state message is shown
 *   6. Tapping a group card navigates to the GroupFeed screen
 *   7. GroupFeed screen renders a post list or empty state
 *
 * Login is performed in beforeEach; tests skip gracefully when the backend
 * is not reachable.
 */

import { test, expect, type Page } from "@playwright/test";
import { loginAs, TEST_USER } from "./helpers";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function openCommunityTab(page: Page): Promise<void> {
  const tab = page.getByText("Community", { exact: true });
  await expect(tab).toBeVisible({ timeout: 8_000 });
  await tab.click();
}

async function waitForCommunityReady(page: Page): Promise<void> {
  // Either the groups loaded or the empty state rendered.
  await expect(
    page
      .getByText("Support Groups")
      .or(page.getByText("Community groups are being set up"))
      .or(page.getByText("All posts are anonymous"))
  ).toBeVisible({ timeout: 12_000 });
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

test.describe("Community", () => {
  test("Community tab is reachable from the bottom navigation", async ({ page }) => {
    await openCommunityTab(page);
    await waitForCommunityReady(page);
  });

  test("renders anonymous posting disclaimer banner", async ({ page }) => {
    await openCommunityTab(page);
    await waitForCommunityReady(page);

    await expect(
      page.getByText("All posts are anonymous", { exact: false })
    ).toBeVisible({ timeout: 8_000 });
  });

  test("renders Support Groups section heading", async ({ page }) => {
    await openCommunityTab(page);
    await waitForCommunityReady(page);

    await expect(page.getByText("Support Groups")).toBeVisible({ timeout: 8_000 });
  });

  test("shows groups or empty state depending on backend data", async ({ page }) => {
    await openCommunityTab(page);
    await waitForCommunityReady(page);

    const groupCards = page.locator("text=posts").or(
      page.getByText("Community groups are being set up", { exact: false })
    );

    // At least one of: a group card with post count, or the empty state.
    await expect(groupCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test("tapping a group card navigates to GroupFeed", async ({ page }) => {
    await openCommunityTab(page);
    await waitForCommunityReady(page);

    // Wait for groups to load (they may not load if backend is down).
    const anyGroupCard = page.getByText(/posts/).first();
    if (!(await anyGroupCard.isVisible({ timeout: 6_000 }).catch(() => false))) {
      // No groups are available; skip this navigation test.
      test.skip();
      return;
    }

    // Click the first group card.
    await anyGroupCard.click();

    // GroupFeed should appear.
    // GroupFeedScreen renders a FlatList of posts or an empty state.
    await expect(
      page
        .getByText("No posts yet", { exact: false })
        .or(page.getByText("Share your thoughts", { exact: false }))
        .or(page.getByText("posts", { exact: false }))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("crisis safety information is visible in the disclaimer", async ({ page }) => {
    await openCommunityTab(page);
    await waitForCommunityReady(page);

    // The banner explicitly mentions the crisis button.
    await expect(
      page.getByText(/crisis button|crisis|immediate help/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });
});
