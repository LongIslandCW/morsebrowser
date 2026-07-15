import ko from 'knockout'
import Cookies from 'js-cookie'
import { afterEach, beforeEach, vi } from 'vitest'

if (!ko.extenders.saveCookie) {
  ko.extenders.saveCookie = (target) => target
}

beforeEach(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('data-theme')
    document.body.innerHTML = ''
  }
  Cookies.remove('darkMode')
  vi.stubGlobal('location', {
    href: 'http://localhost/',
    search: '',
    pathname: '/'
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})
