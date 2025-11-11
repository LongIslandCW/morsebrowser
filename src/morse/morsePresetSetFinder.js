/*
This file is auto generated during build from morseLessonFinderTemplate.js
by the prebuildLessons.js script
*/
export class MorsePresetSetFileFinder {
  static getMorsePresetSetFile = (fileName, afterFound) => {
    switch (fileName) {
      // BEGINA
      case 'A.json':
        import('../presets/sets/A.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'ADV1.json':
        import('../presets/sets/ADV1.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'ADV2.json':
        import('../presets/sets/ADV2.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'ADV3.json':
        import('../presets/sets/ADV3.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'bc1.json':
        import('../presets/sets/bc1.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'bc2.json':
        import('../presets/sets/bc2.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'bc3.json':
        import('../presets/sets/bc3.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'INT1.json':
        import('../presets/sets/INT1.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'INT2.json':
        import('../presets/sets/INT2.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'INT3.json':
        import('../presets/sets/INT3.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'POL.json':
        import('../presets/sets/POL.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'TTR+.json':
        import('../presets/sets/TTR+.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
        // BEGINB
      default:
        afterFound({ found: false, data: null })
    }
  }
}
