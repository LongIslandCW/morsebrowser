/* abstract away the playing of wav buffer in case browser issues come up, etc
can change the code here and other code won't be affected.
*/

import { CreatedWav } from '../../wav/CreatedWav'
import { MorseStringToWavBuffer } from '../../wav/morseStringToWavBuffer'
import { ISoundMaker } from '../ISoundMaker'
import { SoundMakerConfig } from '../SoundMakerConfig'
import { SmoothedSoundsContext } from './SmoothedSoundsContext'

export default class SmoothedSoundsPlayer implements ISoundMaker {
  sourceEnded:boolean = true
  sourceEndedCallBack
  noisePlaying:boolean = false
  lastNoiseType = 'off'
  scaledVolume
  wavInfo:CreatedWav
  config:SoundMakerConfig
  nodesConnected:boolean = false
  ssContext:SmoothedSoundsContext

  startNoise = (config:SoundMakerConfig) => {
    let noiseNodeMaker = null
    const afterImport = (def) => {
      def.install()
      noiseNodeMaker()
      this.ssContext.noiseGainNode = this.ssContext.audioContext.createGain()
      this.setNoiseVolume(config.noise.scaledNoiseVolume)
      this.ssContext.noiseNode.connect(this.ssContext.noiseGainNode)
      this.ssContext.noiseGainNode.connect(this.ssContext.audioContext.destination)
      this.ssContext.noiseNode.start()
      console.log('started a noise node')
      this.noisePlaying = true
    }
    switch (config.noise.type) {
      case 'white':
        noiseNodeMaker = () => { this.ssContext.noiseNode = (this.ssContext.audioContext as any).createWhiteNoise() }
        import('white-noise-node').then(({ default: def }) => {
          afterImport(def)
        })
        break
      case 'brown':
        noiseNodeMaker = () => { this.ssContext.noiseNode = (this.ssContext.audioContext as any).createBrownNoise() }
        import('brown-noise-node').then(({ default: def }) => {
          afterImport(def)
        })
        break
      case 'pink':
        noiseNodeMaker = () => { this.ssContext.noiseNode = (this.ssContext.audioContext as any).createPinkNoise() }
        import('pink-noise-node').then(({ default: def }) => {
          afterImport(def)
        })
    }
  }

  setVolume = (scaledVolume) => {
    this.scaledVolume = scaledVolume
    // if (this.myAudioContext) {
    //   this.gainNode.gain.setValueAtTime(scaledVolume, this.myAudioContext.currentTime)
    // }
  }

  setNoiseVolume = (scaledVolume) => {
    if (this.ssContext.audioContext) {
      this.ssContext.noiseGainNode.gain.setValueAtTime(scaledVolume, this.ssContext.audioContext.currentTime)
    }
  }

  stopNoise = () => {
    if (this.ssContext.noiseNode && this.noisePlaying) {
      this.ssContext.noiseNode.stop()
      this.noisePlaying = false
    }
  }

  handleNoiseSettings = (config:SoundMakerConfig) => {
    if (this.ssContext) {
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

  setGainTimings = (wavInfo:CreatedWav, scaledVolume, config:SoundMakerConfig) => {
    const currentTimeSecs = this.ssContext.audioContext.currentTime
    const currentTimeMs = currentTimeSecs * 1000
    // console.log(`currentTimeMs:${currentTimeMs}`)
    wavInfo.timeLine.forEach((soundEvent) => {
      const eventType = soundEvent.event
      const time = soundEvent.time + currentTimeMs
      // const eventDuration = time - lastTime
      const riseTimeTarget = (time / 1000) // - (config.riseMsOffset / 1000)
      switch (eventType) {
        case 'prepad_start':
          this.ssContext.gainNode.gain.setValueAtTime(0, time)
          break
        case 'dah_start':
        case 'dit_start':
          // https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
          this.ssContext.oscillatorNode.frequency.setValueAtTime(eventType === 'dit_start' ? config.ditFrequency : config.dahFrequency, riseTimeTarget)
          this.ssContext.bandpassNode.frequency.setValueAtTime(eventType === 'dit_start' ? config.ditFrequency : config.dahFrequency, riseTimeTarget)
          this.ssContext.gainNode.gain.setTargetAtTime(scaledVolume, riseTimeTarget, config.riseTimeConstant)
          break
        case 'dah_end':
        case 'dit_end':
          this.ssContext.gainNode.gain.setTargetAtTime(0, (time / 1000) - (config.decayMsOffset / 1000), config.decayTimeConstant)
          break
        default:
          // gainNode.gain.setTargetAtTime(0, time / 1000, decayTimeConstant)
          break
      }
      // lastTime = time
    })
  }

  play = (config:SoundMakerConfig, onEnded:any) => {
    const wavInfo = MorseStringToWavBuffer.createWav(config, false)
    config.noise.scaledNoiseVolume = config.noise.volume / 10
    this.doPlay(wavInfo, config.volume / 10, config, onEnded)
  }

  doPlay = (wavInfo:CreatedWav, scaledVolume, config:SoundMakerConfig, onEnded) => {
    this.scaledVolume = scaledVolume
    this.wavInfo = wavInfo
    this.config = config
    this.sourceEnded = false
    this.sourceEndedCallBack = onEnded
    this.getContext()
    this.setGainTimings(wavInfo, scaledVolume, config)
    this.handleNoiseSettings(config)
    setTimeout(() => {
      this.sourceEnded = true
      this.sourceEndedCallBack()
    }, this.getEndTime(wavInfo))
  }

  getContext = () => {
    if (!this.ssContext) {
      this.ssContext = new SmoothedSoundsContext()
    }
    if (this.ssContext.contextClosed) {
      this.ssContext.rebuildAll()
    }
  }

  getEndTime = (wavInfo:CreatedWav) => {
    const l = wavInfo.timeLine.length
    const wordSpaceTime = wavInfo.timingUnits.wordSpaceMultiplier * wavInfo.timingUnits.calculatedFWUnitsMs
    const xtraWordSpaceDits = this.config.xtraWordSpaceDits * wavInfo.timingUnits.calculatedFWUnitsMs * wavInfo.timingUnits.ditUnitMultiPlier
    return wavInfo.timeLine[l - 1].time + wordSpaceTime + xtraWordSpaceDits
  }

  forceStop = (pauseCallBack, killNoise) => {
    if (!this.ssContext) {
      pauseCallBack()
    } else {
      if (killNoise) {
        this.stopNoise()
      }
      if (this.ssContext) {
        if (!this.sourceEnded) {
          this.sourceEndedCallBack = pauseCallBack
          this.ssContext.stopAndCloseContext()
        } else {
          pauseCallBack()
        }
      } else {
        pauseCallBack()
      }
    }
  }
}
