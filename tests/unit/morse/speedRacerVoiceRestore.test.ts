// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../src/morse/components/morseImage/simpleImage', () => ({ default: {} }))
vi.mock('../../../src/morse/components/noiseAccordion/noiseAccordion', () => ({ default: {} }))
vi.mock('../../../src/morse/components/rssAccordion/rssAccordion', () => ({ default: {} }))
vi.mock('../../../src/morse/components/flaggedWordsAccordion/flaggedWordsAccordion', () => ({ default: {} }))

import { MorseViewModel } from '../../../src/morse/morse'

describe('MorseViewModel speedRacerSpeakBeforeReplay subscribe', () => {
  let vm: MorseViewModel

  beforeEach(() => {
    vi.useFakeTimers()
    vm = new MorseViewModel()
  })

  afterEach(() => {
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
})
