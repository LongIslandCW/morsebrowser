export class MorseVoiceInfo {
    textToSpeak
    voice
    volume
    rate
    pitch
    onEnd
}
export class MorseVoice {
  voices =[]
  voicesInited = false
  _voicesReadyCallback = null

  constructor (voicesReadyCallback) {
    this._voicesReadyCallback = voicesReadyCallback
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.addEventListener('voiceschanged', () => this.populateVoiceList())
    }
    this.populateVoiceList()
  }

  populateVoiceList () {
    if (typeof speechSynthesis === 'undefined') {
      return
    }

    const voicesTry = speechSynthesis.getVoices()

    if (voicesTry.length > 0) {
      this.voices = voicesTry
      console.log(this.voices)
      this._voicesReadyCallback(this.voices)
    }
  }

  getVoices () {
    // we assume this is all ready through the constructor by the time we use it
    const voices = speechSynthesis.getVoices()
    console.log(voices)
    return voices
  }

  initUtterance (morseVoiceInfo) {
    const utterance = new SpeechSynthesisUtterance()
    utterance.voice = morseVoiceInfo.voice || null // Note: some voices don't support altering params
    utterance.voiceURI = morseVoiceInfo.voice && morseVoiceInfo.voice.voiceURI ? morseVoiceInfo.voice.voiceURI : 'native'
    utterance.volume = morseVoiceInfo.volume // 0 to 1
    utterance.rate = morseVoiceInfo.rate // 0.1 to 10
    utterance.pitch = morseVoiceInfo.pitch // 0 to 2
    utterance.text = morseVoiceInfo.textToSpeak
    utterance.lang = morseVoiceInfo.voice && morseVoiceInfo.voice.lang ? morseVoiceInfo.voice.lang : 'en-US'
    return utterance
  }

  speak (morseVoiceInfo) {
    const utterance = this.initUtterance(morseVoiceInfo)
    utterance.addEventListener('end', morseVoiceInfo.onEnd)
    window.speechSynthesis.speak(utterance)
  }
}
