#!/usr/bin/env node
// Rebuilds the measured tables of docs/research/library-api.md from data/catalog/libraries/*.json:
// per-library counts, the ten largest components of each library, and every prop whose name concerns
// direction, locale, numerals, calendar or clock conventions. Everything between the GENERATED markers is replaced.
//   node tools/extract/catalog/summarize.mjs [--stdout]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const DATA = path.join(ROOT, 'data', 'catalog', 'libraries')
const DOC = path.join(ROOT, 'docs', 'research', 'library-api.md')
const BEGIN = '<!-- BEGIN GENERATED: tools/extract/catalog/summarize.mjs -->'
const END = '<!-- END GENERATED -->'
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

const GROUPS = [
  ['Direction', /^(dir|rtl)$|direction|rtl/i],
  ['Locale and translation', /locale|^lang$|language|translations?$|^intl$|i18n/i],
  ['Numerals and number format', /numberingSystem|numeral|digits?$|decimalSeparator|groupSeparator|thousand|formatOptions|numberFormat|^currency/i],
  ['Calendar, week and clock', /^calendar$|createCalendar|firstDayOfWeek|startOfWeek|^weekend|weekdayFormat|weekdayStyle|hourCycle|ampm$|^ampm|use12Hours|time[zZ]one/],
]

const docs = fs.readdirSync(DATA).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')))
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/</g, '&lt;')
const code = (s) => '`' + String(s).replace(/`/g, "'").replace(/\|/g, '\\|') + '`'
const out = []

out.push('### Counts per library', '')
out.push('`components` counts every record that takes props (compound members such as `Dialog.Root` count individually; pure namespaces do not). `families` is the number of distinct top-level names. `DOM dir` is the number of components that accept the native `dir` attribute through the excluded DOM typings.', '')
out.push('| Library | Package | Version | License | Families | Components | Props | Median props | Aliases folded | DOM props excluded | Style props excluded | DOM dir |')
out.push('|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|')
let totalComponents = 0
let totalProps = 0
for (const d of docs) {
  const l = d.data.library
  const s = d.data.stats
  totalComponents += s.components
  totalProps += s.props
  out.push(`| ${d.id} | ${l.package} | ${l.version.length === 40 ? l.version.slice(0, 12) : l.version} | ${l.license} | ${s.families} | ${s.components} | ${s.props} | ${s.medianProps} | ${s.aliases ?? 0} | ${s.excludedDomProps ?? 0} | ${s.excludedStyleProps ?? 0} | ${s.componentsAcceptingDomDir ?? 0} |`)
}
out.push(`| **total** | | | | | **${totalComponents}** | **${totalProps}** | | | | | |`, '')

out.push('### Ten largest components per library', '')
for (const d of docs) {
  const top = d.data.components.filter((c) => c.props.length > 0).sort((a, b) => b.props.length - a.props.length || cmp(a.name, b.name)).slice(0, 10)
  if (top.length === 0) continue
  out.push(`- **${d.id}** — ${top.map((c) => `${c.name} ${c.props.length}`).join(' · ')}`)
}
out.push('')

out.push('### Shape of the recorded API', '')
out.push('Counted over records that take props. `generic`: has type parameters. `polymorphic`: has an `as`, `component`, `asChild`, `render` or `renderRoot` prop. `slots`: has `slots`, `slotProps`, `classNames`, `styles`, `components`, `componentsProps` or `pt`. `no props`: nothing left after the exclusions. `type cut`: prop types longer than the 200-character limit.', '')
out.push('| Library | Records | Generic | Polymorphic | Slots | No props | With @default | Deprecated props | Type cut |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|')
const POLY = new Set(['as', 'component', 'asChild', 'render', 'renderRoot'])
const SLOTS = new Set(['slots', 'slotProps', 'classNames', 'styles', 'components', 'componentsProps', 'pt'])
for (const d of docs) {
  const cs = d.data.components.filter((c) => c.kind !== 'namespace' && c.kind !== 'registry-item')
  if (cs.length === 0) continue
  const count = (f) => cs.filter(f).length
  const sum = (f) => cs.reduce((n, c) => n + c.props.filter(f).length, 0)
  out.push(`| ${d.id} | ${cs.length} | ${count((c) => c.typeParameters)} | ${count((c) => c.props.some((p) => POLY.has(p.name)))} | ${count((c) => c.props.some((p) => SLOTS.has(p.name)))} | ${count((c) => c.props.length === 0)} | ${sum((p) => p.default)} | ${sum((p) => p.deprecated)} | ${sum((p) => p.type.endsWith('…'))} |`)
}
out.push('')

out.push('### Props that concern direction, locale, numerals, calendar', '')
out.push('Matched on the prop name only, over every recorded prop. A name can match without meaning text direction (`direction` is often a flex or sort direction): the type column shows which. `rtl` in the last column marks types that mention `rtl`.', '')
let matched = 0
for (const [title, re] of GROUPS) {
  out.push(`#### ${title}`, '', '| Library | Prop | Type | rtl | n | Components |', '|---|---|---|---|---:|---|')
  for (const d of docs) {
    const byProp = new Map()
    for (const c of d.data.components) {
      for (const p of c.props) {
        if (!re.test(p.name)) continue
        const key = `${p.name}\u0000${p.type}`
        if (!byProp.has(key)) byProp.set(key, { name: p.name, type: p.type, components: [] })
        byProp.get(key).components.push(c.name)
      }
    }
    for (const e of [...byProp.values()].sort((a, b) => cmp(a.name, b.name) || cmp(a.type, b.type))) {
      matched += e.components.length
      const type = e.type.length > 90 ? e.type.slice(0, 89) + '…' : e.type
      out.push(`| ${d.id} | ${code(e.name)} | ${code(type)} | ${/rtl/i.test(e.type) ? 'rtl' : ''} | ${e.components.length} | ${esc(e.components.join(', '))} |`)
    }
  }
  out.push('')
}
out.push(`${matched} prop occurrences matched in ${docs.length} files.`, '')
const absent = ['numberingSystem', 'numerals', 'calendar', 'dir', 'locale', 'direction'].map((n) => {
  const libs = docs.filter((d) => d.data.components.some((c) => c.props.some((p) => p.name === n))).map((d) => d.id)
  return `- ${code(n)}: ${libs.length ? libs.join(', ') : 'no library'}`
})
out.push('Exact-name presence:', '', ...absent, '')

const generated = [BEGIN, '', ...out, END].join('\n')
if (process.argv.includes('--stdout') || !fs.existsSync(DOC)) {
  process.stdout.write(generated + '\n')
} else {
  const text = fs.readFileSync(DOC, 'utf8')
  const a = text.indexOf(BEGIN)
  const b = text.indexOf(END)
  if (a < 0 || b < 0) throw new Error(`${path.relative(ROOT, DOC)} has no GENERATED markers`)
  fs.writeFileSync(DOC, text.slice(0, a) + generated + text.slice(b + END.length))
  console.log(`rewrote the generated section of ${path.relative(ROOT, DOC)} (${out.length} lines)`)
}
