import { ComputedTimes } from './ComputedTimes'
import { MorseCountUnits } from './MorseCountUnits'
import { UnitTimingsAndMultipliers } from './UnitTimingsAndMultipliers'

export class MorseTimingCalculator {
  // based on https://morsecode.world/international/timing.html
  static getTimingUnits = (wpm:number, fwpm:number):UnitTimingsAndMultipliers => {
    return new UnitTimingsAndMultipliers(wpm, fwpm)
  }

  static countUnits = (morsecwwav, prePopulated:MorseCountUnits):MorseCountUnits => {
    let cnts: MorseCountUnits
    if (prePopulated) {
      cnts = prePopulated
    } else {
      cnts = new MorseCountUnits()
    }

    const morseWords = morsecwwav.morse.split('/')
    cnts.wordSpacesCount = morseWords.length - 1
    morseWords.forEach((word) => {
      const characters = word.trim().split(' ')
      cnts.interCharacterSpaceCount += characters.length - 1
      characters.forEach((character) => {
        cnts.intraCharacterSpaceCount += character.length - 1
        cnts.ditCount += character.split('').filter((x) => x === '.').length
        cnts.dahCount += character.split('').filter((x) => x === '-').length
      })
    })
    return cnts
  }

  static getTimes = (timingUnits:UnitTimingsAndMultipliers, countUnits:MorseCountUnits):ComputedTimes => {
    return new ComputedTimes(timingUnits, countUnits)
  }

  static getTimeLine = (morsecwwav, timingUnits, config) => {
    if (isNaN(timingUnits.calculatedUnitsMs) || isNaN(timingUnits.calculatedFWUnitsMs)) {
      return []
    }
    const morseWords = morsecwwav.morse.split('/').map(x => x.trim())
    // console.log(`morsewords:${''}`)
    // console.log(morseWords)
    let time = 0
    const events = []
    // const dummyTime = 0.002
    events.push({ event: 'prepad_start', time })
    time += config.prePaddingMs
    events.push({ event: 'prepad_end', time })
    let lastWordPiece = ''
    const addIntraCharacter = () => {
      if (lastWordPiece === '.' || lastWordPiece === '-') {
        events.push({ event: 'intrachar_start', time })
        time += timingUnits.calculatedUnitsMs * timingUnits.intraCharacterSpaceMultiplier
        events.push({ event: 'intrachar_end', time })
      }
    }
    morseWords.forEach((morseWord) => {
      if (time > 0) {
        events.push({ event: 'wordspace_start', time })
        time += timingUnits.calculatedFWUnitsMs * timingUnits.wordSpaceMultiplier
        events.push({ event: 'wordspace_end', time })
      }
      const wordPieces = morseWord.split('')
      lastWordPiece = ''
      wordPieces.forEach((wordPiece) => {
        switch (wordPiece) {
          case '.':
            addIntraCharacter()
            events.push({ event: 'dit_start', time })
            time += timingUnits.calculatedUnitsMs * timingUnits.ditUnitMultiPlier
            events.push({ event: 'dit_end', time })
            break
          case '-':
            addIntraCharacter()
            events.push({ event: 'dah_start', time })
            time += timingUnits.calculatedUnitsMs * timingUnits.dahUnitMultiplier
            events.push({ event: 'dah_end', time })
            break
          case ' ':
            events.push({ event: 'interchar_start', time })
            time += timingUnits.calculatedFWUnitsMs * timingUnits.interCharacterSpaceMultiplier
            events.push({ event: 'interchar_end', time })
            break
        }
        lastWordPiece = wordPiece
      })
    })
    return events
  }
}
