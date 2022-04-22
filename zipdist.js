const zip = require('zip-a-folder')
const path = require('path')
const fs = require('fs')

class TestMe {
  static async main () {
    function ensureDirSync (dirpath) {
      try {
        return fs.mkdirSync(dirpath)
      } catch (err) {
        if (err.code !== 'EEXIST') throw err
      }
    }
    const zipFileName = 'morse.zip'
    const zipFromFolder = path.resolve(__dirname, 'dist')
    const endDownLoadFolder = path.join(zipFromFolder, 'download')
    const endDownLoadFile = path.join(endDownLoadFolder, zipFileName)
    const initialZipFile = path.resolve(__dirname, zipFileName)

    // zip has circular problem so we do it in stages
    // delete old directorty
    fs.rmSync(endDownLoadFolder, { recursive: true, force: true })
    await zip.zip(zipFromFolder, initialZipFile)
    ensureDirSync(endDownLoadFolder)
    fs.renameSync(initialZipFile, endDownLoadFile)
  }
}

TestMe.main()
