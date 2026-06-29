import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function expectNoAxeViolations (page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast'])
    .analyze()

  expect(results.violations).toEqual([])
}

test('initial page has accessible names for primary controls', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Morse Practice Page' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()
  await expect(page.getByLabel('Character Speed')).toBeVisible()
  await expect(page.getByLabel('Effective Speed (FWPM)', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Volume', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sync WPM speed' })).toBeVisible()
  await expect(page.getByLabel('Reveal card text')).toBeVisible()
  await expect(page.locator('[role="status"][aria-live="polite"]')).toBeAttached()
  await expect(page.locator('[aria-live]')).toHaveCount(1)

  await expectNoAxeViolations(page)
})

test('expanded settings expose lesson and voice controls to screen readers', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /Lesson Options/i }).click()
  await expect(page.locator('#collapselessonoptions')).toHaveClass(/show/)
  await expect(page.getByLabel('Speed Racer', { exact: true })).toHaveAccessibleDescription(/plays each card more than once at different speeds/i)
  await expect(page.locator('.working-text-stats')).not.toHaveAttribute('aria-live')
  await expect(page.getByLabel('Trail')).toBeVisible()
  await expect(page.getByLabel('Repeat Spacing')).toBeVisible()
  await page.locator('label[for="btncheck2overridesize"]').click()
  await expect(page.getByRole('button', { name: 'Sync minimum and maximum size' })).toHaveCount(1)

  await page.getByRole('button', { name: /Voice Options/i }).click()
  await expect(page.locator('#collapsevoiceoptions')).toHaveClass(/show/)
  await expect(page.getByLabel('Voice', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Spell')).toBeVisible()
  await expect(page.getByLabel('Arm Recap')).toBeVisible()
  await expect(page.getByLabel('Voice Delay Before')).toBeVisible()
  await expect(page.getByLabel('Voice Delay After')).toBeVisible()
  await expect(page.getByLabel('Voice Volume')).toBeVisible()
  await expect(page.getByLabel('Pitch')).toBeVisible()
  await expect(page.getByLabel('Rate')).toBeVisible()
  await expect(page.getByLabel('Voice after cards')).toBeVisible()

  await expectNoAxeViolations(page)
})

test('output, flagged, noise, and RSS controls have meaningful names', async ({ page }) => {
  await page.goto('/?noiseEnabled=true&rssEnabled=true')

  await page.getByRole('button', { name: /Input Options/i }).click()
  await expect(page.getByLabel('Flagged cards text')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Load flagged cards as practice text' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear flagged cards' })).toBeVisible()

  await page.getByRole('button', { name: /Output Options/i }).click()
  await expect(page.getByLabel('Pre playback silence')).toBeVisible()
  await expect(page.getByLabel('Extra word space')).toBeVisible()
  await expect(page.getByLabel('Card wait')).toBeVisible()
  await expect(page.getByLabel('Card text size')).toBeVisible()
  await expect(page.getByLabel('Show cards section')).toBeVisible()

  await page.getByRole('button', { name: /Noise/i }).click()
  await expect(page.getByLabel('Noise off')).toBeVisible()
  await expect(page.getByLabel('White noise')).toBeVisible()
  await expect(page.getByLabel('Brown noise')).toBeVisible()
  await expect(page.getByLabel('Pink noise')).toBeVisible()
  await expect(page.getByLabel('Noise volume')).toBeVisible()

  await page.getByRole('button', { name: /RSS/i }).click()
  await expect(page.getByLabel('RSS feed address')).toBeVisible()
  await expect(page.getByLabel('Proxy address')).toBeVisible()
  await expect(page.getByLabel('Poll every minutes')).toBeVisible()
  await expect(page.getByLabel('Play unread items every minutes')).toBeVisible()

  await expectNoAxeViolations(page)
})

test('mobile viewport keeps high-risk controls accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByLabel('Character Speed')).toBeVisible()
  await expect(page.getByLabel('Effective Speed (FWPM)', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Volume', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Lesson Options/i }).click()
  await expect(page.getByLabel('Trail')).toBeVisible()

  await expectNoAxeViolations(page)
})

test('help link moves keyboard focus to keyboard shortcuts summary', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Click here for help' }).focus()
  await page.keyboard.press('Enter')

  await expect(page.locator('#keyboard-shortcuts-summary')).toBeFocused()
  await expect(page.locator('#keyboard-shortcuts')).not.toHaveAttribute('open', '')

  await page.keyboard.press('Space')
  await expect(page.locator('#keyboard-shortcuts')).toHaveAttribute('open', '')
  await expect(page.locator('#keyboard-shortcuts-content')).toBeFocused()
  await expect(page.locator('#keyboard-shortcuts-content')).toHaveAccessibleName('Keyboard shortcuts')
  await expect(page.locator('#keyboard-shortcuts-content')).toHaveAccessibleDescription(/Press the letter P to play or pause practice/)
  await expect(page.locator('#keyboard-shortcuts-content')).toHaveAccessibleDescription(/Press the slash key to shuffle or unshuffle the practice cards/)
})

test('clicking keyboard shortcuts summary focuses readable shortcuts content', async ({ page }) => {
  await page.goto('/')

  await page.locator('#keyboard-shortcuts-summary').click()
  await expect(page.locator('#keyboard-shortcuts')).toHaveAttribute('open', '')
  await expect(page.locator('#keyboard-shortcuts-content')).toBeFocused()
  await expect(page.locator('#keyboard-shortcuts-content')).toHaveAccessibleDescription(/Press the letter S to stop playback and rewind to the first card/)
  await expect(page.locator('#keyboard-shortcuts-content')).toHaveAccessibleDescription(/Press the comma key to go back one card/)
})
