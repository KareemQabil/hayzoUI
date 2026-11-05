/**
 * arabic.amount.v1 — exact monetary input parsing.
 *
 * Contract:
 * - Accepts Latin (0-9), Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) digits.
 * - Decimal separator: "." or "٫" (U+066B). More than one is invalid.
 * - Grouping: "٬" (U+066C) and spaces are accepted only in valid groups of three in the integer part.
 * - "," and "،" are ambiguous (decimal or grouping); they are never interpreted silently.
 *   The parser returns explicit suggestions instead.
 * - Fraction digits beyond the currency's minor unit are rejected, never rounded.
 * - The value is returned as an integer number of minor units, built from strings (no float math).
 */
import { normalizeDigits, stripBidiControls, toDisplayDigits, type DisplayNumerals } from './digits'

export type CurrencyCode = 'EGP' | 'SAR' | 'KWD'

export interface CurrencyDef {
  code: CurrencyCode
  minorDigits: number
  symbolAr: string
  nameAr: string
  minorNameAr: string
}

export const CURRENCIES: Record<CurrencyCode, CurrencyDef> = {
  EGP: { code: 'EGP', minorDigits: 2, symbolAr: 'ج.م', nameAr: 'الجنيه المصري', minorNameAr: 'قرش' },
  SAR: { code: 'SAR', minorDigits: 2, symbolAr: 'ر.س', nameAr: 'الريال السعودي', minorNameAr: 'هللة' },
  KWD: { code: 'KWD', minorDigits: 3, symbolAr: 'د.ك', nameAr: 'الدينار الكويتي', minorNameAr: 'فلس' },
}

export const MAX_INTEGER_DIGITS = 12

export type AmountErrorCode =
  | 'invalid-character'
  | 'ambiguous-comma'
  | 'multiple-decimal'
  | 'invalid-grouping'
  | 'negative-not-allowed'
  | 'sign-position'
  | 'too-many-fraction-digits'
  | 'too-large'
  | 'no-digits'
  | 'below-min'
  | 'above-max'

export interface AmountError {
  code: AmountErrorCode
  /** Offending character, separator count, or bound in minor units, depending on code. */
  char?: string
  minorDigits?: number
  bound?: number
}

export interface AmountSuggestion {
  kind: 'comma-as-decimal' | 'comma-as-grouping'
  minor: number
  canonical: string
}

export type ParseStepKind = 'bidi' | 'digits' | 'decimal' | 'grouping' | 'sign' | 'trim'
export interface ParseStep {
  kind: ParseStepKind
  count?: number
  detail?: string
}

export interface AmountParseResult {
  status: 'empty' | 'valid' | 'invalid'
  input: string
  /** Input after removing bidi controls and normalizing digits. */
  normalized: string
  minor: number | null
  /** Canonical decimal string, e.g. "1234.50". */
  canonical: string | null
  error: AmountError | null
  suggestions: AmountSuggestion[]
  steps: ParseStep[]
}

export interface AmountOptions {
  currency: CurrencyCode
  allowNegative?: boolean
  /** Inclusive bounds in minor units. */
  min?: number | null
  max?: number | null
}

const DECIMAL = /[.\u066b]/g
const AMBIGUOUS_COMMA = /[,\u060c]/
const GROUPING = /[\u066c \u00a0\u202f\u2009]/
const MINUS = /^[-\u2212]/
const TRAILING_MINUS = /[-\u2212]$/
const ALLOWED_BODY = /^[0-9.\u066b,\u060c\u066c \u00a0\u202f\u2009]$/

function isValidGrouping(groups: string[]): boolean {
  if (groups.length < 2) return true
  if (!/^\d{1,3}$/.test(groups[0])) return false
  return groups.slice(1).every((g) => /^\d{3}$/.test(g))
}

function toCanonical(negative: boolean, intPart: string, fracPart: string, minorDigits: number): { minor: number; canonical: string } | null {
  const int = intPart.replace(/^0+(?=\d)/, '') || '0'
  if (int.length > MAX_INTEGER_DIGITS) return null
  const frac = fracPart.padEnd(minorDigits, '0')
  const minorStr = (int + frac).replace(/^0+(?=\d)/, '')
  const minor = Number(minorStr) * (negative && minorStr !== '0' ? -1 : 1)
  const canonical = `${minor < 0 ? '-' : ''}${int}${minorDigits > 0 ? '.' + frac : ''}`
  return { minor, canonical }
}

function emptyResult(input: string, normalized: string, steps: ParseStep[]): AmountParseResult {
  return { status: 'empty', input, normalized, minor: null, canonical: null, error: null, suggestions: [], steps }
}

function invalid(input: string, normalized: string, steps: ParseStep[], error: AmountError, suggestions: AmountSuggestion[] = []): AmountParseResult {
  return { status: 'invalid', input, normalized, minor: null, canonical: null, error, suggestions, steps }
}

export function parseAmount(input: string, options: AmountOptions): AmountParseResult {
  const { minorDigits } = CURRENCIES[options.currency]
  const steps: ParseStep[] = []

  const bidi = stripBidiControls(input)
  if (bidi.removed) steps.push({ kind: 'bidi', count: bidi.removed })
  const trimmed = bidi.text.trim()
  if (trimmed !== bidi.text) steps.push({ kind: 'trim' })
  const digits = normalizeDigits(trimmed)
  if (digits.arab) steps.push({ kind: 'digits', count: digits.arab, detail: 'arab' })
  if (digits.arabext) steps.push({ kind: 'digits', count: digits.arabext, detail: 'arabext' })
  let body = digits.text
  const normalized = body

  if (body === '') return emptyResult(input, normalized, steps)

  // Sign
  let negative = false
  if (TRAILING_MINUS.test(body) && body.length > 1) {
    return invalid(input, normalized, steps, { code: 'sign-position' })
  }
  if (MINUS.test(body)) {
    negative = true
    body = body.slice(1).trim()
    steps.push({ kind: 'sign' })
  } else if (body.startsWith('+')) {
    body = body.slice(1).trim()
  }

  for (const ch of body) {
    if (!ALLOWED_BODY.test(ch)) return invalid(input, normalized, steps, { code: 'invalid-character', char: ch })
  }
  if (!/\d/.test(body)) return invalid(input, normalized, steps, { code: 'no-digits' })
  if (negative && !options.allowNegative) return invalid(input, normalized, steps, { code: 'negative-not-allowed' })

  const decimalCount = (body.match(DECIMAL) ?? []).length
  if (decimalCount > 1) return invalid(input, normalized, steps, { code: 'multiple-decimal' })

  if (AMBIGUOUS_COMMA.test(body)) {
    return invalid(input, normalized, steps, { code: 'ambiguous-comma', char: body.match(AMBIGUOUS_COMMA)![0] }, commaSuggestions(body, negative, options))
  }

  const [rawInt, rawFrac = ''] = body.split(DECIMAL)
  if (decimalCount) steps.push({ kind: 'decimal', detail: body.includes('\u066b') ? 'arabic' : 'dot' })

  if (GROUPING.test(rawFrac)) return invalid(input, normalized, steps, { code: 'invalid-grouping' })
  let intPart = rawInt
  if (GROUPING.test(rawInt)) {
    const groups = rawInt.split(/[\u066c \u00a0\u202f\u2009]/)
    if (!isValidGrouping(groups)) return invalid(input, normalized, steps, { code: 'invalid-grouping' })
    intPart = groups.join('')
    steps.push({ kind: 'grouping', count: groups.length - 1 })
  }
  if (rawFrac.length > minorDigits) return invalid(input, normalized, steps, { code: 'too-many-fraction-digits', minorDigits })

  const result = toCanonical(negative, intPart, rawFrac, minorDigits)
  if (!result) return invalid(input, normalized, steps, { code: 'too-large' })

  if (options.min != null && result.minor < options.min) return invalid(input, normalized, steps, { code: 'below-min', bound: options.min })
  if (options.max != null && result.minor > options.max) return invalid(input, normalized, steps, { code: 'above-max', bound: options.max })

  return { status: 'valid', input, normalized, minor: result.minor, canonical: result.canonical, error: null, suggestions: [], steps }
}

function commaSuggestions(body: string, negative: boolean, options: AmountOptions): AmountSuggestion[] {
  const out: AmountSuggestion[] = []
  const sign = negative ? '-' : ''
  const commas = (body.match(/[,\u060c]/g) ?? []).length
  const hasDecimal = /[.\u066b]/.test(body)
  const tryParse = (candidate: string, kind: AmountSuggestion['kind']) => {
    const r = parseAmount(sign + candidate, options)
    if (r.status === 'valid' && r.minor != null && !out.some((s) => s.minor === r.minor)) out.push({ kind, minor: r.minor, canonical: r.canonical! })
  }
  if (commas === 1 && !hasDecimal) tryParse(body.replace(/[,\u060c]/, '.'), 'comma-as-decimal')
  const [intSide, ...rest] = body.split(/[.\u066b]/)
  if (isValidGrouping(intSide.split(/[,\u060c]/))) tryParse(intSide.replace(/[,\u060c]/g, '') + (rest.length ? '.' + rest.join('') : ''), 'comma-as-grouping')
  return out
}

export interface FormatAmountOptions {
  currency: CurrencyCode
  numerals: DisplayNumerals
  grouping?: boolean
  symbol?: boolean
}

/**
 * Display form: grouped, in the requested numerals. Never used as input.
 *
 * Arabic-Indic display groups with U+202F, not «٬» (U+066C): in common Arabic UI fonts (IBM Plex Sans Arabic,
 * Readex Pro) «٬» and «٫» are drawn as the same comma-like mark, so «١٬٢٣٤٫٥٠» reads as «١,٢٣٤,٥٠» — the
 * ambiguity the parser refuses to guess. With a thin space the only comma-like mark left is the decimal.
 * The parser still accepts «٬» in input.
 */
export function formatAmount(minor: number, { currency, numerals, grouping = true, symbol = false }: FormatAmountOptions): string {
  const { minorDigits, symbolAr } = CURRENCIES[currency]
  const negative = minor < 0
  const abs = String(Math.abs(minor)).padStart(minorDigits + 1, '0')
  let int = minorDigits ? abs.slice(0, -minorDigits) : abs
  const frac = minorDigits ? abs.slice(-minorDigits) : ''
  if (grouping) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, '\u0001')
  let text = `${negative ? '-' : ''}${int}${minorDigits ? '\u0002' + frac : ''}`
  text = toDisplayDigits(text, numerals)
    .replace(/\u0001/g, numerals === 'arab' ? '\u202f' : ',')
    .replace(/\u0002/g, numerals === 'arab' ? '\u066b' : '.')
  return symbol ? `${text} ${symbolAr}` : text
}

/** Editing form: shown while the field has focus. No grouping so it re-parses unambiguously. */
export function editingAmount(minor: number, currency: CurrencyCode, numerals: DisplayNumerals): string {
  return formatAmount(minor, { currency, numerals, grouping: false })
}

export function minorToCanonical(minor: number, currency: CurrencyCode): string {
  return formatAmount(minor, { currency, numerals: 'latn', grouping: false })
}
