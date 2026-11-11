#!/usr/bin/env node
// Downloads the inputs of the fonts layer into a scratch directory (never into the repository).
//   node tools/extract/fonts/fetch.mjs <scratch-dir>
// Everything is pinned in sources.lock.json (git commits, release tag, npm versions). Nothing downloaded is executed:
// git checkouts are sparse, npm tarballs are unpacked with tar, the release zip with unzip.
// Layout produced:
//   <scratch>/google-fonts/            sparse checkout of google/fonts (METADATA.pb of every family + the Arabic families)
//   <scratch>/kawkab-mono/             the Kawkab Mono release zip, unpacked
//   <scratch>/vazir-code-font/         sparse checkout (dist/*.ttf, LICENSE)
//   <scratch>/npm/<pkg>.json           registry document of the pinned version
//   <scratch>/npm/<pkg>/package/…      unpacked tarball (@fontsource/* only; used for static instances of variable fonts)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const lockPath = path.join(HERE, 'sources.lock.json')
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'))
const scratch = path.resolve(process.argv[2] ?? '')
if (!process.argv[2]) throw new Error('usage: fetch.mjs <scratch-dir>')
fs.mkdirSync(scratch, { recursive: true })
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString()

function sparse(dir, repo, commit, patterns) {
  const d = path.join(scratch, dir)
  if (!fs.existsSync(d)) {
    run('git', ['clone', '--filter=blob:none', '--sparse', '--no-checkout', '-q', `https://github.com/${repo}.git`, d])
  }
  run('git', ['sparse-checkout', 'set', '--no-cone', ...patterns], d)
  try {
    run('git', ['checkout', '-q', commit], d)
  } catch {
    run('git', ['fetch', '-q', '--depth', '1', 'origin', commit], d)
    run('git', ['checkout', '-q', commit], d)
  }
}

// 1. google/fonts
{
  const d = path.join(scratch, 'google-fonts')
  const meta = ['/ofl/*/METADATA.pb', '/apache/*/METADATA.pb', '/ufl/*/METADATA.pb']
  sparse('google-fonts', 'google/fonts', lock.googleFonts.commit, meta)
  const arabic = []
  for (const lic of ['ofl', 'apache', 'ufl']) {
    for (const fam of fs.readdirSync(path.join(d, lic)).sort()) {
      const p = path.join(d, lic, fam, 'METADATA.pb')
      if (fs.existsSync(p) && /^subsets: "arabic"$/m.test(fs.readFileSync(p, 'utf8'))) arabic.push(`/${lic}/${fam}/`)
    }
  }
  sparse('google-fonts', 'google/fonts', lock.googleFonts.commit, [...meta, ...arabic, ...lock.googleFonts.latinReference.map((f) => `/${f}/`)])
}

// 2. upstream repositories outside google/fonts
sparse('vazir-code-font', 'rastikerdar/vazir-code-font', lock.vazirCode.commit, ['/dist/*.ttf', '/LICENSE', '/README.md'])
{
  const d = path.join(scratch, 'kawkab-mono')
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d)
    run('curl', ['-sSL', '--fail', '-o', path.join(scratch, 'kawkab-mono.zip'), lock.kawkabMono.url])
    run('unzip', ['-q', '-o', path.join(scratch, 'kawkab-mono.zip'), '-d', d])
  }
}

// 3. npm registry: @fontsource/<id> (tarball) and @fontsource-variable/<id> (existence and version only)
{
  const dir = path.join(scratch, 'npm')
  fs.mkdirSync(dir, { recursive: true })
  for (const [pkg, version] of Object.entries(lock.npm)) {
    const safe = pkg.replace('/', '__')
    if (version === false) {
      // Recorded as absent from the registry (HTTP 404) on lock.retrievedAt.
      fs.writeFileSync(path.join(dir, `${safe}.json`), JSON.stringify({ missing: true, status: 404 }))
      continue
    }
    const json = path.join(dir, `${safe}.json`)
    if (!fs.existsSync(json)) {
      const code = run('curl', ['-sS', '-o', json, '-w', '%{http_code}', `https://registry.npmjs.org/${pkg}/${version ?? 'latest'}`])
      if (code !== '200') {
        fs.writeFileSync(json, JSON.stringify({ missing: true, status: Number(code) }))
        continue
      }
    }
    const doc = JSON.parse(fs.readFileSync(json, 'utf8'))
    if (doc.missing || !pkg.startsWith('@fontsource/')) continue
    const out = path.join(dir, safe)
    if (!fs.existsSync(out)) {
      fs.mkdirSync(out)
      run('curl', ['-sSL', '--fail', '-o', path.join(dir, `${safe}.tgz`), doc.dist.tarball])
      // Keep metadata and the WOFF 1.0 files of the arabic subset only (some packages have no such subset).
      const wanted = run('tar', ['-tzf', path.join(dir, `${safe}.tgz`)]).split('\n').filter((f) => /\/(metadata|package)\.json$|-arabic-\d+-normal\.woff$/.test(f))
      run('tar', ['-xzf', path.join(dir, `${safe}.tgz`), '-C', out, ...wanted])
    }
  }
  // Report what was resolved, so that an unpinned (null) entry can be pinned by hand in sources.lock.json.
  for (const pkg of Object.keys(lock.npm)) {
    const doc = JSON.parse(fs.readFileSync(path.join(dir, `${pkg.replace('/', '__')}.json`), 'utf8'))
    console.log(`${pkg}\t${doc.missing ? 'MISSING' : doc.version}`)
  }
}
