import MorseStringUtils from './morseStringUtils'

export default class WordInfo {
  rawWord:string = ''
  pieces:string[] = []

  hasOverride (s:string):boolean {
    return s.indexOf('{') > -1
  }

  getBracesIndex (p:string, i:number):string {
    const pieces = p.replace('{', '').replace('}', '').split('|')
    return MorseStringUtils.doReplacements(pieces[i])
  }

  get displayWord ():string {
    return this.pieces.map(p => {
      if (!this.hasOverride(p)) {
        return MorseStringUtils.doReplacements(p)
      } else {
        return this.getBracesIndex(p, 0)
      }
    }).join(' ')
  }

  speakText (forceSpelling:boolean):string {
    return this.pieces.map(p => {
      if (!this.hasOverride(p)) {
        const base = MorseStringUtils.doReplacements(p) + '\n'
        if (!forceSpelling) {
          return MorseStringUtils.wordifyPunctuation(base)
        }

        return base.split('').join(' ')
      } else {
        if (!forceSpelling) {
          return this.getBracesIndex(p, 1)
        }

        return this.getBracesIndex(p, 0).split('').join(' ')
      }
    }).join(' ') + '\n'
  }

  constructor (s:string) {
    this.rawWord = s
    this.pieces = this.rawWord.split(/ (?![^{]*})/)
  }
}
