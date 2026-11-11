#!/usr/bin/env node
// Shopify Polaris: @shopify/polaris-tokens dist/css/styles.css (token values) and @shopify/polaris build/esm/styles.css
// (control sizes). LICENSE NOTE: Polaris is under a custom licence (MIT text plus a field-of-use restriction to
// Shopify-integrated or visually distinct applications). This file therefore records measurements only — numeric
// scales and the STRUCTURE of the colour system — and no colour or shadow values.
//   node tools/extract/tokens/polaris.mjs <scratch-dir>
import { scratch, pkg, cssRules, tok, tokPx, tokMs, px, round, clean, scanI18n, writeRef } from './lib.mjs'

const root = scratch()
const t = pkg(root, '@shopify/polaris-tokens')
const c = pkg(root, '@shopify/polaris')
const LIC = 'LicenseRef-Polaris (MIT terms with a Shopify field-of-use restriction; see LICENSE.md)'
t.licenseOverride = LIC
c.licenseOverride = LIC
const F = 'dist/css/styles.css'
const rules = cssRules(t.read(F))
const themes = rules.map((r) => r.sel)
const base = {}
for (const r of rules.filter((r) => r.sel.includes(':root'))) for (const [k, v] of r.decls) base[k.slice(4)] = v
const resolve = (v) => {
  let n = 0
  while (/^var\(--p-([\w-]+)\)$/.test(v ?? '') && n++ < 8) v = base[/^var\(--p-([\w-]+)\)$/.exec(v)[1]]
  return v
}
const by = (re) => Object.keys(base).filter((k) => re.test(k))
const T = (k) => tokPx(k, base[k], { px: px(resolve(base[k])), alias: /^var\(--p-([\w-]+)\)$/.exec(base[k])?.[1], file: F })

// typography
const textNames = [...new Set(by(/^text-.*-font-size$/).map((k) => k.replace('-font-size', '')))]
const steps = textNames.map((n) => {
  const fs = px(resolve(base[`${n}-font-size`]))
  const lh = px(resolve(base[`${n}-font-line-height`]))
  return clean({ name: n, fontSize: resolve(base[`${n}-font-size`]), fontSizePx: fs, lineHeight: resolve(base[`${n}-font-line-height`]), lineHeightPx: lh, lineHeightRatio: round(lh / fs), fontWeight: Number(resolve(base[`${n}-font-weight`])), letterSpacing: resolve(base[`${n}-font-letter-spacing`]), file: F })
})
const step = (n) => steps.find((s) => s.name === n)

// controls from component CSS
const CF = 'build/esm/styles.css'
const crules = cssRules(c.read(CF))
const find = (sel, media) => crules.filter((r) => r.sel.split(',').map((s) => s.trim()).includes(sel) && (media ? r.at.some((a) => a.includes(media)) : !r.at.length)).flatMap((r) => r.decls)
const d = (decls, prop) => decls.filter(([k]) => k === prop).pop()?.[1]
const pv = (v) => px(resolve(v)) ?? px(v)
const btnJs = c.read('build/esm/components/Button/Button.js')
const bodyMdWhen = /let textVariant = '(\w+)';\s*if \(([^{]+)\) \{\s*textVariant = '(\w+)'/.exec(btnJs)
const sizes = []
for (const [size, cls, variant] of [['micro', 'Micro', 'bodySm'], ['slim', 'Slim', 'bodySm'], ['medium', 'Medium', 'bodySm'], ['large', 'Large', 'bodyMd']]) {
  const b = find(`.Polaris-Button--size${cls}`)
  const up = find(`.Polaris-Button--size${cls}`, 'min-width: 48em')
  const ty = step(`text-body-${variant === 'bodySm' ? 'sm' : 'md'}`)
  for (const [mode, h] of [['mobile', d(b, 'min-height')], ['desktop', d(up, 'min-height') ?? d(b, 'min-height')]])
    sizes.push(clean({ component: 'button', size, mode, minHeightPx: pv(h), heightPx: pv(h), paddingBlockPx: pv(d(b, '--pc-button-padding-block')), paddingInlinePx: pv(d(b, '--pc-button-padding-inline')), fontSizePx: ty.fontSizePx, lineHeightPx: ty.lineHeightPx, lineHeightRatio: ty.lineHeightRatio, radiusPx: pv(d(find('.Polaris-Button'), 'border-radius')), heightSource: `min-height ${h}; Text variant ${variant}`, file: `@shopify/polaris:${CF}, build/esm/components/Button/Button.js` }))
}
const controlHeight = d(find(':root'), '--pg-control-height')
for (const [component, sel] of [['input', '.Polaris-TextField__Input'], ['select', '.Polaris-Select__Content']]) {
  const b = find(sel)
  const up = find(sel, 'min-width: 48em')
  const pad = d(b, 'padding').split(' ')
  for (const [mode, decls] of [['mobile', b], ['desktop', [...b, ...up]]]) {
    const fs = pv(d(component === 'select' && mode === 'mobile' ? b : decls, 'font-size'))
    const lh = pv(d(decls, 'line-height'))
    sizes.push(clean({ component, size: 'medium', mode, minHeightPx: px(controlHeight), heightPx: Math.max(px(controlHeight), lh + 2 * pv(pad[0])), paddingBlockPx: pv(pad[0]), paddingInlinePx: pv(pad[pad.length - 1]), fontSizePx: fs, lineHeightPx: lh, lineHeightRatio: round(lh / fs), heightSource: `min-height var(--pg-control-height) = ${controlHeight}`, derived: true, formula: 'max(min-height, line-height + 2 × padding-block)', file: `@shopify/polaris:${CF}` }))
  }
}
{
  const slim = crules.find((r) => r.sel.startsWith('.Polaris-TextField--slim .Polaris-TextField__Input'))
  sizes.push({ component: 'input', size: 'slim', mode: 'desktop', minHeightPx: px(d(slim.decls, 'min-height')), heightPx: px(d(slim.decls, 'min-height')), paddingBlockPx: pv(d(slim.decls, 'padding-block')), file: `@shopify/polaris:${CF}` })
}

const MQ = 'dist/css/media-queries.css'
const mq = t.read(MQ)
const colorGroups = {}
for (const k of by(/^color-/)) {
  const g = k.split('-')[1]
  colorGroups[g] = (colorGroups[g] ?? 0) + 1
}
const i18n = scanI18n([{ p: t, only: /^dist\/(css|scss)\// }, { p: t, only: /^dist\/esm\// }, { p: c, only: /^build\/esm\/styles\.css$/ }, { p: c, only: /^locales\// }])
i18n.findings = [
  "No token for direction, language or script. One sans stack led by 'Inter'; three negative letter-spacing tokens (dense, denser, densest) used by headings, which must not apply to Arabic.",
  'Density is responsive, not a mode: controls are taller and input text larger below the md breakpoint (48em) — button medium 32px → 28px, input text 16px/24px → 13px/20px — i.e. "touch" is inferred from viewport width, not from pointer type. A p-theme-light-mobile theme changes shadows only.',
  'Default desktop UI text is 13px on a 20px line (ratio 1.54); button labels are 12px on 16px (1.33).',
  `Component CSS uses logical properties (${i18n.patterns.find((x) => x.id === 'logical-properties').hits} matching lines in the scanned files). Locale files with Arabic strings: ${c.ls('locales').filter((f) => /^(ar|he|fa|ur)\b/.test(f)).join(', ') || 'none'}.`,
]

writeRef({
  id: 'polaris',
  script: 'polaris.mjs',
  system: { name: 'Shopify Polaris', package: '@shopify/polaris-tokens', version: t.version, license: LIC, url: 'https://polaris.shopify.com' },
  pkgs: [t, c],
  provenanceNotes: 'Custom licence: only measurements (numeric scales, structure) are kept; colour and shadow values are deliberately not recorded.',
  scales: {
    controls: {
      densityModes: [
        { id: 'mobile', name: 'below md (48em)', mechanism: 'platform-scale', description: 'Base styles: larger min-heights and 16px input text.', file: `@shopify/polaris:${CF}` },
        { id: 'desktop', name: 'md and up (min-width: 48em)', mechanism: 'platform-scale', description: 'Compact desktop sizes.', file: `@shopify/polaris:${CF}` },
      ],
      sizes,
      touchTarget: [],
      note: bodyMdWhen ? `Button text variant is ${bodyMdWhen[1]} unless (${bodyMdWhen[2].trim()}), then ${bodyMdWhen[3]}.` : undefined,
    },
    spacing: { steps: by(/^space-/).map(T) },
    radius: { steps: by(/^border-radius-/).map(T) },
    borderWidth: { steps: by(/^border-width-/).map(T) },
    typography: {
      rootFontSizePx: 16,
      fontStacks: by(/^font-family-/).map((k) => tok(k, base[k], { file: F })),
      steps,
      fontSizes: by(/^font-size-/).map(T),
      lineHeights: by(/^font-line-height-/).map(T),
      fontWeights: by(/^font-weight-/).map((k) => tok(k, Number(base[k]), { file: F })),
      letterSpacings: by(/^font-letter-spacing-/).map(T),
    },
    breakpoints: { steps: by(/^breakpoints-/).map(T), note: `${[...mq.matchAll(/@custom-media/g)].length} custom media queries (-up, -down, -only per breakpoint) in ${MQ}.` },
    zIndex: { steps: by(/^z-index-/).map((k) => tok(k, /^\d+$/.test(base[k]) ? Number(base[k]) : base[k], { file: F })) },
    elevation: { steps: by(/^shadow-\d+$/).map((k) => tok(k, '(value not recorded — licence)', { file: F })), note: `${by(/^shadow-/).length} shadow tokens: numbered levels plus bevel, inset and button shadows.` },
    motion: { durations: by(/^motion-duration-/).map((k) => tokMs(k, base[k], { file: F })), easings: by(/^motion-ease/).map((k) => tok(k, base[k], { file: F })) },
    color: {
      structure: {
        ramps: [],
        semanticRoles: by(/^color-/),
        modes: [...new Set(themes.flatMap((s) => s.split(',').map((x) => x.trim())))].filter((s) => /^[.:]/.test(s)),
        note: `No public ramps: ${by(/^color-/).length} role tokens named color-<element>-<role>-<state> (per element: ${Object.entries(colorGroups).map(([k, v]) => `${k} ${v}`).join(', ')}). Values not recorded (licence).`,
      },
    },
    i18n,
    extra: { heightScale: by(/^height-/).map(T), widthScale: by(/^width-/).map(T) },
  },
  gaps: ['Colour and shadow values intentionally omitted (licence restricts use to Shopify-integrated or visually distinct applications).', 'No focus-ring or container tokens; no touch-target token.', 'No explicit density mode; responsive sizes only.'],
})
