import type {
  ContextIssue,
  ContextLayer,
  ContextTrace,
  ExperienceContext,
  VersionedReference,
} from '../context/types'
import { isExperienceProfileDefinition, validateExperienceProfile } from '../context/validate'
import { isDenseArray, isPlainRecord } from '../validation'
import { resolveExperienceContext } from './resolve'
import type {
  AppearanceMode,
  ContextPresetRequirements,
  StyleAssetDefinition,
  StyleAssetIssue,
} from './types'
import {
  isBrandThemeDefinition,
  isContextPresetDefinition,
  isVisualSystemDefinition,
  validateBrandThemeDefinition,
  validateContextPresetDefinition,
  validateVisualSystemDefinition,
} from './validate'

export interface ExperiencePlanInput {
  profile: unknown
  /** An explicit in-memory catalog. Every entry must be valid and unambiguous. */
  styleAssets: readonly unknown[]
  appearanceMode: AppearanceMode
  preferenceLayers?: readonly ContextLayer[]
}

export interface LayerRequestSource extends VersionedReference {
  kind: StyleAssetDefinition['kind']
  /** Exact reference location in the selected asset. */
  path: string
}

/** A registry lookup request, not an executable token/recipe layer. */
export interface ExperienceLayerRequest extends VersionedReference {
  requestedBy: LayerRequestSource[]
}

export interface ExperiencePlan {
  schemaVersion: 1
  profile: VersionedReference
  assets: {
    visualSystem: VersionedReference
    brandTheme: VersionedReference
    contextPreset: VersionedReference
  }
  context: ExperienceContext
  trace: ContextTrace
  appliedLayers: string[]
  appearanceMode: AppearanceMode
  requirements: ContextPresetRequirements
  tokenLayers: ExperienceLayerRequest[]
  recipeLayers: ExperienceLayerRequest[]
}

export type ExperiencePlanResult =
  | { ok: true; plan: ExperiencePlan }
  | { ok: false; issues: (ContextIssue | StyleAssetIssue)[] }

const INPUT_FIELDS = new Set(['profile', 'styleAssets', 'appearanceMode', 'preferenceLayers'])

function reference(asset: VersionedReference): VersionedReference {
  return { id: asset.id, version: asset.version }
}

function assetKey(kind: StyleAssetDefinition['kind'], asset: VersionedReference): string {
  return `${kind}:${asset.id}@${asset.version}`
}

function validateAsset(input: unknown): StyleAssetIssue[] {
  if (!isPlainRecord(input)) {
    return [{ code: 'invalid-object', path: 'asset', message: 'Expected a plain style asset.' }]
  }
  switch (input.kind) {
    case 'visual-system': return validateVisualSystemDefinition(input).issues
    case 'brand-theme': return validateBrandThemeDefinition(input).issues
    case 'context-preset': return validateContextPresetDefinition(input).issues
    default: return [{ code: 'invalid-kind', path: 'asset.kind', message: 'Expected visual-system, brand-theme, or context-preset.' }]
  }
}

/** Collect exact layer references, preserving all requesting sources. */
function collectLayers(
  assets: readonly StyleAssetDefinition[],
  field: 'tokenLayers' | 'recipeLayers',
  issues: StyleAssetIssue[],
): ExperienceLayerRequest[] {
  const requests = new Map<string, ExperienceLayerRequest>()
  for (const asset of assets) {
    const refs = field === 'tokenLayers'
      ? asset.tokenLayers
      : asset.kind === 'brand-theme' ? [] : asset.recipeLayers ?? []

    refs.forEach((ref, index) => {
      const path = `${asset.kind}:${asset.id}@${asset.version}.${field}[${index}]`
      const source: LayerRequestSource = { ...reference(asset), kind: asset.kind, path }
      const previous = requests.get(ref.id)
      if (previous && previous.version !== ref.version) {
        issues.push({
          code: 'conflicting-layer-version',
          path,
          message: `Layer ${ref.id} is requested at both ${previous.version} and ${ref.version}.`,
          received: { first: { ...reference(previous), requestedBy: previous.requestedBy }, conflicting: { ...reference(ref), requestedBy: source } },
        })
      } else if (previous) {
        previous.requestedBy.push(source)
      } else {
        requests.set(ref.id, { ...reference(ref), requestedBy: [source] })
      }
    })
  }
  return [...requests.values()]
}

/**
 * Resolve exact style-asset identities and prepare a detached, inspectable plan.
 * No I/O, global registry, version fallback, token resolution, or CSS generation.
 */
export function resolveExperiencePlan(input: ExperiencePlanInput): ExperiencePlanResult {
  if (!isPlainRecord(input)) {
    return { ok: false, issues: [{ code: 'invalid-object', path: 'plan', message: 'Expected an experience plan input.' }] }
  }

  const issues: (ContextIssue | StyleAssetIssue)[] = []
  for (const field of Object.keys(input)) {
    if (!INPUT_FIELDS.has(field)) issues.push({ code: 'unknown-field', path: `plan.${field}`, message: 'Unknown plan input property.' })
  }
  issues.push(...validateExperienceProfile(input.profile).issues)
  const catalog = new Map<string, StyleAssetDefinition>()

  if (!isDenseArray(input.styleAssets)) {
    issues.push({ code: 'invalid-catalog', path: 'styleAssets', message: 'Expected a dense array of style assets.' })
  } else {
    input.styleAssets.forEach((candidate, index) => {
      // Guards establish the discriminated union without assuming JSON input is trusted.
      if (!isVisualSystemDefinition(candidate) && !isBrandThemeDefinition(candidate) && !isContextPresetDefinition(candidate)) {
        issues.push(...validateAsset(candidate).map((entry) => ({ ...entry, path: entry.path.replace(/^asset/, `styleAssets[${index}]`) })))
        return
      }
      const key = assetKey(candidate.kind, candidate)
      if (catalog.has(key)) {
        issues.push({ code: 'duplicate-asset', path: `styleAssets[${index}]`, message: `Duplicate exact asset identity: ${key}.` })
      } else {
        catalog.set(key, candidate)
      }
    })
  }
  if (issues.length > 0) return { ok: false, issues }
  if (!isExperienceProfileDefinition(input.profile)) {
    return { ok: false, issues: validateExperienceProfile(input.profile).issues }
  }

  const selections = [
    ['visualSystem', 'visual-system'],
    ['brandTheme', 'brand-theme'],
    ['contextPreset', 'context-preset'],
  ] as const
  const selected = new Map<string, StyleAssetDefinition>()
  for (const [field, kind] of selections) {
    const ref = input.profile[field]
    const asset = catalog.get(assetKey(kind, ref))
    if (!asset) {
      issues.push({ code: 'missing-asset', path: `profile.${field}`, message: `Catalog does not contain ${kind}:${ref.id}@${ref.version}.`, received: reference(ref) })
    } else {
      selected.set(field, asset)
    }
  }
  if (issues.length > 0) return { ok: false, issues }

  const visualSystem = selected.get('visualSystem')
  const brandTheme = selected.get('brandTheme')
  const contextPreset = selected.get('contextPreset')
  // Catalog keys include kind; narrowing is retained explicitly at this boundary.
  if (visualSystem?.kind !== 'visual-system' || brandTheme?.kind !== 'brand-theme' || contextPreset?.kind !== 'context-preset') {
    return { ok: false, issues: [{ code: 'invalid-catalog', path: 'styleAssets', message: 'Selected asset kinds are inconsistent.' }] }
  }

  const resolved = resolveExperienceContext({
    profile: input.profile, visualSystem, brandTheme, contextPreset,
    appearanceMode: input.appearanceMode, preferenceLayers: input.preferenceLayers,
  })
  if (!resolved.ok) return resolved

  // Stable request traversal, not token precedence: the engine owns precedence.
  const requestIssues: StyleAssetIssue[] = []
  const assets = [brandTheme, visualSystem, contextPreset]
  const tokenLayers = collectLayers(assets, 'tokenLayers', requestIssues)
  const recipeLayers = collectLayers(assets, 'recipeLayers', requestIssues)
  if (requestIssues.length > 0) return { ok: false, issues: requestIssues }

  return {
    ok: true,
    plan: {
      schemaVersion: 1,
      profile: reference(input.profile),
      assets: { visualSystem: reference(visualSystem), brandTheme: reference(brandTheme), contextPreset: reference(contextPreset) },
      context: resolved.context,
      trace: resolved.trace,
      appliedLayers: resolved.appliedLayers,
      appearanceMode: resolved.appearanceMode,
      requirements: { ...contextPreset.requirements, supportedInputModalities: [...contextPreset.requirements.supportedInputModalities] },
      tokenLayers,
      recipeLayers,
    },
  }
}
