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

test('OverLearn keeps LICW Lessons open after LESSON so PRESET can be chosen', async ({ page }) => {
  // CONTENT auto-selects the first OverLearn preset (auto-close on). Closing on
  // LESSON used to prevent picking PRESET — stay open until a preset click.
  await page.goto('/')
  const lessonsPanel = page.locator('#accordianItemLessonControls')
  await expect(lessonsPanel).toHaveClass(/show/)

  await page.locator('#lessonsPickerClassToggle').click()
  await page.getByLabel('Class').getByRole('option', { name: 'OVERLEARN' }).click()

  const contentToggle = page.locator('#lessonsPickerContentToggle')
  await expect(contentToggle).toBeEnabled()
  await contentToggle.click()
  await page.getByLabel('Content').getByRole('option', { name: 'SENDING' }).click()

  // Pick by position, not display text — Tom renames OverLearn POL/display
  // names independently of this test.
  const lessonToggle = page.locator('#lessonsPickerLessonToggle')
  await expect(lessonToggle).toBeEnabled()
  await lessonToggle.click()
  const firstLesson = page.getByLabel('Lesson').getByRole('option').first()
  const lessonName = (await firstLesson.textContent())?.trim()
  await firstLesson.click()
  await expect(lessonToggle).toContainText(lessonName as string)
  await expect(lessonsPanel).toHaveClass(/show/)

  const presetsToggle = page.locator('#lessonsPickerPresetsToggle')
  await expect(presetsToggle).toBeEnabled()
  await presetsToggle.click()
  const presetList = page.getByRole('listbox', { name: 'Settings preset' })
  // Skip "Your Settings" (first entry) so this exercises a real preset pick.
  const targetPreset = presetList.getByRole('option').nth(1)
  const presetName = (await targetPreset.textContent())?.trim()
  await targetPreset.scrollIntoViewIfNeeded()
  await expect(targetPreset).toBeVisible()
  await targetPreset.click()
  await expect(presetsToggle).toContainText(presetName as string)
  // Auto-close from that preset should collapse after the user pick.
  await expect(lessonsPanel).not.toHaveClass(/show/)
})
