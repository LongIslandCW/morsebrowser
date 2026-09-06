// @vitest-environment jsdom
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../../../src/morse/components/morseImage/simpleImage', () => ({ default: {} }))
vi.mock('../../../src/morse/components/noiseAccordion/noiseAccordion', () => ({ default: {} }))
vi.mock('../../../src/morse/components/rssAccordion/rssAccordion', () => ({ default: {} }))
vi.mock('../../../src/morse/components/flaggedWordsAccordion/flaggedWordsAccordion', () => ({ default: {} }))

import { MorseViewModel } from '../../../src/morse/morse'

describe('MorseViewModel pageTitle (DEV vs MAIN)', () => {
  let vm: MorseViewModel

  beforeAll(() => {
    vi.useFakeTimers()
    vm = new MorseViewModel()
  })

  afterAll(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('uses the production heading when not on /dev/', () => {
    document.title = 'LICW Morse Practice Page'
    vm.isDev(false)
    expect(vm.pageTitle()).toBe('Morse Practice Page')
    // MAIN leaves the static HTML title alone
    expect(document.title).toBe('LICW Morse Practice Page')
  })

  it('uses the Development Site heading when isDev is true', () => {
    vm.isDev(true)
    expect(vm.pageTitle()).toBe('Morse Practice Page - Development Site')
    expect(document.title).toBe('Morse Practice Page - Development Site')
  })
})
