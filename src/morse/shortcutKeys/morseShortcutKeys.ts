import { MorseViewModel } from '../morse'

class ShortcutHandler {
  key: string
  title:string
  handler:VoidFunction

  constructor (key:string, title:string, handler:VoidFunction) {
    this.key = key
    this.title = title
    this.handler = handler
  }
}

export class MorseShortcutKeys {
  registeredHandlers:Array<ShortcutHandler>
  registrationCallback:(key:string, title:string) => void

  /**
   * Instantiates a new MorseShortcutKeys instance
   *
   * @param registrationCallback A callback that is called whenever a new shortcut key is registered.
   */
  constructor (registrationCallback:(key:string, title:string) => void) {
    this.registrationCallback = registrationCallback
    this.registeredHandlers = []

    // add the shortcut key listener
    document.addEventListener('keypress', (e) => {
      const tagName = (<any>e.target).tagName
      if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') {
        this.routeShortcutKey(e.key)
        e.preventDefault()
      }
    })
  }

  routeShortcutKey = (key:string) => {
    // console.log('routing shortcut key')
    const handler:ShortcutHandler = this.registeredHandlers[key]
    if (handler !== undefined) {
      handler.handler()
    }
  }

  /**
   * Registers a shortcut key, which when pressed will call the provided handler
   *
   * @param key The shortcut key, such as 'z'
   * @param title A brief description of the shortcut's function
   * @param handler The handler to be called in response to pressing the shortcut key
   */
  registerShortcutKeyHandler = (key:string, title:string, handler:VoidFunction) => {
    const shortcutHandler = new ShortcutHandler(key, title, handler)
    this.registeredHandlers[key] = shortcutHandler
    this.registrationCallback(key, title)
  }

  // Any object that has access to the ShortcutKeys object can register
  // its own shortcuts, but for now we register them all centrally, which
  // makes providing accessibility announcements in response to shortcuts
  // a bit easier.
  registerKeyboardShortcutHandlers = (mv:MorseViewModel) => {
    // Toggle play/pause
    this.registerShortcutKeyHandler('p', 'Play / Toggle pause', () => {
      mv.togglePlayback()
    })

    // stop
    this.registerShortcutKeyHandler('s', 'Stop playback and rewind', () => {
      mv.doPause(true, false, true)
    })

    // Back 1
    this.registerShortcutKeyHandler(',', 'Back 1', () => {
      mv.decrementIndex()
    })

    // Full rewind
    this.registerShortcutKeyHandler('<', 'Full rewind', () => {
      mv.fullRewind()
    })

    // Forward 1
    this.registerShortcutKeyHandler('.', 'Forward 1', () => {
      mv.incrementIndex()
    })

    // Flag card
    this.registerShortcutKeyHandler('f', 'Flag current card', () => {
      const index = mv.currentIndex()
      const word = mv.words()[index]
      mv.flaggedWords.addFlaggedWord(word)
      mv.accessibilityAnnouncement('Flagged')
    })

    // Toggle reveal cards
    this.registerShortcutKeyHandler('c', 'Toggle card visibility', () => {
      mv.hideList(!mv.hideList())
      mv.accessibilityAnnouncement(mv.hideList() ? 'Cards hidden' : 'Cards revealed')
    })

    // Toggle shuffle
    this.registerShortcutKeyHandler('/', 'Toggle shuffle', () => {
      mv.shuffleWords(false)
      mv.accessibilityAnnouncement(mv.isShuffled() ? 'Shuffled' : 'Unshuffled')
    })

    // Toggle loop
    this.registerShortcutKeyHandler('l', 'Toggle looping', () => {
      mv.loop(!mv.loop())
      mv.accessibilityAnnouncement(mv.loop() ? 'Looping' : 'Not looping')
    })

    const changeFarnsworth = (x) => {
      const newWpm = parseInt(mv.settings.speed.wpm() as any) + x
      const newFwpm = parseInt(mv.settings.speed.fwpm() as any) + x
      if (newWpm < 1 || newFwpm < 1) {
        return
      }

      if (mv.settings.speed.syncWpm()) {
        mv.settings.speed.wpm(newWpm)
        mv.accessibilityAnnouncement('' + mv.settings.speed.fwpm() + ' FWPM')
        return
      }

      if (newFwpm > mv.settings.speed.wpm()) {
        mv.settings.speed.wpm(newWpm)
      }
      mv.settings.speed.fwpm(newFwpm)
      mv.accessibilityAnnouncement('' + mv.settings.speed.fwpm() + ' FWPM')
    }

    // Reduce FWPM
    this.registerShortcutKeyHandler('z', 'Reduce Farnsworth WPM', () => {
      changeFarnsworth(-1)
    })

    // Increase FWPM
    this.registerShortcutKeyHandler('x', 'Increase Farnsworth WPM', () => {
      changeFarnsworth(1)
    })
  }
}
