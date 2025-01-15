import Cookies from 'js-cookie'
import licwDefaults from '../../configs/licwdefaults.json'
import { GeneralUtils } from '../utils/general'
import { CookieInfo } from './CookieInfo'
import { ICookieHandler } from './ICookieHandler'
import { SettingsChangeInfo } from '../settings/settingsChangeInfo'
import MorseSettingsHandler from '../settings/morseSettingsHandler'

export class MorseCookies {
  static registeredHandlers:ICookieHandler[] = []
  static registerHandler = (handler:ICookieHandler) => {
    MorseCookies.registeredHandlers.push(handler)
  }

  static loadCookiesOrDefaults = (settingsChangeInfo:SettingsChangeInfo) => {
    // load any existing cookie values
    const { lockoutCookieChanges, ctxt, custom, ignoreCookies, ifLoadSettings, keyBlacklist, afterSettingsChange } = settingsChangeInfo
    if (lockoutCookieChanges) {
      if (ctxt.allowSaveCookies() && settingsChangeInfo.isYourSettings) {
        // not currently locked out so save serialized settings
        // console.log('setting current serialized')
        ctxt.currentSerializedSettings = MorseSettingsHandler.getCurrentSerializedSettings(ctxt)
      }
      if (ctxt.lockoutSaveCookiesTimerHandle) {
        clearTimeout(ctxt.lockoutSaveCookiesTimerHandle)
      }
      ctxt.allowSaveCookies(false)
      ctxt.lockoutSaveCookiesTimerHandle = setTimeout(() => { ctxt.allowSaveCookies(true) }, 700)
    }
    const cks = Cookies.get()
    const cksKeys = []
    for (const key in cks) {
      cksKeys.push(key)
    }

    const settings = custom || licwDefaults.startupSettings
    const cookieFiltered = (ss) => {
      if (ignoreCookies) {
        return ss
      }
      // ignore setting for which there's a cookie
      return ss.filter((x) => cksKeys.indexOf(x.key) < 0)
    }

    const workAry = ifLoadSettings ? cookieFiltered(settings) : cksKeys
    const keyResolver = ifLoadSettings ? (x) => x.key : (x) => x
    const valResolver = ifLoadSettings ? (x) => x.value : (x) => cks[x]
    const specialHandling: CookieInfo[] = []
    const xtraspecialHandling: CookieInfo[] = []
    const otherHandling: CookieInfo[] = []
    if (workAry) {
      workAry.forEach((setting) => {
        const key = keyResolver(setting)
        if (!keyBlacklist.some(s => s === key)) {
          let val = valResolver(setting)
          switch (key) {
            case 'syncWpm':
            case 'wpm':
            case 'fwpm':
            case 'syncFreq':
            case 'ditFrequency':
            case 'dahFrequency':
              xtraspecialHandling.push(<CookieInfo>{ key, val })
              break
            case 'numberOfRepeats':
              ctxt[key](parseInt(val))
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
        // console.log(xtraspecialHandling)
        // console.log(otherHandling)
        handler.handleCookies(xtraspecialHandling)
        handler.handleCookies(otherHandling)
      })
      specialHandling.forEach((x) => {
        console.log('in special handling')
        ctxt[x.key](x.val)
      })
    }
    if (afterSettingsChange) {
      afterSettingsChange()
    }
  }
}
