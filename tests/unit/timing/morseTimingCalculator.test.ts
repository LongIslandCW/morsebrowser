import { describe, expect, it } from 'vitest'
import MorseCWWave from '../../../src/morse-pro/morse-pro-cw-wave.js'
import { MorseTimingCalculator } from '../../../src/morse/timing/morseTimingCalculator'
import { MorseCountUnits } from '../../../src/morse/timing/MorseCountUnits'
import { UnitTimingsAndMultipliers } from '../../../src/morse/timing/UnitTimingsAndMultipliers'
import { SoundMakerConfig } from '../../../src/morse/player/soundmakers/SoundMakerConfig'

describe('MorseTimingCalculator', () => {
  it('computes dit duration from wpm', () => {
    const units = MorseTimingCalculator.getTimingUnits(20, 15)
    expect(units.calculatedUnitsMs).toBeGreaterThan(0)
    expect(units.calculatedFWUnitsMs).toBeGreaterThan(0)
  })

  it('counts dits and dahs in morse pattern', () => {
    const wave = new MorseCWWave(false, 20, 15)
    wave.translate('A')
    const counts = MorseTimingCalculator.countUnits(wave, null as MorseCountUnits)
    expect(counts.ditCount).toBeGreaterThan(0)
    expect(counts.dahCount).toBeGreaterThan(0)
  })

  it('getTimes returns positive total for simple word', () => {
    const wave = new MorseCWWave(false, 20, 15)
    wave.translate('E')
    const timingUnits = new UnitTimingsAndMultipliers(20, 15)
    const countUnits = MorseTimingCalculator.countUnits(wave, null as MorseCountUnits)
    const times = MorseTimingCalculator.getTimes(timingUnits, countUnits)
    expect(times.totalTime).toBeGreaterThan(0)
  })

  it('getTimeLine includes dit events for letter E', () => {
    const wave = new MorseCWWave(false, 20, 15)
    wave.translate('E')
    const timingUnits = new UnitTimingsAndMultipliers(20, 15)
    const config = Object.assign(new SoundMakerConfig(), { prePaddingMs: 0 })
    const events = MorseTimingCalculator.getTimeLine(wave, timingUnits, config)
    const ditStarts = events.filter((e) => e.event === 'dit_start')
    expect(ditStarts.length).toBeGreaterThan(0)
  })
})
