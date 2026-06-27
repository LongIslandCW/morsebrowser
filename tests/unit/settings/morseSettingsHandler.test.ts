import * as ko from 'knockout'
import { describe, expect, it } from 'vitest'
import MorseSettingsHandler from '../../../src/morse/settings/morseSettingsHandler'
import MorseLessonPlugin from '../../../src/morse/lessons/morseLessonPlugin'

function createMockMorseViewModel () {
  const lessons = {
    stickySets: ko.observable(''),
    ifStickySets: ko.observable(false),
    autoCloseLessonAccordion: ko.observable(false),
    ifCustomGroup: ko.observable(true),
    customGroup: ko.observable('ABC'),
    syncSize: ko.observable(true),
    ifOverrideMinMax: ko.observable(false),
    overrideMin: ko.observable(3),
    overrideMax: ko.observable(3)
  } as unknown as MorseLessonPlugin

  return {
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
        speedRacerSpeakBeforeReplay: ko.observable(true)
      },
      misc: {
        newlineChunking: ko.observable(false),
        isMoreSettingsAccordionOpen: false
      }
    },
    xtraWordSpaceDits: ko.observable(0),
    volume: ko.observable(5),
    hideList: ko.observable(false),
    showRaw: ko.observable(false),
    darkMode: ko.observable(true),
    showExpertSettings: ko.observable(false),
    numberOfRepeats: ko.observable(0),
    cardSpace: ko.observable(1),
    isShuffled: ko.observable(false),
    shuffleIntraGroup: ko.observable(false),
    lessons,
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
    }
  }
}

describe('MorseSettingsHandler', () => {
  it('serializes darkMode, custom group, and shuffle intra-group', () => {
    const vm = createMockMorseViewModel()
    vm.shuffleIntraGroup(true)
    const settings = MorseSettingsHandler.getCurrentSerializedSettings(vm as never)
    const keys = settings.morseSettings.map((s) => s.key)
    expect(keys).toContain('darkMode')
    expect(keys).toContain('ifCustomGroup')
    expect(keys).toContain('customGroup')
    expect(keys).toContain('shuffleIntraGroup')
    expect(keys).toContain('speedRacerEnabled')
    expect(keys).toContain('speedRacerMultipliers')
    expect(keys).toContain('speedRacerFinalPlay')
    expect(keys).toContain('speedRacerSpeakBeforeReplay')
    const dark = settings.morseSettings.find((s) => s.key === 'darkMode')
    expect(dark?.value).toBe(true)
    const shuffle = settings.morseSettings.find((s) => s.key === 'shuffleIntraGroup')
    expect(shuffle?.value).toBe(true)
    const speedRacer = settings.morseSettings.find((s) => s.key === 'speedRacerEnabled')
    expect(speedRacer?.value).toBe(false)
    const multipliers = settings.morseSettings.find((s) => s.key === 'speedRacerMultipliers')
    expect(multipliers?.value).toBe('1.5, 1.35, 1.175, 1.0')
    const finalPlay = settings.morseSettings.find((s) => s.key === 'speedRacerFinalPlay')
    expect(finalPlay?.value).toBe(true)
    const speakBeforeReplay = settings.morseSettings.find((s) => s.key === 'speedRacerSpeakBeforeReplay')
    expect(speakBeforeReplay?.value).toBe(true)
  })
})
