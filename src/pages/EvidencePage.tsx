import { useMemo, useState } from 'react'
import { BROWSER_CHECKS, BROWSER_RUN, NOT_CHECKED, UNIT_RUN, automatedFor, liveFixtureResults, type AutomatedState } from '../knowledge/evidence'
import { Badge, DataTable, Digits, InlineMessage, Literal, Prose, SegmentedControl } from '../system'
import { N, Section } from '../app/ui'
import { visibleInput } from './components/currency/shared'

export function AutomatedBadge({ state }: { state: AutomatedState }) {
  if (state.state === 'not-run') return <Badge tone="neutral" variant="outline">لم يُشغَّل</Badge>
  return (
    <Badge tone={state.state === 'passed' ? 'success' : 'danger'} title={`${state.run?.tool ?? ''} · ${state.run?.environment ?? ''} · ${state.run?.startedAt ?? ''}`}>
      {state.state === 'passed' ? 'آلي: نجح' : 'آلي: فشل'}
    </Badge>
  )
}

const STATUS_DEFS = [
  { k: 'متطلب مقترح', d: 'قاعدة أو متطلب مكتوب لم يُطبَّق أو لم يُختبر.' },
  { k: 'عرض مطبّق', d: 'حالة تُنفَّذ الآن في متصفحك على المنطق المطبّق. ليست سجلًا محفوظًا.' },
  { k: 'فحص يدوي', d: 'شخص جرّب وسجّل النتيجة والبيئة. لا يوجد أي فحص يدوي مسجّل في هذا الإصدار.' },
  { k: 'فحص آلي', d: 'تشغيل فعلي بأداة محددة وبيئة وتاريخ، مقروء من ملف سجل.' },
  { k: 'لم يُفحص', d: 'معروف أنه يحتاج فحصًا ولم يحدث.' },
]

function RunMeta({ run, label }: { run: typeof UNIT_RUN; label: string }) {
  if (!run.tool) return <InlineMessage tone="warning" title={`${label}: لا يوجد سجل تشغيل`} live="off">لم يُسجَّل أي تشغيل بعد، فكل الحالات المرتبطة «لم يُشغَّل».</InlineMessage>
  const passed = run.results.filter((r) => r.status === 'passed').length
  return (
    <div className="grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line sm:grid-cols-4">
      {/* Tool and environment are names and versions, shown as recorded; date and result follow the numerals. */}
      {([
        ['الأداة', <Literal>{run.tool}</Literal>],
        ['البيئة', <Literal>{run.environment}</Literal>],
        ['التاريخ', <Digits>{(run.startedAt?.replace('T', ' ').slice(0, 16) ?? '') + ' UTC'}</Digits>],
        ['النتيجة', <Digits>{`${passed} / ${run.results.length} نجح`}</Digits>],
      ] as const).map(([k, v]) => (
        <div key={k} className="flex flex-col gap-1 bg-surface px-4 py-3">
          <span className="t-caption text-fg-2">{k}</span>
          <bdi className="t-label text-fg">{v}</bdi>
        </div>
      ))}
    </div>
  )
}

export function EvidencePage() {
  const live = useMemo(() => liveFixtureResults(), [])
  const [area, setArea] = useState<'all' | 'amount' | 'phone' | 'search' | 'format'>('all')
  const rows = live.filter((r) => area === 'all' || r.fixture.area === area)
  const demoPass = live.filter((r) => r.pass).length
  const autoPass = live.filter((r) => r.automated.state === 'passed').length
  const browserPass = BROWSER_CHECKS.filter((b) => automatedFor(b.id).state === 'passed').length

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-10 md:px-8">
      <header className="mb-10 max-w-[68ch]">
        <p className="t-eyebrow mb-2">الجودة والأدلة</p>
        <h1 className="t-h1 text-fg">ما الذي فُحص، وكيف، وأين</h1>
        <p className="t-body-lg mt-3 text-fg-2">لا توجد هنا درجة جودة إجمالية ولا شهادة توافق. كل سطر يربط متطلبًا بطريقة فحص وبيئة، وما لم يُفحص مذكور صراحة.</p>
      </header>

      <div className="mb-12 grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['حالات عرض نجحت الآن', `${demoPass} / ${live.length}`, 'تُنفَّذ في متصفحك'],
          ['حالات آلية (Vitest)', `${autoPass} / ${live.length}`, UNIT_RUN.tool ? 'من سجل تشغيل' : 'لا سجل'],
          ['فحوص متصفح (Playwright)', `${browserPass} / ${BROWSER_CHECKS.length}`, BROWSER_RUN.tool ? 'Chromium فقط' : 'لا سجل'],
          ['فحوص يدوية', '0', 'لم يُجرَ أي فحص يدوي'],
        ].map(([k, v, s]) => (
          <div key={k} className="flex flex-col gap-1 bg-surface px-5 py-4">
            <span className="t-caption text-fg-2">{k}</span>
            <span className="text-[28px] font-semibold leading-tight text-fg ax-num">
              <N>{v}</N>
            </span>
            <span className="t-caption text-fg-3">{s}</span>
          </div>
        ))}
      </div>

      <Section eyebrow="التعريفات" title="حالات الدليل">
        <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {STATUS_DEFS.map((s) => (
            <div key={s.k} className="border-s-2 border-line-2 ps-4">
              <dt className="t-label text-fg">{s.k}</dt>
              <dd className="t-body text-fg-2">{s.d}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section eyebrow="الطبقة العربية" title="حالات الإدخال والعرض والبحث" aside={<SegmentedControl label="المجال" hideLabel value={area} onValueChange={setArea} options={[{ value: 'all', label: 'الكل' }, { value: 'amount', label: 'المبالغ' }, { value: 'format', label: 'العرض' }, { value: 'phone', label: 'الهاتف' }, { value: 'search', label: 'البحث' }]} />}>
        <div className="mb-4">
          <RunMeta run={UNIT_RUN} label="Vitest" />
        </div>
        <DataTable
          label="حالات الاختبار"
          rows={rows}
          rowKey={(r) => r.fixture.id}
          minWidth={980}
          maxHeight={640}
          columns={[
            { key: 'id', header: 'المعرف', nowrap: true, cell: (r) => <bdi dir="ltr" className="ax-mono">{r.fixture.id}</bdi> },
            { key: 'q', header: 'المتطلب', cell: (r) => <Prose>{r.fixture.requirement}</Prose> },
            { key: 'r', header: 'القاعدة', nowrap: true, cell: (r) => <a href={`#/rules/${r.fixture.rule}`} className="ax-mono text-link hover:underline"><bdi dir="ltr">{r.fixture.rule}</bdi></a> },
            // Input, expected and actual are exact strings compared by the test: shown as written, never localized.
            { key: 'in', header: 'المدخل', nowrap: true, cell: (r) => <Literal dir="ltr"><span className="ax-mono">{visibleInput(r.fixture.input) || '""'}</span></Literal> },
            { key: 'e', header: 'المتوقع', cell: (r) => <Literal dir="auto"><span className="ax-mono text-[12.5px] text-fg-2">{r.fixture.expected}</span></Literal> },
            { key: 'a', header: 'الفعلي الآن', cell: (r) => <Literal dir="auto"><span className="ax-mono text-[12.5px]">{r.actual}</span></Literal> },
            { key: 'd', header: 'عرض', cell: (r) => <Badge tone={r.pass ? 'success' : 'danger'}>{r.pass ? 'نجح' : 'فشل'}</Badge> },
            { key: 'u', header: 'آلي', cell: (r) => <AutomatedBadge state={r.automated} /> },
          ]}
        />
        <p className="mt-3 t-caption text-fg-3">
          الحالات نفسها تُشغَّل في <bdi dir="ltr" className="ax-mono">src/arabic/arabic.test.ts</bdi> مع ست خصائص تحويلية (metamorphic) بـ<Digits>500</Digits> حالة لكل منها وبذرة ثابتة <Literal>20260314</Literal>.
        </p>
      </Section>

      <Section eyebrow="السلوك" title="فحوص المتصفح">
        <div className="mb-4">
          <RunMeta run={BROWSER_RUN} label="Playwright" />
        </div>
        <DataTable
          label="فحوص المتصفح"
          rows={BROWSER_CHECKS.map((b) => ({ b, s: automatedFor(b.id) }))}
          rowKey={(r) => r.b.id}
          minWidth={860}
          columns={[
            { key: 'id', header: 'المعرف', nowrap: true, cell: (r) => <bdi dir="ltr" className="ax-mono">{r.b.id}</bdi> },
            { key: 'q', header: 'المتطلب', cell: (r) => <Prose>{r.b.requirement}</Prose> },
            { key: 'm', header: 'الطريقة', cell: (r) => <span className="text-fg-2"><Prose>{r.b.method}</Prose></span> },
            { key: 'e', header: 'المتوقع', cell: (r) => <span className="text-fg-2"><Prose>{r.b.expected}</Prose></span> },
            { key: 's', header: 'النتيجة', cell: (r) => <AutomatedBadge state={r.s} /> },
          ]}
        />
      </Section>

      <Section eyebrow="الحدود" title="لم يُفحص">
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {NOT_CHECKED.map((n) => (
            <li key={n} className="t-body py-3 text-fg">
              <Prose>{n}</Prose>
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="حالة توضيحية" title="تدقيق Stockaat">
        <InlineMessage tone="info" title="ملفات الأدلة غير مرفقة" live="off">
          الخطة تذكر تشغيل الطبقة العربية على كود Stockaat وإصلاح APP-01 وAPP-02 وAPP-03. لم تُرفق ملفات التدقيق، فلم يُشغَّل شيء ولا تُعرض نتائج. عند إرفاقها تُستورد هنا كسجلات Test بطريقتها وبيئتها.
        </InlineMessage>
      </Section>
    </div>
  )
}
