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
  get frequency ():number { return this.ditFrequency }
}
