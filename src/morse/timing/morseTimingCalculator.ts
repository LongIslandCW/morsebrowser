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
}
