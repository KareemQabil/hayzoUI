/**
 * F3 atom: Button — atomic.button@0.1.0. Contract: ./contracts.ts (BUTTON_CONTRACT).
 * Behavior from usePress (F2); style from the button recipe (S3) through data-* hooks only.
 * Nothing here knows a color, size, radius or font: those arrive as resolved tokens on the experience scope.
 */
import type { ReactNode } from 'react'
import { usePress, type PressOptions } from '../behavior/press'
import { useExperience } from '../platform/react/experience'
import '../styles/recipes/button.css'
import { labelsFor, type AtomLabels } from './labels'

export type ButtonIntent = 'primary' | 'neutral' | 'danger'
export type ButtonEmphasis = 'solid' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends PressOptions {
  children: ReactNode
  intent?: ButtonIntent
  emphasis?: ButtonEmphasis
  size?: ButtonSize
  /** Decorative icons, placed on the inline start/end: they follow direction without props. */
  iconStart?: ReactNode
  iconEnd?: ReactNode
  type?: 'button' | 'submit' | 'reset'
  /** Required when the visible label is an icon only. */
  'aria-label'?: string
  labels?: Partial<Pick<AtomLabels, 'pending'>>
  id?: string
  name?: string
  value?: string
  form?: string
}

export function Button({ children, intent = 'primary', emphasis = 'solid', size = 'md', iconStart, iconEnd, type = 'button', labels, onPress, isDisabled, isPending, ...rest }: ButtonProps) {
  const { locale } = useExperience()
  const text = { ...labelsFor(locale), ...labels }
  const press = usePress({ onPress, isDisabled, isPending })
  return (
    <button type={type} data-hz="button" data-intent={intent} data-emphasis={emphasis} data-size={size} {...press.props} {...rest}>
      {iconStart ? <span data-slot="icon-start" aria-hidden="true">{iconStart}</span> : null}
      <span data-slot="label">{children}</span>
      {iconEnd && !press.pending ? <span data-slot="icon-end" aria-hidden="true">{iconEnd}</span> : null}
      {press.pending ? (
        <>
          <span data-slot="spinner" aria-hidden="true" />
          {/* Announced with the label: «حفظ، جارٍ التنفيذ». Visually hidden without a class from outside. */}
          <span style={VISUALLY_HIDDEN}>{(locale.startsWith('ar') ? '، ' : ', ') + text.pending}</span>
        </>
      ) : null}
    </button>
  )
}

const VISUALLY_HIDDEN = { position: 'absolute', inlineSize: 1, blockSize: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' } as const
