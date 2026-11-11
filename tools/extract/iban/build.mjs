#!/usr/bin/env node
// Builds data/finance/iban/<ISO2>.json for the Arab League regions that have an IBAN format.
// Zero dependencies (Node 22). Every input is read as text; nothing downloaded is executed.
//
//   node tools/extract/iban/build.mjs \
//     --schwifty  <clone of github.com/mdomke/schwifty> \
//     --swift     <jschaedl/iban-validation clone>/Resource/iban_registry_202402r96.txt \
//     --wikipedia <wikitext of en.wikipedia.org "International Bank Account Number", action=raw> \
//     --ibantools <unpacked npm ibantools>/package/jsnext/ibantools.js \
//     --ibanjs    <unpacked npm iban>/package/iban.js \
//     --phpiban   <globalcitizen/php-iban>/registry.txt \
//     [--check] [--out dir]
//
// Roles of the sources
//   primary    schwifty iban_registry/generated.json: generated mechanically from the SWIFT IBAN registry
//              (MIT). overwrite.json in the same directory is hand-maintained: it adds national check
//              digit positions and the formats that are not in the SWIFT registry ("aspirational");
//              what it sets is named in the notes and is compared with Wikipedia like everything else.
//   core check SWIFT IBAN registry release 96 (verbatim TXT copy kept in jschaedl/iban-validation) and
//              Wikipedia's table. A disagreement between primary and a core check on length, character
//              classes or segment boundaries makes the file needs-review.
//   tertiary   ibantools, iban.js, php-iban: hand-maintained tables. Their disagreements are written to
//              the notes but do not lower the confidence when primary and core checks agree.
//   examples   SWIFT release 96, else php-iban (which copies the registry example). Every example is
//              validated here with ISO 7064 MOD 97-10, the length and the pattern.
//
// Output is deterministic. Exit code: 0 ok, 2 written but an example failed validation, 1 could not run.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RETRIEVED = '2026-11-11'
const SOURCES = {
  schwifty: { name: 'schwifty IBAN registry', url: 'https://github.com/mdomke/schwifty', version: 'd407f23eae5eac2e0acd9a9db53d13ab8c78916f', license: 'MIT', retrievedAt: RETRIEVED, path: 'schwifty/iban_registry/generated.json; schwifty/iban_registry/overwrite.json' },
  swift: { name: 'SWIFT IBAN Registry (copy in jschaedl/iban-validation)', url: 'https://github.com/jschaedl/iban-validation', version: 'release 96, February 2024 (repository commit af9987299645a8f85c703e36b6e7fed409a7fe84)', license: 'SWIFT publication, facts only; repository is MIT', retrievedAt: RETRIEVED, path: 'Resource/iban_registry_202402r96.txt' },
  wikipedia: { name: 'Wikipedia: International Bank Account Number', url: 'https://en.wikipedia.org/wiki/International_Bank_Account_Number', version: 'revision 1383718960 (2026-11-04)', license: 'CC-BY-SA-4.0, facts only', retrievedAt: RETRIEVED, path: 'IBAN formats by country' },
  ibantools: { name: 'ibantools', url: 'https://github.com/Simplify/ibantools', version: '4.5.4', license: 'MIT OR MPL-2.0', retrievedAt: RETRIEVED, path: 'jsnext/ibantools.js (countrySpecs)' },
  ibanjs: { name: 'iban.js', url: 'https://github.com/arhs/iban.js', version: '0.0.14', license: 'MIT', retrievedAt: RETRIEVED, path: 'iban.js' },
  phpiban: { name: 'php-iban registry', url: 'https://github.com/globalcitizen/php-iban', version: '9dd1884d9b62235eceed0918e9538753ec5988cb', license: 'LGPL-3.0, facts only', retrievedAt: RETRIEVED, path: 'registry.txt' },
}

const REGIONS = ['AE', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'JO', 'KM', 'KW', 'LB', 'LY', 'MA', 'MR', 'OM', 'PS', 'QA', 'SA', 'SD', 'SO', 'SY', 'TN', 'YE']
const WIKI_NAMES = { Algeria: 'DZ', Bahrain: 'BH', Comoros: 'KM', Djibouti: 'DJ', Egypt: 'EG', Iraq: 'IQ', Jordan: 'JO', Kuwait: 'KW', Lebanon: 'LB', Libya: 'LY', Mauritania: 'MR', Morocco: 'MA', Oman: 'OM', 'Palestinian territories': 'PS', Palestine: 'PS', 'State of Palestine': 'PS', Qatar: 'QA', 'Saudi Arabia': 'SA', Somalia: 'SO', Sudan: 'SD', Syria: 'SY', Tunisia: 'TN', 'United Arab Emirates': 'AE', Yemen: 'YE' }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const SCRIPT = 'tools/extract/iban/build.mjs'
const argv = process.argv.slice(2)
const flag = (name) => (argv.indexOf(name) >= 0 ? argv[argv.indexOf(name) + 1] : undefined)
const need = (name) => {
  const v = flag(name)
  if (!v) {
    console.error(`missing ${name}; see the header of ${SCRIPT}`)
    process.exit(1)
  }
  return v
}
const checkOnly = argv.includes('--check')
const outDir = path.resolve(flag('--out') ?? path.join(ROOT, 'data', 'finance', 'iban'))

// ---------------------------------------------------------------- helpers

// SWIFT notation "4!a4!n18!c" -> one class letter per character: "aaaannnncccc…"
function expandSpec(spec) {
  let out = ''
  const re = /(\d+)!([nac])/g
  let m
  let consumed = 0
  while ((m = re.exec(spec))) {
    if (m.index !== consumed) throw new Error(`cannot read structure "${spec}"`)
    consumed = re.lastIndex
    out += m[2].repeat(Number(m[1]))
  }
  if (consumed !== spec.length || !out) throw new Error(`cannot read structure "${spec}"`)
  return out
}
const CLASS_RE = { n: '[0-9]', a: '[A-Z]', c: '[A-Z0-9]' }
function classesToRegex(classes) {
  let out = ''
  for (let i = 0; i < classes.length; ) {
    let j = i
    while (j < classes.length && classes[j] === classes[i]) j++
    out += `${CLASS_RE[classes[i]]}{${j - i}}`
    i = j
  }
  return out
}
// ISO 7064 MOD 97-10 as ISO 13616 applies it: move the first four characters to the end, read letters
// as 10..35, and the remainder of the resulting number modulo 97 must be 1.
function mod97(iban) {
  const s = iban.slice(4) + iban.slice(0, 4)
  let r = 0
  for (const ch of s) {
    const v = ch >= '0' && ch <= '9' ? ch : String(ch.charCodeAt(0) - 55)
    for (const d of v) r = (r * 10 + Number(d)) % 97
  }
  return r
}
const range = (a, b) => `${a}-${b}` // half-open, 0-based, within the BBAN

// ---------------------------------------------------------------- readers

function readSchwifty(dir) {
  const base = path.join(dir, 'schwifty', 'iban_registry')
  const generated = JSON.parse(fs.readFileSync(path.join(base, 'generated.json'), 'utf8'))
  const overwrite = JSON.parse(fs.readFileSync(path.join(base, 'overwrite.json'), 'utf8'))
  const out = {}
  for (const r of REGIONS) {
    const g = generated[r]
    const o = overwrite[r]
    if (!g && !o) continue
    const spec = g?.bban_spec ?? o.bban_spec
    const positions = { ...(g?.positions ?? {}), ...(o?.positions ?? {}) }
    out[r] = {
      registered: Boolean(g),
      aspirational: Boolean(o?.aspirational),
      length: g?.iban_length ?? o.iban_length,
      classes: expandSpec(spec),
      overwrittenKeys: Object.keys(o?.positions ?? {}),
      segments: {
        bankCode: positions.bank_code && range(...positions.bank_code),
        branchCode: positions.branch_code && range(...positions.branch_code),
        accountNumber: positions.account_code && range(...positions.account_code),
        nationalCheckDigits: positions.national_checksum_digits && range(...positions.national_checksum_digits),
      },
    }
  }
  return out
}

// The registry TXT is one row per data element and one tab-separated column per country.
function readSwift(file) {
  const rows = fs.readFileSync(file, 'latin1').split(/\r?\n/).map((l) => l.split('\t'))
  const row = (label) => {
    const r = rows.find((x) => x[0].trim() === label)
    if (!r) throw new Error(`SWIFT registry: no row "${label}"`)
    return r
  }
  const codes = row('IBAN prefix country code (ISO 3166)').map((c) => c.trim())
  const pos = (s) => {
    const m = (s ?? '').match(/^\s*(\d+)\s*-\s*(\d+)\s*$/)
    return m ? range(Number(m[1]) - 1, Number(m[2])) : undefined
  }
  const out = {}
  for (const r of REGIONS) {
    const i = codes.indexOf(r)
    if (i < 0) continue
    const cell = (label) => (row(label)[i] ?? '').trim()
    out[r] = {
      length: Number(cell('IBAN length').match(/\d+/)[0]),
      classes: expandSpec(cell('BBAN structure')),
      segments: { bankCode: pos(cell('Bank identifier position within the BBAN')), branchCode: pos(cell('Branch identifier position within the BBAN')) },
      example: cell('IBAN electronic format example').replace(/\s+/g, ''),
    }
  }
  return out
}

function readWikipedia(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  const out = {}
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\|scope="row"\|\s*\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/)
    if (!m || !WIKI_NAMES[m[1]]) continue
    const cells = [lines[i + 1], lines[i + 2], lines[i + 3]].map((l) => (l ?? '').replace(/^\|\s*/, '').trim())
    if (!/^\d+$/.test(cells[0])) continue // the national check digit table has the same row headers
    const region = WIKI_NAMES[m[1]]
    const classes = cells[1].split(',').map((p) => p.trim().match(/^(\d+)([nac])$/))
    if (classes.some((c) => !c)) throw new Error(`Wikipedia: cannot read BBAN format "${cells[1]}" of ${m[1]}`)
    const entry = { length: Number(cells[0]), classes: classes.map((c) => c[2].repeat(Number(c[1]))).join('') }
    // "<code>'''{{color|teal|BH}}'''{{color|olive|kk}} {{color|red|bbbb}} …</code>" -> "BHkkbbbb…"
    const code = (cells[2].match(/<code>(.*?)<\/code>/)?.[1] ?? '').replace(/\{\{color\|[^|}]*\|([^}]*)\}\}/g, '$1').replace(/'''|\s/g, '')
    const fields = code.slice(4)
    if (code.startsWith(`${region}kk`) && /[bsc]/.test(fields) && !/^n+$/.test(fields)) {
      const runs = {}
      for (let p = 0; p < fields.length; p++) {
        const ch = fields[p]
        runs[ch] = runs[ch] ? [runs[ch][0], p + 1, runs[ch][2] && runs[ch][1] === p] : [p, p + 1, true]
      }
      const seg = (ch) => (runs[ch] && runs[ch][2] ? range(runs[ch][0], runs[ch][1]) : undefined)
      entry.segments = { bankCode: seg('b'), branchCode: seg('s'), accountNumber: seg('c'), nationalCheckDigits: seg('x') }
      entry.fieldLength = fields.length
    }
    out[region] = { ...(out[region] ?? {}), ...entry }
  }
  return out
}

function readIbantools(file) {
  const text = fs.readFileSync(file, 'utf8')
  const out = {}
  for (const r of REGIONS) {
    const m = text.match(new RegExp(`\\n    ${r}: \\{([^}]*)\\}`))
    const chars = m?.[1].match(/chars: (\d+)/)
    if (!chars) continue
    const re = m[1].match(/bban_regexp: '([^']*)'/)?.[1]
    let classes
    if (re) {
      classes = ''
      const body = re.replace(/^\^/, '').replace(/\$$/, '')
      const part = /\[(0-9|A-Z|A-Z0-9|0-9A-Z)\]\{(\d+)\}/g
      let p
      let consumed = 0
      while ((p = part.exec(body))) {
        if (p.index !== consumed) break
        consumed = part.lastIndex
        classes += { '0-9': 'n', 'A-Z': 'a', 'A-Z0-9': 'c', '0-9A-Z': 'c' }[p[1]].repeat(Number(p[2]))
      }
      if (consumed !== body.length) throw new Error(`ibantools: cannot read ${r} regexp ${re}`)
    }
    out[r] = { length: Number(chars[1]), classes, registered: /IBANRegistry: true/.test(m[1]) }
  }
  return out
}

function readIbanjs(file) {
  const out = {}
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/new Specification\("([A-Z]{2})",\s*(\d+),\s*"([^"]+)",\s*"([^"]+)"\)/g)) {
    if (!REGIONS.includes(m[1])) continue
    // F = digits, U = upper-case letters, A = alphanumeric
    const classes = [...m[3].matchAll(/([FUAL])(\d{2})/g)].map((p) => ({ F: 'n', U: 'a', A: 'c', L: 'l' })[p[1]].repeat(Number(p[2]))).join('')
    out[m[1]] = { length: Number(m[2]), classes, example: m[4] }
  }
  return out
}

function readPhpIban(file) {
  const [head, ...rows] = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => l.split('|'))
  const col = (name) => head.indexOf(name)
  const out = {}
  for (const row of rows) {
    const r = row[col('country_code')]
    if (!REGIONS.includes(r)) continue
    const span = (a, b) => (row[col(a)] !== '' && row[col(b)] !== '' ? range(Number(row[col(a)]), Number(row[col(b)]) + 1) : undefined)
    out[r] = {
      length: Number(row[col('iban_length')]),
      classes: expandSpec(row[col('bban_format_swift')]),
      registered: row[col('swift_official')] === '1',
      example: row[col('iban_example')],
      segments: { bankCode: span('bban_bankid_start_offset', 'bban_bankid_stop_offset'), branchCode: span('bban_branchid_start_offset', 'bban_branchid_stop_offset'), nationalCheckDigits: span('bban_checksum_start_offset', 'bban_checksum_stop_offset') },
    }
  }
  return out
}

// ---------------------------------------------------------------- build

const S = {
  schwifty: readSchwifty(need('--schwifty')),
  swift: readSwift(need('--swift')),
  wikipedia: readWikipedia(need('--wikipedia')),
  ibantools: readIbantools(need('--ibantools')),
  ibanjs: readIbanjs(need('--ibanjs')),
  phpiban: readPhpIban(need('--phpiban')),
}
const LABEL = { schwifty: 'schwifty', swift: 'SWIFT registry r96', wikipedia: 'Wikipedia', ibantools: 'ibantools', ibanjs: 'iban.js', phpiban: 'php-iban' }
const CORE = ['swift', 'wikipedia']
const TERTIARY = ['ibantools', 'ibanjs', 'phpiban']
const SEGMENT_KEYS = ['bankCode', 'branchCode', 'accountNumber', 'nationalCheckDigits']

const report = []
const failures = []
const noIban = []
const docs = []

for (const region of REGIONS) {
  const p = S.schwifty[region]
  const present = Object.keys(S).filter((k) => S[k][region])
  if (!p) {
    noIban.push({ region, elsewhere: present })
    continue
  }
  const core = []
  const tertiary = []
  const agreeing = { length: ['schwifty'], classes: ['schwifty'] }
  for (const k of [...CORE, ...TERTIARY]) {
    const o = S[k][region]
    if (!o) continue
    const bucket = CORE.includes(k) ? core : tertiary
    if (o.length !== p.length) bucket.push(`length: ${LABEL[k]} has ${o.length}, schwifty has ${p.length}`)
    else agreeing.length.push(k)
    if (o.classes !== undefined) {
      if (o.classes !== p.classes) bucket.push(`BBAN character classes: ${LABEL[k]} has ${classesToRegex(o.classes)}, schwifty has ${classesToRegex(p.classes)}`)
      else agreeing.classes.push(k)
    }
    for (const key of SEGMENT_KEYS) {
      if (!o.segments) continue
      const theirs = o.segments[key]
      const ours = p.segments[key]
      // A source that has no column for a field says nothing about it; one that has the column and leaves it empty does.
      const canSay = k === 'wikipedia' || key === 'bankCode' || key === 'branchCode' || (k === 'phpiban' && key === 'nationalCheckDigits')
      if (!canSay || theirs === ours) continue
      bucket.push(`${key} position in the BBAN: ${LABEL[k]} has ${theirs ?? 'none'}, schwifty has ${ours ?? 'none'}`)
    }
  }

  const lengthDisputed = [...core, ...tertiary].some((d) => d.startsWith('length:'))
  const usable = !(lengthDisputed && !p.registered) // an unregistered format whose length is disputed is not written as a structure
  const pattern = `^${region}[0-9]{2}${classesToRegex(p.classes)}$`

  // Example: the registry's own, else php-iban's copy. Unregistered formats have no official example.
  const candidates = [['swift', S.swift[region]?.example], ['phpiban', S.phpiban[region]?.example], ['ibanjs', S.ibanjs[region]?.example]].filter(([, e]) => e)
  const exampleChecks = candidates.map(([k, e]) => ({ source: k, example: e, ok: e.length === p.length && new RegExp(pattern).test(e) && mod97(e) === 1 }))
  const chosen = p.registered ? exampleChecks.find((c) => c.source !== 'ibanjs') ?? exampleChecks[0] : undefined
  for (const c of exampleChecks) {
    if (c.ok || !usable) continue
    const text = `example ${c.example} from ${LABEL[c.source]} fails (length ${c.example.length}, pattern ${new RegExp(pattern).test(c.example)}, mod 97 = ${mod97(c.example)})`
    if (c === chosen) failures.push(`${region}: ${text}`)
    else tertiary.push(text)
  }

  const segments = [
    { name: 'countryCode', start: 0, length: 2, values: { characterClass: 'a' } },
    { name: 'checkDigits', start: 2, length: 2, values: { characterClass: 'n' } },
  ]
  const covered = new Array(p.classes.length).fill(false)
  const overlaps = []
  for (const key of SEGMENT_KEYS) {
    if (!p.segments[key]) continue
    const [a, b] = p.segments[key].split('-').map(Number)
    for (let i = a; i < b; i++) {
      if (covered[i]) overlaps.push(key)
      covered[i] = true
    }
    const classes = [...new Set(p.classes.slice(a, b))]
    segments.push({ name: key, start: 4 + a, length: b - a, values: { characterClass: classes.length === 1 ? classes[0] : 'mixed' } })
  }
  segments.sort((x, y) => x.start - y.start)
  const uncovered = covered.map((c, i) => (c ? null : i)).filter((i) => i !== null)

  const structure = {}
  if (usable) {
    structure.length = p.length
    structure.pattern = pattern
    structure.charset = /^n+$/.test(p.classes) ? 'digits' : 'alphanumeric'
  }
  structure.checksum = { algorithm: 'ISO 7064 MOD 97-10', description: 'Move the first four characters to the end, replace each letter by its position in the alphabet plus 9 (A=10 … Z=35), and read the result as one number: its remainder modulo 97 must be 1. Check digits are 98 minus the remainder computed with the check digits set to 00.' }
  if (usable) structure.segments = segments
  if (chosen?.ok) structure.example = chosen.example

  const usedSources = ['schwifty', ...present.filter((k) => k !== 'schwifty')].map((k) => SOURCES[k])
  const claims = [{ key: 'swiftRegistered', value: p.registered, asOf: RETRIEVED, confidence: 'verified', sources: [SOURCES.schwifty], note: p.registered ? 'Listed in the SWIFT IBAN registry extract that schwifty is generated from.' : 'Not in the SWIFT IBAN registry extract; schwifty lists the format as aspirational.' }]
  if (!usable) {
    const byLength = new Map()
    for (const k of present) byLength.set(S[k][region].length, [...(byLength.get(S[k][region].length) ?? []), k])
    for (const [len, ks] of [...byLength].sort((x, y) => x[0] - y[0])) claims.push({ key: 'length', value: len, asOf: RETRIEVED, confidence: 'needs-review', sources: ks.map((k) => SOURCES[k]) })
  }
  if (!p.registered) for (const c of exampleChecks) claims.push({ key: 'unofficialExample', value: c.example, asOf: RETRIEVED, confidence: 'needs-review', sources: [SOURCES[c.source]], note: `Not an official example. Length ${c.example.length}; MOD 97-10 ${mod97(c.example) === 1 ? 'passes' : 'fails'}.` })

  const notes = ['Segment start is the 0-based offset in the electronic-format IBAN (no spaces); values.characterClass uses the SWIFT classes n (digits), a (upper-case letters), c (upper-case letters and digits).']
  if (!p.registered) notes.push('This format is not registered with SWIFT. Treat it as a hint for display and soft validation, not as a rule.')
  if (!usable) notes.push('Sources disagree on the length, so no length, pattern or segments are given; see claims.')
  if (usable && uncovered.length) notes.push(`BBAN positions not assigned to a segment by the sources: ${uncovered.join(', ')} (0-based in the BBAN).`)
  if (overlaps.length) notes.push(`Segments overlap: ${[...new Set(overlaps)].join(', ')}.`)
  if (p.overwrittenKeys.length && p.registered) notes.push(`The positions of ${p.overwrittenKeys.join(', ')} come from schwifty's hand-maintained overwrite.json, not from its SWIFT registry extract.`)
  if (core.length) notes.push(`Disagreements with the cross-check sources; the file follows schwifty, which is generated from the current SWIFT registry: ${core.join('; ')}.`)
  if (tertiary.length) notes.push(`Disagreements in other libraries, recorded but not followed: ${tertiary.join('; ')}.`)
  if (chosen) notes.push(`Example from ${LABEL[chosen.source]}${exampleChecks.filter((c) => c !== chosen && c.example === chosen.example).length ? `, identical in ${exampleChecks.filter((c) => c !== chosen && c.example === chosen.example).map((c) => LABEL[c.source]).join(' and ')}` : ''}; validated with MOD 97-10 by ${SCRIPT}.`)
  else if (p.registered) notes.push('No example found in the sources.')

  const confidence = p.registered && core.length === 0 && chosen?.ok && !overlaps.length ? 'verified' : 'needs-review'
  docs.push({
    kind: 'finance',
    schemaVersion: 1,
    id: `iban-${region}`,
    provenance: { method: 'extracted', confidence, sources: usedSources, script: SCRIPT },
    data: { region, dataset: 'iban', structure, claims, notes: notes.join(' ') },
  })
  report.push({ region, registered: p.registered, length: usable ? p.length : '?', spec: usable ? classesToRegex(p.classes) : '-', confidence, example: chosen?.ok ? 'ok' : chosen ? 'FAIL' : '-', agreeLength: agreeing.length.length, core, tertiary })
}

if (!checkOnly) {
  fs.mkdirSync(outDir, { recursive: true })
  for (const doc of docs) fs.writeFileSync(path.join(outDir, `${doc.data.region}.json`), JSON.stringify(doc, null, 2) + '\n')
}

const line = (s = '') => console.log(s)
line(`${checkOnly ? 'checked' : 'wrote'} ${docs.length} IBAN files (${report.filter((r) => r.registered).length} registered with SWIFT, ${report.filter((r) => !r.registered).length} unregistered); verified ${report.filter((r) => r.confidence === 'verified').length}, needs-review ${report.filter((r) => r.confidence !== 'verified').length}`)
line(`no IBAN format in the primary source: ${noIban.map((n) => `${n.region}${n.elsewhere.length ? ` (but present in ${n.elsewhere.join(', ')})` : ''}`).join(', ') || 'none'}`)
line()
line('region  swift  len  example  confidence    sources agreeing on length  BBAN')
for (const r of report) line(`${r.region.padEnd(8)}${(r.registered ? 'yes' : 'no').padEnd(7)}${String(r.length).padEnd(5)}${r.example.padEnd(9)}${r.confidence.padEnd(14)}${String(r.agreeLength).padEnd(28)}${r.spec}`)
line()
for (const r of report) {
  for (const d of r.core) line(`${r.region} core: ${d}`)
  for (const d of r.tertiary) line(`${r.region} tertiary: ${d}`)
}
if (failures.length) {
  line()
  line(`FAILURES (${failures.length}):`)
  for (const f of failures) line(`  ${f}`)
}
process.exit(failures.length ? 2 : 0)
