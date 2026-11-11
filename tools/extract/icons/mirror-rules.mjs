#!/usr/bin/env node
// Builds data/icons/mirror-rules.json from mirror-rules.input.mjs (authored) and checks every cited icon name
// against data/icons/mirror-evidence.json and the source catalogs. Fails on a citation that does not hold.
//   node tools/extract/icons/mirror-rules.mjs
import path from 'node:path'
import { DATA, envelope, loadCatalogs, readJson, RETRIEVED, writeData } from './lib.mjs'
import { principles, rules, sources } from './mirror-rules.input.mjs'

const ev = Object.fromEntries(readJson(path.join(DATA, 'mirror-evidence.json')).data.content.lists.map((l) => [l.id, new Set(l.names)]))
const cat = loadCatalogs()
const sym = new Map(cat['material-symbols'].icons.map((i) => [i.name, i]))
const flu = new Map(cat.fluent.icons.map((i) => [i.name, i]))
const errors = []
const need = (ok, msg) => { if (!ok) errors.push(msg) }
const principleIds = new Set(principles.map((p) => p.id))

const checks = {
  compose: (n) => ev['compose-automirrored'].has(n),
  symbols: (n) => ev['material-symbols-automirrored'].has(n),
  symbolsNot: (n) => sym.get(n)?.autoMirrored === false,
  fluent: (n) => ev['fluent-direction-mirror'].has(n),
  fluentLegacy: (n) => ev['fluent-android-rtl-txt'].has(n),
  fluentUnique: (n) => ev['fluent-direction-unique'].has(n) || ev['fluent-ltr-rtl-assets'].has(n),
  fluentNot: (n) => flu.has(n) && flu.get(n).tags !== undefined && !flu.get(n).direction && !flu.get(n).directionVariant,
}
const shape = {
  compose: ['compose', 'mirror'], symbols: ['material-symbols', 'mirror'], symbolsNot: ['material-symbols', 'not-mirrored'],
  fluent: ['fluent', 'mirror'], fluentLegacy: ['fluent-legacy', 'mirror'], fluentUnique: ['fluent', 'separate-rtl-artwork'], fluentNot: ['fluent', 'not-mirrored'],
}
const out = rules.map((r) => {
  const evidence = []
  for (const [key, [source, says]] of Object.entries(shape)) {
    if (!r[key]) continue
    for (const n of r[key]) need(checks[key](n), `${r.id}: ${key} "${n}" does not hold`)
    evidence.push({ source, says, names: [...r[key]].sort() })
  }
  for (const [key, source] of [['md', 'material-guidelines'], ['hig', 'apple-hig']]) {
    if (!r[key]) continue
    evidence.push({ source, says: r[key][0], ...(r[key][1] ? { note: r[key][1] } : {}) })
  }
  for (const p of r.principles ?? []) need(principleIds.has(p), `${r.id}: unknown principle ${p}`)
  const mechanical = evidence.some((e) => e.names)
  const guidance = evidence.some((e) => !e.names) || (r.principles ?? []).length > 0
  const basis = r.basis ?? (mechanical ? 'mechanical' : guidance ? 'guidance' : 'authored')
  need(!!r.ar && !!r.en, `${r.id}: missing name`)
  return {
    id: r.id, concept: { ar: r.ar, en: r.en }, verdict: r.verdict, reason: r.reason, basis,
    ...(r.principles ? { principles: r.principles } : {}),
    ...(evidence.length ? { evidence } : {}),
    ...(r.disagreement ? { disagreement: r.disagreement } : {}),
    ...(r.condition ? { condition: r.condition } : {}),
    ...(r.recommendation ? { recommendation: r.recommendation } : {}),
    ...(r.arabicSpecific ? { arabicSpecific: true } : {}),
    ...(r.examples ? { examples: r.examples } : {}),
  }
})
need(new Set(out.map((r) => r.id)).size === out.length, 'duplicate rule ids')
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }

const evProv = readJson(path.join(DATA, 'mirror-evidence.json')).provenance.sources
writeData('mirror-rules.json', envelope('mirror-rules', {
  method: 'researched', confidence: 'needs-review',
  sources: [
    ...evProv,
    { name: 'Material Design guidelines — Bidirectionality (Material 1 archive)', url: 'https://m1.material.io/usability/bidirectionality.html', license: 'Guidance re-expressed; no text copied', retrievedAt: RETRIEVED },
    { name: 'Apple Human Interface Guidelines — Right to left', url: 'https://developer.apple.com/design/human-interface-guidelines/right-to-left', license: 'Guidance re-expressed; no text copied', retrievedAt: RETRIEVED },
    { name: 'The Unicode Standard, Arabic code chart', url: 'https://www.unicode.org/charts/PDF/U0600.pdf', license: 'Unicode-3.0', retrievedAt: RETRIEVED },
  ],
  script: 'tools/extract/icons/mirror-rules.mjs',
  notes: 'Verdicts, reasons and recommendations are written by the layer author from the cited sources. Every icon name under `evidence` was checked by the script against mirror-evidence.json or a source catalog. Rules with basis "mechanical" cite at least one per-icon list; "guidance" rules rest on the Material and Apple pages only; "authored" rules have no published source behind the verdict. Arabic concept names are the author\'s and need review by an Arabic speaker. The Material 2 bidirectionality page could not be read by script (client-rendered); the archived Material 1 page was used.',
}, 'mirror-rules', { sources, principles, rules: out }))
const count = (f) => out.filter(f).length
console.log(`rules ${out.length}: auto ${count((r) => r.verdict === 'auto')}, never ${count((r) => r.verdict === 'never')}, conditional ${count((r) => r.verdict === 'conditional')}`)
console.log(`basis: mechanical ${count((r) => r.basis === 'mechanical')}, guidance ${count((r) => r.basis === 'guidance')}, authored ${count((r) => r.basis === 'authored')}; with disagreement ${count((r) => r.disagreement)}; arabicSpecific ${count((r) => r.arabicSpecific)}`)
