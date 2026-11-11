// Shared vocabulary for the pattern definitions: sources, the RTL decisions with their evidence, and a small DSL.
// Key names follow KeyboardEvent.key, with two exceptions: the space bar is "Space", and "Printable" stands for any
// key that produces a character. Modifiers are joined with "+": Control, Shift, Alt, Meta.

const RS = 'packages/react-aria/src/'
const BU = 'packages/react/src/'

export const SOURCES = {
  apg: { name: 'WAI-ARIA Authoring Practices Guide (APG)', url: 'https://github.com/w3c/aria-practices', version: '0f765e4dc33e966026114ac12a8380db1de3b787', license: 'W3C-20150513' },
  aria: { name: 'WAI-ARIA 1.2 (W3C Recommendation)', url: 'https://www.w3.org/TR/wai-aria-1.2/', version: 'REC-2023-06-06', license: 'W3C-20150513' },
  'react-aria': { name: 'React Aria (adobe/react-spectrum)', url: 'https://github.com/adobe/react-spectrum', version: 'react-aria 3.53.1 @ d354aa2a642fa1d34bc0bdc27e8ae9bcf0c59b32', license: 'Apache-2.0' },
  'base-ui': { name: 'Base UI (mui/base-ui)', url: 'https://github.com/mui/base-ui', version: '1.9.0 @ 5aacdbb7852487518b982ea397885c8322a3ebc6', license: 'MIT' },
  radix: { name: 'Radix Primitives (radix-ui/primitives)', url: 'https://github.com/radix-ui/primitives', version: 'eb3a2b7091293e27df8f9ba906632d8daa3d81a3', license: 'MIT' },
  material: { name: 'Material UI (mui/material-ui)', url: 'https://github.com/mui/material-ui', version: '10.0.0-alpha.0 @ 0c82795c732a0ae809fd51f9537ee70747ef20a1', license: 'MIT' },
  'mui-x': { name: 'MUI X (mui/mui-x)', url: 'https://github.com/mui/mui-x', version: '9.17.0 @ bb99a92f284a804fcc70f508a10e21de6f02bb12', license: 'MIT' },
  'ant-design': { name: 'Ant Design and its @rc-component packages', url: 'https://github.com/ant-design/ant-design', version: 'antd 6.7.0 @ 0572a24a2ada6021a55d93fceca93a67b2dc6e2f; @rc-component slider 1.2.1, tabs 2.0.0, menu 1.6.2, tree 1.5.3, picker 1.17.0, rate 1.0.1, segmented 1.4.0, switch 1.0.3', license: 'MIT' },
}

const lib = (library, behaviour, evidence, checked = 'source-read') => ({ library, behaviour, ...(evidence ? { evidence } : {}), checked })
const APG_SILENT = 'Silent. No pattern page mentions right-to-left; keys are described physically (left, right) for a left-to-right layout.'

export const DECISIONS = {
  'roving-horizontal': {
    question: 'In a horizontal roving-focus composite (tabs, toolbar, menubar, radio group, toggle group), which arrow moves to the next item in RTL?',
    apg: 'Silent, apart from one aside in the tabs page that calls the last tab the right-most "in a left-to-right horizontal tab list". Keys are named physically: Right Arrow is next.',
    libraries: [
      lib('react-aria', 'ArrowLeft is next in RTL for tabs, toolbar and horizontal radio groups; vertical arrows never flip.', `${RS}tabs/TabsKeyboardDelegate.ts, ${RS}toolbar/useToolbar.ts, ${RS}radio/useRadioGroup.ts`),
      lib('base-ui', 'The composite root swaps the forward and backward horizontal keys when direction is rtl.', `${BU}internals/composite/root/useCompositeRoot.ts`),
      lib('radix', 'The roving focus group swaps ArrowLeft and ArrowRight before mapping a key to a focus intent when dir is rtl; toggle group, tabs, toolbar, radio group and menubar all pass dir through it.', 'packages/react/roving-focus/src/roving-focus-group.tsx (getDirectionAwareKey)'),
      lib('material', 'Tabs and ToggleButtonGroup pass isRtl to the roving tabindex root.', 'packages/mui-material/src/Tabs/Tabs.js, packages/mui-material/src/ToggleButtonGroup/ToggleButtonGroup.js'),
      lib('ant-design', 'Tabs flip the arrow offset when rtl and the tab bar is top or bottom; a horizontal menu maps Left to next when rtl.', '@rc-component/tabs es/TabNavList/index.js, @rc-component/menu es/hooks/useAccessibility.js'),
    ],
    recommendation: 'mirror-horizontal',
    reason: 'Items are laid out from inline-start, so the arrow that points at the visually following item must move to it. All five libraries agree.',
    status: 'consensus',
  },
  'segmented-arrows': {
    question: 'Do the horizontal arrows of a segmented control (single-choice button row) swap in RTL?',
    apg: 'No segmented-control page. The radio group page names Right Arrow as next and is silent on RTL.',
    libraries: [
      lib('ant-design', 'Does not swap: ArrowLeft and ArrowUp always select the previous option, in both directions, although the component renders an -rtl class.', '@rc-component/segmented es/index.js (handleKeyDown)'),
      lib('material', 'Swaps: ToggleButtonGroup passes isRtl to the roving tabindex root.', 'packages/mui-material/src/ToggleButtonGroup/ToggleButtonGroup.js'),
      lib('radix', 'Swaps: ToggleGroup resolves dir and hands it to the roving focus group.', 'packages/react/toggle-group/src/toggle-group.tsx'),
      lib('react-aria', 'Swaps for horizontal radio groups, the role a segmented control maps to.', `${RS}radio/useRadioGroup.ts`),
    ],
    recommendation: 'mirror-horizontal',
    reason: 'Same rule as every horizontal roving composite. The Ant Design behaviour sends ArrowLeft to the visually right-hand segment in RTL, which reads as a defect.',
    status: 'divergent',
  },
  'submenu-open-close': {
    question: 'Which arrow opens a submenu from a vertical menu, and which closes it, in RTL?',
    apg: APG_SILENT + ' Right Arrow opens a submenu, Left Arrow closes it.',
    libraries: [
      lib('react-aria', 'In RTL ArrowLeft opens the submenu and ArrowRight closes it.', `${RS}menu/useSubmenuTrigger.ts`),
      lib('radix', 'SUB_OPEN_KEYS and SUB_CLOSE_KEYS are keyed by direction: rtl opens with ArrowLeft, closes with ArrowRight.', 'packages/react/menu/src/menu.tsx'),
      lib('base-ui', 'List navigation takes an rtl flag; the cross-orientation open and close keys are ArrowLeft and ArrowRight respectively when rtl.', `${BU}utils/popups/interactions/useListNavigation.ts, ${BU}menu/root/MenuRoot.tsx`),
      lib('ant-design', 'In a vertical menu Left means "children" (open) and Right means "parent" (close) when rtl.', '@rc-component/menu es/hooks/useAccessibility.js'),
    ],
    recommendation: 'mirror-horizontal',
    reason: 'A submenu opens toward inline-end, which is the left in RTL; the arrow must point where the submenu appears.',
    status: 'consensus',
  },
  'tree-expand-collapse': {
    question: 'Which arrow expands a tree node and which collapses it in RTL?',
    apg: APG_SILENT + ' Right arrow opens a closed node, Left arrow closes an open one.',
    libraries: [
      lib('react-aria', 'Expansion keys are keyed by direction: rtl expands with ArrowLeft and collapses with ArrowRight.', `${RS}gridlist/useGridListItem.ts (EXPANSION_KEYS)`),
      lib('mui-x', 'Tree view expands on ArrowLeft and collapses on ArrowRight when isRtl.', 'packages/x-tree-view/src/internals/plugins/keyboardNavigation/TreeViewKeyboardNavigationPlugin.ts'),
      lib('ant-design', 'Does not swap: ArrowLeft always collapses or moves to the parent, ArrowRight always expands, although direction is passed for drag positioning.', '@rc-component/tree es/Tree.js (onKeyDown)'),
      lib('radix', 'No tree component.', undefined, 'not-found'),
      lib('base-ui', 'No tree component in 1.9.0.', undefined, 'not-found'),
    ],
    recommendation: 'mirror-horizontal',
    reason: 'Children are indented toward inline-end and the disclosure chevron points there; the arrow that points into the indentation expands.',
    status: 'divergent',
  },
  'grid-cell-navigation': {
    question: 'Do ArrowLeft and ArrowRight move by visual cell or by column index in an RTL grid?',
    apg: APG_SILENT + ' Right Arrow moves "one cell to the right".',
    libraries: [
      lib('react-aria', 'The grid keyboard delegate resolves the key right of and left of a cell against direction, so movement is visual.', `${RS}grid/GridKeyboardDelegate.ts`),
      lib('base-ui', 'Grid navigation in the composite takes an rtl flag and swaps the horizontal keys.', `${BU}internals/composite/root/gridNavigation.ts`),
      lib('mui-x', 'Data grid keyboard navigation computes left and right targets with isRtl.', 'packages/x-data-grid/src/hooks/features/keyboardNavigation/utils.ts'),
    ],
    recommendation: 'mirror-horizontal',
    reason: 'Columns are laid out from inline-start, so the first column is on the right. Following the APG wording literally (move one cell to the right) and mirroring are the same thing here: the key moves focus in the direction it points.',
    status: 'consensus',
  },
  'slider-arrows': {
    question: 'In a horizontal slider in RTL, does ArrowRight increase or decrease the value?',
    apg: 'Right Arrow increases, Left Arrow decreases; no RTL statement. A note allows reversing the direction of value change where that is more intuitive.',
    libraries: [
      lib('react-aria', 'Reverses the horizontal axis in RTL: ArrowLeft increments, ArrowRight decrements; the thumb position is mirrored.', `${RS}slider/useSliderThumb.ts (reverseX)`),
      lib('base-ui', 'ArrowRight is -1 and ArrowLeft is +1 when rtl.', `${BU}slider/thumb/SliderThumb.tsx`),
      lib('radix', 'Back keys depend on slide direction: from-right (rtl, not inverted) treats ArrowRight as a back key.', 'packages/react/slider/src/slider.tsx (BACK_KEYS)'),
      lib('material', 'ArrowRight steps by -1 and ArrowLeft by +1 when isRtl.', 'packages/mui-material/src/Slider/useSlider.ts'),
      lib('ant-design', 'Slider turns reverse on by default for a horizontal slider in RTL; the handle then treats Left as +1 and Right as -1.', 'components/slider/index.tsx, @rc-component/slider es/Handles/Handle.js'),
    ],
    recommendation: 'mirror-horizontal',
    reason: 'The minimum sits at inline-start, so the track fills from the right in RTL and the arrow pointing toward the maximum must increase. All five libraries do this; a slider whose axis is physical (audio balance, a timeline that stays left-to-right) opts out per instance.',
    status: 'consensus',
  },
  'slider-page-home-end': {
    question: 'Do PageUp, PageDown, Home and End change meaning in an RTL horizontal slider?',
    apg: 'Home sets the first allowed value, End the last, Page Up increases by a larger step, Page Down decreases; no RTL statement.',
    libraries: [
      lib('react-aria', 'PageUp increments, PageDown decrements, Home sets the minimum, End the maximum, with no direction test.', `${RS}slider/useSliderThumb.ts`),
      lib('base-ui', 'PageUp +large step, PageDown -large step, Home minimum, End maximum, independent of rtl.', `${BU}slider/thumb/SliderThumb.tsx`),
      lib('radix', 'Home and PageDown are back keys in every slide direction.', 'packages/react/slider/src/slider.tsx (BACK_KEYS)'),
      lib('material', 'PageUp +shiftStep, PageDown -shiftStep, Home min, End max, independent of isRtl.', 'packages/mui-material/src/Slider/useSlider.ts'),
      lib('ant-design', 'Home is min, End is max, PageUp +2 steps, PageDown -2 steps, independent of direction.', '@rc-component/slider es/Handles/Handle.js'),
    ],
    recommendation: 'none',
    reason: 'These keys name a value (smallest, largest, more, less), not a screen direction. All five libraries keep them fixed.',
    status: 'consensus',
  },
  'calendar-day-arrows': {
    question: 'In a calendar grid in RTL, does ArrowLeft move to the previous or the next day?',
    apg: 'No calendar pattern page; the date picker dialog example binds Left Arrow to the previous day and is silent on RTL.',
    libraries: [
      lib('react-aria', 'ArrowLeft focuses the next day and ArrowRight the previous day when direction is rtl.', `${RS}calendar/useCalendarGrid.ts`),
      lib('mui-x', 'ArrowLeft adds one day and ArrowRight subtracts one when isRtl.', 'packages/x-date-pickers/src/DateCalendar/DayCalendar.tsx'),
      lib('ant-design', 'No arrow-key day navigation found in the panel of @rc-component/picker 1.17.0; only the masked input handles arrows.', '@rc-component/picker es/', 'not-found'),
      lib('base-ui', 'No calendar component in 1.9.0.', undefined, 'not-found'),
      lib('radix', 'No calendar component.', undefined, 'not-found'),
    ],
    recommendation: 'mirror-horizontal',
    reason: 'The week row runs from inline-start, so the first weekday is the right-most column in RTL and time flows leftward; ArrowLeft must go forward one day. Both libraries that implement the grid agree.',
    status: 'consensus',
  },
  'date-segments': {
    question: 'In a segmented date or time field in RTL, which segment does ArrowLeft move to?',
    apg: 'No segmented-field page. Each segment is a spinbutton, whose page binds only vertical arrows.',
    libraries: [
      lib('react-aria', 'In RTL the group finds the neighbouring segment by geometry (bounding rectangles), not DOM order, so ArrowLeft goes to the segment visually on the left.', `${RS}datepicker/useDatePickerGroup.ts`),
      lib('mui-x', 'ArrowRight moves to the section recorded as the right-hand neighbour in a visual section order computed with isRtl.', 'packages/x-date-pickers/src/internals/hooks/useField/useFieldRootProps.ts'),
      lib('ant-design', 'The masked input moves the cell index by -1 on ArrowLeft and +1 on ArrowRight with no direction test.', '@rc-component/picker es/PickerInput/Selector/Input.mjs'),
    ],
    recommendation: 'visual',
    reason: 'Numeric date and time segments form left-to-right runs inside right-to-left text, so DOM order and visual order disagree in ways a simple swap cannot express. The key must move to the segment it points at; the engine resolves that from the rendered order.',
    status: 'divergent',
  },
  'text-caret': {
    question: 'Does the engine remap ArrowLeft, ArrowRight, Home and End while a text input inside a composite (combobox, tag input, grid cell editor, spinbutton) has focus?',
    apg: 'The combobox page says Left and Right Arrow move the input cursor one character and warns that scripts must not interfere with browser-provided text editing keys.',
    libraries: [
      lib('base-ui', 'The composite returns to native textbox behaviour unless the caret is at the edge it is leaving by and the selection is collapsed.', `${BU}internals/composite/root/useCompositeRoot.ts`),
      lib('material', 'Autocomplete lets the browser move the caret; it acts on ArrowLeft only when the caret is at index 0 with nothing selected.', 'packages/mui-material/src/useAutocomplete/useAutocomplete.js'),
    ],
    recommendation: 'none',
    reason: 'Caret movement in bidirectional text is the platform\'s job (visual or logical by OS) and users expect it unchanged. The engine never swaps these keys inside a text input; it only decides when a key leaves the input (see input-edge-handoff).',
    status: 'consensus',
  },
  'input-edge-handoff': {
    question: 'Which arrow leaves a text input for the item before it (the last tag of a tag input, the previous cell) in RTL, and when?',
    apg: 'Silent.',
    libraries: [
      lib('base-ui', 'Uses the container direction: in RTL the backward key is ArrowRight, and it leaves the input only when selectionStart is 0 and the selection is collapsed. The test is on the logical caret index, so with left-to-right text inside an RTL composite the caret can be at index 0 while still having visual room to move.', `${BU}internals/composite/root/useCompositeRoot.ts`),
      lib('material', 'Always ArrowLeft at selectionStart 0, with no direction handling in the hook.', 'packages/mui-material/src/useAutocomplete/useAutocomplete.js'),
    ],
    recommendation: 'mirror-horizontal',
    reason: 'Tags sit at inline-start of the input, which is its right side in RTL, so ArrowRight must reach them. Hand off only when the selection is collapsed at logical index 0 and the input\'s resolved text direction equals the container direction; otherwise leave the key to the caret and rely on Backspace.',
    status: 'divergent',
  },
  'splitter-arrows': {
    question: 'In RTL, does ArrowLeft move a vertical splitter left on screen, or shrink the primary pane?',
    apg: 'Physical wording: Left Arrow moves a vertical splitter to the left. Silent on RTL. aria-valuenow tracks the primary pane size.',
    libraries: [
      lib('ant-design', 'The separator of Splitter has no arrow-key handler; only its collapse buttons are focusable. Pointer deltas are reversed for a horizontal splitter in RTL.', 'components/splitter/SplitBar.tsx, components/splitter/Splitter.tsx', 'not-found'),
      lib('react-aria', 'No splitter. Table column resizing reverses the horizontal delta in RTL so that the divider follows the arrow.', `${RS}table/useTableColumnResize.ts`),
      lib('radix', 'No splitter component.', undefined, 'not-found'),
      lib('base-ui', 'No splitter component in 1.9.0.', undefined, 'not-found'),
    ],
    recommendation: 'visual',
    reason: 'The APG binding is physical and a divider is a physical object: it must go where the arrow points. The primary pane is at inline-start, so in RTL ArrowLeft grows it and raises aria-valuenow.',
    status: 'open',
  },
  'switch-arrows': {
    question: 'Should ArrowLeft and ArrowRight set a switch off and on?',
    apg: 'Binds only Space and, optionally, Enter.',
    libraries: [
      lib('ant-design', 'Left sets off and Right sets on, with no direction test, so in RTL the arrow points away from the thumb\'s destination.', '@rc-component/switch es/index.js'),
      lib('radix', 'No arrow handling.', 'packages/react/switch/src/switch.tsx', 'not-found'),
      lib('react-aria', 'No arrow handling.', `${RS}switch/useSwitch.ts`, 'not-found'),
      lib('base-ui', 'No arrow handling.', `${BU}switch/root/SwitchRoot.tsx`, 'not-found'),
      lib('material', 'No arrow handling.', 'packages/mui-material/src/Switch/Switch.js', 'not-found'),
    ],
    recommendation: 'do-not-bind',
    reason: 'Not in the APG contract, and a switch inside a roving composite needs the arrows for navigation. If a product insists, the binding must mirror.',
    status: 'divergent',
  },
  'rating-arrows': {
    question: 'In a horizontal rating in RTL, which arrow raises the value?',
    apg: 'No rating pattern page; the star rating examples are a slider and a radio group, both silent on RTL.',
    libraries: [
      lib('ant-design', 'Reversed in RTL: Left raises the value and Right lowers it.', '@rc-component/rate es/Rate.js'),
      lib('material', 'Built from native radio inputs, so arrows are the browser\'s; the pointer mapping is mirrored when isRtl.', 'packages/mui-material/src/Rating/Rating.js'),
    ],
    recommendation: 'mirror-horizontal',
    reason: 'Stars fill from inline-start, like a slider.',
    status: 'consensus',
  },
  'color-area-arrows': {
    question: 'Is a two-dimensional colour area (and its hue or alpha strip) mirrored in RTL, with its horizontal arrows?',
    apg: 'No colour picker page.',
    libraries: [
      lib('react-aria', 'Mirrors: in RTL ArrowLeft increments the x channel, the pointer x is inverted, and Home and End swap (Home increments x by a page step).', `${RS}color/useColorArea.ts`),
    ],
    recommendation: 'none',
    reason: 'A colour plane is a picture of a colour space, not a reading-order control: mirroring it changes where every colour sits relative to other tools. Keep the plane and its strips physical, with ArrowRight always increasing the x channel, and expose an opt-in to mirror. React Aria takes the opposite view; this needs a decision by a designer who works in Arabic.',
    status: 'open',
  },
  'reorder-arrows': {
    question: 'While an item of a horizontal list is picked up for keyboard reordering in RTL, which arrow moves it later in the order?',
    apg: 'No drag-and-drop page.',
    libraries: [
      lib('react-aria', 'Keyboard drag does not use arrows: Enter starts, Tab cycles drop targets, Enter drops, Escape cancels. Drop-position maths treats a horizontal list in RTL as reversed.', `${RS}dnd/DragManager.ts, ${RS}dnd/useDrag.ts, ${RS}dnd/ListDropTargetDelegate.ts`),
    ],
    recommendation: 'mirror-horizontal',
    reason: 'The picked-up item must travel in the direction of the arrow; in RTL the later positions are to the left.',
    status: 'open',
  },
}

// DSL ---------------------------------------------------------------------------------------------------------------
const bind = (rtl) => (keys, action, o = {}) => ({ keys: [keys].flat(), action, rtl, ...o })
export const n = bind('none')
export const m = bind('mirror-horizontal')
export const v = bind('visual')
export const opt = { optional: true }
export const role = (r, on, required, note) => ({ role: r, ...(on ? { on } : {}), ...(required === undefined ? {} : { required }), ...(note ? { note } : {}) })
export const attr = (name, on, values, required, note) => ({ name, on, ...(values ? { values } : {}), ...(required === undefined ? {} : { required }), ...(note ? { note } : {}) })
export const TAB_NATIVE = 'Not handled by the engine: Tab and Shift+Tab follow the page sequence.'

// Component ids were first assumed, then reconciled with data/catalog/universe (149 ids on 2026-11-11). An assumed id
// with an obvious equivalent in the universe is rewritten to it; null drops an id the universe has no component for.
export const COMPONENT_ALIASES = {
  'tag-input': 'tags-input', 'recipients-field': 'tags-input', 'tag-group': 'tag', 'time-field': 'time-picker', 'country-picker': 'country-select',
  'currency-picker': 'currency-select', 'language-picker': 'select', 'address-field': 'address-form', dropzone: 'file-upload', 'avatar-upload': 'file-upload',
  autocomplete: 'combobox', table: 'data-table', 'tree-table': 'data-grid', spreadsheet: 'data-grid', sheet: 'drawer', snackbar: 'toast', notification: 'toast',
  'range-slider': 'slider', 'media-scrubber': 'slider', collapse: 'collapsible', details: 'collapsible', 'show-more': 'collapsible', 'confirm-dialog': 'popconfirm',
  'dropdown-menu': 'menu', 'more-actions': 'menu', 'split-button': 'button-group', 'resizable-panels': 'splitter', wizard: 'stepper',
  'spotlight-search': 'command-palette', 'quantity-stepper': 'number-input', 'mega-menu': 'navigation-menu', 'editor-toolbar': 'rich-text-editor',
  feed: 'list-view', 'infinite-list': 'list-view', 'sortable-list': 'list-view', 'kanban-board': 'list-view', 'file-tree': 'tree', 'navigation-tree': 'tree',
  footer: 'app-shell', 'page-header': 'app-shell', 'form-error': 'field', 'inline-message': 'alert', 'password-strength': 'meter', quota: 'meter',
  'radio-card-group': 'radio-group', 'color-swatch-picker': 'color-picker', 'file-manager': null, filter: null, 'emoji-picker': null, checkout: null,
}
