import { MorseSettings } from '../settings/settings'

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
    if (handler != undefined) {
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
}
