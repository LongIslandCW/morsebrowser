import * as ko from 'knockout'
import { MorseVoiceInfo } from './MorseVoiceInfo'
import EasySpeech, { Status } from 'easy-speech'
import { MorseViewModel } from '../morse'
import { ICookieHandler } from '../cookies/ICookieHandler'
import { CookieInfo } from '../cookies/CookieInfo'
import { GeneralUtils } from '../utils/general'
import { MorseCookies } from '../cookies/morseCookies'
import { VoiceBufferInfo } from './VoiceBufferInfo'

export class MorseVoice implements ICookieHandler {
  voices = []
  voicesInited:boolean = false
  voiceEnabled:ko.Observable<boolean>
  voiceCapable:ko.Observable<boolean>
  voiceThinkingTime:ko.Observable<number>
  voiceThinkingTimeWpm:ko.Computed<any>
  voiceAfterThinkingTime:ko.Observable<number>
  voiceVoice:ko.Computed<any>
  voiceVoiceName:ko.Observable<string>
  voiceVoiceIdx:ko.Observable<number>
  voiceVolume:ko.Observable<number>
  voiceRate:ko.Observable<number>
  voicePitch:ko.Observable<number>
  voiceLang:ko.Observable<string>
  voiceVoices:ko.ObservableArray<any>
  voiceBuffer:Array<VoiceBufferInfo>
  voiceBufferMaxLength:ko.Observable<number>
  ctxt:MorseViewModel
  voiceSpelling:ko.Observable<boolean>
  // keep a reference because read that garbage collector can grab
  // and onend never fires?!
  currentUtterance:SpeechSynthesisUtterance
  voiceLastOnly:ko.Observable<boolean>
  manualVoice:ko.Observable<boolean>
  speakFirst:ko.Observable<boolean>
  speakFirstRepeats:ko.Observable<number>
  speakFirstRepeatsTracker:number = 0
  speakFirstLastCardIndex:number = -1
  speakFirstAdditionalWordspaces:ko.Observable<number>
  easyspeechInitCount:number = 0
  msFound:boolean = false

  constructor (context:MorseViewModel) {
    MorseCookies.registerHandler(this)
    this.ctxt = context
    this.voiceEnabled = ko.observable(false)
    this.voiceCapable = ko.observable(false)
    this.voiceThinkingTime = ko.observable(0)
    this.voiceAfterThinkingTime = ko.observable(0)
    // this.voiceVoice = ko.observable()
    this.voiceVoiceIdx = ko.observable(-1)
    this.voiceVolume = ko.observable(10)
    this.voiceRate = ko.observable(1)
    this.voicePitch = ko.observable(1)
    this.voiceLang = ko.observable('en-us')
    this.voiceVoices = ko.observableArray([])
    this.voiceBuffer = []
    this.voiceBufferMaxLength = ko.observable(1)
    this.voiceSpelling = ko.observable(true)
    this.voiceLastOnly = ko.observable(false)
    this.manualVoice = ko.observable(false)
    this.speakFirst = ko.observable(false)
    this.speakFirstRepeats = ko.observable<number>(0)
    this.speakFirstLastCardIndex = -1
    this.speakFirstRepeatsTracker = 0
    this.speakFirstAdditionalWordspaces = ko.observable<number>(0)
    this.voiceVoiceName = ko.observable<string>(null)

    const speechDetection = EasySpeech.detect()

    if (speechDetection.speechSynthesis && speechDetection.speechSynthesisUtterance) {
      this.logToFlaggedWords('Speech Available')
      this.voiceCapable(true)
    } else {
      this.logToFlaggedWords(`Synthesis: ${speechDetection.speechSynthesis} Utterance:${speechDetection.speechSynthesisUtterance}`)
    }

    // this.initEasySpeech()

    this.voiceVoice = ko.computed(() => {
      if (typeof this.voiceVoiceIdx() === 'undefined' || this.voiceVoiceIdx() === null || this.voiceVoiceIdx() === -1) {
        this.voiceVoiceName(null)
        return null
      }
      this.voiceVoiceName(this.voiceVoices()[this.voiceVoiceIdx()].name)
      return this.voiceVoices()[this.voiceVoiceIdx()]
    }, this)

    this.voiceVoiceName.extend({ saveCookie: 'voiceVoiceName' } as ko.ObservableExtenderOptions<boolean>)

    ko.extenders.turnOffSpeakFirstWithVoiceOff = (target, option) => {
      target.subscribe((newValue) => {
        if (!newValue) {
          this.speakFirst(false)
        }
      })
      return target
    }

    this.voiceEnabled.extend(({ turnOffSpeakFirstWithVoiceOff: 'voiceEnabled'}) as ko.ObservableExtenderOptions<boolean>)

    this.voiceThinkingTimeWpm = ko.computed(() => {
      let vtt = this.voiceThinkingTime()
      if (typeof vtt === 'string') {
        vtt = parseFloat(vtt)
      }
      if (vtt) {
        const wpm = 3.6 / vtt
        // Check if the result is an even number
        if (wpm % 2 === 0) {
          return Math.round(wpm)
        }

        // Round to one decimal place if not even
        return Math.round(wpm * 10) / 10
      } else {
        return '--'
      }
    }, this)
  }

  initEasySpeech = async () => {
    if (this.easyspeechInitCount < 1) {
    // let easySpeechInitStatus
      this.easyspeechInitCount++
      console.log('initEasySpeech!')
      EasySpeech.init({ maxTimeout: 5000, interval: 250 }).then((e) => {
        this.logToFlaggedWords(`easyspeechinit: ${e}`)
        this.populateVoiceList()
      }).catch((e) => {
        this.logToFlaggedWords(`error in easyspeechinit: ${e}`)
      })
    }
  }

  logToFlaggedWords = (s) => {
    this.ctxt.logToFlaggedWords(s)
  }

  populateVoiceList = () => {
    if (!this.voiceCapable()) {
      return
    }

    const easySpeechStatus:Status = EasySpeech.status()
    let idx = 0
    let nameIdx = -1
    if ((easySpeechStatus as any).voices && (easySpeechStatus as any).voices.length) {
      this.voices = (easySpeechStatus as any).voices
      this.voices.forEach(v => {
        this.logToFlaggedWords(`voiceAvailable:${v.name}  lang:${v.lang} voiceURI:${v.voiceURI}`)
        if (v.name.toLowerCase().startsWith('microsoft')) {
          this.msFound = true
        }
      })
      const allowedLangs = [
        'en-US', 'en_US',
        'en-GB', 'en_GB',
        'es-ES', 'es_ES',
        'es-US', 'es_US',
        'pt-BR', 'pt_BR',
        'pt-PT', 'pt_PT'
      ];
    

      this.voices = this.voices.filter(x => allowedLangs.includes(x.lang)).map((v) => {
        v.idx = idx++

        if (v.name === this.voiceVoiceName()) {
          nameIdx = v.idx
        }
        return v
      })
      this.voiceVoices(this.voices)
      if (nameIdx > -1) {
        this.voiceVoiceIdx(nameIdx)
      }
      this.logToFlaggedWords(`loaded voices:${this.voices.length}`)
    } else {
      this.logToFlaggedWords('no voices')
    }
    // if (this.easyspeechInitCount < 1 && !this.msFound) {
    // this.easyspeechInitCount++
    /* setTimeout(() => {
        console.log('trying init again!')
        this.initEasySpeech()
      }, 5000) */
    // }
  }

  speakInfo = (morseVoiceInfo:MorseVoiceInfo) => {
    try {
      const esConfig = {
        logger: this.logToFlaggedWords,
        text: morseVoiceInfo.textToSpeak,
        pitch: morseVoiceInfo.pitch,
        rate: morseVoiceInfo.rate,
        end: e => {
          this.logToFlaggedWords('end event')
          morseVoiceInfo.onEnd()
          this.logToFlaggedWords('onEnd called')
        },
        volume: morseVoiceInfo.volume,
        voice: morseVoiceInfo.voice ? morseVoiceInfo.voice : null,
        lang: morseVoiceInfo.voice ? morseVoiceInfo.voice.lang : null,
        voiceURI: morseVoiceInfo.voice ? morseVoiceInfo.voice.voiceURI : null,
        error: e => {
          this.logToFlaggedWords(`error event during speak:${e}`)
          morseVoiceInfo.onEnd()
        },
        boundary: e => this.logToFlaggedWords('boundary event'),
        mark: e => this.logToFlaggedWords('mark event'),
        pause: e => this.logToFlaggedWords('pause event'),
        force: true
      }
      // fix to force to number
      esConfig.rate = parseFloat(esConfig.rate)
      esConfig.pitch = parseFloat(esConfig.pitch)
      // console.log(`rate:${esConfig.rate} ${typeof esConfig.rate === 'number'}`)
      EasySpeech.speak(esConfig)
    } catch (e) {
      this.logToFlaggedWords(`caught in speakInfo2:${e}`)
      morseVoiceInfo.onEnd()
    }
  }

  initMorseVoiceInfo = (phraseToSpeak:string):MorseVoiceInfo => {
    const morseVoiceInfo = new MorseVoiceInfo()
    morseVoiceInfo.textToSpeak = phraseToSpeak.toLowerCase()
    const target = document.getElementById('selectVoiceDropdown')
    this.logToFlaggedWords(`target:${target ? 'target found' : 'target not found'}`)
    // const selectedIndex = target ? (target as any).selectedIndex : -1
    const selectedVal = target && (target as any).value ? parseInt(`${(target as any).value}`) : -1
    const idx = this.voiceVoiceIdx() ? this.voiceVoiceIdx() : -1
    this.logToFlaggedWords(`selectedVal:${selectedVal}`)
    this.logToFlaggedWords(`idx:${idx}`)
    if (idx !== selectedVal) {
      this.voiceVoiceIdx(selectedVal)
    }

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
    // console.log(morseVoiceInfo.voice)

    return morseVoiceInfo
  }

  speakPhrase = (phraseToSpeak:string, onEndCallBack) => {
    // console.log(this.voiceVoice().name)
    const doOnEndCallBack = () => {
      setTimeout(onEndCallBack, this.voiceAfterThinkingTime() * 1000)
    }
    try {
      const morseVoiceInfo = this.initMorseVoiceInfo(phraseToSpeak)
      morseVoiceInfo.onEnd = doOnEndCallBack
      this.speakInfo(morseVoiceInfo)
    } catch (e) {
      this.logToFlaggedWords(`caught in speakPhrase:${e}`)
      doOnEndCallBack()
    }
  }

  primeThePump = () => {
    const morseVoiceInfo = this.initMorseVoiceInfo('i')
    morseVoiceInfo.volume = 0
    morseVoiceInfo.rate = 5
    morseVoiceInfo.pitch = 1
    morseVoiceInfo.onEnd = () => { this.logToFlaggedWords('pump primed') }
    this.speakInfo(morseVoiceInfo)
  }

  speakerSelect = (e, f) => {
    // do a double-check for safari
    const idx = f.target.selectedIndex

    // we assume if voiceVoice has already been set, or skipped
    const voiceName = !this.voiceVoice() || typeof this.voiceVoice().name === 'undefined' ? '' : this.voiceVoice.name

    // if no voice just set to null
    if (idx === 0 && voiceName) {
      this.voiceVoice(null)
      return
    }

    if (idx > 0) {
      const target = this.voiceVoices()[idx - 1]
      if (voiceName !== target.name) {
        this.voiceVoice(target)
      }
    }
  }

  // cookie handling
  handleCookies = (cookies: Array<CookieInfo>) => {
    if (!cookies) {
      return
    }

    let target:CookieInfo = cookies.find(x => x.key === 'voiceEnabled')
    if (target) {
      this.voiceEnabled(GeneralUtils.booleanize(target.val))
    }
    target = cookies.find(x => x.key === 'voiceSpelling')
    if (target) {
      this.voiceSpelling(GeneralUtils.booleanize(target.val))
    }
    target = cookies.find(x => x.key === 'voiceThinkingTime')
    if (target) {
      this.voiceThinkingTime(target.val as unknown as number)
    }
    target = cookies.find(x => x.key === 'voiceAfterThinkingTime')
    if (target) {
      this.voiceAfterThinkingTime(target.val as unknown as number)
    }
    target = cookies.find(x => x.key === 'voiceVolume')
    if (target) {
      this.voiceVolume(target.val as unknown as number)
    }
    target = cookies.find(x => x.key === 'voiceLastOnly')
    if (target) {
      this.voiceLastOnly(GeneralUtils.booleanize(target.val))
    }
    target = cookies.find(x => x.key === 'voiceRecap')
    if (target) {
      this.manualVoice(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'voiceBufferMaxLength')
    if (target) {
      this.voiceBufferMaxLength(parseInt(target.val))
    }

    target = cookies.find(x => x.key === 'speakFirst')
    if (target) {
      this.speakFirst(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'speakFirstRepeats')
    if (target) {
      // for backwards compatibility with files that have old "speakFirstRepeats"
      this.ctxt.numberOfRepeats(parseInt(target.val))
    }

    target = cookies.find(x => x.key === 'speakFirstAdditionalWordspaces')
    if (target) {
      this.speakFirstAdditionalWordspaces(parseInt(target.val))
    }

    target = cookies.find(x => x.key === 'voiceVoiceName')
    if (target) {
      console.log(`found voiceVoiceName cookie:${target.val}`)
      this.voiceVoiceName(target.val)
    }
  }

  handleCookie = (cookie: string) => {}
}
