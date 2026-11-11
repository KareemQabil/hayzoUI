#!/usr/bin/env node
// Writes data/catalog/universe/<id>.json from: spec/ (judgement, hand-written), seed/antd-matrix.json (harvested
// from the owner's matrix) and evidence/verification.json (what verify.mjs found in the libraries' declarations).
//   node tools/extract/universe/build.mjs
// Needs no network and no downloads; rerun verify.mjs first when spec aliases or probes change.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadUniverse } from './expand.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(here, '..', '..', '..')
const OUT = path.join(ROOT, 'data', 'catalog', 'universe')
const read = (f) => JSON.parse(fs.readFileSync(path.join(here, f), 'utf8'))
const cfg = read('packages.json')
const resolved = read('evidence/resolved-packages.json')
const verification = read('evidence/verification.json')
const LIBS = ['antd', 'antd-pro', 'mui', 'mui-x', 'mantine', 'chakra', 'react-aria', 'base-ui', 'radix', 'headless-ui', 'shadcn', 'ag-grid', 'tanstack-table']
const order = (a, b) => LIBS.indexOf(a) - LIBS.indexOf(b)

const engines = new Set(fs.readFileSync(path.join(ROOT, 'docs', 'ARCHITECTURE.md'), 'utf8').split('## Engine ids')[1].split('## ')[0].match(/`([a-z-]+)`/g).map((s) => s.slice(1, -1)))
const { components, matrix, dropped, unused, problems } = await loadUniverse()
const ids = new Set(components.map((c) => c.id))
const TIER_PLAN = 'docs/MASTER_PLAN.md §7'
const MATRIX_SOURCE = { name: 'hayzoUI Ant Design parity matrix (project owner)', url: 'https://github.com/KareemQabil/hayzoui', version: '9b4eb3271c64872768f0a5533796a8a36b67e6eb', license: 'MIT', retrievedAt: cfg.retrievedAt, path: 'src/atomic/parity/antd.ts' }
const PLAN_SOURCE = { name: 'hayzoUI master plan and contracts (project owner)', url: 'https://github.com/KareemQabil/hayzoui', version: '9b4eb3271c64872768f0a5533796a8a36b67e6eb', license: 'MIT', retrievedAt: cfg.retrievedAt, path: `${TIER_PLAN}; CONTRACTS.md` }
const HOME = { antd: 'https://github.com/ant-design/ant-design', 'antd-pro': 'https://github.com/ant-design/pro-components', mui: 'https://github.com/mui/material-ui', 'mui-x': 'https://github.com/mui/mui-x', mantine: 'https://github.com/mantinedev/mantine', chakra: 'https://github.com/chakra-ui/chakra-ui', 'react-aria': 'https://github.com/adobe/react-spectrum', 'base-ui': 'https://github.com/mui/base-ui', radix: 'https://github.com/radix-ui/primitives', 'headless-ui': 'https://github.com/tailwindlabs/headlessui', 'ag-grid': 'https://github.com/ag-grid/ag-grid', 'tanstack-table': 'https://github.com/TanStack/table', shadcn: cfg.shadcn.repo }
function librarySource(lib) {
  if (lib === 'shadcn') return { name: cfg.shadcn.name, url: HOME.shadcn, version: resolved.shadcn.commit, license: cfg.shadcn.license, retrievedAt: cfg.retrievedAt, path: 'apps/v4/public/r/index.json; apps/v4/registry/new-york-v4/ui' }
  const def = cfg.libraries[lib]
  return { name: def.name, url: HOME[lib], version: def.packages.map((p) => p).join(', '), license: def.license, retrievedAt: cfg.retrievedAt, path: 'published type declarations (npm tarball)' }
}

for (const c of components) {
  if (!c.summary) problems.push(`${c.id}: no summary`)
  if (!c.engines.length) problems.push(`${c.id}: no engines`)
  for (const e of c.engines) if (!engines.has(e)) problems.push(`${c.id}: engine "${e}" is not in docs/ARCHITECTURE.md`)
  if (c.engines.length > 1 && c.engines.includes('none')) problems.push(`${c.id}: "none" cannot be combined with other engines`)
  for (const d of c.dependsOn) if (!ids.has(d)) problems.push(`${c.id}: dependsOn "${d}" does not exist`)
  if (c.dependsOn.includes(c.id)) problems.push(`${c.id}: depends on itself`)
  if (!c.features.length) problems.push(`${c.id}: no features`)
}
if (ids.size !== components.length) problems.push('duplicate component ids')
if (problems.length) { console.error(problems.join('\n')); process.exit(1) }

const stats = { components: components.length, aliases: { verified: 0, unverified: [] }, features: 0, inClaims: 0, inWithEvidence: 0, probes: 0, probesWithoutHit: [], matrix: { components: matrix.components.length, features: matrix.components.reduce((n, m) => n + m.features.length, 0), dropped, unused } }
fs.mkdirSync(OUT, { recursive: true })
const written = new Set()
for (const c of [...components].sort((a, b) => (a.id < b.id ? -1 : 1))) {
  const aliases = []
  for (const lib of Object.keys(c.aliases).sort(order)) for (const a of c.aliases[lib]) {
    const ok = verification.aliases[c.id]?.[`${lib}:${a.name}`]
    if (ok === undefined) { console.error(`${c.id}: alias ${lib}:${a.name} has not been verified; run verify.mjs`); process.exit(1) }
    if (!ok) { stats.aliases.unverified.push(`${c.id}  ${lib}:${a.name}`); continue }
    stats.aliases.verified++
    aliases.push({ library: lib, name: a.name, ...(a.note ? { note: a.note } : {}) })
  }
  const usedLibs = new Set(aliases.map((a) => a.library))
  let seeded = false
  const features = c.features.map((f) => {
    const hits = f.probe ? verification.probes[c.id]?.[f.id] : {}
    if (f.probe && hits === undefined) { console.error(`${c.id}.${f.id}: probe has not been run; run verify.mjs`); process.exit(1) }
    const libs = [...new Set([...f.asserted, ...Object.keys(hits ?? {})])].sort(order)
    for (const l of libs) { if (!LIBS.includes(l)) { console.error(`${c.id}.${f.id}: unknown library ${l}`); process.exit(1) } usedLibs.add(l) }
    const evidence = Object.keys(hits ?? {}).sort(order).map((l) => ({ library: l, symbol: hits[l].symbol, path: hits[l].path }))
    stats.features++
    stats.inClaims += libs.length
    stats.inWithEvidence += evidence.length
    if (f.probe) { stats.probes++; if (!evidence.length) stats.probesWithoutHit.push(`${c.id}.${f.id}`) }
    if (f.origin === 'owner-matrix') seeded = true
    return { id: f.id, name: f.name, priority: f.priority, in: libs, ...(f.arabic ? { arabic: f.arabic } : {}), origin: f.origin, ...(evidence.length ? { evidence } : {}) }
  })
  const arabic = {}
  if (c.arabic.requirements.length) arabic.requirements = c.arabic.requirements
  if (c.arabic.risks.length) arabic.risks = c.arabic.risks
  const sources = [...(seeded ? [MATRIX_SOURCE] : []), PLAN_SOURCE, ...[...usedLibs].sort(order).map(librarySource)]
  const doc = {
    kind: 'component', schemaVersion: 1, id: c.id,
    provenance: {
      method: 'researched', confidence: 'needs-review', sources, script: 'tools/extract/universe/build.mjs',
      notes: 'Judgement entry. Aliases are checked against published exports. A library in a feature\'s `in` is confirmed only where the feature has an `evidence` row for it. Arabic text is written for this file except feature names with origin "owner-matrix".',
    },
    data: {
      id: c.id, name: c.name, summary: c.summary, family: c.family, tier: c.tier, priority: c.priority, engines: c.engines,
      ...(c.anatomy.length ? { anatomy: c.anatomy } : {}), ...(c.dependsOn.length ? { dependsOn: c.dependsOn } : {}),
      aliases, features, ...(Object.keys(arabic).length ? { arabic } : {}), ...(c.decisions.length ? { decisions: c.decisions } : {}), ...(c.notes ? { notes: c.notes } : {}),
    },
  }
  const file = `${c.id}.json`
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(doc, null, 2) + '\n')
  written.add(file)
}
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.json') && !written.has(f)) fs.unlinkSync(path.join(OUT, f))
fs.writeFileSync(path.join(here, 'evidence', 'build-stats.json'), JSON.stringify(stats, null, 1) + '\n')
console.log(`${written.size} components, ${stats.features} features; aliases ${stats.aliases.verified} verified, ${stats.aliases.unverified.length} left out; in-claims ${stats.inClaims}, ${stats.inWithEvidence} with evidence; probes ${stats.probes}, ${stats.probesWithoutHit.length} without any hit; matrix rows unused ${unused.length}, dropped ${dropped.length}`)
