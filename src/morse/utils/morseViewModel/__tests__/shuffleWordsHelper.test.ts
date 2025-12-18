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
      expect(result.newText.split(' ')).toEqual(['B', 'C', 'A'])
      expect(result.lastShuffled).toBe(result.newText)
    })
  })

  it('honors newline join when newlineChunking is true and raw contains newlines', () => {
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
})
