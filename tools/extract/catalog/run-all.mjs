#!/usr/bin/env node
// Runs the extractor for every config in tools/extract/catalog/libraries/ against <installs-dir>/<id>/ (see install.mjs).
//   node tools/extract/catalog/run-all.mjs <installs-dir> [--out <dir>] [id …]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extract } from './extract-api.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(here, '..', '..', '..')
const args = process.argv.slice(2)
const outIndex = args.indexOf('--out')
const outDir = outIndex >= 0 ? path.resolve(args.splice(outIndex, 2)[1]) : path.join(ROOT, 'data', 'catalog', 'libraries')
const [installs, ...only] = args
if (!installs) {
  console.error('usage: run-all.mjs <installs-dir> [--out <dir>] [id …]')
  process.exit(2)
}
fs.mkdirSync(outDir, { recursive: true })
for (const file of fs.readdirSync(path.join(here, 'libraries')).sort()) {
  const config = JSON.parse(fs.readFileSync(path.join(here, 'libraries', file), 'utf8'))
  if (only.length && !only.includes(config.id)) continue
  const doc = extract(path.resolve(installs, config.id), config)
  fs.writeFileSync(path.join(outDir, `${config.id}.json`), JSON.stringify(doc, null, 2) + '\n')
  const s = doc.data.stats
  console.log(`${config.id.padEnd(28)} ${doc.data.library.version.padEnd(8)} components ${String(s.components).padStart(4)}  props ${String(s.props).padStart(6)}  median ${String(s.medianProps).padStart(5)}  families ${String(s.families).padStart(4)}  aliases ${String(s.aliases).padStart(4)}  dom-excluded ${String(s.excludedDomProps).padStart(7)}  style-excluded ${String(s.excludedStyleProps).padStart(7)}`)
}
