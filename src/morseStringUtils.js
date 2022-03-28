export default class MorseStringUtils {
    static doReplacements = (s) => {
        return s
        // replacing exclamation with period 
        .replace(/!/g,".")
        // a few ad-hoc attempts to remove rare or non-morse characters
        .replace(/'/g,"")
        .replace(/’/g,"")
        .replace(/‘/g,"")
        // colon becomes a comma
        .replace(/:/g,",")
        // turn percent sign into pct abbreviation
        .replace(/%/g,"pct")
        // anything else except period, question mark or percent or stroke becomes a space
        .replace(/(?![,\/\.\?])\W/g," ")
    }

    static splitIntoSentences = (s) => {
        var replaced = this.doReplacements(s);
        // split on period or question mark
        var splitSents = replaced.split(/([\.\?])/);
        /* example 
        "hello there. how are you? I am fine".split(/([\.\?])/)
        (5) ['hello there', '.', ' how are you', '?', ' I am fine'] 
        */    
        //now put the punctuation back on the end of sentences
        var splitsGlued = splitSents.map((val,i,ary)=>{
            if (i==0 || i%2==0) {
                return val + (((i+1) < ary.length) ? ary[i+1] : "");
            } else {
                return "";
            }
        }).filter(y=>y!="");
        return splitsGlued;
    }

    static getSentences = (s) => {
        var splitsGlued = this.splitIntoSentences(s);
        var sents = splitsGlued
        .map((sentence)=>{
            return sentence
            .trim()
            // remove double spaces
            .replace(/  /g," ")
            // split up into words
            .split(" ")
            // get rid fo stray empties
            .filter(x=>x.trim().length>0);
        })
        .filter(x=>x.length>1 || x[0]!=".");
                
        return sents;
    }
}