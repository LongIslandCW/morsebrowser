/*
This file is auto generated during build from morseLessonFinderTemplate.js
by the prebuildLessons.js script
*/
export class MorsePresetFileFinder {
  static getMorsePresetFile = (fileName, afterFound) => {
    switch (fileName) {
      // BEGINA
      case 'BC1_Default.json':
        import('../presets/configs/BC1_Default.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'BC1_Groups_of_5.json':
        import('../presets/configs/BC1_Groups_of_5.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'BC1_ICR.json':
        import('../presets/configs/BC1_ICR.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'BC1_Phrases_Voff.json':
        import('../presets/configs/BC1_Phrases_Voff.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'BC1_Phrases_Von.json':
        import('../presets/configs/BC1_Phrases_Von.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'BC1_Random_groups_1_3.json':
        import('../presets/configs/BC1_Random_groups_1_3.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'BC1_VET.json':
        import('../presets/configs/BC1_VET.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'BC1_Von_ Soff.json':
        import('../presets/configs/BC1_Von_ Soff.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'BC1_Von_ Son.json':
        import('../presets/configs/BC1_Von_ Son.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
      case 'BC1_VST.json':
        import('../presets/configs/BC1_VST.json').then(({ default: x }) => afterFound({ found: true, data: x }))
        break
        // BEGINB
      default:
        afterFound({ found: false, data: null })
    }
  }
}
