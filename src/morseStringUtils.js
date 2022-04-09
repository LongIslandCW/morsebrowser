export default class MorseStringUtils {
    static doReplacements = (s) => {
      return s
        // replacing exclamation with period
        .replace(/!/g, '.')
        // a few ad-hoc attempts to remove rare or non-morse characters
        .replace(/'/g, '')
        .replace(/’/g, '')
        .replace(/‘/g, '')
        // colon becomes a comma
        .replace(/:/g, ',')
        // turn percent sign into pct abbreviation
        .replace(/%/g, 'pct')
        // anything else except period, question mark or percent or stroke becomes a space
        // eslint-disable-next-line no-useless-escape
        .replace(/(?![,\/\.\?])\W/g, ' ')
    }

    static splitIntoSentences = (s) => {
      const replaced = this.doReplacements(s)
      // split on period or question mark
      // eslint-disable-next-line no-useless-escape
      const splitSents = replaced.split(/([\.\?])/)
      // example
      //  "hello there. how are you? I am fine".split(/([\.\?])/)
      // eslint-disable-next-line no-irregular-whitespace
      // eslint-disable-next-line no-irregular-whitespace
      // (5) ['hello there', '.', ' how are you', '?', ' I am fine']
      // now put the punctuation back on the end of sentences
      const splitsGlued = splitSents.map((val, i, ary) => {
        if (i === 0 || i % 2 === 0) {
          return val + (((i + 1) < ary.length) ? ary[i + 1] : '')
        } else {
          return ''
        }
      }).filter(y => y !== '')
      return splitsGlued
    }

    static getSentences = (s) => {
      const splitsGlued = this.splitIntoSentences(s)
      const sents = splitsGlued
        .map((sentence) => {
          return sentence
            .trim()
            // remove double spaces
            // eslint-disable-next-line no-regex-spaces
            .replace(/  /g, ' ')
            // split up into words
            .split(' ')
            // get rid fo stray empties
            .filter(x => x.trim().length > 0)
        })
        .filter(x => x.length > 1 || x[0] !== '.')

      return sents
    }
}
