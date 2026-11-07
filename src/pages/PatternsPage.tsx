import { useEffect, useRef, useState } from 'react'
import { getComponent, getPattern, getRule, PATTERNS, PATTERN_STATUS } from '../knowledge'
import {
  Badge,
  Button,
  CurrencyInput,
  EmptyState,
  InlineMessage,
  LtrIsland,
  PhoneInput,
  SearchField,
  Tabs,
  tabPanelProps,
  TextField,
  type CurrencyInputHandle,
  Prose,
} from '../system'
import { navigate } from '../app/router'
import { N, RefLink, Section } from '../app/ui'
import { Assistant } from './components/Assistant'

function Catalog() {
  return (
    <div className="mx-auto max-w-[1080px] px-4 pb-24 pt-10 md:px-8">
      <header className="mb-10 max-w-[68ch]">
        <p className="t-eyebrow mb-2">المرجع</p>
        <h1 className="t-h1 text-fg">أنماط تجربة المستخدم</h1>
        <p className="t-body-lg mt-3 text-fg-2">النمط مهمة كاملة يؤديها شخص، لا مجموعة مكونات. نمط واحد مطبّق بالكامل مع مثال عامل؛ البقية معلنة بحالتها الحقيقية.</p>
      </header>
      <ol className="flex flex-col divide-y divide-line border-y border-line">
        {PATTERNS.map((p) => {
          const st = PATTERN_STATUS[p.status]
          const full = p.status === 'demonstrated'
          return (
            <li key={p.id} className="grid gap-3 py-6 md:grid-cols-[1fr_auto] md:items-start">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <bdi dir="ltr" className="ax-mono t-caption text-fg-3">{p.id}</bdi>
                  <Badge tone={st.tone} dot>{st.label}</Badge>
                </div>
                <a href={`#/patterns/${p.id}`} className={['hover:underline', full ? 't-h2 text-fg' : 't-h3 text-fg'].join(' ')}>
                  {p.title}
                </a>
                <p className="t-body mt-1 max-w-[64ch] text-fg-2">{p.job}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                {p.components.length ? <span className="t-caption text-fg-2"><N>{p.components.length}</N> مكونات</span> : null}
                {full ? <Button size="sm" variant="outline" iconEnd="forward" onClick={() => navigate(`#/patterns/${p.id}`)}>التفاصيل</Button> : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function ValidationState() {
  const ref = useRef<CurrencyInputHandle>(null)
  useEffect(() => ref.current?.setDraft('1234,50'), [])
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextField label="اسم العميل" value="" onValueChange={() => {}} error="أدخل اسم العميل." />
      <PhoneInput label="رقم المحمول" value={null} onValueChange={() => {}} showValidation />
      <div className="md:col-span-2 md:max-w-[26rem]">
        <CurrencyInput ref={ref} label="المبلغ المستلم" size="lg" />
      </div>
    </div>
  )
}

const STATE_TABS = [
  { value: 'empty', label: 'قبل البحث' },
  { value: 'none', label: 'لا نتائج' },
  { value: 'validation', label: 'التحقق' },
  { value: 'similar', label: 'تشابه الاسم' },
  { value: 'busy', label: 'الانشغال' },
  { value: 'failure', label: 'الفشل' },
  { value: 'success', label: 'النجاح' },
]

function StatesGallery() {
  const [v, setV] = useState('validation')
  const [q, setQ] = useState('سمير الحلواني')
  return (
    <div>
      <Tabs idBase="pst" label="حالات النمط" value={v} onValueChange={setV} items={STATE_TABS} />
      <div {...tabPanelProps('pst', v)} className="mt-5 rounded-[var(--ax-radius-surface)] border border-line bg-sunken px-5 py-8 outline-none md:px-10">
        <div className="mx-auto max-w-[40rem] rounded-[var(--ax-radius-surface)] border border-line bg-surface p-5 shadow-[var(--ax-elevation-1)]">
          {v === 'empty' && <EmptyState icon="wallet" title="اختر عميلًا لتحصيل مبلغ منه">ابحث بالاسم أو رقم الهاتف. إن لم يكن مسجلًا، أضفه أولًا.</EmptyState>}
          {v === 'none' && (
            <div className="flex flex-col gap-2">
              <SearchField label="ابحث عن عميل" hideLabel value={q} onValueChange={(v) => setQ(v ?? '')} />
              <EmptyState icon="search" title="لا يوجد عميل بهذا الاسم أو الرقم" action={<Button variant="outline" iconStart="user-plus">أضف «{q}» كعميل جديد</Button>}>تأكد من الإملاء، أو أضفه كعميل جديد.</EmptyState>
            </div>
          )}
          {v === 'validation' && <ValidationState />}
          {v === 'similar' && (
            <InlineMessage tone="warning" title="يوجد عميل باسم مشابه" live="off">
              <p>افتحه إن كان الشخص نفسه، أو أضف عميلًا جديدًا إن كان شخصًا آخر. لن ندمج السجلات.</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-y border-line py-2">
                <span>
                  <span className="block t-label text-fg">إيمان عبد الرحمن</span>
                  <span className="t-caption text-fg-2"><LtrIsland>+20 11 1234 5670</LtrIsland> · <LtrIsland mono>CUS-0002</LtrIsland></span>
                </span>
                <Button size="sm" variant="outline">افتح هذا العميل</Button>
              </div>
            </InlineMessage>
          )}
          {v === 'busy' && (
            <div className="flex flex-col items-start gap-3">
              <Button loading loadingLabel="جارٍ التسجيل…">تأكيد التحصيل</Button>
              <p className="t-body text-fg-2">الزر يبقى قابلًا للتركيز مع aria-busy، والنقر الثاني لا يرسل شيئًا، والحوار لا يُغلق بـ Escape أثناء العملية.</p>
            </div>
          )}
          {v === 'failure' && (
            <InlineMessage tone="danger" title="تعذّر تسجيل التحصيل" live="off" actions={<><Button size="sm">أعد المحاولة</Button><Button size="sm" variant="ghost">عدّل البيانات</Button></>}>
              انتهت مهلة الاتصال بالخادم المحاكى. لم يُسجَّل أي مبلغ، وبياناتك ما زالت كما هي.
            </InlineMessage>
          )}
          {v === 'success' && (
            <InlineMessage tone="success" title="سُجّل التحصيل" live="off">
              <bdi dir="ltr">1,234.50</bdi> ج.م نقدًا · رقم الإيصال <LtrIsland mono>RCPT-2026-0042</LtrIsland>. السطر الجديد في السجل أدناه.
            </InlineMessage>
          )}
        </div>
      </div>
      <p className="mt-3 t-caption text-fg-3">لقطات حية من المكونات نفسها في حالات ثابتة. السلوك الكامل في المثال العملي.</p>
    </div>
  )
}

function Detail({ id }: { id: string }) {
  const p = getPattern(id)
  const [assistant, setAssistant] = useState(false)
  if (!p) return <div className="p-10 t-body">النمط غير موجود.</div>
  const st = PATTERN_STATUS[p.status]
  const full = p.status === 'demonstrated'
  return (
    <article className="mx-auto max-w-[1180px] px-4 pb-24 pt-10 md:px-8">
      <p className="t-caption mb-3 text-fg-2">
        <a href="#/patterns" className="hover:text-fg">الأنماط</a>
        <span className="mx-2 text-fg-3">/</span>
        <bdi dir="ltr" className="ax-mono">{p.id}</bdi>
      </p>
      <h1 className="t-display max-w-[22ch] text-fg max-sm:text-[32px]">{p.title}</h1>
      <blockquote className="t-body-lg mt-5 max-w-[60ch] border-s-2 border-action ps-5 text-fg">«{p.job}»</blockquote>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Badge tone={st.tone} dot>{st.label}</Badge>
        {full ? (
          <>
            <Button iconEnd="forward" onClick={() => navigate('#/app')}>افتح المثال العملي</Button>
            <Button variant="soft" iconStart="sliders" onClick={() => setAssistant(true)}>مساعد الاختيار</Button>
          </>
        ) : null}
      </div>

      {!full ? (
        <div className="mt-10">
          <InlineMessage tone="info" title="لا توجد تفاصيل بعد" live="off">
            هذا النمط {st.label}. {p.status === 'partial' ? 'أجزاء منه ظاهرة داخل نمط «البحث عن عميل أو إضافته ثم تحصيل مبلغ» ومثاله العملي.' : 'لم يُصمم تدفقه ولم يُطبَّق.'}
          </InlineMessage>
          {p.components.length ? <div className="mt-6 flex flex-wrap gap-2">{p.components.map((c) => <RefLink key={c} kind="component" id={c} />)}</div> : null}
        </div>
      ) : (
        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0">
            <Section eyebrow="التدفق" title="الخطوات">
              <ol className="flex flex-col">
                {p.steps.map((s, i) => (
                  <li key={s.title} className="relative grid grid-cols-[2.25rem_1fr] gap-4 pb-8 last:pb-0">
                    <span className="relative flex flex-col items-center">
                      <span className="anatomy-dot !size-7 !text-[13px]"><N>{i + 1}</N></span>
                      {i < p.steps.length - 1 ? <span aria-hidden="true" className="mt-1 w-px flex-1 bg-line-2" /> : null}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="t-h3 text-fg">{s.title}</h3>
                      <p className="t-body mt-1 text-fg-2">{s.detail}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {s.components.map((c) => <RefLink key={c} kind="component" id={c} />)}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.states.map((x) => <Badge key={x} variant="outline"><bdi dir="ltr">{x}</bdi></Badge>)}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
            <Section eyebrow="الحالات" title="الفراغ والتحقق والانشغال والفشل والنجاح">
              <StatesGallery />
            </Section>
            <Section eyebrow="القرارات" title="أسئلة حُسمت">
              <ul className="flex flex-col divide-y divide-line border-y border-line">
                {p.decisions.map((d) => (
                  <li key={d.question} className="grid gap-2 py-4 md:grid-cols-[1fr_1.3fr_auto] md:gap-6">
                    <span className="t-label text-fg"><Prose>{d.question}</Prose></span>
                    <span className="t-body text-fg-2"><Prose>{d.decision}</Prose></span>
                    {d.rule ? <a href={`#/rules/${d.rule}`} className="ax-mono t-caption text-link hover:underline"><bdi dir="ltr">{d.rule}</bdi></a> : null}
                  </li>
                ))}
              </ul>
            </Section>
            <Section eyebrow="المحتوى" title="النصوص داخل المهمة" intro="المصطلحات مطابقة لمواصفة المكونات والمسرد: «تحصيل» لا «دفع»، و«إيصال» لا «فاتورة».">
              <ul className="flex flex-col divide-y divide-line border-y border-line">
                {p.copy.map((c) => (
                  <li key={c.situation} className="grid gap-1 py-3 md:grid-cols-[11rem_1fr] md:gap-6">
                    <span className="t-caption pt-0.5 text-fg-2">{c.situation}</span>
                    <span className="t-body text-fg">{c.text}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
          <aside className="flex flex-col gap-8 lg:sticky lg:top-20 lg:self-start">
            <div>
              <p className="t-eyebrow mb-2">المحفّز</p>
              <p className="t-body text-fg">{p.trigger}</p>
            </div>
            <div>
              <p className="t-eyebrow mb-2">المتطلبات المسبقة</p>
              <ul className="list-disc ps-5 t-body text-fg">{p.prerequisites.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div>
              <p className="t-eyebrow mb-2">المخاطر التي يمنعها</p>
              <ul className="list-disc ps-5 t-body text-fg">{p.risks.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div>
              <p className="t-eyebrow mb-2">المكونات</p>
              <ul className="flex flex-col gap-1">
                {p.components.map((c) => (
                  <li key={c}><a href={`#/components/${c}`} className="t-body text-fg hover:underline">{getComponent(c)?.name}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="t-eyebrow mb-2">القواعد</p>
              <ul className="flex flex-col gap-1.5">
                {p.rules.map((r) => (
                  <li key={r} className="t-caption">
                    <a href={`#/rules/${r}`} className="hover:underline"><bdi dir="ltr" className="ax-mono text-fg-3">{r}</bdi> <span className="text-fg">{getRule(r)?.title}</span></a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
      <Assistant open={assistant} onOpenChange={setAssistant} context="pattern" />
    </article>
  )
}

export function PatternsPage({ id }: { id?: string }) {
  return id ? <Detail id={id} /> : <Catalog />
}
