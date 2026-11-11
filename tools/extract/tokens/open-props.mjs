#!/usr/bin/env node
// Open Props: every custom property in open-props.min.css; breakpoints from src/props.media.css (@custom-media).
//   node tools/extract/tokens/open-props.mjs <scratch-dir>
import { scratch, pkg, cssRules, tok, tokPx, tokMs, px, scanI18n, writeRef } from './lib.mjs'

const p = pkg(scratch(), 'open-props')
const F = 'open-props.min.css'
const v = {}
const darkOnly = {}
for (const r of cssRules(p.read(F))) for (const [k, val] of r.decls) if (k.startsWith('--')) (r.at.some((a) => a.includes('dark')) ? darkOnly : v)[k.slice(2)] ??= val
const by = (re) => Object.keys(v).filter((k) => re.test(k))
const fix = (s) => s.replace(/(^|[\s(,-])\.(\d)/g, '$10.$2')
const resolve = (s) => {
  const m = /^var\(--([\w-]+)\)$/.exec(s)
  return m && v[m[1]] ? v[m[1]] : s
}
const P = (k) => tokPx(k, fix(v[k]), { px: px(fix(resolve(v[k]))), file: F })
const M = 'src/props.media.css'
const bp = [...p.read(M).matchAll(/@custom-media --(\w+)-n-above\s*\(width >= (\d+px)\)/g)].map((m) => tokPx(m[1], m[2], { file: M }))
const rampNames = [...new Set(by(/^[a-z]+-\d+$/).filter((k) => /^#|^rgb|^hsl|^oklch/.test(v[k])).map((k) => k.replace(/-\d+$/, '')))]
const ramp = (n) => ({ name: n, steps: by(new RegExp(`^${n}-\\d+$`)).sort((a, b) => Number(a.split('-').pop()) - Number(b.split('-').pop())).map((k) => tok(k, v[k], { file: F })) })
const D = 'durations.min.css'
const dur = Object.fromEntries(cssRules(p.read(D)).flatMap((r) => r.decls).filter(([k]) => /^--duration-/.test(k)))
const B = 'buttons.min.css'
const btn = cssRules(p.read(B)).find((r) => r.decls.some(([k]) => k === 'padding-block'))

const i18n = scanI18n([{ p, only: /^src\/.*\.css$/ }, { p, only: /^src\/extra\// }])
i18n.findings = [
  'No property for direction, language or script. Font stacks are Latin system/classic stacks; line heights are seven unitless ratios (0.95–2) and letter-spacing props are Latin tracking.',
  `Sizes are offered three ways — rem (--size-N), px (--size-px-N) and relative ch/em (--size-relative-N, --size-content-N, --size-header-N) — but nothing is bound to a control: the optional button stylesheet sizes itself from the font (padding-block ${btn?.decls.find(([k]) => k === 'padding-block')?.[1]}, padding-inline ${btn?.decls.find(([k]) => k === 'padding-inline')?.[1]}), with no height.`,
  'Pointer type is exposed as custom media (--touch, --stylus, --pointer, --mouse) in props.media.css, the only touch-related affordance; no minimum target size.',
  `The normalize/button extras use logical properties (${i18n.patterns.find((x) => x.id === 'logical-properties').hits} matching lines in src/).`,
]

writeRef({
  id: 'open-props',
  script: 'open-props.mjs',
  system: { name: 'Open Props', package: 'open-props', version: p.version, license: p.license, url: 'https://open-props.style' },
  pkgs: [p],
  scales: {
    controls: { densityModes: [], sizes: [], touchTarget: [], note: 'No control heights: buttons.min.css pads by font-relative units and sets no height.' },
    spacing: { steps: [...by(/^size-(000|00|\d+)$/), ...by(/^size-px-/), ...by(/^size-fluid-/), ...by(/^size-relative-/)].map(P) },
    radius: { steps: by(/^radius-(\d+|round)$/).map(P) },
    borderWidth: { steps: by(/^border-size-\d+$/).map(P) },
    typography: {
      rootFontSizePx: 16,
      fontStacks: by(/^font-(?!weight|size|lineheight|letterspacing)/).map((k) => tok(k, v[k], { file: F })),
      fontSizes: [...by(/^font-size-\d+$/), ...by(/^font-size-fluid-/)].map(P),
      lineHeights: by(/^font-lineheight-/).map((k) => tok(k, Number(fix(v[k])), { ratio: Number(fix(v[k])), file: F })),
      fontWeights: by(/^font-weight-\d$/).map((k) => tok(k, Number(v[k]), { file: F })),
      letterSpacings: by(/^font-letterspacing-/).map((k) => tok(k, fix(v[k]), { file: F })),
      note: 'Font sizes and line heights are independent scales; no size/line-height pairs.',
    },
    breakpoints: { steps: bp, note: 'lower bound of the "-n-above" custom media (width >= N).' },
    containers: { steps: [...by(/^size-content-/), ...by(/^size-header-/), ...by(/^size-(xxs|xs|sm|md|lg|xl|xxl)$/)].map(P) },
    zIndex: { steps: by(/^layer-/).map((k) => tok(k, /^\d+$/.test(v[k]) ? Number(v[k]) : v[k], { file: F })) },
    elevation: { steps: [...by(/^shadow-\d$/), ...by(/^inner-shadow-\d$/)].map((k) => tok(k, v[k], { file: F })) },
    motion: {
      durations: Object.entries(dur).filter(([, x]) => /^\d+ms$/.test(x)).map(([k, x]) => tokMs(k.slice(2), x, { file: D })),
      easings: by(/^ease-(in-|out-|in-out-|elastic-|squish-|spring-|bounce-)?\d$|^ease-(in|out|in-out)-\d$/).map((k) => tok(k, v[k], { file: F })),
    },
    color: {
      structure: { ramps: rampNames.map((n) => ({ name: n, steps: ramp(n).steps.length })), semanticRoles: by(/^(text|surface|link|brand|scrollthumb)-?\w*$/).filter((k) => !/^\w+-\d+$/.test(k)), modes: ['light', 'dark (normalize.css switches surface/text props)'], note: 'Open Color style ramps (0–12). Semantic props (--text-1, --surface-1…) exist only in the optional normalize stylesheet. No primary: --brand / --link default to indigo.' },
      neutral: [ramp('gray'), ramp('stone')].filter((r) => r.steps.length),
      primary: [ramp('indigo')].filter((r) => r.steps.length),
    },
    i18n,
  },
  gaps: ['No control heights, density modes, focus-ring tokens or semantic colour roles in the core props.', 'No touch-target size.'],
})
