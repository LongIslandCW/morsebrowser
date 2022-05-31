import * as ko from 'knockout'
import { CookieInfo } from '../cookies/CookieInfo'
import { ICookieHandler } from '../cookies/ICookieHandler'
import { MorseCookies } from '../cookies/morseCookies'
import { RssConfig } from './RssConfig'
import { RssTitle } from './RssTitle'
export default class MorseRssPlugin implements ICookieHandler {
  rssConfig:RssConfig
  rssFeedUrl:ko.Observable<string> = ko.observable('https://moxie.foxnews.com/feedburner/latest.xml').extend({ saveCookie: 'rssFeedUrl' } as ko.ObservableExtenderOptions<boolean>)
  proxydUrl:ko.Observable<string> = ko.observable('http://127.0.0.1:8085/').extend({ saveCookie: 'proxydUrl' } as ko.ObservableExtenderOptions<boolean>)
  rssPlayMins = ko.observable(5).extend({ saveCookie: 'rssPlayMins' } as ko.ObservableExtenderOptions<boolean>)
  rssPollMins = ko.observable(5).extend({ saveCookie: 'rssPollMins' } as ko.ObservableExtenderOptions<boolean>)
  rssCookieWhiteList = ['rssFeedUrl', 'proxydUrl', 'rssPlayMins', 'rssPollMins']
  rssTitlesQueue:ko.ObservableArray<RssTitle> = ko.observableArray()
  rssPlayOn:ko.Observable<boolean> = ko.observable(false)
  lastRSSPoll:ko.Observable<number> = ko.observable(new Date(1900, 0, 0).getMilliseconds())
  rssPlayTimerHandle = null
  rssPollTimerHandle = null
  rssMinsToWait:ko.Observable<number> = ko.observable(-1)
  rssPollMinsToWait:ko.Observable<number> = ko.observable(-1)
  rssPollingOn:ko.Observable<boolean> = ko.observable(false)
  rssPolling:ko.Observable<boolean> = ko.observable(false)
  rssPlayWaitingBadgeText:ko.Observable<string> = ko.observable('')
  rssEnabled:ko.Observable<boolean> = ko.observable(false)

  constructor (rssConfig:RssConfig) {
    MorseCookies.registerHandler(this)
    this.rssConfig = rssConfig
  }

  unreadRssCount:ko.Computed<number> = ko.computed(() => {
    const unread = this.rssTitlesQueue().filter(x => !x.played)
    // console.log("unread:");
    // console.log(unread);
    return !unread ? 0 : unread.length
  }, this)

  playRssButtonText:ko.Computed<string> = ko.computed(() => {
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
    // help the badge
    console.log(waitingText)
    this.rssPlayWaitingBadgeText(waitingText)
    return (this.rssPlayOn() ? 'Stop' : 'Play') + ' RSS (' + this.unreadRssCount() + ')' + waitingText
  }, this)

  pollRssButtonText:ko.Computed<string> = ko.computed(() => {
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

  rssPlayCallback = (ignoreWait:boolean) => {
    if (this.rssPlayOn()) {
      const msSince = Date.now() - this.rssConfig.lastFullPlayTime()
      const minSince = msSince / 1000 / 60
      const enoughWait = (minSince > this.rssPlayMins())
      if (!this.rssConfig.playerPlaying()) {
        if (enoughWait || ignoreWait) {
          this.rssMinsToWait(-1)
          if (this.unreadRssCount() > 0) {
            const target = this.rssTitlesQueue().find(x => !x.played)
            const replacement = new RssTitle(target.title, true)
            this.rssTitlesQueue.replace(target, replacement)

            this.rssConfig.setText(target.title)
            this.rssConfig.fullRewind()
            this.rssConfig.doPlay(false, false)
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
    document.getElementById('btnRssAccordionButton').click()
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
        import(/* webpackChunkName: "rss-parser" */ 'rss-parser').then(({ default: RSSParser }) => {
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
                this.rssTitlesQueue.push(new RssTitle(entry.title, false))
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

  // cookie handlers
  handleCookies = (cookies: Array<CookieInfo>) => {
    // 'rssFeedUrl', 'proxydUrl', 'rssPlayMins', 'rssPollMins'
    if (!cookies) {
      return
    }
    let target:CookieInfo = cookies.find(x => x.key === 'rssFeedUrl')
    if (target) {
      this.rssFeedUrl(target.val)
    }

    target = cookies.find(x => x.key === 'proxydUrl')
    if (target) {
      this.proxydUrl(target.val)
    }

    target = cookies.find(x => x.key === 'rssPlayMins')
    if (target) {
      this.rssPlayMins(parseInt(target.val))
    }

    target = cookies.find(x => x.key === 'rssPollMins')
    if (target) {
      this.rssPollMins(parseInt(target.val))
    }
  }

  handleCookie = (cookie: string) => {}
}
