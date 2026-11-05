/**
 * Selection assistant — deterministic, rule-based recommendations from the dataset.
 * There is no model call. Every recommendation lists why it matched and its constraints.
 */
import { useMemo, useState } from 'react'
import { getComponent, getRule, knowledgeExport } from '../../knowledge'
import { Badge, Button, Drawer, InlineMessage, Select, Switch } from '../../system'
import { MaturityBadge, useCopy } from '../../app/ui'

type Task = 'amount' | 'phone' | 'find-person' | 'confirm' | 'list'
type Region = 'EG' | 'SA' | 'KW' | 'other'

interface Answers {
  task: Task
  framework: 'react' | 'other'
  density: 'compact' | 'default' | 'touch'
  region: Region
  arabicDigits: boolean
  paste: boolean
  negative: boolean
  screenReader: boolean
}

interface Rec {
  id: string
  why: string[]
  constraints: string[]
}

export function recommend(a: Answers): { recs: Rec[]; rules: string[]; patterns: string[]; unmatched?: string } {
  const recs: Rec[] = []
  const rules = new Set<string>()
  const patterns = new Set<string>()
  const common: string[] = []
  if (a.framework === 'other') common.push('المكونات مكتوبة لـ React فقط. دوال الطبقة العربية (src/arabic) مستقلة عن React ويمكن نقلها.')
  if (a.screenReader) common.push('لم يُفحص أي مكوّن بقارئ شاشة حقيقي بعد؛ السلوك موثّق ومختبر آليًا جزئيًا فقط.')
  if (a.density === 'touch') common.push('اضبط الكثافة اللمسية (ارتفاع ٤٨px) من السمة، واستخدم size="lg" للحقل الرئيسي.')
  if (a.density === 'compact') common.push('الكثافة المضغوطة (٣٢px) مناسبة للماوس ولوحة المفاتيح؛ لا تستخدمها على شاشات لمس.')

  if (a.task === 'amount') {
    const why = ['المهمة إدخال مبلغ مالي سيُخزَّن.']
    const constraints = [...common]
    if (a.arabicDigits) why.push('يقبل الأرقام المشرقية والفارسية ويحوّلها صراحة (R-NUM-001).')
    if (a.paste) why.push('يزيل علامات الاتجاه الخفية الملصوقة دون تغيير القيمة (R-BIDI-001).')
    if (a.negative) why.push('يدعم السالب بخاصية allowNegative، قبل الرقم فقط.')
    if (a.region === 'KW') why.push('الدينار الكويتي بثلاثة أرقام عشرية مدعوم (R-NUM-003).')
    if (a.region === 'other') constraints.push('العملات المدعومة الآن: EGP وSAR وKWD فقط.')
    recs.push({ id: 'currency-input', why, constraints })
    ;['R-NUM-001', 'R-NUM-002', 'R-NUM-003', 'R-NUM-005'].forEach((r) => rules.add(r))
    if (a.paste) rules.add('R-BIDI-001')
    patterns.add('P-COLLECT-PAYMENT')
  }
  if (a.task === 'phone') {
    if (a.region !== 'EG') return { recs: [], rules: [], patterns: [], unmatched: 'حقل الهاتف يدعم أرقام المحمول المصرية فقط في هذا الإصدار، فلا توجد توصية مطابقة لمنطقتك. استخدم حقل النص مع dir="ltr" مؤقتًا.' }
    recs.push({ id: 'phone-input', why: ['رقم محمول مصري يُخزَّن بصيغة E.164.', 'يُعرض جزيرة LTR في واجهة عربية (R-BIDI-001).', ...(a.arabicDigits ? ['يقبل الأرقام العربية (R-NUM-001).'] : [])], constraints: [...common, 'الأرقام الأرضية غير مدعومة.'] })
    ;['R-NUM-001', 'R-BIDI-001'].forEach((r) => rules.add(r))
  }
  if (a.task === 'find-person') {
    recs.push({ id: 'search-field', why: ['البحث متسامح مع الهمزة والتشكيل مع تظليل على الاسم الأصلي (R-SRCH-001).', 'يعلن عدد النتائج لقارئ الشاشة.'], constraints: [...common, 'ليس combobox؛ النتائج تُعرض في جدول منفصل.'] })
    recs.push({ id: 'data-table', why: ['نتائج قابلة للمسح البصري بأعمدة رقمية محاذاة.'], constraints: ['لا فرز ولا virtualization بعد.'] })
    ;['R-SRCH-001', 'R-SRCH-002'].forEach((r) => rules.add(r))
    patterns.add('P-COLLECT-PAYMENT')
  }
  if (a.task === 'confirm') {
    recs.push({ id: 'dialog', why: ['تأكيد إجراء مالي يحتاج تركيزًا محبوسًا وإعادة تركيز عند الإغلاق (R-A11Y-002).'], constraints: [...common, 'لا حركة خروج.'] })
    recs.push({ id: 'button', why: ['حالة loading تحرس الإرسال المكرر (R-FLOW-001).'], constraints: [] })
    ;['R-A11Y-002', 'R-FLOW-001', 'R-CNT-001'].forEach((r) => rules.add(r))
    patterns.add('P-COLLECT-PAYMENT')
  }
  if (a.task === 'list') {
    recs.push({ id: 'data-table', why: ['جدول دلالي يمرر داخل حاويته فقط ولا يسبب تمريرًا أفقيًا للصفحة.', 'الأرقام تتبع تفضيل العرض والمعرّفات تبقى لاتينية (R-NUM-004).'], constraints: [...common, 'لا فرز ولا virtualization؛ غير مناسب لعشرة آلاف صف بعد.'] })
    ;['R-NUM-004', 'R-BIDI-001'].forEach((r) => rules.add(r))
  }
  return { recs, rules: [...rules], patterns: [...patterns] }
}

export function Assistant({ open, onOpenChange, context }: { open: boolean; onOpenChange: (o: boolean) => void; context?: string }) {
  const [a, setA] = useState<Answers>({ task: context === 'currency-input' ? 'amount' : 'find-person', framework: 'react', density: 'default', region: 'EG', arabicDigits: true, paste: false, negative: false, screenReader: false })
  const set = (p: Partial<Answers>) => setA((x) => ({ ...x, ...p }))
  const out = useMemo(() => recommend(a), [a])
  const copy = useCopy()

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="مساعد الاختيار" description="توصيات قائمة على قواعد ثابتة من بيانات هذا النموذج. لا يوجد نموذج ذكاء اصطناعي." size="lg" labels={{ close: 'إغلاق مساعد الاختيار' }}
      footer={<Button variant="outline" iconStart="json" disabled={!out.recs.length} onClick={() => copy(JSON.stringify({ input: a, reasons: out.recs, ...knowledgeExport(out.recs.map((r) => r.id), out.rules, out.patterns) }, null, 2), 'التوصيات بصيغة JSON')}>نسخ التوصيات JSON</Button>}
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="المهمة" value={a.task} onValueChange={(v) => set({ task: v })} options={[{ value: 'amount', label: 'إدخال مبلغ مالي' }, { value: 'phone', label: 'إدخال رقم هاتف' }, { value: 'find-person', label: 'البحث عن عميل بالاسم' }, { value: 'confirm', label: 'تأكيد إجراء حساس' }, { value: 'list', label: 'عرض قائمة سجلات' }]} />
          <Select label="المنطقة" value={a.region} onValueChange={(v) => set({ region: v })} options={[{ value: 'EG', label: 'مصر' }, { value: 'SA', label: 'السعودية' }, { value: 'KW', label: 'الكويت' }, { value: 'other', label: 'أخرى' }]} />
          <Select label="الإطار" value={a.framework} onValueChange={(v) => set({ framework: v })} options={[{ value: 'react', label: 'React' }, { value: 'other', label: 'غير React' }]} />
          <Select label="الكثافة" value={a.density} onValueChange={(v) => set({ density: v })} options={[{ value: 'compact', label: 'مضغوطة (ERP)' }, { value: 'default', label: 'افتراضية' }, { value: 'touch', label: 'لمسية (نقاط البيع)' }]} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Switch label="المستخدمون يكتبون بأرقام عربية" checked={a.arabicDigits} onCheckedChange={(v) => set({ arabicDigits: v })} />
          <Switch label="لصق من أنظمة أخرى" checked={a.paste} onCheckedChange={(v) => set({ paste: v })} />
          <Switch label="قيم سالبة" checked={a.negative} onCheckedChange={(v) => set({ negative: v })} />
          <Switch label="مستخدمو قارئ الشاشة" checked={a.screenReader} onCheckedChange={(v) => set({ screenReader: v })} />
        </div>
        <div className="border-t border-line pt-5" aria-live="polite">
          <p className="t-eyebrow mb-3">التوصيات</p>
          {out.unmatched ? <InlineMessage tone="warning" title="لا توجد توصية مطابقة">{out.unmatched}</InlineMessage> : null}
          <ol className="flex flex-col gap-5">
            {out.recs.map((r) => {
              const c = getComponent(r.id)!
              return (
                <li key={r.id} className="border-s-2 border-action ps-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`#/components/${r.id}`} onClick={() => onOpenChange(false)} className="t-h3 text-fg hover:underline">
                      {c.name}
                    </a>
                    <MaturityBadge maturity={c.maturity} />
                  </div>
                  <p className="t-caption mb-1 mt-2 font-medium text-fg-2">لماذا يناسب</p>
                  <ul className="list-disc ps-5 t-body text-fg">
                    {r.why.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                  {r.constraints.length ? (
                    <>
                      <p className="t-caption mb-1 mt-2 font-medium text-fg-2">القيود</p>
                      <ul className="list-disc ps-5 t-body text-fg-2">
                        {r.constraints.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <p className="mt-2 t-caption text-fg-3">
                    المصدر: <bdi dir="ltr" className="ax-mono">{c.implementation}</bdi>
                  </p>
                </li>
              )
            })}
          </ol>
          {out.rules.length ? (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {out.rules.map((id) => (
                <a key={id} href={`#/rules/${id}`} onClick={() => onOpenChange(false)} title={getRule(id)?.title}>
                  <Badge variant="outline">
                    <bdi dir="ltr" className="ax-mono">{id}</bdi>
                  </Badge>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Drawer>
  )
}
