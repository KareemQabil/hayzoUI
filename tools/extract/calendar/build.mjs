#!/usr/bin/env node
// Builds data/calendar/*.json and data/calendar/tables/islamic-umalqura.json.
//   node tools/extract/calendar/build.mjs <sources-dir>
// <sources-dir> (see tools/extract/language/fetch.sh) holds cldr/<package>/…, icu/<tag>/*.cpp and intl-date/src/….
// Names, eras and regional preference come from CLDR; arithmetic constants and the Umm al-Qura month-length table come
// from ICU4C islamcal.cpp (cross-checked against @internationalized/date); every `intl` block and every `verification`
// block is measured on the Node that runs this script, whose versions are recorded next to the result.
import path from 'node:path'
import { readJson, readText, writeData, envelope, cldrSource, icuSource, ARAB_LEAGUE, RETRIEVED_AT, ICU_TAG } from '../language/lib.mjs'

const SRC = process.argv[2]
if (!SRC) {
  console.error('usage: node tools/extract/calendar/build.mjs <sources-dir>')
  process.exit(2)
}
const CLDR = path.join(SRC, 'cldr')
const SCRIPT = 'tools/extract/calendar/build.mjs'
const RUNTIME = { node: process.versions.node, icu: process.versions.icu, cldr: process.versions.cldr, unicode: process.versions.unicode, tz: process.versions.tz }
const RUNTIME_LABEL = `Node ${RUNTIME.node} (ICU ${RUNTIME.icu}, CLDR ${RUNTIME.cldr})`
const supplemental = (file) => readJson(path.join(CLDR, 'cldr-core', 'supplemental', file)).supplemental
const DAY = 86400000
const JD_UNIX_EPOCH = 2440588 // Julian day number of 1970-01-01
const iso = (jd) => new Date((jd - JD_UNIX_EPOCH) * DAY).toISOString().slice(0, 10)
const floorDiv = (a, b) => Math.floor(a / b)

// ───────────────────────────── ICU source: constants and tables ─────────────────────────────
const islamcal = readText(path.join(SRC, 'icu', ICU_TAG, 'islamcal.cpp'))
const intConst = (src, name) => {
  const m = new RegExp(`static const int32_t ${name}\\s*=\\s*(-?\\d+);`).exec(src)
  if (!m) throw new Error(`constant ${name} not found`)
  return Number(m[1])
}
const need = (src, snippet, what) => {
  if (!src.includes(snippet)) throw new Error(`ICU source no longer contains ${what}: ${snippet}`)
}
const CIVIL_EPOCH = intConst(islamcal, 'CIVIL_EPOC')
const ASTRONOMICAL_EPOCH = intConst(islamcal, 'ASTRONOMICAL_EPOC')
const UQ_START = intConst(islamcal, 'UMALQURA_YEAR_START')
const UQ_END = intConst(islamcal, 'UMALQURA_YEAR_END')
need(islamcal, 'return (14 + 11 * year) % 30 < 11;', 'the civil leap-year rule')
need(islamcal, 'int32_t length = 29 + (month+1) % 2;', 'the civil month-length rule')
need(islamcal, 'return 354LL * (year-1LL) + ClockMath::floorDivideInt64(3 + 11LL * year, 30LL);', 'the civil year-start rule')
need(islamcal, '(354.36720 * static_cast<double>(year)) + 460322.05 + 0.5);', 'the Umm al-Qura year-start estimate')
need(islamcal, 'int32_t mask = static_cast<int32_t>(0x01 << (11 - month));', 'the Umm al-Qura month mask')
need(islamcal, 'if (days < kUmalquraStart) {\n        IslamicCivilCalendar::handleComputeFields(julianDay, status);', 'the fallback to islamic-civil before the table')
const stripComments = (s) => s.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n')
const islamcalCode = stripComments(islamcal) // the table's last comment line contains "};"
const arrayBody = (name) => {
  const start = islamcalCode.indexOf(name)
  if (start < 0) throw new Error(`array ${name} not found`)
  const open = islamcalCode.indexOf('{', start)
  return islamcalCode.slice(open + 1, islamcalCode.indexOf('};', open))
}
const UQ_MASKS = [...arrayBody('static const int UMALQURA_MONTHLENGTH[]').matchAll(/0x([0-9A-Fa-f]{4})/g)].map((m) => parseInt(m[1], 16))
const UQ_FIX = [...arrayBody('static const int8_t umAlQuraYrStartEstimateFix[]').matchAll(/-?\d+/g)].map((m) => Number(m[0]))
const YEARS = UQ_END - UQ_START + 1
if (UQ_MASKS.length !== YEARS || UQ_FIX.length !== YEARS) throw new Error(`expected ${YEARS} table rows, got ${UQ_MASKS.length} / ${UQ_FIX.length}`)

// Cross-check: @internationalized/date ships the same table as base64 little-endian uint16.
const intlDateSrc = readText(path.join(SRC, 'intl-date', 'src', 'calendars', 'IslamicCalendar.ts'))
const intlDateVersion = readJson(path.join(SRC, 'intl-date', 'package.json')).version
const b64 = /const UMALQURA_DATA =\s*'([A-Za-z0-9+/=]+)'/.exec(intlDateSrc)[1]
const buf = Buffer.from(b64, 'base64')
const intlDateMasks = Array.from({ length: buf.length / 2 }, (_, i) => buf.readUInt16LE(i * 2))
const intlDateStart = Number(/const UMALQURA_START_DAYS = (\d+);/.exec(intlDateSrc)[1])
const intlDateMismatches = []
for (let i = 0; i < YEARS; i++) if (intlDateMasks[i] !== UQ_MASKS[i]) intlDateMismatches.push(UQ_START + i)

// ───────────────────────────── arithmetic used for verification ─────────────────────────────
const civilLeap = (y) => (14 + 11 * y) % 30 < 11
const civilYearStart = (y) => 354 * (y - 1) + floorDiv(3 + 11 * y, 30)
const civilMonthLength = (y, m) => 29 + ((m + 1) % 2) + (m === 11 && civilLeap(y) ? 1 : 0) // m is 0-based
function civilFromDays(days) {
  // days since the epoch, origin 0
  let y = floorDiv(30 * days + 10646, 10631)
  while (civilYearStart(y) > days) y--
  while (civilYearStart(y + 1) <= days) y++
  let d = days - civilYearStart(y)
  let m = 0
  while (d >= civilMonthLength(y, m)) d -= civilMonthLength(y, m++)
  return { year: y, month: m + 1, day: d + 1 }
}
const uqMonthLength = (y, m) => ((UQ_MASKS[y - UQ_START] & (1 << (11 - m))) !== 0 ? 30 : 29)
const uqYearLength = (y) => Array.from({ length: 12 }, (_, m) => uqMonthLength(y, m)).reduce((a, b) => a + b, 0)
const icuYearStart = (y) => Math.trunc(354.3672 * (y - UQ_START) + 460322.05 + 0.5) + UQ_FIX[y - UQ_START]
const uqYearStart = []
{
  let start = icuYearStart(UQ_START)
  for (let y = UQ_START; y <= UQ_END; y++) {
    uqYearStart.push(start)
    start += uqYearLength(y)
  }
}
const yearStartFormulaMismatches = []
for (let y = UQ_START; y <= UQ_END; y++) if (icuYearStart(y) !== uqYearStart[y - UQ_START]) yearStartFormulaMismatches.push(y)

function copticFromJd(jd, epoch) {
  const n = jd - epoch
  const c4 = floorDiv(n, 1461)
  const r4 = n - c4 * 1461
  const year = 4 * c4 + (floorDiv(r4, 365) - floorDiv(r4, 1460))
  const doy = r4 === 1460 ? 365 : r4 % 365
  return { year, month: floorDiv(doy, 30) + 1, day: (doy % 30) + 1 }
}

// ───────────────────────────── Intl probes ─────────────────────────────
function partsFormatter(calendar) {
  const f = new Intl.DateTimeFormat(`en-u-ca-${calendar}-nu-latn`, { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric', era: 'short' })
  return (jd) => {
    const out = {}
    for (const p of f.formatToParts(new Date((jd - JD_UNIX_EPOCH) * DAY))) if (p.type !== 'literal') out[p.type] = p.value
    return { year: Number(out.year), month: Number(out.month), day: Number(out.day), era: out.era }
  }
}
function compareRange(calendar, fromJd, toJd, expected) {
  const get = partsFormatter(calendar)
  const mismatches = []
  let count = 0
  for (let jd = fromJd; jd <= toJd; jd++) {
    const a = get(jd)
    const e = expected(jd)
    count++
    if (a.year !== e.year || a.month !== e.month || a.day !== e.day) if (mismatches.length < 20) mismatches.push({ gregorian: iso(jd), intl: `${a.year}-${a.month}-${a.day}`, expected: `${e.year}-${e.month}-${e.day}` })
      else mismatches.push(null)
  }
  return { daysCompared: count, mismatchCount: mismatches.length, mismatches: mismatches.filter(Boolean) }
}
const utc = (y, m, d) => new Date(Date.UTC(2000, 0, 1)).setUTCFullYear(y, m - 1, d) // Date.UTC maps years 0–99 to 1900–1999
const jdOf = (y, m, d) => utc(y, m, d) / DAY + JD_UNIX_EPOCH
const PROBE_FROM = jdOf(1800, 1, 1)
const PROBE_TO = jdOf(2200, 12, 31)
function basicProbe(id) {
  const resolved = new Intl.DateTimeFormat(`ar-u-ca-${id}`).resolvedOptions().calendar
  const sample = new Date(Date.UTC(2026, 10, 11))
  const fmt = (locale) => new Intl.DateTimeFormat(`${locale}-u-ca-${id}-nu-latn`, { timeZone: 'UTC', dateStyle: 'long' }).format(sample)
  const edge = (ms) => {
    try {
      return new Intl.DateTimeFormat(`en-u-ca-${id}-nu-latn`, { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric', era: 'short' }).format(new Date(ms))
    } catch (e) {
      return `throws ${e.name}`
    }
  }
  return {
    runtime: RUNTIME,
    inSupportedValuesOf: Intl.supportedValuesOf('calendar').includes(id),
    resolvedCalendar: resolved,
    sample: { gregorian: '2026-11-11', ar: fmt('ar'), en: fmt('en') },
    edges: { 'ECMAScript minimum time value (-271821-04-20)': edge(-8.64e15), '0001-01-01': edge(utc(1, 1, 1)), 'ECMAScript maximum time value (+275760-09-13)': edge(8.64e15) },
    temporalAvailable: typeof globalThis.Temporal === 'object',
  }
}
function observedMonthLengths(id) {
  const get = partsFormatter(id)
  const lengths = new Map()
  let prev = get(PROBE_FROM)
  let run = 1
  let started = false
  for (let jd = PROBE_FROM + 1; jd <= PROBE_TO; jd++) {
    const cur = get(jd)
    if (cur.month !== prev.month) {
      if (started) lengths.set(run, (lengths.get(run) ?? 0) + 1)
      started = true
      run = 1
    } else run++
    prev = cur
  }
  return Object.fromEntries([...lengths].sort((a, b) => a[0] - b[0]).map(([k, v]) => [String(k), v]))
}
function differingDays(a, b) {
  const ga = partsFormatter(a)
  const gb = partsFormatter(b)
  let n = 0
  let total = 0
  let first = null
  for (let jd = PROBE_FROM; jd <= PROBE_TO; jd++) {
    const x = ga(jd)
    const y = gb(jd)
    total++
    if (x.year !== y.year || x.month !== y.month || x.day !== y.day) {
      n++
      first ??= iso(jd)
    }
  }
  return { compared: `${a} vs ${b}`, from: iso(PROBE_FROM), to: iso(PROBE_TO), days: total, differing: n, ...(first ? { firstDifference: first } : {}) }
}

// ───────────────────────────── CLDR pieces ─────────────────────────────
const CALENDARS = [
  { id: 'gregory', cldr: 'gregorian', pkg: 'cldr-dates-full' },
  { id: 'islamic-umalqura', cldr: 'islamic-umalqura', pkg: 'cldr-cal-islamic-full' },
  { id: 'islamic-civil', cldr: 'islamic-civil', pkg: 'cldr-cal-islamic-full' },
  { id: 'islamic-tbla', cldr: 'islamic-tbla', pkg: 'cldr-cal-islamic-full' },
  { id: 'islamic', cldr: 'islamic', pkg: 'cldr-cal-islamic-full' },
  { id: 'islamic-rgsa', cldr: 'islamic-rgsa', pkg: 'cldr-cal-islamic-full' },
  { id: 'coptic', cldr: 'coptic', pkg: 'cldr-cal-coptic-full' },
]
const preference = supplemental('calendarPreferenceData.json').calendarPreferenceData
const calendarData = supplemental('calendarData.json').calendarData
const bcp47 = readJson(path.join(CLDR, 'cldr-bcp47', 'bcp47', 'calendar.json')).keyword.u.ca
const displayNames = (l) => readJson(path.join(CLDR, 'cldr-localenames-full', 'main', l, 'localeDisplayNames.json')).main[l].localeDisplayNames.types.calendar
const cal = (c, l) => readJson(path.join(CLDR, c.pkg, 'main', l, `ca-${c.cldr}.json`)).main[l].dates.calendars[c.cldr]

// Every calendar that CLDR lists for an Arab League region must be covered here.
const listed = new Set(ARAB_LEAGUE.flatMap((r) => preference[r] ?? preference['001']))
for (const c of listed) if (!CALENDARS.some((x) => x.cldr === c)) throw new Error(`calendar ${c} is preferred in an Arab League region but not built`)

function preferredIn(c) {
  const out = []
  for (const region of ARAB_LEAGUE) {
    const explicit = preference[region]
    const list = explicit ?? preference['001']
    const rank = list.indexOf(c.cldr)
    if (rank >= 0) out.push({ region, rank: rank + 1, of: list.length, source: explicit ? 'explicit' : 'world-default' })
  }
  return out
}
function months(c, days) {
  const ar = cal(c, 'ar').months
  const en = cal(c, 'en').months
  return Object.keys(ar.format.wide).map(Number).sort((a, b) => a - b).map((i) => ({
    index: i,
    name: { ar: ar.format.wide[i], en: en.format.wide[i] },
    abbreviation: { ar: ar.format.abbreviated[i], en: en.format.abbreviated[i] },
    ...(days ? { days: days[i - 1] } : {}),
  }))
}
function eras(c) {
  const ar = cal(c, 'ar').eras
  const en = cal(c, 'en').eras
  return Object.entries(calendarData[c.cldr].eras).map(([index, e]) => ({
    id: e._code,
    name: { ar: ar.eraNames[index], en: en.eraNames[index] },
    abbreviation: { ar: ar.eraAbbr[index], en: en.eraAbbr[index] },
    cldrIndex: Number(index),
    ...(e._start ? { start: e._start } : {}),
    ...(e._end ? { end: e._end } : {}),
    ...(ar.eraNames[index] === en.eraAbbr[index] || ar.eraNames[index] === en.eraNames[index] ? { arabicNameIsUntranslated: true } : {}),
  })).sort((a, b) => (a.start ? 0 : 1) - (b.start ? 0 : 1))
}
const TYPE = { solar: 'solar', lunar: 'lunar', lunisolar: 'lunisolar' }

// ───────────────────────────── per-calendar facts ─────────────────────────────
const gregoimp = readText(path.join(SRC, 'icu', ICU_TAG, 'gregoimp.cpp'))
const gregoLengths = /Grego::MONTH_LENGTH\[24\]\s*=\s*\{([\d,\s]+)\}/.exec(gregoimp)[1].split(',').map((s) => Number(s.trim()))
const gregoDays = Array.from({ length: 12 }, (_, i) => (gregoLengths[i] === gregoLengths[i + 12] ? gregoLengths[i] : [gregoLengths[i], gregoLengths[i + 12]]))
const coptccal = readText(path.join(SRC, 'icu', ICU_TAG, 'coptccal.cpp'))
const cecal = readText(path.join(SRC, 'icu', ICU_TAG, 'cecal.cpp'))
const COPTIC_EPOCH = intConst(coptccal, 'COPTIC_JD_EPOCH_OFFSET')
need(cecal, 'year = 4 * c4 + (r4/365 - r4/1460);', 'the Coptic year rule')
need(cecal, 'month = doy / 30;', 'the Coptic month rule')
const civilDays = Array.from({ length: 12 }, (_, m) => (m === 11 ? [29, 30] : 29 + ((m + 1) % 2)))
const uqDays = Array.from({ length: 12 }, (_, m) => {
  const all = new Set(Array.from({ length: YEARS }, (_, i) => uqMonthLength(UQ_START + i, m)))
  return all.size === 1 ? [...all][0] : [Math.min(...all), Math.max(...all)]
})
const copticDays = [...Array.from({ length: 12 }, () => 30), [5, 6]]

const uqFirstJd = CIVIL_EPOCH + uqYearStart[0]
const uqLastJd = CIVIL_EPOCH + uqYearStart[YEARS - 1] + uqYearLength(UQ_END) - 1
function uqFromJd(jd) {
  const days = jd - CIVIL_EPOCH
  let lo = 0
  let hi = YEARS - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (uqYearStart[mid] <= days) lo = mid
    else hi = mid - 1
  }
  const y = UQ_START + lo
  let d = days - uqYearStart[lo]
  let m = 0
  while (d >= uqMonthLength(y, m)) d -= uqMonthLength(y, m++)
  return { year: y, month: m + 1, day: d + 1 }
}
console.log('verifying islamic-umalqura against Intl …')
const uqVerification = compareRange('islamic-umalqura', uqFirstJd, uqLastJd, uqFromJd)
const uqBefore = compareRange('islamic-umalqura', uqFirstJd - 20000, uqFirstJd - 1, (jd) => civilFromDays(jd - CIVIL_EPOCH))
const uqAfter = compareRange('islamic-umalqura', uqLastJd + 1, uqLastJd + 20000, (jd) => civilFromDays(jd - CIVIL_EPOCH))
console.log('verifying islamic-civil, islamic-tbla, coptic against Intl …')
const civilVerification = compareRange('islamic-civil', PROBE_FROM, PROBE_TO, (jd) => civilFromDays(jd - CIVIL_EPOCH))
const tblaVerification = compareRange('islamic-tbla', PROBE_FROM, PROBE_TO, (jd) => civilFromDays(jd - ASTRONOMICAL_EPOCH))
const copticVerification = compareRange('coptic', PROBE_FROM, PROBE_TO, (jd) => copticFromJd(jd, COPTIC_EPOCH))
const gregoryVerification = compareRange('gregory', jdOf(1, 1, 1), jdOf(1, 1, 1), () => ({ year: 1, month: 1, day: 1 }))
console.log('probing observational calendars …')
const islamicLengths = observedMonthLengths('islamic')
const rgsaLengths = observedMonthLengths('islamic-rgsa')
const islamicVsRgsa = differingDays('islamic', 'islamic-rgsa')
const islamicVsUq = differingDays('islamic', 'islamic-umalqura')
const civilVsUq = differingDays('islamic-civil', 'islamic-umalqura')
const tblaVsCivil = differingDays('islamic-tbla', 'islamic-civil')
const verified = (v, label) => ({ runtime: RUNTIME, against: label, from: v.from, to: v.to, ...v })
const span = (a, b) => ({ from: iso(a), to: iso(b) })

const TABLE_PATH = 'data/calendar/tables/islamic-umalqura.json'
const FACTS = {
  gregory: {
    days: gregoDays,
    range: 'The whole ECMAScript time range; Intl formats proleptic Gregorian dates (no Julian switch-over).',
    conversion: { method: 'arithmetic', reference: 'Proleptic Gregorian arithmetic; month lengths from ICU4C Grego::MONTH_LENGTH (gregoimp.cpp). This is the calendar of ECMAScript Date itself.' },
    caveats: [
      `Probe on ${RUNTIME_LABEL}: 0001-01-01 formats as year 1, month 1, day 1 (${gregoryVerification.mismatchCount === 0 ? 'confirmed' : 'NOT confirmed'}), i.e. the calendar is proleptic.`,
      'CLDR calls this calendar "gregorian"; the Unicode/BCP 47 identifier that Intl accepts and returns is "gregory".',
      'Month names differ between ar locales (six name sets, see data/language/ar/gregorian-months.*.json); this file carries the names of locale "ar".',
    ],
    notes: 'Month names and eras are those of CLDR locale ar. ar-AE differs in the alternate (variant) era names only.',
  },
  'islamic-umalqura': {
    days: uqDays,
    range: `Table-driven for ${UQ_START}–${UQ_END} AH (${iso(uqFirstJd)} … ${iso(uqLastJd)} Gregorian). Outside the table ICU computes islamic-civil arithmetic, so dates there are not Umm al-Qura dates.`,
    conversion: {
      method: 'table',
      reference: `ICU4C islamcal.cpp (${ICU_TAG}): UMALQURA_MONTHLENGTH holds one 12-bit mask per year (bit 11 = Muharram; set = 30 days, clear = 29); day number = Julian day − ${CIVIL_EPOCH}; year ${UQ_START} starts on day ${uqYearStart[0]}. Outside ${UQ_START}–${UQ_END} ICU falls back to islamic-civil.`,
      table: TABLE_PATH,
      epochJulianDay: CIVIL_EPOCH,
    },
    verification: [
      verified({ ...span(uqFirstJd, uqLastJd), ...uqVerification }, `table in ${TABLE_PATH} vs Intl.DateTimeFormat('en-u-ca-islamic-umalqura'), every day of the table range`),
      verified({ ...span(uqFirstJd - 20000, uqFirstJd - 1), ...uqBefore }, 'islamic-civil arithmetic vs Intl islamic-umalqura, 20000 days before the table'),
      verified({ ...span(uqLastJd + 1, uqLastJd + 20000), ...uqAfter }, 'islamic-civil arithmetic vs Intl islamic-umalqura, 20000 days after the table'),
    ],
    caveats: [
      `Dates before ${iso(uqFirstJd)} or after ${iso(uqLastJd)} silently use islamic-civil arithmetic while still reporting calendar "islamic-umalqura".`,
      `Compared with islamic-civil over ${civilVsUq.from} … ${civilVsUq.to}: ${civilVsUq.differing} of ${civilVsUq.days} days carry a different date.`,
    ],
  },
  'islamic-civil': {
    days: civilDays,
    range: 'Arithmetic, no table limit.',
    conversion: {
      method: 'arithmetic',
      reference: `ICU4C islamcal.cpp (${ICU_TAG}): epoch Julian day ${CIVIL_EPOCH} (Friday 16 July 622 Julian); year y is leap when (14 + 11·y) mod 30 < 11; year start = 354·(y−1) + floor((3 + 11·y)/30) days after the epoch; months alternate 30 and 29 days, the twelfth has 30 in a leap year.`,
      epochJulianDay: CIVIL_EPOCH,
    },
    verification: [verified({ ...span(PROBE_FROM, PROBE_TO), ...civilVerification }, "the arithmetic above vs Intl.DateTimeFormat('en-u-ca-islamic-civil')")],
    caveats: ['The deprecated alias "islamicc" resolves to "islamic-civil".', 'A fixed 30-year cycle: it does not track the moon or any national announcement.'],
  },
  'islamic-tbla': {
    days: civilDays,
    range: 'Arithmetic, no table limit.',
    conversion: {
      method: 'arithmetic',
      reference: `ICU4C islamcal.cpp (${ICU_TAG}): the islamic-civil arithmetic with epoch Julian day ${ASTRONOMICAL_EPOCH} (Thursday 15 July 622 Julian), so every date is one day earlier than islamic-civil.`,
      epochJulianDay: ASTRONOMICAL_EPOCH,
    },
    verification: [verified({ ...span(PROBE_FROM, PROBE_TO), ...tblaVerification }, "the arithmetic above vs Intl.DateTimeFormat('en-u-ca-islamic-tbla')")],
    caveats: [`Compared with islamic-civil over ${tblaVsCivil.from} … ${tblaVsCivil.to}: ${tblaVsCivil.differing} of ${tblaVsCivil.days} days differ (always by one day).`],
  },
  islamic: {
    range: 'Computed, no table. Results are specific to the ICU version.',
    conversion: {
      method: 'astronomical-estimate',
      reference: `ICU4C islamcal.cpp (${ICU_TAG}) IslamicCalendar::trueMonthStart: a month starts on the first day on which ICU's CalendarAstronomer moon age is non-negative. This is an approximation of sighting, not a published calendar; it cannot be reproduced without ICU's astronomy code.`,
      epochJulianDay: CIVIL_EPOCH,
    },
    caveats: [
      `Observed month lengths on ${RUNTIME_LABEL}, ${iso(PROBE_FROM)} … ${iso(PROBE_TO)}: ${Object.entries(islamicLengths).map(([k, v]) => `${k} days × ${v}`).join(', ')}.`,
      `Compared with islamic-umalqura over the same span: ${islamicVsUq.differing} of ${islamicVsUq.days} days carry a different date.`,
      'The ICU source notes (comment above LIMITS in islamcal.cpp) that this implementation can show a month as having 31 days; none was observed in the probed span.',
    ],
  },
  'islamic-rgsa': {
    range: 'Computed, no table. Results are specific to the ICU version.',
    conversion: {
      method: 'astronomical-estimate',
      reference: `ICU4C islamcal.cpp (${ICU_TAG}): IslamicRGSACalendar derives from IslamicCalendar and overrides only the type name, so it computes exactly what "islamic" computes. No Saudi sighting data is involved.`,
      epochJulianDay: CIVIL_EPOCH,
    },
    caveats: [
      `Compared with islamic over ${islamicVsRgsa.from} … ${islamicVsRgsa.to} on ${RUNTIME_LABEL}: ${islamicVsRgsa.differing} of ${islamicVsRgsa.days} days differ.`,
      `Observed month lengths: ${Object.entries(rgsaLengths).map(([k, v]) => `${k} days × ${v}`).join(', ')}.`,
      'CLDR lists it for SA only, fourth after gregorian, islamic-umalqura and islamic.',
    ],
  },
  coptic: {
    days: copticDays,
    type: 'solar',
    range: 'Arithmetic, no table limit.',
    conversion: {
      method: 'arithmetic',
      reference: `ICU4C cecal.cpp / coptccal.cpp (${ICU_TAG}): epoch offset Julian day ${COPTIC_EPOCH}; with n = JD − offset, c4 = floor(n/1461), r4 = n mod 1461: year = 4·c4 + (floor(r4/365) − floor(r4/1460)); day of year = 365 if r4 = 1460, else r4 mod 365; month = floor(doy/30) + 1; day = doy mod 30 + 1. Twelve months of 30 days and a thirteenth of 5 days, 6 every fourth year.`,
      epochJulianDay: COPTIC_EPOCH,
    },
    verification: [verified({ ...span(PROBE_FROM, PROBE_TO), ...copticVerification }, "the arithmetic above vs Intl.DateTimeFormat('en-u-ca-coptic')")],
    caveats: [
      'CLDR 49 has no Arabic name for the era: locale ar carries the root value "AM"; Intl prints "AM" in Arabic text.',
      'CLDR classifies the calendar system as "other"; `type` here is "solar" from its 365/366-day year (see conversion).',
      'CLDR lists it for EG only, second after gregorian.',
    ],
  },
}

// ───────────────────────────── write calendars ─────────────────────────────
const written = []
const namesAr = displayNames('ar')
const namesEn = displayNames('en')
for (const c of CALENDARS) {
  const f = FACTS[c.id]
  const cd = calendarData[c.cldr]
  const type = f.type ?? TYPE[cd.calendarSystem]
  if (!type) throw new Error(`no type for ${c.id}`)
  const probe = basicProbe(c.id)
  const arCal = cal(c, 'ar')
  const data = {
    id: c.id,
    name: { ar: namesAr[c.cldr], en: namesEn[c.cldr] },
    type,
    months: months(c, f.days),
    eras: eras(c),
    intl: {
      identifier: c.id,
      runtimeSupport: `${RUNTIME_LABEL}: ${probe.inSupportedValuesOf ? 'listed by' : 'not listed by'} Intl.supportedValuesOf('calendar'); Intl.DateTimeFormat('ar-u-ca-${c.id}') resolves to "${probe.resolvedCalendar}". Temporal is ${probe.temporalAvailable ? 'available' : 'not available'} in this runtime.`,
      range: f.range,
      caveats: f.caveats,
      probe,
    },
    conversion: f.conversion,
    cldrId: c.cldr,
    cldrCalendarSystem: cd.calendarSystem,
    bcp47Description: bcp47[c.id]._description,
    preferredIn: preferredIn(c),
    dateFormats: { ar: arCal.dateFormats },
    ...(f.verification ? { verification: f.verification } : {}),
    ...(f.notes ? { notes: f.notes } : {}),
  }
  const sources = [
    cldrSource(c.pkg, `main/{ar,en}/ca-${c.cldr}.json`),
    cldrSource('cldr-core', 'supplemental/calendarPreferenceData.json'),
    cldrSource('cldr-core', 'supplemental/calendarData.json'),
    cldrSource('cldr-localenames-full', 'main/{ar,en}/localeDisplayNames.json'),
    cldrSource('cldr-bcp47', 'bcp47/calendar.json'),
    icuSource(c.id === 'gregory' ? 'gregoimp.cpp' : c.id === 'coptic' ? 'cecal.cpp' : 'islamcal.cpp'),
  ]
  written.push(writeData(`data/calendar/${c.id}.json`, envelope('calendar', c.id, {
    method: 'extracted', confidence: 'verified', sources, script: SCRIPT,
    notes: `Names, eras and preferredIn are copied from CLDR; conversion constants are read from the ICU source and asserted by the script; intl.probe, intl.caveats with figures and verification are measured on ${RUNTIME_LABEL} and change with the runtime.`,
  }, data)))
}

// ───────────────────────────── write the Umm al-Qura table ─────────────────────────────
{
  const years = []
  for (let y = UQ_START; y <= UQ_END; y++) {
    const i = y - UQ_START
    const monthLengths = Array.from({ length: 12 }, (_, m) => uqMonthLength(y, m))
    years.push({ year: y, mask: '0x' + UQ_MASKS[i].toString(16).toUpperCase().padStart(4, '0'), monthLengths: monthLengths.join(' '), days: uqYearLength(y), startDay: uqYearStart[i], gregorianStart: iso(CIVIL_EPOCH + uqYearStart[i]) })
  }
  const lengthCounts = {}
  for (const y of years) lengthCounts[y.days] = (lengthCounts[y.days] ?? 0) + 1
  written.push(writeData(TABLE_PATH, envelope('calendar', 'tables/islamic-umalqura', {
    method: 'extracted', confidence: 'verified', script: SCRIPT,
    sources: [
      icuSource('islamcal.cpp'),
      { name: '@internationalized/date', url: 'https://www.npmjs.com/package/@internationalized/date', version: intlDateVersion, license: 'Apache-2.0', retrievedAt: RETRIEVED_AT, path: 'src/calendars/IslamicCalendar.ts' },
    ],
    notes: `The table is taken from ICU4C ${ICU_TAG} (UMALQURA_MONTHLENGTH, UMALQURA_YEAR_START/END). @internationalized/date ${intlDateVersion} is read only to cross-check it (${intlDateMismatches.length} differing years). \`verification\` is measured on ${RUNTIME_LABEL}.`,
  }, {
    tableOf: 'islamic-umalqura',
    firstYear: UQ_START,
    lastYear: UQ_END,
    epochJulianDay: CIVIL_EPOCH,
    unixEpochJulianDay: JD_UNIX_EPOCH,
    gregorianRange: span(uqFirstJd, uqLastJd),
    encoding: {
      mask: '12-bit mask as in ICU: bit 11 (0x800) is month 1 … bit 0 is month 12; a set bit means 30 days, a clear bit 29.',
      monthLengths: 'the same information decoded: twelve space-separated day counts, months 1–12.',
      startDay: 'days from the epoch to 1 Muharram of the year (origin 0): Julian day = epochJulianDay + startDay; days since 1970-01-01 = Julian day − unixEpochJulianDay.',
    },
    totals: { years: years.length, months: years.length * 12, days: years.reduce((n, y) => n + y.days, 0), yearsByLength: lengthCounts },
    years,
    crossChecks: {
      icuYearStartFormula: { description: 'ICU does not sum month lengths for the year start; it uses trunc(354.36720·(y−1300) + 460322.05 + 0.5) + umAlQuraYrStartEstimateFix[y−1300]. Compared here with the cumulative sum of the table.', yearsCompared: YEARS, mismatchingYears: yearStartFormulaMismatches },
      internationalizedDate: { version: intlDateVersion, description: 'UMALQURA_DATA (base64, little-endian uint16) and UMALQURA_START_DAYS compared with the ICU masks and the start day of the first year.', yearsCompared: Math.min(intlDateMasks.length, YEARS), entriesInPackage: intlDateMasks.length, mismatchingYears: intlDateMismatches, startDays: intlDateStart, startDaysMatches: intlDateStart === uqYearStart[0] },
    },
    verification: [
      verified({ ...span(uqFirstJd, uqLastJd), ...uqVerification }, "this table vs Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { timeZone: 'UTC' }), every day"),
    ],
  })))
}
console.log(`wrote ${written.length} files`)
for (const w of written) console.log('  ' + w)
console.log(JSON.stringify({ uq: { days: uqVerification.daysCompared, mismatches: uqVerification.mismatchCount, before: uqBefore.mismatchCount, after: uqAfter.mismatchCount }, civil: civilVerification.mismatchCount, tbla: tblaVerification.mismatchCount, coptic: copticVerification.mismatchCount, intlDate: intlDateMismatches.length, formula: yearStartFormulaMismatches.length, islamicLengths, islamicVsRgsa: islamicVsRgsa.differing, islamicVsUq: islamicVsUq.differing, civilVsUq: civilVsUq.differing }))
