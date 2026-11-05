/**
 * CurrencyInput — spec: currency-input (maturity: alpha)
 *
 * Three separate contracts:
 *  - input:   what the person may type (arabic.amount.v1)
 *  - storage: `value` — integer minor units, or null when empty/invalid
 *  - display: grouped text in the provider's numeral preference, shown only when not editing
 *
 * Invariants: clear-then-blur-stays-empty · same-value-any-numerals · never-round-silently ·
 *             invalid-text-is-preserved · external value changes do not overwrite an active draft.
 */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import { CURRENCIES, editingAmount, formatAmount, NNBSP, numericSpaces, parseAmount, type AmountParseResult, type CurrencyCode } from '../../arabic'
import { amountErrorMessage, requiredAmountMessage } from '../../content/messages'
import { useLocale } from '../locale'
import type { Size } from './button'
import { describedBy, Field, useFieldIds } from './field'
import { Icon } from '../icons'
import { VisuallyHidden } from './text'

export interface CurrencyInputDetails {
  status: AmountParseResult['status']
  result: AmountParseResult
  reason: 'input' | 'clear' | 'suggestion' | 'escape'
}

export interface CurrencyInputLabels {
  clear: string
  suggestionsIntro: string
  currencyPrefix: string
}

export interface CurrencyInputProps {
  label: ReactNode
  /** Minor units (e.g. piasters). `null` means empty. */
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null, details: CurrencyInputDetails) => void
  /** Called on every parse, including invalid drafts. Used by the explorer trace. */
  onParse?: (result: AmountParseResult) => void
  currency?: CurrencyCode
  min?: number | null
  max?: number | null
  allowNegative?: boolean
  optional?: boolean
  disabled?: boolean
  readOnly?: boolean
  size?: Size
  helper?: ReactNode
  /** External error (e.g. server-side). Shown in addition to local validation. */
  error?: ReactNode
  /** Show validation even if the field was not blurred yet (e.g. after a submit attempt). */
  showValidation?: boolean
  validateOn?: 'blur' | 'change'
  clearable?: boolean
  showSuggestions?: boolean
  currencyDisplay?: 'symbol' | 'code' | 'none'
  placeholder?: string
  id?: string
  name?: string
  labels?: Partial<CurrencyInputLabels>
  /** State-sheet only: render a static interaction state. */
  forceState?: 'hover' | 'focus-visible'
  className?: string
}

export interface CurrencyInputHandle {
  focus: () => void
  /** Marks the field as touched so validation becomes visible. Returns the current result. */
  validate: () => AmountParseResult
  /** Replaces the draft as if typed, and marks the field touched (used by explorer fixtures). */
  setDraft: (text: string) => void
}

const DEFAULT_LABELS: CurrencyInputLabels = {
  clear: 'مسح المبلغ',
  suggestionsIntro: 'هل تقصد:',
  currencyPrefix: 'بعملة',
}

export const CurrencyInput = forwardRef<CurrencyInputHandle, CurrencyInputProps>(function CurrencyInput(props, ref) {
  const {
    label,
    value: controlled,
    defaultValue = null,
    onValueChange,
    onParse,
    currency = 'EGP',
    min = null,
    max = null,
    allowNegative = false,
    optional = false,
    disabled,
    readOnly,
    size = 'md',
    helper,
    error: externalError,
    showValidation = false,
    validateOn = 'blur',
    clearable = true,
    showSuggestions = true,
    currencyDisplay = 'symbol',
    placeholder,
    id,
    name,
    forceState,
    className,
  } = props
  const labels = { ...DEFAULT_LABELS, ...props.labels }
  const { numerals, dir } = useLocale()
  const ids = useFieldIds(id)
  const inputRef = useRef<HTMLInputElement>(null)
  const options = useMemo(() => ({ currency, min, max, allowNegative }), [currency, min, max, allowNegative])

  const isControlled = controlled !== undefined
  const initial = isControlled ? controlled : defaultValue
  const display = (minor: number | null, editing: boolean) =>
    minor == null ? '' : editing ? editingAmount(minor, currency, numerals) : formatAmount(minor, { currency, numerals })

  const [text, setTextState] = useState(() => display(initial, false))
  const [result, setResultState] = useState<AmountParseResult>(() => parseAmount(initial == null ? '' : editingAmount(initial, currency, 'latn'), options))
  // Event handlers read the latest values from refs: focus() called right after a state update
  // (e.g. choosing a suggestion) must not see a stale closure and restore an old draft.
  const textRef = useRef(text)
  const resultRef = useRef(result)
  const setText = (t: string) => {
    textRef.current = t
    setTextState(t)
  }
  const setResult = (r: AmountParseResult) => {
    resultRef.current = r
    setResultState(r)
  }
  const [editing, setEditing] = useState(false)
  const [touched, setTouched] = useState(false)
  const lastEmitted = useRef<number | null>(initial)
  const focusSnapshot = useRef('')

  // Re-validate when the rules change (currency, bounds) without touching the typed text.
  useEffect(() => {
    const r = parseAmount(editing || result.status === 'invalid' ? text : result.canonical ?? '', options)
    setResult(r)
    onParse?.(r)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options])

  // External value changes (controlled) replace the text only when they differ from what we emitted.
  useEffect(() => {
    if (!isControlled) return
    if (controlled === lastEmitted.current) return
    lastEmitted.current = controlled
    const r = parseAmount(controlled == null ? '' : editingAmount(controlled, currency, 'latn'), options)
    setResult(r)
    setText(display(controlled, editing))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled])

  // Display numerals follow the provider while the field is not being edited.
  useEffect(() => {
    if (!editing && result.status === 'valid') setText(display(result.minor, false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numerals])

  const apply = (nextText: string, reason: CurrencyInputDetails['reason']) => {
    setText(nextText)
    const r = parseAmount(nextText, options)
    setResult(r)
    onParse?.(r)
    const nextValue = r.status === 'valid' ? r.minor : null
    if (nextValue !== lastEmitted.current || reason !== 'input') {
      lastEmitted.current = nextValue
      onValueChange?.(nextValue, { status: r.status, result: r, reason })
    }
    return r
  }

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    validate: () => {
      setTouched(true)
      return result
    },
    setDraft: (t: string) => {
      setTouched(true)
      setEditing(document.activeElement === inputRef.current)
      const r = apply(t, 'input')
      if (r.status === 'valid') setText(display(r.minor, false))
    },
  }))

  const visible = touched || showValidation || validateOn === 'change'
  let localError: string | null = null
  if (visible && result.status === 'invalid' && result.error) localError = amountErrorMessage(result.error, currency, numerals)
  else if (visible && !editing && result.status === 'empty' && !optional && (touched || showValidation)) localError = requiredAmountMessage
  const errorText = localError ?? externalError ?? null
  const def = CURRENCIES[currency]
  const affix = currencyDisplay === 'symbol' ? def.symbolAr : currencyDisplay === 'code' ? def.code : null

  const suggestions =
    showSuggestions && localError && result.suggestions.length ? (
      <div className="ax-suggest" role="group" aria-label={labels.suggestionsIntro}>
        <span className="ax-suggest__intro">{labels.suggestionsIntro}</span>
        {result.suggestions.map((s) => (
          <button
            key={s.canonical}
            type="button"
            className="ax-suggest__option"
            onClick={() => {
              apply(editingAmount(s.minor, currency, numerals), 'suggestion')
              inputRef.current?.focus()
            }}
          >
            <bdi dir="ltr" className="ax-num">
              {formatAmount(s.minor, { currency, numerals })}
            </bdi>{' '}
            {def.symbolAr}
          </button>
        ))}
      </div>
    ) : null

  return (
    <Field
      ids={ids}
      label={
        <>
          {label}
          {affix ? <VisuallyHidden>{` (${labels.currencyPrefix} ${def.nameAr})`}</VisuallyHidden> : null}
        </>
      }
      optional={optional}
      helper={helper}
      error={errorText}
      errorActions={suggestions}
      size={size}
      disabled={disabled}
      readOnly={readOnly}
      className={['ax-currency', className].filter(Boolean).join(' ')}
    >
      <div
        className="ax-control"
        data-size={size}
        data-invalid={errorText ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        data-readonly={readOnly ? '' : undefined}
        data-empty={text === '' ? '' : undefined}
        data-force={forceState}
        data-dir={dir}
      >
        <input
          ref={inputRef}
          id={ids.input}
          name={name}
          className="ax-control__input ax-currency__input ax-num"
          dir="ltr"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={text}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={errorText ? true : undefined}
          aria-required={!optional || undefined}
          aria-describedby={describedBy(ids, !!helper, !!errorText)}
          onFocus={(e) => {
            setEditing(true)
            const el = e.currentTarget
            const r = resultRef.current
            const t = r.status === 'valid' ? display(r.minor, true) : textRef.current
            if (t !== textRef.current) {
              // Switch to the editing form synchronously; a deferred React write would collapse the selection.
              // The caret position in the display form has no meaning in the editing form, so the whole
              // value is selected: typing replaces the amount, arrow keys place the caret.
              el.value = t
              setText(t)
              el.select()
            }
            focusSnapshot.current = t
          }}
          onBlur={() => {
            setEditing(false)
            setTouched(true)
            const r = resultRef.current
            if (r.status === 'valid') setText(display(r.minor, false))
          }}
          onChange={(e) => {
            // Typed grouping spaces become U+202F so Arabic-Indic groups keep their order (R-BIDI-003).
            const el = e.currentTarget
            const safe = numericSpaces(el.value, NNBSP)
            if (safe !== el.value) {
              const [start, end] = [el.selectionStart, el.selectionEnd]
              el.value = safe
              el.setSelectionRange(start, end)
            }
            apply(safe, 'input')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && textRef.current !== focusSnapshot.current) {
              // Revert the draft to its value at focus time; do not let a parent dialog close.
              e.preventDefault()
              e.stopPropagation()
              apply(focusSnapshot.current, 'escape')
            }
          }}
        />
        {clearable && text !== '' && !disabled && !readOnly ? (
          <button
            type="button"
            className="ax-control__clear"
            aria-label={labels.clear}
            title={labels.clear}
            onClick={() => {
              apply('', 'clear')
              inputRef.current?.focus()
            }}
          >
            <Icon name="close" size={16} />
          </button>
        ) : null}
        {affix ? (
          <span className="ax-control__affix" aria-hidden="true">
            {affix}
          </span>
        ) : null}
      </div>
    </Field>
  )
})
