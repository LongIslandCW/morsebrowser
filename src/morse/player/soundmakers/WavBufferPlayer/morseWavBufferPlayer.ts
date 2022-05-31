/* abstract away the playing of wav buffer in case browser issues come up, etc
can change the code here and other code won't be affected.
*/

import { MorseStringToWavBuffer } from '../../wav/morseStringToWavBuffer'
import { ISoundMaker } from '../ISoundMaker'
import { SoundMakerConfig } from '../SoundMakerConfig'

export default class MorseWavBufferPlayer implements ISoundMaker {
  myAudioContext
  source
  sourceEnded = true
  sourceEndedCallBack
  gainNode
  noiseNode
  noisePlaying = false
  noiseGainNode
  lastNoiseType = 'off'

  startNoise = (config:SoundMakerConfig) => {
    let noiseNodeMaker = null
    const afterImport = (def) => {
      def.install()
      noiseNodeMaker()
      this.noiseGainNode = this.myAudioContext.createGain()
      this.setNoiseVolume(config.noise.scaledNoiseVolume)
      this.noiseNode.connect(this.noiseGainNode)
      this.noiseGainNode.connect(this.myAudioContext.destination)
      this.noiseNode.start()
      console.log('started a noise node')
      this.noisePlaying = true
    }
    switch (config.noise.type) {
      case 'white':
        noiseNodeMaker = () => { this.noiseNode = this.myAudioContext.createWhiteNoise() }
        import('white-noise-node').then(({ default: def }) => {
          afterImport(def)
        })
        break
      case 'brown':
        noiseNodeMaker = () => { this.noiseNode = this.myAudioContext.createBrownNoise() }
        import('brown-noise-node').then(({ default: def }) => {
          afterImport(def)
        })
        break
      case 'pink':
        noiseNodeMaker = () => { this.noiseNode = this.myAudioContext.createPinkNoise() }
        import('pink-noise-node').then(({ default: def }) => {
          afterImport(def)
        })
    }
  }

  setVolume = (scaledVolume) => {
    if (this.myAudioContext) {
      this.gainNode.gain.setValueAtTime(scaledVolume, this.myAudioContext.currentTime)
    }
  }

  setNoiseVolume = (scaledVolume) => {
    if (this.myAudioContext) {
      this.noiseGainNode.gain.setValueAtTime(scaledVolume, this.myAudioContext.currentTime)
    }
  }

  stopNoise = () => {
    if (this.noiseNode && this.noisePlaying) {
      this.noiseNode.stop()
      this.noisePlaying = false
    }
  }

  handleNoiseSettings = (config:SoundMakerConfig) => {
    if (this.myAudioContext) {
      const noiseWasPlaying = this.noisePlaying
      const typeChanged = config.noise.type !== this.lastNoiseType
      const typeIsOff = config.noise.type === 'off'
      if ((typeChanged && this.noisePlaying) || typeIsOff) {
        this.stopNoise()
      }
      if (!typeIsOff && config.playerPlaying) {
        if ((noiseWasPlaying && typeChanged) || (!noiseWasPlaying)) {
          this.startNoise(config)
        }
      }
      this.lastNoiseType = config.noise.type
    }
  }

  play = (config:SoundMakerConfig, onEnded:any) => {
    const wav = MorseStringToWavBuffer.createWav(config, true)
    config.noise.scaledNoiseVolume = config.noise.volume / 10
    this.doPlay(wav.wav, config.volume / 10, config, onEnded)
  }

  doPlay = (wav, scaledVolume, config:SoundMakerConfig, onEnded) => {
    this.sourceEnded = false
    this.sourceEndedCallBack = onEnded
    if (typeof (this.myAudioContext) === 'undefined') {
      this.myAudioContext = new AudioContext()
    }

    this.gainNode = this.myAudioContext.createGain()
    this.source = this.myAudioContext.createBufferSource()
    this.source.addEventListener('ended', () => {
      // this.noiseNode.stop()
      this.sourceEnded = true
      this.sourceEndedCallBack()
    })
    const mybuf = new Int8Array(wav).buffer
    let mybuf2
    this.myAudioContext.decodeAudioData(mybuf, (x) => {
      // thanks https://middleearmedia.com/web-audio-api-audio-buffer/
      mybuf2 = x
      this.source.buffer = mybuf2
      this.setVolume(scaledVolume)
      this.source.connect(this.gainNode)
      this.gainNode.connect(this.myAudioContext.destination)
      this.handleNoiseSettings(config)
      this.source.start(0)
    }, (e) => {
      console.log('error')
      console.log(e)
    })
  }

  forceStop = (pauseCallBack, killNoise) => {
    if (typeof (this.myAudioContext) === 'undefined') {
      pauseCallBack()
    } else {
      if (killNoise) {
        this.stopNoise()
      }
      if (typeof (this.source) !== 'undefined') {
        if (!this.sourceEnded) {
          this.sourceEndedCallBack = pauseCallBack
          this.source.stop()
        } else {
          pauseCallBack()
        }
      } else {
        pauseCallBack()
      }
    }
  }

  getWav = (config: SoundMakerConfig):Promise<number[]> => {
    const myPromise:Promise<number[]> = new Promise((resolve, reject) => {
      const wav = MorseStringToWavBuffer.createWav(config, true)
      resolve(wav.wav)
    })
    return myPromise
  }
}
