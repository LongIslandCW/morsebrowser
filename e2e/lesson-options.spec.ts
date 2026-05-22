import { expect, test } from '@playwright/test'

test('lesson options shows practice and group override sections', async ({ page }) => {
  await page.goto('/')
  await page.locator('#moreSettingsAccordionButton').click()
  await expect(page.getByText('Practice', { exact: true })).toBeVisible()
  await expect(page.getByText('Group & override', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Randomize')).toBeVisible()
})
