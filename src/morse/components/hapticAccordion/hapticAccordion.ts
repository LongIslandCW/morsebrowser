import { CookieInfo } from '../../cookies/CookieInfo'
import { ICookieHandler } from '../../cookies/ICookieHandler'
import { MorseCookies } from '../../cookies/morseCookies'
import { MorseViewModel } from '../../morse'
import { GeneralUtils } from '../../utils/general'
import imageTemplate from './hapticAccordion.html'
export class HapticAccordion implements ICookieHandler {
  vm:MorseViewModel
  constructor (params) {
    this.vm = params.root
    this.vm.hapticAccordion = this
    MorseCookies.registerHandler(this)
    // console.log(this.vm)
    // console.log(params)
  }

  get isAccordionOpen ():boolean {
    return GeneralUtils.booleanize(document.getElementById('btnHapticAccordianButton').getAttribute('aria-expanded'))
  }

  // cookie handling
  handleCookies = (cookies: Array<CookieInfo>) => {
    if (!cookies) {
      return
    }
    const target:CookieInfo = cookies.find(x => x.key === 'hapticAccordionOpen')
    if (target) {
      const desiredState = GeneralUtils.booleanize(target.val)
      if (desiredState !== this.isAccordionOpen) {
        const elem = document.getElementById('btnHapticAccordianButton')
        elem.click()
      }
    }
  }

  handleCookie = (cookie: string) => {}
}
// https://keepinguptodate.com/pages/2019/12/using-typescript-with-knockout/
export default { viewModel: HapticAccordion, template: imageTemplate }
