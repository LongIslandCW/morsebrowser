/* abstract away the playing of wav buffer in case browser issues come up, etc
can change the code here and other code won't be affected.
*/

export default class MorseWavBufferPlayer {
  myAudioContext
  source
  sourceEnded = true
  sourceEndedCallBack
  gainNode
  noiseNode
  noisePlaying = false
  noiseGainNode
  lastNoiseType = 'off'
  static gainNodes = []
  bandpassNode
  scaledVolume
  wavInfo
  config

  startNoise = (config) => {
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
    this.scaledVolume = scaledVolume
    // if (this.myAudioContext) {
    //   this.gainNode.gain.setValueAtTime(scaledVolume, this.myAudioContext.currentTime)
    // }
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

  handleNoiseSettings = (config) => {
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

  setGainTimings = (gainNode, oscillatorNode, bandpassNode, wavInfo, scaledVolume, config) => {
    // console.log(wavInfo.timeLine)
    // console.log(wavInfo)
    // const riseTimeConstant = 0.001
    // const decayTimeConstant = 0.001
    // const decayBegin = 0.40
    // let lastTime = 0
    wavInfo.timeLine.forEach((soundEvent) => {
      const eventType = soundEvent.event
      const time = soundEvent.time
      // const eventDuration = time - lastTime
      const riseTimeTarget = (time / 1000) // - (config.riseMsOffset / 1000)
      switch (eventType) {
        case 'prepad_start':
          gainNode.gain.setValueAtTime(0, time)
          break
        case 'dah_start':
        case 'dit_start':
          // https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
          oscillatorNode.frequency.setValueAtTime(eventType === 'dit_start' ? config.ditFrequency : config.dahFrequency, riseTimeTarget)
          bandpassNode.frequency.setValueAtTime(eventType === 'dit_start' ? config.ditFrequency : config.dahFrequency, riseTimeTarget)
          gainNode.gain.setTargetAtTime(scaledVolume, riseTimeTarget, config.riseTimeConstant)
          break
        case 'dah_end':
        case 'dit_end':
          gainNode.gain.setTargetAtTime(0, (time / 1000) - (config.decayMsOffset / 1000), config.decayTimeConstant)
          break
        default:
          // gainNode.gain.setTargetAtTime(0, time / 1000, decayTimeConstant)
          break
      }
      // lastTime = time
    })
  }

  play = (wavInfo, scaledVolume, config, onEnded) => {
    this.scaledVolume = scaledVolume
    this.wavInfo = wavInfo
    this.config = config
    // console.log(wavInfo)
    console.log(config)
    this.sourceEnded = false
    this.sourceEndedCallBack = onEnded
    if (typeof (this.myAudioContext) === 'undefined') {
      this.myAudioContext = new AudioContext()
    } else {
      this.myAudioContext.close()
      this.myAudioContext = new AudioContext()
    }

    if (MorseWavBufferPlayer.gainNodes.length > 0) {
      MorseWavBufferPlayer.gainNodes.forEach(x => x.disconnect())
      // this.gainNode.disconnect()
    }
    this.gainNode = this.myAudioContext.createGain()
    MorseWavBufferPlayer.gainNodes.push(this.gainNode)
    this.setVolume(0)
    // this.source = this.myAudioContext.createBufferSource()
    this.source = this.myAudioContext.createOscillator()
    this.source.type = 'sine'
    this.bandpassNode = this.myAudioContext.createBiquadFilter()
    this.bandpassNode.type = 'bandpass'
    this.bandpassNode.Q.setValueAtTime(1, 0)
    // this.source.frequency = 440
    // this.source.frequency.setValueAtTime(440, 0)
    this.setGainTimings(this.gainNode, this.source, this.bandpassNode, wavInfo, scaledVolume, config)
    /* this.source.addEventListener('ended', () => {
      // this.noiseNode.stop()
      this.sourceEnded = true
      this.sourceEndedCallBack()
    }) */

    /*
    const mybuf = new Int8Array(wavInfo.wav).buffer
    let mybuf2
    this.myAudioContext.decodeAudioData(mybuf, (x) => {
      // thanks https://middleearmedia.com/web-audio-api-audio-buffer/
      mybuf2 = x
      this.source.buffer = mybuf2
      // this.setVolume(scaledVolume)
      this.source.connect(this.gainNode)
      this.gainNode.connect(this.myAudioContext.destination)
      this.handleNoiseSettings(config)
      this.source.start(0)
    }, (e) => {
      console.log('error')
      console.log(e)
    })
    */
    this.source.connect(this.gainNode)
    this.gainNode.connect(this.bandpassNode)
    this.bandpassNode.connect(this.myAudioContext.destination)
    this.handleNoiseSettings(config)
    this.source.start(0)
    const l = wavInfo.timeLine.length
    const wordSpaceTime = wavInfo.timingUnits.wordSpaceMultiplier * wavInfo.timingUnits.calculatedFWUnitsMs
    const xtraWordSpaceDits = this.config.xtraWordSpaceDits * wavInfo.timingUnits.calculatedFWUnitsMs * wavInfo.timingUnits.ditUnitMultiPlier
    setTimeout(() => {
      // this.noiseNode.stop()
      this.sourceEnded = true
      this.sourceEndedCallBack()
      console.log(wavInfo.timingUnits)
    }, wavInfo.timeLine[l - 1].time + wordSpaceTime + xtraWordSpaceDits)
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
}
