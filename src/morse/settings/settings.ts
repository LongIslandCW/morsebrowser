// import * as ko from 'knockout'
import { MiscSettings } from './miscSettings'
import { SpeedSettings } from './speedSettings'

export class MorseSettings {
  speed: SpeedSettings
  misc: MiscSettings

  constructor () {
    this.speed = new SpeedSettings()
    this.misc = new MiscSettings()
  }
}
