/**
 * arabic.phone.eg.v1 — Egyptian mobile numbers only in this release.
 * Accepts any supported numerals, spaces, dashes, dots and parentheses; stores E.164.
 */
import { normalizeDigits, stripBidiControls } from './digits'

export type PhoneErrorCode = 'invalid-character' | 'too-short' | 'too-long' | 'invalid-prefix'

export interface PhoneParseResult {
  status: 'empty' | 'valid' | 'invalid'
  e164: string | null
  error: { code: PhoneErrorCode; char?: string } | null
}

export const EG_MOBILE_PREFIXES = ['010', '011', '012', '015']

export function parsePhoneEG(input: string): PhoneParseResult {
  const cleaned = normalizeDigits(stripBidiControls(input).text).text.trim()
  if (cleaned === '') return { status: 'empty', e164: null, error: null }
  const compact = cleaned.replace(/[\s\-().\u00a0]/g, '')
  const bad = compact.replace(/^\+/, '').match(/[^0-9]/)
  if (bad) return { status: 'invalid', e164: null, error: { code: 'invalid-character', char: bad[0] } }

  let national = compact
  if (national.startsWith('+20')) national = '0' + national.slice(3)
  else if (national.startsWith('0020')) national = '0' + national.slice(4)
  else if (national.startsWith('20') && national.length === 12) national = '0' + national.slice(2)
  else if (national.startsWith('1') && national.length === 10) national = '0' + national
  else if (national.startsWith('+')) return { status: 'invalid', e164: null, error: { code: 'invalid-prefix' } }

  if (national.length < 11) return { status: 'invalid', e164: null, error: { code: 'too-short' } }
  if (national.length > 11) return { status: 'invalid', e164: null, error: { code: 'too-long' } }
  if (!EG_MOBILE_PREFIXES.includes(national.slice(0, 3))) return { status: 'invalid', e164: null, error: { code: 'invalid-prefix' } }
  return { status: 'valid', e164: '+20' + national.slice(1), error: null }
}

/** "+201012345678" → "+20 10 1234 5678". Always rendered as an LTR island. */
export function formatPhoneEG(e164: string): string {
  const n = e164.replace(/^\+20/, '')
  if (n.length !== 10) return e164
  return `+20 ${n.slice(0, 2)} ${n.slice(2, 6)} ${n.slice(6)}`
}

/** Local editing form "010 1234 5678". */
export function nationalPhoneEG(e164: string): string {
  const n = '0' + e164.replace(/^\+20/, '')
  return `${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7)}`
}
