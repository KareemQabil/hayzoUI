/**
 * S2 component tokens for the choice atoms (Checkbox, RadioGroup, Switch) and Tabs.
 *
 * Pure aliases of existing semantic tokens (`overridableBy: []`): visual systems and contexts act on the semantic
 * tokens (the engine composes them before component layers), so these atoms resize with ERP/POS/SaaS and change
 * treatment with each visual system without a single override here.
 *
 * Naming rule (checked by AT-ST-03 once this layer is in BASE_LAYERS): every token that follows a context ends in
 * height | padding… | font-size | gap | target-min | label-size | help-size | …size, and no token a visual system
 * changes carries those words.
 *
 * Interim aliases (closest existing semantic token; see the report for the semantic tokens this layer wants):
 *   indicator size (checkbox box, radio circle, switch thumb) → control.indicator-size (context: ERP 14, SaaS 16, POS 22)
 *   indicator radius → shape.radius.indicator (visual system: quiet 4, editorial 0, soft 6)
 */
import type { TokenDefinition, TokenLayer } from '../tokens'

type Def = TokenDefinition
const ref = (path: string) => ({ $ref: path })
const alias = (path: string, type: Def['type'], target: string): Def => ({ path, type, value: ref(target), overridableBy: [] }) as Def

/** Tokens every boolean/one-of-many indicator shares; the prefix is the component. */
function indicator(name: 'checkbox' | 'radio'): Def[] {
  const p = `component.${name}`
  return [
    alias(`${p}.size`, 'dimension', 'control.indicator-size'),
    alias(`${p}.target-min`, 'dimension', 'control.target-min'),
    alias(`${p}.gap`, 'dimension', 'control.gap'),
    alias(`${p}.stack-gap`, 'dimension', 'control.stack-gap'),
    alias(`${p}.label-size`, 'dimension', 'control.font-size'),
    alias(`${p}.help-size`, 'dimension', 'control.help-size'),
    alias(`${p}.font-family`, 'font-family', 'typography.family.ui'),
    alias(`${p}.label-color`, 'color', 'color.text.primary'),
    alias(`${p}.help-color`, 'color', 'color.text.secondary'),
    alias(`${p}.error-color`, 'color', 'color.status.danger'),
    alias(`${p}.background`, 'color', 'color.surface.raised'),
    alias(`${p}.border-color`, 'color', 'color.border.strong'),
    alias(`${p}.border-color-hover`, 'color', 'color.text.secondary'),
    alias(`${p}.border-color-invalid`, 'color', 'color.status.danger'),
    alias(`${p}.border-width`, 'dimension', 'shape.border.width'),
    alias(`${p}.accent`, 'color', 'color.action.primary'),
    alias(`${p}.accent-hover`, 'color', 'color.action.primary-hover'),
    alias(`${p}.on-accent`, 'color', 'color.action.on-primary'),
    alias(`${p}.focus-color`, 'color', 'color.focus.ring'),
    alias(`${p}.focus-width`, 'dimension', 'shape.focus.width'),
    alias(`${p}.focus-offset`, 'dimension', 'shape.focus.offset'),
    alias(`${p}.disabled-opacity`, 'opacity', 'opacity.disabled'),
    alias(`${p}.transition-duration`, 'duration', 'motion.duration.fast'),
    alias(`${p}.transition-easing`, 'easing', 'motion.easing.standard'),
  ]
}

export const componentChoiceLayer: TokenLayer = {
  id: 'hz-components-choice',
  type: 'component',
  tokens: [
    ...indicator('checkbox'),
    alias('component.checkbox.radius', 'dimension', 'shape.radius.indicator'),

    ...indicator('radio'),
    alias('component.radio.legend-size', 'dimension', 'control.label-size'),
    alias('component.radio.legend-weight', 'font-weight', 'typography.weight.label'),
    alias('component.radio.options-gap', 'dimension', 'control.gap'),

    alias('component.switch.thumb-size', 'dimension', 'control.indicator-size'),
    alias('component.switch.target-min', 'dimension', 'control.target-min'),
    alias('component.switch.gap', 'dimension', 'control.gap'),
    alias('component.switch.stack-gap', 'dimension', 'control.stack-gap'),
    alias('component.switch.label-size', 'dimension', 'control.font-size'),
    alias('component.switch.help-size', 'dimension', 'control.help-size'),
    alias('component.switch.font-family', 'font-family', 'typography.family.ui'),
    alias('component.switch.label-color', 'color', 'color.text.primary'),
    alias('component.switch.help-color', 'color', 'color.text.secondary'),
    alias('component.switch.track-off', 'color', 'color.border.strong'),
    alias('component.switch.track-off-hover', 'color', 'color.text.secondary'),
    alias('component.switch.track-on', 'color', 'color.action.primary'),
    alias('component.switch.track-on-hover', 'color', 'color.action.primary-hover'),
    alias('component.switch.thumb-color', 'color', 'color.surface.raised'),
    alias('component.switch.focus-color', 'color', 'color.focus.ring'),
    alias('component.switch.focus-width', 'dimension', 'shape.focus.width'),
    alias('component.switch.focus-offset', 'dimension', 'shape.focus.offset'),
    alias('component.switch.disabled-opacity', 'opacity', 'opacity.disabled'),
    alias('component.switch.transition-duration', 'duration', 'motion.duration.fast'),
    alias('component.switch.transition-easing', 'easing', 'motion.easing.standard'),

    alias('component.tabs.height', 'dimension', 'control.height.md'),
    alias('component.tabs.padding-inline', 'dimension', 'control.padding-inline'),
    alias('component.tabs.gap', 'dimension', 'control.gap'),
    alias('component.tabs.panel-gap', 'dimension', 'control.gap'),
    alias('component.tabs.font-size', 'dimension', 'control.font-size'),
    alias('component.tabs.target-min', 'dimension', 'control.target-min'),
    alias('component.tabs.font-family', 'font-family', 'typography.family.ui'),
    alias('component.tabs.font-weight', 'font-weight', 'typography.weight.label'),
    alias('component.tabs.font-weight-selected', 'font-weight', 'typography.weight.action'),
    alias('component.tabs.foreground', 'color', 'color.text.secondary'),
    alias('component.tabs.foreground-selected', 'color', 'color.text.primary'),
    alias('component.tabs.background-hover', 'color', 'color.surface.hover'),
    alias('component.tabs.indicator-color', 'color', 'color.action.primary'),
    alias('component.tabs.indicator-width', 'dimension', 'shape.focus.width'),
    alias('component.tabs.border-color', 'color', 'color.border.default'),
    alias('component.tabs.border-width', 'dimension', 'shape.border.width'),
    alias('component.tabs.radius', 'dimension', 'shape.radius.control'),
    alias('component.tabs.focus-color', 'color', 'color.focus.ring'),
    alias('component.tabs.focus-width', 'dimension', 'shape.focus.width'),
    alias('component.tabs.focus-offset', 'dimension', 'shape.focus.offset'),
    alias('component.tabs.disabled-opacity', 'opacity', 'opacity.disabled'),
    alias('component.tabs.transition-duration', 'duration', 'motion.duration.fast'),
    alias('component.tabs.transition-easing', 'easing', 'motion.easing.standard'),
  ],
}
