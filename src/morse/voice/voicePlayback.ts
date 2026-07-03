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

/**
 * Format spaced spell text for a single TTS utterance.
 * Periods force engines to pause between letters (plain "r e r" is often rushed).
 * Example: "R E R" → "R. E. R."
 */
export function formatSpelledRecapPhrase (speakText: string): string {
  const letters = speakText
    .replace(/[\r\n|]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0)
  if (letters.length === 0) {
    return ''
  }
  if (letters.length === 1) {
    return letters[0]
  }
  return letters.map(l => `${l.replace(/\.+$/g, '')}.`).join(' ')
}

export type SpeedRacerRecapInput = {
  /** Phrase already respects Spell (whole word, or period-paced letters when Spell is on). */
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
  /** Stop browser TTS while recap speech is in flight (pause/stop/Voice-off). */
  cancelSpeech: () => void
  onComplete: () => void
  schedule?: typeof setTimeout
  /** How often to re-check token/Voice while speech is pending (ms). */
  cancelPollMs?: number
}

/** One TTS utterance for the card (Spell on or off), matching normal voice trail pacing. */
export function runSpeedRacerRecap (input: SpeedRacerRecapInput): void {
  const schedule = input.schedule ?? setTimeout
  const cancelPollMs = input.cancelPollMs ?? 50
  let speechPending = false
  let cancelled = false
  let watchScheduled = false

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

  const cancelInFlightSpeech = () => {
    if (!speechPending || cancelled) {
      return
    }
    cancelled = true
    speechPending = false
    watchScheduled = false
    input.cancelSpeech()
    // Voice-off while still playing: advance past recap without waiting for TTS end.
    // Pause/stop (token/playing inactive): do not call onComplete.
    if (playbackActive() && !input.isVoiceEnabled()) {
      skipSpeechAndComplete()
    }
  }

  const watchForCancel = () => {
    if (!speechPending || cancelled || watchScheduled) {
      return
    }
    watchScheduled = true
    schedule(() => {
      watchScheduled = false
      if (!speechPending || cancelled) {
        return
      }
      if (!playbackActive() || !input.isVoiceEnabled()) {
        cancelInFlightSpeech()
        return
      }
      watchForCancel()
    }, cancelPollMs)
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
    speechPending = true
    cancelled = false
    watchForCancel()
    input.speakPhrase(phrase, () => {
      speechPending = false
      watchScheduled = false
      if (cancelled || !playbackActive()) {
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
