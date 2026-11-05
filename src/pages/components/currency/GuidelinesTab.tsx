import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CURRENCIES, formatAmount, parseAmount, type AmountErrorCode } from '../../../arabic'
import { amountErrorMessage, requiredAmountMessage } from '../../../content/messages'
import { CurrencyInput, DataTable, Icon, SegmentedControl, useLocale, type CurrencyInputHandle, type Dir } from '../../../system'
import { PreviewFrame, Section } from '../../../app/ui'
import type { Density, Mode } from '../../../tokens/theme'
import { visibleInput } from './shared'

function Specimen({ title, draft, children }: { title: string; draft?: string; children: (ref: React.RefObject<CurrencyInputHandle | null>) => ReactNode }) {
  const ref = useRef<CurrencyInputHandle>(null)
  useEffect(() => {
    if (draft !== undefined) ref.current?.setDraft(draft)
  }, [draft])
  return (
    <div className="flex min-w-0 flex-col gap-3 bg-surface p-5">
      <p className="t-caption font-medium text-fg-2">{title}</p>
      {children(ref)}
    </div>
  )
}

function StateMatrix() {
  const [dir, setDir] = useState<Dir>('rtl')
  const [mode, setMode] = useState<Mode>('light')
  const ltr = dir === 'ltr'
  const label = ltr ? 'Amount received' : 'المبلغ المستلم'
  const labels = ltr ? { clear: 'Clear amount', suggestionsIntro: 'Did you mean:', currencyPrefix: 'in' } : undefined
  const common = { label, labels }
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        <SegmentedControl label="الاتجاه" value={dir} onValueChange={setDir} options={[{ value: 'rtl', label: 'RTL' }, { value: 'ltr', label: 'LTR' }]} />
        <SegmentedControl label="السمة" value={mode} onValueChange={setMode} options={[{ value: 'light', label: 'فاتح' }, { value: 'dark', label: 'داكن' }]} />
      </div>
      <PreviewFrame dir={dir} mode={mode} className="overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2" label="مصفوفة حالات حقل المبلغ">
        <div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-4" key={dir + mode}>
          <Specimen title="default · فارغ">{(r) => <CurrencyInput ref={r} {...common} />}</Specimen>
          <Specimen title="hover">{(r) => <CurrencyInput ref={r} {...common} defaultValue={123450} forceState="hover" />}</Specimen>
          <Specimen title="focus-visible">{(r) => <CurrencyInput ref={r} {...common} forceState="focus-visible" />}</Specimen>
          <Specimen title="مُدخل">{(r) => <CurrencyInput ref={r} {...common} defaultValue={123450} />}</Specimen>
          <Specimen title="invalid · فاصلة ملتبسة" draft="1234,50">{(r) => <CurrencyInput ref={r} {...common} />}</Specimen>
          <Specimen title="required · فارغ بعد المغادرة" draft="">{(r) => <CurrencyInput ref={r} {...common} />}</Specimen>
          <Specimen title="disabled">{(r) => <CurrencyInput ref={r} {...common} defaultValue={123450} disabled />}</Specimen>
          <Specimen title="readonly">{(r) => <CurrencyInput ref={r} {...common} defaultValue={123450} readOnly />}</Specimen>
        </div>
      </PreviewFrame>
    </div>
  )
}

function SizeDensity() {
  const densities: Array<[Density, string]> = [
    ['compact', 'مضغوطة · ERP'],
    ['default', 'افتراضية'],
    ['touch', 'لمسية · نقاط البيع'],
  ]
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line md:grid-cols-3">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div key={size} className="flex flex-col gap-3 bg-surface p-5">
            <p className="t-caption font-medium text-fg-2">
              الحجم <bdi dir="ltr" className="ax-mono">{size}</bdi>
            </p>
            <CurrencyInput label="المبلغ" size={size} defaultValue={123450} />
          </div>
        ))}
      </div>
      <div className="grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line md:grid-cols-3">
        {densities.map(([d, name]) => (
          <PreviewFrame key={d} density={d} className="flex flex-col gap-3 p-5">
            <p className="t-caption font-medium text-fg-2">الكثافة: {name}</p>
            <CurrencyInput label="المبلغ" defaultValue={123450} />
          </PreviewFrame>
        ))}
      </div>
      <p className="t-body text-fg-2">الحجم خاصية للمكوّن تختار التأكيد داخل نموذج واحد (الحجم الكبير لحقل المبلغ الرئيسي). الكثافة إعداد من السمة يطبَّق على المنتج كله: ERP المضغوط لا يحتاج الارتفاع نفسه الذي تحتاجه شاشة لمس في نقطة بيع.</p>
    </div>
  )
}

function ContentTable() {
  const inputs = ['1234.50', '١٢٣٤٫٥٠', '۱۲۳۴٫۵۰', '١٬٢٣٤٫٥٠', '\u200f1234.50', '19.99', '1234,50', '1.2.3', '']
  const rows = inputs.map((input) => ({ input, r: parseAmount(input, { currency: 'EGP' }) }))
  return (
    <DataTable
      label="أمثلة المحتوى"
      rows={rows}
      rowKey={(x) => x.input || 'empty'}
      minWidth={720}
      columns={[
        { key: 'in', header: 'ما كُتب', cell: (x) => <bdi dir="ltr" className="ax-mono">{x.input === '' ? '""' : visibleInput(x.input)}</bdi> },
        { key: 'st', header: 'النتيجة', cell: (x) => (x.r.status === 'valid' ? 'صالح' : x.r.status === 'empty' ? 'فارغ' : <span className="text-danger">مرفوض</span>) },
        { key: 'v', header: <>التخزين <bdi dir="ltr" className="ax-mono">value</bdi></>, numeric: true, cell: (x) => <bdi dir="ltr" className="ax-mono">{x.r.minor ?? 'null'}</bdi> },
        { key: 'l', header: 'عرض لاتيني', numeric: true, cell: (x) => (x.r.minor == null ? '—' : <bdi dir="ltr">{formatAmount(x.r.minor, { currency: 'EGP', numerals: 'latn' })}</bdi>) },
        { key: 'a', header: 'عرض مشرقي', numeric: true, cell: (x) => (x.r.minor == null ? '—' : <bdi dir="ltr">{formatAmount(x.r.minor, { currency: 'EGP', numerals: 'arab' })}</bdi>) },
      ]}
    />
  )
}

function Mock({ text, affix = 'ج.م', error, invalid }: { text: string; affix?: string; error?: string; invalid?: boolean }) {
  return (
    <div className="ax-field" aria-hidden="true">
      <span className="ax-field__label">المبلغ المستلم</span>
      <div className="ax-control" data-invalid={invalid || error ? '' : undefined} data-dir="rtl">
        <span className="ax-control__input ax-currency__input ax-num flex items-center justify-end" dir="ltr" style={{ textAlign: 'right' }}>
          {text}
        </span>
        {affix ? <span className="ax-control__affix">{affix}</span> : null}
      </div>
      {error ? (
        <p className="ax-field__error-text">
          <Icon name="error" size={16} />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}

function DoDont({ doTitle, doNote, doSpecimen, dontTitle, dontNote, dontSpecimen }: { doTitle: string; doNote: string; doSpecimen: ReactNode; dontTitle: string; dontNote: string; dontSpecimen: ReactNode }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line md:grid-cols-2">
      {[
        { ok: true, title: doTitle, note: doNote, spec: doSpecimen },
        { ok: false, title: dontTitle, note: dontNote, spec: dontSpecimen },
      ].map((x) => (
        <figure key={String(x.ok)} className="flex flex-col bg-surface">
          <div className="border-b border-line bg-sunken px-6 py-7">
            <div className="mx-auto max-w-[22rem]">{x.spec}</div>
          </div>
          <figcaption className="flex flex-col gap-1 px-5 py-4">
            <span className={['flex items-center gap-2 t-label', x.ok ? 'text-success' : 'text-danger'].join(' ')}>
              <Icon name={x.ok ? 'success' : 'error'} size={17} />
              {x.ok ? 'افعل' : 'لا تفعل'}: <span className="text-fg">{x.title}</span>
            </span>
            <span className="t-body text-fg-2">{x.note}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

export function GuidelinesTab() {
  const { numerals } = useLocale()
  const codes: AmountErrorCode[] = ['ambiguous-comma', 'multiple-decimal', 'too-many-fraction-digits', 'invalid-character', 'invalid-grouping', 'negative-not-allowed', 'sign-position', 'too-large', 'below-min', 'above-max']
  return (
    <div>
      <Section eyebrow="الأشكال" title="الأحجام والكثافة">
        <SizeDensity />
      </Section>
      <Section eyebrow="الحالات" title="كل حالة في الاتجاهين والسمتين" intro="كل خلية هنا مكوّن حقيقي. الحالتان hover وfocus-visible مثبّتتان للعرض بخاصية forceState المخصصة للوحات الحالات فقط.">
        <StateMatrix />
      </Section>
      <Section eyebrow="المحتوى" title="عربي ولاتيني ومختلط" intro="النتائج في الجدول محسوبة الآن من الدالة نفسها التي يستخدمها الحقل. قيمة التخزين واحدة أيًا كان نظام الأرقام.">
        <ContentTable />
        <div className="mt-8 grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line md:grid-cols-3">
          <div className="flex flex-col gap-3 bg-surface p-5">
            <p className="t-caption font-medium text-fg-2">تسمية عربية طويلة تلتف</p>
            <CurrencyInput label="المبلغ المستلم من العميل نقدًا أو بتحويل بنكي، شاملًا رسوم الخدمة المتفق عليها" defaultValue={123450} />
          </div>
          <div className="flex flex-col gap-3 bg-surface p-5">
            <p className="t-caption font-medium text-fg-2">تسمية مختلطة</p>
            <CurrencyInput label={<>المبلغ بعملة <bdi dir="ltr">EGP</bdi> للفاتورة <bdi dir="ltr" className="ax-mono">INV-2026-0148</bdi></>} currencyDisplay="code" defaultValue={123450} />
          </div>
          <PreviewFrame dir="ltr" className="flex flex-col gap-3 p-5">
            <p className="t-caption font-medium text-fg-2" dir="rtl">
              واجهة LTR للمقارنة
            </p>
            <CurrencyInput label="Amount received" currencyDisplay="code" defaultValue={123450} labels={{ clear: 'Clear amount' }} />
          </PreviewFrame>
        </div>
      </Section>
      <Section eyebrow="الممارسة" title="افعل ولا تفعل" intro="الأشكال في هذا القسم رسوم توضيحية ثابتة، وليست المكوّن التفاعلي.">
        <div className="flex flex-col gap-6">
          <DoDont
            doTitle="ارفض الفاصلة واعرض المعنى المحتمل"
            doNote="الشخص يختار «1,234.50» أو يصحح بنفسه. لا يتغير المبلغ دون علمه."
            doSpecimen={<Mock text="1234,50" error="الفاصلة «,» قد تعني فاصلة عشرية أو فاصل آلاف، لذلك لم نفسّرها." />}
            dontTitle="احذف الفاصلة بصمت"
            dontNote="«1234,50» تصبح «123,450.00»: المبلغ تضاعف مئة مرة ولم يلاحظ أحد."
            dontSpecimen={<Mock text="123,450.00" />}
          />
          <DoDont
            doTitle="اجعل العملة لاحقة ثابتة"
            doNote="العملة معلومة للحقل. الشخص يكتب أرقامًا فقط، وقارئ الشاشة يسمع «بعملة الجنيه المصري»."
            doSpecimen={<Mock text="1,234.50" />}
            dontTitle="اطلب كتابة العملة داخل الحقل"
            dontNote="«50 ج.م» تخلط الحروف بالأرقام وتفرض تحليلًا هشًا. حقلنا يرفضها ويشرح السبب."
            dontSpecimen={<Mock text="50 ج.م" affix="" error="«ج» ليس رقمًا ولا فاصلة مدعومة." />}
          />
          <DoDont
            doTitle="أبقِ الحقل فارغًا بعد المسح"
            doNote="الفراغ يعني أن المبلغ لم يُحدد بعد. عند الإرسال تظهر «أدخل المبلغ»."
            doSpecimen={<Mock text="" error={requiredAmountMessage} />}
            dontTitle="حوّل الفراغ إلى صفر أو أعد آخر قيمة"
            dontNote="«0.00» مبلغ حقيقي قد يُسجَّل، والقيمة القديمة قد تُحصَّل مرة ثانية."
            dontSpecimen={<Mock text="0.00" />}
          />
          <DoDont
            doTitle="اشرح السبب وطريقة الإصلاح"
            doNote="الرسالة تذكر القاعدة وتؤكد أن القيمة لم تُقرَّب."
            doSpecimen={<Mock text="12.345" error={amountErrorMessage({ code: 'too-many-fraction-digits', minorDigits: 2 }, 'EGP', numerals)} />}
            dontTitle="اكتفِ بـ «قيمة غير صالحة»"
            dontNote="لا يعرف الشخص ما الخطأ: الفاصلة؟ عدد الأرقام؟ العملة؟"
            dontSpecimen={<Mock text="12.345" error="قيمة غير صالحة" />}
          />
        </div>
      </Section>
      <Section eyebrow="الكتابة" title="نصوص الرسائل" intro={'كل رسالة مولّدة من رمز الخطأ في طبقة المحتوى؛ المكوّن لا يحتوي نصوصًا ثابتة. الحدود المعروضة هنا مثال بمدى ١ – ٥٠ ٠٠٠.'}>
        <DataTable
          label="نصوص رسائل حقل المبلغ"
          rows={[{ code: 'required' as const }, ...codes.map((code) => ({ code }))]}
          rowKey={(r) => r.code}
          minWidth={640}
          columns={[
            { key: 'c', header: 'الرمز', width: '13rem', cell: (r) => <bdi dir="ltr" className="ax-mono text-fg-2">{r.code}</bdi> },
            {
              key: 'm',
              header: 'النص المعروض',
              cell: (r) =>
                r.code === 'required'
                  ? requiredAmountMessage
                  : amountErrorMessage({ code: r.code, char: r.code === 'invalid-character' ? 'ج' : ',', minorDigits: CURRENCIES.EGP.minorDigits, bound: r.code === 'below-min' ? 100 : 5000000 }, 'EGP', numerals),
            },
          ]}
        />
      </Section>
    </div>
  )
}
