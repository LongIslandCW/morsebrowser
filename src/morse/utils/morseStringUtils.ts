import { setMaxListeners } from 'process'
import wordifiers from '../../configs/wordify.json'
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
    // in the square brackets we add all symbols supported by morse-pro (see more-pro.js), otherwise replace with space
    // note we will preserve \r and \n for voice which uses these are phrase delimiters
    // eslint-disable-next-line no-useless-escape
      .replace(/(?![\|\{\}\.\,\:\?\\\-\/\(\)\"\@\=\&\+\!\<\>\r\n])\W/g, ' ')
    return afterReplaced
  }

  static getWords = (s:string, newlineChunking:boolean) => {
    const words = newlineChunking
      ? this.doReplacements(s).split(/\n(?![^{]*})/)
      : this.doReplacements(s).split(/ (?![^{]*})/)
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
    let wordifiersApplicable
    if (!spellOverridesOnly) {
      wordifiersApplicable = wordifiers.wordifications
    } else {
      wordifiersApplicable = wordifiers.wordifications.filter(f => f.overrideSpell)
    }
    let fixed = s.replace(/\r/g, '').replace(/\n/g, '')
    wordifiersApplicable.forEach(w => {
      let myChars = w.characters
      const before = w.characters
      myChars = myChars.replace(/\?/g, '\\?')
        .replace(/\./g, '\\.')
        .replace(/\//g, '\\/')
      /*  if (before === 'HW?') {
        console.log(myChars)
      } */
      const fakeSpace = '|'
      if (!w.onlyAlone) {
        /* if (myChars === '<AR>') {
          console.log(`mychars:${myChars}`)
          console.log(`fixed:${fixed}`)
        } */
        const myRegex = new RegExp(`${myChars}`, 'gi')
        fixed = fixed.replace(myRegex, `${fakeSpace}${w.replacement}${fakeSpace}`)
      } else {
        // console.log(`mychars:${myChars}`)
        // guard state abbreviations from being part of a prosign
        // not all browsers suppor this
        // const myRegex = new RegExp(`\\b(?<!<)${myChars}\\b`, 'gi')
        // fixed = fixed.replace(myRegex, ` ${w.replacement} `)
        // if (before === 'HW?') {
        //   console.log(`fixed:${fixed}`)
        // }

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
