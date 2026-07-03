// @vitest-environment jsdom
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../../../src/morse/components/morseImage/simpleImage', () => ({ default: {} }))
vi.mock('../../../src/morse/components/noiseAccordion/noiseAccordion', () => ({ default: {} }))
vi.mock('../../../src/morse/components/rssAccordion/rssAccordion', () => ({ default: {} }))
vi.mock('../../../src/morse/components/flaggedWordsAccordion/flaggedWordsAccordion', () => ({ default: {} }))

import { MorseViewModel } from '../../../src/morse/morse'

describe('MorseViewModel speedRacerSpeakBeforeReplay subscribe', () => {
  let vm: MorseViewModel

  beforeAll(() => {
    vi.useFakeTimers()
    vm = new MorseViewModel()
  })

  afterAll(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('restores lesson voice when Speak turns off while Speed Racer stays on', () => {
    vm.morseVoice.manualVoice(true)
    vm.morseVoice.voiceEnabled(false)
    vm.captureLessonVoiceBaseline()

    vm.settings.speed.speedRacerEnabled(true)
    vm.settings.speed.speedRacerSpeakBeforeReplay(true)
    vm.morseVoice.voiceEnabled(true)

    vm.settings.speed.speedRacerSpeakBeforeReplay(false)

    expect(vm.morseVoice.voiceEnabled()).toBe(false)
    expect(vm.morseVoice.manualVoice()).toBe(true)
  })

  it('does not restore lesson voice when Speak turns off while Speed Racer is off', () => {
    vm.morseVoice.manualVoice(true)
    vm.morseVoice.voiceEnabled(false)
    vm.captureLessonVoiceBaseline()

    vm.settings.speed.speedRacerEnabled(false)
    vm.morseVoice.voiceEnabled(true)

    vm.settings.speed.speedRacerSpeakBeforeReplay(false)

    expect(vm.morseVoice.voiceEnabled()).toBe(true)
    expect(vm.morseVoice.manualVoice()).toBe(true)
  })

  it('restores lesson voice when Overlearn turns Speak off while Speed Racer stays on', () => {
    vm.morseVoice.manualVoice(true)
    vm.morseVoice.voiceEnabled(false)
    vm.captureLessonVoiceBaseline()

    vm.settings.speed.speedRacerEnabled(true)
    vm.settings.speed.speedRacerSpeakBeforeReplay(true)
    vm.morseVoice.voiceEnabled(true)

    vm.settings.speed.setOverlearnMultipliers()

    expect(vm.settings.speed.speedRacerSpeakBeforeReplay()).toBe(false)
    expect(vm.morseVoice.voiceEnabled()).toBe(false)
    expect(vm.morseVoice.manualVoice()).toBe(true)
  })

  it('forces Voice off and clears buffer when baseline had voice on', () => {
    vm.morseVoice.manualVoice(false)
    vm.morseVoice.voiceEnabled(true)
    vm.captureLessonVoiceBaseline()

    vm.morseVoice.voiceBuffer.push({ txt: 'CQ', idx: 0 } as never)

    vm.settings.speed.speedRacerEnabled(true)
    vm.settings.speed.speedRacerSpeakBeforeReplay(true)

    vm.settings.speed.speedRacerSpeakBeforeReplay(false)

    expect(vm.morseVoice.voiceEnabled()).toBe(false)
    expect(vm.morseVoice.voiceBuffer).toEqual([])
  })

  it('restores Voice First when Speed Racer turns off after Speak-off morse-only session', () => {
    vm.morseVoice.voiceEnabled(true)
    vm.morseVoice.speakFirst(true)
    vm.morseVoice.manualVoice(false)
    vm.captureLessonVoiceBaseline()

    vm.settings.speed.speedRacerEnabled(true)
    vm.settings.speed.speedRacerSpeakBeforeReplay(true)
    vm.settings.speed.speedRacerSpeakBeforeReplay(false)

    expect(vm.morseVoice.speakFirst()).toBe(false)

    vm.settings.speed.speedRacerEnabled(false)

    expect(vm.morseVoice.voiceEnabled()).toBe(true)
    expect(vm.morseVoice.speakFirst()).toBe(true)
  })

  it('forces Voice off and clears buffer even when no baseline was captured', () => {
    vm.lessonVoiceBaseline = null
    vm.morseVoice.voiceEnabled(true)
    vm.morseVoice.voiceBuffer.push({ txt: 'CQ', idx: 0 } as never)

    vm.settings.speed.speedRacerEnabled(true)
    vm.settings.speed.speedRacerSpeakBeforeReplay(true)
    vm.settings.speed.speedRacerSpeakBeforeReplay(false)

    expect(vm.morseVoice.voiceEnabled()).toBe(false)
    expect(vm.morseVoice.voiceBuffer).toEqual([])
  })
})
