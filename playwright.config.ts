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
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: `npx --yes serve dist -l ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
})
