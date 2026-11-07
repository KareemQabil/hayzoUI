import type { Collection } from '../collection'

export type SelectionMode = 'none' | 'single' | 'multiple'
export interface SelectionState { readonly selected: ReadonlySet<string> | 'all'; readonly anchor: string | null }
export type SelectionAction =
  | { type: 'toggle'; key: string }
  | { type: 'replace'; key: string }
  | { type: 'extendTo'; key: string }
  | { type: 'selectAll' }
  | { type: 'clear' }
  | { type: 'setMany'; keys: readonly string[] }

export function isSelected(state: SelectionState, key: string): boolean {
  return state.selected === 'all' || state.selected.has(key)
}

/** Resolve a lazy 'all' over the caller's ordered scope (e.g., filtered rows). */
export function selectedKeys(state: SelectionState, scope: readonly string[]): readonly string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const key of scope) {
    if (!seen.has(key) && isSelected(state, key)) {
      seen.add(key)
      result.push(key)
    }
  }
  return result
}

/**
 * A reducer never emits the context-free 'all' sentinel: an explicit set lets
 * downstream code distinguish disabled/unavailable keys. When receiving 'all',
 * it resolves the sentinel against the supplied collection before processing.
 */
export function selectionReducer(state: SelectionState, action: SelectionAction,
  ctx: { mode: SelectionMode; collection: Collection<unknown>; disabled?: ReadonlySet<string> }): SelectionState {
  const all = ctx.collection.keys()
  const known = new Set(¶»§q«^