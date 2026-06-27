import * as ko from 'knockout'
import { beforeEach, describe, expect, it } from 'vitest'
import SpeedSettings, { ApplicableSpeed } from '../../../src/morse/settings/speedSettings'
import { MorseViewModel } from '../../../src/morse/morse'

// Minimal mock VM: SpeedSettings' eager computeds only read vm.playerPlaying();
// the preview computed (deferred) reads vm.morseVoice.voiceEnabled().
function createSpeedSettings (): SpeedSettings {
  const vm = {
    playerPlaying: ko.observable(false),
    morseVoice: { voiceEnabled: ko.observable(false) }
  } as unknown as MorseViewModel
  return new SpeedSettings(vm)
}

describe('SpeedSettings.parseMultipliers', () => {
  it('returns [] for empty/blank input', () => {
    expect(SpeedSettings.parseMultipliers('')).toEqual([])
    expect(SpeedSettings.parseMultipliers('   ')).toEqual([])
  })

  it('parses a valid comma list and preserves order, tolerating whitespace', () => {
    expect(SpeedSettings.parseMultipliers('1.5, 1.35, 1.175, 1.0'))
      .toEqual([1.5, 1.35, 1.175, 1.0])
  })

  it('drops zero entries (the skip-slot sentinel)', () => {
    expect(SpeedSettings.parseMultipliers('0, 1.5, 0, 1.0')).toEqual([1.5, 1.0])
  })

  it('drops negative and non-numeric entries', () => {
    expect(SpeedSettings.parseMultipliers('-1, 2, abc, 1.5')).toEqual([2, 1.5])
  })
})

describe('SpeedSettings.getRacerTotalPlays', () => {
  let s: SpeedSettings
  beforeEach(() => { s = createSpeedSettings() })

  it('is variation count + 1 when Replay Base Speed is on', () => {
    s.speedRacerMultipliers('1.5, 1.35, 1.175, 1.0')
    s.speedRacerFinalPlay(true)
    expect(s.getRacerTotalPlays()).toBe(5)
  })

  it('is the variation count when Replay Base Speed is off', () => {
    s.speedRacerMultipliers('1.5, 1.35, 1.175, 1.0')
    s.speedRacerFinalPlay(false)
    expect(s.getRacerTotalPlays()).toBe(4)
  })

  it('returns 1 for a single multiplier with replay off (regression: must still race)', () => {
    s.speedRacerMultipliers('1.5')
    s.speedRacerFinalPlay(false)
    expect(s.getRacerTotalPlays()).toBe(1)
  })

  it('returns 0 when no non-zero multipliers exist', () => {
    s.speedRacerMultipliers('0, 0')
    expect(s.getRacerTotalPlays()).toBe(0)
    s.speedRacerMultipliers('')
    expect(s.getRacerTotalPlays()).toBe(0)
  })
})

describe('SpeedSettings.isRacerFinalPlay', () => {
  let s: SpeedSettings
  beforeEach(() => { s = createSpeedSettings() })

  it('flags only the last play (index total-1) with the 4-multiplier default', () => {
    s.speedRacerMultipliers('1.5, 1.35, 1.175, 1.0')
    s.speedRacerFinalPlay(true)
    expect(s.isRacerFinalPlay(4)).toBe(true)
    expect(s.isRacerFinalPlay(3)).toBe(false)
    expect(s.isRacerFinalPlay(0)).toBe(false)
  })

  it('flags index 1 for a single multiplier with replay on', () => {
    s.speedRacerMultipliers('1.5')
    s.speedRacerFinalPlay(true)
    expect(s.isRacerFinalPlay(1)).toBe(true)
    expect(s.isRacerFinalPlay(0)).toBe(false)
  })

  it('never flags a final play when Replay Base Speed is off', () => {
    s.speedRacerMultipliers('1.5, 1.35, 1.175, 1.0')
    s.speedRacerFinalPlay(false)
    expect(s.isRacerFinalPlay(3)).toBe(false)
    expect(s.isRacerFinalPlay(4)).toBe(false)
  })
})

describe('SpeedSettings.applySpeedRacer', () => {
  let s: SpeedSettings
  beforeEach(() => {
    s = createSpeedSettings()
    s.speedRacerEnabled(true)
    s.speedRacerMultipliers('1.5, 1.35, 1.175, 1.0')
    s.speedRacerFinalPlay(true)
  })

  const base = new ApplicableSpeed(20, 12)

  it('applies the per-index multiplier to wpm (rounded, min 1)', () => {
    expect(s.applySpeedRacer(base, 0, 5).wpm).toBe(30) // 20 * 1.5
    expect(s.applySpeedRacer(base, 1, 5).wpm).toBe(27) // 20 * 1.35
    expect(s.applySpeedRacer(base, 3, 5).wpm).toBe(20) // 20 * 1.0
  })

  it('uses the first multiplier for the final/replay index (>= multiplier count)', () => {
    expect(s.applySpeedRacer(base, 4, 5).wpm).toBe(30) // mults[0] = 1.5
  })

  it('keeps base FWPM constant during racing', () => {
    const result = s.applySpeedRacer(base, 1, 5)
    expect(result.wpm).toBe(27)
    expect(result.fwpm).toBe(12)
  })

  it('preview shows speak step only when Speak Before Replay is on', () => {
    s.speedRacerEnabled(true)
    s.speedRacerMultipliers('1.5, 1.0')
    s.trueWpm(20)
    s.speedRacerFinalPlay(true)
    s.speedRacerSpeakBeforeReplay(false)
    expect(s.speedRacerPreview()).toBe('30 → 20 → 30 wpm')
    s.speedRacerSpeakBeforeReplay(true)
    expect(s.speedRacerPreview()).toBe('30 → 20 → speak → 30 wpm')
  })

  it('returns the base speed unchanged when Speed Racer is disabled', () => {
    s.speedRacerEnabled(false)
    expect(s.applySpeedRacer(base, 0, 5)).toBe(base)
  })

  it('returns the base speed unchanged when there are no usable multipliers', () => {
    s.speedRacerMultipliers('0, 0')
    expect(s.applySpeedRacer(base, 0, 5)).toBe(base)
  })
})
