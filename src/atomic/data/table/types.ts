export interface ColumnDef<R> {
  key: string; header: string; accessor: (row: R) => unknown
  type?: 'text' | 'number' | 'money' | 'date' | 'boolean'
  sortable?: boolean; filterable?: boolean
  pin?: 'start' | 'end'
  width?: number; minWidth?: number; maxWidth?: number; flex?: number
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
export interface TableModel<R> {
  rows: readonly { key: string; row: R; depth: number; group?: { column: string; value: unknown; count: number } }[]
  totalRows: number
  filteredRows: number
  pageCount: number
  columns: readonly { def: ColumnDef<R>; width: number; pin: 'start' | 'end' | null; offset: number }[]
  aggregates: Readonly<Record<string, number | null>>
}
export type TableErrorCode = 'UNKNOWN_COLUMN' | 'DUPLICATE_COLUMN' | 'DUPLICATE_ROW_KEY' | 'INVALID_STATE' | 'INVALID_MONEY'
export class¶»§q«^