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

  const toggle = page.getByRole('button', { name: 'Auto-close settings panels' })
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

test('stop then play does not throw closed AudioContext with keep panels open', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => {
    pageErrors.push(err.message)
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      pageErrors.push(msg.text())
    }
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Auto-close settings panels' }).click()
  const status = page.getByRole('status', { name: 'Latest status announcement' })

  await page.locator('#btnPlayButton').click()
  await expect(status).toContainText(/Playing/i)
  await page.locator('#btnStop').click()
  await expect(status).toContainText(/Stopped/i)
  await page.locator('#btnPlayButton').click()
  await expect(status).toContainText(/Playing/i)

  expect(pageErrors.filter((m) => /AudioContext/i.test(m))).toEqual([])
})
