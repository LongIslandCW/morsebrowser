import ko from 'knockout';

//see https://getbootstrap.com/docs/5.0/getting-started/webpack/
import 'bootstrap/dist/css/bootstrap.min.css';
// You can specify which plugins you need
import { Tooltip, Toast, Popover } from 'bootstrap';

import MorseStringUtils from './morseStringUtils.js';
import {MorseStringToWavBufferConfig} from './morseStringToWavBuffer.js';
import { MorseWordPlayer } from './morseWordPlayer.js';

function vwModel()  {
    var self = this;
    self.morseWordPlayer = new MorseWordPlayer();
    self.rawText= ko.observable("hello world");
    self.wpm=ko.observable(20);
    self.fwpm=ko.observable(20);
    self.frequency=ko.observable(550);
    self.hideList=ko.observable(true);
    self.showRaw=ko.observable(true);
    self.currentSentanceIndex = ko.observable(0);
    self.currentIndex = ko.observable(0);
    self.preSpace = ko.observable(0);
    self.preSpaceUsed = ko.observable(false);
    self.xtraWordSpaceDits = ko.observable(0);

    self.sentences= ko.computed(function() { 
        return MorseStringUtils.getSentences(self.rawText());
    }, self);

    self.sentenceMax = ko.computed(function() {
        return self.sentences().length - 1;
    })
    
    self.words= ko.computed(function() { 
        return self.sentences()[self.currentSentanceIndex()];
    }, self);
    
    
    self.changeSentance = function() {
        self.currentIndex(0);
    }
    
    self.incrementIndex = function() {
        if (self.currentIndex()<self.words().length-1) {
            self.currentIndex(self.currentIndex()+1);
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
        self.morseWordPlayer.pause(()=>{
            if (self.currentIndex()>0 && self.words().length>1) {
                self.currentIndex(self.currentIndex()-1);
                console.log(self.currentIndex());
                //experience shows it is good to put a little pause here
                //so they dont' blur together
                setTimeout(self.doPlay,1000);
             }
        });
        
    }
    
    self.doPlay = function(playJustEnded) {
        if (!playJustEnded) {
            self.preSpaceUsed(false);
        }
        //experience shows it is good to put a little pause here when user forces us here,
        //e.g. hitting back or play b/c word was misunderstood,
        //so they dont' blur together.
        if (self.doPlayTimeOut) {
            clearTimeout(self.doPlayTimeOut);
        }
        self.doPlayTimeOut = setTimeout(()=>
        self.morseWordPlayer.pause(()=>{
            var config = new MorseStringToWavBufferConfig();
            config.word = self.words()[self.currentIndex()];
            config.wpm = self.wpm();
            config.fwpm= self.fwpm();
            config.ditFrequency= self.frequency();
            config.dahFrequency = self.frequency();
            config.prePaddingMs = self.preSpaceUsed() ? 0 : self.preSpace() * 1000;
            config.xtraWordSpaceDits = self.xtraWordSpaceDits();
            self.morseWordPlayer.play(config, self.playEnded);
            self.preSpaceUsed(true);
        })
        ,playJustEnded ? 0: 1000);
    };
        
    
    self.playEnded = function () {
        console.log('ended');
        if (self.currentIndex()<self.words().length-1) {
            self.incrementIndex();
            self.doPlay(true);
        } else {
            //move to next sentence
            if (self.currentSentanceIndex() < self.sentenceMax() ) {
                self.currentSentanceIndex(Number(self.currentSentanceIndex())+1);
                self.currentIndex(0);
                self.doPlay(true);
            }
        }
    }
    
    self.doPause = function() {
        self.morseWordPlayer.pause(()=>{
            self.preSpaceUsed(false);
        });
    }

    self.inputFileChange = function(file) {

        //thanks to https://newbedev.com/how-to-access-file-input-with-knockout-binding
        var fr=new FileReader();
        fr.onload=function(data){
            self.rawText(data.target.result);
        }
        fr.readAsText(file);
    }
}

ko.applyBindings(new vwModel());


