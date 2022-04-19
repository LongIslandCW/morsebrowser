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

    this.info.push({ key: 'lockImage', src: lockPng })
    this.info.push({ key: 'unlockImage', src: unlockPng })
    this.info.push({ key: 'checkImage', src: checkPng })
    this.info.push({ key: 'circleImage', src: circlePng })
    this.info.push({ key: 'eyeImage', src: eyePng })
    this.info.push({ key: 'eyeslashImage', src: eyeslashPng })
  }

  getSrc = (key) => {
    const target = this.info.find(x => x.key === key)
    return target.src
  }
}
