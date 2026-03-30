import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for the Sakina AI Wellness Platform.
 *
 * The tests target the Expo web build served statically (or the Expo dev server
 * running on port 8081). The baseURL can be overridden via the E2E_BASE_URL
 * environment variable so that CI can point at the static build served by
 * `npx serve`.
 *
 * Run:
 *   npm run test:e2e              – headless Chromium
 *   npm run test:e2e:ui           – interactive UI mode
 *   E2E_BASE_URL=http://localhost:3000 npm run test:e2e  – custom host
 */

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8081";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },

  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "playwright-report/results.xml" }],
    ["list"],
  ],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    // Expo web renders inside a root div; give the app extra time to bootstrap.
    navigationTimeout: 20_000,
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Do NOT spin up a webServer here — CI handles the build + serve step
  // explicitly so the static bundle is warmed up before tests run.
});
