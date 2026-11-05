import { DataTable } from '../../../system'
import { CodeBlock, Section } from '../../../app/ui'
import { generateCode, type LabSettings } from './lab'
import { getComponent } from '../../../knowledge'

const PROPS: Array<[string, string, string, string]> = [
  ['label', 'ReactNode', '—', 'التسمية الظاهرة. مطلوبة.'],
  ['value', 'number | null', '—', 'القيمة بالوحدة الصغرى. null تعني فارغًا أو غير صالح.'],
  ['defaultValue', 'number | null', 'null', 'للاستخدام غير المتحكَّم به.'],
  ['onValueChange', '(value, details) => void', '—', 'يُستدعى حين تتغير القيمة المخزنة. details.status و details.reason (input | clear | suggestion | escape).'],
  ['onParse', '(result) => void', '—', 'كل تحليل، بما فيه المسودات غير الصالحة. للأدوات والمستكشف.'],
  ['currency', "'EGP' | 'SAR' | 'KWD'", "'EGP'", 'تحدد عدد الأرقام العشرية والرمز.'],
  ['min / max', 'number | null', 'null', 'حدود شاملة بالوحدة الصغرى.'],
  ['allowNegative', 'boolean', 'false', 'السالب قبل الرقم فقط.'],
  ['optional', 'boolean', 'false', 'يُظهر «اختياري» ويلغي خطأ الفراغ.'],
  ['size', "'sm' | 'md' | 'lg'", "'md'", 'التأكيد داخل النموذج. الكثافة من السمة.'],
  ['validateOn', "'blur' | 'change'", "'blur'", 'توقيت ظهور الرسائل.'],
  ['showValidation', 'boolean', 'false', 'إظهار الأخطاء بعد محاولة إرسال.'],
  ['error', 'ReactNode', '—', 'خطأ خارجي (مثل رفض الخادم) يظهر في منطقة الخطأ نفسها.'],
  ['currencyDisplay', "'symbol' | 'code' | 'none'", "'symbol'", 'شكل اللاحقة.'],
  ['labels', 'Partial<{ clear, suggestionsIntro, currencyPrefix }>', 'رسائل العربية', 'النصوص الداخلية. القيم الافتراضية عربية.'],
  ['disabled / readOnly', 'boolean', 'false', 'readOnly يبقى قابلًا للتركيز والنسخ.'],
  ['forceState', "'hover' | 'focus-visible'", '—', 'للوحات الحالات فقط.'],
  ['ref', 'CurrencyInputHandle', '—', 'focus() · validate() · setDraft(text)'],
]

const CORE = `import { parseAmount, formatAmount } from '@/arabic'

const r = parseAmount('١٢٣٤٫٥٠', { currency: 'EGP' })
// r.status === 'valid', r.minor === 123450, r.canonical === '1234.50'

const bad = parseAmount('1234,50', { currency: 'EGP' })
// bad.status === 'invalid', bad.error.code === 'ambiguous-comma'
// bad.suggestions[0].canonical === '1234.50'   (never applied automatically)

formatAmount(123450, { currency: 'EGP', numerals: 'arab' })
// '١٬٢٣٤٫٥٠'`

export function CodeTab({ settings }: { settings: LabSettings }) {
  const record = getComponent('currency-input')!
  return (
    <div>
      <Section eyebrow="مثال" title="الاستخدام" intro={<>مولَّد من الإعدادات الحالية في <a className="text-link underline underline-offset-4" href="#/components/currency-input/lab">المعمل</a>. غيّر الإعدادات هناك وسيتغير هنا. المسار <bdi dir="ltr" className="ax-mono">@/system</bdi> مسار هذا النموذج؛ أسماء الحزم النهائية لم تُحدد.</>}>
        <CodeBlock code={generateCode(settings)} label="مثال الاستخدام" caption="TSX · مولَّد" />
      </Section>
      <Section eyebrow="الواجهة البرمجية" title="الخصائص">
        <DataTable
          label="خصائص CurrencyInput"
          rows={PROPS.map(([name, type, def, doc]) => ({ name, type, def, doc }))}
          rowKey={(r) => r.name}
          minWidth={760}
          columns={[
            { key: 'n', header: 'الخاصية', width: '11rem', nowrap: true, cell: (r) => <bdi dir="ltr" className="ax-mono font-medium text-fg">{r.name}</bdi> },
            { key: 't', header: 'النوع', cell: (r) => <bdi dir="ltr" className="ax-mono text-fg-2">{r.type}</bdi> },
            { key: 'd', header: 'الافتراضي', nowrap: true, cell: (r) => <bdi dir="ltr" className="ax-mono text-fg-2">{r.def}</bdi> },
            { key: 'x', header: 'الوصف', cell: (r) => r.doc },
          ]}
        />
      </Section>
      <Section eyebrow="الطبقة العربية" title="دوال نقية بلا DOM" intro="المكوّن طبقة رقيقة فوق دوال L2. يمكن استخدامها في الخادم أو في استيراد ملفات أو في اختبارات.">
        <CodeBlock code={CORE} label="مثال الطبقة العربية" caption="TypeScript · src/arabic/amount.ts" />
      </Section>
      <Section eyebrow="الحدود" title="قيود معروفة">
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {record.limitations.map((l) => (
            <li key={l} className="t-body py-3 text-fg">
              {l}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
