export class SmoothedSoundsContext {
  audioContext:BaseAudioContext
  offlineAudioContext:OfflineAudioContext
  oscillatorNode:OscillatorNode
  bandpassNode:BiquadFilterNode
  gainNode:GainNode
  contextClosed:boolean
  noiseNode:AudioScheduledSourceNode
  noiseGainNode:GainNode
  offline:boolean
  offlineDurationMs:number
  constructor (offline, offlineDurationMs) {
    this.offline = offline
    this.offlineDurationMs = offlineDurationMs
    this.rebuildAll()
  }

  rebuildAll = () => {
    this.getAudioContext()
    this.getGainNode()
    this.getOscillatorNode()
    this.getBandPassNode()
    this.connectNodes()
    this.startOscillatorSilenced()
  }

  getGainNode = () => {
    this.gainNode = this.audioContext.createGain()
  }

  getOscillatorNode = () => {
    // console.log('got oscillator node')
    this.oscillatorNode = this.audioContext.createOscillator()
    this.oscillatorNode.type = 'sine'
  }

  getBandPassNode = () => {
    this.bandpassNode = this.audioContext.createBiquadFilter()
    this.bandpassNode.type = 'bandpass'
    this.bandpassNode.Q.setValueAtTime(1, 0)
  }

  connectNodes = () => {
    this.oscillatorNode.connect(this.gainNode)
    this.gainNode.connect(this.bandpassNode)
    this.bandpassNode.connect(this.audioContext.destination)
  }

  startOscillatorSilenced = () => {
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    this.oscillatorNode.start(this.audioContext.currentTime)
  }

  getAudioContext = () => {
    this.audioContext = this.offline ? new OfflineAudioContext(2, 44100 * (this.offlineDurationMs / 1000), 44100) : new AudioContext()
    this.contextClosed = false
  }

  stopAndCloseContext = () => {
    this.oscillatorNode.stop()
    if ((this.audioContext as AudioContext).close) {
      (this.audioContext as AudioContext).close()
    }
    this.contextClosed = true
  }
}
