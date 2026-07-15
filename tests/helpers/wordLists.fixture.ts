import { FileOptionsInfo } from '../../src/morse/lessons/FileOptionsInfo'

export function createWordListFixture (): FileOptionsInfo[] {
  const base = {
    sort: 1,
    userTarget: 'STUDENT',
    class: 'BC1',
    letterGroup: 'TIN',
    newlineChunking: false
  }
  return [
    { ...base, display: 'Lesson A', fileName: 'a.txt' },
    { ...base, display: 'Lesson B', fileName: 'b.txt', letterGroup: 'REA' },
    {
      ...base,
      userTarget: 'INSTRUCTOR',
      class: 'ADV1',
      letterGroup: 'FOO',
      display: 'Instructor Lesson',
      fileName: 'c.txt'
    }
  ] as FileOptionsInfo[]
}
