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
  morseDisabled:ko.Observable<boolean> = ko.observable(false)
  settings:MorseSettings
  lessons:MorseLessonPlugin
  flaggedWords:FlaggedWords
  voiceBuffer:string[]
  doPlayTimeout:any
  rss:MorseRssPlugin
  lastShuffled:string = ''
  flaggedWordsLogCount:number = 0
  flaggedWordsLog:any[] = []

  // END KO observables declarations
  constructor () {
    // initialize the images/icons
    this.morseLoadImages(new MorseLoadImages())

    // create the helper extenders
    MorseExtenders.init(this)

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

    this.rss = new MorseRssPlugin(new RssConfig(this.setText, this.fullRewind, this.doPlay, this.lastFullPlayTime, this.playerPlaying))

    // check for RSS feature turned on
    if (this.getParameterByName('rssEnabled')) {
      this.rss.rssEnabled(true)
      // this.initializeRss(null)
    }

    // check for noise feature turned on
    if (this.getParameterByName('noiseEnabled')) {
      this.noiseEnabled(this.getParameterByName('noiseEnabled') === 'true')
    }

    // check for noise feature turned on
    if (this.getParameterByName('morseDisabled')) {
      this.morseDisabled(this.getParameterByName('morseDisabled') === 'true')
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

    this.flaggedWords = new FlaggedWords()

    // voice
    this.morseVoice = new MorseVoice(this)

    // check for voice feature turned on
    if (this.getParameterByName('voiceEnabled')) {
      this.morseVoice.voiceEnabled(true)
    }

    this.shortCutKeys = new MorseShortcutKeys(this.settings)

    // are we on the dev site?
    this.isDev(window.location.href.toLowerCase().indexOf('/dev/') > -1)

    // images
    ko.components.register('simpleimage', SimpleImageTemplate)
    ko.components.register('noiseaccordion', NoiseAccordion)
    ko.components.register('rssaccordion', RssAccordion)
    ko.components.register('flaggedwordsaccordion', FlaggedWordsAccordion)
  }
  // END CONSTRUCTOR

  logToFlaggedWords = (s) => {
    /* this.flaggedWordsLogCount++
    // const myPieces = this.flaggedWords.flaggedWords().split('\n')
    // console.log(myPieces)
    this.flaggedWordsLog[0] = { timeStamp: 0, msg: `LOGGED LINES:${this.flaggedWordsLogCount}` }
    const timeStamp = new Date()
    this.flaggedWordsLog[this.flaggedWordsLog.length] = { timeStamp, msg: `${s}` }
    const myPieces = this.flaggedWordsLog.map((e, i, a) => {
      return `${i < 2 ? e.timeStamp : e.timeStamp - a[i - 1].timeStamp}: ${e.msg}`
    })
    const out = myPieces.filter(s => s).join('\n')
    this.flaggedWords.flaggedWords(out) */
  }

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

  setText = (s:string) => {
    if (this.showRaw()) {
      this.showingText(s)
    } else {
      this.rawText(s)
    }
  }

  sentences:ko.Computed<string[][]> = ko.computed(() => {
    if (!this.rawText()) {
      return []
    }

    return MorseStringUtils.getSentences(this.rawText(), !this.ifParseSentences(), this.settings.misc.newlineChunking())
  }, this)

  sentenceMax:ko.Computed<number> = ko.computed(() => {
    return this.sentences().length - 1
  }, this)

  words:ko.Computed<string[]> = ko.computed(() => {
    return this.sentences()[this.currentSentanceIndex()]
  }, this)

  shuffleWords = (fromLoopRestart:boolean = false) => {
    // if it's not currently shuffled, or we're in a loop, re-shuffle
    if (!this.isShuffled() || fromLoopRestart) {
      const hasPhrases = this.rawText().indexOf('\n') !== -1 && this.settings.misc.newlineChunking()
      // if we're in a loop or otherwise already shuffled, we don't want to loose the preShuffled
      if (!this.isShuffled()) {
        this.preShuffled = this.rawText()
      }
      this.lastShuffled = this.rawText().split(hasPhrases ? '\n' : ' ').sort(() => { return 0.5 - Math.random() }).join(hasPhrases ? '\n' : ' ')
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
    if (this.morseVoice) {
      config.trimLastWordSpace = this.morseVoice.voiceEnabled()
      config.voiceEnabled = this.morseVoice.voiceEnabled()
    }
    config.morseDisabled = this.morseDisabled()

    return config
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
      this.voiceBuffer = []
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
        const config = this.getMorseStringToWavBufferConfig(this.words()[this.currentIndex()])
        this.morseWordPlayer.play(config, this.playEnded)
        this.lastPartialPlayStart(Date.now())
        this.preSpaceUsed(true)
        // pause wants killNoiseparater
      }, false)
    },
    // timeout parameters
    playJustEnded || fromPlayButton ? 0 : 1000)
  }

  playEnded = (fromVoiceOrTrail) => {
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

    // where are we in the words to process?
    const isNotLastWord = this.currentIndex() < this.words().length - 1
    const isNotLastSentence = this.currentSentanceIndex() < this.sentenceMax()
    const anyNewLines = this.rawText().indexOf('\n') !== -1
    const needToSpeak = this.morseVoice.voiceEnabled() && !fromVoiceOrTrail
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
      this.logToFlaggedWords(`currentWord:${currentWord}`)
      this.logToFlaggedWords(`hasNewline:${hasNewline} isNotLastWord: ${isNotLastWord} anyNewLines:${anyNewLines}`)
      const speakCondition = hasNewline || !isNotLastWord || !anyNewLines || !this.settings.misc.newlineChunking()
      this.logToFlaggedWords(`speakCondition:${speakCondition}`)
      if (speakCondition) {
        this.logToFlaggedWords(`about to wordify:'${this.morseVoice.voiceBuffer.join(' ')}'`)
        let phraseToSpeak
        try {
          phraseToSpeak = MorseStringUtils.wordifyPunctuation(this.morseVoice.voiceBuffer.join(' '))
          phraseToSpeak = phraseToSpeak.replace(/\n/g, ' ').trim()
        } catch (e) {
          this.logToFlaggedWords(`caught after wordify:${e}`)
        }
        this.logToFlaggedWords(`phraseToSpeak:'${phraseToSpeak}'`)
        // clear the buffer
        this.morseVoice.voiceBuffer = []
        this.logToFlaggedWords(`voiceThinkingTime:${this.morseVoice.voiceThinkingTime()}`)

        setTimeout(() => {
          this.logToFlaggedWords('aboutToSpeak...')
          this.morseVoice.speakPhrase(phraseToSpeak, () => {
            this.logToFlaggedWords('returned from speaking...')
            // what gets called after speaking
            this.logToFlaggedWords(`needToTrail:${needToTrail}`)
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
      if (this.rss.rssPlayCallback) {
        this.rss.rssPlayCallback(false)
      }

      this.preSpaceUsed(false)
      if (this.loop() && !fromStopButton && !fromPauseButton) {
        // as if user pressed play again
        // shuffle before we loop again
        this.shuffleWords(true)
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
    const sentences = this.sentences()
    sentences.forEach((sentence) => {
      sentence.forEach((word) => {
        allWords += allWords.length > 0 ? ' ' + word : word
      })
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

  doClear = () => {
    // stop playing
    this.doPause(true, false, false)
    this.setText('')
  }
}
