/**
 * S0–S2 token layers and the S4/S5/S6 layers for the first proof (Button + TextField).
 *
 * Every value a recipe reads is a component token (S2). Component tokens alias semantic tokens (S1), which alias
 * primitives (S0). A visual system, a brand theme, and a context preset may only override tokens whose original
 * definition lists their layer type in `overridableBy` — the engine rejects anything else.
 *
 * Who may change what:
 *   theme          → colors (brand identity)
 *   visual-system  → shape, borders, typography character, field treatment, elevation
 *   context        → sizes: control height, padding, font size, gaps, minimum target
 */
import type { TokenDefinition, TokenLayer } from '../tokens'

type Def = TokenDefinition
const px = (value: number) => ({ value, unit: 'px' as const })
const ref = (path: string) => ({ $ref: path })

const COLOR_BY = ['theme', 'visual-system'] as const
const SHAPE_BY = ['visual-system'] as const
const SIZE_BY = ['context'] as const

// S0 — primitives: raw values only.
export const primitiveLayer: TokenLayer = {
  id: 'hz-primitives',
  type: 'primitive',
  tokens: [
    { path: 'color.palette.neutral.0', type: 'color', value: '#FFFFFF', overridableBy: [] },
    { path: 'color.palette.neutral.50', type: 'color', value: '#F6F7F9', overridableBy: [] },
    { path: 'color.palette.neutral.100', type: 'color', value: '#EDEFF3', overridableBy: [] },
    { path: 'color.palette.neutral.200', type: 'color', value: '#D9DDE5', overridableBy: [] },
    { path: 'color.palette.neutral.400', type: 'color', value: '#8A93A3', overridableBy: [] },
    { path: 'color.palette.neutral.600', type: 'color', value: '#4E5869', overridableBy: [] },
    { path: 'color.palette.neutral.900', type: 'color', value: '#161C2A', overridableBy: [] },
    { path: 'color.palette.red.600', type: 'color', value: '#B42332', overridableBy: [] },
    { path: 'color.palette.red.700', type: 'color', value: '#951B28', overridableBy: [] },
    { path: 'font.sans', type: 'font-family', value: ['IBM Plex Sans Arabic', 'IBM Plex Sans', 'system-ui', 'sans-serif'], overridableBy: [] },
    { path: 'font.naskh', type: 'font-family', value: ['Noto Naskh Arabic', 'Noto Serif', 'Georgia', 'serif'], overridableBy: [] },
    { path: 'font.geometric', type: 'font-family', value: ['Readex Pro', 'system-ui', 'sans-serif'], overridableBy: [] },
    { path: 'motion.duration.fast', type: 'duration', value: { value: 120, unit: 'ms' }, overridableBy: [] },
    { path: 'motion.easing.standard', type: 'easing', value: 'cubic-bezier(0.2, 0, 0, 1)', overridableBy: [] },
    { path: 'opacity.disabled', type: 'opacity', value: 0.48, overridableBy: [] },
  ],
}

// S1 — semantics: meaning, independent of any component.
const semanticTokens: Def[] = [
  { path: 'color.text.primary', type: 'color', value: ref('color.palette.neutral.900'), overridableBy: [...COLOR_BY] },
  { path: 'color.text.secondary', type: 'color', value: ref('color.palette.neutral.600'), overridableBy: [...COLOR_BY] },
  { path: 'color.text.placeholder', type: 'color', value: ref('color.palette.neutral.400'), overridableBy: [...COLOR_BY] },
  { path: 'color.surface.raised', type: 'color', value: ref('color.palette.neutral.0'), overridableBy: [...COLOR_BY] },
  { path: 'color.surface.sunken', type: 'color', value: ref('color.palette.neutral.100'), overridableBy: [...COLOR_BY] },
  { path: 'color.surface.hover', type: 'color', value: ref('color.palette.neutral.50'), overridableBy: [...COLOR_BY] },
  { path: 'color.border.default', type: 'color', value: ref('color.palette.neutral.200'), overridableBy: [...COLOR_BY] },
  { path: 'color.border.strong', type: 'color', value: ref('color.palette.neutral.400'), overridableBy: [...COLOR_BY] },
  { path: 'color.action.primary', type: 'color', value: ref('color.palette.neutral.900'), overridableBy: [...COLOR_BY] },
  { path: 'color.action.primary-hover', type: 'color', value: ref('color.palette.neutral.600'), overridableBy: [...COLOR_BY] },
  { path: 'color.action.on-primary', type: 'color', value: ref('color.palette.neutral.0'), overridableBy: [...COLOR_BY] },
  { path: 'color.action.primary-soft', type: 'color', value: ref('color.palette.neutral.100'), overridableBy: [...COLOR_BY] },
  { path: 'color.status.danger', type: 'color', value: ref('color.palette.red.600'), overridableBy: [...COLOR_BY] },
  { path: 'color.status.danger-hover', type: 'color', value: ref('color.palette.red.700'), overridableBy: [...COLOR_BY] },
  { path: 'color.focus.ring', type: 'color', value: ref('color.palette.neutral.900'), overridableBy: [...COLOR_BY] },

  { path: 'shape.radius.control', type: 'dimension', value: px(8), overridableBy: [...SHAPE_BY] },
  { path: 'shape.border.width', type: 'dimension', value: px(1), overridableBy: [...SHAPE_BY] },
  { path: 'shape.focus.width', type: 'dimension', value: px(2), overridableBy: [...SHAPE_BY] },
  { path: 'shape.focus.offset', type: 'dimension', value: px(2), overridableBy: [...SHAPE_BY] },
  { path: 'typography.family.ui', type: 'font-family', value: ref('font.sans'), overridableBy: [...SHAPE_BY] },
  { path: 'typography.weight.label', type: 'font-weight', value: 500, overridableBy: [...SHAPE_BY] },
  { path: 'typography.weight.action', type: 'font-weight', value: 600, overridableBy: [...SHAPE_BY] },
  { path: 'elevation.action', type: 'shadow', value: 'none', overridableBy: [...SHAPE_BY] },
  // Treatment of actions and fields — the visual system's levers. The engine composes visual systems before
  // component tokens, so a visual system changes these semantic tokens, never a component token directly.
  { path: 'shape.radius.action', type: 'dimension', value: ref('shape.radius.control'), overridableBy: [...SHAPE_BY] },
  { path: 'shape.radius.field', type: 'dimension', value: ref('shape.radius.control'), overridableBy: [...SHAPE_BY] },
  { path: 'color.field.surface', type: 'color', value: ref('color.surface.raised'), overridableBy: [...COLOR_BY] },
  { path: 'color.field.border', type: 'color', value: ref('color.border.strong'), overridableBy: [...COLOR_BY] },
  { path: 'shape.field.border-inline', type: 'dimension', value: ref('shape.border.width'), overridableBy: [...SHAPE_BY] },
  { path: 'shape.field.border-block-start', type: 'dimension', value: ref('shape.border.width'), overridableBy: [...SHAPE_BY] },
  { path: 'shape.field.border-block-end', type: 'dimension', value: ref('shape.border.width'), overridableBy: [...SHAPE_BY] },
  { path: 'shape.field.inset', type: 'dimension', value: ref('control.padding-inline'), overridableBy: [...SHAPE_BY] },

  { path: 'control.height.sm', type: 'dimension', value: px(32), overridableBy: [...SIZE_BY] },
  { path: 'control.height.md', type: 'dimension', value: px(40), overridableBy: [...SIZE_BY] },
  { path: 'control.height.lg', type: 'dimension', value: px(48), overridableBy: [...SIZE_BY] },
  { path: 'control.padding-inline', type: 'dimension', value: px(14), overridableBy: [...SIZE_BY] },
  { path: 'control.font-size', type: 'dimension', value: px(15), overridableBy: [...SIZE_BY] },
  { path: 'control.label-size', type: 'dimension', value: px(14), overridableBy: [...SIZE_BY] },
  { path: 'control.help-size', type: 'dimension', value: px(13), overridableBy: [...SIZE_BY] },
  { path: 'control.gap', type: 'dimension', value: px(8), overridableBy: [...SIZE_BY] },
  { path: 'control.stack-gap', type: 'dimension', value: px(6), overridableBy: [...SIZE_BY] },
  { path: 'control.target-min', type: 'dimension', value: px(24), overridableBy: [...SIZE_BY] },
]
export const semanticLayer: TokenLayer = { id: 'hz-semantics', type: 'semantic', tokens: semanticTokens }

// S2 — component tokens: the only names recipes read (their CSS variables are the recipe token contract).
// Component tokens are pure aliases (overridableBy: []): every change comes from a lower, authorized layer.
const field = (path: string, type: Def['type'], value: unknown): Def => ({ path, type, value, overridableBy: [] }) as Def
export const componentLayer: TokenLayer = {
  id: 'hz-components',
  type: 'component',
  tokens: [
    field('component.button.height.sm', 'dimension', ref('control.height.sm')),
    field('component.button.height.md', 'dimension', ref('control.height.md')),
    field('component.button.height.lg', 'dimension', ref('control.height.lg')),
    field('component.button.padding-inline', 'dimension', ref('control.padding-inline')),
    field('component.button.gap', 'dimension', ref('control.gap')),
    field('component.button.font-size', 'dimension', ref('control.font-size')),
    field('component.button.font-family', 'font-family', ref('typography.family.ui')),
    field('component.button.font-weight', 'font-weight', ref('typography.weight.action')),
    field('component.button.radius', 'dimension', ref('shape.radius.action')),
    field('component.button.border-width', 'dimension', ref('shape.border.width')),
    field('component.button.shadow', 'shadow', ref('elevation.action')),
    field('component.button.target-min', 'dimension', ref('control.target-min')),
    field('component.button.primary.background', 'color', ref('color.action.primary')),
    field('component.button.primary.background-hover', 'color', ref('color.action.primary-hover')),
    field('component.button.primary.foreground', 'color', ref('color.action.on-primary')),
    field('component.button.primary.soft', 'color', ref('color.action.primary-soft')),
    field('component.button.neutral.foreground', 'color', ref('color.text.primary')),
    field('component.button.neutral.background', 'color', ref('color.surface.sunken')),
    field('component.button.neutral.border', 'color', ref('color.border.strong')),
    field('component.button.neutral.background-hover', 'color', ref('color.surface.hover')),
    field('component.button.danger.background', 'color', ref('color.status.danger')),
    field('component.button.danger.background-hover', 'color', ref('color.status.danger-hover')),
    field('component.button.danger.foreground', 'color', ref('color.action.on-primary')),
    field('component.button.focus.color', 'color', ref('color.focus.ring')),
    field('component.button.focus.width', 'dimension', ref('shape.focus.width')),
    field('component.button.focus.offset', 'dimension', ref('shape.focus.offset')),
    field('component.button.disabled-opacity', 'opacity', ref('opacity.disabled')),
    field('component.button.transition-duration', 'duration', ref('motion.duration.fast')),
    field('component.button.transition-easing', 'easing', ref('motion.easing.standard')),

    field('component.field.height', 'dimension', ref('control.height.md')),
    field('component.field.padding-inline', 'dimension', ref('shape.field.inset')),
    field('component.field.font-size', 'dimension', ref('control.font-size')),
    field('component.field.font-family', 'font-family', ref('typography.family.ui')),
    field('component.field.radius', 'dimension', ref('shape.radius.field')),
    field('component.field.background', 'color', ref('color.field.surface')),
    field('component.field.background-disabled', 'color', ref('color.surface.sunken')),
    field('component.field.foreground', 'color', ref('color.text.primary')),
    field('component.field.placeholder', 'color', ref('color.text.placeholder')),
    field('component.field.border-color', 'color', ref('color.field.border')),
    field('component.field.border-color-hover', 'color', ref('color.text.secondary')),
    field('component.field.border-color-invalid', 'color', ref('color.status.danger')),
    field('component.field.border-width-inline', 'dimension', ref('shape.field.border-inline')),
    field('component.field.border-width-block-start', 'dimension', ref('shape.field.border-block-start')),
    field('component.field.border-width-block-end', 'dimension', ref('shape.field.border-block-end')),
    field('component.field.focus.color', 'color', ref('color.focus.ring')),
    field('component.field.focus.width', 'dimension', ref('shape.focus.width')),
    field('component.field.label.size', 'dimension', ref('control.label-size')),
    field('component.field.label.weight', 'font-weight', ref('typography.weight.label')),
    field('component.field.label.color', 'color', ref('color.text.primary')),
    field('component.field.help.size', 'dimension', ref('control.help-size')),
    field('component.field.help.color', 'color', ref('color.text.secondary')),
    field('component.field.error.color', 'color', ref('color.status.danger')),
    field('component.field.gap', 'dimension', ref('control.stack-gap')),
    field('component.field.target-min', 'dimension', ref('control.target-min')),
    field('component.field.disabled-opacity', 'opacity', ref('opacity.disabled')),
  ],
}

// S5 — brand theme (light). Colors only.
export const brandNeutralBlueLayer: TokenLayer = {
  id: 'brand-neutral-blue',
  type: 'theme',
  tokens: [
    { path: 'color.action.primary', type: 'color', value: '#2457A6', overridableBy: [] },
    { path: 'color.action.primary-hover', type: 'color', value: '#1D4787', overridableBy: [] },
    { path: 'color.action.primary-soft', type: 'color', value: '#E7EEF9', overridableBy: [] },
    { path: 'color.focus.ring', type: 'color', value: '#2457A6', overridableBy: [] },
  ],
}

// S4 — visual systems: the same components, three materially different grammars.
export const visualQuietLayer: TokenLayer = {
  id: 'visual-quiet',
  type: 'visual-system',
  tokens: [
    // Outlined fields, 8px corners, sans typography — the semantic defaults are this system's grammar.
    { path: 'shape.radius.control', type: 'dimension', value: px(8), overridableBy: [] },
  ],
}

export const visualEditorialLayer: TokenLayer = {
  id: 'visual-editorial',
  type: 'visual-system',
  tokens: [
    // Square corners, underlined fields with no inline padding, Naskh typography, heavier labels.
    { path: 'shape.radius.control', type: 'dimension', value: px(0), overridableBy: [] },
    { path: 'typography.family.ui', type: 'font-family', value: ref('font.naskh'), overridableBy: [] },
    { path: 'typography.weight.label', type: 'font-weight', value: 700, overridableBy: [] },
    { path: 'typography.weight.action', type: 'font-weight', value: 700, overridableBy: [] },
    { path: 'color.field.surface', type: 'color', value: 'transparent', overridableBy: [] },
    { path: 'shape.field.border-inline', type: 'dimension', value: px(0), overridableBy: [] },
    { path: 'shape.field.border-block-start', type: 'dimension', value: px(0), overridableBy: [] },
    { path: 'shape.field.border-block-end', type: 'dimension', value: px(2), overridableBy: [] },
    { path: 'shape.field.inset', type: 'dimension', value: px(0), overridableBy: [] },
    { path: 'shape.focus.offset', type: 'dimension', value: px(4), overridableBy: [] },
  ],
}

export const visualSoftLayer: TokenLayer = {
  id: 'visual-soft',
  type: 'visual-system',
  tokens: [
    // Pill actions with soft elevation, filled borderless fields, geometric typography.
    { path: 'shape.radius.action', type: 'dimension', value: px(999), overridableBy: [] },
    { path: 'shape.radius.field', type: 'dimension', value: px(14), overridableBy: [] },
    { path: 'typography.family.ui', type: 'font-family', value: ref('font.geometric'), overridableBy: [] },
    { path: 'elevation.action', type: 'shadow', value: '0px 1px 2px #161C2A14, 0px 4px 12px #161C2A14', overridableBy: [] },
    { path: 'color.field.surface', type: 'color', value: ref('color.surface.sunken'), overridableBy: [] },
    { path: 'color.field.border', type: 'color', value: 'transparent', overridableBy: [] },
    { path: 'shape.focus.width', type: 'dimension', value: px(3), overridableBy: [] },
  ],
}

// S6 — context presets: sizes only. Colors, shapes and behavior are not theirs to change.
export const contextErpLayer: TokenLayer = {
  id: 'context-erp-compact',
  type: 'context',
  tokens: [
    { path: 'control.height.sm', type: 'dimension', value: px(26), overridableBy: [] },
    { path: 'control.height.md', type: 'dimension', value: px(32), overridableBy: [] },
    { path: 'control.height.lg', type: 'dimension', value: px(38), overridableBy: [] },
    { path: 'control.padding-inline', type: 'dimension', value: px(10), overridableBy: [] },
    { path: 'control.font-size', type: 'dimension', value: px(13), overridableBy: [] },
    { path: 'control.label-size', type: 'dimension', value: px(12), overridableBy: [] },
    { path: 'control.help-size', type: 'dimension', value: px(12), overridableBy: [] },
    { path: 'control.gap', type: 'dimension', value: px(6), overridableBy: [] },
    { path: 'control.stack-gap', type: 'dimension', value: px(4), overridableBy: [] },
    { path: 'control.target-min', type: 'dimension', value: px(24), overridableBy: [] },
  ],
}

export const contextPosLayer: TokenLayer = {
  id: 'context-pos-touch',
  type: 'context',
  tokens: [
    { path: 'control.height.sm', type: 'dimension', value: px(44), overridableBy: [] },
    { path: 'control.height.md', type: 'dimension', value: px(52), overridableBy: [] },
    { path: 'control.height.lg', type: 'dimension', value: px(60), overridableBy: [] },
    { path: 'control.padding-inline', type: 'dimension', value: px(20), overridableBy: [] },
    { path: 'control.font-size', type: 'dimension', value: px(17), overridableBy: [] },
    { path: 'control.label-size', type: 'dimension', value: px(16), overridableBy: [] },
    { path: 'control.help-size', type: 'dimension', value: px(15), overridableBy: [] },
    { path: 'control.gap', type: 'dimension', value: px(10), overridableBy: [] },
    { path: 'control.stack-gap', type: 'dimension', value: px(8), overridableBy: [] },
    // WCAG 2.5.5 (AAA) target size for touch-first point of sale.
    { path: 'control.target-min', type: 'dimension', value: px(44), overridableBy: [] },
  ],
}

export const contextSaasLayer: TokenLayer = {
  id: 'context-saas-responsive',
  type: 'context',
  tokens: [
    // The semantic defaults are the SaaS sizes; WCAG 2.5.8 (AA) minimum target.
    { path: 'control.target-min', type: 'dimension', value: px(24), overridableBy: [] },
  ],
}
