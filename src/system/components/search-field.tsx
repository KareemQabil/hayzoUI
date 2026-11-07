import { forwardRef, type ReactNode } from 'react'
import { localizeNumbers } from '../../arabic'
import { Icon } from '../icons'
import { useLocale } from '../locale'
import { textOrNull, useControllable } from '../use-controllable'
import type { Size } from './button'
import { useFieldIds } from './field'
import { VisuallyHidden } from './text'

export interface SearchFieldProps {
  label: string
  /** Visually hide the label (the accessible name stays). */
  hideLabel?: boolean
  /** Controlled query. Empty is null; '' is accepted as empty too. Omit to use defaultValue. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  placeholder?: string
  size?: Size
  /** Live status announced politely, e.g. "3 نتائج". A string is shown in the provider's numerals. */
  status?: ReactNode
  /** Internal strings, Arabic by default. */
  labels?: Partial<SearchFieldLabels>
  id?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
  trailing?: ReactNode
}

export interface SearchFieldLabels {
  clear: string
}
const DEFAULT_LABELS: SearchFieldLabels = { clear: 'مسح البحث' }

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { label, hideLabel, value: valueProp, defaultValue = null, onValueChange, placeholder, size = 'md', status, labels: labelsProp, id, onKeyDown, inputProps, trailing },
  ref,
) {
  const ids = useFieldIds(id)
  const { dir, numerals } = useLocale()
  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const [current, setValue] = useControllable<string | null>(valueProp === '' ? null : valueProp, defaultValue === '' ? null : defaultValue, onValueChange)
  const value = current ?? ''
  return (
    <div className="ax-field ax-search" data-size={size} data-dir={dir}>
      {hideLabel ? (
        <label htmlFor={ids.input}>
          <VisuallyHidden>{label}</VisuallyHidden>
        </label>
      ) : (
        <label className="ax-field__label" htmlFor={ids.input}>
          {label}
        </label>
      )}
      <div className="ax-control" data-size={size} data-dir={dir}>
        <span className="ax-control__affix ax-control__affix--start" aria-hidden="true">
          <Icon name="search" size={16} />
        </span>
        <input
          ref={ref}
          id={ids.input}
          type="search"
          dir={value === '' ? dir : 'auto'}
          className="ax-control__input"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          aria-describedby={status ? ids.helper : undefined}
          onChange={(e) => setValue(textOrNull(e.target.value), undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && value) {
              e.preventDefault()
              e.stopPropagation()
              setValue(null, undefined)
            }
            onKeyDown?.(e)
          }}
          {...inputProps}
        />
        {value ? (
          <button type="button" className="ax-control__clear" aria-label={labels.clear} title={labels.clear} onClick={() => setValue(null, undefined)}>
            <Icon name="close" size={16} />
          </button>
        ) : null}
        {trailing}
      </div>
      {status !== undefined ? (
        <p className="ax-sr" id={ids.helper} aria-live="polite">
          {typeof status === 'string' ? localizeNumbers(status, numerals) : status}
        </p>
      ) : null}
    </div>
  )
})
