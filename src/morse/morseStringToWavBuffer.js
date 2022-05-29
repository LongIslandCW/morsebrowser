import MorseCWWave from '../morse-pro/morse-pro-cw-wave.js'
import * as RiffWave from '../morse-pro/morse-pro-util-riffwave.js'
import { MorseTimingCalculator } from './timing/morseTimingCalculator.ts'
import { MorseCountUnits } from './timing/MorseCountUnits.ts'
export class MorseStringToWavBufferConfig {
  word
  wpm
  fwpm
  ditFrequency
  dahFrequency
  prePaddingMs
  xtraWordSpaceDits
  volume
  get frequency () { return this.ditFrequency }
}

export class MorseStringToWavBuffer {
  static getInit = (config) => {
    const useProsigns = true
    const sampleRate = 8000
    const timingUnits = MorseTimingCalculator.getTimingUnits(config.wpm, config.fwpm)
    const countUnits = new MorseCountUnits()
    countUnits.extraWordSpacingDitsCount = config.xtraWordSpaceDits
    // const unit = 1200 / config.fwpm
    // const wordSpace = (unit * 7) + (unit * config.xtraWordSpaceDits)
    const morseCWWave = new MorseCWWave(useProsigns, config.wpm, config.fwpm, { dit: config.ditFrequency, dah: config.dahFrequency }, sampleRate)
    morseCWWave.translate(config.word, false)
    return { morseCWWave, timingUnits, countUnits }
  }

  static createWav = (config) => {
    const init = this.getInit(config)
    const ret = {}
    // get wordspace
    const calcs = MorseTimingCalculator.getTimes(init.timingUnits, init.countUnits)

    ret.sample = init.morseCWWave.getSample(calcs.singleWordSpaceTime, config.prePaddingMs)
    const wav = RiffWave.getData(ret.sample)
    ret.wav = wav
    return ret
  }

  static estimatePlayTime = (config) => {
    const init = this.getInit(config)
    const timingUnits = init.timingUnits
    const unitCounts = MorseTimingCalculator.countUnits(init.morseCWWave, init.countUnits)
    const timeCalcs = MorseTimingCalculator.getTimes(timingUnits, unitCounts)

    return { morse: init.morseCWWave.morse, word: config.word, timingUnits, unitCounts, timeCalcs }
  }
}
