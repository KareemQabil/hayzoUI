#!/usr/bin/env node
// Downloads the pinned packages of packages.json with `npm pack` and unpacks them with tar. Nothing is installed or run.
//   node tools/extract/universe/fetch.mjs <scratch-dir>
// Result: <scratch>/pkgs/node_modules/<name>/…  and  <scratch>/shadcn (shallow clone, commit recorded in <scratch>/shadcn.sha)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const scratch = process.argv[2]
if (!scratch) throw new Error('usage: fetch.mjs <scratch-dir>')
const cfg = JSON.parse(fs.readFileSync(path.join(here, 'packages.json'), 'utf8'))
const tarballs = path.join(scratch, 'tarballs')
fs.mkdirSync(tarballs, { recursive: true })
const resolved = {}
function unpack(spec, name) {
  const dest = path.join(scratch, 'pkgs', 'node_modules', name)
  if (!fs.existsSync(path.join(dest, 'package.json'))) {
    const out = execFileSync('npm', ['pack', spec, '--ignore-scripts', '--silent', '--pack-destination', tarballs], { encoding: 'utf8' }).trim().split('\n').pop()
    fs.mkdirSync(dest, { recursive: true })
    execFileSync('tar', ['-xzf', path.join(tarballs, out), '-C', dest, '--strip-components=1'])
    console.log('unpacked', spec)
  }
  return JSON.parse(fs.readFileSync(path.join(dest, 'package.json'), 'utf8'))
}
for (const [id, lib] of Object.entries(cfg.libraries)) {
  resolved[id] = {}
  const patterns = (lib.deps ?? []).map((d) => new RegExp(d))
  const queue = lib.packages.map((spec) => [spec, spec.slice(0, spec.lastIndexOf('@'))])
  while (queue.length) {
    const [spec, name] = queue.shift()
    if (resolved[id][name]) continue
    const pkg = unpack(spec, name)
    resolved[id][name] = pkg.version
    for (const [dep, range] of Object.entries(pkg.dependencies ?? {})) if (patterns.some((p) => p.test(dep))) queue.push([`${dep}@${range}`, dep])
  }
  resolved[id] = Object.fromEntries(Object.entries(resolved[id]).sort())
}
fs.mkdirSync(path.join(here, 'evidence'), { recursive: true })
const sh = path.join(scratch, 'shadcn')
if (!fs.existsSync(sh)) execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--sparse', cfg.shadcn.repo, sh], { stdio: 'inherit' })
execFileSync('git', ['-C', sh, 'sparse-checkout', 'set', 'apps/v4/registry', 'apps/v4/public/r'], { stdio: 'inherit' })
resolved.shadcn = { commit: execFileSync('git', ['-C', sh, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() }
fs.writeFileSync(path.join(here, 'evidence', 'resolved-packages.json'), JSON.stringify(resolved, null, 2) + '\n')
