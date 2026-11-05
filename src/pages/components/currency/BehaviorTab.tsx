import { CurrencyInput, DataTable, Kbd } from '../../../system'
import { N, PreviewFrame, Section } from '../../../app/ui'

const ACCEPT = [
  ['0-9', 'أرقام لاتينية', 'مقبولة'],
  ['٠-٩', 'أرقام عربية مشرقية U+0660–0669', 'مقبولة وتُحوَّل'],
  ['۰-۹', 'أرقام فارسية U+06F0–06F9', 'مقبولة وتُحوَّل'],
  ['.', 'نقطة', 'فاصلة عشرية'],
  ['٫', 'فاصلة عشرية عربية U+066B', 'فاصلة عشرية'],
  ['٬', 'فاصل آلاف عربي U+066C', 'مقبول في مجموعات من ثلاثة فقط'],
  ['␠', 'مسافة', 'مقبولة في مجموعات من ثلاثة فقط'],
  [', ،', 'فاصلة لاتينية أو عربية', 'مرفوضة مع اقتراحات'],
  ['-', 'علامة سالب', 'قبل الرقم فقط، وحين يسمح الحقل'],
  ['RLM LRM ALM', 'علامات اتجاه خفية', 'تُزال (لا تحمل قيمة)'],
  ['أي حرف آخر', 'حروف، رموز عملات', 'مرفوض ولا يُحذف'],
] as const

const KEYS = [
  [['Tab'], 'عند الدخول: يتحول المبلغ إلى صيغة التحرير بلا فواصل ويُحدَّد كله، فالكتابة تستبدله. عند المغادرة: تُنسَّق القيمة الصالحة ويظهر التحقق.'],
  [['Shift', 'Tab'], 'ينتقل إلى الحقل السابق بالسلوك نفسه.'],
  [['Enter'], 'داخل نموذج: يرسل النموذج كالمعتاد. الحقل لا يعترضه.'],
  [['Esc'], 'إن تغيّر النص منذ دخول الحقل: يعيده كما كان ويمنع إغلاق الحوار الأب. وإلا يمر الحدث للحوار.'],
  [['↑', '↓'], 'لا يغيّر القيمة عمدًا؛ زيادة المبلغ بالأسهم تسبب تعديلات غير مقصودة.'],
  [['Ctrl', 'V'], 'اللصق يمر بالتحليل نفسه؛ علامات الاتجاه الملصوقة تُزال.'],
] as const

const ARIA = [
  ['<label for>', 'التسمية الظاهرة', 'اسم الحقل الأساسي'],
  ['نص مخفي في التسمية', '«بعملة الجنيه المصري»', 'العملة في اللاحقة مخفية عن قارئ الشاشة لتجنب التكرار'],
  ['aria-describedby', 'الخطأ ثم النص المساعد', 'يُقرأ السبب قبل الإرشاد العام'],
  ['aria-invalid', 'true عند ظهور خطأ فقط', 'لا يُعلن الخطأ أثناء الكتابة الأولى'],
  ['aria-required', 'true ما لم يكن optional', 'الحقول المطلوبة لا تحمل نجمة بصرية؛ الاختيارية تحمل «اختياري»'],
  ['aria-live="polite"', 'منطقة الخطأ', 'يُعلن الخطأ عند ظهوره دون مقاطعة'],
  ['inputmode="decimal"', 'الحقل', 'لوحة أرقام على الأجهزة اللمسية'],
  ['aria-label', 'زر المسح: «مسح المبلغ»', 'اسم عربي لزر أيقوني'],
] as const

export function BehaviorTab() {
  return (
    <div>
      <Section eyebrow="العقود" title="ثلاثة عقود منفصلة" intro="ما يُكتب، وما يُخزَّن، وما يُعرض قرارات مستقلة. خلطها هو مصدر معظم أخطاء المبالغ في الواجهات العربية.">
        <div className="grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line lg:grid-cols-3">
          {[
            { t: 'الإدخال', c: 'arabic.amount.v1', d: 'يقبل كل أنظمة الأرقام، ويرفض الالتباس بدل تخمينه. النص غير الصالح يبقى كما كُتب.' },
            { t: 'التخزين', c: 'value: number | null', d: 'عدد صحيح بالوحدة الصغرى (قروش، هللات، فلوس) يُبنى من النص لا من الضرب. الفراغ والخطأ كلاهما null.' },
            { t: 'العرض', c: 'numerals: latn | arab', d: 'بفواصل آلاف وبنظام الأرقام المفضّل، عند مغادرة الحقل فقط. أثناء التحرير بلا فواصل ليُعاد تحليله دون التباس.' },
          ].map((x) => (
            <div key={x.t} className="flex flex-col gap-2 bg-surface p-5">
              <h3 className="t-h3 text-fg">{x.t}</h3>
              <bdi dir="ltr" className="ax-mono block text-end text-fg-2">
                {x.c}
              </bdi>
              <p className="t-body text-fg-2">{x.d}</p>
            </div>
          ))}
        </div>
        <h3 className="t-h3 mt-10 mb-3 text-fg">ما يقبله الإدخال</h3>
        <DataTable
          label="الأحرف المقبولة في حقل المبلغ"
          rows={ACCEPT.map((r) => ({ k: r[0], d: r[1], v: r[2] }))}
          rowKey={(r) => r.k}
          minWidth={560}
          columns={[
            { key: 'k', header: 'المحرف', width: '9rem', cell: (r) => <bdi dir="ltr" className="font-mono text-[15px]">{r.k}</bdi> },
            { key: 'd', header: 'الوصف', cell: (r) => r.d },
            { key: 'v', header: 'المعاملة', cell: (r) => <span className={r.v.startsWith('مرفوض') ? 'text-danger' : 'text-fg'}>{r.v}</span> },
          ]}
        />
      </Section>

      <Section eyebrow="لوحة المفاتيح" title="المفاتيح وسلوكها">
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {KEYS.map(([keys, desc]) => (
            <li key={keys.join('+')} className="grid gap-2 py-3 sm:grid-cols-[10rem_1fr]">
              <span className="flex items-center gap-1" dir="ltr" style={{ justifyContent: 'flex-end' }}>
                {keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
              <span className="t-body text-fg">{desc}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="الوصول" title="التسميات والإعلان" intro="مطبّق في الكود وموثق هنا. لم يُفحص بقارئ شاشة حقيقي بعد؛ انظر «المصدر والأدلة».">
        <DataTable
          label="خصائص الوصول في حقل المبلغ"
          rows={ARIA.map((r) => ({ a: r[0], v: r[1], w: r[2] }))}
          rowKey={(r) => r.a}
          minWidth={640}
          columns={[
            { key: 'a', header: 'الخاصية', width: '12rem', cell: (r) => <bdi className="ax-mono">{r.a}</bdi> },
            { key: 'v', header: 'القيمة', cell: (r) => r.v },
            { key: 'w', header: 'السبب', cell: (r) => <span className="text-fg-2">{r.w}</span> },
          ]}
        />
      </Section>

      <Section eyebrow="التوقيت" title="متى يظهر التحقق">
        <ol className="grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line md:grid-cols-4">
          {[
            ['أثناء الكتابة', 'لا رسائل افتراضيًا. القيمة تُحلَّل وتُرسل للأب مع الحالة.'],
            ['عند المغادرة', 'تظهر الرسالة، وتُنسَّق القيمة الصالحة بفواصل الآلاف.'],
            ['بعد محاولة الإرسال', 'showValidation يُظهر الأخطاء في كل الحقول، بما فيها «أدخل المبلغ».'],
            ['بعد التصحيح', 'تختفي الرسالة فور صلاحية القيمة؛ لا ينتظر المغادرة.'],
          ].map(([t, d], i) => (
            <li key={t} className="flex flex-col gap-1 bg-surface p-5">
              <span className="anatomy-dot mb-2"><N>{i + 1}</N></span>
              <span className="t-label text-fg">{t}</span>
              <span className="t-body text-fg-2">{d}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="الاتجاه" title="المرآة لا تقلب الأرقام" intro="في RTL ينعكس التخطيط: القيمة في بداية السطر (يمين) والعملة في نهايته (يسار). القيمة نفسها جزيرة LTR فلا تنقلب أرقامها ولا علامة السالب.">
        <div className="grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line md:grid-cols-2">
          <PreviewFrame dir="rtl" className="flex flex-col gap-3 p-5">
            <p className="t-caption font-medium text-fg-2">RTL</p>
            <CurrencyInput label="المبلغ" defaultValue={-123450} allowNegative />
          </PreviewFrame>
          <PreviewFrame dir="ltr" className="flex flex-col gap-3 p-5">
            <p className="t-caption font-medium text-fg-2" dir="rtl">
              LTR
            </p>
            <CurrencyInput label="Amount" defaultValue={-123450} allowNegative currencyDisplay="code" labels={{ clear: 'Clear amount' }} />
          </PreviewFrame>
        </div>
      </Section>
    </div>
  )
}
