// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CardBufferManager } from '../../../src/morse/utils/cardBufferManager'
import {
  computeNeedToTrail,
  runAdvanceTrail,
  runFinalizeTrail,
  trailDelayMs
} from '../../../src/morse/trail/trailPlayback'

describe('computeNeedToTrail', () => {
  const base = {
    racerOn: false,
    trailReveal: true,
    fromVoiceOrTrail: false,
    hasMoreMorse: false
  }

  it('is true when trail is on and the card has finished playing', () => {
    expect(computeNeedToTrail(base)).toBe(true)
  })

  it('is false while the card still has morse subparts (repeats or multi-word)', () => {
    expect(computeNeedToTrail({ ...base, hasMoreMorse: true })).toBe(false)
  })

  it('is false during Speed Racer', () => {
    expect(computeNeedToTrail({ ...base, racerOn: true })).toBe(false)
  })

  it('is false when trail is off', () => {
    expect(computeNeedToTrail({ ...base, trailReveal: false })).toBe(false)
  })

  it('is false when called from voice or trail continuation', () => {
    expect(computeNeedToTrail({ ...base, fromVoiceOrTrail: true })).toBe(false)
  })
})

describe('trailDelayMs', () => {
  it('converts seconds to milliseconds', () => {
    expect(trailDelayMs(2)).toBe(2000)
    expect(trailDelayMs('1.5')).toBe(1500)
  })

  it('returns zero for invalid values', () => {
    expect(trailDelayMs('')).toBe(0)
    expect(trailDelayMs('abc')).toBe(0)
    expect(trailDelayMs(-1)).toBe(0)
  })
})

describe('runAdvanceTrail', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits pre and post delays before reveal and continue', () => {
    const events:string[] = []
    runAdvanceTrail({
      preDelaySec: 2,
      postDelaySec: 3,
      speakAndTrail: false,
      onReveal: () => events.push('reveal'),
      onContinue: () => events.push('continue')
    })

    expect(events).toEqual([])
    vi.advanceTimersByTime(1999)
    expect(events).toEqual([])
    vi.advanceTimersByTime(1)
    expect(events).toEqual(['reveal'])
    vi.advanceTimersByTime(2999)
    expect(events).toEqual(['reveal'])
    vi.advanceTimersByTime(1)
    expect(events).toEqual(['reveal', 'continue'])
  })

  it('uses zero pre and post delays when voice is driving trail', () => {
    const events:string[] = []
    runAdvanceTrail({
      preDelaySec: 2,
      postDelaySec: 3,
      speakAndTrail: true,
      onReveal: () => events.push('reveal'),
      onContinue: () => events.push('continue')
    })

    vi.runAllTimers()
    expect(events).toEqual(['reveal', 'continue'])
  })
})

describe('runFinalizeTrail', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits the final delay before running the callback', () => {
    const events:string[] = []
    runFinalizeTrail({
      finalDelaySec: 1.5,
      onDone: () => events.push('done')
    })

    vi.advanceTimersByTime(1499)
    expect(events).toEqual([])
    vi.advanceTimersByTime(1)
    expect(events).toEqual(['done'])
  })
})

describe('CardBufferManager trail gating', () => {
  function createBufferManager (displayWord = 'CQ DE') {
    return new CardBufferManager(
      () => 0,
      () => [{ displayWord, speakText: () => displayWord } as never]
    )
  }

  it('keeps needToTrail false until the last subpart of a multi-word card', () => {
    const mgr = createBufferManager('CQ DE')
    const trailFlags:boolean[] = []

    let next = mgr.getNextMorse(0, 0)
    while (next !== undefined) {
      trailFlags.push(computeNeedToTrail({
        racerOn: false,
        trailReveal: true,
        fromVoiceOrTrail: false,
        hasMoreMorse: mgr.hasMoreMorse()
      }))
      if (!mgr.hasMoreMorse()) {
        break
      }
      next = mgr.getNextMorse(0, 0)
    }

    expect(trailFlags).toEqual([false, true])
  })

  it('keeps needToTrail false until the last repeat', () => {
    const mgr = createBufferManager('A')
    const trailFlags:boolean[] = []

    let next = mgr.getNextMorse(3, 0)
    while (next !== undefined) {
      trailFlags.push(computeNeedToTrail({
        racerOn: false,
        trailReveal: true,
        fromVoiceOrTrail: false,
        hasMoreMorse: mgr.hasMoreMorse()
      }))
      if (!mgr.hasMoreMorse()) {
        break
      }
      next = mgr.getNextMorse(3, 0)
    }

    expect(trailFlags).toEqual([false, false, true])
  })
})
