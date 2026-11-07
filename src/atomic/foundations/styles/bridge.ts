import type { ContextLayer } from '../context/types'
import type { ContextPresetDefinition } from './types'

/** Convert a validated context preset's environment defaults into a context resolver layer. */
export function contextPresetToContextLayer(preset: ContextPresetDefinition): ContextLayer {
  return {
    id: preset.id,
    kind: 'context-preset',
    values: { ...preset.environmentDefaults },
  }
}
