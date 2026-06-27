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
  speedRacerEnabled: ko.Observable<boolean>
  // Comma-separated list of multipliers applied to the user's main WPM
  // (top of page). Each non-zero entry produces one variation play whose
  // WPM = round(mainWpm * multiplier). Zero entries are skipped. The post-
  // speak final play uses the *first* non-zero multiplier, not the last.
  speedRacerMultipliers: ko.Observable<string>
  // Whether to append a final play (replay) at the base speed (first
  // multiplier) after the variation plays.
  speedRacerFinalPlay: ko.Observable<boolean>
  // When Replay Base Speed is on, speak the card once before that replay.
  // Independent of the Voice Options toggle (voice trail / speak-first).
  speedRacerSpeakBeforeReplay: ko.Observable<boolean>
  morseViewModel:MorseViewModel
  variableSpeedDisplay: ko.Computed<boolean>
  speedRacerPreview: ko.Computed<string>
  speedRacerVariationCount: ko.Computed<number>
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
    this.speedRacerEnabled = ko.observable(false)
    this.speedRacerMultipliers = ko.observable('1.5, 1.35, 1.175, 1.0')
    this.speedRacerFinalPlay = ko.observable(true)
    this.speedRacerSpeakBeforeReplay = ko.observable(true)
    this.vWpm = ko.observable(0)
    this.vFwpm = ko.observable(0)

    // Mutual exclusion: turning on one mode turns off the other.
    this.speedInterval.subscribe((v) => {
      if (v && this.speedRacerEnabled()) {
        this.speedRacerEnabled(false)
      }
    })
    this.speedRacerEnabled.subscribe((v) => {
      if (v && this.speedInterval()) {
        this.speedInterval(false)
      }
    })

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

    // Variation count = number of non-zero multipliers.
    this.speedRacerVariationCount = ko.computed(() => {
      return SpeedSettings.parseMultipliers(this.speedRacerMultipliers()).length
    }, this)

    // Live preview of the per-card sequence, e.g.
    // "30 → 27 → 24 → 20 → speak → 30 wpm".
    this.speedRacerPreview = ko.computed(() => {
      if (!this.speedRacerEnabled()) {
        return ''
      }
      const target = Math.round(parseFloat(this.wpm() as any) || 0)
      const mults = SpeedSettings.parseMultipliers(this.speedRacerMultipliers())
      if (mults.length === 0 || target <= 0) {
        return ''
      }
      const wpms = mults.map(m => Math.max(1, Math.round(target * m)))
      if (!this.speedRacerFinalPlay()) {
        return wpms.join(' → ') + ' wpm'
      }
      const finalWpm = wpms[0]
      const speakStep = this.speedRacerSpeakBeforeReplay() ? ' → speak' : ''
      return wpms.join(' → ') + `${speakStep} → ${finalWpm} wpm`
    }, this)

    this.wpm.extend({ saveCookie: 'wpm' } as ko.ObservableExtenderOptions<number>)
    this.fwpm.extend({ saveCookie: 'fwpm' } as ko.ObservableExtenderOptions<number>)
    this.syncWpm.extend({ saveCookie: 'syncWpm' } as ko.ObservableExtenderOptions<boolean>)
    this.speedRacerEnabled.extend({ saveCookie: 'speedRacerEnabled' } as ko.ObservableExtenderOptions<boolean>)
    this.speedRacerMultipliers.extend({ saveCookie: 'speedRacerMultipliers' } as ko.ObservableExtenderOptions<string>)
    this.speedRacerFinalPlay.extend({ saveCookie: 'speedRacerFinalPlay' } as ko.ObservableExtenderOptions<boolean>)
    this.speedRacerSpeakBeforeReplay.extend({ saveCookie: 'speedRacerSpeakBeforeReplay' } as ko.ObservableExtenderOptions<boolean>)
  }

  // Restore the configurable Speed Racer fields to their constructor defaults.
  // Leaves speedRacerEnabled alone so pressing this from inside the Advanced
  // panel doesn't disable the feature out from under the user.
  resetSpeedRacerDefaults = () => {
    this.speedRacerMultipliers('1.5, 1.35, 1.175, 1.0')
    this.speedRacerFinalPlay(true)
    this.speedRacerSpeakBeforeReplay(true)
  }

  // Overlearn preset: ratios of 23 / 27 / 31 wpm with 23 as the base speed,
  // ordered slow→fast so each repeat pushes the student a step faster.
  // 23/23 = 1.0, 27/23 ≈ 1.174, 31/23 ≈ 1.348. The final base-speed replay is
  // turned off — overlearn is a pure copy drill that should end at the fastest
  // variation (turning the replay off also skips the spoken step).
  setOverlearnMultipliers = () => {
    this.speedRacerMultipliers('1.0, 1.174, 1.348')
    this.speedRacerFinalPlay(false)
    this.speedRacerSpeakBeforeReplay(false)
  }

  // Parse the multiplier list. Drops non-finite entries; drops zeros (the
  // user's "skip this slot" sentinel); rejects negatives. Order is preserved.
  static parseMultipliers = (s:string):number[] => {
    if (!s) return []
    return s.split(',')
      .map(x => parseFloat(x))
      .filter(n => Number.isFinite(n) && n > 0)
  }

  // Total audible morse plays per card when Speed Racer is on:
  // one play per non-zero multiplier, plus (if enabled) one final play at the
  // base speed after the TTS step. The TTS step itself is not counted.
  getRacerTotalPlays = ():number => {
    const n = SpeedSettings.parseMultipliers(this.speedRacerMultipliers()).length
    if (n <= 0) return 0
    return this.speedRacerFinalPlay() ? n + 1 : n
  }

  // True iff playIndex is the final post-speak play. Caller passes the index
  // emitted by the buffer.
  isRacerFinalPlay = (playIndex:number):boolean => {
    if (!this.speedRacerFinalPlay()) {
      return false
    }
    const total = this.getRacerTotalPlays()
    return total > 1 && playIndex === total - 1
  }

  /**
   * Apply Speed Racer to a base ApplicableSpeed for the given play slot.
   * Variation play (0..N-1) uses round(base.wpm * multipliers[playIndex]).
   * Final play (N) uses round(base.wpm * multipliers[0]) — the *first* non-
   * zero multiplier, which is the "initial" speed in the user's mental model.
   * FWPM stays at the user's saved base (Kurt's model): only character WPM
   * varies across the sequence. Saved fwpm resumes normally when Racer is off.
   */
  applySpeedRacer = (base:ApplicableSpeed, playIndex:number, _total:number):ApplicableSpeed => {
    if (!this.speedRacerEnabled() || playIndex < 0) {
      return base
    }
    const mults = SpeedSettings.parseMultipliers(this.speedRacerMultipliers())
    if (mults.length === 0) {
      return base
    }
    const isFinal = playIndex >= mults.length
    const multiplier = isFinal ? mults[0] : mults[playIndex]
    const variationWpm = Math.max(1, Math.round(base.wpm * multiplier))
    const variationFwpm = base.fwpm
    this.vWpm(variationWpm)
    this.vFwpm(variationFwpm)
    return new ApplicableSpeed(variationWpm, variationFwpm)
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

    target = cookies.find(x => x.key === 'speedRacerEnabled')
    if (target) {
      this.speedRacerEnabled(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'speedRacerMultipliers')
    if (target) {
      this.speedRacerMultipliers(target.val)
    }

    target = cookies.find(x => x.key === 'speedRacerFinalPlay')
    if (target) {
      this.speedRacerFinalPlay(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'speedRacerSpeakBeforeReplay')
    if (target) {
      this.speedRacerSpeakBeforeReplay(GeneralUtils.booleanize(target.val))
    }
  }

  handleCookie = (cookie: string) => {}
}
