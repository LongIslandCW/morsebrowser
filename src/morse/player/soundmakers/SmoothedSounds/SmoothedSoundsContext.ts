export class SmoothedSoundsContext {
  audioContext:AudioContext
  oscillatorNode:OscillatorNode
  bandpassNode:BiquadFilterNode
  gainNode:GainNode
  contextClosed:boolean
  noiseNode:AudioScheduledSourceNode
  noiseGainNode:GainNode

  constructor () {
    this.rebuildAll()
  }

  rebuildAll () {
    this.getAudioContext()
    this.getGainNode()
    this.getOscillatorNode()
    this.getBandPassNode()
    this.connectNodes()
    this.startOscillatorSilenced()
  }

  getGainNode () {
    this.gainNode = this.audioContext.createGain()
  }

  getOscillatorNode () {
    // console.log('got oscillator node')
    this.oscillatorNode = this.audioContext.createOscillator()
    this.oscillatorNode.type = 'sine'
  }

  getBandPassNode () {
    this.bandpassNode = this.audioContext.createBiquadFilter()
    this.bandpassNode.type = 'bandpass'
    this.bandpassNode.Q.setValueAtTime(1, 0)
  }

  connectNodes () {
    this.oscillatorNode.connect(this.gainNode)
    this.gainNode.connect(this.bandpassNode)
    this.bandpassNode.connect(this.audioContext.destination)
  }

  startOscillatorSilenced () {
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    this.oscillatorNode.start(this.audioContext.currentTime)
  }

  getAudioContext () {
    this.audioContext = new AudioContext()
    this.contextClosed = false
  }

  stopAndCloseContext () {
    this.oscillatorNode.stop()
    this.audioContext.close()
    this.contextClosed = true
  }
}
