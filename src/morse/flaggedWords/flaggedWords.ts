import * as ko from 'knockout'
export class FlaggedWords {
  flaggedWords:ko.Observable<string>
  flaggedWordsCount:ko.Computed<number>
  lastFlaggedWordMs:number
  constructor () {
    this.lastFlaggedWordMs = Date.now()
    this.flaggedWords = ko.observable('')

    this.flaggedWordsCount = ko.computed(() => {
      if (!this.flaggedWords().trim()) {
        return 0
      }
      return this.flaggedWords().trim().split(' ').length
    }, this)
  }

  clear = () => {
    this.flaggedWords('')
  }

  addFlaggedWord = (word) => {
    if (!this.flaggedWords().trim()) {
      this.flaggedWords(this.flaggedWords().trim() + word)
    } else {
      // deal with double click which is also used to pick a word
      const msNow = Date.now()
      const msPassedSince = msNow - this.lastFlaggedWordMs
      this.lastFlaggedWordMs = msNow
      const threshold = 500
      const words = this.flaggedWords().trim().split(' ')
      const lastWord = words[words.length - 1]
      if (lastWord === word && (msPassedSince < threshold)) {
        // we have a double click scenario so remove it
        words.pop()
      } else {
        words.push(word)
      }
      if (words.length === 0) {
        this.flaggedWords('')
      } else {
        this.flaggedWords(words.join(' '))
      }
    }
  }
}
