// Zero-dependency OpenType reader (Node Buffer + node:zlib for the WOFF 1.0 container only).
// Reads what the fonts layer needs and nothing else. Limits are listed in docs/research/fonts.md.
//   - containers: TTF/OTF (sfnt), WOFF 1.0. Not: WOFF2, TTC collections.
//   - outlines: glyf bounding boxes from glyph headers. CFF/CFF2 outlines are not interpreted.
//   - variable fonts: every value is the default master (no gvar/HVAR/MVAR/GDEF-varstore evaluation).
//   - layout: GSUB types 1-8 for glyph closure, GPOS types 4/5/6 (+9) for mark attachment. Contextual
//     positioning (GPOS 7/8), cursive attachment (GPOS 3) and feature variations are not applied.
import zlib from 'node:zlib'

const tagAt = (b, o) => b.toString('latin1', o, o + 4)

export function openFont(buf) {
  const sig = tagAt(buf, 0)
  if (sig === 'wOFF') return openWoff(buf)
  if (sig === 'wOF2') throw new Error('WOFF2 is not supported')
  if (sig === 'ttcf') throw new Error('TrueType collections are not supported')
  const v = buf.readUInt32BE(0)
  if (v !== 0x00010000 && sig !== 'OTTO' && sig !== 'true') throw new Error(`not an sfnt font (signature ${JSON.stringify(sig)})`)
  const n = buf.readUInt16BE(4)
  const tables = new Map()
  for (let i = 0; i < n; i++) {
    const o = 12 + i * 16
    const off = buf.readUInt32BE(o + 8)
    const len = buf.readUInt32BE(o + 12)
    tables.set(tagAt(buf, o), buf.subarray(off, off + len))
  }
  return new Font(tables, sig === 'OTTO' ? 'otf' : 'ttf')
}

function openWoff(buf) {
  const flavor = tagAt(buf, 4)
  const n = buf.readUInt16BE(12)
  const tables = new Map()
  for (let i = 0; i < n; i++) {
    const o = 44 + i * 20
    const off = buf.readUInt32BE(o + 4)
    const compLen = buf.readUInt32BE(o + 8)
    const origLen = buf.readUInt32BE(o + 12)
    const raw = buf.subarray(off, off + compLen)
    tables.set(tagAt(buf, o), compLen < origLen ? zlib.inflateSync(raw) : raw)
  }
  return new Font(tables, flavor === 'OTTO' ? 'woff(otf)' : 'woff(ttf)')
}

class Font {
  constructor(tables, container) {
    this.tables = tables
    this.container = container
    this.outlines = tables.has('glyf') ? 'glyf' : tables.has('CFF2') ? 'CFF2' : tables.has('CFF ') ? 'CFF' : 'none'
    this.#head()
    this.#hhea()
    this.#os2()
    this.numGlyphs = tables.get('maxp').readUInt16BE(4)
    this.cmap = parseCmap(tables.get('cmap'))
    this.names = parseName(tables.get('name'))
    this.axes = parseFvar(tables.get('fvar'), this.names)
    this.advances = this.#hmtx()
    this.glyphNames = parsePostNames(tables.get('post'), this.numGlyphs)
    this.glyphClass = tables.has('GDEF') ? parseGdefClasses(tables.get('GDEF')) : new Map()
    this.gsub = tables.has('GSUB') ? parseLayout(tables.get('GSUB'), 'GSUB') : null
    this.gpos = tables.has('GPOS') ? parseLayout(tables.get('GPOS'), 'GPOS') : null
    this._bbox = new Map()
    this._rev = null
  }

  #head() {
    const t = this.tables.get('head')
    this.head = {
      fontRevision: Math.round((t.readInt32BE(4) / 65536) * 1000) / 1000,
      unitsPerEm: t.readUInt16BE(18),
      xMin: t.readInt16BE(36),
      yMin: t.readInt16BE(38),
      xMax: t.readInt16BE(40),
      yMax: t.readInt16BE(42),
      indexToLocFormat: t.readInt16BE(50),
    }
  }

  #hhea() {
    const t = this.tables.get('hhea')
    this.hhea = { ascender: t.readInt16BE(4), descender: t.readInt16BE(6), lineGap: t.readInt16BE(8), numberOfHMetrics: t.readUInt16BE(34) }
  }

  #os2() {
    const t = this.tables.get('OS/2')
    if (!t) return
    const version = t.readUInt16BE(0)
    const fsSelection = t.readUInt16BE(62)
    this.os2 = {
      version,
      usWeightClass: t.readUInt16BE(4),
      fsSelection,
      useTypoMetrics: version >= 4 && (fsSelection & 0x80) !== 0,
      typoAscender: t.readInt16BE(68),
      typoDescender: t.readInt16BE(70),
      typoLineGap: t.readInt16BE(72),
      winAscent: t.readUInt16BE(74),
      winDescent: t.readUInt16BE(76),
    }
    if (version >= 2 && t.length >= 90) {
      this.os2.xHeight = t.readInt16BE(86)
      this.os2.capHeight = t.readInt16BE(88)
    }
  }

  #hmtx() {
    const t = this.tables.get('hmtx')
    const n = this.hhea.numberOfHMetrics
    const adv = new Array(this.numGlyphs)
    let last = 0
    for (let g = 0; g < this.numGlyphs; g++) {
      if (g < n) last = t.readUInt16BE(g * 4)
      adv[g] = last
    }
    return adv
  }

  /** [xMin, yMin, xMax, yMax] from the glyf header, or null for an empty glyph or a CFF font. */
  bbox(gid) {
    if (this.outlines !== 'glyf') return null
    if (this._bbox.has(gid)) return this._bbox.get(gid)
    const loca = this.tables.get('loca')
    const glyf = this.tables.get('glyf')
    const long = this.head.indexToLocFormat === 1
    const a = long ? loca.readUInt32BE(gid * 4) : loca.readUInt16BE(gid * 2) * 2
    const b = long ? loca.readUInt32BE(gid * 4 + 4) : loca.readUInt16BE(gid * 2 + 2) * 2
    const box = b - a < 10 ? null : [glyf.readInt16BE(a + 2), glyf.readInt16BE(a + 4), glyf.readInt16BE(a + 6), glyf.readInt16BE(a + 8)]
    this._bbox.set(gid, box)
    return box
  }

  /** A stable label for a glyph: post name when the font has one, else the code point it is mapped from, else its index. */
  glyphLabel(gid) {
    const n = this.glyphNames?.get(gid)
    if (n) return n
    if (!this._rev) {
      this._rev = new Map()
      for (const [cp, g] of this.cmap) if (!this._rev.has(g) || cp < this._rev.get(g)) this._rev.set(g, cp)
    }
    const cp = this._rev.get(gid)
    return cp !== undefined ? `U+${cp.toString(16).toUpperCase().padStart(4, '0')}` : `gid${gid}`
  }
}

// ---------------------------------------------------------------- cmap / name / post / fvar

function parseCmap(t) {
  const n = t.readUInt16BE(2)
  const recs = []
  for (let i = 0; i < n; i++) {
    const o = 4 + i * 8
    const off = t.readUInt32BE(o + 4)
    recs.push({ platform: t.readUInt16BE(o), encoding: t.readUInt16BE(o + 2), off, format: t.readUInt16BE(off) })
  }
  const rank = (r) => {
    if (r.format === 12 && ((r.platform === 3 && r.encoding === 10) || r.platform === 0)) return 4
    if (r.format === 4 && r.platform === 3 && r.encoding === 1) return 3
    if (r.format === 4 && r.platform === 0) return 2
    return 0
  }
  const best = recs.filter((r) => rank(r) > 0).sort((a, b) => rank(b) - rank(a) || a.off - b.off)[0]
  if (!best) throw new Error('no Unicode cmap subtable in format 4 or 12')
  const map = new Map()
  const o = best.off
  if (best.format === 12) {
    const groups = t.readUInt32BE(o + 12)
    for (let i = 0; i < groups; i++) {
      const g = o + 16 + i * 12
      const start = t.readUInt32BE(g)
      const end = t.readUInt32BE(g + 4)
      const gid = t.readUInt32BE(g + 8)
      for (let c = start; c <= end; c++) if (gid + c - start !== 0) map.set(c, gid + c - start)
    }
  } else {
    const segX2 = t.readUInt16BE(o + 6)
    const endO = o + 14
    const startO = endO + segX2 + 2
    const deltaO = startO + segX2
    const rangeO = deltaO + segX2
    for (let i = 0; i < segX2; i += 2) {
      const end = t.readUInt16BE(endO + i)
      const start = t.readUInt16BE(startO + i)
      const delta = t.readInt16BE(deltaO + i)
      const range = t.readUInt16BE(rangeO + i)
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let gid
        if (range === 0) gid = (c + delta) & 0xffff
        else {
          const p = rangeO + i + range + (c - start) * 2
          gid = t.readUInt16BE(p)
          if (gid !== 0) gid = (gid + delta) & 0xffff
        }
        if (gid !== 0) map.set(c, gid)
      }
    }
  }
  return map
}

function parseName(t) {
  const out = new Map()
  if (!t) return out
  const n = t.readUInt16BE(2)
  const str = t.readUInt16BE(4)
  const score = new Map()
  for (let i = 0; i < n; i++) {
    const o = 6 + i * 12
    const platform = t.readUInt16BE(o)
    const lang = t.readUInt16BE(o + 4)
    const id = t.readUInt16BE(o + 6)
    const len = t.readUInt16BE(o + 8)
    const off = str + t.readUInt16BE(o + 10)
    const s = platform === 3 && lang === 0x409 ? 3 : platform === 3 ? 2 : platform === 1 && lang === 0 ? 1 : 0
    if (s === 0 || (score.get(id) ?? 0) >= s) continue
    const raw = t.subarray(off, off + len)
    let text
    if (platform === 3) {
      const sw = Buffer.from(raw)
      sw.swap16()
      text = sw.toString('utf16le')
    } else text = raw.toString('latin1')
    score.set(id, s)
    out.set(id, text)
  }
  return out
}

function parsePostNames(t, numGlyphs) {
  if (!t || t.readUInt32BE(0) !== 0x00020000) return null
  const n = t.readUInt16BE(32)
  const idx = []
  for (let i = 0; i < n; i++) idx.push(t.readUInt16BE(34 + i * 2))
  const strings = []
  let p = 34 + n * 2
  while (p < t.length) {
    const len = t[p]
    strings.push(t.toString('latin1', p + 1, p + 1 + len))
    p += 1 + len
  }
  const names = new Map()
  for (let g = 0; g < Math.min(n, numGlyphs); g++) if (idx[g] >= 258 && strings[idx[g] - 258]) names.set(g, strings[idx[g] - 258])
  return names
}

function parseFvar(t, names) {
  if (!t) return null
  const axesOff = t.readUInt16BE(4)
  const axisCount = t.readUInt16BE(8)
  const axisSize = t.readUInt16BE(10)
  const instanceCount = t.readUInt16BE(12)
  const instanceSize = t.readUInt16BE(14)
  const fixed = (o) => Math.round((t.readInt32BE(o) / 65536) * 1000) / 1000
  const axes = []
  for (let i = 0; i < axisCount; i++) {
    const o = axesOff + i * axisSize
    axes.push({ tag: tagAt(t, o), min: fixed(o + 4), default: fixed(o + 8), max: fixed(o + 12) })
  }
  const instances = []
  for (let i = 0; i < instanceCount; i++) {
    const o = axesOff + axisCount * axisSize + i * instanceSize
    const coords = {}
    axes.forEach((a, k) => (coords[a.tag] = fixed(o + 4 + k * 4)))
    instances.push({ name: names.get(t.readUInt16BE(o)) ?? null, coords })
  }
  return { axes, instances }
}

// ---------------------------------------------------------------- OpenType layout common

function coverage(t, o) {
  const format = t.readUInt16BE(o)
  const n = t.readUInt16BE(o + 2)
  const out = []
  if (format === 1) for (let i = 0; i < n; i++) out.push(t.readUInt16BE(o + 4 + i * 2))
  else if (format === 2)
    for (let i = 0; i < n; i++) {
      const r = o + 4 + i * 6
      const s = t.readUInt16BE(r)
      const e = t.readUInt16BE(r + 2)
      for (let g = s; g <= e; g++) out.push(g)
    }
  return out
}

function classDef(t, o) {
  const map = new Map()
  const format = t.readUInt16BE(o)
  if (format === 1) {
    const start = t.readUInt16BE(o + 2)
    const n = t.readUInt16BE(o + 4)
    for (let i = 0; i < n; i++) map.set(start + i, t.readUInt16BE(o + 6 + i * 2))
  } else if (format === 2) {
    const n = t.readUInt16BE(o + 2)
    for (let i = 0; i < n; i++) {
      const r = o + 4 + i * 6
      const cls = t.readUInt16BE(r + 4)
      for (let g = t.readUInt16BE(r); g <= t.readUInt16BE(r + 2); g++) map.set(g, cls)
    }
  }
  return map
}

function parseGdefClasses(t) {
  const off = t.readUInt16BE(4)
  return off ? classDef(t, off) : new Map()
}

function parseLayout(t, kind) {
  const scriptListO = t.readUInt16BE(4)
  const featureListO = t.readUInt16BE(6)
  const lookupListO = t.readUInt16BE(8)
  const features = []
  const fn = t.readUInt16BE(featureListO)
  for (let i = 0; i < fn; i++) {
    const r = featureListO + 2 + i * 6
    const fo = featureListO + t.readUInt16BE(r + 4)
    const ln = t.readUInt16BE(fo + 2)
    const lookups = []
    for (let k = 0; k < ln; k++) lookups.push(t.readUInt16BE(fo + 4 + k * 2))
    features.push({ tag: tagAt(t, r), lookups })
  }
  const scripts = new Map()
  const sn = t.readUInt16BE(scriptListO)
  const langSys = (o) => {
    const req = t.readUInt16BE(o + 2)
    const n = t.readUInt16BE(o + 4)
    const idx = req !== 0xffff ? [req] : []
    for (let i = 0; i < n; i++) idx.push(t.readUInt16BE(o + 6 + i * 2))
    return idx
  }
  for (let i = 0; i < sn; i++) {
    const r = scriptListO + 2 + i * 6
    const so = scriptListO + t.readUInt16BE(r + 4)
    const def = t.readUInt16BE(so)
    const ln = t.readUInt16BE(so + 2)
    const langs = new Map()
    for (let k = 0; k < ln; k++) langs.set(tagAt(t, so + 4 + k * 6), langSys(so + t.readUInt16BE(so + 8 + k * 6)))
    scripts.set(tagAt(t, r), { default: def ? langSys(so + def) : null, langs })
  }
  const lookups = []
  const lookupCount = t.readUInt16BE(lookupListO)
  for (let i = 0; i < lookupCount; i++) {
    const lo = lookupListO + t.readUInt16BE(lookupListO + 2 + i * 2)
    let type = t.readUInt16BE(lo)
    const n = t.readUInt16BE(lo + 4)
    const subtables = []
    const extType = kind === 'GSUB' ? 7 : 9
    let realType = type
    for (let k = 0; k < n; k++) {
      let so = lo + t.readUInt16BE(lo + 6 + k * 2)
      if (type === extType) {
        realType = t.readUInt16BE(so + 2)
        so += t.readUInt32BE(so + 4)
      }
      subtables.push(so)
    }
    lookups.push({ type: realType, subtables })
  }
  return { table: t, kind, features, scripts, lookups, featureTags: [...new Set(features.map((f) => f.tag))].sort() }
}

/** Lookup indices of the given feature tags for a script's default language system (falls back to DFLT). */
export function lookupsFor(layout, scriptTags, featureTags, { anyScript = false } = {}) {
  if (!layout) return []
  const idx = new Set()
  if (anyScript) layout.features.forEach((f, i) => featureTags.includes(f.tag) && idx.add(i))
  else {
    for (const tag of scriptTags) {
      const s = layout.scripts.get(tag)
      if (!s) continue
      for (const i of s.default ?? []) idx.add(i)
      if (!s.default) for (const l of s.langs.values()) for (const i of l) idx.add(i)
      break
    }
  }
  const out = new Set()
  for (const i of idx) {
    const f = layout.features[i]
    if (f && featureTags.includes(f.tag)) for (const l of f.lookups) out.add(l)
  }
  return [...out].sort((a, b) => a - b)
}

// ---------------------------------------------------------------- GSUB

/**
 * Substitution rules of the given lookups (nested lookups of contextual rules included, context ignored):
 * { singles: [[in, out]], multiples: [[in, [out…]]], ligatures: [[[components…], out]] }
 */
export function gsubRules(layout, lookupIdx) {
  const t = layout.table
  const rules = { singles: [], multiples: [], ligatures: [] }
  const seen = new Set()
  const queue = [...lookupIdx]
  const nested = (o, count) => {
    for (let i = 0; i < count; i++) queue.push(t.readUInt16BE(o + i * 4 + 2))
  }
  while (queue.length) {
    const li = queue.shift()
    if (seen.has(li) || !layout.lookups[li]) continue
    seen.add(li)
    const { type, subtables } = layout.lookups[li]
    for (const so of subtables) {
      const format = t.readUInt16BE(so)
      if (type === 1) {
        const cov = coverage(t, so + t.readUInt16BE(so + 2))
        if (format === 1) {
          const d = t.readInt16BE(so + 4)
          for (const g of cov) rules.singles.push([g, (g + d) & 0xffff])
        } else cov.forEach((g, i) => rules.singles.push([g, t.readUInt16BE(so + 6 + i * 2)]))
      } else if (type === 2 || type === 3) {
        const cov = coverage(t, so + t.readUInt16BE(so + 2))
        cov.forEach((g, i) => {
          const s = so + t.readUInt16BE(so + 6 + i * 2)
          const n = t.readUInt16BE(s)
          const seq = []
          for (let k = 0; k < n; k++) seq.push(t.readUInt16BE(s + 2 + k * 2))
          if (type === 2) rules.multiples.push([g, seq])
          else for (const a of seq) rules.singles.push([g, a])
        })
      } else if (type === 4) {
        const cov = coverage(t, so + t.readUInt16BE(so + 2))
        cov.forEach((g, i) => {
          const set = so + t.readUInt16BE(so + 6 + i * 2)
          const n = t.readUInt16BE(set)
          for (let k = 0; k < n; k++) {
            const l = set + t.readUInt16BE(set + 2 + k * 2)
            const comps = [g]
            const cn = t.readUInt16BE(l + 2)
            for (let c = 0; c < cn - 1; c++) comps.push(t.readUInt16BE(l + 4 + c * 2))
            rules.ligatures.push([comps, t.readUInt16BE(l)])
          }
        })
      } else if (type === 5) {
        if (format === 3) {
          const gc = t.readUInt16BE(so + 2)
          nested(so + 6 + gc * 2, t.readUInt16BE(so + 4))
        } else {
          const setCount = t.readUInt16BE(so + (format === 1 ? 4 : 6))
          const base = so + (format === 1 ? 6 : 8)
          for (let i = 0; i < setCount; i++) {
            const off = t.readUInt16BE(base + i * 2)
            if (!off) continue
            const set = so + off
            const rn = t.readUInt16BE(set)
            for (let k = 0; k < rn; k++) {
              const r = set + t.readUInt16BE(set + 2 + k * 2)
              const gc = t.readUInt16BE(r)
              nested(r + 4 + (gc - 1) * 2, t.readUInt16BE(r + 2))
            }
          }
        }
      } else if (type === 6) {
        if (format === 3) {
          let p = so + 2
          for (let s = 0; s < 3; s++) p += 2 + t.readUInt16BE(p) * 2
          nested(p + 2, t.readUInt16BE(p))
        } else {
          const setCount = t.readUInt16BE(so + (format === 1 ? 4 : 10))
          const base = so + (format === 1 ? 6 : 12)
          for (let i = 0; i < setCount; i++) {
            const off = t.readUInt16BE(base + i * 2)
            if (!off) continue
            const set = so + off
            const rn = t.readUInt16BE(set)
            for (let k = 0; k < rn; k++) {
              let p = set + t.readUInt16BE(set + 2 + k * 2)
              p += 2 + t.readUInt16BE(p) * 2 // backtrack
              p += 2 + (t.readUInt16BE(p) - 1) * 2 // input
              p += 2 + t.readUInt16BE(p) * 2 // lookahead
              nested(p + 2, t.readUInt16BE(p))
            }
          }
        }
      } else if (type === 8) {
        const cov = coverage(t, so + t.readUInt16BE(so + 2))
        let p = so + 4
        p += 2 + t.readUInt16BE(p) * 2
        p += 2 + t.readUInt16BE(p) * 2
        cov.forEach((g, i) => rules.singles.push([g, t.readUInt16BE(p + 2 + i * 2)]))
      }
    }
  }
  return rules
}

/** Glyph closure of a start set under substitution rules (context-free over-approximation). */
export function closure(rules, start, { ligatures = true, multiples = true } = {}) {
  const set = new Set(start)
  let changed = true
  while (changed) {
    changed = false
    const add = (g) => {
      if (!set.has(g)) {
        set.add(g)
        changed = true
      }
    }
    for (const [a, b] of rules.singles) if (set.has(a)) add(b)
    if (multiples) for (const [a, seq] of rules.multiples) if (set.has(a)) seq.forEach(add)
    if (ligatures) for (const [comps, out] of rules.ligatures) if (comps.every((c) => set.has(c))) add(out)
  }
  return set
}

// ---------------------------------------------------------------- GPOS mark attachment

function anchor(t, o) {
  return { x: t.readInt16BE(o + 2), y: t.readInt16BE(o + 4) }
}

/**
 * Mark attachment subtables of the given lookups.
 * Each: { kind: 'base'|'ligature'|'mark', marks: Map(gid → {cls, x, y}), targets: Map(gid → [anchorsByClass…]) }
 * where a target has one anchor array per ligature component (one for bases and marks); a missing anchor is null.
 */
export function markAttachments(layout, lookupIdx) {
  const t = layout.table
  const out = []
  for (const li of lookupIdx) {
    const l = layout.lookups[li]
    if (!l || ![4, 5, 6].includes(l.type)) continue
    for (const so of l.subtables) {
      if (t.readUInt16BE(so) !== 1) continue
      const markCov = coverage(t, so + t.readUInt16BE(so + 2))
      const targetCov = coverage(t, so + t.readUInt16BE(so + 4))
      const classCount = t.readUInt16BE(so + 6)
      const markArr = so + t.readUInt16BE(so + 8)
      const arr = so + t.readUInt16BE(so + 10)
      const marks = new Map()
      markCov.forEach((g, i) => {
        const r = markArr + 2 + i * 4
        marks.set(g, { cls: t.readUInt16BE(r), ...anchor(t, markArr + t.readUInt16BE(r + 2)) })
      })
      const row = (base, p) => {
        const a = []
        for (let c = 0; c < classCount; c++) {
          const off = t.readUInt16BE(p + c * 2)
          a.push(off ? anchor(t, base + off) : null)
        }
        return a
      }
      const targets = new Map()
      if (l.type === 5) {
        targetCov.forEach((g, i) => {
          const la = arr + t.readUInt16BE(arr + 2 + i * 2)
          const comps = []
          const cn = t.readUInt16BE(la)
          for (let k = 0; k < cn; k++) comps.push(row(la, la + 2 + k * classCount * 2))
          targets.set(g, comps)
        })
      } else targetCov.forEach((g, i) => targets.set(g, [row(arr, arr + 2 + i * classCount * 2)]))
      out.push({ kind: l.type === 4 ? 'base' : l.type === 5 ? 'ligature' : 'mark', marks, targets })
    }
  }
  return out
}
