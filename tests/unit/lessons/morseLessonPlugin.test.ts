import { describe, expect, it } from 'vitest'
import { createLessonPluginForTest } from '../../helpers/createLessonPlugin'

describe('MorseLessonPlugin', () => {
  it('lists letter groups for selected class without clearing on read', () => {
    const { plugin } = createLessonPluginForTest()
    plugin.changeSelectedClass('BC1', 'click')
    plugin.setLetterGroup('TIN', 'click')
    expect(plugin.letterGroup()).toBe('TIN')
    const groups = plugin.letterGroups()
    expect(groups).toContain('TIN')
    expect(groups).toContain('REA')
    expect(plugin.letterGroup()).toBe('TIN')
  })

  it('setLetterGroup applies when initialized and from click', () => {
    const { plugin } = createLessonPluginForTest()
    plugin.changeSelectedClass('BC1', 'click')
    plugin.setLetterGroup('REA', 'click')
    expect(plugin.letterGroup()).toBe('REA')
  })

  it('changing user target clears letter group via cascade', () => {
    const { plugin } = createLessonPluginForTest()
    plugin.changeSelectedClass('BC1', 'click')
    plugin.setLetterGroup('TIN', 'click')
    plugin.changeUserTarget('INSTRUCTOR')
    expect(plugin.letterGroup()).toBe('')
    expect(plugin.selectedClass()).toBe('')
  })

  it('displays lists lessons for selected content', () => {
    const { plugin } = createLessonPluginForTest()
    plugin.changeSelectedClass('BC1', 'click')
    plugin.setLetterGroup('TIN', 'click')
    const displays = plugin.displays()
    expect(displays.some((d) => d.display === 'Lesson A')).toBe(true)
  })

  it('doCustomGroup generates practice text using override size', () => {
    let practiceText = ''
    const { plugin } = createLessonPluginForTest()
    plugin.setText = (s: string) => {
      practiceText = s
    }
    plugin.getTimeEstimate = () => ({ timeCalcs: { totalTime: 60_000 } })
    plugin.ifCustomGroup(true)
    plugin.customGroup('AB')
    plugin.overrideMins(0)
    plugin.randomizeLessons(true)
    plugin.ifOverrideMinMax(true)
    plugin.overrideMin(2)
    plugin.overrideMax(2)

    plugin.doCustomGroup()

    expect(practiceText.length).toBeGreaterThan(0)
    for (const word of practiceText.split(/\s+/)) {
      expect(word.length).toBe(2)
    }
  })
})
