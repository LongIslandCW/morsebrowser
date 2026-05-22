import Cookies from 'js-cookie'
import { describe, expect, it } from 'vitest'
import { applyTheme, DARK_MODE_COOKIE_KEY, readDarkModeFromCookie } from '../../../src/morse/theme/theme'

describe('theme', () => {
  it('applyTheme sets data-theme on documentElement', () => {
    applyTheme(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    applyTheme(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('readDarkModeFromCookie returns false when cookie absent', () => {
    Cookies.remove(DARK_MODE_COOKIE_KEY)
    expect(readDarkModeFromCookie()).toBe(false)
  })

  it('readDarkModeFromCookie returns booleanized cookie value', () => {
    Cookies.set(DARK_MODE_COOKIE_KEY, 'false')
    expect(readDarkModeFromCookie()).toBe(false)
  })
})
