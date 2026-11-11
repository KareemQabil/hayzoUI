#!/usr/bin/env node
// Installs every library at the versions pinned in tools/extract/catalog/libraries/*.json, one directory each,
// without running any package script. The packages are only ever read by the TypeScript compiler.
//   node tools/extract/catalog/install.mjs <installs-dir> [id …]
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const [installs, ...only] = process.argv.slice(2)
if (!installs) {
  console.error('usage: install.mjs <installs-dir> [id …]')
  process.exit(2)
}
for (const file of fs.readdirSync(path.join(here, 'libraries')).sort()) {
  const config = JSON.parse(fs.readFileSync(path.join(here, 'libraries', file), 'utf8'))
  if (only.length && !only.includes(config.id)) continue
  const dir = path.resolve(installs, config.id)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: `scratch-${config.id}`, private: true }) + '\n')
  console.log(`${config.id}: ${config.install.join(' ')}`)
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--legacy-peer-deps', ...config.install], { cwd: dir, stdio: 'inherit' })
}
