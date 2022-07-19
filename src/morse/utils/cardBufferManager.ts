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
  _getWords!:()=>string[]
  constructor (getCurrentIndex:()=>number, getWords:()=>string[]) {
    this._getCurrentIndex = getCurrentIndex
    this._getWords = getWords
    // this.populateBuffer()
  }

  populateBuffer = () => {
    this._buffer = []
    this._buffer.push(new CardWord(this._getWords()[this._getCurrentIndex()]))
  }

  hasMoreMorse = ():boolean => {
    return this._buffer.length !== 0 && this._buffer[0].subparts.length !== 0
  }

  getNextMorse = ():string => {
    if (!this.hasMoreMorse()) {
      // return null
      this.populateBuffer()
    }
    return this._buffer[0].subparts.pop().word
  }

  clear = () => {
    this._buffer = []
  }
}
