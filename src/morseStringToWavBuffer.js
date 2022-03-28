import MorseCWWave from './morse-pro/morse-pro-cw-wave.js';
import * as RiffWave from './morse-pro/morse-pro-util-riffwave.js';

export class MorseStringToWavBufferConfig {
    word;
    wpm;
    fwpm;
    ditFrequency;
    dahFrequency;
    get frequency() { return this.ditFrequency; }
    
}

export class MorseStringToWavBuffer {

    static createWav = (config)=> {
        let useProsigns=true;
        let sampleRate=8000;
        let unit = 1200 / config.fwpm;
        let wordSpace = unit * 7;
        let morseCWWave = new MorseCWWave(useProsigns, config.wpm, config.fwpm, config.frequency, sampleRate);
        morseCWWave.translate(config.word,false);
        var wav = RiffWave.getData(morseCWWave.getSample(wordSpace));
        return wav; 
    }

}

