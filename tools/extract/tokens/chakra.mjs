#!/usr/bin/env node
// Chakra UI v3 default theme: dist/esm/theme/tokens/*.js, semantic-tokens/*.js, text-styles.js, breakpoints.js and
// the button/input recipes. Files are parsed as AST; the object passed to defineTokens.*() is read as a literal.
//   node tools/extract/tokens/chakra.mjs <scratch-dir>
import { scratch, pkg, ts, parseJs, decls, lit, tok, tokPx, tokMs, px, round, clean, scanI18n, writeRef } from './lib.mjs'

const p = pkg(scratch(), '@chakra-ui/react')
const T = 'dist/esm/theme/'
/** literal first argument of `const name = something(...)`, or the literal itself */
function arg(file, name, env) {
  const d = decls(parseJs(p.read(`${T}${file}`)))
  const init = d.get(name)
  if (!init) throw new Error(`${file}: ${name} not found`)
  return lit(ts.isCallExpression(init) ? init.arguments[0] : init, env)
}
const flat = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.value]))
const spacing = flat(arg('tokens/spacing.js', 'spacing'))
const largeSizes = flat(arg('tokens/sizes.js', 'largeSizes'))
const radii = flat(arg('tokens/radius.js', 'radii'))
const fontSizes = flat(arg('tokens/font-sizes.js', 'fontSizes'))
const lineHeights = flat(arg('tokens/line-heights.js', 'lineHeights'))
const letterSpacings = flat(arg('tokens/letter-spacing.js', 'letterSpacings'))
const fontWeights = flat(arg('tokens/font-weights.js', 'fontWeights'))
const durations = flat(arg('tokens/durations.js', 'durations'))
const easings = flat(arg('tokens/easings.js', 'easings'))
const zIndices = flat(arg('tokens/z-indices.js', 'zIndices'))
const breakpoints = arg('breakpoints.js', 'breakpoints')
const textStyles = flat(arg('text-styles.js', 'textStyles'))
const fontsText = p.read(`${T}tokens/fonts.js`)
const fallback = /const fallback = `([^`]+)`/.exec(fontsText)[1]
const fonts = [...fontsText.matchAll(/(\w+): \{\s*value: `([^`]+)`/g)].map((m) => tok(m[1], m[2].replace('${fallback}', fallback), { file: `${T}tokens/fonts.js` }))
const colors = arg('tokens/colors.js', 'colors')
const sem = arg('semantic-tokens/colors.js', 'semanticColors')
const shadows = arg('semantic-tokens/shadows.js', 'semanticShadows')

const steps = Object.entries(textStyles).filter(([, v]) => v.fontSize && fontSizes[v.fontSize]).map(([k, v]) => {
  const fs = px(fontSizes[v.fontSize])
  const lh = px(v.lineHeight) ?? (lineHeights[v.lineHeight] ? round(lineHeights[v.lineHeight] * fs, 2) : undefined)
  return clean({ name: `textStyle ${k}`, fontSize: fontSizes[v.fontSize], fontSizePx: fs, lineHeight: v.lineHeight, lineHeightPx: lh, lineHeightRatio: lh ? round(lh / fs) : undefined, letterSpacing: v.letterSpacing, fontWeight: v.fontWeight && fontWeights[v.fontWeight] ? Number(fontWeights[v.fontWeight]) : undefined, file: `${T}text-styles.js` })
})
const ts_ = (k) => steps.find((s) => s.name === `textStyle ${k}`)

// controls
const sizes = []
for (const [component, file, name] of [['button', 'recipes/button.js', 'buttonRecipe'], ['input', 'recipes/input.js', 'inputRecipe']]) {
  const r = arg(file, name)
  const def = r.defaultVariants?.size
  for (const [size, v] of Object.entries(r.variants.size)) {
    const hTok = v.h ?? /sizes\.([\d.]+)/.exec(v['--input-height'] ?? '')?.[1]
    const t = ts_(v.textStyle)
    sizes.push(clean({ component, size, mode: 'default', heightPx: px(spacing[hTok]), paddingInlinePx: px(spacing[v.px]), gapPx: px(spacing[v.gap]), fontSizePx: t?.fontSizePx, lineHeightPx: t?.lineHeightPx, lineHeightRatio: t?.lineHeightRatio, heightSource: `${v.h ? `h: ${v.h}` : v['--input-height']}; textStyle ${v.textStyle}`, file: `${T}${file}`, note: size === def ? 'default size' : undefined }))
  }
}

// colours
const hex = (ref) => {
  const m = /^\{colors\.(\w+)(?:\.(\d+))?\}$/.exec(ref)
  if (!m) return ref
  const c = m[2] ? colors[m[1]]?.[m[2]] : colors[m[1]]
  return c?.value ?? ref
}
const ramp = (n) => ({ name: n, steps: Object.entries(colors[n]).map(([k, v]) => tok(`${n}.${k}`, v.value, { file: `${T}tokens/colors.js` })) })
const role = (group, mode) => ({ name: `${group} semantic tokens`, mode, steps: Object.entries(sem[group]).filter(([, v]) => v.value?.[`_${mode}`]).map(([k, v]) => tok(`${group}.${k}`, hex(v.value[`_${mode}`]), { alias: v.value[`_${mode}`], mode, file: `${T}semantic-tokens/colors.js` })) })
const rampNames = Object.keys(colors).filter((k) => colors[k] && !('value' in colors[k]))
const palette = /colorPalette: "(\w+)"/.exec(p.read(`${T}global-css.js`))?.[1]
const pf = p.read('dist/esm/styled-system/preflight.js')

const i18n = scanI18n([{ p, only: /^dist\/esm\/theme\// }, { p, only: /^dist\/esm\/styled-system\// }, { p, only: /^dist\/esm\/components\/(locale|theme)\// }])
i18n.findings = [
  'No token for direction, language or script. Fonts are heading/body/mono with Inter first; letter-spacing tokens are Latin tracking values and textStyles 4xl and above apply −0.025em.',
  `Direction is handled by the style engine, not by tokens: recipes are written with logical style props (px, ms, me, insetStart) and _rtl/_ltr conditions (${i18n.patterns.find((x) => x.id === 'rtl').hits} lines mentioning rtl in the scanned theme and styled-system files).`,
  'Line heights for text styles are absolute rem values per size (sm 14px on 20px, md 16px on 24px, xs 12px on 16px) — the Tailwind pairs — with no language variation.',
  'Density: no mode. Buttons and inputs have seven sizes (2xs…2xl) from 24–28px to 64px; the default is md = 40px.',
]

writeRef({
  id: 'chakra-ui',
  script: 'chakra.mjs',
  system: { name: 'Chakra UI v3 default theme', package: '@chakra-ui/react', version: p.version, license: p.license, url: 'https://chakra-ui.com' },
  pkgs: [p],
  scales: {
    controls: { densityModes: [{ id: 'default', name: 'size 2xs…2xl', mechanism: 'size-prop', description: 'Recipe size variants; no density mode.' }], sizes, touchTarget: [] },
    spacing: { steps: Object.entries(spacing).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => tokPx(k, v, { file: `${T}tokens/spacing.js` })) },
    radius: { steps: Object.entries(radii).map(([k, v]) => tokPx(k, v, { file: `${T}tokens/radius.js` })) },
    focusRing: { steps: [...new Set([...pf.matchAll(/outlineOffset: "(-?\d+px)"/g)].map((m) => m[1]))].map((v) => tokPx('preflight outlineOffset', v, { file: 'dist/esm/styled-system/preflight.js' })), note: 'Focus ring is a style-engine utility (focusVisibleRing: outside|inside|mixed) rather than tokens; width and offset defaults live in the utility.' },
    typography: {
      rootFontSizePx: 16,
      fontStacks: fonts,
      steps,
      fontSizes: Object.entries(fontSizes).map(([k, v]) => tokPx(k, v, { file: `${T}tokens/font-sizes.js` })),
      lineHeights: Object.entries(lineHeights).map(([k, v]) => tok(k, v, { ratio: v, file: `${T}tokens/line-heights.js` })),
      fontWeights: Object.entries(fontWeights).map(([k, v]) => tok(k, Number(v), { file: `${T}tokens/font-weights.js` })),
      letterSpacings: Object.entries(letterSpacings).map(([k, v]) => tok(k, v, { file: `${T}tokens/letter-spacing.js` })),
    },
    breakpoints: { steps: Object.entries(breakpoints).map(([k, v]) => tokPx(k, v, { file: `${T}breakpoints.js` })) },
    containers: { steps: Object.entries(largeSizes).map(([k, v]) => tokPx(k, v, { file: `${T}tokens/sizes.js` })) },
    zIndex: { steps: Object.entries(zIndices).map(([k, v]) => tok(k, v, { file: `${T}tokens/z-indices.js` })) },
    elevation: { steps: Object.entries(shadows).filter(([, v]) => v.value?._light).map(([k, v]) => tok(k, v.value._light, { mode: 'light', file: `${T}semantic-tokens/shadows.js` })) },
    motion: { durations: Object.entries(durations).map(([k, v]) => tokMs(k, v, { file: `${T}tokens/durations.js` })), easings: Object.entries(easings).map(([k, v]) => tok(k, v, { file: `${T}tokens/easings.js` })) },
    color: {
      structure: {
        ramps: rampNames.map((n) => ({ name: n, steps: Object.keys(colors[n]).length, stepNames: Object.keys(colors[n]) })),
        semanticRoles: Object.entries(sem).flatMap(([g, o]) => Object.keys(o).map((k) => `${g}.${k}`)),
        modes: ['_light', '_dark'],
        note: `Tailwind-style ramps (50–950). Semantic groups bg, fg, border plus one group per hue with the same seven roles (contrast, fg, subtle, muted, emphasized, solid, focusRing); the virtual "colorPalette" (default: ${palette}) selects a hue per component.`,
      },
      neutral: [ramp('gray'), role('bg', 'light'), role('bg', 'dark'), role('fg', 'light'), role('fg', 'dark'), role('border', 'light'), role('border', 'dark')],
      primary: [ramp('blue'), role(palette, 'light'), role(palette, 'dark')],
      note: `The default colorPalette is ${palette}: an un-themed primary button is near-black in light mode. The blue ramp is recorded as the usual brand candidate.`,
    },
    i18n,
  },
  gaps: ['No border-width scale beyond literal 1px in recipes; focus-ring width is not a token.', 'No density mode, touch mode or touch-target token.'],
})
