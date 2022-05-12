export class MorseVoice {
  static getVoices () {
    return window.speechSynthesis.getVoices()
  }

  static initUtterance (textToSpeak) {
    const utterance = new SpeechSynthesisUtterance()
    utterance.voice = this.getVoices[10] // Note: some voices don't support altering params
    utterance.voiceURI = 'native'
    utterance.volume = 1 // 0 to 1
    utterance.rate = 1 // 0.1 to 10
    utterance.pitch = 2 // 0 to 2
    utterance.text = textToSpeak
    utterance.lang = 'en-US'
    return utterance
  }

  static speak (textToSpeak, onEnd) {
    const utterance = this.initUtterance(textToSpeak)
    utterance.addEventListener('end', onEnd)
    window.speechSynthesis.speak(utterance)
  }
}
