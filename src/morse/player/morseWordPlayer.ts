import { ISoundMaker } from './soundmakers/ISoundMaker'
import MorseWavBufferPlayer from './soundmakers/WavBufferPlayer/morseWavBufferPlayer'
import SmoothedSoundsPlayer from './soundmakers/SmoothedSounds/SmoothedSoundsPlayer'
import { SoundMakerConfig } from './soundmakers/SoundMakerConfig'
import { MorseStringToWavBuffer } from './wav/morseStringToWavBuffer'
import { CreatedWav } from './wav/CreatedWav'

export class MorseWordPlayer {
  soundMaker:ISoundMaker
  setSoundMaker = (smoothing:boolean) => {
    if (smoothing) {
      this.soundMaker = new SmoothedSoundsPlayer()
    } else {
      this.soundMaker = new MorseWavBufferPlayer()
    }
  }

  setVolume = (volume) => {
    this.soundMaker.setVolume(volume / 10)
  }

  setNoiseVolume = (volume) => {
    this.soundMaker.setNoiseVolume(volume / 10)
  }

  setNoiseType = (config:SoundMakerConfig) => {
    config.noise.scaledNoiseVolume = config.noise.volume / 10
    this.soundMaker.handleNoiseSettings(config)
  }

  play = (config:SoundMakerConfig, onEnded) => {
    this.soundMaker.play(config, onEnded)
  }

  pause = (pauseCallBack, killNoise) => {
    this.soundMaker.forceStop(pauseCallBack, killNoise)
  }

  getWavAndSample = (config:SoundMakerConfig):Promise<number[]> => {
    return this.soundMaker.getWav(config)
  }

  getTimeEstimate = (config:SoundMakerConfig) => {
    return MorseStringToWavBuffer.estimatePlayTime(config)
  }
}
