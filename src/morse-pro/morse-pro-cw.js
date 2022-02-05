"use strict";
/*!
This code is © Copyright Stephen C. Phillips, 2018.
Email: steve@scphillips.com
*/
/*
Licensed under the EUPL, Version 1.2 or – as soon they will be approved by the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at: https://joinup.ec.europa.eu/community/eupl/
Unless required by applicable law or agreed to in writing, software distributed under the Licence is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and limitations under the Licence.
*/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var WPM = require("./morse-pro-wpm");
var morse_pro_message_1 = require("./morse-pro-message");
/**
 * Class to create the on/off timings needed by e.g. sound generators. Timings are in milliseconds; "off" timings are negative.
 *
 * @example
 * import MorseCW from 'morse-pro-cw';
 * var morseCW = new MorseCW();
 * morseCW.translate("abc");
 * var timings = morseCW.getTimings();
 */
var MorseCW = /** @class */ (function (_super) {
    __extends(MorseCW, _super);
    /**
     * @param {boolean} [prosigns=true] - whether or not to include prosigns in the translations
     * @param {number} [wpm=20] - the speed in words per minute using PARIS as the standard word
     * @param {number} [fwpm=wpm] - the Farnsworth speed in words per minute (defaults to wpm)
     */
    function MorseCW(useProsigns, wpm, fwpm) {
        if (useProsigns === void 0) { useProsigns = true; }
        if (wpm === void 0) { wpm = 20; }
        if (fwpm === void 0) { fwpm = wpm; }
        var _this = _super.call(this, useProsigns) || this;
        /** @type {number} */
        _this.wpm = wpm;
        /** @type {number} */
        _this.fwpm = fwpm;
        return _this;
    }
    Object.defineProperty(MorseCW.prototype, "wpm", {
        /** @type {number} */
        get: function () {
            return this._wpm;
        },
        /**
         * Set the WPM speed. Ensures that Farnsworth WPM is no faster than WPM.
         * @type {number} */
        set: function (wpm) {
            this._wpm = wpm;
            if (wpm < this._fwpm) {
                this._fwpm = wpm;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MorseCW.prototype, "fwpm", {
        /** @type {number} */
        get: function () {
            return this._fwpm;
        },
        /**
         * Set the Farnsworth WPM speed. Ensures that WPM is no slower than Farnsworth WPM.
         *  @type {number} */
        set: function (fwpm) {
            this._fwpm = fwpm;
            if (fwpm > this._wpm) {
                this._wpm = fwpm;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MorseCW.prototype, "wordSpace", {
        /**
         * Get the length of the space between words in ms.
         * @type {number} */
        get: function () {
            return WPM.wordSpace(this._wpm, this._fwpm);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Return an array of millisecond timings.
     * With the Farnsworth method, the morse characters are played at one
     * speed and the spaces between characters at a slower speed.
     * @return {number[]}
     */
    MorseCW.prototype.getTimings = function () {
        return MorseCW.getTimingsGeneral(WPM.ditLength(this._wpm), WPM.dahLength(this._wpm), WPM.ditSpace(this._wpm), WPM.charSpace(this._wpm, this._fwpm), WPM.wordSpace(this._wpm, this._fwpm), this.morse);
    };
    /**
     * Return an array of millisecond timings.
     * Each sound and space has a duration. The durations of the spaces are distinguished by being negative.
     * @param {number} dit - the length of a dit in milliseconds
     * @param {number} dah - the length of a dah in milliseconds (normally 3 * dit)
     * @param {number} ditSpace - the length of an intra-character space in milliseconds (1 * dit)
     * @param {number} charSpace - the length of an inter-character space in milliseconds (normally 3 * dit)
     * @param {number} wordSpace - the length of an inter-word space in milliseconds (normally 7 * dit)
     * @param {string} morse - the (canonical) morse code string (matching [.-/ ]*)
     * @return {number[]}
     */
    MorseCW.getTimingsGeneral = function (dit, dah, ditSpace, charSpace, wordSpace, morse) {
        //console.log("Morse: " + morse);
        morse = morse.replace(/ \/ /g, '/'); // this means that a space is only used for inter-character
        morse = morse.replace(/([\.\-])(?=[\.\-])/g, "$1+"); // put a + in between all dits and dahs
        var times = [];
        for (var i = 0; i < morse.length; i++) {
            switch (morse[i]) {
                case '.':
                    times.push(dit);
                    break;
                case '-':
                    times.push(dah);
                    break;
                case '+':
                    times.push(-ditSpace);
                    break;
                case " ":
                    times.push(-charSpace);
                    break;
                case "/":
                    times.push(-wordSpace);
                    break;
            }
        }
        //console.log("Timings: " + times);
        return times;
    };
    /**
     * Get the total duration of the message in ms
     8 @return {number}
     */
    MorseCW.prototype.getDuration = function () {
        var times = this.getTimings();
        var t = 0;
        for (var i = 0; i < times.length; i++) {
            t += Math.abs(times[i]);
        }
        return t;
    };
    return MorseCW;
}(morse_pro_message_1.default));
exports.default = MorseCW;
