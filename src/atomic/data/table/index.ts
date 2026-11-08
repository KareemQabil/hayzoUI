/**
 * Headless table engine (F0) — the data side of an Ant Design–class Table, DataGrid and ProTable.
 * Pure TypeScript: no React, no DOM, no timers. Equal inputs give equal outputs; inputs are never mutated.
 *
 * Pipeline: tree → filter → sort → group → aggregates → paginate, plus column layout (order, visibility,
 * sizing, logical pinning). Arabic-first: text filters are Arabic-tolerant (hamza, diacritics, tatweel, digits in
 * any numeral system) via src/arabic; text sorts with Intl.Collator(locale, { numeric: true }); numbers typed
 * with Arabic-Indic digits sort as numbers; money is integer minor units and never becomes a float.
 * Contract: docs/handoffs (headless brief §6). Public signatures are shared with the headless-engines branch.
 */
import { DEFAULT_SEARCH, matchDigits, normalizeDigits, normalizeForSearch } from '../../../arabic'

export interface ColumnDef<R> {
  key: string
  header: string
  accessor: (row: R) => unknown
  type?: 'text' | 'number' | 'money' | 'date' | 'boolean'
  sortable?: boolean
  filterable?: boolean
  pin?: 'start' | 'end'
  width?: number
  minWidth?: number
  maxWidth?: number
  flex?: number
  aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count'
  compare?: (a: unknown, b: unknown) => number
}

export type Filter =
  | { type: 'text'; column: string; query: string }
  | { type: 'in'; column: string; values: readonly unknown[] }
  | { type: 'range'; column: string; min?: number | string; max?: number | string }
  | { type: 'global'; query: string }

export interface TableState {
  sort: readonly { column: string; dir: 'asc' | 'desc' }[]
  filters: readonly Filter[]
  page: { index: number; size: number } | null
  groupBy: readonly string[]
  expanded: ReadonlySet<string>
  columnOrder: readonly string[]
  columnWidths: Readonly<Record<string, number>>
  hidden: ReadonlySet<string>
}

export interface TableRow<R> {
  key: string
  row: R
  depth: number
  group?: { column: string; value: unknown; count: number }
}

export interface TableColumn<R> {
  def: ColumnDef<R>
  width: number
  pin: 'start' | 'end' | null
  /** Distance from the pinned edge (inline-start or inline-end), in px. Logical — never left/right. 0 when unpinned. */
  offset: number
}

export interface TableModel<R> {
  rows: readonly TableRow<R>[]
  totalRows: number
  filteredRows: number
  pageCount: number
  columns: readonly TableColumn<R>[]
  aggregates: Readonly<Record<string, number | null>>
}

export const DEFAULT_TABLE_STATE: TableState = Object.freeze({
  sort: [],
  filters: [],
  page: null,
  groupBy: [],
  expanded: new Set<string>(),
  columnOrder: [],
  columnWidths: {},
  hidden: new Set<string>(),
})

const DEFAULT_COLUMN_WIDTH = 160
const DEFAULT_MIN_WIDTH = 48

// ───────────────────────── values ─────────────────────────

function isNil(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v)) || v === ''
}

/** A number from a number or a numeric string written with any digits («١٢٣٫٥» → 123.5). */
function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'bigint') return Number(v)
  if (typeof v === 'string') {
    const s = normalizeDigits(v).text.replace(/٫/g, '.').replace(/[٬,\s  ]/g, '')
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return null
    return Number(s)
  }
  return null
}

function toText(v: unknown): string {
  if (isNil(v)) return ''
  if (v instanceof Date) return v.toISOString()
  return String(v)
}

/** Dates compare as ISO-8601 strings (storage format), or Date objects. */
function toDateKey(v: unknown): string | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString()
  if (typeof v === 'string' && v !== '') return normalizeDigits(v).text
  if (typeof v === 'number' && Number.isFinite(v)) return new Date(v).toISOString()
  return null
}

function sortKey<R>(col: ColumnDef<R>, v: unknown): number | string | boolean | null {
  if (isNil(v)) return null
  switch (col.type) {
    case 'number':
    case 'money':
      return toNumber(v)
    case 'date':
      return toDateKey(v)
    case 'boolean':
      return typeof v === 'boolean' ? v : null
    default:
      return toText(v)
  }
}

// ───────────────────────── tree ─────────────────────────

interface Node<R> {
  key: string
  row: R
  depth: number
  children: Node<R>[]
}

function buildTree<R>(rows: readonly R[], rowKey: (r: R) => string, getChildren?: (r: R) => readonly R[] | undefined): { roots: Node<R>[]; count: number } {
  const seen = new Set<string>()
  let count = 0
  const make = (r: R, depth: number, path: Set<R>): Node<R> => {
    const key = rowKey(r)
    if (seen.has(key)) throw new TableError(`Duplicate row key "${key}".`, 'DUPLICATE_ROW_KEY')
    seen.add(key)
    count++
    const kids = getChildren?.(r) ?? []
    if (kids.length && path.has(r)) throw new TableError(`Cycle in tree data at row "${key}".`, 'TREE_CYCLE')
    const next = new Set(path).add(r)
    return { key, row: r, depth, children: kids.map((c) => make(c, depth + 1, next)) }
  }
  const roots = rows.map((r) => make(r, 0, new Set()))
  return { roots, count }
}

export class TableError extends Error {
  constructor(message: string, readonly code: 'DUPLICATE_ROW_KEY' | 'TREE_CYCLE') {
    super(message)
    this.name = 'TableError'
  }
}

// ───────────────────────── filter ─────────────────────────

type RowTest<R> = (row: R) => boolean

function compileFilters<R>(filters: readonly Filter[], columns: ReadonlyMap<string, ColumnDef<R>>): RowTest<R> | null {
  const tests: RowTest<R>[] = []
  for (const f of filters) {
    if (f.type === 'global') {
      const q = normalizeForSearch(f.query, DEFAULT_SEARCH).text.trim()
      if (!q) continue
      const textCols = [...columns.values()].filter((c) => c.filterable !== false && (c.type === undefined || c.type === 'text'))
      const digits = /\d/.test(normalizeDigits(f.query).text)
      tests.push((r) => textCols.some((c) => textMatches(q, f.query, c.accessor(r), digits)))
      continue
    }
    const col = columns.get(f.column)
    if (!col) continue // unknown column: ignored, never throws (saved views may outlive a column)
    if (f.type === 'text') {
      const q = normalizeForSearch(f.query, DEFAULT_SEARCH).text.trim()
      if (!q) continue
      const digits = /\d/.test(normalizeDigits(f.query).text)
      tests.push((r) => textMatches(q, f.query, col.accessor(r), digits))
    } else if (f.type === 'in') {
      if (!f.values.length) continue
      const wanted = new Set(f.values.map((v) => normalizeValue(col, v)))
      tests.push((r) => wanted.has(normalizeValue(col, col.accessor(r))))
    } else {
      const isDate = col.type === 'date'
      const lo = f.min === undefined ? null : isDate ? toDateKey(f.min) : toNumber(f.min)
      const hi = f.max === undefined ? null : isDate ? toDateKey(f.max) : toNumber(f.max)
      if (lo === null && hi === null) continue
      tests.push((r) => {
        const v = isDate ? toDateKey(col.accessor(r)) : toNumber(col.accessor(r))
        if (v === null) return false
        return (lo === null || v >= lo) && (hi === null || v <= hi)
      })
    }
  }
  if (!tests.length) return null
  return (r) => tests.every((t) => t(r))
}

function normalizeValue<R>(col: ColumnDef<R>, v: unknown): unknown {
  if (col.type === 'number' || col.type === 'money') return toNumber(v)
  if (col.type === 'date') return toDateKey(v)
  if (typeof v === 'string') return normalizeDigits(v).text
  return v
}

function textMatches(normalizedQuery: string, rawQuery: string, value: unknown, digitsQuery: boolean): boolean {
  const text = toText(value)
  if (!text) return false
  if (normalizeForSearch(text, DEFAULT_SEARCH).text.includes(normalizedQuery)) return true
  // «010…» finds «+20 10 …»: phones and codes match by digits in any numeral system.
  return digitsQuery && matchDigits(rawQuery, text)
}

/** Keeps a node when it matches or any descendant does (ancestors stay so a match is reachable). */
function filterTree<R>(nodes: Node<R>[], test: RowTest<R> | null): { nodes: Node<R>[]; matched: number } {
  if (!test) {
    let matched = 0
    const countAll = (ns: Node<R>[]) => ns.forEach((n) => (matched++, countAll(n.children)))
    countAll(nodes)
    return { nodes, matched }
  }
  let matched = 0
  const walk = (ns: Node<R>[]): Node<R>[] => {
    const out: Node<R>[] = []
    for (const n of ns) {
      const kids = walk(n.children)
      const self = test(n.row)
      if (self) matched++
      if (self || kids.length) out.push(kids === n.children ? n : { ...n, children: kids })
    }
    return out
  }
  return { nodes: walk(nodes), matched }
}

// ───────────────────────── sort ─────────────────────────

function makeComparator<R>(state: TableState, columns: ReadonlyMap<string, ColumnDef<R>>, locale: string): ((a: Node<R>, b: Node<R>) => number) | null {
  const specs = state.sort.map((s) => ({ col: columns.get(s.column), dir: s.dir === 'desc' ? -1 : 1 })).filter((s) => s.col && s.col.sortable !== false)
  if (!specs.length) return null
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' })
  // Decorate once per node: sort keys are computed n times, not n log n times.
  const cache = new WeakMap<Node<R>, unknown[]>()
  const keysOf = (n: Node<R>) => {
    let k = cache.get(n)
    if (!k) {
      k = specs.map(({ col }) => (col!.compare ? col!.accessor(n.row) : sortKey(col!, col!.accessor(n.row))))
      cache.set(n, k)
    }
    return k
  }
  return (a, b) => {
    const ka = keysOf(a)
    const kb = keysOf(b)
    for (let i = 0; i < specs.length; i++) {
      const { col, dir } = specs[i]!
      const va = ka[i]
      const vb = kb[i]
      if (col!.compare) {
        const c = col!.compare(va, vb)
        if (c) return c * dir
        continue
      }
      // Empty values last in both directions: a descending sort must not bury real data under blanks.
      const na = va === null || va === undefined
      const nb = vb === null || vb === undefined
      if (na || nb) {
        if (na && nb) continue
        return na ? 1 : -1
      }
      let c: number
      if (typeof va === 'string' && typeof vb === 'string') c = col!.type === 'date' ? (va < vb ? -1 : va > vb ? 1 : 0) : collator.compare(va, vb)
      else if (typeof va === 'number' && typeof vb === 'number') c = va - vb
      else if (typeof va === 'boolean' && typeof vb === 'boolean') c = Number(va) - Number(vb)
      else c = collator.compare(String(va), String(vb))
      if (c) return c * dir
    }
    return 0 // Array.prototype.sort is stable: equal rows keep input order.
  }
}

function sortTree<R>(nodes: Node<R>[], cmp: ((a: Node<R>, b: Node<R>) => number) | null): Node<R>[] {
  if (!cmp) return nodes
  return [...nodes].sort(cmp).map((n) => (n.children.length ? { ...n, children: sortTree(n.children, cmp) } : n))
}

// ───────────────────────── flatten, group, aggregate ─────────────────────────

function flatten<R>(nodes: Node<R>[], expanded: ReadonlySet<string>, out: TableRow<R>[] = []): TableRow<R>[] {
  for (const n of nodes) {
    out.push({ key: n.key, row: n.row, depth: n.depth })
    if (n.children.length && expanded.has(n.key)) flatten(n.children, expanded, out)
  }
  return out
}

function leaves<R>(nodes: Node<R>[], out: Node<R>[] = []): Node<R>[] {
  for (const n of nodes) {
    out.push(n)
    leaves(n.children, out)
  }
  return out
}

/** Group key: stable, readable, unique per path — `group:status=paid/region=cairo`. */
export function groupKey(path: readonly { column: string; value: unknown }[]): string {
  return 'group:' + path.map((p) => `${p.column}=${toText(p.value)}`).join('/')
}

function groupRows<R>(nodes: Node<R>[], by: readonly ColumnDef<R>[], expanded: ReadonlySet<string>, depth: number, path: { column: string; value: unknown }[]): TableRow<R>[] {
  const [col, ...rest] = by
  if (!col) return flatten(nodes.map((n) => shiftDepth(n, depth)), expanded)
  const buckets = new Map<unknown, Node<R>[]>()
  for (const n of nodes) {
    const v = normalizeValue(col, col.accessor(n.row))
    const k = isNil(v) ? null : v
    const list = buckets.get(k)
    if (list) list.push(n)
    else buckets.set(k, [n])
  }
  const out: TableRow<R>[] = []
  for (const [value, members] of buckets) {
    const p = [...path, { column: col.key, value }]
    const key = groupKey(p)
    out.push({ key, row: members[0]!.row, depth, group: { column: col.key, value, count: members.length } })
    if (expanded.has(key)) out.push(...groupRows(members, rest, expanded, depth + 1, p))
  }
  return out
}

function shiftDepth<R>(n: Node<R>, by: number): Node<R> {
  return by === 0 ? n : { ...n, depth: n.depth + by, children: n.children.map((c) => shiftDepth(c, by)) }
}

function aggregate<R>(cols: readonly ColumnDef<R>[], rows: readonly R[]): Record<string, number | null> {
  const out: Record<string, number | null> = {}
  for (const c of cols) {
    if (!c.aggregate) continue
    if (c.aggregate === 'count') {
      out[c.key] = rows.reduce((n, r) => (isNil(c.accessor(r)) ? n : n + 1), 0)
      continue
    }
    const values: number[] = []
    for (const r of rows) {
      const v = toNumber(c.accessor(r))
      if (v !== null) values.push(v)
    }
    if (!values.length) {
      out[c.key] = null
      continue
    }
    let result: number
    if (c.aggregate === 'sum') result = values.reduce((a, b) => a + b, 0)
    else if (c.aggregate === 'avg') result = values.reduce((a, b) => a + b, 0) / values.length
    else if (c.aggregate === 'min') result = values.reduce((a, b) => Math.min(a, b))
    else result = values.reduce((a, b) => Math.max(a, b))
    // Money is integer minor units: sums stay exact integers; an average rounds half away from zero to a unit.
    if (c.type === 'money') result = c.aggregate === 'avg' ? Math.sign(result) * Math.round(Math.abs(result)) : Math.round(result)
    out[c.key] = result
  }
  return out
}

// ───────────────────────── columns ─────────────────────────

function layoutColumns<R>(defs: readonly ColumnDef<R>[], state: TableState, availableWidth: number): TableColumn<R>[] {
  const byKey = new Map(defs.map((d) => [d.key, d] as const))
  const ordered: ColumnDef<R>[] = []
  for (const k of state.columnOrder) {
    const d = byKey.get(k)
    if (d && !ordered.includes(d)) ordered.push(d)
  }
  for (const d of defs) if (!ordered.includes(d)) ordered.push(d)
  const visible = ordered.filter((d) => !state.hidden.has(d.key))

  const clamp = (d: ColumnDef<R>, w: number) => Math.min(d.maxWidth ?? Infinity, Math.max(d.minWidth ?? DEFAULT_MIN_WIDTH, w))
  // Fixed widths first (user-resized width wins over the definition), then flex columns share what is left.
  const widths = new Map<ColumnDef<R>, number>()
  let used = 0
  let flexTotal = 0
  for (const d of visible) {
    const explicit = state.columnWidths[d.key]
    if (explicit !== undefined) widths.set(d, clamp(d, explicit))
    else if (d.flex && d.flex > 0) flexTotal += d.flex
    else widths.set(d, clamp(d, d.width ?? DEFAULT_COLUMN_WIDTH))
    if (widths.has(d)) used += widths.get(d)!
  }
  let remaining = Math.max(0, availableWidth - used)
  // Distribute in rounds so min/max clamps hand their excess back to the other flex columns.
  let flexCols = visible.filter((d) => !widths.has(d))
  while (flexCols.length) {
    const share = flexTotal > 0 ? remaining / flexTotal : 0
    const clamped = flexCols.filter((d) => clamp(d, share * (d.flex ?? 0)) !== share * (d.flex ?? 0))
    if (!clamped.length) {
      for (const d of flexCols) widths.set(d, Math.floor(share * (d.flex ?? 0)))
      break
    }
    for (const d of clamped) {
      const w = clamp(d, share * (d.flex ?? 0))
      widths.set(d, w)
      remaining = Math.max(0, remaining - w)
      flexTotal -= d.flex ?? 0
    }
    flexCols = flexCols.filter((d) => !clamped.includes(d))
  }

  // Visual order: start-pinned, unpinned, end-pinned (each keeps its relative order). Offsets are logical.
  const start = visible.filter((d) => d.pin === 'start')
  const end = visible.filter((d) => d.pin === 'end')
  const middle = visible.filter((d) => d.pin !== 'start' && d.pin !== 'end')
  const result: TableColumn<R>[] = []
  let acc = 0
  for (const d of start) {
    result.push({ def: d, width: widths.get(d)!, pin: 'start', offset: acc })
    acc += widths.get(d)!
  }
  for (const d of middle) result.push({ def: d, width: widths.get(d)!, pin: null, offset: 0 })
  const endCols: TableColumn<R>[] = []
  acc = 0
  for (let i = end.length - 1; i >= 0; i--) {
    const d = end[i]!
    endCols.unshift({ def: d, width: widths.get(d)!, pin: 'end', offset: acc })
    acc += widths.get(d)!
  }
  return [...result, ...endCols]
}

// ───────────────────────── model ─────────────────────────

export function createTableModel<R>(o: {
  rows: readonly R[]
  rowKey: (r: R) => string
  columns: readonly ColumnDef<R>[]
  state: TableState
  locale: string
  availableWidth: number
  getChildren?: (r: R) => readonly R[] | undefined
}): TableModel<R> {
  const { state } = o
  const colMap = new Map(o.columns.map((c) => [c.key, c] as const))
  const tree = buildTree(o.rows, o.rowKey, o.getChildren)

  const filtered = filterTree(tree.roots, compileFilters(state.filters, colMap))
  const sorted = sortTree(filtered.nodes, makeComparator(state, colMap, o.locale))

  const groupCols = state.groupBy.map((k) => colMap.get(k)).filter((c): c is ColumnDef<R> => !!c)
  const visible = groupCols.length ? groupRows(sorted, groupCols, state.expanded, 0, []) : flatten(sorted, state.expanded)

  // Aggregates cover every filtered row (all levels), not just the current page.
  const aggregates = aggregate(o.columns, leaves(filtered.nodes).map((n) => n.row))

  let rows: readonly TableRow<R>[] = visible
  let pageCount = 1
  if (state.page && state.page.size > 0) {
    pageCount = Math.max(1, Math.ceil(visible.length / state.page.size))
    const index = Math.min(Math.max(0, Math.floor(state.page.index)), pageCount - 1)
    rows = visible.slice(index * state.page.size, (index + 1) * state.page.size)
  }

  return {
    rows,
    totalRows: tree.count,
    filteredRows: filtered.matched,
    pageCount,
    columns: layoutColumns(o.columns, state, o.availableWidth),
    aggregates,
  }
}

// ───────────────────────── saved views ─────────────────────────

const STATE_VERSION = 1

/** Stable, versioned JSON for saved views (ProTable). Sets become sorted arrays, keys are sorted. */
export function serializeTableState(s: TableState): string {
  return JSON.stringify({
    v: STATE_VERSION,
    sort: s.sort.map((x) => ({ column: x.column, dir: x.dir })),
    filters: s.filters,
    page: s.page,
    groupBy: [...s.groupBy],
    expanded: [...s.expanded].sort(),
    columnOrder: [...s.columnOrder],
    columnWidths: Object.fromEntries(Object.entries(s.columnWidths).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
    hidden: [...s.hidden].sort(),
  })
}

export function parseTableState(json: string): TableState | { error: string } {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return { error: 'Not valid JSON.' }
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { error: 'Expected an object.' }
  const o = raw as Record<string, unknown>
  if (o.v !== STATE_VERSION) return { error: `Unsupported saved-view version ${String(o.v)}.` }
  const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')
  if (!Array.isArray(o.sort) || !o.sort.every((x) => isRecord(x) && typeof x.column === 'string' && (x.dir === 'asc' || x.dir === 'desc'))) return { error: 'Invalid sort.' }
  if (!Array.isArray(o.filters) || !o.filters.every(isFilter)) return { error: 'Invalid filters.' }
  if (o.page !== null && !(isRecord(o.page) && Number.isInteger(o.page.index) && Number.isInteger(o.page.size) && (o.page.size as number) > 0 && (o.page.index as number) >= 0)) return { error: 'Invalid page.' }
  if (!strings(o.groupBy) || !strings(o.expanded) || !strings(o.columnOrder) || !strings(o.hidden)) return { error: 'Invalid lists.' }
  if (!isRecord(o.columnWidths) || !Object.values(o.columnWidths).every((w) => typeof w === 'number' && Number.isFinite(w) && w > 0)) return { error: 'Invalid column widths.' }
  return {
    sort: o.sort as TableState['sort'],
    filters: o.filters as Filter[],
    page: o.page as TableState['page'],
    groupBy: o.groupBy,
    expanded: new Set(o.expanded),
    columnOrder: o.columnOrder,
    columnWidths: o.columnWidths as Record<string, number>,
    hidden: new Set(o.hidden),
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isFilter(v: unknown): v is Filter {
  if (!isRecord(v)) return false
  if (v.type === 'global') return typeof v.query === 'string'
  if (typeof v.column !== 'string') return false
  if (v.type === 'text') return typeof v.query === 'string'
  if (v.type === 'in') return Array.isArray(v.values)
  if (v.type === 'range') return ['min', 'max'].every((k) => v[k] === undefined || typeof v[k] === 'number' || typeof v[k] === 'string')
  return false
}
