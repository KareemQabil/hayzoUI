/**
 * F2 behavior primitive: anchored placement. The core (`computePosition`) is pure math — no DOM reads — so it is
 * property-tested; `useAnchoredPosition` is the thin DOM adapter that measures and re-runs it.
 *
 * Contract
 *   - Placements are logical (horizontal-tb writing mode): block-start = above, block-end = below,
 *     inline-start = the reading start (left in LTR, RIGHT in RTL), inline-end = the reading end.
 *   - Alignment suffix: '-start' / '-end' align the floating edge with the same logical edge of the anchor;
 *     no suffix centers it. On block sides alignment follows direction; on inline sides it is block-axis.
 *   - Flip: only when the preferred side does not fit and the opposite side has more room. Never otherwise.
 *   - Shift: along the cross axis, the result is clamped inside the viewport padding. When the floating element is
 *     larger than the available cross space it is pinned to the reading-start edge (mirror-symmetric in RTL).
 *   - Output is physical (x, y from the viewport's top-left) because it is applied as `left/top` of a fixed element;
 *     RTL results are the exact mirror image of LTR ones for mirrored inputs.
 */
import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}
export interface Size {
  width: number
  height: number
}
export type Side = 'block-start' | 'block-end' | 'inline-start' | 'inline-end'
export type Alignment = 'start' | 'end'
export type Placement = Side | `${Side}-${Alignment}`
export type Direction = 'ltr' | 'rtl'

export interface PositionInput {
  anchor: Rect
  floating: Size
  viewport: Rect
  placement: Placement
  dir: Direction
  /** Gap between anchor and floating element on the main axis. */
  offset?: number
  /** Minimum distance kept from the viewport edges. */
  padding?: number
  /** Minimum distance between an arrow center and the floating element's corners. */
  arrowPadding?: number
}

export interface PositionResult {
  x: number
  y: number
  /** Final placement, after any flip (alignment preserved). */
  placement: Placement
  /** Arrow center relative to the floating element: `x` for block sides, `y` for inline sides. */
  arrow?: { x?: number; y?: number }
}

type Physical = 'top' | 'bottom' | 'left' | 'right'

const OPPOSITE: Record<Side, Side> = { 'block-start': 'block-end', 'block-end': 'block-start', 'inline-start': 'inline-end', 'inline-end': 'inline-start' }

export function parsePlacement(placement: Placement): { side: Side; align: Alignment | null } {
  const match = /^(block-start|block-end|inline-start|inline-end)(?:-(start|end))?$/.exec(placement)
  if (!match) throw new Error(`Unknown placement "${placement}"`)
  return { side: match[1] as Side, align: (match[2] as Alignment | undefined) ?? null }
}

export function physicalSide(side: Side, dir: Direction): Physical {
  switch (side) {
    case 'block-start':
      return 'top'
    case 'block-end':
      return 'bottom'
    case 'inline-start':
      return dir === 'rtl' ? 'right' : 'left'
    case 'inline-end':
      return dir === 'rtl' ? 'left' : 'right'
  }
}

/** Room on a physical side of the anchor, inside the viewport padding and after the offset. */
function room(p: Physical, anchor: Rect, viewport: Rect, offset: number, padding: number): number {
  switch (p) {
    case 'top':
      return anchor.y - viewport.y - padding - offset
    case 'bottom':
      return viewport.y + viewport.height - padding - (anchor.y + anchor.height) - offset
    case 'left':
      return anchor.x - viewport.x - padding - offset
    case 'right':
      return viewport.x + viewport.width - padding - (anchor.x + anchor.width) - offset
  }
}

function needed(p: Physical, floating: Size): number {
  return p === 'top' || p === 'bottom' ? floating.height : floating.width
}

/** Whether the floating element fits on the main axis of a logical side. Exported for tests and callers. */
export function fitsOnSide(input: PositionInput, side: Side): boolean {
  const p = physicalSide(side, input.dir)
  return room(p, input.anchor, input.viewport, input.offset ?? 0, input.padding ?? 0) >= needed(p, input.floating)
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function computePosition(input: PositionInput): PositionResult {
  const { anchor, floating, viewport, dir } = input
  const offset = input.offset ?? 0
  const padding = input.padding ?? 0
  const { side: preferred, align } = parsePlacement(input.placement)

  let side = preferred
  if (!fitsOnSide(input, preferred)) {
    const opposite = OPPOSITE[preferred]
    const pOpp = physicalSide(opposite, dir)
    const pPref = physicalSide(preferred, dir)
    const fitsOpposite = fitsOnSide(input, opposite)
    if (fitsOpposite || room(pOpp, anchor, viewport, offset, padding) > room(pPref, anchor, viewport, offset, padding)) side = opposite
  }

  const p = physicalSide(side, dir)
  let x: number
  let y: number

  // Main axis.
  if (p === 'top') y = anchor.y - offset - floating.height
  else if (p === 'bottom') y = anchor.y + anchor.height + offset
  else if (p === 'left') x = anchor.x - offset - floating.width
  else x = anchor.x + anchor.width + offset

  const vertical = p === 'top' || p === 'bottom'
  if (vertical) {
    // Cross axis is inline (physical x): alignment follows direction.
    const startEdgeLeft = dir === 'ltr'
    if (align === null) x = anchor.x + anchor.width / 2 - floating.width / 2
    else if ((align === 'start') === startEdgeLeft) x = anchor.x
    else x = anchor.x + anchor.width - floating.width
    const min = viewport.x + padding
    const max = viewport.x + viewport.width - padding - floating.width
    x = max < min ? (dir === 'rtl' ? max : min) : clamp(x!, min, max)
  } else {
    // Cross axis is block (physical y): start = top in horizontal-tb, independent of direction.
    if (align === null) y = anchor.y + anchor.height / 2 - floating.height / 2
    else if (align === 'start') y = anchor.y
    else y = anchor.y + anchor.height - floating.height
    const min = viewport.y + padding
    const max = viewport.y + viewport.height - padding - floating.height
    y = max < min ? min : clamp(y!, min, max)
  }

  const arrowPadding = input.arrowPadding ?? 0
  const arrow = vertical
    ? { x: clamp(anchor.x + anchor.width / 2 - x!, Math.min(arrowPadding, floating.width / 2), Math.max(floating.width - arrowPadding, floating.width / 2)) }
    : { y: clamp(anchor.y + anchor.height / 2 - y!, Math.min(arrowPadding, floating.height / 2), Math.max(floating.height - arrowPadding, floating.height / 2)) }

  return { x: x!, y: y!, placement: (align ? `${side}-${align}` : side) as Placement, arrow }
}

// ---------------------------------------------------------------------------------------------------------------
// DOM adapter
// ---------------------------------------------------------------------------------------------------------------

export interface AnchoredPositionOptions {
  placement: Placement
  dir: Direction
  offset?: number
  padding?: number
  arrowPadding?: number
  /** Measure only while enabled (e.g. while the overlay is open). Default true. */
  enabled?: boolean
}

export interface AnchoredPosition {
  /** null until the first measurement. */
  position: PositionResult | null
  /** Re-measure now (e.g. after content changes). */
  update: () => void
}

function toRect(r: DOMRect): Rect {
  return { x: r.left, y: r.top, width: r.width, height: r.height }
}

/** The layout viewport, excluding scrollbars. */
export function measureViewport(): Rect {
  const el = document.documentElement
  return { x: 0, y: 0, width: el.clientWidth || window.innerWidth, height: el.clientHeight || window.innerHeight }
}

/**
 * Measures with getBoundingClientRect and re-runs computePosition on scroll (any scroller, capture) and resize.
 * Listeners are passive and updates are rAF-throttled. Apply the result as `position: fixed; left: x; top: y`.
 */
export function useAnchoredPosition(anchorRef: RefObject<Element | null>, floatingRef: RefObject<HTMLElement | null>, options: AnchoredPositionOptions): AnchoredPosition {
  const { placement, dir, offset = 8, padding = 8, arrowPadding = 0, enabled = true } = options
  const [position, setPosition] = useState<PositionResult | null>(null)
  const frame = useRef(0)

  const measure = useCallback(() => {
    const anchor = anchorRef.current
    const floating = floatingRef.current
    if (!anchor || !floating) return
    const f = floating.getBoundingClientRect()
    const next = computePosition({ anchor: toRect(anchor.getBoundingClientRect()), floating: { width: f.width, height: f.height }, viewport: measureViewport(), placement, dir, offset, padding, arrowPadding })
    setPosition((prev) => (prev && prev.x === next.x && prev.y === next.y && prev.placement === next.placement && prev.arrow?.x === next.arrow?.x && prev.arrow?.y === next.arrow?.y ? prev : next))
  }, [anchorRef, floatingRef, placement, dir, offset, padding, arrowPadding])

  useLayoutEffect(() => {
    if (!enabled) {
      setPosition(null)
      return
    }
    measure()
    const schedule = () => {
      if (frame.current) return
      frame.current = requestAnimationFrame(() => {
        frame.current = 0
        measure()
      })
    }
    const listener = { passive: true, capture: true } as const
    window.addEventListener('scroll', schedule, listener)
    window.addEventListener('resize', schedule, { passive: true })
    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(schedule)
      if (anchorRef.current) observer.observe(anchorRef.current)
      if (floatingRef.current) observer.observe(floatingRef.current)
    }
    return () => {
      window.removeEventListener('scroll', schedule, listener)
      window.removeEventListener('resize', schedule)
      observer?.disconnect()
      if (frame.current) cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [enabled, measure, anchorRef, floatingRef])

  return { position, update: measure }
}
