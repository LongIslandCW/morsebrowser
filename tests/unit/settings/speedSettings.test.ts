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

describe('SpeedSettings speak slots', () => {
  let s: SpeedSettings
  beforeEach(() => { s = createSpeedSettings() })

  it('speak-before targets only the final replay index', () => {
    s.speedRacerMultipliers('1.5, 1.35, 1.175, 1.0')
    s.speedRacerFinalPlay(true)
    expect(s.isRacerSpeakBeforeFinalReplay(4)).toBe(true)
    expect(s.isRacerSpeakBeforeFinalReplay(3)).toBe(false)
    s.speedRacerFinalPlay(false)
    expect(s.isRacerSpeakBeforeFinalReplay(4)).toBe(false)
  })

  it('speak-after targets the last variation when replay is off', () => {
    s.speedRacerMultipliers('1.0, 1.174, 1.348')
    s.speedRacerFinalPlay(false)
    expect(s.isRacerSpeakAfterLastVariation(2)).toBe(true)
    expect(s.isRacerSpeakAfterLastVariation(1)).toBe(false)
    s.speedRacerFinalPlay(true)
    expect(s.isRacerSpeakAfterLastVariation(2)).toBe(false)
  })
})

describe('SpeedSettings.applySpeedRacer WPM slots', () => {
  let s: SpeedSettings
  beforeEach(() => {
    s = createSpeedSettings()
    s.speedRacerEnabled(true)
    s.trueWpm(23)
    s.trueFwpm(15)
  })

  it('maps Overlearn multipliers to rounded WPM at each variation index', () => {
    s.speedRacerMultipliers('1.0, 1.174, 1.348')
    s.speedRacerFinalPlay(false)
    const base = new ApplicableSpeed(23, 15)
    expect(s.applySpeedRacer(base, 0, 3).wpm).toBe(23)
    expect(s.applySpeedRacer(base, 1, 3).wpm).toBe(27) // round(23 * 1.174)
    expect(s.applySpeedRacer(base, 2, 3).wpm).toBe(31) // round(23 * 1.348)
    expect(s.applySpeedRacer(base, 0, 3).fwpm).toBe(15)
    expect(s.applySpeedRacer(base, 2, 3).fwpm).toBe(15)
  })

  it('maps Jay-style ladder plus base-speed replay at first multiplier', () => {
    s.speedRacerMultipliers('1.5, 1.35, 1.175, 1.0')
    s.speedRacerFinalPlay(true)
    const base = new ApplicableSpeed(20, 12)
    expect(s.applySpeedRacer(base, 0, 5).wpm).toBe(30)
    expect(s.applySpeedRacer(base, 1, 5).wpm).toBe(27)
    expect(s.applySpeedRacer(base, 2, 5).wpm).toBe(24)
    expect(s.applySpeedRacer(base, 3, 5).wpm).toBe(20)
    expect(s.applySpeedRacer(base, 4, 5).wpm).toBe(30) // replay uses mults[0]
  })

  it('maps descending multipliers including fractions below 1.0', () => {
    s.wpm(20)
    s.fwpm(20)
    s.speedRacerMultipliers('1.5, 1.0, 0.5, 0.25')
    s.speedRacerFinalPlay(true)
    const base = new ApplicableSpeed(20, 20)
    expect(s.applySpeedRacer(base, 0, 5).wpm).toBe(30)
    expect(s.applySpeedRacer(base, 1, 5).wpm).toBe(20)
    expect(s.applySpeedRacer(base, 2, 5).wpm).toBe(10)
    expect(s.applySpeedRacer(base, 3, 5).wpm).toBe(5)
    expect(s.applySpeedRacer(base, 3, 5).fwpm).toBe(5) // spacing scales with slow WPM
    expect(s.applySpeedRacer(base, 4, 5).wpm).toBe(30) // replay at first multiplier
    expect(s.speedRacerPreview()).toBe('30 → 20 → 10 → 5 → speak → 30 wpm')
    s.speedRacerSpeakBeforeReplay(false)
    expect(s.speedRacerPreview()).toBe('30 → 20 → 10 → 5 → 30 wpm')
    expect(s.getSpeedRacerPreSpeakPadMs()).toBeGreaterThanOrEqual(350)
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

  it('keeps base FWPM for fast variations (Farnsworth) but scales down for slow ones', () => {
    const fast = s.applySpeedRacer(base, 1, 5)
    expect(fast.wpm).toBe(27)
    expect(fast.fwpm).toBe(12)
    s.speedRacerMultipliers('1.5, 1.0, 0.5, 0.25')
    const slow = s.applySpeedRacer(new ApplicableSpeed(20, 20), 3, 5)
    expect(slow.wpm).toBe(5)
    expect(slow.fwpm).toBe(5)
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

  it('preview shows speak after variations when replay is off', () => {
    s.speedRacerEnabled(true)
    s.speedRacerMultipliers('1.0, 1.174, 1.348')
    s.trueWpm(23)
    s.speedRacerFinalPlay(false)
    s.speedRacerSpeakBeforeReplay(false)
    expect(s.speedRacerPreview()).toBe('23 → 27 → 31 wpm')
    s.speedRacerSpeakBeforeReplay(true)
    expect(s.speedRacerPreview()).toBe('23 → 27 → 31 → speak')
  })

  it('speak label follows Replay Base Speed', () => {
    s.speedRacerFinalPlay(true)
    expect(s.speedRacerSpeakLabel()).toBe('Speak Before Replay')
    s.speedRacerFinalPlay(false)
    expect(s.speedRacerSpeakLabel()).toBe('Speak')
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
