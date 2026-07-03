// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CardBufferManager } from '../../../src/morse/utils/cardBufferManager'
import {
  applyLessonVoiceBaseline,
  buildLessonVoiceBaseline,
  computeAutoVoiceAllowed,
  computeNeedToSpeak,
  computeRacerRecapOn,
  formatSpelledRecapPhrase,
  isSpeedRacerActive,
  runSpeedRacerRecap,
  shouldBypassManualVoiceForToggle,
  shouldShowManualVoiceRecapButton,
  shouldSkipVoiceBufferForRacer,
  voiceThinkingDelayMs
} from '../../../src/morse/voice/voicePlayback'
import WordInfo from '../../../src/morse/utils/wordInfo'

describe('computeNeedToSpeak', () => {
  const base = {
    voiceEnabled: true,
    fromVoiceOrTrail: false,
    hasMoreMorse: false,
    maxBufferReached: true,
    speakFirst: false,
    racerOn: false,
    speedRacerSpeakBeforeReplay: true
  }

  it('is true when voice is on and the card has finished playing', () => {
    expect(computeNeedToSpeak(base)).toBe(true)
  })

  it('is false during Speed Racer when Speak recap is off (morse-only)', () => {
    expect(computeNeedToSpeak({
      ...base,
      racerOn: true,
      speedRacerSpeakBeforeReplay: false
    })).toBe(false)
  })

  it('is false during Speed Racer when Speak is off even if Voice is on', () => {
    expect(computeNeedToSpeak({
      ...base,
      racerOn: true,
      speedRacerSpeakBeforeReplay: false,
      voiceEnabled: true
    })).toBe(false)
  })

  it('is false during Speed Racer when Speak recap is on', () => {
    expect(computeNeedToSpeak({
      ...base,
      racerOn: true,
      speedRacerSpeakBeforeReplay: true
    })).toBe(false)
  })

  it('is false while the card still has morse subparts', () => {
    expect(computeNeedToSpeak({ ...base, hasMoreMorse: true })).toBe(false)
  })

  it('is false when voice is off', () => {
    expect(computeNeedToSpeak({ ...base, voiceEnabled: false })).toBe(false)
  })

  it('is false when called from voice or trail continuation', () => {
    expect(computeNeedToSpeak({ ...base, fromVoiceOrTrail: true })).toBe(false)
  })

  it('is false when speak first is on', () => {
    expect(computeNeedToSpeak({ ...base, speakFirst: true })).toBe(false)
  })
})

describe('computeRacerRecapOn', () => {
  it('requires racer, Speak, and Voice', () => {
    expect(computeRacerRecapOn({
      racerOn: true,
      speedRacerSpeakBeforeReplay: true,
      voiceEnabled: true
    })).toBe(true)
  })

  it('is false when Voice is off', () => {
    expect(computeRacerRecapOn({
      racerOn: true,
      speedRacerSpeakBeforeReplay: true,
      voiceEnabled: false
    })).toBe(false)
  })

  it('is false when Speak is off', () => {
    expect(computeRacerRecapOn({
      racerOn: true,
      speedRacerSpeakBeforeReplay: false,
      voiceEnabled: true
    })).toBe(false)
  })
})

describe('isSpeedRacerActive', () => {
  it('is false when Speed Racer is on but multipliers produce no plays', () => {
    expect(isSpeedRacerActive(true, 0)).toBe(false)
  })

  it('is true when Speed Racer is on with at least one play', () => {
    expect(isSpeedRacerActive(true, 3)).toBe(true)
  })
})

describe('voiceThinkingDelayMs', () => {
  it('converts seconds to milliseconds', () => {
    expect(voiceThinkingDelayMs(2)).toBe(2000)
    expect(voiceThinkingDelayMs('1.5')).toBe(1500)
  })

  it('returns zero for invalid values', () => {
    expect(voiceThinkingDelayMs('')).toBe(0)
    expect(voiceThinkingDelayMs('abc')).toBe(0)
    expect(voiceThinkingDelayMs(-1)).toBe(0)
  })
})

describe('shouldSkipVoiceBufferForRacer', () => {
  it('skips during Speed Racer regardless of Speak or Voice', () => {
    expect(shouldSkipVoiceBufferForRacer(true, true, true)).toBe(true)
    expect(shouldSkipVoiceBufferForRacer(true, true, false)).toBe(true)
    expect(shouldSkipVoiceBufferForRacer(true, false, true)).toBe(true)
    expect(shouldSkipVoiceBufferForRacer(true, false, false)).toBe(true)
  })

  it('does not skip when Speed Racer is off', () => {
    expect(shouldSkipVoiceBufferForRacer(false, true, true)).toBe(false)
  })
})

describe('formatSpelledRecapPhrase', () => {
  it('adds period pauses between letters for TTS', () => {
    expect(formatSpelledRecapPhrase('R E R')).toBe('R. E. R.')
    expect(formatSpelledRecapPhrase('R E R \n')).toBe('R. E. R.')
    expect(formatSpelledRecapPhrase(new WordInfo('RER').speakText(true))).toBe('R. E. R.')
  })

  it('leaves a single letter unchanged', () => {
    expect(formatSpelledRecapPhrase('A')).toBe('A')
  })

  it('returns empty for blank input', () => {
    expect(formatSpelledRecapPhrase('   ')).toBe('')
  })
})

describe('runSpeedRacerRecap', () => {
  const recapBase = () => ({
    preSpeechMs: 0,
    postSpeechMs: 50,
    token: 1,
    getToken: () => 1,
    isPlaying: () => true,
    isVoiceEnabled: () => true,
    prepPhrase: (p: string) => p,
    cancelSpeech: vi.fn()
  })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('speaks whole word when Spell is off', () => {
    const spoken: string[] = []
    const onComplete = vi.fn()

    runSpeedRacerRecap({
      ...recapBase(),
      speakText: 'CQ',
      postSpeechMs: 800,
      speakPhrase: (phrase, onDone) => {
        spoken.push(phrase)
        onDone()
      },
      onComplete
    })

    vi.runAllTimers()
    expect(spoken).toEqual(['CQ'])
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('speaks spelled phrase as a single utterance when Spell is on', () => {
    const spoken: string[] = []
    const onComplete = vi.fn()

    runSpeedRacerRecap({
      ...recapBase(),
      speakText: 'A B \n',
      speakPhrase: (phrase, onDone) => {
        spoken.push(phrase)
        onDone()
      },
      onComplete
    })

    vi.runAllTimers()
    expect(spoken).toEqual(['A B \n'])
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('spells callsign-style groups like TIN and RAR, not as English words', () => {
    const spoken: string[] = []
    const onComplete = vi.fn()

    for (const word of ['TIN', 'RAR']) {
      const info = new WordInfo(word)
      runSpeedRacerRecap({
        ...recapBase(),
        speakText: formatSpelledRecapPhrase(info.speakText(true)),
        speakPhrase: (phrase, onDone) => {
          spoken.push(phrase)
          onDone()
        },
        onComplete
      })
      vi.runAllTimers()
    }

    // Period-paced letters in one utterance, not "tin"/"rar" and not rushed "t i n".
    expect(spoken).toEqual(['T. I. N.', 'R. A. R.'])
    expect(onComplete).toHaveBeenCalledTimes(2)
  })

  it('aborts when token changes mid-recap', () => {
    let token = 1
    const onComplete = vi.fn()

    runSpeedRacerRecap({
      ...recapBase(),
      speakText: 'A B \n',
      getToken: () => token,
      speakPhrase: (_phrase, onDone) => {
        token = 2
        onDone()
      },
      onComplete
    })

    vi.runAllTimers()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('continues playback when Voice is toggled off mid-recap', () => {
    let voiceOn = true
    const onComplete = vi.fn()

    runSpeedRacerRecap({
      ...recapBase(),
      speakText: 'A B \n',
      isVoiceEnabled: () => voiceOn,
      speakPhrase: (_phrase, onDone) => {
        voiceOn = false
        onDone()
      },
      onComplete
    })

    vi.runAllTimers()
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('cancels in-flight speech when token changes while speakPhrase is pending', () => {
    let token = 1
    let pendingOnDone: (() => void) | undefined
    const cancelSpeech = vi.fn()
    const onComplete = vi.fn()

    runSpeedRacerRecap({
      ...recapBase(),
      speakText: 'R E R',
      getToken: () => token,
      cancelSpeech,
      cancelPollMs: 50,
      speakPhrase: (_phrase, onDone) => {
        pendingOnDone = onDone
      },
      onComplete
    })

    vi.advanceTimersByTime(0)
    expect(pendingOnDone).toBeTypeOf('function')
    expect(cancelSpeech).not.toHaveBeenCalled()

    token = 2
    vi.advanceTimersByTime(50)
    expect(cancelSpeech).toHaveBeenCalledOnce()
    expect(onComplete).not.toHaveBeenCalled()

    pendingOnDone!()
    vi.runAllTimers()
    expect(onComplete).not.toHaveBeenCalled()
    expect(cancelSpeech).toHaveBeenCalledOnce()
  })

  it('cancels in-flight speech when Voice turns off while speakPhrase is pending', () => {
    let voiceOn = true
    let pendingOnDone: (() => void) | undefined
    const cancelSpeech = vi.fn()
    const onComplete = vi.fn()

    runSpeedRacerRecap({
      ...recapBase(),
      speakText: 'R E R',
      isVoiceEnabled: () => voiceOn,
      cancelSpeech,
      cancelPollMs: 50,
      speakPhrase: (_phrase, onDone) => {
        pendingOnDone = onDone
      },
      onComplete
    })

    vi.advanceTimersByTime(0)
    expect(pendingOnDone).toBeTypeOf('function')

    voiceOn = false
    vi.advanceTimersByTime(50)
    expect(cancelSpeech).toHaveBeenCalledOnce()
    // Voice-off while still playing advances past recap immediately.
    expect(onComplete).toHaveBeenCalledOnce()

    // Late TTS end after cancel must not double-complete.
    pendingOnDone!()
    vi.runAllTimers()
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('applies pre/post delays once around recap', () => {
    const onComplete = vi.fn()
    let spoken = 0

    runSpeedRacerRecap({
      ...recapBase(),
      speakText: 'A B C \n',
      preSpeechMs: 1000,
      postSpeechMs: 2000,
      speakPhrase: (_phrase, onDone) => {
        spoken += 1
        onDone()
      },
      onComplete
    })

    expect(spoken).toBe(0)
    expect(onComplete).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    expect(spoken).toBe(1)

    vi.advanceTimersByTime(1999)
    expect(onComplete).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onComplete).toHaveBeenCalledOnce()
  })
})

describe('lesson voice baseline (Speed Racer off restore)', () => {
  it('buildLessonVoiceBaseline snapshots voice, Arm Recap, and Voice First', () => {
    expect(buildLessonVoiceBaseline(true, true, true)).toEqual({
      voiceEnabled: true,
      manualVoice: true,
      speakFirst: true
    })
  })

  it('applyLessonVoiceBaseline restores preset voice state', () => {
    let voiceEnabled = false
    let manualVoice = false
    let speakFirst = false
    applyLessonVoiceBaseline(
      { voiceEnabled: true, manualVoice: true, speakFirst: true },
      (v) => { voiceEnabled = v },
      (v) => { manualVoice = v },
      (v) => { speakFirst = v }
    )
    expect(voiceEnabled).toBe(true)
    expect(manualVoice).toBe(true)
    expect(speakFirst).toBe(true)
  })

  it('applyLessonVoiceBaseline restores speakFirst after voice was forced off', () => {
    let speakFirst = false
    applyLessonVoiceBaseline(
      { voiceEnabled: true, manualVoice: false, speakFirst: true },
      () => {},
      () => {},
      (v) => { speakFirst = v }
    )
    expect(speakFirst).toBe(true)
  })

  it('shouldBypassManualVoiceForToggle locks Voice again after SR + Speak turn off', () => {
    expect(shouldBypassManualVoiceForToggle(true, false, true)).toBe(false)
    expect(shouldBypassManualVoiceForToggle(true, true, true)).toBe(true)
  })
})

describe('shouldBypassManualVoiceForToggle', () => {
  it('locks the Voice toggle when Arm Recap is on and SR recap is off', () => {
    expect(shouldBypassManualVoiceForToggle(true, false, true)).toBe(false)
    expect(shouldBypassManualVoiceForToggle(true, true, false)).toBe(false)
  })

  it('unlocks the Voice toggle for BC1 Default + SR + Speak', () => {
    expect(shouldBypassManualVoiceForToggle(true, true, true)).toBe(true)
  })

  it('allows the toggle when Arm Recap is off', () => {
    expect(shouldBypassManualVoiceForToggle(false, false, false)).toBe(true)
  })
})

describe('computeAutoVoiceAllowed', () => {
  it('blocks automatic voice when Arm Recap is on during normal playback', () => {
    expect(computeAutoVoiceAllowed(true, false)).toBe(false)
  })

  it('allows automatic voice during Speed Racer even with Arm Recap preset', () => {
    expect(computeAutoVoiceAllowed(true, true)).toBe(true)
  })
})

describe('shouldShowManualVoiceRecapButton', () => {
  it('shows the manual recap button for Arm Recap presets', () => {
    expect(shouldShowManualVoiceRecapButton(true, true, false, true)).toBe(true)
  })

  it('hides the manual recap button when SR + Speak takes over', () => {
    expect(shouldShowManualVoiceRecapButton(true, true, true, true)).toBe(false)
  })
})

describe('CardBufferManager voice gating during Speed Racer', () => {
  function createBufferManager (displayWord = 'CQ DE') {
    return new CardBufferManager(
      () => 0,
      () => [{ displayWord, speakText: () => displayWord } as never]
    )
  }

  it('never triggers needToSpeak during morse-only Speed Racer', () => {
    const mgr = createBufferManager('CQ DE')
    const speakFlags: boolean[] = []

    let next = mgr.getNextMorse(0, 0)
    while (next !== undefined) {
      speakFlags.push(computeNeedToSpeak({
        voiceEnabled: true,
        fromVoiceOrTrail: false,
        hasMoreMorse: mgr.hasMoreMorse(),
        maxBufferReached: true,
        speakFirst: false,
        racerOn: true,
        speedRacerSpeakBeforeReplay: false
      }))
      if (!mgr.hasMoreMorse()) {
        break
      }
      next = mgr.getNextMorse(0, 0)
    }

    expect(speakFlags).toEqual([false, false])
  })
})
