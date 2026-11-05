import { useState } from 'react'
import { fonts, primaryPresets, typeScale, type FontKey } from '../tokens/reference'
import { evaluateContrast, exportTheme, primaryBase, semanticColors, type Radius } from '../tokens/theme'
import { isHex } from '../tokens/color'
import { AutoText,
  AmountText,
  Badge,
  Button,
  CurrencyInput,
  DataTable,
  InlineMessage,
  LtrIsland,
  PhoneInput,
  SegmentedControl,
  Select,
  Tabs,
  TextField,
  useSettings,
} from '../system'
import { CodeBlock, downloadJson, N, Section, useCopy } from '../app/ui'

function Swatch({ color }: { color: string }) {
  return <span aria-hidden="true" className="inline-block size-3.5 flex-none rounded-full border border-line-2" style={{ background: color }} />
}

function ProductPreview() {
  const [name, setName] = useState('أحمد Khaled')
  const [phone, setPhone] = useState<string | null>('+201012345678')
  const [amount, setAmount] = useState<number | null>(123450)
  const [method, setMethod] = useState('cash')
  const [tab, setTab] = useState('new')
  return (
    <div className="overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-surface shadow-[var(--ax-elevation-1)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 pt-3">
        <Tabs idBase="studio" label="معاينة" value={tab} onValueChange={setTab} items={[{ value: 'new', label: 'تحصيل جديد' }, { value: 'log', label: 'السجل', count: <N>3</N> }]} />
        <Badge tone="warning" dot>بيانات اصطناعية</Badge>
      </div>
      <div className="grid gap-px bg-line xl:grid-cols-[minmax(0,22rem)_1fr]">
        <form className="flex flex-col gap-4 bg-surface p-5" onSubmit={(e) => e.preventDefault()}>
          <TextField label="اسم العميل" value={name} onValueChange={(v) => setName(v ?? '')} />
          <PhoneInput label="رقم المحمول" value={phone} onValueChange={(v) => setPhone(v)} />
          <CurrencyInput label="المبلغ المستلم" value={amount} onValueChange={(v) => setAmount(v)} />
          <Select label="طريقة التحصيل" value={method} onValueChange={setMethod} options={[{ value: 'cash', label: 'نقدًا' }, { value: 'transfer', label: 'تحويل بنكي' }]} />
          <div className="flex flex-wrap gap-2 pt-1">
            <Button>مراجعة التحصيل</Button>
            <Button variant="outline">حفظ كمسودة</Button>
          </div>
        </form>
        <div className="flex min-w-0 flex-col gap-4 bg-surface p-5">
          <InlineMessage tone="success" title="سُجّل التحصيل" live="off">
            رقم الإيصال <LtrIsland mono>RCPT-2026-0042</LtrIsland>
          </InlineMessage>
          <InlineMessage tone="danger" title="تعذّر تسجيل التحصيل" live="off">
            لم يُسجَّل أي مبلغ، وبياناتك ما زالت في النموذج.
          </InlineMessage>
          <DataTable
            label="آخر التحصيلات"
            minWidth={460}
            selectedKey="RCPT-2026-0041"
            rows={[
              { id: 'RCPT-2026-0041', who: 'إيمان عبد الرحمن', m: 120000, s: 'success' as const },
              { id: 'RCPT-2026-0040', who: 'شركة النور للتجارة والتوريدات العامة', m: 4250000, s: 'success' as const },
              { id: 'RCPT-2026-0039', who: 'أحمد Khaled', m: 87550, s: 'warning' as const },
            ]}
            rowKey={(r) => r.id}
            columns={[
              { key: 'id', header: 'الإيصال', nowrap: true, cell: (r) => <LtrIsland mono>{r.id}</LtrIsland> },
              { key: 'w', header: 'العميل', cell: (r) => <AutoText>{r.who}</AutoText> },
              { key: 's', header: 'الحالة', cell: (r) => <Badge tone={r.s} dot>{r.s === 'success' ? 'مسجّل' : 'قيد المطابقة'}</Badge> },
              { key: 'm', header: 'المبلغ', numeric: true, nowrap: true, cell: (r) => <AmountText minor={r.m} currency="EGP" /> },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

const SPECIMEN: Record<keyof typeof typeScale, string> = {
  display: 'واجهاتٌ تُقرأ كما تُكتب',
  h1: 'تحصيل مبلغ من عميل',
  h2: 'سجل التحصيلات لشهر مارس',
  h3: 'مُحَمَّد السيد — فرع مدينة نصر',
  bodyLg: 'يقبل الحقل الأرقام العربية واللاتينية، ويرفض الفاصلة الملتبسة بدل أن يخمّن معناها.',
  body: 'سدّد أحمد Khaled مبلغ ١ ٢٣٤٫٥٠ ج.م عن الفاتورة INV-2026-0148 بتاريخ ١٤ مارس.',
  label: 'رقم المحمول',
  table: 'عبد الرحمن بن عبد الله الشمري · 1,234.50',
  caption: 'آخر تحديث منذ ٣ دقائق · بيانات اصطناعية',
  code: "parseAmount('١٢٣٤٫٥٠', { currency: 'EGP' })",
}

function TypeSpecimen() {
  return (
    <ul className="flex flex-col divide-y divide-line border-y border-line">
      {(Object.keys(typeScale) as Array<keyof typeof typeScale>).map((k) => {
        const t = typeScale[k]
        const cls = k === 'code' ? 't-code' : `t-${k === 'bodyLg' ? 'body-lg' : k}`
        return (
          <li key={k} className="grid gap-2 py-4 md:grid-cols-[9rem_1fr] md:items-baseline">
            <span className="t-caption text-fg-2">
              <bdi dir="ltr" className="ax-mono text-fg">{k}</bdi>
              <span className="block ax-num">
                <N>{`${t.size}px / ${t.line} · ${t.weight}`}</N>
              </span>
            </span>
            {k === 'code' ? (
              <code dir="ltr" className={cls + ' block text-end text-fg'}>
                {SPECIMEN[k]}
              </code>
            ) : (
              <span className={cls + ' text-fg'}>{SPECIMEN[k]}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function StudioPage() {
  const { theme, setTheme, resetTheme, prefs, setPrefs } = useSettings()
  const copy = useCopy()
  const [hexDraft, setHexDraft] = useState(theme.customPrimary)
  const hexError = hexDraft && !isHex(hexDraft) ? 'أدخل اللون بصيغة ‎#RRGGBB، مثل ‎#B0431F.' : null
  const contrast = evaluateContrast(theme)
  const failing = contrast.filter((c) => !c.passes)
  const colors = semanticColors(theme)
  const json = exportTheme(theme)

  const controls = (
    <div className="flex flex-col gap-6">
      <SegmentedControl label="الوضع" fullWidth value={theme.mode} onValueChange={(v) => setTheme({ mode: v })} options={[{ value: 'light', label: 'فاتح' }, { value: 'dark', label: 'داكن' }]} />
      <div className="flex flex-col gap-3">
        <SegmentedControl
          label="لون التأكيد"
          fullWidth
          wrap
          value={theme.primary}
          onValueChange={(v) => setTheme({ primary: v })}
          options={[
            ...(Object.keys(primaryPresets) as Array<keyof typeof primaryPresets>).map((k) => ({ value: k, label: <><Swatch color={primaryPresets[k].base} />{primaryPresets[k].label}</> , ariaLabel: primaryPresets[k].label })),
            { value: 'custom' as const, label: <><Swatch color={isHex(theme.customPrimary) ? theme.customPrimary : '#888888'} />مخصص</>, ariaLabel: 'لون مخصص' },
          ]}
        />
        {theme.primary === 'custom' ? (
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1.5">
              <span className="ax-sr">منتقي اللون</span>
              <input
                type="color"
                aria-label="منتقي اللون"
                className="h-10 w-12 cursor-pointer rounded-[var(--ax-radius-control)] border border-line-3 bg-raised p-1"
                value={isHex(theme.customPrimary) ? theme.customPrimary : '#888888'}
                onChange={(e) => {
                  setHexDraft(e.target.value.toUpperCase())
                  setTheme({ customPrimary: e.target.value.toUpperCase() })
                }}
              />
            </label>
            <div className="flex-1">
              <TextField
                label="القيمة"
                size="md"
                contentDir="ltr"
                mono
                value={hexDraft}
                error={hexError}
                onValueChange={(next) => {
                  const v = next ?? ''
                  setHexDraft(v)
                  if (isHex(v)) setTheme({ customPrimary: v.toUpperCase() })
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
      <div>
        <Select label="الخط" value={theme.font} onValueChange={(v: FontKey) => setTheme({ font: v })} options={(Object.keys(fonts) as FontKey[]).map((k) => ({ value: k, label: fonts[k].label }))} helper={fonts[theme.font].note} />
      </div>
      <SegmentedControl label="الكثافة" fullWidth value={theme.density} onValueChange={(v) => setTheme({ density: v })} options={[{ value: 'compact', label: 'مضغوطة' }, { value: 'default', label: 'افتراضية' }, { value: 'touch', label: 'لمسية' }]} />
      <SegmentedControl
        label="الزوايا"
        fullWidth
        value={String(theme.radius) as '0' | '4' | '8' | '12'}
        onValueChange={(v) => setTheme({ radius: Number(v) as Radius })}
        options={(['0', '4', '8', '12'] as const).map((r) => ({ value: r, label: <N>{r}</N>, ariaLabel: `${r} بكسل` }))}
      />
      <SegmentedControl
        label="محاذاة الأسماء اللاتينية في الواجهة العربية"
        fullWidth
        value={prefs.mixedAlign}
        onValueChange={(v) => setPrefs({ mixedAlign: v })}
        options={[
          { value: 'ui', label: 'مع الواجهة' },
          { value: 'content', label: 'مع النص' },
        ]}
      />
      <div className="flex flex-wrap gap-2 border-t border-line pt-5">
        <Button variant="outline" size="sm" iconStart="reset" onClick={() => { resetTheme(); setHexDraft('#B0431F') }}>
          الإعدادات الافتراضية
        </Button>
        <Button variant="outline" size="sm" iconStart="download" onClick={() => downloadJson('ax-theme.json', json)}>
          تنزيل JSON
        </Button>
        <Button variant="ghost" size="sm" iconStart="copy" onClick={() => copy(JSON.stringify(json, null, 2), 'السمة بصيغة JSON')}>
          نسخ
        </Button>
      </div>
      <p className="t-caption text-fg-3">تنطبق الإعدادات على كل الشاشات المطبقة وتُحفظ في هذا المتصفح فقط.</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 md:px-8">
      <header className="mb-10 max-w-[68ch]">
        <p className="t-eyebrow mb-2">الأدوات</p>
        <h1 className="t-h1 text-fg">استوديو السمات والطباعة</h1>
        <p className="t-body-lg mt-3 text-fg-2">غيّر مجموعة من الأدوار الدلالية، وشاهد أثرها على المكونات نفسها المستخدمة في المرجع والتطبيق المرجعي. التباين محسوب من القيم الفعلية، ولا نصحح الألوان تلقائيًا.</p>
      </header>
      <div className="grid gap-10 lg:grid-cols-[18.5rem_minmax(0,1fr)]">
        <aside aria-label="إعدادات السمة" className="lg:sticky lg:top-20 lg:self-start">
          {controls}
        </aside>
        <div className="min-w-0">
          {failing.length ? (
            <div className="mb-6">
              <InlineMessage tone="warning" title={`هذه التركيبة لا تحقق الحد المعلن في ${failing.length} ${failing.length === 1 ? 'زوج' : 'أزواج'}`}>
                {failing.map((f) => f.purpose).join('، ')}. لا نعدّل اللون تلقائيًا؛ اختر لونًا آخر أو اقبل القيد بوعي.
              </InlineMessage>
            </div>
          ) : null}
          <Section eyebrow="معاينة" title="نموذج وجدول حقيقيان">
            <ProductPreview />
          </Section>
          <Section eyebrow="الطباعة" title={<>عينة الخط: <bdi dir="ltr">{fonts[theme.font].label}</bdi></>} intro="ارتفاعات الأسطر اختيرت بعرض نص مشكول فعلًا. لا يُطبَّق أي تباعد بين الحروف.">
            <TypeSpecimen />
          </Section>
          <Section eyebrow="الإتاحة" title="التباين المحسوب" intro="نسبة WCAG 2.x لكل زوج دلالي معلن، محسوبة من القيم المعروضة الآن. لا تعني توافقًا كاملًا مع WCAG.">
            <DataTable
              label="جدول التباين"
              rows={contrast}
              rowKey={(r) => r.fg + r.bg}
              minWidth={640}
              columns={[
                { key: 'p', header: 'الاستخدام', cell: (r) => r.purpose },
                { key: 'pair', header: 'الزوج', cell: (r) => <span className="flex items-center gap-2"><Swatch color={r.fgValue} /><Swatch color={r.bgValue} /><bdi dir="ltr" className="ax-mono text-[12px] text-fg-2">{r.fg} / {r.bg}</bdi></span> },
                { key: 'r', header: 'النسبة', numeric: true, nowrap: true, cell: (r) => <bdi dir="ltr" className="ax-num">{r.ratio.toFixed(2)}:1</bdi> },
                { key: 'm', header: 'الحد', numeric: true, nowrap: true, cell: (r) => <bdi dir="ltr" className="ax-num text-fg-2">{r.min}:1</bdi> },
                { key: 's', header: 'النتيجة', cell: (r) => <Badge tone={r.passes ? 'success' : 'danger'}>{r.passes ? 'يحقق الحد' : 'أقل من الحد'}</Badge> },
              ]}
            />
          </Section>
          <Section eyebrow="الرموز" title="التسلسل: مرجعي ← دلالي ← مكوّن" intro={<>لون التأكيد الأساسي <bdi dir="ltr" className="ax-mono">{primaryBase(theme)}</bdi> قيمة مرجعية. كل الأدوار التالية مشتقة منه أو من لوحة الحجر المحايدة، والمكونات تقرأ الأدوار فقط.</>}>
            <ul className="grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
              {Object.entries(colors).map(([role, v]) => (
                <li key={role} className="flex items-center gap-3 bg-surface px-4 py-2.5">
                  <span aria-hidden="true" className="size-7 flex-none rounded-[var(--ax-radius-control)] border border-line-2" style={{ background: v }} />
                  <span className="min-w-0">
                    <bdi dir="ltr" className="block truncate ax-mono text-[12.5px] text-fg">{role}</bdi>
                    <bdi dir="ltr" className="block ax-mono text-[11.5px] text-fg-3">{v}</bdi>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
          <Section eyebrow="التصدير" title="الإعداد المدعوم بصيغة JSON" intro="يتضمن الإعداد والأدوار الدلالية المحسوبة ونتائج التباين. ليس ملف Figma Variables؛ انظر «خارطة المنظومة» لخطة الربط الأصلي.">
            <CodeBlock code={JSON.stringify(json, null, 2)} label="JSON السمة" caption="ax-theme.json" maxHeight={420} />
          </Section>
        </div>
      </div>
    </div>
  )
}
