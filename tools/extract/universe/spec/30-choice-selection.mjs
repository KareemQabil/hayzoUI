import { C, N, P } from './_dsl.mjs'

// ── choice ──────────────────────────────────────────────────────────────────────────────────────────────────
C('checkbox', 'Checkbox', 'مربع اختيار', 'choice', 'T1', 'p0', {
  s: ['A boolean or mixed choice with its label.', 'اختيار منطقي أو جزئي مع عنوانه.'],
  e: 'toggle field', a: 'root control indicator label hidden-input', d: 'field',
  al: { antd: 'Checkbox', mui: 'Checkbox FormControlLabel', mantine: 'Checkbox', chakra: 'Checkbox Checkmark', 'react-aria': 'Checkbox', 'base-ui': 'Checkbox', radix: 'Checkbox', 'headless-ui': 'Checkbox', shadcn: 'checkbox' },
  seed: 'checkbox', drop: 'group',
  sp: { indeterminate: 'indeterminate|isIndeterminate', disabled: P.disabled, controlled: 'checked|isSelected|defaultChecked' },
  f: [['label-side', 'Control at the inline start of its label', 'المربع عند بداية السطر قبل عنوانه', 'p0', 'labelPosition|labelPlacement', '', N.logical]],
  dec: [['split', 'Checkbox.Group moved to checkbox-group.']],
})

C('checkbox-group', 'Checkbox group', 'مجموعة مربعات اختيار', 'choice', 'T1', 'p1', {
  s: ['Several checkboxes that share a label, a value array and validation.', 'مربعات اختيار تشترك في عنوان ومصفوفة قيم وتحقق.'],
  e: 'selection field', a: 'root label item', d: 'checkbox fieldset',
  al: { antd: 'Checkbox.Group', mantine: 'CheckboxGroup', chakra: 'CheckboxGroup CheckboxCard', 'react-aria': 'CheckboxGroup', 'base-ui': 'CheckboxGroup' },
  an: { 'chakra:CheckboxCard': 'card-shaped item' },
  sc: { antd: 'Group' },
  seed: 'checkbox:group', sp: { group: 'options|value|allValues' },
  f: [
    ['select-all', 'Parent checkbox with mixed state', 'مربع رئيسي بحالة جزئية', 'p1', 'allValues|parent', ''],
    ['card', 'Card-shaped options', 'خيارات على شكل بطاقات', 'p2', '', 'chakra mantine'],
  ],
})

C('radio-group', 'Radio group', 'مجموعة أزرار اختيار', 'choice', 'T1', 'p0', {
  s: ['One choice out of a few visible options.', 'اختيار واحد من خيارات قليلة ظاهرة.'],
  e: 'roving-focus selection field', a: 'root label item control indicator', d: 'field',
  al: { antd: 'Radio Radio.Group', mui: 'Radio RadioGroup', mantine: 'Radio RadioGroup', chakra: 'RadioGroup RadioCard Radiomark', 'react-aria': 'RadioGroup Radio', 'base-ui': 'RadioGroup Radio', radix: 'RadioGroup', 'headless-ui': 'RadioGroup Radio', shadcn: 'radio-group' },
  an: { 'chakra:RadioCard': 'card-shaped item' },
  seed: 'radio',
  sp: { group: 'options|value', 'button-style': 'optionType|buttonStyle', disabled: P.disabled, vertical: P.orientation + '|row' },
  f: [['arrows', 'Arrow keys follow visual direction', 'مفاتيح الأسهم تتبع الاتجاه البصري', 'p0', 'dir|loop|loopFocus', '', N.arrows]],
  dec: [['naming', 'radio-group: a single radio has no use alone, and five libraries name the group.']],
})

C('switch', 'Switch', 'مفتاح تبديل', 'choice', 'T1', 'p0', {
  s: ['An on/off setting that applies immediately.', 'إعداد تشغيل وإيقاف يُطبَّق فورًا.'],
  e: 'toggle field', a: 'root track thumb label', d: 'field',
  al: { antd: 'Switch', mui: 'Switch', mantine: 'Switch', chakra: 'Switch', 'react-aria': 'Switch', 'base-ui': 'Switch', radix: 'Switch', 'headless-ui': 'Switch', shadcn: 'switch' },
  seed: 'switch',
  sp: { disabled: P.disabled, size: 'size', loading: 'loading', children: 'checkedChildren|onLabel|thumbIcon', label: 'label|description' },
  f: [['thumb-direction', 'Thumb moves toward the inline end when on', 'المقبض يتحرك نحو نهاية السطر عند التشغيل', 'p0', '', '', ['risk', 'A transform written as translateX(+n) moves the thumb the wrong way in RTL', 'التحريك المكتوب بـtranslateX موجب يحرّك المقبض في الاتجاه الخاطئ في RTL']]],
})

C('segmented-control', 'Segmented control', 'تحكم مقسَّم', 'choice', 'T2', 'p1', {
  s: ['A compact single choice shown as joined segments with a moving indicator.', 'اختيار مفرد مدمج على شكل مقاطع متصلة بمؤشر متحرك.'],
  e: 'roving-focus selection', a: 'root item indicator label',
  al: { antd: 'Segmented', mantine: 'SegmentedControl FloatingIndicator', chakra: 'SegmentGroup' },
  seed: 'segmented', notAntd: 'wrap rtl-keys',
  sp: { disabled: P.disabled, block: 'block|fullWidth', sizes: 'size', vertical: P.orientation },
  so: { 'rtl-keys': 'antd mantine chakra' },
  f: [['indicator', 'Indicator animates from the correct edge', 'المؤشر يتحرك من الحافة الصحيحة', 'p1', '', '', ['risk', 'Indicator offsets measured with offsetLeft need the RTL origin or the pill lands on the mirrored segment', 'إزاحات المؤشر المقيسة بـoffsetLeft تحتاج أصل RTL وإلا استقر المؤشر على المقطع المعكوس']]],
})

// ── selection ───────────────────────────────────────────────────────────────────────────────────────────────
C('listbox', 'Listbox', 'قائمة اختيار', 'selection', 'T2', 'p0', {
  s: ['A visible list of options with single or multiple selection.', 'قائمة ظاهرة من الخيارات بتحديد مفرد أو متعدد.'],
  e: 'listbox collection selection typeahead roving-focus', a: 'root group group-label option option-indicator empty',
  al: { chakra: 'Listbox', 'react-aria': 'ListBox' },
  f: [
    ['selection-mode', 'Single or multiple selection', 'تحديد مفرد أو متعدد', 'p0', 'selectionMode', ''],
    ['typeahead', 'Type to focus an option', 'الكتابة للانتقال إلى خيار', 'p0', 'typeahead|disallowTypeAhead', '', ['req', 'Typeahead compares with Arabic folding, so typing alef without hamza reaches an option that starts with a hamza form', 'البحث بالكتابة يقارن بعد توحيد الأحرف، فكتابة الألف بلا همزة تصل إلى خيار يبدأ بألف مهموزة']],
    ['sections', 'Sections with headings', 'أقسام بعناوين', 'p1', 'Section|ListBoxSection|ItemGroup', ''],
    ['grid-layout', 'Grid layout navigation', 'تنقل بتخطيط شبكي', 'p2', 'layout|orientation', '', N.arrows],
    ['virtual', 'Virtualised options', 'خيارات افتراضية العرض', 'p1', '', 'react-aria'],
  ],
})

C('select', 'Select', 'قائمة منسدلة', 'selection', 'T2', 'p0', {
  s: ['Picks one option from a list that opens from a trigger.', 'يختار خيارًا واحدًا من قائمة تُفتح من زر.'],
  e: 'listbox collection selection typeahead overlay-layers anchored-position field', a: 'root trigger value icon popup option group clear', d: 'listbox field popover',
  al: { antd: 'Select', mui: 'Select NativeSelect', mantine: 'Select NativeSelect', chakra: 'Select NativeSelect', 'react-aria': 'Select', 'base-ui': 'Select', radix: 'Select', 'headless-ui': 'Listbox Select', shadcn: 'select native-select' },
  an: { 'headless-ui:Select': 'native select', 'mui:NativeSelect': 'native select', 'mantine:NativeSelect': 'native select', 'chakra:NativeSelect': 'native select', 'shadcn:native-select': 'native select' },
  seed: 'select', drop: 'multiple tags max-tag',
  sp: { sizes: 'size', disabled: P.disabled, status: P.invalid, 'show-search': 'showSearch|searchable', 'filter-option': 'filterOption|filter', 'allow-clear': P.clear, 'not-found': 'notFoundContent|nothingFoundMessage', 'option-render': 'optionRender|renderOption', 'label-in-value': 'labelInValue', groups: 'OptGroup|group|ItemGroup|SelectSection|Group|ListBoxSection', virtual: P.virtual, remote: 'loading|onSearch', 'dropdown-render': 'popupRender|dropdownRender', variants: 'variant' },
  so: { keyboard: 'mui mantine chakra react-aria base-ui radix headless-ui', 'disabled-options': 'mui mantine chakra react-aria base-ui radix headless-ui' },
  sa: {
    'arabic-search': ['req', 'Search ignores hamza forms, alef maqsura, taa marbuta and diacritics while the stored text is unchanged; library filters are a plain substring test', 'البحث يتجاهل أشكال الهمزة والألف المقصورة والتاء المربوطة والتشكيل مع بقاء النص المخزن كما هو، وفلاتر المكتبات مطابقة نصية حرفية'],
    'digit-search': ['req', 'A local number typed in Arabic-Indic digits finds the option that stores the international form', 'الرقم المحلي المكتوب بأرقام هندية يجد الخيار المخزن بالصيغة الدولية'],
    'mixed-align': N.mixed,
  },
  f: [['native-mobile', 'Native picker on touch devices', 'المنتقي الأصلي في أجهزة اللمس', 'p2', '', 'mui mantine chakra headless-ui shadcn']],
  dec: [['merge', 'Native select is an alias of select, not its own entry.'], ['split', 'Multiple, tags and maxTag rows moved to multi-select and tags-input.']],
})

C('combobox', 'Combobox', 'مربع تحرير وسرد', 'selection', 'T2', 'p0', {
  s: ['A text input that filters a list of options; the value is an option or free text.', 'حقل نصي يصفّي قائمة خيارات، وقيمته خيار أو نص حر.'],
  e: 'combobox listbox collection selection overlay-layers anchored-position field', a: 'root input trigger popup option empty clear', d: 'listbox field popover',
  al: { antd: 'AutoComplete', mui: 'Autocomplete', mantine: 'Autocomplete Combobox', chakra: 'Combobox', 'react-aria': 'ComboBox Autocomplete', 'base-ui': 'Combobox Autocomplete', 'headless-ui': 'Combobox', shadcn: 'combobox' },
  sc: { antd: 'select' },
  seed: 'auto-complete',
  sp: { options: 'options|data|items|defaultItems', filter: 'filterOption|filterOptions|filter|defaultFilter', status: 'antd:status|error|invalid|isInvalid', 'allow-clear': P.clear, 'custom-input': 'renderInput' },
  f: [
    ['free-text', 'Free text or options only', 'نص حر أو خيارات فقط', 'p0', 'freeSolo|allowsCustomValue|allowCustomValue', ''],
    ['async', 'Async options with loading and empty states', 'خيارات غير متزامنة بحالتي تحميل وفراغ', 'p0', 'loading|isLoading|onInputChange|onSearch|loadingText', ''],
    ['tolerant', 'Arabic-tolerant filter with highlighted match', 'تصفية متسامحة مع العربية مع تمييز المطابقة', 'p0', '', '', N.search],
    ['virtual-focus', 'Focus stays in the input (active descendant)', 'التركيز يبقى في الحقل (العنصر النشط)', 'p0', '', 'mui mantine chakra react-aria base-ui headless-ui antd'],
    ['create', 'Create a new option from the query', 'إنشاء خيار جديد من الاستعلام', 'p1', '', ''],
    ['option-direction', 'Each option keeps its own direction', 'كل خيار يحتفظ باتجاهه', 'p1', '', '', N.mixed],
  ],
  dec: [['merge', 'Autocomplete (free text with suggestions) and Combobox (pick one, filter by typing) are one entry with an "options only" switch; six libraries ship one or both names for the same engine.']],
})

C('multi-select', 'Multi-select', 'اختيار متعدد', 'selection', 'T4', 'p0', {
  s: ['Combobox that holds several chosen options, shown as removable tags.', 'مربع تحرير وسرد يحمل عدة خيارات تظهر كوسوم قابلة للإزالة.'],
  e: 'combobox listbox collection selection overlay-layers anchored-position field', a: 'root input tag tag-remove popup option', d: 'combobox tag',
  al: { antd: 'Select', mui: 'Autocomplete', mantine: 'MultiSelect PillsInput', chakra: 'Combobox Select', 'react-aria': 'Select', 'base-ui': 'Combobox Select' },
  an: { 'antd:Select': 'mode="multiple"', 'mui:Autocomplete': 'multiple', 'chakra:Combobox': 'multiple', 'chakra:Select': 'multiple', 'react-aria:Select': 'selectionMode="multiple"', 'base-ui:Combobox': 'multiple', 'base-ui:Select': 'multiple' },
  seed: 'select:multiple,max-tag',
  sp: { multiple: 'multiple|selectionMode|mode', 'max-tag': 'maxTagCount|limitTags|maxValues|maxDisplayedValues' },
  f: [
    ['backspace', 'Backspace removes the last tag', 'Backspace يحذف آخر وسم', 'p1', '', ''],
    ['tag-arrows', 'Arrow keys move between tags', 'الأسهم تتنقل بين الوسوم', 'p1', '', '', N.arrows],
    ['count-summary', '"N selected" summary', 'ملخص «تم اختيار N»', 'p1', '', '', N.strings],
    ['select-all', 'Select all filtered options', 'تحديد كل الخيارات المصفّاة', 'p2', '', ''],
  ],
})

C('tags-input', 'Tags input', 'حقل وسوم', 'selection', 'T4', 'p1', {
  s: ['Free-text entry that turns each committed word into a tag.', 'إدخال نص حر يحوّل كل كلمة مثبتة إلى وسم.'],
  e: 'text-input collection selection roving-focus field', a: 'root input tag tag-remove clear', d: 'tag field',
  al: { antd: 'Select', mantine: 'TagsInput', chakra: 'TagsInput', 'react-aria': 'TokenField' },
  an: { 'antd:Select': 'mode="tags"' },
  seed: 'select:tags', sp: { tags: 'tokenSeparators|splitChars|delimiter|mode' },
  f: [
    ['separators', 'Split on separators, including the Arabic comma', 'الفصل عند الفواصل ومنها الفاصلة العربية', 'p0', 'tokenSeparators|splitChars|delimiter', '', ['req', 'The Arabic comma (U+060C) and Arabic semicolon split tags just like the Latin ones', 'الفاصلة العربية والفاصلة المنقوطة العربية تفصلان الوسوم مثل اللاتينيتين']],
    ['duplicates', 'Duplicate check with Arabic folding', 'كشف التكرار بعد توحيد الأحرف', 'p1', 'allowDuplicates|isDuplicate|validate', '', N.search],
    ['paste', 'Paste a list', 'لصق قائمة', 'p1', 'addOnPaste|acceptValueOnBlur|blurBehavior', ''],
    ['max', 'Maximum number of tags', 'حد أقصى للوسوم', 'p2', 'maxTags|max|maxCount', ''],
  ],
})

C('cascader', 'Cascader', 'اختيار متتالي', 'selection', 'T4', 'p1', {
  s: ['Picks a path through a hierarchy, one column per level.', 'يختار مسارًا في تسلسل هرمي بعمود لكل مستوى.'],
  e: 'tree-model menu selection overlay-layers anchored-position field', a: 'root trigger popup column option expand-icon', d: 'popover listbox',
  al: { antd: 'Cascader', mantine: 'Cascader' },
  seed: 'cascader',
  sp: { 'hover-expand': 'expandTrigger', 'change-on-select': 'changeOnSelect', multiple: 'multiple', 'show-checked': 'showCheckedStrategy', search: 'showSearch|searchable', 'load-data': 'loadData', 'display-render': 'displayRender', 'field-names': 'fieldNames', panel: 'Panel', disabled: P.disabled },
  sa: { rtl: ['risk', 'Columns open toward the inline end and expand arrows mirror; tolerant Arabic search matters for region and city names', 'الأعمدة تُفتح نحو نهاية السطر وأسهم التوسيع تنعكس، والبحث المتسامح مهم لأسماء المناطق والمدن'] },
  f: [['path-separator', 'Path separator follows direction', 'فاصل المسار يتبع الاتجاه', 'p1', 'separator', '', ['risk', 'A path joined with " / " between Arabic and Latin levels reorders unless each level is isolated', 'المسار المضموم بـ« / » بين مستويات عربية ولاتينية يتغير ترتيبه ما لم يُعزل كل مستوى']]],
})

C('tree-select', 'Tree select', 'اختيار شجري', 'selection', 'T4', 'p1', {
  s: ['Select whose popup is a tree.', 'قائمة منسدلة نافذتها شجرة.'],
  e: 'tree-model selection overlay-layers anchored-position field', a: 'root trigger popup tree', d: 'tree select',
  al: { antd: 'TreeSelect' },
  seed: 'tree-select',
  sp: { multiple: 'multiple', checkable: 'treeCheckable', strategy: 'showCheckedStrategy', search: 'treeNodeFilterProp|showSearch', async: 'loadData', 'tree-data': 'treeData|treeDataSimpleMode', expand: 'treeExpandedKeys|treeDefaultExpandAll', 'tree-line': 'treeLine', virtual: 'virtual', 'max-tag': 'maxTagCount' },
  sa: { rtl: ['risk', 'Indentation starts from the inline start and the switcher mirrors; tolerant Arabic search applies', 'المسافة البادئة تبدأ من بداية السطر وزر التوسيع ينعكس، ويُطبَّق البحث المتسامح'] },
})

C('transfer', 'Transfer', 'نقل بين قائمتين', 'selection', 'T5', 'p2', {
  s: ['Moves items between a source list and a target list.', 'ينقل العناصر بين قائمة مصدر وقائمة هدف.'],
  e: 'listbox selection', a: 'root list search item move-button', d: 'listbox checkbox button',
  al: { antd: 'Transfer' },
  seed: 'transfer',
  sp: { search: 'showSearch', 'one-way': 'oneWay', 'custom-render': 'render|children', pagination: 'pagination' },
  sa: { rtl: ['risk', 'The move arrows point at the target list as it is drawn, so they mirror in RTL', 'أسهم النقل تشير إلى قائمة الهدف كما تُرسم، فتنعكس في RTL'] },
})

C('entity-picker', 'Entity picker', 'منتقي السجلات', 'pattern', 'T2', 'p1', {
  s: ['Combobox over business records (customer, supplier, item) searched by name, phone or code, with create-new.', 'مربع تحرير وسرد لسجلات العمل (عميل، مورد، صنف) يبحث بالاسم أو الهاتف أو الرمز مع إنشاء جديد.'],
  e: 'combobox listbox collection selection overlay-layers anchored-position field', a: 'root input popup option secondary-line create empty', d: 'combobox auto-direction-text',
  f: [
    ['name-search', 'Name search tolerant of Arabic spelling variants', 'بحث بالاسم متسامح مع اختلاف الإملاء العربي', 'p0', '', '', N.search],
    ['phone-code', 'Phone and code search by digits', 'بحث بالهاتف والرمز عبر الأرقام', 'p0', '', '', ['req', 'Digits match from three characters up, ignoring spaces, plus and dashes, in any numeral system', 'تُطابَق الأرقام ابتداءً من ثلاثة محارف مع تجاهل المسافات وعلامة + والشرطات وبأي نظام أرقام']],
    ['secondary', 'Secondary line (phone, balance)', 'سطر ثانوي (الهاتف، الرصيد)', 'p1', '', '', N.ltrValue],
    ['create', 'Create a record from the query', 'إنشاء سجل من نص البحث', 'p1', '', ''],
    ['recent', 'Recent records first', 'السجلات الأخيرة أولًا', 'p2', '', ''],
  ],
  dec: [['scope', 'The owner\'s plan lists CustomerPicker at T2; generalised to any record so it is one pattern, not one per entity.']],
})

// ── tags, badges ────────────────────────────────────────────────────────────────────────────────────────────
C('badge', 'Badge', 'شارة', 'display', 'T2', 'p1', {
  s: ['A short static label for status or category.', 'عنوان قصير ثابت للحالة أو التصنيف.'],
  e: 'none', a: 'root icon label',
  al: { antd: 'Tag', mui: 'Chip', mantine: 'Badge', chakra: 'Badge Status', shadcn: 'badge' },
  seed: 'tag:colors,bordered,icon badge:status',
  sp: { colors: 'color|colorPalette|variant', bordered: 'variant|bordered', icon: 'icon|leftSection' },
  f: [['status-word', 'Status words agree in gender and number', 'كلمات الحالة تتوافق في الجنس والعدد', 'p1', '', '', ['risk', 'A status label reused for a masculine and a feminine noun ("paid" for an invoice or an amount) needs two Arabic strings', 'عنوان الحالة المستخدم لاسم مذكر وآخر مؤنث («مدفوع» و«مدفوعة») يحتاج نصين عربيين']]],
  dec: [['naming', 'badge is the static label (Mantine, Chakra, shadcn usage). AntD Badge, which overlays a count, is count-badge; AntD Tag and MUI Chip appear here for their static use and under tag for the interactive one.']],
})

C('tag', 'Tag', 'وسم', 'selection', 'T2', 'p1', {
  s: ['A removable or selectable label, alone or in a group.', 'عنوان قابل للإزالة أو التحديد، منفردًا أو ضمن مجموعة.'],
  e: 'press selection roving-focus', a: 'root label remove group',
  al: { antd: 'Tag Tag.CheckableTag', mui: 'Chip', mantine: 'Pill Chip', chakra: 'Tag', 'react-aria': 'TagGroup Tag' },
  seed: 'tag:closable,checkable',
  sp: { closable: 'closable|onDelete|withRemoveButton|onRemove|closeIcon|CloseTrigger', checkable: 'CheckableTag|checked|selectionMode' },
  f: [
    ['remove-side', 'Remove button on the inline end', 'زر الإزالة عند نهاية السطر', 'p0', '', '', N.logical],
    ['group-keys', 'Arrow keys across the group, Delete removes', 'الأسهم عبر المجموعة و Delete يزيل', 'p1', '', 'react-aria', N.arrows],
  ],
})

C('count-badge', 'Count badge', 'شارة عدد', 'display', 'T2', 'p1', {
  s: ['A count or dot attached to the corner of another element.', 'عدد أو نقطة ملحقة بزاوية عنصر آخر.'],
  e: 'none', a: 'root indicator',
  al: { antd: 'Badge', mui: 'Badge', mantine: 'Indicator', chakra: 'Float' },
  seed: 'badge:colors,count,overflow,dot,ribbon',
  sp: { count: 'count|badgeContent|label', overflow: 'overflowCount|max', dot: 'dot|variant', ribbon: 'Ribbon', colors: 'color' },
  f: [
    ['corner', 'Corner is the inline end by default', 'الزاوية الافتراضية عند نهاية السطر', 'p0', 'placement|anchorOrigin|position|offset', '', N.placement],
    ['numerals', 'Count and "99+" in the scope numerals', 'العدد و«+٩٩» بنظام أرقام النطاق', 'p0', '', '', ['req', 'The overflow form keeps the plus sign on the side the locale puts it', 'صيغة التجاوز تُبقي علامة + في الجهة التي تحددها اللغة']],
    ['spoken', 'Spoken label with Arabic plural', 'اسم منطوق بصيغة الجمع العربية', 'p1', '', '', N.strings],
  ],
})

C('avatar', 'Avatar', 'صورة رمزية', 'display', 'T2', 'p1', {
  s: ['A person or entity as image, initials or icon, alone or stacked.', 'شخص أو جهة كصورة أو أحرف أولى أو أيقونة، منفردة أو متراكبة.'],
  e: 'none', a: 'root image fallback group',
  al: { antd: 'Avatar', mui: 'Avatar AvatarGroup', mantine: 'Avatar', chakra: 'Avatar', 'base-ui': 'Avatar', radix: 'Avatar', shadcn: 'avatar' },
  seed: 'avatar',
  sp: { 'image-icon-text': 'src|icon|name', 'size-shape': 'shape|size|variant|radius', group: 'Group|AvatarGroup|max' },
  sa: { 'arabic-initials': ['opp', 'Initials from Arabic names skip the definite article and compound prefixes, and are not joined into a ligature', 'الأحرف الأولى من الأسماء العربية تتجاوز «ال» والبوادئ المركبة، ولا تُوصل في حرف مركّب'] },
  f: [
    ['stack-order', 'Stack overlaps toward the inline end', 'التراكب يتجه نحو نهاية السطر', 'p1', '', '', N.logical],
    ['fallback-delay', 'Fallback while the image loads', 'بديل أثناء تحميل الصورة', 'p2', 'delayMs|onLoadingStatusChange|onStatusChange', ''],
  ],
})
