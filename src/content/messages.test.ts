/**
 * Content layer invariants, checked over every error code × currency × display numerals.
 * Test names start with an id so the evidence view can link the recorded result.
 */
import { describe, expect, test } from 'vitest'
import type { AmountError, CurrencyCode, DisplayNumerals, PhoneErrorCode } from '../arabic'
import { amountErrorMessage, phoneErrorMessage } from './messages'

const NUMERALS: DisplayNumerals[] = ['latn', 'arab']
const CURRENCIES: CurrencyCode[] = ['EGP', 'SAR', 'KWD']
const AMOUNT_ERRORS: AmountError[] = [
  { code: 'invalid-character', char: 'x' },
  { code: 'ambiguous-comma', char: ',' },
  { code: 'multiple-decimal' },
  { code: 'invalid-grouping' },
  { code: 'negative-not-allowed' },
  { code: 'sign-position' },
  { code: 'too-many-fraction-digits', minorDigits: 2 },
  { code: 'too-large' },
  { code: 'no-digits' },
  { code: 'below-min', bound: 100 },
  { code: 'above-max', bound: 5_000_000 },
] as AmountError[]
const PHONE_ERRORS: (PhoneErrorCode | 'required')[] = ['required', 'invalid-character', 'too-short', 'too-long', 'invalid-prefix']

function messages(numerals: DisplayNumerals): string[] {
  return [
    ...CURRENCIES.flatMap((c) => AMOUNT_ERRORS.map((e) => amountErrorMessage(e, c, numerals))),
    ...PHONE_ERRORS.map((code) => phoneErrorMessage(code, 'x', numerals)),
  ]
}

describe('content', () => {
  test('CT-01 messages use only the preferred digits and never an ASCII space between digits', () => {
    for (const numerals of NUMERALS) {
      const other = numerals === 'arab' ? /[0-9]/ : /[٠-٩۰-۹]/
      for (const m of messages(numerals)) {
        expect(m, `${numerals}: ${m}`).not.toMatch(other)
        // UAX #9 N1: a space between two digit runs inside Arabic text resolves RTL and reverses the groups.
        expect(m, `${numerals}: ${m}`).not.toMatch(/[0-9٠-٩] +[0-9٠-٩]/)
      }
    }
  })
})
