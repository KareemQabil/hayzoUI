#!/usr/bin/env node
// Material Design 3: the generated token files shipped in @material/web (tokens/versions/v0_192, "Google Material 3"),
// the web wrappers (tokens/_md-comp-*.scss), the density system of @material/density + MDC components (M2-era
// formula, still the definition of the −1…−3 scale), and the per-component M3 density tables that Angular Material
// ships (get-density-tokens in */_m3-*.scss).
//   node tools/extract/tokens/material.mjs <scratch-dir>
import { scratch, pkg, mdScssMap, tok, tokPx, tokMs, px, round, clean, scanI18n, writeRef } from './lib.mjs'

const root = scratch()
const mw = pkg(root, '@material/web')
const ng = pkg(root, '@angular/material')
const den = pkg(root, '@material/density')
const btn = pkg(root, '@material/button')
const tf = pkg(root, '@material/textfield')
const mcu = pkg(root, '@material/material-color-utilities')
const V = 'tokens/versions/v0_192/'
const map = (f) => mdScssMap(mw.read(`${V}_md-${f}.scss`))
const plain = (f) => {
  // web wrapper: tokens added on top of the generated set, written as  'key': 24px
  const out = {}
  for (const m of mw.read(`tokens/_md-${f}.scss`).matchAll(/'([a-z0-9-]+)':\s*(?:if\(\$exclude-hardcoded-values, null, )?(-?[\d.]+(?:px|rem))\)?,/g)) out[m[1]] = m[2]
  return out
}

const type = map('sys-typescale')
const face = map('ref-typeface')
const shape = map('sys-shape')
const motion = map('sys-motion')
const elev = map('sys-elevation')
const palette = map('ref-palette')
const focus = mdScssMap(mw.read('tokens/_md-comp-focus-ring.scss'))
const resolveFace = (a) => face[a.replace('md-ref-typeface.', '')]?.value

const typeNames = [...new Set(Object.keys(type).filter((k) => k.endsWith('-size')).map((k) => k.replace(/-size$/, '')))]
const typeSteps = typeNames.map((n) =>
  clean({
    name: n,
    fontSize: type[`${n}-size`].value,
    fontSizePx: px(type[`${n}-size`].value),
    lineHeight: type[`${n}-line-height`].value,
    lineHeightPx: px(type[`${n}-line-height`].value),
    lineHeightRatio: round(px(type[`${n}-line-height`].value) / px(type[`${n}-size`].value)),
    fontWeight: Number(resolveFace(type[`${n}-weight`].alias)),
    letterSpacing: type[`${n}-tracking`]?.value,
    fontFamily: resolveFace(type[`${n}-font`].alias),
    file: `${V}_md-sys-typescale.scss`,
  }),
)
const typeOf = (alias) => typeSteps.find((s) => alias === `md-sys-typescale.${s.name}-size`)

// --- controls at default density (scale 0)
const sizes = []
const comp = (file, component, hKey, labelKey, extra = {}) => {
  const t = map(`comp-${file}`)
  const w = mw.exists(`tokens/_md-comp-${file}.scss`) ? plain(`comp-${file}`) : {}
  const ty = labelKey && t[`${labelKey}-size`]?.alias ? typeOf(t[`${labelKey}-size`].alias) : undefined
  const shapeAlias = t['container-shape']?.alias
  sizes.push(
    clean({
      component,
      size: extra.size ?? 'default',
      mode: 'density-0',
      heightPx: px(t[hKey]?.value) ?? (w['top-space'] && ty ? px(w['top-space']) + ty.lineHeightPx + px(w['bottom-space']) : undefined),
      derived: !t[hKey]?.value && w['top-space'] && ty ? true : undefined,
      formula: !t[hKey]?.value && w['top-space'] && ty ? 'top-space + input line-height + bottom-space (no container-height token)' : undefined,
      paddingInlinePx: px(w['leading-space']),
      paddingBlockPx: px(w['top-space']),
      fontSizePx: ty?.fontSizePx,
      lineHeightPx: ty?.lineHeightPx,
      lineHeightRatio: ty?.lineHeightRatio,
      radiusPx: shapeAlias ? px(shape[shapeAlias.replace('md-sys-shape.', '')]?.value) : px(t['container-shape']?.value),
      heightSource: `md.comp.${file}.${hKey}${ty ? ` + md.sys.typescale.${ty.name}` : ''}`,
      file: `${V}_md-comp-${file}.scss`,
      touchTargetPx: extra.touch,
    }),
  )
}
comp('filled-button', 'button', 'container-height', 'label-text')
comp('text-button', 'button-text', 'container-height', 'label-text')
comp('outlined-text-field', 'input', 'container-height', 'input-text')
comp('filled-text-field', 'input-filled', 'container-height', 'input-text')
comp('outlined-select', 'select', 'text-field-container-height', 'text-field-input-text')
comp('icon-button', 'icon-button', 'state-layer-height', null)
comp('checkbox', 'checkbox', 'state-layer-size', null)
comp('checkbox', 'checkbox-box', 'container-size', null, { size: 'box' })
comp('radio-button', 'radio', 'state-layer-size', null)
comp('filter-chip', 'chip', 'container-height', 'label-text')
comp('list', 'list-item', 'list-item-one-line-container-height', 'list-item-label-text', { size: 'one-line' })
comp('list', 'list-item', 'list-item-two-line-container-height', 'list-item-label-text', { size: 'two-line' })
comp('primary-navigation-tab', 'tab', 'container-height', 'label-text')
comp('switch', 'switch', 'track-height', null)
comp('fab-primary', 'fab', 'container-height', null)

// --- Angular Material M3 density tables
const modes = [{ id: 'density-0', name: 'density 0 (default)', mechanism: 'density-scale', description: 'Default M3 component sizes.' }]
const ngDensity = []
let maxSteps = 0
for (const dir of ng.ls('.').filter((d) => ng.exists(`${d}/_m3-${d}.scss`) || d === 'core')) {
  const files = dir === 'core' ? [] : ng.ls(dir).filter((f) => /^_m3-.*\.scss$/.test(f))
  for (const f of files) {
    const text = ng.read(`${dir}/${f}`)
    const fn = /@function get-density-tokens\(\$scale\) \{([\s\S]*?)\n\}/.exec(text)
    if (!fn) continue
    const min = Number(/clamp-density\(\$scale, (-?\d+)\)/.exec(fn[1])?.[1])
    for (const m of fn[1].matchAll(/([a-z0-9-]+):\s*list\.nth\(\(([^)]*)\), \$index\)/g)) {
      const values = m[2].split(',').map((s) => s.trim())
      maxSteps = Math.max(maxSteps, values.length)
      ngDensity.push({ file: `${dir}/${f}`, token: m[1], min, values })
    }
  }
}
for (let i = 1; i < maxSteps; i++) modes.push({ id: `density-${-i}`, name: `density ${-i}`, mechanism: 'density-scale', description: 'Angular Material M3 density theming: each step removes 4px of height from components that support it; touch-target display is turned off from −2.', file: 'button/_m3-button.scss' })
const ngComponent = { 'button-filled-container-height': 'button', 'form-field-container-height': 'input', 'icon-button-state-layer-size': 'icon-button', 'checkbox-state-layer-size': 'checkbox', 'radio-state-layer-size': 'radio', 'chip-container-height': 'chip', 'list-list-item-one-line-container-height': 'list-item', 'table-row-item-container-height': 'table-row', 'table-header-container-height': 'table-header', 'tab-container-height': 'tab', 'toolbar-standard-height': 'toolbar', 'select-arrow-transform': null, 'paginator-container-size': 'paginator', 'tree-node-min-height': 'tree-node', 'button-toggle-height': 'button-toggle', 'expansion-header-collapsed-state-height': 'accordion-header', 'stepper-header-height': 'stepper-header', 'fab-container-height': null }
for (const d of ngDensity) {
  const component = ngComponent[d.token]
  if (!component) continue
  d.values.forEach((v, i) => {
    if (px(v) === undefined) return
    const touch = ngDensity.find((x) => x.file === d.file && /touch-target-display/.test(x.token))
    sizes.push(clean({ component, size: d.token.includes('one-line') ? 'one-line' : 'default', mode: `density-${-i}`, heightPx: px(v), heightSource: `@angular/material ${d.token}`, file: `@angular/material:${d.file}`, note: touch ? `touch target ${touch.values[i] === 'none' ? 'removed' : 'kept'} at this scale` : undefined }))
  })
}
// --- MDC density formula
const dv = den.read('_density.scss')
const bv = btn.read('_button-shared-theme.scss')
const tv = tf.read('_variables.scss')
const sv = (text, name) => new RegExp(`\\$${name}: ([^ ;]+) !default`).exec(text)?.[1]
const mdc = {
  interval: sv(dv, 'interval'),
  defaultScale: sv(dv, 'default-scale'),
  formula: /\$value: (map\.get\(\$property-scale-map, default\) \+ \$density-scale \* \$interval);/.exec(dv)?.[1],
  button: { default: sv(bv, 'height'), minimum: sv(bv, 'minimum-height') },
  textfield: { default: sv(tv, 'height'), minimum: sv(tv, 'minimum-height'), minimumForFilledLabel: sv(tv, 'minimum-height-for-filled-label') },
}

// --- colour
const sysDark = {}
const sysLight = {}
{
  const text = mw.read(`${V}_md-sys-color.scss`)
  const iLight = text.indexOf('@function values-light')
  Object.assign(sysDark, mdScssMap(text.slice(text.indexOf('@function values-dark'), iLight)))
  Object.assign(sysLight, mdScssMap(text.slice(iLight)))
}
const rampNames = [...new Set(Object.keys(palette).map((k) => k.replace(/\d+$/, '')))]
const rampSteps = (n) => Object.keys(palette).filter((k) => k.replace(/\d+$/, '') === n).sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, ''))).map((k) => tok(k, palette[k].value, { file: `${V}_md-ref-palette.scss` }))
const roleRamp = (sys, mode, re) => ({ name: 'md.sys.color roles', mode, steps: Object.keys(sys).filter((k) => re.test(k)).map((k) => tok(k, palette[sys[k].alias?.replace('md-ref-palette.', '')]?.value ?? sys[k].value ?? '', { alias: sys[k].alias, mode, file: `${V}_md-sys-color.scss` })) })
const neutralRe = /^(background|on-background|surface|on-surface|surface-.*|on-surface-variant|outline|outline-variant|inverse-surface|inverse-on-surface|scrim|shadow)$/
const primaryRe = /primary/

const i18n = scanI18n([{ p: mw, only: /^tokens\// }, { p: mw, skip: /^tokens\/|\.js$|\.d\.ts$|custom-elements\.json/ }, { p: ng, only: /\.scss$/ }, { p: den }, { p: mcu, skip: /\.js$/ }])
i18n.tokens = [
  ...Object.keys(shape).filter((k) => /-(start|end)$/.test(k)).map((k) => tok(`md.sys.shape.${k}`, shape[k].value, { file: `${V}_md-sys-shape.scss`, note: 'logical (start/end) corner token' })),
]
i18n.findings = [
  'The token set has exactly two typeface slots, brand and plain, both Roboto; no per-script or per-language typeface, line-height or tracking token exists. Body, label and title-medium/small steps carry non-zero Latin tracking (letter-spacing), which Arabic must not inherit.',
  'Direction-aware tokens are limited to logical naming: shape corner-large-start / corner-large-end and component leading-space / trailing-space. @material/web resolves them with :dir()/[dir=rtl] selectors in component styles.',
  'Density is not a token in @material/web (the only mention is a deprecated data-table token file). The −1…−3 scale is implemented per component: MDC computes default + scale × 4px clamped to a per-component minimum; Angular Material ships explicit M3 tables.',
  'Touch target: components keep a 48px touch wrapper around smaller visuals (literal 48px in chips/fab styles); Angular Material disables it at density −2 and below.',
]

writeRef({
  id: 'material-3',
  script: 'material.mjs',
  system: { name: 'Material Design 3', package: '@material/web', version: mw.version, license: mw.license, url: 'https://m3.material.io' },
  pkgs: [mw, ng, den, btn, tf, mcu],
  scales: {
    controls: {
      densityModes: modes,
      sizes,
      touchTarget: [tok('touch target wrapper (chips, fab)', '48px', { px: 48, file: 'chips/internal/_shared.scss' })],
      note: `M3 has one size per component and a numeric density scale. MDC formula: ${mdc.formula}; interval ${mdc.interval}; button ${mdc.button.default} → min ${mdc.button.minimum}; text field ${mdc.textfield.default} → min ${mdc.textfield.minimum} (${mdc.textfield.minimumForFilledLabel} while a filled label is shown). density-N rows come from Angular Material's M3 tables.`,
    },
    radius: { steps: Object.keys(shape).filter((k) => !/-(top|start|end)$/.test(k)).map((k) => tokPx(`corner-${k.replace('corner-', '')}`, shape[k].value, { file: `${V}_md-sys-shape.scss` })).sort((a, b) => a.px - b.px) },
    focusRing: { steps: Object.keys(focus).filter((k) => focus[k].value && /width|offset/.test(k)).map((k) => tokPx(`md.comp.focus-ring.${k}`, focus[k].value, { file: 'tokens/_md-comp-focus-ring.scss' })) },
    typography: {
      rootFontSizePx: 16,
      fontStacks: ['brand', 'plain'].map((k) => tok(`md.ref.typeface.${k}`, face[k].value, { file: `${V}_md-ref-typeface.scss` })),
      steps: typeSteps,
      fontWeights: Object.keys(face).filter((k) => k.startsWith('weight')).map((k) => tok(k, Number(face[k].value), { file: `${V}_md-ref-typeface.scss` })),
    },
    elevation: { steps: Object.keys(elev).map((k) => tok(k, Number(elev[k].value), { file: `${V}_md-sys-elevation.scss`, note: 'elevation in dp; shadows are computed by the elevation component' })) },
    motion: {
      durations: Object.keys(motion).filter((k) => k.startsWith('duration')).map((k) => tokMs(k, motion[k].value, { file: `${V}_md-sys-motion.scss` })).sort((a, b) => a.ms - b.ms),
      easings: Object.keys(motion).filter((k) => k.startsWith('easing')).map((k) => tok(k, motion[k].value, { file: `${V}_md-sys-motion.scss` })),
    },
    color: {
      structure: {
        ramps: rampNames.map((n) => ({ name: n, steps: rampSteps(n).length, stepNames: rampSteps(n).map((s) => s.name.replace(n, '')) })),
        semanticRoles: Object.keys(sysLight),
        modes: ['light', 'dark'],
        note: 'Reference tonal palettes (tone 0–100) → system colour roles by fixed tone per mode (e.g. primary = primary40 in light, primary80 in dark).',
      },
      algorithm: {
        name: 'Material dynamic colour (HCT tonal palettes + DynamicScheme)',
        inputs: ['source colour (ARGB) or image', 'scheme variant (tonal spot, neutral, vibrant, expressive, fidelity, content, monochrome, rainbow, fruit salad)', 'isDark', 'contrast level −1…1'],
        outputs: ['six tonal palettes: primary, secondary, tertiary, neutral, neutral-variant, error', `${Object.keys(sysLight).length} colour roles, each a tone of one palette`],
        description: 'The source colour is converted to HCT (CAM16 hue and chroma, L* tone). Each palette keeps a hue and chroma chosen by the variant and varies only tone; roles pick tones, adjusted so that role pairs meet contrast targets at the requested contrast level.',
        files: mcu.ls('.').filter((f) => !f.includes('.')).map((d) => `@material/material-color-utilities:${d}/`),
        mappings: [...Object.keys(sysLight).filter((k) => sysLight[k].alias).map((k) => tok(k, sysLight[k].alias.replace('md-ref-palette.', ''), { mode: 'light' })), ...Object.keys(sysDark).filter((k) => sysDark[k].alias).map((k) => tok(k, sysDark[k].alias.replace('md-ref-palette.', ''), { mode: 'dark' }))],
      },
      neutral: [{ name: 'neutral', steps: rampSteps('neutral') }, { name: 'neutral-variant', steps: rampSteps('neutral-variant') }, roleRamp(sysLight, 'light', neutralRe), roleRamp(sysDark, 'dark', neutralRe)],
      primary: [{ name: 'primary', steps: rampSteps('primary') }, roleRamp(sysLight, 'light', primaryRe), roleRamp(sysDark, 'dark', primaryRe)],
    },
    i18n,
    extra: { mdcDensity: mdc, angularMaterialDensityTables: ngDensity },
  },
  gaps: [
    'No spacing scale, breakpoint, container or z-index tokens in the published token set (M3 window size classes are documentation only).',
    'No border-width scale (outline widths are per component).',
    'Density is not tokenised in @material/web; density rows are from Angular Material, a separate Google implementation of M3.',
  ],
})
