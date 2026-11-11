import { C, N, P } from './_dsl.mjs'

// ── date and time ───────────────────────────────────────────────────────────────────────────────────────────
C('calendar', 'Calendar', 'تقويم', 'date-time', 'T4', 'p0', {
  s: ['A month grid for picking a date or a range, in any supported calendar system.', 'شبكة شهر لاختيار تاريخ أو مجال بأي نظام تقويم مدعوم.'],
  e: 'calendar-grid grid-navigation date-range', a: 'root header heading prev next grid weekday cell month-view year-view',
  al: { antd: 'Calendar', 'mui-x': 'DateCalendar MonthCalendar YearCalendar', mantine: 'Calendar DatePicker MiniCalendar MonthPicker YearPicker QuarterPicker WeekPicker', 'react-aria': 'Calendar RangeCalendar', shadcn: 'calendar' },
  an: { 'mantine:DatePicker': 'inline calendar in Mantine naming' },
  sc: { 'mui-x': 'pkg:@mui/x-date-pickers', mantine: 'pkg:@mantine/dates' },
  seed: 'calendar', sp: { card: 'fullscreen', 'cell-render': 'cellRender|fullCellRender|renderDay|getDayProps|slots', mode: 'mode|views|level|defaultLevel' },
  sa: { hijri: ['opp', 'A Hijri (Umm al-Qura) grid reuses the same engine as the date picker; no surveyed full-page calendar offers it', 'شبكة التقويم الهجري (أم القرى) تستخدم المحرك نفسه لمنتقي التاريخ، ولا يقدمها أي تقويم كامل الصفحة مما دُرس'] },
  f: [
    ['week-start', 'First day of week and weekend from the region', 'أول أيام الأسبوع والعطلة من المنطقة', 'p0', 'firstDayOfWeek|weekStartsOn|weekendDays', '', ['req', 'The week starts on Saturday in Egypt and on Sunday in Saudi Arabia, and the weekend is Friday–Saturday; both come from region data, not from the language', 'الأسبوع يبدأ السبت في مصر والأحد في السعودية والعطلة الجمعة والسبت، وكلاهما من بيانات المنطقة لا من اللغة']],
    ['calendars', 'Calendar system: Gregorian, Hijri Umm al-Qura, civil, tabular', 'نظام التقويم: ميلادي، هجري أم القرى، مدني، حسابي', 'p0', 'createCalendar|calendar|dateAdapter', '', N.calendar],
    ['month-names', 'Month name set by region', 'أسماء الشهور بحسب المنطقة', 'p0', '', '', ['req', 'Gregorian months are named differently across the Arab world (يناير / كانون الثاني / جانفي); the set comes from the region', 'الشهور الميلادية تختلف أسماؤها في العالم العربي (يناير / كانون الثاني / جانفي)، والمجموعة تأتي من المنطقة']],
    ['grid-direction', 'Grid columns and arrow keys follow direction', 'أعمدة الشبكة ومفاتيح الأسهم تتبع الاتجاه', 'p0', '', '', N.arrows],
    ['range', 'Range selection with hover preview', 'تحديد مجال مع معاينة عند المرور', 'p0', 'RangeCalendar|mantine:type|allowsNonContiguousRanges|shadcn:mode', ''],
    ['unavailable', 'Unavailable dates and min / max', 'تواريخ غير متاحة وحد أدنى وأقصى', 'p0', 'isDateUnavailable|disabledDate|shouldDisableDate|excludeDate|minDate|minValue|disabled', ''],
    ['multi-month', 'Several months side by side', 'عدة أشهر متجاورة', 'p1', 'visibleDuration|numberOfColumns|numberOfMonths|calendars', '', N.logical],
    ['secondary-calendar', 'Secondary calendar date in each cell', 'تاريخ التقويم الثاني في كل خلية', 'p1', '', '', ['opp', 'Each cell can show the Hijri day under the Gregorian one, or the reverse', 'كل خلية يمكن أن تعرض اليوم الهجري تحت الميلادي أو العكس']],
  ],
})

C('date-field', 'Date field', 'حقل تاريخ', 'date-time', 'T4', 'p0', {
  s: ['Keyboard date entry by segments (day, month, year) without a popup.', 'إدخال التاريخ من لوحة المفاتيح بمقاطع (يوم، شهر، سنة) بلا نافذة.'],
  e: 'segmented-input field', a: 'root input segment literal', d: 'field',
  al: { 'mui-x': 'DateField DateTimeField', mantine: 'DateInput MaskedDateInput', chakra: 'DateInput', 'react-aria': 'DateField DateInput DateSegment' },
  sc: { 'mui-x': 'pkg:@mui/x-date-pickers', mantine: 'pkg:@mantine/dates' },
  seed: 'date-picker:keyboard,any-digits',
  so: { keyboard: 'mui-x react-aria' },
  sa: { 'any-digits': ['req', 'Segments accept Latin, Arabic-Indic and Persian digits whatever the display numerals; React Aria and AntD drop or reject the other system', 'المقاطع تقبل الأرقام اللاتينية والهندية والفارسية أيًّا كان نظام العرض، و React Aria و AntD يتجاهلان النظام الآخر أو يرفضانه'] },
  f: [
    ['segment-order', 'Segment order from the locale pattern', 'ترتيب المقاطع من نمط اللغة', 'p0', 'format|formatOptions|granularity|valueFormat', '', ['risk', 'Arabic date patterns are day/month/year but the separators are neutral characters; the segments must be laid out as one isolated run or they reorder', 'نمط التاريخ العربي يوم/شهر/سنة لكن الفواصل محارف محايدة، فيجب أن تُرسم المقاطع كمقطع معزول واحد وإلا تغيّر ترتيبها']],
    ['segment-arrows', 'Arrow keys move between segments in visual order', 'الأسهم تتنقل بين المقاطع بالترتيب البصري', 'p0', '', '', N.arrows],
    ['month-text', 'Month as a name segment with typeahead', 'الشهر كمقطع اسمي مع بحث بالكتابة', 'p1', '', '', ['req', 'Typing the first letters of an Arabic month name selects it', 'كتابة أول حروف اسم الشهر العربي تختاره']],
    ['paste', 'Paste a whole date', 'لصق تاريخ كامل', 'p1', '', ''],
  ],
})

C('date-picker', 'Date picker', 'منتقي التاريخ', 'date-time', 'T4', 'p0', {
  s: ['A date field with a calendar popup; the stored value is ISO Gregorian.', 'حقل تاريخ مع نافذة تقويم، والقيمة المخزنة ميلادية بصيغة ISO.'],
  e: 'calendar-grid segmented-input overlay-layers anchored-position field', a: 'root field trigger popup calendar presets footer', d: 'date-field calendar popover',
  al: { antd: 'DatePicker', 'mui-x': 'DatePicker DesktopDatePicker MobileDatePicker StaticDatePicker', mantine: 'DatePickerInput MonthPickerInput YearPickerInput QuarterPickerInput WeekPickerInput', chakra: 'DatePicker', 'react-aria': 'DatePicker' },
  sc: { antd: 'picker', 'mui-x': 'pkg:@mui/x-date-pickers', mantine: 'pkg:@mantine/dates' },
  seed: 'date-picker', drop: 'range time keyboard any-digits', notAntd: 'storage rtl-keys',
  sp: { 'min-max': 'minDate|maxDate|minValue|maxValue|min|max', 'disabled-date': 'disabledDate|shouldDisableDate|excludeDate|isDateUnavailable', presets: 'presets|shortcuts', week: 'WeekPicker|WeekPickerInput|picker', month: 'MonthPicker|MonthPickerInput|picker|views', quarter: 'QuarterPicker|QuarterPickerInput|picker', year: 'YearPicker|YearPickerInput|picker|views', format: 'format|valueFormat', locale: 'locale|localeText|adapterLocale', status: P.invalid, disabled: P.disabled, 'allow-clear': P.clear, multiple: 'multiple|mantine:type|selectionMode', 'render-cell': 'cellRender|renderDay|slots' },
  so: { 'rtl-keys': 'react-aria' },
  sa: { hijri: ['req', 'Hijri display with Arabic month names over the same Gregorian ISO value; AntD needs a custom dayjs calendar plugin', 'عرض هجري بأسماء الشهور العربية فوق القيمة الميلادية نفسها بصيغة ISO، و AntD يحتاج إضافة تقويم مخصصة لـdayjs'] },
  f: [
    ['calendar-switch', 'Calendar system set per field', 'نظام التقويم يُحدَّد لكل حقل', 'p0', 'createCalendar|calendar|dateAdapter', '', N.calendar],
    ['mobile', 'Mobile presentation (sheet or wheels)', 'عرض للجوال (ورقة أو عجلات)', 'p1', 'desktopModeMediaQuery|dropdownType', ''],
    ['time-zone', 'Time zone of the value', 'المنطقة الزمنية للقيمة', 'p1', 'timezone|timeZone|placeholderValue', ''],
  ],
  dec: [['merge', 'Week, month, quarter and year pickers are granularities of date-picker, not entries.'], ['split', 'Range moved to date-range-picker, showTime to date-time-picker, segment entry to date-field.']],
})

C('date-range-picker', 'Date range picker', 'منتقي مجال التاريخ', 'date-time', 'T4', 'p0', {
  s: ['Picks a start and an end date with presets.', 'يختار تاريخ بداية وتاريخ نهاية مع اختصارات جاهزة.'],
  e: 'calendar-grid date-range segmented-input overlay-layers anchored-position field', a: 'root start-field separator end-field trigger popup calendar presets', d: 'date-picker',
  al: { antd: 'DatePicker.RangePicker', mantine: 'DatePickerInput', 'react-aria': 'DateRangePicker' },
  an: { 'mantine:DatePickerInput': 'type="range"' },
  sc: { antd: 'picker RangePicker', mantine: 'pkg:@mantine/dates' },
  seed: 'date-picker:range,presets', sp: { range: 'RangePicker|type|DateRangePicker', presets: 'presets' },
  f: [
    ['order', 'Start field on the inline start; the arrow between them mirrors', 'حقل البداية عند بداية السطر والسهم بينهما ينعكس', 'p0', 'separator', '', N.mirrorIcon],
    ['presets-fiscal', 'Presets for fiscal periods and Hijri months', 'اختصارات للفترات المالية والشهور الهجرية', 'p1', '', '', ['opp', '"This Hijri month" and "this tax period" are presets no library ships; the tax period depends on the country', '«هذا الشهر الهجري» و«هذه الفترة الضريبية» اختصارات لا تقدمها أي مكتبة، والفترة الضريبية تعتمد على الدولة']],
    ['range-text', 'Range text as one isolated run', 'نص المجال كمقطع معزول واحد', 'p0', '', '', ['risk', 'Two dates joined by a dash reorder in RTL unless the whole range is isolated', 'تاريخان بينهما شرطة يتغير ترتيبهما في RTL ما لم يُعزل المجال كله']],
    ['limits', 'Minimum and maximum span', 'أقل وأقصى مدة', 'p1', 'allowSingleDateInRange|disabledDate|isDateUnavailable', ''],
  ],
  n: 'MUI ships DateRangePicker only in the commercial @mui/x-date-pickers-pro package, which was not surveyed.',
})

C('time-picker', 'Time picker', 'منتقي الوقت', 'date-time', 'T4', 'p1', {
  s: ['Picks a time of day by segments or from lists.', 'يختار وقتًا من اليوم بالمقاطع أو من قوائم.'],
  e: 'time segmented-input overlay-layers anchored-position field', a: 'root field segment trigger popup column option', d: 'field popover',
  al: { antd: 'TimePicker', 'mui-x': 'TimePicker DesktopTimePicker MobileTimePicker StaticTimePicker TimeField DigitalClock MultiSectionDigitalClock TimeClock', mantine: 'TimePicker TimeInput TimeGrid', 'react-aria': 'TimeField' },
  sc: { antd: 'picker', 'mui-x': 'pkg:@mui/x-date-pickers', mantine: 'pkg:@mantine/dates' },
  seed: 'time-picker',
  sp: { format: 'use12Hours|ampm|hourCycle|format', steps: 'hourStep|minuteStep|minutesStep|timeSteps', range: 'RangePicker', 'disabled-time': 'disabledTime|shouldDisableTime|minTime|min|minValue' },
  sa: { 'ampm-ar': ['opp', 'The day period shows ص / م and the segments take Arabic digits, as in the date picker', 'فترة اليوم تُعرض ص / م والمقاطع تقبل الأرقام العربية كما في منتقي التاريخ'] },
  f: [['segment-order', 'Hour:minute order is fixed LTR, day period follows the locale', 'ترتيب الساعة والدقيقة ثابت LTR وفترة اليوم تتبع اللغة', 'p0', '', '', ['risk', 'In an RTL field the colon-separated time must stay hour-first while the day period sits where the Arabic pattern puts it', 'في حقل RTL يبقى الوقت المفصول بنقطتين بادئًا بالساعة، وتقع فترة اليوم حيث يضعها النمط العربي']]],
})

C('date-time-picker', 'Date-time picker', 'منتقي التاريخ والوقت', 'date-time', 'T4', 'p1', {
  s: ['Picks a date and a time together.', 'يختار تاريخًا ووقتًا معًا.'],
  e: 'calendar-grid time segmented-input overlay-layers anchored-position field', a: 'root field trigger popup calendar time', d: 'date-picker time-picker',
  al: { antd: 'DatePicker', 'mui-x': 'DateTimePicker DesktopDateTimePicker MobileDateTimePicker StaticDateTimePicker', mantine: 'DateTimePicker InlineDateTimePicker', 'react-aria': 'DatePicker' },
  an: { 'antd:DatePicker': 'showTime', 'react-aria:DatePicker': 'granularity of minutes or seconds' },
  sc: { antd: 'picker', 'mui-x': 'pkg:@mui/x-date-pickers', mantine: 'pkg:@mantine/dates' },
  seed: 'date-picker:time', sp: { time: 'showTime|granularity|withSeconds|views' },
  f: [['zone', 'Stored with an offset, shown in the user zone', 'يُخزَّن بفارق التوقيت ويُعرض بمنطقة المستخدم', 'p1', 'timezone|timeZone|hideTimeZone', '']],
})

C('hijri-date-picker', 'Hijri date picker', 'منتقي التاريخ الهجري', 'date-time', 'T4', 'p0', {
  s: ['Date picker whose field and grid are in a Hijri calendar, storing the Gregorian ISO date.', 'منتقي تاريخ حقله وشبكته بتقويم هجري مع تخزين التاريخ الميلادي بصيغة ISO.'],
  e: 'calendar-grid segmented-input overlay-layers anchored-position field', a: 'root field trigger popup calendar gregorian-hint', d: 'date-picker',
  f: [
    ['umm-al-qura', 'Umm al-Qura with its supported year range stated', 'أم القرى مع بيان مجال السنوات المدعوم', 'p0', '', '', ['req', 'Umm al-Qura is a table, not a formula; dates outside the table fall back to a calculated calendar and the field says so', 'تقويم أم القرى جدول لا معادلة، والتواريخ خارجه تعود إلى تقويم حسابي ويبيّن الحقل ذلك']],
    ['variants', 'Civil and tabular variants selectable', 'إتاحة الصيغتين المدنية والحسابية', 'p1', '', '', ['req', 'Countries that do not follow Umm al-Qura need the civil or tabular variant, and sighting-based adjustment by ±1 or ±2 days', 'الدول التي لا تتبع أم القرى تحتاج الصيغة المدنية أو الحسابية، وتعديل الرؤية بيوم أو يومين']],
    ['month-names', 'Hijri month names with full and short forms', 'أسماء الشهور الهجرية بصيغتيها الكاملة والمختصرة', 'p0', '', '', ['req', 'Names come from CLDR for the islamic calendars, in the scope language', 'الأسماء تأتي من CLDR للتقاويم الإسلامية بلغة النطاق']],
    ['month-length', '29 or 30 day months from the calendar data', 'شهور من ٢٩ أو ٣٠ يومًا من بيانات التقويم', 'p0', '', ''],
    ['gregorian-hint', 'Gregorian equivalent shown beside the value', 'المقابل الميلادي يُعرض بجوار القيمة', 'p1', '', ''],
    ['adjustment', 'Day adjustment setting', 'إعداد تعديل الأيام', 'p2', '', ''],
  ],
  dec: [['scope', 'Ours alone as a component. Libraries reach Hijri through adapters rather than a component: MUI X ships AdapterMomentHijri (a date adapter subpath, not a root export), and React Aria through the calendar systems of @internationalized/date. Neither is recorded as an alias.']],
})

C('dual-calendar-date-picker', 'Dual-calendar date picker', 'منتقي تاريخ بتقويمين', 'date-time', 'T4', 'p0', {
  s: ['One date shown and editable in Gregorian and Hijri at once, switching the primary calendar in place.', 'تاريخ واحد يُعرض ويُحرَّر بالميلادي والهجري معًا مع تبديل التقويم الأساسي في مكانه.'],
  e: 'calendar-grid segmented-input overlay-layers anchored-position field', a: 'root field calendar-toggle trigger popup calendar secondary-date', d: 'date-picker hijri-date-picker',
  f: [
    ['toggle', 'Switch primary calendar without losing the value', 'تبديل التقويم الأساسي دون فقد القيمة', 'p0', '', '', N.calendar],
    ['both-shown', 'Both dates always visible', 'التاريخان ظاهران دائمًا', 'p0', '', '', ['req', 'Official documents in Saudi Arabia carry both dates; the secondary date is text, not a second control', 'الوثائق الرسمية في السعودية تحمل التاريخين، والتاريخ الثانوي نص لا عنصر تحكم ثانٍ']],
    ['cell-secondary', 'Secondary day number in each grid cell', 'رقم اليوم الثانوي في كل خلية', 'p1', '', ''],
    ['single-value', 'One stored value (ISO Gregorian)', 'قيمة مخزنة واحدة (ميلادية ISO)', 'p0', '', ''],
  ],
  dec: [['scope', 'Ours alone; no surveyed library shows two calendar systems in one control.']],
})

C('date-text', 'Date text', 'نص تاريخ', 'date-time', 'T2', 'p1', {
  s: ['Formats a stored date for reading: calendar, numerals, relative time.', 'ينسّق تاريخًا مخزنًا للقراءة: التقويم والأرقام والوقت النسبي.'],
  e: 'none', a: 'root',
  f: [
    ['calendar', 'In the scope calendar, optionally with the other in brackets', 'بتقويم النطاق مع الآخر بين قوسين عند الطلب', 'p0', '', '', N.calendar],
    ['relative', 'Relative time with Arabic dual and plural forms', 'وقت نسبي بصيغ المثنى والجمع العربية', 'p1', '', '', ['req', '"منذ يومين", "منذ ٣ أيام", "منذ ١١ يومًا" need the two, few and many forms', 'عبارات مثل «منذ يومين» و«منذ ٣ أيام» و«منذ ١١ يومًا» تحتاج صيغ المثنى والقليل والكثير']],
    ['machine', 'Machine-readable datetime attribute', 'سمة datetime مقروءة آليًا', 'p1', '', ''],
    ['isolated', 'Isolated so separators do not reorder', 'معزول فلا يتغير ترتيب الفواصل', 'p0', '', '', N.ltrValue],
  ],
  dec: [['scope', 'Ours alone; libraries leave date display to Intl or a date library.']],
})

// ── tables ──────────────────────────────────────────────────────────────────────────────────────────────────
const TS = 'tanstack-table'
C('data-table', 'Data table', 'جدول بيانات', 'data', 'T4', 'p0', {
  s: ['Rows and columns of records to read: sort, filter, page, select, pin, total.', 'صفوف وأعمدة من السجلات للقراءة: فرز وتصفية وترقيم وتحديد وتثبيت وإجمالي.'],
  e: 'table-model collection selection grid-navigation pagination virtual-list resize', a: 'root toolbar header header-cell sort-indicator filter-trigger body row cell selection-cell expand-cell footer summary pagination empty loading', d: 'checkbox pagination menu scroll-area empty-state skeleton',
  al: { antd: 'Table', 'antd-pro': 'ProTable DragSortTable ListToolBar TableDropdown', mui: 'Table TableSortLabel', 'mui-x': 'DataGrid QuickFilter ExportCsv ExportPrint ColumnsPanelTrigger FilterPanelTrigger', mantine: 'Table', chakra: 'Table', 'react-aria': 'Table Column Row Cell ResizableTableContainer', 'ag-grid': 'createGrid', [TS]: 'constructTable', shadcn: 'table' },
  an: { 'mui:Table': 'markup only; behaviour lives in MUI X', 'tanstack-table:constructTable': 'headless model', 'shadcn:table': 'markup only; the documented data table combines it with TanStack Table' },
  sc: { 'antd-pro': 'pkg:@ant-design/pro-table', 'mui-x': 'pkg:@mui/x-data-grid', 'ag-grid': 'pkg:ag-grid-community', [TS]: 'pkg:@tanstack/table-core' },
  seed: 'table', drop: 'edit-cell edit-row', notAntd: 'keyboard',
  sp: {
    columns: 'columns|columnDefs', 'row-key': 'rowKey|getRowId', render: 'antd:render|antd-pro:render|renderCell|cellRenderer|tanstack-table:cell', align: 'antd:align|mui:align|mui-x:align|headerAlign|textAlign|cellStyle', width: 'width|minWidth|tanstack-table:size', empty: 'noRowsOverlay|emptyText|renderEmptyState|noRowsOverlayComponent', 'scroll-x': 'scroll|autoHeight|domLayout', 'scroll-y': 'scroll|stickyHeader|maxHeight', 'fixed-header': 'sticky|stickyHeader|scroll', responsive: 'responsive', 'title-caption': 'antd:title|headerTitle|caption|captionSide', 'row-hover': 'highlightOnHover|hover|interactive|suppressRowHoverHighlight', 'row-selected': 'selected|rowSelectionModel|isSelected', nowrap: 'ellipsis|noWrap|wrapText',
    'sort-single': 'sorter|sortable|enableSorting|allowsSorting|sortModel', 'sort-multi': 'antd:multiple|antd-pro:multiple|enableMultiSort|multiSortKey|disableMultipleColumnsSorting', 'sorter-custom': 'sortDirections|sortComparator|comparator|sortingFn|sortFn|sortingOrder', 'sort-controlled': 'sortOrder|sortModel|sortDescriptor|onSortingChange',
    'filter-dropdown': 'filters|filterable|enableColumnFilter|enableColumnFilters|ag-grid:filter', 'filter-custom': 'filterDropdown|filterOperators|filterFn|filterParams', 'filter-controlled': 'filteredValue|filterModel|onColumnFiltersChange', 'filter-search': 'filterSearch|quickFilterText|globalFilterFn|QuickFilter',
    'pagination-client': 'pagination|paginationModel|getPaginatedRowModel|createPaginatedRowModel', 'pagination-server': 'paginationMode|manualPagination|antd-pro:request|rowCount',
    'selection-checkbox': 'rowSelection|checkboxSelection|selectionMode|enableRowSelection', 'selection-radio': 'antd:type|antd-pro:type|disableMultipleRowSelection|enableMultiRowSelection|react-aria:selectionMode|ag-grid:mode', 'select-all': 'selections|headerCheckbox|selectAll|getToggleAllRowsSelectedHandler|checkboxSelectionVisibleOnly', 'selection-disabled': 'getCheckboxProps|isRowSelectable|disabledKeys|enableRowSelection', 'selection-preserve': 'preserveSelectedRowKeys|keepNonExistentRowsSelected',
    expandable: 'expandable|getRowCanExpand|masterDetail|expandedRowRender', 'tree-data': 'childrenColumnName|getSubRows|treeData', 'fixed-start': 'fixed|pinned|pinnedColumns|columnPinning|enableColumnPinning', 'fixed-end': 'fixed|pinned|pinnedColumns|columnPinning|enableColumnPinning', virtual: 'virtual|rowBuffer|disableVirtualization|rowVirtualisation|suppressRowVirtualisation',
    resize: 'resizable|enableResizing|allowsResizing|onColumnWidthChange', grouping: 'antd:children|ag-grid:children|columnGroupingModel|headerGroups|getHeaderGroups|ColumnGroup', summary: 'summary|pinnedBottomRowData|aggregationFn|tanstack-table:footer', 'on-row': 'onRow|onRowClick|onRowAction|onRowClicked', loading: 'loading|isLoading|loadingOverlay', 'sticky-offset': 'sticky|offsetHeader', ellipsis: 'ellipsis|tooltipField|showTooltip', 'row-class': 'rowClassName|getRowClassName|getRowClass|rowClassRules', 'size-bordered': 'bordered|density|withTableBorder|showColumnBorders|striped|antd:size|mui:size|chakra:size',
    'drag-sort': 'rowDrag|rowReordering|dragAndDropHooks|dragSortKey', 'col-settings': 'columnsState|columnVisibilityModel|columnVisibility|hide|options', density: 'density|antd:size|mui:size|chakra:size|verticalSpacing', export: 'ExportCsv|csvOptions|exportDataAsCsv|getDataAsCsv', keyboard: 'cellFocused|navigateToNextCell|keyboardNavigationBehavior|focusMode|cellNavigation', rtl: 'enableRtl|columnResizeDirection|antd:direction|isRtl',
  },
  so: { keyboard: 'react-aria ag-grid mui-x', 'col-settings': 'antd-pro', density: 'antd-pro' },
  sa: {
    'filter-search': ['req', 'Filters are Arabic-tolerant (hamza forms, diacritics) and match phones by digits in any numeral system', 'التصفية متسامحة مع العربية (أشكال الهمزة والتشكيل) وتطابق الهواتف بالأرقام بأي نظام أرقام'],
    'fixed-start': ['req', 'Pinning uses logical offsets: the same columns pin to the right in Arabic and to the left in English with no configuration, and stay pinned while scrolling in both directions', 'التثبيت بإزاحات منطقية: الأعمدة نفسها تُثبَّت يمينًا في العربية ويسارًا في الإنجليزية دون إعداد، وتبقى مثبتة عند التمرير في الاتجاهين'],
    summary: ['req', 'Totals cover all filtered rows, money is exact in minor units and shown in the scope numerals', 'الإجماليات تشمل كل الصفوف المصفّاة، والمبالغ دقيقة بالوحدات الصغرى ومعروضة بنظام أرقام النطاق'],
  },
  f: [
    // column model
    ['col-types', 'Column types: text, number, money, date, boolean, enum, actions', 'أنواع الأعمدة: نص، رقم، مبلغ، تاريخ، منطقي، قائمة، إجراءات', 'p0', 'valueType|cellDataType|mui-x:type|ag-grid:type|tanstack-table:meta', '', ['req', 'Type decides alignment and formatting: numbers and money align to the inline end with tabular digits, dates use the scope calendar, text takes its own direction', 'النوع يحدد المحاذاة والتنسيق: الأرقام والمبالغ تُحاذى إلى نهاية السطر بأرقام متساوية العرض، والتواريخ بتقويم النطاق، والنص يأخذ اتجاهه']],
    ['value-getter', 'Value getter and formatter per column', 'دالة قيمة ودالة تنسيق لكل عمود', 'p0', 'valueGetter|accessorFn|valueFormatter', ''],
    ['col-order', 'Column reorder by drag', 'إعادة ترتيب الأعمدة بالسحب', 'p1', 'columnOrder|disableColumnReorder|suppressMovable|onColumnOrderChange', '', ['risk', 'Drag offsets and the drop indicator are computed from the inline start; pinned regions swap sides in RTL', 'إزاحات السحب ومؤشر الإفلات تُحسب من بداية السطر، ومناطق التثبيت تتبادل الجهتين في RTL']],
    ['col-autosize', 'Auto-size columns to content', 'ضبط عرض الأعمدة تلقائيًا بحسب المحتوى', 'p1', 'autosizeOptions|autoSizeStrategy|autoSizeColumns', '', ['risk', 'Width measured with a Latin sample under-sizes Arabic text set in a wider face', 'العرض المقيس بعينة لاتينية يقصّر عن النص العربي المكتوب بخط أعرض']],
    ['col-flex', 'Flexible column widths', 'عرض أعمدة مرن', 'p1', 'flex', ''],
    ['col-menu', 'Column header menu', 'قائمة رأس العمود', 'p1', 'disableColumnMenu|suppressHeaderMenuButton|GridColumnMenu|mainMenuItems', ''],
    ['col-span', 'Column and row spanning', 'دمج الأعمدة والصفوف', 'p2', 'colSpan|rowSpan|onCell|rowSpanning|spanRows|cellSpanningFeature', ''],
    ['header-tooltip', 'Header description tooltip', 'تلميح وصف رأس العمود', 'p2', 'tooltip|description|headerTooltip', ''],
    // sorting and filtering
    ['sort-collation', 'Locale-aware collation', 'ترتيب أبجدي بحسب اللغة', 'p0', '', '', ['req', 'Arabic sort uses the locale collator: the definite article and hamza forms do not scatter names, and Arabic and Latin names sort in a stated order', 'الفرز العربي يستخدم مُرتِّب اللغة: «ال» وأشكال الهمزة لا تبعثر الأسماء، وترتيب الأسماء العربية واللاتينية محدد وصريح']],
    ['sort-server', 'Server-side sorting', 'فرز من الخادم', 'p0', 'sortingMode|manualSorting', 'antd'],
    ['filter-operators', 'Filter operators per type (contains, between, is empty)', 'معاملات تصفية بحسب النوع (يحتوي، بين، فارغ)', 'p1', 'filterOperators|filterFn|filterOptions|filterFns', '', N.strings],
    ['filter-panel', 'Filter builder with AND / OR', 'باني تصفية بـ«و» و«أو»', 'p1', 'logicOperators|GridFilterPanel|filterModel|joinOperator', ''],
    ['filter-row', 'Filter row under the header', 'صف تصفية تحت الرأس', 'p2', 'floatingFilter|headerFilters', ''],
    ['filter-server', 'Server-side filtering', 'تصفية من الخادم', 'p0', 'filterMode|manualFiltering|antd-pro:request', ''],
    ['global-search', 'Global search across columns', 'بحث عام في كل الأعمدة', 'p0', 'quickFilterText|globalFilter|QuickFilter|enableGlobalFilter', '', N.search],
    ['facets', 'Faceted counts for filters', 'أعداد لكل قيمة في التصفية', 'p2', 'getFacetedUniqueValues|createFacetedUniqueValues|columnFacetingFeature', ''],
    ['query-form', 'Query form above the table', 'نموذج استعلام فوق الجدول', 'p1', 'antd-pro:search|QueryFilter|LightFilter', ''],
    // rows
    ['row-height', 'Row height: fixed, auto, density', 'ارتفاع الصف: ثابت، تلقائي، بحسب الكثافة', 'p1', 'getRowHeight|rowHeight|autoHeight', '', N.tashkeel],
    ['row-pin', 'Pinned rows (top / bottom)', 'صفوف مثبتة (أعلى وأسفل)', 'p2', 'pinnedTopRowData|pinnedRows|rowPinning|enableRowPinning', ''],
    ['row-actions', 'Row actions column', 'عمود إجراءات الصف', 'p0', 'GridActionsCell|getActions|option|valueType', '', ['req', 'The actions column pins to the inline end, which is the left edge in Arabic', 'عمود الإجراءات يُثبَّت عند نهاية السطر، وهي الحافة اليسرى في العربية']],
    ['row-number', 'Row number column', 'عمود رقم الصف', 'p2', 'rowNumbers|IndexColumn|indexBorder|isRowNumberCol', '', N.numerals],
    ['zebra', 'Striped rows', 'صفوف مخططة', 'p2', 'striped|getRowClassName|rowClassRules', ''],
    ['infinite', 'Infinite loading', 'تحميل لا نهائي', 'p1', 'onRowsScrollEnd|InfiniteRowModelModule|onLoadMore|loadMore', ''],
    // state
    ['saved-views', 'Saved views (columns, filters, sort)', 'عروض محفوظة (أعمدة، تصفية، فرز)', 'p1', 'initialState|columnsState|GridStateModule|getState|exportState', ''],
    ['url-state', 'State synchronised with the URL', 'مزامنة الحالة مع الرابط', 'p2', 'syncToUrl', ''],
    ['controlled-state', 'Every piece of state controllable', 'كل جزء من الحالة قابل للتحكم', 'p0', 'onStateChange|tanstack-table:state|onSortModelChange|antd:onChange|react-aria:onSortChange', ''],
    // output
    ['print', 'Print layout', 'تخطيط الطباعة', 'p1', 'ExportPrint|printOptions|domLayout', '', ['req', 'Printed tables repeat the header, keep RTL column order and print totals in the scope numerals', 'الجداول المطبوعة تكرر الرأس وتحافظ على ترتيب أعمدة RTL وتطبع الإجماليات بنظام أرقام النطاق']],
    ['export-csv', 'CSV export with a BOM and stored (not displayed) values', 'تصدير CSV مع BOM وبالقيم المخزنة لا المعروضة', 'p1', 'ExportCsv|csvOptions|exportDataAsCsv|getDataAsCsv', '', ['risk', 'Excel opens UTF-8 CSV as mojibake without a BOM; exported numbers must be Latin digits so spreadsheets read them as numbers', 'Excel يفتح CSV بترميز UTF-8 بحروف مشوّهة دون BOM، والأرقام المصدَّرة يجب أن تكون لاتينية لتقرأها الجداول كأرقام']],
    ['copy', 'Copy selected rows or cells', 'نسخ الصفوف أو الخلايا المحددة', 'p2', 'ignoreValueFormatterDuringExport|copyable|clipboardCopyCellDelimiter|enableCellTextSelection', ''],
    // layout and a11y
    ['toolbar', 'Toolbar with title, search, actions', 'شريط أدوات بعنوان وبحث وإجراءات', 'p1', 'toolBarRender|toolbar|showToolbar|headerTitle|Toolbar', ''],
    ['bulk-actions', 'Bulk action bar for the selection', 'شريط إجراءات جماعية للتحديد', 'p1', 'tableAlertRender|tableAlertOptionRender', '', N.strings],
    ['card-mode', 'Card layout on narrow screens', 'عرض بطاقات في الشاشات الضيقة', 'p1', 'cardProps|cardBordered', ''],
    ['scroll-shadow', 'Edge shadows show hidden columns', 'ظلال الحواف تبيّن الأعمدة المخفية', 'p2', '', '', ['risk', 'Shadow sides and the scroll origin swap in RTL; computing them from scrollLeft needs the RTL sign convention', 'جهتا الظل وأصل التمرير تتبادلان في RTL، وحسابهما من scrollLeft يحتاج اصطلاح الإشارة الخاص بـRTL']],
    ['aria-grid', 'Table or grid semantics with announced sort and selection', 'دلالات جدول أو شبكة مع إعلان الفرز والتحديد', 'p0', 'aria-label|ariaLabel|getRowAriaLabel|localeText', '', N.strings],
    ['locale-text', 'All built-in strings replaceable per locale', 'كل النصوص الداخلية قابلة للاستبدال لكل لغة', 'p0', 'localeText|locale|getLocaleText|intl', '', N.strings],
    ['cell-direction', 'Text cells take the direction of their content', 'خلايا النص تأخذ اتجاه محتواها', 'p0', '', '', N.mixed],
    ['money-cells', 'Money cells: minor units, currency once in the header', 'خلايا المبالغ: وحدات صغرى والعملة مرة واحدة في الرأس', 'p0', '', '', ['req', 'Amounts are stored as integer minor units, shown with the decimals of the currency, and a mixed-currency column says so per row', 'المبالغ تُخزَّن وحدات صغرى صحيحة وتُعرض بخانات العملة العشرية، والعمود المتعدد العملات يبيّن العملة في كل صف']],
    ['server-data', 'Data source protocol (request with page, sort, filter)', 'بروتوكول مصدر البيانات (طلب بالصفحة والفرز والتصفية)', 'p0', 'antd-pro:request|mui-x:dataSource|ag-grid:datasource', ''],
  ],
  dec: [
    ['merge', 'AntD Table, ProTable, MUI Table, Mantine/Chakra/shadcn Table, React Aria Table and the read-side of the grid libraries are one entry. ProTable is an alias, not a pattern of its own: its search form, toolbar, column settings and density are features here.'],
    ['split', 'Editing, range selection, clipboard, grouping, aggregation and pivoting are in data-grid; a table that only shows records should not carry them.'],
    ['scope', 'AG Grid Enterprise and MUI X Pro/Premium are commercial packages and were not unpacked; a feature they alone ship shows no `in` for them.'],
  ],
})

C('data-grid', 'Data grid', 'شبكة بيانات', 'data', 'T5', 'p1', {
  s: ['A spreadsheet-like table: cell focus, editing, ranges, grouping and both-axis virtualisation.', 'جدول شبيه بجداول البيانات: تركيز الخلايا وتحريرها والمجالات والتجميع والعرض الافتراضي في المحورين.'],
  e: 'table-model grid-navigation selection virtual-list resize drag-sort form', a: 'root header body row cell editor group-row aggregation-row fill-handle overlay status-bar', d: 'data-table text-field number-input select date-picker checkbox',
  al: { 'antd-pro': 'EditableProTable CellEditorTable RowEditorTable', 'mui-x': 'DataGrid', 'ag-grid': 'createGrid', [TS]: 'constructTable' },
  an: { 'tanstack-table:constructTable': 'headless model; editing is left to the application' },
  sc: { 'antd-pro': 'pkg:@ant-design/pro-table', 'mui-x': 'pkg:@mui/x-data-grid', 'ag-grid': 'pkg:ag-grid-community', [TS]: 'pkg:@tanstack/table-core' },
  seed: 'table:edit-cell,edit-row',
  sp: { 'edit-cell': 'editable|cellEditor|processRowUpdate|editMode', 'edit-row': 'editMode|editType|rowModesModel|editableKeys' },
  f: [
    ['cell-focus', 'Cell focus with arrow, Home/End, Page keys', 'تركيز الخلايا بالأسهم و Home/End و Page', 'p0', 'navigateToNextCell|cellFocused|tabNavigation|suppressCellFocus', '', N.arrows],
    ['editors', 'Editors by column type', 'محررات بحسب نوع العمود', 'p0', 'cellEditor|renderEditCell|valueType|agSelectCellEditor', '', ['req', 'Number, money and date editors are the same Arabic-aware inputs used in forms (any digit system, Arabic separators, dual calendar)', 'محررات الأرقام والمبالغ والتواريخ هي حقول النماذج نفسها المراعية للعربية (أي نظام أرقام، فواصل عربية، تقويمان)']],
    ['type-to-edit', 'Typing starts editing and replaces the value', 'الكتابة تبدأ التحرير وتستبدل القيمة', 'p1', 'singleClickEdit|cellEditable|isCellEditable', '', ['risk', 'The first keystroke must not be lost under an Arabic input method; composition events start the edit, not keydown', 'ضغطة المفتاح الأولى يجب ألا تضيع مع وسائل الإدخال العربية، فأحداث التركيب هي التي تبدأ التحرير لا keydown']],
    ['validation', 'Cell and row validation with messages', 'تحقق من الخلية والصف مع رسائل', 'p0', 'preProcessEditCellProps|formItemProps|invalidEditValueMode|getValidationErrors', '', N.strings],
    ['commit', 'Commit on Enter / Tab, cancel on Escape, async save', 'التثبيت بـEnter و Tab والإلغاء بـEscape وحفظ غير متزامن', 'p0', 'processRowUpdate|onCellValueChanged|onSave|stopEditingWhenCellsLoseFocus', ''],
    ['tab-order', 'Tab moves in reading order', 'Tab ينتقل بترتيب القراءة', 'p0', 'tabToNextCell|tabNavigation', '', ['req', 'In RTL Tab moves from the right-most column leftwards', 'في RTL ينتقل Tab من العمود الأيمن إلى اليسار']],
    ['undo', 'Undo and redo', 'تراجع وإعادة', 'p2', 'undoRedoCellEditing|UndoRedoEditModule', ''],
    ['range', 'Cell range selection', 'تحديد مجال من الخلايا', 'p2', 'cellSelection|cellSelectionFeature|CellRangeType', '', ['risk', 'Shift+Arrow extends the range in the visual direction; range rectangles are drawn from the inline start', 'Shift مع السهم يمدّ المجال في الاتجاه البصري، ومستطيلات المجال تُرسم من بداية السطر']],
    ['clipboard', 'Copy and paste cells (spreadsheet interchange)', 'نسخ الخلايا ولصقها (تبادل مع جداول البيانات)', 'p1', 'clipboardCopyCellDelimiter|ignoreValueFormatterDuringExport|processCellForClipboard', '', ['req', 'Pasted numbers may arrive with Arabic-Indic digits and Arabic separators; copied numbers leave as plain Latin digits', 'الأرقام الملصقة قد تأتي بأرقام هندية وفواصل عربية، والأرقام المنسوخة تخرج لاتينية صِرفة']],
    ['fill', 'Fill handle', 'مقبض التعبئة', 'p2', 'cellSelection|fillHandle', ''],
    ['grouping', 'Row grouping with expandable groups', 'تجميع الصفوف بمجموعات قابلة للتوسيع', 'p1', 'rowGroupingModel|enableGrouping|getGroupedRowModel|createGroupedRowModel|columnGroupingFeature|rowGroup', '', N.strings],
    ['aggregation', 'Aggregation (sum, average, count) per group and total', 'تجميع القيم (مجموع، متوسط، عدد) لكل مجموعة وللإجمالي', 'p1', 'aggregationFn|aggregationFns|aggFunc|rowAggregationFeature', '', ['req', 'Money aggregates stay in integer minor units; an average is rounded by the currency rule and labelled as rounded', 'مجاميع المبالغ تبقى وحدات صغرى صحيحة، والمتوسط يُقرَّب بقاعدة العملة ويُبيَّن أنه مقرَّب']],
    ['pivot', 'Pivoting', 'جداول محورية', 'p2', 'pivot|pivotMode', ''],
    ['col-virtual', 'Column virtualisation', 'عرض افتراضي للأعمدة', 'p1', 'columnBuffer|columnBufferPx|suppressColumnVirtualisation|disableVirtualization', '', ['risk', 'Column windows are computed from the inline start; RTL scroll offsets are negative', 'نوافذ الأعمدة تُحسب من بداية السطر، وإزاحات التمرير في RTL سالبة']],
    ['row-virtual', 'Row virtualisation with variable heights', 'عرض افتراضي للصفوف بارتفاعات متغيرة', 'p0', 'rowBuffer|rowBufferPx|getRowHeight|suppressRowVirtualisation', ''],
    ['server-rows', 'Server-side row model (lazy blocks)', 'نموذج صفوف من الخادم (كتل عند الطلب)', 'p1', 'InfiniteRowModelModule|rowModelType|mui-x:dataSource|ag-grid:datasource', ''],
    ['transactions', 'Streaming updates with change flash', 'تحديثات متدفقة مع وميض التغيير', 'p2', 'applyTransaction|HighlightChangesModule|enableCellChangeFlash|updateRows', ''],
    ['master-detail', 'Master–detail rows', 'صفوف رئيسية وتفصيلية', 'p2', 'masterDetail|getDetailPanelContent|getRowCanExpand|expandedRowRender', ''],
    ['add-row', 'Add a row inline', 'إضافة صف في مكانه', 'p1', 'recordCreatorProps|applyTransaction|updateRows', ''],
    ['formulas', 'Calculated columns', 'أعمدة محسوبة', 'p2', 'valueGetter|accessorFn', ''],
    ['line-items', 'Line-items preset (quantity × price, tax, total)', 'نمط بنود الفاتورة (كمية × سعر، ضريبة، إجمالي)', 'p1', '', '', ['opp', 'Invoice line editing is the most common grid in Arabic business software: rounding per line or per document follows the tax authority\'s rule', 'تحرير بنود الفاتورة أكثر الشبكات شيوعًا في برامج الأعمال العربية، والتقريب لكل بند أو لكل مستند يتبع قاعدة الجهة الضريبية']],
  ],
  dec: [['split', 'Warranted as its own entry: the features here need cell focus, editors or a second virtualisation axis that a read-only table never loads. It depends on data-table for the column, sort, filter and selection model.']],
})
