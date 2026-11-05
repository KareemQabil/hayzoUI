import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Icon, type IconName } from '../icons'

export type Variant = 'solid' | 'soft' | 'outline' | 'ghost'
export type Tone = 'accent' | 'neutral' | 'danger'
export type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  tone?: Tone
  size?: Size
  /** Busy state: keeps focus, blocks activation, announces `loadingLabel`. */
  loading?: boolean
  loadingLabel?: string
  iconStart?: IconName
  iconEnd?: IconName
  fullWidth?: boolean
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'solid', tone = 'accent', size = 'md', loading = false, loadingLabel, iconStart, iconEnd, fullWidth, className, children, onClick, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={['ax-button', className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      data-loading={loading || undefined}
      data-full={fullWidth || undefined}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={(e) => {
        if (loading) {
          e.preventDefault()
          return
        }
        onClick?.(e)
      }}
      {...rest}
    >
      {loading ? <Icon name="loader" size={16} className="ax-spin" /> : iconStart ? <Icon name={iconStart} size={16} /> : null}
      <span className="ax-button__label">{loading && loadingLabel ? loadingLabel : children}</span>
      {iconEnd && !loading ? <Icon name={iconEnd} size={16} /> : null}
    </button>
  )
})

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName
  /** Required accessible name, in the UI language. */
  label: string
  variant?: Variant
  tone?: Tone
  size?: Size
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = 'ghost', tone = 'neutral', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={['ax-icon-button', className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 18} />
    </button>
  )
})
