import type { Filter, TableState } from './types'

export const DEFAULT_TABLE_STATE: TableState = Object.freeze({
  sort: Object.freeze([]),
  filters: Object.freeze([]),
  page: null,
  groupBy: Object.freeze([]),
  expanded: new Set<string>(),
  columnOrder: Object.freeze([]),
  columnWidths: Object.freeze({}),
  hidden: new Set<string>(),
})

const plain = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(v => typeof v === 'string')
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (plain(value)) return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]))
  return value
}

/** Stable JSON schema v1 for saved table views (including Set fields). */
export function serializeTableState(s: TableState): string {
  return JSON.stringify(canonical({
    version: 1,
    sort: s.sort,
    filters: s.filters,
    page: s.page,
    groupBy: s.groupBy,
    expanded: [...s.expanded].sort(),
    columnOrder: s.columnOrder,
    columnWidths: s.columnWidths,
    hidden: [...s.hidden].sort(),
  }))
}

function validFilter(filter: unknown): filter is Filter {
  if (!plain(filter) || typeof filter.type !== 'string') return false
  switch (fil¶»§q«^