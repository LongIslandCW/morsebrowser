// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CardBufferManager } from '../../../src/morse/utils/cardBufferManager'
import {
  computeNeedToSpeak,
  computeNoDelays,
  computeRacerRecapOn,
  runSpeedRacerRecap,
  shouldSkipVoiceBufferForRacer,
  voiceThinkingDelayMs
} from '../../../src/morse/voice/voicePlayback'

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

describe('computeNoDelays', () => {
  it('is false when voice timing should run', () => {
    expect(computeNoDelays(true, false)).toBe(false)
  })

  it('is false when trail timing should run', () => {
    expect(computeNoDelays(false, true)).toBe(false)
  })

  it('is true when neither voice nor trail delays apply', () => {
    expect(computeNoDelays(false, false)).toBe(true)
  })

  it('stays false during Speed Racer when voice is due after the card finishes', () => {
    expect(computeNoDelays(true, false)).toBe(false)
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
      displayWord: 'CQ',
      speakText: 'CQ',
      interLetterMs: 400,
      preRecapMs: 800,
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

  it('speaks letter by letter when Spell is on', () => {
    const spoken: string[] = []
    const onComplete = vi.fn()

    runSpeedRacerRecap({
      getSpelling: () => true,
      displayWord: 'AB',
      speakText: 'AB',
      interLetterMs: 100,
      preRecapMs: 50,
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

  it('aborts when token changes mid-recap', () => {
    let token = 1
    const onComplete = vi.fn()

    runSpeedRacerRecap({
      getSpelling: () => true,
      displayWord: 'AB',
      speakText: 'AB',
      interLetterMs: 100,
      preRecapMs: 50,
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

  it('aborts when Voice is toggled off mid-recap', () => {
    let voiceOn = true
    const onComplete = vi.fn()

    runSpeedRacerRecap({
      getSpelling: () => true,
      displayWord: 'AB',
      speakText: 'AB',
      interLetterMs: 100,
      preRecapMs: 50,
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
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('switches to whole word when Spell is toggled off mid-recap', () => {
    let spelling = true
    const spoken: string[] = []
    const onComplete = vi.fn()

    runSpeedRacerRecap({
      getSpelling: () => spelling,
      displayWord: 'AB',
      speakText: 'AB',
      interLetterMs: 100,
      preRecapMs: 50,
      token: 1,
      getToken: () => 1,
      isPlaying: () => true,
      isVoiceEnabled: () => true,
      prepPhrase: (p) => p,
      speakPhrase: (phrase, onDone) => {
        spoken.push(phrase)
        spelling = false
        onDone()
      },
      onComplete
    })

    vi.runAllTimers()
    expect(spoken).toEqual(['A\n', 'AB'])
    expect(onComplete).toHaveBeenCalledOnce()
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
