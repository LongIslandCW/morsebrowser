import { MorseSettings } from '../settings/settings'

export class MorseShortcutKeys {
  morseSettings:MorseSettings
  constructor (morseSettings:MorseSettings) {
    this.morseSettings = morseSettings
    // add the shortcut key listener
    document.addEventListener('keypress', (e) => {
      const tagName = (<any>e.target).tagName
      if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') {
        // var input = document.querySelector(".my-input");
        // input.focus();
        // input.value = e.key;
        // console.log(e.target.tagName)
        // console.log(e.key)
        this.routeShortcutKey(e.key)
        e.preventDefault()
      }
    })
  }

  routeShortcutKey (key) {
    // console.log('routing shortcut key')
    switch (key) {
      case 'z':
        this.changeFarnsworth(-1)
        break
      case 'x':
        this.changeFarnsworth(1)
        break
    }
  }

  changeFarnsworth (x) {
    // console.log('changing farnsworth')
    const newWpm = parseInt(this.morseSettings.speed.wpm() as any) + x
    const newFwpm = parseInt(this.morseSettings.speed.fwpm() as any) + x
    if (newWpm < 1 || newFwpm < 1) {
      return
    }

    if (this.morseSettings.speed.syncWpm()) {
      this.morseSettings.speed.wpm(newWpm)
      return
    }

    if (newFwpm > this.morseSettings.speed.wpm()) {
      this.morseSettings.speed.wpm(newWpm)
    }
    this.morseSettings.speed.fwpm(newFwpm)
  }
}
