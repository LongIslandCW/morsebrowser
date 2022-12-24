import { NoiseConfig } from './NoiseConfig'

export class SoundMakerConfig {
  word:string
  wpm:number
  fwpm:number
  ditFrequency:number
  dahFrequency:number
  prePaddingMs:number
  xtraWordSpaceDits:number
  volume:number
  noise:NoiseConfig
  playerPlaying:boolean
  riseTimeConstant:number
  decayTimeConstant:number
  riseMsOffset:number
  decayMsOffset:number
  offline:boolean = false
  trimLastWordSpace:boolean = false
  morseDisabled:boolean = false
  voiceEnabled:boolean = false
  isToneTest:boolean = false
  testToneDuration:number = 10000
  get frequency ():number { return this.ditFrequency }
}
