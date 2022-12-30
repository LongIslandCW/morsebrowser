const path = require('path')
const fs = require('fs')

const srcDir = path.resolve(__dirname, 'src')
const presetsDir = path.join(srcDir, 'presets')
const setsDir = path.join(presetsDir, 'configs')
const contents = fs.readdirSync(setsDir, { withFileTypes: true })
const jsDir = path.join(srcDir, 'morse')
const templateJs = path.join(jsDir, 'morsePresetFinderTemplate.js')
const outputJs = path.join(jsDir, 'morsePresetFinder.js')
const templateContents = fs.readFileSync(templateJs).toString().trim()
const caseMatch = templateContents.match(/\/\/ BEGINA([\n|\r]*)([^]*?)([\n|\r]*)([^\n\r]*)(\/\/ BEGINB)/)
// console.log(caseMatch)

const caseSection = caseMatch[2]
const linebreak = '\r\n'
const casePieces = []
// console.log(caseSection[1])
// console.log(templateContents)
contents.forEach(file => {
  if (file.isFile() && (file.name.toUpperCase().endsWith('.TXT') || file.name.toUpperCase().endsWith('.JSON'))) {
    const piece = caseSection.replace(/dummy/g, file.name)
    casePieces.push(piece)
  }
  // console.log(`name:${file.name} isFile:${file.isFile()}`)
})
const caseArea = casePieces.join(linebreak)

const newFileContents = templateContents.replace(caseSection, caseArea) + linebreak
fs.writeFileSync(outputJs, newFileContents)
