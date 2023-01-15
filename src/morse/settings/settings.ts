// import * as ko from 'knockout'
import { MorseViewModel } from '../morse'
import { FrequencySettings } from './frequencySettings'
import { MiscSettings } from './miscSettings'
import SpeedSettings from './speedSettings'

export class MorseSettings {
  speed: SpeedSettings
  misc: MiscSettings
  frequency: FrequencySettings
  vm: MorseViewModel

  constructor (vm:MorseViewModel) {
    this.vm = vm
    this.speed = new SpeedSettings(vm)
    this.misc = new MiscSettings()
    this.frequency = new FrequencySettings()
  }
}
