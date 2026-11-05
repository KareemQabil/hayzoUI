/** PhoneInput — Egyptian mobile numbers (v1). Stores E.164; displays an LTR island in any UI direction. */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { nationalPhoneEG, numericSpaces, parsePhoneEG, toDisplayDigits, type PhoneParseResult } from '../../arabic'
import { phoneErrorMessage } from '../../content/messages'
import { useLocale } from '../locale'
import type { Size } from './button'
import { describedBy, Field, useFieldIds } from './field'

export interface PhoneInputProps {
  label: ReactNode
  /** Controlled E.164 number, or null when empty or invalid. Omit to use defaultValue. */
  value?: string | null
  defaultValue?: string | null
  /** details is the full parse result (status, error code, e164). */
  onValueChange?: (e164: string | null, details: PhoneParseResult) => void
  optional?: boolean
  helper?: ReactNode
  showValidation?: boolean
  disabled?: boolean
  size?: Size
  id?: string
}

export interface PhoneInputHandle {
  focus: () => void
}

export const PhoneInput = forwardRef<PhoneInputHandle, PhoneInputProps>(function PhoneInput(
  { label, value, defaultValue = null, onValueChange, optional, helper, showValidation, disabled, size = 'md', id },
  ref,
) {
  const ids = useFieldIds(id)
  const { numerals, dir } = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const initial = value !== undefined ? value : defaultValue
  const [text, setText] = useState(() => (initial ? toDisplayDigits(nationalPhoneEG(initial), numerals) : ''))
  const [result, setResult] = useState<PhoneParseResult>(() => parsePhoneEG(text))
  const [touched, setTouched] = useState(false)
  const last = useRef(initial)
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }))

  useEffect(() => {
    // Only a controlled value overwrites the text, and only when it differs from what we emitted.
    if (value === undefined || value === last.current) return
    last.current = value
    const t = value ? toDisplayDigits(nationalPhoneEG(value), numerals) : ''
    setText(t)
    setResult(parsePhoneEG(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const visible = touched || showValidation
  let error: string | null = null
  if (visible && result.status === 'invalid' && result.error) error = phoneErrorMessage(result.error.code, result.error.char, numerals)
  if (visible && result.status === 'empty' && !optional) error = phoneErrorMessage('required')

  return (
    <Field ids={ids} label={label} optional={optional} helper={helper} error={error} size={size} disabled={disabled}>
      <div className="ax-control" data-size={size} data-invalid={error ? '' : undefined} data-disabled={disabled ? '' : undefined} data-dir={dir}>
        <input
          ref={inputRef}
          id={ids.input}
          className="ax-control__input ax-phone__input ax-num"
          dir="ltr"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={toDisplayDigits(numericSpaces('010 1234 5678'), numerals)}
          value={text}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-required={!optional || undefined}
          aria-describedby={describedBy(ids, !!helper, !!error)}
          onChange={(e) => {
            // Typed spaces become U+00A0 so Arabic-Indic groups keep their order (R-BIDI-003).
            // Same length, so the caret is restored at the same index.
            const el = e.currentTarget
            const safe = numericSpaces(el.value)
            if (safe !== el.value) {
              const [start, end] = [el.selectionStart, el.selectionEnd]
              el.value = safe
              el.setSelectionRange(start, end)
            }
            setText(safe)
            const r = parsePhoneEG(safe)
            setResult(r)
            last.current = r.e164
            onValueChange?.(r.e164, r)
          }}
          onBlur={() => {
            setTouched(true)
            if (result.status === 'valid' && result.e164) setText(toDisplayDigits(nationalPhoneEG(result.e164), numerals))
          }}
        />
        <span className="ax-control__affix ax-num" aria-hidden="true" dir="ltr">
          EG
        </span>
      </div>
    </Field>
  )
})
