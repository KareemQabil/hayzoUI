/**
 * F2 behavior primitive: focus scope. Framework-agnostic core (`activateFocusScope`) plus a React hook.
 *
 * Contract
 *   - Initial focus: the given element → `[data-autofocus]` → the first tabbable → the container itself
 *     (the container gets tabindex=-1 if it has none).
 *   - Containment (`contain: true`): Tab / Shift+Tab wrap inside the container, and focus that escapes it
 *     (programmatic or by pointer) is brought back. Only the TOP scope of the stack contains, so nested scopes
 *     (a dialog over a dialog, a popover over a dialog) never fight; a lower scope resumes when the upper one leaves.
 *   - Restore: on release, focus returns to the element that was focused at activation (or `returnFocus` when that
 *     element is gone) — but only when focus is still inside the scope or nowhere (body), so it never steals focus
 *     from an element the user just moved to.
 */
import { useEffect, useRef, type RefObject } from 'react'

const TABBABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  'summary',
  '[tabindex]',
].join(',')

function isHidden(el: HTMLElement): boolean {
  if (el.closest('[hidden],[inert]')) return true
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (node.style.display === 'none' || node.style.visibility === 'hidden') return true
  }
  return false
}

/** Tabbable descendants in DOM order (tabindex ≥ 0, enabled, not hidden or inert). Positive tabindex is not reordered. */
export function getTabbables(container: ParentNode): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => el.tabIndex >= 0 && !isHidden(el))
}

/** The next tabbable element after `el` in the document, skipping anything inside `exclude`. */
export function nextTabbableAfter(el: Element, exclude: (Element | null)[] = []): HTMLElement | null {
  const all = getTabbables(el.ownerDocument.body).filter((t) => !exclude.some((x) => x?.contains(t)))
  for (const t of all) if (el.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING && !el.contains(t)) return t
  return null
}

export interface FocusScopeOptions {
  /** Trap Tab and keep focus inside while this is the top scope. */
  contain?: boolean
  /** Element (or getter) to focus on activation. */
  initialFocus?: HTMLElement | null | (() => HTMLElement | null)
  /** Move focus into the scope on activation. Default true. */
  autoFocus?: boolean
  /** Restore focus on release. Default true. */
  restoreFocus?: boolean
  /** Fallback restore target when the previously focused element no longer exists. */
  returnFocus?: HTMLElement | null | (() => HTMLElement | null)
}

export interface FocusScopeHandle {
  readonly container: HTMLElement
  isTop(): boolean
  /** Remove the scope; restores focus per the contract unless `restore` is false. */
  release(restore?: boolean): void
}

interface Scope {
  container: HTMLElement
  options: FocusScopeOptions
  previous: HTMLElement | null
  lastInside: HTMLElement | null
}

const stack: Scope[] = []
let listening = false

function top(): Scope | undefined {
  return stack[stack.length - 1]
}

const resolve = (v: HTMLElement | null | undefined | (() => HTMLElement | null)) => (typeof v === 'function' ? v() : v ?? null)

function focusFirst(scope: Scope) {
  const { container, options } = scope
  const target = resolve(options.initialFocus) ?? container.querySelector<HTMLElement>('[data-autofocus]') ?? getTabbables(container)[0] ?? null
  if (target) target.focus()
  else {
    if (!container.hasAttribute('tabindex')) container.tabIndex = -1
    container.focus()
  }
}

function onKeyDown(event: KeyboardEvent) {
  const scope = top()
  if (!scope?.options.contain || event.key !== 'Tab' || event.defaultPrevented) return
  const { container } = scope
  const items = getTabbables(container)
  const active = document.activeElement as HTMLElement | null
  if (items.length === 0) {
    event.preventDefault()
    container.focus()
    return
  }
  const first = items[0]!
  const last = items[items.length - 1]!
  const outside = !active || !container.contains(active)
  if (event.shiftKey && (outside || active === first || active === container)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (outside || active === last)) {
    event.preventDefault()
    first.focus()
  }
}

function onFocusIn(event: FocusEvent) {
  const scope = top()
  const target = event.target as HTMLElement | null
  if (!scope || !target || target === document.body) return
  if (scope.container.contains(target)) {
    scope.lastInside = target
    return
  }
  if (!scope.options.contain) return
  const back = scope.lastInside?.isConnected && scope.container.contains(scope.lastInside) ? scope.lastInside : null
  if (back) back.focus()
  else focusFirst(scope)
}

function sync() {
  const need = stack.length > 0
  if (need === listening) return
  listening = need
  if (need) {
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
  } else {
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('focusin', onFocusIn)
  }
}

export function activateFocusScope(container: HTMLElement, options: FocusScopeOptions = {}): FocusScopeHandle {
  const scope: Scope = { container, options, previous: document.activeElement instanceof HTMLElement ? document.activeElement : null, lastInside: null }
  stack.push(scope)
  sync()
  if (options.autoFocus !== false && !container.contains(document.activeElement)) focusFirst(scope)
  let released = false
  return {
    container,
    isTop: () => top() === scope,
    release(restore = true) {
      if (released) return
      released = true
      const index = stack.indexOf(scope)
      if (index >= 0) stack.splice(index, 1)
      sync()
      if (!restore || options.restoreFocus === false) return
      const active = document.activeElement
      const focusIsOurs = !active || active === document.body || container.contains(active) || !active.isConnected
      if (!focusIsOurs) return
      const target = scope.previous?.isConnected && scope.previous !== document.body ? scope.previous : resolve(options.returnFocus)
      if (!target) return
      // A modal layer may still be removing `inert` from the target's tree in this same commit: retry once.
      if (target.closest('[inert]')) queueMicrotask(() => target.focus())
      else target.focus()
    },
  }
}

/** Number of active scopes (for tests and diagnostics). */
export function focusScopeDepth(): number {
  return stack.length
}

/**
 * React adapter. Activates while `active` and the container is mounted; options are read at activation time.
 * Declare it BEFORE a modal `useLayer` in the same component: the scope then captures the opener and moves focus in
 * before the page becomes inert; on release, a restore target that is still inert is retried once in a microtask.
 */
export function useFocusScope(ref: RefObject<HTMLElement | null>, active: boolean, options: FocusScopeOptions = {}): void {
  const opts = useRef(options)
  opts.current = options
  useEffect(() => {
    if (!active || !ref.current) return
    const handle = activateFocusScope(ref.current, opts.current)
    return () => handle.release()
  }, [active, ref])
}
