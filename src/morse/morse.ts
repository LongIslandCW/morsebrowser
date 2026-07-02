import ko from 'knockout'
import MorseStringUtils from './utils/morseStringUtils'
import { SoundMakerConfig } from './player/soundmakers/SoundMakerConfig'
import { MorseWordPlayer } from './player/morseWordPlayer'
import MorseLessonPlugin from './lessons/morseLessonPlugin'
import { MorseLoadImages } from './images/morseLoadImages'
import { MorseShortcutKeys } from './shortcutKeys/morseShortcutKeys'
import { MorseExtenders } from './koextenders/morseExtenders'
import { MorseCookies } from './cookies/morseCookies'
import { MorseSettings } from './settings/settings'
import { MorseVoice } from './voice/MorseVoice'
import { FlaggedWords } from './flaggedWords/flaggedWords'
import { NoiseConfig } from './player/soundmakers/NoiseConfig'
import MorseRssPlugin from './rss/morseRssPlugin'
import { RssConfig } from './rss/RssConfig'
import SimpleImageTemplate from './components/morseImage/simpleImage'
import NoiseAccordion from './components/noiseAccordion/noiseAccordion'
import RssAccordion from './components/rssAccordion/rssAccordion'
import FlaggedWordsAccordion from './components/flaggedWordsAccordion/flaggedWordsAccordion'
import { CardBufferManager } from './utils/cardBufferManager'
import WordInfo from './utils/wordInfo'
import { PlayingTimeInfo } from './utils/playingTimeInfo'
import { SettingsChangeInfo } from './settings/settingsChangeInfo'
import { VoiceBufferInfo } from './voice/VoiceBufferInfo'
import { GeneralUtils } from './utils/general'
import MorseSettingsHandler from './settings/morseSettingsHandler'
import ScreenWakeLock from './utils/screenWakeLock'
import { applyTheme } from './theme/theme'
import { computeNeedToTrail, computeNoDelays, runAdvanceTrail, runFinalizeTrail } from './trail/trailPlayback'
import {
  applyLessonVoiceBaseline,
  buildLessonVoiceBaseline,
  computeAutoVoiceAllowed,
  computeNeedToSpeak,
  computeRacerRecapOn,
  isSpeedRacerActive,
  runSpeedRacerRecap,
  RECAP_LETTER_GAP_MS,
  shouldBypassManualVoiceForToggle,
  shouldShowManualVoiceRecapButton,
  shouldSkipVoiceBufferForRacer,
  voiceThinkingDelayMs,
  type LessonVoiceBaseline
} from './voice/voicePlayback'

export interface ShortcutKeyEntry {
  key: string
  title: string
}

export class MorseViewModel {
  // Default gap (in wordspaces) inserted between Speed Racer repeats when the
  // user hasn't set their own Repeat Spacing. Keeps racing repeats audibly
  // distinct instead of jammed together.
  static readonly RACER_DEFAULT_REPEAT_SPACING = 1
  accessibilityAnnouncement:ko.Observable<string> = ko.observable('')
  textBuffer:ko.Observable<string> = ko.observable('')
  hideList:ko.Observable<boolean> = ko.observable(true)
  currentIndex:ko.Observable<number> = ko.observable(0)
  playerPlaying:ko.Observable<boolean> = ko.observable(false)
  lastFullPlayTime = ko.observable(new Date(1900, 0, 0).getMilliseconds())
  preSpace:ko.Observable<number> = ko.observable(0)
  preSpaceUsed:ko.Observable<boolean> = ko.observable(false)
  xtraWordSpaceDits:ko.Observable<number> = ko.observable(0)
  isShuffled:ko.Observable<boolean> = ko.observable(false)
  trailReveal:ko.Observable<boolean> = ko.observable(false)
  preShuffled:string = ''
  morseWordPlayer:MorseWordPlayer
  rawText:ko.Observable<string> = ko.observable('')
  showingText:ko.Observable<string> = ko.observable('')
  showRaw:ko.Observable<boolean> = ko.observable(true)
  darkMode:ko.Observable<boolean> = ko.observable(false)
  volume:ko.Observable<number> = ko.observable(0)
  noiseHidden:ko.Observable<boolean> = ko.observable(true)
  noiseEnabled:ko.Observable<boolean> = ko.observable(false)
  noiseVolume:ko.Observable<number> = ko.observable(2)
  noiseType:ko.Observable<string> = ko.observable('off')
  lastPlayFullStart: number | null = null
  runningPlayMs:ko.Observable<number> = ko.observable(0)
  lastPartialPlayStart = ko.observable()
  isPaused:ko.Observable<boolean> = ko.observable(false)
  morseLoadImages = ko.observable()
  showExpertSettings:ko.Observable<boolean> = ko.observable(false)
  cardFontPx = ko.observable()
  loop:ko.Observable<boolean> = ko.observable(false)
  loopnoshuffle:ko.Observable<boolean> = ko.observable(false)
  morseVoice:MorseVoice
  shortcutKeys:MorseShortcutKeys
  // note this is whether you see any cards at all,
  // not whether the words on them are obscured
  cardsVisible:ko.Observable<boolean> = ko.observable(true)
  trailPreDelay:ko.Observable<number> = ko.observable(0)
  trailPostDelay:ko.Observable<number> = ko.observable(0)
  trailFinal:ko.Observable<number> = ko.observable(1)
  maxRevealedTrail:ko.Observable<number> = ko.observable(-1)
  isDev:ko.Observable<boolean> = ko.observable(false)
  riseTimeConstant:ko.Observable<number> = ko.observable(0.001)
  decayTimeConstant:ko.Observable<number> = ko.observable(0.001)
  riseMsOffset:ko.Observable<number> = ko.observable(1.5)
  decayMsOffset:ko.Observable<number> = ko.observable(1.5)
  smoothing:ko.Observable<boolean> = ko.observable(true)
  morseDisabled:ko.Observable<boolean> = ko.observable(false)
  settings:MorseSettings
  lessons:MorseLessonPlugin
  flaggedWords:FlaggedWords
  // voiceBuffer:string[]
  doPlayTimeout:any
  rss:MorseRssPlugin
  lastShuffled:string = ''
  flaggedWordsLogCount:number = 0
  flaggedWordsLog:any[] = []
  cardBufferManager:CardBufferManager
  charsPlayed:ko.Observable<number> = ko.observable(0)
  cardSpace:ko.Observable<number> = ko.observable(0)
  cardSpaceTimerHandle:any = 0
  allowSaveCookies:ko.Observable<boolean> = ko.observable(true)
  lockoutSaveCookiesTimerHandle:any = null
  currentSerializedSettings:any = null
  allShortcutKeys:ko.ObservableArray<ShortcutKeyEntry>
  keyboardShortcutScript:ko.Computed<string>
  applyEnabled:ko.Computed<boolean>
  speedRacerOverridesManualVoice:ko.Computed<boolean>
  voiceMasterToggleEnabled:ko.Computed<boolean>
  manualVoiceRecapButtonVisible:ko.Computed<boolean>
  /** Voice + Arm Recap from the active lesson preset; restored when Speed Racer turns off. */
  lessonVoiceBaseline:LessonVoiceBaseline | null = null
  numberOfRepeats:ko.Observable<number> = ko.observable(0)
  testTonePlaying:boolean = false
  testToneCount:number = 0
  testToneFlagHandle:any = 0
  screenWakeLock:ScreenWakeLock
  logoClickCount:number = 0
  cachedShuffle:boolean = false
  shuffleIntraGroup:ko.Observable<boolean> = ko.observable(false)
  // Bumped on pause/stop so in-flight Speed Racer voice recap chains abort cleanly.
  speedRacerToken:number = 0

  // END KO observables declarations
  constructor () {
    // initialize the images/icons
    this.morseLoadImages(new MorseLoadImages())

    // create the helper extenders
    MorseExtenders.init(this)

    // create settings (note do this after extenders)
    this.settings = new MorseSettings(this)
    // apply extenders
    MorseExtenders.apply(this)

    // initialize the main rawText
    this.rawText(this.showingText())

    this.lessons = new MorseLessonPlugin(this.settings, (s) => { this.setText(s) }, (str) => {
      const config = this.getMorseStringToWavBufferConfig(str)
      const est = this.morseWordPlayer.getTimeEstimate(config)
      return est
    }, this)

    this.rss = new MorseRssPlugin(new RssConfig(this.setText, this.fullRewind, this.doPlay, this.lastFullPlayTime, this.playerPlaying))

    // check for RSS feature turned on
    if (GeneralUtils.getParameterByName('rssEnabled')) {
      this.rss.rssEnabled(true)
      // this.initializeRss(null)
    }

    // check for noise feature turned on
    if (GeneralUtils.getParameterByName('noiseEnabled')) {
      this.noiseEnabled(GeneralUtils.getParameterByName('noiseEnabled') === 'true')
    }

    // check for noise feature turned on
    if (GeneralUtils.getParameterByName('morseDisabled')) {
      this.morseDisabled(GeneralUtils.getParameterByName('morseDisabled') === 'true')
    }

    // seems to need to happen early
    // this.morseWordPlayer = new MorseWordPlayer(new MorseWavBufferPlayer())
    this.morseWordPlayer = new MorseWordPlayer()
    this.morseWordPlayer.setSoundMaker(this.smoothing())

    // voice
    this.morseVoice = new MorseVoice(this)
    // after 5 seconds, run this.morseVoice.initEasySpeech()
    setTimeout(() => { this.morseVoice.initEasySpeech() }, 5000)

    this.loadDefaultsAndCookieSettings()

    // images
    this.lessons.initializeWordList()

    this.flaggedWords = new FlaggedWords()

    // check for voice feature turned on
    if (GeneralUtils.getParameterByName('voiceEnabled')) {
      this.morseVoice.voiceEnabled(true)
    }

    // check for voicebuffermax
    const voiceBufferMax = GeneralUtils.getParameterByName('voiceBufferMax')
    if (voiceBufferMax) {
      const parsed = Number.parseInt(voiceBufferMax, 10)
      if (Number.isInteger(parsed) && parsed > 0) {
        this.morseVoice.voiceBufferMaxLength(parsed)
      }
    }
    // are we on the dev site?
    this.isDev(window.location.href.toLowerCase().indexOf('/dev/') > -1)

    // images
    ko.components.register('simpleimage', SimpleImageTemplate)
    ko.components.register('noiseaccordion', NoiseAccordion)
    ko.components.register('rssaccordion', RssAccordion)
    ko.components.register('flaggedwordsaccordion', FlaggedWordsAccordion)

    // card buffer manager
    this.cardBufferManager = new CardBufferManager(() => this.currentIndex(), () => this.words())

    // Keep track of registered shortcut keys in an observable array
    // so we can display them on the page without having to hard-code them.
    this.allShortcutKeys = ko.observableArray<ShortcutKeyEntry>([])
    this.keyboardShortcutScript = ko.pureComputed(() => {
      const keyNames = new Map<string, string>([
        ['p', 'the letter P'],
        ['s', 'the letter S'],
        [',', 'the comma key'],
        ['<', 'the less than key'],
        ['.', 'the period key'],
        ['f', 'the letter F'],
        ['c', 'the letter C'],
        ['/', 'the slash key'],
        ['l', 'the letter L'],
        ['z', 'the letter Z'],
        ['x', 'the letter X']
      ])
      const actionNames = new Map<string, string>([
        ['Play / Toggle pause', 'play or pause practice'],
        ['Stop playback and rewind', 'stop playback and rewind to the first card'],
        ['Back 1', 'go back one card'],
        ['Full rewind', 'rewind to the first card'],
        ['Forward 1', 'go forward one card'],
        ['Flag current card', 'flag the current card'],
        ['Toggle card visibility', 'reveal or hide the card text'],
        ['Toggle shuffle', 'shuffle or unshuffle the practice cards'],
        ['Toggle looping', 'change the loop mode'],
        ['Reduce Farnsworth WPM', 'reduce effective speed by one word per minute'],
        ['Increase Farnsworth WPM', 'increase effective speed by one word per minute']
      ])
      const shortcuts = this.allShortcutKeys().map(({ key, title }) => {
        const spokenKey = keyNames.get(key) || `the ${key} key`
        const spokenAction = actionNames.get(title) || title.toLowerCase()
        return `Press ${spokenKey} to ${spokenAction}.`
      })
      return [
        'Keyboard shortcuts help.',
        'These keys work while you are practicing, as long as focus is not in a text field.',
        ...shortcuts
      ].join(' ')
    }, this)
    this.shortcutKeys = new MorseShortcutKeys((key, title) => {
      this.allShortcutKeys.push({ key, title })
    })
    this.shortcutKeys.registerKeyboardShortcutHandlers(this)

    this.showRaw(false)

    this.darkMode.subscribe((enabled) => applyTheme(enabled))
    applyTheme(this.darkMode())

    this.applyEnabled = ko.computed(() => {
      if (this.lessons && this.lessons.ifCustomGroup()) {
        return !!this.lessons.customGroup()?.trim()
      }
      return this.lessons.selectedDisplay().display && !this.lessons.selectedDisplay().isDummy
    }, this)

    this.speedRacerOverridesManualVoice = ko.computed(() => {
      return this.settings.speed.speedRacerEnabled() &&
        this.settings.speed.speedRacerSpeakBeforeReplay()
    }, this)

    this.voiceMasterToggleEnabled = ko.computed(() => {
      return shouldBypassManualVoiceForToggle(
        this.morseVoice.manualVoice(),
        this.settings.speed.speedRacerEnabled(),
        this.settings.speed.speedRacerSpeakBeforeReplay(),
        this.morseVoice.voiceCapable()
      )
    }, this)

    this.manualVoiceRecapButtonVisible = ko.computed(() => {
      return shouldShowManualVoiceRecapButton(
        this.morseVoice.manualVoice(),
        this.morseVoice.voiceEnabled(),
        this.settings.speed.speedRacerEnabled(),
        this.settings.speed.speedRacerSpeakBeforeReplay()
      )
    }, this)

    this.screenWakeLock = new ScreenWakeLock()
    this.registerAccessibilityAnnouncements()
  }
  // END CONSTRUCTOR

  announce = (message:string) => {
    this.accessibilityAnnouncement('')
    window.setTimeout(() => this.accessibilityAnnouncement(message), 0)
  }

  registerAccessibilityAnnouncements = () => {
    this.hideList.subscribe((hidden) => this.announce(hidden ? 'Cards are hidden' : 'Cards are revealed'))
    this.cardsVisible.subscribe((visible) => this.announce(visible ? 'Cards section is shown' : 'Cards section is hidden'))
    this.trailReveal.subscribe((enabled) => this.announce(enabled ? 'Trail is on' : 'Trail is off'))
    this.isShuffled.subscribe((shuffled) => this.announce(shuffled ? 'Cards are shuffled' : 'Cards are back in order'))
    this.loop.subscribe((enabled) => {
      if (!enabled) {
        this.announce('Loop is off')
      }
    })
    this.loopnoshuffle.subscribe((noShuffle) => {
      if (this.loop()) {
        this.announce(noShuffle ? 'Loop is on' : 'Loop shuffle is on')
      }
    })
    this.settings.speed.syncWpm.subscribe((synced) => this.announce(synced ? 'Character and effective speed are linked' : 'Character and effective speed are separate'))
    this.settings.speed.speedRacerEnabled.subscribe((enabled) => {
      this.announce(enabled ? 'Speed Racer is on' : 'Speed Racer is off')
      if (!enabled) {
        this.restoreLessonVoiceFromLesson()
      }
    })
    this.settings.speed.speedRacerSpeakBeforeReplay.subscribe((speakOn) => {
      if (!speakOn && this.settings.speed.speedRacerEnabled()) {
        this.restoreLessonVoiceFromLesson()
      }
    })
    this.lessons.syncSize.subscribe((synced) => this.announce(synced ? 'Minimum and maximum size are linked' : 'Minimum and maximum size are separate'))
    this.settings.frequency.syncFreq.subscribe((synced) => this.announce(synced ? 'Dit and dah pitch are linked' : 'Dit and dah pitch are separate'))
  }

  loadDefaultsAndCookieSettings = () => {
    // load defaults
    let settingsInfo = new SettingsChangeInfo(this)
    settingsInfo.ifLoadSettings = true
    MorseCookies.loadCookiesOrDefaults(settingsInfo)

    // load cookies
    settingsInfo = new SettingsChangeInfo(this)
    settingsInfo.ifLoadSettings = false
    MorseCookies.loadCookiesOrDefaults(settingsInfo)
  }

  logToFlaggedWords = (s) => {
    /* this.flaggedWordsLogCount++
    // const myPieces = this.flaggedWords.flaggedWords().split('\n')
    this.flaggedWordsLog[0] = { timeStamp: 0, msg: `LOGGED LINES:${this.flaggedWordsLogCount}` }
    const timeStamp = new Date()
    this.flaggedWordsLog[this.flaggedWordsLog.length] = { timeStamp, msg: `${s}` }
    const myPieces = this.flaggedWordsLog.map((e, i, a) => {
      return `${i < 2 ? e.timeStamp : e.timeStamp - a[i - 1].timeStamp}: ${e.msg}`
    })
    const out = myPieces.filter(s => s).join('\n')
    this.flaggedWords.flaggedWords(out) */
  }

  changeSentance = () => {
    this.currentIndex(0)
  }

  setText = (s:string) => {
    if (this.showRaw()) {
      this.showingText(s)
    } else {
      this.rawText(s)
    }
    // whenever text changes, clear the voice buffer
    this.morseVoice.voiceBuffer = []
  }

  words:ko.Computed<WordInfo[]> = ko.computed(() => {
    if (!this.rawText()) {
      return []
    }

    return MorseStringUtils.getWords(this.rawText(), this.settings.misc.newlineChunking())
  }, this)

  rawTextCharCount:ko.Computed<number> = ko.computed(() => {
    if (!this.rawText()) {
      return 0
    }
    return this.rawText().replace(' ', '').length
  }, this)

  shuffleWords = (fromLoopRestart:boolean = false) => {
    console.log(`shuffleWords called, isShuffled:${this.isShuffled()}, fromLoopRestart:${fromLoopRestart}`)
    // if it's not currently shuffled, or we're in a loop, re-shuffle
    if (!this.isShuffled() || fromLoopRestart) {
      const hasPhrases = this.rawText().indexOf('\n') !== -1 && this.settings.misc.newlineChunking()
      // if we're in a loop or otherwise already shuffled, we don't want to lose the preShuffled
      if (!this.isShuffled()) {
        this.preShuffled = this.rawText()
      }

      const shuffleArray = <T>(arr:T[]):T[] => {
        const copy = [...arr]
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          const tmp = copy[i]
          copy[i] = copy[j]
          copy[j] = tmp
        }
        return copy
      }

      const words = [...this.words()]

      // Build "shuffle units" where a unit is either:
      // - a single ungrouped word
      // - a grouped block containing all words sharing a groupId (in original relative order)
      const groupMap = new Map<number, { firstIndex:number, words:WordInfo[] }>()
      const ungroupedUnits:WordInfo[][] = []

      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        const groupId = word.getGroupId()
        if (groupId == null) {
          ungroupedUnits.push([word])
          continue
        }

        const existing = groupMap.get(groupId)
        if (existing) {
          existing.words.push(word)
        } else {
          groupMap.set(groupId, { firstIndex: i, words: [word] })
        }
      }

      const groupedUnits = [...groupMap.entries()]
        .sort((a, b) => a[1].firstIndex - b[1].firstIndex)
        .map(([, info]) => {
          if (this.shuffleIntraGroup && this.shuffleIntraGroup()) {
            return shuffleArray(info.words)
          }
          return [...info.words]
        })

      const shuffleUnits:WordInfo[][] = [...groupedUnits, ...ungroupedUnits]

      // Fisher-Yates shuffle on the units (not individual words) so grouped blocks stay intact.
      const shuffledUnits = shuffleArray(shuffleUnits)

      const shuffledWords = shuffledUnits.flat()
      this.lastShuffled = shuffledWords.map(w => w.rawWord).join(hasPhrases ? '\n' : ' ')
      // this.lastShuffled = this.rawText().split(hasPhrases ? '\n' : ' ').sort(() => { return 0.5 - Math.random() }).join(hasPhrases ? '\n' : ' ')
      this.setText(this.lastShuffled)
      if (!this.isShuffled()) {
        this.isShuffled(true)
      }
    } else {
      // otherwise, user wants things put back the way they were
      this.setText(this.preShuffled)
      this.isShuffled(false)
    }
  }

  incrementIndex = () => {
    if (this.currentIndex() < this.words().length - 1) {
      this.currentIndex(this.currentIndex() + 1)
    }
  }

  decrementIndex = () => {
    this.morseWordPlayer.pause(() => {
      if (this.currentIndex() > 0 && this.words().length > 1) {
        this.currentIndex(this.currentIndex() - 1)
        // experience shows it is good to put a little pause here
        // so they dont' blur together
        setTimeout(this.doPlay, 1000)
      }
    }, false)
  }

  fullRewind = () => {
    this.currentIndex(0)
  }

  sentanceRewind = () => {
    this.currentIndex(0)
  }

  setWordIndex = (index) => {
    if (!this.playerPlaying()) {
      this.currentIndex(index)
    } else {
      this.doPause(false, false, false)
      this.currentIndex(index)
      this.doPlay(false, false)
    }
  }

  setFlagged = () => {
    if (this.flaggedWords.flaggedWords().trim()) {
      this.doPause(true, false, false)
      this.setText(this.flaggedWords.flaggedWords())
      this.fullRewind()
      this.announce('Flagged cards loaded as text')
    }
  }

  addFlaggedWord = (word:WordInfo) => {
    this.flaggedWords.addFlaggedWord(word)
    this.announce('Flagged card')
  }

  clearFlagged = () => {
    if (this.flaggedWords.flaggedWords().trim()) {
      this.flaggedWords.clear()
    }
  }

  getMorseStringToWavBufferConfig = (text, isToneTest:boolean = false, applySpeedRacer:boolean = false, interRepeatDits:number = 0) => {
    const config = new SoundMakerConfig()
    config.word = MorseStringUtils.doReplacements(text)
    let speeds = this.settings.speed.getApplicableSpeed(this.playingTime())
    // Speed Racer overrides the per-card speed based on which repeat we're
    // playing. Only apply on the live play path (caller passes true). Time
    // estimates and wav downloads must use the unmodified target speed.
    if (applySpeedRacer && this.settings.speed.speedRacerEnabled() && config.word && config.word.trim().length > 0) {
      const { index, total } = this.cardBufferManager.getRepeatState()
      if (total >= 1 && index >= 0) {
        speeds = this.settings.speed.applySpeedRacer(speeds, index, total)
      }
    }
    config.wpm = parseInt(speeds.wpm as any)
    config.fwpm = parseInt(speeds.fwpm as any)
    config.ditFrequency = parseInt(this.settings.frequency.ditFrequency() as any)
    config.dahFrequency = parseInt(this.settings.frequency.dahFrequency() as any)
    if (!isToneTest) {
      config.prePaddingMs = this.preSpaceUsed() ? 0 : this.preSpace() * 1000
    } else {
      config.prePaddingMs = 0
    }
    // note this was changed so UI is min 1 meaning 0, 1=>7, 2=>14 etc
    config.xtraWordSpaceDits = (parseInt(this.xtraWordSpaceDits() as any) - 1) * 7
    // Fractional Repeat Spacing (e.g. 0.25 wordspace) is rendered as extra
    // trailing wordspace dits on audible plays. Empty word-gap plays already
    // carry the whole-wordspace part, so skip them here.
    if (interRepeatDits > 0 && config.word && config.word.trim().length > 0) {
      config.xtraWordSpaceDits += interRepeatDits
    }
    config.volume = parseInt(this.volume() as any)
    config.noise = new NoiseConfig()
    config.noise.type = this.noiseEnabled() ? this.noiseType() : 'off'
    config.noise.volume = parseInt(this.noiseVolume() as any)
    config.playerPlaying = this.playerPlaying()
    config.riseTimeConstant = parseFloat(this.riseTimeConstant() as any)
    config.decayTimeConstant = parseFloat(this.decayTimeConstant() as any)
    config.riseMsOffset = parseFloat(this.riseMsOffset() as any)
    config.decayMsOffset = parseFloat(this.decayMsOffset() as any)
    // suppress wordspaces when using speak so "thinking time" will control
    if (this.morseVoice &&
        computeAutoVoiceAllowed(
          this.morseVoice.manualVoice(),
          isSpeedRacerActive(
            this.settings.speed.speedRacerEnabled(),
            this.settings.speed.getRacerTotalPlays()
          )
        ) &&
        this.ifMaxVoiceBufferReached()) {
      config.trimLastWordSpace = this.morseVoice.voiceEnabled() && !this.cardBufferManager.hasMoreMorse()
      config.voiceEnabled = this.morseVoice.voiceEnabled()
    }
    config.morseDisabled = this.morseDisabled()
    if (isToneTest) {
      config.trimLastWordSpace = true
    }
    config.isToneTest = isToneTest

    return config
  }

  testTone = () => {
    console.log(`testTone clidked playing status ${this.testTonePlaying}`)
    if (!this.testTonePlaying) {
      const config = this.getMorseStringToWavBufferConfig('T', true)
      config.isToneTest = true
      this.testTonePlaying = true
      // console.log(`testTone clidked playing status now ${this.testTonePlaying}`)
      this.morseWordPlayer.play(config, (fromVoiceOrTrail) => {})
      // TODO: avoid hardcoding the 10 seconds, this seemed to be the easiset way
      // to flip the flag, passing in callbacks was buggy for some reason
      this.testToneFlagHandle = setTimeout(() => {
        this.testTonePlaying = false
        // console.log('testtone ended')
      }, 10000)
    } else {
      clearTimeout(this.testToneFlagHandle)
      // console.log('stopping test tone')
      this.morseWordPlayer.pause(() => {
        this.testTonePlaying = false
      }, false)
    }
  }

  // Convenience method for toggling playback
  togglePlayback = () => {
    if (this.playerPlaying()) {
      this.doPause(false, true, false)
    } else {
      this.doPlay(true, false)
    }
  }

  togglePlaybackFromShortcut = () => {
    if (this.playerPlaying()) {
      this.doPause(false, true, false)
      this.focusPlaybackControl('btnPause')
      return
    }

    if (this.isPaused()) {
      this.doPlay(true, false)
      this.focusPlaybackControl('btnPlayButton')
      return
    }

    this.doPlay(false, true)
    this.focusPlaybackControl('btnPlayButton')
  }

  stopPlaybackFromShortcut = () => {
    this.doPause(true, false, true)
    this.focusPlaybackControl('btnStop')
  }

  collapseSettingsAccordions = () => {
    const area = document.getElementById('accordionArea')
    if (!area) {
      return
    }
    area.querySelectorAll('.accordion-collapse.show').forEach((panel) => {
      panel.classList.remove('show')
    })
    area.querySelectorAll('.accordion-button').forEach((button) => {
      button.classList.add('collapsed')
      button.setAttribute('aria-expanded', 'false')
    })
  }

  isVoiceOptionsAccordionOpen = ():boolean => {
    return document.getElementById('collapsevoiceoptions')?.classList.contains('show') ?? false
  }

  expandVoiceOptionsAccordionIfClosed = () => {
    if (this.isVoiceOptionsAccordionOpen()) {
      return
    }
    const panel = document.getElementById('collapsevoiceoptions')
    const button = document.getElementById('voiceOptionsAccordionButton')
    if (!panel || !button) {
      return
    }
    panel.classList.add('show')
    button.classList.remove('collapsed')
    button.setAttribute('aria-expanded', 'true')
  }

  onSpeedRacerEnabledClick = (_data, event:Event) => {
    const input = event.target as HTMLInputElement
    if (input?.checked) {
      this.expandVoiceOptionsAccordionIfClosed()
      if (this.settings.speed.speedRacerSpeakBeforeReplay() && this.morseVoice.voiceCapable()) {
        this.morseVoice.voiceEnabled(true)
      }
    }
    return true
  }

  captureLessonVoiceBaseline = () => {
    this.lessonVoiceBaseline = buildLessonVoiceBaseline(
      this.morseVoice.voiceEnabled(),
      this.morseVoice.manualVoice()
    )
  }

  restoreLessonVoiceFromLesson = () => {
    if (!this.lessonVoiceBaseline) {
      return
    }
    applyLessonVoiceBaseline(
      this.lessonVoiceBaseline,
      (value) => this.morseVoice.voiceEnabled(value),
      (value) => this.morseVoice.manualVoice(value)
    )
  }

  onSpeedRacerSpeakBeforeReplayClick = (_data, event:Event) => {
    const input = event.target as HTMLInputElement
    this.expandVoiceOptionsAccordionIfClosed()
    if (input?.checked && this.morseVoice.voiceCapable()) {
      this.morseVoice.voiceEnabled(true)
    }
    return true
  }

  scrollPlaybackIntoView = () => {
    document.querySelector('.playback-controls')?.scrollIntoView({ block: 'start', behavior: 'auto' })
  }

  focusPlaybackControl = (id:string) => {
    window.setTimeout(() => {
      this.scrollPlaybackIntoView()
      document.getElementById(id)?.focus({ preventScroll: true })
    }, 0)
  }

  focusKeyboardShortcuts = () => {
    window.setTimeout(() => {
      const summary = document.getElementById('keyboard-shortcuts-summary')
      summary?.focus()
    }, 0)
    return true
  }

  keyboardShortcutsToggled = (_data, event) => {
    const details = event.target as HTMLDetailsElement
    if (details.open) {
      window.setTimeout(() => {
        document.getElementById('keyboard-shortcuts-content')?.focus()
      }, 0)
    }
    return true
  }

  doPlay = (playJustEnded:boolean, fromPlayButton:boolean) => {
    if (!this.rawText().trim()) {
      return
    }
    // we get here several ways:
    // 1. user presses play for the first time
    // 1a. set prespaceused to false, so it will get used.
    // 1b. set the elapsed ms to 0
    // 2. user presses play after a pause
    // 2a. set prespaceused to false, so it will get used again.
    // 3. we just finished playing a word
    // 4. user might press play to re-play a word
    const wasPlayerPlaying = this.playerPlaying()
    const wasPaused = this.isPaused()
    const freshStart = fromPlayButton && !wasPlayerPlaying
    if (freshStart) {
      this.collapseSettingsAccordions()
      this.scrollPlaybackIntoView()
    }
    if (!this.lastPlayFullStart || (this.lastFullPlayTime() > this.lastPlayFullStart)) {
      this.lastPlayFullStart = Date.now()
    }
    this.isPaused(false)
    this.playerPlaying(true)
    if (freshStart || wasPaused) {
      this.announce('Playing')
    }
    if (!playJustEnded) {
      this.preSpaceUsed(false)
    }

    if (freshStart) {
      this.runningPlayMs(0)
      // clear the voice cache
      this.morseVoice.voiceBuffer = []
      // prime the pump for safari
      this.morseVoice.primeThePump()
      // clear the card buffer
      this.cardBufferManager.clear()
      this.charsPlayed(0)
      // speakfirst prep
      this.morseVoice.speakFirstLastCardIndex = -1
      // this.morseVoice.speakFirstCompletedLast = false
    }
    // experience shows it is good to put a little pause here when user forces us here,
    // e.g. hitting back or play b/c word was misunderstood,
    // so they dont' blur together.
    if (this.doPlayTimeout) {
      clearTimeout(this.doPlayTimeout)
    }

    // set a time which will cause pause (in case something else was playing),
    // passing in a callback to then play
    this.doPlayTimeout = setTimeout(() => {
      this.morseWordPlayer.pause(() => {
      // help trailing reveal, max should always be one behind before we're about to play
        this.maxRevealedTrail(this.currentIndex() - 1)
        /* const config = this.getMorseStringToWavBufferConfig(
          this.cardBufferManager.getNextMorse(
            !this.morseVoice.speakFirst() ? 0 : parseInt(this.morseVoice.speakFirstRepeats() as any),
            !this.morseVoice.speakFirst() ? 0 : parseInt(this.morseVoice.speakFirstAdditionalWordspaces() as any)
          )
        ) */

        /*
        0: play 1 time (i.e. don't repeat)
        1: play 2 times
        2: play 3 times etc.
        */
        // Speed Racer owns the per-card play count when enabled. It uses
        // (variation count + 1) plays — the +1 is the base-speed replay. A
        // single variation with the replay off still counts as racing (1 play),
        // so route any positive racer play count through the racer path.
        const racerOn = this.settings.speed.speedRacerEnabled()
        const racerTotalPlays = racerOn ? this.settings.speed.getRacerTotalPlays() : 0
        const racerActive = isSpeedRacerActive(racerOn, racerTotalPlays)
        const repeats = racerTotalPlays >= 1
          ? racerTotalPlays
          : (parseInt(this.numberOfRepeats() as any) === 0 ? 0 : parseInt(this.numberOfRepeats() as any) + 1)
        // The "Repeat Spacing" box (in wordspaces) controls the gap between
        // repeats for both normal repeats and Speed Racer. It supports 0.25
        // steps: the whole part is rendered as silent word-gap plays and the
        // fractional part as extra trailing wordspace dits (1 wordspace = 7
        // dits) on the audible plays.
        const userRepeatSpacing = Math.max(0, parseFloat(this.morseVoice.speakFirstAdditionalWordspaces() as any) || 0)
        // Speed Racer jams its repeats together with no gap by default, which
        // testers found too fast to follow. When racing and the user hasn't set
        // their own Repeat Spacing, fall back to a one-wordspace gap so each
        // repeat is distinct. An explicit non-zero value always wins.
        const repeatSpacing = (racerActive && userRepeatSpacing === 0)
          ? MorseViewModel.RACER_DEFAULT_REPEAT_SPACING
          : userRepeatSpacing
        const wholeWordSpaces = Math.floor(repeatSpacing)
        const fractionalWordSpaceDits = repeats > 0 ? (repeatSpacing - wholeWordSpaces) * 7 : 0
        const config = this.getMorseStringToWavBufferConfig(
          this.cardBufferManager.getNextMorse(repeats, wholeWordSpaces),
          false,
          true,
          fractionalWordSpaceDits
        )
        this.addToVoiceBuffer()
        const racerState = this.cardBufferManager.getRepeatState()
        const playIndex = racerState.index
        const audiblePlay = !!(config.word && config.word.trim().length > 0)
        const speakOn = computeRacerRecapOn({
          racerOn: racerActive,
          speedRacerSpeakBeforeReplay: this.settings.speed.speedRacerSpeakBeforeReplay(),
          voiceEnabled: this.morseVoice.voiceEnabled()
        })

        const playerCmd = () => {
          if (!this.morseVoice.speakFirst() || this.playerPlaying()) {
            this.morseWordPlayer.play(config, (fromVoiceOrTrail) => {
              this.charsPlayed(this.charsPlayed() + config.word.replace(' ', '').length)
              const speakAfter = speakOn &&
                audiblePlay &&
                this.settings.speed.isRacerSpeakAfterLastVariation(playIndex)
              if (speakAfter) {
                const padMs = this.settings.speed.getSpeedRacerPreSpeakPadMs()
                setTimeout(() => {
                  if (!this.playerPlaying()) {
                    return
                  }
                  this.speakSpeedRacerRecap(() => {
                    if (this.playerPlaying()) {
                      this.playEnded(fromVoiceOrTrail)
                    }
                  })
                }, padMs)
              } else {
                this.playEnded(fromVoiceOrTrail)
              }
            })
          }
        }

        // Speed Racer: optional speak before base-speed replay, or speak after last variation.
        const shouldSpeakBeforeReplay = speakOn &&
          audiblePlay &&
          this.settings.speed.isRacerSpeakBeforeFinalReplay(playIndex)

        if (shouldSpeakBeforeReplay) {
          const padMs = this.settings.speed.getSpeedRacerPreSpeakPadMs()
          setTimeout(() => {
            if (!this.playerPlaying()) {
              return
            }
            this.speakSpeedRacerRecap(() => {
              if (this.playerPlaying()) {
                playerCmd()
              }
            })
          }, padMs)
        } else if (racerActive) {
          // Speed Racer manages its own speak step. Bypass speakFirst entirely
          // so a stale speakFirst toggle can't add a voiceThinkingTime delay
          // before the *first* variation play.
          playerCmd()
        } else if (!this.morseVoice.speakFirst() ||
            (this.morseVoice.speakFirst() && (this.morseVoice.speakFirstLastCardIndex === this.currentIndex()))
        ) {
          playerCmd()
        } else {
          const phraseToSpeak = this.getPhraseToSpeakFromBuffer()
          setTimeout(() => {
            const finalPhraseToSpeak = this.prepPhraseToSpeakForFinal(phraseToSpeak)
            this.morseVoice.speakPhrase(finalPhraseToSpeak, () => {
              // what gets called after speaking
              this.morseVoice.speakFirstLastCardIndex = this.currentIndex()
              playerCmd()
            })
          }, this.morseVoice.voiceThinkingTime() * 1000)
        }
        this.lastPartialPlayStart(Date.now())
        this.preSpaceUsed(true)
        // pause wants killNoiseparater
      }, false)
    },
    // timeout parameters
    playJustEnded || fromPlayButton ? 0 : 1000)
  }

  // Speed Racer voice recap. Respects voiceSpelling: whole word when off,
  // one letter at a time when on (short fixed gap between letters). Voice
  // Delay Before/After apply once around the recap, not between letters.
  speakSpeedRacerRecap = (onComplete:() => void) => {
    if (!this.morseVoice.voiceEnabled()) {
      onComplete()
      return
    }
    const currentWord = this.words()[this.currentIndex()]
    const preSpeechMs = voiceThinkingDelayMs(this.morseVoice.voiceThinkingTime())
    const postSpeechMs = voiceThinkingDelayMs(this.morseVoice.voiceAfterThinkingTime())
    const token = this.speedRacerToken

    runSpeedRacerRecap({
      getSpelling: () => this.morseVoice.voiceSpelling(),
      speakText: currentWord.speakText(this.morseVoice.voiceSpelling()),
      speakTextSpelled: currentWord.speakText(true),
      preSpeechMs,
      letterGapMs: RECAP_LETTER_GAP_MS,
      postSpeechMs,
      token,
      getToken: () => this.speedRacerToken,
      isPlaying: () => this.playerPlaying(),
      isVoiceEnabled: () => this.morseVoice.voiceEnabled(),
      prepPhrase: (phrase) => this.prepPhraseToSpeakForFinal(phrase),
      speakPhrase: (phrase, onDone) => this.morseVoice.speakPhraseImmediate(phrase, onDone),
      onComplete
    })
  }

  ifMaxVoiceBufferReached = ():boolean => {
    // ignore if is 1
    if (this.morseVoice.voiceBufferMaxLength() === 1) {
      return true
    }
    const isNotLastWord = this.currentIndex() < this.words().length - 1
    if (!isNotLastWord) {
      return true
    }
    const maxBufferReached = this.morseVoice.voiceBuffer.length === parseInt(this.morseVoice.voiceBufferMaxLength() as any)
    return maxBufferReached
  }

  playEnded = (fromVoiceOrTrail) => {
    console.log(`playEnded fromVoiceOrTrail:${fromVoiceOrTrail}`)
    // voice or trail have timers that might call this after user has hit stop
    // specifically they have built in pauses for "thinking time" during which the user
    // might have hit stop

    // note that if speaking and trailing, speaking is "in the driver's seat"
    // and the trailing delays are ignored

    // TODO: the code here is getting a little nasty. probably needs to be refactored to manage the states
    // and rules (once they're all finalized). leaving as is because rules are still a little unstable.

    if (fromVoiceOrTrail && !this.playerPlaying()) {
      return
    }

    if (this.morseVoice.speakFirst() && !this.playerPlaying()) {
      return
    }
    // where are we in the words to process?
    const isNotLastWord = this.currentIndex() < this.words().length - 1
    const anyNewLines = this.rawText().indexOf('\n') !== -1
    const maxBufferReached = this.ifMaxVoiceBufferReached()
    const racerOn = isSpeedRacerActive(
      this.settings.speed.speedRacerEnabled(),
      this.settings.speed.getRacerTotalPlays()
    )
    const needToSpeak = computeNeedToSpeak({
      voiceEnabled: this.morseVoice.voiceEnabled(),
      fromVoiceOrTrail,
      hasMoreMorse: this.cardBufferManager.hasMoreMorse(),
      maxBufferReached,
      speakFirst: this.morseVoice.speakFirst(),
      racerOn,
      speedRacerSpeakBeforeReplay: this.settings.speed.speedRacerSpeakBeforeReplay()
    })

    const needToTrail = computeNeedToTrail({
      trailReveal: this.trailReveal(),
      fromVoiceOrTrail,
      hasMoreMorse: this.cardBufferManager.hasMoreMorse()
    })
    const speakAndTrail = needToSpeak && needToTrail

    const noDelays = computeNoDelays(needToSpeak, needToTrail)

    const advanceTrail = (forceContinue = false) => {
      // note we eliminate the trail delays if speaking
      if (this.trailReveal()) {
        const token = this.speedRacerToken
        runAdvanceTrail({
          preDelaySec: this.trailPreDelay(),
          postDelaySec: this.trailPostDelay(),
          speakAndTrail,
          onReveal: () => {
            if (token !== this.speedRacerToken || !this.playerPlaying()) {
              return
            }
            this.maxRevealedTrail(this.maxRevealedTrail() + 1)
          },
          onContinue: () => {
            if (token !== this.speedRacerToken || !this.playerPlaying()) {
              return
            }
            // if speak is in the driver's seat it will call this,
            // if not then trail will
            if (!speakAndTrail || forceContinue) {
              this.playEnded(true)
            }
          }
        })
      }
    }

    const finalizeTrail = (finalCallback) => {
      if (this.trailReveal()) {
        const token = this.speedRacerToken
        runFinalizeTrail({
          finalDelaySec: this.trailFinal(),
          onDone: () => {
            if (token !== this.speedRacerToken || !this.playerPlaying()) {
              return
            }
            this.maxRevealedTrail(-1)
            finalCallback()
          }
        })
      }
    }

    if (noDelays) {
      // no speaking, so play more morse
      this.runningPlayMs(this.runningPlayMs() + (Date.now() - this.lastPartialPlayStart()))
      if (isNotLastWord || this.cardBufferManager.hasMoreMorse()) {
        let cardChanged = false
        const hasMoreMorse = this.cardBufferManager.hasMoreMorse()
        if (!hasMoreMorse) {
          if (this.morseVoice.speakFirst()) {
            // clear the buffer
            this.morseVoice.voiceBuffer = []
          }
          this.incrementIndex()
          cardChanged = true
        }

        const getCardSpaceTimerHandleDelay = () => {
          if (this.settings.speed.speedRacerEnabled()) {
            if (!cardChanged && hasMoreMorse) {
              return 0
            }
            return Math.max(this.cardSpace() * 1000, 800)
          }
          if (!cardChanged && hasMoreMorse) {
            return 0
          } else {
            return this.cardSpace() * 1000
          }
        }
        this.cardSpaceTimerHandle = setTimeout(() => {
          // this.addToVoiceBuffer()
          this.doPlay(true, false)
        }, getCardSpaceTimerHandleDelay())
      } else {
      // nothing more to play
        const finalToDo = () => {
          this.announce('Playback complete')
          this.doPause(true, false, false)
        }
        // trailing may want a linger
        if (this.trailReveal()) {
          finalizeTrail(finalToDo)
        } else {
          finalToDo()
        }
      }
    }

    if (needToSpeak) {
      // speak the voice buffer if there's a newline or nothing more to play
      const speakText = this.morseVoice.voiceBuffer[0].txt
      const hasNewline = speakText.indexOf('\n') !== -1

      const speakCondition = computeAutoVoiceAllowed(this.morseVoice.manualVoice(), racerOn) &&
                (hasNewline || !isNotLastWord || !anyNewLines || !this.settings.misc.newlineChunking())
      if (speakCondition) {
        let phraseToSpeak = this.getPhraseToSpeakFromBuffer()
        if (this.morseVoice.voiceLastOnly()) {
          const phrasePieces = phraseToSpeak.split(' ')
          phraseToSpeak = phrasePieces[phrasePieces.length - 1]
        }

        /*
        const voiceAction = (p:number, pieces:string[]) => {
          this.morseVoice.speakPhrase(pieces[p], () => {
            // what gets called after speaking
            if ((p + 1) === pieces.length) {
              if (needToTrail) {
                advanceTrail()
              }
              this.playEnded(true)
            } else {
              voiceAction(p + 1, pieces)
            }
          })
        }
        */

        const token = this.speedRacerToken
        const continueAfterVoice = () => {
          if (needToTrail) {
            advanceTrail()
          }
          this.playEnded(true)
        }
        setTimeout(() => {
          if (token !== this.speedRacerToken || !this.playerPlaying()) {
            return
          }
          if (!this.morseVoice.voiceEnabled()) {
            continueAfterVoice()
            return
          }
          const finalPhraseToSpeak = this.prepPhraseToSpeakForFinal(phraseToSpeak)
          this.morseVoice.speakPhrase(finalPhraseToSpeak, () => {
            if (token !== this.speedRacerToken || !this.playerPlaying()) {
              return
            }
            if (!this.morseVoice.voiceEnabled()) {
              continueAfterVoice()
              return
            }
            // what gets called after speaking

            continueAfterVoice()
          })
        }, voiceThinkingDelayMs(this.morseVoice.voiceThinkingTime()))
      } else if (needToTrail) {
        advanceTrail(true)
      } else {
        this.playEnded(true)
      }
    }

    // if trail is turned on but not speaking
    if (needToTrail && !speakAndTrail) {
      advanceTrail()
    }
  }

  prepPhraseToSpeakForFinal = (beforePhrase:string):string => {
    // for reasons I can't recall, wordifyPunctuation adds pipe character
    // remove it
    const afterPhrase = beforePhrase.replace(/\|/g, ' ')
      .replace(/\WV\W/g, ' VEE ')
      .replace(/^V\W/g, ' VEE ')
      .replace(/\WV$/g, ' VEE ')
    return afterPhrase
  }

  addToVoiceBuffer = () => {
    // When SR recap will speak this card, skip the voice buffer so words are
    // not spoken twice or rushed together.
    if (shouldSkipVoiceBufferForRacer(
      isSpeedRacerActive(
        this.settings.speed.speedRacerEnabled(),
        this.settings.speed.getRacerTotalPlays()
      ),
      this.settings.speed.speedRacerSpeakBeforeReplay(),
      this.morseVoice.voiceEnabled()
    )) {
      return
    }
    // make sure we don't add the same card twice...someday figure what causes
    const lastBufIndex = this.morseVoice.voiceBuffer.length > 0 ? this.morseVoice.voiceBuffer[this.morseVoice.voiceBuffer.length - 1].idx : -1
    if (this.currentIndex() > lastBufIndex &&
        this.currentIndex() >= this.morseVoice.voiceBuffer.length) {
    // populate the voiceBuffer even if not speaking, as we might be caching
      const currentWord = this.words()[this.currentIndex()]
      const speakText = currentWord.speakText(this.morseVoice.voiceSpelling())
      const vbInfo = new VoiceBufferInfo()
      vbInfo.txt = speakText
      vbInfo.idx = this.currentIndex()
      this.morseVoice.voiceBuffer.push(vbInfo)
    }
  }

  // used by recap
  speakVoiceBuffer = () => {
    if (this.morseVoice.voiceBuffer.length > 0) {
      const entry = this.morseVoice.voiceBuffer.shift()
      if (!entry) {
        return
      }
      const phrase = entry.txt
      // for reasons I can't recall, wordifyPunctuation adds pipe character
      // remove it
      const finalPhraseToSpeak = phrase.replace(/\|/g, ' ')
        .replace(/\|/g, ' ')
        .replace(/\WV\W/g, ' VEE ')
        .replace(/^V\W/g, ' VEE ')
        .replace(/\WV$/g, ' VEE ')
      /* const voicAction = (p:number, pieces:string[]) => {
        this.morseVoice.speakPhrase(pieces[p], () => {
          // what gets called after speaking
          if ((p + 1) === pieces.length) {
            setTimeout(() => { this.speakVoiceBuffer() }, 250)
          } else {
            voicAction(p + 1, pieces)
          }
        }
        )
      }
      voicAction(0, finalPhraseToSpeak.split(' ')) */
      this.morseVoice.speakPhrase(finalPhraseToSpeak, () => {
      // what gets called after speaking
        setTimeout(() => { this.speakVoiceBuffer() }, 250)
      })
    }
  }

  getPhraseToSpeakFromBuffer = () => {
    let phraseToSpeak
    try {
      const joinedBuffer = this.morseVoice.voiceBuffer.map(m => m.txt).join(' ')
      phraseToSpeak = joinedBuffer
      phraseToSpeak = phraseToSpeak.replace(/\n/g, ' ').trim()
    } catch (e) {
      // this.logToFlaggedWords(`caught after wordify:${e}`)
    }

    // clear the buffer
    this.morseVoice.voiceBuffer = []

    return phraseToSpeak
  }

  doPause = (fullRewind, fromPauseButton, fromStopButton) => {
    console.log(`doPause called fullRewid:${fullRewind} fromPauseButton:${fromPauseButton} fromStopButton:${fromStopButton}`)
    if (fromStopButton) {
      if (this.doPlayTimeout) {
        clearTimeout(this.doPlayTimeout)
      }
    }

    if (fromPauseButton) {
      this.runningPlayMs(this.runningPlayMs() + (Date.now() - this.lastPartialPlayStart()))
      this.isPaused(!this.isPaused())
      this.announce(this.isPaused() ? 'Paused' : 'Playing')
    } else {
      this.isPaused(false)
    }
    this.playerPlaying(false)
    this.speedRacerToken++
    this.morseWordPlayer.pause(() => {
      // we're here if a complete rawtext finished
      this.lastFullPlayTime(Date.now())
      // TODO make this more generic for any future "plugins"
      if (this.rss.rssPlayCallback) {
        this.rss.rssPlayCallback(false)
      }

      this.preSpaceUsed(false)
      if (this.loop() && !fromStopButton && !fromPauseButton) {
        // as if user pressed play again
        // shuffle before we loop again
        if (!this.loopnoshuffle()) {
          this.shuffleWords(true)
        }
        this.doPlay(false, false)
      }
    }, true)
    if (fullRewind) {
      this.fullRewind()
    }
    if (fromStopButton) {
      this.maxRevealedTrail(-1)
      this.announce('Stopped')
    }

    if (this.cardSpaceTimerHandle) {
      clearTimeout(this.cardSpaceTimerHandle)
      this.cardSpaceTimerHandle = 0
    }
  }

  inputFileChange = (element) => {
    // thanks to https://newbedev.com/how-to-access-file-input-with-knockout-binding
    const file = element.files[0]
    const fr = new FileReader()
    fr.onload = (data) => {
      const result = data.target?.result
      if (typeof result !== 'string') {
        return
      }
      this.setText(result)
      // need to clear or else won't fire if use clears the text area
      // and then tries to reload the same again
      element.value = null
      // request to undo "apply" after file load
      this.lessons.selectedDisplay({})
    }
    fr.readAsText(file)
  }

  doDownload = async () => {
    let allWords = ''
    const words = this.words().map(w => w.displayWord.replace(/\n/g, ' '))
    words.forEach((word) => {
      allWords += allWords.length > 0 ? ' ' + word : word
    })

    const config = this.getMorseStringToWavBufferConfig(allWords)
    const wav = await this.morseWordPlayer.getWavAndSample(config)
    const ary = new Uint8Array(wav)
    const link = document.getElementById('downloadLink') as HTMLAnchorElement | null
    if (!link) {
      return
    }
    const blob = new Blob([ary], { type: 'audio/wav' })
    const objectUrl = URL.createObjectURL(blob)
    link.href = objectUrl
    link.download = 'morse.wav'
    link.dispatchEvent(new MouseEvent('click'))
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  }

  dummy = () => {
    console.log('dummy')
  }

  changeSoundMaker = (data, event) => {
    this.morseWordPlayer.setSoundMaker(data.smoothing())
  }

  timeEstimate = ko.computed(() => {
    // this computed doesn't seem bound to anything but .rawText, but for some reason it is
    // still recomputing on wpm/fwpm/xtra changes, so...ok
    if (!this.rawText()) {
      return { minutes: 0, seconds: 0, normedSeconds: '00' }
    }
    const config = this.getMorseStringToWavBufferConfig(this.words().map(w => w.displayWord).join(' '))
    const est = this.morseWordPlayer.getTimeEstimate(config)
    const minutes = Math.floor(est.timeCalcs.totalTime / 60000)
    const seconds = ((est.timeCalcs.totalTime % 60000) / 1000).toFixed(0)
    const normedSeconds = (parseInt(seconds) < 10 ? '0' : '') + seconds
    const timeFigures = { minutes, seconds, normedSeconds }
    return timeFigures
  }, this)

  playingTime = ko.computed(():PlayingTimeInfo => {
    const minutes = Math.floor(this.runningPlayMs() / 60000)
    const seconds = parseFloat(((this.runningPlayMs() % 60000) / 1000).toFixed(0))
    const timeFigures = new PlayingTimeInfo(minutes, seconds)
    return timeFigures
  }, this)

  doClear = () => {
    // stop playing
    this.doPause(true, false, false)
    this.setText('')
    this.announce('Text cleared')
  }

  doApply = (fromUserClick:boolean = false) => {
    if (this.lessons.ifCustomGroup()) {
      this.lessons.doCustomGroup()
    } else {
      // skip presets if user clicked, assume they wanted to change something
      this.lessons.setDisplaySelected(this.lessons.selectedDisplay(), fromUserClick)
    }
  }

  saveSettings = () => {
    MorseSettingsHandler.saveSettings(this)
  }

  settingsFileChange = (element) => {
    // thanks to https://newbedev.com/how-to-access-file-input-with-knockout-binding
    MorseSettingsHandler.settingsFileChange(element, this)
  }

  logoClick = () => {
    console.log('logo clicked')
    this.logoClickCount++
    if (this.logoClickCount % 4 === 0) {
      this.lessons.toggleQueryStringSettingsOn()
    }
  }

  toggleLoop = () => {
    if (!this.loop()) {
      this.loop(true)
      this.announce('Loop shuffle is on')
    } else if (this.loopnoshuffle()) {
      this.loop(false)
      this.loopnoshuffle(false)
    } else {
      this.loopnoshuffle(true)
    }
  }
}
