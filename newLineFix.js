const path = require('path')
const fs = require('fs')

const src = path.resolve(__dirname, 'src')
const wordfilesconfigs = path.join(src, 'wordfilesconfigs')
// const wordFilesDir = path.join(src, 'wordfiles')
const wordlistsjsonfile = path.join(wordfilesconfigs, 'wordlists.json')

const wordlistsjson = JSON.parse(fs.readFileSync(wordlistsjsonfile))
// console.log(wordlistsjson.fileOptions)

wordlistsjson.fileOptions.forEach(x => { x.newlineChunking = (x.class === 'ICR') })
console.log(JSON.stringify(wordlistsjson))
