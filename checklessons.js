const path = require('path')
const fs = require('fs')

const src = path.resolve(__dirname, 'src')
const wordfilesconfigs = path.join(src, 'wordfilesconfigs')
const wordFilesDir = path.join(src, 'wordfiles')
const wordlistsjsonfile = path.join(wordfilesconfigs, 'wordlists.json')

const wordlistsjson = JSON.parse(fs.readFileSync(wordlistsjsonfile))

const contents = fs.readdirSync(wordFilesDir, { withFileTypes: true })
const extensionOk = (s) => {
  return s.toUpperCase().endsWith('.TXT') || s.toUpperCase().endsWith('.JSON')
}

wordlistsjson.fileOptions.forEach((fileOption) => {
  if (!extensionOk(fileOption.fileName)) {
    console.log(`Warning: extension must be .json or .txt: sort:${fileOption.sort} fileName:${fileOption.fileName}`)
  }
  const targetExists = contents.find((x) => x.name === fileOption.fileName)
  if (!targetExists) {
    console.log(`Warning: no match in wordfiles directory: sort:${fileOption.sort} fileName:${fileOption.fileName}`)
  }
})
contents.forEach((file) => {
  if (!extensionOk(file.name)) {
    console.log(`Warning: extension must be .json or .txt: /wordfiles/${file.name}`)
  }
  const targetInOptions = wordlistsjson.fileOptions.find((x) => x.fileName === file.name)
  if (!targetInOptions) {
    console.log(`Warning: nothing in wordlists.json references wordfiles/${file.name}`)
  }
})
