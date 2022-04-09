/* abstract away the playing of wav buffer in case browser issues come up, etc
can change the code here and other code won't be affected.
*/
export default class MorseWavBufferPlayer {
    myAudioContext;
    source;
    sourceEnded;
    sourceEndedCallBack;

    play = (wav, onEnded) => {
      this.sourceEnded = false
      this.sourceEndedCallBack = onEnded
      if (typeof (this.myAudioContext) === 'undefined') {
        this.myAudioContext = new AudioContext()
      }

      this.source = this.myAudioContext.createBufferSource()
      this.source.addEventListener('ended', () => {
        this.sourceEnded = true
        this.sourceEndedCallBack()
      })
      const mybuf = new Int8Array(wav).buffer
      let mybuf2
      this.myAudioContext.decodeAudioData(mybuf, (x) => {
        // thanks https://middleearmedia.com/web-audio-api-audio-buffer/
        mybuf2 = x
        this.source.buffer = mybuf2
        this.source.connect(this.myAudioContext.destination)
        this.source.start(0)
      }, (e) => {
        console.log('error')
        console.log(e)
      })
    }

    forceStop = (pauseCallBack) => {
      if (typeof (this.myAudioContext) === 'undefined') {
        pauseCallBack()
      } else {
        // console.log(myAudioContext.state);
        if (typeof (this.source) !== 'undefined') {
          if (!this.sourceEnded) {
            this.sourceEndedCallBack = pauseCallBack
            this.source.stop()
          } else {
            pauseCallBack()
          }
        } else {
          pauseCallBack()
        }
      }
    }
}
