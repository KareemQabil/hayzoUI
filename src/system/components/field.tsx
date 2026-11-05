/**
 * Field anatomy shared by every input: root · label · control · helper · error.
 * The label is a real <label for>; helper and error are referenced by aria-describedby.
 */
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Icon } from '../icons'
import { useLocale } from '../locale'
import type { Size } from './button'

export interface FieldIds {
  input: string
  label: string
  helper: string
  error: string
}

export function useFieldIds(id?: string): FieldIds {
  const auto = useId()
  const base = id ?? 'f' + auto.replace(/:/g, '')
  return { input: base, label: base + '-label', helper: base + '-helper', error: base + '-error' }
}

export function describedBy(ids: FieldIds, hasHelper: boolean, hasError: boolean): string | undefined {
  return [hasError && ids.error, hasHelper && ids.helper].filter(Boolean).join(' ') || undefined
}

export interface FieldProps {
  ids: FieldIds
  label: ReactNode
  /** Visible "optional" marker. Required fields are the default and are marked with aria-required. */
  optional?: boolean
  helper?: ReactNode
  error?: ReactNode
  size?: Size
  disabled?: boolean
  readOnly?: boolean
  className?: string
  labelAside?: ReactNode
  children: ReactNode
  /** Extra content under the error (e.g. correction suggestions). */
  errorActions?: ReactNode
}

export function Field({ ids, label, optional, helper, error, size = 'md', disabled, readOnly, className, labelAside, children, errorActions }: FieldProps) {
  const { dir } = useLocale()
  return (
    <div
      className={['ax-field', className].filter(Boolean).join(' ')}
      data-size={size}
      data-invalid={error ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-readonly={readOnly ? '' : undefined}
      data-dir={dir}
    >
      <div className="ax-field__label-row">
        <label className="ax-field__label" htmlFor={ids.input} id={ids.label}>
          {label}
          {optional ? <span className="ax-field__optional">{dir === 'rtl' ? 'اختياري' : 'Optional'}</span> : null}
        </label>
        {labelAside}
      </div>
      {children}
      <div className="ax-field__error" id={ids.error} aria-live="polite">
        {error ? (
          <>
            <p className="ax-field__error-text">
              <Icon name="error" size={16} />
              <span>{error}</span>
            </p>
            {errorActions}
          </>
        ) : null}
      </div>
      {helper ? (
        <p className="ax-field__helper" id={ids.helper}>
          {helper}
        </p>
      ) : null}
    </div>
  )
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue' | 'onChange' | 'dir'> {
  label: ReactNode
  value: string
  onValueChange: (value: string) => void
  helper?: ReactNode
  error?: ReactNode
  optional?: boolean
  size?: Size
  /** Direction of the content, not of the UI. "auto" follows the first strong character. */
  contentDir?: 'auto' | 'ltr' | 'rtl'
  mono?: boolean
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, value, onValueChange, helper, error, optional, size = 'md', contentDir = 'auto', mono, id, disabled, readOnly, className, ...rest },
  ref,
) {
  const ids = useFieldIds(id)
  const { dir: uiDir } = useLocale()
  // dir="auto" resolves to LTR for an empty value, which flips Arabic placeholders; follow the UI until typed.
  const resolvedDir = contentDir === 'auto' && value === '' ? uiDir : contentDir
  return (
    <Field ids={ids} label={label} helper={helper} error={error} optional={optional} size={size} disabled={disabled} readOnly={readOnly} className={className}>
      <div className="ax-control" data-size={size}>
        <input
          ref={ref}
          id={ids.input}
          className={['ax-control__input', mono && 'ax-mono'].filter(Boolean).join(' ')}
          dir={resolvedDir}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-required={!optional || undefined}
          aria-describedby={describedBy(ids, !!helper, !!error)}
          disabled={disabled}
          readOnly={readOnly}
          {...rest}
        />
      </div>
    </Field>
  )
})
