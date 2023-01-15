export class PlayingTimeInfo {
  minutes:number = 0
  seconds:number = 0
  constructor (minutes:number, seconds:number) {
    this.minutes = minutes
    this.seconds = seconds
  }

  get normedSeconds ():string { return (this.seconds < 10 ? '0' : '') + this.seconds }
  get totalSeconds ():number { return this.minutes * 60 + this.seconds}
}
