export default class MorseLessonPlugin {
    static addLessonFeatures = (ko, ctxt) => {
      ctxt.autoCloseLessonAccordian = ko.observable(false).extend({ saveCookie: 'autoCloseLessonAccordian' })

      ctxt.setUserTargetInitialized = () => {
        ctxt.userTargetInitialized = true
      }

      ctxt.setSelectedClassInitialized = () => {
        ctxt.selectedClassInitialized = true
      }

      ctxt.setLetterGroupInitialized = () => {
        // console.log('setlettergroupinitialized')
        ctxt.letterGroupInitialized = true
      }

      ctxt.setDisplaysInitialized = () => {
        ctxt.displaysInitialized = true
      }

      ctxt.changeUserTarget = (userTarget) => {
        if (ctxt.userTargetInitialized) {
          ctxt.userTarget(userTarget)
          // console.log('usertarget')
        }
      }

      ctxt.changeSelectedClass = (selectedClass) => {
        if (ctxt.selectedClassInitialized) {
          ctxt.selectedClass(selectedClass)
        }
      }

      ctxt.setLetterGroup = (letterGroup) => {
        if (ctxt.letterGroupInitialized) {
          console.log('setlettergroup')
          ctxt.letterGroup(letterGroup)
        }
      }

      ctxt.closeLessonAccordianIfAutoClosing = () => {
        if (ctxt.autoCloseLessonAccordian()) {
          const elem = document.getElementById('lessonAccordianButton')
          elem.click()
        }
      }
      ctxt.setDisplaySelected = (display) => {
        if (!display.isDummy) {
          if (ctxt.displaysInitialized) {
            ctxt.selectedDisplay(display)
            ctxt.setText(`when we have lesson files, load ${ctxt.selectedDisplay().fileName}`)
            ctxt.getWordList(ctxt.selectedDisplay().fileName)
            ctxt.closeLessonAccordianIfAutoClosing()
          }
        }
      }

      ctxt.initializeWordList = () => {
        fetch('wordfilesconfigs/wordlists.json')
          .then((response) => {
            return response.json()
          })
          .then((data) => {
            ctxt.wordLists(data.fileOptions)
          })
          .catch((err) => {
            console.log('error: ' + err)
          })
      }

      ctxt.userTargets = ko.computed(() => {
        const targs = []
        ctxt.wordLists().forEach((x) => {
          if (!targs.find((y) => y === x.userTarget)) {
            targs.push(x.userTarget)
          }
        })
        return targs
      }, ctxt)

      ctxt.classes = ko.computed(() => {
        const cls = []
        ctxt.wordLists().forEach((x) => {
          if (!cls.find((y) => y === x.class)) {
            cls.push(x.class)
          }
        })
        return cls
      }, ctxt)

      ctxt.letterGroups = ko.computed(() => {
        ctxt.letterGroupInitialized = false
        ctxt.letterGroup('')
        const lgs = []
        if (ctxt.selectedClass() === '' || ctxt.userTarget() === '') {
          const missing = []
          if (ctxt.selectedClass() === '') {
            missing.push('class')
          }
          if (ctxt.userTarget() === '') {
            missing.push('user')
          }
          return [`Select ${missing.join(', ')}`]
        }
        ctxt.wordLists().filter((list) => list.class === ctxt.selectedClass() && list.userTarget === ctxt.userTarget())
          .forEach((x) => {
            if (!lgs.find((y) => y === x.letterGroup)) {
              lgs.push(x.letterGroup)
            }
          })
        return lgs
      }, ctxt)

      ctxt.displays = ko.computed(() => {
        ctxt.displaysInitialized = false
        ctxt.selectedDisplay({})
        const dps = []
        if (ctxt.selectedClass() === '' || ctxt.userTarget() === '' || ctxt.letterGroup() === '') {
          return [{ display: 'Select wordlist', fileName: 'dummy.txt', isDummy: true }]
        }
        ctxt.wordLists().filter((list) => list.class === ctxt.selectedClass() &&
           list.userTarget === ctxt.userTarget() &&
           list.letterGroup === ctxt.letterGroup())
          .forEach((x) => {
            if (!dps.find((y) => y === x.display)) {
              dps.push({ display: x.display, fileName: x.fileName })
            }
          })
        return dps
      }, ctxt)

      ctxt.getWordList = (filename) => {
        const isText = filename.endsWith('txt')
        fetch('wordfiles/' + filename)
          .then((response) => {
            if (isText) {
              return response.text()
            } else {
              // assume json
              return response.json()
            }
          })
          .then((data) => {
            if (isText) {
              ctxt.setText(data)
            } else {
              ctxt.randomWordList(data)
            }
          })
          .catch((err) => {
            console.log('error: ' + err)
          })
      }
    }
}
