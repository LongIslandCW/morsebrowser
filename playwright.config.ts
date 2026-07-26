import { defineConfig, devices } from '@playwright/test'

const port = 3000
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/settings-layout-mobile.spec.ts'
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/settings-layout-mobile.spec.ts'
    }
  ],
  webServer: {
    command: `npx serve dist -l ${port}`,
    url: baseURL,
    // Never reuse webpack-dev-server: its runtime error overlay intercepts clicks
    // (e.g. SpeechSynthesisErrorEvent) and flakes e2e like stop-then-play.
    // Stop `npm run dev` before e2e if port 3000 is busy.
    reuseExistingServer: false,
    timeout: 120_000
  }
})
