import { validateContextValues } from '../context/validate'
import type { ExperienceProfileDefinition, VersionedReference } from '../context/types'
import type {
  BrandThemeDefinition,
  ContextPresetDefinition,
  Density,
  SupportedInputModality,
  StyleAssetIssue,
  StyleAssetValidationResult,
  VisualSystemDefinition,
} from './types'

type StyleAssetDefinitionKind = 'visual-system' | 'brand-theme' | 'context-preset'

const ID_PATTERN = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/
const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

const VISUAL_SYSTEM_FIELDS = new Set([
  'schemaVersion', 'kind', 'id', 'version', 'name', 'description',
  'principles', 'tokenLayers', 'recipeLayers', 'supportedAppearanceModes', 'supportedDensities',
])
const BRAND_THEME_FIELDS = new Set([
  'schemaVersion', 'kind', 'id', 'version', 'name', 'description',
  'tokenLayers', 'appearanceModes',
])
const CONTEXT_PRESET_FIELDS = new Set([
  'schemaVersion', 'kind', 'id', 'version', 'name', 'description',
  'productContext', 'tokenLayers', 'recipeLayers', 'supportedDensities',
  'requirements', 'environmentDefaults',
])
const REFERENCE_FIELDS = new Set(['id', 'version'])
const REQUIREMENT_FIELDS = new Set([
  'minimumTargetSize', 'dataDensity', 'keyboardPriority',
  'responsiveStrategy', 'supportedInputModalities',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function issue(
  code: StyleAssetIssue['code'],
  path: string,
  message: string,
  received?: unknown,
): StyleAssetIssue {
  return received === undefined ? { code, path, message } : { code, path, message, received }
}

function validateBase(
  input: unknown,
  expectedKind: StyleAssetDefinitionKind,
  allowedFields: ReadonlySet<string>,
): { record: Record<string, unknown> | null; issues: StyleAssetIssue[] } {
  if (!isRecord(input)) {
    return {
      record: null,
      issues: [issue('invalid-object', 'asset', 'Expected a plain style asset object.', input)],
    }
  }

  const issues: StyleAssetIssue[] = []
  for (const key of Object.keys(input)) {
    if (!allowedFields.has(key)) issues.push(issue('unknown-field', `asset.${key}`, 'Unknown style asset property.', input[key]))
  }

  if (input.schemaVersion !== 1) issues.push(issue('invalid-schema-version', 'asset.schemaVersion', 'Expected schemaVersion 1.', input.schemaVersion))
  if (input.kind !== expectedKind) issues.push(issue('invalid-kind', 'asset.kind', `Expected ${expectedKind}.`, input.kind))
  if (typeof input.id !== 'string' || !ID_PATTERN.test(input.id)) {
    issues.push(issue('invalid-id', 'asset.id', 'Asset id must be a stable lowercase slug.', input.id))
  }
  if (typeof input.version !== 'string' || !VERSION_PATTERN.test(input.version)) {
    issues.push(issue('invalid-version', 'asset.version', 'Asset version must be semantic version x.y.z.', input.version))
  }
  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    issues.push(issue('invalid-name', 'asset.name', 'Asset name must be a non-empty string.', input.name))
  }
  if (input.description !== undefined && typeof input.description !== 'string') {
    issues.push(issue('invalid-description', 'asset.description', 'Description must be a string when provided.', input.description))
  }

  return { record: input, issues }
}

function validateReferences(input: unknown, path: string): StyleAssetIssue[] {
  if (!Array.isArray(input) || input.length === 0) {
    return [issue('invalid-list', path, 'Expected a non-empty array of versioned references.', input)]
  }

  const issues: StyleAssetIssue[] = []
  const seen = new Set<string>()

  input.forEach((candidate, index) => {
    const itemPath = `${path}[${index}]`
    if (!isRecord(candidate)) {
      issues.push(issue('invalid-reference', itemPath, 'Expected a versioned reference object.', candidate))
      return
    }

    for (const key of Object.keys(candidate)) {
      if (!REFERENCE_FIELDS.has(key)) issues.push(issue('unknown-field', `${itemPath}.${key}`, 'Unknown reference property.', candidate[key]))
    }

    if (typeof candidate.id !== 'string' || !ID_PATTERN.test(candidate.id)) {
      issues.push(issue('invalid-reference', `${itemPath}.id`, 'Reference id must be a stable lowercase slug.', candidate.id))
    }
    if (typeof candidate.version !== 'string' || !VERSION_PATTERN.test(candidate.version)) {
      issues.push(issue('invalid-reference', `${itemPath}.version`, 'Reference version must be semantic version x.y.z.', candidate.version))
    }

    if (typeof candidate.id === 'string' && typeof candidate.version === 'string') {
      const key = candidate.id
      if (seen.has(key)) issues.push(issue('duplicate-reference', itemPath, 'A layer id may only be referenced once within the same asset, regardless of version.', key))
      seen.add(key)
    }
  })

  return issues
}

function validateStringList(input: unknown, path: string): StyleAssetIssue[] {
  if (!Array.isArray(input) || input.length === 0) {
    return [issue('invalid-list', path, 'Expected a non-empty array of strings.', input)]
  }
  const issues: StyleAssetIssue[] = []
  input.forEach((value, index) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      issues.push(issue('invalid-list', `${path}[${index}]`, 'List entries must be non-empty strings.', value))
    }
  })
  return issues
}

function validateEnumList<T extends string>(
  input: unknown,
  path: string,
  allowed: readonly T[],
): { issues: StyleAssetIssue[]; values: T[] } {
  if (!Array.isArray(input) || input.length === 0) {
    return { issues: [issue('invalid-list', path, 'Expected a non-empty array.', input)], values: [] }
  }

  const issues: StyleAssetIssue[] = []
  const values: T[] = []
  const seen = new Set<string>()

  input.forEach((value, index) => {
    if (typeof value !== 'string' || !allowed.some((candidate) => candidate === value)) {
      issues.push(issue('invalid-enum', `${path}[${index}]`, `Expected one of: ${allowed.join(', ')}.`, value))
      return
    }
    if (seen.has(value)) issues.push(issue('invalid-list', `${path}[${index}]`, 'Duplicate list value.', value))
    seen.add(value)
    const matched = allowed.find((candidate) => candidate === value)
    if (matched !== undefined) values.push(matched)
  })

  return { issues, values }
}

const APPEARANCE_MODES = ['light', 'dark'] as const
const DENSITIES = ['compact', 'default', 'touch'] as const
const SUPPORTED_INPUT_MODALITIES = ['pointer', 'touch', 'keyboard', 'assistive'] as const
const DATA_DENSITIES = ['low', 'medium', 'high'] as const
const TARGET_SIZES = ['standard', 'touch'] as const
const KEYBOARD_PRIORITIES = ['standard', 'high'] as const
const RESPONSIVE_STRATEGIES = ['mobile-first', 'adaptive', 'desktop-first'] as const

function isDensity(value: unknown): value is Density {
  return value === 'compact' || value === 'default' || value === 'touch'
}

function isSupportedInputModality(value: unknown): value is SupportedInputModality {
  return value === 'pointer' || value === 'touch' || value === 'keyboard' || value === 'assistive'
}

export function validateVisualSystemDefinition(input: unknown): StyleAssetValidationResult {
  const base = validateBase(input, 'visual-system', VISUAL_SYSTEM_FIELDS)
  if (!base.record) return { valid: false, issues: base.issues }

  const issues = [...base.issues]
  issues.push(...validateStringList(base.record.principles, 'asset.principles'))
  issues.push(...validateReferences(base.record.tokenLayers, 'asset.tokenLayers'))
  issues.push(...validateReferences(base.record.recipeLayers, 'asset.recipeLayers'))
  issues.push(...validateEnumList(base.record.supportedAppearanceModes, 'asset.supportedAppearanceModes', APPEARANCE_MODES).issues)
  issues.push(...validateEnumList(base.record.supportedDensities, 'asset.supportedDensities', DENSITIES).issues)

  return { valid: issues.length === 0, issues }
}

export function validateBrandThemeDefinition(input: unknown): StyleAssetValidationResult {
  const base = validateBase(input, 'brand-theme', BRAND_THEME_FIELDS)
  if (!base.record) return { valid: false, issues: base.issues }

  const issues = [...base.issues]
  issues.push(...validateReferences(base.record.tokenLayers, 'asset.tokenLayers'))
  issues.push(...validateEnumList(base.record.appearanceModes, 'asset.appearanceModes', APPEARANCE_MODES).issues)

  return { valid: issues.length === 0, issues }
}

export function validateContextPresetDefinition(input: unknown): StyleAssetValidationResult {
  const base = validateBase(input, 'context-preset', CONTEXT_PRESET_FIELDS)
  if (!base.record) return { valid: false, issues: base.issues }

  const issues = [...base.issues]
  if (typeof base.record.productContext !== 'string' || !ID_PATTERN.test(base.record.productContext)) {
    issues.push(issue('invalid-id', 'asset.productContext', 'Product context must be a stable lowercase slug.', base.record.productContext))
  }

  issues.push(...validateReferences(base.record.tokenLayers, 'asset.tokenLayers'))
  if (base.record.recipeLayers !== undefined) issues.push(...validateReferences(base.record.recipeLayers, 'asset.recipeLayers'))

  const densityResult = validateEnumList(base.record.supportedDensities, 'asset.supportedDensities', DENSITIES)
  issues.push(...densityResult.issues)

  const requirements = base.record.requirements
  if (!isRecord(requirements)) {
    issues.push(issue('invalid-object', 'asset.requirements', 'Expected a context requirements object.', requirements))
  } else {
    for (const key of Object.keys(requirements)) {
      if (!REQUIREMENT_FIELDS.has(key)) issues.push(issue('unknown-field', `asset.requirements.${key}`, 'Unknown requirement property.', requirements[key]))
    }

    if (!TARGET_SIZES.some((value) => value === requirements.minimumTargetSize)) {
      issues.push(issue('invalid-enum', 'asset.requirements.minimumTargetSize', 'Expected standard or touch.', requirements.minimumTargetSize))
    }
    if (!DATA_DENSITIES.some((value) => value === requirements.dataDensity)) {
      issues.push(issue('invalid-enum', 'asset.requirements.dataDensity', 'Expected low, medium, or high.', requirements.dataDensity))
    }
    if (!KEYBOARD_PRIORITIES.some((value) => value === requirements.keyboardPriority)) {
      issues.push(issue('invalid-enum', 'asset.requirements.keyboardPriority', 'Expected standard or high.', requirements.keyboardPriority))
    }
    if (!RESPONSIVE_STRATEGIES.some((value) => value === requirements.responsiveStrategy)) {
      issues.push(issue('invalid-enum', 'asset.requirements.responsiveStrategy', 'Expected mobile-first, adaptive, or desktop-first.', requirements.responsiveStrategy))
    }

    const modalities = validateEnumList(requirements.supportedInputModalities, 'asset.requirements.supportedInputModalities', SUPPORTED_INPUT_MODALITIES)
    issues.push(...modalities.issues)

    if (requirements.minimumTargetSize === 'touch' && !modalities.values.includes('touch')) {
      issues.push(issue('incompatible-default', 'asset.requirements.supportedInputModalities', 'Touch target-size policy requires touch input support.'))
    }
    if (requirements.keyboardPriority === 'high' && !modalities.values.includes('keyboard')) {
      issues.push(issue('incompatible-default', 'asset.requirements.supportedInputModalities', 'High keyboard priority requires keyboard input support.'))
    }

    if (isRecord(base.record.environmentDefaults)) {
      const defaultModality = base.record.environmentDefaults.inputModality
      if (isSupportedInputModality(defaultModality) && !modalities.values.includes(defaultModality)) {
        issues.push(issue('incompatible-default', 'asset.environmentDefaults.inputModality', 'Default input modality must be included in supportedInputModalities.', defaultModality))
      }
    }
  }

  if (base.record.environmentDefaults !== undefined) {
    const contextResult = validateContextValues(base.record.environmentDefaults, { partial: true })
    issues.push(...contextResult.issues.map((entry) => ({
      code: 'invalid-context' as const,
      path: entry.path.replace(/^context/, 'asset.environmentDefaults'),
      message: entry.message,
      received: entry.received,
    })))
  }

  if (isRecord(base.record.environmentDefaults) && isDensity(base.record.environmentDefaults.density)) {
    if (!densityResult.values.includes(base.record.environmentDefaults.density)) {
      issues.push(issue('incompatible-default', 'asset.environmentDefaults.density', 'Default density must be included in supportedDensities.', base.record.environmentDefaults.density))
    }
  }

  return { valid: issues.length === 0, issues }
}

export function isVisualSystemDefinition(input: unknown): input is VisualSystemDefinition {
  return validateVisualSystemDefinition(input).valid
}

export function isBrandThemeDefinition(input: unknown): input is BrandThemeDefinition {
  return validateBrandThemeDefinition(input).valid
}

export function isContextPresetDefinition(input: unknown): input is ContextPresetDefinition {
  return validateContextPresetDefinition(input).valid
}

export interface ExperienceCompositionValidationResult {
  valid: boolean
  issues: StyleAssetIssue[]
}

/**
 * Check compatibility after all four versioned assets have been loaded and individually validated.
 * This does not resolve token values; it verifies that the selected assets can form one experience.
 */
export function validateExperienceComposition(
  profile: ExperienceProfileDefinition,
  visualSystem: VisualSystemDefinition,
  brandTheme: BrandThemeDefinition,
  contextPreset: ContextPresetDefinition,
): ExperienceCompositionValidationResult {
  const issues: StyleAssetIssue[] = []

  const references: Array<{ path: string; expected: VersionedReference; actual: VersionedReference }> = [
    { path: 'profile.visualSystem', expected: profile.visualSystem, actual: visualSystem },
    { path: 'profile.brandTheme', expected: profile.brandTheme, actual: brandTheme },
    { path: 'profile.contextPreset', expected: profile.contextPreset, actual: contextPreset },
  ]

  for (const reference of references) {
    if (reference.expected.id !== reference.actual.id || reference.expected.version !== reference.actual.version) {
      issues.push(issue('profile-reference-mismatch', reference.path, 'Loaded asset does not match the exact id and version requested by the profile.', {
        expected: reference.expected,
        actual: { id: reference.actual.id, version: reference.actual.version },
      }))
    }
  }

  const sharedModes = visualSystem.supportedAppearanceModes.filter((mode) => brandTheme.appearanceModes.includes(mode))
  if (sharedModes.length === 0) {
    issues.push(issue('no-shared-appearance-mode', 'composition.appearanceModes', 'Visual system and brand theme have no supported appearance mode in common.'))
  }

  const sharedDensities = visualSystem.supportedDensities.filter((density) => contextPreset.supportedDensities.includes(density))
  if (sharedDensities.length === 0) {
    issues.push(issue('no-shared-density', 'composition.densities', 'Visual system and context preset have no supported density in common.'))
  }

  const selectedDensity = profile.context?.density ?? contextPreset.environmentDefaults?.density
  if (selectedDensity && (!visualSystem.supportedDensities.includes(selectedDensity) || !contextPreset.supportedDensities.includes(selectedDensity))) {
    issues.push(issue('unsupported-density', 'profile.context.density', 'Selected density is not supported by both the visual system and context preset.', selectedDensity))
  }

  const selectedModality = profile.context?.inputModality ?? contextPreset.environmentDefaults?.inputModality
  if (selectedModality && selectedModality !== 'unknown' && !contextPreset.requirements.supportedInputModalities.includes(selectedModality)) {
    issues.push(issue('unsupported-input-modality', 'profile.context.inputModality', 'Selected input modality is not supported by the context preset.', selectedModality))
  }

  return { valid: issues.length === 0, issues }
}
