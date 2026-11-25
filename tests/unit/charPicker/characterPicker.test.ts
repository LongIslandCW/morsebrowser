import { describe, expect, it, vi } from 'vitest'
import {
  CharacterPicker,
  PICKER_CATEGORIES,
  parsePicked,
  serializePicked
} from '../../../src/morse/charPicker/characterPicker'
import { createLessonPluginForTest } from '../../helpers/createLessonPlugin'

describe('character picker selection', () => {
  it('serializes in catalog order and parses prosigns back as single values', () => {
    expect(serializePicked(['S', '<AR>', 'L', '?', '1'])).toBe('LS1?<AR>')
    expect(parsePicked('ls1?<ar>')).toEqual(['L', 'S', '1', '?', '<AR>'])
  })

  it('drops unknown or duplicate stored characters', () => {
    expect(parsePicked('AA<ZZ>#B')).toEqual(['A', 'B'])
    expect(parsePicked('')).toEqual([])
    expect(parsePicked(undefined)).toEqual([])
  })

  it('toggles single characters on and off', () => {
    const picker = new CharacterPicker(false)
    picker.toggle('C')
    picker.toggle('A')
    expect(picker.letters()).toBe('AC')
    expect(picker.isSelected('A')).toBe(true)
    picker.toggle('A')
    expect(picker.letters()).toBe('C')
    expect(picker.isSelected('A')).toBe(false)
  })

  it('selects and clears whole categories without touching the others', () => {
    const picker = new CharacterPicker(false)
    picker.toggle('<BT>')
    picker.selectCategory('letters')
    expect(picker.categoryCount('letters')).toBe(26)
    picker.selectCategory('numbers')
    expect(picker.count()).toBe(26 + 10 + 1)
    picker.clearCategory('letters')
    expect(picker.letters()).toBe('1234567890<BT>')
    picker.clearAll()
    expect(picker.hasSelection()).toBe(false)
    expect(picker.summary()).toBe('No characters selected')
  })

  it('summarizes the selection with prosigns shown without brackets', () => {
    const picker = new CharacterPicker(false)
    picker.toggle('K')
    picker.toggle('<AR>')
    expect(picker.summary()).toBe('2 selected: K AR')
  })

  it('gives punctuation and prosign keys a spoken name', () => {
    const punctuation = PICKER_CATEGORIES.find((c) => c.id === 'punctuation')!
    const prosigns = PICKER_CATEGORIES.find((c) => c.id === 'prosigns')!
    expect(punctuation.chars.every((c) => c.spoken)).toBe(true)
    expect(prosigns.chars.find((c) => c.value === '<SK>')!.spoken).toBe('S K prosign')
  })

  it('restores mode and selection from cookies', () => {
    const picker = new CharacterPicker(false)
    picker.handleCookies([
      { key: CharacterPicker.CHARS_COOKIE, val: 'LCD<AR>' },
      { key: CharacterPicker.MODE_COOKIE, val: 'true' }
    ])
    expect(picker.mode()).toBe(true)
    expect(picker.selected()).toEqual(['C', 'D', 'L', '<AR>'])
  })
})

describe('lesson plugin in character picker mode', () => {
  const setup = () => {
    const { plugin, morseViewModel } = createLessonPluginForTest()
    const picker = new CharacterPicker(false)
    Object.assign(morseViewModel, {
      charPicker: picker,
      playerPlaying: () => false,
      isPaused: () => false
    })
    let practiceText = ''
    plugin.setText = (s: string) => {
      practiceText = s
    }
    // ~1s per group so a 0.5 minute override yields a short list.
    let calls = 0
    plugin.getTimeEstimate = () => ({ timeCalcs: { totalTime: ++calls * 1000 } })
    return { plugin, picker, text: () => practiceText }
  }

  it('treats the picked characters as the reloadable lesson', () => {
    const { plugin, picker } = setup()
    expect(plugin.hasReloadableLesson()).toBe(false)
    picker.mode(true)
    expect(plugin.hasReloadableLesson()).toBe(false)
    picker.toggle('K')
    expect(plugin.hasReloadableLesson()).toBe(true)
  })

  it('reinit builds groups from only the picked characters and override size', () => {
    const { plugin, picker, text } = setup()
    picker.mode(true)
    picker.toggle('K')
    picker.toggle('M')
    picker.toggle('<AR>')
    plugin.overrideMins(0.5)
    plugin.syncSize(false)
    plugin.overrideMin(2)
    plugin.overrideMax(3)

    plugin.runLessonReinit()

    const groups = text().split(/\s+/)
    expect(groups.length).toBeGreaterThan(5)
    for (const group of groups) {
      const symbols = group.match(/<[^>]*>|./g) ?? []
      expect(symbols.length).toBeGreaterThanOrEqual(2)
      expect(symbols.length).toBeLessThanOrEqual(3)
      for (const symbol of symbols) {
        expect(['K', 'M', '<AR>']).toContain(symbol)
      }
    }
  })

  it('scheduled reinit regenerates after the delay, deferred while playing', () => {
    vi.useFakeTimers()
    try {
      const { plugin, picker, text } = setup()
      picker.mode(true)
      picker.toggle('E')
      plugin.overrideMins(0.1)
      plugin.scheduleLessonReinitAfterPreset(400)
      expect(text()).toBe('')
      vi.advanceTimersByTime(400)
      expect(text()).toMatch(/^E/)
    } finally {
      vi.useRealTimers()
    }
  })
})
