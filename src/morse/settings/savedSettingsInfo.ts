export default class SavedSettingsInfo {
  key:string
  value:any
  comment?:string
  constructor (key:string, value:any, comment:string = null) {
    this.key = key
    this.value = value
    this.comment = comment
  }
}
