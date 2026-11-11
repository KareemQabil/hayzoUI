#!/usr/bin/env node
// Summary of data/patterns: patterns by focus strategy, direction-sensitive bindings per pattern, and every binding
// whose RTL treatment is marked debatable, with the decision that governs it.
//   node tools/extract/patterns/report.mjs [--json]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const DIR = path.join(ROOT, 'data', 'patterns')
const docs = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')))
const patterns = docs.map((d) => d.data)

const byStrategy = {}
for (const p of patterns) (byStrategy[p.focus.strategy] ??= []).push(p.id)
const perPattern = patterns.map((p) => ({
  id: p.id,
  bindings: p.keyboard.length,
  directionSensitive: p.keyboard.filter((k) => k.directionSensitive).length,
  mirror: p.keyboard.filter((k) => k.rtl === 'mirror-horizontal').length,
  visual: p.keyboard.filter((k) => k.rtl === 'visual').length,
  keyboardVerified: p.verification.keyboard === 'verified',
}))
const debatable = patterns.flatMap((p) => p.keyboard.filter((k) => k.debatable).map((k) => ({ pattern: p.id, keys: k.keys.join(', '), group: k.group ?? '', rtl: k.rtl, decision: k.decision })))
const decisions = new Map()
for (const p of patterns) for (const d of p.rtlDecisions ?? []) {
  const e = decisions.get(d.id) ?? { ...d, patterns: [] }
  e.patterns.push(p.id)
  decisions.set(d.id, e)
}
const totals = {
  patterns: patterns.length,
  bindings: perPattern.reduce((n, p) => n + p.bindings, 0),
  directionSensitive: perPattern.reduce((n, p) => n + p.directionSensitive, 0),
  mirror: perPattern.reduce((n, p) => n + p.mirror, 0),
  visual: perPattern.reduce((n, p) => n + p.visual, 0),
  debatable: debatable.length,
  keyboardVerified: perPattern.filter((p) => p.keyboardVerified).length,
  components: [...new Set(patterns.flatMap((p) => p.components ?? []))].sort(),
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ totals, byStrategy, perPattern, debatable, decisions: [...decisions.values()].map(({ libraries, ...d }) => d) }, null, 2))
  process.exit(0)
}
const pad = (s, n) => String(s).padEnd(n)
console.log(`Patterns: ${totals.patterns}   bindings: ${totals.bindings}   direction-sensitive: ${totals.directionSensitive} (mirror-horizontal ${totals.mirror}, visual ${totals.visual})   debatable: ${totals.debatable}   keyboard verified against APG: ${totals.keyboardVerified}`)
console.log('\n== Patterns by focus strategy ==')
for (const [s, ids] of Object.entries(byStrategy).sort()) console.log(`${pad(s, 18)} ${String(ids.length).padStart(2)}  ${ids.join(', ')}`)
console.log('\n== Direction-sensitive bindings per pattern ==')
console.log(`${pad('pattern', 22)} bindings  dir-sens  mirror  visual  kbd-verified`)
for (const p of perPattern) console.log(`${pad(p.id, 22)} ${String(p.bindings).padStart(8)}  ${String(p.directionSensitive).padStart(8)}  ${String(p.mirror).padStart(6)}  ${String(p.visual).padStart(6)}  ${p.keyboardVerified ? 'yes' : 'no'}`)
console.log('\n== Debatable bindings ==')
console.log(`${pad('pattern', 20)} ${pad('keys', 28)} ${pad('group', 16)} ${pad('rtl', 18)} decision`)
for (const d of debatable) console.log(`${pad(d.pattern, 20)} ${pad(d.keys, 28)} ${pad(d.group, 16)} ${pad(d.rtl, 18)} ${d.decision}`)
console.log('\n== RTL decisions ==')
for (const d of [...decisions.values()].sort((a, b) => a.id.localeCompare(b.id))) console.log(`${pad(d.id, 22)} ${pad(d.recommendation, 18)} ${pad(d.status, 10)} ${d.patterns.join(', ')}`)
console.log(`\n== Component ids assumed (${totals.components.length}) ==\n${totals.components.join(', ')}`)
