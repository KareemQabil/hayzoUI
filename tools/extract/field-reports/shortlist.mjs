#!/usr/bin/env node
// Field reports, step 2: rank the candidates of one repository so a reader can pick the ones worth opening.
// Mechanical only: it scores, it does not decide. Reads <out-dir>/candidates/<repo>.json written by search.mjs.
//
//   node tools/extract/field-reports/shortlist.mjs <out-dir> <owner/name> [--min 4] [--limit 400]
//
// Prints one line per candidate: score, number, state, year opened, days open, comments, reactions, title, labels.
import fs from 'node:fs'
import path from 'node:path'
import { repoDir } from './config.mjs'

const args = process.argv.slice(2)
const [outDir, repo] = args.filter((a) => !a.startsWith('--') && !/^\d+$/.test(a))
const num = (name, d) => (args.includes(name) ? Number(args[args.indexOf(name) + 1]) : d)
const min = num('--min', 4)
const limit = num('--limit', 400)

const STRONG = /\b(rtl|right[- ]to[- ]left|arabic|bidi|bidirectional|hijri|hebrew|persian|farsi|jalali|jalaali|islamic|umm[- ]al[- ]qura|direction|dir\b|mirror(ed|ing)?|logical propert|numerals?|ltr|eastern arabic|urdu|iran)/i
const LABEL = /rtl|bidi|i18n|l10n|internationali|locali|direction/i

export function score(c) {
  let s = 0
  if (STRONG.test(c.title)) s += 5
  if (/\brtl\b|right[- ]to[- ]left|arabic|hijri|bidi/i.test(c.title)) s += 2
  if (c.labels.some((l) => LABEL.test(l))) s += 3
  const hits = (c.body.match(/\b(rtl|right[- ]to[- ]left|arabic|bidi|hijri|hebrew|persian|farsi)\b/gi) ?? []).length
  s += Math.min(3, hits)
  s += Math.min(3, Math.floor(Math.log2(1 + c.reactions)))
  s += Math.min(2, Math.floor(Math.log2(1 + c.comments) / 2))
  s += Math.min(2, c.matchedTerms.length - 1)
  return s
}

export const daysOpen = (c, now = Date.now()) => Math.round(((c.closedAt ? Date.parse(c.closedAt) : now) - Date.parse(c.createdAt)) / 86400000)

if (import.meta.url === `file://${process.argv[1]}`) {
  const { candidates } = JSON.parse(fs.readFileSync(path.join(outDir, 'candidates', `${repoDir(repo)}.json`), 'utf8'))
  const rows = candidates
    .map((c) => ({ c, s: score(c) }))
    .filter((r) => r.s >= min)
    .sort((a, b) => b.s - a.s || a.c.number - b.c.number)
    .slice(0, limit)
  for (const { c, s } of rows) {
    console.log([s, `#${c.number}`, c.state === 'open' ? 'OPEN' : c.stateReason === 'not_planned' ? 'np' : 'cl', c.createdAt.slice(0, 4), `${daysOpen(c)}d`, `c${c.comments}`, `r${c.reactions}`, c.title.slice(0, 100)].join(' '))
  }
  console.error(`${rows.length} of ${candidates.length} candidates at score >= ${min}`)
}
