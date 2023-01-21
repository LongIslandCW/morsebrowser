import * as ko from 'knockout'
import { CookieInfo } from '../cookies/CookieInfo'
import { ICookieHandler } from '../cookies/ICookieHandler'
import { MorseCookies } from '../cookies/morseCookies'
import { GeneralUtils } from '../utils/general'
export class FrequencySettings implements ICookieHandler {
  trudDitFrequency:ko.Observable<number>
  truDahFrequency:ko.Observable<number>
  syncFreq:ko.Observable<boolean>
  ditFrequency:ko.PureComputed<number>
  dahFrequency:ko.PureComputed<number>
  constructor () {
    MorseCookies.registerHandler(this)
    this.trudDitFrequency = ko.observable()
    this.truDahFrequency = ko.observable()
    this.syncFreq = ko.observable(true)
    this.ditFrequency = ko.pureComputed({
      read: () => {
        return this.trudDitFrequency()
      },
      write: (value) => {
        this.trudDitFrequency(value)
        if (this.syncFreq()) {
          this.truDahFrequency(value)
        }
      },
      owner: this
    })

    this.dahFrequency = ko.pureComputed({
      read: () => {
        if (!this.syncFreq()) {
          return this.truDahFrequency()
        } else {
          this.truDahFrequency(this.trudDitFrequency())
          return this.trudDitFrequency()
        }
      },
      write: (value) => {
        this.truDahFrequency(value)
      },
      owner: this
    })

    this.ditFrequency.extend({ saveCookie: 'ditFrequency' } as ko.ObservableExtenderOptions<number>)
    this.dahFrequency.extend({ saveCookie: 'dahFrequency' } as ko.ObservableExtenderOptions<number>)
    this.syncFreq.extend({ saveCookie: 'syncFreq' } as ko.ObservableExtenderOptions<boolean>)
  }

  // cookie handlers
  handleCookies = (cookies: Array<CookieInfo>) => {
    if (!cookies) {
      return
    }
    let target:CookieInfo = cookies.find(x => x.key === 'syncFreq')
    if (target) {
      this.syncFreq(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'ditFrequency')
    if (target) {
      this.ditFrequency(parseInt(target.val))
    }

    target = cookies.find(x => x.key === 'dahFrequency')
    if (target) {
      this.dahFrequency(parseInt(target.val))
    }
  }

  handleCookie = (cookie: string) => {}
}
