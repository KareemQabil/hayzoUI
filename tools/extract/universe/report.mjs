#!/usr/bin/env node
// Reads data/catalog/universe and prints the build-planning tables. Exits 1 when the data is inconsistent:
// duplicate ids, a file name that differs from its id, an engine that is not in docs/ARCHITECTURE.md, a dependsOn that
// does not resolve, a dependency on a later tier, or a dependency cycle.
//   node tools/extract/universe/report.mjs            tables as text
//   node tools/extract/universe/report.mjs --md       the same as Markdown (pasted into docs/research/universe.md)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(here, '..', '..', '..')
const DIR = path.join(ROOT, 'data', 'catalog', 'universe')
const md = process.argv.includes('--md')
const errors = []

const engineList = fs.readFileSync(path.join(ROOT, 'docs', 'ARCHITECTURE.md'), 'utf8').split('## Engine ids')[1].split('\n## ')[0].match(/`([a-z-]+)`/g).map((s) => s.slice(1, -1))
const engineSet = new Set(engineList)
const comps = []
const seen = new Set()
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()) {
  const doc = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))
  if (doc.id !== file.replace('.json', '')) errors.push(`${file}: id "${doc.id}" does not match the file name`)
  if (doc.data.id !== doc.id) errors.push(`${file}: data.id differs from id`)
  if (seen.has(doc.id)) errors.push(`duplicate id ${doc.id}`)
  seen.add(doc.id)
  comps.push(doc.data)
}
const byId = new Map(comps.map((c) => [c.id, c]))
const tierNo = (t) => Number(t.slice(1))
for (const c of comps) {
  for (const e of c.engines) if (!engineSet.has(e)) errors.push(`${c.id}: engine "${e}" is not in the closed list of docs/ARCHITECTURE.md`)
  for (const d of c.dependsOn ?? []) {
    const dep = byId.get(d)
    if (!dep) { errors.push(`${c.id}: dependsOn "${d}" does not resolve`); continue }
    if (tierNo(dep.tier) > tierNo(c.tier)) errors.push(`${c.id} (${c.tier}) depends on ${d} (${dep.tier}), a later tier`)
  }
  const fids = new Set()
  for (const f of c.features) { if (fids.has(f.id)) errors.push(`${c.id}: duplicate feature id ${f.id}`); fids.add(f.id) }
}
// cycles
const state = new Map()
const visit = (id, trail) => {
  if (state.get(id) === 2) return
  if (state.get(id) === 1) { errors.push(`dependency cycle: ${[...trail.slice(trail.indexOf(id)), id].join(' → ')}`); return }
  state.set(id, 1)
  for (const d of byId.get(id)?.dependsOn ?? []) if (byId.has(d)) visit(d, [...trail, id])
  state.set(id, 2)
}
for (const c of comps) visit(c.id, [])

// ── output helpers ───────────────────────────────────────────────────────────────────────────────────────────
const out = []
const h = (t) => out.push('', md ? `### ${t}` : `== ${t} ==`, '')
function table(head, rows) {
  if (md) { out.push(`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)); return }
  const w = head.map((x, i) => Math.max(String(x).length, ...rows.map((r) => String(r[i]).length)))
  const line = (r) => r.map((x, i) => String(x).padEnd(w[i])).join('  ').trimEnd()
  out.push(line(head), line(w.map((n) => '-'.repeat(n))), ...rows.map(line))
}
const count = (list, key) => { const m = new Map(); for (const x of list) for (const k of [].concat(key(x))) m.set(k, (m.get(k) ?? 0) + 1); return m }
const TIERS = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5']
const PRI = ['p0', 'p1', 'p2']

h(`Totals`)
const features = comps.flatMap((c) => c.features.map((f) => ({ ...f, component: c.id })))
const claims = features.reduce((n, f) => n + (f.in?.length ?? 0), 0)
const proven = features.reduce((n, f) => n + (f.evidence?.length ?? 0), 0)
table(['measure', 'value'], [
  ['components', comps.length], ['features', features.length], ['features from the owner matrix', features.filter((f) => f.origin === 'owner-matrix').length],
  ['features written for this layer', features.filter((f) => f.origin === 'authored').length], ['aliases', comps.reduce((n, c) => n + c.aliases.length, 0)],
  ['library claims in `in`', claims], ['… with declaration evidence', `${proven} (${Math.round((proven / claims) * 100)}%)`], ['features with no library in `in`', features.filter((f) => !f.in?.length).length],
])

h('Components per family and tier')
const fams = [...new Set(comps.map((c) => c.family))].sort()
table(['family', ...TIERS, 'total', ...PRI], [
  ...fams.map((f) => { const l = comps.filter((c) => c.family === f); return [f, ...TIERS.map((t) => l.filter((c) => c.tier === t).length || '·'), l.length, ...PRI.map((p) => l.filter((c) => c.priority === p).length || '·')] }),
  ['total', ...TIERS.map((t) => comps.filter((c) => c.tier === t).length), comps.length, ...PRI.map((p) => comps.filter((c) => c.priority === p).length)],
])

h('Components per engine')
const uses = count(comps, (c) => c.engines)
table(['engine', 'components', 'p0', 'earliest tier', 'used by'], engineList.map((e) => {
  const l = comps.filter((c) => c.engines.includes(e))
  return [e, l.length, l.filter((c) => c.priority === 'p0').length, l.length ? l.map((c) => c.tier).sort()[0] : '—', l.length ? l.map((c) => c.id).join(', ') : '(unused)']
}).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)))

h('Engine leverage (build order)')
out.push(md
  ? 'Greedy order: at each step the engine that completes the most components whose other engines are already built (ties: most p0 completed, then most components using it, then the earliest tier). "Completes" counts components that become buildable at that step; the cumulative column includes the components that need no engine.'
  : 'Greedy order: each step takes the engine that completes the most components whose other engines are already built\n(ties: most p0 completed, then most users, then earliest tier). Cumulative includes components that need no engine.', '')
const built = new Set(['none'])
const done = new Set(comps.filter((c) => c.engines.every((e) => built.has(e))).map((c) => c.id))
const steps = []
const pending = () => engineList.filter((e) => !built.has(e) && uses.has(e))
while (pending().length) {
  let best
  for (const e of pending()) {
    const completes = comps.filter((c) => !done.has(c.id) && c.engines.includes(e) && c.engines.every((x) => x === e || built.has(x)))
    const users = comps.filter((c) => c.engines.includes(e))
    const cand = { e, completes, p0: completes.filter((c) => c.priority === 'p0').length, users: users.length, tier: users.map((c) => c.tier).sort()[0] }
    if (!best || cand.completes.length > best.completes.length || (cand.completes.length === best.completes.length && (cand.p0 > best.p0 || (cand.p0 === best.p0 && (cand.users > best.users || (cand.users === best.users && cand.tier < best.tier)))))) best = cand
  }
  built.add(best.e)
  for (const c of best.completes) done.add(c.id)
  steps.push([steps.length + 1, best.e, best.users, best.completes.length, best.p0, done.size, best.completes.map((c) => c.id).join(', ') || '—'])
}
table(['step', 'engine', 'used by', 'completes', 'p0 completed', 'cumulative', 'components completed at this step'], steps)
out.push('', `Need no engine: ${comps.filter((c) => c.engines.every((e) => e === 'none')).length} components. Engines of the closed list that no component uses: ${engineList.filter((e) => e !== 'none' && !uses.has(e)).join(', ') || 'none'}.`)

h('Ours alone (no alias in any surveyed library)')
const alone = comps.filter((c) => c.aliases.length === 0)
table(['id', 'tier', 'priority', 'family', 'name'], alone.map((c) => [c.id, c.tier, c.priority, c.family, c.name.en]))

h('Aliases per library')
const libs = count(comps, (c) => [...new Set(c.aliases.map((a) => a.library))])
const names = count(comps.flatMap((c) => c.aliases), (a) => a.library)
table(['library', 'components covered', 'alias names'], [...libs].sort((a, b) => b[1] - a[1]).map(([l, n]) => [l, n, names.get(l)]))
const most = [...comps].sort((a, b) => new Set(b.aliases.map((a) => a.library)).size - new Set(a.aliases.map((a) => a.library)).size).slice(0, 12)
out.push('', `Shipped by the most libraries: ${most.map((c) => `${c.id} (${new Set(c.aliases.map((a) => a.library)).size})`).join(', ')}.`)

h('Features carrying an Arabic note, by kind')
const noted = features.filter((f) => f.arabic)
const kinds = ['requirement', 'risk', 'opportunity']
table(['kind', 'features', 'p0', 'p1', 'p2', 'from owner matrix', 'components'], [
  ...kinds.map((k) => { const l = noted.filter((f) => f.arabic.kind === k); return [k, l.length, ...PRI.map((p) => l.filter((f) => f.priority === p).length), l.filter((f) => f.origin === 'owner-matrix').length, new Set(l.map((f) => f.component)).size] }),
  ['total', noted.length, ...PRI.map((p) => noted.filter((f) => f.priority === p).length), noted.filter((f) => f.origin === 'owner-matrix').length, new Set(noted.map((f) => f.component)).size],
])
out.push('', `Components with no Arabic note on any feature: ${comps.filter((c) => !c.features.some((f) => f.arabic)).map((c) => c.id).join(', ') || 'none'}.`)

h('Arabic notes per family')
table(['family', ...kinds], fams.map((f) => [f, ...kinds.map((k) => noted.filter((x) => x.arabic.kind === k && byId.get(x.component).family === f).length || '·')]))

// coverage of the libraries' own export lists (only when the extraction evidence is present)
const exportsFile = path.join(here, 'evidence', 'exports.json')
if (fs.existsSync(exportsFile)) {
  h('Library exports not reached by any alias')
  out.push(md ? 'PascalCase value exports of each entry point that are neither an alias nor a part of one (name starting with an alias name), after removing contexts, providers, icons and other non-components by name. This is the list to read when asking "did we miss a component?".' : 'PascalCase value exports that are neither an alias nor a part of one (prefix), minus contexts, icons and similar.', '')
  const ex = JSON.parse(fs.readFileSync(exportsFile, 'utf8'))
  const aliasBy = new Map()
  for (const c of comps) for (const a of c.aliases) aliasBy.set(a.library, [...(aliasBy.get(a.library) ?? []), a.name.split('.').pop(), a.name.split('.')[0]])
  const noise = /(Context|Provider|Icon|Classes|Styles|Variants|Recipe|Anatomy|Props|Module|Service|Ctrl|Feature|Comp|Value|Params|Store|Collection|Consumer|Skeleton|Control)$|^(Unstable_|UNSTABLE_|unstable_|Ag[A-Z]|Grid[A-Z]|Charts[A-Z]|Pickers[A-Z]|Animated|Focused|Highlighted|Base[A-Z]|Abstract|Field[A-Z])/
  const rows = []
  for (const [lib, pkgs] of Object.entries(ex)) {
    if (lib === 'tanstack-table' || lib === 'ag-grid') continue
    const al = [...new Set(aliasBy.get(lib) ?? [])]
    const all = [...new Set(Object.values(pkgs).flat())].filter((n) => (lib === 'shadcn' ? true : /^[A-Z][a-z]/.test(n) && !noise.test(n)))
    const hit = (n) => al.some((a) => n === a || (lib !== 'shadcn' && n.startsWith(a) && /[A-Z]/.test(n[a.length] ?? '')))
    const missing = all.filter((n) => !hit(n))
    rows.push([lib, all.length, all.length - missing.length, missing.length, missing.join(' ') || '—'])
  }
  table(['library', 'component-like exports', 'reached', 'not reached', 'names not reached'], rows)
}

console.log(out.join('\n').trim())
if (errors.length) {
  console.error(`\n✗ ${errors.length} consistency error(s):`)
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}
console.error(`\n✓ ${comps.length} components: ids unique, ${[...uses.keys()].length} engine ids and every dependsOn resolve, no dependency on a later tier, no cycles`)
