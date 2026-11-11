#!/usr/bin/env node
// Builds the new rule files in data/rules/ from rules-src/ (hand-written, researched from the cited references).
//   node tools/extract/rules/build-rules.mjs
// Harvested rules are written by harvest.mjs; this script refuses to reuse one of their ids.
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { ROOT, SOURCES, writeData } from './lib/common.mjs'
import { RULES_TEXT } from './rules-src/text.mjs'
import { RULES_UI } from './rules-src/ui.mjs'

const rules = [...RULES_TEXT, ...RULES_UI]
const harvested = new Set(fs.readdirSync(path.join(ROOT, 'data/rules')).map((f) => f.replace('.json', '')).filter((id) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rules', id + '.json'), 'utf8')).data.origin === 'harvested'))
const fixtureSets = new Set(fs.readdirSync(path.join(ROOT, 'data/fixtures')).map((f) => f.replace('.json', '')))
const ids = new Set(harvested)
for (const rule of rules) {
  assert.match(rule.id, /^R-[A-Z][A-Z0-9]*-[0-9]{3}$/)
  assert.ok(!ids.has(rule.id), `duplicate or harvested id ${rule.id}`)
  ids.add(rule.id)
}
// Section numbers were checked against the downloaded text for UAX #9, alreq, CSS Logical, CSS Writing Modes and
// WCAG. For the sources below the headings could not be checked mechanically, so only the topic is kept.
const TOPIC_ONLY = new Set([SOURCES.cssText3.name, SOURCES.cssFonts.name, SOURCES.cssOverflow.name, SOURCES.html.name, SOURCES.apg.name])
const topic = (section) => section.split('; ').map((part) => part.replace(/^[0-9]+(\.[0-9x]+)*\.?\s+/, '')).join('; ')
const sourceByName = new Map(Object.values(SOURCES).map((s) => [s.name, s]))
const pair = ([ar, en]) => ({ ar, en })
const byArea = {}
for (const rule of rules) {
  for (const id of rule.related ?? []) assert.ok(ids.has(id), `${rule.id}: related ${id} does not exist`)
  for (const f of rule.fixtures ?? []) assert.ok(fixtureSets.has(f.split('#')[0]), `${rule.id}: fixture set ${f} does not exist`)
  assert.ok(rule.checks?.length >= 1, `${rule.id}: no checks`)
  const references = rule.references.map((r) => (r.section && TOPIC_ONLY.has(r.name) ? { ...r, section: topic(r.section) } : r))
  const sources = [...new Set(references.map((r) => r.name))].map((name) => sourceByName.get(name))
  writeData(`data/rules/${rule.id}.json`, {
    kind: 'rule',
    schemaVersion: 1,
    id: rule.id,
    provenance: {
      method: 'researched',
      confidence: 'needs-review',
      sources,
      script: 'tools/extract/rules/build-rules.mjs',
      notes: 'Written in this phase from the cited references and re-expressed; the Arabic text is the researcher\'s own wording and needs a native reviewer. The checks are proposals for the harness, not yet run.',
    },
    data: {
      id: rule.id,
      title: pair(rule.title),
      statement: pair(rule.statement),
      rationale: pair(rule.rationale),
      area: rule.area,
      severity: rule.severity,
      appliesTo: rule.appliesTo,
      checks: rule.checks,
      ...(rule.examples ? { examples: rule.examples } : {}),
      ...(rule.related ? { related: rule.related } : {}),
      origin: 'new',
      status: 'proposed',
      references,
      ...(rule.fixtures ? { fixtures: rule.fixtures } : {}),
    },
  })
  ;(byArea[rule.area] ??= []).push(rule.id)
}
// Every rule id a fixture set names must exist.
for (const set of fixtureSets) {
  const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fixtures', set + '.json'), 'utf8'))
  for (const id of [...(doc.data.rules ?? []), ...doc.data.cases.flatMap((c) => c.rules ?? [])]) assert.ok(ids.has(id), `${set}: rule ${id} does not exist`)
}
for (const [area, list] of Object.entries(byArea)) console.log(`${area}: ${list.length} new`)
console.log(`${rules.length} new rules, ${harvested.size} harvested`)
