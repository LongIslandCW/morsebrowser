import MorseWavBufferPlayer from './morseWavBufferPlayer.js'
import { MorseStringToWavBuffer } from './morseStringToWavBuffer.js'
export class MorseWordPlayer {
    myBufferPlayer;
    constructor () {
      this.myBufferPlayer = new MorseWavBufferPlayer()
    }

    setVolume (volume) {
      this.myBufferPlayer.setVolume(volume / 10)
    }

    play (config, onEnded) {
      const wav = MorseStringToWavBuffer.createWav(config)
      this.myBufferPlayer.play(wav, config.volume / 10, onEnded)
    }

    pause (pauseCallBack) {
      this.myBufferPlayer.forceStop(pauseCallBack)
    }
}
