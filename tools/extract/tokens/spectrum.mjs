#!/usr/bin/env node
// Adobe Spectrum: @adobe/spectrum-tokens src/*.json (token name → value | sets{desktop,mobile} | sets{light,dark}).
//   node tools/extract/tokens/spectrum.mjs <scratch-dir>
import { scratch, pkg, tok, px, round, clean, scanI18n, writeRef } from './lib.mjs'

const p = pkg(scratch(), '@adobe/spectrum-tokens')
const all = {}
const fileOf = {}
for (const f of p.ls('src').filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(p.read(`src/${f}`))
  for (const [k, v] of Object.entries(j)) {
    all[k] = v
    fileOf[k] = `src/${f}`
  }
}
p.used.clear()
for (const f of ['layout.json', 'typography.json', 'color-palette.json', 'semantic-color-palette.json', 'color-aliases.json', 'layout-component.json']) p.used.add(`src/${f}`)
/** value of a token in a set (desktop/mobile/light/dark), following {aliases} */
function get(name, set, depth = 0) {
  const t = all[name]
  if (!t || depth > 10) return undefined
  let v = t.sets ? (t.sets[set] ?? Object.values(t.sets)[0]).value : t.value
  const m = typeof v === 'string' && /^\{([\w-]+)\}$/.exec(v)
  return m ? get(m[1], set, depth + 1) : v
}
const raw = (name, set) => {
  const t = all[name]
  return t?.sets ? t.sets[set]?.value : t?.value
}
const names = (re) => Object.keys(all).filter((k) => re.test(k))
const order = (a, b) => Number(/(\d+)$/.exec(a)?.[1] ?? 0) - Number(/(\d+)$/.exec(b)?.[1] ?? 0)
const T = (k, set) => clean(tok(k, get(k, set), { px: typeof get(k, set) === 'string' ? px(get(k, set)) : undefined, mode: all[k].sets ? set : undefined, alias: typeof raw(k, set) === 'string' && raw(k, set).startsWith('{') ? raw(k, set) : undefined, file: fileOf[k], note: all[k].deprecated ? 'deprecated upstream' : undefined }))
const both = (ks) => ks.flatMap((k) => (all[k].sets ? ['desktop', 'mobile'].map((s) => T(k, s)) : [T(k)]))

// controls
const sizeMap = [['xs', '50'], ['s', '75'], ['m', '100'], ['l', '200'], ['xl', '300']]
const sizes = []
for (const scale of ['desktop', 'mobile'])
  for (const [s, n] of sizeMap) {
    const ty = all[`component-${s}-regular`]?.value
    const fsName = ty && /\{([\w-]+)\}/.exec(ty.fontSize)[1]
    const lhName = ty && /\{([\w-]+)\}/.exec(ty.lineHeight)[1]
    const fs = px(get(fsName, scale))
    const lh = px(get(lhName, scale))
    sizes.push(clean({ component: 'control', size: s, mode: scale, heightPx: px(get(`component-height-${n}`, scale)), paddingInlinePx: px(get(`component-edge-to-text-${n}`, scale)), paddingBlockPx: px(get(`component-top-to-text-${n}`, scale)), fontSizePx: fs, lineHeightPx: lh, lineHeightRatio: fs && lh ? round(lh / fs) : undefined, gapPx: px(get(`text-to-visual-${n}`, scale)), iconSizePx: px(get(`workflow-icon-size-${n}`, scale)), heightSource: `component-height-${n}; typography component-${s}-regular (${fsName} / ${lhName})`, file: 'src/layout.json, src/typography.json' }))
  }
for (const scale of ['desktop', 'mobile']) for (const n of ['400', '500']) if (all[`component-height-${n}`]) sizes.push({ component: 'control', size: `height-${n}`, mode: scale, heightPx: px(get(`component-height-${n}`, scale)), heightSource: `component-height-${n}`, file: 'src/layout.json' })

// typography
const fsNames = names(/^font-size-\d+$/).sort(order)
const steps = ['desktop', 'mobile'].flatMap((scale) => fsNames.map((k) => {
  const fs = px(get(k, scale))
  const lh = px(get(`line-height-${k}`, scale))
  return clean({ name: k, set: scale, fontSize: get(k, scale), fontSizePx: fs, lineHeight: get(`line-height-${k}`, scale), lineHeightPx: lh, lineHeightRatio: lh ? round(lh / fs) : undefined, letterSpacing: get('letter-spacing'), file: 'src/typography.json' })
}))
const lhTokens = names(/^(cjk-)?line-height-\d+$/).map((k) => tok(k, get(k), { ratio: get(k), file: fileOf[k] }))

// colours
const ramps = {}
for (const k of Object.keys(all).filter((k) => fileOf[k] === 'src/color-palette.json')) {
  const m = /^([a-z-]+?)-(\d+)$/.exec(k)
  if (m) (ramps[m[1]] ??= []).push(k)
}
const ramp = (name, set) => ({ name, mode: set, steps: ramps[name].sort(order).map((k) => tok(k, get(k, set), { mode: set, file: fileOf[k] })) })
const role = (re, set, label) => ({ name: label, mode: set, steps: names(re).map((k) => tok(k, String(get(k, set)), { alias: typeof raw(k, set) === 'string' && raw(k, set).startsWith('{') ? raw(k, set) : undefined, mode: set, file: fileOf[k] })) })
const neutralRe = /^(background-(base|layer-1|layer-2|elevated|pasteboard)-color|neutral-(content|background|subdued-content|subdued-background)-color-default|disabled-(content|background|border)-color|gray-(25|100|500|800|1000))$/
const accentRe = /^(accent-(background|content)-color-(default|hover|down|key-focus)|accent-visual-color|focus-indicator-color)$/
const accentRamp = /\{([a-z]+)-\d+\}/.exec(raw('accent-color-900', 'light') ?? raw('accent-color-900') ?? '')?.[1]

const densityNames = names(/compact|spacious/)
const i18n = scanI18n([{ p, only: /^src\// }, { p, only: /^(README|llms|AGENTS)\.(md|txt)$|^manifest\.json$/ }])
i18n.tokens = [...names(/^cjk-/).map((k) => tok(k, String(get(k)), { alias: typeof raw(k) === 'string' && raw(k).startsWith('{') ? raw(k) : undefined, file: fileOf[k] })), ...names(/^text-align-(start|end)$/).map((k) => tok(k, String(get(k)), { file: fileOf[k] })), ...names(/^(sans-serif|serif|default)-font-family$/).map((k) => tok(k, String(get(k)), { file: fileOf[k] }))]
i18n.findings = [
  `Spectrum is the only system here with script-specific line-height tokens: cjk-line-height-100 = ${get('cjk-line-height-100')} against line-height-100 = ${get('line-height-100')}, and cjk-line-height-200 = ${get('cjk-line-height-200')} against line-height-200 = ${get('line-height-200')}; plus cjk-font-family (${get('cjk-font-family')}) and cjk-letter-spacing. The precedent — a script gets its own multiplier token — is exactly what Arabic needs, but no Arabic, Hebrew or RTL token exists.`,
  `Component text uses fixed px line heights tied to each font size (line-height-font-size-100 = ${get('line-height-font-size-100', 'desktop')} for ${get('font-size-100', 'desktop')} on desktop, ${get('line-height-font-size-100', 'mobile')} for ${get('font-size-100', 'mobile')} on mobile), ratio ≈ 1.29, with no CJK or other script variant for components.`,
  `Platform scale is a first-class dimension: every size token has desktop and mobile values (component-height-100 ${get('component-height-100', 'desktop')} → ${get('component-height-100', 'mobile')}, font-size-100 ${get('font-size-100', 'desktop')} → ${get('font-size-100', 'mobile')}): touch gets ×1.25 on height and a larger font, not just padding.`,
  `Density words appear only on a few layout tokens (${densityNames.length} names containing compact/spacious: list gaps, group gaps, field icon offsets), not as a global mode.`,
  'Direction: tokens use logical names (text-align-start/end, field-end-edge-…, edge-to-text); there is no direction token.',
]

writeRef({
  id: 'spectrum',
  script: 'spectrum.mjs',
  system: { name: 'Adobe Spectrum (Spectrum 2 tokens)', package: '@adobe/spectrum-tokens', version: p.version, license: p.license, url: 'https://spectrum.adobe.com' },
  pkgs: [p],
  scales: {
    controls: {
      densityModes: [
        { id: 'desktop', name: 'scale: desktop (medium)', mechanism: 'platform-scale', description: 'Pointer devices.', file: 'src/layout.json' },
        { id: 'mobile', name: 'scale: mobile (large)', mechanism: 'platform-scale', description: 'Touch devices: sizes and font sizes are about 1.25× desktop.', file: 'src/layout.json' },
      ],
      sizes,
      touchTarget: [],
      note: 'T-shirt sizes XS–XL map to component-height-50/75/100/200/300.',
    },
    spacing: { steps: both(names(/^spacing-\d+$/).sort(order)) },
    radius: { steps: both(names(/^corner-radius-(\d+|none|full)$/).sort(order)) },
    borderWidth: { steps: both(names(/^border-width-\d+$/).sort(order)) },
    focusRing: { steps: both(names(/^(focus-indicator-thickness|focus-indicator-gap|focus-ring-gap|side-focus-indicator)$/)) },
    typography: {
      rootFontSizePx: 16,
      fontStacks: names(/font-family$/).map((k) => tok(k, String(get(k)), { file: fileOf[k] })),
      steps,
      lineHeights: lhTokens,
      fontWeights: names(/-font-weight$/).map((k) => tok(k, String(get(k)), { file: fileOf[k] })),
      letterSpacings: names(/letter-spacing$/).map((k) => tok(k, String(get(k)), { file: fileOf[k] })),
    },
    elevation: { steps: both(names(/^drop-shadow-(x|y|blur)(-\d+)?$|^drop-shadow-(elevated|emphasized-default|dragged)-(x|y|blur)$|^android-elevation$/)) },
    color: {
      structure: {
        ramps: Object.entries(ramps).map(([n, ks]) => ({ name: n, steps: ks.length, stepNames: ks.sort(order).map((k) => k.split('-').pop()) })),
        semanticRoles: Object.keys(all).filter((k) => fileOf[k] === 'src/color-aliases.json'),
        modes: Object.keys(all['gray-100'].sets),
        note: `Ramps (gray 25–1000, hues 100–1600) each with light/dark/wireframe values → semantic palette (accent, informative, negative, notice, positive → a hue ramp; accent = ${accentRamp}) → aliases.`,
      },
      neutral: [ramp('gray', 'light'), ramp('gray', 'dark'), role(neutralRe, 'light', 'neutral aliases'), role(neutralRe, 'dark', 'neutral aliases')],
      primary: [ramp(accentRamp, 'light'), ramp(accentRamp, 'dark'), role(accentRe, 'light', 'accent aliases'), role(accentRe, 'dark', 'accent aliases')],
    },
    i18n,
    extra: { densityWordTokens: densityNames },
  },
  gaps: ['No motion (duration/easing), breakpoint, container or z-index tokens in this package.', 'No touch-target minimum token; touch is handled by the mobile scale.', 'Font weights are named (regular, medium, bold…), not numeric.'],
})
