// Small re-implementations of the owner's documented contracts (CONTRACTS.md and the comments in src/arabic/*.ts
// of the earlier prototype), written from the contract text for one purpose: to cross-check the expectations that
// are written by hand in fixtures-src/. build-fixtures.mjs fails when a hand-written expectation and this file
// disagree, so every disagreement is resolved by a person reading the contract. This is not the L1 implementation.
import { CH, NBSP, NNBSP } from './common.mjs'

const code = (ch) => ch.codePointAt(0)
const BIDI_CONTROLS = new Set([0x200e, 0x200f, 0x061c, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069])
export const stripBidiControls = (text) => Array.from(text).filter((ch) => !BIDI_CONTROLS.has(code(ch))).join('')
export function normalizeDigits(text) {
  return Array.from(text, (ch) => {
    const c = code(ch)
    if (c >= 0x660 && c <= 0x669) return String(c - 0x660)
    if (c >= 0x6f0 && c <= 0x6f9) return String(c - 0x6f0)
    return ch
  }).join('')
}
export const toArab = (text) => text.replace(/[0-9]/g, (d) => String.fromCodePoint(0x660 + Number(d)))

// ---- arabic.amount.v1 ------------------------------------------------------------------------------------
const ARABIC_DECIMAL = String.fromCodePoint(0x66b)
const ARABIC_THOUSANDS = String.fromCodePoint(0x66c)
const ARABIC_COMMA = String.fromCodePoint(0x60c)
const MINUS_SIGN = String.fromCodePoint(0x2212)
const GROUPERS = [ARABIC_THOUSANDS, ' ', NBSP, NNBSP, CH.THIN]
const MINOR_DIGITS = { EGP: 2, SAR: 2, KWD: 3 }
const validGroups = (groups) => groups.length < 2 || (/^\d{1,3}$/.test(groups[0]) && groups.slice(1).every((g) => /^\d{3}$/.test(g)))

export function parseAmount(input, { currency, allowNegative = false }) {
  const minorDigits = MINOR_DIGITS[currency]
  let body = normalizeDigits(stripBidiControls(input).trim())
  if (body === '') return { status: 'empty', minor: null }
  const bad = (error, suggestions) => ({ status: 'invalid', error, ...(suggestions?.length ? { suggestions } : {}) })
  const isMinus = (ch) => ch === '-' || ch === MINUS_SIGN
  if (body.length > 1 && isMinus(body[body.length - 1])) return bad('sign-position')
  let negative = false
  if (isMinus(body[0])) {
    negative = true
    body = body.slice(1).trim()
  } else if (body[0] === '+') body = body.slice(1).trim()
  const allowed = (ch) => /[0-9.,]/.test(ch) || ch === ARABIC_DECIMAL || ch === ARABIC_COMMA || GROUPERS.includes(ch)
  for (const ch of body) if (!allowed(ch)) return bad('invalid-character')
  if (!/\d/.test(body)) return bad('no-digits')
  if (negative && !allowNegative) return bad('negative-not-allowed')
  const unified = body.split(ARABIC_DECIMAL).join('.')
  if (unified.split('.').length > 2) return bad('multiple-decimal')
  const ungroup = (intSide) => {
    let groups = [intSide]
    for (const g of GROUPERS) groups = groups.flatMap((part) => part.split(g))
    return validGroups(groups) ? groups.join('') : null
  }
  const finish = (text) => {
    const [rawInt, rawFrac = ''] = text.split('.')
    if (GROUPERS.some((g) => rawFrac.includes(g))) return bad('invalid-grouping')
    const int = ungroup(rawInt)
    if (int === null) return bad('invalid-grouping')
    if (rawFrac.length > minorDigits) return bad('too-many-fraction-digits')
    const intDigits = int.replace(/^0+(?=\d)/, '') || '0'
    if (intDigits.length > 12) return bad('too-large')
    const frac = rawFrac.padEnd(minorDigits, '0')
    const minorText = (intDigits + frac).replace(/^0+(?=\d)/, '')
    const minor = Number(minorText) * (negative && minorText !== '0' ? -1 : 1)
    return { status: 'valid', minor, canonical: `${minor < 0 ? '-' : ''}${intDigits}${minorDigits ? '.' + frac : ''}` }
  }
  if (unified.includes(',') || unified.includes(ARABIC_COMMA)) {
    const commas = unified.split(ARABIC_COMMA).join(',')
    const suggestions = []
    const add = (candidate) => {
      const r = finish(candidate)
      if (r.status === 'valid' && !suggestions.includes(r.canonical)) suggestions.push(r.canonical)
    }
    if (commas.split(',').length === 2 && !commas.includes('.')) add(commas.replace(',', '.'))
    const [intSide, ...rest] = commas.split('.')
    if (validGroups(intSide.split(','))) add(intSide.split(',').join('') + (rest.length ? '.' + rest.join('') : ''))
    return bad('ambiguous-comma', suggestions)
  }
  return finish(unified)
}

// ---- arabic.phone.eg.v1 ----------------------------------------------------------------------------------
export function parsePhoneEG(input) {
  const cleaned = normalizeDigits(stripBidiControls(input)).trim()
  if (cleaned === '') return { status: 'empty' }
  const compact = Array.from(cleaned).filter((ch) => !/[\s\-().]/.test(ch) && ch !== NBSP).join('')
  if (/[^0-9]/.test(compact.replace(/^\+/, ''))) return { status: 'invalid', error: 'invalid-character' }
  let national = compact
  if (national.startsWith('+20')) national = '0' + national.slice(3)
  else if (national.startsWith('0020')) national = '0' + national.slice(4)
  else if (national.startsWith('20') && national.length === 12) national = '0' + national.slice(2)
  else if (national.startsWith('1') && national.length === 10) national = '0' + national
  else if (national.startsWith('+')) return { status: 'invalid', error: 'invalid-prefix' }
  if (national.length < 11) return { status: 'invalid', error: 'too-short' }
  if (national.length > 11) return { status: 'invalid', error: 'too-long' }
  if (!['010', '011', '012', '015'].includes(national.slice(0, 3))) return { status: 'invalid', error: 'invalid-prefix' }
  return { status: 'valid', e164: '+20' + national.slice(1) }
}

// ---- arabic.search.v1 ------------------------------------------------------------------------------------
export const TOLERANCE = {
  strict: { hamza: false, alefMaqsura: false, taaMarbuta: false, ignoreSpaces: false },
  default: { hamza: true, alefMaqsura: false, taaMarbuta: false, ignoreSpaces: false },
  duplicateCheck: { hamza: true, alefMaqsura: true, taaMarbuta: true, ignoreSpaces: true },
}
const isMark = (c) => (c >= 0x64b && c <= 0x65f) || c === 0x670 || c === 0x640
export function searchKey(input, opts) {
  let out = ''
  for (const raw of input) {
    let ch = raw.toLowerCase()
    const c = code(ch)
    if (isMark(c)) continue
    if (c >= 0x660 && c <= 0x669) ch = String(c - 0x660)
    else if (c >= 0x6f0 && c <= 0x6f9) ch = String(c - 0x6f0)
    if (opts.hamza) {
      if (c === 0x623 || c === 0x625 || c === 0x622 || c === 0x671) ch = String.fromCodePoint(0x627)
      else if (c === 0x624) ch = String.fromCodePoint(0x648)
      else if (c === 0x626) ch = String.fromCodePoint(0x64a)
      else if (c === 0x621) continue
    }
    if (opts.alefMaqsura && c === 0x649) ch = String.fromCodePoint(0x64a)
    if (opts.taaMarbuta && c === 0x629) ch = String.fromCodePoint(0x647)
    if (/\s/.test(ch)) {
      if (opts.ignoreSpaces || out.endsWith(' ')) continue
      ch = ' '
    }
    out += ch
  }
  return out
}
export function matchText(query, target, opts) {
  const q = searchKey(query, opts).trim()
  return q === '' || searchKey(target, opts).includes(q)
}

// ---- numerals in copy (CONTRACTS.md "Numerals in copy") ----------------------------------------------------
const DIGIT = '[0-9' + String.fromCodePoint(0x660) + '-' + String.fromCodePoint(0x669) + String.fromCodePoint(0x6f0) + '-' + String.fromCodePoint(0x6f9) + ']'
export function localizeNumbers(text, numerals) {
  const spaced = text.replace(new RegExp(`(${DIGIT}) (?=${DIGIT})`, 'g'), `$1${NNBSP}`)
  let previous = ''
  return spaced
    .split(/(\s+)/)
    .map((part) => {
      if (part === '' || /^\s+$/.test(part)) return part
      const keep = !new RegExp(DIGIT).test(part) || /[A-Za-z]/.test(part) || /^[«(]?#/.test(part) || /[A-Za-z]$/.test(previous)
      previous = part
      if (keep) return part
      const latin = normalizeDigits(part).replace(new RegExp(`(\\d)${ARABIC_DECIMAL}(?=\\d)`, 'g'), '$1.').replace(new RegExp(`(\\d)${ARABIC_THOUSANDS}(?=\\d)`, 'g'), '$1,')
      if (numerals === 'latn') return latin
      return toArab(latin.replace(/(\d),(?=\d{3}(?!\d))/g, `$1${NNBSP}`).replace(/(\d)\.(?=\d)/g, `$1${ARABIC_DECIMAL}`))
    })
    .join('')
}
