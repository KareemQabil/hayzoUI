/**
 * S2 component tokens for the Table atom — pure aliases (`overridableBy: []`) of semantic tokens, so contexts
 * drive density (row height, padding, font) and visual systems drive treatment (radius, borders, typography).
 */
import type { TokenDefinition, TokenLayer } from '../tokens'

type Def = TokenDefinition
const ref = (path: string) => ({ $ref: path })
const alias = (path: string, type: Def['type'], target: string): Def => ({ path, type, value: ref(target), overridableBy: [] }) as Def
const p = 'component.table'

export const componentTableLayer: TokenLayer = {
  id: 'hz-components-table',
  type: 'component',
  tokens: [
    alias(`${p}.font-family`, 'font-family', 'typography.family.ui'),
    alias(`${p}.font-size`, 'dimension', 'control.font-size'),
    alias(`${p}.header-size`, 'dimension', 'control.label-size'),
    alias(`${p}.header-weight`, 'font-weight', 'typography.weight.label'),
    alias(`${p}.header-color`, 'color', 'color.text.secondary'),
    alias(`${p}.header-background`, 'color', 'color.surface.sunken'),
    alias(`${p}.row-height`, 'dimension', 'control.height.md'),
    alias(`${p}.cell-padding-inline`, 'dimension', 'control.padding-inline'),
    alias(`${p}.indent-size`, 'dimension', 'control.padding-inline'),
    alias(`${p}.gap`, 'dimension', 'control.gap'),
    alias(`${p}.target-min`, 'dimension', 'control.target-min'),
    alias(`${p}.foreground`, 'color', 'color.text.primary'),
    alias(`${p}.muted`, 'color', 'color.text.secondary'),
    alias(`${p}.background`, 'color', 'color.surface.raised'),
    alias(`${p}.row-hover`, 'color', 'color.surface.hover'),
    alias(`${p}.row-selected`, 'color', 'color.action.primary-soft'),
    alias(`${p}.group-background`, 'color', 'color.surface.sunken'),
    alias(`${p}.border-color`, 'color', 'color.border.default'),
    alias(`${p}.border-width`, 'dimension', 'shape.border.width'),
    alias(`${p}.radius`, 'dimension', 'shape.radius.field'),
    alias(`${p}.accent`, 'color', 'color.action.primary'),
    alias(`${p}.focus-color`, 'color', 'color.focus.ring'),
    alias(`${p}.focus-width`, 'dimension', 'shape.focus.width'),
    alias(`${p}.pinned-shadow`, 'shadow', 'elevation.overlay'),
    alias(`${p}.disabled-opacity`, 'opacity', 'opacity.disabled'),
  ],
}
