import licwlogo from './assets/CW-Club-logo-clear400-300x300.png'
import downLoadPng from 'bootstrap-icons/icons/download.svg'
import volumePng from 'bootstrap-icons/icons/volume-up.svg'
import githubPng from 'bootstrap-icons/icons/github.svg'
import bookPng from 'bootstrap-icons/icons/book.svg'
import flagPng from 'bootstrap-icons/icons/flag.svg'
import lockPng from 'bootstrap-icons/icons/lock.svg'
import unlockPng from 'bootstrap-icons/icons/unlock.svg'
import checkPng from 'bootstrap-icons/icons/check-lg.svg'
import circlePng from 'bootstrap-icons/icons/circle.svg'
import playPng from 'bootstrap-icons/icons/play-circle.svg'
import pausePng from 'bootstrap-icons/icons/pause-circle.svg'
import eyePng from 'bootstrap-icons/icons/eye.svg'
import eyeslashPng from 'bootstrap-icons/icons/eye-slash.svg'
import speedometerPng from 'bootstrap-icons/icons/speedometer2.svg'
import musicnotePng from 'bootstrap-icons/icons/music-note.svg'
import graphuparrowPng from 'bootstrap-icons/icons/graph-up-arrow.svg'
import volumemutePng from 'bootstrap-icons/icons/volume-mute.svg'
import uploadPng from 'bootstrap-icons/icons/upload.svg'
import gearPng from 'bootstrap-icons/icons/gear.svg'
import skipstartPng from 'bootstrap-icons/icons/skip-start-circle.svg'
import skipbackPng from 'bootstrap-icons/icons/skip-backward-circle.svg'
import skipforwardPng from 'bootstrap-icons/icons/skip-forward-circle.svg'
import stopPng from 'bootstrap-icons/icons/stop-circle.svg'
import numlistPng from 'bootstrap-icons/icons/list-ol.svg'
import shufflePng from 'bootstrap-icons/icons/shuffle.svg'
import soundwavePng from 'bootstrap-icons/icons/soundwave.svg'

export class MorseLoadImages {
  info = []
  constructor () {
    const licwlogoImg = document.getElementById('logo')
    licwlogoImg.src = licwlogo

    const downloadImg = document.getElementById('downloadImage')
    downloadImg.src = downLoadPng

    const volumeImg = document.getElementById('volumeImage')
    volumeImg.src = volumePng

    const githubImg = document.getElementById('githubImage')
    githubImg.src = githubPng

    const bookImg = document.getElementById('bookImage')
    bookImg.src = bookPng

    const flagImg = document.getElementById('flagImage')
    flagImg.src = flagPng

    const playImg = document.getElementById('playImage')
    playImg.src = playPng

    const pauseImg = document.getElementById('pauseImage')
    pauseImg.src = pausePng

    const speedometerImg = document.getElementById('speedometerImage')
    speedometerImg.src = speedometerPng

    const musicnoteImg = document.getElementById('musicnoteImage')
    musicnoteImg.src = musicnotePng

    const graphuparrowImg = document.getElementById('graphuparrowImage')
    graphuparrowImg.src = graphuparrowPng

    const volumemuteImg = document.getElementById('volumemuteImage')
    volumemuteImg.src = volumemutePng

    const uploadImg = document.getElementById('uploadImage')
    uploadImg.src = uploadPng

    const gearImg = document.getElementById('gearImage')
    gearImg.src = gearPng

    const skipstartImg = document.getElementById('skipstartImage')
    skipstartImg.src = skipstartPng

    const skipforwardImg = document.getElementById('skipforwardImage')
    skipforwardImg.src = skipforwardPng

    const stopImg = document.getElementById('stopImage')
    stopImg.src = stopPng

    const numlistImg = document.getElementById('numlistImage')
    numlistImg.src = numlistPng

    const shuffleImg = document.getElementById('shuffleImage')
    shuffleImg.src = shufflePng

    this.info.push({ key: 'lockImage', src: lockPng })
    this.info.push({ key: 'unlockImage', src: unlockPng })
    this.info.push({ key: 'checkImage', src: checkPng })
    this.info.push({ key: 'circleImage', src: circlePng })
    this.info.push({ key: 'eyeImage', src: eyePng })
    this.info.push({ key: 'eyeslashImage', src: eyeslashPng })
    this.info.push({ key: 'skipbackImage', src: skipbackPng })
    this.info.push({ key: 'numlistImage', src: numlistPng })
    this.info.push({ key: 'soundwaveImage', src: soundwavePng })
    this.info.push({ key: 'volumeImage', src: volumePng })
  }

  getSrc = (key) => {
    const target = this.info.find(x => x.key === key)
    return target.src
  }
}
