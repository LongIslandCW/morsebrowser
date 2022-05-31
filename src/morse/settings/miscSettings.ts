import * as ko from 'knockout'
export class MiscSettings {
  newlineChunking:ko.Observable<boolean>
  constructor () {
    this.newlineChunking = ko.observable(false)
  }
}
