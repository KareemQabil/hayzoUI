/**
 * Atomic context contracts.
 *
 * These types describe the environment in which an experience runs. They do not
 * contain tokens, CSS values, React state, or business-domain data.
 */

export type Direction = 'ltr' | 'rtl'
export type Density = 'compact' | 'default' | 'touch'
export type MotionPreference = 'full' | 'reduced'
export type ContrastPreference = 'normal' | 'more' | 'forced'
export type InputModality = 'unknown' | 'pointer' | 'touch' | 'keyboard' | 'assistive'
export type MixedScriptAlignment = 'ui' | 'content'

/** ISO-8601 weekday numbering: Monday = 1, Sunday = 7. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

/**
 * A complete, resolved UI environment.
 *
 * Locale, direction, region, calendar, numbering system, and time zone are
 * intentionally independent. A locale tag never silently determines direction,
 * business region, calendar, or numbering system.
 */
export interface ExperienceContext {
  /** Canonical BCP 47 language tag, e.g. ar-EG or en-US. */
  locale: string
  /** Explicit writing direction. Never infer this from locale. */
  direction: Direction
  /** Unicode numbering-system identifier, e.g. latn, arab, arabext. */
  numberingSystem: string
  /** Unicode calendar identifier, e.g. gregory or islamic-umalqura. */
  calendar: string
  /** Product-level density choice. */
  density: Density
  /** Resolved motion preference supplied by the application or platform adapter. */
  motion: MotionPreference
  /** Resolved contrast preference supplied by the application or platform adapter. */
  contrast: ContrastPreference
  /** Current interaction hint. This is not a list of all available input capabilities. */
  inputModality: InputModality
  /** Alignment policy for text whose script direction differs from the surrounding UI. */
  mixedScriptAlignment: MixedScriptAlignment
  /** Explicit regional convention/business region, independent from locale and time zone. */
  region?: string
  /** Default ISO 4217 currency for formatting defaults; transaction currency remains domain data. */
  defaultCurrency?: string
  /** IANA time-zone identifier. Structural validation does not prove tzdb availability. */
  timeZone?: string
  /** First day of week using ISO-8601 numbering. */
  firstDayOfWeek?: IsoWeekday
}

export const CONTEXT_FIELD_NAMES = [
  'locale',
  'direction',
  'numberingSystem',
  'calendar',
  'density',
  'motion',
  'contrast',
  'inputModality',
  'mixedScriptAlignment',
  'region',
  'defaultCurrency',
  'timeZone',
  'firstDayOfWeek',
] as const

export type ContextField = (typeof CONTEXT_FIELD_NAMES)[number]
export type ContextScalar = string | number

/**
 * Ordered context sources. The resolver sorts by this fixed precedence, then
 * preserves caller order within the same source kind.
 */
export const CONTEXT_LAYER_KINDS = [
  'context-preset',
  'experience-profile',
  'system-preferences',
  'user-preferences',
  'scope',
] as const

export type ContextLayerKind = (typeof CONTEXT_LAYER_KINDS)[number]

export interface ContextLayer {
  /** Stable, unique slug within one resolution operation. */
  id: string
  kind: ContextLayerKind
  values: Partial<ExperienceContext>
}

export interface VersionedReference {
  /** Stable registry identifier; existence is checked by the registry, not this contract. */
  id: string
  /** Exact semantic version of the referenced asset. */
  version: string
}

/**
 * A named, reproducible composition of a visual system, brand theme, and product
 * context preset. The references are deliberately separate from environment values.
 */
export interface ExperienceProfileDefinition {
  schemaVersion: 1
  id: string
  version: string
  name: string
  description?: string
  visualSystem: VersionedReference
  brandTheme: VersionedReference
  contextPreset: VersionedReference
  /** Explicit environment defaults for this profile; later user/scope layers may override them. */
  context?: Partial<ExperienceContext>
}

export interface ContextSource {
  id: string
  kind: ContextLayerKind | 'library-default'
}

export interface ContextContribution {
  source: ContextSource
  value: ContextScalar
}

export interface ContextTraceEntry {
  field: ContextField
  value: ContextScalar
  /** Last layer that supplied this field. */
  source: ContextSource
  /** Every contribution in precedence order, including values later overridden. */
  contributions: readonly ContextContribution[]
}

export type ContextTrace = Partial<Record<ContextField, ContextTraceEntry>>

export type ContextIssueCode =
  | 'invalid-object'
  | 'unknown-field'
  | 'missing-required-field'
  | 'invalid-value'
  | 'invalid-locale'
  | 'invalid-direction'
  | 'invalid-numbering-system'
  | 'invalid-calendar'
  | 'invalid-region'
  | 'invalid-currency'
  | 'invalid-time-zone-format'
  | 'invalid-first-day-of-week'
  | 'invalid-density'
  | 'invalid-motion'
  | 'invalid-contrast'
  | 'invalid-input-modality'
  | 'invalid-mixed-script-alignment'
  | 'invalid-profile-id'
  | 'invalid-profile-version'
  | 'invalid-profile-name'
  | 'invalid-profile-reference'
  | 'invalid-layer-id'
  | 'invalid-layer-kind'
  | 'duplicate-layer-id'

export interface ContextIssue {
  code: ContextIssueCode
  path: string
  message: string
  received?: unknown
}

export interface ContextValidationResult {
  valid: boolean
  issues: ContextIssue[]
}

export type ContextResolutionResult =
  | {
      ok: true
      context: ExperienceContext
      trace: ContextTrace
      appliedLayers: string[]
    }
  | {
      ok: false
      issues: ContextIssue[]
    }
