"use strict";
/*
* RIFFWAVE adapted from RIFFWAVE.js v0.03 - Audio encoder for HTML5 <audio> elements.
* Copyleft 2011 by Pedro Ladaria <pedro.ladaria at Gmail dot com>
* Public Domain
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMIMEType = exports.getData = void 0;
/*
* Adaptation by Stephen C. Phillips, 2013-2017.
* Email: steve@scphillips.com
* Public Domain
*/
/**
 * Utility to create RIFF WAVE file data.
 *
 * @example
 * import MorseCWWave from 'morse-pro-cw-wave';
 * import * as RiffWave from 'morse-pro-util-riffwave';
 * var morseCWWave = new MorseCWWave();
 * morseCWWave.translate("abc");
 * var wav = RiffWave.getData(morseCWWave.getSample());  // returns byte array of WAV file
  */
var u32ToArray = function (i) {
    return [i & 0xFF, (i >> 8) & 0xFF, (i >> 16) & 0xFF, (i >> 24) & 0xFF];
};
var u16ToArray = function (i) {
    return [i & 0xFF, (i >> 8) & 0xFF];
};
var split16bitArray = function (data) {
    var r = [];
    var j = 0;
    var len = data.length;
    for (var i = 0; i < len; i++) {
        r[j++] = data[i] & 0xFF;
        r[j++] = (data[i] >> 8) & 0xFF;
    }
    return r;
};
var fToU8 = function (data) {
    var r = [];
    for (var i = 0; i < data.length; i++) {
        r[i] = Math.max(Math.min(128 + Math.round(127 * data[i]), 255), 0);
    }
    return r;
};
/**
 * Convert PCM data to WAV file data.
 * @param {number[]} data - waveform data, expected to be in (and clamped to) range [-1,1]
 * @param {number} [sampleRate=8000] - the sample rate of the waveform in Hz
 * @param {number} [bitsPerSample=8] - number of bits to store each data point (8 or 16)
 * @return {number[]} - array of bytes representing the WAV file
 */
function getData(data, sampleRate, bitsPerSample) {
    if (sampleRate === void 0) { sampleRate = 8000; }
    if (bitsPerSample === void 0) { bitsPerSample = 8; }
    data = fToU8(data);
    var header = {
        chunkId: [0x52, 0x49, 0x46, 0x46],
        chunkSize: 0,
        format: [0x57, 0x41, 0x56, 0x45],
        subChunk1Id: [0x66, 0x6d, 0x74, 0x20],
        subChunk1Size: 16,
        audioFormat: 1,
        numChannels: 1,
        sampleRate: sampleRate,
        byteRate: 0,
        blockAlign: 0,
        bitsPerSample: bitsPerSample,
        subChunk2Id: [0x64, 0x61, 0x74, 0x61],
        subChunk2Size: 0 // 40   4    data size = NumSamples*NumChannels*BitsPerSample/8
    };
    header.blockAlign = (header.numChannels * header.bitsPerSample) >> 3;
    header.byteRate = header.blockAlign * header.sampleRate;
    header.subChunk2Size = data.length * (header.bitsPerSample >> 3);
    header.chunkSize = 36 + header.subChunk2Size;
    return header.chunkId.concat(u32ToArray(header.chunkSize), header.format, header.subChunk1Id, u32ToArray(header.subChunk1Size), u16ToArray(header.audioFormat), u16ToArray(header.numChannels), u32ToArray(header.sampleRate), u32ToArray(header.byteRate), u16ToArray(header.blockAlign), u16ToArray(header.bitsPerSample), header.subChunk2Id, u32ToArray(header.subChunk2Size), (header.bitsPerSample == 16) ? split16bitArray(data) : data);
}
exports.getData = getData;
function getMIMEType() {
    return "audio/wav";
}
exports.getMIMEType = getMIMEType;
