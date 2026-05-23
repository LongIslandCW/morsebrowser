import { expect, test } from '@playwright/test'

test('lesson options shows practice and group override sections', async ({ page }) => {
  await page.goto('/')
  await page.locator('#moreSettingsAccordionButton').click()
  await expect(page.getByText('Practice', { exact: true })).toBeVisible()
  await expect(page.getByText('Group & override', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Randomize')).toBeVisible()
})

test('group override has apply and playback subgroups', async ({ page }) => {
  await page.goto('/')
  await page.locator('#moreSettingsAccordionButton').click()

  await expect(page.getByText('Apply to update text', { exact: true })).toBeVisible()
  await expect(page.getByText('During playback', { exact: true })).toBeVisible()

  const applySection = page.locator('fieldset.morse-settings-subfieldset').filter({
    has: page.getByText('Apply to update text', { exact: true })
  })
  const playbackSection = page.locator('fieldset.morse-settings-subfieldset').filter({
    has: page.getByText('During playback', { exact: true })
  })

  await expect(applySection.getByRole('button', { name: 'Apply' })).toBeVisible()
  await expect(applySection.getByLabel('Custom group', { exact: true })).toBeVisible()
  await expect(applySection.getByLabel('Override time')).toBeVisible()
  await expect(applySection.getByLabel('Override size')).toBeVisible()

  await expect(playbackSection.getByLabel('Keep lines')).toBeVisible()
  await expect(playbackSection.getByLabel('Shuffle Intra-group')).toBeVisible()
  await expect(playbackSection.getByRole('button', { name: 'Apply' })).toHaveCount(0)
})

test('shuffle intra-group is visible without admin mode query', async ({ page }) => {
  await page.goto('/?adminMode=1')
  await page.locator('#moreSettingsAccordionButton').click()
  await expect(page.getByLabel('Shuffle Intra-group')).toBeVisible()
})
