import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../../..')

function loadJson (rel: string) {
  return JSON.parse(readFileSync(resolve(root, rel), 'utf8'))
}

function overlearnLessons (): Array<{ display: string, letterGroup: string, fileName: string }> {
  const raw = readFileSync(resolve(root, 'src/wordfilesconfigs/wordlists.json'), 'utf8')
  const lessons: Array<{ display: string, letterGroup: string, fileName: string, userTarget?: string }> = []
  const re = /\{[^{}]*"class":\s*"OVERLEARN"[^{}]*\}/g
  for (const m of raw.matchAll(re)) {
    const o = JSON.parse(m[0])
    if (o.userTarget === 'STUDENT') {
      lessons.push(o)
    }
  }
  return lessons
}

describe('OverLearn rich links catalog', () => {
  const links = loadJson('tests/fixtures/overlearnRichLinks.json') as Array<{
    label: string
    group: string
    lesson: string
    preset: string
    url: string
    ok: boolean
  }>
  const presets = loadJson('src/presets/sets/POL.json').options as Array<{ display: string, filename: string }>
  const lessons = overlearnLessons()
  const lessonByDisplay = Object.fromEntries(lessons.map((l) => [l.display, l]))
  const presetByDisplay = Object.fromEntries(presets.map((p) => [p.display, p]))

  it('has only valid entries', () => {
    expect(links.length).toBeGreaterThan(40)
    for (const link of links) {
      expect(link.ok, link.label).toBe(true)
      expect(link.url).toContain('selectedClass=OVERLEARN')
      expect(link.url).toContain('selectedGroup=')
      expect(link.url).toContain('selectedLesson=')
      expect(link.url).toContain('selectedPreset=')
    }
  })

  it('resolves every lesson and preset against live configs', () => {
    for (const link of links) {
      const lesson = lessonByDisplay[link.lesson]
      expect(lesson, `${link.label} lesson ${link.lesson}`).toBeTruthy()
      expect(lesson.letterGroup, link.label).toBe(link.group)

      const preset = presetByDisplay[link.preset]
      expect(preset, `${link.label} preset ${link.preset}`).toBeTruthy()

      const wordfile = resolve(root, 'src/wordfiles', lesson.fileName)
      const presetFile = resolve(root, 'src/presets/configs', preset.filename)
      expect(readFileSync(wordfile, 'utf8').length, wordfile).toBeGreaterThan(0)
      expect(loadJson(`src/presets/configs/${preset.filename}`).morseSettings.length).toBeGreaterThan(0)
      expect(presetFile).toBeTruthy()
    }
  })

  it('includes Tom INT1/2 Alphabet and Numbers entries', () => {
    const labels = links.map((l) => l.label)
    expect(labels).toContain('Alphabet (23 WPM)')
    expect(labels).toContain('Alphabet Mix #1 (23-27-31 WPM)')
    expect(labels).toContain('Alphabet Mix #2 (23-27-23 WPM)')
    expect(labels).toContain('Numbers (23 WPM)')
    expect(labels).toContain('Numbers (27 WPM)')
  })
})
