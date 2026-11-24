// @vitest-environment jsdom
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../src/morse/components/morseImage/simpleImage', () => ({ default: {} }))
vi.mock('../../../src/morse/components/noiseAccordion/noiseAccordion', () => ({ default: {} }))
vi.mock('../../../src/morse/components/rssAccordion/rssAccordion', () => ({ default: {} }))
vi.mock('../../../src/morse/components/flaggedWordsAccordion/flaggedWordsAccordion', () => ({ default: {} }))

import { MorseViewModel } from '../../../src/morse/morse'
import { VoiceBufferInfo } from '../../../src/morse/voice/VoiceBufferInfo'

describe('Loop + Speak First voiceBuffer', () => {
  let vm: MorseViewModel

  beforeAll(() => {
    vi.useFakeTimers()
    vm = new MorseViewModel()
  })

  beforeEach(() => {
    vm.setText('R\nE')
    vm.morseVoice.speakFirst(true)
    vm.morseVoice.voiceEnabled(true)
    vm.morseVoice.voiceBuffer = []
    vm.morseVoice.speakFirstLastCardIndex = -1
    vm.currentIndex(0)
    vm.loop(true)
    vm.loopnoshuffle(true)
  })

  afterAll(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('does not re-buffer a card Speak First already spoke (repeat Morse plays)', () => {
    vm.currentIndex(1)
    vm.morseVoice.speakFirstLastCardIndex = 1
    vm.morseVoice.voiceBuffer = []

    vm.addToVoiceBuffer()

    expect(vm.morseVoice.voiceBuffer).toEqual([])
  })

  it('still buffers a card the first time Speak First needs it', () => {
    vm.currentIndex(0)
    vm.morseVoice.speakFirstLastCardIndex = -1
    vm.morseVoice.voiceBuffer = []

    vm.addToVoiceBuffer()

    expect(vm.morseVoice.voiceBuffer).toHaveLength(1)
    expect(vm.morseVoice.voiceBuffer[0].idx).toBe(0)
  })

  it('clears stale Speak First voice state on Loop restart before replaying', () => {
    const doPlaySpy = vi.spyOn(vm, 'doPlay').mockImplementation(() => {})
    const originalPause = vm.morseWordPlayer.pause
    vm.morseWordPlayer.pause = ((cb: () => void) => {
      cb()
    }) as typeof vm.morseWordPlayer.pause

    const stale = new VoiceBufferInfo()
    stale.txt = 'E'
    stale.idx = 1
    vm.currentIndex(1)
    vm.morseVoice.speakFirstLastCardIndex = 1
    vm.morseVoice.voiceBuffer = [stale]

    // Natural finish with loop on: fullRewind + loop restart (not Stop/Pause).
    vm.doPause(true, false, false, true)

    expect(vm.morseVoice.voiceBuffer).toEqual([])
    expect(vm.morseVoice.speakFirstLastCardIndex).toBe(-1)
    expect(vm.currentIndex()).toBe(0)
    expect(doPlaySpy).toHaveBeenCalledWith(false, false)

    doPlaySpy.mockRestore()
    vm.morseWordPlayer.pause = originalPause
  })
})
