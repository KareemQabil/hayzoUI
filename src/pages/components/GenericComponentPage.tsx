import { useState, type ReactNode } from 'react'
import { DEFAULT_SEARCH, matchText, STRICT_SEARCH } from '../../arabic'
import { getRule, type ComponentRecord } from '../../knowledge'
import { automatedFor } from '../../knowledge/evidence'
import {
  Badge,
  Digits,
  Button,
  DataTable,
  Dialog,
  Drawer,
  EmptyState,
  Highlight,
  IconButton,
  InlineMessage,
  LtrIsland,
  PhoneInput,
  SearchField,
  SegmentedControl,
  Select,
  Switch,
  Tabs,
  TextField,
  useToast,
} from '../../system'
import { Dl, MaturityBadge, RefLink, RelationshipBadge, Section } from '../../app/ui'
import { AutomatedBadge } from '../EvidencePage'

const NAMES = ['أحمد Khaled', 'إيمان عبد الرحمن', 'ايمان عبدالرحمن', 'مُحَمَّد السيد', 'هالة مؤمن']

function SearchDemo() {
  const [q, setQ] = useState('احمد')
  const [tolerant, setTolerant] = useState(true)
  const rows = NAMES.map((n) => ({ n, m: matchText(q, n, tolerant ? DEFAULT_SEARCH : STRICT_SEARCH) })).filter((x) => x.m.match)
  return (
    <div className="flex flex-col gap-4">
      <SearchField label="ابحث عن عميل" value={q} onValueChange={setQ} status={`${rows.length} نتيجة`} />
      <Switch label="مطابقة متسامحة مع الهمزة والتشكيل" checked={tolerant} onCheckedChange={setTolerant} />
      <ul className="divide-y divide-line border-y border-line">
        {rows.map((r) => (
          <li key={r.n} className="py-2 t-body">
            <Highlight text={r.n} ranges={r.m.ranges} />
          </li>
        ))}
        {!rows.length ? <li className="py-2 t-body text-fg-2">لا نتائج.</li> : null}
      </ul>
    </div>
  )
}

function OverlayDemo({ kind }: { kind: 'dialog' | 'drawer' }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const C = kind === 'dialog' ? Dialog : Drawer
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {kind === 'dialog' ? 'افتح الحوار' : 'افتح اللوح'}
      </Button>
      <C open={open} onOpenChange={setOpen} title={kind === 'dialog' ? 'إعادة تسمية الفرع' : 'تفاصيل الفرع'} description="التركيز يدخل أول حقل، وTab محبوس، وEscape يغلق ويعيد التركيز إلى الزر." footer={<><Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button><Button onClick={() => setOpen(false)}>حفظ</Button></>}>
        <TextField label="اسم الفرع" value={name} onValueChange={setName} placeholder="فرع مدينة نصر" />
      </C>
    </>
  )
}

function ToastDemo() {
  const toast = useToast()
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast({ tone: 'success', title: 'حُفظت التغييرات' })}>إشعار نجاح</Button>
      <Button variant="outline" onClick={() => toast({ tone: 'info', title: 'نُسخ الرابط', body: 'يمكنك لصقه في أي محادثة.' })}>إشعار معلومة</Button>
    </div>
  )
}

function TabsDemo() {
  const [v, setV] = useState('a')
  return (
    <div>
      <Tabs idBase="demo" label="أقسام العميل" value={v} onValueChange={setV} items={[{ value: 'a', label: 'التحصيلات', count: <Digits>3</Digits> }, { value: 'b', label: 'الفواتير' }, { value: 'c', label: 'الملاحظات' }]} />
      <p className="t-body pt-4 text-fg-2">جرّب الأسهم: في RTL يتقدم السهم الأيسر إلى التبويب التالي.</p>
    </div>
  )
}

function Demo({ id }: { id: string }): ReactNode {
  const [name, setName] = useState('أحمد Khaled')
  const [phone, setPhone] = useState<string | null>(null)
  const [method, setMethod] = useState('cash')
  const [seg, setSeg] = useState<'day' | 'week' | 'month'>('week')
  const [on, setOn] = useState(true)
  const [loading, setLoading] = useState(false)
  switch (id) {
    case 'button':
      return (
        <div className="flex flex-col gap-4">
          {(['accent', 'neutral', 'danger'] as const).map((tone) => (
            <div key={tone} className="flex flex-wrap gap-2">
              {(['solid', 'soft', 'outline', 'ghost'] as const).map((v) => (
                <Button key={v} variant={v} tone={tone}>
                  {tone === 'danger' ? 'حذف العميل' : tone === 'neutral' ? 'تصدير' : 'تحصيل مبلغ'}
                </Button>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <Button loading={loading} loadingLabel="جارٍ التسجيل…" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1600) }}>تأكيد التحصيل</Button>
            <Button disabled>معطّل</Button>
            <Button variant="outline" iconStart="user-plus">إضافة عميل</Button>
            <Button variant="ghost" iconEnd="forward">التالي</Button>
          </div>
        </div>
      )
    case 'icon-button':
      return (
        <div className="flex flex-wrap items-center gap-2">
          <IconButton icon="close" label="إغلاق" />
          <IconButton icon="copy" label="نسخ رقم الإيصال" variant="outline" />
          <IconButton icon="search" label="بحث" variant="soft" tone="accent" />
          <IconButton icon="back" label="رجوع" variant="outline" />
          <IconButton icon="forward" label="التالي" variant="outline" />
          <span className="t-caption text-fg-2">«رجوع» و«التالي» تنعكسان في RTL؛ العدسة والنسخ لا.</span>
        </div>
      )
    case 'text-field':
      return <TextField label="اسم العميل" value={name} onValueChange={setName} helper="اكتب الاسم كما في سجلات العميل. الاتجاه يتبع أول حرف قوي." />
    case 'phone-input':
      return (
        <div className="flex flex-col gap-3">
          <PhoneInput label="رقم المحمول" value={phone} onValueChange={(v) => setPhone(v)} helper="مصر فقط في هذا الإصدار." />
          <p className="t-caption text-fg-2">
            المخزَّن: <LtrIsland mono>{phone ?? 'null'}</LtrIsland>
          </p>
        </div>
      )
    case 'search-field':
      return <SearchDemo />
    case 'select':
      return <Select label="طريقة التحصيل" value={method} onValueChange={setMethod} options={[{ value: 'cash', label: 'نقدًا' }, { value: 'transfer', label: 'تحويل بنكي' }, { value: 'card', label: 'بطاقة' }]} />
    case 'segmented-control':
      return <SegmentedControl label="الفترة" value={seg} onValueChange={setSeg} options={[{ value: 'day', label: 'اليوم' }, { value: 'week', label: 'الأسبوع' }, { value: 'month', label: 'الشهر' }]} />
    case 'switch':
      return <Switch label="إرسال الإيصال برسالة نصية" checked={on} onCheckedChange={setOn} description="محاكاة؛ لا تُرسل رسائل من هذا النموذج." />
    case 'tabs':
      return <TabsDemo />
    case 'dialog':
      return <OverlayDemo kind="dialog" />
    case 'drawer':
      return <OverlayDemo kind="drawer" />
    case 'data-table':
      return (
        <DataTable
          label="أصناف المخزون"
          rows={[
            { sku: 'SKU-AB-001', name: 'زيت زيتون بكر ممتاز ١ لتر', qty: '42', price: '389.00' },
            { sku: 'SKU-AB-014', name: 'عسل نحل سدر', qty: '7', price: '1,250.00' },
            { sku: 'SKU-CD-220', name: 'تمر مجدول فاخر — علبة هدايا كبيرة بحجم عائلي', qty: '120', price: '95.50' },
          ]}
          rowKey={(r) => r.sku}
          minWidth={560}
          columns={[
            { key: 's', header: 'الرمز', nowrap: true, cell: (r) => <LtrIsland mono>{r.sku}</LtrIsland> },
            { key: 'n', header: 'الصنف', cell: (r) => r.name },
            { key: 'q', header: 'الكمية', numeric: true, cell: (r) => r.qty },
            { key: 'p', header: 'السعر (ج.م)', numeric: true, cell: (r) => <bdi dir="ltr">{r.price}</bdi> },
          ]}
        />
      )
    case 'inline-message':
      return (
        <div className="flex flex-col gap-3">
          <InlineMessage tone="info" title="محاكاة محلية">لا تتصل هذه الشاشة بأي خادم.</InlineMessage>
          <InlineMessage tone="success" title="سُجّل التحصيل">رقم الإيصال <LtrIsland mono>RCPT-2026-0042</LtrIsland></InlineMessage>
          <InlineMessage tone="warning" title="يوجد عميل باسم مشابه">افتحه إن كان الشخص نفسه.</InlineMessage>
          <InlineMessage tone="danger" title="تعذّر تسجيل التحصيل" live="off" actions={<Button size="sm" variant="outline">أعد المحاولة</Button>}>لم يُسجَّل أي مبلغ، وبياناتك ما زالت في النموذج.</InlineMessage>
        </div>
      )
    case 'toast':
      return <ToastDemo />
    case 'badge':
      return (
        <div className="flex flex-wrap gap-2">
          {(['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const).map((t) => (
            <Badge key={t} tone={t} dot>
              {{ neutral: 'مسودة', accent: 'ألفا', success: 'نجح', warning: 'مقترح', danger: 'فشل', info: 'مدمج' }[t]}
            </Badge>
          ))}
        </div>
      )
    case 'empty-state':
      return <EmptyState icon="search" title="لا يوجد عميل بهذا الاسم" action={<Button variant="outline" iconStart="user-plus">إضافة عميل</Button>}>تأكد من الإملاء، أو أضفه كعميل جديد.</EmptyState>
    default:
      return null
  }
}

export function GenericComponentPage({ record }: { record: ComponentRecord }) {
  const planned = record.maturity === 'planned'
  return (
    <article className="mx-auto max-w-[1080px] px-4 pb-24 pt-8 md:px-8 lg:pt-10">
      <header className="mb-10">
        <p className="t-caption mb-3 text-fg-2">المكونات</p>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="t-h1 text-fg">{record.name}</h1>
          <bdi dir="ltr" className="font-mono text-[14px] text-fg-3">
            {record.nameEn}
          </bdi>
        </div>
        <p className="t-body-lg mt-3 max-w-[62ch] text-fg-2">{record.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <MaturityBadge maturity={record.maturity} />
          <RelationshipBadge relationship={record.relationship} />
          {!planned ? <span className="t-caption text-fg-3">صفحة مرجع مختصرة · المرجع الكامل متاح لحقل المبلغ فقط في هذا الإصدار</span> : null}
        </div>
      </header>
      {planned ? (
        <InlineMessage tone="info" title="غير مطبّق بعد" live="off">
          هذا المكوّن في الفهرس لتوضيح بنية المنظومة فقط. لا يوجد كود ولا معاينة. {record.primitive}
        </InlineMessage>
      ) : (
        <>
          <Section eyebrow="معاينة حية" title="المكوّن الحقيقي">
            <div className="rounded-[var(--ax-radius-surface)] border border-line-2 bg-sunken px-5 py-10 md:px-10">
              <div className="mx-auto max-w-[40rem] rounded-[var(--ax-radius-surface)] border border-line bg-surface p-5 shadow-[var(--ax-elevation-1)]">
                <Demo id={record.id} />
              </div>
            </div>
          </Section>
          <Section eyebrow="المواصفة" title="التشريح والحالات">
            <Dl
              items={[
                ['التشريح', <span className="flex flex-wrap gap-1.5">{record.anatomy.map((a) => <Badge key={a} variant="outline"><bdi>{a}</bdi></Badge>)}</span>],
                ['الحالات', <span className="flex flex-wrap gap-1.5">{record.states.map((a) => <Badge key={a}><bdi>{a}</bdi></Badge>)}</span>],
                ['الـprimitive', record.primitive],
                ['التطبيق', <bdi dir="ltr" className="ax-mono text-fg-2">{record.implementation}</bdi>],
                ['يُستخدم في', record.usedIn.join('، ')],
              ]}
            />
          </Section>
        </>
      )}
      <Section eyebrow="العلاقات" title="القواعد والأنماط والأدلة">
        <div className="flex flex-col gap-4">
          {record.rules.length ? (
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {record.rules.map((id) => (
                <li key={id} className="flex gap-3 py-2.5">
                  <bdi dir="ltr" className="ax-mono w-24 flex-none text-fg-2">{id}</bdi>
                  <a href={`#/rules/${id}`} className="t-body text-fg hover:underline">{getRule(id)?.title}</a>
                </li>
              ))}
            </ul>
          ) : <p className="t-body text-fg-2">لا توجد قواعد مرتبطة بعد.</p>}
          <div className="flex flex-wrap gap-2">{record.patterns.map((p) => <RefLink key={p} kind="pattern" id={p} />)}</div>
          {record.tests.length ? (
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {record.tests.map((t) => (
                <li key={t} className="flex items-center justify-between gap-3 py-2">
                  <bdi dir="ltr" className="ax-mono text-fg-2">{t}</bdi>
                  <AutomatedBadge state={automatedFor(t)} />
                </li>
              ))}
            </ul>
          ) : <p className="t-body text-fg-2">لا توجد حالات اختبار مسجلة لهذا المكوّن.</p>}
          {record.limitations.length ? (
            <div>
              <p className="t-label mb-2 text-fg">قيود معروفة</p>
              <ul className="list-disc ps-5 t-body text-fg-2">{record.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
          ) : null}
        </div>
      </Section>
    </article>
  )
}
