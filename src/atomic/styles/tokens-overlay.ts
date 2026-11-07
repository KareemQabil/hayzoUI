/**
 * S2 component tokens for the overlay atoms (popover, tooltip, dialog, drawer).
 *
 * Pure aliases (`overridableBy: []`) of semantic tokens in ./tokens.ts. The engine composes visual systems and
 * contexts BEFORE component layers, so a visual system changes the overlays only through semantic tokens.
 *
 * Interim aliases — each marked `TODO(semantic)` points at the closest existing semantic token until the dedicated
 * semantic token exists (requested from the lead; see the overlay report):
 *   color.overlay.backdrop, elevation.overlay, shape.radius.overlay, space.overlay.padding,
 *   typography.size.title, color.surface.inverse, color.text.inverse.
 */
import type { TokenDefinition, TokenLayer } from '../tokens'

type Def = TokenDefinition
const ref = (path: string) => ({ $ref: path })
const alias = (path: string, type: Def['type'], target: string): Def => ({ path, type, value: ref(target), overridableBy: [] }) as Def

/** Tokens shared by the panel-like overlays; `kind` is popover | dialog | drawer. */
function panel(kind: 'popover' | 'dialog' | 'drawer'): Def[] {
  const p = `component.${kind}`
  return [
    alias(`${p}.background`, 'color', 'color.surface.raised'),
    alias(`${p}.foreground`, 'color', 'color.text.primary'),
    alias(`${p}.border-color`, 'color', 'color.border.default'),
    alias(`${p}.border-width`, 'dimension', 'shape.border.width'),
    alias(`${p}.radius`, 'dimension', 'shape.radius.overlay'),
    alias(`${p}.shadow`, 'shadow', 'elevation.overlay'),
    alias(`${p}.padding`, 'dimension', 'control.overlay-padding'),
    alias(`${p}.gap`, 'dimension', 'control.gap'),
    alias(`${p}.font-family`, 'font-family', 'typography.family.ui'),
    alias(`${p}.font-size`, 'dimension', 'control.font-size'),
    alias(`${p}.title.size`, 'dimension', 'control.title-size'),
    alias(`${p}.title.weight`, 'font-weight', 'typography.weight.action'),
    alias(`${p}.description.color`, 'color', 'color.text.secondary'),
    alias(`${p}.description.size`, 'dimension', 'control.help-size'),
    alias(`${p}.focus.color`, 'color', 'color.focus.ring'),
    alias(`${p}.focus.width`, 'dimension', 'shape.focus.width'),
    alias(`${p}.focus.offset`, 'dimension', 'shape.focus.offset'),
    alias(`${p}.transition-duration`, 'duration', 'motion.duration.fast'),
    alias(`${p}.transition-easing`, 'easing', 'motion.easing.standard'),
  ]
}

/** Modal-only tokens: backdrop and the close button. */
function modal(kind: 'dialog' | 'drawer'): Def[] {
  const p = `component.${kind}`
  return [
    alias(`${p}.backdrop`, 'color', 'color.overlay.backdrop'),
    alias(`${p}.close.size`, 'dimension', 'control.height.sm'),
    alias(`${p}.close.target-min`, 'dimension', 'control.target-min'),
    alias(`${p}.close.radius`, 'dimension', 'shape.radius.action'),
    alias(`${p}.close.color`, 'color', 'color.text.secondary'),
    alias(`${p}.close.background-hover`, 'color', 'color.surface.hover'),
    alias(`${p}.close.disabled-opacity`, 'opacity', 'opacity.disabled'),
  ]
}

export const componentOverlayLayer: TokenLayer = {
  id: 'hz-components-overlay',
  type: 'component',
  tokens: [
    ...panel('popover'),
    ...panel('dialog'),
    ...modal('dialog'),
    ...panel('drawer'),
    ...modal('drawer'),
    alias('component.tooltip.background', 'color', 'color.surface.inverse'),
    alias('component.tooltip.foreground', 'color', 'color.text.inverse'),
    alias('component.tooltip.radius', 'dimension', 'shape.radius.control'),
    alias('component.tooltip.padding-inline', 'dimension', 'control.gap'),
    alias('component.tooltip.padding-block', 'dimension', 'control.stack-gap'),
    alias('component.tooltip.font-family', 'font-family', 'typography.family.ui'),
    alias('component.tooltip.font-size', 'dimension', 'control.help-size'),
    alias('component.tooltip.transition-duration', 'duration', 'motion.duration.fast'),
    alias('component.tooltip.transition-easing', 'easing', 'motion.easing.standard'),
  ],
}
