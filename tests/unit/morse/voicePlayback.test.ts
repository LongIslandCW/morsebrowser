// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CardBufferManager } from '../../../src/morse/utils/cardBufferManager'
import {
  applyLessonVoiceBaseline,
  buildLessonVoiceBaseline,
  computeAutoVoiceAllowed,
  computeNeedToSpeak,
  computeRacerRecapOn,
  isSpeedRacerActive,
  runSpeedRacerRecap,
  RECAP_LETTER_GAP_MS,
  shouldBypassManualVoiceForToggle,
  shouldShowManualVoiceRecapButton,
  shouldSkipVoiceBufferForRacer,
  spelledTokensFromVoiceText,
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

  it('is true during Speed Racer when Voice is on and Speak recap is off', () => {
    expect(computeNeedToSpeak({
      ...base,
      racerOn: true,
      speedRacerSpeakBeforeReplay: false
    })).toBe(true)
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
  it('skips when SR recap will speak', () => {
    expect(shouldSkipVoiceBufferForRacer(true, true, true)).toBe(true)
  })

  it('does not skip when Voice is off during SR', () => {
    expect(shouldSkipVoiceBufferForRacer(true, true, false)).toBe(false)
  })

  it('does not skip when Speak is off during SR', () => {
    expect(shouldSkipVoiceBufferForRacer(true, false, true)).toBe(false)
  })
})

describe('runSpeedRacerRecap', () => {
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
      getSpelling: () => false,
      speakText: 'CQ',
      speakTextSpelled: 'C Q \n',
      preSpeechMs: 0,
      letterGapMs: 400,
      postSpeechMs: 800,
      token: 1,
      getToken: () => 1,
      isPlaying: () => true,
      isVoiceEnabled: () => true,
      prepPhrase: (p) => p,
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

  it('speaks one letter at a time when Spell is on', () => {
    const spoken: string[] = []
    const onComplete = vi.fn()

    runSpeedRacerRecap({
      getSpelling: () => true,
      speakText: 'A B \n',
      speakTextSpelled: 'A B \n',
      preSpeechMs: 0,
      letterGapMs: 100,
      postSpeechMs: 50,
      token: 1,
      getToken: () => 1,
      isPlaying: () => true,
      isVoiceEnabled: () => true,
      prepPhrase: (p) => p,
      speakPhrase: (phrase, onDone) => {
        spoken.push(phrase)
        onDone()
      },
      onComplete
    })

    vi.runAllTimers()
    expect(spoken).toEqual(['A\n', 'B\n'])
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('spelledTokensFromVoiceText parses speakText(true) output', () => {
    expect(spelledTokensFromVoiceText('T I N \n')).toEqual(['T', 'I', 'N'])
    expect(spelledTokensFromVoiceText('R A R \n')).toEqual(['R', 'A', 'R'])
  })

  it('spells callsign-style groups like TIN and RAR, not as English words', () => {
    const spoken: string[] = []
    const onComplete = vi.fn()

    for (const word of ['TIN', 'RAR']) {
      const info = new WordInfo(word)
      runSpeedRacerRecap({
        getSpelling: () => true,
        speakText: info.speakText(true),
        speakTextSpelled: info.speakText(true),
        preSpeechMs: 0,
        letterGapMs: 100,
        postSpeechMs: 50,
        token: 1,
        getToken: () => 1,
        isPlaying: () => true,
        isVoiceEnabled: () => true,
        prepPhrase: (p) => p,
        speakPhrase: (phrase, onDone) => {
          spoken.push(phrase)
          onDone()
        },
        onComplete
      })
      vi.runAllTimers()
    }

    expect(spoken).toEqual(['T\n', 'I\n', 'N\n', 'R\n', 'A\n', 'R\n'])
    expect(onComplete).toHaveBeenCalledTimes(2)
  })

  it('aborts when token changes mid-recap', () => {
    let token = 1
    const onComplete = vi.fn()

    runSpeedRacerRecap({
      getSpelling: () => true,
      speakText: 'A B \n',
      speakTextSpelled: 'A B \n',
      preSpeechMs: 0,
      letterGapMs: 100,
      postSpeechMs: 50,
      token: 1,
      getToken: () => token,
      isPlaying: () => true,
      isVoiceEnabled: () => true,
      prepPhrase: (p) => p,
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
      getSpelling: () => true,
      speakText: 'A B \n',
      speakTextSpelled: 'A B \n',
      preSpeechMs: 0,
      letterGapMs: 100,
      postSpeechMs: 50,
      token: 1,
      getToken: () => 1,
      isPlaying: () => true,
      isVoiceEnabled: () => voiceOn,
      prepPhrase: (p) => p,
      speakPhrase: (_phrase, onDone) => {
        voiceOn = false
        onDone()
      },
      onComplete
    })

    vi.runAllTimers()
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('applies pre/post delays once around spelled recap, not per letter', () => {
    const onComplete = vi.fn()
    let spoken = 0

    runSpeedRacerRecap({
      getSpelling: () => true,
      speakText: 'A B C \n',
      speakTextSpelled: 'A B C \n',
      preSpeechMs: 1000,
      letterGapMs: 50,
      postSpeechMs: 2000,
      token: 1,
      getToken: () => 1,
      isPlaying: () => true,
      isVoiceEnabled: () => true,
      prepPhrase: (p) => p,
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

    vi.advanceTimersByTime(50)
    expect(spoken).toBe(2)

    vi.advanceTimersByTime(50)
    expect(spoken).toBe(3)

    vi.advanceTimersByTime(50)
    vi.advanceTimersByTime(1999)
    expect(onComplete).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('uses RECAP_LETTER_GAP_MS default for letter spacing', () => {
    expect(RECAP_LETTER_GAP_MS).toBe(400)
  })
})

describe('lesson voice baseline (Speed Racer off restore)', () => {
  it('buildLessonVoiceBaseline snapshots voice and Arm Recap', () => {
    expect(buildLessonVoiceBaseline(true, true)).toEqual({
      voiceEnabled: true,
      manualVoice: true
    })
  })

  it('applyLessonVoiceBaseline restores preset voice state', () => {
    let voiceEnabled = false
    let manualVoice = false
    applyLessonVoiceBaseline(
      { voiceEnabled: true, manualVoice: true },
      (v) => { voiceEnabled = v },
      (v) => { manualVoice = v }
    )
    expect(voiceEnabled).toBe(true)
    expect(manualVoice).toBe(true)
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

  it('keeps needToSpeak false until the last subpart of a multi-word card', () => {
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

    expect(speakFlags).toEqual([false, true])
  })
})
