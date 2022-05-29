export class UnitTimingsAndMultipliers {
  calculatedUnitsMs:number
  calculatedFWUnitsMs:number
  ditUnitMultiPlier:number = 1
  dahUnitMultiplier:number = 3
  intraCharacterSpaceMultiplier:number = 1
  interCharacterSpaceMultiplier:number = 3
  wordSpaceMultiplier:number = 7

  constructor (wpm:number, fwpm:number) {
    const calculatedSecondsPerDit = 60 / (50 * wpm)
    this.calculatedUnitsMs = calculatedSecondsPerDit * 1000
    const calculatedFWUnitSeconds = ((60 / fwpm) - 31 * calculatedSecondsPerDit) / 19
    this.calculatedFWUnitsMs = calculatedFWUnitSeconds * 1000
  }
}
