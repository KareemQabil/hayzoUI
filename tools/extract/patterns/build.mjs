#!/usr/bin/env node
// Builds data/patterns/<id>.json from the researched definitions in tools/extract/patterns/src/*.mjs.
//   node tools/extract/patterns/build.mjs            write all files
//   node tools/extract/patterns/build.mjs --check    build in memory and compare with what is on disk
// The definitions are hand-researched (see docs/research/patterns.md); this script only normalises them into the
// envelope, attaches the derived parts, and enforces the layer's invariants:
//   - every binding has directionSensitive and rtl, and they agree (directionSensitive <=> rtl != none);
//   - every binding on ArrowLeft/ArrowRight names the rtlDecisions entry that justifies its rtl value;
//   - a debatable binding names a decision that exists in the file;
//   - every key the APG page names in <kbd> (apg-skeleton.json) is bound, or listed in apg.keysNotBound with a reason;
//   - ariaRequired is derived from aria-roles.json for the roles the pattern uses.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { SOURCES, DECISIONS, COMPONENT_ALIASES } from './src/_shared.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..', '..', '..')
const OUT = path.join(ROOT, 'data', 'patterns')
const check = process.argv.includes('--check')
const skeleton = JSON.parse(fs.readFileSync(path.join(HERE, 'apg-skeleton.json'), 'utf8'))
const aria = JSON.parse(fs.readFileSync(path.join(HERE, 'aria-roles.json'), 'utf8'))
const ariaByRole = new Map(aria.roles.map((r) => [r.role, r]))
const pageByDir = new Map(skeleton.patterns.map((p) => [p.dir, p]))

const universeDir = path.join(ROOT, 'data', 'catalog', 'universe')
// Reconciliation with the component universe, when that layer is present.
const universe = fs.existsSync(universeDir) ? new Set(fs.readdirSync(universeDir).map((f) => f.replace('.json', ''))) : null

const defs = []
for (const file of fs.readdirSync(path.join(HERE, 'src')).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort()) {
  const mod = await import(pathToFileURL(path.join(HERE, 'src', file)).href)
  for (const def of mod.default) defs.push({ ...def, file })
}

const errors = []
const ids = new Set()
const outputs = []
for (const def of defs) {
  const err = (m) => errors.push(`${def.id}: ${m}`)
  if (ids.has(def.id)) err('duplicate id')
  ids.add(def.id)
  const pages = def.apg ? [def.apg].flat() : []
  const decisionIds = new Set()
  const keyboard = def.keys.map((b) => {
    const out = { keys: b.keys, action: b.action }
    if (b.when) out.when = b.when
    if (b.optional) out.optional = true
    out.directionSensitive = b.rtl !== 'none'
    out.rtl = b.rtl
    if (b.group) out.group = b.group
    out.origin = b.origin ?? (pages.length ? 'apg' : 'convention')
    if (b.debatable) out.debatable = true
    if (b.decision) {
      out.decision = b.decision
      decisionIds.add(b.decision)
      if (!DECISIONS[b.decision]) err(`unknown decision ${b.decision}`)
      else if (DECISIONS[b.decision].recommendation !== b.rtl && DECISIONS[b.decision].recommendation !== 'do-not-bind') err(`binding ${b.keys} rtl=${b.rtl} contradicts decision ${b.decision}`)
    }
    if (b.debatable && !b.decision) err(`debatable binding ${b.keys} has no decision`)
    const horizontal = b.keys.some((k) => /Arrow(Left|Right)/.test(k))
    if (horizontal && !b.decision) err(`horizontal arrow binding ${b.keys} (${b.action}) has no decision`)
    if (!horizontal && b.rtl !== 'none' && !b.decision) err(`non-horizontal binding ${b.keys} is direction-sensitive without a decision`)
    return out
  })
  for (const d of def.decisions ?? []) decisionIds.add(d)

  // APG completeness
  let apg
  if (pages.length) {
    const bound = new Set(keyboard.flatMap((b) => b.keys))
    const notBound = def.notBound ?? {}
    for (const dir of pages) {
      const page = pageByDir.get(dir)
      if (!page) { err(`no APG page ${dir}`); continue }
      for (const key of page.keys) if (!bound.has(key) && !(key in notBound)) err(`APG page ${dir} names ${key}, which is neither bound nor listed in notBound`)
    }
    apg = { pages }
    const nb = Object.entries(notBound).map(([key, reason]) => ({ key, reason }))
    if (nb.length) apg.keysNotBound = nb
  }

  const roleNames = [...new Set(def.roles.map((r) => r.role))]
  const ariaRequired = roleNames
    .map((role) => ariaByRole.get(role))
    .filter((r) => r && (r.requiredStatesAndProperties.length || r.requiredOwnedElements.length || r.requiredContextRole.length))
    .map((r) => {
      const o = { role: r.role }
      if (r.requiredStatesAndProperties.length) o.requiredStatesAndProperties = r.requiredStatesAndProperties
      if (r.requiredOwnedElements.length) o.requiredOwnedElements = r.requiredOwnedElements
      if (r.requiredContextRole.length) o.requiredContextRole = r.requiredContextRole
      return o
    })
  for (const role of roleNames) if (!ariaByRole.has(role)) err(`role ${role} is not a WAI-ARIA 1.2 role`)

  const keyboardConfidence = def.verified ? 'verified' : 'needs-review'
  const sources = [...new Set([...(pages.length ? ['apg'] : []), 'aria', ...(def.sources ?? []), ...[...decisionIds].flatMap((d) => (DECISIONS[d]?.libraries ?? []).filter((l) => l.checked === 'source-read').map((l) => l.library))])]
    .map((key) => {
      const s = SOURCES[key]
      if (!s) { err(`unknown source ${key}`); return null }
      const out = { name: s.name, url: s.url, version: s.version, license: s.license, retrievedAt: '2026-11-11' }
      if (key === 'apg' && pages.length) out.path = pages.map((d) => pageByDir.get(d)?.file).join(', ')
      return out
    })
    .filter(Boolean)

  const data = { id: def.id, name: { ar: def.ar, en: def.en } }
  data.reference = def.ref ?? { name: `APG: ${pageByDir.get(pages[0])?.title}`, url: pageByDir.get(pages[0])?.url }
  data.roles = def.roles
  if (def.attrs?.length) data.attributes = def.attrs
  data.keyboard = keyboard
  data.focus = def.focus
  if (def.variants) data.variants = def.variants
  if (def.components) {
    data.components = [...new Set(def.components.map((c) => (c in COMPONENT_ALIASES ? COMPONENT_ALIASES[c] : c)).filter(Boolean))]
    for (const c of data.components) if (universe && !universe.has(c)) err(`component ${c} is not in data/catalog/universe`)
  }
  if (def.uses) data.uses = def.uses
  if (def.orientation) data.orientation = def.orientation
  if (apg) data.apg = apg
  if (ariaRequired.length) data.ariaRequired = ariaRequired
  if (decisionIds.size) data.rtlDecisions = [...decisionIds].sort().map((id) => ({ id, ...DECISIONS[id] }))
  data.verification = {
    keyboard: keyboardConfidence,
    ...(def.verified ? { keyboardCheckedAgainst: `APG ${pages.map((d) => pageByDir.get(d)?.file).join(', ')} at ${skeleton.source.commit.slice(0, 12)}` } : {}),
    arabicName: 'needs-review',
    rtl: [...decisionIds].every((d) => DECISIONS[d]?.status !== 'open') ? 'verified' : 'needs-review',
  }
  if (def.notes) data.notes = def.notes
  if (!def.ar || !def.en) err('missing name')
  for (const u of def.uses ?? []) if (!defs.some((d) => d.id === u)) err(`uses unknown pattern ${u}`)

  outputs.push({
    id: def.id,
    doc: {
      kind: 'pattern',
      schemaVersion: 1,
      id: def.id,
      provenance: {
        method: 'researched',
        // The Arabic name is our translation, not from an authoritative Arabic source, so docs/DATA_MODEL.md caps the
        // file at needs-review. data.verification records what was checked per part.
        confidence: 'needs-review',
        sources,
        script: 'tools/extract/patterns/build.mjs',
        notes: `Researched definition in tools/extract/patterns/src/${def.file}. ${def.verified ? 'Every binding was checked against the APG page; ' : 'Bindings are cited but not all checked against a primary source; '}roles and key names are cross-checked mechanically against apg-skeleton.json and aria-roles.json. Arabic name is an unreviewed translation.`,
      },
      data,
    },
  })
}

if (errors.length) {
  console.error(errors.join('\n'))
  console.error(`\n${errors.length} problems; nothing written`)
  process.exit(1)
}
fs.mkdirSync(OUT, { recursive: true })
let changed = 0
for (const { id, doc } of outputs) {
  const text = JSON.stringify(doc, null, 2) + '\n'
  const file = path.join(OUT, `${id}.json`)
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
  if (old !== text) {
    changed++
    if (!check) fs.writeFileSync(file, text)
  }
}
const stale = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter((f) => f.endsWith('.json') && !ids.has(f.replace('.json', ''))) : []
console.log(`${outputs.length} patterns, ${outputs.reduce((n, o) => n + o.doc.data.keyboard.length, 0)} bindings; ${changed} file(s) ${check ? 'differ' : 'written'}${stale.length ? `; stale: ${stale.join(', ')}` : ''}`)
if (check && (changed || stale.length)) process.exit(1)
