/*
This file is auto generated during build from morseLessonFinderTemplate.js
by the prebuildLessons.js script
*/
export class MorsePresetFileFinder {
  static getMorsePresetFile = (fileName, afterFound) => {
    switch (fileName) {
      // BEGINA
      case 'Randy_Test.json':
        import('../presets/configs/Randy_Test.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
        // BEGINB
      default:
        afterFound({ found: false, data: null })
    }
  }
}
