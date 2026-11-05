import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon, type IconName } from '../icons'
import { useLocale } from '../locale'
import { IconButton } from './button'

export type MessageTone = 'info' | 'success' | 'warning' | 'danger'
const TONE_ICON: Record<MessageTone, IconName> = { info: 'info', success: 'success', warning: 'warning', danger: 'error' }

export interface InlineMessageProps {
  tone?: MessageTone
  title?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  /** "assertive" uses role=alert. Use only for failures the person must act on now. */
  live?: 'polite' | 'assertive' | 'off'
  className?: string
  id?: string
}

export function InlineMessage({ tone = 'info', title, children, actions, live = 'polite', className, id }: InlineMessageProps) {
  const role = live === 'assertive' ? 'alert' : live === 'polite' ? 'status' : undefined
  return (
    <div id={id} className={['ax-message', className].filter(Boolean).join(' ')} data-tone={tone} role={role}>
      <Icon name={TONE_ICON[tone]} size={18} className="ax-message__icon" />
      <div className="ax-message__content">
        {title ? <p className="ax-message__title">{title}</p> : null}
        {children ? <div className="ax-message__body">{children}</div> : null}
        {actions ? <div className="ax-message__actions">{actions}</div> : null}
      </div>
    </div>
  )
}

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps {
  tone?: BadgeTone
  variant?: 'soft' | 'outline'
  /** Short status text. Color is never the only signal. */
  children: ReactNode
  /** Leading dot, decorative. */
  dot?: boolean
  /** Longer description shown on hover. */
  title?: string
}

export function Badge({ tone = 'neutral', variant = 'soft', children, dot, title }: BadgeProps) {
  return (
    <span className="ax-badge" data-tone={tone} data-variant={variant} title={title}>
      {dot ? <span className="ax-badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

export interface EmptyStateProps {
  icon?: IconName
  /** What is empty, in one line. */
  title: ReactNode
  /** Why it is empty and what to do next. */
  children?: ReactNode
  /** One primary way forward (button or link). */
  action?: ReactNode
}

export function EmptyState({ icon = 'search', title, children, action }: EmptyStateProps) {
  return (
    <div className="ax-empty">
      <span className="ax-empty__icon">
        <Icon name={icon} size={20} />
      </span>
      <p className="ax-empty__title">{title}</p>
      {children ? <div className="ax-empty__body">{children}</div> : null}
      {action ? <div className="ax-empty__action">{action}</div> : null}
    </div>
  )
}

export function Spinner({ label }: { label: string }) {
  return (
    <span className="ax-spinner" role="status">
      <Icon name="loader" size={18} className="ax-spin" />
      <span className="ax-sr">{label}</span>
    </span>
  )
}

export function Skeleton({ width = '100%', height = 14 }: { width?: number | string; height?: number }) {
  return <span className="ax-skeleton" style={{ width, height }} aria-hidden="true" />
}

/** Options for toast(). */
export interface ToastProps {
  tone: MessageTone
  title: ReactNode
  body?: ReactNode
  /** ms before it closes by itself. Default 6000; danger toasts stay until dismissed (null). */
  duration?: number | null
}

export interface ToastLabels {
  dismiss: string
}
const DEFAULT_TOAST_LABELS: ToastLabels = { dismiss: 'إغلاق الإشعار' }

interface ToastItem extends ToastProps {
  id: number
}

const ToastContext = createContext<(t: ToastProps) => void>(() => {})

/**
 * Toasts take direction and language from the nearest LocaleProvider (never hard-coded).
 * Timers pause while the stack is hovered or holds focus (WCAG 2.2.1), and errors never auto-dismiss.
 */
export function ToastProvider({ children, labels: labelsProp }: { children: ReactNode; labels?: Partial<ToastLabels> }) {
  const { dir, lang } = useLocale()
  const labels = { ...DEFAULT_TOAST_LABELS, ...labelsProp }
  const [items, setItems] = useState<ToastItem[]>([])
  const [paused, setPaused] = useState(false)
  const seq = useRef(0)
  const dismiss = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id))
  const push = useCallback((t: ToastProps) => {
    const id = ++seq.current
    setItems((xs) => [...xs.slice(-2), { ...t, id }])
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      {createPortal(
      <div
        className="ax-toasts"
        role="status"
        aria-live="polite"
        dir={dir}
        lang={lang}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false)
        }}
      >
        {items.map((t) => (
          <ToastTimer key={t.id} duration={t.duration === undefined ? (t.tone === 'danger' ? null : 6000) : t.duration} paused={paused} onDone={() => dismiss(t.id)} />
        ))}
        {items.map((t) => (
          <div key={t.id} className="ax-toast" data-tone={t.tone}>
            <Icon name={TONE_ICON[t.tone]} size={18} className="ax-message__icon" />
            <div className="ax-toast__content">
              <p className="ax-toast__title">{t.title}</p>
              {t.body ? <p className="ax-toast__body">{t.body}</p> : null}
            </div>
            <IconButton icon="close" label={labels.dismiss} size="sm" onClick={() => dismiss(t.id)} />
          </div>
        ))}
      </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

/** Counts down only while not paused; the remaining time survives pauses. */
function ToastTimer({ duration, paused, onDone }: { duration: number | null; paused: boolean; onDone: () => void }) {
  const remaining = useRef(duration)
  useEffect(() => {
    if (remaining.current == null || paused) return
    const start = Date.now()
    const t = window.setTimeout(onDone, remaining.current)
    return () => {
      window.clearTimeout(t)
      if (remaining.current != null) remaining.current -= Date.now() - start
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused])
  return null
}

export function useToast() {
  return useContext(ToastContext)
}
