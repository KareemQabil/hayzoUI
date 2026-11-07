import { describe, expect, test } from 'vitest'
import { dominantDir, scriptRuns } from './bidi-runs'

const shape = (text: string) => {
  const r = scriptRuns(text)
  return { dir: r.dir, runs: r.runs.map((x) => (x.isolate ? `[${x.isolate}:${x.text}]` : x.text)).join('') }
}

describe('scriptRuns — dominant script, isolated islands', () => {
  test('BD-01 Latin-first Arabic name is RTL with «Dr.» isolated, period attached', () => {
    expect(shape('Dr. سامي الحلبي')).toEqual({ dir: 'rtl', runs: '[ltr:Dr.] سامي الحلبي' })
  })

  test('BD-02 «3M مصر» is RTL with «3M» isolated', () => {
    expect(shape('3M مصر')).toEqual({ dir: 'rtl', runs: '[ltr:3M] مصر' })
  })

  test('BD-03 parentheses stay outside the island around «Mido»', () => {
    expect(shape('محمد (Mido) السيد')).toEqual({ dir: 'rtl', runs: 'محمد ([ltr:Mido]) السيد' })
  })

  test('BD-04 Arabic-dominant name with a Latin word: RTL, «Khaled» isolated', () => {
    expect(shape('أحمد Khaled')).toEqual({ dir: 'rtl', runs: 'أحمد [ltr:Khaled]' })
  })

  test('BD-05 all-Latin is LTR with no isolates; all-Arabic is RTL with no isolates', () => {
    expect(shape('Sara Haddad')).toEqual({ dir: 'ltr', runs: 'Sara Haddad' })
    expect(shape('سامي الحلبي')).toEqual({ dir: 'rtl', runs: 'سامي الحلبي' })
  })

  test('BD-06 consecutive Latin words form one island, spaces between them included', () => {
    expect(shape('Ahmed K. الحلبي محمود')).toEqual({ dir: 'rtl', runs: '[ltr:Ahmed K.] الحلبي محمود' })
    expect(shape('شركة iPhone 15 Pro مصر')).toEqual({ dir: 'rtl', runs: 'شركة [ltr:iPhone 15 Pro] مصر' })
  })

  test('BD-07 Latin-dominant text isolates the Arabic words RTL', () => {
    expect(shape('Mohamed Ali Hassan سامي')).toEqual({ dir: 'ltr', runs: 'Mohamed Ali Hassan [rtl:سامي]' })
  })

  test('BD-08 words vote (a tie goes RTL); no strong letters keeps the surrounding direction', () => {
    expect(dominantDir('ab سم')).toBe('rtl')
    expect(dominantDir('Mohamed Abdelrahman سم')).toBe('ltr')
    expect(dominantDir('Abdelrahman سم سم')).toBe('rtl')
    expect(scriptRuns('123 - 456')).toEqual({ dir: null, runs: [{ text: '123 - 456', isolate: null }] })
    expect(scriptRuns('')).toEqual({ dir: null, runs: [] })
    // Arabic-Indic digits and Arabic punctuation are not strong letters.
    expect(dominantDir('٣، ٤')).toBeNull()
  })
})

// Seeded property tests.
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const ARABIC = ['سامي', 'الحلبي', 'محمد', 'أحمد', 'مصر', 'شركة', 'عبد', 'الله']
const LATIN = ['Dr.', 'Sara', 'Haddad', '3M', 'K.', 'iPhone', 'Mido', 'Ltd,', "O'Neil"]
const NEUTRAL = ['15', '-', '٣', '&', '/', '2026']
const WRAP = [(w: string) => w, (w: string) => w, (w: string) => w, (w: string) => `(${w})`, (w: string) => `«${w}»`, (w: string) => `"${w}`]
const SPACE = [' ', ' ', ' ', '  ', ' ']

function randomText(r: () => number, pools: string[][]) {
  const n = 1 + Math.floor(r() * 7)
  const parts: string[] = []
  for (let i = 0; i < n; i++) {
    const pool = pools[Math.floor(r() * pools.length)]
    const w = pool[Math.floor(r() * pool.length)]
    parts.push(WRAP[Math.floor(r() * WRAP.length)](w))
    if (i < n - 1) parts.push(SPACE[Math.floor(r() * SPACE.length)])
  }
  return parts.join('')
}
const WORD_CHAR = /[\p{L}\p{N}\p{M}.,'&/-]/u

describe('scriptRuns — properties', () => {
  test('BD-09 over 600 random mixed strings: runs reproduce the input and isolates never split a word', () => {
    const r = rng(20261107)
    for (let i = 0; i < 600; i++) {
      const text = randomText(r, [ARABIC, LATIN, NEUTRAL])
      const { dir, runs } = scriptRuns(text)
      expect(runs.map((x) => x.text).join('')).toBe(text)
      let at = 0
      for (const run of runs) {
        if (run.isolate) {
          expect(run.isolate).not.toBe(dir)
          const before = text[at - 1]
          const after = text[at + run.text.length]
          if (before !== undefined) expect(WORD_CHAR.test(before), `split before «${run.text}» in «${text}»`).toBe(false)
          if (after !== undefined) expect(WORD_CHAR.test(after), `split after «${run.text}» in «${text}»`).toBe(false)
          expect(run.text).toBe(run.text.trim())
        }
        at += run.text.length
      }
      expect(runs.every((x) => x.text.length > 0)).toBe(true)
    }
  })

  test('BD-10 over 500 random single-script strings: no isolates, direction of the script', () => {
    const r = rng(7)
    for (let i = 0; i < 250; i++) {
      const ar = scriptRuns(randomText(r, [ARABIC, NEUTRAL]))
      if (ar.dir !== null) expect(ar.dir).toBe('rtl')
      expect(ar.runs.some((x) => x.isolate)).toBe(false)
      const la = scriptRuns(randomText(r, [LATIN, NEUTRAL]))
      if (la.dir !== null) expect(la.dir).toBe('ltr')
      expect(la.runs.some((x) => x.isolate)).toBe(false)
    }
  })
})
