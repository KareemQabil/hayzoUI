import { forwardRef, type ReactNode } from 'react'
import { Icon } from '../icons'
import { useLocale } from '../locale'
import type { Size } from './button'
import { useFieldIds } from './field'
import { VisuallyHidden } from './text'

export interface SearchFieldProps {
  label: string
  /** Visually hide the label (the accessible name stays). */
  hideLabel?: boolean
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  size?: Size
  /** Live status announced politely, e.g. "٣ نتائج". */
  status?: ReactNode
  clearLabel?: string
  id?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
  trailing?: ReactNode
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { label, hideLabel, value, onValueChange, placeholder, size = 'md', status, clearLabel = 'مسح البحث', id, onKeyDown, inputProps, trailing },
  ref,
) {
  const ids = useFieldIds(id)
  const { dir } = useLocale()
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
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && value) {
              e.preventDefault()
              e.stopPropagation()
              onValueChange('')
            }
            onKeyDown?.(e)
          }}
          {...inputProps}
        />
        {value ? (
          <button type="button" className="ax-control__clear" aria-label={clearLabel} title={clearLabel} onClick={() => onValueChange('')}>
            <Icon name="close" size={16} />
          </button>
        ) : null}
        {trailing}
      </div>
      {status !== undefined ? (
        <p className="ax-sr" id={ids.helper} aria-live="polite">
          {status}
        </p>
      ) : null}
    </div>
  )
})
