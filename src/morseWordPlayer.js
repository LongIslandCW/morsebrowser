import MorseWavBufferPlayer from './morseWavBufferPlayer.js'
import { MorseStringToWavBuffer } from './morseStringToWavBuffer.js'
export class MorseWordPlayer {
    myBufferPlayer;
    constructor () {
      this.myBufferPlayer = new MorseWavBufferPlayer()
    }

    play (config, onEnded) {
      const wav = MorseStringToWavBuffer.createWav(config)
      this.myBufferPlayer.play(wav, onEnded)
    }

    pause (pauseCallBack) {
      this.myBufferPlayer.forceStop(pauseCallBack)
    }
}
