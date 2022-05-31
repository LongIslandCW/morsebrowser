import * as ko from 'knockout'
import { CookieInfo } from '../cookies/CookieInfo'
import { ICookieHandler } from '../cookies/ICookieHandler'
import { MorseCookies } from '../cookies/morseCookies'
import { GeneralUtils } from '../utils/general'

export class SpeedSettings implements ICookieHandler {
  wpm: ko.PureComputed<number>
  fwpm: ko.PureComputed<number>
  trueWpm: ko.Observable<number>
  trueFwpm: ko.Observable<number>
  syncWpm: ko.Observable<boolean>

  constructor () {
    MorseCookies.registerHandler(this)
    this.trueWpm = ko.observable()
    this.trueFwpm = ko.observable()
    this.syncWpm = ko.observable(true)

    this.wpm = ko.pureComputed({
      read: () => {
        return this.trueWpm()
      },
      write: (value:any) => {
        this.trueWpm(value)
        if (this.syncWpm() || parseInt(value) < parseInt(this.trueFwpm() as any)) {
          this.trueFwpm(value)
        }
      },
      owner: this
    })

    this.fwpm = ko.pureComputed({
      read: () => {
        if (!this.syncWpm()) {
          if (parseInt(this.trueFwpm() as any) <= parseInt(this.trueWpm() as any)) {
            return this.trueFwpm()
          } else {
            return this.trueWpm()
          }
        } else {
          this.trueFwpm(this.trueWpm())
          return this.trueFwpm()
        }
      },
      write: (value:any) => {
        if (parseInt(value) <= parseInt(this.trueWpm() as any)) {
          this.trueFwpm(value)
        }
      },
      owner: this
    })

    this.wpm.extend({ saveCookie: 'wpm' } as ko.ObservableExtenderOptions<number>)
    this.fwpm.extend({ saveCookie: 'fwpm' } as ko.ObservableExtenderOptions<number>)
    this.syncWpm.extend({ saveCookie: 'syncWpm' } as ko.ObservableExtenderOptions<boolean>)
  }

  handleCookies = (cookies: Array<CookieInfo>) => {
    if (!cookies) {
      return
    }
    let target:CookieInfo = cookies.find(x => x.key === 'syncWpm')
    if (target) {
      this.syncWpm(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'wpm')
    if (target) {
      this.wpm(parseInt(target.val))
    }

    target = cookies.find(x => x.key === 'fwpm')
    if (target) {
      this.fwpm(parseInt(target.val))
    }
  }

  handleCookie = (cookie: string) => {}
}
