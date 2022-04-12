import MorseCWWave from './morse-pro/morse-pro-cw-wave.js'
import * as RiffWave from './morse-pro/morse-pro-util-riffwave.js'

export class MorseStringToWavBufferConfig {
    word;
    wpm;
    fwpm;
    ditFrequency;
    dahFrequency;
    prePaddingMs;
    xtraWordSpaceDits;
    volume;
    get frequency () { return this.ditFrequency }
}

export class MorseStringToWavBuffer {
    static createWav = (config) => {
      const useProsigns = true
      const sampleRate = 8000
      const unit = 1200 / config.fwpm
      const wordSpace = (unit * 7) + (unit * config.xtraWordSpaceDits)
      const morseCWWave = new MorseCWWave(useProsigns, config.wpm, config.fwpm, { dit: config.ditFrequency, dah: config.dahFrequency }, sampleRate)
      morseCWWave.translate(config.word, false)
      const wav = RiffWave.getData(morseCWWave.getSample(wordSpace, config.prePaddingMs))
      return wav
    }
}
