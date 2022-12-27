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

  // cookie handling
  handleCookies = (cookies: Array<CookieInfo>) => {
    if (!cookies) {
      return
    }
    const target:CookieInfo = cookies.find(x => x.key === 'keepLines')
    if (target) {
      this.newlineChunking(GeneralUtils.booleanize(target.val))
    }
  }

  handleCookie = (cookie: string) => {}
}
