import { isVersionedReference, resolveExperiencePlan } from '../foundations'
import type { ExperiencePlan, ExperiencePlanInput, ExperiencePlanResult, LayerRequestSource, VersionedReference } from '../foundations'
import { jsonSnapshot, SnapshotError } from './json-snapshot'

/** Exact registry identity and an explicit binding to the engine's layer ID. */
export interface VersionedTokenAsset<T = unknown> extends VersionedReference {
  schemaVersion: 1
  kind: 'token-layer'
  layerId: string
  payload: T
}

export interface ExperienceTokenInput {
  experience: ExperiencePlanInput
  tokenAssets: readonly VersionedTokenAsset[]
  /** Explicit shared primitives/semantics/component token contracts, never inferred. */
  baseLayers?: readonly unknown[]
}

export interface TokenEngineResolution<I> {
  readonly isValid: boolean
  readonly issues: readonly I[]
}

/** Matches the current engine's public API without importing its implementation. */
export interface TokenEnginePort<L, I, R extends TokenEngineResolution<I>> {
  validateTokenLayers(layers: readonly unknown[]): readonly I[]
  resolveTokens(layers: readonly L[]): R
}

export interface BoundTokenLayer<L> extends VersionedReference {
  layerId: string
  requestedBy: LayerRequestSource[]
  payload: L
}

export interface TokenBindingIssue {
  code: 'invalid-input' | 'invalid-asset' | 'duplicate-asset' | 'missing-asset'
    | 'layer-id-mismatch' | 'duplicate-layer-id' | 'invalid-payload'
    | 'engine-exception' | 'invalid-engine-result'
  path: string
  message: string
}

export type ExperienceTokenResult<L, I, R extends TokenEngineResolution<I>> =
  | { ok: true; plan: ExperiencePlan; bindings: BoundTokenLayer<L>[]; layers: readonly L[]; resolution: R }
  | { ok: false; stage: 'plan'; issues: Extract<ExperiencePlanResult, { ok: false }>['issues'] }
  | { ok: false; stage: 'binding' | 'adapter'; issues: TokenBindingIssue[] }
  | { ok: false; stage: 'engine-validation' | 'engine-resolution'; issues: readonly I[] }

const INPUT_FIELDS = new Set(['experience', 'tokenAssets', 'baseLayers'])
const ASSET_FIELDS = new Set(['schemaVersion', 'kind', 'id', 'version', 'layerId', 'payload'])

function record(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}

function dense(value: unknown): value is unknown[] {
  if (!Array.isArray(value)) return false
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index)) return false
  }
  return true
}

/** Bind exact payload snapshots, then delegate all token semantics to the supplied engine. */
export function resolveExperienceTokens<L extends { readonly id: string }, I, R extends TokenEngineResolution<I>>(
  input: ExperienceTokenInput,
  engine: TokenEnginePort<L, I, R>,
): ExperienceTokenResult<L, I, R> {
  const issues: TokenBindingIssue[] = []
  const fail = (code: TokenBindingIssue['code'], path: string, message: string): void => { issues.push({ code, path, message }) }
  if (!record(input)) {
    return { ok: false, stage: 'binding', issues: [{ code: 'invalid-input', path: 'input', message: 'Expected an experience token input object.' }] }
  }
  for (const field of Object.keys(input)) {
    if (!INPUT_FIELDS.has(field)) fail('invalid-input', `input.${field}`, 'Unknown adapter input property.')
  }
  if (!engine || typeof engine.validateTokenLayers !== 'function' || typeof engine.resolveTokens !== 'function') {
    fail('invalid-input', 'engine', 'Supply the synchronous token engine public validation and resolution functions.')
  }
  if (issues.length) return { ok: false, stage: 'binding', issues }

  const planned = resolveExperiencePlan(input.experience)
  if (!planned.ok) return { ok: false, stage: 'plan', issues: planned.issues }

  const catalog = new Map<string, VersionedTokenAsset>()
  if (!dense(input.tokenAssets)) {
    fail('invalid-input', 'tokenAssets', 'Expected a dense array of versioned token assets.')
  } else {
    input.tokenAssets.forEach((candidate, index) => {
      const path = `tokenAssets[${index}]`
      let snapshot: unknown
      try {
        snapshot = jsonSnapshot(candidate, path)
      } catch (error) {
        if (!(error instanceof SnapshotError)) throw error
        fail('invalid-asset', error.path, error.message)
        return
      }
      if (!record(snapshot)) {
        fail('invalid-asset', path, 'Expected a plain token asset envelope.')
        return
      }
      const ref = { id: snapshot.id, version: snapshot.version }
      if (!isVersionedReference(ref)
        || snapshot.schemaVersion !== 1 || snapshot.kind !== 'token-layer'
        || typeof snapshot.layerId !== 'string' || snapshot.layerId.length === 0
        || !Object.prototype.hasOwnProperty.call(snapshot, 'payload')
        || Object.keys(snapshot).some((field) => !ASSET_FIELDS.has(field))) {
        fail('invalid-asset', path, 'Expected an exact versioned token-layer envelope with an explicit layerId and payload.')
        return
      }
      const key = `${ref.id}@${ref.version}`
      if (catalog.has(key)) fail('duplicate-asset', path, `Duplicate exact token asset: ${key}.`)
      else catalog.set(key, { schemaVersion: 1, kind: 'token-layer', ...ref, layerId: snapshot.layerId, payload: snapshot.payload })
    })
  }

  const base = input.baseLayers === undefined ? [] : input.baseLayers
  if (!dense(base)) fail('invalid-input', 'baseLayers', 'Expected a dense array of shared base token layers.')
  if (issues.length) return { ok: false, stage: 'binding', issues }

  const layers: unknown[] = []
  const bindings: BoundTokenLayer<unknown>[] = []
  const seenLayerIds = new Set<string>()
  function addLayer(payload: unknown, path: string, expectedId?: string): unknown {
    let snapshot: unknown
    try {
      snapshot = jsonSnapshot(payload, path)
    } catch (error) {
      if (!(error instanceof SnapshotError)) throw error
      fail('invalid-payload', error.path, error.message)
      return undefined
    }
    if (!record(snapshot) || typeof snapshot.id !== 'string' || snapshot.id.length === 0) {
      fail('invalid-payload', `${path}.id`, 'A bound token layer must expose its own id.')
    } else if (expectedId !== undefined && snapshot.id !== expectedId) {
      fail('layer-id-mismatch', `${path}.id`, 'Payload id does not match the explicitly bound layerId.')
    } else if (seenLayerIds.has(snapshot.id)) {
      fail('duplicate-layer-id', `${path}.id`, `Several inputs bind to engine layer id ${snapshot.id}.`)
    } else {
      seenLayerIds.add(snapshot.id)
      layers.push(snapshot)
      return snapshot
    }
    return undefined
  }

  base.forEach((layer, index) => addLayer(layer, `baseLayers[${index}]`))
  for (const request of planned.plan.tokenLayers) {
    const key = `${request.id}@${request.version}`
    const asset = catalog.get(key)
    if (!asset) {
      fail('missing-asset', `tokenAssets.${key}`, `No exact payload is available for ${key}.`)
      continue
    }
    const payload = addLayer(asset.payload, `tokenAssets.${key}.payload`, asset.layerId)
    if (payload !== undefined) bindings.push({ id: request.id, version: request.version, layerId: asset.layerId, requestedBy: request.requestedBy, payload })
  }
  if (issues.length) return { ok: false, stage: 'binding', issues }
  Object.freeze(layers)

  let engineIssues: readonly I[]
  try {
    engineIssues = engine.validateTokenLayers(layers)
  } catch {
    return { ok: false, stage: 'adapter', issues: [{ code: 'engine-exception', path: 'engine.validateTokenLayers', message: 'The supplied engine validator threw an exception.' }] }
  }
  if (!dense(engineIssues)) {
    return { ok: false, stage: 'adapter', issues: [{ code: 'invalid-engine-result', path: 'engine.validateTokenLayers', message: 'Expected a synchronous array of engine diagnostics.' }] }
  }
  if (engineIssues.length > 0) return { ok: false, stage: 'engine-validation', issues: engineIssues }

  // The injected validator owns the full token shape; the adapter only owns bindings.
  const typedLayers = layers as L[]
  let resolution: R
  try {
    resolution = engine.resolveTokens(typedLayers)
  } catch {
    return { ok: false, stage: 'adapter', issues: [{ code: 'engine-exception', path: 'engine.resolveTokens', message: 'The supplied engine resolver threw an exception.' }] }
  }
  if (!record(resolution) || typeof resolution.isValid !== 'boolean' || !dense(resolution.issues)
    || resolution.isValid === (resolution.issues.length > 0)) {
    return { ok: false, stage: 'adapter', issues: [{ code: 'invalid-engine-result', path: 'engine.resolveTokens', message: 'Expected a consistent engine validity flag and diagnostics array.' }] }
  }
  if (!resolution.isValid) return { ok: false, stage: 'engine-resolution', issues: resolution.issues }

  return { ok: true, plan: planned.plan, bindings: bindings as BoundTokenLayer<L>[], layers: typedLayers, resolution }
}
