/* Describe the bug
If you have voice activated, then playback will stop when the screen on a phone (certainly Android) goes blank.

Expected behavior
Either playback should continue with the screen blank, or the screen should be prevented from going blank.

Additional context
This problem was fixed a couple of years ago in the Morse Code World tools.
The problem (from what I remember) is that the Speech Synthesis API is not permitted to work when the screen is blank. To get round this, the MCW tools use the navigator.wakelock feature to keep the screen on if speech is enabled.

I wrote the following class which you are free to use. You'd need to make a single instance of the class, call activate when voice is enabled and deactivate when voice is disabled:
 */
export default class ScreenWakeLock {
  requested: boolean
  wakeLock: any
  wakeLockAvailable: boolean

  constructor () {
    this.requested = false
    this.wakeLock = null
    if ('wakeLock' in navigator) {
      this.wakeLockAvailable = true
      // The wakelock is automatically lost when the user navigates away from the page (to a different tab for intance).
      // We therefore need to reaquire it if they navigate back.
      document.addEventListener('visibilitychange', () => {
        if (this.requested === true && document.visibilityState === 'visible') {
          this.wakeLock = null
          this.activate()
        }
      })
    } else {
      this.wakeLockAvailable = false
    }
  }

  activate () {
    if (this.wakeLockAvailable && this.wakeLock === null) {
      this.requested = true
      try {
        (navigator as any).wakeLock.request('screen').then(lock => {
          this.wakeLock = lock
        })
      } catch (error) {
        // The Wake Lock request has failed - usually system related, such as battery being low.
        console.log(`Failed to get wakeLock: ${error.name}, ${error.message}`)
      }
    }
  }

  deactivate () {
    this.requested = false
    if (this.wakeLock !== null) {
      this.wakeLock.release().then(() => {
        this.wakeLock = null
      })
    }
  }
}
