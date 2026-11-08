/**
 * Experience style resolution for the first proof — pure, deterministic, no DOM.
 *
 *   visual system + brand theme + context preset + locale/direction
 *     → foundations: validated, compatible experience plan (exact asset versions)
 *     → integration: bind the plan's token layers to their payloads
 *     → token engine: resolve, then emit CSS custom properties
 *
 * The result is a set of CSS variables a scope element applies; recipes (plain CSS) read only component tokens.
 */
import { resolveExperienceTokens, type VersionedTokenAsset } from '../integration'
import type { BrandThemeDefinition, ContextPresetDefinition, Direction, ExperienceContext, ExperienceProfileDefinition, VisualSystemDefinition } from '../foundations'
import { generateCssVariables, resolveTokens, validateTokenLayers, type TokenLayer } from '../tokens'
import {
  brandNeutralBlueLayer,
  componentLayer,
  contextErpLayer,
  contextPosLayer,
  contextSaasLayer,
  primitiveLayer,
  semanticLayer,
  visualEditorialLayer,
  visualQuietLayer,
  visualSoftLayer,
} from './tokens'
import { componentChoiceLayer } from './tokens-choice'
import { componentOverlayLayer } from './tokens-overlay'
import { componentTableLayer } from './tokens-table'

const V = '0.1.0'
/** The recipe collection every visual system renders with: src/atomic/styles/recipes/*.css. */
const RECIPES = [{ id: 'recipes.atomic-core', version: V }]
const ALL_DENSITIES: VisualSystemDefinition['supportedDensities'] = ['compact', 'default', 'touch']

function visual(id: string, name: string, principles: string[], layer: TokenLayer): { asset: VisualSystemDefinition; layer: TokenLayer } {
  return {
    asset: { schemaVersion: 1, kind: 'visual-system', id, version: V, name, principles, tokenLayers: [{ id: `visual.${id}`, version: V }], recipeLayers: RECIPES, supportedAppearanceModes: ['light'], supportedDensities: ALL_DENSITIES },
    layer,
  }
}

export const VISUAL_SYSTEMS = {
  quiet: visual('quiet', 'Quiet', ['Outlined fields and 8px corners', 'Sans typography', 'No elevation'], visualQuietLayer),
  editorial: visual('editorial', 'Editorial', ['Square corners', 'Underlined fields without inline padding', 'Naskh typography and heavier labels'], visualEditorialLayer),
  soft: visual('soft', 'Soft', ['Pill actions with soft elevation', 'Filled borderless fields', 'Geometric typography'], visualSoftLayer),
} as const
export type VisualSystemId = keyof typeof VISUAL_SYSTEMS

function context(id: string, name: string, productContext: string, density: ExperienceContext['density'], requirements: ContextPresetDefinition['requirements'], layer: TokenLayer): { asset: ContextPresetDefinition; layer: TokenLayer; density: ExperienceContext['density']; modality: ExperienceContext['inputModality'] } {
  return {
    asset: { schemaVersion: 1, kind: 'context-preset', id, version: V, name, productContext, tokenLayers: [{ id: `context.${id}`, version: V }], supportedDensities: [density], requirements },
    layer,
    density,
    modality: requirements.supportedInputModalities[0] ?? 'pointer',
  }
}

export const CONTEXTS = {
  erp: context('erp-compact', 'ERP compact', 'erp', 'compact', { minimumTargetSize: 'standard', dataDensity: 'high', keyboardPriority: 'high', responsiveStrategy: 'desktop-first', supportedInputModalities: ['pointer', 'keyboard', 'assistive'] }, contextErpLayer),
  pos: context('pos-touch', 'POS touch', 'pos', 'touch', { minimumTargetSize: 'touch', dataDensity: 'medium', keyboardPriority: 'standard', responsiveStrategy: 'adaptive', supportedInputModalities: ['touch', 'keyboard', 'assistive'] }, contextPosLayer),
  saas: context('saas-responsive', 'SaaS responsive', 'saas', 'default', { minimumTargetSize: 'standard', dataDensity: 'medium', keyboardPriority: 'high', responsiveStrategy: 'mobile-first', supportedInputModalities: ['pointer', 'touch', 'keyboard', 'assistive'] }, contextSaasLayer),
} as const
export type ContextId = keyof typeof CONTEXTS

export const BRAND: { asset: BrandThemeDefinition; layer: TokenLayer } = {
  asset: { schemaVersion: 1, kind: 'brand-theme', id: 'neutral-blue', version: V, name: 'Neutral Blue', tokenLayers: [{ id: 'brand.neutral-blue', version: V }], appearanceModes: ['light'] },
  layer: brandNeutralBlueLayer,
}

export const LANGUAGES = {
  ar: { locale: 'ar-EG', direction: 'rtl', numberingSystem: 'arab', region: 'EG' },
  en: { locale: 'en-US', direction: 'ltr', numberingSystem: 'latn', region: 'US' },
} as const satisfies Record<string, { locale: string; direction: Direction; numberingSystem: string; region: string }>
export type LanguageId = keyof typeof LANGUAGES

/** Base token contracts shared by every experience (S0–S2). */
export const BASE_LAYERS: readonly TokenLayer[] = [primitiveLayer, semanticLayer, componentLayer, componentChoiceLayer, componentOverlayLayer, componentTableLayer]

const STYLE_ASSETS = [BRAND.asset, ...Object.values(VISUAL_SYSTEMS).map((v) => v.asset), ...Object.values(CONTEXTS).map((c) => c.asset)]
const TOKEN_ASSETS: VersionedTokenAsset[] = [
  { layer: BRAND.layer, ref: BRAND.asset.tokenLayers[0]! },
  ...Object.values(VISUAL_SYSTEMS).map((v) => ({ layer: v.layer, ref: v.asset.tokenLayers[0]! })),
  ...Object.values(CONTEXTS).map((c) => ({ layer: c.layer, ref: c.asset.tokenLayers[0]! })),
].map(({ layer, ref }) => ({ schemaVersion: 1, kind: 'token-layer', id: ref.id, version: ref.version, layerId: layer.id, payload: layer }))

export interface ExperienceSelection {
  visual: VisualSystemId
  context: ContextId
  language: LanguageId
}

export interface ExperienceStyle {
  /** Stable identity of the composition, e.g. "soft · pos-touch · ar-EG". */
  key: string
  context: ExperienceContext
  /** CSS custom properties to apply on the scope element (component, semantic and primitive tokens). */
  variables: Readonly<Record<string, string>>
  /** Exact asset versions that produced the variables — what a visual baseline must identify. */
  layers: readonly string[]
  recipes: readonly string[]
}

export type ExperienceStyleResult = { ok: true; style: ExperienceStyle } | { ok: false; stage: string; issues: readonly unknown[] }

export function experienceProfile({ visual, context, language }: ExperienceSelection): ExperienceProfileDefinition {
  const v = VISUAL_SYSTEMS[visual]
  const c = CONTEXTS[context]
  const l = LANGUAGES[language]
  return {
    schemaVersion: 1,
    id: `${visual}-${c.asset.id}-${language}`,
    version: V,
    name: `${v.asset.name} · ${c.asset.name} · ${l.locale}`,
    visualSystem: { id: v.asset.id, version: V },
    brandTheme: { id: BRAND.asset.id, version: V },
    contextPreset: { id: c.asset.id, version: V },
    context: {
      locale: l.locale,
      direction: l.direction,
      numberingSystem: l.numberingSystem,
      region: l.region,
      calendar: 'gregory',
      density: c.density,
      inputModality: c.modality,
      motion: 'full',
      contrast: 'normal',
      mixedScriptAlignment: 'ui',
    },
  }
}

/** Resolves one composition. Same selection → same variables (the engine is deterministic and snapshot-based). */
export function resolveExperienceStyle(selection: ExperienceSelection): ExperienceStyleResult {
  const result = resolveExperienceTokens(
    { experience: { profile: experienceProfile(selection), styleAssets: STYLE_ASSETS, appearanceMode: 'light' }, tokenAssets: TOKEN_ASSETS, baseLayers: BASE_LAYERS },
    { validateTokenLayers, resolveTokens },
  )
  if (!result.ok) return { ok: false, stage: result.stage, issues: result.issues }
  const css = generateCssVariables(result.resolution)
  if (!css.isValid) return { ok: false, stage: 'css', issues: css.issues }
  const { plan } = result
  return {
    ok: true,
    style: {
      key: `${selection.visual} · ${CONTEXTS[selection.context].asset.id} · ${plan.context.locale}`,
      context: plan.context,
      variables: css.variables,
      layers: [...BASE_LAYERS.map((l) => l.id), ...plan.tokenLayers.map((r) => `${r.id}@${r.version}`)],
      recipes: plan.recipeLayers.map((r) => `${r.id}@${r.version}`),
    },
  }
}

export const ALL_SELECTIONS: readonly ExperienceSelection[] = (Object.keys(VISUAL_SYSTEMS) as VisualSystemId[]).flatMap((visual) =>
  (Object.keys(CONTEXTS) as ContextId[]).flatMap((context) => (Object.keys(LANGUAGES) as LanguageId[]).map((language) => ({ visual, context, language }))),
)
