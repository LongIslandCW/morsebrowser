import * as ko from 'knockout'
import { MorseVoiceInfo } from './MorseVoiceInfo'
import EasySpeech from 'easy-speech'
import { MorseViewModel } from '../morse'
export class MorseVoice {
  voices = []
  voicesInited:boolean = false
  voiceEnabled:ko.Observable<boolean>
  voiceCapable:ko.Observable<boolean>
  voiceThinkingTime:ko.Observable<number>
  voiceVoice:ko.Observable<any>
  voiceVolume:ko.Observable<number>
  voiceRate:ko.Observable<number>
  voicePitch:ko.Observable<number>
  voiceLang:ko.Observable<string>
  voiceVoices:ko.ObservableArray<any>
  voiceBuffer:Array<any>
  ctxt:MorseViewModel
  // keep a reference because read that garbage collector can grab
  // and onend never fires?!
  currentUtterance:SpeechSynthesisUtterance

  constructor (context:MorseViewModel) {
    this.ctxt = context
    this.voiceEnabled = ko.observable(false)
    this.voiceCapable = ko.observable(false)
    this.voiceThinkingTime = ko.observable(0)
    this.voiceVoice = ko.observable()
    this.voiceVolume = ko.observable(10)
    this.voiceRate = ko.observable(1)
    this.voicePitch = ko.observable(1)
    this.voiceLang = ko.observable('en-us')
    this.voiceVoices = ko.observableArray([])
    this.voiceBuffer = []
    const speechDetection = EasySpeech.detect()

    if (speechDetection.speechSynthesis && speechDetection.speechSynthesisUtterance) {
      this.logToFlaggedWords('Speech Available')
      this.voiceCapable(true)
    } else {
      this.logToFlaggedWords(`Synthesis: ${speechDetection.speechSynthesis} Utterance:${speechDetection.speechSynthesisUtterance}`)
    }

    /* if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.addEventListener('voiceschanged', () => this.populateVoiceList())
    } */
    this.initEasySpeech()
  }

  initEasySpeech = async () => {
    // let easySpeechInitStatus

    EasySpeech.init().then((e) => {
      this.logToFlaggedWords(`easyspeechinit: ${e}`)
      this.populateVoiceList()
    }).catch((e) => {
      this.logToFlaggedWords(`error in easyspeechinit: ${e}`)
    })
  }

  logToFlaggedWords = (s) => {
    this.ctxt.logToFlaggedWords(s)
  }

  populateVoiceList = () => {
    if (!this.voiceCapable()) {
      return
    }

    const easySpeechStatus = EasySpeech.status()
    if (easySpeechStatus.voices && easySpeechStatus.voices.length) {
      this.voices = easySpeechStatus.voices
      this.voices.forEach(v => {
        this.logToFlaggedWords(`voiceAvailable:${v.name}  ${v.lang}`)
      })
      this.voices = this.voices.filter(x => x.lang === 'en-US')
      this.voiceVoices(this.voices)
      this.logToFlaggedWords(`loaded voices:${this.voices.length}`)
    } else {
      this.logToFlaggedWords('no voices')
    }
    /* const voicesTry = speechSynthesis.getVoices()

    if (voicesTry.length > 0) {
      this.voices = voicesTry
      // console.log(this.voices)
      this.voiceVoices(this.voices)
    } */
  }

  /* getVoices = () => {
    // we assume this is all ready through the constructor by the time we use it
    const voices = speechSynthesis.getVoices()
    console.log(voices)
    return voices
  } */

  initUtterance = (morseVoiceInfo) => {
    this.logToFlaggedWords(`morseVoiceInfo:${JSON.stringify(morseVoiceInfo)}`)
    this.logToFlaggedWords(`morseVoiceInfo.voice.name:${morseVoiceInfo.voice && morseVoiceInfo.voice.name ? morseVoiceInfo.voice.name : 'no name'}`)
    this.currentUtterance = new SpeechSynthesisUtterance()
    this.currentUtterance.voice = morseVoiceInfo.voice || null // Note: some voices don't support altering params
    // (this.currentUtterance as any).voiceURI = morseVoiceInfo.voice && morseVoiceInfo.voice.voiceURI ? morseVoiceInfo.voice.voiceURI : 'native'
    this.currentUtterance.volume = morseVoiceInfo.volume // 0 to 1
    // this.currentUtterance.rate = morseVoiceInfo.rate // 0.1 to 10
    // this.currentUtterance.pitch = morseVoiceInfo.pitch // 0 to 2
    this.currentUtterance.text = morseVoiceInfo.textToSpeak
    this.currentUtterance.lang = morseVoiceInfo.voice && morseVoiceInfo.voice.lang ? morseVoiceInfo.voice.lang : 'en-US'
    return this.currentUtterance
  }

  speakInfo = (morseVoiceInfo) => {
    try {
      const utterance = this.initUtterance(morseVoiceInfo)
      this.logToFlaggedWords('returned from initUtterance')
      utterance.addEventListener('end', morseVoiceInfo.onEnd)
      utterance.addEventListener('error', (e) => {
        this.logToFlaggedWords(`error event during speak:${e}`)
        morseVoiceInfo.onEnd()
      })
      window.speechSynthesis.cancel()
      this.logToFlaggedWords('about to .speak')
      window.speechSynthesis.speak(utterance)
      this.logToFlaggedWords('called speak')
      // window.speechSynthesis.resume()
    } catch (e) {
      this.logToFlaggedWords(`caught in speakInfo:${e}`)
      morseVoiceInfo.onEnd()
    }
  }

  speakInfo2 = (morseVoiceInfo:MorseVoiceInfo) => {
    try {
      const esConfig = {
        text: morseVoiceInfo.textToSpeak,
        pitch: morseVoiceInfo.pitch,
        rate: morseVoiceInfo.rate,
        end: e => {
          this.logToFlaggedWords('end event')
          morseVoiceInfo.onEnd()
          this.logToFlaggedWords('onEnd called')
        },
        volume: morseVoiceInfo.volume,
        voice: morseVoiceInfo.voice ?? null,
        error: e => this.logToFlaggedWords(`error event during speak:${e}`),
        boundary: e => this.logToFlaggedWords('boundary event'),
        mark: e => this.logToFlaggedWords('mark event'),
        pause: e => this.logToFlaggedWords('pause event')
      }

      EasySpeech.speak(esConfig)
    } catch (e) {
      this.logToFlaggedWords(`caught in speakInfo2:${e}`)
      morseVoiceInfo.onEnd()
    }
  }

  speakPhrase = (phraseToSpeak:string, onEndCallBack) => {
    try {
      const morseVoiceInfo = new MorseVoiceInfo()
      morseVoiceInfo.textToSpeak = phraseToSpeak
      // console.log(`voiceVoice:${this.voiceVoice()}`)
      if (this.voiceVoice()) {
        this.logToFlaggedWords(`user selected a voice ${this.voiceVoice().name} ${this.voiceVoice().lang}`)
        morseVoiceInfo.voice = this.voiceVoice()
      } else {
        this.logToFlaggedWords('user did not select a voice')
        if (this.voices.length > 0) {
          this.logToFlaggedWords(`selecting default 0 voice ${this.voices[0].name} ${this.voices[0].lang}`)
          morseVoiceInfo.voice = this.voices[0]
        } else {
          this.logToFlaggedWords('no voices')
          morseVoiceInfo.voice = null
        }
      }

      morseVoiceInfo.volume = this.voiceVolume() / 10
      morseVoiceInfo.rate = this.voiceRate()
      morseVoiceInfo.pitch = this.voicePitch()
      morseVoiceInfo.onEnd = onEndCallBack
      if (this.voiceVoices().length > 0) {
        this.logToFlaggedWords('using speakinfo2')
        this.speakInfo(morseVoiceInfo)
      } else {
        this.logToFlaggedWords('using old speakInfo')
        this.speakInfo(morseVoiceInfo)
      }
    } catch (e) {
      this.logToFlaggedWords(`caught in speakPhrase:${e}`)
      onEndCallBack()
    }
  }
}
