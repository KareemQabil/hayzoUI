import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { resolveExperienceTokens } from './index'
import type { ExperienceTokenInput, TokenEnginePort } from './index'
import { arabicPosTouchProfile } from '../foundations/context/examples/profiles'
import { neutralBlueBrandTheme, posTouchContextPreset, quietEnterpriseVisualSystem } from '../foundations/styles/examples/assets'

/** Consumer views only; the external public engine owns the complete token types. */
interface LayerView { id: string; type: string; tokens: unknown[] }
interface IssueView { code: string }
interface ResolutionView {
  isValid: boolean
  issues: readonly IssueView[]
  tokens: Record<string, { value: unknown; sourceLayer: { id: string }; originalSourceLayer: { id: string } }>
}

// Default: the engine merged into this repository. Override with an absolute entry to test another snapshot.
const entry = process.env.HAYZO_TOKEN_ENGINE_ENTRY ?? fileURLToPath(new URL('../tokens/index.ts', import.meta.url))
const engineTest = test

async function fixture(appearance: 'light' | 'dark' = 'light') {
  // An explicit public entry from an unchanged external snapshot; no production dependency.
  const external = await import(entry!)
  const engine = external as TokenEnginePort<LayerView, IssueView, ResolutionView>
  expect(typeof engine.resolveTokens).toBe('function')
  expect(typeof engine.validateTokenLayers).toBe('function')
  const stack = structuredClone(external.createArabicPosStack(appearance)) as LayerView[]
  const ids = { theme: 'brand.neutral-blue', 'visual-system': 'visual.quiet-enterprise', context: 'context.pos-touch' } as const
  const config: ExperienceTokenInput = {
    experience: {
      profile: arabicPosTouchProfile,
      styleAssets: [quietEnterpriseVisualSystem, neutralBlueBrandTheme, posTouchContextPreset],
      appearanceMode: appearance,
    },
    baseLayers: stack.filter((layer) => !(layer.type in ids)),
    tokenAssets: stack.filter((layer) => layer.type in ids).map((layer) => ({
      schemaVersion: 1, kind: 'token-layer',
      id: ids[layer.type as keyof typeof ids], version: '0.1.0',
      layerId: layer.id, payload: layer,
    })),
  }
  return { config, engine }
}

engineTest.each(['light', 'dark'] as const)('real engine resolves %s POS values, aliases, and provenance through the adapter', async (appearance) => {
  const { config, engine } = await fixture(appearance)
  const result = resolveExperienceTokens(config, engine)
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.resolution.tokens['component.button.height.md'].value).toEqual({ value: 48, unit: 'px' })
  expect(result.resolution.tokens['component.button.radius'].value).toEqual({ value: 6, unit: 'px' })
  expect(result.resolution.tokens['component.button.background'].value).toBe(appearance === 'light' ? '#2457A6' : '#8AB4F8')
  expect(result.resolution.tokens['control.height.md'].sourceLayer.id).toBe('context-pos-touch')
  expect(result.resolution.tokens['control.height.md'].originalSourceLayer.id).toBe('arabic-pos-semantics')
  expect(result.plan.appearanceMode).toBe(appearance)
})

engineTest('real engine forbidden-override diagnostics survive the adapter boundary', async () => {
  const { config, engine } = await fixture()
  const asset = config.tokenAssets.find((asset) => asset.id === 'context.pos-touch')!
  const payload = asset.payload as LayerView
  payload.tokens.push({ path: 'space.1', type: 'dimension', value: { value: 99, unit: 'px' }, overridableBy: [] })
  const result = resolveExperienceTokens(config, engine)
  expect(!result.ok && result.stage).toBe('engine-validation')
  expect(!result.ok && result.issues.some((issue) => issue.code === 'UNAUTHORIZED_OVERRIDE')).toBe(true)
})

engineTest('real engine reports an unknown reference in an explicit base layer', async () => {
  const { config, engine } = await fixture()
  config.baseLayers = [...config.baseLayers!, {
    id: 'unknown-reference', type: 'component',
    tokens: [{ path: 'example.broken', type: 'color', value: { $ref: 'unknown.color' }, overridableBy: [] }],
  }]
  const result = resolveExperienceTokens(config, engine)
  expect(!result.ok && result.stage).toBe('engine-validation')
  expect(!result.ok && result.issues.some((issue) => issue.code === 'UNKNOWN_REFERENCE')).toBe(true)
})

engineTest('source payload mutation cannot alter real resolved dimensions', async () => {
  const { config, engine } = await fixture()
  const result = resolveExperienceTokens(config, engine)
  if (!result.ok) throw new Error('Expected a valid engine result')
  const asset = config.tokenAssets.find((asset) => asset.id === 'context.pos-touch')!
  const payload = asset.payload as LayerView
  Object.assign((payload.tokens[0] as { value: object }).value, { value: 99 })
  expect(result.resolution.tokens['component.button.height.md'].value).toEqual({ value: 48, unit: 'px' })
})
