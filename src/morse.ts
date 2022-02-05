
import MorseCWWave from './morse-pro/morse-pro-cw-wave.js';
import * as RiffWave from './morse-pro/morse-pro-util-riffwave.js';
//import * as fs from 'fs';


//POC we save to physical file
//fs.writeFileSync('test.wav',new Int8Array( wav));
let message: string = 'Hello World2';
console.log(message);
let myAudio = new Audio();

function doPlay(word:string, wpm:number, fwpm:number,onEnded:any) {
    let useProsigns=true;
    let frequency=550;
    let sampleRate=8000;
    let unit = 1200 / fwpm;
    console.log(unit);
    let wordSpace = unit * 7;
    let morseCWWave = new MorseCWWave(useProsigns, wpm, fwpm, frequency, sampleRate);
    morseCWWave.translate(word,false);
    var wav = RiffWave.getData(morseCWWave.getSample(wordSpace)); 
    myAudio = null;
    myAudio = new Audio();
    let mybuf = new Int8Array(wav).buffer;
    
    let url = window.URL.createObjectURL(new Blob([mybuf]));
    
    myAudio.src=url;
    myAudio.addEventListener('ended', ()=>{
        onEnded();
    });
    myAudio.play();
}

function doPause(pauseCallBack) {
    myAudio.addEventListener('pause', ()=>{
        pauseCallBack();
    } )
    console.log("ended:" + myAudio.ended);
    if (myAudio.ended || myAudio.paused || !myAudio.src) {
        pauseCallBack()
    } else {
        myAudio.pause();
    }
}

(window as any).doPlay = doPlay;
(window as any).doPause = doPause;

