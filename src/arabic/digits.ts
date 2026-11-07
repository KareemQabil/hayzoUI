/**
 * arabic.digits.v1 — numeral normalization and display conversion.
 * Pure functions: no DOM, no React, no locale data.
 */
export type DisplayNumerals = 'latn' | 'arab'

const ARAB_ZERO = 0x0660 // ٠ Arabic-Indic
const ARABEXT_ZERO = 0x06f0 // ۰ Extended Arabic-Indic (Persian/Urdu)

export interface DigitNormalization {
  text: string
  arab: number
  arabext: number
}

/** Converts Arabic-Indic and Extended Arabic-Indic digits to ASCII digits. Other characters are untouched. */
export function normalizeDigits(input: string): DigitNormalization {
  let arab = 0
  let arabext = 0
  let text = ''
  for (const ch of input) {
    const code = ch.codePointAt(0)!
    if (code >= ARAB_ZERO && code <= ARAB_ZERO + 9) {
      text += String(code - ARAB_ZERO)
      arab++
    } else if (code >= ARABEXT_ZERO && code <= ARABEXT_ZERO + 9) {
      text += String(code - ARABEXT_ZERO)
      arabext++
    } else {
      text += ch
    }
  }
  return { text, arab, arabext }
}

/** Renders ASCII digits in the requested display numerals. */
export function toDisplayDigits(input: string, numerals: DisplayNumerals): string {
  if (numerals === 'latn') return input
  return input.replace(/[0-9]/g, (d) => String.fromCodePoint(ARAB_ZERO + Number(d)))
}

/** Invisible bidi controls that may be pasted along with numbers. Removing them never changes a value. */
export const BIDI_CONTROLS = /[\u200e\u200f\u061c\u202a-\u202e\u2066-\u2069]/g

export function stripBidiControls(input: string): { text: string; removed: number } {
  const removed = (input.match(BIDI_CONTROLS) ?? []).length
  return { text: input.replace(BIDI_CONTROLS, ''), removed }
}

/**
 * Bidi-safe spaces for numbers (arabic.digits.v1, rule R-BIDI-003).
 *
 * Arabic-Indic digits have bidi class AN. An ASCII space between two AN runs is a neutral that UAX #9
 * resolves as right-to-left, so even inside an LTR field «٠١٠ ١٢٣٤ ٥٦٧٨» is drawn as «٥٦٧٨ ١٢٣٤ ٠١٠».
 * U+00A0 (NO-BREAK SPACE) and U+202F (NARROW NO-BREAK SPACE) have bidi class CS: a single CS between two
 * numbers joins them into one run (rule W4), so the groups keep their order. No invisible marks are added.
 */
export const NBSP = ' '
export const NNBSP = ' '

/** Replaces ASCII spaces with a bidi-safe space. Same length, so a caret position stays valid. */
export function numericSpaces(text: string, space: string = NBSP): string {
  return text.replace(/ /g, space)
}

/** Formats an integer count for display (no grouping for small counts). */
export function formatCount(n: number, numerals: DisplayNumerals): string {
  const grouped = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return numerals === 'arab' ? toDisplayDigits(grouped, 'arab').replace(/,/g, NNBSP) : grouped
}

const ANY_DIGIT_RUN = /[0-9\u0660-\u0669\u06f0-\u06f9]/
/** A word that ends in Latin letters: «React», «Next.js», and «وVitest» (an Arabic conjunction attached). */
const LATIN_WORD = /[A-Za-z]$/

/**
 * Numbers in running text shown in the given numerals (R-NUM-004). Source may be written with either system.
 * Numbers that belong to Latin text keep Latin digits:
 *   - inside a word that has an ASCII letter or starts with # — codes, rules, units, colors (CUS-0008, R-NUM-004, 16px, #284190);
 *   - right after a Latin word — names and versions (React 18, Material Design 3, Vitest 5.1.0).
 * A space between two digits becomes U+202F so the groups keep their order inside Arabic text (R-BIDI-003).
 * scripts/bidi-scan.mjs (oracle 3) applies the same two exemptions when it checks the screen.
 */
export function localizeNumbers(text: string, numerals: DisplayNumerals): string {
  const spaced = text.replace(/([0-9\u0660-\u0669\u06f0-\u06f9]) (?=[0-9\u0660-\u0669\u06f0-\u06f9])/g, `$1${NNBSP}`)
  const parts = spaced.split(/(\s+)/)
  let previous = ''
  return parts
    .map((part) => {
      if (part === '' || /^\s+$/.test(part)) return part
      const keep = !ANY_DIGIT_RUN.test(part) || /[A-Za-z]/.test(part) || /^[«(]?#/.test(part) || LATIN_WORD.test(previous)
      previous = part
      return keep ? part : localizeNumberWord(part, numerals)
    })
    .join('')
}

/** Digits and the separators between them, as formatAmount writes them: 1,234.50 ↔ ١ ٢٣٤٫٥٠. */
function localizeNumberWord(word: string, numerals: DisplayNumerals): string {
  const latin = normalizeDigits(word).text.replace(/(\d)٫(?=\d)/g, '$1.').replace(/(\d)٬(?=\d)/g, '$1,')
  if (numerals === 'latn') return latin
  return toDisplayDigits(latin.replace(/(\d),(?=\d{3}(?!\d))/g, `$1${NNBSP}`).replace(/(\d)\.(?=\d)/g, '$1٫'), 'arab')
}
