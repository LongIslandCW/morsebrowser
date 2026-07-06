import { describe, expect, it } from 'vitest'
import { GeneralUtils } from '../../../src/morse/utils/general'

describe('GeneralUtils', () => {
  describe('booleanize', () => {
    it('parses string false', () => {
      expect(GeneralUtils.booleanize('false')).toBe(false)
    })

    it('returns bare true unchanged; true-with-space branch returns false (known quirk)', () => {
      expect(GeneralUtils.booleanize('true')).toBe('true')
      expect(GeneralUtils.booleanize('true ')).toBe(false)
    })

    it('returns non-string values unchanged', () => {
      expect(GeneralUtils.booleanize(true)).toBe(true)
      expect(GeneralUtils.booleanize(1)).toBe(1)
    })
  })

  describe('getParameterByName', () => {
    it('reads query parameter from url', () => {
      const url = 'http://example.com/?selectedClass=BC1&foo=bar'
      expect(GeneralUtils.getParameterByName('selectedClass', url)).toBe('BC1')
    })

    it('returns null when parameter missing', () => {
      expect(GeneralUtils.getParameterByName('missing', 'http://example.com/')).toBeNull()
    })

    it('decodes plus as space', () => {
      const url = 'http://example.com/?q=hello+world'
      expect(GeneralUtils.getParameterByName('q', url)).toBe('hello world')
    })
  })
})
