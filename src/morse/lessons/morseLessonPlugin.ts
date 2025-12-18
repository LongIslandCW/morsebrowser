import * as ko from 'knockout'
import WordListsJson from '../../wordfilesconfigs/wordlists.json'
import { CookieInfo } from '../cookies/CookieInfo'
import { ICookieHandler } from '../cookies/ICookieHandler'
import { MorseCookies } from '../cookies/morseCookies'
import { MorseLessonFileFinder } from '../morseLessonFinder'
import { MorseSettings } from '../settings/settings'
import { GeneralUtils } from '../utils/general'
import { FileOptionsInfo } from './FileOptionsInfo'
import ClassPresets from '../../presets/config.json'
import { MorsePresetSetFileFinder } from '../morsePresetSetFinder'
import { MorsePresetFileFinder } from '../morsePresetFinder'
import { MorseViewModel } from '../morse'
import { SettingsChangeInfo } from '../settings/settingsChangeInfo'
import SettingsOverridesJson from '../../presets/overrides/presetoverrides.json'
import { SettingsOption } from '../settings/settingsOption'
import MorseSettingsHandler from '../settings/morseSettingsHandler'
export default class MorseLessonPlugin implements ICookieHandler {
  autoCloseLessonAccordion:ko.Observable<boolean>
  userTarget:ko.Observable<string>
  selectedClass:ko.Observable<string>
  userTargetInitialized:boolean
  selectedClassInitialized:boolean
  letterGroupInitialized:boolean
  displaysInitialized:boolean
  settingsPresetsInitialized:boolean
  letterGroup:ko.Observable<string>
  selectedDisplay:ko.Observable<any>
  wordLists:ko.ObservableArray<FileOptionsInfo>
  morseSettings:MorseSettings
  setText:any
  ifStickySets:ko.Observable<boolean>
  stickySets:ko.Observable<string>
  randomizeLessons:ko.Observable<boolean>
  ifOverrideTime:ko.Observable<boolean>
  overrideMins:ko.Observable<number>
  customGroup:ko.Observable<string>
  ifOverrideMinMax:ko.Observable<boolean>
  trueOverrideMin:ko.Observable<number>
  trueOverrideMax:ko.Observable<number>
  overrideMin:ko.PureComputed<number>
  overrideMax:ko.PureComputed<number>
  syncSize:ko.Observable<boolean>
  getTimeEstimate:any
  classes:ko.Computed<Array<any>>
  userTargets:ko.Computed<Array<any>>
  letterGroups:ko.Computed<Array<any>>
  displays:ko.Computed<Array<any>>
  autoCloseCookieName:string
  settingsPresets:ko.ObservableArray<SettingsOption>
  selectedSettingsPreset:ko.Observable<SettingsOption>
  lastSelectedSettingsPreset:ko.Observable<SettingsOption>
  settingsOverridden:ko.Observable<boolean>
  morseViewModel:MorseViewModel
  yourSettingsDummy:SettingsOption
  customSettingsOptions:SettingsOption[] = []
  queryStringSettingsOn:boolean = false

  constructor (morseSettings:MorseSettings, setTextCallBack:any, timeEstimateCallback:any, morseViewModel:MorseViewModel) {
    MorseCookies.registerHandler(this)
    this.morseViewModel = morseViewModel
    this.yourSettingsDummy = { display: 'Your Settings', filename: 'dummy.json', isDummy: true }
    ko.extenders.classOrLetterGroupChange = (target, option) => {
      target.subscribe((newValue) => {
        // console.log(`gettingsettingspresets:class:${this.selectedClass()}`)
        // console.log(`lettergroup:${this.letterGroup()}`)
        this.getSettingsPresets(false, true)
      })
      return target
    }

    this.autoCloseCookieName = 'autoCloseLessonAccordian'
    this.morseSettings = morseSettings
    this.autoCloseLessonAccordion = ko.observable(false).extend({ saveCookie: this.autoCloseCookieName } as ko.ObservableExtenderOptions<boolean>)
    this.userTarget = ko.observable('STUDENT')
    this.selectedClass = ko.observable('').extend({ classOrLetterGroupChange: null } as ko.ObservableExtenderOptions<boolean>)
    this.userTargetInitialized = false
    this.selectedClassInitialized = false
    this.letterGroupInitialized = false
    this.displaysInitialized = false
    this.letterGroup = ko.observable('').extend({ classOrLetterGroupChange: null } as ko.ObservableExtenderOptions<boolean>)
    this.selectedDisplay = ko.observable({})
    this.selectedSettingsPreset = ko.observable(this.yourSettingsDummy)
    this.lastSelectedSettingsPreset = ko.observable(this.yourSettingsDummy)
    this.settingsOverridden = ko.observable(false)
    this.wordLists = ko.observableArray([])
    this.setText = setTextCallBack
    this.getTimeEstimate = timeEstimateCallback
    this.ifStickySets = ko.observable(false)
    this.stickySets = ko.observable('')
    this.randomizeLessons = ko.observable(true)
    this.ifOverrideTime = ko.observable(false)
    this.overrideMins = ko.observable(2)
    this.customGroup = ko.observable('')
    this.ifOverrideMinMax = ko.observable(false)
    this.trueOverrideMin = ko.observable(3)
    this.trueOverrideMax = ko.observable(3)
    this.syncSize = ko.observable(true)
    this.settingsPresets = ko.observableArray([this.yourSettingsDummy])

    this.overrideMin = ko.pureComputed({
      read: () => {
        return this.trueOverrideMin()
      },
      write: (value) => {
        this.trueOverrideMin(value)
        if (this.syncSize()) {
          this.trueOverrideMax(value)
        }
      },
      owner: this
    })

    this.overrideMax = ko.pureComputed({
      read: () => {
        if (!this.syncSize()) {
          return this.trueOverrideMax()
        } else {
          this.trueOverrideMax(this.trueOverrideMin())
          return this.trueOverrideMin()
        }
      },
      write: (value) => {
        if (value >= this.trueOverrideMin()) {
          this.trueOverrideMax(value)
        }
      },
      owner: this
    })

    this.userTargets = ko.computed(() => {
      const targs = []
      this.wordLists().forEach((x) => {
        if (!targs.find((y) => y === x.userTarget)) {
          targs.push(x.userTarget)
        }
      })
      return targs
    }, this)

    this.classes = ko.computed(() => {
      this.selectedClassInitialized = false
      this.selectedClass('')
      const cls = []
      this.wordLists().forEach((x) => {
        if (!cls.find((y) => y === x.class) && x.userTarget === this.userTarget()) {
          cls.push(x.class)
        }
      })
      return cls
    }, this)

    this.letterGroups = ko.computed(() => {
      this.letterGroupInitialized = false
      this.letterGroup('')
      const lgs = []
      if (this.selectedClass() === '' || this.userTarget() === '') {
        const missing = []
        if (this.selectedClass() === '') {
          missing.push('class')
        }
        if (this.userTarget() === '') {
          missing.push('user')
        }
        return [`Select ${missing.join(', ')}`]
      }
      this.wordLists().filter((list) => list.class === this.selectedClass() && list.userTarget === this.userTarget())
        .forEach((x) => {
          if (!lgs.find((y) => y === x.letterGroup)) {
            lgs.push(x.letterGroup)
          }
        })
      return lgs
    }, this)

    this.displays = ko.computed(() => {
      this.displaysInitialized = false
      this.selectedDisplay({})
      const dps = []
      if (this.selectedClass() === '' || this.userTarget() === '' || this.letterGroup() === '') {
        return [{ display: 'Select wordlist', fileName: 'dummy.txt', isDummy: true }]
      }
      this.wordLists().filter((list) => list.class === this.selectedClass() &&
             list.userTarget === this.userTarget() &&
             list.letterGroup === this.letterGroup())
        .forEach((x) => {
          if (!dps.find((y) => y === x.display)) {
            dps.push(x)
          }
        })
      return dps
    }, this)
  }

  // end constructor

  // toggle queryStringSettingsOn
  toggleQueryStringSettingsOn = () => {
    console.log("toggling queryStringSettingsOn")
    this.queryStringSettingsOn = !this.queryStringSettingsOn    
  }

  // helper function that takes a query string variable and its value and upserts into the query string with proper url encoding
  upsertQueryStringVariable = (variable:string, value:string):string => {  
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    const priority = ['selectedClass', 'selectedGroup', 'selectedLesson', 'selectedPreset']
    // if not toggleQueryStringSettingsOn, then do nothing
    if (!this.queryStringSettingsOn) {
      return urlParams.toString()
    }


    // if the variable and value are already set in the query string, do nothing
    if (urlParams.has(variable) && urlParams.get(variable) === value) { 
      return urlParams.toString()
    }


    // if the variable is in the priority list, remove all other variables of lower priority, with "lower priority" being later in the order of the priority array
    const idx = priority.indexOf(variable as typeof priority[number]);
    if (idx !== -1) {
      // remove only lower-priority params (those that come later)
      for (let i = idx + 1; i < priority.length; i++) {
        urlParams.delete(priority[i]);
      }
    }

    if (urlParams.has(variable)) {
      urlParams.set(variable, value)
    } else {
      urlParams.append(variable, value)
    }
    // update the URL without reloading the page
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`)
    return urlParams.toString()
  }

  // given a querty string variable, remove it from the querystring immediately in the window
  removeQueryStringVariable = (variable:string):string => {
    // log the current window query string to the console
    // console.log(`removing query string variable ${variable} from ${window.location.search}`)
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    if (urlParams.has(variable)) {
      urlParams.delete(variable)
      // update the URL without reloading the page
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`)
    }
    // console.log(`new query string is ${window.location.search}`)
    return urlParams.toString()
    

  }

  getSettingsPresets = (forceRefresh:boolean = false, selectFirstNonYour:boolean = false) => {
    let sps:SettingsOption[] = []
    sps.push(this.yourSettingsDummy)
    sps = sps.concat(this.customSettingsOptions)

    const handleAutoSelect = () => {
      if (selectFirstNonYour) {
        // console.log(`length:${this.settingsPresets().length}`)
        if (this.settingsPresets().length > 1) {
          // console.log(`class:${this.selectedClass()}`)
          if (this.selectedSettingsPreset().isDummy ||
          this.selectedSettingsPreset().filename !== this.settingsPresets()[1].filename) {
            this.setPresetSelected(this.settingsPresets()[1])
          }
        } else {
          this.setPresetSelected(this.settingsPresets()[0])
        }
      }
    }
    const handleData = (d) => {
      // console.log(d)
      // console.log(typeof d.data.options)
      if (typeof d.data !== 'undefined' && typeof d.data.options !== 'undefined') {
        this.settingsPresets(sps.concat(d.data.options))
      } else {
        this.settingsPresets(sps)
        this.setPresetSelected(this.settingsPresets()[0])
      }
      handleAutoSelect()
    }

    if (this.selectedClass() === '') {
      // do nothing
      if (forceRefresh || this.selectedClass() === '') {
        this.settingsPresets(sps)
        this.setPresetSelected(this.settingsPresets()[0])
        handleAutoSelect()
      }
    } else {
      const targetClass = ClassPresets.classes.find(c => c.className === this.selectedClass())
      // check if targetClass has letterGroups property and that lettergroups is an array
      const letterGroupsGood = typeof targetClass !== 'undefined' &&
                               typeof targetClass.letterGroups !== 'undefined' &&
                               Array.isArray(targetClass.letterGroups) &&
                               targetClass.letterGroups.length > 0

      const targetLesson = letterGroupsGood ? targetClass.letterGroups.find(l => l.letterGroup === this.letterGroup()) : null
      if (targetLesson) {
        // sps.push({ display: targetLesson.setFile })
        MorsePresetSetFileFinder.getMorsePresetSetFile(targetLesson.setFile, (data) => handleData(data))
      } else {
        if (targetClass && targetClass.defaultSetFile) {
          // sps.push({ display: targetClass.defaultSetFile })
          MorsePresetSetFileFinder.getMorsePresetSetFile(targetClass.defaultSetFile, (data) => handleData(data))
        } else {
          // no matches so use default
          this.settingsPresets(sps)
          handleAutoSelect()
        }
      }
    }
  }

  doCustomGroup = () => {
    if (this.customGroup()) {
      const data = { letters: this.customGroup().trim().replace(/ /g, '') }
      this.randomWordList(data, true)
      this.closeLessonAccordianIfAutoClosing()
    }
  }

  randomWordList = (data, ifCustom) => {
    let str = ''
    const splitWithProsignsAndStcikys = (s) => {
      let stickys = ''
      if (this.ifStickySets() && this.stickySets().trim()) {
        stickys = '|' + this.stickySets().toUpperCase().trim().replace(/ {2}/g, ' ').replace(/ /g, '|')
      }

      const regStr = `<.*?>${stickys}|[^<.*?>]|\\W`
      // console.log(regStr)
      const re = new RegExp(regStr, 'g')
      const match = s.toUpperCase().match(re)
      // console.log(match)
      return match
    }
    const chars = splitWithProsignsAndStcikys(data.letters)
    let seconds = 0
    const controlTime = (this.ifOverrideTime() || ifCustom) ? (this.overrideMins() * 60) : data.practiceSeconds
    const minWordSize = (this.ifOverrideMinMax() || ifCustom) ? this.overrideMin() : data.minWordSize
    const maxWordSize = (this.ifOverrideMinMax() || ifCustom) ? this.overrideMax() : data.maxWordSize
    // Fn to generate random number min/max inclusive
    // https://www.geeksforgeeks.org/how-to-generate-random-number-in-given-range-using-javascript/
    const randomNumber = (min, max) => {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    do {
      let word = ''

      const getWordLength = (str:string):number => {
        let count:number = 0
        let insideSquareBrackets:boolean = false

        for (let i = 0; i < str.length; i++) {
          if (str[i] === '<') {
            insideSquareBrackets = true
            count++ // prosign counts as 1
          } else if (str[i] === '>') {
            insideSquareBrackets = false
          } else if (!insideSquareBrackets) {
            count++
          }
        }

        return count
      }
      if (this.randomizeLessons()) {
        // determine word length
        const wordLength = minWordSize === maxWordSize ? minWordSize : randomNumber(minWordSize, maxWordSize)

        for (let j = 1; j <= wordLength; j++) { // for each letter
          if (getWordLength(word) < wordLength) {
            const currentWordLength = getWordLength(word)
            const freeSpaces = wordLength - currentWordLength
            const usableChars = chars.filter(x => x.length === 1 ||
              (x.startsWith('<') && x.endsWith('>')) || // prosigns counts as 1
              x.length <= freeSpaces
            )

            // determine the letter
            // console.log(chars)
            // console.log(usableChars)
            const selectedChars:string = usableChars[randomNumber(1, usableChars.length) - 1]
            console.log(`selectedChars=${selectedChars}`)
            word += selectedChars
          }
        }
      } else {
        word = data.letters
      }

      str += seconds > 0 ? (' ' + word.toUpperCase()) : word.toUpperCase()

      const est = this.getTimeEstimate(str)
      seconds = est.timeCalcs.totalTime / 1000
    } while (seconds < controlTime)

    this.setText(str)
  }

  getWordList = (filename) => {
    if (filename) {
      const isText = filename.endsWith('txt')

      const afterFound = (result) => {
        if (result.found) {
          if (isText) {
            this.setText(result.data)
          } else {
            this.randomWordList(result.data, false)
          }
          if (this.morseViewModel.cachedShuffle) {
            this.morseViewModel.shuffleWords()
            this.morseViewModel.cachedShuffle = false
          }
        } else {
          this.setText(`ERROR: Couldn't find ${filename} or it lacks .txt or .json extension.`)
        }
      }

      MorseLessonFileFinder.getMorseLessonFile(filename, afterFound)
    }
  }

  setUserTargetInitialized = () => {
    this.userTargetInitialized = true
  }

  setSelectedClassInitialized = () => {
    this.selectedClassInitialized = true
    // check for class preset
    if (GeneralUtils.getParameterByName('selectedClass')) {
      const paramClass = GeneralUtils.getParameterByName('selectedClass').toUpperCase()
      const targetClass = this.classes().find(c => c.toUpperCase() === paramClass)
      if (targetClass) {
        this.changeSelectedClass(targetClass)
        if (!this.queryStringSettingsOn) {
          // remove selectedClass from the Querystring now that we're done
          this.removeQueryStringVariable('selectedClass')
        }
      }
    }
    
  }

  setLetterGroupInitialized = () => {
    // console.log('setlettergroupinitialized')
    this.letterGroupInitialized = true
    // check for class preset
    if (GeneralUtils.getParameterByName('selectedGroup')) {
      const paramClass = GeneralUtils.getParameterByName('selectedGroup').toUpperCase()
      const targetClass = this.letterGroups().find(c => c.toUpperCase() === paramClass)
      if (targetClass) {
        this.setLetterGroup(targetClass)
        if (!this.queryStringSettingsOn) {
          // remove selectedGroup from the Querystring now that we're done
          this.removeQueryStringVariable('selectedGroup')
        }
      }
    }
  }

  setDisplaysInitialized = () => {
    this.displaysInitialized = true
    // check for 'displays' lsson preset
    if (GeneralUtils.getParameterByName('selectedLesson')) {
      const paramClass = GeneralUtils.getParameterByName('selectedLesson').toUpperCase()
      const targetClass = this.displays().find(c => c.display.toUpperCase() === paramClass)
      // get a boolean whether the query string value selectedPreset is present
      var skipPresets = false
      if (GeneralUtils.getParameterByName('selectedPreset')) {
        skipPresets = true
      } 
    
        
      
      if (targetClass) {
        this.setDisplaySelected(targetClass, skipPresets)
        if (!this.queryStringSettingsOn) {
          // remove selectedLesson from the Querystring now that we're done
          this.removeQueryStringVariable('selectedLesson')
        }
      }
    }
  }

  setSettingsPresetsInitialized = () => {
    this.settingsPresetsInitialized = true
    if (GeneralUtils.getParameterByName('selectedPreset')) {
      const paramClass = GeneralUtils.getParameterByName('selectedPreset').toUpperCase()
      const targetClass = this.settingsPresets().find(c => c.display.toUpperCase() === paramClass)
      if (targetClass) {
        //console.log(`setting preset to ${targetClass.display}`)
        // console.log(targetClass)
        this.setPresetSelected(targetClass)
        if (!this.queryStringSettingsOn) {
          // not sure why delay here is needed but something is causing it to go to default if we don't.
          // after a delay of 1 second remove selectedPreset from the Querystring now that we're done
          setTimeout(() => {
            this.removeQueryStringVariable('selectedPreset')
          }, 1000)
        }
      } else {
        console.log('no preset found')
        
      }
    }
  }

  changeUserTarget = (userTarget) => {
    if (this.userTargetInitialized) {
      this.userTarget(userTarget)
      // console.log('usertarget')
      // console.log(`calling setPresetSelection from changeUserTarget:${userTarget}`)
      this.setPresetSelected(this.selectedSettingsPreset(), true)
    }
  }

  changeSelectedClass = (selectedClass, fromClick = "") => {
    /* console.log(`class fromClick=${fromClick}`)
    if (fromClick=== 'click') {
      console.log("CLASS WAS CLICKED")
      this.removeQueryStringVariable('selectedPreset')
      this.removeQueryStringVariable('selectedGroup')
      this.removeQueryStringVariable('selectedLesson')
    } */
    if (this.selectedClassInitialized) {
      this.selectedClass(selectedClass)
      // console.log(selectedClass)
      // console.log(ClassPresets)
      //console.log('calling setPresetSelection from changeSelectedClass')
      this.setPresetSelected(this.selectedSettingsPreset(), true)
      this.upsertQueryStringVariable('selectedClass', selectedClass)
    }
  }

  setLetterGroup = (letterGroup, fromClick="") => {
    /* if (fromClick === 'click') {
      this.removeQueryStringVariable('selectedPreset')
      this.removeQueryStringVariable('selectedGroup')
      this.removeQueryStringVariable('selectedLesson')
    } */
    if (this.letterGroupInitialized) {
      // console.log('setlettergroup')
      this.letterGroup(letterGroup)
      //console.log('calling setPresetSelected from setLetterGroup')
      this.setPresetSelected(this.selectedSettingsPreset(), true)
      this.upsertQueryStringVariable('selectedGroup', letterGroup)
    }
  }

  closeLessonAccordianIfAutoClosing = () => {
    if (this.autoCloseLessonAccordion()) {
      const elem = document.getElementById('lessonAccordianButton')
      elem.click()
    }
  }

  setDisplaySelected = (display, skipPresets = false, fromClick="") => {
    /* if (fromClick=== 'click') {
      console.log('display clicked so removing selectedPreset')
      this.removeQueryStringVariable('selectedPreset')
      this.removeQueryStringVariable('selectedLesson')
    } */
    if (!display.isDummy) {
      if (this.displaysInitialized) {
        this.selectedDisplay(display)
        //console.log(display)
        this.upsertQueryStringVariable('selectedLesson', display.display)
        this.morseSettings.misc.newlineChunking(display.newlineChunking)
        // setText(`when we have lesson files, load ${selectedDisplay().fileName}`)
        this.getWordList(this.selectedDisplay().fileName)
        this.closeLessonAccordianIfAutoClosing()
        if (!skipPresets) {
          //console.log('calling setPresetSelected from setDisplaySelected')
          this.setPresetSelected(this.selectedSettingsPreset(), true)
        }
      }
    }
  }

  setPresetSelected = (preset:SettingsOption, skipReinit = false, fromClick="") => {
    // if the query string has selectedPreset, only proceed if that value equals preset.display
    if (!(fromClick==='click') && GeneralUtils.getParameterByName('selectedPreset') && GeneralUtils.getParameterByName('selectedPreset').toUpperCase() !== preset.display.toUpperCase()) {
      console.log(`skipping preset selection as query string preset is ${GeneralUtils.getParameterByName('selectedPreset')}`)
      return
    } 
    if (fromClick==='click') {
      this.removeQueryStringVariable('selectedPreset')
    }
    console.log(`setPresetSelected:${preset.display}`)
    if (this.settingsPresetsInitialized) {
      // before we do anything, if the prior was Your Settings, then
      // make those the saved serialized, unless they've been overridden

      const last = this.lastSelectedSettingsPreset()
      if (typeof last.isDummy !== 'undefined' && last.isDummy && !this.settingsOverridden()) {
        this.morseViewModel.currentSerializedSettings = MorseSettingsHandler.getCurrentSerializedSettings(this.morseViewModel)
      }

      this.selectedSettingsPreset(preset)
      const settingsInfo = new SettingsChangeInfo(this.morseViewModel)
      settingsInfo.ifLoadSettings = true
      settingsInfo.ignoreCookies = true
      settingsInfo.lockoutCookieChanges = true
      settingsInfo.keyBlacklist = ['ditFrequency', 'dahFrequency', 'syncFreq', 'cardFontPx', 'preSpace', 'volume', 'voiceVolume']

      const applyOverrides = () => {
        /* make a copy as it seems some caching may be happening */
        const customCopy = []
        settingsInfo.custom.forEach(f => {
          customCopy.push({ key: f.key, value: f.value })
        })
        settingsInfo.custom = customCopy
        /* handle overrides */
        // console.log(`lettergroup:${this.letterGroup()}`)
        // console.log(`file:${this.selectedDisplay().fileName}`)
        // console.log(settingsInfo.custom)
        SettingsOverridesJson.overrides.forEach(o => {
          if (
            (o.filters.letterGroup.some(s => s === this.letterGroup())) ||
            (o.filters.fileName.some(s => s === this.selectedDisplay().fileName))
          ) {
            // console.log('filter found!')
            // note, possibly they match but issue for another day...
            this.settingsOverridden(true)
            o.settings.forEach(f => {
              const target = settingsInfo.custom.find(t => t.key === f.name)
              if (target) {
                target.value = f.value
              } else {
                settingsInfo.custom.push({ key: f.name, value: f.value })
              }
            })
          } else {
            this.settingsOverridden(false)
          }
        })
      }

      if (typeof preset.isDummy !== 'undefined' && preset.isDummy) {
        // restore whatever the defaults are
        // console.log('restoring settings')
        if (this.morseViewModel.currentSerializedSettings) {
          settingsInfo.custom = this.morseViewModel.currentSerializedSettings.morseSettings
            .map((m) => {
              return { key: m.key, value: m.value }
            })

          applyOverrides()
          MorseCookies.loadCookiesOrDefaults(settingsInfo)
        } else {
          // console.log('no serialized originals')
          this.morseViewModel.currentSerializedSettings = MorseSettingsHandler.getCurrentSerializedSettings(this.morseViewModel)
        }
      } else {
        // console.log(`presetfilename:${preset.filename}`)

        if (!preset.isCustom) {
          MorsePresetFileFinder.getMorsePresetFile(preset.filename, (d) => {
            if (d.found) {
            /* did this filter before keyBlacklist feature was added... */
              settingsInfo.custom = d.data.morseSettings.filter(f => f.key !== 'showRaw')

              applyOverrides()
              // console.log(settingsInfo.custom)
              MorseCookies.loadCookiesOrDefaults(settingsInfo)
            }
          })
        } else {
          // the settings are just attached to the option
          settingsInfo.custom = preset.morseSettings.filter(f => f.key !== 'showRaw')

          applyOverrides()
          // console.log(settingsInfo.custom)
          MorseCookies.loadCookiesOrDefaults(settingsInfo)
        }
      }

      // give time for settings to change, then re-init the lesson
      if (!skipReinit) {
        if (this.morseViewModel.lessons.selectedDisplay().display && !this.morseViewModel.lessons.selectedDisplay().isDummy) {
          setTimeout(() => { this.morseViewModel.lessons.setDisplaySelected(this.morseViewModel.lessons.selectedDisplay(), true) }
            , 1000)
        }
      }

      this.lastSelectedSettingsPreset(preset)
      // console.log(`leaving the selected preset is ${this.selectedSettingsPreset().display}`)
      this.upsertQueryStringVariable('selectedPreset', preset.display)
    }
  }

  initializeWordList = () => {
    this.wordLists(WordListsJson.fileOptions)
  }

  // cookie handling
  handleCookies = (cookies: Array<CookieInfo>) => {
    if (!cookies) {
      return
    }
    let target:CookieInfo = cookies.find(x => x.key === this.autoCloseCookieName)
    if (target) {
      this.autoCloseLessonAccordion(GeneralUtils.booleanize(target.val))
    }
    target = cookies.find(x => x.key === 'stickySets')
    if (target) {
      this.stickySets(GeneralUtils.booleanize(target.val))
    }
    target = cookies.find(x => x.key === 'ifStickySets')
    if (target) {
      this.ifStickySets(GeneralUtils.booleanize(target.val))
    }
    target = cookies.find(x => x.key === 'customGroup')
    if (target) {
      this.customGroup(target.val)
    }
    target = cookies.find(x => x.key === 'overrideSize')
    if (target) {
      this.ifOverrideMinMax(GeneralUtils.booleanize(target.val))
    }
    target = cookies.find(x => x.key === 'overrideSizeMin')
    if (target) {
      this.overrideMin(target.val as unknown as number)
    }
    target = cookies.find(x => x.key === 'overrideSizeMax')
    if (target) {
      this.overrideMax(target.val as unknown as number)
    }
    target = cookies.find(x => x.key === 'syncSize')
    if (target) {
      this.syncSize(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'shuffleIntraGroup')
    if (target) {
      this.morseViewModel.shuffleIntraGroup(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'isShuffledSet')
    if (target) {
      console.log(`found isShuffled cookie:${target.val}`)
      if (GeneralUtils.booleanize(target.val)) {
        this.morseViewModel.cachedShuffle = true
      }
    }
  }

  handleCookie = (cookie: string) => {}
}
