#!/usr/bin/env node
// Mantine: default theme object (esm/core/MantineProvider/default-theme.mjs, parsed as AST), default colours,
// colour-scheme variable resolver, and component size variables in styles/Button.css and styles/Input.css.
//   node tools/extract/tokens/mantine.mjs <scratch-dir>
import { scratch, pkg, parseJs, decls, lit, isExpr, cssRules, tok, px, round, clean, scanI18n, writeRef } from './lib.mjs'

const p = pkg(scratch(), '@mantine/core')
const TF = 'esm/core/MantineProvider/default-theme.mjs'
const d = decls(parseJs(p.read(TF)))
const fam = lit(d.get('DEFAULT_FONT_FAMILY'))
const theme = lit(d.get('DEFAULT_THEME'), { DEFAULT_FONT_FAMILY: fam })
const remv = (v) => (isExpr(v) ? Number(/rem\((-?[\d.]+)\)/.exec(v.$expr)?.[1]) : px(v))
const scale = (o, key) => Object.entries(o).map(([k, v]) => tok(`${key}.${k}`, isExpr(v) ? v.$expr : v, { px: remv(v), file: TF }))
const shadowText = (v) => (isExpr(v) ? v.$expr.replace(/^`|`$/g, '').replace(/\$\{rem\((-?[\d.]+)\)\}/g, (_, n) => `${Number(n) / 16}rem`) : v)

// component variables
const vars = (file) => {
  const out = {}
  for (const r of cssRules(p.read(file))) if (!r.at.length || r.at.every((a) => !a.startsWith('@'))) for (const [k, v] of r.decls) if (k.startsWith('--') && !(k in out)) out[k.slice(2)] = v
  return out
}
const cv = (v) => {
  const m = /^calc\((-?[\d.]+)rem \* var\(--mantine-scale\)\)$/.exec(v ?? '')
  return m ? round(Number(m[1]) * 16, 3) : px(v)
}
const B = 'styles/Button.css'
const I = 'styles/Input.css'
const b = vars(B)
const i = vars(I)
const fs = Object.fromEntries(Object.entries(theme.fontSizes).map(([k, v]) => [k, remv(v)]))
const lhBody = Object.fromEntries(Object.entries(theme.lineHeights).map(([k, v]) => [k, Number(v)]))
const btnLine = /line-height: (\d+);/.exec(p.read(B))?.[1]
const sizes = []
for (const s of ['xs', 'sm', 'md', 'lg', 'xl']) {
  sizes.push(clean({ component: 'button', size: s, mode: 'default', heightPx: cv(b[`button-height-${s}`]), paddingInlinePx: cv(b[`button-padding-x-${s}`]), fontSizePx: fs[s], lineHeightRatio: Number(btnLine), lineHeightPx: fs[s] * Number(btnLine), heightSource: `--button-height-${s}`, file: B, note: 'label line-height is 1 (single line, centred by flex)' }))
  sizes.push(clean({ component: 'button', size: s, mode: 'compact', heightPx: cv(b[`button-height-compact-${s}`]), paddingInlinePx: cv(b[`button-padding-x-compact-${s}`]), fontSizePx: fs[s], lineHeightRatio: Number(btnLine), lineHeightPx: fs[s] * Number(btnLine), heightSource: `--button-height-compact-${s}`, file: B }))
  const h = cv(i[`input-height-${s}`])
  sizes.push(clean({ component: 'input', size: s, mode: 'default', heightPx: h, paddingInlinePx: round(h / 3, 2), fontSizePx: fs[s], lineHeightPx: h - 2, lineHeightRatio: round((h - 2) / fs[s]), heightSource: `--input-height-${s}; --input-line-height = height − 2px; --input-padding = height / 3`, derived: true, formula: 'line-height = input height − 0.125rem; padding-inline = input height / 3', file: I }))
}

// colours
const CF = 'esm/core/MantineProvider/default-colors.mjs'
const colors = lit(decls(parseJs(p.read(CF))).get('DEFAULT_COLORS'))
const ramp = (n) => ({ name: n, steps: colors[n].map((v, k) => tok(`${n}-${k}`, v, { file: CF })) })
const RF = 'esm/core/MantineProvider/MantineCssVariables/default-css-variables-resolver.mjs'
const rt = p.read(RF)
const schemeVars = (from, to, mode) => [...rt.slice(rt.indexOf(from), to ? rt.indexOf(to) : undefined).matchAll(/"(--mantine-color-(?:text|body|error|placeholder|anchor|default|default-hover|default-color|default-border|dimmed|disabled|disabled-color|disabled-border))": ([^,\n]+)/g)].map((m) => tok(m[1], m[2].replace(/^"|"$/g, ''), { mode, file: RF }))
const gl = p.read('styles/global.css')
const allCss = p.read('styles.css')
const zAll = [...new Map([...allCss.matchAll(/(--mantine-z-index-[a-z]+): *(\d+)/g)].map((m) => [m[1], Number(m[2])]))]

const i18n = scanI18n([{ p, only: /^esm\/core\/MantineProvider\// }, { p, only: /^esm\/core\/DirectionProvider\// }, { p, only: /^styles\/[A-Za-z]+\.css$/ }])
i18n.findings = [
  'The default theme has no direction, language or script field: one Latin system font stack for text and headings, five body line heights (1.4–1.65) and Latin heading line heights.',
  `Direction: a DirectionProvider sets dir on <html>, and component CSS carries explicit [dir="rtl"] overrides (${i18n.patterns.find((x) => x.id === 'dir-selector').hits} matching lines in styles/*.css) alongside logical properties (${i18n.patterns.find((x) => x.id === 'logical-properties').hits} lines).`,
  'Density: Button has a parallel compact-xs…compact-xl size family (md 42px → compact-md 30px, same font size); inputs have no compact family. A global --mantine-scale multiplier scales every rem value.',
  'Button label line-height is 1 and input line-height equals input height − 2px, so vertical room for Arabic marks depends only on control height, not on a text line-height token.',
]

writeRef({
  id: 'mantine',
  script: 'mantine.mjs',
  system: { name: 'Mantine', package: '@mantine/core', version: p.version, license: p.license, url: 'https://mantine.dev' },
  pkgs: [p],
  scales: {
    controls: {
      densityModes: [
        { id: 'default', name: 'size xs…xl', mechanism: 'size-prop', description: 'Default component size is sm (36px).', file: B },
        { id: 'compact', name: 'size compact-xs…compact-xl (Button only)', mechanism: 'size-prop', description: 'Shorter and narrower buttons with the font size of the matching regular size.', file: B },
      ],
      sizes,
      touchTarget: [],
    },
    spacing: { steps: scale(theme.spacing, 'spacing') },
    radius: { steps: scale(theme.radius, 'radius'), note: `defaultRadius: ${theme.defaultRadius}` },
    focusRing: { steps: [tok('outline width', /outline: (\d+px) solid var\(--mantine-primary-color-filled\)/.exec(gl)[1], { px: px(/outline: (\d+px) solid/.exec(gl)[1]), file: 'styles/global.css' }), tok('outline-offset', /outline-offset: ([^;]+);/.exec(gl)[1], { px: cv(/outline-offset: ([^;]+);/.exec(gl)[1]), file: 'styles/global.css' })], note: `theme.focusRing: ${theme.focusRing} (auto = :focus-visible)` },
    typography: {
      rootFontSizePx: 16,
      fontStacks: [tok('fontFamily', theme.fontFamily, { file: TF }), tok('fontFamilyMonospace', theme.fontFamilyMonospace, { file: TF }), tok('headings.fontFamily', theme.headings.fontFamily, { file: TF })],
      steps: [
        ...Object.keys(theme.fontSizes).map((k) => ({ name: `text ${k}`, fontSize: `${fs[k] / 16}rem`, fontSizePx: fs[k], lineHeight: lhBody[k], lineHeightRatio: lhBody[k], lineHeightPx: round(fs[k] * lhBody[k], 2), file: TF })),
        ...Object.entries(theme.headings.sizes).map(([k, v]) => ({ name: k, fontSize: `${remv(v.fontSize) / 16}rem`, fontSizePx: remv(v.fontSize), lineHeight: Number(v.lineHeight), lineHeightRatio: Number(v.lineHeight), lineHeightPx: round(remv(v.fontSize) * Number(v.lineHeight), 2), fontWeight: Number(theme.headings.fontWeight), file: TF })),
      ],
      fontWeights: Object.entries(theme.fontWeights).map(([k, v]) => tok(k, Number(v), { file: TF })),
    },
    breakpoints: { steps: Object.entries(theme.breakpoints).map(([k, v]) => tok(k, v, { px: parseFloat(v) * 16, file: TF, note: 'em' })) },
    zIndex: { steps: zAll.map(([k, v]) => tok(k, v, { file: 'styles.css' })) },
    elevation: { steps: Object.entries(theme.shadows).map(([k, v]) => tok(`shadows.${k}`, shadowText(v), { file: TF })) },
    color: {
      structure: {
        ramps: Object.keys(colors).map((n) => ({ name: n, steps: colors[n].length })),
        semanticRoles: [...new Set([...rt.matchAll(/"(--mantine-color-[a-z-]+)"/g)].map((m) => m[1]))],
        modes: ['light', 'dark'],
        note: `10-shade ramps (0–9). primaryColor: ${theme.primaryColor}; primaryShade: ${theme.primaryShade.light} in light, ${theme.primaryShade.dark} in dark. Each ramp yields filled / light / outline variants through CSS variables; the "dark" ramp is the dark-scheme neutral.`,
      },
      algorithm: { name: 'variantColorResolver + generateColors (optional)', inputs: ['theme.colors[name] (10 shades)', 'primaryShade', 'variant (filled, light, outline, subtle, …)', 'autoContrast / luminanceThreshold'], outputs: ['background, hover, color, border per variant'], description: 'Shades are static arrays; variants pick shades by index (filled = primaryShade, hover = the next darker shade) or mix with transparency. No ramp is generated unless the app calls a generator.', files: ['esm/core/MantineProvider/color-functions/default-variant-colors-resolver/default-variant-colors-resolver.mjs'] },
      neutral: [ramp('gray'), ramp('dark'), { name: 'scheme variables', mode: 'light', steps: schemeVars('light: {', 'dark: {', 'light') }, { name: 'scheme variables', mode: 'dark', steps: schemeVars('dark: {', null, 'dark') }],
      primary: [ramp(theme.primaryColor)],
    },
    i18n,
    extra: { scale: theme.scale, inputPaddingY: Object.fromEntries(['xs', 'sm', 'md', 'lg', 'xl'].map((s) => [s, cv(i[`input-padding-y-${s}`])])) },
  },
  gaps: ['No motion duration/easing tokens and no border-width scale.', 'No container tokens in the theme (Container sizes are component variables).', 'No touch-target token or touch mode; compact sizes exist for Button only.'],
})
