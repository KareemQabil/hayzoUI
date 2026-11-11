// Shared helpers for the icons layer extractors. Zero dependencies. Downloads are only ever read as text/bytes.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
export const DATA = path.join(ROOT, 'data', 'icons')
// Retrieval date of the downloads these scripts were run against. Override with HAYZO_RETRIEVED=YYYY-MM-DD.
export const RETRIEVED = process.env.HAYZO_RETRIEVED ?? '2026-11-11'

export const readText = (p) => fs.readFileSync(p, 'utf8')
export const readJson = (p) => JSON.parse(readText(p))
export const listDir = (p) => (fs.existsSync(p) ? fs.readdirSync(p).sort() : [])
export const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
export const uniqSorted = (xs) => [...new Set(xs)].sort()

export function writeData(rel, doc) {
  const file = path.join(DATA, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n')
  console.log(`wrote data/icons/${rel} (${(fs.statSync(file).size / 1024).toFixed(0)} KiB)`)
}

export function envelope(id, provenance, dataset, content) {
  return { kind: 'icon', schemaVersion: 1, id, provenance, data: { dataset, content } }
}

// Identify a license from the text of the LICENSE file that ships with the artifact (not from package.json).
export function detectLicense(file) {
  const t = readText(file)
  const head = t.slice(0, 400).replace(/\s+/g, ' ').trim()
  let spdx
  if (/Remix Icon License/i.test(head)) spdx = 'LicenseRef-Remix-Icon-1.0'
  else if (/^ISC License/i.test(head)) spdx = 'ISC'
  else if (/Apache License,? Version 2\.0/i.test(head)) spdx = 'Apache-2.0'
  else if (/MIT License/i.test(head) || /Permission is hereby granted, free of charge/.test(t.slice(0, 600))) spdx = 'MIT'
  else throw new Error(`unrecognised license text in ${file}: ${head.slice(0, 80)}`)
  const holder = (t.match(/^\s*Copyright \(c\) (.+)$/m) ?? [])[1]?.trim()
  return { spdx, ...(holder ? { copyright: holder } : {}) }
}

// Tally the root <svg> attributes of every .svg in a directory: this is the evidence for grid size and stroke/fill model.
export function svgFacts(dir) {
  const tally = { files: 0, viewBox: {}, strokeWidth: {}, fill: {}, stroke: {} }
  const bump = (o, k) => { o[k] = (o[k] ?? 0) + 1 }
  for (const f of listDir(dir)) {
    if (!f.endsWith('.svg')) continue
    const m = readText(path.join(dir, f)).match(/<svg\b[^>]*>/)
    if (!m) continue
    tally.files++
    const attr = (n) => (m[0].match(new RegExp(`\\s${n}="([^"]*)"`)) ?? [])[1]
    bump(tally.viewBox, attr('viewBox') ?? '(none)')
    bump(tally.strokeWidth, attr('stroke-width') ?? '(none)')
    bump(tally.fill, attr('fill') ?? '(none)')
    bump(tally.stroke, attr('stroke') ?? '(none)')
  }
  return tally
}
const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0]
// Reduce a tally to the facts we record. model: "stroke" when the root sets a stroke-width and fill="none", else "fill".
export function drawingFrom(tally) {
  const vb = top(tally.viewBox)
  const sw = top(tally.strokeWidth)
  const stroke = sw !== '(none)' && top(tally.fill) === 'none'
  const size = vb && vb !== '(none)' ? Number(vb.split(/\s+/)[2]) : undefined
  return { model: stroke ? 'stroke' : 'fill', ...(size ? { grid: size } : {}), ...(stroke ? { strokeWidth: Number(sw) } : {}) }
}

// Names of the entries of a zip/jar, read from the central directory (no decompression, nothing executed).
export function zipEntryNames(file) {
  const b = fs.readFileSync(file)
  let i = b.length - 22
  while (i >= 0 && b.readUInt32LE(i) !== 0x06054b50) i--
  if (i < 0) throw new Error('not a zip: ' + file)
  const count = b.readUInt16LE(i + 10)
  let p = b.readUInt32LE(i + 16)
  const names = []
  for (let n = 0; n < count; n++) {
    if (b.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory in ' + file)
    const nl = b.readUInt16LE(p + 28), el = b.readUInt16LE(p + 30), cl = b.readUInt16LE(p + 32)
    names.push(b.toString('utf8', p + 46, p + 46 + nl))
    p += 46 + nl + el + cl
  }
  return names
}

export function parseCsv(text) {
  const rows = []
  let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (c !== '\r') cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

export function arg(name, required = true) {
  const i = process.argv.indexOf('--' + name)
  if (i < 0 || !process.argv[i + 1]) {
    if (required) { console.error(`missing --${name} <path>`); process.exit(2) }
    return undefined
  }
  return process.argv[i + 1]
}

export function loadCatalogs() {
  const out = {}
  for (const f of listDir(path.join(DATA, 'sources'))) {
    const doc = readJson(path.join(DATA, 'sources', f))
    out[doc.id] = doc.data.content
  }
  return out
}
