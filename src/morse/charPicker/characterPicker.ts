import * as ko from 'knockout'
import { CookieInfo } from '../cookies/CookieInfo'
import { ICookieHandler } from '../cookies/ICookieHandler'
import { MorseCookies } from '../cookies/morseCookies'

/**
 * Character picker mode: instead of choosing a LICW lesson, the user toggles
 * the exact characters to practice. The selection feeds the same random-group
 * generator as Custom Group (Override Size / Override Time).
 */

export type PickerCategoryId = 'letters' | 'numbers' | 'punctuation' | 'prosigns'

export interface PickerChar {
  /** Text fed to the group generator, e.g. `A`, `?`, `<AR>`. */
  value: string
  /** Text shown on the key. */
  label: string
  /** Accessible name when the label alone is unclear (punctuation, prosigns). */
  spoken: string | null
}

export interface PickerCategory {
  id: PickerCategoryId
  title: string
  /** Plural noun for "Select all …" / "Clear …" button names. */
  noun: string
  chars: PickerChar[]
}

const plain = (value: string): PickerChar => ({ value, label: value, spoken: null })

export const PICKER_CATEGORIES: PickerCategory[] = [
  {
    id: 'letters',
    title: 'Letters',
    noun: 'letters',
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(plain)
  },
  {
    id: 'numbers',
    title: 'Numbers',
    noun: 'numbers',
    chars: '1234567890'.split('').map(plain)
  },
  {
    id: 'punctuation',
    title: 'Punctuation',
    noun: 'punctuation',
    chars: [
      { value: '.', label: '.', spoken: 'period' },
      { value: ',', label: ',', spoken: 'comma' },
      { value: '?', label: '?', spoken: 'question mark' },
      { value: '/', label: '/', spoken: 'slash' },
      { value: '=', label: '=', spoken: 'equals' },
      { value: '+', label: '+', spoken: 'plus' },
      { value: '-', label: '-', spoken: 'dash' },
      { value: ':', label: ':', spoken: 'colon' },
      { value: '(', label: '(', spoken: 'open parenthesis' },
      { value: ')', label: ')', spoken: 'close parenthesis' },
      { value: '"', label: '"', spoken: 'quotation mark' },
      { value: '@', label: '@', spoken: 'at sign' },
      { value: '!', label: '!', spoken: 'exclamation mark' },
      { value: '&', label: '&', spoken: 'ampersand' }
    ]
  },
  {
    id: 'prosigns',
    title: 'Prosigns',
    noun: 'prosigns',
    chars: ['AR', 'BT', 'BK', 'KN', 'SK', 'AS'].map((p) => ({
      value: `<${p}>`,
      label: p,
      spoken: `${p.split('').join(' ')} prosign`
    }))
  }
]

const ALL_VALUES: string[] = PICKER_CATEGORIES.flatMap((c) => c.chars.map((ch) => ch.value))

/** Order selected values like the catalog and join them for the group generator. */
export const serializePicked = (values: string[]): string => {
  const wanted = new Set(values)
  return ALL_VALUES.filter((v) => wanted.has(v)).join('')
}

/** Parse a stored selection (`LCD<AR>?`) back into known values, dropping anything unknown. */
export const parsePicked = (stored: string | null | undefined): string[] => {
  if (!stored) {
    return []
  }
  const tokens = stored.toUpperCase().match(/<[^>]*>|[^<\s]/g) ?? []
  const known = new Set(ALL_VALUES)
  return serializePicked(tokens.filter((t) => known.has(t))).match(/<[^>]*>|./g) ?? []
}

export class CharacterPicker implements ICookieHandler {
  static readonly MODE_COOKIE = 'charPickerMode'
  static readonly CHARS_COOKIE = 'pickedCharacters'

  categories = PICKER_CATEGORIES
  mode: ko.Observable<boolean> = ko.observable(false)
  selected: ko.ObservableArray<string> = ko.observableArray<string>([])
  /** Selection in generator form, e.g. `LCDPSG<AR>`. */
  letters: ko.PureComputed<string>
  count: ko.PureComputed<number>
  /** Short visible summary, e.g. `6 selected: L C D P S G`. */
  summary: ko.PureComputed<string>

  constructor (registerCookies = true) {
    if (registerCookies) {
      MorseCookies.registerHandler(this)
    }
    this.letters = ko.pureComputed(() => serializePicked(this.selected()))
    this.count = ko.pureComputed(() => this.selected().length)
    this.summary = ko.pureComputed(() => {
      const picked = this.selected()
      if (picked.length === 0) {
        return 'No characters selected'
      }
      const shown = parsePicked(serializePicked(picked)).map((v) => v.replace(/[<>]/g, ''))
      return `${picked.length} selected: ${shown.join(' ')}`
    })
  }

  hasSelection = (): boolean => this.selected().length > 0

  isSelected = (value: string): boolean => this.selected().includes(value)

  toggle = (value: string) => {
    if (this.isSelected(value)) {
      this.selected.remove(value)
    } else {
      this.selected(parsePicked(serializePicked([...this.selected(), value])))
    }
  }

  private category = (id: PickerCategoryId): PickerCategory =>
    PICKER_CATEGORIES.find((c) => c.id === id) as PickerCategory

  selectCategory = (id: PickerCategoryId) => {
    const add = this.category(id).chars.map((c) => c.value)
    this.selected(parsePicked(serializePicked([...this.selected(), ...add])))
  }

  clearCategory = (id: PickerCategoryId) => {
    const drop = new Set(this.category(id).chars.map((c) => c.value))
    this.selected(this.selected().filter((v) => !drop.has(v)))
  }

  clearAll = () => {
    this.selected([])
  }

  categoryCount = (id: PickerCategoryId): number => {
    const values = new Set(this.category(id).chars.map((c) => c.value))
    return this.selected().filter((v) => values.has(v)).length
  }

  handleCookies = (cookies: Array<CookieInfo>) => {
    if (!cookies) {
      return
    }
    const chars = cookies.find((x) => x.key === CharacterPicker.CHARS_COOKIE)
    if (chars) {
      this.selected(parsePicked(chars.val))
    }
    const mode = cookies.find((x) => x.key === CharacterPicker.MODE_COOKIE)
    if (mode) {
      this.mode(String(mode.val) === 'true')
    }
  }

  handleCookie = (_cookie: string) => {}
}
