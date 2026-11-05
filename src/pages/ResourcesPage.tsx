import { useState } from 'react'
import { getResource, RELATIONSHIP_LABEL, RESOURCES, type Resource } from '../knowledge'
import { Badge, DataTable, Drawer, EmptyState, Icon, SegmentedControl } from '../system'
import { navigate } from '../app/router'
import { Dl, N, RelationshipBadge } from '../app/ui'

const KIND: Record<Resource['kind'], string> = { guidance: 'إرشاد', research: 'بحث', library: 'مكتبة', font: 'خط', standard: 'معيار', tool: 'أداة', audit: 'تدقيق' }

function License({ r }: { r: Resource }) {
  return r.licenseStatus === 'verified-locally' ? (
    <span className="inline-flex items-center gap-1.5">
      <bdi dir="ltr" className="ax-mono">{r.license}</bdi>
      <Badge tone="success">متحقق محليًا</Badge>
    </span>
  ) : (
    <Badge tone="neutral" variant="outline">قيد المراجعة</Badge>
  )
}

export function ResourcesPage({ id }: { id?: string }) {
  const [rel, setRel] = useState<'all' | Resource['relationship']>('all')
  const rows = RESOURCES.filter((r) => rel === 'all' || r.relationship === rel)
  const open = id ? getResource(id) : undefined
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-10 md:px-8">
      <header className="mb-10 max-w-[68ch]">
        <p className="t-eyebrow mb-2">الموارد والتكاملات</p>
        <h1 className="t-h1 text-fg">ما نبني عليه، وبأي علاقة</h1>
        <p className="t-body-lg mt-3 text-fg-2">لا نخلط بين ما كتبناه وما ندمجه وما نشير إليه فقط. الرخصة تُعرض حين نتحقق منها، وإلا تبقى «قيد المراجعة». لا توجد هنا شراكات أو إحصاءات استخدام.</p>
      </header>
      <dl className="mb-10 grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(RELATIONSHIP_LABEL) as Resource['relationship'][]).map((k) => (
          <div key={k} className="flex flex-col gap-1.5 bg-surface p-5">
            <dt className="flex items-center justify-between">
              <RelationshipBadge relationship={k} />
              <span className="t-caption text-fg-3"><N>{RESOURCES.filter((r) => r.relationship === k).length}</N></span>
            </dt>
            <dd className="t-body text-fg-2">{RELATIONSHIP_LABEL[k].desc}</dd>
          </div>
        ))}
      </dl>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl label="العلاقة" hideLabel value={rel} onValueChange={setRel} options={[{ value: 'all', label: 'الكل' }, ...(Object.keys(RELATIONSHIP_LABEL) as Resource['relationship'][]).map((k) => ({ value: k, label: RELATIONSHIP_LABEL[k].label }))]} />
        <p className="t-caption text-fg-3">الطبقات الأصلية (المكونات والطبقة العربية) موثقة في صفحة كل مكوّن تحت «المصدر».</p>
      </div>
      <DataTable
        label="الموارد"
        rows={rows}
        rowKey={(r) => r.id}
        minWidth={860}
        empty={<EmptyState icon="library" title="لا توجد موارد بهذه العلاقة">{rel === 'adapted' ? 'لم نقتبس أي عمل مشتق في هذا الإصدار.' : rel === 'original' ? 'الأعمال الأصلية موثقة في صفحات المكونات.' : ''}</EmptyState>}
        columns={[
          { key: 't', header: 'المورد', cell: (r) => <a href={`#/resources/${r.id}`} className="t-label text-fg hover:underline"><bdi>{r.title}</bdi></a> },
          { key: 'm', header: 'الجهة', cell: (r) => <bdi className="text-fg-2">{r.maintainer}</bdi> },
          { key: 'k', header: 'النوع', nowrap: true, cell: (r) => KIND[r.kind] },
          { key: 'r', header: 'العلاقة', cell: (r) => <RelationshipBadge relationship={r.relationship} /> },
          { key: 'l', header: 'الرخصة', nowrap: true, cell: (r) => <License r={r} /> },
        ]}
      />
      <Drawer open={!!open} onOpenChange={(o) => !o && navigate('#/resources')} title={open?.title ?? ''} description={open ? `${open.maintainer} · ${KIND[open.kind]}` : undefined} size="lg" labels={{ close: 'إغلاق تفاصيل المورد' }}>
        {open ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <RelationshipBadge relationship={open.relationship} />
              <span className="t-caption text-fg-2">{RELATIONSHIP_LABEL[open.relationship].desc}</span>
            </div>
            <Dl
              items={[
                ['دوره عندنا', open.role],
                ['نطاق التحقق', open.validation],
                ['الإصدار', <bdi>{open.version}</bdi>],
                ['البيئة', <bdi>{open.environment}</bdi>],
                ['الرخصة', <span className="flex flex-col gap-1"><License r={open} /><span className="t-caption text-fg-2">{open.licenseNote}</span></span>],
                ['الرابط', open.url ? <a href={open.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-link hover:underline"><bdi dir="ltr" className="ax-mono text-[13px] break-all">{open.url}</bdi><Icon name="external" size={14} /><span className="ax-sr">(يفتح في نافذة جديدة)</span></a> : <span className="text-fg-3">لا يوجد</span>],
              ]}
            />
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
