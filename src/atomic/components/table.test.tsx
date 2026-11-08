// @vitest-environment jsdom
import fs from 'node:fs'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { ALL_SELECTIONS, resolveExperienceStyle, type ExperienceSelection } from '../styles/experience'
import { ExperienceScope, Table, TABLE_CONTRACT, groupKey, type TableColumnDef } from './index'

afterEach(cleanup)

interface Row { id: string; name: string; region: string; balance: number; qty: string | null; children?: Row[] }
const ROWS: Row[] = [
  { id: 'CUS-1', name: 'أحمد Khaled', region: 'القاهرة', balance: 123450, qty: '12' },
  { id: 'CUS-2', name: 'إيمان عبد الرحمن', region: 'الإسكندرية', balance: 0, qty: '3' },
  { id: 'CUS-3', name: 'هالة مؤمن', region: 'القاهرة', balance: 8750000, qty: null },
]
const COLS: TableColumnDef<Row>[] = [
  { key: 'id', header: 'الرقم', accessor: (r) => r.id, pin: 'start', width: 100 },
  { key: 'name', header: 'الاسم', accessor: (r) => r.name, flex: 1 },
  { key: 'region', header: 'المنطقة', accessor: (r) => r.region, width: 120 },
  { key: 'balance', header: 'الرصيد', accessor: (r) => r.balance, type: 'money', aggregate: 'sum', pin: 'end', width: 140 },
  { key: 'qty', header: 'الكمية', accessor: (r) => r.qty, type: 'number', width: 80, sortable: false },
]
const AR: ExperienceSelection = { visual: 'quiet', context: 'saas', language: 'ar' }
const inScope = (ui: React.ReactNode, s: ExperienceSelection = AR) => render(<ExperienceScope selection={s}>{ui}</ExperienceScope>)
const bodyIds = () => within(screen.getByRole('table')).getAllByRole('row').slice(1).map((r) => r.querySelector('td:not([data-slot])')?.textContent)

describe('Table', () => {
  test('TB-01 sorting: header button cycles none → ascending → descending → none, with aria-sort; unsortable has none', () => {
    inScope(<Table label="العملاء" rows={ROWS} rowKey={(r) => r.id} columns={COLS} />)
    const th = screen.getByRole('columnheader', { name: /الرصيد/ })
    expect(th.getAttribute('aria-sort')).toBe('none')
    const button = within(th).getByRole('button')
    fireEvent.click(button)
    expect(th.getAttribute('aria-sort')).toBe('ascending')
    expect(bodyIds()).toEqual(['CUS-2', 'CUS-1', 'CUS-3'])
    fireEvent.click(button)
    expect(th.getAttribute('aria-sort')).toBe('descending')
    expect(bodyIds()).toEqual(['CUS-3', 'CUS-1', 'CUS-2'])
    fireEvent.click(button)
    expect(th.getAttribute('aria-sort')).toBe('none')
    expect(screen.getByRole('columnheader', { name: 'الكمية' }).hasAttribute('aria-sort')).toBe(false)
  })

  test('TB-02 Shift+click adds a column to a multi-sort and shows its rank', () => {
    const onStateChange = vi.fn()
    inScope(<Table label="t" rows={ROWS} rowKey={(r) => r.id} columns={COLS} onStateChange={onStateChange} />)
    fireEvent.click(within(screen.getByRole('columnheader', { name: /المنطقة/ })).getByRole('button'))
    fireEvent.click(within(screen.getByRole('columnheader', { name: /الرصيد/ })).getByRole('button'), { shiftKey: true })
    expect(onStateChange.mock.lastCall![0].sort).toEqual([{ column: 'region', dir: 'asc' }, { column: 'balance', dir: 'asc' }])
    expect(document.querySelectorAll("[data-slot='sort-rank']")).toHaveLength(2)
  })

  test('TB-03 selection: rows carry aria-selected; the header box selects the page and shows mixed when partial', () => {
    const onSelectionChange = vi.fn()
    inScope(<Table label="t" rows={ROWS} rowKey={(r) => r.id} columns={COLS} selectionMode="multiple" onSelectionChange={onSelectionChange} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'تحديد CUS-2' }))
    expect(onSelectionChange).toHaveBeenLastCalledWith(['CUS-2'])
    const all = screen.getByRole('checkbox', { name: 'تحديد كل صفوف الصفحة' }) as HTMLInputElement
    expect(all.indeterminate).toBe(true)
    expect(screen.getAllByRole('row')[2]!.getAttribute('aria-selected')).toBe('true')
    fireEvent.click(all)
    expect(onSelectionChange).toHaveBeenLastCalledWith(['CUS-2', 'CUS-1', 'CUS-3'])
    fireEvent.click(all)
    expect(onSelectionChange).toHaveBeenLastCalledWith([])
  })

  test('TB-04 money is formatted from minor units in the scope numerals; the summary totals all filtered rows', () => {
    inScope(<Table label="t" rows={ROWS} rowKey={(r) => r.id} columns={COLS} summary />)
    const cells = [...document.querySelectorAll('tbody td[data-numeric]')].map((c) => c.textContent)
    // Arabic-Indic groups are separated by U+202F (CONTRACTS: arabic.amount.v1), never an ASCII space.
    expect(cells).toContain('١ ٢٣٤٫٥٠')
    expect(document.querySelector('tfoot')?.textContent).toContain('٨٨ ٧٣٤٫٥٠')
    cleanup()
    inScope(<Table label="t" rows={ROWS} rowKey={(r) => r.id} columns={COLS} summary />, { ...AR, language: 'en' })
    expect(document.querySelector('tfoot')?.textContent).toContain('88,734.50')
  })

  test('TB-05 tree rows and groups: toggles with aria-expanded and action labels', () => {
    const tree: Row[] = [{ ...ROWS[0]!, children: [{ ...ROWS[1]!, id: 'CUS-1-A' }] }, ROWS[2]!]
    inScope(<Table label="t" rows={tree} rowKey={(r) => r.id} columns={COLS} getChildren={(r) => r.children} />)
    const toggle = screen.getByRole('button', { name: 'توسيع CUS-1' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('CUS-1-A')).toBeNull()
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'طي CUS-1' }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('CUS-1-A')).toBeTruthy()
    cleanup()
    inScope(<Table label="t" rows={ROWS} rowKey={(r) => r.id} columns={COLS} defaultState={{ groupBy: ['region'], expanded: new Set([groupKey([{ column: 'region', value: 'القاهرة' }])]) }} />)
    expect(screen.getByRole('button', { name: 'طي المنطقة: القاهرة' })).toBeTruthy()
    expect(screen.getByText('(٢)')).toBeTruthy()
  })

  test('TB-06 pagination: status, page size and previous/next in the scope numerals', () => {
    const many = Array.from({ length: 23 }, (_, i) => ({ ...ROWS[0]!, id: `R-${String(i).padStart(2, '0')}` }))
    inScope(<Table label="t" rows={many} rowKey={(r) => r.id} columns={COLS} defaultState={{ page: { index: 0, size: 10 } }} />)
    expect(screen.getByText('١–١٠ من ٢٣')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
    expect(screen.getByText('صفحة ٢ من ٣')).toBeTruthy()
    fireEvent.change(screen.getByRole('combobox', { name: 'عدد الصفوف في الصفحة' }), { target: { value: '25' } })
    expect(screen.getByText('١–٢٣ من ٢٣')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'التالي' }) as HTMLButtonElement).disabled).toBe(true)
  })

  test('TB-07 pinned columns use logical insets; empty and loading states', () => {
    inScope(<Table label="t" rows={ROWS} rowKey={(r) => r.id} columns={COLS} selectionMode="multiple" />)
    const id = screen.getByRole('columnheader', { name: /الرقم/ })
    expect(id.getAttribute('data-pin')).toBe('start')
    expect(id.style.insetInlineStart).toBe('48px') // after the pinned selection column
    expect(screen.getByRole('columnheader', { name: /الرصيد/ }).style.insetInlineEnd).toBe('0px')
    cleanup()
    inScope(<Table label="t" rows={[]} rowKey={(r: Row) => r.id} columns={COLS} />)
    expect(screen.getByText('لا توجد بيانات مطابقة.')).toBeTruthy()
    cleanup()
    const { container } = inScope(<Table label="t" rows={[]} rowKey={(r: Row) => r.id} columns={COLS} loading />)
    expect(container.querySelector("[data-hz='table']")?.getAttribute('aria-busy')).toBe('true')
  })

  test('TB-INV-01 identical behavior DOM in all 18 compositions', () => {
    const shape = (el: Element): string => {
      const attrs = [...el.attributes].filter((a) => /^(aria-(?!label|describedby|labelledby)|data-(hz|slot|pin|numeric|selected|group)$|role$|type$|scope$|colspan$)/.test(a.name)).map((a) => `${a.name}=${a.value}`).sort()
      return `<${el.tagName.toLowerCase()} ${attrs.join(' ')}>${[...el.children].map(shape).join('')}</>`
    }
    const shapes = new Set<string>()
    for (const s of ALL_SELECTIONS) {
      const { container } = inScope(<Table label="t" rows={ROWS} rowKey={(r) => r.id} columns={COLS} selectionMode="multiple" summary defaultState={{ page: { index: 0, size: 10 } }} />, s)
      shapes.add(shape(container.querySelector("[data-hz='table'] table")!))
      cleanup()
    }
    expect(shapes.size).toBe(1)
  })

  test('TB-ST-01 every table token resolves in every composition; contexts set row height (ERP 32 · SaaS 40 · POS 52)', () => {
    const used = [...new Set([...fs.readFileSync('src/atomic/styles/recipes/table.css', 'utf8').matchAll(/var\((--hz-[a-z0-9-]+)/g)].map((m) => m[1]!))]
    const fromTsx = [...fs.readFileSync('src/atomic/components/table.tsx', 'utf8').matchAll(/var\((--hz-[a-z0-9-]+)/g)].map((m) => m[1]!)
    for (const s of ALL_SELECTIONS) {
      const r = resolveExperienceStyle(s)
      if (!r.ok) throw new Error(JSON.stringify(r.issues))
      expect([...used, ...fromTsx].filter((v) => !(v in r.style.variables))).toEqual([])
    }
    const h = (context: ExperienceSelection['context']) => (resolveExperienceStyle({ ...AR, context }) as { ok: true; style: { variables: Record<string, string> } }).style.variables['--hz-component-table-row-height']
    expect([h('erp'), h('saas'), h('pos')]).toEqual(['32px', '40px', '52px'])
    expect(TABLE_CONTRACT.anatomy.filter((s) => s !== 'root').every((s) => fs.readFileSync('src/atomic/components/table.tsx', 'utf8').includes(`data-slot="${s}"`))).toBe(true)
  })
})
