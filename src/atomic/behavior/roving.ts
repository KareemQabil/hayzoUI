/**
 * F2 behavior primitive: roving focus for a group of items (tabs, toolbars, segmented choices).
 * No colors, sizes or class names — only which item gets focus.
 *
 * Contract
 *   - One tab stop: the group is entered once with Tab; arrows move focus among its items.
 *   - Orientation: 'horizontal' uses ArrowLeft/ArrowRight, 'vertical' uses ArrowUp/ArrowDown; the other axis is ignored.
 *   - Direction-aware: in RTL the next item is on the left, so ArrowLeft = next, ArrowRight = previous.
 *   - Home / End go to the first / last enabled item.
 *   - Disabled items (native `disabled` or aria-disabled="true") are skipped.
 *   - Wrap (default on): moving past the last enabled item returns to the first, and vice versa.
 *
 * The key → move mapping is the pure `rovingMove`, kept separate so it can be swapped for the shared core
 * keyboard module (`listKeyAction(e, { orientation, dir })`) without touching the DOM part.
 */
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

export type RovingOrientation = 'horizontal' | 'vertical'
export type RovingDirection = 'ltr' | 'rtl'
export type RovingMove = 'next' | 'prev' | 'first' | 'last'

export interface RovingKeyOptions {
  orientation: RovingOrientation
  dir: RovingDirection
}

/** Pure: the move a key asks for in a group with this orientation and direction, or null when the key is not ours. */
export function rovingMove(key: string, { orientation, dir }: RovingKeyOptions): RovingMove | null {
  if (key === 'Home') return 'first'
  if (key === 'End') return 'last'
  if (orientation === 'vertical') {
    if (key === 'ArrowDown') return 'next'
    if (key === 'ArrowUp') return 'prev'
    return null
  }
  if (key === 'ArrowRight') return dir === 'rtl' ? 'prev' : 'next'
  if (key === 'ArrowLeft') return dir === 'rtl' ? 'next' : 'prev'
  return null
}

/**
 * Pure: the index a move lands on, skipping disabled items. `current` may be -1 (nothing focused yet).
 * Returns -1 when no item is enabled; returns `current` when the move cannot go further without wrapping.
 */
export function rovingTargetIndex(disabled: readonly boolean[], current: number, move: RovingMove, wrap = true): number {
  const n = disabled.length
  const enabled = (i: number) => i >= 0 && i < n && !disabled[i]
  if (move === 'first' || move === 'last') {
    const order = [...Array(n).keys()]
    if (move === 'last') order.reverse()
    return order.find(enabled) ?? -1
  }
  const step = move === 'next' ? 1 : -1
  for (let k = 1; k <= n; k++) {
    let i = current + step * k
    if (wrap) i = ((i % n) + n) % n
    else if (i < 0 || i >= n) break
    if (enabled(i)) return i
  }
  return enabled(current) ? current : rovingTargetIndex(disabled, current, move === 'next' ? 'first' : 'last', wrap)
}

export interface RovingDomOptions extends RovingKeyOptions {
  /** CSS selector for the items, relative to the group container. */
  itemSelector: string
  wrap?: boolean
  /**
   * When true (default), the tab stop follows focus: the focused item gets tabindex=0 and the others -1.
   * Pass false when the owner renders tabIndex itself (e.g. tabs, whose tab stop is the selected tab).
   */
  manageTabIndex?: boolean
}

export function isItemDisabled(el: Element): boolean {
  return el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
}

/**
 * DOM: handles one keydown on the group container. Moves focus and returns the newly focused item, or null when
 * the key is not a roving key (the event is then left untouched). Prevents the default (page scroll) when it acts.
 */
export function rovingKeyDown(
  event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent,
  container: HTMLElement,
  { itemSelector, orientation, dir, wrap = true, manageTabIndex = true }: RovingDomOptions,
): HTMLElement | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null
  const move = rovingMove(event.key, { orientation, dir })
  if (!move) return null
  const items = [...container.querySelectorAll<HTMLElement>(itemSelector)]
  if (items.length === 0) return null
  const origin = (event.target as Element | null)?.closest?.(itemSelector) ?? document.activeElement
  const current = items.findIndex((item) => item === origin)
  const index = rovingTargetIndex(items.map(isItemDisabled), current, move, wrap)
  const target = items[index]
  if (!target) return null
  event.preventDefault()
  if (manageTabIndex) for (const item of items) item.tabIndex = item === target ? 0 : -1
  target.focus()
  return target
}
