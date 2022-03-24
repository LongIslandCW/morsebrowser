
import MorseCWWave from './morse-pro/morse-pro-cw-wave.js';
import * as RiffWave from './morse-pro/morse-pro-util-riffwave.js';
import ko from 'knockout';

//import * as fs from 'fs';


//POC we save to physical file
//fs.writeFileSync('test.wav',new Int8Array( wav));
let message = 'Hello World2';
console.log(message);
let myAudio = new Audio();

function doPlay(word, wpm, fwpm, frequency, onEnded) {
    let useProsigns=true;
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


function vwModel()  {
    var self = this;
    self.rawText= ko.observable("hello world");
    self.wpm=ko.observable(20);
    self.fwpm=ko.observable(20);
    self.frequency=ko.observable(550);
    self.hideList=ko.observable(true);
    self.showRaw=ko.observable(true);
    self.currentSentanceIndex = ko.observable(0);
    self.sentences= ko.computed(function() { 
        var sents = self.rawText().split(".");
        
        sents = sents
        .map((sentence)=>{
            //put the period back
            return (sentence + ".")
            .trim()
            .replace(/-/g," ")
            .replace(/'/g,"")
            .replace(/"/g," ")
            .replace(/:/g,",")
            .replace(/’/g,"")
            .replace(/‘/g,"")
            .replace(/  /g," ")
            .replace(/“/g,"")
            .replace(/”/g,"")
            .replace(/\[/g,"")
            .replace(/\]/g,"")
            .replace(/%/g," pct ")
            .replace(/\n/g,"")
            .replace(/—/g,",")
            .replace(/\$/g,"")
            
            .split(" ")
            .filter(x=>x.length>0);

        })
        .filter(x=>x.length>1 || x[0]!=".");
        console.log(sents);
        
        return sents;

        
    }, self);
    self.sentenceMax = ko.computed(function() {
        return self.sentences().length - 1;
    })
    self.words= ko.computed(function() { 
        
        
        return self.sentences()[self.currentSentanceIndex()];

        
    }, self);
    self.currentIndex = ko.observable(0);
    self.changeSentance = function() {
        self.currentIndex(0);
    }
    self.incrementIndex = function() {
        if (self.currentIndex()<self.words().length-1) {
            self.currentIndex(self.currentIndex()+1);
            console.log(self.currentIndex());
        }
        else 
        {
            //move to next sentence
            if (self.currentSentanceIndex() < self.sentenceMax() ) {
                self.currentSentanceIndex(Number(self.currentSentanceIndex())+1);
                self.currentIndex(0);
            }
        }
    }
    self.decrementIndex = function() {
        doPause(()=>{
            if (self.currentIndex()>0 && self.words().length>1) {
                self.currentIndex(self.currentIndex()-1);
                console.log(self.currentIndex());
                self.doPlay();
             }
        });
        
    }
    self.doPlay = function() {
        doPause(()=>{
            doPlay(self.words()[self.currentIndex()],self.wpm(),self.fwpm(),self.frequency(), self.playEnded)
            console.log('played');
        });
    };
        
    
    self.playEnded = function () {
        console.log('ended');
        if (self.currentIndex()<self.words().length-1) {
            self.incrementIndex();
            self.doPlay();
        } else {
            //move to next sentence
            if (self.currentSentanceIndex() < self.sentenceMax() ) {
                self.currentSentanceIndex(Number(self.currentSentanceIndex())+1);
                self.currentIndex(0);
                self.doPlay();
            }
        }
    }
    self.doPause = function() {
        doPause(()=>{});
    }
}

ko.applyBindings(new vwModel());
//window.doPlay = doPlay;
//window.doPause = doPause;
//window.ko = ko;

