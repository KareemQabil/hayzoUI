// Shared helpers for the language and calendar extractors. Zero dependencies (Node 22 built-ins only).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
export const RETRIEVED_AT = '2026-11-11'
export const CLDR_VERSION = '49.0.0'
export const UCD_VERSION = '17.0.0'
export const ICU_TAG = 'release-78.3'

// The 22 member states of the Arab League (ISO 3166-1 alpha-2).
export const ARAB_LEAGUE = ['AE', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'JO', 'KM', 'KW', 'LB', 'LY', 'MA', 'MR', 'OM', 'PS', 'QA', 'SA', 'SD', 'SO', 'SY', 'TN', 'YE']

export const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
export const readText = (p) => fs.readFileSync(p, 'utf8')

// ---------- sources ----------
export function cldrSource(pkg, file) {
  return { name: 'Unicode CLDR', url: `https://www.npmjs.com/package/${pkg}`, version: CLDR_VERSION, license: 'Unicode-3.0', retrievedAt: RETRIEVED_AT, path: `${pkg}/${file}` }
}
export function ucdSource(file) {
  return { name: 'Unicode Character Database', url: `https://www.unicode.org/Public/${UCD_VERSION}/ucd/`, version: UCD_VERSION, license: 'Unicode-3.0', retrievedAt: RETRIEVED_AT, path: file }
}
export function icuSource(file) {
  return { name: 'ICU4C', url: `https://github.com/unicode-org/icu/tree/${ICU_TAG}/icu4c/source/i18n`, version: ICU_TAG, license: 'Unicode-3.0', retrievedAt: RETRIEVED_AT, path: `icu4c/source/i18n/${file}` }
}

// ---------- deterministic JSON ----------
// Invisible characters (bidi controls, joiners, non-ASCII spaces, BOM) are written as \uXXXX escapes so that no raw
// bidi control ever sits in a data file; the JSON value is unchanged. The list is explicit so output does not depend
// on the Unicode version of the Node that runs the script.
const INVISIBLE = /[\u0000-\u001f\u007f-\u00a0\u00ad\u0600-\u0605\u061c\u06dd\u070f\u0890\u0891\u08e2\u180e\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\ufeff\ufff9-\ufffb]/g
export function stringify(value) {
  return JSON.stringify(value, null, 2).replace(INVISIBLE, (c) => (c === '\n' ? c : '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))) + '\n'
}
export function writeData(rel, doc) {
  const file = path.join(ROOT, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, stringify(doc))
  return rel
}
export function envelope(kind, id, provenance, data) {
  return { kind, schemaVersion: 1, id, provenance, data }
}

// ---------- code points ----------
export const hex = (cp) => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0')
export const codePoints = (s) => [...s].map((c) => hex(c.codePointAt(0)))

// ---------- CLDR locales ----------
export function arabicLocales(cldrDir) {
  const all = fs.readdirSync(path.join(cldrDir, 'cldr-numbers-full', 'main')).filter((l) => /^ar(-|$)/.test(l))
  return all.sort((a, b) => (a === 'ar' ? -1 : b === 'ar' ? 1 : a < b ? -1 : a > b ? 1 : 0))
}
// Groups locales whose value is identical. Order: the group holding `ar` first, then by first locale.
export function groupLocales(locales, get) {
  const map = new Map()
  for (const l of locales) {
    const value = get(l)
    const key = JSON.stringify(value)
    if (!map.has(key)) map.set(key, { locales: [], value })
    map.get(key).locales.push(l)
  }
  return [...map.values()]
}
export const regionOf = (locale) => (locale.split('-')[1] ?? null)

// CLDR keys like "unitPattern-count-few" -> { few: … } in canonical plural order.
export const PLURALS = ['zero', 'one', 'two', 'few', 'many', 'other']
export function pluralForms(obj, prefix) {
  const out = {}
  for (const c of PLURALS) if (obj[`${prefix}${c}`] !== undefined) out[c] = obj[`${prefix}${c}`]
  return out
}
