/**
 * F2 behavior primitive: the overlay layer stack. Module-level and framework-agnostic, with a small React hook.
 *
 * Contract
 *   - Every open overlay (popover, tooltip, dialog, drawer) is a layer, stacked in opening order.
 *   - Escape dismisses only the TOP layer, and only when no descendant already handled it (defaultPrevented).
 *     The top layer always consumes Escape, even when it is not dismissible: Escape never falls through.
 *   - Outside press (pointerdown outside the top layer's element and its `ignore` elements) dismisses only the
 *     top layer. A modal's backdrop is "outside" its panel, so backdrop press is the same rule.
 *   - Modal layers: body scroll is locked while ≥1 modal layer is open (a counter, so nested modals are safe); the
 *     exact previous inline styles are restored, and the scrollbar width is compensated with padding-inline-end.
 *     Everything outside the top modal (and the layers above it) is made `inert`, so assistive tech cannot leave.
 *   - `readExperienceScope` captures the nearest `[data-hz-experience]` scope (dir, lang, numerals, density, motion,
 *     CSS variables) so portaled content renders in the same experience as its render point.
 */
import { useEffect, useRef } from 'react'

export type DismissReason = 'escape' | 'outside'

export interface LayerOptions {
  /** The layer's own element (its panel). Presses inside it are never "outside". */
  element: () => Element | null
  /** Modal layers lock scroll and make the rest of the page inert. */
  modal?: boolean
  /** Transient layers (tooltips) take Escape when on top, but an outside press dismisses them AND reaches the layer below. */
  transient?: boolean
  /** Extra elements that never count as outside (e.g. the trigger that toggles the layer). */
  ignore?: () => (Element | null | undefined)[]
  onEscape?: (event: KeyboardEvent) => void
  onOutsidePress?: (event: PointerEvent) => void
}

export interface LayerHandle {
  readonly id: number
  isTop(): boolean
  update(options: Partial<LayerOptions>): void
  remove(): void
}

interface Layer {
  id: number
  options: LayerOptions
}

const layers: Layer[] = []
let nextId = 1
let listening = false

export function layerCount(): number {
  return layers.length
}

function topLayer(): Layer | undefined {
  return layers[layers.length - 1]
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  const layer = topLayer()
  if (!layer) return
  event.preventDefault()
  event.stopPropagation()
  layer.options.onEscape?.(event)
}

function onPointerDown(event: PointerEvent) {
  const target = event.target as Node | null
  if (!target || !target.isConnected) return
  // Transient layers (tooltips) never absorb an outside press: they are dismissed and the press goes on down to the
  // first non-transient layer, which applies the top-layer rule.
  for (const layer of [...layers].reverse()) {
    const inside = [layer.options.element(), ...(layer.options.ignore?.() ?? [])].some((el) => el && el.contains(target))
    if (inside) return
    layer.options.onOutsidePress?.(event)
    if (!layer.options.transient) return
  }
}

function syncListeners() {
  const need = layers.length > 0
  if (need === listening) return
  listening = need
  if (need) {
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown, true)
  } else {
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('pointerdown', onPointerDown, true)
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Scroll lock (counter)
// ---------------------------------------------------------------------------------------------------------------

let lockCount = 0
let saved: { overflow: [string, string]; padding: [string, string] } | null = null

export function scrollLockCount(): number {
  return lockCount
}

/** Locks body scroll; returns an idempotent unlock. Nested locks are counted; the last unlock restores exactly. */
export function lockScroll(): () => void {
  const body = document.body
  if (lockCount === 0) {
    const s = body.style
    saved = {
      overflow: [s.getPropertyValue('overflow'), s.getPropertyPriority('overflow')],
      padding: [s.getPropertyValue('padding-inline-end'), s.getPropertyPriority('padding-inline-end')],
    }
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    if (scrollbar > 0) {
      const current = parseFloat(getComputedStyle(body).paddingInlineEnd) || 0
      s.setProperty('padding-inline-end', `${current + scrollbar}px`, 'important')
    }
    s.setProperty('overflow', 'hidden', 'important')
  }
  lockCount++
  let done = false
  return () => {
    if (done) return
    done = true
    lockCount--
    if (lockCount === 0 && saved) {
      const s = body.style
      for (const [prop, [value, priority]] of [['overflow', saved.overflow], ['padding-inline-end', saved.padding]] as const) {
        if (value) s.setProperty(prop, value, priority)
        else s.removeProperty(prop)
      }
      saved = null
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Inert outside the top modal
// ---------------------------------------------------------------------------------------------------------------

const inerted = new Set<Element>()

function bodyChildOf(el: Element | null): Element | null {
  let node: Element | null = el
  while (node && node.parentElement && node.parentElement !== document.body) node = node.parentElement
  return node && node.parentElement === document.body ? node : null
}

function syncInert() {
  let modalIndex = -1
  for (let i = layers.length - 1; i >= 0; i--) if (layers[i]!.options.modal) { modalIndex = i; break }
  const keep = new Set<Element>()
  if (modalIndex >= 0) for (const layer of layers.slice(modalIndex)) {
    const root = bodyChildOf(layer.options.element())
    if (root) keep.add(root)
  }
  const want = new Set<Element>()
  if (modalIndex >= 0 && keep.size > 0) {
    for (const child of Array.from(document.body.children)) {
      if (keep.has(child) || child.tagName === 'SCRIPT') continue
      if (!inerted.has(child) && child.hasAttribute('inert')) continue // someone else's inert: leave it alone
      want.add(child)
    }
  }
  for (const el of inerted) if (!want.has(el)) { el.removeAttribute('inert'); inerted.delete(el) }
  for (const el of want) if (!inerted.has(el)) { el.setAttribute('inert', ''); inerted.add(el) }
}

// ---------------------------------------------------------------------------------------------------------------

const unlocks = new Map<number, () => void>()

export function pushLayer(options: LayerOptions): LayerHandle {
  const layer: Layer = { id: nextId++, options }
  layers.push(layer)
  syncListeners()
  if (options.modal) unlocks.set(layer.id, lockScroll())
  syncInert()
  return {
    id: layer.id,
    isTop: () => topLayer() === layer,
    update(next) {
      layer.options = { ...layer.options, ...next }
    },
    remove() {
      const index = layers.indexOf(layer)
      if (index < 0) return
      layers.splice(index, 1)
      unlocks.get(layer.id)?.()
      unlocks.delete(layer.id)
      syncInert()
      syncListeners()
    },
  }
}

/**
 * React adapter. The layer is pushed while `active`; callbacks are always the latest ones.
 * Declare AFTER `useFocusScope` in the same component (see focus-scope.ts).
 */
export function useLayer(active: boolean, options: LayerOptions): void {
  const latest = useRef(options)
  latest.current = options
  const modal = !!options.modal
  const transient = !!options.transient
  useEffect(() => {
    if (!active) return
    const handle = pushLayer({
      modal,
      transient,
      element: () => latest.current.element(),
      ignore: () => latest.current.ignore?.() ?? [],
      onEscape: (e) => latest.current.onEscape?.(e),
      onOutsidePress: (e) => latest.current.onOutsidePress?.(e),
    })
    return () => handle.remove()
  }, [active, modal, transient])
}

// ---------------------------------------------------------------------------------------------------------------
// Experience scope capture (for portals)
// ---------------------------------------------------------------------------------------------------------------

export interface ExperienceScopeSnapshot {
  attributes: Record<string, string>
  variables: Record<string, string>
}

const SCOPE_ATTRIBUTES = ['dir', 'lang', 'data-numerals', 'data-density', 'data-motion', 'data-hz-experience'] as const

/** Reads the nearest `[data-hz-experience]` ancestor of `from` (inclusive): its scope attributes and CSS variables. */
export function readExperienceScope(from: Element | null): ExperienceScopeSnapshot | null {
  const scope = from?.closest<HTMLElement>('[data-hz-experience]')
  if (!scope) return null
  const attributes: Record<string, string> = {}
  for (const name of SCOPE_ATTRIBUTES) {
    const value = scope.getAttribute(name)
    if (value !== null) attributes[name] = value
  }
  const variables: Record<string, string> = {}
  for (let i = 0; i < scope.style.length; i++) {
    const name = scope.style.item(i)
    if (name.startsWith('--')) variables[name] = scope.style.getPropertyValue(name).trim()
  }
  return { attributes, variables }
}
