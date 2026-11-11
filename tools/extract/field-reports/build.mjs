#!/usr/bin/env node
// Field reports, step 4: write data/field-reports/<library>.json.
// Joins the researcher's notes (tools/extract/field-reports/curation/<library>.txt — category, components, summary,
// lesson, resolution, all written by hand after reading the issue) with the mechanical fields of the cached
// GitHub API response of each issue (title, state, dates, counts, labels, URL).
//
//   node tools/extract/field-reports/build.mjs <out-dir> --date 2026-11-11 [--only material-ui,mui-x]
//
// When <out-dir>/prs/<owner>__<name>.json exists (search.mjs --prs), each report also gets `fixedBy`.
//
// <out-dir> is the scratch directory filled by search.mjs. An issue that is not in the cached search results
// (`candidates/<owner>__<name>.json`) is an error: nothing is recorded that the API did not return.
//
// Notes format, one block per report, blocks separated by a blank line:
//   #<number> | <category> | <component>, <component> [| needs-review]
//   S: summary in our own words
//   L: lesson, phrased as a requirement on our implementation
//   R: resolution in our own words (optional)
//   | needs-review        (optional last line: the cause or the resolution is the researcher's inference)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { REPOS, repoDir } from './config.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..', '..', '..')
const args = process.argv.slice(2)
const outDir = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--date' && args[args.indexOf(a) - 1] !== '--only')
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : null
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null
if (!outDir || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
  console.error('usage: build.mjs <out-dir> --date YYYY-MM-DD [--only id,id]')
  process.exit(2)
}

const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'schema', 'field-report.schema.json'), 'utf8'))
const CATEGORIES = new Set(schema.properties.data.properties.reports.items.properties.category.enum)

export function parseNotes(text, file) {
  const out = []
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split('\n').map((l) => l.trimEnd()).filter((l) => l && !l.startsWith('//'))
    if (!lines.length) continue
    const head = lines[0].match(/^#(\d+)\s*\|\s*([a-z-]+)\s*\|\s*([^|]*?)\s*(?:\|\s*(needs-review|verified)\s*)?$/)
    if (!head) throw new Error(`${file}: bad header line: ${lines[0]}`)
    const rec = { number: Number(head[1]), category: head[2], components: head[3].split(',').map((s) => s.trim()).filter(Boolean), confidence: head[4] ?? 'verified' }
    if (!CATEGORIES.has(rec.category)) throw new Error(`${file} #${rec.number}: unknown category ${rec.category}`)
    for (const line of lines.slice(1)) {
      const conf = line.match(/^\|\s*(needs-review|verified)\s*$/)
      if (conf) {
        rec.confidence = conf[1]
        continue
      }
      const m = line.match(/^([SLR]):\s*(.+)$/)
      if (!m) throw new Error(`${file} #${rec.number}: bad line: ${line}`)
      rec[{ S: 'summary', L: 'lesson', R: 'resolution' }[m[1]]] = m[2].trim()
    }
    if (!rec.summary || !rec.lesson) throw new Error(`${file} #${rec.number}: summary and lesson are required`)
    out.push(rec)
  }
  const seen = new Set()
  for (const r of out) {
    if (seen.has(r.number)) throw new Error(`${file}: #${r.number} appears twice`)
    seen.add(r.number)
  }
  return out
}

const day = (iso) => iso.slice(0, 10)

// Merged pull requests that name the issue after a closing keyword, merged no earlier than the issue was opened.
function fixedBy(prs, issue) {
  const list = prs
    .filter((p) => p.closes.includes(issue.number) && p.mergedAt && p.mergedAt >= issue.createdAt)
    .sort((a, b) => a.mergedAt.localeCompare(b.mergedAt) || a.number - b.number)
    .map((p) => ({ url: p.url, title: p.title.trim(), mergedAt: day(p.mergedAt) }))
  return list.length ? { fixedBy: list } : {}
}
let total = 0
for (const lib of REPOS) {
  if (only && !only.includes(lib.id)) continue
  const notesFile = path.join(HERE, 'curation', `${lib.id}.txt`)
  if (!fs.existsSync(notesFile)) continue
  const notes = parseNotes(fs.readFileSync(notesFile, 'utf8'), `curation/${lib.id}.txt`)
  const cacheFile = path.join(outDir, 'candidates', `${repoDir(lib.repo)}.json`)
  if (!fs.existsSync(cacheFile)) throw new Error(`${lib.id}: no cached search results (${cacheFile}); run search.mjs first`)
  const cache = new Map(JSON.parse(fs.readFileSync(cacheFile, 'utf8')).candidates.map((c) => [c.number, c]))
  const prFile = path.join(outDir, 'prs', `${repoDir(lib.repo)}.json`)
  const prs = fs.existsSync(prFile) ? JSON.parse(fs.readFileSync(prFile, 'utf8')).prs : []
  const reports = []
  for (const n of notes.sort((a, b) => a.number - b.number)) {
    const issue = cache.get(n.number)
    if (!issue || !issue.url) throw new Error(`${lib.id} #${n.number}: not in the cached API results; it cannot be recorded`)
    const end = issue.closedAt ? Date.parse(issue.closedAt) : Date.parse(`${date}T00:00:00Z`)
    const report = {
      url: issue.url,
      number: issue.number,
      title: issue.title.trim(),
      category: n.category,
      ...(n.components.length ? { components: n.components } : {}),
      summary: n.summary,
      state: issue.state === 'open' || issue.state === 'closed' ? issue.state : 'unknown',
      ...(issue.stateReason ? { stateReason: issue.stateReason } : {}),
      createdAt: day(issue.createdAt),
      ...(issue.closedAt ? { closedAt: day(issue.closedAt) } : {}),
      daysOpen: Math.max(0, Math.round((end - Date.parse(issue.createdAt)) / 86400000)),
      comments: issue.comments ?? 0,
      reactions: issue.reactions ?? 0,
      ...((issue.labels ?? []).length ? { labels: [...issue.labels].sort() } : {}),
      ...(n.resolution ? { resolution: n.resolution } : {}),
      ...fixedBy(prs, issue),
      lesson: n.lesson,
      confidence: n.confidence,
    }
    reports.push(report)
  }
  const lowest = reports.some((r) => r.confidence !== 'verified') ? 'needs-review' : 'verified'
  const doc = {
    kind: 'field-report',
    schemaVersion: 1,
    id: lib.id,
    provenance: {
      method: 'researched',
      confidence: lowest,
      sources: [
        {
          name: `GitHub issues of ${lib.repo}`,
          url: `https://github.com/${lib.repo}/issues`,
          version: `GitHub REST API 2022-11-28, state as of ${date}`,
          license: 'GitHub Terms of Service (user content; only facts and our own summaries are kept)',
          retrievedAt: date,
        },
      ],
      script: 'tools/extract/field-reports/build.mjs',
      notes: 'URL, number, title, state, dates, counts and labels are copied from the API response of each issue. Category, components, summary, resolution and lesson are written by the researcher (tools/extract/field-reports/curation) after reading the issue body returned by the search API and, for the issues listed in docs/research/field-reports.md, the full thread. daysOpen of an open issue is measured to the retrieval date. fixedBy is filled mechanically from merged pull requests that name the issue after a closing keyword. Reports marked needs-review state a cause that the researcher inferred from the symptom without a confirming statement in the issue.',
    },
    data: {
      library: { id: lib.id, name: lib.name, repository: `https://github.com/${lib.repo}` },
      reports,
    },
  }
  const dest = path.join(ROOT, 'data', 'field-reports', `${lib.id}.json`)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, `${JSON.stringify(doc, null, 2)}\n`)
  total += reports.length
  console.log(`${lib.id.padEnd(18)} ${String(reports.length).padStart(3)} reports  (${lowest})`)
}
console.log(`${total} reports written`)
