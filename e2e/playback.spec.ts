import { expect, test } from '@playwright/test'

test('play collapses open settings accordions on fresh start', async ({ page }) => {
  await page.goto('/')
  const lessonsPanel = page.locator('#accordianItemLessonControls')
  await expect(lessonsPanel).toHaveClass(/show/)

  await page.locator('#btnPlayButton').click()

  await expect(lessonsPanel).not.toHaveClass(/show/)
  await expect(page.locator('#lessonAccordianButton')).toHaveAttribute('aria-expanded', 'false')
})

test('play leaves settings accordions open when auto-close is off', async ({ page }) => {
  await page.goto('/')
  const lessonsPanel = page.locator('#accordianItemLessonControls')
  await expect(lessonsPanel).toHaveClass(/show/)

  const toggle = page.locator('.auto-close-toggle-btn')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(toggle).toContainText('Close on Play')

  await page.locator('#btnPlayButton').click()

  await expect(lessonsPanel).toHaveClass(/show/)
  await expect(page.locator('#lessonAccordianButton')).toHaveAttribute('aria-expanded', 'true')
})

test('play keeps playback controls in viewport on fresh start', async ({ page }) => {
  await page.goto('/')
  await page.locator('#accordianItemLessonControls').evaluate((el) => {
    el.classList.add('show')
  })
  await page.evaluate(() => window.scrollTo(0, 0))

  await page.locator('#btnPlayButton').click()

  await expect.poll(async () => {
    return page.locator('#btnPlayButton').evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return rect.top >= 0 && rect.bottom <= window.innerHeight
    })
  }).toBe(true)
})

test('P shortcut fresh start matches Play button focus and collapse behavior', async ({ page }) => {
  await page.goto('/')
  const lessonsPanel = page.locator('#accordianItemLessonControls')
  await expect(lessonsPanel).toHaveClass(/show/)
  await page.evaluate(() => window.scrollTo(0, 0))

  await page.keyboard.press('p')

  await expect(lessonsPanel).not.toHaveClass(/show/)
  await expect(page.locator('#lessonAccordianButton')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#btnPlayButton')).toBeFocused()

  await expect.poll(async () => {
    return page.locator('#btnPlayButton').evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return rect.top >= 0 && rect.bottom <= window.innerHeight
    })
  }).toBe(true)
})

test('play pause stop shortcuts move focus to the matching playback control', async ({ page }) => {
  await page.goto('/')

  await page.keyboard.press('p')
  await expect(page.locator('#btnPlayButton')).toBeFocused()

  await page.keyboard.press('p')
  await expect(page.locator('#btnPause')).toBeFocused()

  await page.keyboard.press('s')
  await expect(page.locator('#btnStop')).toBeFocused()
})
