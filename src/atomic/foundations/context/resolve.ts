import { DEFAULT_EXPERIENCE_CONTEXT } from './defaults'
import { isDenseArray, isPlainRecord as isRecord } from '../validation'
import { isPartialExperienceContext, validateContextValues } from './validate'
import { CONTEXT_FIELD_NAMES, CONTEXT_LAYER_KINDS } from './types'
import type {
  ContextContribution,
  ContextField,
  ContextIssue,
  ContextLayer,
  ContextLayerKind,
  ContextResolutionResult,
  ContextScalar,
  ContextSource,
  ContextTrace,
  ContextTraceEntry,
  ExperienceContext,
  ExperienceProfileDefinition,
} from './types'

/**
 * Higher-priority sources override lower-priority sources.
 * Order within the same kind is stable and follows the input array.
 */
export const CONTEXT_LAYER_PRIORITY: Readonly<Record<ContextLayerKind, number>> = Object.freeze({
  'context-preset': 10,
  'experience-profile': 20,
  'system-preferences': 30,
  'user-preferences': 40,
  scope: 50,
})

const LAYER_ID_PATTERN = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/
const LAYER_FIELDS = new Set(['id', 'kind', 'values'])

const DEFAULT_SOURCE: ContextSource = Object.freeze({
  id: 'library-defaults',
  kind: 'library-default',
})

function issue(
  code: ContextIssue['code'],
  path: string,
  message: string,
  received?: unknown,
): ContextIssue {
  return received === undefined ? { code, path, message } : { code, path, message, received }
}

function isLayerKind(value: unknown): value is ContextLayerKind {
  return typeof value === 'string' && CONTEXT_LAYER_KINDS.some((kind) => kind === value)
}

function makeTraceEntry(
  field: ContextField,
  value: ContextScalar,
  source: ContextSource,
  contributions: readonly ContextContribution[],
): ContextTraceEntry {
  return { field, value, source, contributions }
}

function initialTrace(context: ExperienceContext): ContextTrace {
  return {
    locale: makeTraceEntry('locale', context.locale, DEFAULT_SOURCE, [{ source: DEFAULT_SOURCE, value: context.locale }]),
    direction: makeTraceEntry('direction', context.direction, DEFAULT_SOURCE, [{ source: DEFAULT_SOURCE, value: context.direction }]),
    numberingSystem: makeTraceEntry('numberingSystem', context.numberingSystem, DEFAULT_SOURCE, [{ source: DEFAULT_SOURCE, value: context.numberingSystem }]),
    calendar: makeTraceEntry('calendar', context.calendar, DEFAULT_SOURCE, [{ source: DEFAULT_SOURCE, value: context.calendar }]),
    density: makeTraceEntry('density', context.density, DEFAULT_SOURCE, [{ source: DEFAULT_SOURCE, value: context.density }]),
    motion: makeTraceEntry('motion', context.motion, DEFAULT_SOURCE, [{ source: DEFAULT_SOURCE, value: context.motion }]),
    contrast: makeTraceEntry('contrast', context.contrast, DEFAULT_SOURCE, [{ source: DEFAULT_SOURCE, value: context.contrast }]),
    inputModality: makeTraceEntry('inputModality', context.inputModality, DEFAULT_SOURCE, [{ source: DEFAULT_SOURCE, value: context.inputModality }]),
    mixedScriptAlignment: makeTraceEntry('mixedScriptAlignment', context.mixedScriptAlignment, DEFAULT_SOURCE, [{ source: DEFAULT_SOURCE, value: context.mixedScriptAlignment }]),
  }
}

interface IndexedLayer {
  layer: ContextLayer
  index: number
}

/**
 * Resolve independent context layers into one plain, serializable context snapshot.
 *
 * This function does not resolve design tokens or generate CSS. It only composes
 * environment and preference values. Invalid layers fail the whole operation;
 * no invalid layer is silently skipped.
 */
export function resolveContextLayers(layers: readonly ContextLayer[] = []): ContextResolutionResult {
  const issues: ContextIssue[] = []
  const seenIds = new Set<string>()
  const indexedLayers: IndexedLayer[] = []

  if (!isDenseArray(layers)) {
    return {
      ok: false,
      issues: [issue('invalid-object', 'layers', 'Expected a dense array of context layers.', layers)],
    }
  }

  layers.forEach((candidate, index) => {
    const path = `layers[${index}]`
    if (!isRecord(candidate)) {
      issues.push(issue('invalid-object', path, 'Expected a context layer object.', candidate))
      return
    }

    for (const key of Object.keys(candidate)) {
      if (!LAYER_FIELDS.has(key)) {
        issues.push(issue('unknown-field', `${path}.${key}`, 'Unknown context layer property.', candidate[key]))
      }
    }

    const id = candidate.id
    const kind = candidate.kind
    const values = candidate.values

    if (typeof id !== 'string' || !LAYER_ID_PATTERN.test(id)) {
      issues.push(issue('invalid-layer-id', `${path}.id`, 'Layer id must be a stable lowercase slug.', id))
    } else if (seenIds.has(id)) {
      issues.push(issue('duplicate-layer-id', `${path}.id`, 'Layer ids must be unique within a resolution.', id))
    } else {
      seenIds.add(id)
    }

    if (!isLayerKind(kind)) {
      issues.push(issue('invalid-layer-kind', `${path}.kind`, 'Unsupported context layer kind.', kind))
    }

    const validation = validateContextValues(values, { partial: true })
    issues.push(...validation.issues.map((entry) => ({
      ...entry,
      path: entry.path.replace(/^context/, `${path}.values`),
    })))

    if (
      typeof id === 'string' &&
      LAYER_ID_PATTERN.test(id) &&
      isLayerKind(kind) &&
      validation.valid &&
      isPartialExperienceContext(values)
    ) {
      indexedLayers.push({
        layer: { id, kind, values },
        index,
      })
    }
  })

  if (issues.length > 0) return { ok: false, issues }

  indexedLayers.sort((a, b) => CONTEXT_LAYER_PRIORITY[a.layer.kind] - CONTEXT_LAYER_PRIORITY[b.layer.kind] || a.index - b.index)

  const context: ExperienceContext = { ...DEFAULT_EXPERIENCE_CONTEXT }
  const trace = initialTrace(context)

  for (const { layer } of indexedLayers) {
    for (const field of CONTEXT_FIELD_NAMES) {
      const value = layer.values[field]
      if (value === undefined) continue

      const source: ContextSource = { id: layer.id, kind: layer.kind }
      const contribution: ContextContribution = { source, value }
      const previous = trace[field]
      const contributions = [...(previous?.contributions ?? []), contribution]

      Object.assign(context, { [field]: value })
      trace[field] = makeTraceEntry(field, value, source, contributions)
    }
  }

  const finalValidation = validateContextValues(context, { partial: false })
  if (!finalValidation.valid) return { ok: false, issues: finalValidation.issues }

  return {
    ok: true,
    context,
    trace,
    appliedLayers: indexedLayers.map(({ layer }) => layer.id),
  }
}

/** Convert a validated experience profile into a resolver layer. */
export function profileToContextLayer(profile: ExperienceProfileDefinition): ContextLayer {
  return {
    id: profile.id,
    kind: 'experience-profile',
    values: { ...profile.context },
  }
}
