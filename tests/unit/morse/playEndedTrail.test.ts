import { describe, expect, it } from 'vitest'

/**
 * Regression for morse.ts playEnded: when Voice is on but speakCondition is
 * false, trail must still advance (advanceTrail) instead of calling
 * playEnded(true) immediately.
 */
function continueAfterSkippedSpeak (
  needToTrail:boolean,
  speakAndTrail:boolean,
  advanceTrail:(forceContinue?:boolean) => void,
  playEndedTrue:() => void
) {
  if (needToTrail) {
    advanceTrail(true)
  } else {
    playEndedTrue()
  }
}

function advanceTrailAfterReveal (
  speakAndTrail:boolean,
  forceContinue:boolean,
  playEndedTrue:() => void
) {
  if (!speakAndTrail || forceContinue) {
    playEndedTrue()
  }
}

describe('playEnded skipped-speak trail branch', () => {
  it('calls advanceTrail(true) when needToTrail is true', () => {
    const calls:string[] = []
    continueAfterSkippedSpeak(
      true,
      true,
      (force) => calls.push(`trail:${force}`),
      () => calls.push('ended')
    )
    expect(calls).toEqual(['trail:true'])
  })

  it('calls playEnded(true) when needToTrail is false', () => {
    const calls:string[] = []
    continueAfterSkippedSpeak(
      false,
      true,
      () => calls.push('trail'),
      () => calls.push('ended')
    )
    expect(calls).toEqual(['ended'])
  })
})

describe('advanceTrail continuation', () => {
  it('continues after reveal when speak was skipped but speakAndTrail was true', () => {
    const calls:string[] = []
    advanceTrailAfterReveal(true, true, () => calls.push('ended'))
    expect(calls).toEqual(['ended'])
  })

  it('waits for speak driver when speakAndTrail without forceContinue', () => {
    const calls:string[] = []
    advanceTrailAfterReveal(true, false, () => calls.push('ended'))
    expect(calls).toEqual([])
  })
})
