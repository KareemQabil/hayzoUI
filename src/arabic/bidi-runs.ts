// Mixed-script text: "dominant script, isolated foreign islands" (CONTRACTS.md §Mixed text).
// Pure: no React, no DOM. A copy of countStrong/wordDir/dominantDir lives in scripts/bidi-scan.mjs (oracle 2,
// measureMixed) — keep them in sync.

export type ScriptDir = 'rtl' | 'ltr'
export interface ScriptRun {
  text: string
  /** Direction of the isolate (<bdi dir>) this run is wrapped in, or null for text left in the line's flow. */
  isolate: ScriptDir | null
}
export interface ScriptRuns {
  /** Line direction from the dominant script; null when the text has no strong letters (inherit). */
  dir: ScriptDir | null
  runs: ScriptRun[]
}

const RTL_LETTER = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/u
const LETTER = /\p{L}/u
/** Paired brackets and quotes stay outside an island: in the line's flow they mirror into place. */
const EDGE_BRACKET = /[()[\]{}<>«»"'“”‘’]/

/** Strong letters per direction. Digits, punctuation, marks and spaces are not counted. */
export function countStrong(text: string): { rtl: number; ltr: number } {
  let rtl = 0
  let ltr = 0
  for (const ch of text) {
    if (!LETTER.test(ch)) continue
    if (RTL_LETTER.test(ch)) rtl++
    else ltr++
  }
  return { rtl, ltr }
}

/** Script of one word: rtl when its RTL letters ≥ its LTR letters; null without strong letters. */
export function wordDir(word: string): ScriptDir | null {
  const { rtl, ltr } = countStrong(word)
  if (rtl + ltr === 0) return null
  return rtl >= ltr ? 'rtl' : 'ltr'
}

/**
 * Dominant script of a text: each whitespace-separated word votes with its own script (wordDir), and the
 * line is rtl when RTL words ≥ LTR words. Words, not letters, are counted: Arabic spells names in fewer
 * letters, so a letter count would make «أحمد Khaled» (4 vs 6 letters) LTR. Null without strong letters.
 */
export function dominantDir(text: string): ScriptDir | null {
  let rtl = 0
  let ltr = 0
  for (const m of text.matchAll(/\S+/gu)) {
    const d = wordDir(m[0])
    if (d === 'rtl') rtl++
    else if (d === 'ltr') ltr++
  }
  if (rtl + ltr === 0) return null
  return rtl >= ltr ? 'rtl' : 'ltr'
}

interface Word {
  start: number
  end: number
  /** Core = the word without leading/trailing paired brackets and quotes. */
  coreStart: number
  coreEnd: number
  dir: ScriptDir | null
}

function words(text: string): Word[] {
  const out: Word[] = []
  for (const m of text.matchAll(/\S+/gu)) {
    const start = m.index ?? 0
    const end = start + m[0].length
    let coreStart = start
    let coreEnd = end
    while (coreStart < coreEnd && EDGE_BRACKET.test(text[coreStart])) coreStart++
    while (coreEnd > coreStart && EDGE_BRACKET.test(text[coreEnd - 1])) coreEnd--
    out.push({ start, end, coreStart, coreEnd, dir: wordDir(m[0]) })
  }
  return out
}

/**
 * Splits free text into runs. The line direction is the dominant script; every maximal run of words of the
 * other script (with their attached punctuation and digits, the spaces between them, and neutral words
 * sandwiched between them) becomes an isolate in that script's direction. Brackets and quotes at a word's
 * edges stay outside the isolate and end it. Concatenating the runs' text always gives back the input.
 */
export function scriptRuns(text: string): ScriptRuns {
  const dir = dominantDir(text)
  if (!dir) return { dir: null, runs: text ? [{ text, isolate: null }] : [] }
  const foreign: ScriptDir = dir === 'rtl' ? 'ltr' : 'rtl'
  const ws = words(text)
  const islands: Array<[number, number]> = []
  for (let i = 0; i < ws.length; i++) {
    if (ws[i].dir !== foreign || ws[i].coreStart === ws[i].coreEnd) continue
    let last = i
    // Extend through neutral words to the next foreign word, unless a bracket closes the island first.
    let j = i + 1
    while (j < ws.length && ws[last].coreEnd === ws[last].end) {
      let k = j
      while (k < ws.length && ws[k].dir === null && ws[k].coreStart === ws[k].start && ws[k].coreEnd === ws[k].end) k++
      if (k < ws.length && ws[k].dir === foreign && ws[k].coreStart === ws[k].start && ws[k].coreStart < ws[k].coreEnd) {
        last = k
        j = k + 1
      } else break
    }
    islands.push([ws[i].coreStart, ws[last].coreEnd])
    i = last
  }
  const runs: ScriptRun[] = []
  let cursor = 0
  for (const [s, e] of islands) {
    if (s > cursor) runs.push({ text: text.slice(cursor, s), isolate: null })
    runs.push({ text: text.slice(s, e), isolate: foreign })
    cursor = e
  }
  if (cursor < text.length) runs.push({ text: text.slice(cursor), isolate: null })
  return { dir, runs }
}
