// Factory step 2: the judgment half of each spec (purpose, keyboard, aria, invariants, contexts, prop docs).
// Kept in one reviewable file and applied onto drafts from scripts/spec-draft.mjs. Mechanical fields
// (props, types, defaults, anatomy, rules) are never written here; they stay derived from code.
//   node scripts/spec-fill.mjs            fill every spec that has an entry below
import fs from 'node:fs'
import path from 'node:path'

// Shared prop docs, used when the code has no JSDoc.
const DOC = {
  label: 'اسم الحقل الظاهر، وهو اسمه المقروء.',
  hideLabel: 'يخفي الاسم بصريًا ويبقيه اسمًا مقروءًا.',
  value: 'القيمة في الوضع المتحكم فيه.',
  defaultValue: 'القيمة الابتدائية في الوضع غير المتحكم فيه.',
  onValueChange: 'يُستدعى عند كل تغيير من المستخدم، في الوضعين.',
  helper: 'نص مساعد مرتبط بـaria-describedby.',
  error: 'رسالة خطأ ظاهرة ومرتبطة بالحقل.',
  optional: 'الحقل مطلوب افتراضيًا؛ هذه الخاصية تعلّمه اختياريًا.',
  disabled: 'غير متاح؛ لا يستقبل تركيزًا ولا يُرسل.',
  readOnly: 'معروض ويمكن نسخه، لا يُعدَّل.',
  size: 'الحجم. الكثافة من السمة لا من الخاصية.',
  variant: 'الشكل البصري.',
  tone: 'النبرة اللونية. اللون لا يكون الإشارة الوحيدة.',
  options: 'الخيارات: قيمة واسم، ويمكن تعطيل خيار.',
  items: 'العناصر بالترتيب المنطقي؛ الاتجاه البصري يتبع الـprovider.',
  fullWidth: 'يملأ عرض الحاوية.',
  wrap: 'يسمح بالتفاف الخيارات في الحاويات الضيقة.',
  children: 'المحتوى.',
  title: 'العنوان.',
  description: 'وصف قصير مرتبط بـaria-describedby.',
  footer: 'أزرار الإجراءات أسفل اللوحة.',
  initialFocus: 'العنصر الذي يأخذ التركيز عند الفتح. الافتراضي أول عنصر قابل للتركيز.',
  open: 'حالة الفتح، متحكم فيها.',
  onOpenChange: 'يُستدعى بالحالة الجديدة وسبب الإغلاق (escape، scrim، close-button، action).',
  iconStart: 'أيقونة في بداية الزر (تنعكس حسب تسجيلها).',
  iconEnd: 'أيقونة في نهاية الزر.',
  loadingLabel: 'النص المعروض والمعلن أثناء الانشغال، مثل «جارٍ الحفظ…».',
  icon: 'الأيقونة.',
  status: 'نص حالة يُعلن بلطف، مثل عدد النتائج.',
  trailing: 'محتوى في نهاية الحقل (زر فلتر مثلًا).',
  onKeyDown: 'معالج لوحة مفاتيح إضافي، يُستدعى بعد سلوك الحقل.',
  inputProps: 'خصائص HTML إضافية للعنصر input.',
  contentDir: 'اتجاه المحتوى لا الواجهة؛ auto يتبع أول حرف قوي.',
  mono: 'خط ثابت العرض للأكواد والأرقام المرجعية.',
  showValidation: 'إظهار التحقق قبل المغادرة، مثل بعد محاولة الإرسال.',
  checked: 'الحالة في الوضع المتحكم فيه.',
  defaultChecked: 'الحالة الابتدائية في الوضع غير المتحكم فيه.',
  onCheckedChange: 'يُستدعى بالحالة الجديدة عند كل تبديل.',
  idBase: 'يربط التبويبات بلوحاتها؛ اللوحات يرسمها المستهلك بـtabPanelProps(idBase, value).',
  caption: 'عنوان الجدول المقروء (caption).',
  columns: 'الأعمدة: عنوان، خلية، محاذاة، وnowrap.',
  rows: 'الصفوف.',
  rowKey: 'مفتاح ثابت لكل صف.',
  selectedKey: 'الصف المحدد (aria-selected)، أو null.',
  empty: 'ما يظهر حين لا توجد صفوف.',
  maxHeight: 'أقصى ارتفاع قبل التمرير الداخلي مع ترويسة ثابتة.',
  minWidth: 'أقل عرض للجدول؛ أضيق منه يتمرر أفقيًا داخل حاويته.',
  actions: 'إجراءات مرتبطة بالرسالة.',
  live: 'طريقة الإعلان لقارئ الشاشة.',
  body: 'نص إضافي تحت العنوان.',
  duration: 'مدة البقاء بالمللي ثانية؛ null يبقيه حتى الإغلاق.',
  dot: 'نقطة زخرفية في البداية.',
  action: 'طريق واحد للأمام: زر أو رابط.',
}

const RTL = { supported: ['rtl', 'ltr', 'numerals:latn', 'numerals:arab', 'controlled', 'uncontrolled', 'react-19', 'chromium'], unsupported: [] }
const NO_NUM = { numeralsInput: 'none', numeralsDisplay: 'provider', ltrIslands: [], mirroredIcons: [] }

const FILL = {
  'phone-input': {
    whenToUse: ['رقم محمول مصري يُخزَّن ويُتصل به'],
    whenNotToUse: ['أرقام أرضية أو دول أخرى (غير مدعومة في v1)'],
    content: ['short', 'arabic-digits', 'long-arabic'],
    keyboard: [{ key: 'Tab', action: 'يغادر؛ الرقم الصالح يُعرض مجمّعًا بأرقام التفضيل.' }, { key: 'Space', action: 'تتحول المسافة إلى U+00A0 مع بقاء المؤشر في مكانه.' }],
    aria: { role: 'textbox', labelling: 'label[for]', describedBy: ['helper', 'error'], notes: ['type=tel وinputMode=tel', 'aria-invalid عند الخطأ الظاهر فقط'] },
    locale: { numeralsInput: 'all', numeralsDisplay: 'provider', ltrIslands: ['input'], mirroredIcons: [] },
    contracts: ['arabic.phone.eg.v1'],
    invariants: [
      { id: 'same-number-any-numerals', statement: 'نفس الرقم بأرقام لاتينية أو مشرقية يعطي نفس E.164.', tests: ['PH-F01', 'PH-F02'] },
      { id: 'groups-never-reverse', statement: 'العرض ورسائل الخطأ لا تحتوي مسافة عادية بين مجموعات الأرقام.', tests: ['FM-F03', 'FM-F04', 'PROP-07', 'CT-01'] },
      { id: 'lookalike-letters-rejected', statement: 'حرف لاتيني يشبه رقمًا يُرفض برسالة، ولا يُحذف بصمت.', tests: ['PH-F06'] },
      { id: 'uncontrolled-keeps-typing', statement: 'دون value يبقى النص المكتوب ويُبلَّغ عنه عبر onValueChange.', tests: ['CMP-04'] },
    ],
    contexts: { ...RTL, unsupported: ['أرقام أرضية', 'دول غير مصر'] },
  },
  'text-field': {
    whenToUse: ['نص حر قصير: اسم، عنوان، رقم مرجعي'],
    whenNotToUse: ['مبالغ (حقل المبلغ)', 'هواتف (حقل الهاتف)', 'نص طويل متعدد الأسطر'],
    content: ['short', 'long-arabic', 'mixed', 'ltr-island', 'diacritics'],
    keyboard: [{ key: 'Tab', action: 'تنقل عادي؛ لا سلوك خاص.' }],
    aria: { role: 'textbox', labelling: 'label[for]', describedBy: ['helper', 'error'], notes: ['aria-required ما لم يكن optional'] },
    locale: { numeralsInput: 'all', numeralsDisplay: 'none', ltrIslands: [], mirroredIcons: [] },
    invariants: [
      { id: 'empty-is-null', statement: 'مسح النص يبلّغ null لا سلسلة فارغة.', tests: ['CMP-01'] },
      { id: 'placeholder-follows-ui', statement: 'الحقل الفارغ يتبع اتجاه الواجهة حتى لا ينقلب placeholder العربي؛ بعد الكتابة يتبع أول حرف قوي.', tests: ['CMP-02'] },
      { id: 'mixed-name-isolated', statement: 'اسم مختلط مثل «أحمد Khaled» يُعرض بترتيبه المنطقي في الاتجاهين.' },
    ],
    contexts: RTL,
  },
  'search-field': {
    whenToUse: ['تصفية قائمة أو جدول ظاهر بالاسم أو الرقم'],
    whenNotToUse: ['اختيار قيمة واحدة من قائمة (Combobox)'],
    content: ['short', 'mixed', 'diacritics', 'arabic-digits'],
    keyboard: [{ key: 'Escape', when: 'فيه نص', action: 'يمسح البحث ولا يغلق الحوار الأب.' }, { key: 'Escape', when: 'فارغ', action: 'يمر للأب.' }],
    aria: { role: 'searchbox', labelling: 'label[for] (مخفي بصريًا عند hideLabel)', describedBy: ['status'], live: 'polite', notes: ['زر المسح له aria-label من labels.clear'] },
    locale: { numeralsInput: 'all', numeralsDisplay: 'none', ltrIslands: [], mirroredIcons: [] },
    contracts: ['arabic.search.v1'],
    invariants: [
      { id: 'tolerant-matching', statement: 'البحث المتسامح يطابق الهمزات والتشكيل ولا يغيّر الاسم المخزّن.', tests: ['SR-F01', 'SR-F04', 'PROP-05', 'PROP-06'] },
      { id: 'escape-clears-first', statement: 'أول Escape يمسح النص ولا يغلق الحوار الأب.', tests: ['CMP-03'] },
      { id: 'empty-is-null', statement: 'مسح البحث يبلّغ null.', tests: ['CMP-03'] },
    ],
    contexts: RTL,
  },
  button: {
    whenToUse: ['إجراء واحد واضح: حفظ، تحصيل، إرسال'],
    whenNotToUse: ['تنقل لصفحة (رابط)', 'تبديل حالة (Switch)'],
    content: ['short', 'long-arabic'],
    keyboard: [{ key: 'Enter / Space', action: 'ينفّذ الإجراء، إلا أثناء الانشغال.' }],
    aria: { role: 'button', labelling: 'نص الزر', notes: ['أثناء الانشغال: aria-busy ويبقى قابلًا للتركيز ولا ينفّذ', 'disabled حقيقي فقط حين لا معنى للإجراء'] },
    locale: { ...NO_NUM, mirroredIcons: ['iconStart', 'iconEnd'] },
    invariants: [
      { id: 'loading-keeps-focus', statement: 'الانشغال لا يُفقد التركيز ولا يسمح بتنفيذ مزدوج.', tests: ['BR-APP-02'] },
      { id: 'label-is-verb', statement: 'نص الزر فعل أو مصدر يصف النتيجة («تحصيل المبلغ») لا «موافق».' },
    ],
    contexts: { ...RTL, supported: RTL.supported.filter((c) => !c.startsWith('numerals') && c !== 'controlled' && c !== 'uncontrolled') },
  },
  'icon-button': {
    whenToUse: ['إجراء متكرر معروف بأيقونته: إغلاق، مسح، نسخ'],
    whenNotToUse: ['إجراء رئيسي أو غير مألوف (زر بنص)'],
    content: ['short'],
    keyboard: [{ key: 'Enter / Space', action: 'ينفّذ الإجراء.' }],
    aria: { role: 'button', labelling: 'aria-label من label (إلزامي)', notes: ['title يطابق label للماوس'] },
    locale: { ...NO_NUM, mirroredIcons: ['icon'] },
    invariants: [{ id: 'always-named', statement: 'لا يوجد زر أيقونة بلا اسم مقروء؛ label إلزامي في النوع.' }],
    contexts: { supported: ['rtl', 'ltr', 'react-19', 'chromium'], unsupported: [] },
  },
  select: {
    whenToUse: ['اختيار واحد من 4 إلى 15 خيارًا معروفًا'],
    whenNotToUse: ['أقل من 4 خيارات (Segmented Control)', 'قوائم طويلة تحتاج بحثًا (Combobox)'],
    content: ['short', 'long-arabic'],
    keyboard: [{ key: 'Arrow / Type-ahead', action: 'سلوك المتصفح الأصلي لعنصر select.' }],
    aria: { role: 'combobox (select أصلي)', labelling: 'label[for]', describedBy: ['helper'] },
    locale: NO_NUM,
    invariants: [{ id: 'native-semantics', statement: 'select أصلي: لوحة المفاتيح وقارئ الشاشة من المتصفح، والسهم يتبع الاتجاه.' }, { id: 'uncontrolled-works', statement: 'دون value يبدأ بأول خيار أو defaultValue ويتغير بالاختيار.', tests: ['CMP-05'] }],
    contexts: RTL,
    primitive: { source: 'native', relationship: 'adapted', note: 'select أصلي؛ نسخة مخصّصة على React Aria مخطط لها حين نحتاج أيقونات أو مجموعات.' },
  },
  'segmented-control': {
    whenToUse: ['اختيار واحد من 2 إلى 4 خيارات ظاهرة معًا'],
    whenNotToUse: ['أكثر من 4 خيارات (Select)', 'تنقل بين أقسام محتوى (Tabs)'],
    content: ['short', 'arabic-digits', 'long-arabic'],
    keyboard: [{ key: 'ArrowLeft / ArrowRight', action: 'تتبع الاتجاه البصري: في RTL السهم الأيسر للخيار التالي، وتختار فورًا.' }, { key: 'ArrowUp / ArrowDown', action: 'السابق / التالي.' }],
    aria: { role: 'radiogroup', labelling: 'aria-labelledby → label', notes: ['roving tabindex: الخيار المحدد وحده في ترتيب Tab'] },
    locale: NO_NUM,
    invariants: [{ id: 'arrows-follow-visual-direction', statement: 'في RTL السهم الأيسر يحدد الخيار التالي بصريًا، وفي LTR الأيمن.', tests: ['CMP-06'] }, { id: 'skips-disabled', statement: 'الأسهم تتخطى الخيارات المعطلة.', tests: ['CMP-06'] }],
    contexts: RTL,
  },
  switch: {
    whenToUse: ['تفعيل إعداد يسري فورًا'],
    whenNotToUse: ['اختيار يحتاج زر حفظ (Checkbox)'],
    content: ['short', 'long-arabic'],
    keyboard: [{ key: 'Space / Enter', action: 'يبدّل الحالة.' }],
    aria: { role: 'switch', labelling: 'label[for]', describedBy: ['description'], notes: ['aria-checked يعكس الحالة'] },
    locale: NO_NUM,
    invariants: [{ id: 'thumb-follows-direction', statement: 'المقبض في المفعّل يكون في نهاية المسار حسب الاتجاه (يسار في RTL).' }, { id: 'uncontrolled-toggles', statement: 'دون checked يبدّل حالته الداخلية ويبلّغ onCheckedChange.', tests: ['CMP-07'] }],
    contexts: RTL,
  },
  tabs: {
    states: ['default', 'hover', 'focus-visible', 'selected'],
    whenToUse: ['أقسام محتوى متوازية في نفس السياق'],
    whenNotToUse: ['خطوات متسلسلة (Stepper)', 'تبديل قيمة نموذج (Segmented Control)'],
    content: ['short', 'arabic-digits', 'long-arabic'],
    keyboard: [{ key: 'ArrowLeft / ArrowRight', action: 'تنقل حسب الاتجاه البصري مع تفعيل تلقائي.' }, { key: 'Home / End', action: 'أول / آخر تبويب.' }],
    aria: { role: 'tablist / tab / tabpanel', labelling: 'aria-label على tablist', notes: ['aria-controls وaria-labelledby عبر idBase', 'roving tabindex'] },
    locale: NO_NUM,
    invariants: [{ id: 'arrows-follow-visual-direction', statement: 'في RTL السهم الأيسر للتبويب التالي.', tests: ['CMP-08'] }, { id: 'selected-is-data-selected', statement: 'التبويب المحدد يحمل data-selected وaria-selected=true فقط.', tests: ['CMP-08'] }],
    contexts: RTL,
  },
  dialog: {
    whenToUse: ['مهمة قصيرة تحتاج قرارًا قبل المتابعة: إضافة عميل، تأكيد'],
    whenNotToUse: ['محتوى طويل أو تصفح (Drawer أو صفحة)', 'رسالة لا تحتاج قرارًا (Toast)'],
    content: ['short', 'long-arabic'],
    keyboard: [{ key: 'Tab / Shift+Tab', action: 'يبقى التركيز داخل الحوار.' }, { key: 'Escape', action: 'يغلق ما لم يكن dismissible=false، وما لم يستهلكه حقل داخلي.' }],
    aria: { role: 'dialog', labelling: 'aria-labelledby → title', describedBy: ['description'], notes: ['aria-modal=true والخلفية inert', 'زر الإغلاق باسم labels.close'] },
    locale: NO_NUM,
    invariants: [
      { id: 'focus-trapped', statement: 'التركيز يدخل عند الفتح ولا يخرج بالـTab.', tests: ['BR-DLG-01', 'BR-DLG-02'] },
      { id: 'focus-returns', statement: 'الإغلاق يعيد التركيز لمن فتحه.', tests: ['BR-DLG-03'] },
      { id: 'field-escape-wins', statement: 'Escape في حقل فيه مسودة يرجعها ولا يغلق الحوار.' },
    ],
    contexts: { supported: ['rtl', 'ltr', 'controlled', 'react-19', 'chromium'], unsupported: ['حوار داخل حوار'] },
    primitive: { source: 'own', relationship: 'original', note: 'ينتقل إلى React Aria Modal خلف الـadapter (spikes/primitives).' },
  },
  drawer: {
    whenToUse: ['محتوى جانبي أطول: فلاتر، تفاصيل، قائمة تنقل على الهاتف'],
    whenNotToUse: ['قرار قصير (Dialog)'],
    content: ['short', 'long-arabic'],
    keyboard: [{ key: 'Tab / Shift+Tab', action: 'يبقى التركيز داخل اللوحة.' }, { key: 'Escape', action: 'يغلق ما لم يكن dismissible=false.' }],
    aria: { role: 'dialog', labelling: 'aria-labelledby → title', notes: ['يخرج من جهة بداية السطر: اليمين في RTL'] },
    locale: NO_NUM,
    invariants: [{ id: 'opens-from-inline-start', statement: 'اللوحة تخرج من بداية السطر: يمين الشاشة في RTL ويسارها في LTR.' }, { id: 'focus-trapped', statement: 'نفس عقد Dialog للتركيز.' }],
    contexts: { supported: ['rtl', 'ltr', 'controlled', 'react-19', 'chromium'], unsupported: [] },
    primitive: { source: 'own', relationship: 'original', note: 'ينتقل إلى React Aria Modal خلف الـadapter.' },
  },
  'data-table': {
    whenToUse: ['سجلات بأعمدة للمقارنة: عملاء، فواتير، مخزون'],
    whenNotToUse: ['أقل من 3 أعمدة (قائمة)', 'تحرير خلوي (غير مدعوم بعد)'],
    content: ['short', 'long-arabic', 'ltr-island', 'arabic-digits', 'overflow'],
    keyboard: [{ key: 'Tab', action: 'تنقل بين العناصر التفاعلية داخل الخلايا؛ لا تنقل خلوي بالأسهم بعد.' }],
    aria: { role: 'table', labelling: 'aria-label من label + caption', notes: ['الصف المحدد aria-selected', 'الأعمدة الرقمية محاذاة لنهاية الخلية'] },
    locale: { numeralsInput: 'none', numeralsDisplay: 'provider', ltrIslands: ['cell'], mirroredIcons: [] },
    invariants: [{ id: 'scroll-inside', statement: 'أضيق من minWidth يتمرر داخل حاويته ولا يوسّع الصفحة.', tests: ['BR-LAY-01'] }, { id: 'sticky-header', statement: 'مع maxHeight تبقى الترويسة ظاهرة.' }],
    contexts: { supported: ['rtl', 'ltr', 'numerals:latn', 'numerals:arab', 'react-19', 'chromium'], unsupported: ['ترتيب وتصفح وتحرير مدمج', 'أكثر من 1000 صف دون virtualization'] },
  },
  'inline-message': {
    whenToUse: ['حالة مرتبطة بجزء من الصفحة: فشل حفظ، تنبيه قبل إجراء'],
    whenNotToUse: ['تأكيد عابر (Toast)', 'خطأ حقل واحد (رسالة الحقل)'],
    content: ['short', 'long-arabic'],
    keyboard: [],
    aria: { role: 'status / alert حسب live', labelling: 'العنوان والنص', live: 'polite', notes: ['danger مع live=assertive يصبح alert'] },
    locale: { ...NO_NUM, mirroredIcons: [] },
    invariants: [{ id: 'not-color-only', statement: 'كل نبرة لها أيقونة ونص، لا لون فقط.' }],
    contexts: { supported: ['rtl', 'ltr', 'react-19', 'chromium'], unsupported: [] },
  },
  toast: {
    whenToUse: ['تأكيد نتيجة إجراء انتهى: حُفظ، نُسخ'],
    whenNotToUse: ['خطأ يحتاج تصحيحًا (Inline Message)', 'قرار (Dialog)'],
    content: ['short', 'long-arabic'],
    keyboard: [{ key: 'Tab', action: 'زر الإغلاق قابل للوصول؛ التركيز داخل المكدس يوقف المؤقت.' }],
    aria: { role: 'status', labelling: 'العنوان', live: 'polite', notes: ['الاتجاه واللغة من LocaleProvider', 'زر الإغلاق باسم labels.dismiss'] },
    locale: NO_NUM,
    invariants: [
      { id: 'locale-not-hardcoded', statement: 'المكدس يأخذ dir وlang من أقرب LocaleProvider.', tests: ['CMP-09'] },
      { id: 'timing-adjustable', statement: 'المؤقت يتوقف عند المرور أو التركيز، والأخطاء لا تختفي وحدها (WCAG 2.2.1).', tests: ['CMP-10'] },
    ],
    contexts: { supported: ['rtl', 'ltr', 'react-19', 'chromium'], unsupported: ['إجراء داخل الإشعار (تراجع)'] },
  },
  badge: {
    whenToUse: ['حالة قصيرة لسجل: مدفوع، متأخر، جديد'],
    whenNotToUse: ['عدد قابل للنقر (زر)', 'جملة كاملة (Inline Message)'],
    content: ['short', 'arabic-digits', 'long-arabic'],
    keyboard: [],
    aria: { role: 'none (نص)', labelling: 'النص نفسه', notes: ['النقطة زخرفية aria-hidden'] },
    locale: NO_NUM,
    invariants: [{ id: 'not-color-only', statement: 'الحالة مكتوبة نصًا؛ اللون يدعم ولا يحمل المعنى وحده.' }],
    contexts: { supported: ['rtl', 'ltr', 'react-19', 'chromium'], unsupported: [] },
  },
  'empty-state': {
    whenToUse: ['قائمة أو بحث بلا نتائج، أو أول استخدام'],
    whenNotToUse: ['خطأ تحميل (Inline Message مع إعادة المحاولة)'],
    content: ['short', 'long-arabic'],
    keyboard: [],
    aria: { role: 'none (نص)', labelling: 'العنوان', notes: ['الأيقونة زخرفية'] },
    locale: NO_NUM,
    invariants: [{ id: 'one-way-forward', statement: 'يشرح السبب ويقدّم طريقًا واحدًا للأمام على الأكثر.' }],
    contexts: { supported: ['rtl', 'ltr', 'react-19', 'chromium'], unsupported: [] },
  },
}

for (const [id, fill] of Object.entries(FILL)) {
  const file = path.join('spec/components', `${id}.json`)
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'))
  const { primitive, states, ...rest } = fill
  Object.assign(spec, rest)
  if (states) spec.states = states
  if (primitive) spec.primitive = primitive
  for (const p of spec.props) if (p.doc === 'TODO') p.doc = DOC[p.name] ?? p.doc
  // Keep the schema's key order readable: re-insert known keys in a stable order.
  const order = ['$schema', 'id', 'name', 'nameEn', 'family', 'tier', 'maturity', 'purpose', 'whenToUse', 'whenNotToUse', 'anatomy', 'props', 'states', 'variants', 'content', 'keyboard', 'aria', 'tokens', 'locale', 'contracts', 'invariants', 'contexts', 'primitive', 'rules', 'patterns']
  const sorted = Object.fromEntries(order.filter((k) => k in spec).map((k) => [k, spec[k]]))
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n')
  const left = JSON.stringify(sorted).match(/"[^"]*TODO[^"]*"/g)
  console.log(`${left ? 'TODO ' : 'ok   '} ${id}${left ? ' ' + left.join(' ') : ''}`)
}
