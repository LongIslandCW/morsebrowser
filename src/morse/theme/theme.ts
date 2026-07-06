import Cookies from 'js-cookie'
import { GeneralUtils } from '../utils/general'

export const DARK_MODE_COOKIE_KEY = 'darkMode'

export function applyTheme (darkMode: boolean): void {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
}

export function readDarkModeFromCookie (): boolean {
  const value = Cookies.get(DARK_MODE_COOKIE_KEY)
  if (value === undefined) {
    return false
  }
  return GeneralUtils.booleanize(value)
}
