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
    const pieces = this.original.split(' ')
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
  constructor (getCurrentIndex:()=>number, getWords:()=>WordInfo[]) {
    this._getCurrentIndex = getCurrentIndex
    this._getWords = getWords
    // this.populateBuffer()
  }

  populateBuffer = (repeats:number = 0, additionalWordSpaces:number = 0) => {
    console.log(`populateBuffer repeats${repeats}`)
    this._buffer = []
    this._buffer.push(new CardWord(this._getWords()[this._getCurrentIndex()].displayWord))
    // debugger
    if (repeats > 0) {
      for (let i = 0; i < additionalWordSpaces; i++) {
        this._buffer[0].subparts.push(new CardWordSubPart(''))
      }
      this._buffer[0].subparts = this.appendArrayNTimes(this._buffer[0].subparts, repeats)
    }
    this._totalWordPlays = repeats > 0 ? repeats : 1
    this._lastAudiblePlayIndex = -1
    // debugger
  }

  hasMoreMorse = ():boolean => {
    return this._buffer.length !== 0 && this._buffer[0].subparts.length !== 0
  }

  // Index of the most recently shifted audible play, plus the total audible-play
  // count for the card. Used by Speed Racer to pick a per-repeat speed.
  // Call this AFTER getNextMorse(), and only after an audible (non-empty) play.
  getRepeatState = ():{ index:number, total:number } => {
    return { index: this._lastAudiblePlayIndex, total: this._totalWordPlays }
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
    // index. Empty subparts are inter-repeat wordspace padding.
    if (next && next.length > 0) {
      this._lastAudiblePlayIndex++
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
