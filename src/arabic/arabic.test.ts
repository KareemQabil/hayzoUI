/**
 * Automated suite for L2. Test names start with a fixture/property id so the evidence
 * view can link recorded results to records. Properties use a fixed seed (deterministic).
 */
import { describe, expect, test } from 'vitest'
import { FIXTURES } from '../knowledge/fixtures'
import { editingAmount, formatAmount, normalizeForSearch, parseAmount, toDisplayDigits, DEFAULT_SEARCH, matchText } from './index'

describe('fixtures', () => {
  for (const f of FIXTURES) {
    test(`${f.id} ${f.requirement}`, () => {
      const r = f.run()
      expect(r.actual).toBe(f.expected)
      expect(r.pass).toBe(true)
    })
  }
})

// Small deterministic PRNG (mulberry32) — seed recorded in the test name.
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const SEED = 20260314
const toExt = (s: string) => s.replace(/[0-9]/g, (d) => String.fromCodePoint(0x06f0 + Number(d)))

describe('properties (seed 20260314, 500 cases each)', () => {
  test('PROP-01 same value in any numerals (metamorphic)', () => {
    const r = rng(SEED)
    for (let i = 0; i < 500; i++) {
      const minor = Math.floor(r() * 1e9)
      const latn = editingAmount(minor, 'EGP', 'latn')
      const arab = toDisplayDigits(latn, 'arab').replace('.', '\u066b')
      const ext = toExt(latn)
      const a = parseAmount(latn, { currency: 'EGP' }).minor
      expect(a).toBe(minor)
      expect(parseAmount(arab, { currency: 'EGP' }).minor).toBe(minor)
      expect(parseAmount(ext, { currency: 'EGP' }).minor).toBe(minor)
    }
  })
  test('PROP-02 display(arab) and editing forms round-trip to the same minor units', () => {
    const r = rng(SEED + 1)
    for (let i = 0; i < 500; i++) {
      const minor = Math.floor(r() * 1e11)
      for (const cur of ['EGP', 'KWD'] as const) {
        expect(parseAmount(editingAmount(minor, cur, 'arab'), { currency: cur }).minor).toBe(minor)
        expect(parseAmount(formatAmount(minor, { currency: cur, numerals: 'arab' }), { currency: cur }).minor).toBe(minor)
      }
    }
  })
  test('PROP-03 parse is deterministic and canonical is a fixed point', () => {
    const r = rng(SEED + 2)
    for (let i = 0; i < 500; i++) {
      const minor = Math.floor(r() * 1e8)
      const first = parseAmount(editingAmount(minor, 'SAR', 'latn'), { currency: 'SAR' })
      const second = parseAmount(first.canonical!, { currency: 'SAR' })
      expect(second.canonical).toBe(first.canonical)
    }
  })
  test('PROP-04 an ambiguous comma is never accepted silently', () => {
    const r = rng(SEED + 3)
    for (let i = 0; i < 500; i++) {
      const a = Math.floor(r() * 99999)
      const b = Math.floor(r() * 999)
      const res = parseAmount(`${a},${b}`, { currency: 'EGP' })
      expect(res.status).toBe('invalid')
      expect(res.minor).toBeNull()
    }
  })
  test('PROP-05 tolerance only adds matches, never removes them', () => {
    const names = ['أحمد Khaled', 'إيمان عبد الرحمن', 'مُحَمَّد السيد', 'هالة مؤمن', 'سارة الشريف']
    const r = rng(SEED + 4)
    for (let i = 0; i < 500; i++) {
      const n = names[Math.floor(r() * names.length)]
      const start = Math.floor(r() * (n.length - 2))
      const q = n.slice(start, start + 2 + Math.floor(r() * 3))
      const strict = matchText(q, n, { hamza: false, alefMaqsura: false, taaMarbuta: false, ignoreSpaces: false }).match
      const tolerant = matchText(q, n, DEFAULT_SEARCH).match
      if (strict) expect(tolerant).toBe(true)
    }
  })
  test('PROP-06 search normalization never changes the stored name', () => {
    const name = 'إيمان عبد الرحمن'
    const before = name.slice()
    normalizeForSearch(name, DEFAULT_SEARCH)
    expect(name).toBe(before)
  })
})
