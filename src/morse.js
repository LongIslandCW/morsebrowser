import ko from 'knockout'

// see https://getbootstrap.com/docs/5.0/getting-started/webpack/
import 'bootstrap/dist/css/bootstrap.min.css'
// You can specify which plugins you need
// eslint-disable-next-line no-unused-vars
import { Tooltip, Toast, Popover } from 'bootstrap'

import MorseStringUtils from './morseStringUtils.js'
import { MorseStringToWavBufferConfig } from './morseStringToWavBuffer.js'
import { MorseWordPlayer } from './morseWordPlayer.js'

// NOTE: moved this to dynamic import() so that non-RSS users don't need to bother
// even loading this code into the browser:
// import RSSParser from 'rss-parser';

import Cookies from 'js-cookie'

class MorseViewModel {
  constructor () {
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

    this.wpm.extend({ saveCookie: 'wpm' })
    this.fwpm.extend({ saveCookie: 'fwpm' })
    this.ditFrequency.extend({ saveCookie: 'ditFrequency' })
    this.dahFrequency.extend({ saveCookie: 'dahFrequency' })
    this.hideList.extend({ saveCookie: 'hideList' })
    this.rssFeedUrl.extend({ saveCookie: 'rssFeedUrl' })
    this.proxydUrl.extend({ saveCookie: 'proxydUrl' })
    this.rssPlayMins.extend({ saveCookie: 'rssPlayMins' })
    this.rssPollMins.extend({ saveCookie: 'rssPollMins' })
    this.showingText.extend({ showingChange: 'showingChange' })
    this.showRaw.extend({ showRawChange: 'showRawChange' })
    this.preSpace.extend({ saveCookie: 'preSpace' })
    this.xtraWordSpaceDits.extend({ saveCookie: 'xtraWordSpaceDits' })

    this.rawText(this.showingText())

    // load any existing cookie values
    const cks = Cookies.get()
    if (cks) {
      for (const key in cks) {
        // console.log(key);
        this[key](cks[key])
      }
    }

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
   rssFeedUrl = ko.observable('https://moxie.foxnews.com/feedburner/latest.xml')
   proxydUrl = ko.observable('http://127.0.0.1:8085/')
   rssPlayMins = ko.observable(5)
   rssPollMins = ko.observable(5)
   rssTitlesQueue = ko.observableArray()
   rssPlayOn = ko.observable(false)
   playerPlaying = ko.observable(false)
   lastFullPlayTime = ko.observable(new Date(1900, 0, 0))
   lastRSSPoll = ko.observable(new Date(1900, 0, 0))
   rssPlayTimerHandle = null
   rssPollTimerHandle = null
   rssMinsToWait = ko.observable(-1)
   rssPollMinsToWait = ko.observable(-1)
   rssPollingOn = ko.observable(false)
   rssPolling = ko.observable(false)
   preSpace = ko.observable(0).extend({ saveCookie: 'preSpace' })
   preSpaceUsed = ko.observable(false)
   xtraWordSpaceDits = ko.observable(0).extend({ saveCookie: 'xtraWordSpaceDits' })
   flaggedWords = ko.observable('')
   isShuffled = ko.observable(false)
   trailReveal = ko.observable(false)
   preShuffled = ''
   wordLists = ko.observableArray()
   morseWordPlayer = new MorseWordPlayer()
   rawText = ko.observable()
   showingText = ko.observable('hello world')
   showRaw = ko.observable(true)

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

  initializeWordList = () => {
    fetch('wordfilesconfigs/wordlists.json')
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        this.wordLists(data.fileOptions)
        console.log(this.wordLists())
      })
      .catch((err) => {
        console.log('error: ' + err)
      })
  }

  randomWordList = (data) => {
    let str = ''
    const chars = data.letters.split('')

    // Fn to generate random number min/max inclusive
    // https://www.geeksforgeeks.org/how-to-generate-random-number-in-given-range-using-javascript/
    const randomNumber = (min, max) => {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    for (let i = 1; i <= data.words; i++) { // for each word
      let word = ''
      // determine word length
      const wordLength = data.minWordSize === data.maxWordSize ? data.minWordSize : randomNumber(data.minWordSize, data.maxWordSize)

      for (let j = 1; j <= wordLength; j++) { // for each letter
        // determine the letter
        word += chars[randomNumber(1, chars.length) - 1]
      }

      str += i > 1 ? (' ' + word) : word
    }

    this.setText(str)
  }

  getWordList = (filename) => {
    const isText = filename.endsWith('txt')
    fetch('wordfiles/' + filename)
      .then((response) => {
        if (isText) {
          return response.text()
        } else {
          // assume json
          return response.json()
        }
      })
      .then((data) => {
        if (isText) {
          this.setText(data)
        } else {
          this.randomWordList(data)
        }
      })
      .catch((err) => {
        console.log('error: ' + err)
      })
  }

  doPlay = (playJustEnded) => {
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
      const config = new MorseStringToWavBufferConfig()
      config.word = this.words()[this.currentIndex()]
      config.wpm = this.wpm()
      config.fwpm = this.fwpm()
      config.ditFrequency = this.ditFrequency()
      config.dahFrequency = this.dahFrequency()
      config.prePaddingMs = this.preSpaceUsed() ? 0 : this.preSpace() * 1000
      config.xtraWordSpaceDits = this.xtraWordSpaceDits()
      this.morseWordPlayer.play(config, this.playEnded)
      this.preSpaceUsed(true)
    }),
    playJustEnded ? 0 : 1000)
  }

  playEnded = () => {
    console.log('ended')
    if (this.currentIndex() < this.words().length - 1) {
      this.incrementIndex()
      this.doPlay(true)
    } else if (this.currentSentanceIndex() < this.sentenceMax()) {
      // move to next sentence
      this.currentSentanceIndex(Number(this.currentSentanceIndex()) + 1)
      this.currentIndex(0)
      this.doPlay(true)
    } else {
      this.doPause()
    }
  }

  doPause = () => {
    this.morseWordPlayer.pause(() => {
      // we're here if a complete rawtext finished
      this.playerPlaying(false)
      this.lastFullPlayTime(Date.now())
      this.rssPlayCallback()

      this.preSpaceUsed(false)
    })
  }

  inputFileChange = (file) => {
    // thanks to https://newbedev.com/how-to-access-file-input-with-knockout-binding
    const fr = new FileReader()
    fr.onload = (data) => {
      this.setText(data.target.result)
    }
    fr.readAsText(file)
  }

  unreadRssCount = ko.computed(() => {
    const unread = this.rssTitlesQueue().filter(x => !x.played)
    // console.log("unread:");
    // console.log(unread);
    return !unread ? 0 : unread.length
  }, this)

  playRssButtonText = ko.computed(() => {
    const minsToWait = this.rssMinsToWait()
    let waitingText = ''
    if (minsToWait > 0 && this.rssPlayOn()) {
      waitingText = ' Waiting '
      if (minsToWait > 1) {
        waitingText += Math.round(minsToWait).toString() + ' min'
      } else {
        waitingText += Math.round(60 * minsToWait).toString() + ' sec'
      }
    }
    return (this.rssPlayOn() ? 'Stop' : 'Play') + ' RSS (' + this.unreadRssCount() + ')' + waitingText
  }, this)

  pollRssButtonText = ko.computed(() => {
    const minsToWait = this.rssPollMinsToWait()
    let waitingText = ''
    if (minsToWait > 0 && this.rssPollingOn()) {
      waitingText = ' Waiting '
      if (minsToWait > 1) {
        waitingText += Math.round(minsToWait).toString() + ' min'
      } else {
        waitingText += Math.round(60 * minsToWait).toString() + ' sec'
      }
    }
    return (this.rssPollingOn() ? 'Polling' : 'Poll') + ' RSS' + waitingText
  }, this)

  rssPlayCallback = (ignoreWait) => {
    if (this.rssPlayOn()) {
      const msSince = Date.now() - this.lastFullPlayTime()
      const minSince = msSince / 1000 / 60
      const enoughWait = (minSince > this.rssPlayMins())
      if (!this.playerPlaying()) {
        if (enoughWait || ignoreWait) {
          this.rssMinsToWait(-1)
          if (this.unreadRssCount() > 0) {
            const target = this.rssTitlesQueue().find(x => !x.played)
            const replacement = { title: target.title, played: true }
            this.rssTitlesQueue.replace(target, replacement)

            this.setText(target.title)
            this.fullRewind()
            this.doPlay()
          }
        } else {
          this.rssMinsToWait(this.rssPlayMins() - minSince)
        }
      }
      this.rssPlayTimerHandle = setTimeout(this.rssPlayCallback, 20 * 1000)
    }
  }

  doRSSReset = () => {
    this.rssTitlesQueue(this.rssTitlesQueue().map(x => {
      x.played = true
      return x
    }))
  }

  doRssPlay = () => {
    this.rssPlayOn(!this.rssPlayOn())
    if (this.rssPlayOn()) {
      this.rssPlayCallback(true)
    } else {
      if (this.rssPlayTimerHandle) {
        clearTimeout(this.rssPlayTimerHandle)
      }
    }
  }

  doRSSCallback = () => {
    if (this.rssPollingOn() && !this.rssPolling()) {
      const msSince = Date.now() - this.lastRSSPoll()
      const minSince = msSince / 1000 / 60
      const enoughWait = (minSince > this.rssPollMins())
      if (enoughWait) {
        this.rssPolling(true)
        this.rssPollMinsToWait(-1)
        // https://github.com/rbren/rss-parser
        // this helped resolve polyfill problems:
        // https://blog.alchemy.com/blog/how-to-polyfill-node-core-modules-in-webpack-5
        // note that the rss-parser module is loaded dynamically, so only if the
        // user actually goes ahead and uses RSS.
        import('rss-parser').then(({ default: RSSParser }) => {
          const parser = new RSSParser()
          // Note: some RSS feeds can't be loaded in the browser due to CORS security.
          // To get around this, you can use a proxy.
          parser.parseURL(this.proxydUrl() + this.rssFeedUrl().toString(), (err, feed) => {
            if (err) {
              this.lastRSSPoll(Date.now())
              alert('rss error')
              this.rssPolling(false)
              throw err
            }
            // console.log(feed.title);
            // note the reversal to get a fifo
            feed.items.reverse().forEach((entry) => {
              // console.log(entry.title + ':' + entry.link);
              if (!this.rssTitlesQueue().find(x => x.title === entry.title)) {
                this.rssTitlesQueue.push({ title: entry.title, played: false })
              }
            })
            this.lastRSSPoll(Date.now())
            this.rssPollMinsToWait(this.rssPollMins())
            this.rssPolling(false)
          })
        })
      } else {
        this.rssPollMinsToWait(this.rssPollMins() - minSince)
      }
    }

    if (this.rssPollingOn()) {
      this.rssPollTimerHandle = setTimeout(this.doRSSCallback, 15 * 1000)
    } else {
      if (this.rssPollTimerHandle) {
        clearTimeout(this.rssPollTimerHandle)
      }
    }
  }

  doRSS = () => {
    this.rssPollingOn(!this.rssPollingOn())
    if (this.rssPollingOn()) {
      this.doRSSCallback()
    } else {
      if (this.rssPollTimerHandle) {
        clearTimeout(this.rssPollTimerHandle)
      }
    }
  }
}

// eslint-disable-next-line new-cap
ko.applyBindings(new MorseViewModel())
