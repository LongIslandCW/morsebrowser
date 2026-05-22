import { expect, test } from '@playwright/test'

test('play collapses open settings accordions on fresh start', async ({ page }) => {
  await page.goto('/')
  const lessonsPanel = page.locator('#accordianItemLessonControls')
  await expect(lessonsPanel).toHaveClass(/show/)

  await page.locator('#btnPlayButton').click()

  await expect(lessonsPanel).not.toHaveClass(/show/)
  await expect(page.locator('#lessonAccordianButton')).toHaveAttribute('aria-expanded', 'false')
})
