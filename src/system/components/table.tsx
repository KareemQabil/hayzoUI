/** DataTable — semantic table, numeric alignment, own scroll container (never the page). */
import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: 'start' | 'end' | 'center'
  numeric?: boolean
  width?: string
  nowrap?: boolean
  /** Hide this column below 640px. */
  hideCompact?: boolean
}

export interface DataTableProps<T> {
  label: string
  caption?: ReactNode
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  selectedKey?: string | null
  empty?: ReactNode
  maxHeight?: number | string
  minWidth?: number
  className?: string
}

export function DataTable<T>({ label, caption, columns, rows, rowKey, selectedKey, empty, maxHeight, minWidth, className }: DataTableProps<T>) {
  return (
    <div className={['ax-table-wrap', className].filter(Boolean).join(' ')} role="region" aria-label={label} tabIndex={0} style={{ maxHeight }}>
      <table className="ax-table" style={{ minWidth }}>
        {caption ? <caption className="ax-table__caption">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" data-align={c.align ?? (c.numeric ? 'end' : 'start')} data-hide-compact={c.hideCompact || undefined} style={{ width: c.width }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="ax-table__empty">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const k = rowKey(r)
              return (
                <tr key={k} data-selected={selectedKey === k || undefined} aria-selected={selectedKey != null ? selectedKey === k : undefined}>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      data-align={c.align ?? (c.numeric ? 'end' : 'start')}
                      data-numeric={c.numeric || undefined}
                      data-nowrap={c.nowrap || undefined}
                      data-hide-compact={c.hideCompact || undefined}
                    >
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
