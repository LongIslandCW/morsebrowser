// import * as ko from 'knockout'
import { FrequencySettings } from './frequencySettings'
import { MiscSettings } from './miscSettings'
import SpeedSettings from './speedSettings'

export class MorseSettings {
  speed: SpeedSettings
  misc: MiscSettings
  frequency: FrequencySettings

  constructor () {
    this.speed = new SpeedSettings()
    this.misc = new MiscSettings()
    this.frequency = new FrequencySettings()
  }
}
