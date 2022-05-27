export default class MorseRssPlugin {
  static addRssFeatures = (ko, ctxt) => {
    ctxt.rssFeedUrl = ko.observable('https://moxie.foxnews.com/feedburner/latest.xml').extend({ saveCookie: 'rssFeedUrl' })
    ctxt.proxydUrl = ko.observable('http://127.0.0.1:8085/').extend({ saveCookie: 'proxydUrl' })
    ctxt.rssPlayMins = ko.observable(5).extend({ saveCookie: 'rssPlayMins' })
    ctxt.rssPollMins = ko.observable(5).extend({ saveCookie: 'rssPollMins' })
    ctxt.rssCookieWhiteList = ['rssFeedUrl', 'proxydUrl', 'rssPlayMins', 'rssPollMins']
    ctxt.rssTitlesQueue = ko.observableArray()
    ctxt.rssPlayOn = ko.observable(false)
    ctxt.lastRSSPoll = ko.observable(new Date(1900, 0, 0))
    ctxt.rssPlayTimerHandle = null
    ctxt.rssPollTimerHandle = null
    ctxt.rssMinsToWait = ko.observable(-1)
    ctxt.rssPollMinsToWait = ko.observable(-1)
    ctxt.rssPollingOn = ko.observable(false)
    ctxt.rssPolling = ko.observable(false)
    ctxt.rssPlayWaitingBadgeText = ko.observable(true)

    ctxt.unreadRssCount = ko.computed(() => {
      const unread = ctxt.rssTitlesQueue().filter(x => !x.played)
      // console.log("unread:");
      // console.log(unread);
      return !unread ? 0 : unread.length
    }, ctxt)

    ctxt.playRssButtonText = ko.computed(() => {
      const minsToWait = ctxt.rssMinsToWait()
      let waitingText = ''
      if (minsToWait > 0 && ctxt.rssPlayOn()) {
        waitingText = ' Waiting '
        if (minsToWait > 1) {
          waitingText += Math.round(minsToWait).toString() + ' min'
        } else {
          waitingText += Math.round(60 * minsToWait).toString() + ' sec'
        }
      }
      // help the badge
      console.log(waitingText)
      ctxt.rssPlayWaitingBadgeText(waitingText)
      return (ctxt.rssPlayOn() ? 'Stop' : 'Play') + ' RSS (' + ctxt.unreadRssCount() + ')' + waitingText
    }, ctxt)

    ctxt.pollRssButtonText = ko.computed(() => {
      const minsToWait = ctxt.rssPollMinsToWait()
      let waitingText = ''
      if (minsToWait > 0 && ctxt.rssPollingOn()) {
        waitingText = ' Waiting '
        if (minsToWait > 1) {
          waitingText += Math.round(minsToWait).toString() + ' min'
        } else {
          waitingText += Math.round(60 * minsToWait).toString() + ' sec'
        }
      }
      return (ctxt.rssPollingOn() ? 'Polling' : 'Poll') + ' RSS' + waitingText
    }, ctxt)

    ctxt.rssPlayCallback = (ignoreWait) => {
      if (ctxt.rssPlayOn()) {
        const msSince = Date.now() - ctxt.lastFullPlayTime()
        const minSince = msSince / 1000 / 60
        const enoughWait = (minSince > ctxt.rssPlayMins())
        if (!ctxt.playerPlaying()) {
          if (enoughWait || ignoreWait) {
            ctxt.rssMinsToWait(-1)
            if (ctxt.unreadRssCount() > 0) {
              const target = ctxt.rssTitlesQueue().find(x => !x.played)
              const replacement = { title: target.title, played: true }
              ctxt.rssTitlesQueue.replace(target, replacement)

              ctxt.setText(target.title)
              ctxt.fullRewind()
              ctxt.doPlay()
            }
          } else {
            ctxt.rssMinsToWait(ctxt.rssPlayMins() - minSince)
          }
        }
        ctxt.rssPlayTimerHandle = setTimeout(ctxt.rssPlayCallback, 20 * 1000)
      }
    }

    ctxt.doRSSReset = () => {
      ctxt.rssTitlesQueue(ctxt.rssTitlesQueue().map(x => {
        x.played = true
        return x
      }))
    }

    ctxt.doRssPlay = () => {
      ctxt.rssPlayOn(!ctxt.rssPlayOn())
      if (ctxt.rssPlayOn()) {
        ctxt.rssPlayCallback(true)
      } else {
        if (ctxt.rssPlayTimerHandle) {
          clearTimeout(ctxt.rssPlayTimerHandle)
        }
      }
      document.getElementById('btnRssAccordionButton').click()
    }

    ctxt.doRSSCallback = () => {
      if (ctxt.rssPollingOn() && !ctxt.rssPolling()) {
        const msSince = Date.now() - ctxt.lastRSSPoll()
        const minSince = msSince / 1000 / 60
        const enoughWait = (minSince > ctxt.rssPollMins())
        if (enoughWait) {
          ctxt.rssPolling(true)
          ctxt.rssPollMinsToWait(-1)
          // https://github.com/rbren/rss-parser
          // ctxt helped resolve polyfill problems:
          // https://blog.alchemy.com/blog/how-to-polyfill-node-core-modules-in-webpack-5
          // note that the rss-parser module is loaded dynamically, so only if the
          // user actually goes ahead and uses RSS.
          import(/* webpackChunkName: "rss-parser" */ 'rss-parser').then(({ default: RSSParser }) => {
            const parser = new RSSParser()
            // Note: some RSS feeds can't be loaded in the browser due to CORS security.
            // To get around ctxt, you can use a proxy.
            parser.parseURL(ctxt.proxydUrl() + ctxt.rssFeedUrl().toString(), (err, feed) => {
              if (err) {
                ctxt.lastRSSPoll(Date.now())
                alert('rss error')
                ctxt.rssPolling(false)
                throw err
              }
              // console.log(feed.title);
              // note the reversal to get a fifo
              feed.items.reverse().forEach((entry) => {
                // console.log(entry.title + ':' + entry.link);
                if (!ctxt.rssTitlesQueue().find(x => x.title === entry.title)) {
                  ctxt.rssTitlesQueue.push({ title: entry.title, played: false })
                }
              })
              ctxt.lastRSSPoll(Date.now())
              ctxt.rssPollMinsToWait(ctxt.rssPollMins())
              ctxt.rssPolling(false)
            })
          })
        } else {
          ctxt.rssPollMinsToWait(ctxt.rssPollMins() - minSince)
        }
      }

      if (ctxt.rssPollingOn()) {
        ctxt.rssPollTimerHandle = setTimeout(ctxt.doRSSCallback, 15 * 1000)
      } else {
        if (ctxt.rssPollTimerHandle) {
          clearTimeout(ctxt.rssPollTimerHandle)
        }
      }
    }

    ctxt.doRSS = () => {
      ctxt.rssPollingOn(!ctxt.rssPollingOn())
      if (ctxt.rssPollingOn()) {
        ctxt.doRSSCallback()
      } else {
        if (ctxt.rssPollTimerHandle) {
          clearTimeout(ctxt.rssPollTimerHandle)
        }
      }
    }
  }
}
