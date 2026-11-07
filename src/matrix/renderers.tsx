/**
 * Matrix renderers: how each spec state, content variant and visual variant becomes real props on a
 * real component. The matrix page renders (spec.states + spec.variants) × spec.content from these;
 * a missing case is a visible gap (data-matrix-missing) and fails BR-MX-01.
 * hover / focus-visible / pressed are not props: the page scopes them with data-force-scope
 * (src/matrix/force-states.ts), so renderers draw those states as default.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import type { DisplayNumerals } from '../arabic'
import {
  AutoText,
  Badge,
  Button,
  CurrencyInput,
  DataTable,
  Dialog,
  Drawer,
  EmptyState,
  IconButton,
  InlineMessage,
  NumberText,
  PhoneInput,
  SearchField,
  SegmentedControl,
  Select,
  Switch,
  Tabs,
  TextField,
  ToastCard,
  type BadgeTone,
  type CurrencyInputHandle,
  type MessageTone,
  type Tone,
  type Variant,
} from '../system'
import { CalendarPreview, Combobox, ComboboxListPreview, DatePicker } from '../system/aria'

export interface MatrixCase {
  state: string
  content: string
  /** A visual variant row: one prop set to one value, in the default state. */
  variant?: { prop: string; value: string }
}

export interface MatrixRenderer {
  /** Display numerals a content variant needs (e.g. arabic-digits). Default: the page setting. */
  numerals?: (content: string) => DisplayNumerals | undefined
  /** Returns null when the case has no renderer yet. */
  render: (c: MatrixCase) => ReactNode | null
}

/** States drawn through data-force-scope rather than props. */
export const FORCED = new Set(['hover', 'focus-visible', 'pressed'])
const asDefault = (state: string) => (FORCED.has(state) ? 'default' : state)
const arabicDigits = (content: string) => (content === 'arabic-digits' ? 'arab' : undefined)

/** Applies a draft after mount, the way a person would type it, to reach states props cannot express. */
function WithDraft({ draft, children }: { draft: string; children: (ref: React.RefObject<CurrencyInputHandle | null>) => ReactNode }) {
  const ref = useRef<CurrencyInputHandle>(null)
  useEffect(() => {
    ref.current?.setDraft(draft)
  }, [draft])
  return <>{children(ref)}</>
}

/** Text per content variant, shared by components whose content is a label or a line of text. */
const TEXT: Record<string, { label: string; value: string }> = {
  short: { label: 'اسم العميل', value: 'هالة مؤمن' },
  'long-arabic': { label: 'اسم العميل كما يظهر في السجل التجاري والبطاقة الضريبية', value: 'شركة النيل المتحدة للتوريدات والمقاولات العامة والاستيراد والتصدير' },
  mixed: { label: 'اسم العميل', value: 'أحمد Khaled' },
  latin: { label: 'اسم العميل', value: 'Sara Haddad' },
  'latin-first': { label: 'اسم العميل', value: 'Dr. سامي الحلبي' },
  'ltr-island': { label: 'رقم الفاتورة', value: 'INV-2026-0148' },
  diacritics: { label: 'اسم العميل', value: 'مُحَمَّد السَّيِّد' },
  'arabic-digits': { label: 'الكمية', value: '١٢٣٤' },
  overflow: { label: 'الملاحظات', value: 'ملاحظة طويلة جدًا بلا مسافات: INV-2026-0148-INV-2026-0149-INV-2026-0150-INV-2026-0151' },
}
const text = (content: string) => TEXT[content] ?? null

const CURRENCY_CONTENT: Record<string, { label: string; value: number | null; helper?: string }> = {
  short: { label: 'المبلغ', value: 5000 },
  'arabic-digits': { label: 'المبلغ المستلم', value: 123450 },
  overflow: { label: 'المبلغ المستلم', value: 99999999999999 },
  'long-arabic': {
    label: 'المبلغ المستلم من العميل عن فاتورة توريد الأدوات المكتبية لشهر جمادى الأولى',
    value: 123450,
    helper: 'يُسجَّل المبلغ في دفتر العميل ويظهر في كشف الحساب الشهري المرسل إلى البريد المسجل.',
  },
}

const ROWS = [
  { id: 'CUS-0001', name: 'أحمد Khaled', phone: '+20 10 1234 5678', balance: '1,234.50' },
  { id: 'CUS-0002', name: 'إيمان عبد الرحمن', phone: '+20 11 2345 6789', balance: '0.00' },
  { id: 'CUS-0003', name: 'مُحَمَّد السيد', phone: '+20 12 3456 7890', balance: '87,500.00' },
]
type Row = (typeof ROWS)[number]

const CUSTOMERS = [
  { value: 'CUS-0001', label: 'أحمد Khaled', description: '+20 10 1234 5678' },
  { value: 'CUS-0002', label: 'إيمان عبد الرحمن', description: '+20 11 2345 6789' },
  { value: 'CUS-0003', label: 'مُحَمَّد السيد', description: '+20 12 3456 7890' },
  { value: 'CUS-0004', label: 'شركة النيل المتحدة للتوريدات والمقاولات العامة والاستيراد والتصدير', description: '+20 15 4567 8901' },
  { value: 'CUS-0008', label: 'Sara Haddad', description: '+20 11 5556 6677' },
  { value: 'CUS-0011', label: 'Dr. سامي الحلبي', description: '+20 10 1122 3344' },
]
/** Query typed for each content variant, and the item it selects. */
const COMBO_CONTENT: Record<string, { query: string; selected: string }> = {
  short: { query: 'احمد', selected: 'CUS-0001' },
  mixed: { query: 'Khaled', selected: 'CUS-0001' },
  diacritics: { query: 'محمد', selected: 'CUS-0003' },
  'arabic-digits': { query: '٠١٠١', selected: 'CUS-0001' },
  'long-arabic': { query: 'النيل', selected: 'CUS-0004' },
  latin: { query: 'sara', selected: 'CUS-0008' },
  'latin-first': { query: 'سامي', selected: 'CUS-0011' },
}

export const RENDERERS: Record<string, MatrixRenderer> = {
  combobox: {
    numerals: arabicDigits,
    render: ({ state, content }) => {
      const c = COMBO_CONTENT[content]
      if (!c) return null
      const common = { label: 'العميل', items: CUSTOMERS, placeholder: 'اكتب الاسم أو رقم الهاتف' }
      switch (asDefault(state)) {
        case 'default':
          return <Combobox {...common} defaultValue={c.selected} />
        case 'empty':
          return <Combobox {...common} />
        case 'open':
          return (
            <div className="flex flex-col gap-1">
              <Combobox {...common} />
              <ComboboxListPreview items={CUSTOMERS.filter((i) => i.value === c.selected)} query={c.query} />
            </div>
          )
        case 'invalid':
          return <Combobox {...common} error="اختر عميلًا من القائمة." />
        case 'disabled':
          return <Combobox {...common} defaultValue={c.selected} disabled />
        case 'readonly':
          return <Combobox {...common} defaultValue={c.selected} readOnly />
        default:
          return null
      }
    },
  },

  'date-picker': {
    numerals: arabicDigits,
    render: ({ state, content }) => {
      if (!['short', 'arabic-digits', 'long-arabic'].includes(content)) return null
      const long = content === 'long-arabic'
      const label = long ? 'تاريخ استحقاق القسط الأول حسب العقد الموقّع مع العميل' : 'تاريخ الاستحقاق'
      const calendar = long ? ('islamic-umalqura' as const) : ('gregory' as const)
      const common = { label, calendar, helper: long ? 'يُعرض بالتقويم الهجري ويُخزَّن ميلاديًا.' : undefined }
      switch (asDefault(state)) {
        case 'default':
          return <DatePicker {...common} defaultValue="2026-11-05" />
        case 'empty':
          return <DatePicker {...common} />
        case 'open':
          return <CalendarPreview value="2026-11-05" calendar={calendar} />
        case 'invalid':
          return <DatePicker {...common} defaultValue="2026-11-05" error="التاريخ بعد آخر موعد مسموح به." />
        case 'disabled':
          return <DatePicker {...common} defaultValue="2026-11-05" disabled />
        case 'readonly':
          return <DatePicker {...common} defaultValue="2026-11-05" readOnly />
        default:
          return null
      }
    },
  },

  'currency-input': {
    numerals: arabicDigits,
    render: ({ state, content }) => {
      const c = CURRENCY_CONTENT[content]
      if (!c) return null
      const common = { label: c.label, helper: c.helper, currency: 'EGP' as const }
      switch (state) {
        case 'default':
          return <CurrencyInput {...common} defaultValue={c.value} />
        case 'hover':
          return <CurrencyInput {...common} defaultValue={c.value} forceState="hover" />
        case 'focus-visible':
          return <CurrencyInput {...common} defaultValue={c.value} forceState="focus-visible" />
        case 'empty':
          return <CurrencyInput {...common} defaultValue={null} />
        case 'invalid':
          return <WithDraft draft="1234,50">{(ref) => <CurrencyInput ref={ref} {...common} />}</WithDraft>
        case 'disabled':
          return <CurrencyInput {...common} defaultValue={c.value} disabled />
        case 'readonly':
          return <CurrencyInput {...common} defaultValue={c.value} readOnly />
        case 'required':
          return <CurrencyInput {...common} defaultValue={null} showValidation />
        default:
          return null
      }
    },
  },

  'phone-input': {
    numerals: arabicDigits,
    render: ({ state, content }) => {
      const label = content === 'long-arabic' ? 'رقم المحمول الذي سيصل عليه إيصال التحصيل ورسائل التذكير' : 'رقم المحمول'
      const common = { label, helper: content === 'long-arabic' ? 'نستخدمه للإيصالات فقط ولا نشاركه مع أي جهة.' : undefined }
      const valid = '+201012345678'
      switch (asDefault(state)) {
        case 'default':
          return <PhoneInput {...common} defaultValue={valid} />
        case 'invalid':
          return <PhoneInput {...common} defaultValue="+20101234" showValidation />
        case 'disabled':
          return <PhoneInput {...common} defaultValue={valid} disabled />
        case 'required':
          return <PhoneInput {...common} defaultValue={null} showValidation />
        default:
          return null
      }
    },
  },

  'text-field': {
    render: ({ state, content }) => {
      const t = text(content)
      if (!t) return null
      const props = { label: t.label, defaultValue: t.value, contentDir: 'auto' as const, mono: content === 'ltr-island' }
      switch (asDefault(state)) {
        case 'default':
          return <TextField {...props} />
        case 'invalid':
          return <TextField {...props} error="اكتب الاسم كاملًا كما يظهر في سجلات العميل." />
        case 'disabled':
          return <TextField {...props} disabled />
        case 'readonly':
          return <TextField {...props} readOnly />
        default:
          return null
      }
    },
  },

  'search-field': {
    numerals: arabicDigits,
    render: ({ state, content }) => {
      const q: Record<string, string> = { short: 'احمد', mixed: 'Khaled', diacritics: 'مُحَمَّد', 'arabic-digits': '٠١٠' }
      if (!(content in q)) return null
      const s = asDefault(state)
      if (s !== 'default' && s !== 'empty') return null
      return <SearchField label="ابحث عن عميل" placeholder="اسم، أو رقم هاتف، أو CUS-0001" defaultValue={s === 'empty' ? null : q[content]} status={s === 'empty' ? undefined : '٣ نتائج'} />
    },
  },

  button: {
    render: ({ state, content, variant }) => {
      const label = content === 'long-arabic' ? 'تحصيل المبلغ وإرسال الإيصال إلى العميل' : 'تحصيل المبلغ'
      const v = variant ? { [variant.prop]: variant.value } : {}
      switch (asDefault(state)) {
        case 'default':
          return <Button iconStart="wallet" {...(v as { variant?: Variant; tone?: Tone })}>{label}</Button>
        case 'disabled':
          return <Button iconStart="wallet" disabled>{label}</Button>
        case 'loading':
          return <Button iconStart="wallet" loading loadingLabel="جارٍ التحصيل…">{label}</Button>
        default:
          return null
      }
    },
  },

  'icon-button': {
    render: ({ state, variant }) => {
      const v = variant ? { [variant.prop]: variant.value } : {}
      switch (asDefault(state)) {
        case 'default':
          return <IconButton icon="copy" label="نسخ رقم الفاتورة" {...(v as { variant?: Variant; tone?: Tone })} />
        case 'disabled':
          return <IconButton icon="copy" label="نسخ رقم الفاتورة" disabled />
        default:
          return null
      }
    },
  },

  select: {
    render: ({ state, content }) => {
      const long = content === 'long-arabic'
      const options = [
        { value: 'cairo', label: long ? 'القاهرة الكبرى ومحافظات الدلتا والقناة' : 'القاهرة' },
        { value: 'alex', label: 'الإسكندرية' },
      ]
      const label = long ? 'المنطقة التي يغطيها مندوب التحصيل' : 'المنطقة'
      switch (asDefault(state)) {
        case 'default':
          return <Select label={label} options={options} />
        case 'disabled':
          return <Select label={label} options={options} disabled />
        default:
          return null
      }
    },
  },

  'segmented-control': {
    numerals: arabicDigits,
    render: ({ state, content }) => {
      const labels: Record<string, string[]> = { short: ['يوم', 'أسبوع', 'شهر'], 'arabic-digits': ['٧ أيام', '٣٠ يومًا', '٩٠ يومًا'], 'long-arabic': ['آخر سبعة أيام', 'الشهر الحالي حتى اليوم', 'الربع المالي'] }
      const l = labels[content]
      if (!l) return null
      const s = asDefault(state)
      const options = l.map((label, i) => ({ value: String(i), label, disabled: s === 'disabled' && i === 2 }))
      if (s === 'default') return <SegmentedControl label="الفترة" options={options} />
      if (s === 'checked') return <SegmentedControl label="الفترة" options={options} defaultValue="1" />
      if (s === 'disabled') return <SegmentedControl label="الفترة" options={options} />
      return null
    },
  },

  switch: {
    render: ({ state, content }) => {
      const long = content === 'long-arabic'
      const props = { label: long ? 'إرسال رسالة تذكير للعميل قبل موعد السداد بثلاثة أيام' : 'تذكير بالسداد', description: long ? 'تُرسل الرسالة على رقم المحمول المسجل، ويمكن للعميل إيقافها.' : undefined }
      switch (asDefault(state)) {
        case 'default':
          return <Switch {...props} />
        case 'checked':
          return <Switch {...props} defaultChecked />
        case 'disabled':
          return <Switch {...props} disabled />
        default:
          return null
      }
    },
  },

  tabs: {
    numerals: arabicDigits,
    render: ({ state, content }) => {
      const long = content === 'long-arabic'
      const items = [
        { value: 'a', label: long ? 'التحصيلات المسجلة هذا الشهر' : 'التحصيلات', count: content === 'arabic-digits' ? '١٢' : undefined },
        { value: 'b', label: long ? 'الفواتير المستحقة والمتأخرة' : 'الفواتير' },
        { value: 'c', label: 'الملاحظات' },
      ]
      const s = asDefault(state)
      if (s === 'default') return <Tabs idBase={`mx-${content}`} label="أقسام العميل" items={items} />
      if (s === 'selected') return <Tabs idBase={`mx-${content}`} label="أقسام العميل" items={items} defaultValue="b" />
      return null
    },
  },

  dialog: {
    render: ({ state, content }) => {
      if (state === 'closed') return <p className="t-caption text-fg-2">مغلق: لا يُرسم شيء ولا يبقى في شجرة الوصول.</p>
      if (state !== 'open') return null
      const long = content === 'long-arabic'
      return (
        <Dialog
          presentation="inline"
          open
          onOpenChange={() => {}}
          title={long ? 'تأكيد تحصيل المبلغ وإصدار الإيصال الإلكتروني للعميل' : 'إضافة عميل'}
          description={long ? 'بعد التأكيد يُسجَّل المبلغ في دفتر العميل ويُرسل الإيصال برسالة نصية، ولا يمكن التراجع إلا بقيد عكسي.' : undefined}
          footer={
            <>
              <Button>{long ? 'تأكيد التحصيل وإرسال الإيصال' : 'إضافة العميل'}</Button>
              <Button variant="ghost" tone="neutral">إلغاء</Button>
            </>
          }
        >
          <TextField label="اسم العميل" defaultValue="هالة مؤمن" />
        </Dialog>
      )
    },
  },

  drawer: {
    render: ({ state, content }) => {
      if (state === 'closed') return <p className="t-caption text-fg-2">مغلق: لا يُرسم شيء ولا يبقى في شجرة الوصول.</p>
      if (state !== 'open') return null
      const long = content === 'long-arabic'
      return (
        <Drawer presentation="inline" open onOpenChange={() => {}} title={long ? 'تصفية العملاء حسب المنطقة وحالة السداد وتاريخ آخر تحصيل' : 'تصفية'}>
          <Select label="المنطقة" options={[{ value: 'cairo', label: 'القاهرة' }, { value: 'alex', label: 'الإسكندرية' }]} />
        </Drawer>
      )
    },
  },

  'data-table': {
    numerals: arabicDigits,
    render: ({ state, content }) => {
      if (!(content in TEXT)) return null
      const rows: Row[] = content === 'long-arabic' || content === 'latin' || content === 'latin-first' ? ROWS.map((r, i) => (i === 0 ? { ...r, name: TEXT[content].value } : r)) : content === 'overflow' ? ROWS.map((r, i) => (i === 0 ? { ...r, id: TEXT.overflow.value } : r)) : ROWS
      const columns = [
        { key: 'id', header: 'الرقم', cell: (r: Row) => <bdi dir="ltr" className="ax-mono">{r.id}</bdi>, nowrap: true },
        { key: 'name', header: 'الاسم', cell: (r: Row) => <AutoText>{r.name}</AutoText> },
        { key: 'balance', header: 'الرصيد', cell: (r: Row) => <bdi dir="ltr" className="ax-num"><NumberText>{r.balance}</NumberText></bdi>, numeric: true, align: 'end' as const },
      ]
      const s = asDefault(state)
      if (s === 'default') return <DataTable label="العملاء" columns={columns} rows={rows} rowKey={(r) => r.id} minWidth={420} />
      if (s === 'selected') return <DataTable label="العملاء" columns={columns} rows={rows} rowKey={(r) => r.id} selectedKey="CUS-0002" minWidth={420} />
      if (s === 'empty') return <DataTable label="العملاء" columns={columns} rows={[]} rowKey={(r) => r.id} empty={<EmptyState title="لا يوجد عملاء بهذا الاسم">جرّب الاسم دون همزات أو ابحث برقم الهاتف.</EmptyState>} />
      return null
    },
  },

  'inline-message': {
    render: ({ state, content, variant }) => {
      if (asDefault(state) !== 'default') return null
      const long = content === 'long-arabic'
      const tone = (variant?.prop === 'tone' ? variant.value : 'info') as MessageTone
      return (
        <InlineMessage tone={tone} title={long ? 'تعذّر حفظ التحصيل لأن الاتصال بالخادم انقطع أثناء الإرسال' : 'تعذّر الحفظ'}>
          {long ? 'المبلغ ما زال في النموذج كما كتبته. تحقق من الاتصال ثم أعد المحاولة؛ لن يُسجَّل مرتين.' : 'أعد المحاولة.'}
        </InlineMessage>
      )
    },
  },

  toast: {
    render: ({ state, content, variant }) => {
      if (asDefault(state) !== 'default') return null
      const tone = (variant?.prop === 'tone' ? variant.value : 'success') as MessageTone
      return content === 'long-arabic' ? (
        <ToastCard tone={tone} title="سُجّل التحصيل وأُرسل الإيصال إلى العميل" body="يظهر المبلغ في كشف الحساب خلال دقائق، ويمكنك طباعة الإيصال من صفحة العميل." />
      ) : (
        <ToastCard tone={tone} title="حُفظت التغييرات" />
      )
    },
  },

  badge: {
    numerals: arabicDigits,
    render: ({ state, content, variant }) => {
      if (asDefault(state) !== 'default') return null
      const label: Record<string, string> = { short: 'مدفوع', 'arabic-digits': 'متأخر ١٢ يومًا', 'long-arabic': 'بانتظار مراجعة المحاسب' }
      if (!(content in label)) return null
      const tone = (variant?.prop === 'tone' ? variant.value : 'neutral') as BadgeTone
      return <Badge tone={tone} dot>{label[content]}</Badge>
    },
  },

  'empty-state': {
    render: ({ state, content }) => {
      if (asDefault(state) !== 'default') return null
      return content === 'long-arabic' ? (
        <EmptyState title="لا توجد تحصيلات مسجلة لهذا العميل في الفترة المحددة" action={<Button variant="outline" iconStart="plus">تسجيل تحصيل</Button>}>
          غيّر الفترة من أعلى الصفحة، أو سجّل أول تحصيل إذا كان العميل جديدًا.
        </EmptyState>
      ) : (
        <EmptyState title="لا نتائج">جرّب كلمة أخرى.</EmptyState>
      )
    },
  },
}
