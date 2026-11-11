import { C, N, P } from './_dsl.mjs'

// ── overlays ────────────────────────────────────────────────────────────────────────────────────────────────
C('tooltip', 'Tooltip', 'تلميح', 'overlay', 'T2', 'p0', {
  s: ['A short label shown on hover and focus.', 'عنوان قصير يظهر عند المرور والتركيز.'],
  e: 'tooltip overlay-layers anchored-position', a: 'trigger popup arrow', d: 'portal',
  al: { antd: 'Tooltip', mui: 'Tooltip', mantine: 'Tooltip', chakra: 'Tooltip', 'react-aria': 'Tooltip TooltipTrigger', 'base-ui': 'Tooltip', radix: 'Tooltip', shadcn: 'tooltip' },
  seed: 'tooltip',
  sp: { placement: P.placement, arrow: P.arrow, color: 'color', controlled: P.open },
  so: { basic: 'mui mantine chakra react-aria base-ui radix shadcn' },
  sa: { rtl: N.placement },
  f: [
    ['delay-group', 'Shared delay across neighbours', 'مهلة مشتركة بين العناصر المتجاورة', 'p1', 'delayDuration|skipDelayDuration|delay|closeDelay|enterDelay|mouseEnterDelay|openDelay', ''],
    ['touch', 'Long-press on touch', 'ضغط مطوّل في اللمس', 'p2', 'enterTouchDelay|events|trigger', ''],
  ],
})

C('popover', 'Popover', 'نافذة منبثقة', 'overlay', 'T2', 'p0', {
  s: ['Non-modal content anchored to a trigger.', 'محتوى غير حاجب مثبت عند عنصر مشغِّل.'],
  e: 'overlay-layers anchored-position focus-scope disclosure', a: 'trigger popup arrow title close', d: 'portal',
  al: { antd: 'Popover', mui: 'Popover Popper', mantine: 'Popover', chakra: 'Popover', 'react-aria': 'Popover', 'base-ui': 'Popover', radix: 'Popover', 'headless-ui': 'Popover', shadcn: 'popover' },
  an: { 'mui:Popper': 'positioning only' },
  seed: 'popover',
  sp: { trigger: 'trigger|openOnHover', placement: P.placement, controlled: P.open },
  sa: { rtl: ['risk', 'A placement called left must mean start, and collision flipping has to work from the mirrored side', 'الموضع المسمى left يجب أن يعني البداية، وقلب الموضع عند الاصطدام يجب أن يعمل من الجهة المعكوسة'] },
  f: [
    ['collision', 'Flip and shift on collision', 'القلب والإزاحة عند الاصطدام', 'p0', 'collisionPadding|avoidCollisions|flip|shouldFlip|middlewares|collisionAvoidance|autoAdjustOverflow', ''],
    ['dismiss', 'Outside press and Escape', 'الإغلاق بالنقر خارجًا و Escape', 'p0', 'onInteractOutside|closeOnClickOutside|closeOnInteractOutside|isDismissable|onClose|closeOnEscape', ''],
    ['focus', 'Focus moves in and returns', 'التركيز يدخل ثم يعود', 'p0', 'trapFocus|returnFocus|initialFocus|onOpenAutoFocus|autoFocus|finalFocus|focus', ''],
    ['arrow', 'Arrow', 'سهم', 'p2', P.arrow, ''],
  ],
})

C('hover-card', 'Hover card', 'بطاقة مرور', 'overlay', 'T3', 'p2', {
  s: ['Rich preview shown when a link is hovered or focused.', 'معاينة غنية تظهر عند المرور على رابط أو تركيزه.'],
  e: 'tooltip overlay-layers anchored-position', a: 'trigger popup arrow', d: 'popover',
  al: { mantine: 'HoverCard', chakra: 'HoverCard', 'base-ui': 'PreviewCard', radix: 'HoverCard', shadcn: 'hover-card' },
  f: [
    ['delays', 'Open and close delays', 'مهلتا الفتح والإغلاق', 'p2', 'openDelay|closeDelay|delay', ''],
    ['placement', 'Placement', 'الموضع', 'p2', P.placement, '', N.placement],
  ],
})

C('dialog', 'Dialog', 'حوار', 'overlay', 'T3', 'p0', {
  s: ['A modal window that takes focus until it is closed.', 'نافذة حاجبة تأخذ التركيز حتى تُغلق.'],
  e: 'dialog overlay-layers focus-scope', a: 'trigger backdrop popup title description close footer', d: 'portal focus-scope button',
  al: { antd: 'Modal', mui: 'Dialog Modal Backdrop', mantine: 'Modal Overlay Dialog', chakra: 'Dialog', 'react-aria': 'Dialog DialogTrigger Modal', 'base-ui': 'Dialog', radix: 'Dialog', 'headless-ui': 'Dialog', shadcn: 'dialog' },
  an: { 'mantine:Dialog': 'non-modal fixed panel', 'mui:Modal': 'low-level', 'mui:Backdrop': 'the backdrop part' },
  sc: { antd: 'dialog' },
  seed: 'modal', drop: 'confirm use-modal draggable',
  sp: { controlled: 'open|opened|isOpen', 'mask-closable': 'maskClosable|closeOnClickOutside|closeOnInteractOutside|isDismissable|onInteractOutside|disablePointerDismissal|mask', closable: 'closable|withCloseButton|showCloseButton|closeIcon|CloseTrigger|Close', 'confirm-loading': 'confirmLoading', width: 'antd:width|size|maxWidth|fullWidth', centered: 'centered|placement|scroll', destroy: 'destroyOnHidden|destroyOnClose|keepMounted|unmountOnExit|forceMount', 'after-close': 'afterClose|afterOpenChange|onExitComplete|onOpenChangeComplete|onExitTransitionEnd', 'footer-render': 'footer', escape: 'keyboard|closeOnEscape|isKeyboardDismissDisabled|onEscapeKeyDown|disableEscapeKeyDown', 'focus-trap': 'focusTrap|trapFocus|disableEnforceFocus|focusTriggerAfterClose', nested: 'onNestedOpenChange|nested' },
  so: { 'focus-enter': 'mui mantine chakra react-aria base-ui radix headless-ui shadcn', 'focus-trap': 'radix headless-ui react-aria shadcn base-ui', inert: 'react-aria base-ui radix headless-ui' },
  f: [
    ['close-side', 'Close button at the inline end of the header', 'زر الإغلاق عند نهاية سطر الرأس', 'p0', '', '', N.logical],
    ['footer-order', 'Primary action position in the footer', 'موضع الإجراء الأساسي في التذييل', 'p1', '', '', ['risk', 'Footer button order is a platform habit, not a direction rule: mirroring puts the primary action on the left in Arabic, which must be a deliberate choice', 'ترتيب أزرار التذييل عادة منصة لا قاعدة اتجاه، والانعكاس يضع الإجراء الأساسي يسارًا في العربية فيجب أن يكون اختيارًا مقصودًا']],
    ['draft-guard', 'Escape reverts a field draft before closing', 'Escape يتراجع عن مسودة الحقل قبل الإغلاق', 'p1', '', ''],
    ['scroll-lock', 'Background scroll locked', 'قفل تمرير الخلفية', 'p0', 'lockScroll|disableScrollLock|preventScroll|modal', '', ['risk', 'Compensating for the removed scrollbar with padding-right shifts the page in RTL, where the scrollbar is on the left', 'تعويض شريط التمرير المزال بـpadding-right يزيح الصفحة في RTL حيث الشريط على اليسار']],
    ['fullscreen', 'Full screen on small viewports', 'ملء الشاشة في النوافذ الصغيرة', 'p1', 'fullScreen|size', ''],
  ],
  dec: [['naming', 'dialog (ARIA role and seven libraries) over modal (AntD, Mantine).'], ['split', 'Modal.confirm and useModal rows moved to alert-dialog; the draggable recipe row is dropped.']],
})

C('alert-dialog', 'Alert dialog', 'حوار تأكيد', 'overlay', 'T3', 'p0', {
  s: ['A modal that interrupts to confirm a consequential action.', 'حوار حاجب يقاطع لتأكيد إجراء له عواقب.'],
  e: 'dialog overlay-layers focus-scope', a: 'backdrop popup title description cancel action', d: 'dialog button',
  al: { 'base-ui': 'AlertDialog', radix: 'AlertDialog', shadcn: 'alert-dialog' },
  seed: 'modal:confirm,use-modal', so: { confirm: 'antd', 'use-modal': 'antd' },
  f: [
    ['no-outside-dismiss', 'Not dismissed by outside press', 'لا يُغلق بالنقر خارجه', 'p0', '', 'base-ui radix shadcn'],
    ['cancel-focus', 'Focus starts on the least destructive action', 'التركيز يبدأ على الإجراء الأقل ضررًا', 'p0', '', 'radix shadcn'],
    ['async-action', 'Action stays pending until it resolves', 'الإجراء يبقى منتظرًا حتى ينتهي', 'p1', '', ''],
    ['verb-labels', 'Buttons name the action', 'الأزرار تسمّي الإجراء', 'p1', '', '', ['req', 'Default labels are verbs in Arabic ("حذف", "إلغاء") from the locale scope, never OK / Cancel passed through', 'العناوين الافتراضية أفعال عربية («حذف»، «إلغاء») من نطاق اللغة، لا OK و Cancel كما هي']],
  ],
  n: 'AntD ships this as Modal.confirm and the useModal hook (static methods, not a component export), so it is recorded on the feature rather than as an alias.',
})

C('popconfirm', 'Popconfirm', 'تأكيد منبثق', 'overlay', 'T3', 'p1', {
  s: ['A small anchored confirmation next to the control that asked for it.', 'تأكيد صغير مثبت بجوار العنصر الذي طلبه.'],
  e: 'overlay-layers anchored-position focus-scope', a: 'trigger popup title description cancel action', d: 'popover button',
  al: { antd: 'Popconfirm' },
  seed: 'popconfirm', sp: { async: 'onConfirm|okButtonProps', placement: 'placement', icon: 'icon|okText|cancelText' },
  f: [['placement-rtl', 'Logical placement', 'موضع منطقي', 'p1', '', '', N.placement]],
})

C('drawer', 'Drawer', 'درج', 'overlay', 'T3', 'p0', {
  s: ['A panel that slides in from an edge; from the bottom it is a sheet.', 'لوح ينزلق من إحدى الحواف، ومن الأسفل يكون ورقة سفلية.'],
  e: 'dialog overlay-layers focus-scope', a: 'trigger backdrop popup header title close body footer handle', d: 'dialog',
  al: { antd: 'Drawer', mui: 'Drawer SwipeableDrawer', mantine: 'Drawer', chakra: 'Drawer', 'react-aria': 'Sheet', 'base-ui': 'Drawer', shadcn: 'drawer sheet' },
  seed: 'drawer',
  sp: { sizes: 'size|width', placement: 'placement|anchor|position|side|swipeDirection', push: 'push', extra: 'extra', loading: 'loading', escape: 'keyboard|maskClosable|closeOnEscape|closeOnClickOutside|disablePointerDismissal' },
  so: { focus: 'mui mantine chakra react-aria base-ui shadcn' },
  f: [
    ['logical-edge', 'Edge named start / end', 'الحافة تُسمّى بداية ونهاية', 'p0', 'placement|anchor|position|side|swipeDirection', '', ['risk', 'Libraries name edges left and right; an "end" drawer must be the left edge in Arabic, with its slide and swipe reversed', 'المكتبات تسمّي الحواف يسارًا ويمينًا، ودرج «النهاية» يجب أن يكون الحافة اليسرى في العربية مع عكس الانزلاق والسحب']],
    ['bottom-sheet', 'Bottom sheet with drag to dismiss and snap points', 'ورقة سفلية بالسحب للإغلاق ونقاط توقف', 'p1', 'snapPoints|swipeAreaWidth|disableSwipeToOpen|detents|swipeDirection', ''],
    ['resizable', 'Resizable width', 'عرض قابل للتغيير', 'p2', 'resizable', ''],
  ],
  dec: [['merge', 'Sheet (shadcn side panel, React Aria Sheet) and bottom sheet are the same component with an edge; the owner\'s plan lists "Drawer and Sheet" together.']],
})

C('toast', 'Toast', 'إشعار عابر', 'feedback', 'T3', 'p0', {
  s: ['Brief messages queued in a corner, announced politely.', 'رسائل قصيرة تُصفّ في زاوية وتُعلَن بهدوء.'],
  e: 'toast-queue overlay-layers', a: 'viewport root title description action close progress', d: 'portal icon-button',
  al: { mui: 'Snackbar', mantine: 'Notifications Notification', chakra: 'Toaster Toast', 'react-aria': 'UNSTABLE_Toast', 'base-ui': 'Toast', radix: 'Toast', shadcn: 'sonner toast' },
  an: { 'react-aria:UNSTABLE_Toast': 'unstable export', 'shadcn:toast': 'superseded by sonner' },
  seed: 'notification message:hook,loading,dir',
  sp: { duration: 'duration|autoHideDuration|autoClose|timeout', 'pause-hover': 'pauseOnHover|disableWindowBlurListener|pauseOnPageIdle', close: 'closable|withCloseButton|closeButton|Close', placement: 'placement|position|anchorOrigin', actions: 'actions|action|btn', stack: 'stack|limit|max', progress: 'showProgress' },
  so: { basic: 'antd', types: 'antd', duration: 'antd', 'pause-hover': 'antd', close: 'antd', placement: 'antd', actions: 'antd', stack: 'antd', progress: 'antd', hook: 'antd', loading: 'antd', dir: 'antd' },
  f: [
    ['corner', 'Corner named start / end', 'الزاوية تُسمّى بداية ونهاية', 'p0', '', '', N.placement],
    ['swipe', 'Swipe away toward the nearest edge', 'السحب للإزالة نحو أقرب حافة', 'p1', 'swipeDirection|swipeThreshold', '', ['risk', 'Swipe-to-dismiss direction is physical in Radix and Base UI; it has to follow the corner the toast came from', 'اتجاه السحب للإزالة فيزيائي في Radix و Base UI، ويجب أن يتبع الزاوية التي جاء منها الإشعار']],
    ['promise', 'Promise toast (loading, then result)', 'إشعار وعد (تحميل ثم نتيجة)', 'p1', 'promise', ''],
    ['hotkey', 'Hotkey to focus the region', 'اختصار للانتقال إلى منطقة الإشعارات', 'p2', 'hotkey', ''],
    ['count-text', 'Stack summary with Arabic plural', 'ملخص الرصّة بصيغة الجمع العربية', 'p2', '', '', N.strings],
  ],
  dec: [['merge', 'AntD message and notification, MUI Snackbar and Sonner are one queue with different defaults.'], ['scope', 'AntD message and notification are functions, not components, so AntD is recorded on features and has no alias here.']],
})

C('tour', 'Tour', 'جولة إرشادية', 'overlay', 'T4', 'p2', {
  s: ['Steps that point at parts of the interface one after another.', 'خطوات تشير إلى أجزاء الواجهة واحدًا تلو الآخر.'],
  e: 'overlay-layers anchored-position stepper focus-scope', a: 'mask popup title description indicators prev next close', d: 'popover button',
  al: { antd: 'Tour', mantine: 'Tour' },
  seed: 'tour', sp: { mask: 'mask|withOverlay', placement: 'placement|position', indicators: 'indicatorsRender|type|current' },
  f: [['next-direction', 'Next and previous arrows follow reading direction', 'سهما التالي والسابق يتبعان اتجاه القراءة', 'p1', '', '', N.mirrorIcon]],
})

// ── menus ───────────────────────────────────────────────────────────────────────────────────────────────────
C('menu', 'Menu', 'قائمة إجراءات', 'navigation', 'T2', 'p0', {
  s: ['A list of actions opened from a button, with submenus, checkable items and groups.', 'قائمة إجراءات تُفتح من زر، بقوائم فرعية وعناصر قابلة للتحديد ومجموعات.'],
  e: 'menu collection typeahead roving-focus overlay-layers anchored-position', a: 'trigger popup item group group-label separator checkbox-item radio-item submenu-trigger shortcut arrow', d: 'portal',
  al: { antd: 'Dropdown', mui: 'Menu MenuItem MenuList', mantine: 'Menu', chakra: 'Menu', 'react-aria': 'Menu MenuTrigger SubmenuTrigger', 'base-ui': 'Menu', radix: 'DropdownMenu', 'headless-ui': 'Menu', shadcn: 'dropdown-menu' },
  sc: { antd: 'menu', radix: 'menu' },
  seed: 'dropdown',
  sp: { trigger: 'trigger|openOnHover', placement: P.placement, arrow: P.arrow, button: 'Button', submenu: 'SubMenu|Sub|SubmenuTrigger|SubmenuRoot|TriggerItem' },
  so: { keyboard: 'mui mantine chakra react-aria base-ui radix headless-ui shadcn', menu: 'mui mantine chakra react-aria base-ui radix headless-ui shadcn' },
  f: [
    ['submenu-direction', 'Submenus open toward the inline end; the opening arrow key follows', 'القوائم الفرعية تُفتح نحو نهاية السطر ومفتاح الفتح يتبعها', 'p0', 'dir', '', ['risk', 'In RTL ArrowLeft opens a submenu and ArrowRight closes it; the pointer safe-triangle must mirror too', 'في RTL السهم الأيسر يفتح القائمة الفرعية والأيمن يغلقها، ومثلث الأمان لمؤشر الفأرة ينعكس أيضًا']],
    ['checkable', 'Checkbox and radio items', 'عناصر اختيار متعددة ومفردة', 'p1', 'CheckboxItem|RadioItem|selectionMode|selectable', ''],
    ['typeahead', 'Type to focus an item', 'الكتابة للانتقال إلى عنصر', 'p1', 'typeahead|disabledItemsFocusable', '', ['req', 'Typeahead folds Arabic letter variants', 'البحث بالكتابة يوحّد أشكال الحروف العربية']],
    ['shortcut', 'Keyboard shortcut hint', 'تلميح اختصار لوحة المفاتيح', 'p2', 'Shortcut|rightSection|extra|Keyboard|command', '', ['req', 'Shortcut text is an LTR island at the inline end of the item', 'نص الاختصار جزيرة LTR عند نهاية سطر العنصر']],
    ['danger', 'Destructive item', 'عنصر خطر', 'p1', 'danger|mantine:color|shadcn:variant', ''],
  ],
  dec: [['naming', 'menu is the action menu (ARIA role menu). AntD calls it Dropdown and uses Menu for site navigation, which is navigation-menu here.']],
})

C('context-menu', 'Context menu', 'قائمة سياقية', 'navigation', 'T3', 'p1', {
  s: ['A menu opened by right-click or long-press at the pointer.', 'قائمة تُفتح بالنقر الأيمن أو الضغط المطوّل عند المؤشر.'],
  e: 'menu collection roving-focus overlay-layers anchored-position', a: 'trigger popup item separator', d: 'menu',
  al: { 'base-ui': 'ContextMenu', radix: 'ContextMenu', shadcn: 'context-menu' },
  seed: 'dropdown:trigger', so: { trigger: 'antd' },
  f: [
    ['long-press', 'Long-press on touch', 'ضغط مطوّل في اللمس', 'p1', '', 'radix base-ui shadcn'],
    ['anchor', 'Opens toward the inline end of the pointer', 'تُفتح نحو نهاية السطر من موضع المؤشر', 'p1', '', '', N.placement],
  ],
  n: 'AntD: Dropdown with trigger contextMenu; Chakra: Menu.ContextTrigger. Neither is a separate export.',
})

C('menubar', 'Menubar', 'شريط قوائم', 'navigation', 'T4', 'p2', {
  s: ['A horizontal bar of menus, as in desktop applications.', 'شريط أفقي من القوائم كما في تطبيقات سطح المكتب.'],
  e: 'menu roving-focus overlay-layers anchored-position', a: 'root menu trigger popup item', d: 'menu',
  al: { mantine: 'Menubar', 'base-ui': 'Menubar', radix: 'Menubar', shadcn: 'menubar' },
  f: [['arrows', 'Arrow keys move between menus in visual order', 'الأسهم تتنقل بين القوائم بالترتيب البصري', 'p1', 'dir|loop|loopFocus', '', N.arrows]],
})

C('navigation-menu', 'Navigation menu', 'قائمة تنقل', 'navigation', 'T3', 'p0', {
  s: ['Site or application navigation: horizontal with flyouts, or vertical with nested groups.', 'تنقل الموقع أو التطبيق: أفقي بقوائم منبثقة أو رأسي بمجموعات متداخلة.'],
  e: 'roving-focus disclosure collection overlay-layers anchored-position', a: 'root list item trigger content link indicator group', d: 'link',
  al: { antd: 'Menu', mantine: 'NavLink', 'base-ui': 'NavigationMenu', radix: 'NavigationMenu', shadcn: 'navigation-menu' },
  seed: 'menu',
  sp: { horizontal: 'mode|orientation', inline: 'inlineIndent|inlineCollapsed', collapsed: 'inlineCollapsed', selected: 'selectedKeys|openKeys|value', multiple: 'multiple', icons: 'icon|leftSection', danger: 'danger', disabled: P.disabled, theme: 'theme', overflow: 'overflowedIndicator', groups: 'ItemGroup|Divider' },
  sa: { rtl: ['risk', 'Submenus open toward the inline end, and arrow keys follow the visual direction', 'القوائم الفرعية تُفتح نحو نهاية السطر، ومفاتيح الأسهم تتبع الاتجاه البصري'] },
  f: [
    ['current', 'Current page marked (aria-current)', 'تعليم الصفحة الحالية', 'p0', 'active|selectedKeys', ''],
    ['indent', 'Nested indent from the inline start', 'المسافة البادئة للمتداخل من بداية السطر', 'p0', 'inlineIndent|childrenOffset', '', N.logical],
  ],
})

C('toolbar', 'Toolbar', 'شريط أدوات', 'navigation', 'T2', 'p2', {
  s: ['Groups controls so one Tab stop reaches them and arrows move between them.', 'يجمع عناصر التحكم بمحطة Tab واحدة والتنقل بينها بالأسهم.'],
  e: 'roving-focus', a: 'root group separator item',
  al: { mantine: 'Toolbar', 'react-aria': 'Toolbar', 'base-ui': 'Toolbar', radix: 'Toolbar' },
  f: [
    ['roving', 'Roving focus', 'تركيز متنقل', 'p1', 'loop|loopFocus|orientation', '', N.arrows],
    ['overflow', 'Overflow into a menu', 'تجميع الزائد في قائمة', 'p2', '', ''],
  ],
  n: 'MUI Toolbar is a layout row without keyboard behaviour and is listed under app-shell.',
})

C('command-palette', 'Command palette', 'لوحة الأوامر', 'navigation', 'T4', 'p1', {
  s: ['A searchable list of commands and destinations opened with a shortcut.', 'قائمة أوامر ووجهات قابلة للبحث تُفتح باختصار.'],
  e: 'combobox listbox collection dialog overlay-layers focus-scope', a: 'root input list group item shortcut empty footer', d: 'dialog combobox kbd',
  al: { mantine: 'Spotlight', chakra: 'Command', shadcn: 'command' },
  f: [
    ['search', 'Fuzzy search tolerant of Arabic variants', 'بحث تقريبي متسامح مع العربية', 'p0', 'filter|shouldFilter|query', '', N.search],
    ['bilingual', 'Commands found by Arabic or English keywords', 'إيجاد الأوامر بكلمات عربية أو إنجليزية', 'p1', 'keywords', '', ['opp', 'Each command carries keywords in both languages, and a query typed on the wrong keyboard layout still matches', 'كل أمر يحمل كلمات مفتاحية باللغتين، والاستعلام المكتوب بتخطيط لوحة مفاتيح خاطئ يطابق أيضًا']],
    ['shortcut', 'Global shortcut', 'اختصار عام', 'p1', 'shortcut', ''],
    ['groups', 'Groups and nested pages', 'مجموعات وصفحات متداخلة', 'p2', 'SpotlightActionsGroup|Group|heading', ''],
  ],
})

// ── navigation ──────────────────────────────────────────────────────────────────────────────────────────────
C('tabs', 'Tabs', 'تبويبات', 'navigation', 'T2', 'p0', {
  s: ['Switches between panels of one view.', 'تبدّل بين ألواح عرض واحد.'],
  e: 'tabs roving-focus selection', a: 'root list tab indicator panel',
  al: { antd: 'Tabs', mui: 'Tabs Tab TabScrollButton', mantine: 'Tabs', chakra: 'Tabs', 'react-aria': 'Tabs Tab', 'base-ui': 'Tabs', radix: 'Tabs', 'headless-ui': 'TabGroup Tab', shadcn: 'tabs' },
  seed: 'tabs',
  sp: { card: 'type|variant', icons: 'icon|leftSection', editable: 'onEdit|addIcon', extra: 'tabBarExtraContent', position: 'tabPlacement|tabPosition|placement|orientation', overflow: 'more|scrollButtons|TabScrollButton', sizes: 'size', centered: 'centered|grow|justify|fitted', lazy: 'destroyOnHidden|destroyInactiveTabPane|keepMounted|lazyMount|forceMount|unmount', disabled: P.disabled, animated: 'animated|indicator|Indicator|TabsIndicator|SelectionIndicator', keyboard: 'activationMode|activateTabKeyPressOnly|selectionFollowsFocus|keyboardActivation|manual|activateOnFocus|loop' },
  so: { keyboard: 'antd' },
  sa: { 'rtl-arrows': ['req', 'In RTL ArrowLeft selects the next tab', 'في RTL السهم الأيسر ينتقل إلى التبويب التالي'] },
  f: [
    ['scroll-rtl', 'Overflow scroll buttons and position in RTL', 'أزرار تمرير الزائد وموضعه في RTL', 'p0', '', '', ['risk', 'Scrollable tab lists rely on scrollLeft, whose sign differs in RTL; the scroll arrows also swap', 'قوائم التبويب القابلة للتمرير تعتمد على scrollLeft الذي تختلف إشارته في RTL، وأسهم التمرير تتبادل']],
    ['activation', 'Automatic or manual activation', 'تفعيل تلقائي أو يدوي', 'p1', 'activationMode|selectionFollowsFocus|keyboardActivation|manual|activateOnFocus|activateTabKeyPressOnly', ''],
  ],
})

C('breadcrumb', 'Breadcrumb', 'مسار التنقل', 'navigation', 'T3', 'p1', {
  s: ['The path from the root to the current page.', 'المسار من الجذر إلى الصفحة الحالية.'],
  e: 'none', a: 'root list item link separator current ellipsis',
  al: { antd: 'Breadcrumb', 'antd-pro': 'ProBreadcrumb', mui: 'Breadcrumbs', mantine: 'Breadcrumbs', chakra: 'Breadcrumb', 'react-aria': 'Breadcrumbs Breadcrumb', shadcn: 'breadcrumb' },
  seed: 'breadcrumb',
  sp: { separator: 'separator|Separator', dropdown: 'menu|dropdownProps', routes: 'params|itemRender', items: 'items|href' },
  sa: { 'rtl-separator': ['risk', 'The slash and chevron separators must point in the reading direction', 'الفاصل المائل وأسهم الفصل يجب أن تشير في اتجاه القراءة'] },
  f: [
    ['collapse', 'Collapse the middle items', 'طي العناصر الوسطى', 'p2', 'maxItems|itemsBeforeCollapse|Ellipsis', ''],
    ['mixed', 'Latin segment inside an Arabic path', 'جزء لاتيني داخل مسار عربي', 'p1', '', '', N.mixed],
  ],
})

C('pagination', 'Pagination', 'ترقيم الصفحات', 'navigation', 'T3', 'p0', {
  s: ['Moves between pages of a list and reports where you are.', 'ينتقل بين صفحات قائمة ويبيّن الموضع الحالي.'],
  e: 'pagination', a: 'root prev next item ellipsis page-size jump total', d: 'button select',
  al: { antd: 'Pagination', mui: 'Pagination TablePagination', mantine: 'Pagination', chakra: 'Pagination', shadcn: 'pagination' },
  seed: 'pagination',
  sp: { 'size-changer': 'showSizeChanger|rowsPerPageOptions|pageSizeOptions', 'quick-jumper': 'showQuickJumper', total: 'showTotal|labelDisplayedRows|total|count', simple: 'simple|size', controlled: 'current|page|value', basic: 'total|count' },
  sa: { numerals: ['opp', 'Page numbers follow the numerals preference; AntD shows Latin page numbers', 'أرقام الصفحات تتبع تفضيل نظام الأرقام، و AntD يعرضها لاتينية'] },
  f: [
    ['arrows', 'Previous and next arrows mirror', 'سهما السابق والتالي ينعكسان', 'p0', '', '', N.mirrorIcon],
    ['range-text', '"11–20 of 87" in Arabic word order', 'صيغة «١١–٢٠ من ٨٧» بترتيب عربي', 'p0', 'showTotal|labelDisplayedRows|format', '', ['req', 'The range is one isolated run so the dash does not reorder between Arabic-Indic numbers, and the count noun takes its plural form', 'المجال مقطع معزول واحد فلا يتغير ترتيب الشرطة بين الأرقام الهندية، واسم المعدود يأخذ صيغة جمعه']],
    ['cursor', 'Cursor mode without total', 'نمط المؤشر بلا إجمالي', 'p1', '', ''],
  ],
})

C('stepper', 'Stepper', 'خطوات', 'navigation', 'T3', 'p1', {
  s: ['Shows progress through an ordered sequence of steps.', 'يعرض التقدم عبر تسلسل مرتب من الخطوات.'],
  e: 'stepper', a: 'root item indicator title description separator content',
  al: { antd: 'Steps', mui: 'Stepper Step MobileStepper', mantine: 'Stepper', chakra: 'Steps' },
  seed: 'steps',
  sp: { vertical: P.orientation, status: 'status|completed|error', clickable: 'onChange|onStepClick|nonLinear|allowNextStepsSelect|linear', 'progress-dot': 'progressDot|type|variant|alternativeLabel', small: 'size' },
  f: [
    ['order', 'Steps progress from the inline start', 'الخطوات تتقدم من بداية السطر', 'p0', '', '', N.logical],
    ['numbers', 'Step numbers in the scope numerals', 'أرقام الخطوات بنظام أرقام النطاق', 'p1', '', '', N.numerals],
    ['wizard', 'Wizard with validation per step', 'معالج بتحقق لكل خطوة', 'p1', '', ''],
  ],
})

C('table-of-contents', 'Table of contents', 'فهرس المحتويات', 'navigation', 'T3', 'p2', {
  s: ['Links to headings of the page, tracking the one in view.', 'روابط إلى عناوين الصفحة مع تتبع العنوان الظاهر.'],
  e: 'scroll-spy', a: 'root item link indicator',
  al: { antd: 'Anchor', mantine: 'TableOfContents' },
  seed: 'anchor', sp: { affix: 'affix', horizontal: 'direction', offset: 'targetOffset|offsetTop|scrollSpyOptions', links: 'items|getControlProps' },
  f: [['indent', 'Indent and indicator on the inline start', 'المسافة البادئة والمؤشر عند بداية السطر', 'p1', '', '', N.logical]],
})

C('bottom-navigation', 'Bottom navigation', 'شريط تنقل سفلي', 'navigation', 'T3', 'p2', {
  s: ['Three to five top-level destinations at the bottom of a phone screen.', 'ثلاث إلى خمس وجهات رئيسية أسفل شاشة الهاتف.'],
  e: 'roving-focus selection', a: 'root item icon label',
  al: { mui: 'BottomNavigation' },
  f: [['order', 'Item order follows direction', 'ترتيب العناصر يتبع الاتجاه', 'p1', '', '', N.logical], ['labels', 'Labels always or on selection', 'العناوين دائمًا أو عند التحديد', 'p2', 'showLabels', '']],
})
