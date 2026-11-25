import { expect, test, type Page } from '@playwright/test'

async function readWorkingText (page: Page): Promise<string> {
  const inputOptions = page.getByRole('button', { name: /Input Options/i })
  if ((await inputOptions.getAttribute('aria-expanded')) !== 'true') {
    await inputOptions.click()
  }
  if (!(await page.getByLabel('Show working text').isChecked())) {
    await page.locator('label[for="btncheckshowraw"]').click()
  }
  const practiceArea = page.getByRole('textbox', { name: 'Working text' })
  await expect(practiceArea).toBeVisible({ timeout: 5000 })
  return practiceArea.inputValue()
}

async function turnOnPicker (page: Page) {
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Character picker mode' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('#accordianItemLessonControls')).toHaveClass(/show/)
}

test('picker mode swaps lesson pickers for the character grid', async ({ page }) => {
  await turnOnPicker(page)

  await expect(page.locator('#lessonAccordianButton')).toContainText('Pick Characters')
  await expect(page.locator('#lessonsPickerContentToggle')).toBeHidden()
  await expect(page.locator('#lessonsPickerLessonToggle')).toBeHidden()
  await expect(page.locator('#lessonsPickerClassToggle')).toBeVisible()
  await expect(page.locator('#lessonsPickerPresetsToggle')).toBeVisible()
  await expect(page.getByRole('group', { name: 'Letters' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Prosigns' })).toBeVisible()

  await page.getByRole('button', { name: 'Character picker mode' }).click()
  await expect(page.locator('#lessonAccordianButton')).toContainText('LICW Lessons')
  await expect(page.locator('#lessonsPickerLessonToggle')).toBeVisible()
  await expect(page.getByRole('group', { name: 'Letters' })).toBeHidden()
})

test('picked characters drive the practice groups', async ({ page }) => {
  await turnOnPicker(page)
  const letters = page.getByRole('group', { name: 'Letters' })

  for (const ch of ['K', 'M']) {
    const key = letters.getByRole('button', { name: ch, exact: true })
    await key.click()
    await expect(key).toHaveAttribute('aria-pressed', 'true')
  }
  await page.getByRole('group', { name: 'Punctuation' }).getByRole('button', { name: 'question mark' }).click()
  await expect(page.locator('.char-picker-summary')).toHaveText('3 selected: K M ?')

  await page.getByLabel('Minimum group size').fill('2')
  await page.getByRole('button', { name: 'New groups' }).click()

  const text = await readWorkingText(page)
  const groups = text.trim().split(/\s+/)
  expect(groups.length).toBeGreaterThan(3)
  for (const group of groups) {
    expect(group).toMatch(/^[KM?]{2}$/)
  }
})

test('all and none buttons select whole categories', async ({ page }) => {
  await turnOnPicker(page)

  await page.getByRole('button', { name: 'Select all numbers' }).click()
  const numbers = page.getByRole('group', { name: 'Numbers' })
  await expect(numbers.getByRole('button', { pressed: true })).toHaveCount(10)
  await expect(page.locator('.char-picker-summary')).toContainText('10 selected')

  await page.getByRole('button', { name: 'Select all letters' }).click()
  await expect(page.locator('.char-picker-summary')).toContainText('36 selected')

  await page.getByRole('button', { name: 'Clear numbers' }).click()
  await expect(numbers.getByRole('button', { pressed: true })).toHaveCount(0)
  await expect(page.locator('.char-picker-summary')).toContainText('26 selected')

  await page.getByRole('button', { name: 'Clear all characters' }).click()
  await expect(page.locator('.char-picker-summary')).toHaveText('No characters selected')
  await expect(page.getByRole('button', { name: 'New groups' })).toBeDisabled()
})

test('picker mode and selection are remembered', async ({ page }) => {
  await turnOnPicker(page)
  await page.getByRole('group', { name: 'Letters' }).getByRole('button', { name: 'R', exact: true }).click()
  await page.getByRole('group', { name: 'Prosigns' }).getByRole('button', { name: 'A R prosign' }).click()

  await expect(page.locator('.char-picker-summary')).toHaveText('2 selected: R AR')

  // A fresh tab in the same browser profile reads the saved cookies.
  const again = await page.context().newPage()
  await again.goto('/')
  await expect(again.getByRole('button', { name: 'Character picker mode' })).toHaveAttribute('aria-pressed', 'true')
  await expect(again.locator('.char-picker-summary')).toHaveText('2 selected: R AR')
  // Restored picks rebuild the practice text on load.
  await expect.poll(async () => (await readWorkingText(again)).trim().split(/\s+/)[0], { timeout: 5000 })
    .toMatch(/^(R|<AR>)+$/)
})

test('a preset still applies as the starting point in picker mode', async ({ page }) => {
  await turnOnPicker(page)
  await page.getByRole('group', { name: 'Letters' }).getByRole('button', { name: 'E', exact: true }).click()

  await page.locator('#lessonsPickerClassToggle').click()
  await page.getByLabel('Class').getByRole('option', { name: 'BC1', exact: true }).click()
  await page.locator('#lessonsPickerPresetsToggle').click()
  await page.getByRole('listbox', { name: 'Settings preset' }).getByRole('option', { name: 'Recognition' }).click()

  // Recognition: 14 wpm, single-character groups.
  await expect(page.getByLabel('Character Speed')).toHaveValue('14')
  await expect(page.getByLabel('Minimum group size')).toHaveValue('1')
  await expect(page.getByRole('button', { name: 'Character picker mode' })).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(async () => (await readWorkingText(page)).trim().split(/\s+/)[0], { timeout: 5000 }).toBe('E')
})
