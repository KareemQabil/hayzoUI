/**
 * F3 atom: Table — atomic.table@0.1.0. Contract: TABLE_CONTRACT in ./table-contract.ts.
 * Renders the headless engine's TableModel (src/atomic/data/table); owns semantics, focus and pinning CSS hooks.
 *
 * - Native <table> semantics: caption names it; sortable headers carry aria-sort and a real <button>.
 * - Sorting: click cycles none → ascending → descending → none; Shift+click (or Shift+Enter) adds a column (multi-sort).
 * - Selection: native checkboxes; the header box selects the visible page, shows mixed when partial.
 * - Tree and groups: a toggle button with aria-expanded; children follow the expanded state in the engine.
 * - Pinned columns: position sticky with the engine's logical offset (inset-inline-start/end) — RTL needs nothing.
 * - Numbers and money: shown in the scope's numerals; money is formatted from integer minor units.
 * State: `state` / `defaultState` / `onStateChange` (TableState); selection: `selectedKeys` / `defaultSelectedKeys` /
 * `onSelectionChange` — one contract for controlled and uncontrolled use.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { formatAmount, scriptRuns, toDisplayDigits, type CurrencyCode, type DisplayNumerals } from '../../arabic'
import { createTableModel, DEFAULT_TABLE_STATE, type ColumnDef, type TableColumn, type TableRow, type TableState } from '../data/table'
import { useControllableState } from '../platform/react/controllable'
import { useExperience } from '../platform/react/experience'
import '../styles/recipes/table.css'
import { Button } from './button'

export interface TableColumnDef<R> extends ColumnDef<R> {
  /** Custom cell content. Default: the accessor value, formatted by type in the scope's numerals. */
  cell?: (row: R) => ReactNode
  /** Currency for `type: 'money'` (values are integer minor units). Default EGP. */
  currency?: CurrencyCode
}

export interface TableLabels {
  selectAll: string
  selectRow: (name: string) => string
  expand: (name: string) => string
  collapse: (name: string) => string
  empty: string
  loading: string
  summary: string
  previous: string
  next: string
  page: (index: number, count: number) => string
  rows: (from: number, to: number, total: number) => string
  pageSize: string
}

const LABELS: Record<'ar' | 'en', TableLabels> = {
  ar: {
    selectAll: 'تحديد كل صفوف الصفحة',
    selectRow: (n) => `تحديد ${n}`,
    expand: (n) => `توسيع ${n}`,
    collapse: (n) => `طي ${n}`,
    empty: 'لا توجد بيانات مطابقة.',
    loading: 'جارٍ التحميل…',
    summary: 'الإجمالي',
    previous: 'السابق',
    next: 'التالي',
    page: (i, c) => `صفحة ${i} من ${c}`,
    rows: (f, t, n) => `${f}–${t} من ${n}`,
    pageSize: 'عدد الصفوف في الصفحة',
  },
  en: {
    selectAll: 'Select all rows on this page',
    selectRow: (n) => `Select ${n}`,
    expand: (n) => `Expand ${n}`,
    collapse: (n) => `Collapse ${n}`,
    empty: 'No matching data.',
    loading: 'Loading…',
    summary: 'Total',
    previous: 'Previous',
    next: 'Next',
    page: (i, c) => `Page ${i} of ${c}`,
    rows: (f, t, n) => `${f}–${t} of ${n}`,
    pageSize: 'Rows per page',
  },
}

export interface TableProps<R> {
  /** Accessible name (the caption). */
  label: string
  /** Show the caption visually. Default false (still announced). */
  showLabel?: boolean
  rows: readonly R[]
  rowKey: (row: R) => string
  columns: readonly TableColumnDef<R>[]
  state?: TableState
  defaultState?: Partial<TableState>
  onStateChange?: (state: TableState) => void
  selectionMode?: 'none' | 'single' | 'multiple'
  selectedKeys?: readonly string[]
  defaultSelectedKeys?: readonly string[]
  onSelectionChange?: (keys: readonly string[]) => void
  getChildren?: (row: R) => readonly R[] | undefined
  /** Show the aggregates row (columns with `aggregate`). */
  summary?: boolean
  pageSizes?: readonly number[]
  loading?: boolean
  empty?: ReactNode
  /** Width used for flex columns before the first measurement (and in non-DOM renders). */
  initialWidth?: number
  labels?: Partial<TableLabels>
}

const EMPTY: readonly string[] = []
/** Width of the selection column; matches the minimum touch target in every context (POS 44px + border). */
const SELECT_WIDTH = 48

export function Table<R>(props: TableProps<R>) {
  const { label, showLabel = false, rows, rowKey, columns, selectionMode = 'none', getChildren, summary = false, pageSizes = [10, 25, 50], loading = false, initialWidth = 960 } = props
  const { locale, numberingSystem } = useExperience()
  const numerals: DisplayNumerals = numberingSystem === 'arab' ? 'arab' : 'latn'
  const text: TableLabels = { ...(locale.startsWith('ar') ? LABELS.ar : LABELS.en), ...props.labels }
  const digits = (s: string | number) => toDisplayDigits(String(s), numerals)

  const [state, setState] = useControllableState<TableState>(props.state, { ...DEFAULT_TABLE_STATE, ...props.defaultState }, props.onStateChange ? (s) => props.onStateChange!(s) : undefined)
  const [selected, setSelected] = useControllableState<readonly string[]>(props.selectedKeys, props.defaultSelectedKeys ?? EMPTY, props.onSelectionChange ? (k) => props.onSelectionChange!(k) : undefined)
  const update = (patch: Partial<TableState>) => setState({ ...state, ...patch }, undefined)

  // Available width for flex columns: measured from the scroll container (F1 concern, kept local).
  const scrollRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(initialWidth)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => setWidth(Math.max(0, el.clientWidth - (selectionMode === 'none' ? 0 : SELECT_WIDTH)))
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [selectionMode])

  const model = useMemo(
    () => createTableModel({ rows, rowKey, columns, state, locale, availableWidth: width, getChildren }),
    [rows, rowKey, columns, state, locale, width, getChildren],
  )
  const defs = new Map(columns.map((c) => [c.key, c] as const))
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const pageKeys = model.rows.filter((r) => !r.group).map((r) => r.key)
  const pageSelected = pageKeys.filter((k) => selectedSet.has(k)).length
  const headerBox = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (headerBox.current) headerBox.current.indeterminate = pageSelected > 0 && pageSelected < pageKeys.length
  })

  const nameOf = (r: TableRow<R>) => {
    const first = model.columns[0]
    return first ? String(first.def.accessor(r.row) ?? r.key) : r.key
  }

  function toggleSort(column: string, additive: boolean) {
    const current = state.sort.find((s) => s.column === column)
    const nextDir = !current ? 'asc' : current.dir === 'asc' ? 'desc' : null
    const others = additive ? state.sort.filter((s) => s.column !== column) : []
    update({ sort: nextDir ? [...others, { column, dir: nextDir }] : others, page: state.page ? { ...state.page, index: 0 } : null })
  }
  function toggleExpanded(key: string) {
    const next = new Set(state.expanded)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    update({ expanded: next })
  }
  function toggleRow(key: string) {
    if (selectionMode === 'single') setSelected(selectedSet.has(key) ? [] : [key], undefined)
    else setSelected(selectedSet.has(key) ? selected.filter((k) => k !== key) : [...selected, key], undefined)
  }
  function toggleAll() {
    const all = pageSelected === pageKeys.length && pageKeys.length > 0
    setSelected(all ? selected.filter((k) => !pageKeys.includes(k)) : [...new Set([...selected, ...pageKeys])], undefined)
  }

  const pinStyle = (c: TableColumn<R>): CSSProperties | undefined =>
    // The selection column is pinned first at the start edge, so start-pinned columns shift by its width.
    c.pin === 'start' ? { insetInlineStart: c.offset + (selectionMode === 'none' ? 0 : SELECT_WIDTH) } : c.pin === 'end' ? { insetInlineEnd: c.offset } : undefined
  const lastStart = [...model.columns].reverse().find((c) => c.pin === 'start')
  const firstEnd = model.columns.find((c) => c.pin === 'end')
  const pinAttrs = (c: TableColumn<R>) => ({
    'data-pin': c.pin ?? undefined,
    'data-pin-edge': c === lastStart || c === firstEnd ? '' : undefined,
    style: pinStyle(c),
  })
  const numeric = (d: ColumnDef<R>) => d.type === 'number' || d.type === 'money'

  function display(d: TableColumnDef<R>, value: unknown): ReactNode {
    if (value === null || value === undefined || value === '') return '—'
    if (d.type === 'money' && typeof value === 'number') return formatAmount(value, { currency: d.currency ?? 'EGP', numerals })
    if (d.type === 'number') return digits(String(value))
    if (d.type === 'boolean') return value ? '✓' : '—'
    return <MixedText text={String(value)} />
  }

  const selectCol = selectionMode !== 'none'
  const colSpan = model.columns.length + (selectCol ? 1 : 0)
  const page = state.page
  const filtered = model.filteredRows

  return (
    <div data-hz="table" aria-busy={loading || undefined}>
      <div data-slot="scroll" ref={scrollRef} tabIndex={0} role="region" aria-label={label}>
        <table aria-rowcount={model.rows.length + 1} aria-multiselectable={selectionMode === 'multiple' || undefined}>
          <caption data-slot="caption" data-hidden={showLabel ? undefined : ''}>{label}</caption>
          <colgroup>
            {selectCol ? <col style={{ inlineSize: SELECT_WIDTH }} /> : null}
            {model.columns.map((c) => (
              <col key={c.def.key} style={{ inlineSize: c.width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {selectCol ? (
                <th data-slot="select" scope="col" data-pin="start" style={{ insetInlineStart: 0 }}>
                  {selectionMode === 'multiple' ? (
                    <label>
                      <input ref={headerBox} type="checkbox" aria-label={text.selectAll} checked={pageKeys.length > 0 && pageSelected === pageKeys.length} onChange={toggleAll} />
                    </label>
                  ) : null}
                </th>
              ) : null}
              {model.columns.map((c) => {
                const d = defs.get(c.def.key)!
                const sort = state.sort.findIndex((s) => s.column === d.key)
                const dir = sort >= 0 ? state.sort[sort]!.dir : null
                const sortable = d.sortable !== false
                return (
                  <th key={d.key} scope="col" aria-sort={sortable ? (dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none') : undefined} data-numeric={numeric(d) ? '' : undefined} {...pinAttrs(c)}>
                    {sortable ? (
                      <button
                        type="button"
                        data-slot="sort"
                        onClick={(e: MouseEvent) => toggleSort(d.key, e.shiftKey)}
                        onKeyDown={(e: KeyboardEvent) => {
                          if (e.key === 'Enter' && e.shiftKey) {
                            e.preventDefault()
                            toggleSort(d.key, true)
                          }
                        }}
                      >
                        <span>{d.header}</span>
                        <svg data-slot="sort-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                          <path d="M8 3l4 5H4z" fill="currentColor" />
                        </svg>
                        {state.sort.length > 1 && sort >= 0 ? <span data-slot="sort-rank" aria-hidden="true">{digits(sort + 1)}</span> : null}
                      </button>
                    ) : (
                      d.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {model.rows.length === 0 ? (
              <tr>
                <td data-slot="empty" colSpan={colSpan}>{loading ? text.loading : (props.empty ?? text.empty)}</td>
              </tr>
            ) : (
              model.rows.map((r) => {
                if (r.group) {
                  const open = state.expanded.has(r.key)
                  const head = defs.get(r.group.column)
                  const value = head ? display(head, r.group.value) : String(r.group.value)
                  const name = `${head?.header ?? r.group.column}: ${typeof value === 'string' ? value : String(r.group.value)}`
                  return (
                    <tr key={r.key} data-group="" data-depth={r.depth}>
                      <td colSpan={colSpan} style={{ paddingInlineStart: `calc(var(--hz-component-table-cell-padding-inline) + ${r.depth} * var(--hz-component-table-indent-size))` }}>
                        <span data-slot="cell-content">
                          <button type="button" data-slot="toggle" aria-expanded={open} aria-label={open ? text.collapse(name) : text.expand(name)} onClick={() => toggleExpanded(r.key)}>
                            <Chevron />
                          </button>
                          <span>{head?.header ?? r.group.column}: {value}</span>
                          <span data-slot="group-count">({digits(r.group.count)})</span>
                        </span>
                      </td>
                    </tr>
                  )
                }
                const isSelected = selectedSet.has(r.key)
                const kids = getChildren?.(r.row)
                const hasKids = !!kids && kids.length > 0
                const open = state.expanded.has(r.key)
                return (
                  <tr key={r.key} data-selected={isSelected ? '' : undefined} aria-selected={selectCol ? isSelected : undefined} data-depth={r.depth}>
                    {selectCol ? (
                      <td data-slot="select" data-pin="start" style={{ insetInlineStart: 0 }}>
                        <label>
                          <input type={selectionMode === 'single' ? 'radio' : 'checkbox'} name={selectionMode === 'single' ? `${label}-selection` : undefined} aria-label={text.selectRow(nameOf(r))} checked={isSelected} onChange={() => toggleRow(r.key)} onClick={selectionMode === 'single' && isSelected ? () => toggleRow(r.key) : undefined} />
                        </label>
                      </td>
                    ) : null}
                    {model.columns.map((c, i) => {
                      const d = defs.get(c.def.key)!
                      const content = d.cell ? d.cell(r.row) : display(d, d.accessor(r.row))
                      const first = i === 0
                      return (
                        <td key={d.key} data-numeric={numeric(d) ? '' : undefined} {...pinAttrs(c)} style={{ ...pinStyle(c), ...(first && (r.depth > 0 || getChildren) ? { paddingInlineStart: `calc(var(--hz-component-table-cell-padding-inline) + ${r.depth} * var(--hz-component-table-indent-size))` } : null) }}>
                          {first && getChildren ? (
                            <span data-slot="cell-content">
                              {hasKids ? (
                                <button type="button" data-slot="toggle" aria-expanded={open} aria-label={open ? text.collapse(nameOf(r)) : text.expand(nameOf(r))} onClick={() => toggleExpanded(r.key)}>
                                  <Chevron />
                                </button>
                              ) : (
                                <span data-slot="toggle-spacer" />
                              )}
                              <span>{content}</span>
                            </span>
                          ) : (
                            content
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
          {summary && model.rows.length > 0 ? (
            <tfoot>
              <tr data-slot="summary">
                {selectCol ? <td data-pin="start" style={{ insetInlineStart: 0 }} /> : null}
                {model.columns.map((c, i) => {
                  const d = defs.get(c.def.key)!
                  const v = model.aggregates[d.key]
                  return (
                    <td key={d.key} data-numeric={numeric(d) ? '' : undefined} {...pinAttrs(c)}>
                      {v !== undefined && v !== null ? display(d.aggregate === 'count' ? { ...d, type: 'number' } : d, v) : i === 0 ? text.summary : null}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      {page ? (
        <nav data-slot="pagination" aria-label={text.page(page.index + 1, model.pageCount)}>
          <span data-slot="page-status" aria-live="polite">
            {filtered === 0 ? digits(0) : digits(text.rows(page.index * page.size + 1, Math.min((page.index + 1) * page.size, model.rows.length + page.index * page.size), filtered))}
          </span>
          <span data-slot="pagination-controls">
            <label>
              <span style={VISUALLY_HIDDEN}>{text.pageSize}</span>
              <select data-slot="page-size" value={page.size} onChange={(e) => update({ page: { index: 0, size: Number(e.target.value) } })}>
                {pageSizes.map((s) => (
                  <option key={s} value={s}>{digits(s)}</option>
                ))}
              </select>
            </label>
            <Button size="sm" intent="neutral" emphasis="outline" isDisabled={page.index <= 0} onPress={() => update({ page: { ...page, index: page.index - 1 } })}>{text.previous}</Button>
            <span>{digits(text.page(Math.min(page.index, model.pageCount - 1) + 1, model.pageCount))}</span>
            <Button size="sm" intent="neutral" emphasis="outline" isDisabled={page.index >= model.pageCount - 1} onPress={() => update({ page: { ...page, index: page.index + 1 } })}>{text.next}</Button>
          </span>
        </nav>
      ) : null}
    </div>
  )
}

/**
 * Text cells follow the mixed-script contract (CONTRACTS §Mixed text): line direction from the dominant script by
 * words, foreign words isolated — «Dr. سامي» reads title-first in RTL, «أحمد Nasser» stays an Arabic line in LTR.
 */
function MixedText({ text }: { text: string }) {
  const { dir, runs } = scriptRuns(text)
  if (!dir || runs.every((r) => !r.isolate)) return <bdi dir={dir ?? undefined}>{text}</bdi>
  return (
    <bdi dir={dir}>
      {runs.map((r, i) => (r.isolate ? <bdi key={i} dir={r.isolate}>{r.text}</bdi> : r.text))}
    </bdi>
  )
}

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const VISUALLY_HIDDEN = { position: 'absolute', inlineSize: 1, blockSize: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' } as const
