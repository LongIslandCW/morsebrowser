/*
This file is auto generated during build from morseLessonFinderTemplate.js
by the prebuildLessons.js script
*/
export class MorsePresetFileFinder {
  static getMorsePresetFile = (fileName, afterFound) => {
    switch (fileName) {
      // BEGINA
      case 'dummy':
        import('../presets/configs/dummy').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
        // BEGINB
      default:
        afterFound({ found: false, data: null })
    }
  }
}
