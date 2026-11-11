#!/usr/bin/env node
// IBM Carbon: DTCG token JSON in @carbon/layout, @carbon/motion, @carbon/themes, @carbon/colors; type styles from
// @carbon/type (es/index.js parsed as AST, scss/_font-family.scss as text); size/density layout tokens, focus and
// z-index from @carbon/styles SCSS.
//   node tools/extract/tokens/carbon.mjs <scratch-dir>
import { scratch, pkg, parseJs, decls, lit, isExpr, tok, round, clean, scanI18n, writeRef } from './lib.mjs'

const root = scratch()
const layout = pkg(root, '@carbon/layout')
const type = pkg(root, '@carbon/type')
const motion = pkg(root, '@carbon/motion')
const themes = pkg(root, '@carbon/themes')
const colors = pkg(root, '@carbon/colors')
const styles = pkg(root, '@carbon/styles')
const grid = pkg(root, '@carbon/grid')
const dim = (v) => (v.unit === 'rem' ? v.value * 16 : v.value)
const group = (j, g, file) => Object.entries(j[g]).filter(([k]) => !k.startsWith('$')).map(([k, v]) => tok(k, `${v.$value.value}${v.$value.unit}`, { px: dim(v.$value), file }))

const LF = 'tokens/layout.tokens.json'
const L = JSON.parse(layout.read(LF))
const spacingPx = Object.fromEntries(group(L, 'spacing', LF).map((t) => [t.name, t.px]))

// --- type
const TF = 'es/index.js'
const d = decls(parseJs(type.read(TF), 'index.js'))
const val = (name) => {
  let v = lit(d.get(name))
  if (isExpr(v) && d.has(v.$expr)) v = val(v.$expr)
  return v
}
const n = (v, fn) => (typeof v === 'number' ? v : isExpr(v) ? Number(new RegExp(`${fn}\\(([\\d.]+)\\)`).exec(v.$expr)?.[1]) : undefined)
const exported = /export \{([^}]+)\}/.exec(type.read(TF))[1].split(',').map((s) => s.trim().split(' ')[0])
const kebab = (s) => s.replace(/([a-z])([A-Z0-9])/g, '$1-$2').replace(/([a-z])-(\d)/, '$1-$2').toLowerCase()
const typeSteps = []
for (const name of exported) {
  if (!d.has(name) || /^fluid|^print$|^reset$|^scale$|^fontFamil|^fontWeight|^unstable|^getTypeSize$/.test(name)) continue
  const v = val(name)
  if (!v || typeof v !== 'object' || !('fontSize' in v)) continue
  const fs = n(v.fontSize, 'rem')
  const lh = typeof v.lineHeight === 'number' ? v.lineHeight : undefined
  const ls = v.letterSpacing === 0 ? '0' : n(v.letterSpacing, 'px') !== undefined ? `${n(v.letterSpacing, 'px')}px` : undefined
  typeSteps.push(clean({ name: kebab(name), set: /expressive|display|quotation|^heading0[3-7]|^body0|bodyLong/.test(name) ? 'expressive / long-form' : 'productive / compact', fontSize: `${fs / 16}rem`, fontSizePx: fs, lineHeight: lh, lineHeightRatio: lh, lineHeightPx: lh && round(fs * lh, 2), fontWeight: v.fontWeight, letterSpacing: ls, file: TF, note: Object.keys(v).some((k) => k === 'breakpoints') ? 'value at the smallest breakpoint; larger sizes at md/lg/xlg/max' : undefined }))
}
const step = (name) => typeSteps.find((s) => s.name === name)
const FF = 'scss/_font-family.scss'
const ffText = type.read(FF)
const fontStacks = [...ffText.matchAll(/'([a-z-]+)':\s*string\.unquote\(\s*"([^"]+)"/g)].map((m) => tok(m[1], m[2], { file: FF }))
const jsFamilies = Object.keys(lit(d.get('fontFamilies')))
const weights = lit(d.get('fontWeights'))
const scale = lit(d.get('scale'))

// --- controls: @carbon/styles layout tokens
const UL = 'scss/utilities/_layout.scss'
const ul = styles.read(UL)
const heights = [...ul.slice(ul.indexOf('height: ('), ul.indexOf('icon-gap')).matchAll(/(\w+): convert\.to-rem\((\d+)px\)/g)].map((m) => [m[1], Number(m[2])])
const dens = [...ul.slice(ul.indexOf('density: (')).matchAll(/(condensed|normal): \$(spacing-\d+)/g)].map((m) => [m[1], m[2], spacingPx[m[2]]])
const use = (file, typeFile = file) => {
  const t = styles.read(file)
  const m = /layout\.use\(\s*'size',([^)]*)\)/.exec(t)
  const o = Object.fromEntries([...m[1].matchAll(/\$(\w+): '(\w+)'/g)].map((x) => [x[1], x[2]]))
  const ts = /type-style\('([a-z0-9-]+)'\)/.exec(styles.read(typeFile))?.[1]
  return { ...o, typeStyle: ts, file: typeFile === file ? file : `${file}, ${typeFile}` }
}
const sizes = []
const order = heights.map(([k]) => k)
for (const [component, u] of [['button', use('scss/components/button/_button.scss', 'scss/components/button/_mixins.scss')], ['input', use('scss/components/text-input/_text-input.scss')]]) {
  const ts = step(u.typeStyle)
  for (const [size, h] of heights) {
    if (order.indexOf(size) < order.indexOf(u.min) || order.indexOf(size) > order.indexOf(u.max)) continue
    for (const [mode, tokenName, pad] of dens) sizes.push(clean({ component, size, mode, heightPx: h, paddingInlinePx: pad, fontSizePx: ts?.fontSizePx, lineHeightPx: ts?.lineHeightPx, lineHeightRatio: ts?.lineHeightRatio, heightSource: `--cds-layout-size-height-${size}; type-style ${u.typeStyle}; density padding-inline ${tokenName}`, file: `@carbon/styles:${u.file}, ${UL}`, note: size === u.default ? 'component default size' : undefined }))
  }
}
for (const t of group(L, 'size', LF)) sizes.push({ component: 'control', size: t.name.replace('size-', ''), mode: 'normal', heightPx: t.px, heightSource: t.name, file: LF })
for (const t of group(L, 'container', LF)) sizes.push({ component: 'container', size: t.name, mode: 'normal', heightPx: t.px, heightSource: t.name, file: LF })

// --- motion
const MF = 'tokens/motion.tokens.json'
const M = JSON.parse(motion.read(MF))
const durations = Object.entries(M.duration).flatMap(([g, o]) => Object.entries(o).filter(([k]) => !k.startsWith('$')).map(([k, v]) => tok(`duration-${g}-${k}`, `${v.$value.value}${v.$value.unit}`, { ms: v.$value.value, file: MF })))
const easings = Object.entries(M.easing).flatMap(([g, o]) => Object.entries(o).filter(([k]) => !k.startsWith('$')).map(([k, v]) => tok(`${g}-${k}`, `cubic-bezier(${v.$value.join(', ')})`, { mode: k, file: MF })))

// --- breakpoints
const lj = layout.read('es/index.js')
const bpBlock = lj.slice(lj.indexOf('const breakpoints = {'), lj.indexOf('const breakpointUp'))
const breakpoints = [...bpBlock.matchAll(/(\w+): \{\s*width: rem\((\d+)\),\s*columns: (\d+),\s*margin: (?:rem\((\d+)\)|"0")/g)].map((m) => tok(m[1], `${Number(m[2]) / 16}rem`, { px: Number(m[2]), file: 'es/index.js', note: `${m[3]} columns, margin ${m[4] ?? 0}px` }))

// --- colour
const CF = 'tokens/colors.tokens.json'
const C = JSON.parse(colors.read(CF))
const ramp = (name) => ({ name, steps: Object.entries(C[name]).filter(([k]) => !k.startsWith('$') && !/hover/i.test(k)).map(([k, v]) => tok(`${name}-${k}`, v.$value.hex, { file: CF })) })
const rampNames = Object.keys(C).filter((k) => !k.startsWith('$') && C[k].$type !== 'color')
const theme = (id) => JSON.parse(themes.read(`tokens/themes/${id}/theme.tokens.json`))
const resolve = (v) => {
  if (typeof v === 'string') {
    const m = /^\{([a-zA-Z]+)(?:\.(\d+))?\}$/.exec(v)
    const c = m && (m[2] ? C[m[1]]?.[m[2]] : C[m[1]])
    return c?.$value?.hex ?? v
  }
  if (v && typeof v === 'object') {
    if (v.hex) return v.alpha !== undefined && v.alpha !== 1 ? `${v.hex} @ alpha ${v.alpha}` : v.hex
    return JSON.stringify(v).slice(0, 80)
  }
  return String(v)
}
const neutralKeys = ['background', 'layer-01', 'layer-02', 'layer-03', 'field-01', 'field-02', 'border-subtle-01', 'border-strong-01', 'text-primary', 'text-secondary', 'text-placeholder', 'text-disabled', 'icon-primary', 'icon-secondary']
const primaryKeys = ['interactive', 'focus', 'link-primary', 'link-primary-hover', 'border-interactive', 'background-brand', 'highlight']
const themeRamp = (id, mode, keys) => {
  const t = theme(id)
  return { name: `${id} theme roles`, mode, steps: keys.filter((k) => t[k]).map((k) => tok(k, resolve(t[k].$value), { alias: typeof t[k].$value === 'string' ? t[k].$value : undefined, mode, file: `tokens/themes/${id}/theme.tokens.json` })) }
}
const white = theme('white')
const btnTokens = JSON.parse(themes.read('tokens/themes/white/button.tokens.json'))
const btnDark = JSON.parse(themes.read('tokens/themes/g100/button.tokens.json'))

// --- focus, z-index
const FO = 'scss/utilities/_focus-outline.scss'
const fo = styles.read(FO)
const ZI = 'scss/utilities/_z-index.scss'
const z = [...styles.read(ZI).matchAll(/^\s+(\w+): (- ?\d+|\d+),?$/gm)].map((m) => tok(m[1], Number(m[2].replace(' ', '')), { file: `@carbon/styles:${ZI}` }))

const i18n = scanI18n([{ p: type }, { p: layout, skip: /^(umd|lib)\// }, { p: motion, skip: /^(umd|lib)\// }, { p: themes, only: /^(tokens|scss)\// }, { p: styles, only: /^scss\/(utilities|type|fonts|_.*)\b/ }, { p: styles, only: /^scss\/components\// }])
i18n.tokens = fontStacks.filter((t) => !['mono', 'sans', 'sans-condensed', 'serif'].includes(t.name))
i18n.findings = [
  `@carbon/type names per-script font stacks in SCSS: ${i18n.tokens.map((t) => t.name).join(', ')} — including 'IBM Plex Sans Arabic'. The JS export has only ${jsFamilies.join(', ')}, so the Arabic stack is reachable from Sass only.`,
  'The Arabic stack is a family name and nothing else: no type style, line-height, letter-spacing or weight varies by script. Productive styles keep letter-spacing 0.16px/0.32px at 12–14px, which would break Arabic joining if applied.',
  'Two type sets are a first-class concept (productive vs expressive; "compact" vs "long" body line heights 1.28572 vs 1.42857 at 14px), and control text uses the compact set: 14px on an 18px line.',
  'Density is two independent token groups in @carbon/styles: size (height xs 24 … 2xl 80) and density (padding-inline condensed 8px / normal 16px), set by layout context classes; there is no touch mode.',
  `Component SCSS is written with logical properties (${i18n.patterns.find((x) => x.id === 'logical-properties').hits} matching lines in the scan) plus ${i18n.patterns.find((x) => x.id === 'dir-selector').hits} lines with [dir=rtl]/:dir() overrides for what logical properties cannot express.`,
  "@carbon/styles can emit @font-face rules for IBM Plex Sans Arabic (scss/fonts, flag IBM-Plex-Sans-Arabic, off by default) and a .cds--type-sans-arabic helper class.",
]

writeRef({
  id: 'carbon',
  script: 'carbon.mjs',
  system: { name: 'IBM Carbon Design System', package: '@carbon/styles', version: styles.version, license: styles.license, url: 'https://carbondesignsystem.com' },
  pkgs: [layout, type, motion, themes, colors, styles, grid],
  scales: {
    controls: {
      densityModes: dens.map(([id, t, pxv]) => ({ id, name: `density ${id}`, mechanism: 'layout-token', description: `--cds-layout-density-padding-inline = ${t} (${pxv}px). Height is chosen separately by the size group.`, file: `@carbon/styles:${UL}` })),
      sizes,
      touchTarget: [],
    },
    spacing: { steps: group(L, 'spacing', LF) },
    radius: { steps: group(L, 'border-radius', LF) },
    focusRing: {
      steps: [...new Set([...fo.matchAll(/(outline|border): (\dpx) solid theme\.\$focus/g)].map((m) => `${m[1]}|${m[2]}`))].map((s) => tok(`focus ${s.split('|')[0]} width`, s.split('|')[1], { px: parseFloat(s.split('|')[1]), file: `@carbon/styles:${FO}` })).concat([...new Set([...fo.matchAll(/outline-offset: (-?\dpx)/g)].map((m) => m[1]))].map((v) => tok('outline-offset', v, { px: parseFloat(v), file: `@carbon/styles:${FO}` }))),
      note: 'Focus is a mixin, not a token: 2px outline drawn inside the control (offset −2px), 1px for the "outline-compat" type.',
    },
    typography: {
      rootFontSizePx: 16,
      fontStacks,
      steps: typeSteps,
      fontSizes: scale.map((v, i) => tok(`type-scale-${i + 1}`, v, { px: v, file: TF })),
      fontWeights: Object.entries(weights).map(([k, v]) => tok(k, v, { file: TF })),
      note: 'Scale formula (scss/_scale.scss): Yn = Yn−1 + (floor((n − 2) / 4) + 1) × 2, starting at 12px.',
    },
    breakpoints: { steps: breakpoints },
    zIndex: { steps: z },
    motion: { durations, easings, note: 'Each easing exists in a productive and an expressive variant.' },
    color: {
      structure: {
        ramps: rampNames.map((r) => ({ name: r, steps: ramp(r).steps.length, stepNames: ramp(r).steps.map((s) => s.name.split('-').pop()) })),
        semanticRoles: Object.keys(white).filter((k) => !k.startsWith('$')),
        modes: ['white', 'g10', 'g90', 'g100'],
        note: '10-step ramps (10–100). Four themes map roles to ramp steps; layer-01/02/03 roles alternate so nested surfaces stay distinguishable.',
      },
      neutral: [ramp('gray'), themeRamp('white', 'light', neutralKeys), themeRamp('g100', 'dark', neutralKeys)],
      primary: [ramp('blue'), themeRamp('white', 'light', primaryKeys), themeRamp('g100', 'dark', primaryKeys), { name: 'button-primary', mode: 'light', steps: Object.keys(btnTokens).filter((k) => /^button-primary/.test(k)).map((k) => tok(k, resolve(btnTokens[k].$value), { file: 'tokens/themes/white/button.tokens.json' })) }, { name: 'button-primary', mode: 'dark', steps: Object.keys(btnDark).filter((k) => /^button-primary/.test(k)).map((k) => tok(k, resolve(btnDark[k].$value), { file: 'tokens/themes/g100/button.tokens.json' })) }],
    },
    i18n,
    extra: { layoutScale: group(L, 'layout', LF), iconSize: group(L, 'icon-size', LF), containerScale: group(L, 'container', LF) },
  },
  gaps: ['No border-width scale and no elevation/shadow scale as tokens.', 'No touch density or touch-target token.', 'Focus ring is a Sass mixin with literal widths, not a token.'],
})
