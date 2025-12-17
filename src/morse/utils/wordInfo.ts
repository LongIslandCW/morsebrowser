import MorseStringUtils from './morseStringUtils'
/*
FILE OVERVIEW

- `WordInfo` parses an input string (`rawWord`) into `pieces`, splitting on spaces while preserving spaces inside `{...}` override blocks.
- Supports an override format like `{morseOrDisplay|speech}` (and optionally `{morseOrDisplay|speech|groupId}`) per piece:
  - `displayWord` returns what to show in the UI (normal text with replacements, or the left side of an override).
  - `speakText(forceSpelling)` returns what to feed into text-to-speech:
    - when `forceSpelling` is `false`, it "wordifies" punctuation for natural speech
    - when `forceSpelling` is `true`, it spells character-by-character (with a small workaround so `1 e 2` isn't treated like scientific notation)
    - for overrides, it speaks the right side when not spelling, or spells the left side when spelling
- When present, `groupId` is parsed as an integer and can be used for later sorting/grouping.
*/
export default class WordInfo {
  rawWord:string = ''
  pieces:string[] = []

  hasOverride (s:string):boolean {
    return s.indexOf('{') > -1
  }

  private parseOverride (p:string): { morse:string, speech:string | null, groupId:number | null } | null {
    if (!this.hasOverride(p)) return null

    const trimmed = p.trim()
    const inner = (trimmed.startsWith('{') && trimmed.endsWith('}'))
      ? trimmed.slice(1, -1)
      : trimmed.replace(/[{}]/g, '')

    const parts = inner.split('|')
    const morse = MorseStringUtils.doReplacements(parts[0] ?? '')
    const speech = parts[1] != null ? MorseStringUtils.doReplacements(parts[1]) : null

    const rawGroupId = parts[2]?.trim()
    const groupId = (rawGroupId != null && /^-?\d+$/.test(rawGroupId))
      ? Number.parseInt(rawGroupId, 10)
      : null

    return { morse, speech, groupId }
  }

  getBracesIndex (p:string, i:number):string {
    const override = this.parseOverride(p)
    if (!override) return MorseStringUtils.doReplacements(p)

    if (i === 0) return override.morse
    if (i === 1) return override.speech ?? override.morse
    return ''
  }

  get displayWord ():string {
    return this.pieces.map(p => {
      const override = this.parseOverride(p)
      return override ? override.morse : MorseStringUtils.doReplacements(p)
    }).join(' ')
  }

  speakText (forceSpelling:boolean):string {
    return this.pieces.map(p => {
      const override = this.parseOverride(p)
      if (!override) {
        const base = MorseStringUtils.doReplacements(p) + '\n'
        if (!forceSpelling) {
          return MorseStringUtils.wordifyPunctuation(base)
        } else {
          let preMathCheck = base.replace(/>/g, '').replace(/</g, '').split('').map(m => MorseStringUtils.wordifyPunctuation(m, true)).join(' ')
          // fix for weird issue of voice treating e or E as exponent and spearking "multiply by" or something like that
          const replaceSpacesAroundE = (input) => {
            return input.replace(/(\d) e (\d)/gi, '$1,e,$2')
          }
          preMathCheck = replaceSpacesAroundE(preMathCheck)
          return preMathCheck
        }
      } else {
        if (!forceSpelling) {
          return override.speech ?? override.morse
        }

        return override.morse.split('').join(' ')
      }
    }).join(' ') + '\n'
  }

  getGroupId ():number | null {
    for (const piece of this.pieces) {
      const override = this.parseOverride(piece)
      if (override?.groupId != null) return override.groupId
    }

    return null
  }

  constructor (s:string) {
    this.rawWord = s
    this.pieces = this.rawWord.split(/ (?![^{]*})/)
  }
}
