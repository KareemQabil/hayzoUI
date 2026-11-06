import { expect, test } from 'vitest'
import Ajv from 'ajv'
import profileSchema from '../context/schema/experience-profile.v1.schema.json'
import assetSchema from './schema/style-asset.v1.schema.json'
import planSchema from './schema/experience-plan-input.v1.schema.json'
import {
  resolveContextLayers,
  resolveExperienceContext,
  resolveExperiencePlan,
  validateContextPresetDefinition,
  validateVisualSystemDefinition,
} from '../index'
import type { ExperiencePlanInput, StyleAssetDefinition } from '../index'
import { arabicErpCompactProfile, arabicPosTouchProfile, englishCrmDefaultProfile } from '../context/examples/profiles'
import {
  crmResponsiveContextPreset,
  editorialCleanVisualSystem,
  erpCompactContextPreset,
  neutralBlueBrandTheme,
  posTouchContextPreset,
  quietEnterpriseVisualSystem,
} from './examples/assets'

function posInput(overrides: Partial<ExperiencePlanInput> = {}): ExperiencePlanInput {
  return {
    profile: arabicPosTouchProfile,
    styleAssets: [quietEnterpriseVisualSystem, neutralBlueBrandTheme, posTouchContextPreset],
    appearanceMode: 'light',
    ...overrides,
  }
}

const validateInputSchema = new Ajv({ allErrors: true, strict: false })
  .addSchema(profileSchema)
  .addSchema(assetSchema)
  .compile(planSchema)

test.each([
  [arabicPosTouchProfile, quietEnterpriseVisualSystem, posTouchContextPreset, 'touch'],
  [arabicErpCompactProfile, quietEnterpriseVisualSystem, erpCompactContextPreset, 'compact'],
  [englishCrmDefaultProfile, editorialCleanVisualSystem, crmResponsiveContextPreset, 'default'],
] as const)('resolves exact assets for $0.id', (profile, visualSystem, contextPreset, density) => {
  const result = resolveExperiencePlan(posInput({ profile, styleAssets: [visualSystem, neutralBlueBrandTheme, contextPreset] }))
  expect(validateInputSchema(posInput({ profile, styleAssets: [visualSystem, neutralBlueBrandTheme, contextPreset] }))).toBe(true)
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.plan.profile).toEqual({ id: profile.id, version: profile.version })
  expect(result.plan.assets.visualSystem).toEqual(profile.visualSystem)
  expect(result.plan.context.density).toBe(density)
  expect(result.plan.requirements).toEqual(contextPreset.requirements)
  expect(JSON.parse(JSON.stringify(result))).toEqual(result)
})

test('catalog order cannot change selected assets or the resulting request order', () => {
  const input = posInput()
  expect(resolveExperiencePlan(input)).toEqual(resolveExperiencePlan({ ...input, styleAssets: [...input.styleAssets].reverse() }))
  const result = resolveExperiencePlan(input)
  if (!result.ok) throw new Error('Expected a valid plan')
  expect(result.plan.tokenLayers.map((layer) => layer.id)).toEqual(['brand.neutral-blue', 'visual.quiet-enterprise', 'context.pos-touch'])
})

test('chooses the exact requested version when several versions coexist', () => {
  const newer = { ...neutralBlueBrandTheme, version: '0.2.0', tokenLayers: [{ id: 'brand.newer', version: '0.2.0' }] }
  const result = resolveExperiencePlan(posInput({ styleAssets: [...posInput().styleAssets, newer] }))
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.plan.assets.brandTheme.version).toBe('0.1.0')
  expect(result.plan.tokenLayers.map((layer) => layer.id)).not.toContain('brand.newer')
})

test('never substitutes an available newer version for a missing exact version', () => {
  const result = resolveExperiencePlan(posInput({ styleAssets: [quietEnterpriseVisualSystem, { ...neutralBlueBrandTheme, version: '0.2.0' }, posTouchContextPreset] }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.issues).toEqual([expect.objectContaining({ code: 'missing-asset', path: 'profile.brandTheme' })])
  expect(result).not.toHaveProperty('plan')
})

test('reports all missing selected identities', () => {
  const result = resolveExperiencePlan(posInput({ styleAssets: [] }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.issues.map((entry) => entry.path)).toEqual(['profile.visualSystem', 'profile.brandTheme', 'profile.contextPreset'])
})

test('asset kind is part of identity, even when id and version coincide', () => {
  const theme = { ...neutralBlueBrandTheme, id: quietEnterpriseVisualSystem.id }
  const profile = { ...arabicPosTouchProfile, brandTheme: { id: theme.id, version: theme.version } }
  const result = resolveExperiencePlan(posInput({ profile, styleAssets: [theme, quietEnterpriseVisualSystem, posTouchContextPreset] }))
  expect(result.ok).toBe(true)
})

test('wrong-kind assets do not satisfy a profile reference', () => {
  const fakeTheme = { ...neutralBlueBrandTheme, id: quietEnterpriseVisualSystem.id }
  const result = resolveExperiencePlan(posInput({ styleAssets: [fakeTheme, neutralBlueBrandTheme, posTouchContextPreset] }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.issues.some((entry) => entry.path === 'profile.visualSystem' && entry.code === 'missing-asset')).toBe(true)
})

test('duplicate exact identities fail instead of making selection depend on catalog order', () => {
  const result = resolveExperiencePlan(posInput({ styleAssets: [...posInput().styleAssets, { ...neutralBlueBrandTheme, name: 'A different payload' }] }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.issues.some((entry) => entry.code === 'duplicate-asset')).toBe(true)
})

test('deduplicates identical layer requests while retaining every requesting source', () => {
  const shared = { id: 'shared.palette', version: '1.0.0' }
  const result = resolveExperiencePlan(posInput({ styleAssets: [
    { ...quietEnterpriseVisualSystem, tokenLayers: [shared] },
    { ...neutralBlueBrandTheme, tokenLayers: [shared] },
    posTouchContextPreset,
  ] }))
  expect(result.ok).toBe(true)
  if (!result.ok) return
  const requests = result.plan.tokenLayers.filter((layer) => layer.id === 'shared.palette')
  expect(requests).toHaveLength(1)
  expect(requests[0].requestedBy.map((source) => source.kind)).toEqual(['brand-theme', 'visual-system'])
  expect(requests[0].requestedBy[1].path).toBe('visual-system:quiet-enterprise@0.1.0.tokenLayers[0]')
})

test.each(['tokenLayers', 'recipeLayers'] as const)('rejects conflicting exact versions in %s with provenance', (field) => {
  const result = resolveExperiencePlan(posInput({ styleAssets: [
    { ...quietEnterpriseVisualSystem, [field]: [{ id: 'shared.layer', version: '1.0.0' }] },
    neutralBlueBrandTheme,
    { ...posTouchContextPreset, [field]: [{ id: 'shared.layer', version: '2.0.0' }] },
  ] }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  const issue = result.issues.find((entry) => entry.code === 'conflicting-layer-version')
  expect(issue?.received).toEqual(expect.objectContaining({
    first: expect.objectContaining({ id: 'shared.layer', version: '1.0.0' }),
    conflicting: expect.objectContaining({ id: 'shared.layer', version: '2.0.0' }),
  }))
  expect(result).not.toHaveProperty('plan')
})

test('token and recipe requests have independent namespaces', () => {
  const result = resolveExperiencePlan(posInput({ styleAssets: [
    { ...quietEnterpriseVisualSystem, tokenLayers: [{ id: 'shared.layer', version: '1.0.0' }], recipeLayers: [{ id: 'shared.layer', version: '2.0.0' }] },
    neutralBlueBrandTheme, posTouchContextPreset,
  ] }))
  expect(result.ok).toBe(true)
})

test('a context preset may omit its recipe layer references', () => {
  const result = resolveExperiencePlan(posInput({ styleAssets: [quietEnterpriseVisualSystem, neutralBlueBrandTheme, { ...posTouchContextPreset, recipeLayers: undefined }] }))
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.plan.recipeLayers.map((request) => request.id)).toEqual(['recipes.quiet-enterprise'])
})

test('passes runtime preferences through effective context compatibility validation', () => {
  const result = resolveExperiencePlan(posInput({ preferenceLayers: [{ id: 'operator', kind: 'user-preferences', values: { density: 'compact' } }] }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.issues.some((entry) => entry.code === 'unsupported-density')).toBe(true)
})

test('retains context provenance after successful scope overrides', () => {
  const result = resolveExperiencePlan(posInput({ preferenceLayers: [{ id: 'local', kind: 'scope', values: { direction: 'ltr', motion: 'reduced' } }] }))
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.plan.context.direction).toBe('ltr')
  expect(result.plan.context.locale).toBe('ar-SA')
  expect(result.plan.trace.direction?.source.id).toBe('local')
  expect(result.plan.appliedLayers[result.plan.appliedLayers.length - 1]).toBe('local')
})

test('actual appearance mode must be supported by the selected assets', () => {
  const result = resolveExperiencePlan(posInput({ profile: englishCrmDefaultProfile, styleAssets: [editorialCleanVisualSystem, neutralBlueBrandTheme, crmResponsiveContextPreset], appearanceMode: 'dark' }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.issues.some((entry) => entry.code === 'unsupported-appearance-mode')).toBe(true)
})

test('validates unselected catalog entries as well as selected entries', () => {
  const result = resolveExperiencePlan(posInput({ styleAssets: [...posInput().styleAssets, { kind: 'brand-theme', id: 'broken' }] }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.issues.every((entry) => entry.path.startsWith('styleAssets[3]'))).toBe(true)
})

test.each([null, {}, 'assets', [null], [{ kind: 'unknown' }], Array(1)])('invalid catalog input returns diagnostics: %j', (styleAssets) => {
  expect(resolveExperiencePlan(posInput({ styleAssets: styleAssets as never })).ok).toBe(false)
})

test('rejects malformed profiles and unknown plan fields without throwing', () => {
  expect(resolveExperiencePlan(null as never).ok).toBe(false)
  expect(resolveExperiencePlan(posInput({ profile: null })).ok).toBe(false)
  expect(resolveExperiencePlan({ ...posInput(), styleAsset: [] } as never).ok).toBe(false)
})

test.each([
  { appearanceMode: 'automatic' },
  { styleAssets: [null] },
  { preferenceLayers: [{ id: 'extra', kind: 'context-preset', values: {} }] },
  { preferenceLayers: [{ id: 'operator', kind: 'user-preferences', values: { direciton: 'rtl' } }] },
])('schema and runtime reject structurally invalid plan inputs: %j', (overrides) => {
  const input = { ...posInput(), ...overrides }
  expect(validateInputSchema(input)).toBe(false)
  expect(resolveExperiencePlan(input as never).ok).toBe(false)
})

test('schema acceptance alone does not prove reference availability', () => {
  const input = posInput({ styleAssets: [] })
  expect(validateInputSchema(input)).toBe(true)
  expect(resolveExperiencePlan(input).ok).toBe(false)
})

test('source mutation cannot change a completed plan or another resolution', () => {
  const input = structuredClone(posInput())
  const result = resolveExperiencePlan(input)
  if (!result.ok) throw new Error('Expected a valid plan')
  const before = JSON.stringify(result)
  const assets = input.styleAssets as StyleAssetDefinition[]
  assets[0].tokenLayers[0].version = '9.0.0'
  if (assets[2].kind === 'context-preset') assets[2].requirements.supportedInputModalities.length = 0
  expect(JSON.stringify(result)).toBe(before)
  result.plan.tokenLayers[0].requestedBy[0].id = 'edited-output'
  expect(resolveExperiencePlan(posInput()).ok).toBe(true)
  expect(neutralBlueBrandTheme.id).toBe('neutral-blue')
})

test('frozen source graphs can be resolved without modification', () => {
  const input = structuredClone(posInput())
  function freeze(value: unknown): void {
    if (typeof value !== 'object' || value === null) return
    for (const item of Object.values(value)) freeze(item)
    Object.freeze(value)
  }
  freeze(input)
  const result = resolveExperiencePlan(input)
  expect(result.ok).toBe(true)
  expect(result).toEqual(resolveExperiencePlan(structuredClone(input)))
})

test('sparse arrays never bypass foundation validation', () => {
  expect(resolveContextLayers(Array(1)).ok).toBe(false)
  expect(validateVisualSystemDefinition({ ...quietEnterpriseVisualSystem, tokenLayers: Array(1) }).valid).toBe(false)
  expect(validateVisualSystemDefinition({ ...quietEnterpriseVisualSystem, principles: Array(1) }).valid).toBe(false)
  expect(validateContextPresetDefinition({ ...posTouchContextPreset, supportedDensities: Array(1) }).valid).toBe(false)
  expect(resolveExperienceContext({ profile: arabicPosTouchProfile, visualSystem: quietEnterpriseVisualSystem, brandTheme: neutralBlueBrandTheme, contextPreset: posTouchContextPreset, appearanceMode: 'light', preferenceLayers: Array(1) }).ok).toBe(false)
})
