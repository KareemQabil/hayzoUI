/**
 * F3 atom: Checkbox — atomic.checkbox@0.1.0. Contract: ./choice-contracts.ts (CHECKBOX_CONTRACT).
 * A native <input type="checkbox"> (the platform owns Space, form submission and the accessibility role), drawn by
 * the choice recipe through data-* hooks. Field wiring (label, description, error) from behavior/field.ts.
 *
 * State contract: `checked` / `defaultChecked` / `onCheckedChange(checked)`.
 * Indeterminate: sets the native `indeterminate` DOM property, which the platform exposes as aria-checked="mixed";
 * no aria-checked attribute is added (ARIA in HTML: native state wins). Activating an indeterminate box reports the
 * next checked value; the box stays mixed until the owner clears `indeterminate`.
 */
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { fieldControlAria, useFieldIds } from '../behavior/field'
import { useControllableState } from '../platform/react/controllable'
import { useExperience } from '../platform/react/experience'
import '../styles/recipes/choice.css'
import { labelsFor, type AtomLabels } from './labels'

export interface CheckboxProps {
  label: ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  indeterminate?: boolean
  description?: ReactNode
  /** An error message makes the checkbox invalid; there is no invalid state without a reason. */
  error?: ReactNode
  isRequired?: boolean
  isDisabled?: boolean
  name?: string
  value?: string
  id?: string
  labels?: Partial<Pick<AtomLabels, 'required'>>
}

export function Checkbox({ label, checked, defaultChecked = false, onCheckedChange, indeterminate = false, description, error, isRequired, isDisabled, name, value, id, labels }: CheckboxProps) {
  const { locale } = useExperience()
  const text = { ...labelsFor(locale), ...labels }
  const ids = useFieldIds(id)
  const [current, setCurrent] = useControllableState<boolean>(checked, defaultChecked, onCheckedChange ? (next) => onCheckedChange(next) : undefined)
  const input = useRef<HTMLInputElement>(null)
  const hasError = error !== undefined && error !== null && error !== false
  const aria = fieldControlAria({ ids, hasDescription: !!description, hasError })

  // Every render: a click clears the native flag, so it is re-applied while the owner still asks for it.
  useLayoutEffect(() => {
    if (input.current) input.current.indeterminate = indeterminate
  })

  return (
    <div data-hz="checkbox" data-invalid={hasError ? '' : undefined} data-disabled={isDisabled ? '' : undefined}>
      <span data-slot="control">
        <input
          ref={input}
          data-slot="input"
          type="checkbox"
          {...aria}
          name={name}
          value={value}
          checked={current}
          required={isRequired}
          disabled={isDisabled}
          onChange={(event) => {
            if (!isDisabled) setCurrent(event.target.checked, undefined)
          }}
        />
        <span data-slot="box" aria-hidden="true">
          <svg data-slot="indicator" viewBox="0 0 16 16" focusable="false">
            <path data-mark="check" d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path data-mark="dash" d="M4 8h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </span>
      <span data-slot="text">
        <label data-slot="label" id={ids.label} htmlFor={ids.control}>
          {label}
          {isRequired ? <span data-slot="required">({text.required})</span> : null}
        </label>
        {hasError ? <span data-slot="error" id={ids.error}>{error}</span> : null}
        {description ? <span data-slot="description" id={ids.description}>{description}</span> : null}
      </span>
    </div>
  )
}
