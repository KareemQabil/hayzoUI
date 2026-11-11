#!/usr/bin/env node
// Field reports, step 5: every count in the layer report, computed from data/field-reports/*.json only.
//
//   node tools/extract/field-reports/stats.mjs                      print all generated sections
//   node tools/extract/field-reports/stats.mjs --write <report.md>  replace the text between
//        <!-- BEGIN generated:<name> --> and <!-- END generated:<name> --> with the section of that name,
//        and check that every `library#number` reference in the report exists in the data
//
// Sections: libraries, matrix, categories, longest-open, longest-closed, declined, components, fixtures.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const dir = path.join(ROOT, 'data', 'field-reports')
const docs = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
const all = docs.flatMap((d) => d.data.reports.map((r) => ({ ...r, lib: d.id })))
const index = new Map(all.map((r) => [`${r.lib}#${r.number}`, r]))
const count = (xs, f) => xs.filter(f).length
const cats = [...new Set(all.map((r) => r.category))].sort((a, b) => count(all, (r) => r.category === b) - count(all, (r) => r.category === a) || a.localeCompare(b))
const row = (cells) => `| ${cells.join(' | ')} |`
const table = (head, rows) => [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n')
const years = (d) => (d / 365.25).toFixed(1)
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : 0 }
const link = (r) => `[${r.lib}#${r.number}](${r.url})`
const clip = (s, n = 90) => (s.length > n ? `${s.slice(0, n - 1)}…` : s).replace(/\|/g, '/')

// Column groups of the taxonomy matrix. Every library id must be in exactly one group.
const GROUPS = [
  ['MUI', ['material-ui']], ['MUI X', ['mui-x']], ['Ant Design', ['ant-design']], ['Radix + shadcn', ['radix-primitives', 'shadcn-ui']],
  ['React Spectrum', ['react-spectrum']], ['Mantine', ['mantine']], ['Chakra', ['chakra-ui']], ['Fluent', ['fluentui']],
  ['Base UI, Headless UI, Floating UI', ['base-ui', 'headlessui', 'floating-ui']], ['PrimeReact, Tailwind', ['primereact', 'tailwindcss']],
  ['Grids (AG Grid, TanStack)', ['ag-grid', 'tanstack-table']], ['Date libraries and pickers', ['date-fns', 'dayjs', 'moment-hijri', 'react-day-picker', 'react-datepicker']],
  ['Charts', ['recharts', 'chartjs']],
]
const grouped = new Set(GROUPS.flatMap(([, ids]) => ids))
const ungrouped = docs.map((d) => d.id).filter((id) => !grouped.has(id))
if (ungrouped.length) throw new Error(`stats.mjs: libraries missing from GROUPS: ${ungrouped.join(', ')}`)

const sections = {}

sections.libraries = `${all.length} reports in ${docs.length} libraries.\n\n${table(
  ['Library', 'Reports', 'Open', 'Closed', 'of which not planned', 'With a linked fix', 'Verified', 'Needs review', 'Median days open'],
  [
    ...docs.map((d) => {
      const rs = d.data.reports
      return [d.id, rs.length, count(rs, (r) => r.state === 'open'), count(rs, (r) => r.state === 'closed'), count(rs, (r) => r.stateReason === 'not_planned'), count(rs, (r) => r.fixedBy), count(rs, (r) => r.confidence === 'verified'), count(rs, (r) => r.confidence !== 'verified'), median(rs.map((r) => r.daysOpen))]
    }),
    ['**total**', all.length, count(all, (r) => r.state === 'open'), count(all, (r) => r.state === 'closed'), count(all, (r) => r.stateReason === 'not_planned'), count(all, (r) => r.fixedBy), count(all, (r) => r.confidence === 'verified'), count(all, (r) => r.confidence !== 'verified'), median(all.map((r) => r.daysOpen))],
  ],
)}`

sections.matrix = table(
  ['Category', 'Total', ...GROUPS.map(([name]) => name)],
  [
    ...cats.map((c) => [`\`${c}\``, count(all, (r) => r.category === c), ...GROUPS.map(([, ids]) => count(all, (r) => r.category === c && ids.includes(r.lib)) || '')]),
    ['**total**', all.length, ...GROUPS.map(([, ids]) => count(all, (r) => ids.includes(r.lib)))],
  ],
)

sections.categories = table(
  ['Category', 'Reports', 'Libraries', 'Still open', 'Closed not planned', 'Median days open', 'Longest (years)'],
  cats.map((c) => {
    const rs = all.filter((r) => r.category === c)
    return [`\`${c}\``, rs.length, new Set(rs.map((r) => r.lib)).size, count(rs, (r) => r.state === 'open'), count(rs, (r) => r.stateReason === 'not_planned'), median(rs.map((r) => r.daysOpen)), years(Math.max(...rs.map((r) => r.daysOpen)))]
  }),
)

const open = all.filter((r) => r.state === 'open').sort((a, b) => b.daysOpen - a.daysOpen)
sections['longest-open'] = `${open.length} of the ${all.length} reports are open; ${count(open, (r) => r.daysOpen >= 730)} of them for two years or more, ${count(open, (r) => r.daysOpen >= 1461)} for four years or more.\n\n${table(
  ['Report', 'Opened', 'Years open', 'Reactions', 'Category', 'Title'],
  open.filter((r) => r.daysOpen >= 730).map((r) => [link(r), r.createdAt, years(r.daysOpen), r.reactions, `\`${r.category}\``, clip(r.title)]),
)}`

const closed = all.filter((r) => r.state === 'closed').sort((a, b) => b.daysOpen - a.daysOpen)
sections['longest-closed'] = `${count(closed, (r) => r.daysOpen >= 365)} closed reports took a year or more; ${count(closed, (r) => r.daysOpen >= 730)} took two years or more.\n\n${table(
  ['Report', 'Opened', 'Closed', 'Years', 'Outcome', 'Category', 'Title'],
  closed.filter((r) => r.daysOpen >= 730).map((r) => [link(r), r.createdAt, r.closedAt, years(r.daysOpen), r.stateReason === 'not_planned' ? 'not planned' : r.fixedBy ? 'fix linked' : (r.stateReason ?? ''), `\`${r.category}\``, clip(r.title)]),
)}`

const declined = all.filter((r) => r.stateReason === 'not_planned').sort((a, b) => a.lib.localeCompare(b.lib) || a.number - b.number)
sections.declined = `${declined.length} reports were closed as not planned.\n\n${table(['Report', 'Category', 'Days open', 'Title'], declined.map((r) => [link(r), `\`${r.category}\``, r.daysOpen, clip(r.title)]))}`

const comp = new Map()
for (const r of all) for (const c of r.components ?? []) comp.set(c, (comp.get(c) ?? 0) + 1)
sections.components = [...comp].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).filter(([, n]) => n >= 4).map(([c, n]) => `${c} ${n}`).join(' · ')

const proposal = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'extract', 'field-reports', 'fixtures-proposal.json'), 'utf8'))
const missing = proposal.fixtures.flatMap((f) => f.sources.filter((s) => !index.has(s)).map((s) => `${f.id}: ${s}`))
if (missing.length) throw new Error(`fixtures-proposal.json cites reports that are not in data/field-reports:\n  ${missing.join('\n  ')}`)
const ids = proposal.fixtures.map((f) => f.id)
if (new Set(ids).size !== ids.length) throw new Error('fixtures-proposal.json: duplicate fixture id')
const cited = new Set(proposal.fixtures.flatMap((f) => f.sources))
sections.fixtures = `${proposal.fixtures.length} fixtures, citing ${cited.size} of the ${all.length} reports.\n\n${table(
  ['Fixture id', 'Scenario', 'Source reports'],
  proposal.fixtures.map((f) => [`\`${f.id}\``, f.scenario.replace(/\|/g, '/'), f.sources.map((s) => link(index.get(s))).join(', ')]),
)}`

const args = process.argv.slice(2)
if (args[0] === '--write') {
  const file = path.resolve(args[1])
  let text = fs.readFileSync(file, 'utf8')
  for (const [name, body] of Object.entries(sections)) {
    const re = new RegExp(`(<!-- BEGIN generated:${name} -->)[\\s\\S]*?(<!-- END generated:${name} -->)`)
    if (re.test(text)) text = text.replace(re, (_, a, b) => `${a}\n${body}\n${b}`)
  }
  // Every hand-written reference `library#123` must be a report in the data; turn bare ones into links.
  const libIds = docs.map((d) => d.id).sort((a, b) => b.length - a.length).join('|')
  const bad = new Set()
  text = text.replace(new RegExp(`(\\[)?\\b(${libIds})#(\\d+)\\b(\\]\\([^)]*\\))?`, 'g'), (m, lb, lib, num) => {
    const r = index.get(`${lib}#${num}`)
    if (!r) {
      bad.add(`${lib}#${num}`)
      return m
    }
    return link(r)
  })
  if (bad.size) throw new Error(`${path.basename(file)} cites reports that are not in the data: ${[...bad].join(', ')}`)
  fs.writeFileSync(file, text)
  console.log(`updated ${path.relative(ROOT, file)}: ${Object.keys(sections).length} sections available, ${all.length} reports`)
} else {
  for (const [name, body] of Object.entries(sections)) console.log(`\n### ${name}\n\n${body}`)
}
