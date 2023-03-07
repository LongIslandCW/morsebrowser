import { MorseViewModel } from '../morse'
import SavedSettingsInfo from './savedSettingsInfo'

export class SettingsChangeInfo {
  constructor (ctxt:MorseViewModel) {
    this.ctxt = ctxt
  }

  ctxt:MorseViewModel

  /* someday need to think through the contradictions */
  ifLoadSettings:boolean

  /* weather or not to ignore cookies */
  ignoreCookies:boolean = false

  /* settings to used. sort of conflicts with ifLoadSettings? */
  custom:SavedSettingsInfo[] = null

  /* don't change cookies, i.e. don't make this the user's preferred setting set */
  lockoutCookieChanges:boolean = false

  keyBlacklist:string[] = []

  isYourSettings:boolean = false

  afterSettingsChange:any = null
}
