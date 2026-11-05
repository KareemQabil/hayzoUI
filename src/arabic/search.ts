/**
 * arabic.search.v1 — tolerant matching that never alters stored text.
 * Normalization produces an index map back to the original string so matches can be highlighted.
 */
import { normalizeDigits } from './digits'
export interface SearchOptions {
  /** أ إ آ ٱ → ا ، ؤ → و ، ئ → ي ، ء ignored */
  hamza: boolean
  /** ى → ي */
  alefMaqsura: boolean
  /** ة → ه */
  taaMarbuta: boolean
  /** عبد الرحمن ≈ عبدالرحمن */
  ignoreSpaces: boolean
}

export const DEFAULT_SEARCH: SearchOptions = { hamza: true, alefMaqsura: false, taaMarbuta: false, ignoreSpaces: false }
export const STRICT_SEARCH: SearchOptions = { hamza: false, alefMaqsura: false, taaMarbuta: false, ignoreSpaces: false }
export const DUPLICATE_CHECK: SearchOptions = { hamza: true, alefMaqsura: true, taaMarbuta: true, ignoreSpaces: true }

const DIACRITICS = /[\u064b-\u065f\u0670\u0640]/ // tashkeel, superscript alef, tatweel

export interface Normalized {
  text: string
  /** map[i] = index in the original string of normalized character i */
  map: number[]
}

export function normalizeForSearch(input: string, opts: SearchOptions): Normalized {
  let text = ''
  const map: number[] = []
  const chars = Array.from(input)
  let offset = 0
  for (const raw of chars) {
    const index = offset
    offset += raw.length
    let ch = raw.toLowerCase()
    if (DIACRITICS.test(ch)) continue
    const code = ch.codePointAt(0)!
    if (code >= 0x0660 && code <= 0x0669) ch = String(code - 0x0660)
    else if (code >= 0x06f0 && code <= 0x06f9) ch = String(code - 0x06f0)
    if (opts.hamza) {
      if ('أإآٱ'.includes(ch)) ch = 'ا'
      else if (ch === 'ؤ') ch = 'و'
      else if (ch === 'ئ') ch = 'ي'
      else if (ch === 'ء') continue
    }
    if (opts.alefMaqsura && ch === 'ى') ch = 'ي'
    if (opts.taaMarbuta && ch === 'ة') ch = 'ه'
    if (/\s/.test(ch)) {
      if (opts.ignoreSpaces) continue
      if (text.endsWith(' ')) continue
      ch = ' '
    }
    for (const c of ch) {
      text += c
      map.push(index)
    }
  }
  return { text: text.trim() === text ? text : text, map }
}

export interface MatchResult {
  match: boolean
  /** [start, end) ranges in the original string */
  ranges: Array<[number, number]>
}

export function matchText(query: string, target: string, opts: SearchOptions): MatchResult {
  const q = normalizeForSearch(query, opts).text.trim()
  if (!q) return { match: true, ranges: [] }
  const t = normalizeForSearch(target, opts)
  const at = t.text.indexOf(q)
  if (at < 0) return { match: false, ranges: [] }
  const start = t.map[at]
  const lastIdx = t.map[at + q.length - 1]
  // extend end past the last matched char and any trailing combining marks
  let end = lastIdx + (target.codePointAt(lastIdx)! > 0xffff ? 2 : 1)
  while (end < target.length && DIACRITICS.test(target[end])) end++
  return { match: true, ranges: [[start, end]] }
}

/** Similar identities to show as a warning before adding a record. Never merges anything. */
export function similarNames<T>(name: string, records: T[], getName: (r: T) => string): T[] {
  const n = normalizeForSearch(name, DUPLICATE_CHECK).text.trim()
  if (n.length < 3) return []
  return records.filter((r) => normalizeForSearch(getName(r), DUPLICATE_CHECK).text.trim() === n)
}

/**
 * Digits-only matching for phone numbers and codes: the query matches when its digits, in any numeral
 * system, appear in the target's digits, ignoring spaces, «+» and dashes. At least 3 digits, so a single
 * digit does not match every record. For Egypt, «010…» matches «+20 10 …» because the digits of the
 * international form are «2» followed by the national number.
 */
export function matchDigits(query: string, target: string, minDigits = 3): boolean {
  const q = normalizeDigits(query).text.replace(/\D/g, '')
  if (q.length < minDigits || /[^\d\s+\-()\u00a0\u202f]/.test(normalizeDigits(query).text)) return false
  return normalizeDigits(target).text.replace(/\D/g, '').includes(q)
}
