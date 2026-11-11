#!/usr/bin/env node
// Builds data/icons/core-set.json from core-set.input.txt (authored) and the source catalogs.
//   node tools/extract/icons/core-set.mjs [--report]
// Input line:  id | English name | Arabic name | mirror rule[=verdict] | candidate names…
// A candidate is tried against every catalog (written in that catalog's naming convention); `source:name` is tried
// only for that source and takes precedence; `source:-` records that the source has no such icon. A name is kept
// only if it exists in the catalog — existence is verified, visual equivalence is the author's judgement.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DATA, envelope, loadCatalogs, readJson, readText, RETRIEVED, writeData } from './lib.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const cat = loadCatalogs()
const ORDER = ['lucide', 'tabler', 'phosphor', 'heroicons', 'material-symbols', 'fluent', 'carbon', 'iconoir', 'bootstrap']
// name or published alias -> canonical name (deprecated icons excluded)
const names = Object.fromEntries(ORDER.map((id) => {
  const m = new Map()
  const live = cat[id].icons.filter((i) => !i.deprecated)
  for (const i of live) for (const a of i.aliases ?? []) m.set(a, i.name)
  for (const i of live) m.set(i.name, i.name)
  return [id, m]
}))
const rules = new Map(readJson(path.join(DATA, 'mirror-rules.json')).data.content.rules.map((r) => [r.id, r]))

function variants(source, key) {
  const k = key.replace(/_/g, '-')
  if (source === 'material-symbols' || source === 'fluent') return [k.replace(/-/g, '_')]
  if (source === 'carbon') {
    const parts = k.split('-').filter(Boolean)
    const out = [k, parts.join('--')]
    for (let i = 1; i < parts.length; i++) out.push(parts.slice(0, i).join('-') + '--' + parts.slice(i).join('-'))
    return out
  }
  return [k]
}
const errors = []
const stale = [] // source-specific candidates that are not in that catalog (ignored, listed by --report)
const groups = []
const concepts = []
let group
for (const raw of readText(path.join(here, 'core-set.input.txt')).split('\n')) {
  const line = raw.trim()
  if (!line || line.startsWith('//')) continue
  if (line.startsWith('#')) {
    const [id, en, ar] = line.slice(1).split('|').map((s) => s.trim())
    group = id
    groups.push({ id, name: { ar, en } })
    continue
  }
  const [id, en, ar, ruleSpec, keyText = ''] = line.split('|').map((s) => s.trim())
  if (!id || !en || !ar) { errors.push(`bad line: ${line}`); continue }
  const [ruleId, override] = (ruleSpec || 'non-directional').split('=')
  const rule = rules.get(ruleId)
  if (!rule) { errors.push(`${id}: unknown mirror rule ${ruleId}`); continue }
  const keys = keyText.split(/\s+/).filter(Boolean).map((k) => k.replace(/\?$/, ''))
  const sources = {}
  for (const s of ORDER) {
    const own = keys.filter((k) => k.startsWith(s + ':')).map((k) => k.slice(s.length + 1))
    if (own.includes('-')) continue
    for (const k of own) if (!names[s].has(k)) stale.push(`${id} ${s}:${k}`)
    const generic = keys.filter((k) => !k.includes(':')).flatMap((k) => variants(s, k))
    const hit = [...own, ...generic].find((n) => names[s].has(n))
    if (hit) sources[s] = names[s].get(hit)
  }
  concepts.push({ id, name: { ar, en }, group, mirror: override ?? rule.verdict, mirrorRule: ruleId, sources })
}
const ids = concepts.map((c) => c.id)
for (const id of ids) if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) errors.push(`bad id ${id}`)
if (new Set(ids).size !== ids.length) errors.push('duplicate ids: ' + ids.filter((x, i) => ids.indexOf(x) !== i).join(', '))
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }

const coverage = Object.fromEntries(ORDER.map((s) => [s, concepts.filter((c) => c.sources[s]).length]))
const v = (s) => cat[s].set
writeData('core-set.json', envelope('core-set', {
  method: 'authored', confidence: 'needs-review',
  sources: ORDER.map((s) => ({ name: v(s).name, url: v(s).repository, version: v(s).version, license: v(s).license.spdx, retrievedAt: RETRIEVED, path: `data/icons/sources/${s}.json` })),
  script: 'tools/extract/icons/core-set.mjs',
  notes: 'The concept list, the English and Arabic names and the candidate icon names are authored (tools/extract/icons/core-set.input.txt). The script keeps a source name only when it exists in that source catalog (deprecated icons excluded), so every name under `sources` is verified to exist; that it depicts the same concept is the author\'s judgement and was not checked visually. A source missing from `sources` means no candidate matched, not proof that the set lacks the concept. Arabic names were written by the author, not taken from an authoritative Arabic source: needs review by an Arabic-speaking designer. `mirror` is the verdict of the linked rule in mirror-rules.json, or an explicit override where the concept is one fixed case of a conditional rule.',
}, 'core-set', { sourceIds: ORDER, groups, coverage, concepts }))

console.log(`concepts ${concepts.length}; mirror: auto ${concepts.filter((c) => c.mirror === 'auto').length}, never ${concepts.filter((c) => c.mirror === 'never').length}, conditional ${concepts.filter((c) => c.mirror === 'conditional').length}`)
for (const s of ORDER) console.log(`${s.padEnd(18)} ${String(coverage[s]).padStart(4)}  ${(100 * coverage[s] / concepts.length).toFixed(1)}%`)
const full = concepts.filter((c) => ORDER.every((s) => c.sources[s])).length
const none = concepts.filter((c) => Object.keys(c.sources).length === 0)
console.log(`covered by all nine: ${full}; by none: ${none.length}${none.length ? ' (' + none.map((c) => c.id).join(', ') + ')' : ''}`)
const union = (set) => concepts.filter((c) => set.some((s) => c.sources[s])).length
for (const set of [['lucide', 'tabler'], ['lucide', 'phosphor'], ['lucide', 'material-symbols'], ['lucide', 'tabler', 'phosphor'], ['tabler', 'phosphor']]) console.log(`union ${set.join('+')}: ${union(set)}`)
if (process.argv.includes('--report')) console.log('\nSTALE candidates: ' + stale.join('; '))
if (process.argv.includes('--report')) for (const s of ORDER) console.log(`\nMISSING ${s}: ` + concepts.filter((c) => !c.sources[s]).map((c) => c.id).join(' '))
