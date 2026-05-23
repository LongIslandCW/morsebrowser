import { expect, test } from '@playwright/test'

test('loads main page with settings accordion and version', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#accordionArea')).toBeVisible()
  await expect(page.locator('#version-info')).toContainText(/Version\s+\d+\.\d+(\.\d+)?/)
})
