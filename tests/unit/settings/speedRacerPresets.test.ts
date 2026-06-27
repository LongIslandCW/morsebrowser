// @vitest-environment node
import { describe, expect, it } from 'vitest'
import pol17Lsr from '../../../src/presets/configs/POL_17_L_SR.json'
import pol17Wsr from '../../../src/presets/configs/POL_17_W_SR.json'
import pol21Lsr from '../../../src/presets/configs/POL_21_L_SR.json'
import pol21Wsr from '../../../src/presets/configs/POL_21_W_SR.json'

function parseMultipliers (s: string): number[] {
  if (!s) return []
  return s.split(',')
    .map(x => parseFloat(x))
    .filter(n => Number.isFinite(n) && n > 0)
}

type PresetEntry = { key: string; value: unknown; comment?: string | null }

function presetMap (entries: PresetEntry[]): Map<string, unknown> {
  return new Map(entries.map(e => [e.key, e.value]))
}

function expectSpeedRacerPreset (
  label: string,
  entries: PresetEntry[],
  expected: {
    baseWpm: number
    multipliers: string
    voiceSpelling: boolean
    expectedWpms: number[]
  }
) {
  const m = presetMap(entries)

  expect(m.get('speedRacerEnabled'), `${label} speedRacerEnabled`).toBe(true)
  expect(m.get('speedRacerFinalPlay'), `${label} speedRacerFinalPlay`).toBe(false)
  expect(m.get('speedInterval'), `${label} speedInterval`).toBe(false)
  expect(m.get('numberOfRepeats'), `${label} numberOfRepeats`).toBe(0)
  expect(m.get('speakFirst'), `${label} speakFirst`).toBe(false)
  expect(m.get('voiceEnabled'), `${label} voiceEnabled`).toBe(false)
  expect(m.get('wpm'), `${label} wpm`).toBe(expected.baseWpm)
  expect(m.get('fwpm'), `${label} fwpm`).toBe(expected.baseWpm)
  expect(m.get('speedRacerMultipliers'), `${label} multipliers`).toBe(expected.multipliers)
  expect(m.get('voiceSpelling'), `${label} voiceSpelling`).toBe(expected.voiceSpelling)

  const mults = parseMultipliers(String(m.get('speedRacerMultipliers')))
  const wpms = mults.map(x => Math.max(1, Math.round(expected.baseWpm * x)))
  expect(wpms, `${label} WPM ladder`).toEqual(expected.expectedWpms)
}

describe('Speed Racer OverLearn preset JSON', () => {
  it('Flow Rate 1 letters: 23 → 27 → 31, letters spelling on', () => {
    expectSpeedRacerPreset('POL_17_L_SR', pol17Lsr.morseSettings, {
      baseWpm: 23,
      multipliers: '1.0, 1.174, 1.348',
      voiceSpelling: true,
      expectedWpms: [23, 27, 31]
    })
  })

  it('Flow Rate 1 words: same speed ladder, spelling off', () => {
    expectSpeedRacerPreset('POL_17_W_SR', pol17Wsr.morseSettings, {
      baseWpm: 23,
      multipliers: '1.0, 1.174, 1.348',
      voiceSpelling: false,
      expectedWpms: [23, 27, 31]
    })
  })

  it('Flow Rate 2 letters: 27 → 31 → 35', () => {
    expectSpeedRacerPreset('POL_21_L_SR', pol21Lsr.morseSettings, {
      baseWpm: 27,
      multipliers: '1.0, 1.148, 1.296',
      voiceSpelling: true,
      expectedWpms: [27, 31, 35]
    })
  })

  it('Flow Rate 2 words: same speed ladder, spelling off', () => {
    expectSpeedRacerPreset('POL_21_W_SR', pol21Wsr.morseSettings, {
      baseWpm: 27,
      multipliers: '1.0, 1.148, 1.296',
      voiceSpelling: false,
      expectedWpms: [27, 31, 35]
    })
  })
})
