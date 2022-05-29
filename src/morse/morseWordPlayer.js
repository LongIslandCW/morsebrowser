import MorseWavBufferPlayer from './morseWavBufferPlayer.js'
import { MorseStringToWavBuffer } from './morseStringToWavBuffer.js'

export class MorseWordPlayer {
  myBufferPlayer
  constructor () {
    this.myBufferPlayer = new MorseWavBufferPlayer()
  }

  setVolume (volume) {
    this.myBufferPlayer.setVolume(volume / 10)
  }

  setNoiseVolume (volume) {
    this.myBufferPlayer.setNoiseVolume(volume / 10)
  }

  setNoiseType (config) {
    config.noise.scaledNoiseVolume = config.noise.volume / 10
    this.myBufferPlayer.handleNoiseSettings(config)
  }

  play (config, onEnded) {
    const wavInfo = MorseStringToWavBuffer.createWav(config)
    config.noise.scaledNoiseVolume = config.noise.volume / 10
    this.myBufferPlayer.play(wavInfo, config.volume / 10, config, onEnded)
  }

  pause (pauseCallBack, killNoise) {
    this.myBufferPlayer.forceStop(pauseCallBack, killNoise)
  }

  getWavAndSample (config) {
    const wav = MorseStringToWavBuffer.createWav(config)
    return wav
  }

  getTimeEstimate (config) {
    return MorseStringToWavBuffer.estimatePlayTime(config)
  }
}
