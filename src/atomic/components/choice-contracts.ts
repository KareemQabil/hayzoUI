/**
 * Machine-readable contracts for the choice atoms and Tabs (architecture §5). choice.test.tsx checks the rendered
 * DOM and choice.css against these (CHT-03/04), so a contract cannot drift from the implementation silently.
 */
import type { AtomContract } from './contracts'

const CONTEXTS = ['erp-compact', 'pos-touch', 'saas-responsive']
const COMMON_LIMITS = ['Light appearance only in this proof', 'Not yet checked with screen readers or on real touch devices', 'Unit-verified only; browser checks pending']
const RECIPE = 'recipes.atomic-core@0.1.0 · choice.css'

export const CHECKBOX_CONTRACT: AtomContract = {
  id: 'atomic.checkbox',
  version: '0.1.0',
  purpose: 'Turn one option on or off, submitted with a form; or show a mixed state for a partially selected set.',
  nonGoals: ['Settings that apply immediately (use a switch)', 'One of many (use a radio group)'],
  element: 'input[type=checkbox]',
  accessibleName: 'The visible <label for>.',
  anatomy: ['root', 'control', 'input', 'box', 'indicator', 'text', 'label', 'required', 'description', 'error'],
  variants: {},
  states: ['unchecked', 'checked', 'indeterminate', 'hover', 'focus-visible', 'invalid', 'disabled'],
  keyboard: [{ key: 'Space', action: 'Toggle (native)' }],
  aria: ['native checkbox role and checked state', 'indeterminate → DOM property, exposed as aria-checked="mixed" by the platform', 'aria-describedby = error then description', 'aria-invalid only with an error message', 'native required'],
  direction: 'Box on the inline start, text after it; follows the experience direction, no dir prop.',
  recipe: RECIPE,
  supportedContexts: CONTEXTS,
  limitations: [...COMMON_LIMITS, 'Indicator size aliases control.font-size until a control.indicator-size semantic token exists'],
  tests: ['CK-01', 'CK-02', 'CK-03', 'CK-04', 'CHT-INV-01', 'CHT-02'],
}

export const RADIO_GROUP_CONTRACT: AtomContract = {
  id: 'atomic.radio-group',
  version: '0.1.0',
  purpose: 'Choose exactly one of a few visible options.',
  nonGoals: ['Many options (use a select or combobox)', 'Several at once (use checkboxes)', 'Switching views (use tabs)'],
  element: 'fieldset[role=radiogroup] > input[type=radio]',
  accessibleName: 'The <legend>, referenced by aria-labelledby; each radio by its <label for>.',
  anatomy: ['root', 'legend', 'required', 'description', 'error', 'options', 'option', 'control', 'input', 'box', 'text', 'label', 'option-description'],
  variants: { orientation: ['vertical', 'horizontal'] },
  states: ['none-selected', 'selected', 'hover', 'focus-visible', 'invalid', 'disabled'],
  keyboard: [
    { key: 'Tab', action: 'Enter the group at the checked radio, or the first enabled one (native)' },
    { key: 'Arrow keys', action: 'Move and select, skipping disabled radios; ArrowLeft = next in RTL (native, follows the inherited direction)' },
    { key: 'Space', action: 'Select the focused radio (native)' },
  ],
  aria: ['role=radiogroup on the fieldset, named by the legend', 'aria-describedby = error then description on the group; per-option description on its radio', 'aria-invalid only with an error message', 'aria-required on the group, native required on radios'],
  direction: 'Options and arrows follow the experience direction; no dir prop.',
  recipe: RECIPE,
  supportedContexts: CONTEXTS,
  limitations: [...COMMON_LIMITS, 'Native arrow-key direction in RTL is browser behavior, not reproducible in jsdom'],
  tests: ['RG-01', 'RG-02', 'RG-03', 'RG-04', 'CHT-INV-01', 'CHT-02'],
}

export const SWITCH_CONTRACT: AtomContract = {
  id: 'atomic.switch',
  version: '0.1.0',
  purpose: 'Turn a setting on or off with immediate effect.',
  nonGoals: ['Choices submitted later with a form (use a checkbox)', 'Actions (use a button)'],
  element: 'button[role=switch]',
  accessibleName: 'The visible label, via aria-labelledby (also a <label for>, so clicking it toggles).',
  anatomy: ['root', 'control', 'track', 'thumb', 'text', 'label', 'description'],
  variants: {},
  states: ['off', 'on', 'hover', 'focus-visible', 'disabled'],
  keyboard: [
    { key: 'Space', action: 'Toggle (native button click)' },
    { key: 'Enter', action: 'Toggle (native button click)' },
  ],
  aria: ['role=switch + aria-checked="true|false"', 'aria-labelledby → visible label', 'aria-describedby → description', 'disabled → native disabled'],
  direction: 'Thumb moves toward the inline end when on (right in LTR, left in RTL) via inset-inline-start.',
  recipe: RECIPE,
  supportedContexts: CONTEXTS,
  limitations: [...COMMON_LIMITS, 'Thumb size aliases control.font-size until a control.indicator-size semantic token exists'],
  tests: ['SWT-01', 'SWT-02', 'SWT-03', 'CHT-INV-01', 'CHT-02'],
}

export const TABS_CONTRACT: AtomContract = {
  id: 'atomic.tabs',
  version: '0.1.0',
  purpose: 'Switch between peer panels of content in the same place.',
  nonGoals: ['Navigation between pages (use links)', 'Choosing a form value (use a radio group or segmented control)', 'Vertical tabs (not yet)'],
  element: 'div[role=tablist] > button[role=tab]; div[role=tabpanel]',
  accessibleName: 'Tablist: the `label` prop (aria-label). Tab: its visible label. Panel: its tab, via aria-labelledby.',
  anatomy: ['root', 'list', 'tab', 'tab-label', 'panel'],
  variants: { activation: ['automatic', 'manual'] },
  states: ['selected', 'hover', 'focus-visible', 'disabled'],
  keyboard: [
    { key: 'Tab', action: 'Enter the tablist at the selected tab; next Tab moves to the panel' },
    { key: 'ArrowRight / ArrowLeft', action: 'Next / previous enabled tab, wrapping; mirrored in RTL (ArrowLeft = next)' },
    { key: 'Home / End', action: 'First / last enabled tab' },
    { key: 'Enter / Space', action: 'Select the focused tab (manual activation; native button click)' },
  ],
  aria: ['tab: aria-selected, aria-controls → its panel', 'panel: aria-labelledby → its tab, tabindex=0, hidden when not selected', 'tablist: aria-orientation="horizontal"', 'one tab stop (roving tabindex)', 'disabled tab → native disabled, skipped by arrows'],
  direction: 'Tab order follows the experience direction: in RTL the first tab is on the right and ArrowLeft moves forward.',
  recipe: RECIPE,
  supportedContexts: CONTEXTS,
  limitations: [...COMMON_LIMITS, 'Horizontal only', 'All panels are rendered (hidden); no lazy panels yet'],
  tests: ['TBS-01', 'TBS-02', 'TBS-03', 'TBS-04', 'TBS-05', 'TBS-06', 'TBS-07', 'RV-01', 'CHT-INV-01', 'CHT-02'],
}

export const CHOICE_CONTRACTS = [CHECKBOX_CONTRACT, RADIO_GROUP_CONTRACT, SWITCH_CONTRACT, TABS_CONTRACT] as const
