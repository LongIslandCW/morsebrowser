import * as ko from 'knockout'
import { CookieInfo } from '../cookies/CookieInfo'
import { ICookieHandler } from '../cookies/ICookieHandler'
import { MorseCookies } from '../cookies/morseCookies'
import { MorseViewModel } from '../morse'
import { GeneralUtils } from '../utils/general'
import { PlayingTimeInfo } from '../utils/playingTimeInfo'

export class ApplicableSpeed {
  wpm:number = 0
  fwpm:number = 0
  constructor (wpm:number, fwpm:number) {
    this.wpm = wpm
    this.fwpm = fwpm
  }
}
export default class SpeedSettings implements ICookieHandler {
  wpm: ko.PureComputed<number>
  fwpm: ko.PureComputed<number>
  trueWpm: ko.Observable<number>
  trueFwpm: ko.Observable<number>
  syncWpm: ko.Observable<boolean>
  speedInterval:ko.Observable<boolean>
  intervalTimingsText:ko.Observable<string>
  intervalWpmText:ko.Observable<string>
  intervalFwpmText:ko.Observable<string>
  morseViewModel:MorseViewModel
  variableSpeedDisplay: ko.Computed<boolean>
  vWpm: ko.Observable<number>
  vFwpm: ko.Observable<number>
  vm:MorseViewModel

  constructor (vm:MorseViewModel) {
    MorseCookies.registerHandler(this)
    this.vm = vm
    this.trueWpm = ko.observable()
    this.trueFwpm = ko.observable()
    this.syncWpm = ko.observable(true)
    this.speedInterval = ko.observable(false)
    this.intervalTimingsText = ko.observable('')
    this.intervalWpmText = ko.observable('')
    this.intervalFwpmText = ko.observable('')
    this.vWpm = ko.observable(0)
    this.vFwpm = ko.observable(0)

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

    this.variableSpeedDisplay = ko.computed(() => {
      return (this.speedInterval() && this.intervalTimingsText() && vm.playerPlaying())
    }, this)

    this.wpm.extend({ saveCookie: 'wpm' } as ko.ObservableExtenderOptions<number>)
    this.fwpm.extend({ saveCookie: 'fwpm' } as ko.ObservableExtenderOptions<number>)
    this.syncWpm.extend({ saveCookie: 'syncWpm' } as ko.ObservableExtenderOptions<boolean>)
  }

  getApplicableSpeed = (playingTimeInfo:PlayingTimeInfo) => {
    if (!this.speedInterval() || !this.intervalTimingsText()) {
      return new ApplicableSpeed(this.wpm(), this.fwpm())
    }

    const times = this.intervalTimingsText().split(',').map(x => parseFloat(x))
    let runningSum = 0
    const adjTimes = times.map(t => {
      runningSum += t
      return runningSum
    })
    // console.log(`adjTimes:${JSON.stringify(adjTimes)}`)
    const wpms = this.intervalWpmText().split(',').map(x => parseInt(x))
    const fwpms = this.intervalFwpmText().split(',').map(x => parseInt(x))
    let idx = -1
    adjTimes.forEach((t, i, ary) => {
      if (idx === -1 && playingTimeInfo.totalSeconds < t) {
        // this is the interval
        idx = i
      }
    })
    if (idx === -1) {
      idx = Math.max(wpms.length - 1, fwpms.length - 1)
    }

    const wpm = wpms.length - 1 >= idx ? wpms[idx] : wpms[wpms.length - 1]
    const fwpm = fwpms.length - 1 >= idx ? fwpms[idx] : fwpms[fwpms.length - 1]
    // console.log(`sec:${secondsPassed},idx:${idx},wpm:${wpm},fwpm${fwpm}`)
    this.vWpm(wpm)
    this.vFwpm(fwpm)
    return new ApplicableSpeed(wpm, fwpm)
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

    target = cookies.find(x => x.key === 'speedInterval')
    if (target) {
      this.speedInterval(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'intervalTimingsText')
    if (target) {
      this.intervalTimingsText(target.val)
    }

    target = cookies.find(x => x.key === 'intervalWpmText')
    if (target) {
      this.intervalWpmText(target.val)
    }

    target = cookies.find(x => x.key === 'intervalFwpmText')
    if (target) {
      this.intervalFwpmText(target.val)
    }
  }

  handleCookie = (cookie: string) => {}
}
