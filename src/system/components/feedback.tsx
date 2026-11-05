import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon, type IconName } from '../icons'
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

export function Badge({ tone = 'neutral', variant = 'soft', children, dot, title }: { tone?: BadgeTone; variant?: 'soft' | 'outline'; children: ReactNode; dot?: boolean; title?: string }) {
  return (
    <span className="ax-badge" data-tone={tone} data-variant={variant} title={title}>
      {dot ? <span className="ax-badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

export function EmptyState({ icon = 'search', title, children, action }: { icon?: IconName; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
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

interface ToastItem {
  id: number
  tone: MessageTone
  title: ReactNode
  body?: ReactNode
}

const ToastContext = createContext<(t: Omit<ToastItem, 'id'>) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)
  const dismiss = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id))
  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = ++seq.current
    setItems((xs) => [...xs.slice(-2), { ...t, id }])
    window.setTimeout(() => dismiss(id), 5000)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      {createPortal(
      <div className="ax-toasts" role="status" aria-live="polite" dir="rtl" lang="ar">
        {items.map((t) => (
          <div key={t.id} className="ax-toast" data-tone={t.tone}>
            <Icon name={TONE_ICON[t.tone]} size={18} className="ax-message__icon" />
            <div className="ax-toast__content">
              <p className="ax-toast__title">{t.title}</p>
              {t.body ? <p className="ax-toast__body">{t.body}</p> : null}
            </div>
            <IconButton icon="close" label="إغلاق الإشعار" size="sm" onClick={() => dismiss(t.id)} />
          </div>
        ))}
      </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
