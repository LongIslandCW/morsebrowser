import { describe, expect, it } from 'vitest'
import { CardBufferManager } from '../../../src/morse/utils/cardBufferManager'

function createBufferManager (displayWord = 'A') {
  return new CardBufferManager(
    () => 0,
    () => [{ displayWord, speakText: () => displayWord } as never]
  )
}

function shiftAudiblePlays (mgr:CardBufferManager, repeats:number, wordSpaces:number) {
  const indices:number[] = []
  // Mirrors doPlay: getNextMorse populates the buffer on first call.
  let next = mgr.getNextMorse(repeats, wordSpaces)
  while (next !== undefined) {
    if (next.length > 0) {
      indices.push(mgr.getRepeatState().index)
    }
    if (!mgr.hasMoreMorse()) {
      break
    }
    next = mgr.getNextMorse(repeats, wordSpaces)
  }
  return indices
}

describe('CardBufferManager Speed Racer repeat spacing', () => {
  it('does not leave a trailing wordspace after the last audible play', () => {
    const mgr = createBufferManager()
    shiftAudiblePlays(mgr, 5, 1)
    expect(mgr.hasMoreMorse()).toBe(false)
  })

  it('emits exactly one audible play index per Speed Racer slot', () => {
    const mgr = createBufferManager()
    const indices = shiftAudiblePlays(mgr, 5, 1)
    expect(indices).toEqual([0, 1, 2, 3, 4])
  })

  it('interleaves silent wordspace gaps between repeats only', () => {
    const mgr = createBufferManager()
    const words:string[] = []
    let next = mgr.getNextMorse(3, 1)
    while (next !== undefined) {
      words.push(next)
      if (!mgr.hasMoreMorse()) {
        break
      }
      next = mgr.getNextMorse(3, 1)
    }
    expect(words).toEqual(['A', '', 'A', '', 'A'])
  })
})

describe('CardBufferManager Speed Racer with a kept-together (Keep Lines) multi-word card', () => {
  it('gives every word of one pass the same Speed Racer step index', () => {
    const mgr = createBufferManager('THE QUICK FOX')
    const indices = shiftAudiblePlays(mgr, 5, 0)
    // 3 words per pass, 5 passes: each pass's words share one index.
    expect(indices).toEqual([0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4])
  })

  it('marks only the first and last word of each pass', () => {
    const mgr = createBufferManager('THE QUICK FOX')
    const flags:{first:boolean, last:boolean}[] = []
    let next = mgr.getNextMorse(2, 0)
    while (next !== undefined) {
      if (next.length > 0) {
        const state = mgr.getRepeatState()
        flags.push({ first: state.isFirstOfRepeat, last: state.isLastOfRepeat })
      }
      if (!mgr.hasMoreMorse()) {
        break
      }
      next = mgr.getNextMorse(2, 0)
    }
    expect(flags).toEqual([
      { first: true, last: false },
      { first: false, last: false },
      { first: false, last: true },
      { first: true, last: false },
      { first: false, last: false },
      { first: false, last: true }
    ])
  })

  it('still advances once per pass when the card has a trailing empty piece', () => {
    // Real word files commonly have a trailing space before an LF-only line
    // break, which WordInfo parses into a genuinely empty trailing piece
    // (e.g. "ITS BEEN A HEAT WAVE THIS LAST YEAR ") that never plays audibly
    // and must not be counted toward the per-pass word count.
    const mgr = createBufferManager('ITS BEEN A HEAT WAVE THIS LAST YEAR ')
    const indices = shiftAudiblePlays(mgr, 3, 0)
    expect(indices).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 1, 1, 1, 1, 1, 1,
      2, 2, 2, 2, 2, 2, 2, 2
    ])
  })
})
