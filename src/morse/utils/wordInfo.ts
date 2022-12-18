import MorseStringUtils from './morseStringUtils'

export default class WordInfo {
  rawWord:string = ''
  pieces:string[] = []

  hasOverride (s:string):boolean {
    return s.indexOf('{') > -1
  }

  get displayWord ():string {
    return this.pieces.map(p => {
      if (!this.hasOverride(p)) {
        return MorseStringUtils.doReplacements(p)
      } else {
        const pieces = p.replace('{', '').replace('}', '').split('|')
        return MorseStringUtils.doReplacements(pieces[0])
      }
    }).join(' ')
  }

  get speakText ():string {
    return this.pieces.map(p => {
      if (!this.hasOverride(p)) {
        return MorseStringUtils.doReplacements(p) + '\n'
      } else {
        const pieces = p.replace('{', '').replace('}', '').split('|')
        return MorseStringUtils.doReplacements(pieces[1])
      }
    }).join(' ') + '\n'
  }

  constructor (s:string) {
    this.rawWord = s
    this.pieces = this.rawWord.split(/ (?![^{]*})/)
  }
}
