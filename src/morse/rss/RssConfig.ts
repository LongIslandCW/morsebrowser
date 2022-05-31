export class RssConfig {
  setText:(string) => void
  fullRewind:() => void
  doPlay:(playJustEnded:boolean, fromPlayButton:boolean) => void
  lastFullPlayTime:() => number
  playerPlaying:() => boolean
  constructor (setText:(string) => void,
    fullRewind:() => void,
    doPlay:(playJustEnded:boolean, fromPlayButton:boolean) => void,
    lastFullPlayTime:() => number,
    playerPlaying:() => boolean) {
    this.setText = setText
    this.fullRewind = fullRewind
    this.doPlay = doPlay
    this.lastFullPlayTime = lastFullPlayTime
    this.playerPlaying = playerPlaying
  }
}
