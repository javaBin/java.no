import { defineConfig, devices } from "@playwright/test"

/**
 * The crop tests assert on rendered geometry, so the viewport height is pinned:
 * the image cap is expressed in `vh` and the assertions are derived from it.
 */
export const VIEWPORT = { width: 1280, height: 900 }

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    viewport: VIEWPORT,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORT },
    },
  ],
  webServer: {
    // `dev` rather than `build && start`: strict mode double-invokes effects
    // here, which is exactly where the object-URL handling should be exercised.
    command: "pnpm dev",
    url: "http://localhost:3000/no/utlegg",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
