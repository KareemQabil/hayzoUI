import { useState } from 'react'
import { resolveExperiencePlan, type Density, type Direction, type ExperienceContext } from '../atomic/foundations'
import { arabicErpCompactProfile, arabicPosTouchProfile, englishCrmDefaultProfile } from '../atomic/foundations/context/examples/profiles'
import { crmResponsiveContextPreset, editorialCleanVisualSystem, erpCompactContextPreset, neutralBlueBrandTheme, posTouchContextPreset, quietEnterpriseVisualSystem } from '../atomic/foundations/styles/examples/assets'
import { downloadJson } from '../app/ui'
import { COMPONENTS } from '../knowledge'
import { UNIT_RUN, type RunFile } from '../knowledge/evidence'
import { toDisplayDigits, type DisplayNumerals } from '../arabic'
import { Digits, useLocale } from '../system'

/** Counts and date come from the recorded unit run (scripts/record-unit.mjs), never typed by hand. */
export function summarizeRun(run: RunFile) {
  const passed = run.results.filter((r) => r.status === 'passed').length
  const failed = run.results.filter((r) => r.status === 'failed').length
  const engine = run.results.filter((r) => r.file?.endsWith('token-engine.contract.test.ts') && r.status === 'passed').length
  return { total: run.results.length, passed, failed, engine, date: run.startedAt }
}

/** «7 نوفمبر 2026» with the user's numerals; Gregorian calendar regardless of the locale default. */
export function formatRunDate(iso: string, numerals: DisplayNumerals) {
  return new Intl.DateTimeFormat(`ar-EG-u-ca-gregory-nu-${numerals}`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso))
}

const PROFILES = {
  pos: { label: 'نقطة بيع عربية · لمس', profile: arabicPosTouchProfile, visual: quietEnterpriseVisualSystem, preset: posTouchContextPreset },
  erp: { label: 'إدارة موارد عربية · كثافة مدمجة', profile: arabicErpCompactProfile, visual: quietEnterpriseVisualSystem, preset: erpCompactContextPreset },
  crm: { label: 'إدارة عملاء إنجليزية · متجاوبة', profile: englishCrmDefaultProfile, visual: editorialCleanVisualSystem, preset: crmResponsiveContextPreset },
} as const

const REPO = 'https://github.com/KareemQabil/hayzoUI'
const EVIDENCE = `${REPO}/blob/86404996e3f4a27e8bbac61cbb411cb3a7fbd4d0/docs/reviews/EXPERIENCE_TOKEN_INTEGRATION_2026-11-06.md`
const control = 'mt-2 h-11 w-full rounded-[var(--ax-radius-control)] border border-line-2 bg-surface px-3 text-[14px] text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
const action = 'inline-flex min-h-11 items-center justify-center rounded-[var(--ax-radius-control)] border border-line-2 bg-surface px-4 py-2 text-[14px] font-medium text-fg hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

export function ProgressPage() {
  const [profileId, setProfileId] = useState<keyof typeof PROFILES>('pos')
  const [density, setDensity] = useState<Density | 'profile'>('profile')
  const [direction, setDirection] = useState<Direction | 'profile'>('profile')
  const { numerals } = useLocale()
  const digits = (text: string) => toDisplayDigits(text, numerals)
  const run = summarizeRun(UNIT_RUN)
  const current = PROFILES[profileId]
  const values: Partial<ExperienceContext> = {}
  if (density !== 'profile') values.density = density
  if (direction !== 'profile') values.direction = direction
  const result = resolveExperiencePlan({
    profile: current.profile,
    styleAssets: [current.visual, neutralBlueBrandTheme, current.preset],
    appearanceMode: 'light',
    preferenceLayers: Object.keys(values).length ? [{ id: 'preview-scope', kind: 'scope', values }] : [],
  })

  function reset() {
    setProfileId('pos')
    setDensity('profile')
    setDirection('profile')
  }

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 lg:py-14">
      <header className="grid gap-8 border-b border-line pb-10 lg:grid-cols-[1fr_19rem] lg:items-end">
        <div>
          <p className="t-eyebrow mb-4 text-link"><bdi dir="ltr">HAYZOUI</bdi> / معاينة التطوير</p>
          <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.45] tracking-[-0.035em] text-fg">تقدّم واضح، وتجربة تختبرها.</h1>
          <p className="mt-4 max-w-[64ch] text-[17px] leading-[1.9] text-fg-2">
            الأساسات والسياقات أصبحت تعمل. اختبر اختيارات الواجهة وشاهد مصدر كل قيمة، ثم استكشف المكوّنات والتطبيق المرجعي الموجودين حاليًا.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => document.getElementById('experience-lab')?.scrollIntoView({ block: 'start' })} className={`${action} !border-action !bg-action !text-on-action hover:opacity-90`}>تجربة الأساسات ↓</button>
            <a href="#/proof" className={action}>{digits('الإثبات الأول: زر وحقل في 18 تركيبة ↗')}</a>
            <a href="#/parity" className={action}>التكافؤ مع Ant Design ↗</a>
            <a href="#/app" className={action}>فتح التطبيق المرجعي ↗</a>
          </div>
        </div>
        <aside className="border-s-2 border-action ps-5">
          <p className="text-[13px] font-medium text-fg-2">آخر نقطة تحقق منشورة</p>
          <p className="mt-1 text-[34px] font-semibold tabular-nums text-fg"><bdi dir="ltr" data-evidence="passed">{digits(String(run.passed))}</bdi> <span className="text-[15px] font-normal text-fg-2">{run.failed ? `من ${digits(String(run.total))} اختبار ناجح` : 'اختبارًا ناجحًا'}</span></p>
          <p className="mt-1 text-[13px] leading-7 text-fg-2">تشمل <span data-evidence="engine">{digits(String(run.engine))}</span> اختبارات بالمحرك الفعلي.<br />سجلّ التحقق: <span data-evidence="date">{run.date ? formatRunDate(run.date, numerals) : '—'}</span>.</p>
          <a href={EVIDENCE} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[13px] font-medium text-link underline underline-offset-4">النتائج وحدود ما اختُبر ↗</a>
        </aside>
      </header>

      <section aria-label="حالة البناء" className="grid divide-y divide-line border-b border-line md:grid-cols-3 md:divide-x md:divide-y-0 md:divide-x-reverse">
        {[
          ['01', 'الأساسات المستقلة', 'منفّذة وقابلة للتجربة', 'السياق، النسخ المحددة، فحص التوافق وتتبع المصادر.'],
          ['02', 'ربط محرك الـtokens', 'مختبر بعقود تشغيل فعلية', 'ربط طبقات بإصدارات محددة وتشغيل المحرك عبر واجهته العامة.'],
          ['03', 'الإثبات الأول: زر وحقل', 'مختبر في المتصفح', 'نفس المكوّنين في 3 أنظمة بصرية × 3 سياقات × العربية والإنجليزية، بلا نسخ؛ السلوك متطابق في الـ18 تركيبة.'],
        ].map(([number, title, status, body]) => (
          <article key={number} className="py-6 md:px-5 md:first:ps-0 md:last:pe-0">
            <p className="font-mono text-[12px] text-fg-3">{digits(number)}</p>
            <h2 className="mt-3 text-[18px] font-semibold text-fg">{title}</h2>
            <p className="mt-2 text-[13px] font-medium text-link">{status}</p>
            <p className="mt-2 text-[14px] leading-7 text-fg-2"><Digits>{body}</Digits></p>
          </article>
        ))}
      </section>

      <section id="experience-lab" className="scroll-mt-20 py-10" aria-labelledby="lab-heading">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="t-eyebrow mb-2">مختبر السياق</p>
            <h2 id="lab-heading" className="text-[25px] font-semibold text-fg">غيّر الاختيارات، وشاهد القرار.</h2>
            <p className="mt-2 max-w-[72ch] text-[14px] leading-7 text-fg-2">هذه النتيجة تُحسب الآن بدوال الأساسات الفعلية. تغيير الاتجاه مستقل عن اللغة، والكثافة يجب أن يدعمها السياق المختار.</p>
          </div>
          <button type="button" onClick={reset} className={action}>إعادة الضبط</button>
        </div>

        <div className="grid overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <form className="flex flex-col gap-5 border-b border-line bg-sunken p-5 lg:border-b-0 lg:border-e" onSubmit={(event) => event.preventDefault()}>
            <label className="text-[14px] font-medium text-fg">ملف التجربة
              <select aria-label="ملف التجربة" className={control} value={profileId} onChange={(event) => setProfileId(event.target.value as keyof typeof PROFILES)}>
                {Object.entries(PROFILES).map(([id, profile]) => <option key={id} value={id}>{profile.label}</option>)}
              </select>
            </label>
            <label className="text-[14px] font-medium text-fg">كثافة الواجهة
              <select aria-label="كثافة الواجهة" className={control} value={density} onChange={(event) => setDensity(event.target.value as Density | 'profile')}>
                <option value="profile">حسب ملف التجربة</option>
                <option value="compact">مدمجة · compact</option>
                <option value="default">افتراضية · default</option>
                <option value="touch">لمس · touch</option>
              </select>
            </label>
            <label className="text-[14px] font-medium text-fg">اتجاه الواجهة
              <select aria-label="اتجاه الواجهة" className={control} value={direction} onChange={(event) => setDirection(event.target.value as Direction | 'profile')}>
                <option value="profile">حسب ملف التجربة</option>
                <option value="rtl">من اليمين إلى اليسار · RTL</option>
                <option value="ltr">من اليسار إلى اليمين · LTR</option>
              </select>
            </label>
            <p className="text-[12px] leading-6 text-fg-2">جرّب كثافة «مدمجة» مع نقطة البيع: سترفضها قواعد التوافق، مع توضيح السبب.</p>
            <button type="button" className={action} disabled={!result.ok} onClick={() => { if (result.ok) downloadJson('hayzoui-experience-plan.json', result.plan) }} style={{ opacity: result.ok ? 1 : 0.5 }}>تنزيل خطة التجربة ↓</button>
          </form>

          <div className="min-w-0 bg-surface p-5 sm:p-7">
            {result.ok ? (
              <>
                <p role="status" className="mb-5 flex items-center gap-2 text-[14px] font-medium text-success"><span aria-hidden="true">●</span> الاختيارات متوافقة — حُسبت خطة التجربة</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-[13px]">
                    <thead className="border-b border-line text-fg-2"><tr><th scope="col" className="py-3 text-start font-medium">البُعد</th><th scope="col" className="px-3 py-3 text-start font-medium">القيمة الفعلية</th><th scope="col" className="py-3 text-start font-medium">المصدر</th></tr></thead>
                    <tbody className="divide-y divide-line">
                      {([
                        ['locale', 'اللغة'], ['direction', 'الاتجاه'], ['density', 'الكثافة'], ['numberingSystem', 'الأرقام'], ['motion', 'الحركة'],
                      ] as const).map(([field, label]) => (
                        <tr key={field}><th scope="row" className="py-3 text-start font-normal text-fg">{label}</th><td className="px-3 py-3 font-mono text-fg"><bdi dir="ltr" data-context-value={field}>{result.plan.context[field]}</bdi></td><td className="py-3 font-mono text-[11px] text-fg-2"><bdi dir="ltr">{result.plan.trace[field]?.source.id}</bdi></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-5 border-t border-line pt-5">
                  <h3 className="text-[13px] font-medium text-fg">طبقات الـtokens المطلوبة بنسخها المحددة</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">{result.plan.tokenLayers.map((layer) => <li key={layer.id} className="rounded border border-line bg-sunken px-2.5 py-1.5 font-mono text-[11px] text-fg-2"><bdi dir="ltr">{layer.id}@{layer.version}</bdi></li>)}</ul>
                  <p className="mt-3 text-[12px] leading-6 text-fg-2">المعروض هنا خطة تحميل الطبقات. هذه الصفحة لا تشغّل محرك الـtokens ولا تعرض مكوّنات Atomic جديدة.</p>
                </div>
                <details className="mt-5 border-t border-line pt-4">
                  <summary className="cursor-pointer text-[13px] font-medium text-link">فحص الخطة كاملة · JSON</summary>
                  <pre dir="ltr" className="mt-3 max-h-72 overflow-auto rounded bg-sunken p-4 text-start font-mono text-[11px] leading-6 text-fg">{JSON.stringify(result.plan, null, 2)}</pre>
                </details>
              </>
            ) : (
              <div role="alert" className="rounded border border-danger bg-danger-bg p-5 text-danger">
                <h3 className="text-[18px] font-semibold">الاختيارات غير متوافقة</h3>
                <p className="mt-3 text-[14px] leading-7">{result.issues.some((issue) => issue.code === 'unsupported-density') ? 'هذه الكثافة لا يدعمها نظام العرض وسياق المنتج معًا. اختر كثافة أخرى أو غيّر ملف التجربة.' : 'تعذّر تكوين خطة بهذه الاختيارات. التفاصيل التقنية أدناه.'}</p>
                <ul className="mt-4 space-y-3 text-[12px]">{result.issues.map((issue, index) => <li key={`${issue.path}-${index}`}><bdi dir="ltr" className="block font-mono">{issue.code}</bdi><bdi dir="ltr" className="mt-1 block break-words font-mono">{issue.path}</bdi></li>)}</ul>
                <p className="mt-5 text-[12px] leading-6">لم تُرجع الأساسات خطة جزئية؛ يمكنك تعديل الاختيارات أو إعادة الضبط.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-line pt-9" aria-labelledby="reference-heading">
        <p className="t-eyebrow mb-2">المرجع البصري الموجود حاليًا</p>
        <h2 id="reference-heading" className="text-[25px] font-semibold text-fg">واجهات تقدر تفتحها وتجربها.</h2>
        <p className="mt-2 max-w-[76ch] text-[14px] leading-7 text-fg-2">هذه الشاشات من النظام المرجعي السابق، وتساعدنا في مقارنة السلوك والتصميم. الأساسات الذرّية الجديدة لم تستبدل تنفيذها بعد.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ['#/components/currency-input', 'استكشاف المكوّنات', `${digits(String(COMPONENTS.length))} مكوّنًا موثقًا؛ جرّب المبالغ العربية والحقول والجداول.`, 'المكوّنات ↗'],
            ['#/studio', 'استوديو السمات', 'جرّب اللون والخط والكثافة على معاينات النظام المرجعي.', 'فتح الاستوديو ↗'],
            ['#/app', 'تطبيق العمليات', 'راجع رحلة العملاء والفواتير والتحصيل في التطبيق التجريبي.', 'تجربة التطبيق ↗'],
          ].map(([href, title, body, label]) => <a key={href} href={href} className="group rounded-[var(--ax-radius-surface)] border border-line-2 p-5 transition-colors hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><h3 className="text-[18px] font-semibold text-fg">{title}</h3><p className="mt-3 text-[14px] leading-7 text-fg-2">{body}</p><span className="mt-5 inline-block text-[13px] font-medium text-link">{label}</span></a>)}
        </div>
      </section>
      <footer className="mt-10 flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-[12px] leading-6 text-fg-2"><span>التالي: نقل نمط «إضافة عميل والتحصيل» إلى المكوّنات الجديدة ومقارنته بالتطبيق المرجعي.</span><a href={`${REPO}/tree/main/docs/architecture`} target="_blank" rel="noreferrer" className="text-link underline underline-offset-4">الكود وخطة المعمارية ↗</a></footer>
    </div>
  )
}
