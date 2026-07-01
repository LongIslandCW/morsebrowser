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

export function isSpeedRacerActive (racerEnabled: boolean, racerTotalPlays: number): boolean {
  return racerEnabled && racerTotalPlays >= 1
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
  speakText: string
  /** Spaced letter text from WordInfo.speakText(true); used when Spell is on. */
  speakTextSpelled: string
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

  const playbackActive = (): boolean => {
    return input.getToken() === input.token && input.isPlaying()
  }

  const skipSpeechAndComplete = () => {
    if (playbackActive()) {
      input.onComplete()
    }
  }

  const canSpeak = (): boolean => {
    return playbackActive() && input.isVoiceEnabled()
  }

  const finishRecap = () => {
    schedule(() => {
      if (!canSpeak()) {
        skipSpeechAndComplete()
        return
      }
      input.onComplete()
    }, input.preRecapMs)
  }

  const speakWholeWord = () => {
    if (!canSpeak()) {
      skipSpeechAndComplete()
      return
    }
    const phrase = input.prepPhrase(input.speakText)
    input.speakPhrase(phrase, () => {
      if (!playbackActive()) {
        return
      }
      if (!input.isVoiceEnabled()) {
        skipSpeechAndComplete()
        return
      }
      finishRecap()
    })
  }

  const speakSpelled = () => {
    if (!canSpeak()) {
      skipSpeechAndComplete()
      return
    }
    const phrase = input.prepPhrase(input.speakTextSpelled)
    input.speakPhrase(phrase, () => {
      if (!playbackActive()) {
        return
      }
      if (!input.isVoiceEnabled()) {
        skipSpeechAndComplete()
        return
      }
      finishRecap()
    })
  }

  schedule(() => {
    if (!playbackActive()) {
      return
    }
    if (!input.isVoiceEnabled()) {
      skipSpeechAndComplete()
      return
    }
    if (!input.getSpelling()) {
      speakWholeWord()
      return
    }
    // Match normal voice trail: spaced letters (e.g. "R A R") so TTS does not
    // read callsigns like TIN/RAR as English words.
    speakSpelled()
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
