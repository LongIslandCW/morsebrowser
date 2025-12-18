import WordInfo from '../wordInfo'

export interface ShuffleWordsInput {
  words: WordInfo[]
  rawText: string
  wasShuffled: boolean
  fromLoopRestart: boolean
  newlineChunking: boolean
  shuffleIntraGroup: boolean
  preShuffled: string
}

export interface ShuffleWordsResult {
  newText: string
  isShuffled: boolean
  preShuffled: string
  lastShuffled?: string
}

const shuffleArray = <T>(arr:T[]):T[] => {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

export const shuffleWordsLogic = (input:ShuffleWordsInput):ShuffleWordsResult => {
  const {
    words,
    rawText,
    wasShuffled,
    fromLoopRestart,
    newlineChunking,
    shuffleIntraGroup,
    preShuffled
  } = input

  // Shuffling case (first time, or loop restart)
  if (!wasShuffled || fromLoopRestart) {
    const hasPhrases = rawText.indexOf('\n') !== -1 && newlineChunking
    const updatedPreShuffled = wasShuffled ? preShuffled : rawText

    const groupMap = new Map<number, { firstIndex:number, words:WordInfo[] }>()
    const ungroupedUnits:WordInfo[][] = []

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const groupId = word.getGroupId()
      if (groupId == null) {
        ungroupedUnits.push([word])
        continue
      }

      const existing = groupMap.get(groupId)
      if (existing) {
        existing.words.push(word)
      } else {
        groupMap.set(groupId, { firstIndex: i, words: [word] })
      }
    }

    const groupedUnits = [...groupMap.entries()]
      .sort((a, b) => a[1].firstIndex - b[1].firstIndex)
      .map(([, info]) => {
        if (shuffleIntraGroup) {
          return shuffleArray(info.words)
        }
        return [...info.words]
      })

    const shuffleUnits:WordInfo[][] = [...groupedUnits, ...ungroupedUnits]
    const shuffledUnits = shuffleArray(shuffleUnits)
    const shuffledWords = shuffledUnits.flat()
    const lastShuffled = shuffledWords.map(w => w.rawWord).join(hasPhrases ? '\n' : ' ')

    return {
      newText: lastShuffled,
      lastShuffled,
      isShuffled: true,
      preShuffled: updatedPreShuffled
    }
  }

  // Unshuffle case
  return {
    newText: preShuffled,
    isShuffled: false,
    preShuffled
  }
}
