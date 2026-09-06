import { expect, test } from '@playwright/test'

async function readWorkingText (page: import('@playwright/test').Page): Promise<string> {
  const inputOptions = page.getByRole('button', { name: /Input Options/i })
  if ((await inputOptions.getAttribute('aria-expanded')) !== 'true') {
    await inputOptions.click()
  }
  const showWorking = page.getByLabel('Show working text')
  await expect(showWorking).toBeVisible()
  if (!(await showWorking.isChecked())) {
    // Prefer the visible label click (btn-check pattern).
    await page.locator('label[for="btncheckshowraw"]').click()
  }
  const practiceArea = page.getByRole('textbox', { name: 'Working text' })
  await expect(practiceArea).toBeVisible({ timeout: 5000 })
  return practiceArea.inputValue()
}

/**
 * Sending Alphabet must stay in file order after the OverLearn picker path
 * (CLASS auto-selects BINOMIALS with isShuffledSet:true first).
 */
test('Sending Alphabet 27wpm stays in A-Z order after picker (not shuffled by prior BINOMIALS)', async ({ page }) => {
  await page.goto('/')

  await page.locator('#lessonsPickerClassToggle').click()
  await page.getByLabel('Class').getByRole('option', { name: 'OVERLEARN' }).click()

  await page.locator('#lessonsPickerContentToggle').click()
  await page.getByLabel('Content').getByRole('option', { name: 'SENDING' }).click()

  await page.locator('#lessonsPickerLessonToggle').click()
  await page.getByLabel('Lesson').getByRole('option', { name: 'SENDING ALPHABET 1' }).click()

  await page.locator('#lessonsPickerPresetsToggle').click()
  await page.getByRole('listbox', { name: 'Settings preset' })
    .getByRole('option', { name: 'SENDING ALPHABET 27wpm' })
    .click()
  // Post-preset lesson reinit is scheduled at 1s.
  await page.waitForTimeout(1200)

  const text = await readWorkingText(page)
  const firstThree = text.trim().split(/\s+/).slice(0, 3).map((w) => w.replace(/\[.*/, ''))
  expect(firstThree).toEqual(['A', 'B', 'C'])
})

test('Bootcamp deep link keeps Sending Alphabet in order', async ({ page }) => {
  await page.goto(
    '/?selectedClass=OVERLEARN&selectedGroup=SENDING&selectedLesson=SENDING%20ALPHABET%201&selectedPreset=SENDING%20ALPHABET%2027wpm'
  )
  await page.waitForTimeout(1500)

  const text = await readWorkingText(page)
  const firstThree = text.trim().split(/\s+/).slice(0, 3).map((w) => w.replace(/\[.*/, ''))
  expect(firstThree).toEqual(['A', 'B', 'C'])
})

test('selectedType=INSTRUCTOR deep link selects instructor TYPE', async ({ page }) => {
  await page.goto('/?selectedType=INSTRUCTOR&selectedClass=BC1&selectedGroup=REA&selectedLesson=R')
  await page.waitForTimeout(1000)
  await expect(page.locator('#lessonsPickerTypeToggle')).toContainText('INSTRUCTOR')
  await expect(page.locator('#lessonsPickerClassToggle')).toContainText('BC1')
})
