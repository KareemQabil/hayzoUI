#!/usr/bin/env node
// Measures the open Arabic typefaces and writes data/fonts/<id>.json, plus generated tables for the report.
//   node tools/extract/fonts/build.mjs <scratch-dir>         (the directory filled by fetch.mjs)
// Output is a pure function of the files in <scratch-dir>, families.json and sources.lock.json.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { openFont, lookupsFor, gsubRules, closure, markAttachments } from './sfnt.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..', '..', '..')
const SCRIPT = 'tools/extract/fonts/build.mjs'
const scratch = path.resolve(process.argv[2] ?? '')
if (!process.argv[2]) throw new Error('usage: build.mjs <scratch-dir>')
const lock = JSON.parse(fs.readFileSync(path.join(HERE, 'sources.lock.json'), 'utf8'))
const authored = JSON.parse(fs.readFileSync(path.join(HERE, 'families.json'), 'utf8'))
const GF = path.join(scratch, 'google-fonts')
const OUT = path.join(ROOT, 'data', 'fonts')
const GEN = path.join(HERE, 'generated')
fs.mkdirSync(OUT, { recursive: true })
fs.mkdirSync(GEN, { recursive: true })

// ------------------------------------------------------------------ character sets

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const SETS = {
  letters: [...range(0x0621, 0x063a), ...range(0x0641, 0x064a)], // the 36 letters of Arabic-language text
  tashkeel: [...range(0x064b, 0x0652), 0x0670],
  arabicIndicDigits: range(0x0660, 0x0669),
  extendedArabicIndicDigits: range(0x06f0, 0x06f9),
  punctuation: [0x060c, 0x061b, 0x061f, 0x0640, 0x066a, 0x066b, 0x066c, 0x066d, 0x06d4],
  persianUrduLetters: [0x067e, 0x0686, 0x0698, 0x06a9, 0x06af, 0x06cc, 0x0679, 0x0688, 0x0691, 0x06ba, 0x06be, 0x06c1, 0x06d2],
  latinLetters: [...range(0x41, 0x5a), ...range(0x61, 0x7a)],
  latinDigits: range(0x30, 0x39),
  basicLatin: range(0x21, 0x7e),
}
const SHADDA = 0x0651
const VOWELS = SETS.tashkeel.filter((c) => c !== SHADDA)
// Features a shaping engine applies to Arabic by default (OpenType Arabic shaping model).
const SHAPING = ['ccmp', 'locl', 'isol', 'fina', 'fin2', 'fin3', 'medi', 'med2', 'init', 'rlig', 'rclt', 'calt', 'liga', 'mset']
const ARAB = ['arab', 'DFLT']
const hex = (c) => `U+${c.toString(16).toUpperCase().padStart(4, '0')}`
const ceil2 = (x) => Math.ceil(x * 100 - 1e-9) / 100
const round3 = (x) => Math.round(x * 1000) / 1000

// ------------------------------------------------------------------ measuring one font file

function coverageOf(font, cps) {
  const missing = cps.filter((c) => !font.cmap.has(c))
  return { present: cps.length - missing.length, total: cps.length, ...(missing.length ? { missing: missing.map(hex) } : {}) }
}

function digitInfo(font) {
  const tnumLookups = lookupsFor(font.gsub, [], ['tnum'], { anyScript: true })
  const tnum = tnumLookups.length ? new Map(gsubRules(font.gsub, tnumLookups).singles) : null
  const one = (cps) => {
    const gids = cps.map((c) => font.cmap.get(c))
    if (gids.some((g) => g === undefined)) return { present: false }
    const equal = (list) => new Set(list.map((g) => font.advances[g])).size === 1
    const out = { present: true, defaultEqualWidth: equal(gids) }
    if (tnum) {
      out.tnumSubstitutes = gids.every((g) => tnum.has(g))
      if (out.tnumSubstitutes) out.tnumEqualWidth = equal(gids.map((g) => tnum.get(g)))
    }
    return out
  }
  return {
    tnumFeature: tnumLookups.length > 0,
    latin: one(SETS.latinDigits),
    arabicIndic: one(SETS.arabicIndicDigits),
    extendedArabicIndic: one(SETS.extendedArabicIndicDigits),
  }
}

/** Vertical extremes, in font units, of Arabic text as the default shaping features and GPOS mark attachment place it. */
function extents(font) {
  if (font.outlines !== 'glyf') return { measured: false, reason: `${font.outlines} outlines: glyph bounding boxes are not read` }
  const gids = (cps) => cps.map((c) => font.cmap.get(c)).filter((g) => g !== undefined)
  const rules = font.gsub ? gsubRules(font.gsub, lookupsFor(font.gsub, ARAB, SHAPING)) : { singles: [], multiples: [], ligatures: [] }
  const att = font.gpos ? markAttachments(font.gpos, lookupsFor(font.gpos, ARAB, ['mark', 'mkmk'])) : []
  const gposMarks = new Set(att.flatMap((a) => [...a.marks.keys()]))
  const isMark = (g) => font.glyphClass.get(g) === 3 || gposMarks.has(g)
  const variants = (start) => closure(rules, start, { ligatures: false, multiples: false })

  const letterClosure = closure(rules, gids([...SETS.letters, 0x0640]))
  const bases = [...letterClosure].filter((g) => !isMark(g) && font.bbox(g)).sort((a, b) => a - b)
  // Marks a letter carries by decomposition (ccmp splitting e.g. U+0623 into alef + hamza above): only the pairs a
  // multiple substitution of a letter's own cmap glyph produces, on the positional forms of that base.
  const decomposed = [] // [base form, mark]
  const letterGids = new Set(gids(SETS.letters))
  for (const [g, out] of rules.multiples) {
    if (!letterGids.has(g)) continue
    const marks = out.filter((x) => isMark(x) && font.bbox(x))
    const base = out.filter((x) => !isMark(x))
    if (base.length !== 1 || !marks.length) continue
    for (const b of [...variants(base)].sort((a, b) => a - b)) for (const m of marks) decomposed.push([b, m])
  }
  const shadda = [...variants(gids([SHADDA]))].filter((g) => font.bbox(g)).sort((a, b) => a - b)
  const vowels = [...variants(gids(VOWELS))].filter((g) => font.bbox(g)).sort((a, b) => a - b)
  const single = new Set([...shadda, ...vowels])
  const ligSeed = rules.ligatures.filter(([comps]) => comps.every((c) => single.has(c))).map(([, out]) => out)
  const ligMarks = [...variants(ligSeed)].filter((g) => font.bbox(g) && !single.has(g)).sort((a, b) => a - b)

  // The Allah ligature (lam lam heh, with or without its alef, and U+FDF2) is drawn with its own shadda and
  // superscript alef. It counts as unvocalised text but is not a target for further marks.
  const seq = new Map()
  for (const cp of SETS.letters) for (const g of variants(gids([cp]))) if (!seq.has(g)) seq.set(g, [cp])
  for (let changed = true; changed; ) {
    changed = false
    for (const [comps, out] of rules.ligatures) {
      const parts = comps.filter((c) => !isMark(c))
      if (seq.has(out) || !parts.length || !parts.every((c) => seq.has(c))) continue
      const joined = parts.flatMap((c) => seq.get(c))
      for (const g of variants([out])) if (!seq.has(g)) seq.set(g, joined)
      changed = true
    }
  }
  const isAllah = (s) => s.length >= 3 && s[s.length - 1] === 0x0647 && s[s.length - 2] === 0x0644 && s[s.length - 3] === 0x0644
  const noMarks = new Set([...seq].filter(([, s]) => isAllah(s)).map(([g]) => g))
  for (const g of variants(gids([0xfdf2]))) noMarks.add(g)

  // dy offsets at which `mark` attaches to `target` (kinds: base+ligature, or mark)
  const offsets = (target, mark, toMark) => {
    const out = []
    if (!toMark && noMarks.has(target)) return out
    for (const a of att) {
      if ((a.kind === 'mark') !== toMark) continue
      const m = a.marks.get(mark)
      const rows = a.targets.get(target)
      if (!m || !rows) continue
      for (const row of rows) if (row[m.cls]) out.push(row[m.cls].y - m.y)
    }
    return out
  }
  const mk = () => ({ top: -Infinity, bottom: Infinity, topBy: null, bottomBy: null })
  const feed = (e, yMax, yMin, parts) => {
    if (yMax > e.top) (e.top = yMax), (e.topBy = parts)
    if (yMin < e.bottom) (e.bottom = yMin), (e.bottomBy = parts)
  }
  const label = (parts) => parts.map((g) => font.glyphLabel(g)).join(' + ')
  const fin = (e) => (e.topBy ? { top: e.top, bottom: e.bottom, topBy: label(e.topBy), bottomBy: label(e.bottomBy) } : null)

  // 0. unvocalised: letters (with the marks their own decomposition produces), digits, punctuation
  const e0 = mk()
  for (const b of bases) feed(e0, font.bbox(b)[3], font.bbox(b)[1], [b])
  const chains = [] // [base, inherent mark, dy]
  for (const [b, im] of decomposed) for (const dy of offsets(b, im, false)) {
    chains.push([b, im, dy])
    feed(e0, font.bbox(im)[3] + dy, font.bbox(im)[1] + dy, [b, im])
  }
  for (const g of gids([...SETS.arabicIndicDigits, ...SETS.extendedArabicIndicDigits, ...SETS.latinDigits, ...SETS.punctuation])) {
    if (font.bbox(g)) feed(e0, font.bbox(g)[3], font.bbox(g)[1], [g])
  }

  // 1. one tashkeel mark on any letter; 2. shadda + vowel, and ligated mark pairs
  const e1 = { ...e0 }
  const e2 = mk()
  const positioned = att.some((a) => a.kind !== 'mark')
  let attachedPairs = 0
  if (positioned) {
    for (const b of bases) {
      for (const m of single) for (const dy of offsets(b, m, false)) {
        attachedPairs++
        feed(e1, font.bbox(m)[3] + dy, font.bbox(m)[1] + dy, [b, m])
      }
      for (const m of ligMarks) for (const dy of offsets(b, m, false)) feed(e2, font.bbox(m)[3] + dy, font.bbox(m)[1] + dy, [b, m])
      for (const s of shadda) for (const dy1 of offsets(b, s, false)) for (const v of vowels) for (const dy2 of offsets(s, v, true)) {
        feed(e2, font.bbox(v)[3] + dy1 + dy2, font.bbox(v)[1] + dy1 + dy2, [b, s, v])
      }
    }
    for (const [b, im, dy1] of chains) for (const v of single) for (const dy2 of offsets(im, v, true)) {
      feed(e1, font.bbox(v)[3] + dy1 + dy2, font.bbox(v)[1] + dy1 + dy2, [b, im, v])
    }
  } else {
    // No mark-to-base lookups: marks stay where they are drawn.
    for (const m of single) feed(e1, font.bbox(m)[3], font.bbox(m)[1], [m])
    for (const m of ligMarks) feed(e2, font.bbox(m)[3], font.bbox(m)[1], [m])
  }
  feed(e2, e1.top, e1.bottom, null)
  if (e2.topBy === null) e2.topBy = e1.topBy
  if (e2.bottomBy === null) e2.bottomBy = e1.bottomBy

  const latin = mk()
  if (SETS.latinLetters.every((c) => font.cmap.has(c))) for (const g of gids(SETS.basicLatin)) if (font.bbox(g)) feed(latin, font.bbox(g)[3], font.bbox(g)[1], [g])
  const rawMarks = mk()
  for (const g of gids(SETS.tashkeel)) if (font.bbox(g)) feed(rawMarks, font.bbox(g)[3], font.bbox(g)[1], [g])

  return {
    measured: true,
    markPositioning: positioned ? 'gpos' : 'none',
    glyphsConsidered: { letterForms: bases.length, allahLigatureForms: noMarks.size, decomposedLetterForms: decomposed.length, tashkeelForms: single.size, ligatedMarkPairs: ligMarks.length, attachedPairs },
    cursiveAttachment: font.gpos?.featureTags.includes('curs') ?? false,
    unvocalised: fin(e0),
    singleMark: fin(e1),
    fullStack: fin(e2),
    latinBasic: fin(latin),
    tashkeelGlyphsAsDrawn: fin(rawMarks),
  }
}

function measureFile(abs, relSource) {
  const buf = fs.readFileSync(abs)
  const font = openFont(buf)
  const os2 = font.os2
  const m = {
    file: relSource,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    container: font.container,
    fontVersion: font.names.get(5) ?? `head.fontRevision ${font.head.fontRevision}`,
    weightClass: os2.usWeightClass,
    font,
    metrics: {
      unitsPerEm: font.head.unitsPerEm,
      hhea: { ascender: font.hhea.ascender, descender: font.hhea.descender, lineGap: font.hhea.lineGap },
      typo: { ascender: os2.typoAscender, descender: os2.typoDescender, lineGap: os2.typoLineGap },
      win: { ascent: os2.winAscent, descent: os2.winDescent },
      useTypoMetrics: os2.useTypoMetrics,
      xHeight: os2.xHeight,
      capHeight: os2.capHeight,
      head: { yMax: font.head.yMax, yMin: font.head.yMin },
    },
    extents: extents(font),
  }
  return m
}

// ------------------------------------------------------------------ derived line heights

const BASIS =
  'Derived, not measured. All values are unitless multiples of font-size, rounded up to 0.01, and are the maximum over the measured files. ' +
  'T and B are the measured top and bottom ink extremes above/below the baseline divided by unitsPerEm for a scenario; A and D are ascent and descent of a vertical-metrics set divided by unitsPerEm. ' +
  'stacking = T + B: the baseline distance at which the deepest ink of one line cannot touch the tallest ink of the next. ' +
  'containment = max(2T - (A - D), 2B + (A - D)): the line-height at which ink stays inside its own CSS line box (the baseline sits (L + A - D)/2 below the top of a line box of height L), taken as the maximum over the metric sets a browser may use: hhea, and OS/2 typo when USE_TYPO_METRICS is set, otherwise OS/2 win. ' +
  'ui = containment for unvocalised Arabic letters, both digit sets, Arabic punctuation and Basic Latin (single-line controls clip or abut at the line box). ' +
  'body = stacking for Arabic text carrying at most one tashkeel mark per letter. ' +
  'withTashkeel = stacking for fully vocalised text: shadda plus a vowel above, kasra/kasratan below, as placed by GPOS mark and mkmk at the default master. ' +
  'natural = (hhea.ascender - hhea.descender + hhea.lineGap) / unitsPerEm, what line-height: normal resolves to where hhea is used.'

function metricSets(m) {
  const u = m.unitsPerEm
  const sets = [{ name: 'hhea', A: m.hhea.ascender / u, D: -m.hhea.descender / u }]
  if (m.useTypoMetrics) sets.push({ name: 'typo', A: m.typo.ascender / u, D: -m.typo.descender / u })
  else sets.push({ name: 'win', A: m.win.ascent / u, D: m.win.descent / u })
  return sets
}

function bounds(file) {
  const e = file.extents
  if (!e.measured) return null
  const u = file.metrics.unitsPerEm
  const sets = metricSets(file.metrics)
  const one = (top, bottom) => {
    const T = top / u
    const B = -bottom / u
    return { stacking: T + B, containment: Math.max(...sets.map((s) => Math.max(2 * T - (s.A - s.D), 2 * B + (s.A - s.D)))) }
  }
  const withLatin = (s) => (e.latinBasic ? [Math.max(s.top, e.latinBasic.top), Math.min(s.bottom, e.latinBasic.bottom)] : [s.top, s.bottom])
  const out = {}
  for (const k of ['unvocalised', 'singleMark', 'fullStack']) if (e[k]) out[k] = one(e[k].top, e[k].bottom)
  if (e.unvocalised) out.unvocalisedWithLatin = one(...withLatin(e.unvocalised))
  if (e.latinBasic) out.latinBasic = one(e.latinBasic.top, e.latinBasic.bottom)
  return out
}

function familyBounds(files, exclude = {}) {
  const all = files.filter((f) => !Object.keys(exclude).some((name) => f.file.endsWith(`/${name}`))).map(bounds).filter(Boolean)
  if (!all.length) return null
  const out = {}
  for (const k of ['unvocalised', 'unvocalisedWithLatin', 'singleMark', 'fullStack', 'latinBasic']) {
    const have = all.filter((b) => b[k])
    if (!have.length) continue
    out[k] = { stacking: ceil2(Math.max(...have.map((b) => b[k].stacking))), containment: ceil2(Math.max(...have.map((b) => b[k].containment))) }
  }
  return out
}

// ------------------------------------------------------------------ google/fonts METADATA.pb (text protobuf, the subset used)

function parseMetadata(text) {
  const root = {}
  const stack = [root]
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const cur = stack[stack.length - 1]
    let m
    if ((m = line.match(/^(\w+)\s*\{$/))) {
      const child = {}
      ;(cur[m[1]] ??= []).push(child)
      stack.push(child)
    } else if (line === '}') stack.pop()
    else if ((m = line.match(/^(\w+):\s*(.*)$/))) {
      let v = m[2]
      if (v.startsWith('"')) {
        const q = v.match(/^"((?:[^"\\]|\\.)*)"/)
        v = q ? q[1].replace(/\\(.)/g, '$1') : v
      }
      else if (/^-?\d+(\.\d+)?$/.test(v)) v = Number(v)
      ;(cur[m[1]] ??= []).push(v)
    }
  }
  return root
}

const LICENSES = { OFL: 'OFL-1.1', APACHE2: 'Apache-2.0', UFL: 'Ubuntu-font-1.0' }
const idOf = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function listGoogleFonts() {
  const all = []
  for (const lic of ['apache', 'ofl', 'ufl']) {
    const dir = path.join(GF, lic)
    if (!fs.existsSync(dir)) continue
    for (const fam of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, fam, 'METADATA.pb')
      if (!fs.existsSync(p)) continue
      const md = parseMetadata(fs.readFileSync(p, 'utf8'))
      all.push({ dir: `${lic}/${fam}`, md })
    }
  }
  return all
}

function catalogueEntry({ dir, md }) {
  const fonts = md.fonts ?? []
  return {
    id: idOf(md.name[0]),
    family: md.name[0],
    path: dir,
    license: LICENSES[md.license[0]] ?? md.license[0],
    designers: md.designer[0].split(',').map((s) => s.trim()).filter(Boolean),
    googleCategory: md.category ?? [],
    classifications: md.classifications ?? [],
    dateAdded: md.date_added?.[0],
    subsets: (md.subsets ?? []).filter((s) => s !== 'menu'),
    primaryScript: md.primary_script?.[0],
    styles: [...new Set(fonts.map((f) => f.style[0]))].sort(),
    weights: [...new Set(fonts.map((f) => f.weight[0]))].sort((a, b) => a - b),
    files: fonts.map((f) => ({ filename: f.filename[0], style: f.style[0], weight: f.weight[0] })),
    axes: (md.axes ?? []).map((a) => ({ tag: a.tag[0], min: a.min_value[0], max: a.max_value[0] })),
    upstream: md.source?.[0]?.repository_url?.[0],
    upstreamCommit: md.source?.[0]?.commit?.[0],
  }
}

// ------------------------------------------------------------------ assembling one data file

function npmInfo(pkg) {
  const p = path.join(scratch, 'npm', `${pkg.replace('/', '__')}.json`)
  if (!fs.existsSync(p)) return null
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'))
  return doc.missing ? null : { name: pkg, version: doc.version }
}

function fontsourceInstances(id) {
  const pkgDir = path.join(scratch, 'npm', `@fontsource__${id}`, 'package')
  if (!fs.existsSync(path.join(pkgDir, 'metadata.json'))) return null
  const meta = JSON.parse(fs.readFileSync(path.join(pkgDir, 'metadata.json'), 'utf8'))
  const have = meta.weights.filter((w) => fs.existsSync(path.join(pkgDir, 'files', `${id}-arabic-${w}-normal.woff`)))
  return { meta, pkgDir, weights: have }
}

function publicFile(f) {
  const e = f.extents
  const out = { file: f.file, sha256: f.sha256, fontVersion: f.fontVersion, weightClass: f.weightClass }
  if (e.measured) {
    out.extents = {}
    for (const k of ['unvocalised', 'singleMark', 'fullStack', 'latinBasic']) if (e[k]) out.extents[k] = [e[k].top, e[k].bottom]
  }
  return out
}

function assemble({ excludeFromBounds, id, family, category, interfaceText, designers, license, source, sources, primary, files, weights, italic, subsets, google, latinCompanion, notes, weightsBasis }) {
  const font = primary.font
  const m = primary.metrics
  const u = m.unitsPerEm
  const cov = {
    letters: coverageOf(font, SETS.letters),
    tashkeel: coverageOf(font, SETS.tashkeel),
    arabicIndicDigits: coverageOf(font, SETS.arabicIndicDigits),
    extendedArabicIndicDigits: coverageOf(font, SETS.extendedArabicIndicDigits),
    punctuation: coverageOf(font, SETS.punctuation),
    persianUrduLetters: coverageOf(font, SETS.persianUrduLetters),
    saudiRiyalSign: font.cmap.has(0x20c1),
    rialSign: font.cmap.has(0xfdfc),
  }
  const dg = digitInfo(font)
  const latinCov = coverageOf(font, SETS.latinLetters)
  const tabularOf = (d) => d.present && (d.defaultEqualWidth || d.tnumEqualWidth === true)
  const fb = familyBounds(files, excludeFromBounds)
  const e = primary.extents
  const agree =
    m.hhea.ascender === m.typo.ascender && m.hhea.descender === m.typo.descender && m.hhea.lineGap === m.typo.lineGap && m.hhea.ascender === m.win.ascent && -m.hhea.descender === m.win.descent
  const scripts = ['Arab']
  if (latinCov.present === latinCov.total) scripts.push('Latn')
  const limits = []
  for (const [name, why] of Object.entries(excludeFromBounds ?? {})) limits.push(`${name} is measured (see files) but left out of lineHeightBounds: ${why}`)
  if (font.axes) limits.push('variable font: upstream file measured at its default master only')
  if (e.measured && e.cursiveAttachment) limits.push('font has cursive attachment (GPOS curs), which moves glyphs vertically and is not modelled: real extents can exceed these')
  if (e.measured && e.markPositioning === 'none') limits.push('no GPOS mark-to-base lookups for Arabic: marks measured where they are drawn')

  const data = {
    family,
    category,
    interfaceText,
    designers,
    license,
    source,
    scripts,
    ...(subsets ? { subsets } : {}),
    weights,
    weightsBasis,
    italic,
    ...(font.axes ? { variable: { axes: font.axes.axes.map((a) => ({ tag: a.tag, min: a.min, max: a.max, default: a.default })) } } : {}),
    ...(google ? { googleFonts: google } : {}),
    files: files.map(publicFile),
    metrics: {
      unitsPerEm: u,
      hhea: m.hhea,
      typo: m.typo,
      win: m.win,
      useTypoMetrics: m.useTypoMetrics,
      ...(m.xHeight !== undefined ? { xHeight: m.xHeight, capHeight: m.capHeight } : {}),
      head: m.head,
      verticalMetricsAgree: agree,
      naturalLineHeight: { hhea: round3((m.hhea.ascender - m.hhea.descender + m.hhea.lineGap) / u), typo: round3((m.typo.ascender - m.typo.descender + m.typo.lineGap) / u), win: round3((m.win.ascent + m.win.descent) / u) },
      measuredFrom: primary.file,
    },
    arabic: {
      coversTashkeel: cov.tashkeel.present === cov.tashkeel.total,
      coverage: cov,
      digits: {
        arabicIndic: dg.arabicIndic.present,
        extendedArabicIndic: dg.extendedArabicIndic.present,
        tabular: [dg.latin, dg.arabicIndic, dg.extendedArabicIndic].some((d) => d.present) && [dg.latin, dg.arabicIndic, dg.extendedArabicIndic].every((d) => !d.present || tabularOf(d)),
        tnumFeature: dg.tnumFeature,
        detail: { latin: dg.latin, arabicIndic: dg.arabicIndic, extendedArabicIndic: dg.extendedArabicIndic },
      },
      extents: e.measured
        ? {
            measured: true,
            unit: 'font units, y up from the baseline; [top, bottom] with the glyph sequence that reaches it',
            from: primary.file,
            markPositioning: e.markPositioning,
            cursiveAttachment: e.cursiveAttachment,
            glyphsConsidered: e.glyphsConsidered,
            ...Object.fromEntries(['unvocalised', 'singleMark', 'fullStack', 'latinBasic', 'tashkeelGlyphsAsDrawn'].filter((k) => e[k]).map((k) => [k, e[k]])),
          }
        : { measured: false, reason: e.reason },
      ...(fb
        ? {
            lineHeightBounds: fb,
            recommendedLineHeight: {
              ui: (fb.unvocalisedWithLatin ?? fb.unvocalised).containment,
              body: fb.singleMark.stacking,
              withTashkeel: fb.fullStack.stacking,
              basis: BASIS,
            },
          }
        : {}),
      ...(limits.length ? { notes: `Limits: ${limits.join('; ')}.` } : {}),
    },
    latin: { included: latinCov.present === latinCov.total, basicLetters: `${latinCov.present}/${latinCov.total}` },
    ...(latinCompanion ? { latinCompanion } : {}),
    features: { gsub: font.gsub?.featureTags ?? [], gpos: font.gpos?.featureTags ?? [] },
    ...(notes ? { notes } : {}),
  }
  return {
    $schema: '../schema/font.schema.json',
    kind: 'font',
    schemaVersion: 1,
    id,
    provenance: {
      method: 'extracted',
      confidence: 'verified',
      sources,
      script: SCRIPT,
      notes:
        'Metrics, coverage, features and extents are read from the named font files by tools/extract/fonts/sfnt.mjs. category, interfaceText and latinCompanion are authored in tools/extract/fonts/families.json. arabic.lineHeightBounds and arabic.recommendedLineHeight are derived (formula in basis).',
    },
    data,
  }
}

const write = (id, doc) => fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(doc, null, 2) + '\n')
const gfUrl = 'https://github.com/google/fonts'
const retrievedAt = lock.retrievedAt

// ------------------------------------------------------------------ run

const everything = listGoogleFonts()
const catalogue = everything.filter((f) => (f.md.subsets ?? []).includes('arabic')).map(catalogueEntry)
const summary = []
const problems = []

for (const c of catalogue) {
  const a = authored.googleFonts[c.id]
  if (!a) {
    problems.push(`${c.id}: no authored classification in families.json; data file not written`)
    continue
  }
  try {
    const upright = c.files.filter((f) => f.style === 'normal').sort((x, y) => x.weight - y.weight || (x.filename < y.filename ? -1 : 1))
    const files = upright.map((f) => measureFile(path.join(GF, c.path, f.filename), `google/fonts:${c.path}/${f.filename}`))
    const primary = files.find((f) => f.weightClass === 400) ?? files[0]
    const isVariable = !!primary.font.axes
    const wght = primary.font.axes?.axes.find((x) => x.tag === 'wght')
    const npm = npmInfo(`@fontsource/${c.id}`)
    const npmVar = npmInfo(`@fontsource-variable/${c.id}`)
    const sources = [
      { name: 'Google Fonts repository', url: gfUrl, version: lock.googleFonts.commit, license: c.license, retrievedAt, path: c.path },
    ]
    let weights = c.weights
    let weightsBasis = 'static files listed in google/fonts METADATA.pb'
    if (isVariable && wght) {
      weights = range(Math.ceil(wght.min / 100), Math.floor(wght.max / 100)).map((x) => x * 100)
      weightsBasis = `hundreds inside the fvar wght axis ${wght.min}-${wght.max}`
    } else if (isVariable) weightsBasis = 'variable font without a wght axis; weight from METADATA.pb'
    const fs_ = isVariable ? fontsourceInstances(c.id) : null
    if (fs_ && fs_.weights.length) {
      const pick = [...new Set([fs_.weights[0], fs_.weights.includes(400) ? 400 : fs_.weights[0], fs_.weights[fs_.weights.length - 1]])]
      for (const w of pick) {
        const rel = `files/${c.id}-arabic-${w}-normal.woff`
        files.push(measureFile(path.join(fs_.pkgDir, rel), `npm:@fontsource/${c.id}@${npm.version}:${rel}`))
      }
      sources.push({
        name: `@fontsource/${c.id}`,
        url: `https://www.npmjs.com/package/@fontsource/${c.id}`,
        version: npm.version,
        license: c.license,
        retrievedAt,
        path: `files/${c.id}-arabic-{${pick.join(',')}}-normal.woff (static instances of Google Fonts ${fs_.meta.version}, Arabic subset; extents at the lightest and heaviest weight)`,
      })
    }
    const doc = assemble({
      id: c.id,
      family: c.family,
      category: a.category,
      interfaceText: a.interfaceText,
      designers: c.designers,
      license: c.license,
      source: {
        ...(c.upstream ? { repository: c.upstream } : {}),
        ...(c.upstreamCommit ? { commit: c.upstreamCommit } : {}),
        distribution: `${gfUrl}/tree/${lock.googleFonts.commit}/${c.path}`,
        ...(npm ? { npm: npm.name, npmVersion: npm.version } : {}),
        ...(npmVar ? { npmVariable: npmVar.name } : {}),
        version: primary.fontVersion,
      },
      sources,
      primary,
      files,
      weights,
      weightsBasis,
      italic: c.styles.includes('italic'),
      subsets: c.subsets,
      google: { category: c.googleCategory, ...(c.classifications.length ? { classifications: c.classifications } : {}), dateAdded: c.dateAdded },
      latinCompanion: a.latinCompanion,
      notes: a.notes,
      excludeFromBounds: a.excludeFromBounds,
    })
    write(c.id, doc)
    summary.push(doc)
  } catch (error) {
    problems.push(`${c.id}: ${error.message}`)
  }
}

for (const [id, a] of Object.entries(authored.other)) {
  try {
    const files = a.files.map((f) => measureFile(path.join(scratch, a.dir, f), `${a.repository.replace('https://github.com/', '')}:${f}`))
    files.sort((x, y) => x.weightClass - y.weightClass)
    const primary = files.find((f) => f.weightClass === 400) ?? files[0]
    const l = lock[a.lockKey]
    const npm = a.npm ? npmInfo(a.npm) : null
    const doc = assemble({
      id,
      family: a.family,
      category: a.category,
      interfaceText: a.interfaceText,
      designers: a.designers,
      license: a.license,
      source: { repository: a.repository, commit: l.commit, ...(l.url ? { distribution: l.url } : {}), ...(npm ? { npm: npm.name, npmVersion: npm.version } : {}), version: primary.fontVersion },
      sources: [{ name: `${a.family} upstream repository`, url: a.repository, version: l.tag ?? l.commit, license: a.license, retrievedAt, path: l.url ? `release asset ${path.basename(l.url)}` : a.dir.split('/').slice(1).join('/') }],
      primary,
      files,
      weights: [...new Set(files.map((f) => f.weightClass))],
      weightsBasis: 'OS/2 usWeightClass of the static files measured',
      italic: false,
      latinCompanion: a.latinCompanion,
      notes: [a.notes, `License evidence: ${a.licenseEvidence}`].filter(Boolean).join(' '),
    })
    if (a.confidence) doc.provenance.confidence = a.confidence
    write(id, doc)
    summary.push(doc)
  } catch (error) {
    problems.push(`${id}: ${error.message}`)
  }
}

// Latin reference faces: measured with the same code, reported only (they are not Arabic typefaces, so no data file).
const latinRef = []
for (const dir of lock.googleFonts.latinReference) {
  const entry = everything.find((f) => f.dir === dir)
  if (!entry) continue
  const c = catalogueEntry(entry)
  const f = c.files.filter((x) => x.style === 'normal').sort((x, y) => Math.abs(x.weight - 400) - Math.abs(y.weight - 400))[0]
  const file = measureFile(path.join(GF, dir, f.filename), `google/fonts:${dir}/${f.filename}`)
  const m = file.metrics
  const b = bounds(file)
  latinRef.push({
    family: c.family,
    file: file.file,
    sha256: file.sha256,
    fontVersion: file.fontVersion,
    unitsPerEm: m.unitsPerEm,
    hhea: m.hhea,
    useTypoMetrics: m.useTypoMetrics,
    xHeight: m.xHeight,
    capHeight: m.capHeight,
    naturalLineHeight: round3((m.hhea.ascender - m.hhea.descender + m.hhea.lineGap) / m.unitsPerEm),
    latinBasic: file.extents.latinBasic && [file.extents.latinBasic.top, file.extents.latinBasic.bottom],
    latinBasicContainment: b?.latinBasic && ceil2(b.latinBasic.containment),
    latinBasicStacking: b?.latinBasic && ceil2(b.latinBasic.stacking),
  })
}

// ------------------------------------------------------------------ generated tables

const yn = (b) => (b ? 'yes' : 'no')
const md = []
md.push(`### Catalogue: families in google/fonts that declare the \`arabic\` subset (${catalogue.length})`, '')
md.push(`Source: google/fonts@${lock.googleFonts.commit.slice(0, 12)} (${lock.googleFonts.committedAt}), \`METADATA.pb\` of every directory under ofl/, apache/, ufl/ (${everything.length} families read).`, '')
md.push('| Family | License | Google category | Style (authored) | Weights | Italic | Variable axes | Designers |', '|---|---|---|---|---|---|---|---|')
for (const c of catalogue) {
  const a = authored.googleFonts[c.id]
  const axes = c.axes.length ? c.axes.map((x) => `${x.tag} ${x.min}–${x.max}`).join(', ') : 'no'
  md.push(`| ${c.family} | ${c.license} | ${[...c.googleCategory, ...c.classifications.map((x) => `(${x})`)].join(' ').toLowerCase()} | ${a?.category ?? '?'} | ${c.weights.join(' ')} | ${yn(c.styles.includes('italic'))} | ${axes} | ${c.designers.join(', ')} |`)
}
md.push('')

const rows = summary.map((d) => {
  const x = d.data
  const u = x.metrics.unitsPerEm
  const lh = x.arabic.recommendedLineHeight
  const b = x.arabic.lineHeightBounds
  return {
    d,
    cells: [
      x.family,
      x.category,
      (x.metrics.hhea.ascender / u).toFixed(3),
      (x.metrics.hhea.descender / u).toFixed(3),
      x.metrics.xHeight !== undefined ? (x.metrics.xHeight / u).toFixed(3) : '–',
      x.metrics.naturalLineHeight.hhea.toFixed(3),
      yn(x.metrics.verticalMetricsAgree),
      lh ? lh.ui.toFixed(2) : 'n/m',
      b ? b.unvocalised.stacking.toFixed(2) : 'n/m',
      lh ? lh.body.toFixed(2) : 'n/m',
      lh ? lh.withTashkeel.toFixed(2) : 'n/m',
      b?.latinBasic ? b.latinBasic.containment.toFixed(2) : '–',
      ['latin', 'arabicIndic', 'extendedArabicIndic'].map((k) => { const t = x.arabic.digits.detail[k]; return !t.present ? '–' : t.defaultEqualWidth ? 'D' : t.tnumEqualWidth ? 'T' : 'no' }).join(' / '),
      x.arabic.digits.arabicIndic && x.arabic.digits.extendedArabicIndic ? 'both' : x.arabic.digits.arabicIndic ? 'ar only' : x.arabic.digits.extendedArabicIndic ? 'ext only' : 'none',
      yn(x.arabic.coverage.saudiRiyalSign),
      yn(x.latin.included),
      x.weights.length > 1 ? `${x.weights[0]}–${x.weights[x.weights.length - 1]} (${x.weights.length})` : String(x.weights[0]),
      x.variable ? x.variable.axes.map((a) => a.tag).join(',') : 'no',
    ],
  }
})
const header = ['Family', 'Style', 'Asc', 'Desc', 'x-height', 'Natural LH', 'hhea=typo=win', 'UI', 'Bare', 'Body', 'Vocalised', 'Own Latin UI', 'Tabular: Latin / Arabic-Indic / Extended', 'Digit sets', 'U+20C1', 'Latin', 'Weights', 'Variable']
const table = (title, list) => {
  md.push(`### ${title} (${list.length})`, '', `| ${header.join(' | ')} |`, `|${header.map(() => '---').join('|')}|`)
  for (const r of list) md.push(`| ${r.cells.join(' | ')} |`)
  md.push('')
}
table('Measured families for interface text', rows.filter((r) => r.d.data.interfaceText))
table('Measured families not proposed for interface text', rows.filter((r) => !r.d.data.interfaceText))
md.push(`### Latin reference faces (${latinRef.length})`, '', '| Family | File | Asc | Desc | x-height | Natural LH | Basic Latin top / bottom | UI containment | Stacking |', '|---|---|---|---|---|---|---|---|---|')
for (const r of latinRef) {
  md.push(`| ${r.family} | ${r.file.split('/').pop()} (${r.fontVersion.split(';')[0]}) | ${(r.hhea.ascender / r.unitsPerEm).toFixed(3)} | ${(r.hhea.descender / r.unitsPerEm).toFixed(3)} | ${(r.xHeight / r.unitsPerEm).toFixed(3)} | ${r.naturalLineHeight.toFixed(3)} | ${r.latinBasic ? r.latinBasic.map((v) => (v / r.unitsPerEm).toFixed(3)).join(' / ') : 'n/m'} | ${r.latinBasicContainment?.toFixed(2) ?? 'n/m'} | ${r.latinBasicStacking?.toFixed(2) ?? 'n/m'} |`)
}
md.push('')
fs.writeFileSync(path.join(GEN, 'tables.md'), md.join('\n'))
fs.writeFileSync(path.join(GEN, 'google-fonts-arabic.json'), JSON.stringify({ source: { repository: gfUrl, commit: lock.googleFonts.commit, familiesRead: everything.length }, families: catalogue }, null, 2) + '\n')
fs.writeFileSync(path.join(GEN, 'latin-reference.json'), JSON.stringify(latinRef, null, 2) + '\n')

// Splice the generated tables into the report when it has the markers.
const report = path.join(ROOT, 'docs', 'research', 'fonts.md')
if (fs.existsSync(report)) {
  const text = fs.readFileSync(report, 'utf8')
  const re = /(<!-- BEGIN:generated-tables -->\n)[\s\S]*?(<!-- END:generated-tables -->)/
  if (re.test(text)) fs.writeFileSync(report, text.replace(re, (_, a, b) => `${a}${md.join('\n')}\n${b}`))
}

console.log(`catalogued ${catalogue.length} of ${everything.length} google/fonts families; wrote ${summary.length} data files; ${latinRef.length} Latin reference faces`)
for (const p of problems) console.log(`PROBLEM ${p}`)
