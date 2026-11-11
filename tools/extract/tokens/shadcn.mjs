#!/usr/bin/env node
// shadcn/ui: default theme variables (apps/v4/registry/themes.ts, "neutral"), the classic component sources
// (apps/v4/registry/new-york-v4/ui/*.tsx) and the style presets (apps/v4/registry/styles/style-*.css) from a shallow
// clone of the repository. Sizes are Tailwind utility classes; they are converted with the --spacing and --text-*
// values read from the pinned tailwindcss theme.css (h-9 = 9 × 0.25rem).
//   node tools/extract/tokens/shadcn.mjs <scratch-dir>
import fs from 'node:fs'
import path from 'node:path'
import { scratch, pkg, parseJs, decls, lit, cssRules, cssVars, tok, tokPx, px, round, clean, scanI18n, writeRef, RETRIEVED_AT } from './lib.mjs'
import { REPOS } from './sources.mjs'

const root = scratch()
const repo = path.join(root, REPOS[0].dir)
const commit = fs.readFileSync(path.join(repo, '.git/HEAD'), 'utf8').trim().startsWith('ref:')
  ? fs.readFileSync(path.join(repo, '.git', fs.readFileSync(path.join(repo, '.git/HEAD'), 'utf8').trim().slice(5)), 'utf8').trim()
  : fs.readFileSync(path.join(repo, '.git/HEAD'), 'utf8').trim()
const used = new Set()
const R = 'apps/v4/registry/'
const read = (rel) => {
  used.add(rel)
  return fs.readFileSync(path.join(repo, rel), 'utf8')
}
const tw = pkg(root, 'tailwindcss')
const twVars = Object.fromEntries(cssVars(tw.read('theme.css')).map((v) => [v.name, v.value]))
const unit = px(twVars.spacing)
const calc = (s) => {
  const m = /^calc\(([\d.]+) \/ ([\d.]+)\)$/.exec(s ?? '')
  return m ? m[1] / m[2] : Number(s)
}
/** Tailwind classes → measurements */
function measure(classes) {
  const c = classes.split(/\s+/)
  const num = (re) => {
    const m = c.map((x) => re.exec(x)).find(Boolean)
    return m ? round(Number(m[1]) * unit, 2) : undefined
  }
  const o = { heightPx: num(/^(?:h|size)-([\d.]+)$/), minHeightPx: num(/^min-h-([\d.]+)$/), paddingInlinePx: num(/^px-([\d.]+)$/), paddingBlockPx: num(/^py-([\d.]+)$/), gapPx: num(/^gap-([\d.]+)$/) }
  const t = c.map((x) => /^text-(xs|sm|base|lg)(?:\/(\w+))?$/.exec(x)).find(Boolean)
  const arb = c.map((x) => /^text-\[([\d.]+)rem\]$/.exec(x)).find(Boolean)
  if (t) {
    o.fontSizePx = px(twVars[`text-${t[1]}`])
    o.lineHeightRatio = round(t[2] ? Number(twVars[`leading-${t[2]}`]) : calc(twVars[`text-${t[1]}--line-height`]))
    o.lineHeightPx = round(o.fontSizePx * o.lineHeightRatio, 2)
  } else if (arb) o.fontSizePx = round(Number(arb[1]) * 16, 2)
  const rad = c.map((x) => /^rounded-(xs|sm|md|lg|xl|2xl|3xl|4xl|none)$/.exec(x)).find(Boolean)
  if (rad) o.radiusClass = `rounded-${rad[1]}`
  return o
}

// --- theme
const TH = `${R}themes.ts`
const themes = lit(decls(parseJs(read(TH))).get('THEMES'))
const neutral = themes.find((t) => t.name === 'neutral')
const radiusBase = px(neutral.cssVars.light.radius)
const G = 'apps/v4/app/globals.css'
const gvars = cssVars(read(G))
const radiusSteps = gvars.filter((v) => /^radius-/.test(v.name)).map((v) => {
  const k = /calc\(var\(--radius\) \* ([\d.]+)\)/.exec(v.value)
  return tok(v.name, v.value, { px: k ? round(radiusBase * Number(k[1]), 2) : v.value === 'var(--radius)' ? radiusBase : undefined, derived: true, formula: `--radius ${neutral.cssVars.light.radius}`, file: G })
})
const radiusPx = (cls) => (cls === 'rounded-none' ? 0 : radiusSteps.find((s) => s.name === cls?.replace('rounded-', 'radius-'))?.px)

// --- classic components
const sizes = []
const modes = [{ id: 'new-york-v4', name: 'new-york-v4 (classic component source)', mechanism: 'size-prop', description: 'Sizes are literal Tailwind classes in each copied component.', file: `${R}new-york-v4/ui/button.tsx` }]
const push = (component, size, mode, classes, baseClasses, file) => {
  const b = measure(baseClasses ?? '')
  const m = measure(classes)
  const o = { ...b, ...Object.fromEntries(Object.entries(m).filter(([, v]) => v !== undefined)) }
  if (m.fontSizePx !== undefined && m.lineHeightPx === undefined) {
    delete o.lineHeightPx
    delete o.lineHeightRatio
  }
  const radiusClass = o.radiusClass
  delete o.radiusClass
  sizes.push(clean({ component, size, mode, ...o, radiusPx: radiusPx(radiusClass), heightSource: classes.split(/\s+/).filter((x) => /^(h|size|min-h|px|py|text|rounded)-/.test(x)).join(' '), file }))
}
{
  const f = `${R}new-york-v4/ui/button.tsx`
  const t = read(f)
  const baseCls = /cva\(\s*"([^"]+)"/.exec(t)[1]
  const sizeBlock = t.slice(t.indexOf('size: {'), t.indexOf('defaultVariants'))
  for (const m of sizeBlock.matchAll(/"?([\w-]+)"?:\s*"([^"]+)"/g)) if (!m[1].startsWith('icon')) push('button', m[1], 'new-york-v4', m[2], baseCls, f)
  const fi = `${R}new-york-v4/ui/input.tsx`
  const ic = [...read(fi).matchAll(/"([^"]*\bh-\d[^"]*)"/g)][0][1]
  push('input', 'default', 'new-york-v4', ic.replace(/\bfile:\S+/g, ''), '', fi)
  const im = /\bmd:text-(\w+)/.exec(ic)
  if (im) sizes[sizes.length - 1].note = `text-base below md, text-${im[1]} (${px(twVars[`text-${im[1]}`])}px) from md up`
}
// --- style presets
for (const f of fs.readdirSync(path.join(repo, R, 'styles')).filter((x) => /^style-.*\.css$/.test(x)).sort()) {
  const id = f.replace('.css', '')
  const file = `${R}styles/${f}`
  const rules = cssRules(read(file))
  const apply = (sel) => rules.filter((r) => r.sel === sel).map((r) => r.decls.find(([k]) => k === '@apply' || k.startsWith('@apply'))?.[1] ?? '').join(' ')
  const text = fs.readFileSync(path.join(repo, file), 'utf8')
  const ap = (name) => new RegExp(`\\.${name} \\{\\s*@apply ([^;]+);`).exec(text)?.[1] ?? ''
  if (!ap('cn-button-size-default')) continue
  modes.push({ id, name: id, mechanism: 'size-prop', description: 'Style preset selectable at init; redefines every component size.', file })
  for (const s of ['xs', 'sm', 'default', 'lg']) if (ap(`cn-button-size-${s}`)) push('button', s, id, ap(`cn-button-size-${s}`), ap('cn-button'), file)
  if (ap('cn-input')) push('input', 'default', id, ap('cn-input').replace(/\bfile:\S+/g, ''), '', file)
}

const lightVars = Object.entries(neutral.cssVars.light).filter(([k]) => k !== 'radius')
const pick = (mode, keys) => keys.filter((k) => neutral.cssVars[mode][k]).map((k) => tok(k, neutral.cssVars[mode][k], { mode, file: TH }))
const neutralKeys = ['background', 'foreground', 'card', 'popover', 'secondary', 'muted', 'muted-foreground', 'accent', 'border', 'input']
const primaryKeys = ['primary', 'primary-foreground', 'ring']
const focus = /focus-visible:ring-\[(\d+px)\]/.exec(read(`${R}new-york-v4/ui/button.tsx`))?.[1]

const classCount = (re) => fs.readdirSync(path.join(repo, R, 'new-york-v4/ui')).filter((f) => f.endsWith('.tsx')).reduce((a, f) => a + (fs.readFileSync(path.join(repo, R, 'new-york-v4/ui', f), 'utf8').match(re)?.length ?? 0), 0)
const shadcnPkg = { name: 'shadcn-ui/ui', version: commit, license: 'MIT', dir: path.join(repo, R), used }
const i18n = scanI18n([{ p: { ...shadcnPkg, dir: path.join(repo, R, 'new-york-v4/ui') } }, { p: { ...shadcnPkg, dir: path.join(repo, R, 'styles') } }, { p: { ...shadcnPkg, dir: path.join(repo, R, 'bases') }, only: /\/ui\/[^/]+\.tsx$/ }])
i18n.scanned = i18n.scanned.map((s, i) => ({ ...s, package: `shadcn-ui/ui@${commit.slice(0, 12)} ${['registry/new-york-v4/ui', 'registry/styles', 'registry/bases/*/ui'][i]}` }))
i18n.findings = [
  'The theme has no variable for direction, language or script, and none for font family (fonts are left to the app; Tailwind defaults apply).',
  `Direction lives in component class names. In the classic new-york-v4 sources the scan counts ${classCount(/\b(?:ml|mr|pl|pr|left|right)-[0-9[]/g)} physical utilities (ml-, pr-, left-…) against ${classCount(/\b(?:ms|me|ps|pe|start|end)-[0-9[]/g)} logical ones (ms-, pe-, start-…); the newer registry bases add rtl: variants and a DirectionProvider wrapper (ui/direction.tsx) — ${i18n.patterns.find((x) => x.id === 'rtl').hits} lines mention rtl across all scanned sources.`,
  `Density is expressed as style presets rather than a mode. Default button height / label text per preset: ${modes.map((m) => { const s = sizes.find((x) => x.mode === m.id && x.component === 'button' && x.size === 'default'); return `${m.id.replace('style-', '')} ${s.heightPx}px / ${s.fontSizePx}px on ${s.lineHeightPx}px` }).join('; ')}.`,
  'Inputs use 16px text below the md breakpoint and 14px above (avoids iOS zoom) at an unchanged 36px height.',
]

writeRef({
  id: 'shadcn-ui',
  script: 'shadcn.mjs',
  system: { name: 'shadcn/ui', package: 'shadcn-ui/ui (git)', version: commit, license: 'MIT', url: 'https://ui.shadcn.com' },
  pkgs: [tw],
  extraSources: [{ name: 'shadcn-ui/ui', url: 'https://github.com/shadcn-ui/ui', version: commit, license: 'MIT', retrievedAt: RETRIEVED_AT, path: [...used].sort().join(', ').slice(0, 900) }],
  provenanceNotes: 'Class names are read literally; px values are derived from the pinned Tailwind theme (--spacing, --text-*). Read from the default branch at the recorded commit.',
  scales: {
    controls: { densityModes: modes, sizes, touchTarget: [] },
    radius: { steps: [tokPx('--radius', neutral.cssVars.light.radius, { file: TH }), ...radiusSteps] },
    focusRing: { steps: focus ? [tokPx('focus-visible:ring width', focus, { file: `${R}new-york-v4/ui/button.tsx`, note: 'ring colour var(--ring) at 50% opacity; no offset' })] : [] },
    color: {
      structure: {
        ramps: [],
        semanticRoles: lightVars.map(([k]) => k),
        modes: ['light', 'dark'],
        note: `Paired roles (x / x-foreground) as CSS variables in OKLCH. ${themes.length} themes in the registry: base colours ${themes.filter((t) => t.cssVars?.light?.background).map((t) => t.name).join(', ')} and accent themes.`,
      },
      neutral: [{ name: 'neutral theme roles', mode: 'light', steps: pick('light', neutralKeys) }, { name: 'neutral theme roles', mode: 'dark', steps: pick('dark', neutralKeys) }],
      primary: [{ name: 'neutral theme primary', mode: 'light', steps: pick('light', primaryKeys) }, { name: 'neutral theme primary', mode: 'dark', steps: pick('dark', primaryKeys) }],
    },
    i18n,
  },
  notes: 'Spacing, type scale, breakpoints, shadows and motion are Tailwind defaults (see tailwind.json); shadcn/ui adds only colour roles, --radius and component classes.',
  gaps: ['No own spacing, type, breakpoint, z-index, elevation or motion scale (inherits Tailwind).', 'No touch-target token or touch mode.', 'Not a versioned package: values are from the repository default branch at the recorded commit.'],
})
