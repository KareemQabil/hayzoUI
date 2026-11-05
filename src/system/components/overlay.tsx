/**
 * Dialog and Drawer — one overlay core.
 * Focus: enters on open (initialFocus → [data-autofocus] → first field → panel), Tab is contained,
 * Escape closes unless a child handled it (defaultPrevented), focus returns to the opener on close.
 * The application root is made `inert` while open so assistive tech cannot leave the dialog.
 */
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from './button'
import { LocaleProvider, useLocale } from '../locale'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

let openCount = 0
function lockApp(lock: boolean) {
  const root = document.getElementById('root')
  openCount += lock ? 1 : -1
  const locked = openCount > 0
  document.body.style.overflow = locked ? 'hidden' : ''
  if (root) {
    if (locked) root.setAttribute('inert', '')
    else root.removeAttribute('inert')
  }
}

export interface OverlayProps {
  open: boolean
  onOpenChange: (open: boolean, details: { reason: 'escape' | 'scrim' | 'close-button' | 'action' }) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  initialFocus?: RefObject<HTMLElement | null>
  /** Fallback when the opener no longer exists. */
  returnFocus?: RefObject<HTMLElement | null>
  closeLabel?: string
  size?: 'sm' | 'md' | 'lg'
  /** Prevent closing (e.g. during a busy submit). */
  dismissible?: boolean
}

function OverlayCore({ kind, open, onOpenChange, title, description, children, footer, initialFocus, returnFocus, closeLabel = 'إغلاق', size = 'md', dismissible = true }: OverlayProps & { kind: 'dialog' | 'drawer' }) {
  const { dir, lang, numerals } = useLocale()
  const panelRef = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const titleId = 'dlg' + useId().replace(/:/g, '')
  const dismissibleRef = useRef(dismissible)
  dismissibleRef.current = dismissible

  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement as HTMLElement | null
    lockApp(true)
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel) return
      const target =
        initialFocus?.current ??
        panel.querySelector<HTMLElement>('[data-autofocus]') ??
        panel.querySelector<HTMLElement>('.ax-overlay__body input:not([disabled]), .ax-overlay__body select, .ax-overlay__body textarea') ??
        panel
      target.focus()
    })
    return () => {
      cancelAnimationFrame(frame)
      lockApp(false)
      const back = opener.current?.isConnected ? opener.current : returnFocus?.current
      back?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !e.defaultPrevented) {
      e.stopPropagation()
      if (dismissibleRef.current) onOpenChange(false, { reason: 'escape' })
      return
    }
    if (e.key !== 'Tab') return
    const panel = panelRef.current!
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement)
    if (!items.length) {
      e.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <LocaleProvider dir={dir} lang={lang} numerals={numerals} className="ax-overlay-root">
      <div className="ax-scrim" data-kind={kind} onMouseDown={() => dismissible && onOpenChange(false, { reason: 'scrim' })} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? titleId + '-d' : undefined}
        tabIndex={-1}
        className="ax-overlay"
        data-kind={kind}
        data-size={size}
        data-state="open"
        onKeyDown={onKeyDown}
      >
        <header className="ax-overlay__header">
          <div className="ax-overlay__titles">
            <h2 id={titleId} className="ax-overlay__title">
              {title}
            </h2>
            {description ? (
              <p id={titleId + '-d'} className="ax-overlay__desc">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton icon="close" label={closeLabel} disabled={!dismissible} onClick={() => onOpenChange(false, { reason: 'close-button' })} />
        </header>
        <div className="ax-overlay__body">{children}</div>
        {footer ? <footer className="ax-overlay__footer">{footer}</footer> : null}
      </div>
    </LocaleProvider>,
    document.body,
  )
}

export function Dialog(props: OverlayProps) {
  return <OverlayCore kind="dialog" {...props} />
}

/** Side sheet at the inline end on wide screens; bottom sheet below 640px. */
export function Drawer(props: OverlayProps) {
  return <OverlayCore kind="drawer" {...props} />
}
