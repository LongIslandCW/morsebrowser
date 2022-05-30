import { MorseCountUnits } from './MorseCountUnits'
import { UnitTimingsAndMultipliers } from './UnitTimingsAndMultipliers'

export class ComputedTimes {
  totalTime:number
  ditTime:number
  dahTime:number
  intraCharacterSpaceTime:number
  interCharacterSpaceTime:number
  wordSpaceTime:number
  extraWordSpacingDitsTime:number
  singleWordSpaceTime:number
  totalPlusTrail:number

  constructor (timingUnits:UnitTimingsAndMultipliers, countUnits:MorseCountUnits) {
    this.ditTime = countUnits.ditCount * timingUnits.ditUnitMultiPlier * timingUnits.calculatedUnitsMs
    this.dahTime = countUnits.dahCount * timingUnits.dahUnitMultiplier * timingUnits.calculatedUnitsMs
    this.intraCharacterSpaceTime = countUnits.intraCharacterSpaceCount * timingUnits.intraCharacterSpaceMultiplier * timingUnits.calculatedUnitsMs
    // these are farnsworthed
    this.interCharacterSpaceTime = countUnits.interCharacterSpaceCount * timingUnits.interCharacterSpaceMultiplier * timingUnits.calculatedFWUnitsMs
    this.wordSpaceTime = countUnits.wordSpacesCount * timingUnits.wordSpaceMultiplier * timingUnits.calculatedFWUnitsMs
    this.extraWordSpacingDitsTime = countUnits.wordSpacesCount * countUnits.extraWordSpacingDitsCount * timingUnits.ditUnitMultiPlier * timingUnits.calculatedFWUnitsMs

    this.totalTime = this.ditTime + this.dahTime + this.intraCharacterSpaceTime + this.interCharacterSpaceTime + this.wordSpaceTime + this.extraWordSpacingDitsTime

    // single wordspace
    this.singleWordSpaceTime = timingUnits.wordSpaceMultiplier * timingUnits.calculatedFWUnitsMs + countUnits.extraWordSpacingDitsCount * timingUnits.ditUnitMultiPlier * timingUnits.calculatedFWUnitsMs
    this.totalPlusTrail = this.totalTime + this.singleWordSpaceTime
  }
}
