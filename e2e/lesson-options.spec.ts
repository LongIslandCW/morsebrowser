import { expect, test } from '@playwright/test'

async function openLessonOptions (page: import('@playwright/test').Page) {
  await page.goto('/')
  await expect(page.locator('#moreSettingsAccordionButton')).toBeVisible()
  await page.locator('#moreSettingsAccordionButton').click()
  await expect(page.locator('#collapselessonoptions')).toHaveClass(/show/)
}

test('lesson options shows overrides playback and timing sections', async ({ page }) => {
  await openLessonOptions(page)
  await expect(page.getByText('Overrides', { exact: true })).toBeVisible()
  await expect(page.getByText('Playback', { exact: true })).toBeVisible()
  await expect(page.getByText('Timing', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Randomize')).toBeVisible()
})

test('overrides and playback group controls correctly', async ({ page }) => {
  await openLessonOptions(page)
  const lessonPanel = page.locator('#collapselessonoptions .settings-lesson-options-panel')

  const overridesSection = lessonPanel.locator('fieldset.morse-settings-fieldset', {
    has: page.locator('legend.morse-settings-legend', { hasText: 'Overrides' })
  })
  const playbackSection = lessonPanel.locator('fieldset.morse-settings-fieldset', {
    has: page.locator('legend.morse-settings-legend', { hasText: 'Playback' })
  })

  await expect(overridesSection.getByRole('button', { name: 'Apply' })).toBeVisible()
  await expect(overridesSection.getByLabel('Custom group', { exact: true })).toBeVisible()
  await expect(overridesSection.getByLabel('Override time')).toBeVisible()
  await expect(overridesSection.getByLabel('Override size')).toBeVisible()

  await expect(playbackSection.getByLabel('Randomize')).toBeVisible()
  await expect(playbackSection.getByLabel('Keep lines')).toBeVisible()
  await expect(playbackSection.getByLabel('Shuffle Intra-group')).toBeVisible()
  await expect(playbackSection.getByRole('button', { name: 'Apply' })).toHaveCount(0)
})

test('trail is last fieldset in lesson options', async ({ page }) => {
  await openLessonOptions(page)
  const lessonPanel = page.locator('#collapselessonoptions .settings-lesson-options-panel')
  const fieldsets = lessonPanel.locator('fieldset.morse-settings-fieldset')
  await expect(fieldsets.last().locator('legend.morse-settings-legend')).toHaveText('Trail')
})

test('shuffle intra-group is visible without admin mode query', async ({ page }) => {
  await openLessonOptions(page)
  expect(page.url()).not.toMatch(/adminMode/i)
  await expect(page.getByLabel('Shuffle Intra-group')).toBeVisible()
})

test('renamed options accordions and flagged cards in input options', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Tone Options/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Input Options/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Output Options/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Flagged cards/i })).toHaveCount(0)

  await page.getByRole('button', { name: /Input Options/i }).click()
  await expect(page.getByText('Flagged cards', { exact: true })).toBeVisible()
  await expect(page.locator('#btnSetFlagged')).toBeVisible()
})
