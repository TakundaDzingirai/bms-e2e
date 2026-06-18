import { defineConfig } from "@playwright/test";
import { config } from "./src/env";

// Importing ./src/env runs the local-only safety guard at config load, so a run
// against a non-local target aborts before any test executes.

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // In CI: GitHub annotations + an HTML report (uploaded as an artifact). Locally: list.
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  use: {
    baseURL: config.appBaseUrl,
  },
  // No webServer: these tests run against an already-running bsms app (started
  // from the bsms repo against local Supabase — see README).
});
