import { useEffect, useMemo, useRef, useState } from 'react'
import { CURRENCIES, parseAmount, type AmountParseResult } from '../../../arabic'
import { Button, CurrencyInput, SegmentedControl, Select, Switch, type CurrencyInputHandle } from '../../../system'
import { CodeBlock, PreviewFrame, useMediaQuery } from '../../../app/ui'
import { generateCode, HELPER, LABELS, PAYMENT_RANGE, stateDraft, type LabSettings, type LabState } from './lab'
import { ContractStrip, stepLabel, StatusBadge } from './shared'
import { SampleChips } from './OverviewTab'

const STATES: Array<{ value: LabState; label: string }> = [
  { value: 'interactive', label: 'تفاعلي' },
  { value: 'empty', label: 'فارغ' },
  { value: 'filled', label: 'مُدخل' },
  { value: 'invalid', label: 'غير صالح' },
  { value: 'required', label: 'مطلوب وفارغ' },
  { value: 'hover', label: 'مرور المؤشر' },
  { value: 'focus-visible', label: 'تركيز' },
  { value: 'disabled', label: 'معطّل' },
  { value: 'readonly', label: 'للقراءة فقط' },
]

function ControlGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-t border-line px-5 py-4 first:border-t-0">
      <legend className="sr-only">{title}</legend>
      <p className="t-eyebrow" aria-hidden="true">
        {title}
      </p>
      {children}
    </fieldset>
  )
}

export function LabTab({ settings: s, onChange }: { settings: LabSettings; onChange: (p: Partial<LabSettings>) => void }) {
  const ref = useRef<CurrencyInputHandle>(null)
  const [result, setResult] = useState<AmountParseResult>(() => parseAmount('', { currency: s.currency }))
  const wide = useMediaQuery('(min-width: 1024px)')
  // Remount when settings that define the instance change, so presets are applied from a clean state.
  const instanceKey = [s.state, s.currency, s.validateOn, s.dir, s.label].join('|')
  const label = LABELS[s.label]
  const bounds = s.range === 'payment' ? PAYMENT_RANGE : { min: null, max: null }

  useEffect(() => {
    const draft = stateDraft(s.state)
    if (draft == null) return
    const t = setTimeout(() => {
      if (draft !== '' || s.state === 'required') ref.current?.setDraft(draft)
      if (s.state === 'empty' || s.state === 'focus-visible') setResult(parseAmount('', { currency: s.currency }))
    })
    return () => clearTimeout(t)
  }, [instanceKey])

  const code = useMemo(() => generateCode(s), [s])

  const controls = (
    <div className="flex flex-col">
      <ControlGroup title="الحالة">
        <Select label="حالة العرض" value={s.state} onValueChange={(v) => onChange({ state: v })} options={STATES} size="sm" />
      </ControlGroup>
      <ControlGroup title="الشكل">
        <SegmentedControl label="الحجم" fullWidth value={s.size} onValueChange={(v) => onChange({ size: v })} options={[{ value: 'sm', label: 'صغير' }, { value: 'md', label: 'متوسط' }, { value: 'lg', label: 'كبير' }]} />
        <SegmentedControl label="الكثافة" fullWidth value={s.density} onValueChange={(v) => onChange({ density: v })} options={[{ value: 'compact', label: 'مضغوطة' }, { value: 'default', label: 'افتراضية' }, { value: 'touch', label: 'لمسية' }]} />
        <SegmentedControl label="السمة" fullWidth value={s.mode} onValueChange={(v) => onChange({ mode: v })} options={[{ value: 'light', label: 'فاتح' }, { value: 'dark', label: 'داكن' }]} />
      </ControlGroup>
      <ControlGroup title="اللغة والأرقام">
        <SegmentedControl label="اتجاه الواجهة" fullWidth value={s.dir} onValueChange={(v) => onChange({ dir: v, label: v === 'ltr' ? 'english' : s.label === 'english' ? 'short' : s.label })} options={[{ value: 'rtl', label: 'RTL عربي' }, { value: 'ltr', label: 'LTR' }]} />
        <SegmentedControl label="أرقام العرض" fullWidth value={s.numerals} onValueChange={(v) => onChange({ numerals: v })} options={[{ value: 'latn', label: <bdi dir="ltr">1234.50</bdi>, ariaLabel: 'لاتينية' }, { value: 'arab', label: '١٢٣٤٫٥٠', ariaLabel: 'مشرقية' }]} />
        <Select label="نص التسمية" size="sm" value={s.label} onValueChange={(v) => onChange({ label: v })} options={[{ value: 'short', label: 'قصير' }, { value: 'long', label: 'عربي طويل' }, { value: 'english', label: 'إنجليزي (LTR)' }]} />
      </ControlGroup>
      <ControlGroup title="القواعد">
        <Select label="العملة" size="sm" value={s.currency} onValueChange={(v) => onChange({ currency: v })} options={(['EGP', 'SAR', 'KWD'] as const).map((c) => ({ value: c, label: `${CURRENCIES[c].nameAr} (${CURRENCIES[c].minorDigits === 3 ? '٣ أرقام عشرية' : 'رقمان عشريان'})` }))} />
        <SegmentedControl label="عرض العملة" fullWidth value={s.currencyDisplay} onValueChange={(v) => onChange({ currencyDisplay: v })} options={[{ value: 'symbol', label: 'رمز' }, { value: 'code', label: 'رمز ISO' }, { value: 'none', label: 'بلا' }]} />
        <SegmentedControl label="المدى" fullWidth value={s.range} onValueChange={(v) => onChange({ range: v })} options={[{ value: 'none', label: 'بلا حدود' }, { value: 'payment', label: '١ – ٥٠ ٠٠٠' }]} />
        <SegmentedControl label="إظهار التحقق" fullWidth value={s.validateOn} onValueChange={(v) => onChange({ validateOn: v })} options={[{ value: 'blur', label: 'عند المغادرة' }, { value: 'change', label: 'أثناء الكتابة' }]} />
        <Switch label="اختياري" checked={s.optional} onCheckedChange={(v) => onChange({ optional: v })} description="يُظهر «اختياري» ويلغي رسالة «أدخل المبلغ»." />
        <Switch label="يسمح بالسالب" checked={s.allowNegative} onCheckedChange={(v) => onChange({ allowNegative: v })} />
      </ControlGroup>
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-surface lg:grid lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col">
          <PreviewFrame dir={s.dir} mode={s.mode} density={s.density} numerals={s.numerals} className="flex flex-1 flex-col" label="معاينة حقل المبلغ">
            <div className="flex flex-1 items-center justify-center bg-sunken px-5 py-12 md:px-12 md:py-16">
              <div className="w-full max-w-[26rem] rounded-[var(--ax-radius-surface)] border border-line bg-surface p-5 shadow-[var(--ax-elevation-1)]">
                <CurrencyInput
                  key={instanceKey}
                  ref={ref}
                  label={label}
                  helper={HELPER[s.dir]}
                  size={s.size}
                  currency={s.currency}
                  currencyDisplay={s.currencyDisplay}
                  optional={s.optional}
                  allowNegative={s.allowNegative}
                  min={bounds.min}
                  max={bounds.max}
                  validateOn={s.validateOn}
                  disabled={s.state === 'disabled'}
                  readOnly={s.state === 'readonly'}
                  forceState={s.state === 'hover' ? 'hover' : s.state === 'focus-visible' ? 'focus-visible' : undefined}
                  labels={s.dir === 'ltr' ? { clear: 'Clear amount', suggestionsIntro: 'Did you mean:', currencyPrefix: 'in' } : undefined}
                  onParse={setResult}
                />
              </div>
            </div>
          </PreviewFrame>
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3">
            <SampleChips onPick={(t) => ref.current?.setDraft(t)} />
          </div>
          <div className="border-t border-line">
            <ContractStrip result={result} currency={s.currency} numerals={s.numerals} />
          </div>
        </div>
        {wide ? (
          <aside className="max-h-[52rem] overflow-y-auto border-s border-line bg-surface" aria-label="إعدادات المعاينة">
            {controls}
          </aside>
        ) : (
          <details className="border-t border-line" open>
            <summary className="cursor-pointer px-5 py-3 t-label text-fg">إعدادات المعاينة</summary>
            {controls}
          </details>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="trace-h">
          <div className="mb-3 flex items-center gap-2">
            <h3 id="trace-h" className="t-h3 text-fg">
              مسار التطبيع
            </h3>
            <StatusBadge result={result} />
          </div>
          {result.steps.length === 0 && result.status !== 'invalid' ? (
            <p className="t-body text-fg-2">{result.status === 'empty' ? 'لا يوجد إدخال. القيمة null وليست صفرًا.' : 'لم يحتج الإدخال إلى أي تحويل.'}</p>
          ) : (
            <ol className="flex flex-col divide-y divide-line border-y border-line">
              {result.steps.map((st, i) => (
                <li key={i} className="t-body py-2 text-fg">
                  {stepLabel(st, s.numerals)}
                </li>
              ))}
              {result.status === 'invalid' ? (
                <li className="t-body py-2 text-danger">توقف التحليل: <bdi dir="ltr" className="ax-mono">{result.error?.code}</bdi>. لم يُحذف أي حرف ولم تُغيَّر القيمة.</li>
              ) : null}
            </ol>
          )}
          <p className="mt-3 t-caption text-fg-3">هذا المسار للشرح في المستكشف فقط؛ واجهة الموظف في التطبيق المرجعي لا تعرض الصيغة القياسية.</p>
        </section>
        <section aria-labelledby="code-h">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 id="code-h" className="t-h3 text-fg">
              الكود المطابق
            </h3>
            <Button variant="ghost" size="sm" iconStart="reset" onClick={() => onChange({ state: 'interactive', size: 'lg', currency: 'EGP', currencyDisplay: 'symbol', optional: false, allowNegative: false, range: 'none', validateOn: 'blur', label: 'short', dir: 'rtl' })}>
              إعادة الضبط
            </Button>
          </div>
          <CodeBlock code={code} label="الكود" caption="مولَّد من الإعدادات الحالية · TSX" maxHeight={360} />
          <p className="mt-2 t-caption text-fg-3">الكثافة والسمة تأتيان من SettingsProvider لا من خصائص المكوّن. «الحالة» إعداد للمعاينة فقط ولا يظهر في الكود إلا إن كانت disabled أو readOnly.</p>
        </section>
      </div>
    </div>
  )
}
