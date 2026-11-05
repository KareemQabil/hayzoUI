/**
 * SegmentedControl (radiogroup semantics) and Switch.
 * Arrow keys follow the visual direction: in RTL, ArrowLeft moves to the next option.
 */
import { useId, useRef, type ReactNode } from 'react'
import { useLocale } from '../locale'
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
  value: V
  onValueChange: (value: V) => void
  options: SegmentOption<V>[]
  size?: Size
  fullWidth?: boolean
  /** Allow options to wrap onto two rows in narrow containers. */
  wrap?: boolean
}

export function SegmentedControl<V extends string>({ label, hideLabel, value, onValueChange, options, size = 'sm', fullWidth, wrap }: SegmentedControlProps<V>) {
  const { dir } = useLocale()
  const labelId = 'seg' + useId().replace(/:/g, '')
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const enabled = options.filter((o) => !o.disabled)

  const move = (delta: number) => {
    const i = enabled.findIndex((o) => o.value === value)
    const next = enabled[(i + delta + enabled.length) % enabled.length]
    onValueChange(next.value)
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
              onClick={() => onValueChange(o.value)}
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
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  description?: ReactNode
  disabled?: boolean
}

export function Switch({ label, checked, onCheckedChange, description, disabled }: SwitchProps) {
  const id = 'sw' + useId().replace(/:/g, '')
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
        onClick={() => onCheckedChange(!checked)}
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
