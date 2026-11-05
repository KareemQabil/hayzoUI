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

/** Formats an integer count for display (no grouping for small counts). */
export function formatCount(n: number, numerals: DisplayNumerals): string {
  const grouped = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return numerals === 'arab' ? toDisplayDigits(grouped, 'arab').replace(/,/g, '٬') : grouped
}
