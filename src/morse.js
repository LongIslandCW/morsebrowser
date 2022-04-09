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

function vwModel () {
  const self = this

  ko.extenders.saveCookie = function (target, option) {
    target.subscribe(function (newValue) {
      // console.log(option + ": " + newValue);
      Cookies.set(option, newValue, { expires: 365 })
      // console.log(Cookies.get());
    })
    return target
  }

  ko.extenders.showingChange = function (target, option) {
    target.subscribe(function (newValue) {
      // console.log(option + ": " + newValue);
      if (self.showRaw()) {
        self.rawText(newValue)
      }
    })
    return target
  }
  ko.extenders.showRawChange = function (target, option) {
    target.subscribe(function (newValue) {
      // console.log(option + ": " + newValue);
      if (newValue) {
        self.showingText(self.rawText())
      } else {
        self.showingText('')
      }
    })
    return target
  }
  self.showingText = ko.observable('hello world').extend({ showingChange: 'showingChange' })
  self.rawText = ko.observable(self.showingText())
  self.textBuffer = ko.observable('')

  self.wpm = ko.observable(20).extend({ saveCookie: 'wpm' })
  self.fwpm = ko.observable(20).extend({ saveCookie: 'fwpm' })
  self.ditFrequency = ko.observable(550).extend({ saveCookie: 'ditFrequency' })
  self.dahFrequency = ko.observable(550).extend({ saveCookie: 'dahFrequency' })
  self.hideList = ko.observable(true).extend({ saveCookie: 'hideList' })
  self.showRaw = ko.observable(true).extend({ showRawChange: 'showRawChange' })
  self.currentSentanceIndex = ko.observable(0)
  self.currentIndex = ko.observable(0)
  self.rssFeedUrl = ko.observable('https://moxie.foxnews.com/feedburner/latest.xml').extend({ saveCookie: 'rssFeedUrl' })
  self.proxydUrl = ko.observable('http://127.0.0.1:8085/').extend({ saveCookie: 'proxydUrl' })
  self.rssPlayMins = ko.observable(5).extend({ saveCookie: 'rssPlayMins' })
  self.rssPollMins = ko.observable(5).extend({ saveCookie: 'rssPollMins' })
  self.rssTitlesQueue = ko.observableArray()
  self.rssPlayOn = ko.observable(false)
  self.playerPlaying = ko.observable(false)
  self.lastFullPlayTime = ko.observable(new Date(1900, 0, 0))
  self.lastRSSPoll = ko.observable(new Date(1900, 0, 0))
  self.rssPlayTimerHandle = null
  self.rssPollTimerHandle = null
  self.rssMinsToWait = ko.observable(-1)
  self.rssPollMinsToWait = ko.observable(-1)
  self.rssPollingOn = ko.observable(false)
  self.rssPolling = ko.observable(false)

  self.preSpace = ko.observable(0).extend({ saveCookie: 'preSpace' })
  self.preSpaceUsed = ko.observable(false)
  self.xtraWordSpaceDits = ko.observable(0).extend({ saveCookie: 'xtraWordSpaceDits' })
  self.flaggedWords = ko.observable('')
  self.isShuffled = ko.observable(false)
  self.trailReveal = ko.observable(false)
  self.preShuffled = ''
  self.wordLists = ko.observableArray()

  const cks = Cookies.get()
  if (cks) {
    for (const key in cks) {
      // console.log(key);
      self[key](cks[key])
    }
  }

  self.morseWordPlayer = new MorseWordPlayer()

  self.setText = function (s) {
    if (this.showRaw()) {
      self.showingText(s)
    } else {
      self.rawText(s)
    }
  }

  self.sentences = ko.computed(function () {
    return MorseStringUtils.getSentences(self.rawText())
  }, self)

  self.sentenceMax = ko.computed(function () {
    return self.sentences().length - 1
  })

  self.words = ko.computed(function () {
    return self.sentences()[self.currentSentanceIndex()]
  }, self)

  self.changeSentance = function () {
    self.currentIndex(0)
  }

  self.incrementIndex = function () {
    if (self.currentIndex() < self.words().length - 1) {
      self.currentIndex(self.currentIndex() + 1)
    } else {
      // move to next sentence
      if (self.currentSentanceIndex() < self.sentenceMax()) {
        self.currentSentanceIndex(Number(self.currentSentanceIndex()) + 1)
        self.currentIndex(0)
      }
    }
  }

  self.decrementIndex = function () {
    self.morseWordPlayer.pause(() => {
      if (self.currentIndex() > 0 && self.words().length > 1) {
        self.currentIndex(self.currentIndex() - 1)
        // experience shows it is good to put a little pause here
        // so they dont' blur together
        setTimeout(self.doPlay, 1000)
      }
    })
  }

  self.fullRewind = function () {
    // if (self.sentenceMax()>0) {
    self.currentSentanceIndex(0)
    self.currentIndex(0)
    // }
  }

  self.sentanceRewind = function () {
    // if (self.sentenceMax()>0) {
    // self.currentSentanceIndex(0);
    self.currentIndex(0)
    // }
  }

  self.doPlay = function (playJustEnded) {
    self.playerPlaying(true)
    if (!playJustEnded) {
      self.preSpaceUsed(false)
    }
    // experience shows it is good to put a little pause here when user forces us here,
    // e.g. hitting back or play b/c word was misunderstood,
    // so they dont' blur together.
    if (self.doPlayTimeOut) {
      clearTimeout(self.doPlayTimeOut)
    }
    self.doPlayTimeOut = setTimeout(() =>
      self.morseWordPlayer.pause(() => {
        const config = new MorseStringToWavBufferConfig()
        config.word = self.words()[self.currentIndex()]
        config.wpm = self.wpm()
        config.fwpm = self.fwpm()
        config.ditFrequency = self.ditFrequency()
        config.dahFrequency = self.dahFrequency()
        config.prePaddingMs = self.preSpaceUsed() ? 0 : self.preSpace() * 1000
        config.xtraWordSpaceDits = self.xtraWordSpaceDits()
        self.morseWordPlayer.play(config, self.playEnded)
        self.preSpaceUsed(true)
      })
    , playJustEnded ? 0 : 1000)
  }

  self.playEnded = function () {
    console.log('ended')
    if (self.currentIndex() < self.words().length - 1) {
      self.incrementIndex()
      self.doPlay(true)
    } else if (self.currentSentanceIndex() < self.sentenceMax()) {
      // move to next sentence

      self.currentSentanceIndex(Number(self.currentSentanceIndex()) + 1)
      self.currentIndex(0)
      self.doPlay(true)
    } else {
      self.doPause()
    }
  }

  self.doPause = function () {
    self.morseWordPlayer.pause(() => {
      // we're here if a complete rawtext finished
      self.playerPlaying(false)
      self.lastFullPlayTime(Date.now())
      self.rssPlayCallback()

      self.preSpaceUsed(false)
    })
  }

  self.inputFileChange = function (file) {
    // thanks to https://newbedev.com/how-to-access-file-input-with-knockout-binding
    const fr = new FileReader()
    fr.onload = function (data) {
      self.setText(data.target.result)
    }
    fr.readAsText(file)
  }

  self.unreadRssCount = ko.computed(function () {
    const unread = self.rssTitlesQueue().filter(x => !x.played)
    // console.log("unread:");
    // console.log(unread);
    return !unread ? 0 : unread.length
  }, self)

  self.playRssButtonText = ko.computed(function () {
    const minsToWait = self.rssMinsToWait()
    let waitingText = ''
    if (minsToWait > 0 && self.rssPlayOn()) {
      waitingText = ' Waiting '
      if (minsToWait > 1) {
        waitingText += Math.round(minsToWait).toString() + ' min'
      } else {
        waitingText += Math.round(60 * minsToWait).toString() + ' sec'
      }
    }
    return (self.rssPlayOn() ? 'Stop' : 'Play') + ' RSS (' + self.unreadRssCount() + ')' + waitingText
  })

  self.pollRssButtonText = ko.computed(function () {
    const minsToWait = self.rssPollMinsToWait()
    let waitingText = ''
    if (minsToWait > 0 && self.rssPollingOn()) {
      waitingText = ' Waiting '
      if (minsToWait > 1) {
        waitingText += Math.round(minsToWait).toString() + ' min'
      } else {
        waitingText += Math.round(60 * minsToWait).toString() + ' sec'
      }
    }
    return (self.rssPollingOn() ? 'Polling' : 'Poll') + ' RSS' + waitingText
  })

  self.rssPlayCallback = function (ignoreWait) {
    if (self.rssPlayOn()) {
      const msSince = Date.now() - self.lastFullPlayTime()
      const minSince = msSince / 1000 / 60
      const enoughWait = (minSince > self.rssPlayMins())
      if (!self.playerPlaying()) {
        if (enoughWait || ignoreWait) {
          self.rssMinsToWait(-1)
          if (self.unreadRssCount() > 0) {
            const target = self.rssTitlesQueue().find(x => !x.played)
            const replacement = { title: target.title, played: true }
            self.rssTitlesQueue.replace(target, replacement)

            self.setText(target.title)
            self.fullRewind()
            self.doPlay()
          }
        } else {
          self.rssMinsToWait(self.rssPlayMins() - minSince)
        }
      }
      self.rssPlayTimerHandle = setTimeout(self.rssPlayCallback, 20 * 1000)
    }
  }

  self.doRSSReset = function () {
    self.rssTitlesQueue(self.rssTitlesQueue().map(x => {
      x.played = true
      return x
    }))
  }

  self.doRssPlay = function () {
    self.rssPlayOn(!self.rssPlayOn())
    if (self.rssPlayOn()) {
      self.rssPlayCallback(true)
    } else {
      if (self.rssPlayTimerHandle) {
        clearTimeout(self.rssPlayTimerHandle)
      }
    }
  }

  self.doRSSCallback = function () {
    if (self.rssPollingOn() && !self.rssPolling()) {
      const msSince = Date.now() - self.lastRSSPoll()
      const minSince = msSince / 1000 / 60
      const enoughWait = (minSince > self.rssPollMins())
      if (enoughWait) {
        self.rssPolling(true)
        self.rssPollMinsToWait(-1)
        // https://github.com/rbren/rss-parser
        // this helped resolve polyfill problems:
        // https://blog.alchemy.com/blog/how-to-polyfill-node-core-modules-in-webpack-5

        // note that the rss-parser module is loaded dynamically, so only if the
        // user actually goes ahead and uses RSS.
        import('rss-parser').then(({ default: RSSParser }) => {
          const parser = new RSSParser()
          // Note: some RSS feeds can't be loaded in the browser due to CORS security.
          // To get around this, you can use a proxy.

          parser.parseURL(self.proxydUrl() + self.rssFeedUrl().toString(), function (err, feed) {
            if (err) {
              self.lastRSSPoll(Date.now())
              alert('rss error')
              self.rssPolling(false)
              throw err
            }
            // console.log(feed.title);

            // note the reversal to get a fifo
            feed.items.reverse().forEach(function (entry) {
              // console.log(entry.title + ':' + entry.link);
              if (!self.rssTitlesQueue().find(x => x.title === entry.title)) {
                self.rssTitlesQueue.push({ title: entry.title, played: false })
              }
            })
            self.lastRSSPoll(Date.now())
            self.rssPollMinsToWait(self.rssPollMins())
            self.rssPolling(false)
          })
        })
      } else {
        self.rssPollMinsToWait(self.rssPollMins() - minSince)
      }
    }

    if (self.rssPollingOn()) {
      self.rssPollTimerHandle = setTimeout(self.doRSSCallback, 15 * 1000)
    } else {
      if (self.rssPollTimerHandle) {
        clearTimeout(self.rssPollTimerHandle)
      }
    }
  }

  self.doRSS = function () {
    self.rssPollingOn(!self.rssPollingOn())
    if (self.rssPollingOn()) {
      self.doRSSCallback()
    } else {
      if (self.rssPollTimerHandle) {
        clearTimeout(self.rssPollTimerHandle)
      }
    }
  }

  self.addFlaggedWord = function (word) {
    // eslint-disable-next-line no-useless-escape
    self.flaggedWords(self.flaggedWords() + ' ' + word.replace(/[\.\,\?]/g, ''))
  }

  self.setFlagged = function () {
    self.setText(self.flaggedWords())
    self.fullRewind()
  }

  self.shuffleWords = function () {
    if (!self.isShuffled()) {
      self.preShuffled = self.rawText()
      self.setText(self.rawText().split(' ').sort(function () { return 0.5 - Math.random() }).join(' '))
    } else {
      self.setText(self.preShuffled)
    }
    self.isShuffled(!self.isShuffled())
  }

  self.initializeWordList = function () {
    fetch('wordfilesconfigs/wordlists.json')
      .then(function (response) {
        return response.json()
      })
      .then(function (data) {
        self.wordLists(data.fileOptions)
        console.log(self.wordLists())
      })
      .catch(function (err) {
        console.log('error: ' + err)
      })
  }

  self.randomWordList = function (data) {
    let str = ''
    const chars = data.letters.split('')

    // Function to generate random number min/max inclusive
    // https://www.geeksforgeeks.org/how-to-generate-random-number-in-given-range-using-javascript/
    function randomNumber (min, max) {
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

    self.setText(str)
  }

  self.getWordList = function (filename) {
    const isText = filename.endsWith('txt')
    fetch('wordfiles/' + filename)
      .then(function (response) {
        if (isText) {
          return response.text()
        } else {
          // assume json
          return response.json()
        }
      })
      .then(function (data) {
        if (isText) {
          self.setText(data)
        } else {
          self.randomWordList(data)
        }
      })
      .catch(function (err) {
        console.log('error: ' + err)
      })
  }

  self.initializeWordList()
}

// eslint-disable-next-line new-cap
ko.applyBindings(new vwModel())
