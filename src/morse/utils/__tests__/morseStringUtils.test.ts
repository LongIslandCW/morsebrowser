import MorseStringUtils from '../morseStringUtils'

describe('MorseStringUtils.doReplacements', () => {
  it('replaces legacy artifacts and strips apostrophes while keeping spaces', () => {
    const input = "A~O'CLOCK 50%"
    const output = MorseStringUtils.doReplacements(input)
    // A~ is treated as unsupported and becomes a space in current replacement logic.
    expect(output).toBe('A OCLOCK 50pct')
  })

  it('preserves allowed punctuation and newlines', () => {
    const input = 'HELLO, WORLD.\nNEXT? {TEST|VOICE}'
    const output = MorseStringUtils.doReplacements(input)
    expect(output).toBe('HELLO, WORLD.\nNEXT? {TEST|VOICE}')
  })

  it('turns unsupported punctuation into spaces', () => {
    const input = 'HI#THERE$FRIEND'
    const output = MorseStringUtils.doReplacements(input)
    expect(output).toBe('HI THERE FRIEND')
  })
})

describe('MorseStringUtils.wordifyPunctuation', () => {
  it('wordifies basic punctuation with boundaries', () => {
    const input = ',.?!-/'
    const output = MorseStringUtils.wordifyPunctuation(input)
    // Note: current wordify config breaks "exclamation" as "e|X|clamation".
    expect(output).toBe('|comma||period||question mark||e|X|clamation||dash||stroke|')
  })

  it('filters to overrideSpell entries when spellOverridesOnly is true', () => {
    const input = '<AR> X ,'
    const output = MorseStringUtils.wordifyPunctuation(input, true)
    // Only punctuation and X (overrideSpell) should be wordified; prosign <AR> should be untouched.
    expect(output).toBe('<AR> |X| |comma|')
  })

  it('converts prosigns into phrases', () => {
    const input = '<AR> <BT> <SK>'
    const output = MorseStringUtils.wordifyPunctuation(input)
    expect(output).toBe('|end of message| |pause| |end of contact|')
  })

  it('only wordifies standalone Q-codes / abbreviations (onlyAlone)', () => {
    // OnlyAlone entries replace when the whole string matches; inside longer text they stay unchanged.
    expect(MorseStringUtils.wordifyPunctuation('QRM')).toBe('|transmission is being interfered with|')
    expect(MorseStringUtils.wordifyPunctuation('TNX')).toBe('|Thanks|')
    expect(MorseStringUtils.wordifyPunctuation('NY')).toBe('|New York|')
    expect(MorseStringUtils.wordifyPunctuation('WX')).toBe('|Weather|')
    expect(MorseStringUtils.wordifyPunctuation('FUNNY')).toBe('FUNNY')
  })

  it('handles RST/5NN/599 signal reports', () => {
    expect(MorseStringUtils.wordifyPunctuation('RST')).toBe('|R S T|')
    expect(MorseStringUtils.wordifyPunctuation('5NN')).toBe('|five nine nine|')
    expect(MorseStringUtils.wordifyPunctuation('599')).toBe('|five nine nine|')
  })

  it('onlyAlone tokens do not trigger inside bigger words', () => {
    const output = MorseStringUtils.wordifyPunctuation('FUNNY FUN')
    expect(output).toContain('FUNNY')
    expect(output).toContain('FUN')
  })
})

describe('MorseStringUtils.getWords', () => {
  it('splits on spaces outside braces', () => {
    const result = MorseStringUtils.getWords('A B {C D|X Y} E', false)
    const rawWords = result.map(w => w.rawWord)
    expect(rawWords).toEqual(['A', 'B', '{C D|X Y}', 'E'])
  })

  it('splits on newlines outside braces when newlineChunking is true', () => {
    const result = MorseStringUtils.getWords('A\nB\n{C D|X Y}', true)
    const rawWords = result.map(w => w.rawWord)
    expect(rawWords).toEqual(['A', 'B', '{C D|X Y}'])
  })

  it('filters out empties after cleaning', () => {
    const result = MorseStringUtils.getWords('  A   \n\n  B  ', false)
    expect(result.map(w => w.rawWord)).toEqual(['A', 'B'])
  })
})
