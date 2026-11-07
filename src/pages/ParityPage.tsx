import { useMemo, useState } from 'react'
import { ANTD_COMPONENTS, ANTD_ECOSYSTEM, paritySummary } from '../atomic/parity/antd'
import type { ParityCategory, ParityComponent, ParityFeature, ParityStatus, ParityTrack } from '../atomic/parity/types'
import { Badge, DataTable, Digits, SegmentedControl, type BadgeTone } from '../system'

export const STATUS_LABEL: Record<ParityStatus, { label: string; tone: BadgeTone; desc: string }> = {
  missing: { label: 'غير موجود', tone: 'neutral', desc: 'لا يوجد لدينا ما يقابله بعد.' },
  partial: { label: 'جزئي', tone: 'warning', desc: 'موجود جزء منه في الكود.' },
  parity: { label: 'مكافئ', tone: 'success', desc: 'يعادل ما تقدمه Ant Design.' },
  better: { label: 'أفضل', tone: 'accent', desc: 'ميزة عربية موجودة في الكود ولا مقابل لها في Ant Design.' },
}

const CATEGORY_LABEL: Record<ParityCategory, string> = {
  general: 'عام',
  layout: 'التخطيط',
  navigation: 'التنقل',
  'data-entry': 'إدخال البيانات',
  'data-display': 'عرض البيانات',
  feedback: 'الاستجابة',
  other: 'أخرى',
}

const TRACK_LABEL: Record<ParityTrack, string> = { legacy: 'المكتبة الحالية', atomic: 'المسار الذري', none: '—' }

function StatusBadge({ status }: { status: ParityStatus }) {
  const s = STATUS_LABEL[status]
  return <Badge tone={s.tone} dot title={s.desc}>{s.label}</Badge>
}

/** English text (AntD terms, notes): LTR island; numbers follow the same rules as everywhere else. */
function En({ children, className }: { children: string; className?: string }) {
  return <bdi dir="ltr" className={className}><Digits>{children}</Digits></bdi>
}

const covered = (fs: ParityFeature[]) => fs.filter((f) => f.status !== 'missing').length

function FeatureTable({ component }: { component: ParityComponent }) {
  return (
    <DataTable
      label={`ميزات ${component.antd}`}
      rows={component.features}
      rowKey={(f) => f.id}
      minWidth={720}
      columns={[
        { key: 'ar', header: 'الميزة', cell: (f) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-fg"><Digits>{f.nameAr}</Digits></span>
            <En className="text-[12px] text-fg-3">{f.name}</En>
          </div>
        ) },
        { key: 's', header: 'الحالة', nowrap: true, cell: (f) => <StatusBadge status={f.status} /> },
        { key: 't', header: 'المكان', nowrap: true, hideCompact: true, cell: (f) => <span className="text-fg-2">{TRACK_LABEL[f.track]}</span> },
        { key: 'e', header: 'الدليل', cell: (f) => (f.evidence?.length ? (
          <span className="flex flex-wrap gap-1">{f.evidence.map((id) => <bdi key={id} dir="ltr" className="ax-mono text-[12px] text-fg-2">{id}</bdi>)}</span>
        ) : <span className="text-fg-3">—</span>) },
        { key: 'n', header: 'ملاحظة', cell: (f) => (
          <div className="flex flex-col gap-1 text-[12.5px]">
            {f.arabicEdge ? <En className="text-link">{f.arabicEdge}</En> : null}
            {f.note ? <En className="text-fg-2">{f.note}</En> : null}
          </div>
        ) },
      ]}
    />
  )
}

function ComponentRow({ component }: { component: ParityComponent }) {
  const n = covered(component.features)
  return (
    <details className="group border-b border-line" data-parity-component={component.id}>
      <summary className="flex min-h-12 cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <span aria-hidden="true" className="w-4 text-fg-3 transition-transform group-open:rotate-90 rtl:group-open:-rotate-90">‹</span>
        <span className="min-w-[8rem] flex-1 font-medium text-fg"><bdi dir="ltr">{component.antd}</bdi></span>
        <span className="t-caption text-fg-2">{CATEGORY_LABEL[component.category]}</span>
        <span className="t-caption ax-mono text-fg-3"><bdi dir="ltr">{component.priority.toUpperCase()}</bdi></span>
        <StatusBadge status={component.status} />
        <span className="t-caption ax-num text-fg-2"><Digits>{`${n} / ${component.features.length} ميزة`}</Digits></span>
      </summary>
      <div className="pb-6 ps-8">
        <p className="t-caption mb-3 flex flex-wrap gap-x-4 gap-y-1 text-fg-2">
          <span>المكان: {TRACK_LABEL[component.track]}</span>
          {component.ours ? <span>مكوّننا: <bdi dir="ltr" className="ax-mono">{component.ours}</bdi></span> : null}
          <a href={component.docs} target="_blank" rel="noreferrer" className="text-link underline underline-offset-4">توثيق Ant Design ↗</a>
        </p>
        {component.note ? <p className="t-caption mb-3 text-fg-3"><En>{component.note}</En></p> : null}
        <FeatureTable component={component} />
      </div>
    </details>
  )
}

export function ParityPage() {
  const summary = useMemo(() => paritySummary(), [])
  const [category, setCategory] = useState<ParityCategory | 'all'>('all')
  const [status, setStatus] = useState<ParityStatus | 'all'>('all')
  const rows = ANTD_COMPONENTS.filter((c) => (category === 'all' || c.category === category) && (status === 'all' || c.status === status))

  const stats: Array<[string, string, string]> = [
    ['مكوّنات لها مقابل لدينا', `${summary.components.covered} / ${summary.components.total}`, `${summary.components.coveredPercent}% من مكوّنات Ant Design v5`],
    ['ميزات الجدول المغطاة', `${summary.table.covered} / ${summary.table.total}`, `${summary.table.coveredPercent}% — الجدول يحسم الاختيار`],
    ['كل الميزات المغطاة', `${summary.features.covered} / ${summary.features.total}`, `${summary.features.coveredPercent}% جزئيًا أو كاملًا`],
    ['مزايا عربية', String(summary.arabicAdvantages), 'ميزات «أفضل» موجودة في الكود ولها دليل'],
  ]

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-10 md:px-8">
      <header className="mb-10 max-w-[68ch]">
        <p className="t-eyebrow mb-2">المقارنة</p>
        <h1 className="t-h1 text-fg">أين نقف أمام Ant Design</h1>
        <p className="t-body-lg mt-3 text-fg-2">
          <Digits>{`كل مكوّن في Ant Design v5 وقائمة ميزات للمكوّنات التي تحسم الاختيار، مع حالتنا الفعلية ودليلها. الافتراضي «غير موجود»؛ لا يُحسب شيء إلا إذا كان الكود يفعله.`}</Digits>
        </p>
      </header>

      <section aria-label="الأرقام الرئيسية" className="mb-10 grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([k, v, s]) => (
          <div key={k} className="flex flex-col gap-1 bg-surface px-5 py-4" data-parity-stat={k}>
            <span className="t-caption text-fg-2">{k}</span>
            <span className="text-[28px] font-semibold leading-tight text-fg ax-num"><bdi dir="ltr"><Digits>{v}</Digits></bdi></span>
            <span className="t-caption text-fg-3"><Digits>{s}</Digits></span>
          </div>
        ))}
      </section>

      <section aria-labelledby="parity-list" className="mb-12">
        <h2 id="parity-list" className="t-h2 mb-4 text-fg">المكوّنات</h2>
        <div className="mb-5 flex flex-col gap-4">
          <SegmentedControl
            label="الفئة"
            wrap
            value={category}
            onValueChange={setCategory}
            options={[{ value: 'all', label: 'الكل' }, ...(Object.keys(CATEGORY_LABEL) as ParityCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))]}
          />
          <SegmentedControl
            label="الحالة"
            wrap
            value={status}
            onValueChange={setStatus}
            options={[{ value: 'all', label: 'الكل' }, ...(Object.keys(STATUS_LABEL) as ParityStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s].label }))]}
          />
        </div>
        <p role="status" className="t-caption mb-2 text-fg-2"><Digits>{`${rows.length} من ${ANTD_COMPONENTS.length} مكوّنًا`}</Digits></p>
        <div className="border-t border-line">
          {rows.length ? rows.map((c) => <ComponentRow key={c.id} component={c} />) : <p className="t-body py-6 text-fg-2">لا توجد مكوّنات بهذه الفئة والحالة.</p>}
        </div>
      </section>

      <section aria-labelledby="parity-eco">
        <h2 id="parity-eco" className="t-h2 mb-2 text-fg">ما بعد المكوّنات</h2>
        <p className="t-body mb-4 max-w-[68ch] text-fg-2">ما يجعل الفرق تختار Ant Design غير قائمة المكوّنات: المكوّنات الاحترافية والرسوم والقوالب والأدوات.</p>
        <DataTable
          label="منظومة Ant Design"
          rows={ANTD_ECOSYSTEM}
          rowKey={(e) => e.id}
          minWidth={680}
          columns={[
            { key: 'n', header: 'العنصر', cell: (e) => (
              <div className="flex flex-col gap-0.5">
                <span className="text-fg">{e.nameAr}</span>
                <a href={e.url} target="_blank" rel="noreferrer" className="text-[12px] text-link hover:underline"><En>{e.name}</En></a>
              </div>
            ) },
            { key: 'p', header: 'الأولوية', nowrap: true, cell: (e) => <bdi dir="ltr" className="ax-mono text-fg-2">{e.priority.toUpperCase()}</bdi> },
            { key: 's', header: 'الحالة', nowrap: true, cell: (e) => <StatusBadge status={e.status} /> },
            { key: 'note', header: 'ملاحظة', cell: (e) => (
              <div className="flex flex-col gap-1 text-[12.5px]">
                {e.arabicEdge ? <En className="text-link">{e.arabicEdge}</En> : null}
                {e.note ? <En className="text-fg-2">{e.note}</En> : null}
              </div>
            ) },
          ]}
        />
        <p className="t-caption mt-4 text-fg-3">قوائم ميزات Ant Design مكتوبة من معرفة توثيق الإصدار الخامس وليست منسوخة منه؛ الصفوف التي تحمل ملاحظة «verify» تحتاج مراجعة قبل الاستشهاد بالأرقام خارجيًا.</p>
      </section>
    </div>
  )
}
