import { describe, it } from 'vitest'
import WordInfo from '../../../src/morse/utils/wordInfo'
import MorseStringUtils from '../../../src/morse/utils/morseStringUtils'

describe('mask probe', () => {
  it('edges', () => {
    const cases = ['<BT>', '<BT> <AR>', 'CQ  DE', 'A B C', '{<BT>|break}', 'HELLO WORLD', 'CQ\nDE', '{A A A[   ] |A A A[   ] |1}', '{BT}|x}', '  X  Y  ']
    for (const c of cases) {
      const w = new WordInfo(c)
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(c), '=> disp', JSON.stringify(w.displayWord), 'mask', JSON.stringify(w.maskedDisplay), 'pieces', JSON.stringify(w.pieces))
    }
    // eslint-disable-next-line no-console
    console.log('repl BT', MorseStringUtils.doReplacements('<BT>'))
    const keep = new WordInfo('THE QUICK BROWN')
    // eslint-disable-next-line no-console
    console.log('keep', keep.maskedDisplay, 'vs old', 'X'.repeat(keep.displayWord.replace(/\r/g,'').replace(/\n/g,'').trim().length))
  })
})
