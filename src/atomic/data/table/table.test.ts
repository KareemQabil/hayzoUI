import { describe, expect, test } from 'vitest'
import { DEFAULT_TABLE_STATE, TableError, createTableModel, groupKey, parseTableState, serializeTableState, type ColumnDef, type TableState } from './index'

interface Customer {
  id: string
  name: string
  phone: string
  region: string
  balance: number // minor units
  since: string // ISO date
  active: boolean
  qty?: string | null
  children?: Customer[]
}

const C: Customer[] = [
  { id: 'CUS-0001', name: 'أحمد Khaled', phone: '+20 10 1234 5678', region: 'القاهرة', balance: 123450, since: '2025-03-14', active: true, qty: '١٢' },
  { id: 'CUS-0002', name: 'إيمان عبد الرحمن', phone: '+20 11 2345 6789', region: 'الإسكندرية', balance: 0, since: '2024-11-02', active: false, qty: '3' },
  { id: 'CUS-0003', name: 'مُحَمَّد السيد', phone: '+20 12 3456 7890', region: 'القاهرة', balance: 8750000, since: '2026-01-20', active: true, qty: null },
  { id: 'CUS-0004', name: 'هالة مؤمن', phone: '+20 15 5555 1212', region: 'الجيزة', balance: 50, since: '2023-07-01', active: true, qty: '100' },
  { id: 'CUS-0005', name: 'Sara Haddad', phone: '+20 11 5556 6677', region: 'الإسكندرية', balance: 99999, since: '2025-12-31', active: false, qty: '٢٠' },
]

const COLS: ColumnDef<Customer>[] = [
  { key: 'id', header: 'الرقم', accessor: (r) => r.id, pin: 'start', width: 110 },
  { key: 'name', header: 'الاسم', accessor: (r) => r.name, flex: 2, minWidth: 120 },
  { key: 'phone', header: 'الهاتف', accessor: (r) => r.phone, width: 150 },
  { key: 'region', header: 'المنطقة', accessor: (r) => r.region, width: 120 },
  { key: 'balance', header: 'الرصيد', accessor: (r) => r.balance, type: 'money', aggregate: 'sum', pin: 'end', width: 120 },
  { key: 'since', header: 'منذ', accessor: (r) => r.since, type: 'date', width: 110 },
  { key: 'active', header: 'نشط', accessor: (r) => r.active, type: 'boolean', width: 80 },
  { key: 'qty', header: 'الكمية', accessor: (r) => r.qty, type: 'number', aggregate: 'sum', width: 80, flex: 1 },
]

const st = (patch: Partial<TableState> = {}): TableState => ({ ...DEFAULT_TABLE_STATE, ...patch })
const model = (patch: Partial<TableState> = {}, rows: readonly Customer[] = C, locale = 'ar-EG', availableWidth = 1200) =>
  createTableModel({ rows, rowKey: (r) => r.id, columns: COLS, state: st(patch), locale, availableWidth, getChildren: (r) => r.children })
const ids = (m: ReturnType<typeof model>) => m.rows.map((r) => r.key)

/** mulberry32 — deterministic property tests. */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('filter', () => {
  test('TE-01 text filter is Arabic-tolerant: hamza, diacritics', () => {
    expect(ids(model({ filters: [{ type: 'text', column: 'name', query: 'ايمان' }] }))).toEqual(['CUS-0002'])
    expect(ids(model({ filters: [{ type: 'text', column: 'name', query: 'محمد' }] }))).toEqual(['CUS-0003'])
    expect(ids(model({ filters: [{ type: 'text', column: 'name', query: 'احمد' }] }))).toEqual(['CUS-0001'])
  })

  test('TE-02 phones match by digits in any numeral system («٠١٠» finds «+20 10 …»)', () => {
    expect(ids(model({ filters: [{ type: 'text', column: 'phone', query: '٠١٠١٢٣' }] }))).toEqual(['CUS-0001'])
    expect(ids(model({ filters: [{ type: 'global', query: '0115556' }] }))).toEqual(['CUS-0005'])
  })

  test('TE-03 global filter searches text columns; mixed Latin works', () => {
    expect(ids(model({ filters: [{ type: 'global', query: 'khaled' }] }))).toEqual(['CUS-0001'])
    expect(ids(model({ filters: [{ type: 'global', query: 'الاسكندريه' }] }))).toEqual([]) // taa marbuta is strict by default
    expect(ids(model({ filters: [{ type: 'global', query: 'الإسكندرية' }] })).sort()).toEqual(['CUS-0002', 'CUS-0005'])
  })

  test('TE-04 «in» filter, number «range» with Arabic digits, date «range» on ISO', () => {
    expect(ids(model({ filters: [{ type: 'in', column: 'region', values: ['القاهرة'] }] }))).toEqual(['CUS-0001', 'CUS-0003'])
    expect(ids(model({ filters: [{ type: 'range', column: 'qty', min: '١٠', max: 50 }] }))).toEqual(['CUS-0001', 'CUS-0005'])
    expect(ids(model({ filters: [{ type: 'range', column: 'since', min: '2025-01-01' }] }))).toEqual(['CUS-0001', 'CUS-0003', 'CUS-0005'])
    expect(ids(model({ filters: [{ type: 'range', column: 'balance', max: 50 }] }))).toEqual(['CUS-0002', 'CUS-0004'])
  })

  test('TE-05 filters combine with AND; empty queries and unknown columns are ignored, never throw', () => {
    const m = model({ filters: [{ type: 'in', column: 'region', values: ['القاهرة'] }, { type: 'range', column: 'balance', min: 1_000_000 }, { type: 'text', column: 'gone', query: 'x' }, { type: 'global', query: '   ' }] })
    expect(ids(m)).toEqual(['CUS-0003'])
    expect(m.filteredRows).toBe(1)
    expect(m.totalRows).toBe(5)
  })
})

describe('sort', () => {
  test('TE-06 Arabic collation, multi-column, stable', () => {
    expect(ids(model({ sort: [{ column: 'region', dir: 'asc' }, { column: 'balance', dir: 'desc' }] }))).toEqual(['CUS-0002', 'CUS-0005', 'CUS-0001', 'CUS-0003', 'CUS-0004'].sort((a, b) => {
      const ra = C.find((c) => c.id === a)!, rb = C.find((c) => c.id === b)!
      return new Intl.Collator('ar-EG').compare(ra.region, rb.region) || rb.balance - ra.balance
    }))
    // Stability: equal keys keep input order.
    const rows = C.map((c) => ({ ...c, region: 'نفس' }))
    expect(ids(model({ sort: [{ column: 'region', dir: 'desc' }] }, rows))).toEqual(C.map((c) => c.id))
  })

  test('TE-07 numbers written with Arabic-Indic digits sort numerically; empty values last in both directions', () => {
    expect(ids(model({ sort: [{ column: 'qty', dir: 'asc' }] }))).toEqual(['CUS-0002', 'CUS-0001', 'CUS-0005', 'CUS-0004', 'CUS-0003'])
    expect(ids(model({ sort: [{ column: 'qty', dir: 'desc' }] }))).toEqual(['CUS-0004', 'CUS-0005', 'CUS-0001', 'CUS-0002', 'CUS-0003'])
  })

  test('TE-08 dates, booleans, money and custom compare', () => {
    expect(ids(model({ sort: [{ column: 'since', dir: 'asc' }] }))[0]).toBe('CUS-0004')
    expect(ids(model({ sort: [{ column: 'active', dir: 'asc' }] })).slice(0, 2)).toEqual(['CUS-0002', 'CUS-0005'])
    expect(ids(model({ sort: [{ column: 'balance', dir: 'desc' }] }))[0]).toBe('CUS-0003')
    const byLength: ColumnDef<Customer> = { key: 'len', header: 'len', accessor: (r) => r.name, compare: (a, b) => String(a).length - String(b).length }
    const m = createTableModel({ rows: C, rowKey: (r) => r.id, columns: [...COLS, byLength], state: st({ sort: [{ column: 'len', dir: 'asc' }] }), locale: 'ar-EG', availableWidth: 1200 })
    expect(m.rows[0]!.key).toBe('CUS-0004')
  })

  test('TE-09 a column with sortable:false ignores sort requests', () => {
    const cols = COLS.map((c) => (c.key === 'name' ? { ...c, sortable: false } : c))
    const m = createTableModel({ rows: C, rowKey: (r) => r.id, columns: cols, state: st({ sort: [{ column: 'name', dir: 'desc' }] }), locale: 'ar-EG', availableWidth: 1200 })
    expect(m.rows.map((r) => r.key)).toEqual(C.map((c) => c.id))
  })
})

describe('tree, groups, aggregates, pages', () => {
  const tree: Customer[] = [
    { ...C[0]!, children: [{ ...C[1]!, id: 'CUS-0001-A' }, { ...C[2]!, id: 'CUS-0001-B', children: [{ ...C[3]!, id: 'CUS-0001-B-1' }] }] },
    C[4]!,
  ]

  test('TE-10 tree data: children visible only under expanded parents, with depth', () => {
    expect(model({}, tree).rows.map((r) => [r.key, r.depth])).toEqual([['CUS-0001', 0], ['CUS-0005', 0]])
    const m = model({ expanded: new Set(['CUS-0001', 'CUS-0001-B']) }, tree)
    expect(m.rows.map((r) => [r.key, r.depth])).toEqual([['CUS-0001', 0], ['CUS-0001-A', 1], ['CUS-0001-B', 1], ['CUS-0001-B-1', 2], ['CUS-0005', 0]])
    expect(m.totalRows).toBe(5)
  })

  test('TE-11 filtering a tree keeps the ancestors of a match; sorting sorts siblings', () => {
    const m = model({ filters: [{ type: 'text', column: 'name', query: 'هالة' }], expanded: new Set(['CUS-0001', 'CUS-0001-B']) }, tree)
    expect(ids(m)).toEqual(['CUS-0001', 'CUS-0001-B', 'CUS-0001-B-1'])
    expect(m.filteredRows).toBe(1)
    const sorted = model({ sort: [{ column: 'balance', dir: 'desc' }], expanded: new Set(['CUS-0001']) }, tree)
    // 123,450 > 99,999 at the root; children sorted among themselves (8,750,000 > 0).
    expect(ids(sorted)).toEqual(['CUS-0001', 'CUS-0001-B', 'CUS-0001-A', 'CUS-0005'])
  })

  test('TE-12 duplicate keys and cycles throw a typed TableError', () => {
    expect(() => model({}, [C[0]!, C[0]!])).toThrow(TableError)
    const a: Customer = { ...C[0]! }
    a.children = [a]
    expect(() => model({}, [a])).toThrowError(/Duplicate row key|Cycle/)
  })

  test('TE-13 grouping: group rows with counts, members only when the group is expanded, multi-level keys', () => {
    const g = model({ groupBy: ['region'], sort: [{ column: 'balance', dir: 'asc' }] })
    expect(g.rows.every((r) => r.group)).toBe(true)
    // Groups appear in the order of their first row after sorting: 0 (Alexandria), 50 (Giza), 123,450 (Cairo).
    expect(g.rows.map((r) => [r.group!.value, r.group!.count])).toEqual([['الإسكندرية', 2], ['الجيزة', 1], ['القاهرة', 2]])
    const cairo = groupKey([{ column: 'region', value: 'القاهرة' }])
    const open = model({ groupBy: ['region'], expanded: new Set([cairo]) })
    const at = open.rows.findIndex((r) => r.key === cairo)
    expect(open.rows.slice(at + 1, at + 3).map((r) => [r.key, r.depth])).toEqual([['CUS-0001', 1], ['CUS-0003', 1]])
    const two = model({ groupBy: ['region', 'active'], expanded: new Set([cairo]) })
    expect(two.rows.filter((r) => r.group?.column === 'active').map((r) => r.key)).toEqual([groupKey([{ column: 'region', value: 'القاهرة' }, { column: 'active', value: true }])])
  })

  test('TE-14 aggregates cover all filtered rows (not the page); money stays integer minor units', () => {
    const m = model({ page: { index: 0, size: 2 } })
    expect(m.rows).toHaveLength(2)
    expect(m.aggregates.balance).toBe(123450 + 0 + 8750000 + 50 + 99999)
    expect(Number.isInteger(m.aggregates.balance)).toBe(true)
    expect(m.aggregates.qty).toBe(12 + 3 + 100 + 20)
    expect(model({ filters: [{ type: 'text', column: 'name', query: 'لا أحد' }] }).aggregates.balance).toBeNull()
  })

  test('TE-15 pagination clamps the index; pageCount over visible rows', () => {
    expect(model({ page: { index: 0, size: 2 } }).pageCount).toBe(3)
    expect(ids(model({ page: { index: 99, size: 2 } }))).toEqual(['CUS-0005'])
    expect(ids(model({ page: { index: -3, size: 2 } }))).toEqual(['CUS-0001', 'CUS-0002'])
  })
})

describe('columns', () => {
  test('TE-16 order, visibility, explicit widths win, flex shares the remainder within min/max', () => {
    const m = model({ columnOrder: ['phone', 'id'], hidden: new Set(['active', 'since']), columnWidths: { phone: 200 } }, C, 'ar-EG', 1000)
    expect(m.columns.map((c) => c.def.key)).toEqual(['id', 'phone', 'name', 'region', 'qty', 'balance'])
    const w = Object.fromEntries(m.columns.map((c) => [c.def.key, c.width]))
    expect(w.phone).toBe(200)
    // fixed: id 110 + phone 200 + region 120 + balance 120 = 550; flex 3 shares 450 → name 300, qty 150
    expect([w.name, w.qty]).toEqual([300, 150])
    const narrow = model({}, C, 'ar-EG', 300)
    expect(narrow.columns.find((c) => c.def.key === 'name')!.width).toBe(120) // minWidth holds when nothing is left
  })

  test('TE-17 pinned columns get logical offsets from their own edge (start/end), never left/right', () => {
    const cols: ColumnDef<Customer>[] = [
      { key: 'a', header: 'a', accessor: () => 1, pin: 'start', width: 100 },
      { key: 'b', header: 'b', accessor: () => 1, pin: 'start', width: 60 },
      { key: 'c', header: 'c', accessor: () => 1, width: 80 },
      { key: 'd', header: 'd', accessor: () => 1, pin: 'end', width: 70 },
      { key: 'e', header: 'e', accessor: () => 1, pin: 'end', width: 90 },
    ]
    const m = createTableModel({ rows: C, rowKey: (r) => r.id, columns: cols, state: st(), locale: 'ar-EG', availableWidth: 900 })
    expect(m.columns.map((c) => [c.def.key, c.pin, c.offset])).toEqual([['a', 'start', 0], ['b', 'start', 100], ['c', null, 0], ['d', 'end', 90], ['e', 'end', 0]])
  })
})

describe('saved views, purity, properties, budget', () => {
  test('TE-18 serialize → parse round-trips; invalid input returns an error, never throws', () => {
    const s = st({ sort: [{ column: 'name', dir: 'desc' }], filters: [{ type: 'text', column: 'name', query: 'أحمد' }, { type: 'range', column: 'qty', min: '١' }], page: { index: 1, size: 25 }, groupBy: ['region'], expanded: new Set(['b', 'a']), columnOrder: ['id'], columnWidths: { z: 10, a: 20 }, hidden: new Set(['phone']) })
    const json = serializeTableState(s)
    const back = parseTableState(json)
    expect('error' in back).toBe(false)
    expect(serializeTableState(back as TableState)).toBe(json)
    expect(json).toBe(serializeTableState({ ...s, expanded: new Set(['a', 'b']) })) // stable regardless of Set order
    for (const bad of ['{', '[]', '{"v":2}', JSON.stringify({ ...JSON.parse(json), page: { index: -1, size: 0 } }), JSON.stringify({ ...JSON.parse(json), filters: [{ type: 'nope' }] })]) {
      expect('error' in (parseTableState(bad) as object)).toBe(true)
    }
  })

  test('TE-19 inputs are never mutated; equal inputs give equal outputs', () => {
    const rows = structuredClone(C)
    const state = st({ sort: [{ column: 'name', dir: 'asc' }], filters: [{ type: 'global', query: 'ا' }] })
    const before = JSON.stringify(rows) + serializeTableState(state)
    const a = createTableModel({ rows, rowKey: (r) => r.id, columns: COLS, state, locale: 'ar-EG', availableWidth: 1000 })
    const b = createTableModel({ rows, rowKey: (r) => r.id, columns: COLS, state, locale: 'ar-EG', availableWidth: 1000 })
    expect(JSON.stringify(rows) + serializeTableState(state)).toBe(before)
    expect(a.rows.map((r) => r.key)).toEqual(b.rows.map((r) => r.key))
  })

  test('TE-20 properties (600 seeded cases): sort is a permutation and ordered; filter ⊆ input; pages partition the rows', () => {
    const next = rng(20261108)
    const words = ['أحمد', 'إيمان', 'ايمان', 'Sara', 'مُحَمَّد', 'هالة', 'Zed', '١٢', '3M']
    for (let i = 0; i < 600; i++) {
      const n = 1 + Math.floor(next() * 40)
      const rows: Customer[] = Array.from({ length: n }, (_, j) => ({ ...C[j % 5]!, id: `R${j}`, name: words[Math.floor(next() * words.length)]!, balance: Math.floor(next() * 1000) - 200, qty: next() < 0.2 ? null : String(Math.floor(next() * 50)) }))
      const dir = next() < 0.5 ? 'asc' : 'desc'
      const sorted = model({ sort: [{ column: 'balance', dir }] }, rows)
      expect(new Set(ids(sorted))).toEqual(new Set(rows.map((r) => r.id)))
      const bal = sorted.rows.map((r) => r.row.balance)
      for (let k = 1; k < bal.length; k++) expect(dir === 'asc' ? bal[k]! >= bal[k - 1]! : bal[k]! <= bal[k - 1]!).toBe(true)
      const q = words[Math.floor(next() * words.length)]!
      const filtered = model({ filters: [{ type: 'text', column: 'name', query: q }] }, rows)
      expect(filtered.rows.every((r) => rows.includes(r.row))).toBe(true)
      expect(filtered.filteredRows).toBe(filtered.rows.length)
      const size = 1 + Math.floor(next() * 7)
      const pages = Array.from({ length: model({ page: { index: 0, size } }, rows).pageCount }, (_, p) => ids(model({ page: { index: p, size } }, rows)))
      expect(pages.flat()).toEqual(rows.map((r) => r.id))
    }
  })

  test('TE-21 budget: 100,000 rows — Arabic text filter + two-column sort + page in < 1500 ms (CI margin; budget 250 ms)', () => {
    const regions = ['القاهرة', 'الإسكندرية', 'الجيزة', 'أسوان', 'المنصورة']
    const names = ['أحمد', 'محمد', 'إيمان', 'هالة', 'سامي', 'Sara', 'Omar']
    const rows: Customer[] = Array.from({ length: 100_000 }, (_, i) => ({ id: `R${i}`, name: `${names[i % 7]} ${i}`, phone: `+20 10 ${String(i).padStart(8, '0')}`, region: regions[i % 5]!, balance: (i * 7919) % 1_000_000, since: '2025-01-01', active: i % 2 === 0, qty: String(i % 100) }))
    const t0 = performance.now()
    const m = model({ filters: [{ type: 'text', column: 'name', query: 'احمد' }], sort: [{ column: 'region', dir: 'asc' }, { column: 'balance', dir: 'desc' }], page: { index: 3, size: 50 } }, rows)
    const ms = performance.now() - t0
    expect(m.filteredRows).toBe(Math.ceil(100_000 / 7))
    expect(m.rows).toHaveLength(50)
    expect(ms).toBeLessThan(1500)
    process.stdout.write(`TE-21: 100k rows filter+sort+page in ${ms.toFixed(0)} ms
`)
  })
})
