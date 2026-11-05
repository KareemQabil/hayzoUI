import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { toDisplayDigits } from '../../../arabic'
import { CurrencyInput, useLocale, type CurrencyInputHandle } from '../../../system'

const PARTS = [
  { key: 'label', name: 'label', ar: 'التسمية', desc: 'عنصر label حقيقي مرتبط بالحقل. تتضمن اسم العملة لقارئ الشاشة بنص مخفي.' },
  { key: 'control', name: 'control', ar: 'الإطار', desc: 'يحمل الحالة عبر data-invalid وdata-disabled وdata-readonly. الحد يتلون بالتركيز والخطأ.' },
  { key: 'input', name: 'input', ar: 'القيمة', desc: 'جزيرة LTR بأرقام جدولية. تُحاذى إلى بداية الحقل في الاتجاه الحالي.' },
  { key: 'clear', name: 'clear', ar: 'زر المسح', desc: 'اسمه المسموع «مسح المبلغ». يعيد التركيز إلى الحقل ويترك القيمة null.' },
  { key: 'affix', name: 'affix', ar: 'العملة', desc: 'لاحقة غير قابلة للتحرير في نهاية السطر. لا يُطلب كتابة العملة داخل الحقل.' },
  { key: 'error', name: 'error', ar: 'رسالة الخطأ', desc: 'منطقة حية مهذّبة مشار إليها بـ aria-describedby. تشرح السبب وطريقة الإصلاح.' },
  { key: 'suggest', name: 'suggestions', ar: 'الاقتراحات', desc: 'تفسيرات ممكنة كأزرار صريحة. لا يُطبَّق أي منها دون اختيار.' },
  { key: 'helper', name: 'helper', ar: 'النص المساعد', desc: 'يبقى ظاهرًا مع الخطأ. يشرح ما يقبله الحقل قبل أن يخطئ أحد.' },
] as const

export function Anatomy() {
  const ref = useRef<CurrencyInputHandle>(null)
  const { numerals } = useLocale()
  const [hl, setHl] = useState<string | null>(null)
  useEffect(() => {
    ref.current?.setDraft('1234,50')
  }, [])
  const vars = Object.fromEntries(PARTS.map((_, i) => [`--n${i + 1}`, `"${toDisplayDigits(String(i + 1), numerals)}"`])) as CSSProperties

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="flex items-center rounded-[var(--ax-radius-surface)] border border-line bg-sunken px-6 py-10 md:px-12">
        <div className="anatomy-specimen mx-auto w-full max-w-[26rem]" data-hl={hl ?? undefined} style={vars} aria-label="عينة تشريح حقل المبلغ" role="group">
          <CurrencyInput ref={ref} label="المبلغ المستلم" size="lg" helper="الفاصلة العشرية «.» أو «٫»." />
        </div>
      </div>
      <ol className="flex flex-col divide-y divide-line border-y border-line">
        {PARTS.map((p, i) => (
          <li key={p.key}>
            <button
              type="button"
              className="flex w-full items-start gap-3 py-2.5 text-start hover:bg-sunken focus-visible:bg-sunken focus-visible:outline-none data-[on]:bg-sunken"
              data-on={hl === p.key || undefined}
              onMouseEnter={() => setHl(p.key)}
              onMouseLeave={() => setHl(null)}
              onFocus={() => setHl(p.key)}
              onBlur={() => setHl(null)}
              aria-label={`${p.ar}: ${p.desc}`}
            >
              <span className="anatomy-dot mt-0.5">{toDisplayDigits(String(i + 1), numerals)}</span>
              <span className="min-w-0">
                <span className="flex items-baseline gap-2">
                  <span className="t-label text-fg">{p.ar}</span>
                  <bdi dir="ltr" className="font-mono text-[12px] text-fg-3">
                    {p.name}
                  </bdi>
                </span>
                <span className="block t-caption text-fg-2">{p.desc}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
