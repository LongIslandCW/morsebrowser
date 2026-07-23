import WordInfo from './wordInfo'

class CardWordSubPart {
  word:string
  played:boolean = false
  spoken:boolean = false
  constructor (wrd:string) {
    this.word = wrd
  }
}

class CardWord {
  original:string
  subparts:CardWordSubPart[] = []
  spoken:boolean = false
  constructor (contents:string) {
    this.original = contents
    // Split on spaces, but skip empties from runs of spaces. Sending word files
    // use trailing `[   ]` column-padding; doReplacements turns those brackets
    // into spaces, which used to create many silent empty plays and made the
    // first Speak-First card feel like it never started.
    const pieces = this.original.split(' ').filter((piece) => piece.length > 0)
    pieces.forEach((piece) => {
      this.subparts.push(new CardWordSubPart(piece))
    })
  }
}
export class CardBufferManager {
  _buffer:CardWord[] = []
  _getCurrentIndex!:()=>number
  _getWords!:()=>WordInfo[]
  // Total *audible* plays of the card's word (the count Speed Racer steps over).
  // Empty wordspace subparts that pad between repeats are not counted.
  _totalWordPlays:number = 1
  // 0-based index of the most recently shifted audible play. -1 before any
  // audible play has been emitted for the current card.
  _lastAudiblePlayIndex:number = -1
  // Number of audible morse "words" that make up ONE repeat of the card. This
  // is 1 for an ordinary single-word card, but > 1 when the card is a whole
  // kept-together line/sentence (Keep Lines) containing several space-
  // separated words. Every subpart within the same repeat must share the
  // same Speed Racer step, so the raw count of audible plays consumed so far
  // is divided down into a repeat-pass number.
  _subpartsPerRepeat:number = 1
  // Raw count of audible plays consumed so far for the current populate cycle.
  _audiblePlayCount:number = 0
  constructor (getCurrentIndex:()=>number, getWords:()=>WordInfo[]) {
    this._getCurrentIndex = getCurrentIndex
    this._getWords = getWords
    // this.populateBuffer()
  }

  populateBuffer = (repeats:number = 0, additionalWordSpaces:number = 0) => {
    console.log(`populateBuffer repeats${repeats}`)
    this._buffer = []
    const cardWord = new CardWord(this._getWords()[this._getCurrentIndex()].displayWord)
    this._buffer.push(cardWord)
    // A kept-together line/sentence is a single card even though it contains
    // several space-separated morse "words" — Speed Racer must step once per
    // full pass through all of them, not once per word. Only count *audible*
    // subparts: word files commonly have a trailing space before the line
    // break, which parses into a genuinely empty trailing piece that never
    // plays and so must not be counted, or the step index would never
    // advance at the right rate.
    this._subpartsPerRepeat = Math.max(1, cardWord.subparts.filter((sp) => sp.word && sp.word.length > 0).length)
    if (repeats > 0) {
      const audibleSubparts = cardWord.subparts.map((sp) => sp.word)
      cardWord.subparts = []
      for (let r = 0; r < repeats; r++) {
        audibleSubparts.forEach((word) => {
          cardWord.subparts.push(new CardWordSubPart(word))
        })
        // Wordspace padding goes between repeats only — never after the last
        // audible play (a trailing gap caused an extra empty shift that replayed
        // the final Speed Racer slot at the wrong WPM).
        if (r < repeats - 1) {
          for (let i = 0; i < additionalWordSpaces; i++) {
            cardWord.subparts.push(new CardWordSubPart(''))
          }
        }
      }
      this._totalWordPlays = repeats
    } else {
      this._totalWordPlays = 1
    }
    this._lastAudiblePlayIndex = -1
    this._audiblePlayCount = 0
  }

  hasMoreMorse = ():boolean => {
    return this._buffer.length !== 0 && this._buffer[0].subparts.length !== 0
  }

  // Index of the most recently shifted audible play's repeat *pass* (all
  // words of a multi-word card share the same pass number), the total
  // audible-play (repeat) count for the card, and whether the just-shifted
  // subpart was the first/last word of its pass. Used by Speed Racer to pick
  // a per-repeat speed and to gate recap speech to pass boundaries.
  // Call this AFTER getNextMorse(), and only after an audible (non-empty) play.
  getRepeatState = ():{ index:number, total:number, isFirstOfRepeat:boolean, isLastOfRepeat:boolean } => {
    const posInRepeat = this._subpartsPerRepeat > 0
      ? (this._audiblePlayCount - 1) % this._subpartsPerRepeat
      : 0
    return {
      index: this._lastAudiblePlayIndex,
      total: this._totalWordPlays,
      isFirstOfRepeat: posInRepeat === 0,
      isLastOfRepeat: posInRepeat === this._subpartsPerRepeat - 1
    }
  }

  getNextMorse = (repeats:number = 0, additionalWordSpaces:number = 0):string => {
    // eslint-disable-next-line no-debugger
    // debugger
    if (!this.hasMoreMorse()) {
      // return null
      this.populateBuffer(repeats, additionalWordSpaces)
    }
    const next = this._buffer[0].subparts.shift().word
    // Only the audible (non-empty) plays count toward the Speed Racer step
    // index. Empty subparts are inter-repeat wordspace padding. Several
    // consecutive audible plays make up one repeat pass when the card is a
    // multi-word kept-together line, so the step index only advances once
    // every _subpartsPerRepeat audible plays.
    if (next && next.length > 0) {
      this._audiblePlayCount++
      this._lastAudiblePlayIndex = Math.floor((this._audiblePlayCount - 1) / this._subpartsPerRepeat)
    }
    return next
  }

  getAllMorse = ():string => {
    if (!this.hasMoreMorse()) {
      this.populateBuffer()
    }

    const out = this._buffer[0].subparts.map(x => x.word).join(' ')
    this.clear()
    return out
  }

  clear = () => {
    this._buffer = []
  }

  appendArrayNTimes = (originalArray, n) => {
    // Ensure n is a positive integer
    if (!Number.isInteger(n) || n <= 0) {
      console.error("Please provide a positive integer for 'n'.")
      return originalArray
    }

    // Create a new array by concatenating the original array n times
    const newArray = Array.from({ length: n }, () => [...originalArray]).flat()

    return newArray
  }
}
