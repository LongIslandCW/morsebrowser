export class MorseShortcutKeys {
  static init (ctxt) {
    ctxt.routeShortcutKey = (key) => {
      // console.log('routing shortcut key')
      switch (key) {
        case 'z':
          ctxt.changeFarnsworth(-1)
          break
        case 'x':
          ctxt.changeFarnsworth(1)
          break
      }
    }

    ctxt.changeFarnsworth = (x) => {
      // console.log('changing farnsworth')
      const newWpm = parseInt(ctxt.wpm()) + x
      const newFwpm = parseInt(ctxt.fwpm()) + x
      if (newWpm < 1 || newFwpm < 1) {
        return
      }

      if (ctxt.syncWpm()) {
        ctxt.wpm(newWpm)
        return
      }

      if (newFwpm > ctxt.wpm()) {
        ctxt.wpm(newWpm)
      }
      ctxt.fwpm(newFwpm)
    }
  }
}
