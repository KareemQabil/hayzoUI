import { C, N, P } from './_dsl.mjs'

// ── T0 foundations ──────────────────────────────────────────────────────────────────────────────────────────
C('locale-provider', 'Locale provider', 'مزوّد اللغة والاتجاه', 'utility', 'T0', 'p0', {
  s: ['Scope that fixes language, direction, numerals, calendar and region for everything inside it.', 'نطاق يحدد اللغة والاتجاه ونظام الأرقام والتقويم والمنطقة لكل ما بداخله.'],
  e: 'none', a: 'root',
  al: { antd: 'ConfigProvider', mui: 'ThemeProvider', 'mui-x': 'LocalizationProvider', mantine: 'DirectionProvider', chakra: 'LocaleProvider', 'react-aria': 'I18nProvider', 'base-ui': 'DirectionProvider', radix: 'Direction', shadcn: 'direction' },
  an: { 'mui:ThemeProvider': 'direction is a theme key', 'mui-x:LocalizationProvider': 'date adapter and picker strings only' },
  seed: 'config-provider:direction,locale,nesting,numerals,mixed-align,calendar',
  sp: { direction: 'direction|dir', locale: 'locale|localeText' },
  sa: {
    numerals: ['req', 'One provider setting moves every number on the page between Latin and Arabic-Indic digits; none of the surveyed providers has a numerals setting', 'إعداد واحد في المزوّد ينقل كل أرقام الصفحة بين اللاتينية والهندية، ولا يملك أي مزوّد مدروس إعدادًا للأرقام'],
    'mixed-align': ['req', 'Latin names inside an Arabic interface align by the interface or by their content, as a regional preference', 'الأسماء اللاتينية داخل واجهة عربية تُحاذى بحسب الواجهة أو بحسب محتواها، كتفضيل يخص المنطقة'],
    calendar: N.calendar,
  },
  f: [
    ['region', 'Region (country) as its own dimension: currency, week start, weekend', 'المنطقة (الدولة) كبُعد مستقل: العملة وبداية الأسبوع والعطلة', 'p0', '', '', ['req', 'ar-EG and ar-SA share a language but differ in currency, weekend and default calendar; region is never inferred from the language tag alone', 'ar-EG و ar-SA لغة واحدة لكن العملة والعطلة والتقويم الافتراضي تختلف، فلا تُستنتج المنطقة من وسم اللغة وحده']],
    ['portal-inherit', 'Overlays rendered in a portal keep the scope of their trigger', 'العناصر المرسومة في بوابة تحتفظ بنطاق العنصر الذي فتحها', 'p0', '', '', ['risk', 'A portal attached to body loses dir and numerals unless the scope is carried explicitly', 'البوابة الملحقة بـbody تفقد الاتجاه ونظام الأرقام ما لم يُنقل النطاق صراحة']],
    ['strings', 'Built-in strings catalogue per language', 'فهرس النصوص الداخلية لكل لغة', 'p0', 'antd:locale|localeText|labels', '', N.strings],
  ],
  dec: [['merge', 'The owner\'s T0 lists LocaleProvider and Direction separately; they are one entry because no surveyed library gains anything from a direction scope without a language.'], ['split', 'AntD ConfigProvider is split: direction/locale rows are here, theme/size/token rows are in theme-provider.']],
})

C('theme-provider', 'Theme provider', 'مزوّد السمة', 'utility', 'T0', 'p0', {
  s: ['Scope that resolves tokens, colour scheme and density to CSS variables.', 'نطاق يحوّل الرموز ونظام الألوان والكثافة إلى متغيرات CSS.'],
  e: 'none', a: 'root',
  al: { antd: 'ConfigProvider', mui: 'ThemeProvider', mantine: 'MantineProvider', chakra: 'ChakraProvider Theme' },
  seed: 'config-provider:theme,algorithm,component-size,component-tokens,css-var,prefix',
  sp: { theme: 'theme', 'component-size': 'componentSize', prefix: 'prefixCls|getPopupContainer|classNamesPrefix|cssVariablesSelector' },
  f: [
    ['color-scheme', 'Light / dark / system colour scheme', 'نظام الألوان: فاتح، داكن، بحسب النظام', 'p0', 'defaultColorScheme|forceColorScheme|defaultMode|colorSchemeManager|appearance', ''],
    ['density', 'Density as a scope setting, never a prop', 'الكثافة كإعداد للنطاق لا كخاصية', 'p1', '', '', ['req', 'Compact density still has to clear Arabic diacritics: row heights come from measured line heights of the Arabic face', 'الكثافة المضغوطة يجب أن تتسع للتشكيل العربي، فارتفاع الصفوف يُؤخذ من ارتفاع السطر المقيس للخط العربي']],
    ['font-per-script', 'Font family per script', 'خط لكل نظام كتابة', 'p1', '', '', ['req', 'Arabic and Latin faces are set separately, so mixed text keeps matched weight and x-height', 'يُحدَّد الخط العربي واللاتيني كلٌّ على حدة ليبقى الوزن والارتفاع متناسقين في النص المختلط']],
  ],
})

C('portal', 'Portal', 'بوابة', 'utility', 'T0', 'p0', {
  s: ['Renders children into another DOM container while keeping the React and locale scope.', 'يرسم العناصر في حاوية DOM أخرى مع الاحتفاظ بنطاق React ونطاق اللغة.'],
  e: 'overlay-layers', a: 'root',
  al: { mui: 'Portal', mantine: 'Portal OptionalPortal', chakra: 'Portal', radix: 'Portal', 'headless-ui': 'Portal' },
  f: [
    ['container', 'Custom container', 'حاوية مخصصة', 'p0', 'container|target|root', ''],
    ['disable', 'Render in place (no portal)', 'الرسم في المكان بلا بوابة', 'p1', 'disablePortal|withinPortal|disabled', ''],
    ['scope', 'Carries dir, lang and numerals to the container', 'ينقل الاتجاه واللغة ونظام الأرقام إلى الحاوية', 'p0', '', '', ['req', 'The portal root repeats dir and lang, otherwise an overlay opened from an Arabic region of an English page renders LTR', 'جذر البوابة يكرر الاتجاه واللغة، وإلا ظهرت النافذة المفتوحة من جزء عربي في صفحة إنجليزية باتجاه LTR']],
  ],
})

C('focus-scope', 'Focus scope', 'نطاق التركيز', 'utility', 'T0', 'p0', {
  s: ['Contains, restores and auto-focuses keyboard focus inside a region.', 'يحبس تركيز لوحة المفاتيح داخل منطقة ويعيده ويضبطه تلقائيًا.'],
  e: 'focus-scope', a: 'root',
  al: { mui: 'Unstable_TrapFocus', mantine: 'FocusTrap', chakra: 'FocusTrap', 'headless-ui': 'FocusTrap' },
  f: [
    ['contain', 'Trap Tab inside', 'حبس مفتاح Tab في الداخل', 'p0', 'active|open|disabled|features', ''],
    ['restore', 'Restore focus on exit', 'إعادة التركيز عند الخروج', 'p0', 'disableRestoreFocus|returnFocusOnDeactivate|restoreFocus', ''],
    ['initial', 'Initial focus target', 'هدف التركيز الأول', 'p1', 'initialFocus|disableAutoFocus', ''],
  ],
  n: 'react-aria publishes FocusScope in the react-aria package, not in react-aria-components, so it is not listed as an alias of this survey.',
})

C('visually-hidden', 'Visually hidden', 'مخفي بصريًا', 'utility', 'T0', 'p0', {
  s: ['Content read by assistive technology but not drawn.', 'محتوى تقرؤه التقنيات المساعدة ولا يُرسم.'],
  e: 'none', a: 'root',
  al: { mantine: 'VisuallyHidden', chakra: 'VisuallyHidden', 'react-aria': 'VisuallyHidden', radix: 'VisuallyHidden AccessibleIcon' },
  f: [['basic', 'Hidden text for screen readers', 'نص مخفي لقارئات الشاشة', 'p0', '', 'mantine chakra react-aria radix', ['risk', 'Clipping with a physical left offset makes an RTL page scroll sideways; the hiding rule must not move the element', 'الإخفاء بإزاحة يسارية فيزيائية يجعل صفحة RTL تتمرر جانبيًا، فيجب ألا تحرّك قاعدةُ الإخفاء العنصر']]],
})

C('ltr-island', 'LTR island', 'جزيرة من اليسار لليمين', 'utility', 'T0', 'p0', {
  s: ['Isolates a left-to-right value (code, IBAN, phone, URL, email) inside right-to-left text.', 'يعزل قيمة تُكتب من اليسار إلى اليمين (رمز، آيبان، هاتف، رابط، بريد) داخل نص عربي.'],
  e: 'none', a: 'root',
  f: [
    ['isolate', 'Bidi isolation with explicit ltr direction', 'عزل اتجاهي مع اتجاه ltr صريح', 'p0', '', '', ['req', 'Uses dir and unicode-bidi isolation in markup, never bidi control characters in the data', 'يستخدم dir والعزل في الوسوم، ولا يضع محارف تحكم اتجاهية داخل البيانات']],
    ['align', 'Alignment follows the surrounding interface, not the island', 'المحاذاة تتبع الواجهة المحيطة لا الجزيرة', 'p0', '', '', ['req', 'An LTR code in an Arabic table cell still starts at the right edge of the cell', 'الرمز اللاتيني في خلية جدول عربي يبقى مبتدئًا من الحافة اليمنى للخلية']],
    ['grouping', 'Digit groups joined with no-break spaces', 'مجموعات الأرقام تُربط بمسافات غير فاصلة', 'p1', '', '', ['risk', 'An ASCII space between Arabic-Indic digit groups lets the bidi algorithm reverse the group order', 'المسافة العادية بين مجموعات الأرقام الهندية تجعل خوارزمية الاتجاه تعكس ترتيب المجموعات']],
    ['copy', 'Copies the stored value without added characters', 'ينسخ القيمة المخزنة بلا محارف مضافة', 'p1', '', ''],
  ],
  dec: [['scope', 'Ours alone: every surveyed library leaves bidi isolation to the application.']],
})

C('auto-direction-text', 'Auto-direction text', 'نص تلقائي الاتجاه', 'display', 'T0', 'p0', {
  s: ['Free text of unknown script that takes its direction from its content and isolates foreign runs.', 'نص حر مجهول اللغة يأخذ اتجاهه من محتواه ويعزل المقاطع المكتوبة بخط آخر.'],
  e: 'none', a: 'root run',
  seed: 'typography:auto-dir',
  sa: { 'auto-dir': ['req', 'A Latin title before an Arabic name keeps its full stop in place inside an RTL interface', 'اللقب اللاتيني قبل اسم عربي يحتفظ بنقطته في مكانها داخل واجهة RTL'] },
  f: [
    ['dominant', 'Line direction from the dominant script, counted by words', 'اتجاه السطر من الخط الغالب محسوبًا بالكلمات', 'p0', '', '', ['req', 'Words are counted, not letters: Arabic spells names in fewer letters, so a letter count turns an Arabic-first name LTR', 'تُعدّ الكلمات لا الحروف، فالعربية تكتب الأسماء بحروف أقل وعدّ الحروف يقلب الاسم العربي إلى LTR']],
    ['islands', 'Foreign runs wrapped as isolated islands', 'المقاطع الأجنبية تُغلَّف كجزر معزولة', 'p0', '', '', N.mixed],
    ['align-pref', 'Alignment by interface or by content', 'المحاذاة بحسب الواجهة أو بحسب المحتوى', 'p1', '', '', ['req', 'Alignment of a Latin line in an Arabic list is a regional preference set on the locale scope', 'محاذاة السطر اللاتيني في قائمة عربية تفضيل إقليمي يُضبط في نطاق اللغة']],
    ['highlight', 'Works with a highlighted match inside', 'يعمل مع تمييز نتيجة البحث بداخله', 'p1', '', ''],
    ['streaming', 'Stable while text streams in', 'ثابت أثناء وصول النص تدريجيًا', 'p2', '', '', ['risk', 'Direction can flip while a message streams; it should settle on the first strong word and not jump afterwards', 'قد ينقلب الاتجاه أثناء وصول الرسالة، فيجب أن يستقر عند أول كلمة قوية ولا يقفز بعدها']],
  ],
  dec: [['naming', 'Called AutoText in the owner\'s earlier code; the id says what it does for a reader who has not seen that code.']],
})

C('icon', 'Icon', 'أيقونة', 'display', 'T0', 'p0', {
  s: ['An icon from the set, with a mirroring rule per icon.', 'أيقونة من المجموعة مع قاعدة انعكاس لكل أيقونة.'],
  e: 'none', a: 'root',
  al: { mui: 'Icon SvgIcon', mantine: 'ThemeIcon', chakra: 'Icon' },
  an: { 'mantine:ThemeIcon': 'themed container for an icon' },
  seed: 'icon', drop: 'iconfont', notAntd: 'set custom spin a11y',
  sa: { mirroring: N.mirrorIcon },
  sp: { a11y: 'titleAccess|aria-label|label' },
  f: [['size-token', 'Size from the type scale', 'الحجم من سلّم الخطوط', 'p1', 'fontSize|size|boxSize', '']],
  dec: [['scope', 'antd 6 exports no Icon component (icons live in @ant-design/icons), so there is no AntD alias and the matrix rows are kept without an `in`.'], ['scope', 'The iconfont row is dropped: icon fonts are out of scope.']],
})

C('text', 'Text', 'نص', 'display', 'T0', 'p0', {
  s: ['Body text with size, weight, tone, truncation and numerals awareness.', 'نص أساسي بالحجم والوزن والنبرة والاقتطاع مع مراعاة نظام الأرقام.'],
  e: 'none', a: 'root',
  al: { antd: 'Typography Typography.Text Typography.Paragraph', mui: 'Typography', mantine: 'Text', chakra: 'Text Span Em Strong', 'react-aria': 'Text' },
  seed: 'typography:text-types,copyable,editable,ellipsis,mark-code-kbd,numerals',
  sp: { 'text-types': 'type|color|c', copyable: 'copyable', editable: 'editable', ellipsis: 'ellipsis|noWrap|truncate|lineClamp' },
  sa: { numerals: ['req', 'Numbers inside copy follow the numerals preference, while identifiers stay Latin and literals stay verbatim', 'الأرقام داخل النص تتبع تفضيل نظام الأرقام، مع بقاء المعرّفات لاتينية والقيم الحرفية كما كُتبت'] },
  f: [
    ['line-clamp', 'Clamp to N lines', 'الاقتصار على عدد من الأسطر', 'p1', 'lineClamp|rows', '', N.truncate],
    ['no-letter-spacing', 'No letter-spacing on Arabic', 'لا تباعد حروف في العربية', 'p0', '', '', N.tashkeel],
  ],
  dec: [['split', 'AntD Typography is three things; Title went to heading, Link to link, the rest stays here.']],
})

C('heading', 'Heading', 'عنوان', 'display', 'T0', 'p0', {
  s: ['Section heading with a semantic level separate from its visual size.', 'عنوان قسم بمستوى دلالي منفصل عن حجمه البصري.'],
  e: 'none', a: 'root',
  al: { antd: 'Typography.Title', mui: 'Typography', mantine: 'Title', chakra: 'Heading', 'react-aria': 'Heading' },
  seed: 'typography:title', sp: { title: 'level|order|variant|as' },
  f: [['size', 'Visual size independent of level', 'حجم بصري مستقل عن المستوى', 'p1', 'size|variant', '', N.tashkeel]],
})

C('transition', 'Transition', 'انتقال حركي', 'utility', 'T0', 'p1', {
  s: ['Mounts and unmounts content with enter and exit states.', 'يُظهر المحتوى ويزيله بحالتي دخول وخروج.'],
  e: 'none', a: 'root',
  al: { mui: 'Fade Grow Slide Zoom Collapse', mantine: 'Transition', chakra: 'Presence', 'headless-ui': 'Transition' },
  f: [
    ['presence', 'Keeps the element mounted until the exit ends', 'يُبقي العنصر حتى نهاية حركة الخروج', 'p1', 'unmountOnExit|keepMounted|present|unmount|mounted', ''],
    ['slide-direction', 'Slide direction', 'اتجاه الانزلاق', 'p1', 'direction|transition', '', ['risk', 'Slide-from-start animations must reverse in RTL or a drawer enters from the wrong edge', 'حركات الانزلاق من البداية يجب أن تنعكس في RTL وإلا دخل الدرج من الحافة الخاطئة']],
    ['reduced-motion', 'Honours reduced motion', 'يحترم تقليل الحركة', 'p0', 'reduceMotion|respectReducedMotion', ''],
  ],
  n: 'Wanted engine: presence.',
})

// ── layout ──────────────────────────────────────────────────────────────────────────────────────────────────
C('box', 'Box', 'صندوق', 'layout', 'T0', 'p1', {
  s: ['The base element that accepts style props resolved to tokens.', 'العنصر الأساسي الذي يقبل خصائص تنسيق تُحوَّل إلى رموز.'],
  e: 'none', a: 'root',
  al: { mui: 'Box Paper', mantine: 'Box Paper', chakra: 'Box Square Circle' },
  f: [
    ['logical-props', 'Logical spacing props (inline start / end)', 'خصائص مسافات منطقية (بداية ونهاية السطر)', 'p0', 'ms|me|ps|pe|marginInlineStart|paddingInlineStart', '', N.logical],
    ['polymorphic', 'Renders as another element', 'يُرسم كعنصر آخر', 'p1', 'component|as|asChild|renderRoot', ''],
  ],
})

C('stack', 'Stack', 'رصّة', 'layout', 'T0', 'p1', {
  s: ['Children in one direction with a gap from the spacing scale.', 'عناصر في اتجاه واحد بمسافة من سلّم المسافات.'],
  e: 'none', a: 'root',
  al: { antd: 'Space', mui: 'Stack', mantine: 'Stack Group Space', chakra: 'Stack HStack VStack Spacer Group' },
  seed: 'space', drop: 'compact',
  sp: { size: 'size|gap|spacing', direction: 'direction|orientation', split: 'split|separator|divider' },
  f: [['row-order', 'Row order follows direction', 'ترتيب الصف يتبع الاتجاه', 'p0', '', '', N.logical]],
  dec: [['merge', 'Space, Stack, Group, HStack and VStack are one component with a direction.'], ['split', 'Space.Compact is carried by button-group and input-group.']],
})

C('flex', 'Flex', 'تخطيط مرن', 'layout', 'T0', 'p2', {
  s: ['Flexbox container with alignment, wrap and gap props.', 'حاوية Flexbox بخصائص المحاذاة والالتفاف والمسافة.'],
  e: 'none', a: 'root',
  al: { antd: 'Flex', mantine: 'Flex Center', chakra: 'Flex Center Wrap AbsoluteCenter' },
  seed: 'flex', sp: { direction: 'vertical|direction', 'align-justify': 'align|justify', gap: 'gap', wrap: 'wrap' },
})

C('grid', 'Grid', 'شبكة', 'layout', 'T0', 'p1', {
  s: ['Column grid with responsive spans.', 'شبكة أعمدة بامتدادات متجاوبة.'],
  e: 'none', a: 'root item',
  al: { antd: 'Grid Row Col Masonry', mui: 'Grid ImageList', mantine: 'Grid SimpleGrid', chakra: 'Grid SimpleGrid' },
  an: { 'antd:Masonry': 'masonry variant', 'mui:ImageList': 'image grid variant' },
  seed: 'grid', sp: { gutter: 'gutter|spacing|gap', responsive: 'xs|span|columns|cols', 'offset-order': 'offset|order|push' },
  f: [['column-order', 'Column order follows direction', 'ترتيب الأعمدة يتبع الاتجاه', 'p0', '', '', ['risk', 'Offsets and push/pull are physical in older grids; they must be inline-start based', 'الإزاحات في الشبكات القديمة فيزيائية، ويجب أن تُحسب من بداية السطر']]],
})

C('container', 'Container', 'حاوية', 'layout', 'T0', 'p2', {
  s: ['Centres content with a maximum width.', 'يوسّط المحتوى بعرض أقصى.'],
  e: 'none', a: 'root',
  al: { mui: 'Container', mantine: 'Container', chakra: 'Container' },
  f: [['max-width', 'Max width by breakpoint', 'عرض أقصى بحسب نقطة التوقف', 'p2', 'maxWidth|size|fluid', '']],
})

C('separator', 'Separator', 'فاصل', 'layout', 'T0', 'p1', {
  s: ['A line between groups, horizontal or vertical, with an optional label.', 'خط بين المجموعات، أفقي أو رأسي، مع عنوان اختياري.'],
  e: 'none', a: 'root label',
  al: { antd: 'Divider', mui: 'Divider', mantine: 'Divider', chakra: 'Separator', 'react-aria': 'Separator', 'base-ui': 'Separator', radix: 'Separator', shadcn: 'separator' },
  seed: 'divider',
  sp: { vertical: 'orientation|type|vertical', 'with-text': 'label|titlePlacement|textAlign|labelPosition|children', dashed: 'dashed|variant' },
  f: [['decorative', 'Decorative or semantic role', 'دور زخرفي أو دلالي', 'p1', 'decorative|role', '']],
  dec: [['naming', 'separator (five libraries and ARIA) over divider (three).']],
})

C('aspect-ratio', 'Aspect ratio', 'نسبة الأبعاد', 'layout', 'T0', 'p2', {
  s: ['Keeps a box at a fixed width-to-height ratio.', 'يحافظ على نسبة ثابتة بين العرض والارتفاع.'],
  e: 'none', a: 'root',
  al: { mantine: 'AspectRatio', chakra: 'AspectRatio', radix: 'AspectRatio', shadcn: 'aspect-ratio' },
  f: [['ratio', 'Ratio', 'النسبة', 'p2', 'ratio', '']],
})

C('scroll-area', 'Scroll area', 'منطقة تمرير', 'layout', 'T1', 'p1', {
  s: ['A scroll container with styled scrollbars and edge shadows.', 'حاوية تمرير بأشرطة منسّقة وظلال عند الحواف.'],
  e: 'none', a: 'root viewport scrollbar thumb corner',
  al: { mantine: 'ScrollArea NativeScrollArea Scroller', chakra: 'ScrollArea', 'base-ui': 'ScrollArea', radix: 'ScrollArea', shadcn: 'scroll-area' },
  f: [
    ['both-axes', 'Vertical and horizontal scrollbars', 'أشرطة تمرير رأسية وأفقية', 'p1', 'orientation|scrollbars|type', ''],
    ['visibility', 'Show on hover, scroll or always', 'الظهور عند المرور أو التمرير أو دائمًا', 'p2', 'type|scrollHideDelay|offsetScrollbars', ''],
    ['rtl-scroll', 'Horizontal scroll origin in RTL', 'أصل التمرير الأفقي في RTL', 'p0', 'dir', '', ['risk', 'scrollLeft is zero at the right edge and negative leftward in RTL; thumb position and edge shadows computed the LTR way are wrong', 'قيمة scrollLeft في RTL صفر عند الحافة اليمنى وسالبة يسارًا، فموضع المقبض وظلال الحواف المحسوبة بطريقة LTR خاطئة']],
    ['scrollbar-side', 'Vertical scrollbar on the inline end', 'شريط التمرير الرأسي عند نهاية السطر', 'p1', '', '', N.logical],
  ],
  n: 'Wanted engine: scroll-area (thumb geometry and RTL scroll normalisation).',
})

C('splitter', 'Splitter', 'ألواح قابلة للتقسيم', 'layout', 'T3', 'p2', {
  s: ['Panels separated by handles that resize them.', 'ألواح تفصل بينها مقابض لتغيير أحجامها.'],
  e: 'resize', a: 'root panel handle',
  al: { antd: 'Splitter', mantine: 'Splitter', chakra: 'Splitter', shadcn: 'resizable' },
  seed: 'splitter',
  sp: { collapsible: 'collapsible|collapsed', vertical: 'orientation|layout|vertical', 'min-max': 'min|max|minSize|maxSize' },
  f: [['keyboard', 'Resize with arrow keys', 'تغيير الحجم بمفاتيح الأسهم', 'p1', 'keyboardResizeBy|step', '', N.arrows]],
})

C('affix', 'Affix', 'تثبيت عند التمرير', 'layout', 'T3', 'p2', {
  s: ['Pins content to the viewport edge once it scrolls past.', 'يثبّت المحتوى عند حافة الشاشة بعد تجاوزه بالتمرير.'],
  e: 'scroll-spy', a: 'root',
  al: { antd: 'Affix', mantine: 'Affix', chakra: 'Sticky Float' },
  an: { 'chakra:Float': 'anchors to a corner of a parent' },
  seed: 'affix', sp: { 'top-bottom': 'offsetTop|offsetBottom|position|top', target: 'target|withinPortal', 'on-change': 'onChange' },
  f: [['corner', 'Corner position uses start / end', 'موضع الزاوية بالبداية والنهاية', 'p1', '', '', N.placement]],
})

C('app-shell', 'App shell', 'هيكل التطبيق', 'layout', 'T3', 'p1', {
  s: ['Page frame: header, side navigation, content and footer, with responsive collapse.', 'إطار الصفحة: رأس وتنقل جانبي ومحتوى وتذييل، مع طيّ متجاوب.'],
  e: 'disclosure resize', a: 'root header navbar aside main footer',
  d: 'sidebar',
  al: { antd: 'Layout', 'antd-pro': 'ProLayout PageContainer PageHeader ProPageHeader TopNavHeader DefaultFooter SettingDrawer', mui: 'AppBar Toolbar', mantine: 'AppShell' },
  seed: 'layout',
  sp: { sider: 'Sider|navbar|Navbar', collapsible: 'collapsible|collapsed|breakpoint' },
  sa: { 'rtl-sider': ['risk', 'The side navigation sits on the inline start and its collapse arrow mirrors; a mirrored side menu also flips breadcrumbs', 'التنقل الجانبي يقع عند بداية السطر وسهم الطي ينعكس، وانعكاس القائمة الجانبية يقلب مسار التنقل أيضًا'] },
  f: [
    ['sticky-header', 'Fixed header with content offset', 'رأس ثابت مع إزاحة المحتوى', 'p1', 'fixed|position|withBorder|fixedHeader', ''],
    ['page-header', 'Page header with title, breadcrumb and actions', 'رأس صفحة بعنوان ومسار وإجراءات', 'p2', 'breadcrumb|extra|title', ''],
  ],
})

C('sidebar', 'Sidebar', 'شريط جانبي', 'navigation', 'T3', 'p1', {
  s: ['Collapsible side navigation with groups, nested items and an icon-only rail.', 'تنقل جانبي قابل للطي بمجموعات وعناصر متداخلة وشريط أيقونات.'],
  e: 'disclosure roving-focus', a: 'root header content group item trigger rail footer',
  d: 'navigation-menu tooltip',
  al: { antd: 'Layout.Sider', mantine: 'NavLink Burger', 'react-aria': 'NavigationTree', shadcn: 'sidebar' },
  an: { 'mantine:Burger': 'the toggle button only', 'mantine:NavLink': 'the item only' },
  f: [
    ['collapse', 'Collapse to icons or off-canvas', 'الطي إلى أيقونات أو خارج الشاشة', 'p1', 'collapsed|collapsible|collapsedWidth', ''],
    ['side', 'Side follows direction', 'الجهة تتبع الاتجاه', 'p0', 'side|reverseArrow', '', N.placement],
    ['mobile', 'Becomes a drawer on small screens', 'يتحول إلى درج في الشاشات الصغيرة', 'p1', 'breakpoint|isMobile|openMobile', ''],
    ['shortcut', 'Keyboard shortcut to toggle', 'اختصار لوحة مفاتيح للتبديل', 'p2', '', 'shadcn'],
  ],
})

C('skip-link', 'Skip link', 'رابط التخطي', 'navigation', 'T1', 'p1', {
  s: ['First focusable link that jumps past navigation to the main content.', 'أول رابط قابل للتركيز يتجاوز التنقل إلى المحتوى الرئيسي.'],
  e: 'none', a: 'link target',
  al: { chakra: 'SkipNavLink SkipNavContent' },
  f: [['basic', 'Visible on focus only', 'يظهر عند التركيز فقط', 'p1', '', 'chakra', N.strings]],
})
