import { Badge, DataTable } from '../system'
import { N, Section } from '../app/ui'

const DOMAINS = [
  { n: 'الأساسات', now: 'رموز مرجعية ودلالية ومكوّنية، وضعان، ثلاث كثافات، أربع زوايا، أربعة خطوط، حركة، تباين محسوب، سجل أيقونات بسلوك المرآة.', next: 'المسافات والارتفاعات كرموز قابلة للتصدير، التقاويم والإعدادات الإقليمية.', href: '#/studio' },
  { n: 'المكونات', now: 'مرجع كامل لحقل المبلغ، وصفحات مختصرة لبقية المكونات المطبّقة، كلها في درجة ألفا أو مسودة.', next: 'تجربة الـprimitive، Combobox، منتقي التاريخ بالتقويمين، الوصول إلى بيتا.', href: '#/components/currency-input' },
  { n: 'الأنماط', now: 'نمط واحد كامل مع مثال عامل. نمطان مطبّقان جزئيًا داخله.', next: 'الفاتورة، المرتجعات، تصفية المخزون.', href: '#/patterns' },
  { n: 'المحتوى والتوطين', now: 'طبقة رسائل عربية للأخطاء، مسرد مصطلحات صغير، فصل نظام الأرقام عن اللغة.', next: 'الجمع والمثنى، التقويم الهجري، صيغ العملات الإقليمية من CLDR.', href: '#/components/currency-input/guidelines' },
  { n: 'الموارد والتكاملات', now: 'فهرس بعلاقات صريحة (أصلي، مقتبس، مدمج، مرجع) ورخص متحقق منها محليًا حين أمكن.', next: 'مراجعة رخص الخطوط، محولات لأطر أخرى.', href: '#/resources' },
  { n: 'الجودة والأدلة', now: 'حالات تُنفَّذ حية، تشغيل Vitest مسجّل، فحوص Playwright على Chromium.', next: 'axe، Firefox وWebKit، مصفوفة السياقات، فحوص يدوية بقارئ شاشة.', href: '#/evidence' },
  { n: 'معرفة الوكلاء', now: 'تصدير JSON لسجلات المكونات والقواعد والتوصيات، ومساعد اختيار قائم على قواعد.', next: 'خادم MCP — مخطط، غير مطبّق ولا مختبر.', href: '#/components/currency-input' },
]

const FIGMA_MAP = [
  ['--ax-bg-surface', 'color/bg/surface', 'Semantic · Light/Dark modes'],
  ['--ax-text-primary', 'color/text/primary', 'Semantic · Light/Dark modes'],
  ['--ax-action-primary', 'color/action/primary', 'Semantic · derived from primary base'],
  ['--ax-border-strong', 'color/border/strong', 'Semantic'],
  ['--ax-danger-fg', 'color/danger/fg', 'Semantic'],
  ['--ax-control-h', 'size/control/height', 'Component · Compact/Default/Touch modes'],
  ['--ax-radius-control', 'radius/control', 'Component'],
  ['--ax-font-sans', 'font/family/sans', 'Reference (string variable)'],
  ['--ax-type-body-size', 'type/body/size', 'Reference'],
]

const INVENTORY: Record<string, string[]> = {
  'مطبّق': [
    'مرجع حقل المبلغ: ست تبويبات، معمل بإعدادات فعّالة، تشريح تفاعلي، مصفوفة حالات، كود مولَّد.',
    'الطبقة العربية: الأرقام والمبالغ والهاتف المصري والبحث المتسامح مع التظليل.',
    'رموز السمات وأوضاعها، واستوديو بتباين محسوب وتصدير JSON.',
    'التطبيق المرجعي: بحث، إضافة بتنبيه تشابه، تحقق، مراجعة، انشغال، فشل محاكى، إعادة محاولة، إيصال.',
    'نمط التحصيل الكامل، والقواعد، والموارد، والأدلة، والبحث الشامل.',
  ],
  'جزئي': [
    'صفحات مرجع مختصرة لبقية المكونات (بلا معمل ولا مصفوفة حالات).',
    'الحوار: الدخول والحبس وEscape والإعادة مطبّقة ومختبرة آليًا على Chromium؛ لا حركة خروج.',
    'تكيف الشاشات الضيقة: مُركّب ومفحوص على ٣٩٠px في Chromium فقط.',
  ],
  'مخطط': ['تجربة الـprimitive والقرار.', 'Combobox، منتقي التاريخ، الجدول المتقدم.', 'خادم MCP.', 'Make kit ومكتبة Figma أصلية.', 'أنماط الفاتورة والمرتجعات.'],
  'لم يُفحص': ['قارئات الشاشة وأجهزة اللمس الحقيقية.', 'Firefox وSafari.', 'React 18 وSSR.', 'axe.'],
}

export function EcosystemPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-10 md:px-8">
      <header className="mb-12 max-w-[68ch]">
        <p className="t-eyebrow mb-2">المنظومة</p>
        <h1 className="t-display text-fg max-sm:text-[32px]">سبعة مجالات مترابطة، إصدار واحد عميق</h1>
        <p className="t-body-lg mt-4 text-fg-2">البحث يغذي القواعد، والقواعد تغذي الأساسات، والأساسات تبني المكونات، والمكونات تؤلف الأنماط، والأنماط تُختبر في تطبيقات حقيقية. هذه الصفحة تقول بدقة ما يوجد الآن في كل مجال.</p>
      </header>

      <Section eyebrow="المجالات" title="الحالة الآن">
        <ol className="flex flex-col divide-y divide-line border-y border-line">
          {DOMAINS.map((d, i) => (
            <li key={d.n} className="grid gap-3 py-6 md:grid-cols-[3rem_12rem_1fr_1fr] md:gap-6">
              <span className="t-h2 text-fg-3"><N>{String(i + 1).padStart(2, '0')}</N></span>
              <a href={d.href} className="t-h3 text-fg hover:underline">{d.n}</a>
              <div>
                <p className="t-caption mb-1 font-medium text-success">موجود الآن</p>
                <p className="t-body text-fg">{d.now}</p>
              </div>
              <div>
                <p className="t-caption mb-1 font-medium text-fg-2">التالي</p>
                <p className="t-body text-fg-2">{d.next}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Figma" title="حدود Figma الأصلية" intro="هذا النموذج تطبيق كود في Figma Make. لم يُنشأ أي Variables أو Components أو Variants أصلية في Figma Design، ولم يُنشأ Make kit ولم يُنشر.">
        <div className="grid gap-8 md:grid-cols-2">
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {[
              ['نسخ المعاينة إلى Figma Design', 'لقطة طبقات قابلة للتحرير، لا مكتبة متزامنة ولا متغيرات.'],
              ['Make kit', 'غير منشأ. الكود منظم ليُعاد استخدامه (رموز، مكونات، إرشادات)، والنشر يحتاج تعليمات منفصلة.'],
              ['Variables أصلية', 'غير موجودة. الجدول المقابل خريطة مقترحة لبنائها لاحقًا.'],
            ].map(([k, v]) => (
              <li key={k} className="py-3">
                <p className="t-label text-fg">{k}</p>
                <p className="t-body text-fg-2">{v}</p>
              </li>
            ))}
          </ul>
          <DataTable
            label="خريطة مقترحة من رموز CSS إلى متغيرات Figma"
            rows={FIGMA_MAP.map(([css, fig, note]) => ({ css, fig, note }))}
            rowKey={(r) => r.css}
            minWidth={520}
            columns={[
              { key: 'c', header: 'CSS', cell: (r) => <bdi dir="ltr" className="ax-mono text-[12.5px]">{r.css}</bdi> },
              { key: 'f', header: 'متغير Figma مقترح', cell: (r) => <bdi dir="ltr" className="ax-mono text-[12.5px]">{r.fig}</bdi> },
              { key: 'n', header: 'الطبقة', cell: (r) => <bdi dir="ltr" className="text-[12.5px] text-fg-2">{r.note}</bdi> },
            ]}
          />
        </div>
      </Section>

      <Section eyebrow="الجرد" title="ما أُنجز في هذا الإصدار">
        <div className="grid gap-px overflow-hidden rounded-[var(--ax-radius-surface)] border border-line-2 bg-line md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(INVENTORY).map(([k, items]) => (
            <div key={k} className="flex flex-col gap-3 bg-surface p-5">
              <Badge tone={k === 'مطبّق' ? 'success' : k === 'جزئي' ? 'accent' : k === 'مخطط' ? 'neutral' : 'warning'} dot>{k}</Badge>
              <ul className="flex flex-col gap-2">
                {items.map((x) => <li key={x} className="t-body text-fg">{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
