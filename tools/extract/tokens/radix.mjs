#!/usr/bin/env node
// Radix Themes (@radix-ui/themes src/**/*.css) and Radix Colors (@radix-ui/colors *.css).
//   node tools/extract/tokens/radix.mjs <scratch-dir>
import { scratch, pkg, cssRules, cssVars, tok, tokPx, px, round, clean, scanI18n, writeRef } from './lib.mjs'

const root = scratch()
const p = pkg(root, '@radix-ui/themes')
const c = pkg(root, '@radix-ui/colors')
const T = 'src/styles/tokens/'
const v = (f) => cssVars(p.read(f)).map((x) => ({ ...x, file: f }))
const all = ['space', 'typography', 'radius', 'scaling', 'shadow', 'layout', 'cursor', 'base'].filter((f) => p.exists(`${T}${f}.css`)).flatMap((f) => v(`${T}${f}.css`))
const by = (re) => all.filter((x) => re.test(x.name))
const base = (s) => {
  const m = /^calc\(([\d.]+)px \* var\(--scaling\)/.exec(s)
  return m ? Number(m[1]) : px(s)
}
const one = (name) => base(all.find((x) => x.name === name)?.value)
const scalings = [...new Set(by(/^scaling$/).map((x) => Number(x.value)))].sort()

// controls: --base-button-height / --text-field-height per size class, resolved through --space-N
const sizes = []
const modes = scalings.map((s) => ({ id: `scaling-${Math.round(s * 100)}`, name: `scaling ${Math.round(s * 100)}%`, mechanism: 'scaling-factor', description: 'Theme prop `scaling` multiplies every space, font-size, line-height and radius token.', file: `${T}scaling.css` }))
function controls(component, file, heightVar) {
  const rules = cssRules(p.read(file))
  for (const r of rules) {
    const m = /\.rt-r-size-(\d)\)/.exec(r.sel)
    const h = r.decls.find(([k]) => k === heightVar)
    if (!m || !h) continue
    const ref = /var\(--(space-\d)\)/.exec(h[1])?.[1]
    const fs = r.decls.find(([k]) => k === 'font-size')?.[1]
    const rad = /var\(--(radius-\d)\)/.exec(r.decls.find(([k]) => /border-radius$/.test(k))?.[1] ?? '')?.[1]
    const fsRef = fs && /var\(--(font-size-\d)\)/.exec(fs)?.[1]
    for (const s of scalings) {
      sizes.push(
        clean({
          component,
          size: m[1],
          mode: `scaling-${Math.round(s * 100)}`,
          heightPx: round(one(ref) * s, 2),
          fontSizePx: fsRef ? round(one(fsRef) * s, 2) : undefined,
          lineHeightPx: fsRef ? round(one(fsRef.replace('font-size', 'line-height')) * s, 2) : undefined,
          lineHeightRatio: fsRef ? round(one(fsRef.replace('font-size', 'line-height')) / one(fsRef)) : undefined,
          radiusPx: rad ? round(one(rad) * s, 2) : undefined,
          heightSource: `${heightVar}: var(--${ref})`,
          derived: s !== 1 ? true : undefined,
          formula: s !== 1 ? `${one(ref)}px × scaling ${s}` : undefined,
          file,
        }),
      )
    }
  }
}
controls('button', 'src/components/_internal/base-button.css', '--base-button-height')
controls('input', 'src/components/text-field.css', '--text-field-height')
// button font sizes live in button.css
{
  const rules = cssRules(p.read('src/components/button.css'))
  for (const r of rules) {
    const m = /\.rt-r-size-(\d)\)/.exec(r.sel)
    const fs = /var\(--(font-size-\d)\)/.exec(r.decls.find(([k]) => k === 'font-size')?.[1] ?? '')?.[1]
    const pad = /var\(--(space-\d)\)/.exec(r.decls.find(([k]) => k === 'padding-left' || k === 'padding-inline')?.[1] ?? '')?.[1]
    if (!m || !fs) continue
    for (const s of sizes.filter((x) => x.component === 'button' && x.size === m[1])) {
      const k = Number(s.mode.split('-')[1]) / 100
      s.fontSizePx = round(one(fs) * k, 2)
      s.lineHeightPx = round(one(fs.replace('font-size', 'line-height')) * k, 2)
      s.lineHeightRatio = round(one(fs.replace('font-size', 'line-height')) / one(fs))
      if (pad) s.paddingInlinePx = round(one(pad) * k, 2)
    }
  }
}
const fontSteps = by(/^font-size-\d$/).map((x) => {
  const n = x.name.slice(-1)
  const lh = one(`line-height-${n}`)
  return { name: x.name, fontSize: x.value, fontSizePx: base(x.value), lineHeight: all.find((y) => y.name === `line-height-${n}`).value, lineHeightPx: lh, lineHeightRatio: round(lh / base(x.value)), letterSpacing: all.find((y) => y.name === `letter-spacing-${n}`)?.value, file: x.file }
})
const bp = [...p.read('src/styles/breakpoints.css').matchAll(/@custom-media --(\w+) \(min-width: (\d+px)\)/g)].map((m) => tokPx(m[1], m[2], { file: 'src/styles/breakpoints.css' }))
const containers = cssVars(p.read('src/components/container.css')).filter((x) => /^container-\d$/.test(x.name)).map((x) => tokPx(x.name, x.value, { file: 'src/components/container.css' }))
const accentDefault = /accentColor:[^}]*default: '(\w+)'/s.exec(p.read('src/components/theme.props.tsx'))?.[1]

// colours
const files = c.ls('.').filter((f) => f.endsWith('.css'))
const rampNames = files.filter((f) => !/-dark|-alpha/.test(f)).map((f) => f.replace('.css', ''))
const ramp = (f, mode) => {
  const seen = new Set()
  return {
    name: f.replace(/(-dark)?\.css$/, ''),
    mode,
    steps: cssVars(c.read(f)).filter((x) => !x.at.length && !seen.has(x.name) && seen.add(x.name)).map((x) => tok(x.name, x.value, { file: f })),
  }
}
const i18n = scanI18n([{ p, only: /^src\/.*\.css$/ }, { p, only: /^src\/.*\.tsx?$/ }, { p: c }])
i18n.findings = [
  'No token for language, script or direction. Typography tokens are one Latin-tuned set (letter-spacing-1…9 are non-zero, which must be zeroed for Arabic).',
  `Direction: the Theme component wraps its children in ${/<Direction\.Provider dir="(\w+)">/.exec(p.read('src/components/theme.tsx'))?.[0] ?? '(no Direction.Provider found)'} and removes \`dir\` from its own props (src/components/theme.tsx); the token and component CSS contain no rtl or :dir() rule, and component CSS uses physical padding-left/right (text-field.css). As shipped, Radix Themes is LTR-only.`,
  'Density is a single multiplier (`scaling` 90–110%) that scales type and space together; there is no mode that changes control height without changing font size.',
]

writeRef({
  id: 'radix-themes',
  script: 'radix.mjs',
  system: { name: 'Radix Themes + Radix Colors', package: '@radix-ui/themes', version: p.version, license: p.license, url: 'https://www.radix-ui.com/themes' },
  pkgs: [p, c],
  scales: {
    controls: { densityModes: modes, sizes, note: 'Sizes 1–4 (button) and 1–3 (text field); Theme default size is 2. Heights are space tokens.' },
    spacing: { steps: by(/^space-\d$/).map((x) => tok(x.name, x.value, { px: base(x.value), file: x.file })) },
    radius: {
      steps: by(/^radius-\d$/).filter((x, i, a) => a.findIndex((y) => y.name === x.name) === i).map((x) => tok(x.name, x.value, { px: base(x.value), file: x.file, note: 'at radius-factor 1 (medium)' })),
      note: `radius prop sets --radius-factor: ${[...new Set(by(/^radius-factor$/).map((x) => x.value))].join(', ')} (none, small, medium, large, full)`,
    },
    typography: {
      rootFontSizePx: 16,
      fontStacks: by(/font-family$/).filter((x, i, a) => a.findIndex((y) => y.name === x.name) === i).map((x) => tok(x.name, x.value, { file: x.file })),
      steps: fontSteps,
      fontWeights: by(/^font-weight-/).map((x) => tok(x.name, Number(x.value), { file: x.file })),
    },
    breakpoints: { steps: bp },
    containers: { steps: containers },
    elevation: { steps: by(/^shadow-\d$/).filter((x, i, a) => a.findIndex((y) => y.name === x.name) === i).map((x) => tok(x.name, x.value, { file: x.file, mode: 'light' })) },
    color: {
      structure: {
        ramps: rampNames.map((n) => ({ name: n, steps: 12 })),
        semanticRoles: ['1-2 backgrounds', '3-5 interactive component backgrounds', '6-8 borders and separators', '9-10 solid colours', '11-12 accessible text'],
        modes: ['light', 'dark', 'light alpha', 'dark alpha', 'display-p3 variants'],
        note: `12-step ramps where the step number is the role. Radix Themes aliases --accent-* to one ramp (default accentColor: ${accentDefault}) and --gray-* to a matching tinted gray.`,
      },
      algorithm: {
        name: 'Radix custom palette',
        inputs: ['accent colour', 'gray colour', 'background colour', 'appearance (light/dark)'],
        outputs: ['12-step accent ramp + alpha ramp', '12-step gray ramp + alpha ramp', 'accent-contrast, accent-surface, accent-indicator, accent-track'],
        description: 'The shipped ramps are hand-tuned static values. The generator for custom ramps is not in these packages (it lives in the radix website repository); it picks the nearest shipped ramps and mixes them in OKLCH so that step 9 equals the input.',
      },
      neutral: [ramp('gray.css', 'light'), ramp('gray-dark.css', 'dark')],
      primary: [ramp(`${accentDefault}.css`, 'light'), ramp(`${accentDefault}-dark.css`, 'dark')],
    },
    i18n,
  },
  gaps: ['No border-width, focus-ring width, z-index or motion duration tokens (durations are literals inside component CSS).', 'No documented touch-target minimum.'],
})
