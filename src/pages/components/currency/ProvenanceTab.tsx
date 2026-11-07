import { automatedFor, liveFixtureResults } from '../../../knowledge/evidence'
import { getComponent, getRule, MATURITY } from '../../../knowledge'
import { Badge, DataTable, Icon, Literal, Prose } from '../../../system'
import { RefLink, RelationshipBadge, Section } from '../../../app/ui'
import { visibleInput } from './shared'
import { AutomatedBadge } from '../../EvidencePage'

const LAYERS = [
  { layer: 'L2 الطبقة العربية', what: 'parseAmount · formatAmount · normalizeDigits', rel: 'original' as const, src: 'src/arabic/amount.ts' },
  { layer: 'L3 السلوك', what: 'الحالة والتركيز ولوحة المفاتيح وARIA', rel: 'original' as const, src: 'src/system/components/currency-input.tsx' },
  { layer: 'L4 الأنماط', what: 'CSS عادي بخصائص منطقية وdata-attributes', rel: 'original' as const, src: 'src/system/styles.css' },
  { layer: 'المحتوى', what: 'رسائل الأخطاء العربية', rel: 'original' as const, src: 'src/content/messages.ts' },
  { layer: 'الأيقونات', what: 'رسوم X وعلامة الخطأ', rel: 'integrated' as const, src: 'lucide-react 1.69.0 · ISC' },
  { layer: 'الـprimitive', what: 'لم يُعتمد. التجربة المقارنة مخططة', rel: 'referenced' as const, src: 'React Aria (مرشح) — غير مثبّت' },
]

const LADDER: Array<{ m: 'draft' | 'alpha' | 'beta' | 'stable'; criteria: Array<[string, boolean]> }> = [
  { m: 'draft', criteria: [['مطبّق ويُستخدم', true]] },
  { m: 'alpha', criteria: [['عقد مكتوب ومطبّق', true], ['حالات المواصفة مرسومة', true], ['حالات عربية آلية تعدّي', true]] },
  { m: 'beta', criteria: [['كل البوابات الآلية (axe، مصفوفة السياقات، المتصفحات الثلاثة)', false], ['سكريبت لوحة المفاتيح في الاتجاهين', false]] },
  { m: 'stable', criteria: [['فحص يدوي بقارئ شاشة وجهاز حقيقي', false], ['أسبوعان دون تغيير في الواجهة البرمجية', false]] },
]

export function ProvenanceTab() {
  const record = getComponent('currency-input')!
  const live = liveFixtureResults().filter((r) => record.tests.includes(r.fixture.id))
  const browser = record.tests.filter((t) => t.startsWith('BR-'))
  return (
    <div>
      <Section eyebrow="المصدر" title="من كتب ماذا" intro="كل طبقة بعلاقتها بالمصدر. «أصلي» يعني أنه مكتوب ومُصان هنا، لا أنه بلا سوابق.">
        <DataTable
          label="مصادر حقل المبلغ"
          rows={LAYERS}
          rowKey={(r) => r.layer}
          minWidth={720}
          columns={[
            { key: 'l', header: 'الطبقة', nowrap: true, cell: (r) => <span className="font-medium">{r.layer}</span> },
            { key: 'w', header: 'ما تتضمنه', cell: (r) => <span className="text-fg-2">{r.what}</span> },
            { key: 'r', header: 'العلاقة', cell: (r) => <RelationshipBadge relationship={r.rel} /> },
            { key: 's', header: 'المصدر', cell: (r) => <bdi dir="ltr" className="ax-mono text-fg-2">{r.src}</bdi> },
          ]}
        />
      </Section>

      <Section eyebrow="النضج" title={<>الدرجة الحالية: {MATURITY[record.maturity].label}</>} intro={MATURITY[record.maturity].desc}>
        <ol className="grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line md:grid-cols-4">
          {LADDER.map((step) => {
            const current = step.m === record.maturity
            return (
              <li key={step.m} className={['flex flex-col gap-3 p-5', current ? 'bg-soft' : 'bg-surface'].join(' ')} aria-current={current ? 'step' : undefined}>
                <span className="flex items-center gap-2">
                  <span className={['t-label', current ? 'text-on-soft' : 'text-fg'].join(' ')}>{MATURITY[step.m].label}</span>
                  {current ? <Badge tone="accent">الحالية</Badge> : null}
                </span>
                <ul className="flex flex-col gap-1.5">
                  {step.criteria.map(([c, ok]) => (
                    <li key={c} className="flex items-start gap-2 t-caption text-fg-2">
                      <Icon name={ok ? 'check' : 'pending'} size={15} className={ok ? 'mt-0.5 text-success' : 'mt-0.5 text-fg-3'} />
                      <span>
                        {c}
                        <span className="ax-sr">{ok ? ' — متحقق' : ' — لم يتحقق'}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ol>
      </Section>

      <Section eyebrow="العلاقات" title="القواعد والأنماط">
        <ul className="mb-6 flex flex-col divide-y divide-line border-y border-line">
          {record.rules.map((id) => {
            const r = getRule(id)!
            return (
              <li key={id} className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr]">
                <a href={`#/rules/${id}`} className="ax-mono text-link hover:underline">
                  <bdi dir="ltr">{id}</bdi>
                </a>
                <span>
                  <a href={`#/rules/${id}`} className="t-label text-fg hover:underline">
                    {r.title}
                  </a>
                  <span className="block t-caption text-fg-2"><Prose>{r.problem}</Prose></span>
                </span>
              </li>
            )
          })}
        </ul>
        <div className="flex flex-wrap gap-2">
          {record.patterns.map((p) => (
            <RefLink key={p} kind="pattern" id={p} />
          ))}
        </div>
      </Section>

      <Section eyebrow="الأدلة" title="الحالات المختبرة" intro="عمود «الآن» يُنفَّذ في هذا المتصفح عند فتح الصفحة. عمود «آلي» يقرأ سجل تشغيل فعلي إن وُجد." aside={<a href="#/evidence" className="t-label text-link hover:underline">كل الأدلة</a>}>
        <DataTable
          label="حالات اختبار حقل المبلغ"
          rows={live}
          rowKey={(r) => r.fixture.id}
          minWidth={820}
          columns={[
            { key: 'id', header: 'المعرف', nowrap: true, cell: (r) => <bdi dir="ltr" className="ax-mono">{r.fixture.id}</bdi> },
            { key: 'q', header: 'المتطلب', cell: (r) => r.fixture.requirement },
            { key: 'in', header: 'المدخل', nowrap: true, cell: (r) => <Literal dir="ltr"><span className="ax-mono">{visibleInput(r.fixture.input) || '""'}</span></Literal> },
            { key: 'a', header: 'الفعلي', cell: (r) => <Literal dir="auto"><span className="ax-mono text-[12.5px]">{r.actual}</span></Literal> },
            { key: 'd', header: 'الآن', cell: (r) => <Badge tone={r.pass ? 'success' : 'danger'}>{r.pass ? 'نجح' : 'فشل'}</Badge> },
            { key: 'u', header: 'آلي', cell: (r) => <AutomatedBadge state={r.automated} /> },
          ]}
        />
        {browser.length ? (
          <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line">
            {browser.map((id) => (
              <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="t-body text-fg">
                  <bdi dir="ltr" className="ax-mono me-2 text-fg-2">{id}</bdi>
                  فحص متصفح
                </span>
                <AutomatedBadge state={automatedFor(id)} />
              </li>
            ))}
          </ul>
        ) : null}
      </Section>
    </div>
  )
}
