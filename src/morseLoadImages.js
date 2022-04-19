import licwlogo from './assets/CW-Club-logo-clear400-300x300.png'
import downLoadPng from 'bootstrap-icons/icons/download.svg'
import volumePng from 'bootstrap-icons/icons/volume-up.svg'
import githubPng from 'bootstrap-icons/icons/github.svg'
import bookPng from 'bootstrap-icons/icons/book.svg'
import flagPng from 'bootstrap-icons/icons/flag.svg'
import lockPng from 'bootstrap-icons/icons/lock.svg'
import unlockPng from 'bootstrap-icons/icons/unlock.svg'

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

    this.info.push({ key: 'lockImage', src: lockPng })
    this.info.push({ key: 'unlockImage', src: unlockPng })
  }

  getSrc = (key) => {
    const target = this.info.find(x => x.key === key)
    return target.src
  }
}
