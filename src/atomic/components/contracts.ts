/**
 * Machine-readable contracts for the first-proof atoms (architecture §5). Tests check the rendered DOM and the
 * recipe CSS against these, so a contract cannot drift from the implementation silently.
 */
export interface AtomContract {
  id: string
  version: string
  purpose: string
  nonGoals: string[]
  element: string
  accessibleName: string
  anatomy: string[]
  variants: Record<string, readonly string[]>
  states: string[]
  keyboard: Array<{ key: string; action: string }>
  aria: string[]
  direction: string
  recipe: string
  supportedContexts: string[]
  limitations: string[]
  tests: string[]
}

export const BUTTON_CONTRACT: AtomContract = {
  id: 'atomic.button',
  version: '0.1.0',
  purpose: 'Trigger one action. The label names the action.',
  nonGoals: ['Navigation (use a link)', 'Toggle state (use a switch or toggle button)', 'Menus'],
  element: 'button',
  accessibleName: 'Visible label; aria-label only when the label is an icon.',
  anatomy: ['root', 'icon-start', 'label', 'icon-end', 'spinner'],
  variants: { intent: ['primary', 'neutral', 'danger'], emphasis: ['solid', 'outline', 'ghost'], size: ['sm', 'md', 'lg'] },
  states: ['idle', 'hover', 'pressed', 'focus-visible', 'disabled', 'pending'],
  keyboard: [
    { key: 'Enter', action: 'Activate (native)' },
    { key: 'Space', action: 'Activate (native)' },
    { key: 'Enter / Space while pending', action: 'Ignored; never submits twice' },
  ],
  aria: ['disabled → native disabled', 'pending → aria-busy="true" + aria-disabled="true", stays focusable', 'pending label announced with the action name'],
  direction: 'Icons sit on the inline start/end and follow the experience direction; no dir prop.',
  recipe: 'recipes.atomic-core@0.1.0 · button.css',
  supportedContexts: ['erp-compact', 'pos-touch', 'saas-responsive'],
  limitations: ['Light appearance only in this proof', 'No icon-only size variant yet', 'Not yet checked with screen readers or on real touch devices'],
  tests: ['AT-BT-01', 'AT-BT-02', 'AT-BT-03', 'AT-BT-04', 'AT-INV-01', 'AT-ST-02'],
}

export const TEXT_FIELD_CONTRACT: AtomContract = {
  id: 'atomic.text-field',
  version: '0.1.0',
  purpose: 'Enter one line of free text with a visible label.',
  nonGoals: ['Amounts, phones, dates (dedicated fields parse those)', 'Multi-line text', 'Suggestions (combobox)'],
  element: 'input',
  accessibleName: 'The visible <label for>; never a placeholder.',
  anatomy: ['root', 'label', 'required', 'control', 'input', 'description', 'error', 'error-icon'],
  variants: {},
  states: ['empty', 'filled', 'hover', 'focus-visible', 'invalid', 'disabled', 'readonly'],
  keyboard: [{ key: 'All', action: 'Native text input; no custom key handling' }],
  aria: ['label for → control', 'aria-describedby = error then description', 'aria-invalid only with an error message', 'native required'],
  direction: 'Follows the experience direction; contentDirection="ltr" for always-LTR data, "auto" for first-strong. Such content aligns with the interface edge under mixedScriptAlignment "ui", with its own start under "content".',
  recipe: 'recipes.atomic-core@0.1.0 · field.css',
  supportedContexts: ['erp-compact', 'pos-touch', 'saas-responsive'],
  limitations: ['Light appearance only in this proof', 'No prefix/suffix slots yet', 'Not yet checked with screen readers or on real touch devices'],
  tests: ['AT-TF-01', 'AT-TF-02', 'AT-TF-03', 'AT-INV-01', 'AT-ST-02'],
}
