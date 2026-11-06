import { expect, test, vi } from 'vitest'
import Ajv from 'ajv'
import profileSchema from '../foundations/context/schema/experience-profile.v1.schema.json'
import tokenAssetSchema from './token-asset.v1.schema.json'
import { isVersionedReference } from '../foundations'
import type { ExperienceTokenInput, TokenEngineResolution } from './index'
import { resolveExperienceTokens } from './index'
import { arabicPosTouchProfile } from '../foundations/context/examples/profiles'
import { neutralBlueBrandTheme, posTouchContextPreset, quietEnterpriseVisualSystem } from '../foundations/styles/examples/assets'

interface TestLayer { readonly id: string; readonly value?: { readonly amount: number } }
interface TestIssue { code: string; explanation: string }
interface TestResolution extends TokenEngineResolution<TestIssue> { ids: string[] }

const validateEnvelope = new Ajv({ allErrors: true }).addSchema(profileSchema).compile(tokenAssetSchema)

function input(): ExperienceTokenInput {
  return {
    experience: {
      profile: structuredClone(arabicPosTouchProfile),
      styleAssets: structuredClone([quietEnterpriseVisualSystem, neutralBlueBrandTheme, posTouchContextPreset]),
      appearanceMode: 'light',
    },
    tokenAssets: [
      { schemaVersion: 1, kind: 'token-layer', id: 'visual.quiet-enterprise', version: '0.1.0', layerId: 'visual-quiet-enterprise', payload: { id: 'visual-quiet-enterprise' } },
      { schemaVersion: 1, kind: 'token-layer', id: 'brand.neutral-blue', version: '0.1.0', layerId: 'theme', payload: { id: 'theme', value: { amount: 16 } } },
      { schemaVersion: 1, kind: 'token-layer', id: 'context.pos-touch', version: '0.1.0', layerId: 'context-pos', payload: { id: 'context-pos' } },
    ],
    baseLayers: [{ id: 'base' }],
  }
}

function port() {
  return {
    validateTokenLayers: vi.fn((_layers: readonly unknown[]): readonly TestIssue[] => []),
    resolveTokens: vi.fn((layers: readonly TestLayer[]): TestResolution => ({ isValid: true, issues: [], ids: layers.map((layer) => layer.id) })),
  }
}

test('binds registry IDs explicitly and delegates the complete stack to the engine', () => {
  const engine = port()
  const result = resolveExperienceTokens(input(), engine)
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.resolution.ids).toEqual(['base', 'theme', 'visual-quiet-enterprise', 'context-pos'])
  expect(result.bindings[0]).toMatchObject({ id: 'brand.neutral-blue', layerId: 'theme', version: '0.1.0' })
  expect(result.bindings[0].requestedBy[0].kind).toBe('brand-theme')
  expect(engine.validateTokenLayers).toHaveBeenCalledWith(result.layers)
  expect(engine.resolveTokens).toHaveBeenCalledWith(result.layers)
  expect(result.plan.recipeLayers).toHaveLength(2)
  expect(input().tokenAssets.every((asset) => validateEnvelope(asset))).toBe(true)
})

test('token catalog order does not affect successful binding', () => {
  const config = input()
  expect(resolveExperienceTokens(config, port())).toEqual(resolveExperienceTokens({ ...config, tokenAssets: [...config.tokenAssets].reverse() }, port()))
})

test('missing payload versions fail before invoking the engine', () => {
  const config = input()
  config.tokenAssets[1].version = '0.2.0'
  const engine = port()
  const result = resolveExperienceTokens(config, engine)
  expect(result.ok).toBe(false)
  if (result.ok || result.stage !== 'binding') throw new Error('Expected binding failure')
  expect(result.issues[0].code).toBe('missing-asset')
  expect(engine.validateTokenLayers).not.toHaveBeenCalled()
  expect(result).not.toHaveProperty('resolution')
})

test('exact catalog versions may coexist without selecting the latest', () => {
  const config = input()
  config.tokenAssets = [...config.tokenAssets, { ...config.tokenAssets[1], version: '0.2.0', layerId: 'newer', payload: { id: 'newer' } }]
  const result = resolveExperienceTokens(config, port())
  expect(result.ok && result.resolution.ids).not.toContain('newer')
  expect(result.ok).toBe(true)
})

test('duplicate exact envelopes are rejected rather than using catalog order', () => {
  const config = input()
  config.tokenAssets = [...config.tokenAssets, { ...config.tokenAssets[1] }]
  const result = resolveExperienceTokens(config, port())
  expect(!result.ok && result.stage === 'binding' && result.issues.some((issue) => issue.code === 'duplicate-asset')).toBe(true)
})

test('payload ID must match its explicit binding', () => {
  const config = input()
  config.tokenAssets[1].payload = { id: 'different' }
  const result = resolveExperienceTokens(config, port())
  expect(!result.ok && result.stage === 'binding' && result.issues[0].code).toBe('layer-id-mismatch')
})

test('two reference IDs cannot silently collapse into the same engine layer ID', () => {
  const config = input()
  config.tokenAssets[0].layerId = 'theme'
  config.tokenAssets[0].payload = { id: 'theme' }
  const result = resolveExperienceTokens(config, port())
  expect(!result.ok && result.stage === 'binding' && result.issues[0].code).toBe('duplicate-layer-id')
})

test('base layers participate in engine layer ID collision checks', () => {
  const config = input()
  config.baseLayers = [{ id: 'theme' }]
  const result = resolveExperienceTokens(config, port())
  expect(!result.ok && result.stage === 'binding' && result.issues[0].code).toBe('duplicate-layer-id')
})

test('planning errors are returned unchanged without invoking the engine', () => {
  const config = input()
  config.experience.preferenceLayers = [{ id: 'operator', kind: 'scope', values: { density: 'compact' } }]
  const engine = port()
  const result = resolveExperienceTokens(config, engine)
  expect(!result.ok && result.stage === 'plan' && result.issues.some((issue) => issue.code === 'unsupported-density')).toBe(true)
  expect(engine.validateTokenLayers).not.toHaveBeenCalled()
})

test('engine validation diagnostics are preserved and resolution is not attempted', () => {
  const engine = port()
  const issues: TestIssue[] = [{ code: 'UNKNOWN_REFERENCE', explanation: 'Unresolved token.' }]
  engine.validateTokenLayers.mockReturnValue(issues)
  const result = resolveExperienceTokens(input(), engine)
  expect(!result.ok && result.stage).toBe('engine-validation')
  expect(!result.ok && result.issues).toBe(issues)
  expect(engine.resolveTokens).not.toHaveBeenCalled()
})

test('engine resolution failures expose diagnostics without partial bindings', () => {
  const engine = port()
  const issues: TestIssue[] = [{ code: 'REFERENCE_CYCLE', explanation: 'Cycle.' }]
  engine.resolveTokens.mockReturnValue({ isValid: false, issues, ids: [] })
  const result = resolveExperienceTokens(input(), engine)
  expect(!result.ok && result.stage).toBe('engine-resolution')
  expect(!result.ok && result.issues).toBe(issues)
  expect(result).not.toHaveProperty('bindings')
})

test.each(['validateTokenLayers', 'resolveTokens'] as const)('exceptions in engine.%s are reported without partial output', (method) => {
  const engine = port()
  engine[method].mockImplementation(() => { throw new Error('Internal failure') })
  const result = resolveExperienceTokens(input(), engine)
  expect(!result.ok && result.stage === 'adapter' && result.issues[0].code).toBe('engine-exception')
  expect(result).not.toHaveProperty('layers')
})

test.each([
  { isValid: true, issues: [{ code: 'ERROR' }], ids: [] },
  { isValid: false, issues: [], ids: [] },
  null,
])('inconsistent resolver responses fail: %j', (response) => {
  const engine = port()
  engine.resolveTokens.mockReturnValue(response as never)
  const result = resolveExperienceTokens(input(), engine)
  expect(!result.ok && result.stage === 'adapter' && result.issues[0].code).toBe('invalid-engine-result')
})

test('a malformed validator response cannot bypass validation', () => {
  const engine = port()
  engine.validateTokenLayers.mockReturnValue(null as never)
  const result = resolveExperienceTokens(input(), engine)
  expect(!result.ok && result.stage === 'adapter' && result.issues[0].code).toBe('invalid-engine-result')
  expect(engine.resolveTokens).not.toHaveBeenCalled()
})

test('source edits cannot change the frozen layer snapshots sent to the engine', () => {
  const config = input()
  const original = config.tokenAssets[1].payload as TestLayer
  const before = JSON.stringify(config)
  const result = resolveExperienceTokens(config, port())
  if (!result.ok) throw new Error('Expected success')
  expect(JSON.stringify(config)).toBe(before)
  expect(Object.isFrozen(original)).toBe(false)
  expect(Object.isFrozen(result.layers)).toBe(true)
  expect(Object.isFrozen(result.bindings[0].payload.value)).toBe(true)
  Object.assign(original.value!, { amount: 99 })
  expect(result.bindings[0].payload.value?.amount).toBe(16)
  expect(() => Object.assign(result.bindings[0].payload.value!, { amount: 33 })).toThrow(TypeError)
})

test('frozen caller-owned layers also work', () => {
  const config = input()
  for (const asset of config.tokenAssets) Object.freeze(asset.payload)
  expect(resolveExperienceTokens(config, port()).ok).toBe(true)
})

test.each([null, {}, 'assets', Array(1)])('rejects malformed catalogs: %j', (tokenAssets) => {
  expect(resolveExperienceTokens({ ...input(), tokenAssets: tokenAssets as never }, port()).ok).toBe(false)
})

test.each([null, {}, Array(1)])('rejects malformed base layers: %j', (baseLayers) => {
  expect(resolveExperienceTokens({ ...input(), baseLayers: baseLayers as never }, port()).ok).toBe(false)
})

test.each([
  { version: '^1.0.0' }, { kind: 'recipe-layer' }, { layerId: '' }, { extra: true }, { payload: null },
])('rejects invalid envelopes: %j', (overrides) => {
  const config = input()
  config.tokenAssets = [{ ...config.tokenAssets[0], ...overrides } as never, ...config.tokenAssets.slice(1)]
  expect(resolveExperienceTokens(config, port()).ok).toBe(false)
})

test.each([NaN, Infinity, BigInt(1), () => null, new Date(), undefined, Array(1)])('rejects non-JSON payload data: %s', (value) => {
  const config = input()
  config.tokenAssets[1].payload = { id: 'theme', value: [value] }
  const result = resolveExperienceTokens(config, port())
  expect(!result.ok && result.stage).toBe('binding')
})

test('cyclic payloads fail without calling the engine', () => {
  const config = input()
  const payload: Record<string, unknown> = { id: 'theme' }
  payload.self = payload
  config.tokenAssets[1].payload = payload
  const engine = port()
  expect(resolveExperienceTokens(config, engine).ok).toBe(false)
  expect(engine.validateTokenLayers).not.toHaveBeenCalled()
})

test('accessor payloads are rejected without invoking getters', () => {
  const config = input()
  const getter = vi.fn(() => 99)
  config.tokenAssets[1].payload = Object.defineProperty({ id: 'theme' }, 'value', { get: getter, enumerable: true })
  expect(resolveExperienceTokens(config, port()).ok).toBe(false)
  expect(getter).not.toHaveBeenCalled()
})

test('undefined optional object properties follow JSON omission semantics', () => {
  const config = input()
  config.tokenAssets[1].payload = { id: 'theme', description: undefined }
  expect(resolveExperienceTokens(config, port()).ok).toBe(true)
})

test('shared noncyclic references are supported and copied safely', () => {
  const config = input()
  const shared = { amount: 16 }
  config.tokenAssets[1].payload = { id: 'theme', a: shared, b: shared }
  expect(resolveExperienceTokens(config, port()).ok).toBe(true)
})

test('unknown input keys and missing engine functions cannot silently pass', () => {
  expect(resolveExperienceTokens({ ...input(), extra: true } as never, port()).ok).toBe(false)
  expect(resolveExperienceTokens(input(), {} as never).ok).toBe(false)
  expect(resolveExperienceTokens(null as never, port()).ok).toBe(false)
})

test('the shared public reference guard rejects ranges and unknown properties', () => {
  expect(isVersionedReference({ id: 'brand.palette', version: '1.0.0-beta.1' })).toBe(true)
  expect(isVersionedReference({ id: 'brand', version: '^1.0.0' })).toBe(false)
  expect(isVersionedReference({ id: 'brand', version: '1.0.0', extra: true })).toBe(false)
})

test.each([{ version: 'latest' }, { kind: 'recipe-layer' }, { extra: true }])('envelope schema rejects invalid metadata: %j', (overrides) => {
  expect(validateEnvelope({ ...input().tokenAssets[0], ...overrides })).toBe(false)
})

test('envelope schema does not pretend to validate token payload semantics', () => {
  const config = input()
  config.tokenAssets[0].payload = null
  expect(validateEnvelope(config.tokenAssets[0])).toBe(true)
  expect(resolveExperienceTokens(config, port()).ok).toBe(false)
})

test('payload nesting limits return diagnostics rather than overflowing the stack', () => {
  const config = input()
  let nested: unknown = 1
  for (let depth = 0; depth < 110; depth += 1) nested = { nested }
  config.tokenAssets[0].payload = { id: 'visual-quiet-enterprise', nested }
  expect(resolveExperienceTokens(config, port()).ok).toBe(false)
})
