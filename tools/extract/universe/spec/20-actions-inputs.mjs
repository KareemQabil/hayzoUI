import { C, N, P } from './_dsl.mjs'

// ── actions ─────────────────────────────────────────────────────────────────────────────────────────────────
C('button', 'Button', 'زر', 'action', 'T1', 'p0', {
  s: ['Triggers an action; knows pending and prevents a second activation.', 'ينفّذ إجراءً، ويعرف حالة الانتظار ويمنع التنفيذ المزدوج.'],
  e: 'press', a: 'root label icon spinner',
  d: 'icon spinner',
  al: { antd: 'Button', mui: 'Button ButtonBase', mantine: 'Button UnstyledButton', chakra: 'Button', 'react-aria': 'Button', 'base-ui': 'Button', 'headless-ui': 'Button', shadcn: 'button' },
  seed: 'button', drop: 'group', notAntd: 'double-submit',
  sp: { variants: 'variant|variants|antd:type', danger: 'danger|color|colorPalette', sizes: 'size', loading: P.loading, disabled: P.disabled, icon: 'icon|iconPlacement|iconPosition|startIcon|leftSection|loaderPlacement', block: 'block|fullWidth', shape: 'shape|radius', href: 'href' },
  so: { disabled: 'chakra shadcn headless-ui', 'double-submit': 'react-aria' },
  sa: { 'busy-label': ['req', 'The pending state is announced in the language of the scope (Arabic by default), not passed as a prop', 'حالة الانتظار تُعلَن بلغة النطاق (العربية افتراضيًا) ولا تُمرَّر كخاصية'] },
  f: [
    ['icon-side', 'Icon side is logical (start / end)', 'موضع الأيقونة منطقي (بداية/نهاية)', 'p0', 'iconPlacement|iconPosition|startIcon|leftSection|rightSection', '', ['risk', 'Props named left/right keep the icon on the physical side; Mantine leftSection is an example of a name that needs explaining in RTL', 'الخصائص المسماة left/right تُبقي الأيقونة في الجهة الفيزيائية، ومثالها leftSection في Mantine الذي يحتاج توضيحًا في RTL']],
    ['polymorphic', 'Render as link or router link', 'الرسم كرابط أو رابط توجيه', 'p1', 'component|asChild|render|as|href', ''],
  ],
  dec: [['split', 'The button-group row of the matrix moved to button-group.']],
})

C('icon-button', 'Icon button', 'زر أيقونة', 'action', 'T1', 'p0', {
  s: ['A button that shows only an icon and therefore requires a label.', 'زر يعرض أيقونة فقط ولذلك يتطلب اسمًا مقروءًا.'],
  e: 'press', a: 'root icon', d: 'button icon',
  al: { mui: 'IconButton', mantine: 'ActionIcon CloseButton', chakra: 'IconButton CloseButton', 'headless-ui': 'CloseButton' },
  an: { 'mantine:CloseButton': 'preset', 'chakra:CloseButton': 'preset', 'headless-ui:CloseButton': 'closes the nearest dialog or popover' },
  f: [
    ['label-required', 'Accessible label is required', 'الاسم المقروء إلزامي', 'p0', 'aria-label', '', N.strings],
    ['mirror', 'Directional icon mirrors with direction', 'الأيقونة الاتجاهية تنعكس مع الاتجاه', 'p0', '', '', N.mirrorIcon],
    ['loading', 'Loading state', 'حالة التحميل', 'p1', P.loading, ''],
    ['sizes', 'Sizes with a minimum touch target', 'أحجام بحد أدنى لمساحة اللمس', 'p1', 'size', ''],
  ],
  dec: [['merge', 'Close buttons are folded in as a preset; AntD has no separate export (Button with only an icon).']],
})

C('button-group', 'Button group', 'مجموعة أزرار', 'action', 'T1', 'p1', {
  s: ['Joins buttons into one segmented shape.', 'يضم الأزرار في شكل واحد متصل.'],
  e: 'none', a: 'root', d: 'button',
  al: { antd: 'Space.Compact', mui: 'ButtonGroup', mantine: 'ButtonGroup', chakra: 'ButtonGroup Group', shadcn: 'button-group' },
  seed: 'button:group',
  f: [
    ['orientation', 'Horizontal or vertical', 'أفقي أو رأسي', 'p2', P.orientation + '|direction', ''],
    ['corners', 'Joined corners follow direction', 'الزوايا المتصلة تتبع الاتجاه', 'p0', '', '', ['risk', 'First and last child radius rules written with left/right leave the wrong corners square in RTL', 'قواعد استدارة أول وآخر عنصر المكتوبة بـleft/right تترك الزوايا الخاطئة مربعة في RTL']],
    ['split-button', 'Split button with a menu', 'زر منقسم مع قائمة', 'p2', '', ''],
  ],
})

C('toggle-button', 'Toggle button', 'زر تبديل', 'action', 'T2', 'p1', {
  s: ['A button with a pressed state.', 'زر له حالة مضغوط.'],
  e: 'toggle press', a: 'root', d: 'button',
  al: { mui: 'ToggleButton', mantine: 'Toggle Chip', chakra: 'Toggle', 'react-aria': 'ToggleButton', 'base-ui': 'Toggle', radix: 'Toggle', shadcn: 'toggle' },
  f: [
    ['pressed', 'Controlled and uncontrolled pressed', 'حالة الضغط متحكَّم بها أو لا', 'p1', 'pressed|selected|isSelected|checked', ''],
    ['disabled', 'Disabled', 'التعطيل', 'p1', P.disabled, ''],
  ],
})

C('toggle-group', 'Toggle group', 'مجموعة أزرار تبديل', 'choice', 'T2', 'p1', {
  s: ['A row of toggle buttons where one or several can be pressed.', 'صف من أزرار التبديل يُضغط واحد منها أو أكثر.'],
  e: 'roving-focus selection toggle', a: 'root item', d: 'toggle-button',
  al: { mui: 'ToggleButtonGroup', mantine: 'ToggleGroup', 'react-aria': 'ToggleButtonGroup', 'base-ui': 'ToggleGroup', radix: 'ToggleGroup', shadcn: 'toggle-group' },
  f: [
    ['single-multiple', 'Single or multiple selection', 'تحديد مفرد أو متعدد', 'p1', 'type|exclusive|selectionMode|multiple', ''],
    ['arrows', 'Roving focus with arrow keys', 'تركيز متنقل بمفاتيح الأسهم', 'p0', 'rovingFocus|loop|loopFocus|orientation', '', N.arrows],
  ],
  dec: [['split', 'Kept apart from segmented-control: a toggle group is pressed buttons (zero, one or many); a segmented control is a radio group that always holds one value.']],
})

C('link', 'Link', 'رابط', 'action', 'T1', 'p1', {
  s: ['Inline navigation with external and current-page states.', 'تنقل داخل النص بحالتي رابط خارجي وصفحة حالية.'],
  e: 'press', a: 'root icon',
  al: { antd: 'Typography.Link', mui: 'Link', mantine: 'Anchor', chakra: 'Link', 'react-aria': 'Link' },
  f: [
    ['underline', 'Underline policy', 'سياسة التسطير', 'p2', 'underline|variant', '', ['risk', 'Underlines cut through Arabic descenders and dots; thickness and offset need Arabic-specific values', 'التسطير يقطع الحروف النازلة والنقاط في العربية، فالسماكة والإزاحة تحتاجان قيمًا خاصة بالعربية']],
    ['external', 'External link icon', 'أيقونة الرابط الخارجي', 'p2', 'external|isExternal|target', '', N.mirrorIcon],
    ['router', 'Works with a client router', 'يعمل مع موجّه التطبيق', 'p1', 'component|asChild|render|as|href', ''],
  ],
})

C('floating-action-button', 'Floating action button', 'زر عائم', 'action', 'T3', 'p2', {
  s: ['A button pinned to a screen corner, optionally expanding into actions.', 'زر مثبت في زاوية الشاشة قد يتوسع إلى إجراءات.'],
  e: 'press disclosure', a: 'root trigger action', d: 'icon-button tooltip',
  al: { antd: 'FloatButton BackTop', mui: 'Fab SpeedDial' },
  seed: 'float-button', sp: { group: 'trigger|open|direction', badge: 'badge', tooltip: 'tooltip|tooltipTitle' },
  f: [['corner', 'Corner is the inline end', 'الزاوية عند نهاية السطر', 'p1', '', '', N.placement]],
})

C('copy-button', 'Copy button', 'زر نسخ', 'action', 'T2', 'p2', {
  s: ['Copies a value to the clipboard and confirms it.', 'ينسخ قيمة إلى الحافظة ويؤكد ذلك.'],
  e: 'press', a: 'root indicator', d: 'icon-button',
  al: { mantine: 'CopyButton', chakra: 'Clipboard' },
  f: [
    ['feedback', 'Copied state with timeout', 'حالة «تم النسخ» بمهلة', 'p2', 'timeout|copied', '', N.strings],
    ['clean-value', 'Copies the stored value, without bidi marks or display digits', 'ينسخ القيمة المخزنة بلا علامات اتجاه ولا أرقام العرض', 'p1', '', '', ['req', 'An IBAN shown with Arabic-Indic digits and isolation is copied as plain Latin digits', 'الآيبان المعروض بأرقام هندية وعزل اتجاهي يُنسخ بأرقام لاتينية صِرفة']],
  ],
  n: 'Wanted engine: clipboard.',
})

// ── field infrastructure ────────────────────────────────────────────────────────────────────────────────────
C('field', 'Field', 'حقل', 'utility', 'T1', 'p0', {
  s: ['Wires a control to its label, description and error message.', 'يربط عنصر الإدخال بعنوانه ووصفه ورسالة الخطأ.'],
  e: 'field', a: 'root label required-indicator description error control',
  al: { antd: 'Form.Item', mui: 'FormControl FormLabel FormHelperText InputLabel', mantine: 'Input.Wrapper InputWrapper InputLabel InputError InputDescription', chakra: 'Field', 'react-aria': 'Label FieldError', 'base-ui': 'Field', radix: 'Label', 'headless-ui': 'Field Label Description', shadcn: 'field label' },
  sc: { antd: 'FormItem', mantine: 'Input' },
  seed: 'form:item-anatomy,required-mark,feedback-icons,field-disabled',
  sp: { 'item-anatomy': 'label|help|extra|helperText|description', 'required-mark': 'required|requiredMark|withAsterisk|optionalText', 'feedback-icons': 'hasFeedback', 'field-disabled': P.disabled },
  f: [
    ['optional-default', 'Required is the default; optional is marked', 'الإلزام هو الأصل ويُعلَّم الاختياري', 'p0', '', '', N.strings],
    ['error-live', 'Error announced when it appears', 'إعلان الخطأ عند ظهوره', 'p0', '', '', ['req', 'Error text quoting a typed value keeps that value isolated so digits and Latin do not reorder inside the Arabic sentence', 'نص الخطأ الذي يقتبس قيمة مكتوبة يعزل تلك القيمة فلا يتغير ترتيب الأرقام واللاتينية داخل الجملة العربية']],
    ['label-side', 'Label above or at the inline start', 'العنوان فوق الحقل أو عند بداية السطر', 'p1', 'labelPosition|labelAlign|orientation|layout', '', N.logical],
    ['count', 'Character count', 'عدّاد الحروف', 'p2', 'showCount|maxLength', '', ['risk', 'Count by grapheme: an Arabic letter with diacritics is one character to the person typing', 'العدّ يكون بالحرف المرئي، فالحرف العربي مع تشكيله حرف واحد عند الكاتب']],
  ],
  dec: [['merge', 'Label is a part of field, not its own entry, although Radix, React Aria, Headless UI and shadcn publish it separately.']],
})

C('fieldset', 'Fieldset', 'مجموعة حقول', 'utility', 'T1', 'p1', {
  s: ['Groups related fields under a legend and disables them together.', 'يجمع الحقول المترابطة تحت عنوان ويعطّلها معًا.'],
  e: 'field', a: 'root legend', d: 'field',
  al: { mui: 'FormGroup', mantine: 'Fieldset', chakra: 'Fieldset', 'react-aria': 'Group', 'base-ui': 'Fieldset', 'headless-ui': 'Fieldset Legend' },
  f: [['disabled', 'Disables all controls inside', 'يعطّل كل العناصر بداخله', 'p1', P.disabled, '']],
})

C('form', 'Form', 'نموذج', 'utility', 'T2', 'p0', {
  s: ['Collects values, validates them and guards submission.', 'يجمع القيم ويتحقق منها ويحمي الإرسال.'],
  e: 'form field', a: 'root', d: 'field button',
  al: { antd: 'Form', 'react-aria': 'Form', 'base-ui': 'Form', radix: 'Form', shadcn: 'form' },
  seed: 'form', drop: 'item-anatomy required-mark feedback-icons field-disabled', notAntd: 'submit-guard null-empty show-validation',
  sp: { layout: 'layout', 'label-align': 'labelAlign|labelCol|wrapperCol', rules: 'rules|validate|validationBehavior', validator: 'validator|validate', 'validate-trigger': 'validateTrigger|validationMode', dependencies: 'dependencies', 'should-update': 'shouldUpdate', 'scroll-to-error': 'scrollToFirstError', 'initial-values': 'initialValues', disabled: P.disabled, submit: 'onFinish|onSubmit|onFormSubmit', 'messages-locale': 'validateMessages', size: 'size|variant', preserve: 'preserve', 'show-validation': 'validationErrors|errors|serverInvalid' },
  f: [
    ['server-errors', 'Server errors mapped to fields', 'ربط أخطاء الخادم بالحقول', 'p1', 'validationErrors|errors|serverInvalid|setFields', ''],
    ['error-summary', 'Error summary with links to fields', 'ملخص الأخطاء بروابط إلى الحقول', 'p1', '', '', N.strings],
    ['messages-plural', 'Validation messages with Arabic plurals', 'رسائل التحقق بصيغ الجمع العربية', 'p0', '', '', ['req', '"At least 3 characters" needs the Arabic plural categories (few for 3–10, many for 11–99) and the number in the scope numerals', 'رسالة «٣ أحرف على الأقل» تحتاج فئات الجمع العربية (القليل من ٣ إلى ١٠ والكثير من ١١ إلى ٩٩) والعدد بنظام أرقام النطاق']],
  ],
  dec: [['split', 'Form.Item rows of the matrix moved to field.']],
})

// ── text inputs ─────────────────────────────────────────────────────────────────────────────────────────────
C('text-field', 'Text field', 'حقل نصي', 'text-input', 'T1', 'p0', {
  s: ['Single-line text entry inside a field.', 'إدخال نص من سطر واحد داخل حقل.'],
  e: 'text-input field', a: 'root control prefix suffix clear', d: 'field',
  al: { antd: 'Input', mui: 'TextField Input OutlinedInput FilledInput InputBase', mantine: 'TextInput Input', chakra: 'Input', 'react-aria': 'TextField Input', 'base-ui': 'Input', 'headless-ui': 'Input', shadcn: 'input' },
  seed: 'input', drop: 'password textarea search otp phone addon',
  sp: { sizes: 'size', status: P.invalid, disabled: P.disabled + '|readOnly|isReadOnly', 'prefix-suffix': 'prefix|suffix|startAdornment|leftSection|startElement', 'allow-clear': P.clear, count: 'showCount|count', variants: 'variant' },
  so: { disabled: 'chakra shadcn headless-ui' },
  sa: { 'content-dir': ['req', 'Typed Latin in an Arabic interface aligns by its first strong character, and codes or emails can be pinned LTR; libraries inherit the interface direction only', 'النص اللاتيني المكتوب في واجهة عربية يُحاذى بحسب أول حرف قوي، ويمكن تثبيت الرموز والبريد على LTR، والمكتبات تورّث اتجاه الواجهة فقط'] },
  f: [
    ['null-empty', 'Empty reports null', 'الفراغ يُبلَّغ كـnull', 'p0', '', ''],
    ['keyboard-layout', 'Wrong keyboard layout suggestion', 'اقتراح تصحيح تخطيط لوحة المفاتيح', 'p2', '', '', ['opp', 'Text typed on the Arabic layout while meaning Latin (or the reverse) is detected and the corrected text is offered, never applied silently', 'النص المكتوب بتخطيط عربي والمقصود لاتيني (أو العكس) يُكتشف ويُقترح تصحيحه دون تطبيقه صامتًا']],
    ['strip-bidi', 'Bidi control characters removed on paste', 'إزالة محارف التحكم الاتجاهية عند اللصق', 'p0', '', '', ['req', 'Invisible RLM/LRM and isolates copied from documents are removed before the value is stored', 'تُزال علامات الاتجاه غير المرئية المنسوخة من المستندات قبل تخزين القيمة']],
    ['affix-side', 'Prefix and suffix sides are logical', 'جهتا البادئة واللاحقة منطقيتان', 'p0', '', '', N.logical],
    ['placeholder', 'Placeholder direction matches the expected content', 'اتجاه النص الإرشادي يطابق المحتوى المتوقع', 'p1', '', '', ['risk', 'An LTR example placeholder in an RTL field is right-aligned with its punctuation moved unless it is isolated', 'المثال اللاتيني كنص إرشادي في حقل RTL يُحاذى يمينًا وتنتقل علامات ترقيمه ما لم يُعزل']],
  ],
  dec: [['naming', 'text-field (the control with its field anatomy, as MUI and React Aria name it and as the owner\'s contracts do) rather than input, which is kept for the bare control part.'], ['split', 'Password, textarea, search, OTP, phone and add-on rows of the matrix moved to their own entries.']],
})

C('textarea', 'Textarea', 'حقل نص متعدد الأسطر', 'text-input', 'T1', 'p0', {
  s: ['Multi-line text entry that can grow with its content.', 'إدخال نص متعدد الأسطر ينمو مع محتواه.'],
  e: 'text-input field', a: 'root control', d: 'field',
  al: { antd: 'Input.TextArea', mui: 'TextareaAutosize', mantine: 'Textarea JsonInput', chakra: 'Textarea', 'react-aria': 'TextArea', 'headless-ui': 'Textarea', shadcn: 'textarea' },
  sc: { antd: 'TextArea' },
  seed: 'input:textarea', sp: { textarea: 'autoSize|autosize|minRows|maxRows' },
  f: [
    ['per-paragraph-dir', 'Each paragraph takes its own direction', 'كل فقرة تأخذ اتجاهها', 'p1', '', '', ['req', 'dir="auto" on a textarea decides once for the whole value; notes mixing Arabic and English paragraphs need per-paragraph direction in the read view', 'dir="auto" في حقل متعدد الأسطر يقرر مرة واحدة للقيمة كلها، والملاحظات التي تخلط فقرات عربية وإنجليزية تحتاج اتجاهًا لكل فقرة عند العرض']],
    ['count', 'Character count and limit', 'عدّاد الحروف والحد الأقصى', 'p2', 'showCount|maxLength|count', ''],
    ['resize', 'Resize handle at the inline end', 'مقبض تغيير الحجم عند نهاية السطر', 'p2', 'resize', ''],
  ],
})

C('password-input', 'Password input', 'حقل كلمة المرور', 'text-input', 'T2', 'p1', {
  s: ['Text field that hides its value, with a reveal toggle.', 'حقل نصي يخفي قيمته مع زر إظهار.'],
  e: 'text-input toggle field', a: 'root control visibility-toggle', d: 'text-field icon-button',
  al: { antd: 'Input.Password', mantine: 'PasswordInput' },
  sc: { antd: 'Password' },
  seed: 'input:password', sp: { password: 'visibilityToggle|visible|onVisibilityChange' },
  f: [
    ['ltr', 'Value is always LTR', 'القيمة دائمًا LTR', 'p0', '', '', N.ltrValue],
    ['layout-warning', 'Warns when the keyboard layout is Arabic', 'تنبيه عندما يكون تخطيط لوحة المفاتيح عربيًا', 'p1', '', '', ['opp', 'A hidden password typed on the Arabic layout is the most common sign-in failure for bilingual users; the field can say which script was typed without revealing it', 'كتابة كلمة مرور مخفية بالتخطيط العربي أكثر أسباب فشل الدخول شيوعًا عند مستخدمي اللغتين، ويستطيع الحقل أن يبيّن نوع الخط المكتوب دون كشفه']],
    ['strength', 'Strength meter', 'مقياس القوة', 'p2', '', ''],
  ],
  n: 'Radix publishes unstable_PasswordToggleField; it is not a stable export and is not listed.',
})

C('search-field', 'Search field', 'حقل بحث', 'text-input', 'T2', 'p0', {
  s: ['Text field for queries, with clear, submit and tolerant matching helpers.', 'حقل نصي للاستعلامات مع المسح والإرسال ومساعدات المطابقة المتسامحة.'],
  e: 'text-input field', a: 'root control clear submit', d: 'text-field',
  al: { antd: 'Input.Search', 'react-aria': 'SearchField' },
  sc: { antd: 'Search' },
  seed: 'input:search', sp: { search: 'onSearch|enterButton|onSubmit' },
  f: [
    ['clear', 'Clear button and Escape', 'زر المسح ومفتاح Escape', 'p0', P.clear, ''],
    ['tolerant', 'Arabic-tolerant matching helper', 'مساعد مطابقة متسامح مع العربية', 'p0', '', '', N.search],
    ['digits', 'Digits match in any numeral system', 'مطابقة الأرقام بأي نظام أرقام', 'p0', '', '', ['req', 'A phone typed with Arabic-Indic digits and a local prefix finds the number stored in international form', 'الهاتف المكتوب بأرقام هندية وبادئة محلية يجد الرقم المخزن بالصيغة الدولية']],
    ['franco', 'Arabizi (Franco) query matches Arabic text', 'استعلام بالفرانكو يطابق النص العربي', 'p2', '', '', ['opp', 'Queries such as "mo7amed" can match the Arabic spelling through a transliteration table', 'استعلامات مثل «mo7amed» يمكن أن تطابق الكتابة العربية عبر جدول نقل حرفي']],
    ['debounce', 'Debounced change', 'تأخير حدث التغيير', 'p1', '', ''],
  ],
})

C('otp-input', 'OTP input', 'حقل رمز التحقق', 'text-input', 'T2', 'p1', {
  s: ['One box per character for verification codes.', 'خانة لكل محرف لإدخال رموز التحقق.'],
  e: 'segmented-input field', a: 'root cell separator hidden-input', d: 'field',
  al: { antd: 'Input.OTP', mantine: 'PinInput', chakra: 'PinInput', 'base-ui': 'OTPField', shadcn: 'input-otp' },
  sc: { antd: 'OTP' },
  seed: 'input:otp', sp: { otp: 'length|maxLength|count' },
  f: [
    ['ltr-cells', 'Cells run left to right in every direction', 'الخانات من اليسار إلى اليمين في كل اتجاه', 'p0', 'dir', '', ['req', 'A code is read as it was sent: the first digit is the leftmost cell even in an Arabic interface, and arrow keys follow that order', 'الرمز يُقرأ كما أُرسل: أول رقم في أقصى اليسار حتى في واجهة عربية، ومفاتيح الأسهم تتبع هذا الترتيب']],
    ['any-digits', 'Accepts any digit system, stores Latin', 'يقبل أي نظام أرقام ويخزّن اللاتينية', 'p0', '', '', N.digitsIn],
    ['paste', 'Paste fills all cells', 'اللصق يملأ كل الخانات', 'p0', '', ''],
    ['autofill', 'SMS autofill (one-time-code)', 'التعبئة التلقائية من الرسائل', 'p1', 'oneTimeCode|autoComplete', ''],
    ['mask', 'Masked cells', 'خانات مخفية', 'p2', 'mask', ''],
  ],
  n: 'Radix publishes unstable_OneTimePasswordField; it is not a stable export and is not listed.',
})

C('input-group', 'Input group', 'مجموعة إدخال', 'text-input', 'T1', 'p1', {
  s: ['Attaches add-ons, buttons or a second control to an input.', 'يلحق إضافات أو أزرارًا أو عنصرًا ثانيًا بحقل الإدخال.'],
  e: 'none', a: 'root addon control', d: 'text-field',
  al: { antd: 'Space.Compact', mui: 'InputAdornment', chakra: 'InputGroup', shadcn: 'input-group' },
  seed: 'input:addon space:compact',
  f: [['order', 'Add-on order follows direction; a unit can be pinned', 'ترتيب الإضافات يتبع الاتجاه مع إمكانية تثبيت الوحدة', 'p0', '', '', ['req', 'A currency code or unit after a number stays on the side the locale puts it, which is not always the inline end', 'رمز العملة أو الوحدة بعد الرقم يبقى في الجهة التي تحددها اللغة، وهي ليست دائمًا نهاية السطر']]],
})

C('editable-text', 'Editable text', 'نص قابل للتحرير', 'text-input', 'T3', 'p2', {
  s: ['Text that turns into an input on activation and commits or cancels.', 'نص يتحول إلى حقل عند التفعيل ثم يُثبَّت أو يُلغى.'],
  e: 'text-input', a: 'root preview control submit cancel', d: 'text-field',
  al: { antd: 'Typography.Text', chakra: 'Editable' },
  an: { 'antd:Typography.Text': 'through the editable prop' },
  f: [
    ['commit', 'Enter commits, Escape reverts', 'Enter يثبّت و Escape يتراجع', 'p1', 'submitMode|onValueCommit|onEnd|onValueRevert|onCancel', ''],
    ['same-metrics', 'Preview and input share metrics', 'العرض والحقل بالمقاييس نفسها', 'p2', '', '', ['risk', 'Switching from auto-direction preview to an input must not flip the alignment of the text under the cursor', 'الانتقال من عرض تلقائي الاتجاه إلى حقل يجب ألا يقلب محاذاة النص تحت المؤشر']],
  ],
})

C('mask-input', 'Masked input', 'حقل بقالب', 'text-input', 'T2', 'p1', {
  s: ['Text entry constrained to a pattern of fixed and free positions.', 'إدخال نص مقيّد بقالب من مواضع ثابتة وحرة.'],
  e: 'segmented-input text-input field', a: 'root control', d: 'text-field',
  al: { mantine: 'MaskInput' },
  f: [
    ['pattern', 'Mask pattern with literals', 'قالب بمحارف ثابتة', 'p1', 'mask|tokens', ''],
    ['any-digits', 'Digit slots accept any digit system', 'خانات الأرقام تقبل أي نظام أرقام', 'p0', '', '', N.digitsIn],
    ['ltr', 'Masked value stays LTR', 'القيمة تبقى LTR', 'p0', '', '', N.ltrValue],
    ['raw-value', 'Reports the unmasked value', 'يُبلّغ القيمة بلا قالب', 'p1', 'onChangeRaw|unmask|onComplete', ''],
  ],
  dec: [['scope', 'Base for iban-field, national-id-field and tax-number-field; only Mantine 9 publishes one.']],
})

C('mentions', 'Mentions', 'إشارات', 'text-input', 'T5', 'p2', {
  s: ['Textarea that suggests people or tags after a trigger character.', 'حقل نص يقترح أشخاصًا أو وسومًا بعد محرف مشغِّل.'],
  e: 'text-input combobox anchored-position', a: 'root control popup option', d: 'textarea listbox',
  al: { antd: 'Mentions', mantine: 'Mentions Mention' },
  seed: 'mentions', sp: { prefix: 'prefix|trigger|triggers', async: 'loading|onSearch', placement: 'placement|position' },
  f: [['caret-rtl', 'Popup anchored to the caret in RTL text', 'النافذة تُثبَّت عند المؤشر في نص RTL', 'p1', '', '', ['risk', 'Caret coordinates in mixed-direction text are not monotonic; the popup must follow the visual caret', 'إحداثيات المؤشر في النص المختلط غير مطّردة، فيجب أن تتبع النافذةُ المؤشرَ المرئي']]],
})

// ── numeric ─────────────────────────────────────────────────────────────────────────────────────────────────
C('number-input', 'Number input', 'حقل رقمي', 'numeric-input', 'T2', 'p0', {
  s: ['Numeric entry with parsing, limits, stepping and locale formatting.', 'إدخال رقمي بالتحليل والحدود والخطوات والتنسيق بحسب اللغة.'],
  e: 'numeric-input field', a: 'root control increment decrement prefix suffix', d: 'field',
  al: { antd: 'InputNumber', mantine: 'NumberInput', chakra: 'NumberInput', 'react-aria': 'NumberField', 'base-ui': 'NumberField' },
  seed: 'input-number', notAntd: 'replace-on-focus',
  sp: { 'min-max': 'min|max|minValue|maxValue', step: 'step|controls|hideControls', precision: 'precision|decimalScale|formatOptions|format', 'string-mode': 'stringMode|valueIsNumericString', formatter: 'formatter|parser|formatOptions|format', prefix: 'prefix|addonBefore|leftSection', negative: 'allowNegative', status: P.invalid, keyboard: 'keyboard|allowMouseWheel|allowWheelScrub' },
  sa: {
    'arabic-digits': ['req', 'Arabic-Indic and Persian digits are accepted as typed; AntD InputNumber rejects them unless the application writes a parser', 'تُقبل الأرقام الهندية والفارسية كما تُكتب، و InputNumber في AntD يرفضها ما لم يكتب التطبيق محلِّلًا'],
    'ambiguous-comma': ['req', 'A comma that could mean thousands or decimals is never guessed silently; the field rejects it with suggestions', 'الفاصلة التي تحتمل الآلاف أو الكسور لا تُخمَّن صامتًا، ويرفضها الحقل مع اقتراحات'],
    'arabic-separators': ['req', 'The Arabic thousands and decimal separators are parsed, and shown as one bidi run', 'يُحلَّل فاصل الآلاف والفاصلة العشرية العربيان ويُعرضان كمقطع اتجاهي واحد'],
    'bidi-paste': ['req', 'Invisible direction marks from copy-paste do not change the value; a trailing minus is rejected with a reason', 'علامات الاتجاه غير المرئية الناتجة عن اللصق لا تغيّر القيمة، وعلامة السالب في النهاية تُرفض مع ذكر السبب'],
  },
  f: [
    ['display-numerals', 'Displays in the scope numerals when not editing', 'يعرض بنظام أرقام النطاق خارج التحرير', 'p0', '', '', N.numerals],
    ['stepper-side', 'Stepper buttons on the inline end', 'أزرار الزيادة والنقصان عند نهاية السطر', 'p1', '', '', N.logical],
    ['wheel', 'Wheel and scrub change', 'التغيير بعجلة الفأرة والسحب', 'p2', 'changeOnWheel|allowMouseWheel|allowWheelScrub|ScrubArea', ''],
    ['percent-unit', 'Percent and unit formats', 'صيغ النسبة والوحدات', 'p1', 'formatOptions|format|suffix', '', ['risk', 'The Arabic percent sign and its side differ by locale; the format comes from locale data, not string concatenation', 'علامة النسبة العربية وجهتها تختلفان بحسب اللغة، والتنسيق يأتي من بيانات اللغة لا من ضم النصوص']],
  ],
})

C('currency-input', 'Currency input', 'حقل مبلغ', 'numeric-input', 'T2', 'p0', {
  s: ['Amount entry stored as integer minor units of a known currency.', 'إدخال مبلغ يُخزَّن بالوحدات الصغرى الصحيحة لعملة معروفة.'],
  e: 'numeric-input field', a: 'root control currency-label', d: 'number-input field money-text',
  f: [
    ['minor-units', 'Stores integer minor units, never a float', 'يخزّن وحدات صغرى صحيحة لا كسرًا عشريًا', 'p0', '', '', ['req', 'Decimals come from the currency: 2 for EGP and SAR, 3 for KWD, BHD, OMR, JOD, TND and LYD', 'عدد الخانات العشرية يأتي من العملة: ٢ للجنيه والريال و٣ للدينار الكويتي والبحريني والأردني والتونسي والليبي والريال العماني']],
    ['any-digits', 'Accepts any digit system and Arabic separators', 'يقبل أي نظام أرقام والفواصل العربية', 'p0', '', '', N.digitsIn],
    ['ambiguous', 'Rejects ambiguous separators with suggestions', 'يرفض الفواصل الملتبسة مع اقتراحات', 'p0', '', '', ['req', 'A Latin comma or Arabic comma inside an amount is rejected with the two readings offered, never rounded or guessed', 'الفاصلة اللاتينية أو العربية داخل المبلغ تُرفض مع عرض القراءتين، ولا يُقرَّب المبلغ ولا يُخمَّن']],
    ['currency-name', 'Currency symbol or name by locale', 'رمز العملة أو اسمها بحسب اللغة', 'p0', '', '', ['req', 'Arabic shows the currency name after the amount with its plural form; the symbol side is locale data', 'العربية تعرض اسم العملة بعد المبلغ بصيغة الجمع المناسبة، وجهة الرمز من بيانات اللغة']],
    ['no-rounding', 'Extra decimals are an error, not rounded', 'الخانات الزائدة خطأ ولا تُقرَّب', 'p0', '', ''],
    ['cash-rounding', 'Cash rounding hint', 'تلميح تقريب النقد', 'p2', '', '', ['opp', 'Shows the cash-rounded amount where the smallest coin is larger than the minor unit', 'يعرض المبلغ المقرَّب للنقد حين تكون أصغر عملة معدنية أكبر من الوحدة الصغرى']],
    ['currency-select', 'Optional currency selector', 'اختيار العملة عند الحاجة', 'p1', '', ''],
  ],
  dec: [['scope', 'Ours alone as a component: the libraries offer number formatting options (React Aria and Base UI currency formats, ProComponents FieldMoney for display and edit) but none stores minor units or handles Arabic separators.']],
})

C('slider', 'Slider', 'منزلق', 'numeric-input', 'T2', 'p1', {
  s: ['Picks a value or a range by dragging a thumb along a track.', 'يختار قيمة أو مجالًا بسحب مقبض على مسار.'],
  e: 'slider', a: 'root track range thumb mark value-label',
  al: { antd: 'Slider', mui: 'Slider', mantine: 'Slider RangeSlider AngleSlider', chakra: 'Slider', 'react-aria': 'Slider', 'base-ui': 'Slider', radix: 'Slider', shadcn: 'slider' },
  seed: 'slider',
  sp: { range: 'range|minStepsBetweenThumbs|minRange|thumbAlignment|SliderThumb', marks: 'marks|step', vertical: P.orientation, tooltip: 'tooltip|valueLabelDisplay|mantine:label|labelAlwaysOn' },
  so: { range: 'mui' },
  sa: { rtl: ['risk', 'The minimum sits at the inline start, so the track and arrow keys reverse in RTL', 'القيمة الصغرى عند بداية السطر، فينعكس المسار ومفاتيح الأسهم في RTL'] },
  f: [
    ['rtl-prop', 'Direction-aware track', 'مسار يراعي الاتجاه', 'p0', 'reverse|inverted|dir|isReversed', '', N.arrows],
    ['value-numerals', 'Value label in the scope numerals', 'قيمة المقبض بنظام أرقام النطاق', 'p1', 'getAriaValueText|format|formatOptions|valueLabelFormat', '', N.numerals],
  ],
})

C('rating', 'Rating', 'تقييم', 'numeric-input', 'T2', 'p2', {
  s: ['Picks a score from a row of symbols.', 'يختار درجة من صف رموز.'],
  e: 'roving-focus selection', a: 'root item label',
  al: { antd: 'Rate', mui: 'Rating', mantine: 'Rating', chakra: 'RatingGroup' },
  seed: 'rate',
  sp: { half: 'allowHalf|precision|fractions', character: 'character|icon|emptySymbol', tooltips: 'tooltips|getLabelText|getSymbolLabel|translations' },
  sa: { rtl: ['risk', 'Symbols fill from the inline start, including the half symbol', 'الرموز تُملأ من بداية السطر، ومنها الرمز النصفي'] },
})
