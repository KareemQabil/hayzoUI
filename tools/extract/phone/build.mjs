#!/usr/bin/env node
// Extracts the numbering plans of the 22 Arab League regions from Google's libphonenumber and
// writes data/phone/<ISO2>.json. Zero dependencies (Node 22).
//
//   git clone --depth 1 --branch v9.0.43 --filter=blob:none --sparse https://github.com/google/libphonenumber <dir>
//   git -C <dir> sparse-checkout set --no-cone /resources/PhoneNumberMetadata.xml /resources/carrier/en/ /resources/carrier/ar/ /LICENSE /release_notes.txt
//   node tools/extract/phone/build.mjs <dir>            write the files, then verify them
//   node tools/extract/phone/build.mjs <dir> --check    verify only, write nothing
//
// The checkout is read as data: PhoneNumberMetadata.xml, carrier/en/<code>.txt, carrier/ar/<code>.txt,
// release_notes.txt (to confirm the release) and .git/HEAD (to confirm the commit). Nothing is executed.
// To read another release pass --tag, --commit and --retrieved; the pinned values below are what the
// committed data was produced from.
//
// Output is deterministic: the same checkout always produces byte-identical files.
// Exit code: 0 = written and every check passed, 2 = written but a check failed, 1 = could not run.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PINNED = { tag: 'v9.0.43', commit: '86ea33cee5c22ab7e23b3de368e7cc7fa439a2b7', retrievedAt: '2026-11-11' }

const REGIONS = ['AE', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'JO', 'KM', 'KW', 'LB', 'LY', 'MA', 'MR', 'OM', 'PS', 'QA', 'SA', 'SD', 'SO', 'SY', 'TN', 'YE']

// libphonenumber's PhoneNumberType order; these are the element names of the metadata DTD.
const TYPES = ['fixedLine', 'mobile', 'tollFree', 'premiumRate', 'sharedCost', 'voip', 'personalNumber', 'pager', 'uan', 'voicemail']

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const SCRIPT = 'tools/extract/phone/build.mjs'

// ---------------------------------------------------------------- arguments

const argv = process.argv.slice(2)
const flag = (name) => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}
const checkOnly = argv.includes('--check')
const src = argv.find((a, i) => !a.startsWith('--') && !['--tag', '--commit', '--retrieved', '--out'].includes(argv[i - 1]))
if (!src) {
  console.error('usage: node tools/extract/phone/build.mjs <libphonenumber checkout> [--check] [--out dir] [--tag vX --commit sha --retrieved YYYY-MM-DD]')
  process.exit(1)
}
const outDir = path.resolve(flag('--out') ?? path.join(ROOT, 'data', 'phone'))
const source = { tag: flag('--tag') ?? PINNED.tag, commit: flag('--commit') ?? PINNED.commit, retrievedAt: flag('--retrieved') ?? PINNED.retrievedAt }

const read = (rel) => fs.readFileSync(path.join(src, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(src, rel))

// The release notes start with "<date>: <tag>"; .git/HEAD of a detached checkout holds the commit.
const headline = read('release_notes.txt').split('\n')[0].trim()
if (!headline.endsWith(`: ${source.tag}`)) {
  console.error(`release_notes.txt says "${headline}", expected ${source.tag}. Pass --tag/--commit/--retrieved to read another release.`)
  process.exit(1)
}
if (exists('.git/HEAD')) {
  const head = read('.git/HEAD').trim()
  if (/^[0-9a-f]{40}$/.test(head) && head !== source.commit) {
    console.error(`checkout is at ${head}, expected ${source.commit}. Pass --tag/--commit/--retrieved to read another release.`)
    process.exit(1)
  }
}

// ---------------------------------------------------------------- a small XML reader

// Enough XML for PhoneNumberMetadata.xml: elements, attributes, text, comments, a DOCTYPE with an
// internal subset, the five predefined entities and numeric character references.
function decode(s) {
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|lt|gt|amp|quot|apos);/g, (_, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
    return { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }[e]
  })
}
function parseXml(text) {
  const token = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[\s\S]*?\]\s*>|<\/([\w.:-]+)\s*>|<([\w.:-]+)((?:\s+[\w.:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g
  const root = { name: '#root', attrs: {}, children: [], text: '' }
  const stack = [root]
  let m
  let consumed = 0
  while ((m = token.exec(text))) {
    if (m.index !== consumed) throw new Error(`XML: unexpected content at offset ${consumed}`)
    consumed = token.lastIndex
    const top = stack[stack.length - 1]
    if (m[1]) {
      if (top.name !== m[1]) throw new Error(`XML: </${m[1]}> closes <${top.name}>`)
      stack.pop()
    } else if (m[2]) {
      const node = { name: m[2], attrs: {}, children: [], text: '' }
      for (const a of m[3].matchAll(/([\w.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) node.attrs[a[1]] = decode(a[2] ?? a[3])
      top.children.push(node)
      if (!m[4]) stack.push(node)
    } else if (m[5]) {
      top.text += decode(m[5])
    }
  }
  if (consumed !== text.length) throw new Error(`XML: unexpected content at offset ${consumed}`)
  if (stack.length !== 1) throw new Error(`XML: <${stack[stack.length - 1].name}> is not closed`)
  return root
}
const child = (node, name) => node.children.find((c) => c.name === name)
const children = (node, name) => node.children.filter((c) => c.name === name)
// libphonenumber removes all whitespace from patterns; the XML wraps them over several lines.
const squash = (s) => s.replace(/\s+/g, '')

// "9", "7,9", "[8-10]", "[5-7],9" -> sorted integers
function parseLengths(spec) {
  const out = new Set()
  for (const part of spec.split(',')) {
    const range = part.trim().match(/^\[(\d+)-(\d+)\]$/)
    if (range) for (let n = Number(range[1]); n <= Number(range[2]); n++) out.add(n)
    else if (/^\d+$/.test(part.trim())) out.add(Number(part.trim()))
    else throw new Error(`possibleLengths: cannot read "${spec}"`)
  }
  return [...out].sort((a, b) => a - b)
}

// ---------------------------------------------------------------- carrier files

// Lines are "<calling code + national prefix digits>|<carrier name>"; '#' starts a comment.
function readCarrier(lang, callingCode) {
  const rel = `resources/carrier/${lang}/${callingCode}.txt`
  if (!exists(rel)) return null
  const rows = []
  for (const line of read(rel).split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const bar = t.indexOf('|')
    const prefix = t.slice(0, bar)
    const name = t.slice(bar + 1).trim()
    if (bar < 0 || !prefix.startsWith(callingCode) || !/^\d+$/.test(prefix) || !name) throw new Error(`${rel}: cannot read "${t}"`)
    rows.push({ prefix: prefix.slice(callingCode.length), name })
  }
  return rows
}
const hasArabicLetters = (s) => /[ء-يٱ-ۓ]/.test(s)

// ---------------------------------------------------------------- extraction

const xml = parseXml(read('resources/PhoneNumberMetadata.xml'))
const territories = children(child(child(xml, 'phoneNumberMetadata'), 'territories'), 'territory')
const byCallingCode = new Map()
for (const t of territories) {
  const list = byCallingCode.get(t.attrs.countryCode) ?? []
  list.push(t.attrs.id)
  byCallingCode.set(t.attrs.countryCode, list)
}

const KNOWN_TERRITORY_ATTRS = new Set(['id', 'countryCode', 'internationalPrefix', 'preferredInternationalPrefix', 'nationalPrefix', 'nationalPrefixForParsing', 'nationalPrefixTransformRule', 'nationalPrefixFormattingRule', 'nationalPrefixOptionalWhenFormatting', 'carrierCodeFormattingRule', 'mainCountryForCode', 'leadingDigits', 'mobileNumberPortableRegion', 'preferredExtnPrefix', 'leadingZeroPossible'])
const KNOWN_FORMAT_ATTRS = new Set(['pattern', 'nationalPrefixFormattingRule', 'nationalPrefixOptionalWhenFormatting', 'carrierCodeFormattingRule'])
const notExtracted = [] // anything the model below does not carry; reported, never dropped silently
const operatorsWithoutArabic = []

function describe(node) {
  const lengths = child(node, 'possibleLengths')
  const out = { pattern: squash(child(node, 'nationalNumberPattern').text) }
  out.possibleLengths = lengths ? parseLengths(lengths.attrs.national) : []
  if (lengths?.attrs.localOnly) out.possibleLengthsLocalOnly = parseLengths(lengths.attrs.localOnly)
  const example = child(node, 'exampleNumber')
  if (example) out.example = example.text.trim()
  return out
}

function extract(region) {
  const t = territories.find((x) => x.attrs.id === region)
  if (!t) throw new Error(`${region}: no <territory> in PhoneNumberMetadata.xml`)
  const a = t.attrs
  for (const k of Object.keys(a)) if (!KNOWN_TERRITORY_ATTRS.has(k)) notExtracted.push(`${region}: territory attribute ${k}`)
  for (const k of ['preferredExtnPrefix', 'leadingZeroPossible']) if (k in a) notExtracted.push(`${region}: territory attribute ${k}`)
  const np = a.nationalPrefix

  // $NP is the national prefix and $FG the first group; libphonenumber resolves both when it compiles the metadata.
  const resolveRule = (rule) => rule.replace(/\$NP/g, np ?? '').replace(/\$FG/g, '$1')

  const numberTypes = {}
  for (const type of TYPES) {
    const node = child(t, type)
    if (node) numberTypes[type] = describe(node)
  }

  // generalDesc has a pattern only; libphonenumber derives its lengths as the union over the types.
  const union = (key) => [...new Set(Object.values(numberTypes).flatMap((d) => d[key] ?? []))].sort((x, y) => x - y)
  const general = { pattern: squash(child(child(t, 'generalDesc'), 'nationalNumberPattern').text), possibleLengths: union('possibleLengths') }
  const localOnly = union('possibleLengthsLocalOnly').filter((n) => !general.possibleLengths.includes(n))
  if (localOnly.length) general.possibleLengthsLocalOnly = localOnly

  const formats = []
  for (const f of children(child(t, 'availableFormats') ?? { children: [] }, 'numberFormat')) {
    for (const k of Object.keys(f.attrs)) if (!KNOWN_FORMAT_ATTRS.has(k)) notExtracted.push(`${region}: numberFormat attribute ${k}`)
    const out = { pattern: f.attrs.pattern, format: child(f, 'format').text.trim() }
    const leading = children(f, 'leadingDigits').map((l) => squash(l.text))
    if (leading.length) out.leadingDigits = leading
    const rule = f.attrs.nationalPrefixFormattingRule ?? a.nationalPrefixFormattingRule
    if (rule) out.nationalPrefixFormattingRule = resolveRule(rule)
    const optional = f.attrs.nationalPrefixOptionalWhenFormatting ?? a.nationalPrefixOptionalWhenFormatting
    if (optional === 'true') out.nationalPrefixOptionalWhenFormatting = true
    const carrier = f.attrs.carrierCodeFormattingRule ?? a.carrierCodeFormattingRule
    if (carrier) out.domesticCarrierCodeFormattingRule = resolveRule(carrier)
    const intl = children(f, 'intlFormat').map((i) => i.text.trim())
    if (intl.length > 1) throw new Error(`${region}: more than one <intlFormat>`)
    if (intl[0] === 'NA') out.nationalOnly = true
    else if (intl.length && intl[0] !== out.format) out.intlFormat = intl[0]
    formats.push(out)
  }

  // Carriers: group the prefixes of each English name; take the Arabic name of a group from
  // carrier/ar only when every prefix of the group has the same name there and it is in Arabic script.
  const en = readCarrier('en', a.countryCode)
  const ar = new Map((readCarrier('ar', a.countryCode) ?? []).map((r) => [r.prefix, r.name]))
  const operators = []
  for (const row of en ?? []) {
    let op = operators.find((o) => o.name.en === row.name)
    if (!op) operators.push((op = { name: { en: row.name }, prefixes: [] }))
    op.prefixes.push(row.prefix)
  }
  for (const op of operators) {
    const names = [...new Set(op.prefixes.map((p) => ar.get(p)))]
    if (names.length === 1 && names[0] && hasArabicLetters(names[0])) op.name = { ar: names[0], en: op.name.en }
    else operatorsWithoutArabic.push({ region, en: op.name.en, arFile: names.filter(Boolean) })
  }

  const sharing = byCallingCode.get(a.countryCode).filter((id) => id !== region)
  const data = { region, callingCode: a.countryCode }
  if (a.internationalPrefix) data.internationalPrefix = a.internationalPrefix
  if (a.preferredInternationalPrefix) data.preferredInternationalPrefix = a.preferredInternationalPrefix
  if (np) data.nationalPrefix = np
  if (a.nationalPrefixForParsing) data.nationalPrefixForParsing = squash(a.nationalPrefixForParsing)
  if (a.nationalPrefixTransformRule) data.nationalPrefixTransformRule = a.nationalPrefixTransformRule
  if (a.mainCountryForCode === 'true') data.mainCountryForCode = true
  if (sharing.length) data.sharesCallingCodeWith = sharing
  if (a.leadingDigits) data.leadingDigits = squash(a.leadingDigits)
  if (a.mobileNumberPortableRegion === 'true') data.mobileNumberPortable = true
  data.general = general
  data.numberTypes = numberTypes
  const nid = child(t, 'noInternationalDialling')
  if (nid) data.noInternationalDialling = describe(nid)
  data.formats = formats
  if (operators.length) data.operators = operators

  return {
    kind: 'phone',
    schemaVersion: 1,
    id: region,
    provenance: {
      method: 'extracted',
      confidence: 'verified',
      sources: [
        {
          name: 'Google libphonenumber',
          url: 'https://github.com/google/libphonenumber',
          version: `${source.tag} (${source.commit})`,
          license: 'Apache-2.0',
          retrievedAt: source.retrievedAt,
          path: `resources/PhoneNumberMetadata.xml; resources/carrier/en/${a.countryCode}.txt${ar.size ? `; resources/carrier/ar/${a.countryCode}.txt` : ''}`,
        },
      ],
      script: SCRIPT,
    },
    data,
  }
}

// ---------------------------------------------------------------- verification

// A tiny parser and formatter that reads nothing but the produced document, so that it checks the
// data and not the extractor. It follows libphonenumber's rules for the cases these 22 regions need.
const full = (re, s) => new RegExp(`^(?:${re})$`).test(s)
const startsWith = (re, s) => new RegExp(`^(?:${re})`).test(s)

// Arabic-Indic (U+0660..0669) and Extended Arabic-Indic (U+06F0..06F9) digits to ASCII, then digits only.
const toAscii = (s) => s.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
const digitsOnly = (s) => toAscii(s).replace(/\D/g, '')
const toArabicIndic = (s) => s.replace(/[0-9]/g, (c) => String.fromCharCode(0x0660 + Number(c)))
const toExtendedArabicIndic = (s) => s.replace(/[0-9]/g, (c) => String.fromCharCode(0x06f0 + Number(c)))

function chooseFormat(d, national, international) {
  for (const f of d.formats) {
    if (international && f.nationalOnly) continue
    if (f.leadingDigits && !startsWith(f.leadingDigits[f.leadingDigits.length - 1], national)) continue
    if (full(f.pattern, national)) return f
  }
  return null
}
function formatNational(d, national) {
  const f = chooseFormat(d, national, false)
  if (!f) return null
  // The national-prefix rule replaces the first group reference of the format.
  const template = f.nationalPrefixFormattingRule ? f.format.replace(/\$\d/, f.nationalPrefixFormattingRule) : f.format
  return national.replace(new RegExp(`^(?:${f.pattern})$`), template)
}
function formatInternational(d, national) {
  const f = chooseFormat(d, national, true)
  if (!f) return null
  return `+${d.callingCode} ${national.replace(new RegExp(`^(?:${f.pattern})$`), f.intlFormat ?? f.format)}`
}
// National input -> national significant number: drop the trunk prefix when what is left is still a valid number.
function parseNational(d, input) {
  const digits = digitsOnly(input)
  const prefix = d.nationalPrefixForParsing ?? d.nationalPrefix
  if (prefix) {
    const m = digits.match(new RegExp(`^(?:${prefix})`))
    if (m && m[0].length > 0) {
      const rest = d.nationalPrefixTransformRule ? digits.replace(new RegExp(`^(?:${prefix})`), d.nationalPrefixTransformRule) : digits.slice(m[0].length)
      if (!full(d.general.pattern, digits) || full(d.general.pattern, rest)) return rest
    }
  }
  return digits
}
function parseInternational(d, input) {
  const digits = digitsOnly(input)
  return digits.startsWith(d.callingCode) ? digits.slice(d.callingCode.length) : null
}

function verify(doc) {
  const d = doc.data
  const failures = []
  const info = []
  let examples = 0
  let roundTrips = 0
  const fail = (m) => failures.push(`${d.region}: ${m}`)

  for (const f of d.formats) {
    try {
      new RegExp(f.pattern)
      for (const l of f.leadingDigits ?? []) new RegExp(l)
    } catch (e) {
      fail(`format ${f.pattern} does not compile: ${e.message}`)
    }
  }
  for (const [type, t] of Object.entries(d.numberTypes)) {
    try {
      new RegExp(t.pattern)
    } catch (e) {
      fail(`${type} pattern does not compile: ${e.message}`)
      continue
    }
    if (!t.possibleLengths.length) fail(`${type} has no possible lengths`)
    for (const n of t.possibleLengths) if (!d.general.possibleLengths.includes(n)) fail(`${type} length ${n} missing from general lengths`)
    if (!t.example) {
      fail(`${type} has no example number`)
      continue
    }
    const ex = t.example
    examples++
    if (!full(t.pattern, ex)) fail(`${type} example ${ex} does not match its own pattern`)
    if (!t.possibleLengths.includes(ex.length)) fail(`${type} example ${ex} has length ${ex.length}, not one of ${t.possibleLengths.join(',')}`)
    if (!full(d.general.pattern, ex)) fail(`${type} example ${ex} does not match the general pattern`)
    const also = Object.entries(d.numberTypes).filter(([other, o]) => other !== type && full(o.pattern, ex)).map(([other]) => other)
    if (also.length) info.push(`${d.region}: ${type} example ${ex} also matches ${also.join(', ')}`)

    // Round trips: national, international, E.164, and both Arabic digit sets.
    const nat = formatNational(d, ex)
    const intl = formatInternational(d, ex)
    if (nat === null) {
      fail(`${type} example ${ex} matches no format`)
      continue
    }
    const cases = [
      ['national', nat, parseNational(d, nat)],
      ['national, Arabic-Indic digits', toArabicIndic(nat), parseNational(d, toArabicIndic(nat))],
      ['national, Extended Arabic-Indic digits', toExtendedArabicIndic(nat), parseNational(d, toExtendedArabicIndic(nat))],
      ['E.164', `+${d.callingCode}${ex}`, parseInternational(d, `+${d.callingCode}${ex}`)],
    ]
    if (intl === null) info.push(`${d.region}: ${type} example ${ex} has no international format (national-only rule)`)
    else cases.push(['international', intl, parseInternational(d, intl)], ['international, Arabic-Indic digits', toArabicIndic(intl), parseInternational(d, toArabicIndic(intl))])
    for (const [label, text, back] of cases) {
      roundTrips++
      if (back !== ex) fail(`${type} example ${ex} -> ${label} "${text}" -> parsed back as ${back}`)
    }
    // A number typed with the trunk prefix after the calling code ("+20 010 …") is a common input error;
    // record whether dropping that prefix recovers the number, without counting it as a failure.
    if (d.nationalPrefix) {
      const typed = `+${d.callingCode}${d.nationalPrefix}${ex}`
      const rest = parseInternational(d, typed)
      if (parseNational(d, rest) !== ex) info.push(`${d.region}: ${type} "${typed}" (trunk prefix kept after the calling code) is not recovered by dropping the prefix`)
    }
  }

  // Every operator prefix should be the beginning of some valid number (sampled, deterministic).
  const patterns = Object.values(d.numberTypes)
  const lengths = d.general.possibleLengths
  for (const op of d.operators ?? []) {
    for (const prefix of op.prefixes) {
      let ok = false
      for (const len of lengths) {
        if (len < prefix.length) continue
        for (let digit = 0; digit <= 9 && !ok; digit++) {
          const candidate = prefix + String(digit).repeat(len - prefix.length)
          ok = patterns.some((t) => full(t.pattern, candidate))
        }
        if (ok) break
      }
      if (!ok) info.push(`${d.region}: operator ${op.name.en} prefix ${prefix} did not complete to a valid number in the sample`)
    }
  }
  return { failures, info, examples, roundTrips }
}

// ---------------------------------------------------------------- run

const docs = REGIONS.map(extract)
if (!checkOnly) {
  fs.mkdirSync(outDir, { recursive: true })
  for (const doc of docs) fs.writeFileSync(path.join(outDir, `${doc.id}.json`), JSON.stringify(doc, null, 2) + '\n')
}

let failures = []
let info = []
let examples = 0
let roundTrips = 0
const typeCount = {}
let formatCount = 0
let operatorCount = 0
let operatorPrefixCount = 0
let arabicNames = 0
for (const doc of docs) {
  const r = verify(doc)
  failures = failures.concat(r.failures)
  info = info.concat(r.info)
  examples += r.examples
  roundTrips += r.roundTrips
  for (const type of Object.keys(doc.data.numberTypes)) typeCount[type] = (typeCount[type] ?? 0) + 1
  formatCount += doc.data.formats.length
  for (const op of doc.data.operators ?? []) {
    operatorCount++
    operatorPrefixCount += op.prefixes.length
    if (op.name.ar) arabicNames++
  }
}

const line = (s = '') => console.log(s)
line(`libphonenumber ${source.tag} (${source.commit})`)
line(`${checkOnly ? 'checked' : 'wrote'} ${docs.length} regions${checkOnly ? '' : ` to ${path.relative(ROOT, outDir) || outDir}`}`)
line(`number types: ${Object.values(typeCount).reduce((x, y) => x + y, 0)} (${TYPES.filter((t) => typeCount[t]).map((t) => `${t} ${typeCount[t]}`).join(', ')})`)
line(`formats: ${formatCount}`)
line(`operators: ${operatorCount} with ${operatorPrefixCount} prefixes; Arabic names: ${arabicNames}`)
line(`examples checked: ${examples}; round trips: ${roundTrips}; failures: ${failures.length}`)
line()
line('region  code  trunk  types  formats  operators  shares code with')
for (const doc of docs) {
  const d = doc.data
  line(`${d.region.padEnd(8)}${d.callingCode.padEnd(6)}${(d.nationalPrefix ?? '-').padEnd(7)}${String(Object.keys(d.numberTypes).length).padEnd(7)}${String(d.formats.length).padEnd(9)}${String(d.operators?.length ?? 0).padEnd(11)}${d.sharesCallingCodeWith?.join(' ') ?? '-'}`)
}
if (operatorsWithoutArabic.length) {
  line()
  line(`operators without an Arabic-script name in libphonenumber (${operatorsWithoutArabic.length}):`)
  const byRegion = new Map()
  for (const o of operatorsWithoutArabic) byRegion.set(o.region, [...(byRegion.get(o.region) ?? []), o.arFile.length ? `${o.en} [carrier/ar has "${o.arFile.join('", "')}"]` : o.en])
  for (const [region, names] of byRegion) line(`  ${region}: ${names.join(', ')}`)
}
if (notExtracted.length) {
  line()
  line('present upstream, not carried by the model:')
  for (const n of notExtracted) line(`  ${n}`)
}
if (info.length) {
  line()
  line(`notes (${info.length}):`)
  for (const n of info) line(`  ${n}`)
}
if (failures.length) {
  line()
  line(`FAILURES (${failures.length}):`)
  for (const f of failures) line(`  ${f}`)
}
process.exit(failures.length ? 2 : 0)
