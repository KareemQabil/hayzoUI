import { CONTEXT_FIELD_NAMES } from './types'
import { EXACT_VERSION_PATTERN as VERSION_PATTERN, isPlainRecord as isRecord } from '../validation'
import type {
  ContextIssue,
  ContextValidationResult,
  ExperienceContext,
  ExperienceProfileDefinition,
  VersionedReference,
} from './types'

const CONTEXT_FIELDS = new Set<string>(CONTEXT_FIELD_NAMES)

const REQUIRED_CONTEXT_FIELDS = [
  'locale',
  'direction',
  'numberingSystem',
  'calendar',
  'density',
  'motion',
  'contrast',
  'inputModality',
  'mixedScriptAlignment',
] as const

const ID_PATTERN = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/
const UNICODE_TYPE_PATTERN = /^[a-z0-9]{3,8}(?:-[a-z0-9]{3,8})*$/
const REGION_PATTERN = /^[A-Z]{2}$/
const CURRENCY_PATTERN = /^[A-Z]{3}$/
const TIME_ZONE_PATTERN = /^(?:UTC|GMT|[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+)*)$/

const PROFILE_FIELDS = new Set([
  'schemaVersion',
  'id',
  'version',
  'name',
  'description',
  'visualSystem',
  'brandTheme',
  'contextPreset',
  'context',
])

const REFERENCE_FIELDS = new Set(['id', 'version'])

function issue(
  code: ContextIssue['code'],
  path: string,
  message: string,
  received?: unknown,
): ContextIssue {
  return received === undefined ? { code, path, message } : { code, path, message, received }
}

function isLocaleTag(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) return false
  try {
    const canonical = Intl.getCanonicalLocales(value)[0]
    return canonical === value
  } catch {
    return false
  }
}

function validateReference(value: unknown, path: string): ContextIssue[] {
  if (!isRecord(value)) {
    return [issue('invalid-profile-reference', path, 'Expected a versioned reference object.', value)]
  }

  const issues: ContextIssue[] = []
  for (const key of Object.keys(value)) {
    if (!REFERENCE_FIELDS.has(key)) {
      issues.push(issue('unknown-field', `${path}.${key}`, 'Unknown reference property.', value[key]))
    }
  }

  if (typeof value.id !== 'string' || !ID_PATTERN.test(value.id)) {
    issues.push(issue('invalid-profile-reference', `${path}.id`, 'Reference id must be a stable lowercase slug.', value.id))
  }
  if (typeof value.version !== 'string' || !VERSION_PATTERN.test(value.version)) {
    issues.push(issue('invalid-profile-reference', `${path}.version`, 'Reference version must be semantic version x.y.z.', value.version))
  }
  return issues
}

/** Public guard for exact registry references used by downstream adapters. */
export function isVersionedReference(input: unknown): input is VersionedReference {
  return validateReference(input, 'reference').length === 0
}

/**
 * Validate a complete context or a partial context layer.
 *
 * This is structural validation only. It does not query browser media features,
 * load time-zone databases, infer writing direction, or resolve registry references.
 */
export function validateContextValues(
  input: unknown,
  options: { partial?: boolean } = {},
): ContextValidationResult {
  const partial = options.partial ?? false
  if (!isRecord(input)) {
    return {
      valid: false,
      issues: [issue('invalid-object', 'context', 'Expected a plain context object.', input)],
    }
  }

  const issues: ContextIssue[] = []

  for (const key of Object.keys(input)) {
    if (!CONTEXT_FIELDS.has(key)) {
      issues.push(issue('unknown-field', `context.${key}`, 'Unknown context field.', input[key]))
    }
  }

  if (!partial) {
    for (const key of REQUIRED_CONTEXT_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(input, key)) {
        issues.push(issue('missing-required-field', `context.${key}`, 'Required context field is missing.'))
      }
    }
  }

  for (const key of CONTEXT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue
    const value = input[key]
    const path = `context.${key}`

    switch (key) {
      case 'locale':
        if (!isLocaleTag(value)) issues.push(issue('invalid-locale', path, 'Expected a valid BCP 47 language tag.', value))
        break
      case 'direction':
        if (value !== 'ltr' && value !== 'rtl') issues.push(issue('invalid-direction', path, 'Expected ltr or rtl.', value))
        break
      case 'numberingSystem':
        if (typeof value !== 'string' || !UNICODE_TYPE_PATTERN.test(value)) {
          issues.push(issue('invalid-numbering-system', path, 'Expected a Unicode numbering-system identifier such as latn, arab, or arabext.', value))
        }
        break
      case 'calendar':
        if (typeof value !== 'string' || !UNICODE_TYPE_PATTERN.test(value)) {
          issues.push(issue('invalid-calendar', path, 'Expected a Unicode calendar identifier such as gregory or islamic-umalqura.', value))
        }
        break
      case 'region':
        if (typeof value !== 'string' || !REGION_PATTERN.test(value)) {
          issues.push(issue('invalid-region', path, 'Expected a two-letter uppercase ISO 3166-1 alpha-2-style code; registry membership is not checked.', value))
        }
        break
      case 'defaultCurrency':
        if (typeof value !== 'string' || !CURRENCY_PATTERN.test(value)) {
          issues.push(issue('invalid-currency', path, 'Expected a three-letter uppercase ISO 4217-style code such as EGP, SAR, or USD; registry membership is not checked.', value))
        }
        break
      case 'timeZone':
        if (typeof value !== 'string' || !TIME_ZONE_PATTERN.test(value)) {
          issues.push(issue('invalid-time-zone-format', path, 'Expected a structurally valid IANA time-zone identifier, such as Asia/Riyadh.', value))
        }
        break
      case 'firstDayOfWeek':
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 7) {
          issues.push(issue('invalid-first-day-of-week', path, 'Expected an ISO weekday from 1 (Monday) to 7 (Sunday).', value))
        }
        break
      case 'density':
        if (value !== 'compact' && value !== 'default' && value !== 'touch') {
          issues.push(issue('invalid-density', path, 'Expected compact, default, or touch.', value))
        }
        break
      case 'motion':
        if (value !== 'full' && value !== 'reduced') {
          issues.push(issue('invalid-motion', path, 'Expected full or reduced.', value))
        }
        break
      case 'contrast':
        if (value !== 'normal' && value !== 'more' && value !== 'forced') {
          issues.push(issue('invalid-contrast', path, 'Expected normal, more, or forced.', value))
        }
        break
      case 'inputModality':
        if (value !== 'unknown' && value !== 'pointer' && value !== 'touch' && value !== 'keyboard' && value !== 'assistive') {
          issues.push(issue('invalid-input-modality', path, 'Expected unknown, pointer, touch, keyboard, or assistive.', value))
        }
        break
      case 'mixedScriptAlignment':
        if (value !== 'ui' && value !== 'content') {
          issues.push(issue('invalid-mixed-script-alignment', path, 'Expected ui or content.', value))
        }
        break
    }
  }

  return { valid: issues.length === 0, issues }
}

/** Runtime type guard for untrusted partial context values. */
export function isPartialExperienceContext(input: unknown): input is Partial<ExperienceContext> {
  return validateContextValues(input, { partial: true }).valid
}

/** Runtime type guard for a complete resolved context. */
export function isExperienceContext(input: unknown): input is ExperienceContext {
  return validateContextValues(input, { partial: false }).valid
}

/** Validate a versioned, named experience profile without checking registry existence. */
export function validateExperienceProfile(input: unknown): ContextValidationResult {
  if (!isRecord(input)) {
    return {
      valid: false,
      issues: [issue('invalid-object', 'profile', 'Expected an experience profile object.', input)],
    }
  }

  const issues: ContextIssue[] = []

  for (const key of Object.keys(input)) {
    if (!PROFILE_FIELDS.has(key)) {
      issues.push(issue('unknown-field', `profile.${key}`, 'Unknown experience profile property.', input[key]))
    }
  }

  if (input.schemaVersion !== 1) {
    issues.push(issue('invalid-value', 'profile.schemaVersion', 'Expected schemaVersion 1.', input.schemaVersion))
  }
  if (typeof input.id !== 'string' || !ID_PATTERN.test(input.id)) {
    issues.push(issue('invalid-profile-id', 'profile.id', 'Profile id must be a stable lowercase slug.', input.id))
  }
  if (typeof input.version !== 'string' || !VERSION_PATTERN.test(input.version)) {
    issues.push(issue('invalid-profile-version', 'profile.version', 'Profile version must be semantic version x.y.z.', input.version))
  }
  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    issues.push(issue('invalid-profile-name', 'profile.name', 'Profile name must be a non-empty string.', input.name))
  }
  if (input.description !== undefined && typeof input.description !== 'string') {
    issues.push(issue('invalid-value', 'profile.description', 'Profile description must be a string when provided.', input.description))
  }

  issues.push(...validateReference(input.visualSystem, 'profile.visualSystem'))
  issues.push(...validateReference(input.brandTheme, 'profile.brandTheme'))
  issues.push(...validateReference(input.contextPreset, 'profile.contextPreset'))

  if (input.context !== undefined) {
    const contextResult = validateContextValues(input.context, { partial: true })
    issues.push(...contextResult.issues.map((entry) => ({
      ...entry,
      path: entry.path.replace(/^context/, 'profile.context'),
    })))
  }

  return { valid: issues.length === 0, issues }
}

/** Type guard for untrusted JSON loaded from a profile file or remote registry. */
export function isExperienceProfileDefinition(input: unknown): input is ExperienceProfileDefinition {
  return validateExperienceProfile(input).valid
}
