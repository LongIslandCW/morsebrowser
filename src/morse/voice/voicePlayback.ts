export type NeedToSpeakInput = {
  voiceEnabled: boolean
  fromVoiceOrTrail: boolean
  hasMoreMorse: boolean
  maxBufferReached: boolean
  speakFirst: boolean
  racerOn: boolean
  speedRacerSpeakBeforeReplay: boolean
}

export function computeNeedToSpeak (input: NeedToSpeakInput): boolean {
  if (!input.voiceEnabled ||
      input.fromVoiceOrTrail ||
      input.hasMoreMorse ||
      !input.maxBufferReached ||
      input.speakFirst) {
    return false
  }
  // Speed Racer recap owns speech when Speak is on; normal voice trail otherwise.
  if (input.racerOn && input.speedRacerSpeakBeforeReplay) {
    return false
  }
  return true
}

export type RacerRecapOnInput = {
  racerOn: boolean
  speedRacerSpeakBeforeReplay: boolean
  voiceEnabled: boolean
}

export function computeRacerRecapOn (input: RacerRecapOnInput): boolean {
  return input.racerOn &&
    input.speedRacerSpeakBeforeReplay &&
    input.voiceEnabled
}

export function computeNoDelays (needToSpeak: boolean, needToTrail: boolean): boolean {
  return !needToSpeak && !needToTrail
}

export function voiceThinkingDelayMs (value: unknown): number {
  const parsed = parseFloat(String(value))
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return parsed * 1000
}

export type SpeedRacerRecapInput = {
  getSpelling: () => boolean
  displayWord: string
  speakText: string
  interLetterMs: number
  preRecapMs: number
  token: number
  getToken: () => number
  isPlaying: () => boolean
  isVoiceEnabled: () => boolean
  prepPhrase: (phrase: string) => string
  speakPhrase: (phrase: string, onDone: () => void) => void
  onComplete: () => void
  schedule?: typeof setTimeout
}

export function runSpeedRacerRecap (input: SpeedRacerRecapInput): void {
  const schedule = input.schedule ?? setTimeout

  const canContinue = (): boolean => {
    return input.getToken() === input.token &&
      input.isPlaying() &&
      input.isVoiceEnabled()
  }

  const finishRecap = () => {
    schedule(() => {
      if (!canContinue()) {
        return
      }
      input.onComplete()
    }, input.preRecapMs)
  }

  const speakWholeWord = () => {
    const phrase = input.prepPhrase(input.speakText)
    input.speakPhrase(phrase, () => {
      if (!canContinue()) {
        return
      }
      finishRecap()
    })
  }

  const speakChar = (idx: number, chars: string[]) => {
    if (!canContinue()) {
      return
    }
    if (!input.getSpelling()) {
      speakWholeWord()
      return
    }
    if (idx >= chars.length) {
      finishRecap()
      return
    }
    const letter = input.prepPhrase(chars[idx].toUpperCase() + '\n')
    input.speakPhrase(letter, () => {
      if (!canContinue()) {
        return
      }
      schedule(() => speakChar(idx + 1, chars), input.interLetterMs)
    })
  }

  schedule(() => {
    if (input.getToken() !== input.token || !input.isVoiceEnabled()) {
      return
    }
    if (!input.getSpelling()) {
      speakWholeWord()
      return
    }
    const chars = input.displayWord.replace(/\s+/g, '').split('')
    speakChar(0, chars)
  }, input.interLetterMs)
}

export function shouldSkipVoiceBufferForRacer (
  racerOn: boolean,
  speedRacerSpeakBeforeReplay: boolean,
  voiceEnabled: boolean
): boolean {
  return racerOn && speedRacerSpeakBeforeReplay && voiceEnabled
}

/** Arm Recap presets lock the Voice toggle; SR + Speak restores user control. */
export function shouldBypassManualVoiceForToggle (
  manualVoice: boolean,
  racerOn: boolean,
  speedRacerSpeakBeforeReplay: boolean,
  voiceCapable = true
): boolean {
  return voiceCapable &&
    (!manualVoice || (racerOn && speedRacerSpeakBeforeReplay))
}

/** Automatic voice trail / trim skips Arm Recap gating while Speed Racer is on. */
export function computeAutoVoiceAllowed (
  manualVoice: boolean,
  racerOn: boolean
): boolean {
  return !manualVoice || racerOn
}

export function shouldShowManualVoiceRecapButton (
  manualVoice: boolean,
  voiceEnabled: boolean,
  racerOn: boolean,
  speedRacerSpeakBeforeReplay: boolean
): boolean {
  return manualVoice &&
    voiceEnabled &&
    !(racerOn && speedRacerSpeakBeforeReplay)
}
