import * as ko from 'knockout'
import { vi } from 'vitest'
import MorseLessonPlugin from '../../src/morse/lessons/morseLessonPlugin'
import { MorseSettings } from '../../src/morse/settings/settings'
import { createWordListFixture } from './wordLists.fixture'

vi.mock('../../src/morse/morsePresetSetFinder', () => ({
  MorsePresetSetFileFinder: {
    getMorsePresetSetFile: (_file: string, cb: (data: { data?: { options?: unknown[] } }) => void) => {
      cb({ data: { options: [] } })
    }
  }
}))

export function createLessonPluginForTest () {
  const misc = {
    newlineChunking: ko.observable(false),
    isMoreSettingsAccordionOpen: false
  }
  const morseSettings = {
    misc
  } as MorseSettings

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
        intervalFwpmText: ko.observable('')
      },
      misc
    },
    xtraWordSpaceDits: ko.observable(0),
    volume: ko.observable(5),
    hideList: ko.observable(false),
    showRaw: ko.observable(false),
    darkMode: ko.observable(false),
    showExpertSettings: ko.observable(false),
    numberOfRepeats: ko.observable(0),
    cardSpace: ko.observable(1),
    isShuffled: ko.observable(false),
    shuffleIntraGroup: ko.observable(false),
    cachedShuffle: false
  }

  const plugin = new MorseLessonPlugin(
    morseSettings,
    () => {},
    () => ({ timeCalcs: { totalTime: 0 } }),
    morseViewModel as never
  )

  morseViewModel.lessons = plugin
  plugin.wordLists(createWordListFixture())
  plugin.setUserTargetInitialized()
  plugin.setSelectedClassInitialized()
  plugin.setLetterGroupInitialized()
  plugin.setDisplaysInitialized()
  plugin.ensureSettingsPresetsInitialized()

  return { plugin, morseViewModel }
}
