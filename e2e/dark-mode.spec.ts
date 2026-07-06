import { expect, test } from '@playwright/test'

test('theme toggle sets dark mode on document', async ({ page }) => {
  await page.goto('/')
  const toggle = page.locator('.theme-toggle-btn')
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
