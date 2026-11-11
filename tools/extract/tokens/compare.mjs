#!/usr/bin/env node
// Reads data/tokens/reference/*.json and prints comparison tables (Markdown) used in docs/research/tokens.md.
//   node tools/extract/tokens/compare.mjs
// The data files hold only what upstream publishes. The MAP below is this layer's ANALYSIS: which upstream
// size/mode is taken as each system's default control, its densest practical variant and its touch variant, and
// which type step is its body / control text. Change the map, not the data, to argue a different reading.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../data/tokens/reference')
const load = (id) => JSON.parse(fs.readFileSync(path.join(DIR, `${id}.json`), 'utf8')).data
const sel = (component, size, mode) => ({ component, size, mode })

export const MAP = [
  { id: 'ant-design', label: 'Ant Design', btn: 'button', inp: 'input', ladderMode: 'default', def: sel('button', 'middle', 'default'), compact: sel('button', 'middle', 'compact'), touch: sel('button', 'large', 'default'), compactHow: 'compactAlgorithm', touchHow: 'size large (no touch mode)', body: ['font-size', 'default'], small: ['font-size-sm', 'default'] },
  { id: 'material-3', label: 'Material 3', btn: 'button', inp: 'input', ladderMode: null, def: sel('button', 'default', 'density-0'), compact: sel('button', 'default', 'density--3'), touch: sel('button', 'default', 'density-0'), compactHow: 'density −3 (Angular Material table)', touchHow: 'density 0 + 48px touch wrapper', body: ['body-medium'], small: ['body-small'] },
  { id: 'mui', label: 'MUI', btn: 'button', inp: 'input', ladderMode: 'default', def: sel('button', 'medium', 'default'), compact: sel('button', 'small', 'default'), touch: sel('button', 'large', 'default'), compactHow: 'size small', touchHow: 'size large', body: ['body2'], small: ['caption'] },
  { id: 'radix-themes', label: 'Radix Themes', btn: 'button', inp: 'input', ladderMode: 'scaling-100', def: sel('button', '2', 'scaling-100'), compact: sel('button', '1', 'scaling-100'), touch: sel('button', '3', 'scaling-100'), compactHow: 'size 1 (or scaling 90%)', touchHow: 'size 3 (or scaling 110%)', body: ['font-size-2'], small: ['font-size-1'] },
  { id: 'carbon', label: 'Carbon', btn: 'button', inp: 'input', ladderMode: 'normal', def: sel('input', 'md', 'normal'), compact: sel('input', 'sm', 'condensed'), touch: sel('input', 'lg', 'normal'), compactHow: 'size sm + density condensed', touchHow: 'size lg (button default)', body: ['body-compact-01'], small: ['label-01'] },
  { id: 'fluent-2', label: 'Fluent 2', btn: 'button', inp: 'input', ladderMode: 'default', def: sel('button', 'medium', 'default'), compact: sel('button', 'small', 'default'), touch: sel('button', 'large', 'default'), compactHow: 'size small', touchHow: 'size large', body: ['body1'], small: ['caption1'] },
  { id: 'primer', label: 'Primer', btn: 'control', inp: 'control', ladderMode: 'normal', def: sel('control', 'medium', 'normal'), compact: sel('control', 'small', 'condensed'), touch: sel('control', 'large', 'spacious'), compactHow: 'size small + condensed padding', touchHow: 'size large; minTarget 44 on coarse pointers', body: ['text-body-medium'], small: ['text-body-small'] },
  { id: 'spectrum', label: 'Spectrum', btn: 'control', inp: 'control', ladderMode: 'desktop', def: sel('control', 'm', 'desktop'), compact: sel('control', 's', 'desktop'), touch: sel('control', 'm', 'mobile'), compactHow: 'size S', touchHow: 'mobile scale, size M', body: ['font-size-100', 'desktop'], small: ['font-size-75', 'desktop'] },
  { id: 'polaris', label: 'Polaris', btn: 'button', inp: 'input', ladderMode: 'desktop', def: sel('input', 'medium', 'desktop'), compact: sel('button', 'micro', 'desktop'), touch: sel('input', 'medium', 'mobile'), compactHow: 'button micro / input slim 28', touchHow: 'below 48em viewport', body: ['text-body-md'], small: ['text-body-sm'] },
  { id: 'shadcn-ui', label: 'shadcn/ui', btn: 'button', inp: 'input', ladderMode: 'new-york-v4', def: sel('button', 'default', 'new-york-v4'), compact: sel('button', 'default', 'style-mira'), touch: sel('button', 'lg', 'new-york-v4'), compactHow: 'style preset mira', touchHow: 'size lg', bodyFrom: ['tailwind', 'text-sm'], smallFrom: ['tailwind', 'text-xs'] },
  { id: 'mantine', label: 'Mantine', btn: 'button', inp: 'input', ladderMode: 'default', def: sel('button', 'sm', 'default'), compact: sel('button', 'xs', 'default'), touch: sel('button', 'md', 'default'), compactHow: 'size xs (Button also has compact-sm 26)', touchHow: 'size md', body: ['text sm'], small: ['text xs'] },
  { id: 'chakra-ui', label: 'Chakra UI', btn: 'button', inp: 'input', ladderMode: 'default', def: sel('button', 'md', 'default'), compact: sel('button', 'xs', 'default'), touch: sel('button', 'lg', 'default'), compactHow: 'size xs', touchHow: 'size lg', body: ['textStyle sm'], small: ['textStyle xs'] },
  { id: 'tailwind', label: 'Tailwind v4', body: ['text-sm'], small: ['text-xs'] },
  { id: 'open-props', label: 'Open Props' },
]

const data = Object.fromEntries(MAP.map((m) => [m.id, load(m.id)]))
const guidelines = load('platform-guidelines')
const n = (v, d = 2) => (v === undefined || v === null ? '—' : String(Math.round(v * 10 ** d) / 10 ** d))
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n')
const out = []
const h = (t) => out.push(`\n### ${t}\n`)
const find = (id, s) => data[id].scales.controls?.sizes.find((x) => x.component === s.component && x.size === s.size && x.mode === s.mode)
const typeStep = (id, [name, set]) => data[id].scales.typography?.steps?.find((s) => s.name === name && (!set || s.set === set))
const bodyOf = (m, key) => (m[`${key}From`] ? typeStep(...[m[`${key}From`][0], [m[`${key}From`][1]]]) : m[key] ? typeStep(m.id, m[key]) : undefined)

// 1. control heights
h('Control height by size (px)')
out.push('Each cell lists upstream size name = border-box height, in the mode named in the second column. **Bold** = the size this analysis treats as the system default.\n')
out.push(
  table(
    ['System', 'Mode shown', 'Button', 'Text input'],
    MAP.filter((m) => m.btn).map((m) => {
      const ladder = (component) => {
        const all = data[m.id].scales.controls.sizes.filter((s) => s.component === component && (m.ladderMode === null ? s.mode === 'density-0' : s.mode === m.ladderMode) && (s.heightPx ?? s.minHeightPx) !== undefined)
        const seen = new Set()
        return all.filter((s) => !seen.has(s.size) && seen.add(s.size)).sort((a, b) => (a.heightPx ?? a.minHeightPx) - (b.heightPx ?? b.minHeightPx)).map((s) => {
          const t = `${s.size} ${n(s.heightPx ?? s.minHeightPx)}${s.derived ? '\\*' : ''}`
          return m.def.component === component && m.def.size === s.size ? `**${t}**` : t
        }).join(' · ') || '—'
      }
      return [m.label, m.ladderMode ?? 'density 0', ladder(m.btn), m.inp === m.btn ? '(same token)' : ladder(m.inp)]
    }),
  ),
)
out.push('\n\\* derived by the extractor from padding + line box (no height token upstream).')

// 2. three densities
h('Where a 3-density model lands (px)')
out.push('Height / control font size / control line-height for the variant each system would use for a dense desktop grid, its default, and touch. "How" names the upstream mechanism.\n')
const cell = (m, s) => {
  const c = find(m.id, s)
  if (!c) return '—'
  return `${n(c.heightPx ?? c.minHeightPx)} / ${n(c.fontSizePx)} / ${n(c.lineHeightPx)}`
}
out.push(table(['System', 'Compact', 'How', 'Default', 'Touch', 'How'], MAP.filter((m) => m.btn).map((m) => [m.label, cell(m, m.compact), m.compactHow, cell(m, m.def), cell(m, m.touch), m.touchHow])))
{
  const col = (k) => MAP.filter((m) => m.btn).map((m) => find(m.id, m[k])).map((c) => c?.heightPx ?? c?.minHeightPx).filter((v) => v !== undefined).sort((a, b) => a - b)
  const med = (a) => (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2)
  out.push('')
  out.push(table(['', 'Compact', 'Default', 'Touch'], [['min', ...['compact', 'def', 'touch'].map((k) => n(col(k)[0]))], ['median', ...['compact', 'def', 'touch'].map((k) => n(med(col(k))))], ['max', ...['compact', 'def', 'touch'].map((k) => n(col(k).at(-1)))], ['systems', ...['compact', 'def', 'touch'].map((k) => String(col(k).length))]]))
}

// 3. density mechanisms + touch targets
h('Density mechanism and touch-target minimum')
out.push(
  table(
    ['System', 'Density modes published', 'Mechanism', 'Touch-target minimum (tokenised)'],
    MAP.map((m) => {
      const c = data[m.id].scales.controls
      const modes = c?.densityModes ?? []
      const tt = (c?.touchTarget ?? []).map((t) => `${t.name}: ${n(t.px)}`).join('; ')
      return [m.label, modes.length ? (modes.length > 6 ? `${modes.length} (${modes[0].id} … ${modes.at(-1).id})` : modes.map((x) => x.id).join(', ')) : 'none', [...new Set(modes.map((x) => x.mechanism))].join(', ') || '—', tt || 'none']
    }),
  ),
)
out.push('\nGuidance (documentation, needs-review — `platform-guidelines.json`): ' + guidelines.scales.controls.touchTarget.map((t) => `${t.name} = ${t.px}px`).join('; ') + '.')

// 4. line heights
h('Type: body and control text')
out.push('Body = the step each system uses for default UI text. Control = the default control of the previous table. `H/F` = control height ÷ control font size (vertical room available to a single line, whatever the line-height says).\n')
const flag = (r) => (r === undefined ? '' : r < 1.35 ? ' ⚠ tight' : r < 1.5 ? ' ~ borderline' : '')
out.push(
  table(
    ['System', 'Body size', 'Body LH', 'ratio', 'Small text', 'ratio', 'Control font', 'Control LH', 'ratio', 'H/F'],
    MAP.map((m) => {
      const b = bodyOf(m, 'body')
      const s = bodyOf(m, 'small')
      const c = m.def && find(m.id, m.def)
      const hh = c?.heightPx ?? c?.minHeightPx
      return [m.label, n(b?.fontSizePx), n(b?.lineHeightPx), b ? `${n(b.lineHeightRatio, 3)}${flag(b.lineHeightRatio)}` : '—', s ? `${n(s.fontSizePx)}/${n(s.lineHeightPx)}` : '—', s ? `${n(s.lineHeightRatio, 3)}${flag(s.lineHeightRatio)}` : '—', n(c?.fontSizePx), n(c?.lineHeightPx), c?.lineHeightRatio ? `${n(c.lineHeightRatio, 3)}${flag(c.lineHeightRatio)}` : '—', hh && c?.fontSizePx ? n(hh / c.fontSizePx) : '—']
    }),
  ),
)
out.push('\n⚠ tight: line-height ratio below 1.35; ~ borderline: 1.35–1.5. Thresholds are this layer\'s flags for the font agent to confirm, not measurements of Arabic faces.')

// 5. type scale
h('Type scale (font sizes, px)')
out.push(
  table(
    ['System', 'Sizes', 'Steps', 'Mean step ratio', 'Font stacks'],
    MAP.map((m) => {
      const ty = data[m.id].scales.typography
      if (!ty) return [m.label, 'inherits Tailwind', '—', '—', '—']
      const fromSteps = (ty.steps ?? []).filter((s) => !s.set || /^(default|desktop|productive)/.test(s.set)).map((s) => s.fontSizePx)
      const sizes = [...new Set([...(ty.fontSizes ?? []).filter((t) => !t.mode || t.mode === 'desktop').map((t) => t.px), ...fromSteps].filter((v) => typeof v === 'number' && v > 0))].sort((a, b) => a - b)
      const ratios = sizes.slice(1).map((v, i) => v / sizes[i])
      return [m.label, sizes.join(' '), String(sizes.length), ratios.length ? n(Math.exp(ratios.reduce((a, r) => a + Math.log(r), 0) / ratios.length), 3) : '—', String(ty.fontStacks?.length ?? 0)]
    }),
  ),
)

// 6. spacing
h('Spacing scale (px)')
const pxList = (steps, max, filter = () => true) => [...new Set((steps ?? []).filter(filter).map((t) => t.px).filter((v) => typeof v === 'number' && v >= 0 && v <= max))].sort((a, b) => a - b)
out.push(
  table(
    ['System', 'Steps ≤ 64px', 'Base unit', 'Note'],
    MAP.map((m) => {
      const sp = data[m.id].scales.spacing
      if (!sp) return [m.label, '—', '—', m.id === 'shadcn-ui' ? 'inherits Tailwind' : 'no spacing tokens']
      const filter = { 'ant-design': (t) => t.mode === 'default' && /^size/.test(t.name), spectrum: (t) => !t.mode || t.mode === 'desktop', primer: (t) => /^base-size/.test(t.name), 'open-props': (t) => /^size-\d+$/.test(t.name) }[m.id]
      const list = pxList(sp.steps, 64, filter)
      const pos = list.filter((v) => v > 0)
      const unit = pos.every((v) => v % 4 === 0) ? 4 : pos.every((v) => v % 2 === 0) ? 2 : pos.every((v) => Number.isInteger(v)) ? 1 : 'sub-px'
      return [m.label, list.join(' '), `${unit}px grid`, (sp.note ?? '').split('. ')[0].slice(0, 90)]
    }),
  ),
)

// 7. radius
h('Radius scale (px)')
out.push(table(['System', 'Steps', 'Default control radius'], MAP.map((m) => {
  const r = data[m.id].scales.radius
  const c = m.def && find(m.id, m.def)
  const list = r ? pxList(r.steps, 64, m.id === 'spectrum' ? (t) => !t.mode || t.mode === 'desktop' : undefined) : []
  const full = r?.steps.some((t) => t.px > 64 || /full|round|circular|max/i.test(t.name)) ? ' + full' : ''
  return [m.label, r ? `${list.join(' ')}${full}` : '—', n(c?.radiusPx)]
})))

// 8. border + focus
h('Border width and focus ring (px)')
out.push(table(['System', 'Border widths', 'Focus ring'], MAP.map((m) => {
  const s = data[m.id].scales
  return [m.label, s.borderWidth ? pxList(s.borderWidth.steps, 16).join(' ') : '—', s.focusRing?.steps.length ? s.focusRing.steps.map((t) => `${t.name.replace(/^md\.comp\.focus-ring\./, '')} ${t.px !== undefined ? n(t.px) : t.value}`).join('; ') : '—']
})))

// 9. motion
h('Motion durations (ms) and easing count')
out.push(table(['System', 'Durations', 'Easings'], MAP.map((m) => {
  const mo = data[m.id].scales.motion
  if (!mo) return [m.label, '—', '—']
  return [m.label, [...new Set((mo.durations ?? []).map((t) => t.ms).filter((v) => typeof v === 'number'))].sort((a, b) => a - b).join(' '), String(new Set((mo.easings ?? []).map((t) => t.value)).size)]
})))

// 10. breakpoints
h('Breakpoints (min-width, px)')
out.push(table(['System', 'Breakpoints', 'Containers (px)'], MAP.map((m) => {
  const s = data[m.id].scales
  const fmt = (x) => (x ? x.steps.filter((t) => typeof t.px === 'number').map((t) => `${t.name.replace(/^(breakpoints|breakpoint|container|screen)-?/, '') || t.name} ${n(t.px)}`).join(' · ') : '—')
  return [m.label, fmt(s.breakpoints), s.containers ? pxList(s.containers.steps, 4000).join(' ') : '—']
})))

// 11. z-index + elevation
h('Layers and elevation')
out.push(table(['System', 'z-index values', 'Elevation levels'], MAP.map((m) => {
  const s = data[m.id].scales
  return [m.label, s.zIndex ? [...new Set(s.zIndex.steps.map((t) => t.value).filter((v) => typeof v === 'number'))].sort((a, b) => a - b).join(' ') : '—', s.elevation ? String(s.elevation.steps.length) : '—']
})))

// 12. colour structure
h('Colour structure')
out.push(table(['System', 'Ramps', 'Steps per ramp', 'Semantic roles', 'Modes', 'Algorithm'], MAP.map((m) => {
  const c = data[m.id].scales.color
  if (!c) return [m.label, '—', '—', '—', '—', '—']
  const st = c.structure ?? {}
  const counts = [...new Set((st.ramps ?? []).map((r) => r.steps).filter(Boolean))].sort((a, b) => a - b)
  return [m.label, String(st.ramps?.length ?? 0), counts.join('/') || '—', String(st.semanticRoles?.length ?? 0), String(st.modes?.length ?? 0), c.algorithm?.name ?? 'static']
})))

// 13. i18n scan
h('Direction, language and script: what the token sources contain')
out.push('Line counts from a regex scan of the files listed in each data file (`scales.i18n.scanned`); patterns are in `lib.mjs`. "Script tokens" = tokens the extractor found that vary by language or script.\n')
const pat = (id, p) => data[id].scales.i18n?.patterns.find((x) => x.id === p)?.hits ?? '—'
out.push(table(['System', 'arabic', 'ar locale', 'rtl', '[dir]/:dir()', ':lang()', 'bidi', 'other scripts', 'logical props', 'Script/direction tokens'], MAP.map((m) => [m.label, ...['arabic', 'locale-ar', 'rtl', 'dir-selector', 'lang-selector', 'bidi', 'other-scripts', 'logical-properties'].map((p) => String(pat(m.id, p))), (data[m.id].scales.i18n?.tokens ?? []).map((t) => t.name).slice(0, 6).join(', ') + ((data[m.id].scales.i18n?.tokens?.length ?? 0) > 6 ? ` … (${data[m.id].scales.i18n.tokens.length})` : '') || 'none'])))

console.log(out.join('\n'))
