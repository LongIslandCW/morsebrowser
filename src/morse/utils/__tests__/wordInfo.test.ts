import WordInfo from '../wordInfo'
import MorseStringUtils from '../morseStringUtils'

describe('WordInfo constructor and splitting', () => {
  it('splits on spaces outside braces', () => {
    const w = new WordInfo('A B C')
    expect(w.pieces).toEqual(['A', 'B', 'C'])
  })

  it('does not split on spaces inside braces', () => {
    const w = new WordInfo('{A B|X Y}')
    expect(w.pieces).toEqual(['{A B|X Y}'])
  })

  it('mixes brace and non-brace pieces', () => {
    const w = new WordInfo('A {B C|D E} F')
    expect(w.pieces).toEqual(['A', '{B C|D E}', 'F'])
  })
})

describe('WordInfo displayWord', () => {
  it('uses left side of override for display', () => {
    const w = new WordInfo('{DOG|d o g}')
    expect(w.displayWord).toBe('DOG')
  })

  it('runs doReplacements for non-override', () => {
    const input = "A%'B"
    const w = new WordInfo(input)
    // doReplacements turns % -> pct and strips apostrophes
    expect(w.displayWord).toBe(MorseStringUtils.doReplacements(input))
  })
})

describe('WordInfo speakText', () => {
  it('uses right side of override when not spelling', () => {
    const w = new WordInfo('{DOG|d o g}')
    expect(w.speakText(false).trim()).toBe('d o g')
  })

  it('spells left side of override when spelling', () => {
    const w = new WordInfo('{DOG|d o g}')
    expect(w.speakText(true).trim()).toBe('D O G')
  })

  it('wordifies punctuation when not spelling, spells it when spelling', () => {
    const w = new WordInfo('HELLO,')
    expect(w.speakText(false).trim()).toContain('comma')
    expect(w.speakText(true).trim()).toContain('H E L L O ,')
  })

  it('applies math E fix when spelling', () => {
    const w = new WordInfo('1 e 2')
    const spelled = w.speakText(true)
    expect(spelled).toContain('1 ,e, 2')
  })
})

describe('WordInfo groupId parsing', () => {
  it('returns null when no braces', () => {
    const w = new WordInfo('HELLO')
    expect(w.getGroupId()).toBeNull()
  })

  it('returns null for two-part override', () => {
    const w = new WordInfo('{HELLO|hi}')
    expect(w.getGroupId()).toBeNull()
  })

  it('parses integer for three-part override', () => {
    const w = new WordInfo('{HELLO|hi|3}')
    expect(w.getGroupId()).toBe(3)
  })

  it('returns null for non-numeric third part', () => {
    const w = new WordInfo('{HELLO|hi|X}')
    expect(w.getGroupId()).toBeNull()
  })
})
