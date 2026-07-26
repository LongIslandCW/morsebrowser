import { describe, expect, it } from 'vitest'
import WordInfo from '../../../src/morse/utils/wordInfo'

describe('WordInfo.maskedDisplay', () => {
  it('matches letter count for a plain word', () => {
    expect(new WordInfo('AFTER').maskedDisplay).toBe('XXXXX')
  })

  it('ignores spaces so Sending letter drills match letter count', () => {
    expect(new WordInfo('{A A A[   ] |A A A[   ] |1}').maskedDisplay).toBe('XXX')
    expect(new WordInfo('{ANY[    ] |ANY[    ] |1}').maskedDisplay).toBe('XXX')
    expect(new WordInfo('{AFTER[       ] |AFTER[       ] |1}').maskedDisplay).toBe('XXXXX')
  })

  it('keeps a space between words on multi-word cards', () => {
    expect(new WordInfo('CQ DE').maskedDisplay).toBe('XX XX')
  })
})
