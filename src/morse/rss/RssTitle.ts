export class RssTitle {
  title:string
  played:boolean
  constructor (title:string, played:boolean = false) {
    this.title = title
    this.played = played
  }
}
