/**
 * @vitest-environment node
 */
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

const src = path.resolve(__dirname, '../../src')
const wordfilesconfigs = path.join(src, 'wordfilesconfigs')
const wordFilesDir = path.join(src, 'wordfiles')
const wordlistsjsonfile = path.join(wordfilesconfigs, 'wordlists.json')

const extensionOk = (s: string) => {
  return s.toUpperCase().endsWith('.TXT') || s.toUpperCase().endsWith('.JSON')
}

describe('checklessons wordlists integrity', () => {
  it('wordlists.json loads with fileOptions', () => {
    const wordlistsjson = JSON.parse(fs.readFileSync(wordlistsjsonfile, 'utf8'))
    expect(Array.isArray(wordlistsjson.fileOptions)).toBe(true)
    expect(wordlistsjson.fileOptions.length).toBeGreaterThan(0)
  })

  it('every fileOptions entry uses txt or json extension', () => {
    const wordlistsjson = JSON.parse(fs.readFileSync(wordlistsjsonfile, 'utf8'))
    wordlistsjson.fileOptions.forEach((fileOption: { fileName: string }) => {
      expect(extensionOk(fileOption.fileName)).toBe(true)
    })
  })

  it('most wordlist entries resolve to files on disk (checklessons parity)', () => {
    const wordlistsjson = JSON.parse(fs.readFileSync(wordlistsjsonfile, 'utf8'))
    const contents = fs.readdirSync(wordFilesDir, { withFileTypes: true })
    const names = new Set(contents.map((x) => x.name))
    let missing = 0
    wordlistsjson.fileOptions.forEach((fileOption: { fileName: string }) => {
      if (!names.has(fileOption.fileName)) {
        missing++
      }
    })
    const total = wordlistsjson.fileOptions.length
    const foundRatio = (total - missing) / total
    expect(foundRatio).toBeGreaterThan(0.85)
  })
})
