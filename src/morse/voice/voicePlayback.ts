export type LessonVoiceBaseline = {
  voiceEnabled: boolean
  manualVoice: boolean
  speakFirst: boolean
}

/** Snapshot voice + Arm Recap + Voice First from the active lesson preset (after it is applied). */
export function buildLessonVoiceBaseline (
  voiceEnabled: boolean,
  manualVoice: boolean,
  speakFirst: boolean
): LessonVoiceBaseline {
  return { voiceEnabled, manualVoice, speakFirst }
}

export function applyLessonVoiceBaseline (
  baseline: LessonVoiceBaseline,
  setVoiceEnabled: (value: boolean) => void,
  setManualVoice: (value: boolean) => void,
  setSpeakFirst: (value: boolean) => void
): void {
  setVoiceEnabled(baseline.voiceEnabled)
  setManualVoice(baseline.manualVoice)
  setSpeakFirst(baseline.speakFirst)
}

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
  // Speed Racer without Speak = morse-only; no voice trail.
  if (input.racerOn && !input.speedRacerSpeakBeforeReplay) {
    return false
  }
  // Speed Racer recap owns speech when Speak is on.
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
  /** Phrase already respects Spell (whole word or spaced letters), same as normal voice trail. */
  speakText: string
  /** Voice Delay Before — once before recap speech starts. */
  preSpeechMs: number
  /** Voice Delay After — once after recap speech, before playback continues. */
  postSpeechMs: number
  token: number
  getToken: () => number
  isPlaying: () => boolean
  isVoiceEnabled: () => boolean
  prepPhrase: (phrase: string) => string
  speakPhrase: (phrase: string, onDone: () => void) => void
  onComplete: () => void
  schedule?: typeof setTimeout
}

/** One TTS utterance for the card (Spell on or off), matching normal voice trail pacing. */
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
    }, input.postSpeechMs)
  }

  schedule(() => {
    if (!playbackActive()) {
      return
    }
    if (!input.isVoiceEnabled()) {
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
  }, input.preSpeechMs)
}

export function shouldSkipVoiceBufferForRacer (
  racerOn: boolean,
  _speedRacerSpeakBeforeReplay: boolean,
  _voiceEnabled: boolean
): boolean {
  // SR recap uses speakSpeedRacerRecap directly, not the voice buffer.
  return racerOn
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
