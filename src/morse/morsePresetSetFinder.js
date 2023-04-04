/*
This file is auto generated during build from morseLessonFinderTemplate.js
by the prebuildLessons.js script
*/
export class MorsePresetSetFileFinder {
  static getMorsePresetSetFile = (fileName, afterFound) => {
    switch (fileName) {
      // BEGINA
      case 'ADV.json':
        import('../presets/sets/ADV.json').then(({ default: x }) => afterFound({ found: true, data: x }))
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
      case 'int_12_16.json':
        import('../presets/sets/int_12_16.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'int_16_20.json':
        import('../presets/sets/int_16_20.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'int_1_12.json':
        import('../presets/sets/int_1_12.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
        // BEGINB
      default:
        afterFound({ found: false, data: null })
    }
  }
}
