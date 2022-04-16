import ko from 'knockout'

// see https://getbootstrap.com/docs/5.0/getting-started/webpack/
import 'bootstrap/dist/css/bootstrap.min.css'
// You can specify which plugins you need
// Note that even though these don't seem to be used directly,
// they are used by the accordian.
// eslint-disable-next-line no-unused-vars
import { Tooltip, Toast, Popover } from 'bootstrap'

import MorseStringUtils from './morseStringUtils.js'
import { MorseStringToWavBufferConfig } from './morseStringToWavBuffer.js'
import { MorseWordPlayer } from './morseWordPlayer.js'
import licwlogo from './assets/CW-Club-logo-clear400-300x300.png'
// import favico from './assets/LongIslandCWClub-favicon-2.jpg'

// NOTE: moved this to dynamic import() so that non-RSS users don't need to bother
// even loading this code into the browser:
// import RSSParser from 'rss-parser';

import Cookies from 'js-cookie'
import MorseLessonPlugin from './morseLessonPlugin.js'

const licwlogoImg = document.getElementById('logo')
licwlogoImg.src = licwlogo
// const favaciImg = document.getElementById('favico')
// favaciImg.src = favico

class MorseViewModel {
  constructor () {
    // create the helper extenders
    ko.extenders.saveCookie = (target, option) => {
      target.subscribe((newValue) => {
        Cookies.set(option, newValue, { expires: 365 })
      })
      return target
    }

    ko.extenders.showingChange = (target, option) => {
      target.subscribe((newValue) => {
        if (this.showRaw()) {
          this.rawText(newValue)
        }
      })
      return target
    }
    ko.extenders.showRawChange = (target, option) => {
      target.subscribe((newValue) => {
        // console.log(option + ": " + newValue);
        if (newValue) {
          this.showingText(this.rawText())
        } else {
          this.showingText('')
        }
      })
      return target
    }

    ko.extenders.setVolume = (target, option) => {
      target.subscribe((newValue) => {
        this.morseWordPlayer.setVolume(newValue)
      })
      return target
    }

    ko.extenders.setNoiseVolume = (target, option) => {
      target.subscribe((newValue) => {
        this.morseWordPlayer.setNoiseVolume(newValue)
      })
      return target
    }

    ko.extenders.setNoiseType = (target, option) => {
      target.subscribe((newValue) => {
        const config = this.getMorseStringToWavBufferConfig('')
        config.noise.type = this.noiseEnabled() ? newValue : 'off'
        this.morseWordPlayer.setNoiseType(config)
      })
      return target
    }

    // apply extenders
    this.wpm.extend({ saveCookie: 'wpm' })
    this.fwpm.extend({ saveCookie: 'fwpm' })
    this.ditFrequency.extend({ saveCookie: 'ditFrequency' })
    this.dahFrequency.extend({ saveCookie: 'dahFrequency' })
    this.hideList.extend({ saveCookie: 'hideList' })
    this.showingText.extend({ showingChange: 'showingChange' })
    this.showRaw.extend({ showRawChange: 'showRawChange' })
    this.preSpace.extend({ saveCookie: 'preSpace' })
    this.xtraWordSpaceDits.extend({ saveCookie: 'xtraWordSpaceDits' })
    this.volume.extend({ saveCookie: 'volume' }).extend({ setVolume: 'volume' })
    this.noiseVolume.extend({ saveCookie: 'noiseVolume' }).extend({ setNoiseVolume: 'noiseVolume' })
    this.noiseType.extend({ saveCookie: 'noiseType' }).extend({ setNoiseType: 'noiseType' })

    // initialize the main rawText
    this.rawText(this.showingText())

    MorseLessonPlugin.addLessonFeatures(ko, this)

    // check for RSS feature turned on
    if (this.getParameterByName('rssEnabled')) {
      import('./morseRssPlugin.js').then(({ default: MorseRssPlugin }) => {
        MorseRssPlugin.addRssFeatures(ko, this)
        // don't set this until the plugin has initialized above
        this.rssEnabled(true)
        // possibly rss-related cookies missed
        // TODO probably in general 'plugins' should be some sort of promise based
        // and load cookies after all plugins but for now just do this....
        this.loadCookies()
      })
    }

    // check for noise feature turned on
    if (this.getParameterByName('noiseEnabled')) {
      this.noiseEnabled(true)
    }

    this.loadCookies()

    // initialize the wordlist
    this.initializeWordList()
  }

   wpm = ko.observable(20)
   textBuffer = ko.observable('')
   fwpm = ko.observable(20)
   ditFrequency = ko.observable(550)
   dahFrequency = ko.observable(550)
   hideList = ko.observable(true)
   currentSentanceIndex = ko.observable(0)
   currentIndex = ko.observable(0)
   playerPlaying = ko.observable(false)
   lastFullPlayTime = ko.observable(new Date(1900, 0, 0))
   preSpace = ko.observable(0)
   preSpaceUsed = ko.observable(false)
   xtraWordSpaceDits = ko.observable(0)
   flaggedWords = ko.observable('')
   isShuffled = ko.observable(false)
   trailReveal = ko.observable(false)
   preShuffled = ''
   wordLists = ko.observableArray()
   morseWordPlayer = new MorseWordPlayer()
   rawText = ko.observable()
   showingText = ko.observable('hello world')
   showRaw = ko.observable(true)
   rssEnabled = ko.observable(false)
   volume = ko.observable(10)
   noiseEnabled = ko.observable(false)
   noiseVolume = ko.observable(2)
   noiseType = ko.observable('off')
   userTarget = ko.observable('')
   selectedClass = ko.observable('')
   userTargetInitialized = false
   selectedClassInitialized = false
   letterGroupInitialized = false
   displaysInitialized = false
   letterGroup = ko.observable('')
   selectedDisplay = ko.observable({})
   lastPlayFullStart = null;
   randomizeLessons = ko.observable(true)

   // helper
   loadCookies = () => {
     // load any existing cookie values
     const cks = Cookies.get()
     if (cks) {
       for (const key in cks) {
         if (typeof this[key] !== 'undefined') {
           this[key](cks[key])
         }
       }
     }
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

   setText = (s) => {
     if (this.showRaw()) {
       this.showingText(s)
     } else {
       this.rawText(s)
     }
   }

   sentences = ko.computed(() => {
     return this.rawText() ? MorseStringUtils.getSentences(this.rawText()) : []
   }, this)

   sentenceMax = ko.computed(() => {
     return this.sentences().length - 1
   }, this)

   words = ko.computed(() => {
     return this.sentences()[this.currentSentanceIndex()]
   }, this)

   shuffleWords = () => {
     if (!this.isShuffled()) {
       this.preShuffled = this.rawText()
       this.setText(this.rawText().split(' ').sort(() => { return 0.5 - Math.random() }).join(' '))
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
    })
  }

  fullRewind = () => {
    // if (this.sentenceMax()>0) {
    this.currentSentanceIndex(0)
    this.currentIndex(0)
    // }
  }

  sentanceRewind = () => {
    // if (this.sentenceMax()>0) {
    // self.currentSentanceIndex(0);
    this.currentIndex(0)
    // }
  }

  addFlaggedWord = (word) => {
    // eslint-disable-next-line no-useless-escape
    this.flaggedWords(this.flaggedWords() + ' ' + word.replace(/[\.\,\?]/g, ''))
  }

  setFlagged = () => {
    this.setText(this.flaggedWords())
    this.fullRewind()
  }

  randomWordList = (data) => {
    let str = ''
    const chars = data.letters.split('')
    let seconds = 0
    // Fn to generate random number min/max inclusive
    // https://www.geeksforgeeks.org/how-to-generate-random-number-in-given-range-using-javascript/
    const randomNumber = (min, max) => {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    do {
      let word = ''

      if (this.randomizeLessons()) {
        // determine word length
        const wordLength = data.minWordSize === data.maxWordSize ? data.minWordSize : randomNumber(data.minWordSize, data.maxWordSize)

        for (let j = 1; j <= wordLength; j++) { // for each letter
          // determine the letter
          word += chars[randomNumber(1, chars.length) - 1]
        }
      } else {
        word = data.letters
      }

      str += seconds > 0 ? (' ' + word) : word

      const config = this.getMorseStringToWavBufferConfig(str)
      const est = this.morseWordPlayer.getTimeEstimate(config)
      seconds = est.timeCalcs.totalTime / 1000
    } while (seconds < data.practiceSeconds)

    this.setText(str)
  }

  getMorseStringToWavBufferConfig = (text) => {
    const config = new MorseStringToWavBufferConfig()
    config.word = text
    config.wpm = this.wpm()
    config.fwpm = this.fwpm()
    config.ditFrequency = this.ditFrequency()
    config.dahFrequency = this.dahFrequency()
    config.prePaddingMs = this.preSpaceUsed() ? 0 : this.preSpace() * 1000
    config.xtraWordSpaceDits = this.xtraWordSpaceDits()
    config.volume = this.volume()
    config.noise = {
      type: this.noiseEnabled() ? this.noiseType() : 'off',
      volume: this.noiseVolume()
    }
    config.playerPlaying = this.playerPlaying()
    return config
  }

  doPlay = (playJustEnded) => {
    if (!this.lastPlayFullStart || (this.lastFullPlayTime() > this.lastPlayFullStart)) {
      this.lastPlayFullStart = Date.now()
      console.log('setplaystart')
    }
    this.playerPlaying(true)
    if (!playJustEnded) {
      this.preSpaceUsed(false)
    }
    // experience shows it is good to put a little pause here when user forces us here,
    // e.g. hitting back or play b/c word was misunderstood,
    // so they dont' blur together.
    if (this.doPlayTimeOut) {
      clearTimeout(this.doPlayTimeOut)
    }
    this.doPlayTimeOut = setTimeout(() => this.morseWordPlayer.pause(() => {
      const config = this.getMorseStringToWavBufferConfig(this.words()[this.currentIndex()])
      this.morseWordPlayer.play(config, this.playEnded)
      this.preSpaceUsed(true)
    }),
    playJustEnded ? 0 : 1000)
  }

  playEnded = () => {
    if (this.currentIndex() < this.words().length - 1) {
      this.incrementIndex()
      this.doPlay(true)
    } else if (this.currentSentanceIndex() < this.sentenceMax()) {
      // move to next sentence
      this.currentSentanceIndex(Number(this.currentSentanceIndex()) + 1)
      this.currentIndex(0)
      this.doPlay(true)
    } else {
      // nothing more to play
      this.doPause()
    }
  }

  doPause = () => {
    this.playerPlaying(false)
    this.morseWordPlayer.pause(() => {
      // we're here if a complete rawtext finished
      console.log('settinglastfullplaytime')
      this.lastFullPlayTime(Date.now())
      console.log(`playtime:${this.lastFullPlayTime() - this.lastPlayFullStart}`)
      // TODO make this more generic for any future "plugins"
      if (this.rssPlayCallback) {
        this.rssPlayCallback()
      }

      this.preSpaceUsed(false)
    }, true)
  }

  inputFileChange = (file) => {
    // thanks to https://newbedev.com/how-to-access-file-input-with-knockout-binding
    const fr = new FileReader()
    fr.onload = (data) => {
      this.setText(data.target.result)
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
    const link = document.getElementById('downloadLink')
    const blob = new Blob([ary], { type: 'audio/wav' })
    link.href = URL.createObjectURL(blob)
    link.download = 'morse.wav'
    link.dispatchEvent(new MouseEvent('click'))
  }

  dummy = () => {
    console.log('dummy')
  }

  timeEstimate = ko.computed(() => {
    // this computed doesn't seem bound to anything but .rawText, but for some reason it is
    // still recomputing on wpm/fwpm/xtra changes, so...ok
    if (!this.rawText()) {
      return 0
    }
    const config = this.getMorseStringToWavBufferConfig(this.rawText())
    const est = this.morseWordPlayer.getTimeEstimate(config)
    const minutes = Math.floor(est.timeCalcs.totalTime / 60000)
    const seconds = ((est.timeCalcs.totalTime % 60000) / 1000).toFixed(0)
    const normedSeconds = (seconds < 10 ? '0' : '') + seconds
    const timeFigures = { minutes, seconds, normedSeconds }
    console.log(timeFigures)
    console.log(est)
    return timeFigures
  }, this)
}

// eslint-disable-next-line new-cap
ko.applyBindings(new MorseViewModel())
