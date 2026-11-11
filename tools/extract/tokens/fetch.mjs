#!/usr/bin/env node
// Downloads the pinned packages of sources.mjs into <scratch>/pkg/<name>@<version>/package (npm pack + tar, no
// install, no lifecycle scripts) and shallow-clones the pinned repositories into <scratch>/git/.
//   node tools/extract/tokens/fetch.mjs <scratch-dir>
// Nothing downloaded is ever imported or executed; the extractors read the files as text.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { PACKAGES, REPOS } from './sources.mjs'

const root = process.argv[2]
if (!root) {
  console.error('usage: fetch.mjs <scratch-dir>')
  process.exit(2)
}
fs.mkdirSync(path.join(root, 'pkg'), { recursive: true })
for (const { name, version } of PACKAGES) {
  const dir = path.join(root, 'pkg', `${name.replace('/', '__')}@${version}`)
  if (fs.existsSync(path.join(dir, 'package', 'package.json'))) {
    console.log(`have  ${name}@${version}`)
    continue
  }
  fs.mkdirSync(dir, { recursive: true })
  const out = execFileSync('npm', ['pack', `${name}@${version}`, '--ignore-scripts', '--silent', '--pack-destination', dir], { cwd: dir, encoding: 'utf8' })
  const tgz = out.trim().split('\n').pop()
  execFileSync('tar', ['-xzf', path.join(dir, tgz), '-C', dir])
  // a few tarballs use a top-level directory other than "package"
  if (!fs.existsSync(path.join(dir, 'package'))) {
    const top = fs.readdirSync(dir).find((e) => fs.statSync(path.join(dir, e)).isDirectory())
    fs.renameSync(path.join(dir, top), path.join(dir, 'package'))
  }
  fs.rmSync(path.join(dir, tgz))
  console.log(`fetch ${name}@${version}`)
}
for (const { url, dir } of REPOS) {
  const dest = path.join(root, dir)
  if (fs.existsSync(path.join(dest, '.git'))) {
    console.log(`have  ${url}`)
    continue
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  execFileSync('git', ['clone', '--depth', '1', '--quiet', url, dest], { stdio: 'inherit' })
  console.log(`clone ${url} @ ${execFileSync('git', ['-C', dest, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}`)
}
