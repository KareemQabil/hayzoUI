import { profileToContextLayer, resolveContextLayers } from '../context/resolve'
import { isExperienceProfileDefinition, validateExperienceProfile } from '../context/validate'
import { isPlainRecord } from '../validation'
import type { ContextIssue, ContextLayer, ContextResolutionResult } from '../context/types'
import { contextPresetToContextLayer } from './bridge'
import {
  isBrandThemeDefinition,
  isContextPresetDefinition,
  isVisualSystemDefinition,
  validateBrandThemeDefinition,
  validateContextPresetDefinition,
  validateExperienceComposition,
  validateVisualSystemDefinition,
} from './validate'
import type { AppearanceMode, StyleAssetIssue } from './types'

export interface ExperienceContextInput {
  profile: unknown
  visualSystem: unknown
  brandTheme: unknown
  contextPreset: unknown
  /** Explicit selection; no implicit light/dark fallback. */
  appearanceMode: AppearanceMode
  /** Only system, user, and scoped layers may follow the selected profile. */
  preferenceLayers?: readonly ContextLayer[]
}

export type ExperienceContextResult =
  | (Extract<ContextResolutionResult, { ok: true }> & { appearanceMode: AppearanceMode })
  | { ok: false; issues: (ContextIssue | StyleAssetIssue)[] }

/**
 * Validate loaded assets, compose context, then check the effective environment.
 * Does not load registries, resolve tokens, read platform preferences, or emit CSS.
 */
export function resolveExperienceContext(input: ExperienceContextInput): ExperienceContextResult {
  if (!isPlainRecord(input)) {
    return { ok: false, issues: [{ code: 'invalid-object', path: 'composition', message: 'Expected an experience composition object.' }] }
  }

  const issues: (ContextIssue | StyleAssetIssue)[] = []
  const validations = [
    ['profile', validateExperienceProfile(input.profile)],
    ['visualSystem', validateVisualSystemDefinition(input.visualSystem)],
    ['brandTheme', validateBrandThemeDefinition(input.brandTheme)],
    ['contextPreset', validateContextPresetDefinition(input.contextPreset)],
  ] as const

  for (const [name, validation] of validations) {
    issues.push(...validation.issues.map((entry) => ({
      ...entry,
      path: entry.path.replace(/^(?:asset|profile)/, name),
    })))
  }

  const preferenceLayers = input.preferenceLayers === undefined ? [] : input.preferenceLayers
  if (!Array.isArray(preferenceLayers)) {
    issues.push({ code: 'invalid-context-layer', path: 'preferenceLayers', message: 'Expected an array of preference layers.' })
  } else {
    preferenceLayers.forEach((layer, index) => {
      if (!isPlainRecord(layer) || typeof layer.kind !== 'string'
        || !['system-preferences', 'user-preferences', 'scope'].includes(layer.kind)) {
        issues.push({ code: 'invalid-context-layer', path: `preferenceLayers[${index}]`, message: 'Only system-preferences, user-preferences, and scope layers are allowed here.' })
      }
    })
  }

  if (input.appearanceMode !== 'light' && input.appearanceMode !== 'dark') {
    issues.push({ code: 'unsupported-appearance-mode', path: 'composition.appearanceMode', message: 'Select light or dark explicitly.' })
  }
  if (issues.length > 0) return { ok: false, issues }

  // Narrow JSON-loaded assets only after all independent diagnostics are collected.
  if (!isExperienceProfileDefinition(input.profile) || !isVisualSystemDefinition(input.visualSystem)
    || !isBrandThemeDefinition(input.brandTheme) || !isContextPresetDefinition(input.contextPreset)) {
    return { ok: false, issues: [{ code: 'invalid-object', path: 'composition', message: 'Invalid composition assets.' }] }
  }

  const resolved = resolveContextLayers([
    contextPresetToContextLayer(input.contextPreset),
    profileToContextLayer(input.profile),
    ...preferenceLayers,
  ])
  if (!resolved.ok) return resolved

  issues.push(...validateExperienceComposition(
    input.profile, input.visualSystem, input.brandTheme, input.contextPreset, resolved.context,
  ).issues)

  if (!input.visualSystem.supportedAppearanceModes.includes(input.appearanceMode)
    || !input.brandTheme.appearanceModes.includes(input.appearanceMode)) {
    issues.push({ code: 'unsupported-appearance-mode', path: 'composition.appearanceMode', message: 'The selected appearance must be supported by both visual system and brand theme.', received: input.appearanceMode })
  }
  if (issues.length > 0) return { ok: false, issues }

  return { ...resolved, appearanceMode: input.appearanceMode }
}
