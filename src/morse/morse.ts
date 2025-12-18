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
import { clear, log } from 'console'
import ScreenWakeLock from './utils/screenWakeLock'
import { shuffleWordsLogic } from './utils/morseViewModel/shuffleWordsHelper'

export class MorseViewModel {
  accessibilityAnnouncement:ko.Observable<string> = ko.observable(undefined)
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
  rawText:ko.Observable<string> = ko.observable()
  showingText:ko.Observable<string> = ko.observable('')
  showRaw:ko.Observable<boolean> = ko.observable(true)
  volume:ko.Observable<number> = ko.observable()
  noiseHidden:ko.Observable<boolean> = ko.observable(true)
  noiseEnabled:ko.Observable<boolean> = ko.observable(false)
  noiseVolume:ko.Observable<number> = ko.observable(2)
  noiseType:ko.Observable<string> = ko.observable('off')
  lastPlayFullStart = null
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
  allShortcutKeys:ko.ObservableArray
  applyEnabled:ko.Computed<boolean>
  numberOfRepeats:ko.Observable<number> = ko.observable(0)
  testTonePlaying:boolean = false
  testToneCount:number = 0
  testToneFlagHandle:any = 0
  screenWakeLock:ScreenWakeLock
  logoClickCount:number =0
  cachedShuffle:boolean = false
  shuffleIntraGroup:ko.Observable<boolean> = ko.observable(false)
  adminMode:ko.Observable<boolean> = ko.observable(false)

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

    // check for admin mode turned on 
    if (GeneralUtils.getParameterByName('adminMode')) {
      console.log('admin mode enabled')
      this.adminMode(true)
    }

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

    // initialize the wordlist
    this.lessons.initializeWordList()

    this.flaggedWords = new FlaggedWords()

    // check for voice feature turned on
    if (GeneralUtils.getParameterByName('voiceEnabled')) {
      this.morseVoice.voiceEnabled(true)
    }

    // check for voicebuffermax
    if (GeneralUtils.getParameterByName('voiceBufferMax')) {
      this.morseVoice.voiceBufferMaxLength(parseInt(GeneralUtils.getParameterByName('voiceBufferMax')))
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
    this.allShortcutKeys = ko.observableArray([])
    this.shortcutKeys = new MorseShortcutKeys((key, title) => {
      this.allShortcutKeys.push({ key, title })
    })
    this.shortcutKeys.registerKeyboardShortcutHandlers(this)

    this.showRaw(false)

    this.applyEnabled = ko.computed(() => {
      if (this.lessons && this.lessons.customGroup()) {
        return true
      }
      return this.lessons.selectedDisplay().display && !this.lessons.selectedDisplay().isDummy
    }, this)

    this.screenWakeLock = new ScreenWakeLock()
  }
  // END CONSTRUCTOR

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
    const result = shuffleWordsLogic({
      words: this.words(),
      rawText: this.rawText() ?? '',
      wasShuffled: this.isShuffled(),
      fromLoopRestart,
      newlineChunking: this.settings.misc.newlineChunking(),
      shuffleIntraGroup: this.shuffleIntraGroup ? this.shuffleIntraGroup() : false,
      preShuffled: this.preShuffled
    })

    this.preShuffled = result.preShuffled
    if (result.lastShuffled !== undefined) {
      this.lastShuffled = result.lastShuffled
    }
    this.setText(result.newText)
    this.isShuffled(result.isShuffled)
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
      document.getElementById('btnFlaggedWordsAccordianButton').click()
    }
  }

  clearFlagged = () => {
    if (this.flaggedWords.flaggedWords().trim()) {
      this.flaggedWords.clear()
      document.getElementById('btnFlaggedWordsAccordianButton').click()
    }
  }

  getMorseStringToWavBufferConfig = (text, isToneTest:boolean = false) => {
    const config = new SoundMakerConfig()
    config.word = MorseStringUtils.doReplacements(text)
    const speeds = this.settings.speed.getApplicableSpeed(this.playingTime())
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
    if (this.morseVoice && !this.morseVoice.manualVoice() && this.ifMaxVoiceBufferReached()) {
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
    const freshStart = fromPlayButton && !wasPlayerPlaying
    if (!this.lastPlayFullStart || (this.lastFullPlayTime() > this.lastPlayFullStart)) {
      this.lastPlayFullStart = Date.now()
    }
    this.isPaused(false)
    this.playerPlaying(true)
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
        const repeats = parseInt(this.numberOfRepeats() as any) === 0 ? 0 : parseInt(this.numberOfRepeats() as any) + 1
        const config = this.getMorseStringToWavBufferConfig(
          this.cardBufferManager.getNextMorse(
            repeats,
            parseInt(this.morseVoice.speakFirstAdditionalWordspaces() as any)
          )
        )
        this.addToVoiceBuffer()
        const playerCmd = () => {
          if (!this.morseVoice.speakFirst() || this.playerPlaying()) {
            this.morseWordPlayer.play(config, (fromVoiceOrTrail) => {
              this.charsPlayed(this.charsPlayed() + config.word.replace(' ', '').length)
              this.playEnded(fromVoiceOrTrail)
            })
          }
        }

        if (!this.morseVoice.speakFirst() ||
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
    const needToSpeak = this.morseVoice.voiceEnabled() &&
      !fromVoiceOrTrail &&
      !this.cardBufferManager.hasMoreMorse() &&
      maxBufferReached &&
      !this.morseVoice.speakFirst()

    const needToTrail = this.trailReveal() && !fromVoiceOrTrail
    const speakAndTrail = needToSpeak && needToTrail

    const noDelays = !needToSpeak && !needToTrail

    const advanceTrail = () => {
      // note we eliminate the trail delays if speaking
      if (this.trailReveal()) {
        setTimeout(() => {
          this.maxRevealedTrail(this.maxRevealedTrail() + 1)
          setTimeout(() => {
            // if speak is in the driver's seat it will call this,
            // if not then trail will
            if (!speakAndTrail) {
              this.playEnded(true)
            }
          }, speakAndTrail ? 0 : this.trailPostDelay() * 1000)
        }
        , speakAndTrail ? 0 : this.trailPreDelay() * 1000)
      }
    }

    const finalizeTrail = (finalCallback) => {
      if (this.trailReveal()) {
        setTimeout(() => {
          this.maxRevealedTrail(-1)
          finalCallback()
        }
        , this.trailFinal() * 1000)
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
        const finalToDo = () => this.doPause(true, false, false)
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

      const speakCondition = !this.morseVoice.manualVoice() &&
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

        setTimeout(() => {
          const finalPhraseToSpeak = this.prepPhraseToSpeakForFinal(phraseToSpeak)
          this.morseVoice.speakPhrase(finalPhraseToSpeak, () => {
            // what gets called after speaking

            if (needToTrail) {
              advanceTrail()
            }
            this.playEnded(true)
          })
        }, this.morseVoice.voiceThinkingTime() * 1000)
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
      const phrase = this.morseVoice.voiceBuffer.shift().txt
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
    } else {
      this.isPaused(false)
    }
    this.playerPlaying(false)
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
        this.doPlay(false, true)
      }
    }, true)
    if (fullRewind) {
      this.fullRewind()
    }
    if (fromStopButton) {
      this.maxRevealedTrail(-1)
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
      this.setText(data.target.result as string)
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
    const link = document.getElementById('downloadLink')
    const blob = new Blob([ary], { type: 'audio/wav' });
    (link as any).href = URL.createObjectURL(blob);
    (link as any).download = 'morse.wav'
    link.dispatchEvent(new MouseEvent('click'))
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
  }

  doApply = (fromUserClick:boolean = false) => {
    if (this.lessons.customGroup()) {
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
    this.logoClickCount++;
    if (this.logoClickCount % 4 === 0) {
      this.lessons.toggleQueryStringSettingsOn()    
    }
  }

  toggleLoop = () => {
    if (!this.loop()) {
      this.loop(true)
    } else if (this.loopnoshuffle()) {
      this.loop(false)
      this.loopnoshuffle(false)
    } else {
      this.loopnoshuffle(true)
    }
  }
}
