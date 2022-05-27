import Cookies from 'js-cookie'
import licwDefaults from '../configs/licwdefaults.json'
export class MorseCookies {
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
    if (workAry) {
      const specialHandling = []
      workAry.forEach((setting) => {
        const key = keyResolver(setting)
        const val = valResolver(setting)

        if (!whiteList || whiteList.indexOf(key) > -1) {
          switch (key) {
            case 'syncWpm':
            case 'wpm':
            case 'fwpm':
            case 'syncFreq':
            case 'ditFrequency':
            case 'dahFrequency':
              specialHandling.push({ key, val: ctxt.booleanize(val) })
              break
            default:
              if (typeof ctxt[key] !== 'undefined') {
                ctxt[key](ctxt.booleanize(val))
              }
          }
        }
      })
      //
      let target = specialHandling.find(x => x.key === 'syncWpm')
      if (target) {
        ctxt[target.key](target.val)
      }
      target = specialHandling.find(x => x.key === 'syncFreq')
      if (target) {
        ctxt[target.key](target.val)
      }
      specialHandling.forEach((x) => {
        ctxt[x.key](x.val)
      })
    }
  }
}
