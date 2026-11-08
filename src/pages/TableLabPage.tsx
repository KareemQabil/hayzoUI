/**
 * Table lab (#/table-lab): the atomic Table on the headless engine, in any visual system × context × language.
 * Query: ?visual=quiet|editorial|soft&context=erp|pos|saas&lang=ar|en (pins a composition for checks and baselines).
 */
import { useEffect, useMemo, useState } from 'react'
import { ExperienceScope, Switch, Table, TextField, type TableColumnDef, type TableState } from '../atomic/components'
import { DEFAULT_TABLE_STATE } from '../atomic/data/table'
import { CONTEXTS, LANGUAGES, VISUAL_SYSTEMS, type ContextId, type LanguageId, type VisualSystemId } from '../atomic/styles/experience'
import { Digits, SegmentedControl } from '../system'
import { numericSpaces, toDisplayDigits } from '../arabic'

interface Customer { id: string; name: string; phone: string; region: string; balance: number; invoices: number; since: string }

const FIRST = ['أحمد', 'إيمان', 'محمد', 'هالة', 'سامي', 'منى', 'يوسف', 'ريم', 'Sara', 'Omar', 'خالد', 'نور']
const LAST = ['السيد', 'عبد الرحمن', 'مؤمن', 'الحلبي', 'Haddad', 'الشمري', 'فهمي', 'Nasser']
const REGIONS = { ar: ['القاهرة', 'الإسكندرية', 'الجيزة', 'المنصورة', 'أسوان'], en: ['Cairo', 'Alexandria', 'Giza', 'Mansoura', 'Aswan'] }

/** Deterministic data: same rows on every load (baselines, checks). */
function makeRows(n: number, lang: LanguageId): Customer[] {
  let seed = 7
  const next = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  return Array.from({ length: n }, (_, i) => ({
    id: `CUS-${String(i + 1).padStart(4, '0')}`,
    name: `${FIRST[Math.floor(next() * FIRST.length)]} ${LAST[Math.floor(next() * LAST.length)]}`,
    phone: `+20 1${Math.floor(next() * 3)} ${String(Math.floor(next() * 1e4)).padStart(4, '0')} ${String(Math.floor(next() * 1e4)).padStart(4, '0')}`,
    region: REGIONS[lang][Math.floor(next() * 5)]!,
    balance: Math.floor(next() * 5_000_000),
    invoices: Math.floor(next() * 40),
    since: `202${Math.floor(next() * 6)}-0${1 + Math.floor(next() * 9)}-1${Math.floor(next() * 9)}`,
  }))
}

const COPY = {
  ar: { label: 'العملاء', search: 'بحث في العملاء', hint: 'بالاسم أو المنطقة، أو بأرقام الهاتف بأي أرقام («٠١٠»).', group: 'تجميع حسب المنطقة', id: 'الرقم', name: 'الاسم', phone: 'الهاتف', region: 'المنطقة', balance: 'الرصيد', invoices: 'الفواتير', since: 'عميل منذ', selected: (n: number) => `${n} محدد` },
  en: { label: 'Customers', search: 'Search customers', hint: 'By name or region, or phone digits in any numerals.', group: 'Group by region', id: 'ID', name: 'Name', phone: 'Phone', region: 'Region', balance: 'Balance', invoices: 'Invoices', since: 'Customer since', selected: (n: number) => `${n} selected` },
} as const

function readQuery() {
  const q = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  const pick = <T extends string>(v: string | null, all: readonly T[], d: T) => (all.includes(v as T) ? (v as T) : d)
  return {
    visual: pick(q.get('visual'), Object.keys(VISUAL_SYSTEMS) as VisualSystemId[], 'quiet'),
    context: pick(q.get('context'), Object.keys(CONTEXTS) as ContextId[], 'erp'),
    language: pick(q.get('lang'), Object.keys(LANGUAGES) as LanguageId[], 'ar'),
  }
}

function Lab({ language }: { language: LanguageId }) {
  const t = COPY[language]
  // Data shown in the scope's numerals: Arabic-Indic in the Arabic experience, U+00A0 between phone groups (R-BIDI-003).
  const n = (v: string | number) => toDisplayDigits(String(v), language === 'ar' ? 'arab' : 'latn')
  const rows = useMemo(() => makeRows(500, language), [language])
  const [query, setQuery] = useState<string | null>(null)
  const [grouped, setGrouped] = useState(false)
  const [selected, setSelected] = useState<readonly string[]>([])
  const [state, setState] = useState<TableState>({ ...DEFAULT_TABLE_STATE, page: { index: 0, size: 10 } })
  const effective: TableState = { ...state, filters: query ? [{ type: 'global', query }] : [], groupBy: grouped ? ['region'] : [] }
  const columns = useMemo<TableColumnDef<Customer>[]>(() => [
    { key: 'id', header: t.id, accessor: (r) => r.id, pin: 'start', width: 112 },
    { key: 'name', header: t.name, accessor: (r) => r.name, flex: 2, minWidth: 180 },
    { key: 'phone', header: t.phone, accessor: (r) => r.phone, width: 170, cell: (r) => <bdi dir="ltr">{n(numericSpaces(r.phone))}</bdi> },
    { key: 'region', header: t.region, accessor: (r) => r.region, width: 130 },
    { key: 'since', header: t.since, accessor: (r) => r.since, type: 'date', width: 130, cell: (r) => <bdi dir="ltr">{n(r.since)}</bdi> },
    { key: 'invoices', header: t.invoices, accessor: (r) => r.invoices, type: 'number', aggregate: 'sum', width: 100 },
    { key: 'balance', header: t.balance, accessor: (r) => r.balance, type: 'money', currency: 'EGP', aggregate: 'sum', pin: 'end', width: 150 },
  ], [t])

  return (
    <div className="grid gap-4" style={{ color: 'var(--hz-color-text-primary)' }}>
      <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <TextField label={t.search} description={t.hint} value={query} onValueChange={(v) => { setQuery(v); setState((s) => ({ ...s, page: s.page ? { ...s.page, index: 0 } : null })) }} type="search" />
        <Switch label={t.group} checked={grouped} onCheckedChange={setGrouped} />
      </div>
      <p data-lab-selected="" style={{ margin: 0, color: 'var(--hz-color-text-secondary)' }}>{n(t.selected(selected.length))}</p>
      <Table label={t.label} rows={rows} rowKey={(r) => r.id} columns={columns} state={effective} onStateChange={(s) => setState({ ...s, filters: state.filters, groupBy: state.groupBy })} selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected} summary />
    </div>
  )
}

export function TableLabPage() {
  const [sel, setSel] = useState(readQuery)
  useEffect(() => {
    const sync = () => setSel(readQuery())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  const go = (patch: Partial<typeof sel>) => {
    const next = { ...sel, ...patch }
    window.location.hash = `#/table-lab?visual=${next.visual}&context=${next.context}&lang=${next.language}`
  }
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-10 md:px-8">
      <header className="mb-8 max-w-[72ch]">
        <p className="t-eyebrow mb-2">المعمارية الذرّية · الجدول</p>
        <h1 className="t-h1 text-fg">جدول واحد، كل التجارب</h1>
        <p className="t-body-lg mt-3 text-fg-2">
          <Digits>{'نفس مكوّن الجدول ونفس المحرك: فرز بعدة أعمدة (Shift)، بحث عربي متسامح وبأرقام الهاتف، تجميع، تحديد، إجماليات بالقرش، صفحات، وأعمدة مثبتة منطقيًا. 500 عميل تجريبي.'}</Digits>
        </p>
      </header>
      <div className="mb-6 flex flex-wrap gap-4" data-lab-controls="">
        <SegmentedControl label="النظام البصري" value={sel.visual} onValueChange={(v) => go({ visual: v })} options={(Object.keys(VISUAL_SYSTEMS) as VisualSystemId[]).map((v) => ({ value: v, label: VISUAL_SYSTEMS[v].asset.name }))} />
        <SegmentedControl label="السياق" value={sel.context} onValueChange={(v) => go({ context: v })} options={(Object.keys(CONTEXTS) as ContextId[]).map((c) => ({ value: c, label: CONTEXTS[c].asset.name }))} />
        <SegmentedControl label="اللغة" value={sel.language} onValueChange={(v) => go({ language: v })} options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]} />
      </div>
      <ExperienceScope key={`${sel.visual}-${sel.context}-${sel.language}`} selection={sel} className="rounded-[var(--ax-radius-surface)] border border-line-2 p-4 md:p-6" >
        <div data-table-lab={`${sel.visual}/${sel.context}/${sel.language}`} style={{ background: 'var(--hz-color-surface-raised)' }}>
          <Lab language={sel.language} />
        </div>
      </ExperienceScope>
    </div>
  )
}
