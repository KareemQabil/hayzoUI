/**
 * Internal strings of the atoms, chosen by the experience locale's language. A component never hard-codes
 * copy in one language; callers may override any string through `labels`.
 */
export const ATOM_LABELS = {
  ar: { pending: 'جارٍ التنفيذ', required: 'مطلوب', errorPrefix: 'خطأ:' },
  en: { pending: 'Working', required: 'required', errorPrefix: 'Error:' },
} as const

export type AtomLabels = { [K in keyof (typeof ATOM_LABELS)['ar']]: string }

export function labelsFor(locale: string): AtomLabels {
  return locale.toLowerCase().startsWith('ar') ? ATOM_LABELS.ar : ATOM_LABELS.en
}
