#!/usr/bin/env node
// Builds data/language/ar/*.json from Unicode CLDR (cldr-json packages), the Unicode Character Database, the CLDR
// collation XML and (for one reference table) Apache Lucene. Sources are fetched by tools/extract/language/fetch.sh.
//   node tools/extract/language/build.mjs <sources-dir>
// <sources-dir> holds: cldr/<package>/…, ucd/*.txt, cldr-xml/ar.collation.xml, lucene/ArabicNormalizer.java
// Output is deterministic for a given sources-dir. The only part that depends on the Node runtime is
// collation.json → content.intlProbe, which records what the running Intl.Collator does (versions are recorded).
import fs from 'node:fs'
import path from 'node:path'
import { readJson, readText, writeData, envelope, cldrSource, ucdSource, hex, codePoints, arabicLocales, groupLocales, PLURALS, pluralForms, RETRIEVED_AT, CLDR_VERSION } from './lib.mjs'
import { parseRbnf } from './rbnf.mjs'

const SRC = process.argv[2]
if (!SRC) {
  console.error('usage: node tools/extract/language/build.mjs <sources-dir>')
  process.exit(2)
}
const CLDR = path.join(SRC, 'cldr')
const UCD = path.join(SRC, 'ucd')
const SCRIPT = 'tools/extract/language/build.mjs'
const LANG = 'ar'
const locales = arabicLocales(CLDR)
const written = []

for (const pkg of ['cldr-core', 'cldr-numbers-full', 'cldr-dates-full', 'cldr-units-full', 'cldr-misc-full', 'cldr-rbnf']) {
  const v = readJson(path.join(CLDR, pkg, 'package.json')).version
  if (v !== CLDR_VERSION) throw new Error(`${pkg} is ${v}, expected ${CLDR_VERSION}`)
}

const main = (pkg, locale, file) => readJson(path.join(CLDR, pkg, 'main', locale, file)).main[locale]
const supplemental = (file) => readJson(path.join(CLDR, 'cldr-core', 'supplemental', file)).supplemental
const gregorian = (l) => main('cldr-dates-full', l, 'ca-gregorian.json').dates.calendars.gregorian
const numbers = (l) => main('cldr-numbers-full', l, 'numbers.json').numbers

function emit(dataset, scopeLocales, content, sources, extra = {}) {
  const scoped = scopeLocales && scopeLocales.length !== locales.length
  const suffix = scoped ? '.' + scopeLocales[0] : ''
  const data = { language: LANG, dataset, ...(scoped ? { scope: scopeLocales } : {}), content }
  const provenance = { method: 'extracted', confidence: 'verified', sources, script: SCRIPT, ...(extra.notes ? { notes: extra.notes } : {}) }
  written.push(writeData(`data/language/${LANG}/${dataset}${suffix}.json`, envelope('language', `${LANG}/${dataset}${suffix}`, provenance, data)))
}
// One file per group of locales with identical content.
function emitGrouped(dataset, get, sources, wrap = (v) => v) {
  const groups = groupLocales(locales, get)
  for (const g of groups) emit(dataset, groups.length > 1 ? g.locales : null, wrap(g.value, g.locales), sources)
  return groups
}

// ───────────────────────────── plural-rules / ordinal-rules ─────────────────────────────
function parsePluralRule(text) {
  const [condition, ...rest] = text.split('@')
  const out = { condition: condition.trim() }
  for (const part of rest) {
    const [kind, ...items] = part.trim().split(/\s+/)
    const samples = items.join(' ').split(',').map((s) => s.trim()).filter((s) => s && s !== '…')
    out[kind === 'integer' ? 'integerSamples' : 'decimalSamples'] = samples
    if (/…/.test(part)) out[kind === 'integer' ? 'integerSamplesOpenEnded' : 'decimalSamplesOpenEnded'] = true
  }
  return out
}
function pluralCategories(rules) {
  return PLURALS.filter((c) => rules[`pluralRule-count-${c}`] !== undefined).map((c) => ({ category: c, ...parsePluralRule(rules[`pluralRule-count-${c}`]) }))
}
{
  const cardinal = supplemental('plurals.json')['plurals-type-cardinal'][LANG]
  const ranges = supplemental('pluralRanges.json').plurals[LANG]
  const pairs = numbers(LANG).minimalPairs
  emit('plural-rules', null, {
    type: 'cardinal',
    operands: 'n = absolute value of the number; operands are defined in UTS #35 part 3 (Language Plural Rules).',
    categories: pluralCategories(cardinal),
    ranges: Object.entries(ranges).map(([k, result]) => {
      const m = /^pluralRange-start-(\w+)-end-(\w+)$/.exec(k)
      return { start: m[1], end: m[2], result }
    }),
    minimalPairs: pluralForms(pairs, 'pluralMinimalPairs-count-'),
    genderMinimalPairs: { feminine: pairs.feminine, masculine: pairs.masculine },
  }, [cldrSource('cldr-core', 'supplemental/plurals.json'), cldrSource('cldr-core', 'supplemental/pluralRanges.json'), cldrSource('cldr-numbers-full', 'main/ar/numbers.json')])

  const ordinal = supplemental('ordinals.json')['plurals-type-ordinal'][LANG]
  emit('ordinal-rules', null, {
    type: 'ordinal',
    categories: pluralCategories(ordinal),
    minimalPairs: { other: pairs.other },
  }, [cldrSource('cldr-core', 'supplemental/ordinals.json'), cldrSource('cldr-numbers-full', 'main/ar/numbers.json')])
}

// ───────────────────────────── spellout (RBNF) ─────────────────────────────
{
  const index = readJson(path.join(CLDR, 'cldr-rbnf', 'rbnf', 'ar.json')).rbnf.rbnf
  const groups = []
  let allText = ''
  for (const [group, ref] of Object.entries(index)) {
    const file = ref._rbnfRulesFile
    const text = readText(path.join(CLDR, 'cldr-rbnf', 'rbnf', file))
    allText += text
    groups.push({ group, file, ruleSets: parseRbnf(text) })
  }
  const names = groups.flatMap((g) => g.ruleSets.map((r) => r.name))
  const has = (re) => re.test(allText)
  emit('spellout', null, {
    format: {
      description: 'CLDR rule-based number format (RBNF) rule sets, parsed. Rule selection and substitution semantics are those of UTS #35 part 3, Rule-Based Number Formatting; tools/extract/language/rbnf.mjs holds a reference interpreter for the constructs used here.',
      ruleKinds: { base: 'applies from baseValue up to the next rule', negative: 'descriptor -x', fraction: 'descriptor x.x (number with a fractional part)' },
      tokenKinds: {
        text: 'literal text',
        quotient: '<…< : format floor(n / divisor) with the named rule set (or the current one)',
        remainder: '>…> : format n mod divisor with the named rule set (or the current one); for fraction rules, the fractional digits one by one; for the negative rule, the absolute value',
        same: '=…= : format n itself with the named rule set or the given DecimalFormat pattern',
        optional: '[…] : emitted only when n is not a multiple of divisor',
      },
    },
    ruleSetGroups: groups,
    publicRuleSets: names.filter((n) => !n.startsWith('%%')),
    useFor: {
      'cardinal-masculine': '%spellout-cardinal-masculine',
      'cardinal-feminine': '%spellout-cardinal-feminine',
      'ordinal-masculine': '%spellout-ordinal-masculine',
      'ordinal-feminine': '%spellout-ordinal-feminine',
      numbering: '%spellout-numbering',
      year: '%spellout-numbering-year',
      'digits-ordinal': '%digits-ordinal',
    },
    checks: {
      ruleSetCount: names.length,
      ruleCount: groups.reduce((n, g) => n + g.ruleSets.reduce((m, r) => m + r.rules.length, 0), 0),
      containsCurrencyRuleSet: names.some((n) => /curr|money/.test(n)),
      containsTanween: has(/[\u064B-\u064D]/),
      containsAnyTashkeel: has(/[\u064B-\u0652\u0670]/),
      containsOnlyPhrase: has(/فقط/),
      largestSpelledBase: '1000000000000000',
      fallsBackToDigitsFrom: '1000000000000000000',
    },
    gaps: [
      { id: 'currency-agreement', need: 'Amount in words on cheques and invoices names the currency and its subunit with number agreement (singular, dual, plural 3–10, accusative singular 11–99, singular after hundreds/thousands) and joins major and minor amounts.', status: 'RBNF has no currency rule set for ar (checks.containsCurrencyRuleSet is false). The counted noun and its forms must come from the currency layer (CLDR currencies.json displayName-count-*), not from here.' },
      { id: 'only-phrase', need: 'The closing phrase «فقط لا غير» (and the optional opening «فقط») that Arabic cheques and invoices put around the amount.', status: 'Absent from RBNF (checks.containsOnlyPhrase is false). No CLDR source; needs an authored, reviewed string.' },
      { id: 'dual-of-counted-noun', need: 'The dual of the counted noun replaces the numeral two (ريالان / ريالين), and 2000 / 2 000 000 use dual forms in the case the sentence requires.', status: 'RBNF emits bare numerals only. It writes 2000 as «ألفين» in %spellout-numbering and «ألفي» in the cardinal rule sets, and has no rule for a construct-state or case choice.' },
      { id: 'case-and-tanween', need: 'Case endings: nominative/accusative-genitive forms of tens and duals (عشرون / عشرين, مائتان / مائتين) and tanween on the counted noun after 11–99 (ريال\u064bا).', status: 'RBNF contains no tashkeel at all (checks.containsAnyTashkeel is false) and only nominative tens and hundreds.' },
      { id: 'gender-agreement-3-10', need: 'Numerals 3–10 take the opposite gender of the counted noun; 11–19 have masculine and feminine compound forms.', status: 'In CLDR 49 %spellout-cardinal-feminine uses the same words as the masculine set for 3–10 and builds 13–19 from %spellout-numbering; the words differ between the two sets only at 1, 2 and 12. Recorded as found, not corrected.' },
      { id: 'fractions', need: 'Minor units are read as a whole number of subunits (… وخمسون قرش\u064bا), never digit by digit.', status: 'The x.x rule reads fractional digits one by one after «فاصل»; an amount-in-words implementation must split major and minor units before calling the rules.' },
      { id: 'scale-above-quadrillion', need: 'Values of 10^18 and above.', status: 'Rule sets fall back to the pattern #,##0 from 10^18.' },
    ],
  }, [cldrSource('cldr-rbnf', 'rbnf/ar.json'), cldrSource('cldr-rbnf', 'rbnf/ar-SpelloutRules.txt'), cldrSource('cldr-rbnf', 'rbnf/ar-OrdinalRules.txt')],
  { notes: 'ruleSetGroups and checks are extracted mechanically. `gaps` states what the extracted rules do not contain; each status is backed by a value in `checks` or by the rule text itself. Rule text is kept exactly as CLDR ships it, including forms a reviewer may consider errors.' })
}

// ───────────────────────────── numbering-systems ─────────────────────────────
function symbolEntries(symbols) {
  return Object.fromEntries(Object.entries(symbols).map(([k, v]) => [k, { value: v, codePoints: codePoints(v) }]))
}
{
  const systems = supplemental('numberingSystems.json').numberingSystems
  const namesAr = main('cldr-localenames-full', 'ar', 'localeDisplayNames.json').localeDisplayNames.types.numbers
  const namesEn = main('cldr-localenames-full', 'en', 'localeDisplayNames.json').localeDisplayNames.types.numbers
  const ids = ['arab', 'arabext', 'latn']
  const present = ids.filter((id) => numbers(LANG)[`symbols-numberSystem-${id}`])
  emit('numbering-systems', null, {
    systems: ids.map((id) => ({
      id,
      type: systems[id]._type,
      digits: [...systems[id]._digits],
      digitCodePoints: codePoints(systems[id]._digits),
      name: { ar: namesAr[id], en: namesEn[id] },
    })),
    defaults: groupLocales(locales, (l) => ({ default: numbers(l).defaultNumberingSystem, latnAlternative: numbers(l)['defaultNumberingSystem-alt-latn'], native: numbers(l).otherNumberingSystems.native })).map((g) => ({ locales: g.locales, ...g.value })),
    minimumGroupingDigits: groupLocales(locales, (l) => Number(numbers(l).minimumGroupingDigits)).map((g) => ({ locales: g.locales, value: g.value })),
    symbols: Object.fromEntries(present.map((id) => [id, groupLocales(locales, (l) => numbers(l)[`symbols-numberSystem-${id}`]).map((g) => ({ locales: g.locales, symbols: symbolEntries(g.value) }))])),
    symbolsNotProvided: ids.filter((id) => !present.includes(id)),
  }, [cldrSource('cldr-core', 'supplemental/numberingSystems.json'), cldrSource('cldr-numbers-full', 'main/ar*/numbers.json'), cldrSource('cldr-localenames-full', 'main/{ar,en}/localeDisplayNames.json')],
  { notes: 'Symbols carry invisible marks (U+061C ARABIC LETTER MARK, U+200E/U+200F) exactly as CLDR ships them; `codePoints` spells each value out. symbolsNotProvided lists numbering systems for which the ar locales carry no symbols block.' })
}

// ───────────────────────────── number-patterns ─────────────────────────────
function compact(obj) {
  // { "1000-count-few": "0 آلاف" } -> [{ magnitude: "1000", forms: { few: … } }]
  const out = new Map()
  for (const [k, v] of Object.entries(obj)) {
    const m = /^(\d+)-count-(\w+)$/.exec(k)
    if (!out.has(m[1])) out.set(m[1], { magnitude: m[1], forms: {} })
    out.get(m[1]).forms[m[2]] = v
  }
  return [...out.values()].map((e) => ({ magnitude: e.magnitude, forms: Object.fromEntries(PLURALS.filter((c) => c in e.forms).map((c) => [c, e.forms[c]])) }))
}
function numberPatterns(n) {
  const out = { minimumGroupingDigits: Number(n.minimumGroupingDigits), numberingSystems: {} }
  for (const key of Object.keys(n)) {
    const m = /^symbols-numberSystem-(\w+)$/.exec(key)
    if (!m) continue
    const id = m[1]
    const dec = n[`decimalFormats-numberSystem-${id}`]
    const cur = n[`currencyFormats-numberSystem-${id}`]
    const { currencySpacing, short: curShort, ...curRest } = cur
    const currency = { patterns: {}, unitPattern: pluralForms(curRest, 'unitPattern-count-'), spacing: currencySpacing }
    for (const [k, v] of Object.entries(curRest)) if (!k.startsWith('unitPattern-count-')) currency.patterns[k] = v
    if (curShort) currency.compactShort = compact(curShort.standard)
    out.numberingSystems[id] = {
      decimal: { standard: dec.standard, compactLong: compact(dec.long.decimalFormat), compactShort: compact(dec.short.decimalFormat) },
      percent: n[`percentFormats-numberSystem-${id}`],
      scientific: n[`scientificFormats-numberSystem-${id}`],
      currency,
      misc: n[`miscPatterns-numberSystem-${id}`],
      rational: n[`rationalFormats-numberSystem-${id}`],
    }
  }
  return out
}
emitGrouped('number-patterns', (l) => numberPatterns(numbers(l)), [cldrSource('cldr-numbers-full', 'main/ar*/numbers.json')])

// ───────────────────────────── gregorian-months / weekdays / quarters / day-periods ─────────────────────────────
const widths = (o) => ({ wide: o.wide, abbreviated: o.abbreviated, ...(o.short ? { short: o.short } : {}), narrow: o.narrow })
const context = (o) => ({ format: widths(o.format), standAlone: widths(o['stand-alone']) })
const monthList = (o) => Object.keys(o).map(Number).sort((a, b) => a - b).map((i) => ({ index: i, name: o[String(i)], codePoints: undefined })).map(({ index, name }) => ({ index, name }))
const mapWidths = (ctx, fn) => Object.fromEntries(Object.entries(ctx).map(([c, w]) => [c, Object.fromEntries(Object.entries(w).map(([k, v]) => [k, fn(v)]))]))

const monthGroups = emitGrouped('gregorian-months', (l) => mapWidths(context(gregorian(l).months), monthList), [cldrSource('cldr-dates-full', 'main/ar*/ca-gregorian.json')], (value) => {
  const flat = Object.values(value).flatMap((w) => Object.values(w)).flat()
  const nonAscii = [...new Set(flat.flatMap((m) => [...m.name].filter((c) => /[\u00a0\u200e\u200f\u061c]/.test(c)).map((c) => hex(c.codePointAt(0)))))]
  return { calendar: 'gregory', months: value, invisibleCharactersInNames: nonAscii }
})
emitGrouped('weekdays', (l) => context(gregorian(l).days), [cldrSource('cldr-dates-full', 'main/ar*/ca-gregorian.json')], (v) => ({ keys: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], days: v }))
emitGrouped('quarters', (l) => context(gregorian(l).quarters), [cldrSource('cldr-dates-full', 'main/ar*/ca-gregorian.json')], (v) => ({ quarters: v }))
{
  const rules = supplemental('dayPeriods.json').dayPeriodRuleSet[LANG]
  emitGrouped('day-periods', (l) => context(gregorian(l).dayPeriods), [cldrSource('cldr-dates-full', 'main/ar*/ca-gregorian.json'), cldrSource('cldr-core', 'supplemental/dayPeriods.json')], (v) => ({
    rules: Object.entries(rules).map(([period, r]) => ({ period, from: r._from, before: r._before })).sort((a, b) => (a.from < b.from ? -1 : 1)),
    names: v,
  }))
}

// ───────────────────────────── date-patterns ─────────────────────────────
emitGrouped('date-patterns', (l) => {
  const g = gregorian(l)
  const { availableFormats, intervalFormats, appendItems, numericSeparators, ...glue } = g.dateTimeFormats
  return {
    calendar: 'gregory',
    dateFormats: g.dateFormats,
    dateSkeletons: g.dateSkeletons,
    timeFormats: g.timeFormats,
    timeSkeletons: g.timeSkeletons,
    dateTimeFormats: { standard: glue, atTime: g['dateTimeFormats-atTime'].standard, relative: g['dateTimeFormats-relative'].standard },
    numericSeparators,
    availableFormats,
    intervalFormats,
    appendItems,
  }
}, [cldrSource('cldr-dates-full', 'main/ar*/ca-gregorian.json')])

// ───────────────────────────── relative-time ─────────────────────────────
function relativeField(f) {
  const out = {}
  if (f.displayName !== undefined) out.displayName = f.displayName
  const rel = Object.keys(f).filter((k) => k.startsWith('relative-type-')).map((k) => [k.slice('relative-type-'.length), f[k]]).sort((a, b) => Number(a[0]) - Number(b[0]))
  if (rel.length) out.relative = Object.fromEntries(rel)
  if (f['relativeTime-type-future']) out.future = pluralForms(f['relativeTime-type-future'], 'relativeTimePattern-count-')
  if (f['relativeTime-type-past']) out.past = pluralForms(f['relativeTime-type-past'], 'relativeTimePattern-count-')
  return out
}
emitGrouped('relative-time', (l) => {
  const fields = main('cldr-dates-full', l, 'dateFields.json').dates.fields
  const out = {}
  for (const [key, f] of Object.entries(fields)) {
    const m = /^(.*?)(?:-(short|narrow))?$/.exec(key)
    const width = m[2] ?? 'long'
    ;(out[m[1]] ??= {})[width] = relativeField(f)
  }
  return { fields: out }
}, [cldrSource('cldr-dates-full', 'main/ar*/dateFields.json')])

// ───────────────────────────── list-patterns ─────────────────────────────
emitGrouped('list-patterns', (l) => {
  const p = main('cldr-misc-full', l, 'listPatterns.json').listPatterns
  return { patterns: Object.fromEntries(Object.entries(p).map(([k, v]) => [k.replace('listPattern-type-', ''), { two: v['2'], start: v.start, middle: v.middle, end: v.end }])) }
}, [cldrSource('cldr-misc-full', 'main/ar*/listPatterns.json')])

// ───────────────────────────── units ─────────────────────────────
const UNIT_CATEGORIES = ['duration', 'length', 'mass', 'digital']
const UNIT_EXTRA = ['concentr-percent', 'concentr-permille']
function unitEntry(u) {
  const out = {}
  if (u.gender) out.gender = u.gender
  if (u.displayName !== undefined) out.displayName = u.displayName
  out.forms = pluralForms(u, 'unitPattern-count-')
  if (u.perUnitPattern) out.perUnitPattern = u.perUnitPattern
  return out
}
emitGrouped('units', (l) => {
  const u = main('cldr-units-full', l, 'units.json').units
  const out = { categories: [...UNIT_CATEGORIES, 'percent'], widths: {}, durationPatterns: {} }
  for (const width of ['long', 'short', 'narrow']) {
    const units = {}
    for (const key of Object.keys(u[width])) {
      if (UNIT_CATEGORIES.some((c) => key.startsWith(c + '-')) || UNIT_EXTRA.includes(key)) units[key] = unitEntry(u[width][key])
    }
    out.widths[width] = { units, per: u[width].per.compoundUnitPattern, times: u[width].times.compoundUnitPattern }
  }
  for (const k of Object.keys(u)) if (k.startsWith('durationUnit-type-')) out.durationPatterns[k.replace('durationUnit-type-', '')] = u[k].durationUnitPattern
  return out
}, [cldrSource('cldr-units-full', 'main/ar*/units.json')])

// ───────────────────────────── delimiters ─────────────────────────────
emitGrouped('delimiters', (l) => ({
  quotation: main('cldr-misc-full', l, 'delimiters.json').delimiters,
  orientation: main('cldr-misc-full', l, 'layout.json').layout.orientation,
  ellipsis: main('cldr-misc-full', l, 'characters.json').characters.ellipsis,
}), [cldrSource('cldr-misc-full', 'main/ar*/delimiters.json'), cldrSource('cldr-misc-full', 'main/ar*/layout.json'), cldrSource('cldr-misc-full', 'main/ar*/characters.json')])

// ───────────────────────────── characters (UCD) ─────────────────────────────
function parseRanges(file, fields = 2) {
  // "0600..0605 ; value # comment" -> [{ start, end, values[] }]
  const out = []
  for (const line of readText(path.join(UCD, file)).split('\n')) {
    const body = line.split('#')[0].trim()
    if (!body) continue
    const parts = body.split(';').map((s) => s.trim())
    const [a, b] = parts[0].split('..')
    out.push({ start: parseInt(a, 16), end: parseInt(b ?? a, 16), values: parts.slice(1, fields) })
  }
  return out
}
const lookup = (ranges, cp) => ranges.find((r) => cp >= r.start && cp <= r.end)?.values[0]
const ucd = new Map()
for (const line of readText(path.join(UCD, 'UnicodeData.txt')).split('\n')) {
  if (!line) continue
  const f = line.split(';')
  ucd.set(parseInt(f[0], 16), { cp: parseInt(f[0], 16), name: f[1], gc: f[2], ccc: Number(f[3]), bidi: f[4], decomposition: f[5], decimal: f[6], mirrored: f[9] })
}
const shaping = new Map()
for (const line of readText(path.join(UCD, 'ArabicShaping.txt')).split('\n')) {
  const body = line.split('#')[0].trim()
  if (!body) continue
  const f = body.split(';').map((s) => s.trim())
  shaping.set(parseInt(f[0], 16), { joiningType: f[2], joiningGroup: f[3] })
}
const scripts = parseRanges('Scripts.txt')
const scriptExt = parseRanges('ScriptExtensions.txt')
const propList = parseRanges('PropList.txt')
const ages = parseRanges('DerivedAge.txt')
const blocks = parseRanges('Blocks.txt')
const aliases = new Map()
for (const line of readText(path.join(UCD, 'NameAliases.txt')).split('\n')) {
  const body = line.split('#')[0].trim()
  if (!body) continue
  const [cp, alias, type] = body.split(';')
  if (type === 'abbreviation' && !aliases.has(parseInt(cp, 16))) aliases.set(parseInt(cp, 16), alias)
}
const hasProp = (cp, prop) => propList.some((r) => r.values[0] === prop && cp >= r.start && cp <= r.end)
const isArabic = (cp) => lookup(scripts, cp) === 'Arabic' || (lookup(scriptExt, cp) ?? '').split(' ').includes('Arab')

// CLDR exemplar sets: a UnicodeSet restricted to the syntax CLDR uses for ar (single characters, \uXXXX, \-, a-b, {…}).
function parseUnicodeSet(set) {
  const inner = set.replace(/^\[/, '').replace(/\]$/, '')
  const items = []
  const chars = [...inner]
  for (let i = 0; i < chars.length; i++) {
    let c = chars[i]
    if (c === ' ') continue
    if (c === '{') {
      const end = chars.indexOf('}', i)
      items.push(chars.slice(i + 1, end).join(''))
      i = end
      continue
    }
    if (c === '\\') {
      if (chars[i + 1] === 'u') {
        c = String.fromCharCode(parseInt(chars.slice(i + 2, i + 6).join(''), 16))
        i += 5
      } else {
        c = chars[++i]
      }
    } else if (c === '-' && items.length && chars[i + 1] && chars[i + 1] !== ' ') {
      const from = items[items.length - 1].codePointAt(0)
      const to = chars[++i].codePointAt(0)
      for (let cp = from + 1; cp <= to; cp++) items.push(String.fromCodePoint(cp))
      continue
    }
    items.push(c)
  }
  return items
}
const cldrChars = (l) => main('cldr-misc-full', l, 'characters.json').characters
const exemplarMain = new Set(parseUnicodeSet(cldrChars(LANG).exemplarCharacters).map((c) => c.codePointAt(0)))
const exemplarAux = new Set(parseUnicodeSet(cldrChars(LANG).auxiliary).map((c) => c.codePointAt(0)))

function describe(cp) {
  const u = ucd.get(cp)
  const s = shaping.get(cp)
  const out = { codePoint: hex(cp), char: String.fromCodePoint(cp), name: u.name, generalCategory: u.gc, bidiClass: u.bidi }
  if (aliases.has(cp)) out.abbreviation = aliases.get(cp)
  if (u.ccc) out.combiningClass = u.ccc
  if (s) {
    out.joiningType = s.joiningType
    if (s.joiningGroup !== 'No_Joining_Group') out.joiningGroup = s.joiningGroup
  }
  if (u.decomposition) {
    const m = /^(?:<(\w+)> )?(.*)$/.exec(u.decomposition)
    out.decomposition = { type: m[1] ?? 'canonical', codePoints: m[2].split(' ').map((h) => hex(parseInt(h, 16))) }
  }
  if (u.decimal !== '') out.digitValue = Number(u.decimal)
  out.age = lookup(ages, cp)
  out.cldrExemplar = exemplarMain.has(cp) ? 'main' : exemplarAux.has(cp) ? 'auxiliary' : null
  return out
}
const allCps = [...ucd.keys()].sort((a, b) => a - b)
const select = (pred) => allCps.filter(pred).map(describe)
const jg = (cp) => shaping.get(cp)?.joiningGroup
const decompEndsWith = (cp, marks) => {
  const d = ucd.get(cp).decomposition
  return d && !d.startsWith('<') && marks.includes(parseInt(d.split(' ').at(-1), 16))
}
const BIDI_ROLE = { L: 'mark', R: 'mark', AL: 'mark', LRE: 'embedding', RLE: 'embedding', LRO: 'override', RLO: 'override', PDF: 'pop-embedding-or-override', LRI: 'isolate', RLI: 'isolate', FSI: 'isolate', PDI: 'pop-isolate' }
const BIDI_DIRECTION = { L: 'ltr', R: 'rtl', AL: 'rtl', LRE: 'ltr', RLE: 'rtl', LRO: 'ltr', RLO: 'rtl', LRI: 'ltr', RLI: 'rtl', FSI: 'first-strong' }

const classes = [
  { id: 'tashkeel', selector: 'General_Category=Mn ∩ CLDR ar main exemplar set', members: select((cp) => ucd.get(cp).gc === 'Mn' && exemplarMain.has(cp)) },
  { id: 'arabic-combining-marks', selector: 'General_Category in {Mn, Me} and (Script=Arabic or Script_Extensions contains Arab)', members: select((cp) => ['Mn', 'Me'].includes(ucd.get(cp).gc) && isArabic(cp)) },
  { id: 'tatweel', selector: 'Joining_Type=C (join-causing) and (Script=Arabic or Script_Extensions contains Arab)', members: select((cp) => shaping.get(cp)?.joiningType === 'C' && isArabic(cp)) },
  { id: 'hamza-forms', selector: 'Script=Arabic, General_Category=Lo, block Arabic; canonical decomposition ends in U+0653/U+0654/U+0655, or name contains HAMZA', members: select((cp) => cp >= 0x600 && cp <= 0x6ff && ucd.get(cp).gc === 'Lo' && (decompEndsWith(cp, [0x653, 0x654, 0x655]) || /HAMZA/.test(ucd.get(cp).name))) },
  { id: 'hamza-marks', selector: 'combining marks U+0653..U+0655 that canonical decompositions of hamza forms end in', members: select((cp) => cp >= 0x653 && cp <= 0x655) },
  { id: 'alef-forms', selector: 'Joining_Group=ALEF', members: select((cp) => jg(cp) === 'ALEF') },
  { id: 'yeh-forms', selector: 'Joining_Group in {YEH, FARSI YEH, YEH BARREE, YEH WITH TAIL}', members: select((cp) => ['YEH', 'FARSI YEH', 'YEH BARREE', 'YEH WITH TAIL'].includes(jg(cp))) },
  { id: 'teh-marbuta-heh-forms', selector: 'Joining_Group in {TEH MARBUTA, TEH MARBUTA GOAL, HEH, HEH GOAL, KNOTTED HEH}', members: select((cp) => ['TEH MARBUTA', 'TEH MARBUTA GOAL', 'HEH', 'HEH GOAL', 'KNOTTED HEH'].includes(jg(cp))) },
  { id: 'kaf-forms', selector: 'Joining_Group in {KAF, SWASH KAF, GAF}', members: select((cp) => ['KAF', 'SWASH KAF', 'GAF'].includes(jg(cp))) },
  { id: 'waw-forms', selector: 'Joining_Group=WAW', members: select((cp) => jg(cp) === 'WAW') },
  { id: 'lam-alef-ligatures', selector: 'compatibility decomposition <isolated|final> U+0644 + a code point with Joining_Group=ALEF', members: select((cp) => { const d = ucd.get(cp).decomposition; const m = /^<(isolated|final)> 0644 ([0-9A-F]+)$/.exec(d ?? ''); return !!m && jg(parseInt(m[2], 16)) === 'ALEF' }) },
  { id: 'punctuation', selector: 'General_Category P* and (Script=Arabic or Script_Extensions contains Arab)', members: select((cp) => ucd.get(cp).gc.startsWith('P') && isArabic(cp)) },
  { id: 'digits', selector: 'General_Category=Nd and (Script=Arabic or Script_Extensions contains Arab)', members: select((cp) => ucd.get(cp).gc === 'Nd' && isArabic(cp)) },
  { id: 'currency-symbols', selector: 'General_Category=Sc and (Script=Arabic or Script_Extensions contains Arab)', members: select((cp) => ucd.get(cp).gc === 'Sc' && isArabic(cp)) },
  { id: 'bidi-controls', selector: 'PropList Bidi_Control', members: select((cp) => hasProp(cp, 'Bidi_Control')).map((m) => ({ ...m, role: BIDI_ROLE[m.bidiClass], ...(BIDI_DIRECTION[m.bidiClass] ? { direction: BIDI_DIRECTION[m.bidiClass] } : {}) })) },
  { id: 'join-controls', selector: 'PropList Join_Control', members: select((cp) => hasProp(cp, 'Join_Control')) },
  { id: 'prepended-concatenation-marks', selector: 'PropList Prepended_Concatenation_Mark and (Script=Arabic or Script_Extensions contains Arab)', members: select((cp) => hasProp(cp, 'Prepended_Concatenation_Mark') && isArabic(cp)) },
]
{
  const arabDigits = supplemental('numberingSystems.json').numberingSystems
  const digitChars = classes.find((c) => c.id === 'digits').members.map((m) => m.char).join('')
  if (!digitChars.includes(arabDigits.arab._digits) || !digitChars.includes(arabDigits.arabext._digits)) throw new Error('UCD digits do not cover CLDR arab/arabext digits')
}
const arabicBlocks = blocks.filter((b) => b.values[0].startsWith('Arabic')).map((b) => {
  const cps = allCps.filter((cp) => cp >= b.start && cp <= b.end)
  const byGc = {}
  for (const cp of cps) byGc[ucd.get(cp).gc] = (byGc[ucd.get(cp).gc] ?? 0) + 1
  const decomp = { canonical: 0 }
  for (const cp of cps) {
    const d = ucd.get(cp).decomposition
    if (!d) continue
    const t = /^<(\w+)>/.exec(d)?.[1] ?? 'canonical'
    decomp[t] = (decomp[t] ?? 0) + 1
  }
  if (!decomp.canonical) delete decomp.canonical
  const nonArabic = cps.filter((cp) => !isArabic(cp)).map((cp) => ({ codePoint: hex(cp), name: ucd.get(cp).name, generalCategory: ucd.get(cp).gc, script: lookup(scripts, cp) ?? 'Unknown' }))
  const nonchar = propList.filter((r) => r.values[0] === 'Noncharacter_Code_Point' && r.start >= b.start && r.end <= b.end).map((r) => ({ start: hex(r.start), end: hex(r.end) }))
  return {
    name: b.values[0], start: hex(b.start), end: hex(b.end), size: b.end - b.start + 1, assigned: cps.length,
    byGeneralCategory: Object.fromEntries(Object.entries(byGc).sort()),
    withDecomposition: Object.fromEntries(Object.entries(decomp).sort()),
    withoutDecomposition: cps.filter((cp) => !ucd.get(cp).decomposition).length,
    ...(nonchar.length ? { noncharacters: nonchar } : {}),
    ...(nonArabic.length && nonArabic.length <= 40 ? { membersNotArabicScript: nonArabic } : nonArabic.length ? { membersNotArabicScriptCount: nonArabic.length } : {}),
  }
})
// Reference folding used by a widely deployed search engine, read from its source (constants and the switch).
function luceneFolding() {
  const src = readText(path.join(SRC, 'lucene', 'ArabicNormalizer.java'))
  const consts = Object.fromEntries([...src.matchAll(/static final char (\w+) = '\\u([0-9A-Fa-f]{4})';/g)].map((m) => [m[1], parseInt(m[2], 16)]))
  const body = src.slice(src.indexOf('switch (s[i])'))
  const map = []
  const remove = []
  let pending = []
  for (const line of body.split('\n')) {
    const c = /case (\w+):/.exec(line)
    if (c) pending.push(c[1])
    const a = /s\[i\] = (\w+);/.exec(line)
    if (a) { for (const p of pending) map.push({ from: hex(consts[p]), to: hex(consts[a[1]]), fromName: ucd.get(consts[p]).name, toName: ucd.get(consts[a[1]]).name }); pending = [] }
    if (/delete\(s, i, len\)/.test(line)) { for (const p of pending) remove.push({ codePoint: hex(consts[p]), name: ucd.get(consts[p]).name }); pending = [] }
  }
  remove.sort((a, b) => (a.codePoint < b.codePoint ? -1 : 1))
  return { map, remove }
}
emit('characters', null, {
  unicodeVersion: '17.0.0',
  classes: classes.map((c) => ({ id: c.id, selector: c.selector, count: c.members.length, members: c.members })),
  blocks: arabicBlocks,
  cldrExemplars: groupLocales(locales, (l) => {
    const c = cldrChars(l)
    return { main: c.exemplarCharacters, auxiliary: c.auxiliary, index: c.index, numbers: c.numbers, punctuation: c.punctuation, punctuationPerson: c['punctuation-person'] }
  }).map((g) => ({ locales: g.locales, sets: g.value, mainCodePoints: parseUnicodeSet(g.value.main).map((c) => hex(c.codePointAt(0))), auxiliaryCodePoints: parseUnicodeSet(g.value.auxiliary).map((c) => hex(c.codePointAt(0))) })),
  lenientParsing: { date: cldrChars(LANG)['lenient-scope-date'], general: cldrChars(LANG)['lenient-scope-general'], number: cldrChars(LANG)['lenient-scope-number'], stricterNumber: cldrChars(LANG)['stricter-scope-number'] },
  searchFoldingReference: {
    implementation: 'Apache Lucene ArabicNormalizer (the folding behind the Lucene/Elasticsearch/Solr "arabic_normalization" filter)',
    ...luceneFolding(),
    note: 'Recorded as what a deployed implementation folds, not as a rule of the language: it does not fold U+0671, U+0624, U+0626, U+06CC or U+06A9, and it removes only the eight marks listed plus tatweel.',
  },
}, [ucdSource('UnicodeData.txt'), ucdSource('ArabicShaping.txt'), ucdSource('Scripts.txt'), ucdSource('ScriptExtensions.txt'), ucdSource('PropList.txt'), ucdSource('Blocks.txt'), ucdSource('DerivedAge.txt'), ucdSource('NameAliases.txt'), cldrSource('cldr-misc-full', 'main/ar*/characters.json'),
  { name: 'Apache Lucene', url: 'https://github.com/apache/lucene/blob/releases/lucene/10.6.0/lucene/analysis/common/src/java/org/apache/lucene/analysis/ar/ArabicNormalizer.java', version: '10.6.0', license: 'Apache-2.0', retrievedAt: RETRIEVED_AT, path: 'lucene/analysis/common/src/java/org/apache/lucene/analysis/ar/ArabicNormalizer.java' }],
{ notes: 'Every class is a mechanical selection over UCD 17.0.0 properties; the selector is stated per class. `char` for invisible characters is written as a JSON escape.' })

// ───────────────────────────── collation ─────────────────────────────
{
  const xml = readText(path.join(SRC, 'cldr-xml', 'ar.collation.xml'))
  const types = [...xml.matchAll(/<collation type="([^"]+)">\s*<cr><!\[CDATA\[([\s\S]*?)\]\]><\/cr>/g)].map((m) => {
    const lines = m[2].split('\n').map((l) => l.trim().replace(/[\u200e\u200f]/g, '')).filter((l) => l && !l.startsWith('#'))
    const joined = []
    for (const l of lines) (l.startsWith('<') && joined.length ? (joined[joined.length - 1] += l) : joined.push(l))
    const presentation = joined.filter((l) => /^&[^<]*=/.test(l))
    const core = joined.filter((l) => !presentation.includes(l))
    return { type: m[1], rules: core, presentationFormRules: { count: presentation.length, description: 'rules of the form &base=presentation-form… that make Arabic presentation forms sort identically to their decompositions; not copied', first: presentation[0] ?? null } }
  })
  const reorder = types.map((t) => t.rules.find((r) => r.startsWith('[reorder')) ?? null)
  // What the running Intl.Collator does. Each probe is a pair and the result of compare() at three sensitivities.
  const probe = (id, a, b, what) => {
    const r = {}
    for (const sensitivity of ['base', 'accent', 'variant']) r[sensitivity] = Math.sign(new Intl.Collator('ar', { sensitivity }).compare(a, b))
    return { id, what, a, b, compare: r }
  }
  const index = parseUnicodeSet(cldrChars(LANG).index)
  const sorted = [...index].reverse().sort(new Intl.Collator('ar').compare)
  const resolved = new Intl.Collator('ar').resolvedOptions()
  emit('collation', null, {
    cldr: {
      file: 'common/collation/ar.xml',
      types,
      defaultType: 'standard',
      scriptReorder: reorder[types.findIndex((t) => t.type === 'standard')],
    },
    intlProbe: {
      runtime: { node: process.versions.node, icu: process.versions.icu, cldr: process.versions.cldr, unicode: process.versions.unicode },
      resolved: { locale: resolved.locale, collation: resolved.collation, sensitivity: resolved.sensitivity, numeric: resolved.numeric, ignorePunctuation: resolved.ignorePunctuation },
      requestedCollation: Object.fromEntries(['standard', 'compat'].map((c) => [c, new Intl.Collator(`ar-u-co-${c}`).resolvedOptions().collation])),
      alphabetOrder: { input: 'CLDR ar index exemplar set, reversed', sortedMatchesIndexOrder: sorted.join('') === index.join(''), sorted },
      arabicBeforeLatin: Math.sign(new Intl.Collator('ar').compare('ي', 'a')) === -1,
      digitsBeforeLetters: Math.sign(new Intl.Collator('ar').compare('9', 'ا')) === -1,
      pairs: [
        probe('tashkeel', 'كتب', 'ك\u064eت\u064eب\u064e', 'unvocalised vs fully vocalised'),
        probe('shadda', 'مد', 'مد\u0651', 'without vs with shadda'),
        probe('tatweel', 'كتب', 'كـتب', 'without vs with tatweel U+0640'),
        probe('alef-hamza-above', 'احمد', 'أحمد', 'bare alef vs alef with hamza above'),
        probe('alef-hamza-below', 'اسلام', 'إسلام', 'bare alef vs alef with hamza below'),
        probe('alef-madda', 'امن', 'آمن', 'bare alef vs alef with madda'),
        probe('alef-wasla', 'اسم', 'ٱسم', 'bare alef vs alef wasla U+0671'),
        probe('alef-maqsura-yeh', 'على', 'علي', 'alef maqsura U+0649 vs yeh U+064A'),
        probe('farsi-yeh', 'علي', 'علی', 'yeh U+064A vs Farsi yeh U+06CC'),
        probe('teh-marbuta-heh', 'مدرسة', 'مدرسه', 'teh marbuta U+0629 vs heh U+0647'),
        probe('teh-marbuta-teh', 'مدرسة', 'مدرست', 'teh marbuta U+0629 vs teh U+062A'),
        probe('kaf-keheh', 'كتاب', 'کتاب', 'kaf U+0643 vs keheh U+06A9'),
        probe('waw-hamza', 'مسوول', 'مسؤول', 'waw vs waw with hamza above'),
        probe('yeh-hamza', 'ريس', 'رئيس', 'yeh vs yeh with hamza above'),
        probe('lam-alef-ligature', 'لا', '\uFEFB', 'lam + alef vs ligature U+FEFB'),
        probe('presentation-form', 'ب', '\uFE91', 'beh vs initial presentation form U+FE91'),
        probe('arabic-indic-digits', '123', '١٢٣', 'ASCII digits vs Arabic-Indic digits'),
        probe('extended-digits', '١٢٣', '۱۲۳', 'Arabic-Indic vs Extended Arabic-Indic digits'),
        probe('rlm', 'كتب', 'كتب\u200F', 'without vs with trailing U+200F'),
        probe('zwnj', 'كتب', 'ك\u200Cتب', 'without vs with U+200C'),
        probe('arabic-comma', 'ا,ب', 'ا\u060cب', 'ASCII comma vs Arabic comma'),
      ],
      numeric: { 'default: ٢ vs ١٠': Math.sign(new Intl.Collator('ar').compare('٢', '١٠')), 'numeric:true: ٢ vs ١٠': Math.sign(new Intl.Collator('ar', { numeric: true }).compare('٢', '١٠')), 'numeric:true: 2 vs ١٠': Math.sign(new Intl.Collator('ar', { numeric: true }).compare('2', '١٠')) },
      searchUsage: { 'usage:search base: كتب vs ك\u064eت\u064eب\u064e': Math.sign(new Intl.Collator('ar', { usage: 'search', sensitivity: 'base' }).compare('كتب', 'ك\u064eت\u064eب\u064e')), 'usage:search base: احمد vs أحمد': Math.sign(new Intl.Collator('ar', { usage: 'search', sensitivity: 'base' }).compare('احمد', 'أحمد')), 'usage:search base: على vs علي': Math.sign(new Intl.Collator('ar', { usage: 'search', sensitivity: 'base' }).compare('على', 'علي')), 'usage:search base: مدرسة vs مدرسه': Math.sign(new Intl.Collator('ar', { usage: 'search', sensitivity: 'base' }).compare('مدرسة', 'مدرسه')) },
      legend: 'compare values: 0 = treated as equal, -1 = a sorts first, 1 = b sorts first',
    },
  }, [{ name: 'Unicode CLDR', url: 'https://github.com/unicode-org/cldr/blob/release-49/common/collation/ar.xml', version: 'release-49', license: 'Unicode-3.0', retrievedAt: RETRIEVED_AT, path: 'common/collation/ar.xml' }, cldrSource('cldr-misc-full', 'main/ar/characters.json')],
  { notes: `content.cldr is extracted from the CLDR XML (U+200E marks inside rules removed, comments dropped). content.intlProbe is measured by this script on the Node that runs it (Node ${process.versions.node}, ICU ${process.versions.icu}); a different ICU can give different values, so regenerate on the same runtime for a byte-identical file.` })
}

console.log(`wrote ${written.length} files`)
for (const w of written) console.log('  ' + w)
console.log('gregorian-months groups:')
for (const g of monthGroups) console.log('  ' + g.locales.join(' '))
