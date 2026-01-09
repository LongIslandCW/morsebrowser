import { MorseViewModel } from '../morse'
import SavedSettingsInfo from './savedSettingsInfo'
import { SettingsChangeInfo } from './settingsChangeInfo'
import { SettingsOption } from './settingsOption'

// import * as ko from 'knockout'
export default class MorseSettingsHandler {
  static getCurrentSerializedSettings (morseViewModel: MorseViewModel) {
    const savedInfos: SavedSettingsInfo[] = []
    const settings = { morseSettings: savedInfos }

    savedInfos.push(new SavedSettingsInfo('wpm', morseViewModel.settings.speed.wpm()))
    savedInfos.push(new SavedSettingsInfo('fwpm', morseViewModel.settings.speed.fwpm()))
    savedInfos.push(new SavedSettingsInfo('xtraWordSpaceDits', morseViewModel.xtraWordSpaceDits()))
    savedInfos.push(new SavedSettingsInfo('volume', morseViewModel.volume()))
    savedInfos.push(new SavedSettingsInfo('stickySets', morseViewModel.lessons.stickySets()))
    savedInfos.push(new SavedSettingsInfo('ifStickySets', morseViewModel.lessons.ifStickySets()))
    savedInfos.push(new SavedSettingsInfo('syncWpm', morseViewModel.settings.speed.syncWpm()))
    savedInfos.push(new SavedSettingsInfo('hideList', morseViewModel.hideList()))
    savedInfos.push(new SavedSettingsInfo('showRaw', morseViewModel.showRaw()))
    savedInfos.push(
      new SavedSettingsInfo('autoCloseLessonAccordian', morseViewModel.lessons.autoCloseLessonAccordion())
    )
    savedInfos.push(new SavedSettingsInfo('customGroup', morseViewModel.lessons.customGroup()))
    savedInfos.push(new SavedSettingsInfo('showExpertSettings', morseViewModel.showExpertSettings()))
    savedInfos.push(new SavedSettingsInfo('voiceEnabled', morseViewModel.morseVoice.voiceEnabled()))
    savedInfos.push(new SavedSettingsInfo('voiceSpelling', morseViewModel.morseVoice.voiceSpelling()))
    savedInfos.push(new SavedSettingsInfo('voiceThinkingTime', morseViewModel.morseVoice.voiceThinkingTime()))
    savedInfos.push(
      new SavedSettingsInfo('voiceAfterThinkingTime', morseViewModel.morseVoice.voiceAfterThinkingTime())
    )
    savedInfos.push(new SavedSettingsInfo('voiceVolume', morseViewModel.morseVoice.voiceVolume()))
    savedInfos.push(new SavedSettingsInfo('voiceLastOnly', morseViewModel.morseVoice.voiceLastOnly()))
    savedInfos.push(new SavedSettingsInfo('voiceRecap', morseViewModel.morseVoice.manualVoice()))
    savedInfos.push(new SavedSettingsInfo('speakFirst', morseViewModel.morseVoice.speakFirst()))
    savedInfos.push(
      new SavedSettingsInfo('numberOfRepeats', morseViewModel.numberOfRepeats())
    )
    savedInfos.push(
      new SavedSettingsInfo(
        'speakFirstAdditionalWordspaces',
        morseViewModel.morseVoice.speakFirstAdditionalWordspaces()
      )
    )
    savedInfos.push(new SavedSettingsInfo('keepLines', morseViewModel.settings.misc.newlineChunking()))
    savedInfos.push(new SavedSettingsInfo('syncSize', morseViewModel.lessons.syncSize()))
    savedInfos.push(new SavedSettingsInfo('overrideSize', morseViewModel.lessons.ifOverrideMinMax()))
    savedInfos.push(new SavedSettingsInfo('overrideSizeMin', morseViewModel.lessons.overrideMin()))
    savedInfos.push(new SavedSettingsInfo('overrideSizeMax', morseViewModel.lessons.overrideMax()))
    savedInfos.push(
      new SavedSettingsInfo('cardSpace', morseViewModel.cardSpace(), 'AKA cardWait')
    )
    savedInfos.push(
      new SavedSettingsInfo('miscSettingsAccordionOpen', morseViewModel.settings.misc.isMoreSettingsAccordionOpen)
    )
    savedInfos.push(new SavedSettingsInfo('speedInterval', morseViewModel.settings.speed.speedInterval()))
    savedInfos.push(
      new SavedSettingsInfo('intervalTimingsText', morseViewModel.settings.speed.intervalTimingsText())
    )
    savedInfos.push(
      new SavedSettingsInfo('intervalWpmText', morseViewModel.settings.speed.intervalWpmText())
    )
    savedInfos.push(
      new SavedSettingsInfo('intervalFwpmText', morseViewModel.settings.speed.intervalFwpmText())
    )
    savedInfos.push(
      new SavedSettingsInfo('voiceBufferMaxLength', morseViewModel.morseVoice.voiceBufferMaxLength())
    )
    savedInfos.push(
      new SavedSettingsInfo('isShuffledSet', morseViewModel.isShuffled())
    )
    savedInfos.push(
      new SavedSettingsInfo('shuffleIntraGroup', morseViewModel.shuffleIntraGroup())
    )
    return settings
  }

  static saveSettings (morseViewModel: MorseViewModel) {
    const settings = this.getCurrentSerializedSettings(morseViewModel)
    const elemx = document.createElement('a')
    elemx.href =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, '\t'))
    elemx.download = 'LICWSettings.json'
    elemx.style.display = 'none'
    document.body.appendChild(elemx)
    elemx.click()
    document.body.removeChild(elemx)
  }

  static settingsFileChange (element: HTMLInputElement, morseViewModel: MorseViewModel) {
    const file = element.files?.[0]
    if (!file) return

    const fr = new FileReader()
    fr.onload = (data) => {
      const settings = JSON.parse(data.target?.result as string)
      element.value = '' // Clear input to allow re-loading the same file
      const settingsInfo = new SettingsChangeInfo(morseViewModel)
      settingsInfo.ifLoadSettings = true
      settingsInfo.ignoreCookies = true
      settingsInfo.custom = settings.morseSettings
      settingsInfo.keyBlacklist = ['cardFontPx', 'preSpace']

      const option = new SettingsOption()
      option.display = file.name.split('.')[0]
      option.filename = file.name
      option.isCustom = true
      option.isDummy = false
      option.morseSettings = settings.morseSettings

      morseViewModel.lessons.customSettingsOptions.push(option)
      morseViewModel.lessons.getSettingsPresets(true)
      morseViewModel.lessons.setPresetSelected(option)
    }

    fr.readAsText(file)
  }
}
