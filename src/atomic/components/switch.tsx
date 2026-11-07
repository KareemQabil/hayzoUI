/**
 * F3 atom: Switch — atomic.switch@0.1.0. Contract: ./choice-contracts.ts (SWITCH_CONTRACT).
 * A native <button role="switch" aria-checked>: Space and Enter toggle through the native button click, and an
 * on/off change takes effect immediately (use a Checkbox for a choice that is submitted later).
 *
 * State contract: `checked` / `defaultChecked` / `onCheckedChange(checked)`.
 * Name: the visible label, referenced by aria-labelledby; it is also a <label for> so clicking it toggles.
 * Direction: the thumb travels toward the inline end when on — right in LTR, left in RTL — from the recipe alone.
 */
import type { ReactNode } from 'react'
import { useFieldIds } from '../behavior/field'
import { useControllableState } from '../platform/react/controllable'
import { useExperience } from '../platform/react/experience'
import '../styles/recipes/choice.css'

export interface SwitchProps {
  label: ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  description?: ReactNode
  isDisabled?: boolean
  id?: string
}

export function Switch({ label, checked, defaultChecked = false, onCheckedChange, description, isDisabled, id }: SwitchProps) {
  useExperience() // must render inside a scope: direction comes from it, never from a prop
  const ids = useFieldIds(id)
  const [current, setCurrent] = useControllableState<boolean>(checked, defaultChecked, onCheckedChange ? (next) => onCheckedChange(next) : undefined)

  return (
    <div data-hz="switch" data-disabled={isDisabled ? '' : undefined}>
      <button
        data-slot="control"
        type="button"
        role="switch"
        id={ids.control}
        aria-checked={current}
        aria-labelledby={ids.label}
        aria-describedby={description ? ids.description : undefined}
        disabled={isDisabled}
        onClick={() => setCurrent(!current, undefined)}
      >
        <span data-slot="track" aria-hidden="true">
          <span data-slot="thumb" />
        </span>
      </button>
      <span data-slot="text">
        <label data-slot="label" id={ids.label} htmlFor={ids.control}>{label}</label>
        {description ? <span data-slot="description" id={ids.description}>{description}</span> : null}
      </span>
    </div>
  )
}
