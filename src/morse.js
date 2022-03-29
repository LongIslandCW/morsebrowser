import ko from 'knockout';

//see https://getbootstrap.com/docs/5.0/getting-started/webpack/
import 'bootstrap/dist/css/bootstrap.min.css';
// You can specify which plugins you need
import { Tooltip, Toast, Popover } from 'bootstrap';

import MorseStringUtils from './morseStringUtils.js';
import {MorseStringToWavBufferConfig} from './morseStringToWavBuffer.js';
import { MorseWordPlayer } from './morseWordPlayer.js';
import RSSParser from 'rss-parser';


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
    self.rssFeedUrl = ko.observable("https://moxie.foxnews.com/feedburner/latest.xml");
    self.proxydUrl = ko.observable("http://127.0.0.1:8085/");
    self.rssPlayMins = ko.observable(5);
    self.rssPollMins = ko.observable(5);
    self.rssTitlesQueue = ko.observableArray();
    self.rssPlayOn = ko.observable(false);
    self.playerPlaying = ko.observable(false);
    self.lastFullPlayTime = ko.observable(new Date(1900, 0, 0));
    self.lastRSSPoll = ko.observable(new Date(1900, 0, 0));
    self.rssPlayTimerHandle = null;
    self.rssPollTimerHandle = null;
    self.rssMinsToWait = ko.observable(-1);
    self.rssPollMinsToWait = ko.observable(-1);
    self.rssPollingOn = ko.observable(false);
    self.rssPolling = ko.observable(false);
    

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
                //experience shows it is good to put a little pause here
                //so they dont' blur together
                setTimeout(self.doPlay,1000);
             }
        });
        
    }
    
    self.fullRewind = function() {
        //if (self.sentenceMax()>0) {
            self.currentSentanceIndex(0);
            self.currentIndex(0);
        //}  
    }

    self.doPlay = function(playJustEnded) {
        self.playerPlaying(true);
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
            self.morseWordPlayer.play(config, self.playEnded);
        })
        ,playJustEnded ? 0: 1000);
    };
        
    
    self.playEnded = function () {
        console.log('ended');
        if (self.currentIndex()<self.words().length-1) {
            self.incrementIndex();
            self.doPlay(true);
        } else if (self.currentSentanceIndex() < self.sentenceMax() ) {
            //move to next sentence
           
            self.currentSentanceIndex(Number(self.currentSentanceIndex())+1);
            self.currentIndex(0);
            self.doPlay(true);
            
        } else {
            self.doPause();
        }
    }
    
    self.doPause = function() {
        self.morseWordPlayer.pause(()=>{
            // we're here if a complete rawtext finished
            self.playerPlaying(false);
            self.lastFullPlayTime(Date.now());
            self.rssPlayCallback();

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

    self.unreadRssCount = ko.computed(function() {
        var unread = self.rssTitlesQueue().filter(x=>!x.played);
        //console.log("unread:");
        //console.log(unread);
        return !unread ? 0 : unread.length;
    },self)

    self.playRssButtonText = ko.computed(function() {
        var minsToWait = self.rssMinsToWait();
        var waitingText = "";
        if (minsToWait>0 && self.rssPlayOn()) {
            waitingText = " Waiting ";
            if (minsToWait>1) {
                waitingText += Math.round(minsToWait).toString() + " min";
            } else {
                waitingText += Math.round(60 * minsToWait).toString() + " sec";
            }
        }
        return (self.rssPlayOn() ? "Stop" :"Play") +  " RSS (" + self.unreadRssCount() + ")" + waitingText;
    })

    self.pollRssButtonText = ko.computed(function() {
        var minsToWait = self.rssPollMinsToWait();
        var waitingText = "";
        if (minsToWait>0 && self.rssPollingOn()) {
            waitingText = " Waiting ";
            if (minsToWait>1) {
                waitingText += Math.round(minsToWait).toString() + " min";
            } else {
                waitingText += Math.round(60 * minsToWait).toString() + " sec";
            }
        }
        return (self.rssPollingOn() ? "Polling" :"Poll") +  " RSS"  + waitingText;
    })

    self.rssPlayCallback = function() {
        if (self.rssPlayOn()) {
            var msSince = Date.now() -self.lastFullPlayTime();
            var minSince = msSince / 1000 / 60;
            var enoughWait = (minSince > self.rssPlayMins());
            if (!self.playerPlaying()) {
                if (enoughWait) {
                    self.rssMinsToWait(-1);
                    if (self.unreadRssCount() > 0) {
                        var target = self.rssTitlesQueue().find(x=>!x.played);
                        var replacement = {"title": target.title, "played": true};
                        self.rssTitlesQueue.replace(target,replacement);

                        self.rawText(target.title);
                        self.fullRewind();
                        self.doPlay();
                    }
                } else {
                    self.rssMinsToWait(self.rssPlayMins()-minSince);
                }
            }
            self.rssPlayTimerHandle = setTimeout(self.rssPlayCallback, 20 * 1000);
        }
    }

    self.doRSSReset = function() {
        
        self.rssTitlesQueue(self.rssTitlesQueue().map(x=>{
            x.played=true;
            return x;
        }))
    }

    self.doRssPlay = function() {
        self.rssPlayOn(!self.rssPlayOn());
        if (self.rssPlayOn()) {
            self.rssPlayCallback();
        } else {
            if (self.rssPlayTimerHandle) {
                clearTimeout(self.rssPlayTimerHandle)
            }
        }
    }

    self.doRSSCallback = function() {
        if (self.rssPollingOn() && !self.rssPolling()) {
            var msSince = Date.now() -self.lastRSSPoll();
            var minSince = msSince / 1000 / 60;
            var enoughWait = (minSince > self.rssPollMins());
            if (enoughWait) {
                self.rssPolling(true);
                self.rssPollMinsToWait(-1);
                // https://github.com/rbren/rss-parser
                // this helped resolve polyfill problems:
                // https://blog.alchemy.com/blog/how-to-polyfill-node-core-modules-in-webpack-5
                let parser = new RSSParser();
                // Note: some RSS feeds can't be loaded in the browser due to CORS security.
                // To get around this, you can use a proxy.

                
                parser.parseURL(self.proxydUrl() + self.rssFeedUrl().toString(), function(err, feed) {
                    if (err) {
                        self.lastRSSPoll(Date.now());
                        alert("rss error");
                        self.rssPolling(false);
                        throw err;
                    }
                    //console.log(feed.title);

                    //note the reversal to get a fifo
                    feed.items.reverse().forEach(function(entry) {
                        //console.log(entry.title + ':' + entry.link);
                        if (!self.rssTitlesQueue().find(x=>x.title==entry.title)) {
                            self.rssTitlesQueue.push({"title": entry.title, "played":false});
                        }
                    })
                    self.lastRSSPoll(Date.now());
                    self.rssPollMinsToWait(self.rssPollMins());
                    self.rssPolling(false);
                });
            } else {

                self.rssPollMinsToWait(self.rssPollMins()-minSince);
            }
        }

        if (self.rssPollingOn()) {
            self.rssPollTimerHandle = setTimeout(self.doRSSCallback, 15 * 1000);
        } else {
            if (self.rssPollTimerHandle) {
                clearTimeout(self.rssPollTimerHandle)
            }
        }
    }

    self.doRSS = function() {
        self.rssPollingOn(!self.rssPollingOn());
        if (self.rssPollingOn()) {
            self.doRSSCallback();
        } else {
            if (self.rssPollTimerHandle) {
                clearTimeout(self.rssPollTimerHandle)
            }
        }
    }
}

ko.applyBindings(new vwModel());


