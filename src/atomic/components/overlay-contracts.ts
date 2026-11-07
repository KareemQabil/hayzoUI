/**
 * Machine-readable contracts for the overlay atoms (architecture §5), plus their internal strings.
 * overlays.test.tsx checks the rendered DOM and overlay.css against these.
 */
import type { AtomContract } from './contracts'

/** Internal strings of the overlay atoms, chosen by the experience locale's language; overridable via `labels`. */
export const OVERLAY_LABELS = {
  ar: { close: 'إغلاق' },
  en: { close: 'Close' },
} as const

export type OverlayLabels = { [K in keyof (typeof OVERLAY_LABELS)['ar']]: string }

export function overlayLabelsFor(locale: string): OverlayLabels {
  return locale.toLowerCase().startsWith('ar') ? OVERLAY_LABELS.ar : OVERLAY_LABELS.en
}

const CONTEXTS = ['erp-compact', 'pos-touch', 'saas-responsive']
const COMMON_LIMITS = ['Light appearance only in this proof', 'No exit animation (unmounts on close)', 'Unit-verified in jsdom; not yet browser-verified, nor checked with screen readers or on real touch devices']

export const POPOVER_CONTRACT: AtomContract = {
  id: 'atomic.popover',
  version: '0.1.0',
  purpose: 'Show non-modal supplementary content anchored to a trigger.',
  nonGoals: ['Menus (roving focus, menuitem roles)', 'Selection lists (combobox / select)', 'Blocking decisions (use a dialog)'],
  element: 'div[role=dialog] (non-modal), portaled',
  accessibleName: 'The title (aria-labelledby) when given; otherwise aria-label.',
  anatomy: ['root', 'trigger', 'title', 'body'],
  variants: { placement: ['block-start', 'block-end', 'inline-start', 'inline-end', '…-start', '…-end'] },
  states: ['closed', 'open'],
  keyboard: [
    { key: 'Enter / Space on trigger', action: 'Toggle (native button activation)' },
    { key: 'Escape', action: 'Close the top layer only; focus returns to the trigger' },
    { key: 'Tab past the last element', action: 'Close and continue to the element after the trigger' },
    { key: 'Shift+Tab before the first element', action: 'Close and return to the trigger' },
  ],
  aria: ['trigger: aria-haspopup="dialog", aria-expanded, aria-controls (while open)', 'panel: role="dialog", aria-labelledby → title', 'no aria-modal'],
  direction: 'Logical placement: inline-start is the right side in RTL; flips and shifts inside the viewport. No dir prop.',
  recipe: 'recipes.atomic-core@0.1.0 · overlay.css',
  supportedContexts: CONTEXTS,
  limitations: [...COMMON_LIMITS, 'No arrow rendered (the placement math returns its position)'],
  tests: ['PO-01', 'PO-02', 'PO-03', 'PO-04', 'PO-05', 'OV-INV-01', 'OV-ST-01'],
}

export const TOOLTIP_CONTRACT: AtomContract = {
  id: 'atomic.tooltip',
  version: '0.1.0',
  purpose: 'Describe a control with a short, non-interactive text.',
  nonGoals: ['Interactive content (use a popover)', 'Essential information that must be visible on touch', 'Labels (use a visible label or aria-label)'],
  element: 'div[role=tooltip], portaled',
  accessibleName: 'None; it describes its trigger through aria-describedby.',
  anatomy: ['root', 'trigger'],
  variants: { placement: ['block-start', 'block-end', 'inline-start', 'inline-end'] },
  states: ['closed', 'open'],
  keyboard: [
    { key: 'Focus (keyboard)', action: 'Show immediately' },
    { key: 'Escape', action: 'Hide (top layer only)' },
    { key: 'Blur', action: 'Hide' },
  ],
  aria: ['role="tooltip"', 'trigger aria-describedby → tooltip while shown', 'never focusable, never contains interactive content (warned in development)'],
  direction: 'Logical placement, mirrored in RTL.',
  recipe: 'recipes.atomic-core@0.1.0 · overlay.css',
  supportedContexts: CONTEXTS,
  limitations: [...COMMON_LIMITS, 'Touch: shown on focus only, never on hover; content must not be essential'],
  tests: ['TT-01', 'TT-02', 'TT-03', 'TT-04', 'OV-ST-01'],
}

const MODAL_KEYBOARD = [
  { key: 'Tab / Shift+Tab', action: 'Cycle inside the panel' },
  { key: 'Escape', action: 'Close the top dialog only (when dismissible)' },
]
const MODAL_ARIA = ['role="dialog" + aria-modal="true"', 'aria-labelledby → title (required)', 'aria-describedby → description', 'close button named by labels.close', 'outside content inert while open']

export const DIALOG_CONTRACT: AtomContract = {
  id: 'atomic.dialog',
  version: '0.1.0',
  purpose: 'Ask for a focused decision or task that blocks the page until it is done or dismissed.',
  nonGoals: ['Non-blocking hints (popover)', 'Notifications (toast)', 'Full pages'],
  element: 'div[role=dialog][aria-modal=true], portaled with the experience scope',
  accessibleName: 'The required title (aria-labelledby).',
  anatomy: ['root', 'backdrop', 'panel', 'header', 'title', 'close', 'close-icon', 'description', 'body', 'footer'],
  variants: { size: ['sm', 'md', 'lg'] },
  states: ['closed', 'open', 'not-dismissible'],
  keyboard: MODAL_KEYBOARD,
  aria: MODAL_ARIA,
  direction: 'Portaled content carries dir, lang, numerals, density, motion and tokens from the render point scope.',
  recipe: 'recipes.atomic-core@0.1.0 · overlay.css',
  supportedContexts: CONTEXTS,
  limitations: COMMON_LIMITS,
  tests: ['DL-01', 'DL-02', 'DL-03', 'DL-04', 'DL-05', 'DL-06', 'DL-07', 'DL-08', 'OV-INV-01', 'OV-ST-01'],
}

export const DRAWER_CONTRACT: AtomContract = {
  ...DIALOG_CONTRACT,
  id: 'atomic.drawer',
  purpose: 'A modal side panel for a secondary task that keeps the page context visible.',
  element: 'div[role=dialog][aria-modal=true] on a viewport edge, portaled with the experience scope',
  variants: { side: ['inline-start', 'inline-end', 'block-end'] },
  direction: 'inline-end by default: the left edge in RTL, the right edge in LTR (logical properties).',
  tests: ['DR-01', 'DR-02', 'DR-03', 'OV-ST-01'],
}
