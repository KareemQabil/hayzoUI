/**
 * F3 atom: TextField — atomic.text-field@0.1.0. Contract: ./contracts.ts (TEXT_FIELD_CONTRACT).
 * Behavior from useFieldIds/fieldControlAria (F2) and useControllableState (F1); style from the field recipe (S3).
 *
 * Value contract: `value` / `defaultValue` / `onValueChange`, with null for empty (an empty string never leaks).
 * Content direction: the field follows the experience direction; `contentDirection="ltr"` is for data that is
 * always left-to-right (email, code, URL) and `"auto"` takes the direction from the first strong character.
 */
import type { ReactNode } from 'react'
import { fieldControlAria, useFieldIds } from '../behavior/field'
import { useControllableState } from '../platform/react/controllable'
import { useExperience } from '../platform/react/experience'
import '../styles/recipes/field.css'
import { labelsFor, type AtomLabels } from './labels'

export interface TextFieldProps {
  label: ReactNode
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  description?: ReactNode
  /** An error message makes the field invalid; there is no invalid state without a reason. */
  error?: ReactNode
  placeholder?: string
  isRequired?: boolean
  isDisabled?: boolean
  isReadOnly?: boolean
  type?: 'text' | 'email' | 'tel' | 'url' | 'search' | 'password'
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'search' | 'numeric' | 'decimal'
  autoComplete?: string
  contentDirection?: 'inherit' | 'ltr' | 'auto'
  name?: string
  id?: string
  labels?: Partial<Pick<AtomLabels, 'required'>>
}

export function TextField({ label, value, defaultValue = null, onValueChange, description, error, placeholder, isRequired, isDisabled, isReadOnly, type = 'text', inputMode, autoComplete, contentDirection = 'inherit', name, id, labels }: TextFieldProps) {
  const { locale, direction, mixedScriptAlignment } = useExperience()
  const text = { ...labelsFor(locale), ...labels }
  const ids = useFieldIds(id)
  const [current, setCurrent] = useControllableState<string | null>(value, defaultValue, onValueChange ? (next) => onValueChange(next) : undefined)
  const hasError = error !== undefined && error !== null && error !== false
  const aria = fieldControlAria({ ids, hasDescription: !!description, hasError })
  // Content in its own direction (an email in an Arabic form) aligns with the interface under the 'ui' policy, and
  // with its own start under 'content'. Physical on purpose: the input's own dir is the content's, not the UI's.
  const align = contentDirection !== 'inherit' && mixedScriptAlignment === 'ui' ? (direction === 'rtl' ? 'right' : 'left') : undefined

  return (
    <div data-hz="field" data-invalid={hasError ? '' : undefined} data-disabled={isDisabled ? '' : undefined} data-readonly={isReadOnly ? '' : undefined}>
      <label data-slot="label" id={ids.label} htmlFor={ids.control}>
        {label}
        {isRequired ? <span data-slot="required">({text.required})</span> : null}
      </label>
      <div data-slot="control">
        <input
          data-slot="input"
          {...aria}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          name={name}
          dir={contentDirection === 'inherit' ? undefined : contentDirection}
          data-align={align}
          value={current ?? ''}
          placeholder={placeholder}
          required={isRequired}
          disabled={isDisabled}
          readOnly={isReadOnly}
          onChange={(event) => setCurrent(event.target.value === '' ? null : event.target.value, undefined)}
        />
      </div>
      {hasError ? (
        <p data-slot="error" id={ids.error}>
          <svg data-slot="error-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M10 5.5v5.5M10 13.6v.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </p>
      ) : null}
      {description ? <p data-slot="description" id={ids.description}>{description}</p> : null}
    </div>
  )
}
