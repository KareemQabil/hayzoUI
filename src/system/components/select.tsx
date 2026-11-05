/** Select — native <select> styled by the system. Keyboard and listbox behaviour come from the browser. */
import type { ReactNode } from 'react'
import { Icon } from '../icons'
import { useLocale } from '../locale'
import { useControllable } from '../use-controllable'
import type { Size } from './button'
import { describedBy, Field, useFieldIds } from './field'

export interface SelectOption<V extends string> {
  value: V
  label: string
}

export interface SelectProps<V extends string> {
  label: ReactNode
  /** Controlled value. Omit to use defaultValue. */
  value?: V
  /** Initial value when uncontrolled. Defaults to the first option. */
  defaultValue?: V
  onValueChange?: (value: V) => void
  options: SelectOption<V>[]
  helper?: ReactNode
  size?: Size
  disabled?: boolean
  id?: string
  hideLabel?: boolean
}

export function Select<V extends string>({ label, value: valueProp, defaultValue, onValueChange, options, helper, size = 'md', disabled, id, hideLabel }: SelectProps<V>) {
  const ids = useFieldIds(id)
  const { dir } = useLocale()
  const [value, setValue] = useControllable<V>(valueProp, defaultValue ?? options[0]?.value, onValueChange)
  return (
    <Field ids={ids} label={label} hideLabel={hideLabel} helper={helper} size={size} disabled={disabled}>
      <div className="ax-control ax-select" data-size={size} data-disabled={disabled ? '' : undefined} data-dir={dir}>
        <select
          id={ids.input}
          className="ax-control__input ax-select__native"
          value={value}
          disabled={disabled}
          aria-describedby={describedBy(ids, !!helper, false)}
          onChange={(e) => setValue(e.target.value as V, undefined)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="ax-control__affix" aria-hidden="true">
          <Icon name="chevron-down" size={16} />
        </span>
      </div>
    </Field>
  )
}
