import { C, N, P } from './_dsl.mjs'

// ── disclosure ──────────────────────────────────────────────────────────────────────────────────────────────
C('collapsible', 'Collapsible', 'قسم قابل للطي', 'display', 'T2', 'p1', {
  s: ['One region that a trigger shows and hides.', 'منطقة واحدة يُظهرها زر ويخفيها.'],
  e: 'disclosure', a: 'root trigger indicator content',
  al: { mui: 'Collapse', mantine: 'Collapse Spoiler', chakra: 'Collapsible', 'react-aria': 'Disclosure', 'base-ui': 'Collapsible', radix: 'Collapsible', 'headless-ui': 'Disclosure', shadcn: 'collapsible' },
  an: { 'mantine:Spoiler': 'show more / less by height' },
  f: [
    ['controlled', 'Controlled and uncontrolled open', 'فتح متحكَّم به أو لا', 'p1', 'open|in|expanded|isExpanded|defaultOpen', ''],
    ['height-animation', 'Animates to content height', 'حركة بحسب ارتفاع المحتوى', 'p2', 'collapsedSize|transitionDuration|keepMounted|hiddenUntilFound', ''],
    ['chevron', 'Chevron mirrors with direction', 'السهم ينعكس مع الاتجاه', 'p1', '', '', N.mirrorIcon],
  ],
  dec: [['naming', 'collapsible (Radix, Base UI, Chakra, shadcn) over disclosure (React Aria, Headless UI).']],
})

C('accordion', 'Accordion', 'أكورديون', 'display', 'T2', 'p1', {
  s: ['A stack of collapsible sections where one or several are open.', 'مجموعة أقسام قابلة للطي يُفتح واحد منها أو أكثر.'],
  e: 'disclosure roving-focus', a: 'root item header trigger indicator panel', d: 'collapsible',
  al: { antd: 'Collapse', mui: 'Accordion', mantine: 'Accordion', chakra: 'Accordion', 'react-aria': 'DisclosureGroup', 'base-ui': 'Accordion', radix: 'Accordion', shadcn: 'accordion' },
  seed: 'collapse',
  sp: { accordion: 'accordion|type|multiple|allowsMultipleExpanded', 'borderless-ghost': 'bordered|ghost|variant', extra: 'extra|expandIcon|chevron', collapsible: 'collapsible|disabled' },
  f: [
    ['icon-side', 'Chevron side is logical', 'جهة السهم منطقية', 'p1', 'expandIconPlacement|expandIconPosition|chevronPosition', '', N.logical],
    ['heading-level', 'Heading level of triggers', 'مستوى عنوان الأزرار', 'p1', 'order|level|headingLevel', ''],
  ],
})

// ── display ─────────────────────────────────────────────────────────────────────────────────────────────────
C('card', 'Card', 'بطاقة', 'display', 'T2', 'p1', {
  s: ['A surface that groups related content and actions.', 'سطح يجمع محتوى وإجراءات مترابطة.'],
  e: 'none', a: 'root header title description media body footer actions',
  al: { antd: 'Card', 'antd-pro': 'ProCard CheckCard', mui: 'Card', mantine: 'Card', chakra: 'Card', shadcn: 'card' },
  seed: 'card', sp: { cover: 'cover|CardMedia|Section', actions: 'actions|CardActions', loading: 'loading', meta: 'Meta', tabs: 'tabList', grid: 'Grid', basic: 'title|extra' },
  f: [['clickable', 'Whole card as one link target', 'البطاقة كلها هدف رابط واحد', 'p2', 'hoverable|CardActionArea|LinkOverlay', '']],
})

C('stat', 'Stat', 'مؤشر رقمي', 'display', 'T3', 'p1', {
  s: ['A labelled figure with unit, change and trend.', 'رقم معنون مع وحدته وتغيّره واتجاهه.'],
  e: 'none', a: 'root label value unit help trend', d: 'number-text',
  al: { antd: 'Statistic', 'antd-pro': 'Statistic', chakra: 'Stat', mantine: 'RollingNumber' },
  an: { 'mantine:RollingNumber': 'animated digits only' },
  seed: 'statistic', sp: { precision: 'precision|formatter|formatOptions', 'prefix-suffix': 'prefix|suffix', countdown: 'Countdown|Timer' },
  sa: { numerals: ['req', 'The value is shown in the numerals of the scope', 'القيمة تُعرض بنظام أرقام النطاق'] },
  f: [
    ['trend', 'Up / down indicator', 'مؤشر صعود وهبوط', 'p1', 'UpIndicator|DownIndicator|trend', '', ['risk', 'Up and down arrows do not mirror; a signed percentage keeps its sign on the side the locale puts it', 'سهما الصعود والهبوط لا ينعكسان، والنسبة ذات الإشارة تُبقي إشارتها في الجهة التي تحددها اللغة']],
    ['compact', 'Compact notation (thousand, million)', 'صيغة مختصرة (ألف، مليون)', 'p1', '', '', ['req', 'Arabic compact forms are words with plural agreement ("٣ آلاف", "١٢ ألفًا", "مليونان"), taken from locale data', 'الصيغ المختصرة العربية كلمات تتوافق مع العدد («٣ آلاف»، «١٢ ألفًا»، «مليونان») وتؤخذ من بيانات اللغة']],
  ],
})

C('description-list', 'Description list', 'قائمة أوصاف', 'display', 'T3', 'p1', {
  s: ['Label and value pairs describing one record.', 'أزواج عنوان وقيمة تصف سجلًا واحدًا.'],
  e: 'none', a: 'root item label value',
  al: { antd: 'Descriptions', 'antd-pro': 'ProDescriptions', mantine: 'DataList', chakra: 'DataList' },
  seed: 'descriptions', sp: { bordered: 'bordered|variant', columns: 'column', vertical: 'layout|orientation', span: 'span', sizes: 'size' },
  f: [
    ['value-direction', 'Each value keeps its own direction', 'كل قيمة تحتفظ باتجاهها', 'p0', '', '', N.mixed],
    ['typed-values', 'Typed values (money, date, phone, id)', 'قيم ذات أنواع (مبلغ، تاريخ، هاتف، معرّف)', 'p1', 'valueType|valueEnum', '', ['req', 'Money, dates and phones go through the same formatters as inputs, so a record reads the same in a form and in its summary', 'المبالغ والتواريخ والهواتف تمر بالمنسّقات نفسها المستخدمة في الإدخال، فيُقرأ السجل بالصورة نفسها في النموذج والملخص']],
  ],
  dec: [['naming', 'description-list (HTML dl) over Descriptions (AntD) and DataList (Chakra, Mantine).']],
})

C('list', 'List', 'قائمة', 'display', 'T1', 'p2', {
  s: ['Bulleted or numbered text list.', 'قائمة نصية نقطية أو مرقّمة.'],
  e: 'none', a: 'root item marker',
  al: { mantine: 'List', chakra: 'List' },
  f: [
    ['markers', 'Marker style by locale', 'نمط الترقيم بحسب اللغة', 'p1', 'type|listStyleType|variant', '', ['req', 'Ordered lists can number with Arabic-Indic digits or the abjad letters (أ، ب، ج) through CSS counter styles', 'القوائم المرتبة ترقَّم بالأرقام الهندية أو بحروف أبجد (أ، ب، ج) عبر أنماط العدّاد في CSS']],
    ['icon', 'Icon as marker', 'أيقونة كعلامة', 'p2', 'icon|ListIndicator|Indicator', ''],
    ['indent', 'Indent from the inline start', 'المسافة البادئة من بداية السطر', 'p1', '', '', N.logical],
  ],
})

C('list-view', 'List view', 'عرض قائمة', 'data', 'T3', 'p1', {
  s: ['A list of records with media, text, actions, selection and paging.', 'قائمة سجلات بصور ونصوص وإجراءات وتحديد وترقيم صفحات.'],
  e: 'collection selection grid-navigation virtual-list', a: 'root item media title description actions empty footer',
  al: { antd: 'List Listy', 'antd-pro': 'ProList', mui: 'List', 'react-aria': 'GridList', shadcn: 'item' },
  seed: 'list', sp: { pagination: 'pagination', 'load-more': 'loadMore|GridListLoadMoreItem|onLoadMore', grid: 'grid|layout', actions: 'actions|secondaryAction', virtual: 'virtual' },
  f: [
    ['selection', 'Row selection and keyboard navigation', 'تحديد الصفوف والتنقل بلوحة المفاتيح', 'p1', 'selectionMode|rowSelection|selected', '', N.arrows],
    ['drag-sort', 'Reorder by dragging', 'إعادة الترتيب بالسحب', 'p2', 'dragAndDropHooks|draggable', ''],
    ['swipe-actions', 'Swipe actions follow direction', 'إجراءات السحب تتبع الاتجاه', 'p2', '', '', ['risk', 'Leading and trailing swipe actions swap sides in RTL', 'إجراءات السحب الأمامية والخلفية تتبادل الجهتين في RTL']],
  ],
})

C('timeline', 'Timeline', 'خط زمني', 'display', 'T3', 'p2', {
  s: ['Events in order along a line.', 'أحداث مرتبة على خط.'],
  e: 'none', a: 'root item connector indicator title content',
  al: { antd: 'Timeline', mantine: 'Timeline', chakra: 'Timeline' },
  seed: 'timeline', sp: { color: 'color|dot|bullet', mode: 'mode|align', pending: 'pending', reverse: 'reverse|reverseActive' },
  f: [
    ['side', 'Line on the inline start; alternate mode mirrors', 'الخط عند بداية السطر والنمط المتبادل ينعكس', 'p1', '', '', N.logical],
    ['dates', 'Dates in the scope calendar and numerals', 'التواريخ بتقويم النطاق وأرقامه', 'p1', '', '', N.calendar],
  ],
})

C('kbd', 'Keyboard key', 'مفتاح لوحة المفاتيح', 'display', 'T1', 'p2', {
  s: ['Shows a key or shortcut.', 'يعرض مفتاحًا أو اختصارًا.'],
  e: 'none', a: 'root',
  al: { mantine: 'Kbd', chakra: 'Kbd', 'react-aria': 'Keyboard', shadcn: 'kbd' },
  f: [['ltr', 'A shortcut is an LTR island', 'الاختصار جزيرة LTR', 'p1', '', '', ['req', 'Ctrl + K keeps its order inside Arabic text; key names can be localised without reordering the combination', 'اختصار مثل Ctrl + K يحتفظ بترتيبه داخل النص العربي، ويمكن تعريب أسماء المفاتيح دون تغيير ترتيب التركيبة']]],
})

C('code', 'Code', 'شيفرة', 'display', 'T1', 'p2', {
  s: ['Inline or block code, always left to right.', 'شيفرة ضمن السطر أو في كتلة، دائمًا من اليسار إلى اليمين.'],
  e: 'none', a: 'root',
  al: { mantine: 'Code', chakra: 'Code', shadcn: 'code-block' },
  f: [
    ['ltr', 'Code is LTR in every interface direction', 'الشيفرة LTR في كل اتجاه للواجهة', 'p0', '', '', N.ltrValue],
    ['copy', 'Copy button', 'زر نسخ', 'p2', '', ''],
  ],
})

C('highlight', 'Highlight', 'تمييز النص', 'display', 'T2', 'p1', {
  s: ['Marks the parts of a text that match a query.', 'يعلّم أجزاء النص المطابقة لاستعلام.'],
  e: 'none', a: 'root mark',
  al: { mantine: 'Highlight Mark', chakra: 'Highlight Mark' },
  f: [
    ['match', 'Highlights one or several queries', 'يميّز استعلامًا أو أكثر', 'p1', 'highlight|query', ''],
    ['arabic-match', 'Match ranges computed after Arabic folding', 'مواضع المطابقة تُحسب بعد توحيد الأحرف', 'p0', '', '', ['req', 'The highlighted range maps back to the original text, diacritics included, when the match was found on folded text', 'موضع التمييز يعود إلى النص الأصلي بتشكيله حين تُوجد المطابقة في النص الموحَّد']],
    ['no-break-shaping', 'A mark does not break letter joining', 'التمييز لا يقطع اتصال الحروف', 'p0', '', '', ['risk', 'Wrapping part of an Arabic word in an inline element can break cursive joining in some engines; the mark must not add padding or borders between letters', 'تغليف جزء من كلمة عربية بعنصر قد يقطع اتصال الحروف في بعض المحركات، فيجب ألا يضيف التمييز حشوًا أو حدودًا بين الحروف']],
  ],
})

C('blockquote', 'Blockquote', 'اقتباس', 'display', 'T1', 'p2', {
  s: ['Quoted text with an optional citation.', 'نص مقتبس مع مصدر اختياري.'],
  e: 'none', a: 'root content cite icon',
  al: { mantine: 'Blockquote', chakra: 'Blockquote Quote' },
  f: [['quote-marks', 'Quotation marks by language', 'علامات التنصيص بحسب اللغة', 'p2', '', '', ['req', 'Arabic uses «…» and the bar sits on the inline start', 'العربية تستخدم «…» والخط الجانبي يقع عند بداية السطر']]],
})

C('prose', 'Prose', 'محتوى نصي منسّق', 'display', 'T2', 'p2', {
  s: ['Styles for long-form HTML content: headings, paragraphs, lists, tables.', 'تنسيقات لمحتوى HTML الطويل: عناوين وفقرات وقوائم وجداول.'],
  e: 'none', a: 'root',
  al: { mantine: 'Typography' },
  f: [
    ['rhythm', 'Vertical rhythm from the measured Arabic line height', 'إيقاع رأسي من ارتفاع السطر العربي المقيس', 'p1', '', '', N.tashkeel],
    ['per-block-dir', 'Each block takes its own direction', 'كل كتلة تأخذ اتجاهها', 'p1', '', '', N.mixed],
    ['justify', 'Justification with kashida, never letter-spacing', 'ضبط السطور بالكشيدة لا بتباعد الحروف', 'p2', '', '', ['opp', 'Arabic justification stretches with kashida (text-justify: inter-character is wrong for Arabic)', 'ضبط السطور العربي يُمدّ بالكشيدة، وتباعد المحارف خاطئ للعربية']],
  ],
})

C('image', 'Image', 'صورة', 'media', 'T2', 'p2', {
  s: ['An image with fallback, placeholder and full-screen preview.', 'صورة مع بديل وعنصر نائب ومعاينة بملء الشاشة.'],
  e: 'dialog overlay-layers', a: 'root img fallback preview toolbar',
  al: { antd: 'Image', mantine: 'Image BackgroundImage', chakra: 'Image' },
  seed: 'image', sp: { preview: 'preview', group: 'PreviewGroup', fallback: 'fallback|fallbackSrc|placeholder', toolbar: 'toolbarRender|actionsRender' },
  f: [['gallery-arrows', 'Gallery next / previous follow direction', 'التالي والسابق في المعرض يتبعان الاتجاه', 'p1', '', '', N.arrows]],
})

C('carousel', 'Carousel', 'عرض شرائح', 'media', 'T4', 'p2', {
  s: ['Slides shown one group at a time, moved by swipe, buttons or dots.', 'شرائح تُعرض مجموعة تلو أخرى بالسحب أو الأزرار أو النقاط.'],
  e: 'carousel', a: 'root viewport slide prev next indicators',
  al: { antd: 'Carousel', mantine: 'Carousel', chakra: 'Carousel', shadcn: 'carousel' },
  seed: 'carousel', sp: { autoplay: 'autoplay|autoPlay', dots: 'dots|dotPlacement|dotPosition|withIndicators', fade: 'effect|fade' },
  sa: { rtl: ['risk', 'The next slide comes from the inline end, and the swipe gesture reverses', 'الشريحة التالية تأتي من نهاية السطر، وإيماءة السحب تنعكس'] },
  f: [['pause', 'Autoplay pauses on focus and hover', 'التشغيل التلقائي يتوقف عند التركيز والمرور', 'p1', 'pauseOnHover|pauseOnFocus', '']],
})

C('marquee', 'Marquee', 'شريط متحرك', 'media', 'T5', 'p2', {
  s: ['Content that scrolls continuously in one direction.', 'محتوى يتمرر باستمرار في اتجاه واحد.'],
  e: 'none', a: 'root content',
  al: { mantine: 'Marquee', chakra: 'Marquee' },
  f: [['direction', 'Scroll direction follows reading direction', 'اتجاه الحركة يتبع اتجاه القراءة', 'p1', 'reverse|side|direction', '', ['risk', 'Arabic text must enter from the left edge and move right so it is read in order; an LTR default scrolls it backwards', 'النص العربي يجب أن يدخل من الحافة اليسرى ويتحرك يمينًا ليُقرأ بترتيبه، والافتراضي LTR يمرره معكوسًا']], ['pause', 'Pauses on hover and reduced motion', 'يتوقف عند المرور وتقليل الحركة', 'p1', 'pauseOnHover|pauseOnInteraction', '']],
})

C('qr-code', 'QR code', 'رمز QR', 'media', 'T5', 'p1', {
  s: ['Renders a value as a QR code.', 'يرسم قيمة على شكل رمز QR.'],
  e: 'none', a: 'root frame pattern overlay',
  al: { antd: 'QRCode', chakra: 'QrCode' },
  seed: 'qr-code', sp: { icon: 'icon|Overlay', status: 'status', type: 'type', basic: 'value' },
  f: [
    ['binary', 'Binary payload (bytes), not only text', 'حمولة ثنائية (بايتات) لا نص فقط', 'p0', '', '', ['req', 'E-invoice QR payloads are binary TLV encoded as Base64; Arabic seller names are UTF-8 bytes whose length is counted in bytes', 'حمولة QR للفاتورة الإلكترونية ترميز TLV ثنائي بصيغة Base64، وأسماء البائعين العربية بايتات UTF-8 يُحسب طولها بالبايت']],
    ['error-level', 'Error correction level and quiet zone', 'مستوى تصحيح الخطأ والهامش الفارغ', 'p1', 'errorLevel|encoding', ''],
    ['print', 'Crisp at thermal-printer resolution', 'واضح بدقة الطابعة الحرارية', 'p1', '', ''],
  ],
})

C('watermark', 'Watermark', 'علامة مائية', 'media', 'T5', 'p2', {
  s: ['Repeats a text or image mark over content.', 'يكرر علامة نصية أو صورة فوق المحتوى.'],
  e: 'none', a: 'root',
  al: { antd: 'Watermark', 'antd-pro': 'WaterMark' },
  seed: 'watermark', sp: { text: 'content', image: 'image', font: 'font|gap|rotate' },
  sa: { arabic: ['risk', 'Canvas text needs its direction set, or Arabic renders disconnected or reversed', 'النص في Canvas يحتاج تحديد اتجاهه وإلا ظهرت العربية مقطّعة أو معكوسة'] },
})

// ── feedback ────────────────────────────────────────────────────────────────────────────────────────────────
C('alert', 'Alert', 'تنبيه', 'feedback', 'T3', 'p1', {
  s: ['An inline message about the state of the page or a section.', 'رسالة ضمن الصفحة عن حالتها أو حالة قسم منها.'],
  e: 'none', a: 'root icon title description action close',
  al: { antd: 'Alert', mui: 'Alert', mantine: 'Alert', chakra: 'Alert', shadcn: 'alert' },
  seed: 'alert', notAntd: 'live',
  sp: { types: 'type|severity|color|status|variant', description: 'description|title', action: 'action', closable: 'closable|onClose|withCloseButton', banner: 'banner', icon: 'showIcon|icon' },
  f: [['icon-side', 'Icon at the inline start, close at the inline end', 'الأيقونة عند بداية السطر والإغلاق عند نهايته', 'p1', '', '', N.logical]],
  dec: [['naming', 'alert; the owner\'s plan calls the page-level form Banner, kept as the banner feature.']],
})

C('empty-state', 'Empty state', 'حالة فراغ', 'feedback', 'T3', 'p1', {
  s: ['Explains why there is nothing here and what to do next.', 'يوضّح سبب عدم وجود شيء وما الخطوة التالية.'],
  e: 'none', a: 'root media title description actions',
  al: { antd: 'Empty', mantine: 'EmptyState', chakra: 'EmptyState', shadcn: 'empty' },
  seed: 'empty', sp: { image: 'image|icon', basic: 'description|title', action: 'antd:children|action|actions' },
  f: [['filtered', 'Different text for "no results" and "nothing yet"', 'نص مختلف لـ«لا نتائج» و«لا شيء بعد»', 'p1', '', '', N.strings]],
})

C('result', 'Result', 'صفحة نتيجة', 'feedback', 'T3', 'p2', {
  s: ['A full-section outcome: success, failure or an HTTP error.', 'نتيجة تملأ القسم: نجاح أو فشل أو خطأ HTTP.'],
  e: 'none', a: 'root icon title subtitle extra',
  al: { antd: 'Result' },
  seed: 'result', sp: { status: 'status', extra: 'extra' },
  f: [['codes', 'Error codes stay Latin', 'رموز الأخطاء تبقى لاتينية', 'p2', '', '', ['req', 'HTTP codes such as 404 are identifiers and keep Latin digits even under Arabic-Indic numerals', 'رموز HTTP مثل 404 معرّفات تحتفظ بالأرقام اللاتينية حتى مع نظام الأرقام الهندية']]],
})

C('skeleton', 'Skeleton', 'هيكل تحميل', 'feedback', 'T3', 'p1', {
  s: ['A placeholder in the shape of content that is loading.', 'عنصر نائب بشكل المحتوى الذي يُحمَّل.'],
  e: 'none', a: 'root',
  al: { antd: 'Skeleton', 'antd-pro': 'ProSkeleton', mui: 'Skeleton', mantine: 'Skeleton', chakra: 'Skeleton', shadcn: 'skeleton' },
  seed: 'skeleton', sp: { presets: 'avatar|paragraph|title|variant|circle', active: 'active|animation|animate', elements: 'Button|Input|Image|Avatar|Node' },
  f: [['shimmer', 'Shimmer travels in the reading direction', 'اللمعان يتحرك في اتجاه القراءة', 'p2', '', '', ['risk', 'A left-to-right shimmer in an RTL layout reads as content arriving from the end', 'اللمعان من اليسار إلى اليمين في تخطيط RTL يوحي بأن المحتوى يصل من النهاية']], ['text-lines', 'Text lines with a short last line at the inline start', 'أسطر نص مع سطر أخير قصير عند بداية السطر', 'p2', 'noOfLines|rows|paragraph', '', N.logical]],
})

C('spinner', 'Spinner', 'مؤشر تحميل', 'feedback', 'T1', 'p0', {
  s: ['Indeterminate progress, alone or covering a region.', 'تقدم غير محدد، منفردًا أو مغطيًا منطقة.'],
  e: 'none', a: 'root label overlay',
  al: { antd: 'Spin', 'antd-pro': 'PageLoading', mui: 'CircularProgress', mantine: 'Loader LoadingOverlay', chakra: 'Spinner Loader', shadcn: 'spinner' },
  seed: 'spin', sp: { sizes: 'size', container: 'spinning|visible|overlayProps', delay: 'delay', fullscreen: 'fullscreen' },
  f: [['label', 'Spoken label from the locale scope', 'اسم منطوق من نطاق اللغة', 'p0', '', '', N.strings]],
  dec: [['merge', 'Loading overlays (Mantine LoadingOverlay, AntD Spin wrapping content) are a feature of spinner.']],
})

C('progress', 'Progress', 'شريط تقدم', 'feedback', 'T3', 'p1', {
  s: ['Determinate or indeterminate progress along a line.', 'تقدم محدد أو غير محدد على خط.'],
  e: 'none', a: 'root track range label value',
  al: { antd: 'Progress', mui: 'LinearProgress', mantine: 'Progress', chakra: 'Progress', 'react-aria': 'ProgressBar', 'base-ui': 'Progress', radix: 'Progress', shadcn: 'progress' },
  seed: 'progress', drop: 'circle',
  sp: { status: 'status|color|colorPalette', steps: 'steps', format: 'format|formatOptions|valueLabel|getValueLabel|getAriaValueText|getValueText', line: 'percent|value' },
  sa: { rtl: ['risk', 'The bar fills from the inline start, and the percentage is written with the locale percent sign in the scope numerals', 'الشريط يمتلئ من بداية السطر، والنسبة تُكتب بعلامة النسبة الخاصة باللغة وبنظام أرقام النطاق'] },
  f: [['segments', 'Stacked segments', 'مقاطع متراكبة', 'p2', 'Section|ProgressSection|success', ''], ['buffer', 'Buffer and indeterminate', 'تحميل مسبق وحالة غير محددة', 'p2', 'variant|valueBuffer|isIndeterminate|animated', '']],
})

C('progress-circle', 'Progress circle', 'تقدم دائري', 'feedback', 'T3', 'p2', {
  s: ['Progress on a ring, with a value in the centre.', 'تقدم على حلقة مع قيمة في المنتصف.'],
  e: 'none', a: 'root track range label',
  al: { antd: 'Progress', mui: 'CircularProgress', mantine: 'RingProgress SemiCircleProgress', chakra: 'ProgressCircle' },
  an: { 'antd:Progress': 'type="circle" or "dashboard"' },
  seed: 'progress:circle', sp: { circle: 'type|gapDegree|gapPlacement' },
  f: [['clockwise', 'Sweep direction is not mirrored', 'اتجاه الدوران لا ينعكس', 'p2', '', '', ['risk', 'Clockwise fill is a clock convention, not a reading direction; mirroring it in RTL is a mistake', 'التعبئة مع عقارب الساعة عرف الساعة لا اتجاه القراءة، وعكسها في RTL خطأ']], ['value', 'Centre value in the scope numerals', 'القيمة الوسطى بنظام أرقام النطاق', 'p1', '', '', N.numerals]],
})

C('meter', 'Meter', 'مقياس', 'feedback', 'T3', 'p2', {
  s: ['A measurement within a known range (quota, strength), not task progress.', 'قياس ضمن مجال معروف (حصة، قوة) وليس تقدم مهمة.'],
  e: 'none', a: 'root track indicator label value',
  al: { 'react-aria': 'Meter', 'base-ui': 'Meter' },
  f: [['ranges', 'Low / high / optimum ranges', 'مجالات منخفض ومرتفع ومثالي', 'p2', 'low|high|optimum', ''], ['value-text', 'Formatted value text', 'نص القيمة المنسّق', 'p2', 'formatOptions|format|valueLabel|getAriaValueText', '', N.numerals], ['fill', 'Fill from the inline start', 'التعبئة من بداية السطر', 'p1', '', '', N.fill]],
})

// ── data ────────────────────────────────────────────────────────────────────────────────────────────────────
C('tree', 'Tree', 'شجرة', 'data', 'T4', 'p1', {
  s: ['A hierarchy of expandable nodes with selection and checking.', 'تسلسل هرمي من عقد قابلة للتوسيع مع التحديد والتأشير.'],
  e: 'tree-model collection selection roving-focus typeahead virtual-list drag-sort', a: 'root node indent toggle checkbox icon label children',
  al: { antd: 'Tree Tree.DirectoryTree', 'mui-x': 'SimpleTreeView RichTreeView TreeItem', mantine: 'Tree', chakra: 'TreeView', 'react-aria': 'Tree' },
  sc: { 'mui-x': 'pkg:@mui/x-tree-view' },
  seed: 'tree',
  sp: { expand: 'expandedKeys|expandedItems|expandedValue|expandedState', select: 'selectedKeys|selectedItems|selectionMode|multiSelect', checkable: 'checkable|checkboxSelection|checkedValue|checkedState', 'check-strictly': 'checkStrictly|selectionPropagation', async: 'loadData|dataSource|loadChildren|fetchChildren', draggable: 'draggable|itemsReordering|dragAndDropHooks', search: 'filterTreeNode|filter', virtual: 'virtual|virtualized', 'show-line': 'showLine|withLines', 'title-render': 'titleRender|renderNode|getItemLabel', keyboard: 'expandOnClick|expansionTrigger|typeahead|disabledItemsFocusable' },
  sa: { rtl: ['risk', 'ArrowRight expands in LTR and collapses in RTL; indentation and the expand arrow mirror', 'السهم الأيمن يوسّع في LTR ويطوي في RTL، والمسافة البادئة وسهم التوسيع ينعكسان'] },
  f: [['inline-edit', 'Rename a node in place', 'إعادة تسمية العقدة في مكانها', 'p2', 'isItemEditable|onItemLabelChange', ''], ['lines', 'Guide lines on the inline start', 'خطوط الإرشاد عند بداية السطر', 'p2', '', '', N.logical]],
})

C('virtual-list', 'Virtual list', 'قائمة افتراضية العرض', 'data', 'T4', 'p1', {
  s: ['Renders only the visible part of a long list or grid.', 'يرسم الجزء الظاهر فقط من قائمة أو شبكة طويلة.'],
  e: 'virtual-list', a: 'root viewport item',
  al: { 'react-aria': 'Virtualizer' },
  f: [
    ['variable-size', 'Variable and measured item sizes', 'أحجام عناصر متغيرة ومقيسة', 'p1', 'estimatedRowHeight|rowHeight|layout', '', ['risk', 'Arabic rows are taller than the Latin estimate once diacritics appear; estimates come from the Arabic line height', 'الصفوف العربية أطول من التقدير اللاتيني عند ظهور التشكيل، فالتقدير يؤخذ من ارتفاع السطر العربي']],
    ['horizontal-rtl', 'Horizontal virtualisation in RTL', 'العرض الافتراضي الأفقي في RTL', 'p1', '', '', ['risk', 'Offsets are computed from the inline start; negative scrollLeft in RTL breaks naive window calculations', 'الإزاحات تُحسب من بداية السطر، وقيمة scrollLeft السالبة في RTL تكسر الحسابات المبسّطة للنافذة']],
    ['focus', 'Keeps the focused item mounted', 'يُبقي العنصر المركَّز مرسومًا', 'p1', '', 'react-aria'],
  ],
})

C('file-upload', 'File upload', 'رفع الملفات', 'data', 'T4', 'p1', {
  s: ['Picks or drops files, validates them and tracks each upload.', 'يختار الملفات أو يُسقطها ويتحقق منها ويتتبع رفع كل ملف.'],
  e: 'upload-queue press', a: 'root dropzone trigger list item preview progress remove retry',
  al: { antd: 'Upload Upload.Dragger', mantine: 'Dropzone FileInput FileButton', chakra: 'FileUpload', 'react-aria': 'DropZone FileTrigger' },
  seed: 'upload',
  sp: { drag: 'Dragger|onDrop|dropzone|allowDrop', list: 'fileList|showUploadList', progress: 'progress', picture: 'listType', preview: 'onPreview|previewFile', 'before-upload': 'beforeUpload|validate|validator', 'custom-request': 'customRequest', multiple: 'multiple|directory|allowsMultiple', 'max-count': 'maxCount|maxFiles', accept: 'accept|acceptedFileTypes', controlled: 'fileList|acceptedFiles', remove: 'onRemove' },
  sa: { 'arabic-names': ['risk', 'An Arabic file name with a Latin extension reorders in bidi text; the name needs isolation with the extension kept at its end', 'اسم الملف العربي بامتداد لاتيني يتغير ترتيبه في النص ثنائي الاتجاه، فيحتاج الاسم عزلًا مع إبقاء الامتداد في آخره'] },
  f: [
    ['size-text', 'File size formatted by locale', 'حجم الملف منسّق بحسب اللغة', 'p1', '', '', ['req', 'Sizes use locale units and the scope numerals ("٢٫٤ م.ب")', 'الأحجام تستخدم وحدات اللغة ونظام أرقام النطاق («٢٫٤ م.ب»)']],
    ['paste', 'Paste from clipboard', 'اللصق من الحافظة', 'p2', 'pastable', ''],
    ['camera', 'Capture from camera', 'الالتقاط من الكاميرا', 'p2', 'capture|defaultCamera', ''],
  ],
})

C('color-picker', 'Color picker', 'منتقي الألوان', 'data', 'T5', 'p2', {
  s: ['Picks a colour by area, sliders, swatches or typed value.', 'يختار لونًا بالمساحة أو المنزلقات أو العينات أو قيمة مكتوبة.'],
  e: 'color slider overlay-layers anchored-position', a: 'root trigger area thumb channel-slider swatch input',
  al: { antd: 'ColorPicker', mantine: 'ColorPicker ColorInput ColorSwatch AlphaSlider HueSlider', chakra: 'Color', 'react-aria': 'ColorPicker ColorArea ColorSlider ColorWheel ColorField ColorSwatch' },
  seed: 'color-picker', sp: { formats: 'format', presets: 'presets|swatches', alpha: 'disabledAlpha|withPicker|AlphaSlider|ChannelSlider|ColorSlider', gradient: 'mode' },
  f: [['hex-ltr', 'Hex value is LTR and Latin', 'قيمة Hex باتجاه LTR وبأحرف لاتينية', 'p1', '', '', N.ltrValue], ['area-axes', 'Area axes are not mirrored', 'محاور المساحة لا تنعكس', 'p2', '', '', ['risk', 'Saturation runs left to right by convention; mirroring the area in RTL confuses more than it helps', 'التشبّع يمتد من اليسار إلى اليمين عرفًا، وعكس المساحة في RTL يربك أكثر مما يفيد']]],
})

C('charts', 'Charts', 'رسوم بيانية', 'data', 'T5', 'p1', {
  s: ['Bar, line, area, pie and related charts with axes, legend and tooltip.', 'رسوم أعمدة وخطوط ومساحات ودوائر مع المحاور والمفتاح والتلميح.'],
  e: 'none', a: 'root plot axis grid legend tooltip series',
  al: { 'mui-x': 'BarChart LineChart PieChart ScatterChart SparkLineChart Gauge RadarChart', mantine: 'BarChart LineChart AreaChart PieChart DonutChart Sparkline RadarChart ScatterChart CompositeChart BubbleChart FunnelChart RadialBarChart Heatmap Treemap SankeyChart', shadcn: 'chart' },
  sc: { 'mui-x': 'pkg:@mui/x-charts', mantine: 'pkg:@mantine/charts' },
  f: [
    ['rtl-axes', 'Axes for RTL: origin on the right, value axis on the inline start', 'محاور RTL: الأصل يمينًا ومحور القيم عند بداية السطر', 'p0', 'reverse|orientation|yAxisProps|position', '', ['opp', 'Time and category axes run right to left in Arabic reports; the owner\'s matrix lists RTL axes and Arabic numerals in tick labels as an opening', 'محاور الزمن والفئات تمتد من اليمين إلى اليسار في التقارير العربية، ومصفوفة المالك تعدّ محاور RTL والأرقام العربية في العلامات فرصة']],
    ['tick-numerals', 'Tick labels in the scope numerals and calendar', 'علامات المحاور بأرقام النطاق وتقويمه', 'p0', 'valueFormatter|tickFormatter', '', N.numerals],
    ['svg-shaping', 'Arabic labels in SVG text', 'العناوين العربية في نص SVG', 'p0', '', '', ['risk', 'SVG text anchors (start/end) follow direction, and per-character positioning breaks Arabic joining; labels are drawn as whole strings', 'مراسي نص SVG تتبع الاتجاه، وتحديد موضع كل محرف يقطع اتصال الحروف العربية، فتُرسم العناوين كسلاسل كاملة']],
    ['legend-order', 'Legend order and marker side follow direction', 'ترتيب المفتاح وجهة العلامة يتبعان الاتجاه', 'p1', 'legend|withLegend|legendProps', '', N.logical],
    ['tooltip', 'Tooltip with formatted values', 'تلميح بقيم منسّقة', 'p1', 'tooltip|withTooltip|valueFormatter', ''],
    ['a11y-table', 'Data table alternative for assistive technology', 'جدول بيانات بديل للتقنيات المساعدة', 'p1', '', ''],
  ],
  dec: [['merge', 'One entry for all chart types, as instructed; chart types become features when L5 plans them.'], ['scope', 'AntD charts live in a separate project (AntV) which was not unpacked, so there is no AntD alias.']],
  n: 'Wanted engine: chart-scale.',
})

C('rich-text-editor', 'Rich text editor', 'محرر نصوص منسّقة', 'text-input', 'T5', 'p2', {
  s: ['Formatted text editing with a toolbar.', 'تحرير نص منسّق مع شريط أدوات.'],
  e: 'none', a: 'root toolbar control content',
  al: { mantine: 'RichTextEditor' },
  sc: { mantine: 'pkg:@mantine/tiptap' },
  f: [
    ['block-direction', 'Direction per block with a toggle', 'اتجاه لكل كتلة مع زر تبديل', 'p0', '', '', ['req', 'Each paragraph is auto-directed and can be forced; alignment buttons are start/end, with left/right kept for explicit overrides', 'كل فقرة تأخذ اتجاهها تلقائيًا ويمكن فرضه، وأزرار المحاذاة بداية ونهاية مع إبقاء يسار ويمين للتجاوز الصريح']],
    ['align-controls', 'Alignment controls', 'عناصر المحاذاة', 'p1', 'AlignLeft|AlignRight|AlignCenter', '', N.mirrorIcon],
    ['lists', 'Lists with Arabic markers', 'قوائم بعلامات عربية', 'p2', 'BulletList|OrderedList', ''],
  ],
  n: 'Wanted engine: rich-text.',
})

C('action-bar', 'Action bar', 'شريط إجراءات', 'feedback', 'T3', 'p2', {
  s: ['A floating bar of bulk actions that appears while items are selected.', 'شريط عائم لإجراءات جماعية يظهر أثناء تحديد عناصر.'],
  e: 'overlay-layers', a: 'root selection-text separator action close', d: 'button',
  al: { 'antd-pro': 'FooterToolbar', mantine: 'ActionBar', chakra: 'ActionBar' },
  f: [['count', '"N selected" with Arabic plural', '«تم تحديد N» بصيغة الجمع العربية', 'p1', '', '', N.strings], ['open', 'Opens with the selection', 'يظهر مع التحديد', 'p2', P.open, '']],
})
