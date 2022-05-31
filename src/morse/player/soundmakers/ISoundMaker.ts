import { SoundMakerConfig } from './SoundMakerConfig'

export interface ISoundMaker {
  setVolume: (volume:number) => void
  setNoiseVolume: (volume:number) => void
  forceStop:(pauseCallback:any, killNoise:boolean) => void
  handleNoiseSettings:(config:SoundMakerConfig) => void
  play:(config:SoundMakerConfig, onEnded:any) => void
  getWav:(config:SoundMakerConfig) => Promise<number[]>

}
