#!/usr/bin/env node
// Ant Design: seed tokens (es/theme/themes/seed.js), the default algorithm's published output (CSS variables in
// dist/antd.css), component tokens (es/version/token.json), and the compact algorithm's output, which upstream does
// not publish as data: it is DERIVED here by mirroring the formulas in es/theme/themes/{shared,compact}/*.js.
// Each mirrored formula is asserted to still be present in the source, and the mirror is checked against the
// published default output before it is applied to compact.
//   node tools/extract/tokens/antd.mjs <scratch-dir>
import { scratch, pkg, jsConst, isExpr, assertSource, tok, tokPx, tokMs, round, clean, scanI18n, writeRef } from './lib.mjs'

const root = scratch()
const p = pkg(root, 'antd')
const colors = pkg(root, '@ant-design/colors')
const TH = 'es/theme/themes/'

// --- seed
const seedText = p.read(`${TH}seed.js`)
const presets = jsConst(seedText, 'defaultPresetColors')
const seed = jsConst(seedText, 'seedToken')
for (const k of Object.keys(seed)) if (isExpr(seed[k]) || k.startsWith('...')) delete seed[k]

// --- default algorithm output, as published
const CSS = 'dist/antd.css'
const css = p.read(CSS)
const at = css.indexOf('--ant-control-height:')
const block = css.slice(css.lastIndexOf('}', at) + 1, css.indexOf('}', at))
const def = {}
for (const m of block.matchAll(/--ant-([a-z0-9-]+):([^;]*);/g)) def[m[1]] = m[2].trim().replace(/\s+/g, ' ')
const D = (n) => Number.parseFloat(def[n])

// --- mirrored formulas
const src = {
  height: p.read(`${TH}shared/genControlHeight.js`),
  size: p.read(`${TH}shared/genSizeMapToken.js`),
  font: p.read(`${TH}shared/genFontSizes.js`),
  fontMap: p.read(`${TH}shared/genFontMapToken.js`),
  common: p.read(`${TH}shared/genCommonMapToken.js`),
  compact: p.read(`${TH}compact/index.js`),
  compactSize: p.read(`${TH}compact/genCompactSizeMapToken.js`),
  alias: p.read('es/theme/util/alias.js'),
}
assertSource(src.height, ['controlHeightSM: controlHeight * 0.75', 'controlHeightXS: controlHeight * 0.5', 'controlHeightLG: controlHeight * 1.25'], 'genControlHeight')
assertSource(src.size, ['sizeXXL: sizeUnit * (sizeStep + 8)', 'sizeXL: sizeUnit * (sizeStep + 4)', 'sizeLG: sizeUnit * (sizeStep + 2)', 'sizeMD: sizeUnit * (sizeStep + 1)', 'sizeMS: sizeUnit * sizeStep', 'size: sizeUnit * sizeStep', 'sizeSM: sizeUnit * (sizeStep - 1)', 'sizeXS: sizeUnit * (sizeStep - 2)', 'sizeXXS: sizeUnit * (sizeStep - 3)'], 'genSizeMapToken')
assertSource(src.compactSize, ['const compactSizeStep = sizeStep - 2', 'sizeXXL: sizeUnit * (compactSizeStep + 10)', 'sizeXL: sizeUnit * (compactSizeStep + 6)', 'sizeLG: sizeUnit * (compactSizeStep + 2)', 'sizeMD: sizeUnit * (compactSizeStep + 2)', 'sizeMS: sizeUnit * (compactSizeStep + 1)', 'size: sizeUnit * compactSizeStep', 'sizeSM: sizeUnit * compactSizeStep', 'sizeXS: sizeUnit * (compactSizeStep - 1)', 'sizeXXS: sizeUnit * (compactSizeStep - 1)'], 'genCompactSizeMapToken')
assertSource(src.font, ['return (fontSize + 8) / fontSize', 'length: 10', 'const i = index - 1', 'const baseSize = base * Math.E ** (i / 5)', 'const intSize = index > 1 ? Math.floor(baseSize) : Math.ceil(baseSize)', 'return Math.floor(intSize / 2) * 2', 'fontSizes[1] = base'], 'genFontSizes')
assertSource(src.fontMap, ['const fontSizeMD = fontSizes[1]', 'const fontSizeSM = fontSizes[0]', 'const fontSizeLG = fontSizes[2]', 'fontSizeXL: fontSizes[3]', 'fontSizeHeading1: fontSizes[6]', 'fontSizeHeading2: fontSizes[5]', 'fontSizeHeading3: fontSizes[4]'], 'genFontMapToken')
assertSource(src.compact, ['const fontSize = mergedMapToken.fontSizeSM', 'const controlHeight = mergedMapToken.controlHeight - 4', '...genCompactSizeMapToken(mapToken ?? token)', '...genFontMapToken(fontSize)'], 'compact algorithm')
assertSource(src.common, ['motionDurationFast: `${(motionBase + motionUnit).toFixed(1)}s`', 'motionDurationMid: `${(motionBase + motionUnit * 2).toFixed(1)}s`', 'motionDurationSlow: `${(motionBase + motionUnit * 3).toFixed(1)}s`'], 'genCommonMapToken')

const heights = (h) => ({ 'control-height': h, 'control-height-sm': h * 0.75, 'control-height-xs': h * 0.5, 'control-height-lg': h * 1.25 })
const sizeMap = (u, s) => ({ 'size-xxl': u * (s + 8), 'size-xl': u * (s + 4), 'size-lg': u * (s + 2), 'size-md': u * (s + 1), 'size-ms': u * s, size: u * s, 'size-sm': u * (s - 1), 'size-xs': u * (s - 2), 'size-xxs': u * (s - 3) })
const compactSizeMap = (u, s0) => {
  const s = s0 - 2
  return { 'size-xxl': u * (s + 10), 'size-xl': u * (s + 6), 'size-lg': u * (s + 2), 'size-md': u * (s + 2), 'size-ms': u * (s + 1), size: u * s, 'size-sm': u * s, 'size-xs': u * (s - 1), 'size-xxs': u * (s - 1) }
}
const fontMap = (base) => {
  const sizes = Array.from({ length: 10 }).map((_, index) => {
    const b = base * Math.E ** ((index - 1) / 5)
    return Math.floor((index > 1 ? Math.floor(b) : Math.ceil(b)) / 2) * 2
  })
  sizes[1] = base
  const lh = (s) => (s + 8) / s
  const o = { 'font-size-sm': sizes[0], 'font-size': sizes[1], 'font-size-lg': sizes[2], 'font-size-xl': sizes[3], 'font-size-heading-1': sizes[6], 'font-size-heading-2': sizes[5], 'font-size-heading-3': sizes[4], 'font-size-heading-4': sizes[3], 'font-size-heading-5': sizes[2] }
  for (const k of Object.keys(o)) o[k.replace('font-size', 'line-height')] = lh(o[k])
  return o
}
// self-check: the mirror must reproduce the published default output exactly
const mirrorDefault = { ...heights(seed.controlHeight), ...sizeMap(seed.sizeUnit, seed.sizeStep), ...fontMap(seed.fontSize) }
for (const [k, v] of Object.entries(mirrorDefault)) if (Math.abs(D(k) - v) > 1e-9) throw new Error(`mirror disagrees with ${CSS}: ${k} = ${v}, published ${def[k]}`)
const compact = { ...heights(seed.controlHeight - 4), ...compactSizeMap(seed.sizeUnit, seed.sizeStep), ...fontMap(mirrorDefault['font-size-sm']) }
const cTok = (k, unit = 'px') => tok(k, unit ? `${round(compact[k])}${unit}` : round(compact[k], 6), { px: unit ? round(compact[k]) : undefined, mode: 'compact', derived: true, formula: 'compact algorithm mirrored from es/theme/themes/compact/index.js' })

// --- component tokens (default algorithm)
const comp = JSON.parse(p.read('es/version/token.json'))
const B = comp.Button.component
const I = comp.Input.component
const lineWidth = D('line-width')
const sizes = []
for (const [size, sfx, hk] of [['small', 'SM', 'control-height-sm'], ['middle', '', 'control-height'], ['large', 'LG', 'control-height-lg']]) {
  const radius = D(size === 'small' ? 'border-radius-sm' : size === 'large' ? 'border-radius-lg' : 'border-radius')
  sizes.push(clean({ component: 'button', size, mode: 'default', heightPx: D(hk), paddingInlinePx: B[`paddingInline${sfx}`], paddingBlockPx: B[`paddingBlock${sfx}`], fontSizePx: B[`contentFontSize${sfx}`], lineHeightRatio: round(B[`contentLineHeight${sfx}`]), lineHeightPx: round(B[`contentFontSize${sfx}`] * B[`contentLineHeight${sfx}`], 2), radiusPx: radius, gapPx: B.iconGap, heightSource: `--ant-${hk}`, file: `${CSS}, es/version/token.json` }))
  const ilh = size === 'large' ? D('line-height-lg') : D('line-height')
  sizes.push(clean({ component: 'input', size, mode: 'default', heightPx: D(hk), paddingInlinePx: I[`paddingInline${sfx}`], paddingBlockPx: I[`paddingBlock${sfx}`], fontSizePx: I[`inputFontSize${sfx}`], lineHeightRatio: round(ilh), lineHeightPx: round(I[`inputFontSize${sfx}`] * ilh, 2), radiusPx: radius, heightSource: `--ant-${hk}`, file: `${CSS}, es/version/token.json`, note: `paddings exclude the ${lineWidth}px border` }))
  for (const component of ['button', 'input']) {
    const fs = size === 'large' ? compact['font-size-lg'] : compact['font-size']
    const lh = size === 'large' ? compact['line-height-lg'] : compact['line-height']
    sizes.push({ component, size, mode: 'compact', heightPx: round(compact[hk]), fontSizePx: fs, lineHeightRatio: round(lh), lineHeightPx: round(fs * lh, 2), heightSource: hk, derived: true, formula: 'controlHeight − 4, then ×0.75 (small) / ×1.25 (large); base font = default fontSizeSM', file: `${TH}compact/index.js` })
  }
}
sizes.push({ component: 'control', size: 'xs', mode: 'default', heightPx: D('control-height-xs'), heightSource: '--ant-control-height-xs', file: CSS })
sizes.push({ component: 'select-option', size: 'middle', mode: 'default', heightPx: comp.Select.component.optionHeight, fontSizePx: comp.Select.component.optionFontSize, lineHeightRatio: round(comp.Select.component.optionLineHeight), file: 'es/version/token.json' })
sizes.push({ component: 'menu-item', size: 'middle', mode: 'default', heightPx: comp.Menu.component.itemHeight, file: 'es/version/token.json' })
sizes.push({ component: 'checkbox', size: 'middle', mode: 'default', heightPx: D('control-interactive-size'), heightSource: '--ant-control-interactive-size', file: CSS })
const T = comp.Table.component
for (const [size, sfx] of [['large', ''], ['middle', 'MD'], ['small', 'SM']]) sizes.push({ component: 'table-cell', size, mode: 'default', paddingBlockPx: T[`cellPaddingBlock${sfx}`], paddingInlinePx: T[`cellPaddingInline${sfx}`], fontSizePx: T[`cellFontSize${sfx}`], file: 'es/version/token.json' })

// --- typography
const typeSteps = ['font-size-sm', 'font-size', 'font-size-lg', 'font-size-xl', 'font-size-heading-5', 'font-size-heading-4', 'font-size-heading-3', 'font-size-heading-2', 'font-size-heading-1'].flatMap((k) => {
  const lk = k.replace('font-size', 'line-height')
  const lhd = def[lk] ?? (k === 'font-size-xl' ? undefined : undefined)
  const out = [clean({ name: k, set: 'default', fontSize: def[k], fontSizePx: D(k), lineHeight: lhd && Number(lhd), lineHeightRatio: lhd && round(Number(lhd)), lineHeightPx: lhd && round(D(k) * Number(lhd), 2), file: CSS })]
  out.push({ name: k, set: 'compact', fontSizePx: compact[k], lineHeightRatio: round(compact[lk]), lineHeightPx: round(compact[k] * compact[lk], 2), derived: true, file: `${TH}compact/index.js` })
  return out
})

// --- colour
const dark = p.read(`${TH}dark/colors.js`)
const light = p.read(`${TH}default/colors.js`)
assertSource(p.read(`${TH}dark/colorAlgorithm.js`), ['instance.lighten(brightness).toHexString()', 'new FastColor(baseColor).setA(alpha).toRgbString()'], 'dark colorAlgorithm')
const neutralFormulas = (text, mode, baseBg, baseText) =>
  [...text.matchAll(/(color\w+): (getAlphaColor|getSolidColor)\((\w+), ([\d.]+)\)/g)].map((m) => {
    const amount = Number(m[4])
    let value
    if (m[2] === 'getAlphaColor') value = baseText === '#fff' ? `rgba(255,255,255,${amount})` : `rgba(0,0,0,${amount})`
    else {
      // lighten/darken of pure black/white moves HSL lightness by `amount` percent: a gray of that lightness
      const l = baseBg === '#000' ? amount / 100 : 1 - amount / 100
      const c = Math.round(l * 255).toString(16).padStart(2, '0')
      value = `#${c}${c}${c}`
    }
    return tok(m[1], value, { mode, derived: true, formula: `${m[2]}(${m[3]}, ${m[4]}) with ${m[3]} = ${m[3] === 'colorBgBase' ? baseBg : baseText}`, file: `${TH}${mode === 'dark' ? 'dark' : 'default'}/colors.js` })
  })
const lightNeutral = neutralFormulas(light, 'light', '#fff', '#000')
// self-check the colour mirror against the published light values (alpha tokens only differ by formatting)
for (const t of lightNeutral) {
  const k = t.name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
  const pub = def[k]
  if (pub && pub.startsWith('#') && pub !== t.value) throw new Error(`neutral mirror disagrees: ${t.name} ${t.value} vs ${pub}`)
}
const presetsText = colors.read('es/presets.js')
const blueDark = jsConst(presetsText, 'blueDark')
const primaryPreset = Object.entries(presets).find(([, v]) => v.toLowerCase() === seed.colorPrimary.toLowerCase())?.[0]
const neutralNames = ['color-text', 'color-text-secondary', 'color-text-tertiary', 'color-text-quaternary', 'color-fill', 'color-fill-secondary', 'color-fill-tertiary', 'color-fill-quaternary', 'color-bg-layout', 'color-bg-container', 'color-bg-elevated', 'color-bg-spotlight', 'color-border', 'color-border-secondary', 'color-bg-solid']

const i18n = scanI18n([{ p, only: /^es\/theme\// }, { p, only: /^es\/version\/token.*\.json$/ }, { p, only: /^es\/(config-provider|locale)\// }])
const rtlTokens = Object.entries(comp).flatMap(([c, v]) => Object.keys(v.component ?? {}).filter((k) => /rtl/i.test(k)).map((k) => tok(`${c}.${k}`, String(v.component[k]), { file: 'es/version/token.json' })))
i18n.tokens = rtlTokens
i18n.findings = [
  "No seed, map or alias token concerns direction, language or script (see patterns: the scan of es/theme/ and the token JSON finds no Arabic, bidi, :dir or :lang match). The single font stack is Latin system fonts plus 'Noto Sans' (not Noto Sans Arabic).",
  `Component tokens that name RTL: ${rtlTokens.map((t) => t.name).join(', ') || 'none'}.`,
  'Direction is a ConfigProvider prop (`direction`), applied as a `-rtl` class per component; styles use logical properties (padding-inline, margin-inline-start).',
  'Line height is a pure function of font size, (fontSize + 8) / fontSize, for every language: 14px → 22px, 12px → 20px. Locale files exist for ar_EG, fa_IR, he_IL, ku_IQ, ur_PK but carry strings only.',
  'Density has two independent axes: the compact ALGORITHM (controlHeight − 4, font 14 → 12, spacing step −2) and the per-component SIZE prop (small/middle/large = ×0.75/×1/×1.25 of controlHeight).',
]

writeRef({
  id: 'ant-design',
  script: 'antd.mjs',
  system: { name: 'Ant Design', package: 'antd', version: p.version, license: p.license, url: 'https://ant.design' },
  pkgs: [p, colors],
  provenanceNotes: 'Default-mode values are read literally. Entries marked derived:true (compact mode, dark neutrals, motion durations) are computed by mirroring upstream formulas; the script asserts each formula is still in the source and that the mirror reproduces the published default output.',
  scales: {
    controls: {
      densityModes: [
        { id: 'default', name: 'defaultAlgorithm', mechanism: 'algorithm', description: 'controlHeight 32 seed; SM/XS/LG are ×0.75/×0.5/×1.25.', file: `${TH}shared/genControlHeight.js` },
        { id: 'compact', name: 'compactAlgorithm', mechanism: 'algorithm', description: 'controlHeight − 4; base font becomes the default fontSizeSM; size step − 2.', file: `${TH}compact/index.js` },
      ],
      sizes,
      touchTarget: [],
      note: 'Component size prop small/middle/large selects controlHeightSM/controlHeight/controlHeightLG. There is no touch mode and no touch-target token.',
    },
    spacing: {
      steps: [
        ...['size-xxs', 'size-xs', 'size-sm', 'size', 'size-ms', 'size-md', 'size-lg', 'size-xl', 'size-xxl'].flatMap((k) => [tokPx(k, def[k], { mode: 'default', file: CSS }), cTok(k)]),
        ...Object.keys(def).filter((k) => /^(padding|margin)(-|$)/.test(k)).map((k) => tokPx(k, def[k], { mode: 'default', file: CSS })),
      ],
      note: 'sizeUnit 4 × (sizeStep 4 + n). padding*/margin* alias the size tokens.',
    },
    radius: { steps: Object.keys(def).filter((k) => k.startsWith('border-radius')).map((k) => tokPx(k, def[k], { file: CSS })) },
    borderWidth: { steps: ['line-width', 'line-width-bold'].map((k) => tokPx(k, def[k], { file: CSS })) },
    focusRing: { steps: ['line-width-focus', 'control-outline-width'].map((k) => tokPx(k, def[k], { file: CSS })).concat(tok('control-outline', def['control-outline'], { file: CSS })), note: 'lineWidthFocus = lineWidth × 3 is the outline width of keyboard focus; controlOutlineWidth is the 2px focus shadow of inputs. No offset token (offset 1px is a literal in the focus mixin).' },
    typography: {
      rootFontSizePx: 16,
      fontStacks: [tok('fontFamily', seed.fontFamily.replace(/\s+/g, ' '), { file: `${TH}seed.js` }), tok('fontFamilyCode', seed.fontFamilyCode, { file: `${TH}seed.js` })],
      steps: typeSteps,
      fontWeights: [tok('font-weight-strong', Number(def['font-weight-strong']), { file: CSS }), tok('Button.fontWeight', B.fontWeight, { file: 'es/version/token.json' })],
      note: 'fontSize(i) = even floor of 14 × e^(i/5); lineHeight = (fontSize + 8) / fontSize.',
    },
    breakpoints: { steps: [...src.alias.matchAll(/const (screen[A-Z]+) = (\d+);/g)].map((m) => tok(m[1], Number(m[2]), { px: Number(m[2]), file: 'es/theme/util/alias.js' })) },
    zIndex: { steps: [tok('zIndexBase', seed.zIndexBase, { file: `${TH}seed.js` }), tok('zIndexPopupBase', seed.zIndexPopupBase, { file: `${TH}seed.js` }), ...Object.entries(comp).filter(([, v]) => v.component?.zIndexPopup !== undefined).map(([c, v]) => tok(`${c}.zIndexPopup`, v.component.zIndexPopup, { file: 'es/version/token.json' }))] },
    elevation: { steps: Object.keys(def).filter((k) => /^box-shadow(-secondary|-tertiary|-card)?$/.test(k)).map((k) => tok(k, def[k], { file: CSS })) },
    motion: {
      durations: [['motionDurationFast', 1], ['motionDurationMid', 2], ['motionDurationSlow', 3]].map(([n, k]) => tokMs(n, `${(seed.motionBase + seed.motionUnit * k).toFixed(1)}s`, { derived: true, formula: `motionBase ${seed.motionBase} + motionUnit ${seed.motionUnit} × ${k}`, file: `${TH}shared/genCommonMapToken.js` })),
      easings: Object.keys(seed).filter((k) => k.startsWith('motionEase')).map((k) => tok(k, seed[k], { file: `${TH}seed.js` })),
      note: `${CSS} publishes the three durations as ${def['motion-duration-mid']} because the static stylesheet is generated with motion off; the values here follow the seed formula.`,
    },
    color: {
      structure: {
        ramps: Object.keys(presets).map((n) => ({ name: n, steps: 10 })),
        semanticRoles: Object.keys(def).filter((k) => k.startsWith('color-')),
        modes: ['default (light)', 'dark', 'compact (no colour change)'],
        note: 'Seed colours (primary, success, warning, error, info, link, textBase, bgBase) → 10-step palette per seed → named map tokens (Bg, BgHover, Border, BorderHover, Hover, base, Active, TextHover, Text, TextActive). Neutrals are alpha steps of textBase and lightness steps of bgBase.',
      },
      algorithm: {
        name: 'defaultAlgorithm / darkAlgorithm / compactAlgorithm (theme.algorithm, composable)',
        inputs: Object.keys(seed),
        outputs: [`${Object.keys(def).length} global CSS variables in the default output`, 'map tokens: colour palettes, sizes, heights, font sizes and line heights, radii, motion durations', 'alias tokens: paddings, margins, shadows, screen breakpoints, control tokens'],
        description: 'generate() in @ant-design/colors builds 10 steps from one colour in HSV: 5 lighter steps (hue ±2° per step, saturation −0.16, value +0.05) and 4 darker (saturation +0.05, value −0.15), index 6 being the seed. Dark mode mixes those steps into the dark background by fixed amounts (darkColorMap). The dark algorithm also remaps hover/active steps and rebuilds neutrals from bgBase #000 / textBase #fff.',
        files: ['es/generate.js (@ant-design/colors)', `${TH}shared/genColorMapToken.js`, `${TH}default/colors.js`, `${TH}dark/colors.js`, 'es/theme/util/alias.js'],
      },
      neutral: [
        { name: 'neutral map tokens', mode: 'light', steps: neutralNames.filter((k) => def[k]).map((k) => tok(k, def[k], { file: CSS })) },
        { name: 'neutral map tokens', mode: 'dark', steps: neutralFormulas(dark, 'dark', '#000', '#fff') },
      ],
      primary: [
        { name: `${primaryPreset} (colorPrimary ${seed.colorPrimary})`, mode: 'light', steps: Array.from({ length: 10 }, (_, i) => tok(`${primaryPreset}-${i + 1}`, def[`${primaryPreset}-${i + 1}`], { file: CSS })) },
        { name: `${primaryPreset}Dark preset`, mode: 'dark', steps: blueDark.map((v, i) => tok(`${primaryPreset}-${i + 1}`, v, { file: 'es/presets.js (@ant-design/colors)' })) },
      ],
    },
    i18n,
    extra: { seed, compactMapTokens: Object.fromEntries(Object.entries(compact).map(([k, v]) => [k, round(v, 6)])) },
  },
  gaps: [
    'Compact and dark outputs are not published as data; compact sizes are derived (see provenance notes). Compact component paddings (Button/Input paddingBlock) are computed inside each component and were not derived.',
    'No touch density and no touch-target token.',
    'No container-width tokens; no focus-ring offset token.',
  ],
})
