import * as ko from 'knockout'
import { CookieInfo } from '../cookies/CookieInfo'
import { ICookieHandler } from '../cookies/ICookieHandler'
import { MorseCookies } from '../cookies/morseCookies'
import { GeneralUtils } from '../utils/general'
export class MiscSettings implements ICookieHandler {
  newlineChunking:ko.Observable<boolean>
  constructor () {
    MorseCookies.registerHandler(this)
    this.newlineChunking = ko.observable(false)
  }

  get isMoreSettingsAccordionOpen ():boolean {
    return GeneralUtils.booleanize(document.getElementById('moreSettingsAccordionButton').getAttribute('aria-expanded'))
  }

  // cookie handling
  handleCookies = (cookies: Array<CookieInfo>) => {
    if (!cookies) {
      return
    }
    let target:CookieInfo = cookies.find(x => x.key === 'keepLines')
    if (target) {
      this.newlineChunking(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'miscSettingsAccordionOpen')
    if (target) {
      const desiredState = GeneralUtils.booleanize(target.val)
      if (desiredState !== this.isMoreSettingsAccordionOpen) {
        const elem = document.getElementById('moreSettingsAccordionButton')
        elem.click()
      }
    }
  }

  handleCookie = (cookie: string) => {}
}
