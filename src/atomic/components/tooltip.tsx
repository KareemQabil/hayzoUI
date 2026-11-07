/**
 * F3 atom: Tooltip — atomic.tooltip@0.1.0. Contract: ./overlay-contracts.ts (TOOLTIP_CONTRACT).
 *
 *   - Shows after `delay` on mouse/pen hover, immediately on keyboard focus; never on touch hover (touch users get it
 *     only by focusing, so its content must never be essential).
 *   - Hides on pointer leave (after `closeDelay`, so the pointer can move onto the tooltip — WCAG 1.4.13), on blur,
 *     on press of the trigger, and on Escape (it is the top layer while shown; a second Escape reaches the layer below).
 *   - role="tooltip"; the trigger gets aria-describedby only while it is shown. Never focusable and never interactive
 *     (warned in development when it contains a tabbable element).
 *   - Warm-up: right after one tooltip hides, the next one shows without delay.
 */
import { cloneElement, isValidElement, useEffect, useId, useMemo, useRef, type ReactElement, type ReactNode, type RefObject } from 'react'
import { getTabbables, useAnchoredPosition, useLayer, type Placement } from '../behavior/overlay'
import { useControllableState } from '../platform/react/controllable'
import { useExperience } from '../platform/react/experience'
import '../styles/recipes/overlay.css'
import { ScopedPortal, useScopeSnapshot } from './dialog'

export interface TooltipProps {
  /** Short, non-interactive text. */
  content: ReactNode
  /** A single focusable element. */
  children: ReactElement
  placement?: Placement
  /** Hover delay in ms. Default 500. */
  delay?: number
  /** Hide delay after pointer leave in ms. Default 100. */
  closeDelay?: number
  isDisabled?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const WARM_MS = 300
let lastHiddenAt = -Infinity

export function Tooltip({ content, children, placement = 'block-start', delay = 500, closeDelay = 100, isDisabled = false, open: openProp, defaultOpen = false, onOpenChange }: TooltipProps) {
  const [open, setOpenState] = useControllableState<boolean, undefined>(openProp, defaultOpen, onOpenChange ? (next) => onOpenChange(next) : undefined)
  const wrapper = useRef<HTMLSpanElement>(null)
  const triggerRef = useMemo(() => ({ get current() { return (wrapper.current?.firstElementChild as HTMLElement | null) ?? null } }) as RefObject<HTMLElement | null>, [])
  const snapshot = useScopeSnapshot(wrapper, open && !isDisabled)
  const tipId = `${useId().replace(/:/g, '')}-tooltip`
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pointerFocus = useRef(false)
  const openRef = useRef(open)
  openRef.current = open

  const clear = () => {
    if (timer.current !== undefined) clearTimeout(timer.current)
    timer.current = undefined
  }
  const setOpen = (next: boolean) => {
    clear()
    if (next === openRef.current) return
    if (!next) lastHiddenAt = Date.now()
    setOpenState(next, undefined)
  }
  const later = (next: boolean, ms: number) => {
    clear()
    if (ms <= 0) return setOpen(next)
    timer.current = setTimeout(() => setOpen(next), ms)
  }
  useEffect(() => clear, [])

  const shown = open && !isDisabled
  const child = isValidElement(children) ? (children as ReactElement<Record<string, unknown>>) : null
  const describedBy = [child?.props['aria-describedby'] as string | undefined, shown ? tipId : undefined].filter(Boolean).join(' ') || undefined
  const triggerElement = child ? cloneElement(child, { 'aria-describedby': describedBy }) : children

  return (
    <>
      <span
        data-hz-anchor="tooltip"
        data-slot="trigger"
        ref={wrapper}
        onPointerEnter={(e) => {
          if (e.pointerType === 'touch' || isDisabled) return
          later(true, Date.now() - lastHiddenAt < WARM_MS ? 0 : delay)
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'touch') return
          later(false, closeDelay)
        }}
        onPointerDown={() => {
          pointerFocus.current = true
          setOpen(false)
        }}
        onFocus={(e) => {
          if (isDisabled || e.target !== triggerRef.current) return
          if (pointerFocus.current) return void (pointerFocus.current = false)
          setOpen(true)
        }}
        onBlur={() => {
          pointerFocus.current = false
          setOpen(false)
        }}
      >
        {triggerElement}
      </span>
      {shown && snapshot ? (
        <ScopedPortal snapshot={snapshot}>
          <TooltipPanel id={tipId} placement={placement} triggerRef={triggerRef} wrapper={wrapper} onHide={() => setOpen(false)} onEnter={clear} onLeave={() => later(false, closeDelay)}>
            {content}
          </TooltipPanel>
        </ScopedPortal>
      ) : null}
    </>
  )
}

interface PanelProps {
  id: string
  placement: Placement
  triggerRef: RefObject<HTMLElement | null>
  wrapper: RefObject<HTMLElement | null>
  onHide: () => void
  onEnter: () => void
  onLeave: () => void
  children: ReactNode
}

function TooltipPanel({ id, placement, triggerRef, wrapper, onHide, onEnter, onLeave, children }: PanelProps) {
  const { direction } = useExperience()
  const tip = useRef<HTMLDivElement>(null)
  const { position } = useAnchoredPosition(triggerRef, tip, { placement, dir: direction, offset: 6 })
  useLayer(true, { transient: true, element: () => tip.current, ignore: () => [wrapper.current], onEscape: onHide, onOutsidePress: onHide })
  useEffect(() => {
    if (tip.current && getTabbables(tip.current).length > 0) console.warn('[hz] Tooltip content must not be interactive; use a Popover for focusable content.')
  }, [])
  return (
    <div
      ref={tip}
      id={id}
      role="tooltip"
      data-hz="tooltip"
      data-state="open"
      data-placement={position?.placement ?? placement}
      data-positioned={position ? '' : undefined}
      style={position ? { left: position.x, top: position.y } : undefined}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      {children}
    </div>
  )
}
