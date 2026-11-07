/**
 * F3 atom: Popover — atomic.popover@0.1.0. Contract: ./overlay-contracts.ts (POPOVER_CONTRACT).
 * Non-modal: no focus trap, no scroll lock, no inert. Escape and outside press close it (top layer only) and return
 * focus to the trigger when focus was inside. Tab past its edges closes it and continues in document order from the
 * trigger, as if the panel were rendered right after it.
 *
 * The trigger is any focusable element (a native <button> or the atomic Button). The atom wraps it in a
 * `display: contents` span that owns the click, and clones it only to add ARIA (aria-haspopup, aria-expanded,
 * aria-controls) and data-state — the trigger's own handlers are never replaced.
 */
import { cloneElement, isValidElement, useId, useMemo, useRef, type KeyboardEvent, type ReactElement, type ReactNode, type RefObject } from 'react'
import { getTabbables, nextTabbableAfter, useAnchoredPosition, useFocusScope, useLayer, type Placement } from '../behavior/overlay'
import { useControllableState } from '../platform/react/controllable'
import { useExperience } from '../platform/react/experience'
import '../styles/recipes/overlay.css'
import { ScopedPortal, useScopeSnapshot } from './dialog'

export type PopoverChangeReason = 'trigger' | 'escape' | 'outside' | 'tab-out'

export interface PopoverProps {
  /** A single focusable element; receives aria-haspopup / aria-expanded / aria-controls. */
  trigger: ReactElement
  children: ReactNode
  /** Visible heading; becomes the accessible name (aria-labelledby). */
  title?: ReactNode
  /** Accessible name when there is no title. */
  'aria-label'?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: { reason: PopoverChangeReason }) => void
  /** Logical placement; flips and shifts to stay in the viewport. Default 'block-end-start'. */
  placement?: Placement
  /** Gap to the trigger in px. Default 8. */
  offset?: number
}

/** The first element inside a `display: contents` wrapper: the real trigger, used as the anchor and focus target. */
function useFirstChildRef(wrapper: RefObject<HTMLElement | null>): RefObject<HTMLElement | null> {
  return useMemo(() => ({ get current() { return (wrapper.current?.firstElementChild as HTMLElement | null) ?? null } }) as RefObject<HTMLElement | null>, [wrapper])
}

export function Popover({ trigger, children, title, 'aria-label': ariaLabel, open: openProp, defaultOpen = false, onOpenChange, placement = 'block-end-start', offset = 8 }: PopoverProps) {
  const [open, setOpen] = useControllableState<boolean, { reason: PopoverChangeReason }>(openProp, defaultOpen, onOpenChange)
  const wrapper = useRef<HTMLSpanElement>(null)
  const triggerRef = useFirstChildRef(wrapper)
  const snapshot = useScopeSnapshot(wrapper, open)
  const panelId = `${useId().replace(/:/g, '')}-popover`

  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, { 'aria-haspopup': 'dialog', 'aria-expanded': open, 'aria-controls': open ? panelId : undefined, 'data-state': open ? 'open' : 'closed' })
    : trigger

  return (
    <>
      <span
        data-hz-anchor="popover"
        data-slot="trigger"
        ref={wrapper}
        onClick={(event) => {
          const el = triggerRef.current
          if (el && el.contains(event.target as Node)) setOpen(!open, { reason: 'trigger' })
        }}
      >
        {triggerElement}
      </span>
      {open && snapshot ? (
        <ScopedPortal snapshot={snapshot}>
          <PopoverPanel id={panelId} title={title} ariaLabel={ariaLabel} placement={placement} offset={offset} wrapper={wrapper} triggerRef={triggerRef} close={(reason) => setOpen(false, { reason })}>
            {children}
          </PopoverPanel>
        </ScopedPortal>
      ) : null}
    </>
  )
}

interface PanelProps {
  id: string
  title?: ReactNode
  ariaLabel?: string
  placement: Placement
  offset: number
  wrapper: RefObject<HTMLElement | null>
  triggerRef: RefObject<HTMLElement | null>
  close: (reason: PopoverChangeReason) => void
  children: ReactNode
}

function PopoverPanel({ id, title, ariaLabel, placement, offset, wrapper, triggerRef, close, children }: PanelProps) {
  const { direction } = useExperience()
  const panel = useRef<HTMLDivElement>(null)
  const titleId = `${id}-title`
  const { position } = useAnchoredPosition(triggerRef, panel, { placement, dir: direction, offset })

  useFocusScope(panel, true, { contain: false, returnFocus: () => triggerRef.current })
  useLayer(true, {
    element: () => panel.current,
    ignore: () => [wrapper.current],
    onEscape: () => close('escape'),
    onOutsidePress: () => close('outside'),
  })

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || event.defaultPrevented || !panel.current) return
    const items = getTabbables(panel.current)
    const active = document.activeElement
    const first = items[0]
    const last = items[items.length - 1]
    const trigger = triggerRef.current
    if (event.shiftKey && (!first || active === first || active === panel.current)) {
      event.preventDefault()
      close('tab-out')
      trigger?.focus()
    } else if (!event.shiftKey && (!last || active === last)) {
      event.preventDefault()
      close('tab-out')
      const next = trigger ? nextTabbableAfter(trigger, [panel.current.closest('[data-hz-portal]')]) : null
      ;(next ?? trigger)?.focus()
    }
  }

  return (
    <div
      ref={panel}
      id={id}
      data-hz="popover"
      data-state="open"
      data-placement={position?.placement ?? placement}
      data-positioned={position ? '' : undefined}
      role="dialog"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : ariaLabel}
      tabIndex={-1}
      style={position ? { left: position.x, top: position.y } : undefined}
      onKeyDown={onKeyDown}
    >
      {title ? (
        <h2 data-slot="title" id={titleId}>
          {title}
        </h2>
      ) : null}
      <div data-slot="body">{children}</div>
    </div>
  )
}
