import * as ko from 'knockout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GeneralUtils } from '../../../src/morse/utils/general'
import { MorseSettings } from '../../../src/morse/settings/settings'
import MorseLessonPlugin from '../../../src/morse/lessons/morseLessonPlugin'

const polOptions = [
  { display: 'BINOMIALS 23wpm', filename: 'POL_Random_3x_23.json' },
  { display: 'CHARACTERS 23wpm', filename: 'POL_Random_23.json' },
  { display: 'CHARACTERS 27wpm', filename: 'POL_Random_27.json' }
]

let pendingPresetSetCallbacks: Array<(data: { data: { options: typeof polOptions } }) => void> = []

vi.mock('../../../src/morse/morsePresetSetFinder', () => ({
  MorsePresetSetFileFinder: {
    getMorsePresetSetFile: (_file: string, cb: (data: { data: { options: typeof polOptions } }) => void) => {
      pendingPresetSetCallbacks.push(cb)
    }
  }
}))

vi.mock('../../../src/morse/morsePresetFinder', () => ({
  MorsePresetFileFinder: {
    getMorsePresetFile: (_fileName: string, cb: (d: { found: boolean, data: { morseSettings: Array<{ key: string, value: unknown }> } }) => void) => {
      cb({
        found: true,
        data: {
          morseSettings: [
            { key: 'wpm', value: 23 },
            { key: 'fwpm', value: 23 },
            { key: 'syncWpm', value: true }
          ]
        }
      })
    }
  }
}))

vi.mock('../../../src/morse/cookies/morseCookies', () => ({
  MorseCookies: {
    registeredHandlers: [],
    registerHandler: vi.fn(),
    loadCookiesOrDefaults: vi.fn((info: {
      custom?: Array<{ key: string, value: unknown }>
      ctxt: { settings: { speed: { wpm: (v: unknown) => void, fwpm: (v: unknown) => void } } }
      afterSettingsChange?: () => void
    }) => {
      for (const s of info.custom || []) {
        if (s.key === 'wpm') {
          info.ctxt.settings.speed.wpm(s.value)
        }
        if (s.key === 'fwpm') {
          info.ctxt.settings.speed.fwpm(s.value)
        }
      }
      info.afterSettingsChange?.()
    })
  }
}))

function flushPendingPresetSets () {
  const callbacks = pendingPresetSetCallbacks
  pendingPresetSetCallbacks = []
  for (const cb of callbacks) {
    cb({ data: { options: polOptions } })
  }
}

function createOverlearnPlugin () {
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
  plugin.wordLists([
    {
      sort: 1,
      userTarget: 'STUDENT',
      class: 'OVERLEARN',
      letterGroup: 'CHARACTERS',
      newlineChunking: true,
      display: 'ALPHABET',
      fileName: 'POL_Letters.txt'
    },
    {
      sort: 2,
      userTarget: 'STUDENT',
      class: 'OVERLEARN',
      letterGroup: 'CHARACTERS',
      newlineChunking: true,
      display: 'NUMBERS',
      fileName: 'POL_Numbers.txt'
    }
  ] as never)

  return { plugin, morseViewModel }
}

describe('OverLearn preset deep links', () => {
  let getParamSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    pendingPresetSetCallbacks = []
    getParamSpy = vi.spyOn(GeneralUtils, 'getParameterByName').mockImplementation((name: string) => {
      const params: Record<string, string> = {
        selectedClass: 'OVERLEARN',
        selectedGroup: 'CHARACTERS',
        selectedLesson: 'ALPHABET',
        selectedPreset: 'CHARACTERS 23wpm'
      }
      return params[name] ?? null
    })
  })

  afterEach(() => {
    getParamSpy.mockRestore()
    vi.useRealTimers()
  })

  it('applies selectedPreset after async preset-set load (not stuck on Your Settings)', () => {
    const { plugin, morseViewModel } = createOverlearnPlugin()

    // Reproduce production race: init query handlers before preset-set file returns.
    plugin.setUserTargetInitialized()
    plugin.setSelectedClassInitialized()
    plugin.setLetterGroupInitialized()
    plugin.setDisplaysInitialized()
    plugin.ensureSettingsPresetsInitialized()

    expect(plugin.selectedSettingsPreset().display).toBe('Your Settings')
    expect(morseViewModel.settings.speed.wpm()).toBe(20)
    expect(morseViewModel.settings.speed.fwpm()).toBe(15)
    expect(pendingPresetSetCallbacks.length).toBeGreaterThan(0)

    flushPendingPresetSets()

    expect(plugin.selectedSettingsPreset().display).toBe('CHARACTERS 23wpm')
    expect(morseViewModel.settings.speed.wpm()).toBe(23)
    expect(morseViewModel.settings.speed.fwpm()).toBe(23)
  })

  it('does not auto-select the first preset when selectedPreset is in the URL', () => {
    const { plugin } = createOverlearnPlugin()
    plugin.setUserTargetInitialized()
    plugin.setSelectedClassInitialized()
    plugin.setLetterGroupInitialized()
    plugin.setDisplaysInitialized()
    plugin.ensureSettingsPresetsInitialized()
    flushPendingPresetSets()

    // First non-Your option is BINOMIALS 23wpm; deep link asked for CHARACTERS.
    expect(plugin.selectedSettingsPreset().display).not.toBe('BINOMIALS 23wpm')
    expect(plugin.selectedSettingsPreset().display).toBe('CHARACTERS 23wpm')
  })
})
