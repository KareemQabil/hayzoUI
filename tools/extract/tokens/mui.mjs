#!/usr/bin/env node
// MUI (Material UI) default theme, read from the published .mjs sources of @mui/material and @mui/system.
// Scales are literals in createTypography/createTransitions/zIndex/shadows/createBreakpoints; control heights are not
// tokens: they are DERIVED from the literal paddings and typography in Button.mjs / OutlinedInput.mjs / InputBase.mjs.
//   node tools/extract/tokens/mui.mjs <scratch-dir>
import { scratch, pkg, jsConst, assertSource, tok, round, clean, scanI18n, writeRef } from './lib.mjs'

const root = scratch()
const m = pkg(root, '@mui/material')
const sys = pkg(root, '@mui/system')
const num = (text, re) => {
  const x = re.exec(text)
  if (!x) throw new Error(`pattern not found: ${re}`)
  return Number(x[1])
}

// --- typography
const TY = 'styles/createTypography.mjs'
const ty = m.read(TY)
const htmlFontSize = num(ty, /htmlFontSize = (\d+)/)
const baseFontSize = num(ty, /fontSize = (\d+),/)
const weights = Object.fromEntries([...ty.matchAll(/(fontWeight\w+) = (\d+)/g)].map((x) => [x[1], Number(x[2])]))
const fontFamily = /const defaultFontFamily = '([^']+)'/.exec(ty)[1]
const steps = [...ty.matchAll(/(\w+): buildVariant\((\w+), (\d+), ([\d.]+), (-?[\d.]+)(?:, (\w+))?\)/g)].map((x) => ({
  name: x[1],
  fontSize: `${Number(x[3]) / htmlFontSize}rem`,
  fontSizePx: Number(x[3]),
  lineHeight: Number(x[4]),
  lineHeightRatio: Number(x[4]),
  lineHeightPx: round(Number(x[3]) * Number(x[4]), 2),
  fontWeight: weights[x[2]],
  letterSpacing: `${Math.round((Number(x[5]) / Number(x[3])) * 1e5) / 1e5}em`,
  file: TY,
  ...(x[6] ? { note: 'text-transform: uppercase' } : {}),
}))
const variant = (n) => steps.find((s) => s.name === n)

// --- controls
const B = 'Button/Button.mjs'
const bt = m.read(B)
assertSource(bt, ["padding: '6px 16px'", "padding: '4px 10px'", "padding: '8px 22px'", '...theme.typography.button', 'fontSize: theme.typography.pxToRem(13)', 'fontSize: theme.typography.pxToRem(15)'], B)
const btnLh = variant('button').lineHeightRatio
const button = (size, pad, fs) => {
  const [pb, pi] = pad.split(' ').map((s) => parseFloat(s))
  return { component: 'button', size, mode: 'default', heightPx: round(pb * 2 + fs * btnLh, 2), paddingBlockPx: pb, paddingInlinePx: pi, fontSizePx: fs, lineHeightRatio: btnLh, lineHeightPx: round(fs * btnLh, 2), derived: true, formula: `2 × ${pb}px + ${fs}px × ${btnLh} (contained variant padding '${pad}', typography.button line-height)`, file: B }
}
const O = 'OutlinedInput/OutlinedInput.mjs'
const ot = m.read(O)
const IB = 'InputBase/InputBase.mjs'
const ib = m.read(IB)
assertSource(ot, ["padding: '16.5px 14px'", "padding: '8.5px 14px'"], O)
assertSource(ib, ["padding: '4px 0 5px'", "height: '1.4375em'", '...theme.typography.body1'], IB)
const inputFs = variant('body1').fontSizePx
const inputLine = 1.4375 * inputFs
const input = (component, size, pt, pbm, pi, file) => ({ component, size, mode: 'default', heightPx: round(pt + pbm + inputLine, 2), paddingBlockPx: pt, paddingInlinePx: pi, fontSizePx: inputFs, lineHeightPx: inputLine, lineHeightRatio: 1.4375, derived: true, formula: `${pt}px + ${pbm}px + 1.4375em × ${inputFs}px (native input height, body1 font size)`, file })
const MI = 'MenuItem/MenuItem.mjs'
const mi = m.read(MI)
const TC = 'TableCell/TableCell.mjs'
const tc = m.read(TC)
assertSource(tc, ['padding: 16', "padding: '6px 16px'"], TC)
const MX = 'styles/createMixins.mjs'
const sizes = [
  button('small', '4px 10px', 13),
  button('medium', '6px 16px', 14),
  button('large', '8px 22px', 15),
  input('input', 'small', 8.5, 8.5, 14, O),
  input('input', 'medium', 16.5, 16.5, 14, O),
  input('input-standard', 'medium', 4, 5, 0, IB),
  { component: 'menu-item', size: 'default', mode: 'default', minHeightPx: num(mi, /minHeight: (\d+),\n/), file: MI, note: "min-height applies below the sm breakpoint; from sm up it is 'auto'" },
  { component: 'menu-item', size: 'dense', mode: 'default', minHeightPx: num(mi, /ownerState\.dense,\s*style: \{\s*minHeight: (\d+)/), file: MI },
  { component: 'table-cell', size: 'medium', mode: 'default', paddingBlockPx: 16, paddingInlinePx: 16, fontSizePx: variant('body2').fontSizePx, lineHeightRatio: variant('body2').lineHeightRatio, file: TC },
  { component: 'table-cell', size: 'small', mode: 'default', paddingBlockPx: 6, paddingInlinePx: 16, fontSizePx: variant('body2').fontSizePx, lineHeightRatio: variant('body2').lineHeightRatio, file: TC },
  ...[...m.read(MX).matchAll(/minHeight: (\d+)/g)].map((x, i) => ({ component: 'toolbar', size: ['xs', 'xs-landscape', 'sm-up'][i] ?? String(i), mode: 'default', minHeightPx: Number(x[1]), file: MX })),
].map(clean)

// --- other scales
const TR = 'styles/createTransitions.mjs'
const tr = m.read(TR)
const easing = jsConst(tr, 'easing')
const duration = jsConst(tr, 'duration')
const zIndex = jsConst(m.read('styles/zIndex.mjs'), 'zIndex')
const SH = 'styles/shadows.mjs'
const sh = m.read(SH)
const opac = ['shadowKeyUmbraOpacity', 'shadowKeyPenumbraOpacity', 'shadowAmbientShadowOpacity'].map((k) => num(sh, new RegExp(`${k} = ([\\d.]+)`)))
const shadows = [tok('0', 'none', { file: SH }), ...[...sh.matchAll(/createShadow\(([-\d, ]+)\)/g)].map((x, i) => {
  const p = x[1].split(',').map((s) => s.trim())
  return tok(String(i + 1), [0, 1, 2].map((k) => `${p[k * 4]}px ${p[k * 4 + 1]}px ${p[k * 4 + 2]}px ${p[k * 4 + 3]}px rgba(0,0,0,${opac[k]})`).join(','), { file: SH })
})]
const BP = 'createBreakpoints/createBreakpoints.mjs'
const bpText = sys.read(BP)
const bp = Object.fromEntries([...bpText.slice(bpText.indexOf('values = {'), bpText.indexOf('unit =')).matchAll(/(\w+): (\d+)/g)].map((x) => [x[1], Number(x[2])]))
const spacingUnit = num(sys.read('createTheme/createSpacing.mjs'), /spacingInput = (\d+)/)
const radius = jsConst(sys.read('createTheme/shape.mjs'), 'shape').borderRadius
const containerXs = num(sys.read('Container/createContainer.mjs'), /Math\.max\(theme\.breakpoints\.values\.xs, (\d+)\)/)
const direction = /direction: '(\w+)'/.exec(sys.read('createTheme/createTheme.mjs'))?.[1]

// --- colour
const hues = m.ls('colors').filter((f) => f.endsWith('.mjs') && !/^(index|common)\./.test(f)).map((f) => f.replace('.mjs', ''))
const hue = (n) => Object.fromEntries([...m.read(`colors/${n}.mjs`).matchAll(/^\s+(A?\d+): '(#[0-9a-fA-F]+)'/gm)].map((x) => [x[1], x[2]]))
const grey = hue('grey')
const blue = hue('blue')
const CP = 'styles/createPalette.mjs'
const cp = m.read(CP)
const fnObj = (name) => {
  const body = new RegExp(`function ${name}\\(\\) \\{\\s*return (\\{[\\s\\S]*?\\n  \\});\\n\\}`).exec(cp)[1]
  return jsConst(`const x = ${body.replace(/common\.white/g, "'#fff'").replace(/common\.black/g, "'#000'")}`, 'x')
}
assertSource(m.read('colors/common.mjs'), ["black: '#000'", "white: '#fff'"], 'colors/common.mjs')
const lightObj = fnObj('getLight')
const darkObj = fnObj('getDark')
const prim = /function getDefaultPrimary\(mode = 'light'\) \{([\s\S]*?)\n\}/.exec(cp)[1]
const primDark = [...prim.slice(0, prim.indexOf('return', prim.indexOf('return') + 1)).matchAll(/(main|light|dark): blue\[(\d+)\]/g)]
const primLight = [...prim.slice(prim.indexOf('return', prim.indexOf('return') + 1)).matchAll(/(main|light|dark): blue\[(\d+)\]/g)]
const flat = (o, pre = '') => Object.entries(o ?? {}).flatMap(([k, v]) => (v && typeof v === 'object' && !('$expr' in v) ? flat(v, `${pre}${k}.`) : [tok(`${pre}${k}`, typeof v === 'object' ? v.$expr : v, { file: CP })]))

const i18n = scanI18n([{ p: m, only: /^styles\/.*\.mjs$/ }, { p: sys, only: /^(createTheme|RtlProvider|createBreakpoints|spacing)\/.*\.mjs$/ }, { p: m, only: /^locale\/.*\.mjs$/ }])
i18n.tokens = [tok('theme.direction', direction, { file: 'createTheme/createTheme.mjs (@mui/system)', note: 'a flag read by components and by the RTL style plugin; it changes no scale' })]
i18n.findings = [
  `The only direction datum in the theme is theme.direction ('${direction}' by default). @mui/system adds RtlProvider/useRtl (a boolean context). Neither changes a scale; flipping physical properties in generated CSS is left to a plugin the application configures (not part of these packages).`,
  `One font stack (${fontFamily}); no per-language stack, and letter-spacing is applied only when the default family is in use (source comment: it was designed for Roboto).`,
  'Line heights are fixed unitless ratios per variant (body1 1.5, body2 1.43, button 1.75, caption 1.66) with no language adjustment. Native inputs are forced to height 1.4375em (23px at 16px).',
  'Density: no theme-level mode. Each component has size small/medium (large on Button) or a `dense` prop (lists, menus, toolbar). Arabic locale files exist in locale/ (strings only).',
]

writeRef({
  id: 'mui',
  script: 'mui.mjs',
  system: { name: 'MUI (Material UI) default theme', package: '@mui/material', version: m.version, license: m.license, url: 'https://mui.com/material-ui/' },
  pkgs: [m, sys],
  provenanceNotes: 'Scale values are literals read from source. Control heights are derived (padding + line box) because MUI sets no height on buttons or inputs; each formula is recorded and its inputs are asserted to be present in the source.',
  scales: {
    controls: {
      densityModes: [{ id: 'default', name: 'size / dense props per component', mechanism: 'size-prop', description: 'No global density; small|medium(|large) per component and `dense` on lists and menus.' }],
      sizes,
      touchTarget: [tok('MenuItem min-height (below sm)', 48, { px: 48, file: MI })],
    },
    spacing: { steps: [tok('theme.spacing unit', spacingUnit, { px: spacingUnit, file: 'createTheme/createSpacing.mjs (@mui/system)' }), ...[0.5, 1, 1.5, 2, 3, 4, 5, 6, 8].map((n) => tok(`spacing(${n})`, `${n} × ${spacingUnit}px`, { px: n * spacingUnit, derived: true, formula: 'theme.spacing(n) = n × unit' }))], note: 'A multiplier, not an enumerated scale.' },
    radius: { steps: [tok('shape.borderRadius', radius, { px: radius, file: 'createTheme/shape.mjs (@mui/system)' })] },
    typography: {
      rootFontSizePx: htmlFontSize,
      fontStacks: [tok('fontFamily', fontFamily, { file: TY })],
      steps,
      fontWeights: Object.entries(weights).map(([k, v]) => tok(k, v, { file: TY })),
      note: `theme.typography.fontSize = ${baseFontSize} (the MD2 default body size); variants are given in px and converted to rem.`,
    },
    breakpoints: { steps: Object.entries(bp).map(([k, v]) => tok(k, v, { px: v, file: `${BP} (@mui/system)` })) },
    containers: { steps: [tok('xs', containerXs, { px: containerXs, file: 'Container/createContainer.mjs (@mui/system)' }), ...Object.entries(bp).filter(([k]) => k !== 'xs').map(([k, v]) => tok(k, v, { px: v, derived: true, formula: 'maxWidth = breakpoint value' }))] },
    zIndex: { steps: Object.entries(zIndex).map(([k, v]) => tok(k, v, { file: 'styles/zIndex.mjs' })) },
    elevation: { steps: shadows, note: '25 levels (0–24) from MD2 elevation: umbra, penumbra and ambient layers.' },
    motion: { durations: Object.entries(duration).map(([k, v]) => tok(k, v, { ms: v, file: TR })), easings: Object.entries(easing).map(([k, v]) => tok(k, v, { file: TR })) },
    color: {
      structure: {
        ramps: hues.map((n) => ({ name: n, steps: Object.keys(hue(n)).length, stepNames: Object.keys(hue(n)) })),
        semanticRoles: ['primary', 'secondary', 'error', 'warning', 'info', 'success', 'text.primary', 'text.secondary', 'text.disabled', 'background.default', 'background.paper', 'divider', 'action.*'],
        modes: ['light', 'dark'],
        note: 'MD2 hue ramps (50–900, A100–A700). Each semantic colour is main/light/dark/contrastText; light and dark are taken from the ramp for defaults or computed from main by tonalOffset 0.2, contrastText by contrastThreshold 3.',
      },
      algorithm: { name: 'augmentColor', inputs: ['main', 'tonalOffset (0.2)', 'contrastThreshold (3)', 'mode'], outputs: ['light', 'dark', 'contrastText'], description: 'light = lighten(main, tonalOffset), dark = darken(main, tonalOffset × 1.5), contrastText = white or near-black by WCAG contrast ratio against main.', files: [CP] },
      neutral: [{ name: 'grey', steps: Object.entries(grey).map(([k, v]) => tok(k, v, { file: 'colors/grey.mjs' })) }, { name: 'palette text/background/action', mode: 'light', steps: flat(lightObj) }, { name: 'palette text/background/action', mode: 'dark', steps: flat(darkObj) }],
      primary: [
        { name: 'blue', steps: Object.entries(blue).map(([k, v]) => tok(k, v, { file: 'colors/blue.mjs' })) },
        { name: 'palette.primary', mode: 'light', steps: primLight.map((x) => tok(x[1], blue[x[2]], { alias: `blue[${x[2]}]`, file: CP })) },
        { name: 'palette.primary', mode: 'dark', steps: primDark.map((x) => tok(x[1], blue[x[2]], { alias: `blue[${x[2]}]`, file: CP })) },
      ],
    },
    i18n,
  },
  gaps: ['Control heights are not tokens (derived). No border-width or focus-ring tokens (focus is a ripple).', 'No global density mode and no compact/touch theme.', 'Single radius value, no radius scale.'],
})
