#!/usr/bin/env node
// GitHub Primer primitives: dist/css/**.css (base + functional tokens, light and dark themes) and the base colour
// ramps in src/tokens/base/color/**.json5 (parsed as an object literal, not evaluated).
//   node tools/extract/tokens/primer.mjs <scratch-dir>
import { scratch, pkg, cssRules, jsConst, tok, tokPx, tokMs, px, round, clean, scanI18n, writeRef } from './lib.mjs'

const p = pkg(scratch(), '@primer/primitives')
const C = 'dist/css/'
const all = {}
const load = (f, cond) => {
  const out = []
  for (const r of cssRules(p.read(`${C}${f}`))) {
    if (cond ? !r.at.some((a) => a.includes(cond)) : r.at.length) continue
    for (const [k, v] of r.decls) if (k.startsWith('--')) out.push({ name: k.slice(2), value: v, file: `${C}${f}` })
  }
  for (const v of out) if (!cond) all[v.name] = v.value
  return out
}
const baseSize = load('base/size/size.css')
const baseType = load('base/typography/typography.css')
const baseMotion = load('base/motion/motion.css')
const baseZ = load('base/size/z-index.css')
const size = load('functional/size/size.css')
const border = load('functional/size/border.css')
const radius = load('functional/size/radius.css')
const bp = load('functional/size/breakpoints.css')
const z = load('functional/size/z-index.css')
const space = load('functional/spacing/space.css')
const typo = load('functional/typography/typography.css')
const motion = load('functional/motion/motion.css')
const coarse = load('functional/size/size-coarse.css', 'pointer: coarse')
const fine = load('functional/size/size-fine.css', 'pointer: fine')
const resolve = (v) => {
  let n = 0
  while (/^var\(--([\w-]+)\)$/.test(v) && n++ < 8) v = all[/^var\(--([\w-]+)\)$/.exec(v)[1]] ?? v
  return v
}
const T = (v, extra = {}) => tokPx(v.name, v.value, { px: px(resolve(v.value)), alias: /^var\(--([\w-]+)\)$/.exec(v.value)?.[1], file: v.file, ...extra })
const g = (n) => resolve(all[n] ?? '')

// controls
const bodyMedium = px(g('text-body-size-medium'))
const sizes = []
const densities = ['condensed', 'normal', 'spacious']
for (const s of ['xsmall', 'small', 'medium', 'large', 'xlarge']) {
  const h = px(g(`control-${s}-size`))
  const pb = px(g(`control-${s}-paddingBlock`))
  for (const d of densities)
    sizes.push(clean({ component: 'control', size: s, mode: d, heightPx: h, paddingBlockPx: pb, paddingInlinePx: px(g(`control-${s}-paddingInline-${d}`)), gapPx: px(g(`control-${s}-gap`)), fontSizePx: bodyMedium, lineHeightPx: h - 2 * pb, lineHeightRatio: round((h - 2 * pb) / bodyMedium), radiusPx: px(g('borderRadius-default')), heightSource: `--control-${s}-size`, file: `${C}functional/size/size.css`, note: 'line box = size − 2 × paddingBlock (derived); font size is text.body.size.medium, described upstream as the default UI font — the primitives do not bind a font size to a control size' }))
}

// typography
const names = [...new Set(typo.map((v) => /^text-(\w+)-size(?:-(\w+))?$/.exec(v.name)).filter(Boolean).map((m) => [m[1], m[2]].filter(Boolean).join('-')))]
const steps = names.map((n) => {
  const [role, variant] = n.split('-')
  const k = (prop) => (variant ? all[`text-${role}-${prop}-${variant}`] ?? all[`text-${role}-${prop}`] : all[`text-${role}-${prop}`])
  const fs = resolve(k('size') ?? '')
  const lh = Number(resolve(k('lineHeight') ?? ''))
  return clean({ name: `text-${n}`, fontSize: fs, fontSizePx: px(fs), lineHeight: lh || undefined, lineHeightRatio: lh || undefined, lineHeightPx: lh && px(fs) ? round(lh * px(fs), 2) : undefined, fontWeight: Number(resolve(k('weight') ?? '')) || undefined, file: `${C}functional/typography/typography.css` })
})

// colours
const light = cssRules(p.read(`${C}functional/themes/light.css`)).flatMap((r) => r.decls).filter(([k]) => k.startsWith('--'))
const dark = cssRules(p.read(`${C}functional/themes/dark.css`)).flatMap((r) => r.decls).filter(([k]) => k.startsWith('--'))
const uniq = (list) => [...new Map(list).entries()]
const pick = (list, re, file, mode) => uniq(list).filter(([k]) => re.test(k)).map(([k, v]) => tok(k.slice(2), v, { mode, file }))
const neutralRe = /^--(bgColor-(default|muted|inset|emphasis|disabled|inverse)|fgColor-(default|muted|disabled|onEmphasis)|borderColor-(default|muted|emphasis|disabled)|control-bgColor-rest|control-borderColor-rest)$/
const accentRe = /^--(bgColor-accent-(emphasis|muted)|fgColor-(accent|link)|borderColor-accent-(emphasis|muted)|focus-outlineColor|button-primary-bgColor-(rest|hover|active)|bgColor-success-emphasis)$/
const j5 = (f) => jsConst(`const x = ${p.read(f)}`, 'x')
const baseLight = j5('src/tokens/base/color/light/light.json5').base.color
const baseDark = j5('src/tokens/base/color/dark/dark.json5').base.color
const val = (o) => (typeof o.$value === 'string' ? o.$value : o.$value?.hex ?? JSON.stringify(o.$value))
const rampOf = (base, name, mode, file) => ({ name, mode, steps: Object.entries(base[name]).filter(([, v]) => v && v.$value !== undefined).map(([k, v]) => tok(`${name}-${k}`, val(v), { mode, file })) })
const rampNames = Object.keys(baseLight).filter((k) => baseLight[k] && typeof baseLight[k] === 'object' && !('$value' in baseLight[k]))
const roles = [...new Set(uniq(light).map(([k]) => k.slice(2)).filter((k) => /^(bgColor|fgColor|borderColor|shadow|focus)-/.test(k)))]

const i18n = scanI18n([{ p, only: /^dist\/css\// }, { p, only: /^src\/tokens\// }, { p, only: /^(DESIGN_TOKENS_GUIDE|DESIGN_TOKENS_SPEC|README)\.md$/ }])
i18n.findings = [
  'No token for direction, language or script. Font stacks are Latin (Mona Sans VF, system fonts, Noto Sans) and line heights are five unitless ratios (tight 1.25 … loose 1.75) unrelated to script.',
  'Density is tokenised as a spacing variant, not as height: every control size has paddingInline condensed / normal / spacious and stacks have gap condensed / normal / spacious; control heights do not change with density.',
  `Touch is tokenised through the pointer media query: --control-minTarget-auto is ${coarse.find((v) => v.name === 'control-minTarget-auto')?.value} under (pointer: coarse) and ${fine.find((v) => v.name === 'control-minTarget-auto')?.value} under (pointer: fine), and stack gaps grow on coarse pointers. This is the only system in the set that publishes a touch-target minimum as a token.`,
  'Focus ring is tokenised (width 2px, offset −2px, inset).',
]

writeRef({
  id: 'primer',
  script: 'primer.mjs',
  system: { name: 'GitHub Primer primitives', package: '@primer/primitives', version: p.version, license: p.license, url: 'https://primer.style' },
  pkgs: [p],
  scales: {
    controls: {
      densityModes: densities.map((d) => ({ id: d, name: d, mechanism: 'spacing-variant', description: 'Changes control paddingInline and stack gaps only; height is set by the size (xsmall…xlarge).', file: `${C}functional/size/size.css` })),
      sizes,
      touchTarget: [...size.filter((v) => /minTarget/.test(v.name)), ...coarse.filter((v) => /minTarget/.test(v.name)).map((v) => ({ ...v, name: `${v.name} @media (pointer: coarse)` })), ...fine.filter((v) => /minTarget/.test(v.name)).map((v) => ({ ...v, name: `${v.name} @media (pointer: fine)` }))].map((v) => T(v)),
    },
    spacing: { steps: [...baseSize.filter((v) => !v.name.includes('negative')).map((v) => T(v)).sort((a, b) => a.px - b.px), ...space.map((v) => T(v)), ...size.filter((v) => /^(stack|controlStack|overlay-padding)/.test(v.name)).map((v) => T(v))] },
    radius: { steps: radius.map((v) => T(v)) },
    borderWidth: { steps: border.filter((v) => v.name.startsWith('borderWidth')).map((v) => T(v)) },
    focusRing: { steps: border.filter((v) => v.name.startsWith('focus-')).map((v) => T(v)) },
    typography: {
      rootFontSizePx: 16,
      fontStacks: typo.filter((v) => v.name.startsWith('fontStack')).map((v) => tok(v.name, v.value, { file: v.file })),
      steps,
      fontSizes: baseType.filter((v) => v.name.includes('-size-')).map((v) => T(v)).sort((a, b) => a.px - b.px),
      lineHeights: baseType.filter((v) => v.name.includes('lineHeight')).map((v) => tok(v.name, Number(v.value), { ratio: Number(v.value), file: v.file })),
      fontWeights: baseType.filter((v) => v.name.includes('weight')).map((v) => tok(v.name, Number(v.value), { file: v.file })),
    },
    breakpoints: { steps: bp.map((v) => T(v)).sort((a, b) => a.px - b.px) },
    zIndex: { steps: [...z, ...baseZ].map((v) => tok(v.name, Number(v.value), { file: v.file })) },
    elevation: { steps: pick(light, /^--shadow-/, `${C}functional/themes/light.css`, 'light') },
    motion: {
      durations: [...baseMotion.filter((v) => v.name.includes('duration')).map((v) => tokMs(v.name, v.value, { file: v.file })).sort((a, b) => a.ms - b.ms), ...motion.filter((v) => /^motion-duration/.test(v.name)).map((v) => tokMs(v.name, v.value, { ms: parseFloat(resolve(v.value)), alias: /--([\w-]+)/.exec(v.value)?.[1], file: v.file }))],
      easings: [...baseMotion.filter((v) => v.name.includes('easing')).map((v) => tok(v.name, v.value, { file: v.file })), ...motion.filter((v) => /^motion-easing/.test(v.name)).map((v) => tok(v.name, resolve(v.value), { alias: /--([\w-]+)/.exec(v.value)?.[1], file: v.file }))],
    },
    color: {
      structure: {
        ramps: rampNames.map((n) => ({ name: n, steps: rampOf(baseLight, n).steps.length, stepNames: rampOf(baseLight, n).steps.map((s) => s.name.split('-').pop()) })),
        semanticRoles: roles,
        modes: p.ls(`${C}functional/themes`).map((f) => f.replace('.css', '')),
        note: 'Base ramps (neutral 0–13, hue ramps 0–9) feed functional roles named <property>-<role>-<emphasis> (bgColor-accent-emphasis, fgColor-muted, borderColor-default). 14 themes including colour-blind and high-contrast variants.',
      },
      neutral: [rampOf(baseLight, 'neutral', 'light', 'src/tokens/base/color/light/light.json5'), rampOf(baseDark, 'neutral', 'dark', 'src/tokens/base/color/dark/dark.json5'), { name: 'neutral roles', mode: 'light', steps: pick(light, neutralRe, `${C}functional/themes/light.css`, 'light') }, { name: 'neutral roles', mode: 'dark', steps: pick(dark, neutralRe, `${C}functional/themes/dark.css`, 'dark') }],
      primary: [rampOf(baseLight, 'blue', 'light', 'src/tokens/base/color/light/light.json5'), rampOf(baseDark, 'blue', 'dark', 'src/tokens/base/color/dark/dark.json5'), { name: 'accent roles', mode: 'light', steps: pick(light, accentRe, `${C}functional/themes/light.css`, 'light') }, { name: 'accent roles', mode: 'dark', steps: pick(dark, accentRe, `${C}functional/themes/dark.css`, 'dark') }],
      note: 'The accent is blue; the primary button is green (button-primary-bgColor-rest aliases bgColor-success-emphasis).',
    },
    i18n,
  },
  gaps: ['No container-width tokens (overlay widths only).', 'Primitives do not bind a font size or line height to a control size; the control line box here is derived.', 'Letter-spacing is not tokenised.'],
})
