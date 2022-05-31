import ko from 'knockout'
import MorseStringUtils from './morseStringUtils.js'
import { SoundMakerConfig } from './player/soundmakers/SoundMakerConfig'
import { MorseWordPlayer } from './player/morseWordPlayer'

// NOTE: moved this to dynamic import() so that non-RSS users don't need to bother
// even loading this code into the browser:
// import RSSParser from 'rss-parser';

import MorseLessonPlugin from './lessons/morseLessonPlugin'
import { MorseLoadImages } from './images/morseLoadImages'
import { MorseShortcutKeys } from './shortcutKeys/morseShortcutKeys'
import { MorseExtenders } from './morseExtenders.js'
import { MorseCookies } from './cookies/morseCookies'
import { MorseSettings } from './settings/settings'
import { MorseVoice } from './voice/MorseVoice'
import { FlaggedWords } from './flaggedWords/flaggedWords'
import { NoiseConfig } from './player/soundmakers/NoiseConfig'
export class MorseViewModel {
  textBuffer:ko.Observable<string> = ko.observable('')
  hideList:ko.Observable<boolean> = ko.observable(true)
  currentSentanceIndex:ko.Observable<number> = ko.observable(0)
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
  rssEnabled:ko.Observable<boolean> = ko.observable(false)
  rssInitializedOnce:ko.Observable<boolean> = ko.observable(false)
  volume:ko.Observable<number> = ko.observable()
  noiseEnabled:ko.Observable<boolean> = ko.observable(false)
  noiseVolume:ko.Observable<number> = ko.observable(2)
  noiseType:ko.Observable<string> = ko.observable('off')
  lastPlayFullStart = null
  ifParseSentences:ko.Observable<boolean> = ko.observable(false)
  runningPlayMs:ko.Observable<number> = ko.observable(0)
  lastPartialPlayStart = ko.observable()
  isPaused:ko.Observable<boolean> = ko.observable(false)
  morseLoadImages = ko.observable()
  showExpertSettings:ko.Observable<boolean> = ko.observable(false)
  cardFontPx = ko.observable()
  loop:ko.Observable<boolean> = ko.observable(false)
  morseVoice:MorseVoice
  shortCutKeys:MorseShortcutKeys
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
  settings:MorseSettings
  lessons:MorseLessonPlugin
  flaggedWords:FlaggedWords
  voiceBuffer:string[]
  doPlayTimeout:any
  rssPlayCallback: any
  rssCookieWhiteList: any

  // END KO observables declarations
  constructor () {
    // initialize the images/icons
    this.morseLoadImages(new MorseLoadImages())

    // create the helper extenders
    MorseExtenders.init(ko, this)

    // create settings (note do this after extenders)
    this.settings = new MorseSettings()
    // apply extenders
    MorseExtenders.apply(this)

    // initialize the main rawText
    this.rawText(this.showingText())

    this.lessons = new MorseLessonPlugin(this.settings, (s) => { this.setText(s) }, (str) => {
      const config = this.getMorseStringToWavBufferConfig(str)
      const est = this.morseWordPlayer.getTimeEstimate(config)
      return est
    })

    // check for RSS feature turned on
    if (this.getParameterByName('rssEnabled')) {
      this.rssEnabled(true)
      this.initializeRss(null)
    }

    // check for noise feature turned on
    if (this.getParameterByName('noiseEnabled')) {
      this.noiseEnabled(true)
    }

    // seems to need to happen early
    // this.morseWordPlayer = new MorseWordPlayer(new MorseWavBufferPlayer())
    this.morseWordPlayer = new MorseWordPlayer()
    this.morseWordPlayer.setSoundMaker(this.smoothing())

    // load defaults
    MorseCookies.loadCookiesOrDefaults(this, null, true)

    // load cookies
    MorseCookies.loadCookiesOrDefaults(this, null, false)

    // initialize the wordlist
    this.lessons.initializeWordList()

    // voice
    this.morseVoice = new MorseVoice()

    this.shortCutKeys = new MorseShortcutKeys(this.settings)

    this.flaggedWords = new FlaggedWords()

    // are we on the dev site?
    this.isDev(window.location.href.toLowerCase().indexOf('/dev/') > -1)
  }
  // END CONSTRUCTOR

  // helper
  // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  getParameterByName = (name, url = window.location.href) => {
    // eslint-disable-next-line no-useless-escape
    name = name.replace(/[\[\]]/g, '\\$&')
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
    const results = regex.exec(url)
    if (!results) return null
    if (!results[2]) return ''
    return decodeURIComponent(results[2].replace(/\+/g, ' '))
  }

  changeSentance = () => {
    this.currentIndex(0)
  }

  setText = (s) => {
    if (this.showRaw()) {
      this.showingText(s)
    } else {
      this.rawText(s)
    }
  }

  sentences = ko.computed(() => {
    if (!this.rawText()) {
      return []
    }

    return MorseStringUtils.getSentences(this.rawText(), !this.ifParseSentences(), this.settings.misc.newlineChunking())
  }, this)

  sentenceMax = ko.computed(() => {
    return this.sentences().length - 1
  }, this)

  words = ko.computed(() => {
    return this.sentences()[this.currentSentanceIndex()]
  }, this)

  shuffleWords = () => {
    if (!this.isShuffled()) {
      const hasPhrases = this.rawText().indexOf('\n') !== -1
      this.preShuffled = this.rawText()
      this.setText(this.rawText().split(hasPhrases ? '\n' : ' ').sort(() => { return 0.5 - Math.random() }).join(hasPhrases ? '\n' : ' '))
    } else {
      this.setText(this.preShuffled)
    }
    this.isShuffled(!this.isShuffled())
  }

  incrementIndex = () => {
    if (this.currentIndex() < this.words().length - 1) {
      this.currentIndex(this.currentIndex() + 1)
    } else {
      // move to next sentence
      if (this.currentSentanceIndex() < this.sentenceMax()) {
        this.currentSentanceIndex(Number(this.currentSentanceIndex()) + 1)
        this.currentIndex(0)
      }
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
    this.currentSentanceIndex(0)
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

  getMorseStringToWavBufferConfig = (text) => {
    const config = new SoundMakerConfig()
    config.word = MorseStringUtils.doReplacements(text)
    config.wpm = parseInt(this.settings.speed.wpm() as any)
    config.fwpm = parseInt(this.settings.speed.fwpm() as any)
    config.ditFrequency = parseInt(this.settings.frequency.ditFrequency() as any)
    config.dahFrequency = parseInt(this.settings.frequency.dahFrequency() as any)
    config.prePaddingMs = this.preSpaceUsed() ? 0 : this.preSpace() * 1000
    config.xtraWordSpaceDits = parseInt(this.xtraWordSpaceDits() as any)
    config.volume = parseInt(this.volume() as any)
    config.noise = new NoiseConfig()
    config.noise.type = this.noiseEnabled() ? this.noiseType() : 'off'
    config.noise.volume = parseInt(this.noiseVolume() as any)
    config.playerPlaying = this.playerPlaying()
    config.riseTimeConstant = parseFloat(this.riseTimeConstant() as any)
    config.decayTimeConstant = parseFloat(this.decayTimeConstant() as any)
    config.riseMsOffset = parseFloat(this.riseMsOffset() as any)
    config.decayMsOffset = parseFloat(this.decayMsOffset() as any)
    return config
  }

  doPlay = (playJustEnded, fromPlayButton) => {
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
      this.voiceBuffer = []
    }
    // experience shows it is good to put a little pause here when user forces us here,
    // e.g. hitting back or play b/c word was misunderstood,
    // so they dont' blur together.
    if (this.doPlayTimeout) {
      clearTimeout(this.doPlayTimeout)
    }
    this.doPlayTimeout = setTimeout(() => this.morseWordPlayer.pause(() => {
      // help trailing reveal, max should always be one behind before we're about to play
      this.maxRevealedTrail(this.currentIndex() - 1)
      const config = this.getMorseStringToWavBufferConfig(this.words()[this.currentIndex()])
      this.morseWordPlayer.play(config, this.playEnded)
      this.lastPartialPlayStart(Date.now())
      this.preSpaceUsed(true)
    }, false),
    playJustEnded || fromPlayButton ? 0 : 1000)
  }

  playEnded = (fromVoiceOrTrail) => {
    // voice or trail have timers that might call this after user has hit stop
    // specifically they have built in pauses for "thinking time" during which the user
    // might have hit stop
    if (fromVoiceOrTrail && !this.playerPlaying()) {
      return
    }

    // where are we in the words to process?
    const isNotLastWord = this.currentIndex() < this.words().length - 1
    const isNotLastSentence = this.currentSentanceIndex() < this.sentenceMax()
    const anyNewLines = this.rawText().indexOf('\n') !== -1
    const needToSpeak = this.morseVoice.voiceEnabled() && !fromVoiceOrTrail
    const needToTrail = this.trailReveal() && !fromVoiceOrTrail
    const noDelays = !needToSpeak && !needToTrail
    const advanceTrail = () => {
      if (this.trailReveal()) {
        setTimeout(() => {
          this.maxRevealedTrail(this.maxRevealedTrail() + 1)
          setTimeout(() => {
            this.playEnded(true)
          }, this.trailPostDelay() * 1000)
        }
        , this.trailPreDelay() * 1000)
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
      if (isNotLastWord) {
        this.incrementIndex()
        this.doPlay(true, false)
      } else if (isNotLastSentence) {
      // move to next sentence
        this.currentSentanceIndex(Number(this.currentSentanceIndex()) + 1)
        this.currentIndex(0)
        this.doPlay(true, false)
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
      const currentWord = this.words()[this.currentIndex()]
      const hasNewline = currentWord.indexOf('\n') !== -1
      this.morseVoice.voiceBuffer.push(currentWord)
      if (hasNewline || !isNotLastWord || !anyNewLines) {
        const phraseToSpeak = MorseStringUtils.wordifyPunctuation(this.morseVoice.voiceBuffer.join(' '))
        // clear the buffer
        this.morseVoice.voiceBuffer = []
        setTimeout(() => {
          this.morseVoice.speakPhrase(phraseToSpeak, () => { this.playEnded(true) })
        }, this.morseVoice.voiceThinkingTime() * 1000)
      } else {
        this.playEnded(true)
      }
    }

    if (needToTrail) {
      advanceTrail()
    }
  }

  doPause = (fullRewind, fromPauseButton, fromStopButton) => {
    if (fromPauseButton) {
      this.runningPlayMs(this.runningPlayMs() + (Date.now() - this.lastPartialPlayStart()))
      this.isPaused(!this.isPaused())
    } else {
      this.isPaused(false)
    }
    this.playerPlaying(false)
    this.morseWordPlayer.pause(() => {
      // we're here if a complete rawtext finished
      // console.log('settinglastfullplaytime')
      this.lastFullPlayTime(Date.now())
      // console.log(`playtime:${this.lastFullPlayTime() - this.lastPlayFullStart}`)
      // TODO make this more generic for any future "plugins"
      if (this.rssPlayCallback) {
        this.rssPlayCallback()
      }

      this.preSpaceUsed(false)
      if (this.loop() && !fromStopButton && !fromPauseButton) {
        // as if user pressed play again
        this.doPlay(false, true)
      }
    }, true)
    if (fullRewind) {
      this.fullRewind()
    }
  }

  inputFileChange = (element) => {
    // thanks to https://newbedev.com/how-to-access-file-input-with-knockout-binding
    // console.log(file)
    const file = element.files[0]
    console.log(element.value)
    const fr = new FileReader()
    fr.onload = (data) => {
      this.setText(data.target.result)
      // need to clear or else won't fire if use clears the text area
      // and then tries to reload the same again
      element.value = null
    }
    fr.readAsText(file)
  }

  doDownload = () => {
    let allWords = ''
    const sentences = this.sentences()
    sentences.forEach((sentence) => {
      sentence.forEach((word) => {
        allWords += allWords.length > 0 ? ' ' + word : word
      })
    })
    const config = this.getMorseStringToWavBufferConfig(allWords)
    const wav = this.morseWordPlayer.getWavAndSample(config)
    const ary = new Uint8Array(wav.wav)
    const link:any = document.getElementById('downloadLink')
    const blob = new Blob([ary], { type: 'audio/wav' })
    link.href = URL.createObjectURL(blob)
    link.download = 'morse.wav'
    link.dispatchEvent(new MouseEvent('click'))
  }

  dummy = () => {
    console.log('dummy')
  }

  changeSoundMaker = (data, event) => {
    // console.log(data.smoothing())
    // console.log(event)
    this.morseWordPlayer.setSoundMaker(data.smoothing())
  }

  timeEstimate = ko.computed(() => {
    // this computed doesn't seem bound to anything but .rawText, but for some reason it is
    // still recomputing on wpm/fwpm/xtra changes, so...ok
    if (!this.rawText()) {
      return { minutes: 0, seconds: 0, normedSeconds: '00' }
    }
    const config = this.getMorseStringToWavBufferConfig(this.rawText())
    const est = this.morseWordPlayer.getTimeEstimate(config)
    const minutes = Math.floor(est.timeCalcs.totalTime / 60000)
    const seconds = ((est.timeCalcs.totalTime % 60000) / 1000).toFixed(0)
    const normedSeconds = (parseInt(seconds) < 10 ? '0' : '') + seconds
    const timeFigures = { minutes, seconds, normedSeconds }
    // console.log(timeFigures)
    // console.log(est)
    return timeFigures
  }, this)

  playingTime = ko.computed(() => {
    const minutes = Math.floor(this.runningPlayMs() / 60000)
    const seconds = ((this.runningPlayMs() % 60000) / 1000).toFixed(0)
    const normedSeconds = (parseInt(seconds) < 10 ? '0' : '') + seconds
    const timeFigures = { minutes, seconds, normedSeconds }
    // console.log(timeFigures)
    // console.log(est)
    return timeFigures
  }, this)

  initializeRss = (afterCallBack) => {
    if (!this.rssInitializedOnce()) {
      import('./morseRssPlugin.js').then(({ default: MorseRssPlugin }) => {
        MorseRssPlugin.addRssFeatures(ko, this)
        // don't set this until the plugin has initialized above
        this.rssInitializedOnce(true)
        // possibly rss-related cookies missed
        // TODO probably in general 'plugins' should be some sort of promise based
        // and load cookies after all plugins but for now just do this....
        MorseCookies.loadCookiesOrDefaults(this, this.rssCookieWhiteList, false)
        if (afterCallBack) {
          afterCallBack()
        }
      })
    }
  }

  doClear = () => {
    // stop playing
    this.doPause(true, false, false)
    this.setText('')
  }
}
