import * as ko from 'knockout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MorseLessonPlugin from '../../../src/morse/lessons/morseLessonPlugin'
import { FileOptionsInfo } from '../../../src/morse/lessons/FileOptionsInfo'
import { MorseSettings } from '../../../src/morse/settings/settings'

const polOptions = [
  { display: 'BINOMIALS 23wpm', filename: 'POL_Random_3x_23.json' },
  { display: 'SENDING WORDS/PHRASES 27wpm', filename: 'POL_Random_1x_VCS_27.json' }
]

vi.mock('../../../src/morse/morsePresetSetFinder', () => ({
  MorsePresetSetFileFinder: {
    getMorsePresetSetFile: (
      _file: string,
      onResult: (data: { data: { options: typeof polOptions } }) => void
    ) => {
      const payload = { data: { options: polOptions } }
      onResult(payload)
    }
  }
}))

vi.mock('../../../src/morse/morsePresetFinder', () => ({
  MorsePresetFileFinder: {
    getMorsePresetFile: (
      _fileName: string,
      onResult: (d: {
        found: boolean
        data: { morseSettings: Array<{ key: string, value: unknown }> }
      }) => void
    ) => {
      const payload = {
        found: true,
        data: {
          morseSettings: [
            { key: 'wpm', value: 27 },
            { key: 'autoCloseLessonAccordian', value: true }
          ]
        }
      }
      onResult(payload)
    }
  }
}))

vi.mock('../../../src/morse/cookies/morseCookies', () => ({
  MorseCookies: {
    registeredHandlers: [],
    registerHandler: vi.fn(),
    loadCookiesOrDefaults: vi.fn((info: { afterSettingsChange?: () => void }) => {
      info.afterSettingsChange?.()
    })
  }
}))

vi.mock('../../../src/morse/morseLessonFinder', () => ({
  MorseLessonFileFinder: {
    getMorseLessonFile: (
      _filename: string,
      onResult: (result: { found: boolean, data: string }) => void
    ) => {
      const payload = { found: true, data: '{ANY[    ] |ANY[    ] |1}' }
      onResult(payload)
    }
  }
}))

function createPlugin () {
  const misc = {
    newlineChunking: ko.observable(false),
    isMoreSettingsAccordionOpen: false
  }
  const morseSettings = { misc } as MorseSettings
  const morseViewModel = {
    allowSaveCookies: ko.observable(true),
    lockoutSaveCookiesTimerHandle: null as ReturnType<typeof setTimeout> | null,
    currentSerializedSettings: null,
    lessons: null as MorseLessonPlugin | null,
    playerPlaying: ko.observable(false),
    isPaused: ko.observable(false),
    morseVoice: {
      voiceEnabled: ko.observable(false),
      voiceSpelling: ko.observable(false),
      voiceThinkingTime: ko.observable(0),
      voiceAfterThinkingTime: ko.observable(0),
      voiceVolume: ko.observable(5),
      voiceLastOnly: ko.observable(false),
      manualVoice: ko.observable(false),
      speakFirst: ko.observable(false),
      speakFirstAdditionalWordspaces: ko.observable(0),
      voiceBufferMaxLength: ko.observable(10)
    },
    settings: {
      speed: {
        wpm: ko.observable(20),
        fwpm: ko.observable(15),
        syncWpm: ko.observable(true),
        speedInterval: ko.observable(false),
        intervalTimingsText: ko.observable(''),
        intervalWpmText: ko.observable(''),
        intervalFwpmText: ko.observable(''),
        speedRacerEnabled: ko.observable(false),
        speedRacerMultipliers: ko.observable('1.5, 1.35, 1.175, 1.0'),
        speedRacerFinalPlay: ko.observable(true),
        speedRacerSpeakBeforeReplay: ko.observable(true),
        speedRacerKeepFwpm: ko.observable(true)
      },
      misc
    },
    xtraWordSpaceDits: ko.observable(0),
    volume: ko.observable(5),
    hideList: ko.observable(false),
    showRaw: ko.observable(false),
    darkMode: ko.observable(false),
    autoCloseSettingsAccordions: ko.observable(true),
    showExpertSettings: ko.observable(false),
    numberOfRepeats: ko.observable(0),
    cardSpace: ko.observable(1),
    isShuffled: ko.observable(false),
    shuffleIntraGroup: ko.observable(false),
    cachedShuffle: false,
    shuffleWords: vi.fn(function (this: { isShuffled: (v: boolean) => void, cachedShuffle: boolean }) {
      this.isShuffled(true)
    }),
    lessonVoiceBaseline: null,
    captureLessonVoiceBaseline: vi.fn(),
    restoreLessonVoiceFromLesson: vi.fn(),
    announce: vi.fn()
  }

  const plugin = new MorseLessonPlugin(
    morseSettings,
    () => {},
    () => ({ timeCalcs: { totalTime: 0 } }),
    morseViewModel as never
  )
  morseViewModel.lessons = plugin
  const wordList: FileOptionsInfo[] = [
    {
      sort: 1,
      userTarget: 'STUDENT',
      class: 'OVERLEARN',
      letterGroup: 'SENDING',
      newlineChunking: false,
      display: '3-5 WORDS',
      fileName: 'POL_Send_3-5_L_Words.txt'
    }
  ]
  plugin.wordLists(wordList)
  plugin.setUserTargetInitialized()
  plugin.setSelectedClassInitialized()
  plugin.setLetterGroupInitialized()
  plugin.setDisplaysInitialized()
  plugin.ensureSettingsPresetsInitialized()
  plugin.selectedClass('OVERLEARN')
  plugin.letterGroup('SENDING')
  plugin.autoCloseLessonAccordion(true)

  return { plugin, morseViewModel }
}

function mountLessonAccordionOpen () {
  document.body.innerHTML = `
    <button id="lessonAccordianButton" class="accordion-button" type="button"
      data-bs-toggle="collapse" data-bs-target="#accordianItemLessonControls"
      aria-expanded="true" aria-controls="accordianItemLessonControls">LICW Lessons</button>
    <div id="accordianItemLessonControls" class="accordion-collapse collapse show"></div>
  `
}

function findLesson (plugin: MorseLessonPlugin, display: string): FileOptionsInfo | undefined {
  return plugin.displays().find((d: FileOptionsInfo) => d.display === display)
}

describe('OverLearn lesson accordion + post-preset reinit', () => {
  beforeEach(() => {
    mountLessonAccordionOpen()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('does not close LICW Lessons when selecting a lesson (PRESET still needed)', () => {
    const { plugin } = createPlugin()
    const lesson = findLesson(plugin, '3-5 WORDS')
    expect(lesson).toBeTruthy()

    plugin.setDisplaySelected(lesson, false, 'click')

    expect(document.getElementById('accordianItemLessonControls')?.classList.contains('show')).toBe(true)
    expect(document.getElementById('lessonAccordianButton')?.getAttribute('aria-expanded')).toBe('true')
  })

  it('defers the LESSON-click close while the preset set is still loading', () => {
    const { plugin } = createPlugin()
    const lesson = findLesson(plugin, '3-5 WORDS')
    // Simulate a preset-set file still in flight (async import not yet resolved),
    // so settingsPresets() may transiently hold a short/stale list.
    plugin.presetSetLoadPending = true

    plugin.setDisplaySelected(lesson!, true, 'click')

    // Must NOT collapse on the transient list — the OverLearn bug this guards.
    expect(document.getElementById('accordianItemLessonControls')?.classList.contains('show')).toBe(true)
    expect(plugin.pendingLessonClickClose).toBe(true)
  })

  it('closes LICW Lessons only when the user clicks a preset', () => {
    const { plugin } = createPlugin()
    plugin.settingsPresets([
      { display: 'Your Settings', filename: 'dummy.json', isDummy: true },
      { display: 'SENDING WORDS/PHRASES 27wpm', filename: 'POL_Random_1x_VCS_27.json' }
    ])
    plugin.setSettingsPresetsInitialized()

    // Programmatic auto-select must not close (CONTENT change path).
    plugin.setPresetSelected(plugin.settingsPresets()[1], true)
    expect(document.getElementById('accordianItemLessonControls')?.classList.contains('show')).toBe(true)

    plugin.setPresetSelected(plugin.settingsPresets()[1], false, 'click')
    expect(document.getElementById('accordianItemLessonControls')?.classList.contains('show')).toBe(false)
    expect(document.getElementById('lessonAccordianButton')?.getAttribute('aria-expanded')).toBe('false')
  })

  it('skips scheduled lesson reinit while playing (Speak First race)', () => {
    const { plugin, morseViewModel } = createPlugin()
    const lesson = findLesson(plugin, '3-5 WORDS')
    plugin.setDisplaySelected(lesson!, true)
    const getWordListSpy = vi.spyOn(plugin, 'getWordList')

    plugin.scheduleLessonReinitAfterPreset()
    morseViewModel.playerPlaying(true)
    vi.advanceTimersByTime(1000)

    expect(getWordListSpy).not.toHaveBeenCalled()
  })

  it('abortPendingLessonReinit fully drops a deferred reload (Flagged/Clear takeover)', () => {
    const { plugin } = createPlugin()
    const lesson = findLesson(plugin, '3-5 WORDS')
    plugin.setDisplaySelected(lesson!, true)
    const getWordListSpy = vi.spyOn(plugin, 'getWordList')

    // Simulate a preset picked mid-play that deferred its reload.
    plugin.deferredLessonReinit = true
    plugin.scheduleLessonReinitAfterPreset()

    plugin.abortPendingLessonReinit()
    vi.advanceTimersByTime(1000)

    expect(plugin.deferredLessonReinit).toBe(false)
    expect(plugin.presetLessonReinitTimerHandle).toBeNull()
    // Even a later terminal-stop path finds nothing pending to run.
    plugin.runDeferredLessonReinitIfPending()
    expect(getWordListSpy).not.toHaveBeenCalled()
  })

  it('cancelPendingLessonReinit drops the timer before it reloads', () => {
    const { plugin } = createPlugin()
    const lesson = findLesson(plugin, '3-5 WORDS')
    plugin.setDisplaySelected(lesson!, true)
    const getWordListSpy = vi.spyOn(plugin, 'getWordList')

    plugin.scheduleLessonReinitAfterPreset()
    plugin.cancelPendingLessonReinit()
    vi.advanceTimersByTime(1000)

    expect(getWordListSpy).not.toHaveBeenCalled()
    expect(plugin.presetLessonReinitTimerHandle).toBeNull()
  })

  it('runs scheduled lesson reinit when idle', () => {
    const { plugin, morseViewModel } = createPlugin()
    const lesson = findLesson(plugin, '3-5 WORDS')
    plugin.setDisplaySelected(lesson!, true)
    const getWordListSpy = vi.spyOn(plugin, 'getWordList')
    getWordListSpy.mockClear()

    morseViewModel.playerPlaying(false)
    morseViewModel.isPaused(false)
    plugin.scheduleLessonReinitAfterPreset()
    vi.advanceTimersByTime(1000)

    expect(getWordListSpy).toHaveBeenCalledWith('POL_Send_3-5_L_Words.txt')
  })

  it('handleCookies clears cachedShuffle when isShuffledSet is false', () => {
    const { plugin, morseViewModel } = createPlugin()
    morseViewModel.cachedShuffle = true
    morseViewModel.isShuffled(true)

    plugin.handleCookies([
      { key: 'isShuffledSet', val: false },
      { key: 'shuffleIntraGroup', val: false }
    ])

    expect(morseViewModel.cachedShuffle).toBe(false)
  })

  it('handleCookies sets cachedShuffle when isShuffledSet is true', () => {
    const { plugin, morseViewModel } = createPlugin()
    morseViewModel.cachedShuffle = false

    plugin.handleCookies([{ key: 'isShuffledSet', val: true }])

    expect(morseViewModel.cachedShuffle).toBe(true)
  })

  it('runLessonReinit does not re-arm cachedShuffle from a prior shuffled UI state', () => {
    const { plugin, morseViewModel } = createPlugin()
    const lesson = findLesson(plugin, '3-5 WORDS')
    plugin.setDisplaySelected(lesson!, true)
    morseViewModel.shuffleWords.mockClear()

    // Simulate: OverLearn BINOMIALS left cards shuffled, then sending preset
    // applied isShuffledSet:false (handleCookies already cleared the flag).
    morseViewModel.isShuffled(true)
    morseViewModel.cachedShuffle = false

    const getWordListSpy = vi.spyOn(plugin, 'getWordList')
    getWordListSpy.mockClear()
    plugin.runLessonReinit()

    expect(morseViewModel.cachedShuffle).toBe(false)
    expect(morseViewModel.shuffleWords).not.toHaveBeenCalled()
    expect(getWordListSpy).toHaveBeenCalledWith('POL_Send_3-5_L_Words.txt')
  })

  it('runLessonReinit keeps shuffle when the preset asked for it (cachedShuffle true)', () => {
    const { plugin, morseViewModel } = createPlugin()
    const lesson = findLesson(plugin, '3-5 WORDS')
    plugin.setDisplaySelected(lesson!, true)
    morseViewModel.shuffleWords.mockClear()

    // Tri-letters (or any isShuffledSet:true) left the flag armed.
    morseViewModel.cachedShuffle = true
    plugin.runLessonReinit()

    expect(morseViewModel.shuffleWords).toHaveBeenCalled()
    expect(morseViewModel.cachedShuffle).toBe(false)
  })
})
