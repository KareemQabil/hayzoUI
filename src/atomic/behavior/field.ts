/**
 * F2 behavior primitive: field. Wires a control to its label, description and error — ids and ARIA only.
 *
 * Contract
 *   - The label is a real <label for>, so clicking it focuses the control and it is the accessible name.
 *   - aria-describedby lists the error first (when present), then the description: the reason comes before the hint.
 *   - aria-invalid only when there is an error message to explain it; never invalid without a reason.
 *   - Required uses the native `required` attribute (implies aria-required) — no extra ARIA.
 */
import { useId } from 'react'

export interface FieldIds {
  control: string
  label: string
  description: string
  error: string
}

export function fieldIds(base: string): FieldIds {
  return { control: `${base}-control`, label: `${base}-label`, description: `${base}-description`, error: `${base}-error` }
}

export function useFieldIds(id?: string): FieldIds {
  const auto = useId().replace(/:/g, '')
  return fieldIds(id ?? `hz-${auto}`)
}

export interface FieldAriaInput {
  ids: FieldIds
  hasDescription: boolean
  hasError: boolean
}

/** Pure: the ARIA a control carries for a given field state. */
export function fieldControlAria({ ids, hasDescription, hasError }: FieldAriaInput): { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true } {
  const described = [hasError ? ids.error : null, hasDescription ? ids.description : null].filter(Boolean).join(' ')
  return { id: ids.control, 'aria-describedby': described || undefined, 'aria-invalid': hasError ? true : undefined }
}
