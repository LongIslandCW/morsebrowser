import { shuffleWordsLogic } from '../shuffleWordsHelper'
import WordInfo from '../../wordInfo'

type WordStub = Pick<WordInfo, 'rawWord' | 'getGroupId'>

const makeWord = (rawWord:string, groupId:number | null):WordStub => ({
  rawWord,
  getGroupId: () => groupId
})

// deterministic shuffle by controlling Math.random sequence
const withMockedRandom = (values:number[], fn:() => void) => {
  const original = Math.random
  let idx = 0
  Math.random = () => {
    const v = values[idx] ?? values[values.length - 1] ?? 0
    idx++
    return v
  }
  try {
    fn()
  } finally {
    Math.random = original
  }
}

describe('shuffleWordsLogic', () => {
  it('shuffles ungrouped words (space join)', () => {
    // Scenario: three words with no group. Expect the order to change after shuffle.
    const words = [
      makeWord('A', null),
      makeWord('B', null),
      makeWord('C', null)
    ] as WordInfo[]

    const input = {
      words,
      rawText: 'A B C',
      wasShuffled: false,
      fromLoopRestart: false,
      newlineChunking: false,
      shuffleIntraGroup: false,
      preShuffled: ''
    }

    withMockedRandom([0.9, 0.1], () => {
      const result = shuffleWordsLogic(input)
      expect(result.isShuffled).toBe(true)
      expect(result.preShuffled).toBe('A B C')
      // With mocked random, order should change deterministically
      expect(result.newText.split(' ')).toEqual(['B', 'A', 'C'])
      expect(result.lastShuffled).toBe(result.newText)
    })
  })

  it('honors newline join when newlineChunking is true and raw contains newlines', () => {
    // Scenario: two words separated by a newline and newlineChunking enabled.
    // Expect shuffled output to keep using newline separators (not spaces).
    const words = [makeWord('X', null), makeWord('Y', null)] as WordInfo[]
    const input = {
      words,
      rawText: 'X\nY',
      wasShuffled: false,
      fromLoopRestart: false,
      newlineChunking: true,
      shuffleIntraGroup: false,
      preShuffled: ''
    }
    withMockedRandom([0.2], () => {
      const result = shuffleWordsLogic(input)
      expect(result.newText.includes('\n')).toBe(true)
    })
  })

  it('keeps grouped blocks intact when shuffleIntraGroup is false', () => {
    // Scenario: mix of ungrouped words and two groups: [B,C] and [E,F].
    // Expect each group to stay together and in order (B then C, E then F),
    // even though the groups and ungrouped words move around.
    const words = [
      makeWord('A', null),
      makeWord('B', 1),
      makeWord('C', 1),
      makeWord('D', null),
      makeWord('E', 2),
      makeWord('F', 2),
      makeWord('G', null)
    ] as WordInfo[]

    const input = {
      words,
      rawText: 'A B C D E F G',
      wasShuffled: false,
      fromLoopRestart: false,
      newlineChunking: false,
      shuffleIntraGroup: false,
      preShuffled: ''
    }

    withMockedRandom([0.9, 0.1, 0.8, 0.3], () => {
      const result = shuffleWordsLogic(input)
      const parts = result.newText.split(' ')
      // grouped block for group 1 must appear as ['B','C']
      expect(parts.join(' ')).toMatch(/B C/)
      // grouped block for group 2 must appear as ['E','F']
      expect(parts.join(' ')).toMatch(/E F/)
      // order of groups/ungrouped can change, but blocks stay intact
      const joined = parts.join(' ')
      expect(joined.includes('B C')).toBe(true)
      expect(joined.includes('E F')).toBe(true)
    })
  })

  it('shuffles within grouped blocks when shuffleIntraGroup is true', () => {
    // Scenario: two groups only: [B,C] and [E,F], with intra-group shuffling enabled.
    // Expect each group to stay together, but the order inside each group can change.
    const words = [
      makeWord('B', 1),
      makeWord('C', 1),
      makeWord('E', 2),
      makeWord('F', 2)
    ] as WordInfo[]

    const input = {
      words,
      rawText: 'B C E F',
      wasShuffled: false,
      fromLoopRestart: false,
      newlineChunking: false,
      shuffleIntraGroup: true,
      preShuffled: ''
    }

    // First random controls outer order, next controls intra-group for group 1, next for group 2
    withMockedRandom([0.1, 0.9, 0.2], () => {
      const result = shuffleWordsLogic(input)
      const parts = result.newText.split(' ')
      const joined = parts.join(' ')
      // Group 1 (B,C) may be shuffled internally
      expect(joined.includes('B C') || joined.includes('C B')).toBe(true)
      // Group 2 (E,F) may be shuffled internally
      expect(joined.includes('E F') || joined.includes('F E')).toBe(true)
      // Blocks remain contiguous even if internally shuffled
      expect(joined).toMatch(/(B C|C B)/)
      expect(joined).toMatch(/(E F|F E)/)
    })
  })

  it('unshuffle path restores preShuffled and toggles isShuffled to false', () => {
    // Scenario: already shuffled state; user toggles shuffle off.
    // Expect to get back the original preShuffled text and mark isShuffled as false.
    const input = {
      words: [],
      rawText: 'ignored',
      wasShuffled: true,
      fromLoopRestart: false,
      newlineChunking: false,
      shuffleIntraGroup: false,
      preShuffled: 'ORIGINAL'
    }

    const result = shuffleWordsLogic(input)
    expect(result.isShuffled).toBe(false)
    expect(result.newText).toBe('ORIGINAL')
  })

  it('shuffles large grouped sample with groups kept intact (no intra-group shuffling)', () => {
    // Scenario: 10 groups of 3 words each. shuffleIntraGroup=false means:
    // - each group must stay together, in original internal order
    // - groups can move relative to each other
    // We allow natural randomness; to avoid a no-op shuffle we try up to 5 times.

    const groups = Array.from({ length: 10 }, (_, gi) =>
      Array.from({ length: 3 }, (_, wi) => makeWord(`G${gi + 1}-${wi + 1}`, gi + 1))
    )
    const words = groups.flat() as WordInfo[]
    const rawText = words.map(w => w.rawWord).join(' ')
    const groupOf = Object.fromEntries(words.map(w => [w.rawWord, w.getGroupId()]))

    const assertBlocks = (parts:string[]) => {
      // Ensure each block is contiguous and in original internal order.
      let currentGroup = parts.length ? groupOf[parts[0]] : null
      let positionInGroup = 1
      for (const part of parts) {
        const gid = groupOf[part]
        if (gid !== currentGroup) {
          // starting a new group
          currentGroup = gid
          positionInGroup = 1
        }
        // internal order must be 1,2,3 for each group
        const expectedLabel = `G${gid}-${positionInGroup}`
        expect(part).toBe(expectedLabel)
        positionInGroup++
      }
    }

    let changed = false
    for (let attempt = 0; attempt < 5 && !changed; attempt++) {
      const result = shuffleWordsLogic({
        words,
        rawText,
        wasShuffled: false,
        fromLoopRestart: false,
        newlineChunking: false,
        shuffleIntraGroup: false,
        preShuffled: ''
      })
      const parts = result.newText.split(' ')
      assertBlocks(parts)
      if (result.newText !== rawText) {
        changed = true
      }
    }
    expect(changed).toBe(true)
  })

  it('shuffles large grouped sample with groups intact but internal order randomized when enabled', () => {
    // Scenario: 10 groups of 3 words each, shuffleIntraGroup=true means:
    // - each group stays together (contiguous)
    // - internal order of words in a group can change
    // We allow natural randomness and try up to 5 times to observe a change.

    const groups = Array.from({ length: 10 }, (_, gi) =>
      Array.from({ length: 3 }, (_, wi) => makeWord(`G${gi + 1}-${wi + 1}`, gi + 1))
    )
    const words = groups.flat() as WordInfo[]
    const rawText = words.map(w => w.rawWord).join(' ')
    const groupOf = Object.fromEntries(words.map(w => [w.rawWord, w.getGroupId()]))

    const assertBlocks = (parts:string[]) => {
      // Ensure blocks are contiguous and contain exactly the three members of a group.
      let idx = 0
      while (idx < parts.length) {
        const gid = groupOf[parts[idx]]
        const block:string[] = []
        while (idx < parts.length && groupOf[parts[idx]] === gid) {
          block.push(parts[idx])
          idx++
        }
        block.sort() // normalize for membership check
        expect(block).toEqual([`G${gid}-1`, `G${gid}-2`, `G${gid}-3`].sort())
      }
    }

    let changed = false
    for (let attempt = 0; attempt < 5 && !changed; attempt++) {
      const result = shuffleWordsLogic({
        words,
        rawText,
        wasShuffled: false,
        fromLoopRestart: false,
        newlineChunking: false,
        shuffleIntraGroup: true,
        preShuffled: ''
      })
      const parts = result.newText.split(' ')
      assertBlocks(parts)
      if (result.newText !== rawText) {
        changed = true
      }
    }
    expect(changed).toBe(true)
  })
})
