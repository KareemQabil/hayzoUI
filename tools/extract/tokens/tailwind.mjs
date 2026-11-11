#!/usr/bin/env node
// Tailwind CSS v4 default theme: every value is read from tailwindcss/theme.css (@theme default block).
//   node tools/extract/tokens/tailwind.mjs <scratch-dir>
import { scratch, pkg, cssVars, tok, tokPx, tokMs, px, round, scanI18n, writeRef } from './lib.mjs'

const p = pkg(scratch(), 'tailwindcss')
const F = 'theme.css'
const vars = cssVars(p.read(F))
const by = (prefix) => vars.filter((v) => v.name.startsWith(prefix) && !v.name.includes('--'))
const get = (n) => vars.find((v) => v.name === n)?.value

const spacingBase = get('spacing')
const text = by('text-').filter((v) => !v.name.startsWith('text-shadow'))
const calc = (s) => {
  const m = /^calc\(([\d.]+) \/ ([\d.]+)\)$/.exec(s)
  return m ? round(m[1] / m[2]) : Number(s)
}
const ramps = {}
for (const v of by('color-')) {
  const m = /^color-([a-z]+)-(\d+)$/.exec(v.name)
  if (m) (ramps[m[1]] ??= []).push(tok(m[2], v.value, { file: F }))
}
const i18n = scanI18n([{ p, only: /^(theme|preflight|utilities|index)\.css$/ }, { p, only: /^dist\// }])
i18n.findings = [
  'theme.css holds no direction, language or script variable; the only font stacks are sans, serif and mono.',
  'Direction support lives in the compiler (dist/): logical utilities (ms-*, me-*, ps-*, pe-*, start-*, end-*) and rtl:/ltr: variants; there is no Arabic-specific token.',
  'Line height is bound to each font size (--text-*--line-height) and cannot vary per language without overriding the theme.',
]

writeRef({
  id: 'tailwind',
  script: 'tailwind.mjs',
  system: { name: 'Tailwind CSS', package: 'tailwindcss', version: p.version, license: p.license, url: 'https://tailwindcss.com' },
  pkgs: [p],
  scales: {
    spacing: {
      steps: [
        tokPx('--spacing', spacingBase, { file: F, note: 'single multiplier: every spacing utility n resolves to calc(var(--spacing) * n)' }),
        ...[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16].map((n) => tok(String(n), `calc(var(--spacing) * ${n})`, { px: round(px(spacingBase) * n), derived: true, formula: `--spacing × ${n}` })),
      ],
      note: 'v4 has no enumerated spacing scale; the listed multiples are the ones the v3 scale named, computed from --spacing for comparison.',
    },
    radius: { steps: by('radius-').map((v) => tokPx(v.name, v.value, { file: F })) },
    typography: {
      rootFontSizePx: 16,
      fontStacks: by('font-').filter((v) => !v.name.startsWith('font-weight')).map((v) => tok(v.name, v.value, { file: F })),
      steps: text.map((v) => {
        const lh = calc(get(`${v.name}--line-height`))
        return { name: v.name, fontSize: v.value, fontSizePx: px(v.value), lineHeight: get(`${v.name}--line-height`), lineHeightRatio: lh, lineHeightPx: round(lh * px(v.value), 2), file: F }
      }),
      fontWeights: by('font-weight-').map((v) => tok(v.name, Number(v.value), { file: F })),
      lineHeights: by('leading-').map((v) => tok(v.name, Number(v.value), { ratio: Number(v.value), file: F })),
      letterSpacings: by('tracking-').map((v) => tok(v.name, v.value, { file: F })),
    },
    breakpoints: { steps: by('breakpoint-').map((v) => tokPx(v.name, v.value, { file: F })) },
    containers: { steps: by('container-').map((v) => tokPx(v.name, v.value, { file: F })) },
    elevation: { steps: by('shadow-').map((v) => tok(v.name, v.value, { file: F })) },
    motion: {
      durations: [tokMs('default-transition-duration', get('default-transition-duration'), { file: F })],
      easings: [...by('ease-'), { name: 'default-transition-timing-function', value: get('default-transition-timing-function') }].map((v) => tok(v.name, v.value, { file: F })),
    },
    color: {
      structure: {
        ramps: Object.entries(ramps).map(([name, s]) => ({ name, steps: s.length, stepNames: s.map((x) => x.name) })),
        semanticRoles: [],
        modes: ['single palette; dark mode is a variant (dark:) applied by the author'],
        note: 'Values are OKLCH. No semantic roles and no primary: the author picks a ramp.',
      },
      neutral: ['neutral', 'gray', 'slate', 'zinc', 'stone'].map((n) => ({ name: n, steps: ramps[n] })),
    },
    i18n,
  },
  gaps: [
    'No control heights, paddings or density modes: Tailwind is a utility framework without components.',
    'No border-width, focus-ring or z-index theme variables in theme.css (utilities take bare numbers).',
    'No primary ramp or semantic colour roles.',
  ],
})
