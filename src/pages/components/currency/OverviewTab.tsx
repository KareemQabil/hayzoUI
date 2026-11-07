import { useRef, useState } from 'react'
import { parseAmount, type AmountParseResult } from '../../../arabic'
import { Button, CurrencyInput, Icon, Literal, useLocale, type CurrencyInputHandle } from '../../../system'
import { RefLink, Section } from '../../../app/ui'
import { ContractStrip, StatusBadge } from './shared'
import { Anatomy } from './Anatomy'

export const SAMPLES: Array<{ text: string; label?: string; note: string }> = [
  { text: '1234.50', note: 'لاتيني' },
  { text: '١٢٣٤٫٥٠', note: 'مشرقي' },
  { text: '۱۲۳۴٫۵۰', note: 'فارسي' },
  { text: '1234,50', note: 'فاصلة ملتبسة' },
  { text: '1.2.3', note: 'فاصلتان' },
  { text: '12.345', note: 'كسور زائدة' },
  { text: '50 ج.م', note: 'رمز داخل الحقل' },
  { text: '', label: 'مسح', note: 'فارغ' },
]

export function SampleChips({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="أمثلة جاهزة للإدخال">
      {SAMPLES.map((s) => (
        <button
          key={s.text || 'empty'}
          type="button"
          onClick={() => onPick(s.text)}
          className="inline-flex items-center gap-1.5 rounded-[var(--ax-radius-control)] border border-line-2 bg-raised px-2 py-1 text-[13px] text-fg hover:border-line-3 hover:bg-sunken focus-visible:shadow-[var(--ax-focus-ring)] focus-visible:outline-none"
          aria-label={s.label ? `${s.label} الحقل` : `اكتب ${s.text} (${s.note})`}
        >
          {s.label ? (
            <>
              <Icon name="close" size={13} />
              {s.label}
            </>
          ) : (
            <bdi dir="ltr" className="font-mono text-[12.5px]">
              <Literal>{s.text}</Literal>
            </bdi>
          )}
          {!s.label ? <span className="text-fg-3 text-[11.5px]">{s.note}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function OverviewTab({ onOpenLab }: { onOpenLab: () => void }) {
  const { numerals } = useLocale()
  const ref = useRef<CurrencyInputHandle>(null)
  const [result, setResult] = useState<AmountParseResult>(() => parseAmount('', { currency: 'EGP' }))

  return (
    <div>
      <Section
        eyebrow="معاينة حية"
        title="اكتب مبلغًا بأي أرقام"
        intro="الحقل التالي هو المكوّن نفسه المستخدم في التطبيق المرجعي. لاحظ أن القيمة المخزنة لا تتغير بتغيّر نظام الأرقام، وأن الالتباس يُرفض بدل تخمينه."
        aside={
          <Button variant="outline" size="sm" iconEnd="forward" onClick={onOpenLab}>
            افتح المعمل الكامل
          </Button>
        }
      >
        <div className="overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-surface">
          <div className="grid gap-8 bg-sunken px-5 py-8 md:grid-cols-[minmax(0,26rem)_1fr] md:px-10 md:py-12">
            <div className="rounded-[var(--ax-radius-surface)] border border-line bg-surface p-5 shadow-[var(--ax-elevation-1)]">
              <CurrencyInput ref={ref} label="المبلغ المستلم" size="lg" helper="يقبل الأرقام العربية واللاتينية والفارسية. الفاصلة العشرية «.» أو «٫»." onParse={setResult} />
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-4">
              <div className="flex items-center gap-2">
                <span className="t-label text-fg">النتيجة</span>
                <StatusBadge result={result} />
              </div>
              <SampleChips onPick={(t) => ref.current?.setDraft(t)} />
              <p className="t-caption text-fg-2">
                الأمثلة تكتب في الحقل فعليًا ثم تغادره، فيظهر التحقق كما يظهر للمستخدم.
              </p>
            </div>
          </div>
          <ContractStrip result={result} currency="EGP" numerals={numerals} />
        </div>
      </Section>

      <Section eyebrow="الغرض" title="متى تستخدمه">
        <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
          <div>
            <h3 className="t-h3 mb-3 flex items-center gap-2 text-fg">
              <Icon name="check" size={18} className="text-success" />
              استخدمه حين
            </h3>
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {[
                'يُدخل شخص مبلغًا ماليًا سيُخزَّن أو يُحصَّل أو يُقارَن.',
                'العملة معروفة مسبقًا ودقتها ثابتة (رقمان أو ثلاثة بعد الفاصلة).',
                'قد يكتب المستخدم بلوحة مفاتيح عربية أو يلصق من نظام آخر.',
                'الخطأ في القيمة مكلف ويستحق رسالة تصحيح بدل التخمين.',
              ].map((t) => (
                <li key={t} className="t-body py-3 text-fg">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="t-h3 mb-3 flex items-center gap-2 text-fg">
              <Icon name="close" size={18} className="text-danger" />
              لا تستخدمه حين
            </h3>
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {[
                'الرقم كمية أو عدد قطع، لا مال: استخدم حقل رقم (مخطط).',
                'المبلغ يُختار من قيم ثابتة قليلة: استخدم المفتاح المقسّم.',
                'المبلغ للقراءة فقط في جدول أو إيصال: اعرضه نصًا منسقًا.',
                'العملة تتغير داخل الحقل نفسه: غير مدعوم في هذا الإصدار.',
              ].map((t) => (
                <li key={t} className="t-body py-3 text-fg">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section eyebrow="التشريح" title="الأجزاء وأسماؤها" intro="مرّر المؤشر أو التركيز على اسم الجزء لتمييزه في المكوّن الحقيقي. الأسماء نفسها مستخدمة في الكود والمواصفة.">
        <Anatomy />
      </Section>

      <Section eyebrow="في الاستخدام" title="أين يظهر">
        <div className="flex flex-col gap-3">
          <p className="t-body text-fg-2">يُستخدم في خطوة «أدخل المبلغ وطريقة التحصيل» من النمط التالي، وفي التطبيق المرجعي بنفس التطبيق وبنفس السمات.</p>
          <div className="flex flex-wrap gap-2">
            <RefLink kind="pattern" id="P-COLLECT-PAYMENT" />
            <a href="#/app" className="inline-flex items-center gap-1.5 rounded-[var(--ax-radius-control)] border border-line-2 bg-raised px-2 py-1 t-caption text-fg hover:border-line-3 hover:bg-sunken">
              <Icon name="wallet" size={14} className="text-fg-3" />
              التطبيق المرجعي — دفتر التحصيل
            </a>
          </div>
        </div>
      </Section>
    </div>
  )
}
