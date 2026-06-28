import { expect, test } from '@playwright/test'

test('play collapses open settings accordions on fresh start', async ({ page }) => {
  await page.goto('/')
  const lessonsPanel = page.locator('#accordianItemLessonControls')
  await expect(lessonsPanel).toHaveClass(/show/)

  await page.locator('#btnPlayButton').click()

  await expect(lessonsPanel).not.toHaveClass(/show/)
  await expect(page.locator('#lessonAccordianButton')).toHaveAttribute('aria-expanded', 'false')
})

test('play keeps playback controls in viewport on fresh start', async ({ page }) => {
  await page.goto('/')
  await page.locator('#accordianItemLessonControls').evaluate((el) => {
    el.classList.add('show')
  })
  await page.evaluate(() => window.scrollTo(0, 0))

  await page.locator('#btnPlayButton').click()

  const playInView = await page.locator('#btnPlayButton').evaluate((el) => {
    const rect = el.getBoundingClientRect()
    return rect.top >= 0 && rect.bottom <= window.innerHeight
  })
  expect(playInView).toBe(true)
})
