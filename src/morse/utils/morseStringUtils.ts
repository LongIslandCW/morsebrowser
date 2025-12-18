import { setMaxListeners } from 'process'
// Use require to ensure JSON loads in all environments (ts-jest/node).
const wordifiers: { wordifications?: any[] } = require('../../configs/wordify.json')
import WordInfo from './wordInfo'
export default class MorseStringUtils {
  static doReplacements = (s:string):string => {
    const afterReplaced = s
    // a few ad-hoc attempts to fix unicode or other problems
    // weird slashed 0 Ø
      .replace(/Ø/g, '0')
    // seems like apostraphe is not morse-able
      .replace(/’/g, '')
      .replace(/‘/g, '')
      .replace(/'/g, '')
    // turn percent sign into pct abbreviation
      .replace(/%/g, 'pct')
    // Supported symbols (kept as-is): | { } . , : ? \ - / ( ) " @ = & + ! < > plus \r and \n for voice phrase breaks. Everything else (\W) becomes a space.
    // eslint-disable-next-line no-useless-escape
      .replace(/(?![\|\{\}\.\,\:\?\\\-\/\(\)\"\@\=\&\+\!\<\>\r\n])\W/g, ' ')
    return afterReplaced
  }

  static getWords = (s:string, newlineChunking:boolean) => {
    // Split on newlines or spaces that are NOT inside braces:
    // - newlineChunking: /\n(?![^{]*})/ splits on \n unless the \n is inside {...}
    // - otherwise: / (?![^{]*})/ splits on spaces unless the space is inside {...}
    const words = newlineChunking
      ? this.doReplacements(s).split(/\n(?![^{]*})/)
      : this.doReplacements(s).split(/ (?![^{]*})/)
    // Filter out empties: remove all whitespace (\s) and keep only non-blank strings.
    const wordInfos = words
      .filter(w => w.replace(/\s/g, '').length > 0)
      .map(w => {
        const wordInfo = new WordInfo(w)

        return wordInfo
      })
    const replaced:string = this.doReplacements(s)
    const hasNewLine = newlineChunking // sentence.indexOf('\n') !== -1
    // eslint-disable-next-line no-unused-vars
    const sents:string[] = replaced
      .trim()
    // remove double spaces
    // eslint-disable-next-line no-regex-spaces
      .replace(/  /g, ' ')
    // add spaces after newlines
      .replace(/\n/g, '\n ')
    // split up into words
      .split(hasNewLine ? '\n ' : ' ')
    // add back newline to the end of each for voice
      .map((word) => hasNewLine ? `${word}\n` : word)
    // get rid fo stray empties
      .filter(x => x.trim().length > 0)

    return wordInfos
  }

  static wordifyPunctuation = (s:string, spellOverridesOnly:boolean = false):string => {
    // Turns symbols/prosigns/abbreviations into speakable words for TTS using configs/wordify.json:
    // - Basic punctuation (`,` `.` `?` `/` `:` `!` `-` `X`) → words; these are included when spelling (overrideSpell).
    // - CW prosigns: <AR>/<BT>/<SK> → “end of message” / “pause” / “end of contact”.
    // - State/Canadian abbreviations only when they appear as-is (onlyAlone): e.g., AL→Alabama, BC→British Columbia, etc.
    // - Common ham abbreviations (onlyAlone): e.g., 599/5NN→“five nine nine”; CQ→“C Q”; K→“invitation to transmit”; QRM/QRN/QRZ/QTH/etc.; WX→weather; TNX/TKS→thanks; TU→thank you.
    // - Units/other tokens (onlyAlone): C→celsius, F→Fahrenheit, T→zero, W→Watts, WPM→words per minute, RST→“R S T”, Temp→Temperature, AM→A M.
    // Replacements are wrapped with “|” to mark word boundaries for downstream processing.
    let wordifiersApplicable
    const wordifiersList = wordifiers?.wordifications ?? []
    if (!spellOverridesOnly) {
      wordifiersApplicable = wordifiersList
    } else {
      wordifiersApplicable = wordifiersList.filter(f => f.overrideSpell)
    }
    let fixed = s.replace(/\r/g, '').replace(/\n/g, '')
    wordifiersApplicable.forEach(w => {
      let myChars = w.characters
      const before = w.characters
      myChars = myChars.replace(/\?/g, '\\?')
        .replace(/\./g, '\\.')
        .replace(/\//g, '\\/')
      const fakeSpace = '|'
      if (!w.onlyAlone) {
        const myRegex = new RegExp(`${myChars}`, 'gi')
        fixed = fixed.replace(myRegex, `${fakeSpace}${w.replacement}${fakeSpace}`)
      } else {
        // TODO: for now we ignore multiline/spaces
        if (before.length === fixed.length) {
          const myRegex = new RegExp(`${myChars}`, 'gi')
          fixed = fixed.replace(myRegex, `${fakeSpace}${w.replacement}${fakeSpace}`)
        }
      }
    })
    return fixed
  }
}
