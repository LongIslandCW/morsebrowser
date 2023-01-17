/*
This file is auto generated during build from morseLessonFinderTemplate.js
by the prebuildLessons.js script
*/
export class MorsePresetSetFileFinder {
  static getMorsePresetSetFile = (fileName, afterFound) => {
    switch (fileName) {
      // BEGINA
      case 'bc1.json':
        import('../presets/sets/bc1.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'bc2.json':
        import('../presets/sets/bc2.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'bpt.json':
        import('../presets/sets/bpt.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'int_12_16.json':
        import('../presets/sets/int_12_16.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'int_16_20.json':
        import('../presets/sets/int_16_20.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
        // BEGINB
      default:
        afterFound({ found: false, data: null })
    }
  }
}
