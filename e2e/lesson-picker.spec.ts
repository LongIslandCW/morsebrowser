import { expect, test } from '@playwright/test'

test('lesson dropdowns update selection labels and accessible names', async ({ page }) => {
  await page.goto('/')
  const lessonsPanel = page.locator('#accordianItemLessonControls')
  await expect(lessonsPanel).toHaveClass(/show/)

  const typeToggle = page.locator('#lessonsPickerTypeToggle')
  await expect(typeToggle).toContainText('STUDENT')
  await expect(typeToggle).toHaveAccessibleName(/TYPE.*STUDENT/i)

  const classToggle = page.locator('#lessonsPickerClassToggle')
  await expect(classToggle).toBeEnabled()
  await classToggle.click()
  await page.getByLabel('Class').getByRole('option', { name: 'BC1' }).click()
  await expect(classToggle).toContainText('BC1')
  await expect(classToggle).toHaveAccessibleName(/CLASS.*BC1/i)
  await expect(classToggle).toBeFocused()

  const contentToggle = page.locator('#lessonsPickerContentToggle')
  await expect(contentToggle).toBeEnabled()
  await contentToggle.click()
  await page.getByLabel('Content').getByRole('option', { name: 'REA' }).click()
  await expect(contentToggle).toContainText('REA')
  await expect(contentToggle).toHaveAccessibleName(/CONTENT.*REA/i)
  await expect(contentToggle).toBeFocused()
})
