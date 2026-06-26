import { describe, expect, it } from 'vitest'
import MorseStringUtils from '../../../src/morse/utils/morseStringUtils'

describe('MorseStringUtils', () => {
  describe('doReplacements', () => {
    it('replaces percent with pct', () => {
      expect(MorseStringUtils.doReplacements('100%')).toBe('100pct')
    })

    it('strips apostrophes', () => {
      expect(MorseStringUtils.doReplacements("it's")).toBe('its')
    })

    it('preserves supported punctuation', () => {
      expect(MorseStringUtils.doReplacements('A.B')).toContain('.')
    })
  })

  describe('getWords', () => {
    it('splits on spaces when newline chunking is off', () => {
      const words = MorseStringUtils.getWords('A B', false)
      expect(words.length).toBe(2)
    })

    it('splits on newlines when newline chunking is on', () => {
      const words = MorseStringUtils.getWords('A\nB', true)
      expect(words.length).toBe(2)
    })
  })

  describe('wordifyPunctuation', () => {
    it('returns string for plain text', () => {
      expect(MorseStringUtils.wordifyPunctuation('HELLO')).toBe('HELLO')
    })
  })
})
