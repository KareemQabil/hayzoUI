/**
 * Ant Design v5 parity matrix — data. Every AntD v5 component, a feature checklist for the components that
 * decide adoption, and our honest status. Default is missing/none; a row is partial/parity only when the code
 * in src/system or src/atomic does it, and 'better' only for an Arabic/RTL advantage that exists in code.
 * Evidence IDs are real test names / browser checks / fixtures (PM-07 checks that each one exists in the repo).
 *
 * AntD feature lists are written from knowledge of the AntD v5 documentation, not scraped. Rows marked with
 * VERIFY should be checked against the current docs before quoting a number externally.
 */
import type { AntdEcosystem, ParityCategory, ParityComponent, ParityFeature, ParityPriority, ParityStatus, ParitySummary, ParityTrack, StatusCounts } from './types'

const VERIFY = 'feature list from AntD v5 documentation knowledge; verify against current docs'
const DOCS = 'https://ant.design/components/'

type FeatureInput = [slug: string, name: string, nameAr: string, status?: ParityStatus, extra?: Omit<Partial<ParityFeature>, 'id' | 'name' | 'nameAr' | 'status'>]

interface ComponentInput {
  id: string
  antd: string
  category: ParityCategory
  priority: ParityPriority
  status?: ParityStatus
  track?: ParityTrack
  ours?: string
  note?: string
  /** Docs slug when it differs from id. */
  slug?: string
  features: FeatureInput[]
}

function component(c: ComponentInput): ParityComponent {
  const status = c.status ?? 'missing'
  return {
    id: c.id,
    antd: c.antd,
    category: c.category,
    docs: DOCS + (c.slug ?? c.id),
    priority: c.priority,
    status,
    track: c.track ?? (status === 'missing' ? 'none' : 'legacy'),
    ...(c.ours ? { ours: c.ours } : {}),
    note: c.note ?? VERIFY,
    features: c.features.map(([slug, name, nameAr, fStatus = 'missing', extra = {}]) => ({
      id: `${c.id}.${slug}`,
      name,
      nameAr,
      status: fStatus,
      track: extra.track ?? (fStatus === 'missing' ? 'none' : 'legacy'),
      ...extra,
    })),
  }
}

/* ───────────────────────────── General ───────────────────────────── */

const general: ComponentInput[] = [
  {
    id: 'button', antd: 'Button', category: 'general', priority: 'p0', status: 'partial', ours: 'button',
    note: 'Legacy Button (variants, tones, sizes, loading, icons) and atomic Button (async pending through usePress). ' + VERIFY,
    features: [
      ['variants', 'Types / variants (primary, default, dashed, text, link)', 'الأنواع (أساسي، افتراضي، منقّط، نصي، رابط)', 'partial', { note: 'solid/soft/outline/ghost; no dashed or link variant' }],
      ['danger', 'Danger tone', 'نبرة الخطر', 'parity'],
      ['sizes', 'Sizes small / middle / large', 'الأحجام صغير/متوسط/كبير', 'parity'],
      ['loading', 'Loading state', 'حالة التحميل', 'parity', { evidence: ['AT-BT-01', 'AT-BT-03', 'AT-BT-05'], note: 'atomic Button derives pending from the returned promise' }],
      ['disabled', 'Disabled', 'التعطيل', 'parity', { evidence: ['AT-BT-02'] }],
      ['icon', 'Icon with text, icon placement', 'أيقونة مع النص وموضعها', 'parity', { note: 'iconStart/iconEnd are logical sides, they follow direction' }],
      ['block', 'Block (full width)', 'بعرض كامل', 'parity'],
      ['shape', 'Shape circle / round', 'الشكل دائري/مستدير', 'missing'],
      ['href', 'Link button (href, target)', 'زر رابط (href)', 'missing'],
      ['group', 'Button group / Space.Compact', 'مجموعة أزرار', 'missing'],
      ['double-submit', 'Double activation guard while pending', 'منع التنفيذ المزدوج أثناء الانتظار', 'parity', { track: 'atomic', evidence: ['AT-BT-01', 'AT-BT-03', 'BR-AT-02', 'BR-APP-01'], note: 'AntD needs the app to set loading by hand' }],
      ['busy-label', 'Pending state announced in the scope language', 'إعلان حالة الانتظار بلغة النطاق', 'better', { track: 'atomic', evidence: ['AT-BT-04'], arabicEdge: 'pending label comes from the experience language (Arabic by default), not a prop; AntD loading has no announced label' }],
    ],
  },
  { id: 'float-button', antd: 'FloatButton', category: 'general', priority: 'p2', features: [
    ['basic', 'Floating action button', 'زر عائم', ], ['group', 'Group with trigger (click/hover)', 'مجموعة بمشغّل'], ['back-top', 'BackTop', 'العودة للأعلى'], ['badge', 'Badge on button', 'شارة على الزر'], ['tooltip', 'Tooltip', 'تلميح'],
  ] },
  {
    id: 'icon', antd: 'Icon', category: 'general', priority: 'p1', status: 'partial', ours: 'icons',
    note: 'Internal set of about 48 SVG icons in src/system/icons.tsx; @ant-design/icons ships hundreds. ' + VERIFY,
    features: [
      ['set', 'Large icon set (outlined, filled, two-tone)', 'مكتبة أيقونات كبيرة (محددة، مصمتة، ثنائية اللون)', 'partial', { note: 'one outlined style, small set' }],
      ['custom', 'Custom SVG icons', 'أيقونات SVG مخصصة', 'missing'],
      ['spin', 'Spin / rotate', 'دوران', 'partial', { note: 'spin via className ax-spin; no rotate prop' }],
      ['a11y', 'Accessible label', 'اسم مقروء للأيقونة', 'parity'],
      ['iconfont', 'Iconfont (createFromIconfontCN)', 'خطوط الأيقونات', 'missing'],
      ['mirroring', 'Directional icons mirrored in RTL', 'عكس الأيقونات الاتجاهية في RTL', 'missing', { arabicEdge: 'risk: arrows/chevrons must flip in RTL; no mirroring rule in the icon set yet' }],
    ],
  },
  {
    id: 'typography', antd: 'Typography', category: 'general', priority: 'p1', status: 'partial', ours: 'text',
    note: 'Text helpers in src/system/components/text.tsx and locale.tsx (AutoText, Digits, Prose, Literal, Kbd, Highlight). ' + VERIFY,
    features: [
      ['title', 'Title levels', 'مستويات العناوين', 'missing', { note: 'CSS classes t-h1/t-h2 exist, no component' }],
      ['text-types', 'Text types (secondary, success, warning, danger)', 'أنواع النص (ثانوي، نجاح، تحذير، خطر)', 'missing'],
      ['copyable', 'Copyable', 'قابل للنسخ', 'missing'],
      ['editable', 'Editable', 'قابل للتحرير', 'missing'],
      ['ellipsis', 'Ellipsis with expand / tooltip', 'اختصار النص مع التوسيع', 'missing'],
      ['mark-code-kbd', 'Mark, code, keyboard', 'تمييز، كود، مفتاح', 'partial', { note: 'Kbd and Highlight exist' }],
      ['numerals', 'Numbers follow the numerals preference', 'الأرقام تتبع تفضيل نظام الأرقام', 'better', { evidence: ['CT-02', 'CT-04', 'CT-05'], arabicEdge: 'Digits/Prose render Arabic-Indic or Latin digits per user preference, keep identifiers Latin and literals verbatim; AntD has no numerals concept' }],
      ['auto-dir', 'Mixed-script text takes direction from its content', 'النص المختلط يأخذ اتجاهه من محتواه', 'better', { evidence: ['CT-03', 'BR-MIX-03'], arabicEdge: 'AutoText keeps «Dr. سامي» punctuation in place inside RTL UI' }],
    ],
  },
]

/* ───────────────────────────── Layout ───────────────────────────── */

const layout: ComponentInput[] = [
  { id: 'divider', antd: 'Divider', category: 'layout', priority: 'p2', features: [
    ['horizontal', 'Horizontal divider', 'فاصل أفقي'], ['vertical', 'Vertical divider', 'فاصل رأسي'], ['with-text', 'With text and orientation', 'مع نص وموضعه'], ['dashed', 'Dashed / plain', 'منقّط/بسيط'],
  ] },
  { id: 'flex', antd: 'Flex', category: 'layout', priority: 'p2', features: [
    ['direction', 'Vertical / horizontal', 'رأسي/أفقي'], ['align-justify', 'Align and justify', 'المحاذاة والتوزيع'], ['gap', 'Gap presets', 'مسافات محددة'], ['wrap', 'Wrap', 'الالتفاف'],
  ] },
  { id: 'grid', antd: 'Grid', category: 'layout', priority: 'p1', features: [
    ['row-col', 'Row / Col 24-column grid', 'شبكة من 24 عمودًا'], ['gutter', 'Gutter', 'الفواصل بين الأعمدة'], ['responsive', 'Responsive spans (xs…xxl)', 'امتدادات متجاوبة'], ['offset-order', 'Offset, push/pull, order', 'إزاحة وترتيب'], ['use-breakpoint', 'useBreakpoint hook', 'خطاف نقاط التوقف'],
  ] },
  { id: 'layout', antd: 'Layout', category: 'layout', priority: 'p1', features: [
    ['header-footer-content', 'Header / Content / Footer', 'رأس ومحتوى وتذييل'], ['sider', 'Sider', 'شريط جانبي'], ['collapsible', 'Collapsible sider with breakpoint', 'شريط جانبي قابل للطي'], ['rtl-sider', 'Sider on the inline start in RTL', 'الشريط الجانبي في بداية السطر في RTL', 'missing', { arabicEdge: 'risk: sider and its collapse arrow must mirror in RTL' }],
  ] },
  { id: 'space', antd: 'Space', category: 'layout', priority: 'p2', features: [
    ['size', 'Size / gap', 'المسافة'], ['direction', 'Direction', 'الاتجاه'], ['split', 'Split element', 'فاصل بين العناصر'], ['compact', 'Space.Compact', 'تجميع مضغوط'],
  ] },
  { id: 'splitter', antd: 'Splitter', category: 'layout', priority: 'p2', features: [
    ['panels', 'Resizable panels', 'ألواح قابلة لتغيير الحجم'], ['collapsible', 'Collapsible panels', 'ألواح قابلة للطي'], ['vertical', 'Vertical layout', 'تخطيط رأسي'], ['min-max', 'Min / max size', 'حد أدنى وأقصى'],
  ] },
]

/* ───────────────────────────── Navigation ───────────────────────────── */

const navigation: ComponentInput[] = [
  { id: 'anchor', antd: 'Anchor', category: 'navigation', priority: 'p2', features: [
    ['links', 'Anchor links with active state', 'روابط مرساة مع الحالة النشطة'], ['affix', 'Affixed', 'مثبّت'], ['horizontal', 'Horizontal', 'أفقي'], ['offset', 'Target offset', 'إزاحة الهدف'],
  ] },
  { id: 'breadcrumb', antd: 'Breadcrumb', category: 'navigation', priority: 'p1', features: [
    ['items', 'Items with links', 'عناصر بروابط'], ['separator', 'Custom separator', 'فاصل مخصص'], ['dropdown', 'Dropdown menu in item', 'قائمة منسدلة داخل العنصر'], ['routes', 'Route params', 'معاملات المسار'], ['rtl-separator', 'Separator mirrored in RTL', 'عكس الفاصل في RTL', 'missing', { arabicEdge: 'risk: «/» and chevrons must point the reading direction' }],
  ] },
  { id: 'dropdown', antd: 'Dropdown', category: 'navigation', priority: 'p0', features: [
    ['menu', 'Menu items', 'عناصر القائمة'], ['trigger', 'Trigger hover / click / contextMenu', 'المشغّل: مرور/نقر/زر أيمن'], ['placement', 'Placement', 'الموضع'], ['arrow', 'Arrow', 'سهم'], ['button', 'Dropdown.Button', 'زر بقائمة'], ['submenu', 'Cascading submenu', 'قائمة فرعية'], ['keyboard', 'Keyboard navigation', 'التنقل بلوحة المفاتيح'],
  ] },
  {
    id: 'menu', antd: 'Menu', category: 'navigation', priority: 'p0',
    features: [
      ['horizontal', 'Horizontal (top nav)', 'أفقية (تنقل علوي)'],
      ['vertical', 'Vertical', 'رأسية'],
      ['inline', 'Inline with collapsible submenus', 'مضمّنة بقوائم فرعية قابلة للطي'],
      ['collapsed', 'Inline collapsed (icons only)', 'مطوية (أيقونات فقط)'],
      ['submenu', 'Nested submenus', 'قوائم فرعية متداخلة'],
      ['groups', 'Item groups and dividers', 'مجموعات وفواصل'],
      ['selected', 'Controlled selectedKeys / openKeys', 'مفاتيح محددة ومفتوحة متحكَّم بها'],
      ['multiple', 'Multiple selection', 'تحديد متعدد'],
      ['icons', 'Item icons', 'أيقونات العناصر'],
      ['danger', 'Danger item', 'عنصر خطر'],
      ['disabled', 'Disabled items', 'عناصر معطلة'],
      ['theme', 'Light / dark theme', 'سمة فاتحة/داكنة'],
      ['overflow', 'Overflow into “more”', 'تجميع الزائد في «المزيد»'],
      ['keyboard', 'Keyboard navigation', 'التنقل بلوحة المفاتيح'],
      ['rtl', 'RTL submenu direction and arrows', 'اتجاه القوائم الفرعية وأسهمها في RTL', 'missing', { arabicEdge: 'risk: submenus must open toward the inline end and arrow keys must follow visual direction' }],
    ],
  },
  { id: 'pagination', antd: 'Pagination', category: 'navigation', priority: 'p0', features: [
    ['basic', 'Pages and current page', 'الصفحات والصفحة الحالية'], ['size-changer', 'Page size changer', 'تغيير حجم الصفحة'], ['quick-jumper', 'Quick jumper', 'الانتقال السريع'], ['total', 'Show total', 'عرض الإجمالي'], ['simple', 'Simple / mini mode', 'نمط مبسط'], ['controlled', 'Controlled current / pageSize', 'تحكم في الصفحة والحجم'], ['numerals', 'Page numbers in the user numerals', 'أرقام الصفحات بنظام أرقام المستخدم', 'missing', { arabicEdge: 'opportunity: AntD shows Latin page numbers; ours would follow Digits' }],
  ] },
  { id: 'steps', antd: 'Steps', category: 'navigation', priority: 'p1', features: [
    ['basic', 'Horizontal steps', 'خطوات أفقية'], ['vertical', 'Vertical', 'رأسية'], ['status', 'Status (wait/process/finish/error)', 'الحالة'], ['clickable', 'Clickable steps', 'خطوات قابلة للنقر'], ['progress-dot', 'Progress dot / navigation type', 'نقاط التقدم ونمط التنقل'], ['small', 'Small size', 'حجم صغير'],
  ] },
  {
    id: 'tabs', antd: 'Tabs', category: 'navigation', priority: 'p0', status: 'partial', ours: 'tabs',
    features: [
      ['basic', 'Items, controlled / uncontrolled', 'العناصر، تحكم وبدون تحكم', 'parity', { evidence: ['CMP-08'] }],
      ['keyboard', 'Keyboard: arrows, Home/End, roving tabindex', 'لوحة المفاتيح: الأسهم وHome/End', 'parity', { evidence: ['CMP-08'] }],
      ['rtl-arrows', 'Arrow keys follow visual direction in RTL', 'الأسهم تتبع الاتجاه البصري في RTL', 'parity', { evidence: ['CMP-08'], arabicEdge: 'ArrowLeft is next in RTL, tested' }],
      ['card', 'Card type', 'نمط البطاقة', 'partial', { note: "variant 'contained'" }],
      ['count', 'Count badge on tab', 'عدّاد على التبويب', 'parity'],
      ['icons', 'Icons in tabs', 'أيقونات في التبويبات', 'parity', { note: 'label is ReactNode' }],
      ['editable', 'Editable card: add / close tabs', 'إضافة وإغلاق التبويبات', 'missing'],
      ['extra', 'Extra content (tabBarExtraContent)', 'محتوى إضافي في الشريط', 'missing'],
      ['position', 'Position top / bottom / start / end', 'موضع الشريط', 'missing'],
      ['overflow', 'Overflow scroll / “more” dropdown', 'تمرير التبويبات الزائدة أو «المزيد»', 'missing'],
      ['sizes', 'Sizes', 'الأحجام', 'missing'],
      ['centered', 'Centered', 'توسيط', 'missing'],
      ['lazy', 'Lazy render / destroyInactiveTabPane', 'عرض كسول وإزالة غير النشط', 'missing', { note: 'panels are rendered by the consumer with tabPanelProps' }],
      ['disabled', 'Disabled tab', 'تبويب معطل', 'missing'],
      ['animated', 'Animated ink bar', 'مؤشر متحرك', 'missing'],
    ],
  },
]

/* ───────────────────────────── Data entry ───────────────────────────── */

const dataEntry: ComponentInput[] = [
  { id: 'auto-complete', antd: 'AutoComplete', category: 'data-entry', priority: 'p1', note: 'Combobox selects from a list; free-text input with suggestions is not supported yet. ' + VERIFY, features: [
    ['options', 'Suggestions while typing, free text kept', 'اقتراحات أثناء الكتابة مع بقاء النص الحر'], ['filter', 'Filter option', 'تصفية الخيارات'], ['custom-input', 'Custom input (TextArea)', 'حقل مخصص'], ['status', 'Status', 'الحالة'], ['allow-clear', 'Allow clear', 'زر المسح'],
  ] },
  {
    id: 'cascader', antd: 'Cascader', category: 'data-entry', priority: 'p1',
    features: [
      ['basic', 'Cascading options', 'خيارات متتالية'],
      ['hover-expand', 'Expand on hover / click', 'التوسيع بالمرور أو النقر'],
      ['change-on-select', 'Select any level (changeOnSelect)', 'اختيار أي مستوى'],
      ['multiple', 'Multiple selection', 'تحديد متعدد'],
      ['show-checked', 'showCheckedStrategy', 'استراتيجية عرض المحدد'],
      ['search', 'Search across paths', 'البحث في المسارات'],
      ['load-data', 'Lazy load children', 'تحميل الأبناء عند الطلب'],
      ['display-render', 'Custom display render', 'عرض مخصص للقيمة'],
      ['field-names', 'Custom field names', 'أسماء حقول مخصصة'],
      ['panel', 'Panel only (Cascader.Panel)', 'لوحة فقط'],
      ['disabled', 'Disabled options', 'خيارات معطلة'],
      ['rtl', 'Columns open toward inline end in RTL', 'الأعمدة تفتح نحو نهاية السطر في RTL', 'missing', { arabicEdge: 'risk: column order and expand arrows must mirror; Arabic tolerant search would help (region/city names)' }],
    ],
  },
  { id: 'checkbox', antd: 'Checkbox', category: 'data-entry', priority: 'p0', features: [
    ['basic', 'Checkbox', 'مربع اختيار'], ['group', 'Checkbox.Group with options', 'مجموعة خيارات'], ['indeterminate', 'Indeterminate / check all', 'حالة غير محددة وتحديد الكل'], ['disabled', 'Disabled', 'معطل'], ['controlled', 'Controlled', 'متحكم به'],
  ] },
  { id: 'color-picker', antd: 'ColorPicker', category: 'data-entry', priority: 'p2', features: [
    ['basic', 'Pick color', 'اختيار لون'], ['formats', 'HEX / RGB / HSB formats', 'صيغ اللون'], ['presets', 'Presets', 'ألوان جاهزة'], ['alpha', 'Alpha', 'الشفافية'], ['gradient', 'Gradient', 'تدرج'],
  ] },
  {
    id: 'date-picker', antd: 'DatePicker', category: 'data-entry', priority: 'p0', status: 'partial', ours: 'date-picker',
    note: 'React Aria DatePicker through the adapter, exported from src/system/aria. ' + VERIFY,
    features: [
      ['basic', 'Single date, controlled / uncontrolled', 'تاريخ واحد، تحكم وبدون تحكم', 'parity', { evidence: ['BR-DP-03'] }],
      ['storage', 'Stable value independent of display', 'قيمة مخزنة مستقلة عن العرض', 'parity', { evidence: ['BR-DP-01', 'BR-DP-03'], note: 'ISO Gregorian string; AntD uses dayjs objects' }],
      ['min-max', 'Min / max dates', 'أقل وأقصى تاريخ', 'parity'],
      ['disabled-date', 'disabledDate function', 'دالة الأيام المعطلة', 'partial', { note: 'min/max only' }],
      ['range', 'RangePicker', 'اختيار نطاق', 'missing'],
      ['presets', 'Presets (quick ranges)', 'نطاقات جاهزة', 'missing'],
      ['time', 'showTime', 'مع الوقت', 'missing'],
      ['week', 'Week picker', 'اختيار أسبوع', 'missing'],
      ['month', 'Month picker', 'اختيار شهر', 'missing'],
      ['quarter', 'Quarter picker', 'اختيار ربع سنة', 'missing'],
      ['year', 'Year picker', 'اختيار سنة', 'missing'],
      ['format', 'Custom display format', 'صيغة عرض مخصصة', 'missing'],
      ['locale', 'Locale (month names, first day)', 'اللغة (أسماء الشهور، أول يوم)', 'parity', { evidence: ['BR-DP-04'] }],
      ['keyboard', 'Keyboard entry by segments', 'الإدخال بالمقاطع من لوحة المفاتيح', 'parity', { evidence: ['BR-DP-02', 'BR-DP-03'] }],
      ['rtl-keys', 'Arrow keys follow visual direction in RTL', 'الأسهم تتبع الاتجاه البصري في RTL', 'parity', { evidence: ['BR-DP-03'] }],
      ['status', 'Status / error / helper', 'حالة الخطأ والمساعدة', 'parity'],
      ['disabled', 'Disabled / read-only', 'معطل/للقراءة فقط', 'parity'],
      ['allow-clear', 'Allow clear', 'زر المسح', 'missing'],
      ['multiple', 'Multiple dates', 'تواريخ متعددة', 'missing'],
      ['render-cell', 'Custom cell render', 'عرض خلية مخصص', 'missing'],
      ['hijri', 'Hijri (Umm al-Qura) display calendar', 'التقويم الهجري (أم القرى) للعرض', 'better', { evidence: ['BR-DP-01', 'BR-DP-04'], arabicEdge: 'Hijri display with Arabic month names over the same Gregorian ISO value; AntD needs a custom dayjs calendar plugin' }],
      ['any-digits', 'Segments accept any digit system', 'المقاطع تقبل أي نظام أرقام', 'better', { evidence: ['BR-DP-02'], arabicEdge: 'typing ٢٠٢٦ under Latin numerals (or 2026 under Arabic) works; React Aria and AntD drop or reject the other system' }],
    ],
  },
  {
    id: 'form', antd: 'Form', category: 'data-entry', priority: 'p0', status: 'partial', ours: 'field',
    note: 'Only the Field anatomy exists (label, helper, error, optional mark, wiring); no form state or validation engine. ' + VERIFY,
    features: [
      ['item-anatomy', 'Form.Item label, help, error wiring', 'ربط العنوان والمساعدة والخطأ', 'parity', { evidence: ['AT-TF-02'] }],
      ['required-mark', 'Required / optional marks', 'علامة الإلزامي/الاختياري', 'partial', { note: 'optional mark only; requiredMark customization missing' }],
      ['layout', 'Layouts horizontal / vertical / inline', 'التخطيطات أفقي/رأسي/سطري', 'missing'],
      ['label-align', 'Label align / labelCol / wrapperCol', 'محاذاة العنوان وأعمدته', 'missing'],
      ['rules', 'Validation rules (required, type, pattern, min/max)', 'قواعد التحقق', 'missing'],
      ['validator', 'Custom validator', 'تحقق مخصص', 'missing'],
      ['async-validation', 'Async validation', 'تحقق غير متزامن', 'missing'],
      ['validate-trigger', 'validateTrigger (change / blur)', 'توقيت التحقق', 'partial', { note: "CurrencyInput validateOn 'blur' | 'change' per field only" }],
      ['dependencies', 'Field dependencies', 'اعتماد الحقول على بعضها', 'missing'],
      ['should-update', 'shouldUpdate / Form.useWatch', 'مراقبة القيم', 'missing'],
      ['list', 'Dynamic Form.List', 'قوائم حقول ديناميكية', 'missing'],
      ['nested-names', 'Nested names (namePath)', 'أسماء متداخلة', 'missing'],
      ['scroll-to-error', 'Scroll to first error', 'التمرير لأول خطأ', 'missing'],
      ['feedback-icons', 'hasFeedback icons', 'أيقونات حالة التحقق', 'missing'],
      ['instance', 'Form instance API (getFieldsValue, setFieldsValue, validateFields)', 'واجهة نموذج برمجية', 'missing'],
      ['initial-values', 'initialValues', 'القيم الابتدائية', 'missing'],
      ['reset', 'resetFields', 'إعادة الضبط', 'missing'],
      ['disabled', 'Form-level disabled', 'تعطيل النموذج كله', 'missing'],
      ['field-disabled', 'Field-level disabled', 'تعطيل حقل', 'parity'],
      ['submit', 'Submit lifecycle (onFinish / onFinishFailed)', 'دورة الإرسال', 'missing'],
      ['submit-guard', 'Submit button cannot double-submit', 'زر الإرسال لا يرسل مرتين', 'parity', { track: 'atomic', evidence: ['AT-BT-03', 'BR-APP-01'] }],
      ['show-validation', 'Show errors after submit attempt', 'إظهار الأخطاء بعد محاولة الإرسال', 'partial', { note: 'showValidation prop on CurrencyInput/PhoneInput' }],
      ['messages-locale', 'Validation messages localized (validateMessages)', 'رسائل تحقق مترجمة', 'partial', { note: 'Arabic messages built into Arabic fields; no global table' }],
      ['size', 'Form size / variant', 'حجم النموذج', 'missing'],
      ['null-empty', 'Empty fields report null', 'الحقول الفارغة تبلّغ null', 'parity', { evidence: ['CMP-01', 'AT-TF-01', 'CI-F06'] }],
      ['preserve', 'preserve on unmount', 'الاحتفاظ بالقيم عند الإزالة', 'missing'],
      ['provider', 'Form.Provider (multi-form)', 'ربط عدة نماذج', 'missing'],
    ],
  },
  {
    id: 'input', antd: 'Input', category: 'data-entry', priority: 'p0', status: 'partial', ours: 'text-field',
    note: 'Legacy TextField, SearchField, PhoneInput; atomic TextField. ' + VERIFY,
    features: [
      ['basic', 'Basic input, controlled / uncontrolled', 'حقل نصي، تحكم وبدون تحكم', 'parity', { evidence: ['CMP-01', 'AT-TF-01'] }],
      ['sizes', 'Sizes', 'الأحجام', 'parity'],
      ['status', 'Status error / warning', 'حالة خطأ/تحذير', 'partial', { evidence: ['AT-TF-02'], note: 'error only' }],
      ['disabled', 'Disabled / read-only', 'معطل/للقراءة فقط', 'parity'],
      ['prefix-suffix', 'Prefix / suffix', 'بادئة/لاحقة', 'partial', { note: 'SearchField trailing slot only' }],
      ['addon', 'addonBefore / addonAfter', 'إضافات قبل وبعد', 'missing'],
      ['allow-clear', 'Allow clear', 'زر المسح', 'partial', { evidence: ['CMP-03'], note: 'SearchField and CurrencyInput only' }],
      ['password', 'Input.Password', 'كلمة المرور', 'missing'],
      ['textarea', 'TextArea with autoSize', 'نص متعدد الأسطر', 'missing'],
      ['count', 'showCount / maxLength', 'عدّاد الأحرف', 'partial', { note: 'native maxLength passes through; no counter' }],
      ['search', 'Input.Search', 'حقل البحث', 'parity', { evidence: ['CMP-03'] }],
      ['otp', 'Input.OTP', 'رمز التحقق', 'missing'],
      ['variants', 'Variants outlined / filled / borderless', 'الأنماط محدد/مملوء/بلا حدود', 'missing'],
      ['content-dir', 'Content direction auto / explicit LTR', 'اتجاه المحتوى تلقائي أو LTR صريح', 'better', { evidence: ['CMP-02', 'AT-TF-03', 'BR-MIX-02'], arabicEdge: 'typed Latin in an Arabic UI aligns by its first strong character; codes/emails can be pinned LTR; AntD inherits UI direction only' }],
      ['phone', 'Phone input with E.164 output', 'حقل هاتف يخرج E.164', 'better', { evidence: ['PH-F01', 'PH-F02', 'PH-F03', 'PH-F04', 'PH-F05', 'PH-F06', 'CMP-04'], arabicEdge: 'accepts Arabic-Indic digits and rejects look-alike Latin letters; AntD has no phone input' }],
    ],
  },
  {
    id: 'input-number', antd: 'InputNumber', category: 'data-entry', priority: 'p0', status: 'partial', ours: 'currency-input',
    note: 'CurrencyInput is an amount field (minor units); a general InputNumber with steppers is missing. ' + VERIFY,
    features: [
      ['basic', 'Numeric value, controlled / uncontrolled', 'قيمة رقمية، تحكم وبدون تحكم', 'partial', { evidence: ['CI-F06'], note: 'amounts only' }],
      ['min-max', 'Min / max', 'حد أدنى وأقصى', 'parity'],
      ['step', 'Step and up/down controls', 'الخطوة وأزرار الزيادة والنقص', 'missing'],
      ['keyboard', 'Arrow up/down to change value', 'الأسهم لتغيير القيمة', 'missing'],
      ['precision', 'Precision', 'الدقة العشرية', 'parity', { evidence: ['CI-F07', 'CI-F08'], note: 'per currency minor units, no silent rounding' }],
      ['string-mode', 'High precision (stringMode)', 'دقة عالية', 'parity', { evidence: ['CI-F15', 'PROP-03'], note: 'integer minor units, no float arithmetic' }],
      ['formatter', 'formatter / parser', 'التنسيق والتحليل', 'partial', { note: 'built-in currency format only' }],
      ['prefix', 'Prefix / addon (currency symbol)', 'بادئة (رمز العملة)', 'partial', { evidence: ['CI-F13'] }],
      ['negative', 'Negative numbers', 'الأرقام السالبة', 'parity', { evidence: ['CI-F12'] }],
      ['status', 'Status / disabled / read-only', 'الحالة والتعطيل', 'parity'],
      ['clear', 'Clear', 'المسح', 'parity', { evidence: ['BR-CI-01'] }],
      ['replace-on-focus', 'Keyboard entry into a filled field replaces it', 'الكتابة في حقل ممتلئ تستبدله', 'parity', { evidence: ['BR-CI-04'] }],
      ['arabic-digits', 'Arabic-Indic and Persian digits accepted', 'قبول الأرقام العربية المشرقية والفارسية', 'better', { evidence: ['CI-F02', 'CI-F03', 'BR-CI-02', 'PROP-01', 'PROP-02'], arabicEdge: 'AntD InputNumber rejects ٠-٩ unless the app writes a parser' }],
      ['ambiguous-comma', 'Ambiguous comma rejected with a suggestion', 'رفض الفاصلة الملتبسة مع اقتراح', 'better', { evidence: ['CI-F04', 'CI-F09', 'BR-CI-03', 'PROP-04'], arabicEdge: '«1,500» could be 1.5 or 1500 depending on habit; never guessed silently' }],
      ['arabic-separators', 'Arabic thousands / decimal separators', 'فواصل الآلاف والعشرية العربية', 'better', { evidence: ['CI-F10', 'CI-F11', 'PROP-07'], arabicEdge: '«٬» and «٫» parsed and displayed as one bidi run' }],
      ['bidi-paste', 'Pasted bidi marks and RTL minus handled', 'معالجة علامات الاتجاه الملصوقة والسالب المكتوب من اليمين', 'better', { evidence: ['CI-F14', 'CI-F18'], arabicEdge: 'invisible RLM/LRM from copy-paste do not change the value; trailing minus is rejected with a reason' }],
    ],
  },
  { id: 'mentions', antd: 'Mentions', category: 'data-entry', priority: 'p2', features: [
    ['basic', 'Mention suggestions', 'اقتراحات الإشارة'], ['prefix', 'Custom prefix (@, #)', 'بادئة مخصصة'], ['async', 'Async options', 'خيارات غير متزامنة'], ['placement', 'Placement', 'الموضع'],
  ] },
  {
    id: 'radio', antd: 'Radio', category: 'data-entry', priority: 'p0', status: 'partial', ours: 'segmented-control',
    note: 'SegmentedControl is a radiogroup with button-style options; no classic radio circles. ' + VERIFY,
    features: [
      ['basic', 'Radio', 'زر اختيار', 'missing'],
      ['group', 'Radio.Group with options', 'مجموعة خيارات', 'partial'],
      ['button-style', 'Button style options', 'خيارات بشكل أزرار', 'parity', { evidence: ['CMP-06'] }],
      ['disabled', 'Disabled options', 'خيارات معطلة', 'parity', { evidence: ['CMP-06'] }],
      ['keyboard', 'Arrow keys follow direction', 'الأسهم تتبع الاتجاه', 'parity', { evidence: ['CMP-06'] }],
      ['vertical', 'Vertical group', 'مجموعة رأسية', 'missing'],
    ],
  },
  { id: 'rate', antd: 'Rate', category: 'data-entry', priority: 'p2', features: [
    ['basic', 'Star rating', 'تقييم بالنجوم'], ['half', 'Half stars', 'نصف نجمة'], ['character', 'Custom character', 'رمز مخصص'], ['tooltips', 'Tooltips', 'تلميحات'], ['rtl', 'Fill direction in RTL', 'اتجاه الملء في RTL', 'missing', { arabicEdge: 'risk: stars must fill from the inline start' }],
  ] },
  {
    id: 'select', antd: 'Select', category: 'data-entry', priority: 'p0', status: 'partial', ours: 'select',
    note: 'Legacy Select is a styled native <select>; Combobox (React Aria) covers searchable single select. ' + VERIFY,
    features: [
      ['single', 'Single select', 'اختيار واحد', 'parity', { evidence: ['CMP-05'] }],
      ['controlled', 'Controlled / uncontrolled', 'تحكم وبدون تحكم', 'parity', { evidence: ['CMP-05', 'BR-CB-03'] }],
      ['sizes', 'Sizes', 'الأحجام', 'parity'],
      ['disabled', 'Disabled', 'معطل', 'parity'],
      ['status', 'Status / error', 'حالة الخطأ', 'parity', { note: 'Combobox error prop' }],
      ['show-search', 'showSearch', 'البحث داخل القائمة', 'parity', { evidence: ['BR-CB-01'], note: 'Combobox' }],
      ['filter-option', 'Custom filterOption', 'تصفية مخصصة', 'partial', { note: 'search options (strict/tolerant), not an arbitrary function' }],
      ['keyboard', 'Keyboard selection, Enter / Escape', 'الاختيار بلوحة المفاتيح', 'parity', { evidence: ['BR-CB-03', 'BR-CB-04'] }],
      ['allow-clear', 'Allow clear (reports empty)', 'زر المسح', 'partial', { evidence: ['BR-CB-03'], note: 'clearing the text reports null; no clear button' }],
      ['not-found', 'notFoundContent', 'محتوى عدم وجود نتائج', 'parity'],
      ['option-render', 'Custom option render (secondary line)', 'عرض خيار مخصص', 'partial', { note: 'label + description only' }],
      ['label-in-value', 'labelInValue / option in onChange', 'إرجاع الخيار مع القيمة', 'parity', { note: 'details.item' }],
      ['placement-rtl', 'Popup aligned to field start in RTL', 'القائمة محاذية لبداية الحقل في RTL', 'parity', { evidence: ['BR-CB-04'] }],
      ['multiple', 'Multiple mode', 'تحديد متعدد', 'missing'],
      ['tags', 'Tags mode', 'نمط الوسوم', 'missing'],
      ['max-tag', 'maxTagCount / responsive tags', 'حد الوسوم المعروضة', 'missing'],
      ['groups', 'Option groups', 'مجموعات الخيارات', 'missing'],
      ['disabled-options', 'Disabled options', 'خيارات معطلة', 'missing'],
      ['virtual', 'Virtual scroll for large lists', 'تمرير افتراضي للقوائم الكبيرة', 'missing'],
      ['remote', 'Remote search with loading', 'بحث عن بعد مع تحميل', 'missing'],
      ['dropdown-render', 'dropdownRender (custom footer)', 'محتوى مخصص للقائمة', 'missing'],
      ['variants', 'Variants outlined / filled / borderless', 'الأنماط', 'missing'],
      ['arabic-search', 'Arabic-tolerant search with highlighted match', 'بحث عربي متسامح مع تمييز المطابقة', 'better', { evidence: ['SR-F01', 'SR-F02', 'SR-F04', 'PROP-05', 'PROP-06', 'BR-CB-01'], arabicEdge: 'hamza, alef maqsura, taa marbuta and diacritics ignored on match, stored text unchanged; AntD filter is a plain substring' }],
      ['digit-search', 'Search by phone/code digits in any numerals', 'البحث بأرقام الهاتف بأي نظام أرقام', 'better', { evidence: ['SR-F06', 'SR-F07', 'BR-CB-02'], arabicEdge: '«٠١٠…» finds «+20 10 …»' }],
      ['mixed-align', 'Latin names in an Arabic list follow alignment preference', 'الأسماء اللاتينية في قائمة عربية تتبع تفضيل المحاذاة', 'better', { evidence: ['BR-MIX-01'], arabicEdge: 'mixed-script options keep direction per item' }],
    ],
  },
  { id: 'slider', antd: 'Slider', category: 'data-entry', priority: 'p2', features: [
    ['basic', 'Single value', 'قيمة واحدة'], ['range', 'Range', 'نطاق'], ['marks', 'Marks and steps', 'علامات وخطوات'], ['vertical', 'Vertical', 'رأسي'], ['tooltip', 'Value tooltip', 'تلميح القيمة'], ['rtl', 'Reversed in RTL', 'معكوس في RTL', 'missing', { arabicEdge: 'risk: min must sit at the inline start' }],
  ] },
  {
    id: 'switch', antd: 'Switch', category: 'data-entry', priority: 'p1', status: 'partial', ours: 'switch',
    features: [
      ['basic', 'Checked, controlled / uncontrolled', 'تشغيل/إيقاف، تحكم وبدون تحكم', 'parity', { evidence: ['CMP-07'] }],
      ['disabled', 'Disabled', 'معطل', 'parity'],
      ['label', 'Label and description', 'عنوان ووصف', 'parity'],
      ['size', 'Size small', 'حجم صغير', 'missing'],
      ['loading', 'Loading', 'تحميل', 'missing'],
      ['children', 'checkedChildren / unCheckedChildren', 'نص داخل المفتاح', 'missing'],
    ],
  },
  { id: 'time-picker', antd: 'TimePicker', category: 'data-entry', priority: 'p1', features: [
    ['basic', 'Time selection', 'اختيار الوقت'], ['format', '12/24 hour format', 'صيغة 12/24 ساعة'], ['steps', 'Hour/minute/second steps', 'خطوات الساعات والدقائق'], ['range', 'Range', 'نطاق'], ['disabled-time', 'Disabled time', 'أوقات معطلة'], ['ampm-ar', 'Arabic AM/PM (ص/م)', 'ص/م بالعربية', 'missing', { arabicEdge: 'opportunity: ص/م and Arabic digits in segments, as in DatePicker' }],
  ] },
  { id: 'transfer', antd: 'Transfer', category: 'data-entry', priority: 'p2', features: [
    ['basic', 'Two lists with move', 'قائمتان مع نقل'], ['search', 'Search', 'بحث'], ['one-way', 'One-way', 'اتجاه واحد'], ['custom-render', 'Custom render / table / tree', 'عرض مخصص'], ['pagination', 'Pagination', 'ترقيم الصفحات'], ['rtl', 'Move arrows mirrored in RTL', 'عكس أسهم النقل في RTL', 'missing', { arabicEdge: 'risk: «→» moves to the target list visually' }],
  ] },
  {
    id: 'tree-select', antd: 'TreeSelect', category: 'data-entry', priority: 'p1',
    features: [
      ['basic', 'Tree dropdown select', 'اختيار من شجرة'],
      ['multiple', 'Multiple', 'متعدد'],
      ['checkable', 'treeCheckable', 'تحديد بمربعات'],
      ['strategy', 'showCheckedStrategy', 'استراتيجية عرض المحدد'],
      ['search', 'Search with treeNodeFilterProp', 'البحث في الشجرة'],
      ['async', 'Async load data', 'تحميل غير متزامن'],
      ['tree-data', 'treeData / simple mode', 'بيانات الشجرة'],
      ['expand', 'Default / controlled expanded keys', 'التوسيع الافتراضي والمتحكم به'],
      ['tree-line', 'Tree lines', 'خطوط الشجرة'],
      ['virtual', 'Virtual scroll', 'تمرير افتراضي'],
      ['max-tag', 'maxTagCount', 'حد الوسوم'],
      ['rtl', 'Indent and switcher mirrored in RTL', 'عكس المسافة البادئة ومفتاح التوسيع في RTL', 'missing', { arabicEdge: 'risk: indentation from the inline start; Arabic tolerant search would apply' }],
    ],
  },
  {
    id: 'upload', antd: 'Upload', category: 'data-entry', priority: 'p1',
    features: [
      ['basic', 'Click to upload', 'الرفع بالنقر'],
      ['drag', 'Drag and drop (Dragger)', 'السحب والإفلات'],
      ['list', 'File list with status', 'قائمة الملفات مع الحالة'],
      ['progress', 'Progress', 'شريط التقدم'],
      ['picture', 'Picture card / list', 'بطاقات الصور'],
      ['preview', 'Preview', 'معاينة'],
      ['before-upload', 'beforeUpload validation', 'تحقق قبل الرفع'],
      ['custom-request', 'customRequest', 'طلب مخصص'],
      ['multiple', 'Multiple / directory', 'ملفات متعددة ومجلدات'],
      ['max-count', 'maxCount', 'حد عدد الملفات'],
      ['accept', 'accept types', 'أنواع مقبولة'],
      ['controlled', 'Controlled fileList', 'قائمة ملفات متحكم بها'],
      ['remove', 'Remove / retry', 'حذف وإعادة محاولة'],
      ['crop', 'Image crop (antd-img-crop)', 'قص الصورة'],
      ['arabic-names', 'Arabic file names render with correct direction', 'أسماء الملفات العربية باتجاه صحيح', 'missing', { arabicEdge: 'risk: «فاتورة.pdf» with extension reorders in bidi; AutoText would solve it' }],
    ],
  },
]

/* ───────────────────────────── Data display ───────────────────────────── */

const dataDisplay: ComponentInput[] = [
  { id: 'avatar', antd: 'Avatar', category: 'data-display', priority: 'p2', features: [
    ['image-icon-text', 'Image, icon or letters', 'صورة أو أيقونة أو أحرف'], ['size-shape', 'Size and shape', 'الحجم والشكل'], ['group', 'Avatar.Group with max', 'مجموعة صور'], ['arabic-initials', 'Arabic initials', 'الأحرف الأولى العربية', 'missing', { arabicEdge: 'opportunity: initials from Arabic names (skip «ال», join letters correctly)' }],
  ] },
  {
    id: 'badge', antd: 'Badge', category: 'data-display', priority: 'p1', status: 'partial', ours: 'badge',
    note: 'Our Badge is a status label (dot + text, tones); AntD Badge is mainly a count overlay. ' + VERIFY,
    features: [
      ['status', 'Status dot with text', 'نقطة حالة مع نص', 'parity'],
      ['colors', 'Preset colors', 'ألوان جاهزة', 'parity', { note: 'six tones' }],
      ['count', 'Count overlay', 'عدّاد فوق العنصر', 'missing'],
      ['overflow', 'overflowCount (99+)', 'حد العدّاد', 'missing'],
      ['dot', 'Dot only', 'نقطة فقط', 'missing'],
      ['ribbon', 'Badge.Ribbon', 'شريط', 'missing'],
    ],
  },
  { id: 'calendar', antd: 'Calendar', category: 'data-display', priority: 'p2', note: 'CalendarPreview in date-picker.tsx is a static preview, not a Calendar component. ' + VERIFY, features: [
    ['full', 'Full calendar', 'تقويم كامل'], ['card', 'Card mode', 'نمط البطاقة'], ['cell-render', 'Cell render', 'عرض الخلايا'], ['mode', 'Month / year mode', 'نمط شهر/سنة'], ['hijri', 'Hijri calendar', 'التقويم الهجري', 'missing', { arabicEdge: 'opportunity: reuse the DatePicker Hijri adapter' }],
  ] },
  { id: 'card', antd: 'Card', category: 'data-display', priority: 'p1', features: [
    ['basic', 'Title, extra, body', 'عنوان وإضافي ومحتوى'], ['cover', 'Cover image', 'صورة غلاف'], ['actions', 'Actions', 'إجراءات'], ['loading', 'Loading', 'تحميل'], ['meta', 'Card.Meta', 'بيانات وصفية'], ['tabs', 'With tabs', 'مع تبويبات'], ['grid', 'Card.Grid', 'شبكة'],
  ] },
  { id: 'carousel', antd: 'Carousel', category: 'data-display', priority: 'p2', features: [
    ['basic', 'Slides', 'شرائح'], ['autoplay', 'Autoplay', 'تشغيل تلقائي'], ['dots', 'Dots position', 'موضع النقاط'], ['fade', 'Fade effect', 'تأثير التلاشي'], ['rtl', 'Swipe direction in RTL', 'اتجاه السحب في RTL', 'missing', { arabicEdge: 'risk: next slide comes from the inline end' }],
  ] },
  { id: 'collapse', antd: 'Collapse', category: 'data-display', priority: 'p1', features: [
    ['basic', 'Panels', 'ألواح'], ['accordion', 'Accordion', 'أكورديون'], ['nested', 'Nested', 'متداخل'], ['borderless-ghost', 'Borderless / ghost', 'بلا حدود'], ['extra', 'Extra and custom icon', 'إضافي وأيقونة مخصصة'], ['collapsible', 'collapsible header / icon / disabled', 'قابلية الطي'],
  ] },
  { id: 'descriptions', antd: 'Descriptions', category: 'data-display', priority: 'p1', features: [
    ['basic', 'Label / value items', 'عنوان/قيمة'], ['bordered', 'Bordered', 'بحدود'], ['columns', 'Responsive columns', 'أعمدة متجاوبة'], ['vertical', 'Vertical layout', 'تخطيط رأسي'], ['span', 'Item span', 'امتداد العنصر'], ['sizes', 'Sizes', 'الأحجام'],
  ] },
  {
    id: 'empty', antd: 'Empty', category: 'data-display', priority: 'p1', status: 'partial', ours: 'empty-state',
    features: [
      ['basic', 'Icon, title, description', 'أيقونة وعنوان ووصف', 'parity'],
      ['action', 'Action (children)', 'إجراء', 'parity'],
      ['image', 'Preset images (simple / default)', 'صور جاهزة', 'missing'],
      ['render-empty', 'Global renderEmpty in ConfigProvider', 'عرض فارغ عام', 'missing'],
    ],
  },
  { id: 'image', antd: 'Image', category: 'data-display', priority: 'p2', features: [
    ['preview', 'Preview', 'معاينة'], ['group', 'Preview group', 'مجموعة معاينة'], ['fallback', 'Fallback / placeholder', 'بديل عند الفشل'], ['toolbar', 'Zoom / rotate toolbar', 'أدوات تكبير وتدوير'],
  ] },
  { id: 'list', antd: 'List', category: 'data-display', priority: 'p1', features: [
    ['basic', 'Items with meta', 'عناصر مع بيانات وصفية'], ['pagination', 'Pagination', 'ترقيم الصفحات'], ['load-more', 'Load more / infinite', 'تحميل المزيد'], ['grid', 'Grid', 'شبكة'], ['actions', 'Item actions', 'إجراءات العناصر'], ['virtual', 'Virtual list', 'قائمة افتراضية'],
  ] },
  { id: 'popover', antd: 'Popover', category: 'data-display', priority: 'p1', features: [
    ['basic', 'Title and content', 'عنوان ومحتوى'], ['trigger', 'Trigger hover / click / focus', 'المشغّل'], ['placement', 'Placement (12 positions)', 'الموضع'], ['controlled', 'Controlled open', 'فتح متحكم به'], ['rtl', 'Logical placement in RTL', 'موضع منطقي في RTL', 'missing', { arabicEdge: 'risk: «left» must mean start' }],
  ] },
  { id: 'qr-code', antd: 'QRCode', category: 'data-display', priority: 'p2', features: [
    ['basic', 'Render value', 'عرض القيمة'], ['icon', 'Icon in center', 'أيقونة في الوسط'], ['status', 'Status (loading / expired)', 'الحالة'], ['type', 'Canvas / SVG', 'الرسم بـCanvas أو SVG'],
  ] },
  {
    id: 'segmented', antd: 'Segmented', category: 'data-display', priority: 'p1', status: 'partial', ours: 'segmented-control',
    features: [
      ['basic', 'Options, controlled / uncontrolled', 'خيارات، تحكم وبدون تحكم', 'parity', { evidence: ['CMP-06'] }],
      ['disabled', 'Disabled options', 'خيارات معطلة', 'parity', { evidence: ['CMP-06'] }],
      ['block', 'Block (full width)', 'بعرض كامل', 'parity'],
      ['sizes', 'Sizes', 'الأحجام', 'parity'],
      ['icons', 'Icon options', 'خيارات بأيقونات', 'parity', { note: 'label is ReactNode with ariaLabel' }],
      ['rtl-keys', 'Arrow keys follow visual direction', 'الأسهم تتبع الاتجاه البصري', 'parity', { evidence: ['CMP-06'] }],
      ['wrap', 'Wrap onto two rows in narrow containers', 'الالتفاف إلى سطرين', 'parity', { note: 'not in AntD; counted as parity, not an Arabic advantage' }],
      ['vertical', 'Vertical', 'رأسي', 'missing'],
    ],
  },
  { id: 'statistic', antd: 'Statistic', category: 'data-display', priority: 'p2', note: 'AmountText formats amounts but is not a Statistic component. ' + VERIFY, features: [
    ['basic', 'Title and value', 'عنوان وقيمة'], ['precision', 'Precision / formatter', 'الدقة والتنسيق'], ['prefix-suffix', 'Prefix / suffix', 'بادئة/لاحقة'], ['countdown', 'Countdown', 'عد تنازلي'], ['numerals', 'Value in the user numerals', 'القيمة بنظام أرقام المستخدم', 'missing', { arabicEdge: 'opportunity: AmountText/NumberText already do this' }],
  ] },
  {
    id: 'table', antd: 'Table', category: 'data-display', priority: 'p0', status: 'partial', ours: 'data-table',
    note: 'Legacy DataTable (spec maturity draft): semantic table, numeric alignment, sticky header, own scroll container, compact column hiding. No sorting, filtering, pagination or selection yet. ' + VERIFY,
    features: [
      ['columns', 'Columns and dataSource', 'الأعمدة ومصدر البيانات', 'parity'],
      ['row-key', 'rowKey', 'مفتاح الصف', 'parity'],
      ['render', 'Custom cell render', 'عرض خلية مخصص', 'parity', { note: 'column.cell(row)' }],
      ['align', 'Column align (numeric end)', 'محاذاة الأعمدة (الأرقام للنهاية)', 'parity'],
      ['width', 'Column width', 'عرض العمود', 'parity'],
      ['empty', 'Empty state', 'حالة الفراغ', 'parity'],
      ['scroll-x', 'Horizontal scroll inside its container', 'تمرير أفقي داخل الحاوية', 'parity', { evidence: ['BR-LAY-01'], note: 'minWidth; the page never scrolls' }],
      ['scroll-y', 'Vertical scroll (scroll.y)', 'تمرير رأسي', 'parity', { note: 'maxHeight' }],
      ['fixed-header', 'Fixed header', 'رأس ثابت', 'parity', { note: 'th is position: sticky' }],
      ['responsive', 'Responsive columns (breakpoints)', 'أعمدة متجاوبة', 'partial', { note: 'hideCompact below 640px only' }],
      ['title-caption', 'Title / caption', 'العنوان', 'partial', { note: 'caption only; no footer' }],
      ['row-hover', 'Row hover', 'تمييز الصف عند المرور', 'partial', { note: 'CSS hover; no onRow events' }],
      ['row-selected', 'Highlighted (selected) row', 'تمييز الصف المحدد', 'partial', { note: 'selectedKey with aria-selected, visual only' }],
      ['nowrap', 'No-wrap cells', 'خلايا بلا التفاف', 'partial', { note: 'nowrap; no ellipsis' }],
      ['sort-single', 'Sorting (single column)', 'الفرز بعمود واحد', 'partial', { track: 'atomic', evidence: ['TE-06', 'TE-08'], note: 'headless engine done (src/atomic/data/table); Table UI not built yet' }],
      ['sort-multi', 'Multi-column sorting', 'الفرز بعدة أعمدة', 'partial', { track: 'atomic', evidence: ['TE-06'], note: 'headless engine done (src/atomic/data/table); Table UI not built yet' }],
      ['sorter-custom', 'Custom sorter / sortDirections', 'دالة فرز مخصصة واتجاهاته', 'partial', { track: 'atomic', evidence: ['TE-08', 'TE-09'], note: 'headless engine done (src/atomic/data/table); Table UI not built yet' }],
      ['sort-controlled', 'Controlled sortOrder', 'ترتيب فرز متحكم به', 'partial', { track: 'atomic', evidence: ['TE-06'], note: 'headless engine done (src/atomic/data/table); Table UI not built yet' }],
      ['filter-dropdown', 'Filters dropdown', 'قائمة التصفية'],
      ['filter-custom', 'Custom filter dropdown', 'تصفية مخصصة'],
      ['filter-search', 'Filter search', 'البحث داخل التصفية', 'better', { track: 'atomic', evidence: ['TE-01', 'TE-02', 'TE-03'], arabicEdge: 'filters are Arabic-tolerant (hamza, diacritics) and match phones by digits in any numeral system', note: 'headless engine done (src/atomic/data/table); Table UI not built yet' }],
      ['filter-controlled', 'Controlled filters (filteredValue)', 'تصفية متحكم بها', 'partial', { track: 'atomic', evidence: ['TE-04', 'TE-05'], note: 'headless engine done (src/atomic/data/table); Table UI not built yet' }],
      ['pagination-client', 'Client-side pagination', 'ترقيم صفحات محلي', 'partial', { track: 'atomic', evidence: ['TE-15', 'TE-20'], note: 'headless engine done (src/atomic/data/table); Table UI not built yet' }],
      ['pagination-server', 'Server-side pagination (onChange)', 'ترقيم صفحات من الخادم'],
      ['selection-checkbox', 'Row selection: checkbox', 'تحديد الصفوف بمربعات'],
      ['selection-radio', 'Row selection: radio', 'تحديد صف واحد'],
      ['select-all', 'Select all / invert / custom selections', 'تحديد الكل والعكس'],
      ['selection-disabled', 'Disabled rows (getCheckboxProps)', 'صفوف غير قابلة للتحديد'],
      ['selection-preserve', 'Preserve selection across pages', 'الاحتفاظ بالتحديد بين الصفحات'],
      ['expandable', 'Expandable rows', 'صفوف قابلة للتوسيع'],
      ['tree-data', 'Tree data', 'بيانات شجرية', 'partial', { track: 'atomic', evidence: ['TE-10', 'TE-11', 'TE-12'], note: 'headless engine done (src/atomic/data/table); Table UI not built yet' }],
      ['fixed-start', 'Fixed columns (start)', 'أعمدة مثبتة في البداية', 'partial', { track: 'atomic', evidence: ['TE-17'], arabicEdge: 'pinned offsets are logical (start/end), so RTL needs no special case', note: 'headless engine done (src/atomic/data/table); Table UI not built yet' }],
      ['fixed-end', 'Fixed columns (end)', 'أعمدة مثبتة في النهاية', 'partial', { track: 'atomic', evidence: ['TE-17'], note: 'headless engine done (src/atomic/data/table); Table UI not built yet' }],
      ['virtual', 'Virtual scroll', 'تمرير افتراضي'],
      ['resize', 'Column resize', 'تغيير عرض الأعمدة', 'partial', { track: 'atomic', evidence: ['TE-16'], note: 'width model only (explicit widths, min/max, flex); drag handle not built' }],
      ['grouping', 'Column grouping headers', 'رؤوس أعمدة مجمّعة'],
      ['summary', 'Summary row', 'صف الإجماليات', 'better', { track: 'atomic', evidence: ['TE-14'], arabicEdge: 'aggregates over all filtered rows; money sums stay exact integer minor units', note: 'headless engine done (src/atomic/data/table); Table UI not built yet' }],
      ['edit-cell', 'Editable cells', 'خلايا قابلة للتحرير'],
      ['edit-row', 'Editable rows', 'صفوف قابلة للتحرير'],
      ['on-row', 'Row click / events (onRow)', 'أحداث الصف'],
      ['loading', 'Loading state', 'حالة التحميل'],
      ['sticky-offset', 'Sticky header with offset / sticky scrollbar', 'رأس لاصق بإزاحة'],
      ['ellipsis', 'Ellipsis with tooltip', 'اختصار مع تلميح'],
      ['row-class', 'rowClassName / row style', 'تنسيق الصف'],
      ['size-bordered', 'Size and bordered variants', 'الأحجام والحدود'],
      ['drag-sort', 'Drag sort rows (via dnd-kit extension)', 'ترتيب الصفوف بالسحب'],
      ['col-settings', 'Column visibility settings (ProTable)', 'إظهار وإخفاء الأعمدة', 'partial', { track: 'atomic', evidence: ['TE-16', 'TE-18'], note: 'order and visibility in state + versioned saved views; no settings UI yet' }],
      ['density', 'Density setting (ProTable)', 'إعداد الكثافة', 'missing', { note: 'density exists at the experience level (atomic contexts), not per table' }],
      ['export', 'Export (ProTable)', 'تصدير'],
      ['keyboard', 'Keyboard navigation (grid)', 'التنقل بلوحة المفاتيح'],
      ['rtl', 'RTL layout', 'تخطيط RTL', 'parity', { note: 'logical properties throughout; AntD supports RTL via ConfigProvider direction' }],
    ],
  },
  {
    id: 'tag', antd: 'Tag', category: 'data-display', priority: 'p2', status: 'partial', ours: 'badge',
    features: [
      ['colors', 'Preset colors', 'ألوان جاهزة', 'parity', { note: 'Badge tones' }],
      ['bordered', 'Bordered / borderless', 'بحدود/بلا حدود', 'parity', { note: "Badge variant 'outline' | 'soft'" }],
      ['closable', 'Closable', 'قابل للإغلاق', 'missing'],
      ['checkable', 'CheckableTag', 'وسم قابل للتحديد', 'missing'],
      ['icon', 'Icon', 'أيقونة', 'missing'],
    ],
  },
  { id: 'timeline', antd: 'Timeline', category: 'data-display', priority: 'p2', features: [
    ['basic', 'Items', 'عناصر'], ['color', 'Colors / custom dot', 'ألوان ونقاط مخصصة'], ['mode', 'Alternate / left / right mode', 'أنماط التبادل'], ['pending', 'Pending', 'قيد الانتظار'], ['reverse', 'Reverse', 'عكس الترتيب'],
  ] },
  { id: 'tooltip', antd: 'Tooltip', category: 'data-display', priority: 'p0', note: 'Only the native title attribute (Badge title). ' + VERIFY, features: [
    ['basic', 'Tooltip on hover and focus', 'تلميح عند المرور والتركيز'], ['placement', 'Placement', 'الموضع'], ['arrow', 'Arrow pointing at center', 'سهم'], ['color', 'Colors', 'الألوان'], ['controlled', 'Controlled open', 'فتح متحكم به'], ['rtl', 'Logical placement in RTL', 'موضع منطقي في RTL', 'missing', { arabicEdge: 'risk: start/end placement must mirror' }],
  ] },
  { id: 'tour', antd: 'Tour', category: 'data-display', priority: 'p2', features: [
    ['steps', 'Steps with target', 'خطوات مرتبطة بعناصر'], ['mask', 'Mask', 'قناع'], ['placement', 'Placement', 'الموضع'], ['indicators', 'Indicators', 'مؤشرات'],
  ] },
  {
    id: 'tree', antd: 'Tree', category: 'data-display', priority: 'p1',
    features: [
      ['basic', 'Tree data', 'بيانات شجرية'],
      ['expand', 'Expand / collapse (controlled)', 'توسيع وطي'],
      ['select', 'Select nodes (single / multiple)', 'تحديد العقد'],
      ['checkable', 'Checkable with half-checked', 'تحديد بمربعات مع الحالة الجزئية'],
      ['check-strictly', 'checkStrictly', 'تحديد مستقل'],
      ['async', 'Async load children', 'تحميل الأبناء غير متزامن'],
      ['draggable', 'Drag and drop nodes', 'سحب وإفلات العقد'],
      ['search', 'Search / highlight', 'بحث وتمييز'],
      ['virtual', 'Virtual scroll', 'تمرير افتراضي'],
      ['directory', 'DirectoryTree', 'شجرة المجلدات'],
      ['show-line', 'Show line / custom icons', 'خطوط وأيقونات مخصصة'],
      ['title-render', 'titleRender', 'عرض العنوان المخصص'],
      ['keyboard', 'Keyboard navigation (treeitem)', 'التنقل بلوحة المفاتيح'],
      ['rtl', 'RTL indent and expand arrows', 'المسافة البادئة وأسهم التوسيع في RTL', 'missing', { arabicEdge: 'risk: ArrowRight expands in LTR but collapses in RTL' }],
    ],
  },
]

/* ───────────────────────────── Feedback ───────────────────────────── */

const feedback: ComponentInput[] = [
  {
    id: 'alert', antd: 'Alert', category: 'feedback', priority: 'p1', status: 'partial', ours: 'inline-message',
    features: [
      ['types', 'Types success / info / warning / error', 'الأنواع', 'parity'],
      ['description', 'Message and description', 'عنوان ووصف', 'parity'],
      ['action', 'Action', 'إجراء', 'parity'],
      ['live', 'Live region politeness', 'منطقة إعلان حي', 'parity'],
      ['closable', 'Closable', 'قابل للإغلاق', 'missing'],
      ['banner', 'Banner mode', 'نمط الشريط', 'missing'],
      ['icon', 'Show / custom icon', 'أيقونة مخصصة', 'missing'],
    ],
  },
  {
    id: 'drawer', antd: 'Drawer', category: 'feedback', priority: 'p0', status: 'partial', ours: 'drawer',
    features: [
      ['basic', 'Open / close with title, footer', 'فتح وإغلاق مع عنوان وتذييل', 'parity'],
      ['focus', 'Focus enters, is trapped and returns', 'دخول التركيز وحبسه وعودته', 'parity', { note: 'shared overlay core with Dialog (BR-DLG-* run on Dialog)' }],
      ['escape', 'Escape and mask close', 'الإغلاق بـEscape والخلفية', 'parity'],
      ['sizes', 'Sizes', 'الأحجام', 'parity'],
      ['placement', 'Placement top / right / bottom / left', 'الموضع', 'missing'],
      ['push', 'Nested push', 'دفع الأدراج المتداخلة', 'missing'],
      ['extra', 'Extra actions in header', 'إجراءات في الرأس', 'missing'],
      ['loading', 'Loading', 'تحميل', 'missing'],
    ],
  },
  {
    id: 'message', antd: 'Message', category: 'feedback', priority: 'p1', status: 'partial', ours: 'toast',
    features: [
      ['types', 'success / error / info / warning', 'الأنواع', 'parity'],
      ['duration', 'Duration', 'المدة', 'parity'],
      ['hook', 'Hook API (useMessage)', 'واجهة الخطاف', 'parity', { note: 'useToast' }],
      ['loading', 'Loading message with update by key', 'رسالة تحميل تُحدَّث بمفتاح', 'missing'],
      ['dir', 'Direction and language from the locale scope', 'الاتجاه واللغة من نطاق اللغة', 'parity', { evidence: ['CMP-09'] }],
    ],
  },
  {
    id: 'modal', antd: 'Modal', category: 'feedback', priority: 'p0', status: 'partial', ours: 'dialog',
    features: [
      ['basic', 'Title, content, footer', 'عنوان ومحتوى وتذييل', 'parity'],
      ['controlled', 'Controlled open with close reason', 'فتح متحكم به مع سبب الإغلاق', 'parity'],
      ['focus-enter', 'Focus enters on open', 'دخول التركيز عند الفتح', 'parity', { evidence: ['BR-DLG-01'] }],
      ['focus-trap', 'Focus trapped', 'حبس التركيز', 'parity', { evidence: ['BR-DLG-02'] }],
      ['escape', 'Escape closes, focus returns', 'Escape يغلق والتركيز يعود', 'parity', { evidence: ['BR-DLG-03'] }],
      ['nested', 'Nested modals', 'حوارات متداخلة', 'parity', { evidence: ['BR-DLG-04'] }],
      ['mask-closable', 'Mask closable', 'الإغلاق بالنقر على الخلفية', 'parity'],
      ['closable', 'Close button', 'زر الإغلاق', 'parity'],
      ['confirm-loading', 'confirmLoading / prevent close while busy', 'منع الإغلاق أثناء الانشغال', 'partial', { note: 'dismissible=false; no built-in OK loading' }],
      ['width', 'Width', 'العرض', 'partial', { note: 'sm/md/lg only' }],
      ['confirm', 'Modal.confirm / info / success / error', 'حوارات التأكيد الجاهزة', 'missing'],
      ['use-modal', 'useModal hook', 'خطاف الحوار', 'missing'],
      ['centered', 'Centered / top offset', 'التوسيط', 'missing'],
      ['destroy', 'destroyOnClose / forceRender', 'الإزالة عند الإغلاق', 'missing'],
      ['after-close', 'afterClose / afterOpenChange', 'بعد الإغلاق', 'missing'],
      ['draggable', 'Draggable (recipe)', 'قابل للسحب', 'missing'],
      ['footer-render', 'Footer render with default buttons', 'تذييل مخصص مع الأزرار الافتراضية', 'missing'],
      ['inert', 'Background made inert for assistive tech', 'جعل الخلفية خاملة لقارئات الشاشة', 'parity'],
    ],
  },
  {
    id: 'notification', antd: 'Notification', category: 'feedback', priority: 'p1', status: 'partial', ours: 'toast',
    features: [
      ['basic', 'Title and description', 'عنوان ووصف', 'parity'],
      ['types', 'Types', 'الأنواع', 'parity'],
      ['duration', 'Duration / persistent', 'المدة/دائم', 'parity', { evidence: ['CMP-10'] }],
      ['pause-hover', 'Pause on hover', 'إيقاف المؤقت عند المرور', 'parity', { evidence: ['CMP-10'] }],
      ['close', 'Close button', 'زر الإغلاق', 'parity'],
      ['placement', 'Placement', 'الموضع', 'missing'],
      ['actions', 'Action buttons (btn)', 'أزرار إجراء', 'missing'],
      ['stack', 'Stack collapse', 'تجميع المكدس', 'missing'],
      ['progress', 'Progress bar of remaining time', 'شريط الوقت المتبقي', 'missing'],
    ],
  },
  { id: 'popconfirm', antd: 'Popconfirm', category: 'feedback', priority: 'p1', features: [
    ['basic', 'Confirm on action', 'تأكيد قبل الإجراء'], ['async', 'Async confirm', 'تأكيد غير متزامن'], ['placement', 'Placement', 'الموضع'], ['icon', 'Custom icon / texts', 'أيقونة ونصوص مخصصة'],
  ] },
  { id: 'progress', antd: 'Progress', category: 'feedback', priority: 'p1', features: [
    ['line', 'Line', 'خطي'], ['circle', 'Circle / dashboard', 'دائري'], ['status', 'Status', 'الحالة'], ['steps', 'Steps', 'خطوات'], ['format', 'Custom format', 'تنسيق مخصص'], ['rtl', 'Fill from inline start, percent in user numerals', 'الملء من البداية والنسبة بأرقام المستخدم', 'missing', { arabicEdge: 'opportunity: «٪٤٠» with Digits; risk: fill direction' }],
  ] },
  { id: 'result', antd: 'Result', category: 'feedback', priority: 'p2', features: [
    ['status', 'Status success / error / info / warning', 'الحالة'], ['http', '403 / 404 / 500', 'صفحات الأخطاء'], ['extra', 'Extra actions', 'إجراءات'],
  ] },
  {
    id: 'skeleton', antd: 'Skeleton', category: 'feedback', priority: 'p2', status: 'partial', ours: 'skeleton',
    features: [
      ['block', 'Basic block', 'كتلة أساسية', 'parity'],
      ['presets', 'Avatar / title / paragraph presets', 'قوالب جاهزة', 'missing'],
      ['active', 'Active animation', 'حركة', 'missing'],
      ['elements', 'Button / input / image elements', 'عناصر جاهزة', 'missing'],
    ],
  },
  {
    id: 'spin', antd: 'Spin', category: 'feedback', priority: 'p1', status: 'partial', ours: 'spinner',
    features: [
      ['basic', 'Spinner with accessible label', 'مؤشر دوار باسم مقروء', 'parity'],
      ['sizes', 'Sizes', 'الأحجام', 'missing'],
      ['container', 'Wrap content (loading overlay)', 'تغطية المحتوى', 'missing'],
      ['delay', 'Delay', 'تأخير', 'missing'],
      ['fullscreen', 'Fullscreen', 'ملء الشاشة', 'missing'],
    ],
  },
  { id: 'watermark', antd: 'Watermark', category: 'feedback', priority: 'p2', features: [
    ['text', 'Text watermark', 'علامة نصية'], ['image', 'Image watermark', 'علامة صورة'], ['font', 'Font / gap / rotate', 'الخط والمسافات والدوران'], ['arabic', 'Arabic text shaping in canvas', 'تشكيل النص العربي في Canvas', 'missing', { arabicEdge: 'risk: canvas text needs direction set or Arabic renders disconnected/reversed' }],
  ] },
]

/* ───────────────────────────── Other ───────────────────────────── */

const other: ComponentInput[] = [
  { id: 'affix', antd: 'Affix', category: 'other', priority: 'p2', features: [
    ['top-bottom', 'offsetTop / offsetBottom', 'تثبيت أعلى/أسفل'], ['target', 'Custom target', 'حاوية مخصصة'], ['on-change', 'onChange', 'عند التغيير'],
  ] },
  { id: 'app', antd: 'App', category: 'other', priority: 'p2', features: [
    ['context', 'message / notification / modal from context', 'الرسائل والحوارات من السياق', 'partial', { note: 'ToastProvider + useToast only' }], ['config', 'Component-level config', 'إعداد على مستوى المكوّن'],
  ], status: 'partial', ours: 'toast' },
  {
    id: 'config-provider', antd: 'ConfigProvider', category: 'other', priority: 'p0', status: 'partial', ours: 'locale-provider',
    note: 'LocaleProvider (dir, lang, numerals, mixedAlign) in legacy; experience scope (context, tokens, density) in atomic. ' + VERIFY,
    features: [
      ['direction', 'direction rtl / ltr', 'الاتجاه', 'parity', { evidence: ['CTX-05', 'CTX-16', 'AT-INV-02'] }],
      ['locale', 'Locale (internal strings)', 'اللغة (النصوص الداخلية)', 'parity', { evidence: ['AT-BT-04'] }],
      ['theme', 'Theme tokens', 'رموز السمة', 'partial', { track: 'atomic', evidence: ['AT-ST-01', 'AT-ST-02', 'AT-ST-04'] }],
      ['algorithm', 'Dark / compact algorithms', 'خوارزميات داكن/مضغوط', 'partial', { track: 'atomic', evidence: ['AT-ST-03', 'AT-ST-05'], note: 'density via contexts; dark mode via tokens/theme' }],
      ['component-size', 'componentSize', 'حجم المكوّنات', 'partial', { track: 'atomic', evidence: ['AT-ST-05'] }],
      ['component-tokens', 'Component-level tokens', 'رموز على مستوى المكوّن', 'partial', { track: 'atomic', evidence: ['AT-ST-02'] }],
      ['nesting', 'Nested providers', 'مزودات متداخلة', 'parity', { evidence: ['CMP-09', 'AT-INV-02'] }],
      ['css-var', 'CSS variables mode', 'نمط متغيرات CSS', 'parity'],
      ['prefix', 'prefixCls / getPopupContainer', 'بادئة الأصناف وحاوية النوافذ', 'missing'],
      ['numerals', 'Numerals preference (Latin / Arabic-Indic)', 'تفضيل نظام الأرقام', 'better', { evidence: ['CT-01', 'CT-02', 'CTX-06'], arabicEdge: 'one provider switch moves every number on the page; AntD has no numerals setting' }],
      ['mixed-align', 'Mixed-script alignment preference', 'تفضيل محاذاة النص المختلط', 'better', { evidence: ['CT-03', 'BR-MIX-01', 'BR-MIX-02'], arabicEdge: 'Latin names in Arabic UI align by UI or by content, as a regional preference' }],
      ['calendar', 'Calendar system independent of locale', 'نظام التقويم مستقل عن اللغة', 'better', { evidence: ['CTX-06', 'BR-DP-01'], arabicEdge: 'Hijri/Gregorian chosen separately from language and numerals' }],
    ],
  },
  { id: 'util', antd: 'Util', category: 'other', priority: 'p2', note: 'Type helpers (GetRef, GetProps, GetProp). ' + VERIFY, features: [
    ['get-ref', 'GetRef / GetProps / GetProp types', 'أنواع مساعدة'],
  ] },
]

export const ANTD_COMPONENTS: ParityComponent[] = [...general, ...layout, ...navigation, ...dataEntry, ...dataDisplay, ...feedback, ...other].map(component)

export const ANTD_ECOSYSTEM: AntdEcosystem = [
  { id: 'pro-table', name: 'ProTable', nameAr: 'جدول احترافي', kind: 'pro-components', url: 'https://procomponents.ant.design/components/table', priority: 'p0', status: 'missing', track: 'none', note: 'search form, toolbar, column settings, density, request-driven data' },
  { id: 'pro-form', name: 'ProForm', nameAr: 'نماذج احترافية', kind: 'pro-components', url: 'https://procomponents.ant.design/components/form', priority: 'p0', status: 'missing', track: 'none' },
  { id: 'pro-layout', name: 'ProLayout', nameAr: 'تخطيط احترافي', kind: 'pro-components', url: 'https://procomponents.ant.design/components/layout', priority: 'p1', status: 'missing', track: 'none', arabicEdge: 'risk: mirrored side menu and breadcrumbs' },
  { id: 'pro-list', name: 'ProList', nameAr: 'قائمة احترافية', kind: 'pro-components', url: 'https://procomponents.ant.design/components/list', priority: 'p2', status: 'missing', track: 'none' },
  { id: 'pro-descriptions', name: 'ProDescriptions', nameAr: 'أوصاف احترافية', kind: 'pro-components', url: 'https://procomponents.ant.design/components/descriptions', priority: 'p2', status: 'missing', track: 'none' },
  { id: 'antv-charts', name: 'AntV charts (G2 / Ant Design Charts)', nameAr: 'الرسوم البيانية', kind: 'charts', url: 'https://ant-design-charts.antgroup.com/', priority: 'p1', status: 'missing', track: 'none', arabicEdge: 'opportunity: RTL axes and Arabic numerals in tick labels' },
  { id: 'pro-templates', name: 'Ant Design Pro templates', nameAr: 'قوالب تطبيقات جاهزة', kind: 'templates', url: 'https://pro.ant.design/', priority: 'p1', status: 'partial', track: 'legacy', ours: 'reference-app', evidence: ['BR-APP-01', 'BR-APP-02'], note: 'one reference app (collect payment, add customer) in src/pages/reference' },
  { id: 'antd-mobile', name: 'antd-mobile', nameAr: 'مكتبة الجوال', kind: 'mobile', url: 'https://mobile.ant.design/', priority: 'p2', status: 'missing', track: 'none', note: 'POS touch context (44px targets) exists at the token level only' },
  { id: 'ant-design-x', name: 'Ant Design X (AI chat UI)', nameAr: 'واجهات المحادثة الذكية', kind: 'ai', url: 'https://x.ant.design/', priority: 'p2', status: 'missing', track: 'none', arabicEdge: 'opportunity: streaming mixed-direction text needs AutoText per message' },
  { id: 'icons', name: '@ant-design/icons', nameAr: 'مكتبة الأيقونات', kind: 'icons', url: 'https://ant.design/components/icon', priority: 'p1', status: 'partial', track: 'legacy', ours: 'icons', note: 'about 48 icons' },
  { id: 'theme-editor', name: 'Theme editor', nameAr: 'محرر السمات', kind: 'tooling', url: 'https://ant.design/theme-editor', priority: 'p2', status: 'missing', track: 'none', note: 'experience lab on ProgressPage previews contexts but does not edit tokens' },
  { id: 'docs-site', name: 'Documentation site', nameAr: 'موقع التوثيق', kind: 'docs', url: 'https://ant.design/', priority: 'p1', status: 'partial', track: 'legacy', ours: 'explorer', note: 'Arabic-first explorer with specs, evidence and state matrix; far fewer component pages' },
  { id: 'figma-kit', name: 'Figma kit', nameAr: 'مكتبة فيجما', kind: 'design-kit', url: 'https://ant.design/docs/resources', priority: 'p2', status: 'missing', track: 'none', note: 'Figma Make is planned as the visual layer; no published kit' },
]

/* ───────────────────────────── Summary ───────────────────────────── */

const emptyCounts = (): StatusCounts => ({ missing: 0, partial: 0, parity: 0, better: 0 })
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10)

/** Pure: counts by status, coverage = share of rows with status other than 'missing'. */
export function paritySummary(components: ParityComponent[] = ANTD_COMPONENTS, ecosystem: AntdEcosystem = ANTD_ECOSYSTEM): ParitySummary {
  const cBy = emptyCounts()
  const fBy = emptyCounts()
  const eBy = emptyCounts()
  for (const c of components) {
    cBy[c.status]++
    for (const f of c.features) fBy[f.status]++
  }
  for (const e of ecosystem) eBy[e.status]++
  const cTotal = components.length
  const fTotal = components.reduce((n, c) => n + c.features.length, 0)
  const cCovered = cTotal - cBy.missing
  const fCovered = fTotal - fBy.missing
  const table = components.find((c) => c.id === 'table')
  const tTotal = table?.features.length ?? 0
  const tCovered = table?.features.filter((f) => f.status !== 'missing').length ?? 0
  const p0 = components.filter((c) => c.priority === 'p0')
  const p0Covered = p0.filter((c) => c.status !== 'missing').length
  return {
    components: { total: cTotal, byStatus: cBy, covered: cCovered, coveredPercent: pct(cCovered, cTotal) },
    features: { total: fTotal, byStatus: fBy, covered: fCovered, coveredPercent: pct(fCovered, fTotal) },
    table: { total: tTotal, covered: tCovered, coveredPercent: pct(tCovered, tTotal) },
    p0: { total: p0.length, covered: p0Covered, coveredPercent: pct(p0Covered, p0.length) },
    ecosystem: { total: ecosystem.length, byStatus: eBy, covered: ecosystem.length - eBy.missing },
    arabicAdvantages: fBy.better + eBy.better,
  }
}
