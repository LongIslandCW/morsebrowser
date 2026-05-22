import { expect, test } from '@playwright/test'

test('lesson dropdowns update selection labels', async ({ page }) => {
  await page.goto('/')
  const lessonsPanel = page.locator('#accordianItemLessonControls')
  await expect(lessonsPanel).toHaveClass(/show/)

  const typeToggle = page.getByLabel('TYPE')
  await expect(typeToggle).toContainText('STUDENT')

  const classToggle = page.getByLabel('CLASS', { exact: true })
  await expect(classToggle).toBeEnabled()
  await classToggle.click()
  await page.getByLabel('Class').getByRole('option', { name: 'BC1' }).click()
  await expect(classToggle).toContainText('BC1')

  const contentToggle = page.getByLabel('CONTENT', { exact: true })
  await expect(contentToggle).toBeEnabled()
  await contentToggle.click()
  await page.getByLabel('Content').getByRole('option', { name: 'REA' }).click()
  await expect(contentToggle).toContainText('REA')
})
