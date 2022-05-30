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
  get frequency ():number { return this.ditFrequency }
}
