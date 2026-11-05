/**
 * SegmentedControl (radiogroup semantics) and Switch.
 * Arrow keys follow the visual direction: in RTL, ArrowLeft moves to the next option.
 */
import { useId, useRef, type ReactNode } from 'react'
import { useLocale } from '../locale'
import { useControllable } from '../use-controllable'
import type { Size } from './button'

export interface SegmentOption<V extends string> {
  value: V
  label: ReactNode
  /** Accessible name if label is not plain text. */
  ariaLabel?: string
  disabled?: boolean
}

export interface SegmentedControlProps<V extends string> {
  label: string
  hideLabel?: boolean
  /** Controlled value. Omit to use defaultValue. */
  value?: V
  /** Initial value when uncontrolled. Defaults to the first enabled option. */
  defaultValue?: V
  onValueChange?: (value: V) => void
  options: SegmentOption<V>[]
  size?: Size
  fullWidth?: boolean
  /** Allow options to wrap onto two rows in narrow containers. */
  wrap?: boolean
}

export function SegmentedControl<V extends string>({ label, hideLabel, value: valueProp, defaultValue, onValueChange, options, size = 'sm', fullWidth, wrap }: SegmentedControlProps<V>) {
  const { dir } = useLocale()
  const [value, setValue] = useControllable<V>(valueProp, defaultValue ?? (options.find((o) => !o.disabled) ?? options[0]).value, onValueChange)
  const labelId = 'seg' + useId().replace(/:/g, '')
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const enabled = options.filter((o) => !o.disabled)

  const move = (delta: number) => {
    const i = enabled.findIndex((o) => o.value === value)
    const next = enabled[(i + delta + enabled.length) % enabled.length]
    setValue(next.value, undefined)
    refs.current[options.indexOf(next)]?.focus()
  }

  return (
    <div className="ax-segmented-wrap" data-full={fullWidth || undefined}>
      <span id={labelId} className={hideLabel ? 'ax-sr' : 'ax-segmented__label'}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="ax-segmented"
        data-size={size}
        data-wrap={wrap || undefined}
        onKeyDown={(e) => {
          const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
          const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
          if (e.key === forward || e.key === 'ArrowDown') {
            e.preventDefault()
            move(1)
          } else if (e.key === backward || e.key === 'ArrowUp') {
            e.preventDefault()
            move(-1)
          }
        }}
      >
        {options.map((o, i) => {
          const checked = o.value === value
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={o.ariaLabel}
              tabIndex={checked ? 0 : -1}
              disabled={o.disabled}
              data-state={checked ? 'checked' : 'unchecked'}
              className="ax-segmented__item"
              onClick={() => setValue(o.value, undefined)}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export interface SwitchProps {
  label: ReactNode
  /** Controlled state. Omit to use defaultChecked. */
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  description?: ReactNode
  disabled?: boolean
}

export function Switch({ label, checked: checkedProp, defaultChecked = false, onCheckedChange, description, disabled }: SwitchProps) {
  const id = 'sw' + useId().replace(/:/g, '')
  const [checked, setChecked] = useControllable<boolean>(checkedProp, defaultChecked, onCheckedChange)
  return (
    <div className="ax-switch-row" data-disabled={disabled ? '' : undefined}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? id + '-d' : undefined}
        disabled={disabled}
        className="ax-switch"
        data-state={checked ? 'checked' : 'unchecked'}
        onClick={() => setChecked(!checked, undefined)}
      >
        <span className="ax-switch__thumb" />
      </button>
      <div className="ax-switch-row__text">
        <label htmlFor={id} className="ax-switch-row__label">
          {label}
        </label>
        {description ? (
          <p id={id + '-d'} className="ax-switch-row__desc">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export type { Size }
