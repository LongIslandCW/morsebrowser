import { expect, test, type Page } from '@playwright/test'

async function openLessonOptions (page: Page) {
  await page.goto('/')
  await expect(page.locator('#moreSettingsAccordionButton')).toBeVisible()
  await page.locator('#moreSettingsAccordionButton').click()
  await expect(page.locator('#collapselessonoptions')).toHaveClass(/show/)
}

test('no horizontal overflow when speed intervals are enabled', async ({ page }) => {
  await openLessonOptions(page)
  await page.locator('label[for="btncheckspeedinterval"]').click()
  await expect(page.locator('#intervalTimingsText')).toBeVisible()

  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  })
  expect(hasOverflow).toBe(false)

  const box = await page.locator('#intervalTimingsText').boundingBox()
  expect(box).not.toBeNull()
  if (box) {
    expect(box.width).toBeLessThan(400)
  }
})

test('override minutes input uses compact numeric width', async ({ page }) => {
  await openLessonOptions(page)
  await page.locator('label[for="btncheck2"]').click()
  const minutes = page.getByLabel('minutes')
  await expect(minutes).toBeVisible()
  const box = await minutes.boundingBox()
  expect(box).not.toBeNull()
  if (box) {
    expect(box.width).toBeLessThan(100)
  }
})
