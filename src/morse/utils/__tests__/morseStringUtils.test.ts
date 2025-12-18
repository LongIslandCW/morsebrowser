import MorseStringUtils from '../morseStringUtils'

describe('MorseStringUtils.doReplacements', () => {
  it('replaces legacy artifacts and strips apostrophes while keeping spaces', () => {
    const input = "A~O'CLOCK 50%"
    const output = MorseStringUtils.doReplacements(input)
    expect(output).toBe('0OCLOCK 50pct')
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
    expect(output).toBe('|comma||period||question mark||exclamation||dash||stroke|')
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
    const input = 'QRM TNX NY WX FUNNY'
    const output = MorseStringUtils.wordifyPunctuation(input)
    // NY and WX should wordify; FUNNY should not trigger NY.
    expect(output).toContain('|transmission is being interfered with|')
    expect(output).toContain('|Thanks|')
    expect(output).toContain('|New York|')
    expect(output).toContain('|weather|')
    expect(output).toContain('FUNNY')
  })

  it('handles RST/5NN/599 signal reports', () => {
    const output = MorseStringUtils.wordifyPunctuation('RST 5NN 599')
    expect(output).toBe('|R S T| |five nine nine| |five nine nine|')
  })

  it('onlyAlone tokens do not trigger inside bigger words', () => {
    const output = MorseStringUtils.wordifyPunctuation('FUNNY FUN')
    expect(output).toContain('FUNNY')
    expect(output).toContain('FUN')
  })
})
