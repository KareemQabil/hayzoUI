/**
 * F3 atom: Dialog — atomic.dialog@0.1.0. Contract: ./overlay-contracts.ts (DIALOG_CONTRACT).
 * Also home of the shared overlay plumbing (scope-carrying portal, modal core) used by Drawer, Popover and Tooltip.
 *
 * Behavior from F2 primitives: useFocusScope (trap, initial focus, restore), useLayer (Escape / outside press for the
 * top layer only, scroll lock counter, inert outside). Style from overlay.css through data-* hooks only.
 *
 * Portals: the panel renders into document.body, outside the <ExperienceScope> element, so it would lose the
 * scope's dir, lang, numerals, density, motion and CSS variables. At open time the atom reads the nearest
 * `[data-hz-experience]` ancestor of its render point (a hidden marker, or the trigger) and wraps the portal content
 * in an element carrying copies of them. The wrapper itself carries data-hz-experience, so nested overlays opened
 * from inside a portal find it as their scope.
 */
import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { getTabbables, readExperienceScope, useFocusScope, useLayer, type ExperienceScopeSnapshot } from '../behavior/overlay'
import { useExperience } from '../platform/react/experience'
import '../styles/recipes/overlay.css'
import { overlayLabelsFor, type OverlayLabels } from './overlay-contracts'

// ---------------------------------------------------------------------------------------------------------------
// Shared plumbing (internal to the overlay atoms)
// ---------------------------------------------------------------------------------------------------------------

/** Snapshot of the experience scope around `ref`, taken when `open` becomes true; null while closed or not yet read. */
export function useScopeSnapshot(ref: RefObject<Element | null>, open: boolean): ExperienceScopeSnapshot | null {
  const { direction, locale } = useExperience()
  const [snapshot, setSnapshot] = useState<ExperienceScopeSnapshot | null>(null)
  useLayoutEffect(() => {
    setSnapshot(open ? (readExperienceScope(ref.current) ?? { attributes: { dir: direction, lang: locale }, variables: {} }) : null)
  }, [open, ref, direction, locale])
  return open ? snapshot : null
}

/** Portal into document.body, wrapped in an element that re-creates the captured experience scope. */
export function ScopedPortal({ snapshot, children }: { snapshot: ExperienceScopeSnapshot; children: ReactNode }) {
  return createPortal(
    <div data-hz-portal="" {...snapshot.attributes} style={snapshot.variables as CSSProperties}>
      {children}
    </div>,
    document.body,
  )
}

export type ModalCloseReason = 'escape' | 'outside' | 'close-button'

export interface ModalOverlayProps {
  open: boolean
  onOpenChange: (open: boolean, details: { reason: ModalCloseReason }) => void
  /** Required: the accessible name (aria-labelledby). */
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  /** When false, Escape, backdrop press and the close button do not close (e.g. during a busy submit). Default true. */
  dismissible?: boolean
  /** Element to focus on open; otherwise [data-autofocus] → the first tabbable in the body, then the footer → the panel (never the close button first). */
  initialFocus?: RefObject<HTMLElement | null>
  /** Restore target when the element focused before opening no longer exists. */
  returnFocus?: RefObject<HTMLElement | null>
  labels?: Partial<OverlayLabels>
}

export function ModalOverlay({ kind, variant, ...props }: ModalOverlayProps & { kind: 'dialog' | 'drawer'; variant: Record<string, string> }) {
  const marker = useRef<HTMLSpanElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  // Before the panel mounts (and before anything becomes inert): remember who opened it.
  useLayoutEffect(() => {
    if (props.open) opener.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
  }, [props.open])
  const snapshot = useScopeSnapshot(marker, props.open)
  return (
    <>
      <span data-hz-portal-anchor="" hidden ref={marker} />
      {props.open && snapshot ? (
        <ScopedPortal snapshot={snapshot}>
          <ModalPanel kind={kind} variant={variant} opener={opener} {...props} />
        </ScopedPortal>
      ) : null}
    </>
  )
}

function ModalPanel({ kind, variant, opener, onOpenChange, title, description, children, footer, dismissible = true, initialFocus, returnFocus, labels }: ModalOverlayProps & { kind: 'dialog' | 'drawer'; variant: Record<string, string>; opener: RefObject<HTMLElement | null> }) {
  const { locale } = useExperience()
  const text = { ...overlayLabelsFor(locale), ...labels }
  const panel = useRef<HTMLDivElement>(null)
  const base = useId().replace(/:/g, '')
  const titleId = `${base}-title`
  const descriptionId = `${base}-description`
  const close = (reason: ModalCloseReason) => onOpenChange(false, { reason })

  // Order matters: the focus scope activates before the layer makes the page inert, and restores focus (retrying
  // once in a microtask if the target is still inert) when both are released.
  useFocusScope(panel, true, { contain: true, initialFocus: () => initialFocus?.current ?? firstFocus(panel.current), returnFocus: () => returnFocus?.current ?? (opener.current?.isConnected ? opener.current : null) })
  useLayer(true, {
    modal: true,
    element: () => panel.current,
    onEscape: () => dismissible && close('escape'),
    onOutsidePress: () => dismissible && close('outside'),
  })

  return (
    <div data-hz={kind} data-state="open" {...variant}>
      <div data-slot="backdrop" aria-hidden="true" />
      <div data-slot="panel" ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1}>
        <div data-slot="header">
          <h2 data-slot="title" id={titleId}>
            {title}
          </h2>
          <button type="button" data-slot="close" aria-label={text.close} disabled={!dismissible} onClick={() => close('close-button')}>
            <svg data-slot="close-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {description ? (
          <p data-slot="description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        <div data-slot="body">{children}</div>
        {footer ? <div data-slot="footer">{footer}</div> : null}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------------------------------------------

export type DialogSize = 'sm' | 'md' | 'lg'

export interface DialogProps extends ModalOverlayProps {
  size?: DialogSize
}

/** Modal dialog, centered. Controlled: `open` + `onOpenChange(false, { reason })`. */
export function Dialog({ size = 'md', ...props }: DialogProps) {
  return <ModalOverlay kind="dialog" variant={{ 'data-size': size }} {...props} />
}

function firstFocus(panel: HTMLElement | null): HTMLElement | null {
  if (!panel) return null
  const pick = (slot: string) => {
    const el = panel.querySelector<HTMLElement>(`[data-slot='${slot}']`)
    return el ? (getTabbables(el)[0] ?? null) : null
  }
  return panel.querySelector<HTMLElement>('[data-autofocus]') ?? pick('body') ?? pick('footer') ?? panel
}
