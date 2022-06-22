import Cookies from 'js-cookie'
import licwDefaults from '../../configs/licwdefaults.json'
import { GeneralUtils } from '../utils/general'
import { CookieInfo } from './CookieInfo'
import { ICookieHandler } from './ICookieHandler'

export class MorseCookies {
  static registeredHandlers:ICookieHandler[] = []
  static registerHandler = (handler:ICookieHandler) => {
    MorseCookies.registeredHandlers.push(handler)
  }

  static loadCookiesOrDefaults = (ctxt, whiteList, ifLoadSettings) => {
    // load any existing cookie values

    const cks = Cookies.get()
    const cksKeys = []
    for (const key in cks) {
      cksKeys.push(key)
    }

    // ignore setting for which there's a cookie
    const workAry = ifLoadSettings ? licwDefaults.startupSettings.filter((x) => cksKeys.indexOf(x.key) < 0) : cksKeys
    const keyResolver = ifLoadSettings ? (x) => x.key : (x) => x
    const valResolver = ifLoadSettings ? (x) => x.value : (x) => cks[x]
    const specialHandling: CookieInfo[] = []
    const xtraspecialHandling: CookieInfo[] = []
    const otherHandling: CookieInfo[] = []
    if (workAry) {
      workAry.forEach((setting) => {
        const key = keyResolver(setting)
        let val = valResolver(setting)

        if (!whiteList || whiteList.indexOf(key) > -1) {
          switch (key) {
            case 'syncWpm':
            case 'wpm':
            case 'fwpm':
            case 'syncFreq':
            case 'ditFrequency':
            case 'dahFrequency':
              xtraspecialHandling.push(<CookieInfo>{ key, val })
              break
            default:
              if (typeof ctxt[key] !== 'undefined') {
                if (key === 'xtraWordSpaceDits' && parseInt(val) === 0) {
                  // prior functionality may have this at 0 so make it 1
                  val = 1
                }
                ctxt[key](GeneralUtils.booleanize(val))
              } else {
                otherHandling.push(<CookieInfo>{ key, val })
              }
          }
        }
      })
      MorseCookies.registeredHandlers.forEach((handler) => {
        handler.handleCookies(xtraspecialHandling)
        handler.handleCookies(otherHandling)
      })
      specialHandling.forEach((x) => {
        console.log('in special handling')
        ctxt[x.key](x.val)
      })
    }
  }
}
