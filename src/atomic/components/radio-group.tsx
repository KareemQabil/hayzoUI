/**
 * F3 atom: RadioGroup — atomic.radio-group@0.1.0. Contract: ./choice-contracts.ts (RADIO_GROUP_CONTRACT).
 * A <fieldset role="radiogroup"> named by its <legend>, holding native radios that share one `name`.
 *
 * Value contract: `value` / `defaultValue` / `onValueChange(value)`, with null for "nothing chosen yet".
 *
 * Keyboard: native radio behavior — Tab enters the group at the checked radio (or the first one), arrows move and
 * select, disabled radios are skipped. Browsers resolve ArrowLeft/ArrowRight against the element's direction, which
 * the radios inherit from the experience scope, so in RTL ArrowLeft moves to the next radio without code here.
 * (Not reproducible in jsdom: to be confirmed by the browser checks.)
 */
import { useId, type ReactNode } from 'react'
import { fieldControlAria, useFieldIds } from '../behavior/field'
import { useControllableState } from '../platform/react/controllable'
import { useExperience } from '../platform/react/experience'
import '../styles/recipes/choice.css'
import { labelsFor, type AtomLabels } from './labels'

export interface RadioOption<V extends string = string> {
  value: V
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

export interface RadioGroupProps<V extends string = string> {
  label: ReactNode
  options: readonly RadioOption<V>[]
  value?: V | null
  defaultValue?: V | null
  onValueChange?: (value: V | null) => void
  description?: ReactNode
  /** An error message makes the group invalid; there is no invalid state without a reason. */
  error?: ReactNode
  orientation?: 'vertical' | 'horizontal'
  isRequired?: boolean
  isDisabled?: boolean
  name?: string
  id?: string
  labels?: Partial<Pick<AtomLabels, 'required'>>
}

export function RadioGroup<V extends string = string>({ label, options, value, defaultValue = null, onValueChange, description, error, orientation = 'vertical', isRequired, isDisabled, name, id, labels }: RadioGroupProps<V>) {
  const { locale } = useExperience()
  const text = { ...labelsFor(locale), ...labels }
  const ids = useFieldIds(id)
  const groupName = name ?? `${ids.control}-name`
  const optionBase = 'hz' + useId().replace(/:/g, '')
  const [current, setCurrent] = useControllableState<V | null>(value, defaultValue, onValueChange ? (next) => onValueChange(next) : undefined)
  const hasError = error !== undefined && error !== null && error !== false
  const aria = fieldControlAria({ ids, hasDescription: !!description, hasError })

  return (
    <fieldset
      data-hz="radio-group"
      data-orientation={orientation}
      data-invalid={hasError ? '' : undefined}
      data-disabled={isDisabled ? '' : undefined}
      role="radiogroup"
      {...aria}
      aria-labelledby={ids.label}
      aria-required={isRequired ? true : undefined}
      disabled={isDisabled}
    >
      <legend data-slot="legend" id={ids.label}>
        {label}
        {isRequired ? <span data-slot="required">({text.required})</span> : null}
      </legend>
      {hasError ? <p data-slot="error" id={ids.error}>{error}</p> : null}
      {description ? <p data-slot="description" id={ids.description}>{description}</p> : null}
      <div data-slot="options">
        {options.map((option, i) => {
          const optionId = `${optionBase}-${i}`
          return (
            <div key={option.value} data-slot="option" data-disabled={option.disabled ? '' : undefined}>
              <span data-slot="control">
                <input
                  data-slot="input"
                  type="radio"
                  id={optionId}
                  name={groupName}
                  value={option.value}
                  checked={current === option.value}
                  disabled={option.disabled}
                  required={isRequired}
                  aria-describedby={option.description ? `${optionId}-description` : undefined}
                  onChange={(event) => {
                    // Guard as well as native disabled: a synthetic click must not report a disabled choice.
                    if (event.target.checked && !option.disabled && !isDisabled) setCurrent(option.value, undefined)
                  }}
                />
                <span data-slot="box" aria-hidden="true" />
              </span>
              <span data-slot="text">
                <label data-slot="label" htmlFor={optionId}>{option.label}</label>
                {option.description ? <span data-slot="option-description" id={`${optionId}-description`}>{option.description}</span> : null}
              </span>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
