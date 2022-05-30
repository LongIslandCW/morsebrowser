import { ISoundMaker } from './soundmakers/ISoundMaker'
import MorseWavBufferPlayer from './soundmakers/morseWavBufferPlayer'
import SmoothedSoundsPlayer from './soundmakers/SmoothedSoundsPlayer'
import { SoundMakerConfig } from './soundmakers/SoundMakerConfig'
import { MorseStringToWavBuffer } from './wav/morseStringToWavBuffer'

export class MorseWordPlayer {
  soundMaker:ISoundMaker
  setSoundMaker (smoothing:boolean) {
    if (smoothing) {
      this.soundMaker = new SmoothedSoundsPlayer()
    } else {
      this.soundMaker = new MorseWavBufferPlayer()
    }
  }

  setVolume (volume) {
    this.soundMaker.setVolume(volume / 10)
  }

  setNoiseVolume (volume) {
    this.soundMaker.setNoiseVolume(volume / 10)
  }

  setNoiseType (config:SoundMakerConfig) {
    config.noise.scaledNoiseVolume = config.noise.volume / 10
    this.soundMaker.handleNoiseSettings(config)
  }

  play (config:SoundMakerConfig, onEnded) {
    this.soundMaker.play(config, onEnded)
  }

  pause (pauseCallBack, killNoise) {
    this.soundMaker.forceStop(pauseCallBack, killNoise)
  }

  getWavAndSample (config:SoundMakerConfig) {
    const wav = MorseStringToWavBuffer.createWav(config)
    return wav
  }

  getTimeEstimate (config:SoundMakerConfig) {
    return MorseStringToWavBuffer.estimatePlayTime(config)
  }
}
