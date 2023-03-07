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
    // console.log('pieces')
    // console.log(this.pieces)
    return this.pieces.map(p => {
      // console.log(`hasoverride(p):${this.hasOverride(p)}`)
      if (!this.hasOverride(p)) {
        const base = MorseStringUtils.doReplacements(p) + '\n'
        if (!forceSpelling) {
          return MorseStringUtils.wordifyPunctuation(base)
        } else {
          // force spelling and wordify voice overrides
          // console.log('no override')
          /*
          const checkforprosigns = base.split(/(<.*?>)/).filter(f => f !== '')
          const newBase = []
          checkforprosigns.forEach(f => {
            if (f.indexOf('<') > -1) {
              newBase.push(f)
            } else {
              f.split('').forEach(x => {
                newBase.push(x)
              })
            }
          }) */

          return base.replace(/>/g, '').replace(/</g, '').split('').map(m => MorseStringUtils.wordifyPunctuation(m, true)).join(' ')
        }
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
