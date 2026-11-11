#!/usr/bin/env node
// Builds data/regions/<ISO2>.json (22 Arab League regions) and data/currencies/<ISO>.json (every currency those
// regions use, plus USD, EUR, GBP) from pinned upstream artifacts. Zero dependencies; reads files, runs nothing.
//
//   node tools/extract/regions/build.mjs --src <dir> [--out <repo root>] [--check]
//
// <dir> is laid out as tools/extract/regions/fetch.sh leaves it:
//   cldr/{cldr-core,cldr-numbers-full,cldr-dates-full,cldr-localenames-full}/   npm tarballs, unpacked
//   tzdb/src/{zone.tab,backward,version}                                        IANA tzdata
//   iso4217/list-one.xml                                                        ISO 4217 list one (SIX)
//   ucd/{UnicodeData.txt,DerivedAge.txt}                                        Unicode Character Database
//   libphonenumber/PhoneNumberMetadata.xml
// Versions are pinned in inputs/sources.json; the script refuses to run against anything else.
// Hand-written inputs (inputs/*.json) are merged in and marked per field in data.fieldProvenance.
// --check writes nothing and exits 1 if any file on disk differs from what would be generated.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SCRIPT = 'tools/extract/regions/build.mjs'
const argv = process.argv.slice(2)
const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined }
const SRC = arg('--src')
const OUT = path.resolve(arg('--out') ?? path.join(HERE, '..', '..', '..'))
const CHECK = argv.includes('--check')
if (!SRC) { console.error('usage: build.mjs --src <dir> [--out <repo root>] [--check]'); process.exit(2) }

const REGIONS = ['AE', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'JO', 'KM', 'KW', 'LB', 'LY', 'MA', 'MR', 'OM', 'PS', 'QA', 'SA', 'SD', 'SO', 'SY', 'TN', 'YE']
const EXTRA_CURRENCIES = ['USD', 'EUR', 'GBP']
const WIDELY_USED_PERCENT = 10 // non-official languages at or above this share of population are listed as widely-used
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const AR_PLURALS = ['zero', 'one', 'two', 'few', 'many', 'other']

const read = (...p) => fs.readFileSync(path.join(SRC, ...p), 'utf8')
const json = (...p) => JSON.parse(read(...p))
const input = (name) => JSON.parse(fs.readFileSync(path.join(HERE, 'inputs', name), 'utf8'))
const die = (m) => { console.error(`build.mjs: ${m}`); process.exit(1) }

// ---- pins ---------------------------------------------------------------------------------------------------------
const PINS = input('sources.json')
const SRCDEF = PINS.sources
const CLDR_PKGS = ['cldr-core', 'cldr-numbers-full', 'cldr-dates-full', 'cldr-localenames-full']
for (const pkg of CLDR_PKGS) {
  const v = json('cldr', pkg, 'package.json').version
  if (v !== SRCDEF.cldr.version) die(`${pkg} is ${v}, pinned ${SRCDEF.cldr.version}`)
}
const tzVersion = read('tzdb', 'src', 'version').trim()
if (tzVersion !== SRCDEF.tzdb.version) die(`tzdb is ${tzVersion}, pinned ${SRCDEF.tzdb.version}`)
const isoXml = read('iso4217', 'list-one.xml')
const isoPublished = (isoXml.match(/<ISO_4217 Pblshd="([^"]+)"/) ?? [])[1]
if (isoPublished !== SRCDEF.iso4217.version) die(`ISO 4217 list one is ${isoPublished}, pinned ${SRCDEF.iso4217.version}`)
const derivedAge = read('ucd', 'DerivedAge.txt')
const ucdVersion = (derivedAge.match(/^# DerivedAge-([0-9.]+)\.txt/) ?? [])[1]
if (ucdVersion !== SRCDEF.ucd.version) die(`UCD is ${ucdVersion}, pinned ${SRCDEF.ucd.version}`)
const src = (key, pathInSource) => {
  const s = SRCDEF[key]
  return { name: s.name, url: s.url, version: s.version, license: s.license, retrievedAt: s.retrievedAt, ...(pathInSource ? { path: pathInSource } : {}) }
}

// ---- CLDR ---------------------------------------------------------------------------------------------------------
const supp = (f) => json('cldr', 'cldr-core', 'supplemental', `${f}.json`).supplemental
const currencyData = supp('currencyData').currencyData
const weekData = supp('weekData').weekData
const calendarPreference = supp('calendarPreferenceData').calendarPreferenceData
const measurement = supp('measurementData').measurementData
const timeData = supp('timeData').timeData
const territoryInfo = supp('territoryInfo').territoryInfo
const codeMappings = supp('codeMappings').codeMappings
const availableLocales = json('cldr', 'cldr-core', 'availableLocales.json').availableLocales.full
const defaultContent = json('cldr', 'cldr-core', 'defaultContent.json').defaultContent
const main = (pkg, locale, file) => json('cldr', pkg, 'main', locale, `${file}.json`).main[locale]
const hasLocale = (pkg, locale) => fs.existsSync(path.join(SRC, 'cldr', pkg, 'main', locale))
const arLocales = fs.readdirSync(path.join(SRC, 'cldr', 'cldr-numbers-full', 'main')).filter((l) => /^ar-[A-Z]{2}$/.test(l)).sort()

const territoryNames = { ar: main('cldr-localenames-full', 'ar', 'territories').localeDisplayNames.territories, en: main('cldr-localenames-full', 'en', 'territories').localeDisplayNames.territories }
const currencies = { ar: main('cldr-numbers-full', 'ar', 'currencies').numbers.currencies, en: main('cldr-numbers-full', 'en', 'currencies').numbers.currencies }
const months = (locale) => Object.values(main('cldr-dates-full', locale, 'ca-gregorian').dates.calendars.gregorian.months.format.wide)

// Month-name families are anchored on three locales; the first month is asserted so a CLDR change fails loudly.
const FAMILY = { 'english-derived': ['ar', 'يناير'], syriac: ['ar-LB', 'كانون الثاني'], 'french-derived': ['ar-DZ', 'جانفي'] }
const familyMonths = {}
for (const [family, [locale, january]] of Object.entries(FAMILY)) {
  familyMonths[family] = months(locale)
  if (familyMonths[family][0] !== january) die(`month family anchor ${locale} no longer starts with ${january}`)
}
const HOUR_CYCLE = { h: 'h12', H: 'h23', K: 'h11', k: 'h24' }

// ---- other sources ------------------------------------------------------------------------------------------------
const zoneTab = {}
for (const line of read('tzdb', 'src', 'zone.tab').split('\n')) {
  if (!line || line.startsWith('#')) continue
  const [cc, , zone] = line.split('\t')
  ;(zoneTab[cc] ??= []).push(zone)
}
const tzLinks = {}
for (const line of read('tzdb', 'src', 'backward').split('\n')) {
  const m = line.match(/^Link\s+(\S+)\s+(\S+)/)
  if (m) tzLinks[m[2]] = m[1]
}
const callingCodes = {}
for (const m of read('libphonenumber', 'PhoneNumberMetadata.xml').matchAll(/<territory\s+id="([A-Z]{2})"[^>]*?\scountryCode="([0-9]+)"/g)) callingCodes[m[1]] = m[2]
const iso = {}
for (const m of isoXml.matchAll(/<CcyNtry>([\s\S]*?)<\/CcyNtry>/g)) {
  const get = (t) => (m[1].match(new RegExp(`<${t}[^>]*>([^<]*)</${t}>`)) ?? [])[1]
  const code = get('Ccy')
  if (!code) continue
  const entry = { numeric: get('CcyNbr'), minorUnits: get('CcyMnrUnts') }
  if (iso[code] && (iso[code].numeric !== entry.numeric || iso[code].minorUnits !== entry.minorUnits)) die(`ISO 4217 rows disagree for ${code}`)
  iso[code] = entry
}
const ucd = {}
for (const line of read('ucd', 'UnicodeData.txt').split('\n')) {
  const f = line.split(';')
  if (f.length > 2) ucd[parseInt(f[0], 16)] = { name: f[1], gc: f[2] }
}
const ages = []
for (const line of derivedAge.split('\n')) {
  const m = line.match(/^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([0-9.]+)/)
  if (m) ages.push([parseInt(m[1], 16), parseInt(m[2] ?? m[1], 16), m[3]])
}
const ageOf = (cp) => (ages.find(([a, b]) => cp >= a && cp <= b) ?? [])[2]

// ---- hand-written inputs -------------------------------------------------------------------------------------------
const DIALECTS = input('dialect-groups.json')
const SUBUNITS = input('subunits.json')
const GLYPH_NOTES = input('glyph-notes.json')

// ---- helpers ------------------------------------------------------------------------------------------------------
const currentTender = (region) => (currencyData.region[region] ?? []).flatMap((e) => Object.entries(e)).filter(([, v]) => !v._to && v._tender !== 'false').map(([c]) => c)
const BIDI = /[؜‎‏‪-‮⁦-⁩]/g
// Bidi controls that are part of a datum (CLDR's Arabic currency symbols end in U+200F) are written as \uXXXX
// escapes so no file contains an invisible character.
const serialize = (doc) => JSON.stringify(doc, null, 2).replace(BIDI, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`) + '\n'
const cpLabel = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`
// docs/DATA_MODEL.md: a file takes the lowest confidence of anything in it.
const FIELD_NOTE = 'Every field is extracted by the script and verified, except those listed in data.fieldProvenance, which carry their own method, confidence and sources. The file-level confidence is the lowest of them.'
const RANK = ['verified', 'needs-review', 'unverified']
const lowest = (fieldProvenance) => RANK[Math.max(0, ...fieldProvenance.map((f) => RANK.indexOf(f.confidence)))]

// ---- regions ------------------------------------------------------------------------------------------------------
function buildRegion(code) {
  const worldDefaults = []
  const pick = (table, field) => {
    if (table[code] !== undefined) return table[code]
    worldDefaults.push(field)
    return table['001']
  }
  const tag = `ar-${code}`
  if (!hasLocale('cldr-numbers-full', tag)) die(`CLDR ships no ${tag}`)
  const numbers = main('cldr-numbers-full', tag, 'numbers').numbers
  const gregorian = main('cldr-dates-full', tag, 'ca-gregorian').dates.calendars.gregorian
  const hourSymbol = (gregorian.timeFormats.short.match(/[hHkK]/) ?? [])[0]
  const wide = Object.values(gregorian.months.format.wide)
  const family = Object.keys(familyMonths).find((f) => familyMonths[f].every((m, i) => m === wide[i])) ?? 'mixed'
  const locale = {
    tag,
    primary: true,
    defaultNumberingSystem: numbers.defaultNumberingSystem,
    nativeNumberingSystem: numbers.otherNumberingSystems.native,
    hourCycle: HOUR_CYCLE[hourSymbol],
    gregorianMonthNames: family,
  }
  if (family === 'mixed') locale.monthNamesSharedWith = Object.fromEntries(Object.entries(familyMonths).map(([f, list]) => [f, list.filter((m, i) => m === wide[i]).length]))

  const languages = []
  for (const [lang, info] of Object.entries(territoryInfo[code].languagePopulation)) {
    const status = info._officialStatus
    const percent = Number(info._populationPercent)
    const role = status === 'official' || status === 'de_facto_official' ? 'official' : status === 'official_regional' ? 'official-regional' : !status && percent >= WIDELY_USED_PERCENT ? 'widely-used' : null
    if (!role) { if (status) die(`unmapped official status ${status} for ${lang} in ${code}`); continue }
    languages.push({ code: lang.replace(/_/g, '-'), role, ...(status ? { cldrStatus: status } : {}), populationPercent: percent })
  }
  const roleOrder = ['official', 'official-regional', 'widely-used']
  languages.sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role) || b.populationPercent - a.populationPercent || (a.code < b.code ? -1 : 1))

  const others = [...availableLocales, ...defaultContent].filter((l) => l.split('-').at(-1) === code && l !== tag).sort()
  const tender = currentTender(code)
  const firstDay = pick(weekData.firstDay, 'week.firstDay')
  const start = DAYS.indexOf(weekData.weekendStart[code] ?? weekData.weekendStart['001'])
  const end = DAYS.indexOf(weekData.weekendEnd[code] ?? weekData.weekendEnd['001'])
  if ((weekData.weekendStart[code] === undefined) !== (weekData.weekendEnd[code] === undefined)) die(`half a weekend for ${code}`)
  if (weekData.weekendStart[code] === undefined) worldDefaults.push('week.weekend')
  const weekend = []
  for (let i = start; ; i = (i + 1) % 7) { weekend.push(DAYS[i]); if (i === end) break }
  const minDays = Number(pick(weekData.minDays, 'week.minDaysInFirstWeek'))
  const calendars = pick(calendarPreference, 'calendars')
  const zones = zoneTab[code]
  const links = Object.fromEntries(zones.filter((z) => tzLinks[z]).map((z) => [z, tzLinks[z]]))
  const time = timeData[code] ?? (worldDefaults.push('timeData'), timeData['001'])
  const measurementSystem = pick(measurement.measurementSystem, 'measurementSystem')
  const paperSize = pick(measurement.paperSize, 'paperSize')
  const short = { ar: territoryNames.ar[`${code}-alt-short`], en: territoryNames.en[`${code}-alt-short`] }

  const data = {
    code,
    alpha3: codeMappings[code]._alpha3,
    numeric: codeMappings[code]._numeric,
    name: { ar: territoryNames.ar[code], en: territoryNames.en[code] },
    ...(short.ar && short.en ? { nameVariants: { short } } : {}),
    arabLeague: true,
    languages,
    locales: [locale],
    ...(others.length ? { otherLocales: others } : {}),
    currency: { primary: tender[0], ...(tender.length > 1 ? { alsoUsed: tender.slice(1) } : {}) },
    week: { firstDay, weekend, minDaysInFirstWeek: minDays },
    calendars,
    timeZones: zones,
    ...(Object.keys(links).length ? { tzdbLinks: links } : {}),
    timeData: { preferred: time._preferred, allowed: time._allowed.split(' ') },
    measurementSystem,
    paperSize,
    phone: { callingCode: callingCodes[code] },
    dialectGroup: DIALECTS.groups[code],
    ...(worldDefaults.length ? { worldDefaults } : {}),
    fieldProvenance: [{ path: 'dialectGroup', method: 'authored', confidence: 'needs-review', note: DIALECTS.note }],
  }
  for (const k of ['alpha3', 'numeric', 'dialectGroup']) if (!data[k]) die(`${code}: no ${k}`)
  if (!data.phone.callingCode || !zones?.length || !tender.length) die(`${code}: missing calling code, zones or currency`)
  return {
    kind: 'region',
    schemaVersion: 1,
    id: code,
    provenance: {
      method: 'extracted',
      confidence: lowest(data.fieldProvenance),
      sources: [
        src('cldr', 'cldr-core (supplemental, availableLocales, defaultContent); cldr-numbers-full, cldr-dates-full, cldr-localenames-full main/ar, main/ar-*, main/en'),
        src('tzdb', 'zone.tab, backward'),
        src('libphonenumber', 'resources/PhoneNumberMetadata.xml'),
      ],
      script: SCRIPT,
      notes: FIELD_NOTE,
    },
    data,
  }
}

// ---- currencies ---------------------------------------------------------------------------------------------------
function buildCurrency(code) {
  const ar = currencies.ar[code]
  const en = currencies.en[code]
  if (!ar?.displayName || !en?.displayName) die(`${code}: no CLDR name`)
  if (!iso[code]) die(`${code}: not in ISO 4217 list one`)
  if (Number(codeMappings[code]?._numeric) !== Number(iso[code].numeric)) die(`${code}: CLDR and ISO numeric codes disagree`)
  const fieldProvenance = []

  const stated = AR_PLURALS.filter((c) => ar[`displayName-count-${c}`])
  if (!stated.includes('other')) die(`${code}: no Arabic count-other`)
  const pluralAr = Object.fromEntries(AR_PLURALS.filter((c) => c !== 'zero' || stated.includes('zero')).map((c) => [c, ar[`displayName-count-${c}`] ?? ar['displayName-count-other']]))
  const plural = { ar: pluralAr, arStated: stated, en: { one: en['displayName-count-one'], other: en['displayName-count-other'] } }

  const codeFallback = ['ar', 'en'].filter((l) => !currencies[l][code].symbol)
  const symbol = { standard: { ar: ar.symbol ?? code, en: en.symbol ?? code } }
  if (ar['symbol-alt-narrow'] || en['symbol-alt-narrow']) symbol.narrow = { ar: ar['symbol-alt-narrow'] ?? symbol.standard.ar, en: en['symbol-alt-narrow'] ?? symbol.standard.en }
  if (ar['symbol-alt-variant'] || en['symbol-alt-variant']) {
    if (!ar['symbol-alt-variant'] || !en['symbol-alt-variant']) die(`${code}: variant symbol in one language only`)
    symbol.variant = { ar: ar['symbol-alt-variant'], en: en['symbol-alt-variant'] }
  }
  if (codeFallback.length) symbol.codeFallback = codeFallback
  const byLocale = {}
  for (const l of arLocales) {
    const o = main('cldr-numbers-full', l, 'currencies').numbers.currencies[code] ?? {}
    const diff = {}
    if (o.symbol !== undefined && o.symbol !== ar.symbol) diff.standard = o.symbol
    if (o['symbol-alt-narrow'] !== undefined && o['symbol-alt-narrow'] !== ar['symbol-alt-narrow']) diff.narrow = o['symbol-alt-narrow']
    for (const k of Object.keys(o)) if (k.startsWith('displayName') && o[k] !== ar[k]) die(`${l} overrides ${code} ${k}; the schema has no place for it yet`)
    if (Object.keys(diff).length) byLocale[l] = diff
  }
  if (Object.keys(byLocale).length) symbol.byLocale = byLocale
  // A dedicated sign: CLDR's variant symbol, else its English symbol, when that is one code point of category Sc.
  const candidate = [symbol.variant?.en, symbol.standard.en].find((s) => s && [...s].length === 1 && ucd[s.codePointAt(0)]?.gc === 'Sc')
  if (candidate) {
    const cp = candidate.codePointAt(0)
    const researched = GLYPH_NOTES.notes[code]
    symbol.glyph = { char: candidate, codepoint: cpLabel(cp), unicodeVersion: ageOf(cp), note: `${ucd[cp].name}.${researched ? ` ${researched.note}` : ''}` }
    if (researched) fieldProvenance.push({ path: 'symbol.glyph.note', method: 'researched', confidence: researched.confidence, sources: researched.sources, note: 'char, codepoint and unicodeVersion are extracted from the UCD; only the sentence after the character name is researched.' })
  } else if (GLYPH_NOTES.notes[code]) die(`${code}: glyph note without a glyph`)

  const fr = currencyData.fractions[code]
  const base = fr ?? currencyData.fractions.DEFAULT
  const digits = Number(base._digits)
  const rounding = Number(base._rounding)
  const cashStated = base._cashDigits !== undefined || base._cashRounding !== undefined
  const cash = { minorUnits: Number(base._cashDigits ?? base._digits), roundingIncrement: Number(base._cashRounding ?? base._rounding), stated: cashStated }

  const regions = Object.keys(currencyData.region).filter((r) => /^[A-Z]{2}$/.test(r) && currentTender(r).includes(code)).sort()
  const data = {
    code,
    numeric: iso[code].numeric,
    name: { ar: ar.displayName, en: en.displayName },
    plural,
    symbol,
    minorUnits: Number(iso[code].minorUnits),
    cldrFractions: { digits, rounding, stated: fr !== undefined },
    cash,
  }
  const sub = SUBUNITS.currencies[code]
  if (sub) {
    data.subunit = { name: sub.name, ...(sub.plural ? { plural: sub.plural } : {}), perUnit: sub.perUnit, ...(sub.others ? { others: sub.others } : {}), ...(sub.note ? { note: sub.note } : {}) }
    fieldProvenance.push({ path: 'subunit', method: 'researched', confidence: sub.confidence, sources: sub.sources, ...(sub.provenanceNote ? { note: sub.provenanceNote } : {}) })
    if (sub.plural) fieldProvenance.push({ path: 'subunit.plural', method: 'authored', confidence: 'needs-review', note: SUBUNITS.pluralNote })
  }
  data.regions = regions
  data.arabLeagueRegions = REGIONS.filter((r) => currentTender(r).includes(code))
  if (fieldProvenance.length) data.fieldProvenance = fieldProvenance
  return {
    kind: 'currency',
    schemaVersion: 1,
    id: code,
    provenance: {
      method: 'extracted',
      confidence: lowest(fieldProvenance),
      sources: [
        src('cldr', 'cldr-core supplemental/currencyData.json, codeMappings.json; cldr-numbers-full main/ar, main/ar-*, main/en currencies.json'),
        src('iso4217', 'list-one.xml'),
        ...(symbol.glyph ? [src('ucd', 'ucd/UnicodeData.txt, ucd/DerivedAge.txt')] : []),
      ],
      script: SCRIPT,
      ...(fieldProvenance.length ? { notes: FIELD_NOTE } : {}),
    },
    data,
  }
}

// ---- write --------------------------------------------------------------------------------------------------------
const outputs = new Map()
for (const r of REGIONS) outputs.set(`data/regions/${r}.json`, serialize(buildRegion(r)))
const currencyCodes = [...new Set([...REGIONS.flatMap(currentTender), ...EXTRA_CURRENCIES])].sort()
for (const c of currencyCodes) outputs.set(`data/currencies/${c}.json`, serialize(buildCurrency(c)))
for (const c of Object.keys(SUBUNITS.currencies)) if (!currencyCodes.includes(c)) die(`subunits.json has ${c}, which is not generated`)

let different = 0
for (const [rel, text] of outputs) {
  const file = path.join(OUT, rel)
  if (CHECK) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) { different++; console.error(`differs: ${rel}`) }
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, text)
  }
}
for (const dir of ['data/regions', 'data/currencies']) {
  const full = path.join(OUT, dir)
  for (const f of fs.existsSync(full) ? fs.readdirSync(full) : []) if (!outputs.has(`${dir}/${f}`)) { different++; console.error(`not generated by this script: ${dir}/${f}`) }
}
console.log(`${CHECK ? 'checked' : 'wrote'} ${REGIONS.length} regions and ${currencyCodes.length} currencies (CLDR ${SRCDEF.cldr.version}, tzdb ${tzVersion}, ISO 4217 ${isoPublished}, UCD ${ucdVersion}, libphonenumber ${SRCDEF.libphonenumber.version})`)
if (CHECK && different) process.exit(1)
