#!/usr/bin/env node
// Microsoft Fluent 2: @fluentui/tokens (global + alias tokens), control sizes from the raw style sources of
// @fluentui/react-input and @fluentui/react-button, and the per-language font map of @fluentui/theme (Fluent v8).
//   node tools/extract/tokens/fluent.mjs <scratch-dir>
import { scratch, pkg, jsConst, isExpr, assertSource, tok, tokPx, tokMs, px, round, clean, scanI18n, writeRef } from './lib.mjs'

const root = scratch()
const t = pkg(root, '@fluentui/tokens')
const th = pkg(root, '@fluentui/theme')
const inp = pkg(root, '@fluentui/react-input')
const btn = pkg(root, '@fluentui/react-button')
const G = 'lib/global/'
const obj = (file, name, env) => jsConst(t.read(file), name, env)
const fonts = t.read(`${G}fonts.js`)
const fontSizes = jsConst(fonts, 'fontSizes')
const lineHeights = jsConst(fonts, 'lineHeights')
const fontWeights = jsConst(fonts, 'fontWeights')
const fontFamilies = jsConst(fonts, 'fontFamilies')
const spacings = obj(`${G}spacings.js`, 'spacings')
const durations = obj(`${G}durations.js`, 'durations')
const curves = obj(`${G}curves.js`, 'curves')
const radius = obj(`${G}borderRadius.js`, 'borderRadius')
const stroke = obj(`${G}strokeWidths.js`, 'strokeWidths')
const horizontal = Object.fromEntries(Object.entries(obj(`${G}spacings.js`, 'horizontalSpacings')).map(([k, v]) => [k, spacings[v.$expr.replace('spacings.', '')]]))
const tokenVal = { ...fontSizes, ...lineHeights, ...fontWeights, ...fontFamilies, ...horizontal }
const ref = (v) => (isExpr(v) ? tokenVal[v.$expr.replace('tokens.', '')] : v)

// typography styles
const TS = `${G}typographyStyles.js`
const typo = jsConst(t.read(TS), 'typographyStyles')
const steps = Object.entries(typo).map(([name, s]) => {
  const fs = px(ref(s.fontSize))
  const lh = px(ref(s.lineHeight))
  return { name, fontSize: ref(s.fontSize), fontSizePx: fs, lineHeight: ref(s.lineHeight), lineHeightPx: lh, lineHeightRatio: round(lh / fs), fontWeight: ref(s.fontWeight), file: TS, note: `${s.fontSize.$expr.replace('tokens.', '')} / ${s.lineHeight.$expr.replace('tokens.', '')}` }
})

// controls
const IF = 'lib/components/Input/useInputStyles.styles.raw.js'
const it = inp.read(IF)
const fieldHeights = jsConst(it, 'fieldHeights')
const hp = jsConst(it, 'horizontalPadding')
assertSource(it, ['minHeight: fieldHeights.medium', '...typographyStyles.body1', '...typographyStyles.caption1', '...typographyStyles.body2'], IF)
const BF = 'lib/components/Button/useButtonStyles.styles.raw.js'
const bt = btn.read(BF)
const bs = Object.fromEntries([...bt.matchAll(/const (buttonSpacing\w+) = '(\d+)px'/g)].map((m) => [m[1], Number(m[2])]))
assertSource(bt, ['padding: `${buttonSpacingMedium} ${tokens.spacingHorizontalM}`', 'padding: `${buttonSpacingSmall} ${tokens.spacingHorizontalS}`', 'padding: `${buttonSpacingLarge} ${tokens.spacingHorizontalL}`', 'border: `${tokens.strokeWidthThin} solid', 'lineHeight: tokens.lineHeightBase300', 'lineHeight: tokens.lineHeightBase200', 'lineHeight: tokens.lineHeightBase400'], BF)
const border = px(stroke.strokeWidthThin)
const typeFor = { small: ['fontSizeBase200', 'lineHeightBase200', 'caption1'], medium: ['fontSizeBase300', 'lineHeightBase300', 'body1'], large: ['fontSizeBase400', 'lineHeightBase400', 'body2'] }
const sizes = []
for (const [size, pad, hs] of [['small', bs.buttonSpacingSmall, 'spacingHorizontalS'], ['medium', bs.buttonSpacingMedium, 'spacingHorizontalM'], ['large', bs.buttonSpacingLarge, 'spacingHorizontalL']]) {
  const fs = px(fontSizes[typeFor[size][0]])
  const lh = px(lineHeights[typeFor[size][1]])
  sizes.push({ component: 'button', size, mode: 'default', heightPx: pad * 2 + lh + border * 2, paddingBlockPx: pad, paddingInlinePx: px(horizontal[hs]), fontSizePx: fs, lineHeightPx: lh, lineHeightRatio: round(lh / fs), radiusPx: px(radius.borderRadiusMedium), derived: true, formula: `2 × ${pad}px padding + ${lh}px line + 2 × ${border}px border`, file: `@fluentui/react-button:${BF}` })
  sizes.push({ component: 'input', size, mode: 'default', minHeightPx: px(fieldHeights[size]), heightPx: px(fieldHeights[size]), paddingInlinePx: px(ref(hp.combined[size])), fontSizePx: fs, lineHeightPx: lh, lineHeightRatio: round(lh / fs), radiusPx: px(radius.borderRadiusMedium), heightSource: `fieldHeights.${size} (min-height); typographyStyles.${typeFor[size][2]}`, file: `@fluentui/react-input:${IF}` })
}

// colours
const colorsText = t.read(`${G}colors.js`)
const grey = jsConst(colorsText, 'grey')
const consts = { white: jsConst(colorsText, 'white'), black: jsConst(colorsText, 'black') }
const brand = jsConst(t.read(`${G}brandColors.js`), 'brandWeb')
const alias = (file, re) => {
  const text = t.read(file)
  return [...text.matchAll(/^\s+(color\w+): ([^,\n]+),?$/gm)].filter((m) => re.test(m[1])).map((m) => {
    const e = m[2].trim()
    const g = /^(grey|brand)\[(\d+)\]$/.exec(e)
    const value = g ? (g[1] === 'grey' ? grey : brand)[g[2]] : consts[e] ?? e
    return tok(m[1], value, { alias: e, file })
  })
}
const neutralRe = /^colorNeutral(Foreground[1-4]|ForegroundDisabled|Background[1-6]|Stroke[1-3]|StrokeAccessible|BackgroundDisabled)$/
const brandRe = /^color(BrandBackground|BrandBackgroundHover|BrandBackgroundPressed|BrandForeground1|BrandForeground2|BrandStroke1|CompoundBrandBackground|CompoundBrandStroke|NeutralForegroundOnBrand|StrokeFocus1|StrokeFocus2)$/
const tk = t.read('lib/tokens.js')
const zIndex = [...tk.matchAll(/(zIndex\w+): 'var\(--zIndex\w+, (\d+)\)'/g)].map((m) => tok(m[1], Number(m[2]), { file: 'lib/tokens.js' }))
const shadowsText = t.read('lib/utils/shadows.js')
const shadows = [...shadowsText.matchAll(/\[`(shadow\d+)\$\{tokenSuffix\}`\]: `([^`]+)`/g)].map((m) => tok(m[1], m[2], { file: 'lib/utils/shadows.js' }))

// per-language fonts (Fluent v8 theme)
const FF = 'lib/fonts/FluentFonts.js'
const ffText = th.read(FF)
const names = Object.fromEntries([...ffText.matchAll(/LocalizedFontNames\.(\w+) = '([^']+)'/g)].map((m) => [m[1], m[2]]))
const fams = Object.fromEntries([...ffText.matchAll(/LocalizedFontFamilies\.(\w+) = (?:"'"\.concat\(LocalizedFontNames\.(\w+), "'"\)|"([^"]+)")/g)].map((m) => [m[1], m[2] ? `'${names[m[2]]}'` : m[3]]))
const CF = 'lib/fonts/createFontStyles.js'
const cf = th.read(CF)
const langMap = [...cf.slice(cf.indexOf('var LanguageToFontMap'), cf.indexOf('function _fontFamilyWithFallbacks')).matchAll(/'?([a-z-]+)'?: LocalizedFontFamilies\.(\w+)/g)].map((m) => tok(`lang ${m[1]}`, fams[m[2]], { alias: `LocalizedFontFamilies.${m[2]}`, file: `@fluentui/theme:${CF}` }))
const fallbacks = /var FontFamilyFallbacks = "([^"]+)"/.exec(cf)[1]

const i18n = scanI18n([{ p: t, only: /^lib\/.*\.js$/ }, { p: th, only: /^lib\/.*\.js$/ }, { p: inp, only: /\.raw\.js$/ }, { p: btn, only: /\.raw\.js$/ }])
i18n.tokens = langMap
i18n.findings = [
  `@fluentui/tokens (Fluent 2 / v9) has three font stacks (base, monospace, numeric), all Latin Segoe UI; no token varies by language, script or direction, and line heights are fixed px pairs with the font sizes (14/20, 12/16, 16/22).`,
  `Per-language stacks exist only in the older @fluentui/theme (v8): LanguageToFontMap covers ${langMap.length} language prefixes; "ar" maps to ${fams.Arabic} followed by the fallbacks (${fallbacks}). It swaps the family only — sizes and line heights are unchanged.`,
  'RTL in v9 is done by the Griffel compiler, which emits a flipped rule for every physical declaration (the compiled styles contain both .f… {padding-left} and its right twin); raw sources are written with physical properties.',
  'No density token or mode: controls have size small/medium/large (24/32/40px).',
]

writeRef({
  id: 'fluent-2',
  script: 'fluent.mjs',
  system: { name: 'Microsoft Fluent 2 (Fluent UI React v9 tokens)', package: '@fluentui/tokens', version: t.version, license: t.license, url: 'https://fluent2.microsoft.design' },
  pkgs: [t, th, inp, btn],
  provenanceNotes: 'Button heights are derived from literal paddings, line-height tokens and the border width (formula recorded); input heights are the literal fieldHeights.',
  scales: {
    controls: { densityModes: [{ id: 'default', name: 'size prop', mechanism: 'size-prop', description: 'small / medium / large per component; no density mode.' }], sizes: sizes.map(clean), touchTarget: [] },
    spacing: { steps: Object.entries(spacings).map(([k, v]) => tokPx(k, v, { file: `${G}spacings.js`, note: 'exposed as spacingHorizontal* and spacingVertical*' })) },
    radius: { steps: Object.entries(radius).map(([k, v]) => tokPx(k, v, { file: `${G}borderRadius.js` })) },
    borderWidth: { steps: Object.entries(stroke).map(([k, v]) => tokPx(k, v, { file: `${G}strokeWidths.js` })) },
    focusRing: { steps: [tokPx('focus outline (strokeWidthThick)', stroke.strokeWidthThick, { file: `@fluentui/react-button:${BF}`, note: 'transparent 2px outline plus inset box-shadows in colorStrokeFocus1/2; indicator styles come from @fluentui/react-tabster' })] },
    typography: {
      rootFontSizePx: 16,
      fontStacks: [...Object.entries(fontFamilies).map(([k, v]) => tok(k, v, { file: `${G}fonts.js` })), tok('fontFamilyBase (Teams theme)', jsConst(t.read('lib/alias/teamsFontFamilies.js'), 'fontFamilies').fontFamilyBase, { file: 'lib/alias/teamsFontFamilies.js' })],
      steps,
      fontSizes: Object.entries(fontSizes).map(([k, v]) => tokPx(k, v, { file: `${G}fonts.js` })),
      lineHeights: Object.entries(lineHeights).map(([k, v]) => tokPx(k, v, { ratio: round(px(v) / px(fontSizes[k.replace('lineHeight', 'fontSize')])), file: `${G}fonts.js` })),
      fontWeights: Object.entries(fontWeights).map(([k, v]) => tok(k, v, { file: `${G}fonts.js` })),
    },
    zIndex: { steps: zIndex },
    elevation: { steps: shadows, note: 'ambientColor / keyColor are theme alphas; a "Brand" suffixed set also exists.' },
    motion: { durations: Object.entries(durations).map(([k, v]) => tokMs(k, v, { file: `${G}durations.js` })), easings: Object.entries(curves).map(([k, v]) => tok(k, v, { file: `${G}curves.js` })) },
    color: {
      structure: {
        ramps: [{ name: 'grey', steps: Object.keys(grey).length, stepNames: Object.keys(grey) }, { name: 'brand (brandWeb)', steps: Object.keys(brand).length, stepNames: Object.keys(brand) }],
        semanticRoles: [...t.read('lib/alias/lightColor.js').matchAll(/^\s+(color\w+):/gm)].map((m) => m[1]),
        modes: ['webLight', 'webDark', 'teamsLight', 'teamsDark', 'teamsHighContrast'],
        note: 'A 16-step brand ramp (10–160) is the only theme input; createLightTheme/createDarkTheme map it and the fixed grey ramp (lightness 2–98) onto alias colour tokens.',
      },
      algorithm: { name: 'createLightTheme(brand) / createDarkTheme(brand)', inputs: ['BrandVariants: 16 colours keyed 10…160'], outputs: ['alias colour tokens', 'shadow tokens'], description: 'No colour is computed: each alias token indexes the brand ramp or the grey ramp (e.g. colorBrandBackground = brand[80] in light, brand[70] in dark).', files: ['lib/utils/createLightTheme.js', 'lib/utils/createDarkTheme.js', 'lib/alias/lightColor.js', 'lib/alias/darkColor.js'] },
      neutral: [{ name: 'grey', steps: Object.entries(grey).map(([k, v]) => tok(`grey-${k}`, v, { file: `${G}colors.js` })) }, { name: 'neutral alias tokens', mode: 'light', steps: alias('lib/alias/lightColor.js', neutralRe) }, { name: 'neutral alias tokens', mode: 'dark', steps: alias('lib/alias/darkColor.js', neutralRe) }],
      primary: [{ name: 'brandWeb', steps: Object.entries(brand).map(([k, v]) => tok(`brand-${k}`, v, { file: `${G}brandColors.js` })) }, { name: 'brand alias tokens', mode: 'light', steps: alias('lib/alias/lightColor.js', brandRe) }, { name: 'brand alias tokens', mode: 'dark', steps: alias('lib/alias/darkColor.js', brandRe) }],
    },
    i18n,
    extra: { localizedFontFamilies: fams, fontFamilyFallbacks: fallbacks },
  },
  gaps: ['No breakpoint or container tokens.', 'No density mode and no touch-target token.', 'Letter-spacing is not tokenised.'],
})
