#!/usr/bin/env node
// Checks the judgement in spec/ against what the libraries really publish. Reads type declarations as text
// (TypeScript parser and checker); nothing from a package is imported or run.
//   node tools/extract/universe/verify.mjs <scratch-dir>      (after fetch.mjs)
// Writes evidence/exports.json     — value exports of every library entry point (used for the coverage report)
//        evidence/verification.json — every alias (exists or not) and every feature probe (found where, or not)
//
// Alias check: `Name` must be an export of one of the library's entry points; `Name.Member` also needs `Member`
// declared as a property in the declaration files of `Name`. shadcn aliases are item names of its registry index.
// Probe check: a feature is recorded as shipped by a library when one of the probe's property names is declared
// (property or method signature) in the declaration files that belong to the library's alias: files whose directory,
// package or file name matches the alias (or an extra scope name given in the spec). Inherited DOM attributes are not
// seen, which makes the check conservative. The check is by name: it shows that a property of that name exists
// on the component, not that it behaves the same way; names with another meaning in a library are restricted in the spec.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const here = path.dirname(fileURLToPath(import.meta.url))
const scratch = process.argv[2]
if (!scratch) throw new Error('usage: verify.mjs <scratch-dir>')
const NM = path.join(scratch, 'pkgs', 'node_modules')
const cfg = JSON.parse(fs.readFileSync(path.join(here, 'packages.json'), 'utf8'))
const resolved = JSON.parse(fs.readFileSync(path.join(here, 'evidence', 'resolved-packages.json'), 'utf8'))

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const words = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w.toLowerCase())

// ── exports of each entry point ─────────────────────────────────────────────────────────────────────────────
function entryOf(pkgName) {
  const dir = path.join(NM, pkgName)
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  const dot = pkg.exports?.['.']
  const fromExports = typeof dot === 'object' ? (dot.types ?? dot.require?.types ?? dot.import?.types) : undefined
  const rel = fromExports ?? pkg.types ?? pkg.typings ?? 'index.d.ts'
  return path.join(dir, rel)
}
function exportsOf(file) {
  const program = ts.createProgram([file], { moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext, skipLibCheck: true, noLib: true, types: [], allowJs: false, baseUrl: NM, typeRoots: [] })
  const checker = program.getTypeChecker()
  const sf = program.getSourceFile(file)
  const mod = sf && checker.getSymbolAtLocation(sf)
  if (!mod) throw new Error(`no module symbol for ${file}`)
  const values = []
  const types = []
  for (const sym of checker.getExportsOfModule(mod)) {
    let target = sym
    if (sym.flags & ts.SymbolFlags.Alias) { try { target = checker.getAliasedSymbol(sym) } catch { target = sym } }
    const unresolved = target === sym && (sym.flags & ts.SymbolFlags.Alias)
    const isValue = unresolved || (target.flags & ts.SymbolFlags.Value) !== 0 || checker.isUnknownSymbol?.(target)
    ;(isValue ? values : types).push(sym.name)
  }
  return { values: values.sort(), types: types.sort() }
}

const exportsIndex = {}
for (const [lib, def] of Object.entries(cfg.libraries)) {
  exportsIndex[lib] = {}
  for (const spec of def.packages) {
    const name = spec.slice(0, spec.lastIndexOf('@'))
    exportsIndex[lib][name] = exportsOf(entryOf(name))
  }
}
// shadcn: registry index
const shRoot = path.join(scratch, 'shadcn', 'apps', 'v4')
const shIndex = JSON.parse(fs.readFileSync(path.join(shRoot, 'public', 'r', 'index.json'), 'utf8'))
const shItems = (shIndex.items ?? shIndex).filter((i) => i.type === 'registry:ui').map((i) => i.name).sort()
exportsIndex.shadcn = { 'registry:ui': { values: shItems, types: [] } }
fs.writeFileSync(path.join(here, 'evidence', 'exports.json'), JSON.stringify(Object.fromEntries(Object.entries(exportsIndex).map(([l, p]) => [l, Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v.values]))])), null, 1) + '\n')

// ── declaration files and the property names they declare ─────────────────────────────────────────────────────
const fileLists = new Map() // package -> [files]
function filesOf(pkgName) {
  if (fileLists.has(pkgName)) return fileLists.get(pkgName)
  const root = path.join(NM, pkgName)
  const out = []
  const skipTop = new Set(['lib', 'dist-cjs', 'cjs', 'node', 'legacy', 'modern', 'esm', 'umd', 'locale', 'node_modules'])
  const hasEs = fs.existsSync(path.join(root, 'es'))
  const walk = (dir, depth) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name === 'node_modules') continue
        if (depth === 0 && hasEs && e.name !== 'es') continue
        if (depth === 0 && !hasEs && skipTop.has(e.name) && e.name !== 'lib') continue
        if (e.name === 'cjs') continue
        walk(full, depth + 1)
      } else if (e.name.endsWith('.d.ts')) out.push(full)
    }
  }
  walk(root, 0)
  fileLists.set(pkgName, out)
  return out
}
const propCache = new Map()
function propsIn(file) {
  if (propCache.has(file)) return propCache.get(file)
  const names = new Set()
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, false, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const visit = (n) => {
    if ((ts.isPropertySignature(n) || ts.isPropertyDeclaration(n) || ts.isMethodSignature(n) || ts.isMethodDeclaration(n) || ts.isJsxAttribute(n) || ts.isBindingElement(n) || ts.isPropertyAssignment(n)) && n.name) {
      if (ts.isIdentifier(n.name) || ts.isStringLiteral(n.name)) names.add(n.name.text)
      if (ts.isBindingElement(n) && n.propertyName && ts.isIdentifier(n.propertyName)) names.add(n.propertyName.text)
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
  propCache.set(file, names)
  return names
}
function pkgSegment(pkgName) {
  return norm(pkgName.split('/').pop().replace(/^react-/, ''))
}
/** Files of a library that belong to `scopeName` ("pkg:<name>" = the whole package). */
function scopeFiles(lib, scopeName) {
  const pkgs = Object.keys(resolved[lib] ?? {})
  if (scopeName.startsWith('pkg:')) return filesOf(scopeName.slice(4))
  const n = norm(scopeName)
  const out = []
  for (const pkg of pkgs) {
    const all = filesOf(pkg)
    if (pkgSegment(pkg) === n) { out.push(...all); continue }
    const root = path.join(NM, pkg)
    for (const f of all) {
      const rel = path.relative(root, f).split(path.sep)
      const stem = rel.pop().split('.')[0]
      const w = words(stem)
      let acc = ''
      const stemHit = w.some((x) => (acc += x) === n)
      if (stemHit || rel.some((seg) => norm(seg) === n)) out.push(f)
    }
  }
  return out
}
function findProp(files, names) {
  for (const name of names) for (const f of files) if (propsIn(f).has(name)) return { symbol: name, path: path.relative(NM, f).split(path.sep).join('/') }
  return null
}
// shadcn: the item's own source plus the Radix primitive it wraps
function shadcnScope(item) {
  const file = path.join(shRoot, 'registry', 'new-york-v4', 'ui', `${item}.tsx`)
  if (!fs.existsSync(file)) return { files: [], via: [] }
  const text = fs.readFileSync(file, 'utf8')
  const via = []
  for (const m of text.matchAll(/import\s*\{([^}]+)\}\s*from\s*"radix-ui"/g)) for (const part of m[1].split(',')) { const n = part.trim().split(/\s+as\s+/)[0]; if (n) via.push(n) }
  return { files: [file], via }
}

// ── the spec ────────────────────────────────────────────────────────────────────────────────────────────────
const { loadUniverse } = await import('./expand.mjs')
const { components, problems } = await loadUniverse()
if (problems.length) { console.error(problems.join('\n')); process.exit(1) }
const result = { aliases: {}, probes: {} }
const allLibs = [...Object.keys(cfg.libraries), 'shadcn']
function aliasExists(lib, name) {
  if (lib === 'shadcn') return shItems.includes(name)
  const [head, member] = name.split('.')
  const found = Object.values(exportsIndex[lib] ?? {}).some((e) => e.values.includes(head) || e.types.includes(head))
  if (!found || !member) return found
  return Boolean(findProp(scopeFiles(lib, head), [member]))
}
for (const c of components) {
  const scopes = {}
  for (const [lib, list] of Object.entries(c.aliases ?? {})) {
    if (!allLibs.includes(lib)) throw new Error(`${c.id}: unknown library ${lib}`)
    for (const a of list) {
      const ok = aliasExists(lib, a.name)
      ;(result.aliases[c.id] ??= {})[`${lib}:${a.name}`] = ok
      if (!ok) continue
      const s = (scopes[lib] ??= new Set())
      s.add(a.name.split('.')[0])
      for (const extra of a.scope ?? []) s.add(extra)
    }
  }
  for (const [lib, extra] of Object.entries(c.scope ?? {})) if (scopes[lib]) for (const e of extra) scopes[lib].add(e)
  const fileSets = {}
  for (const [lib, set] of Object.entries(scopes)) {
    if (lib === 'shadcn') {
      const files = []
      const viaNames = []
      for (const item of set) { const s = shadcnScope(item); files.push(...s.files); viaNames.push(...s.via) }
      fileSets[lib] = { own: files, via: viaNames.flatMap((v) => scopeFiles('radix', v)) }
    } else fileSets[lib] = { own: [...set].flatMap((s) => scopeFiles(lib, s)), via: [] }
  }
  for (const f of c.features) {
    if (!f.probe) continue
    const all = f.probe.split('|')
    const hits = {}
    for (const [lib, fs_] of Object.entries(fileSets)) {
      // "lib:name" restricts an alternative to one library, for names that mean something else elsewhere
      const names = all.filter((n) => !n.includes(':') || n.startsWith(`${lib}:`)).map((n) => n.split(':').pop())
      let hit = findProp(fs_.own, names)
      if (hit && lib === 'shadcn') hit = { symbol: hit.symbol, path: 'shadcn-ui/ui:' + path.relative(path.join(scratch, 'shadcn'), path.join(NM, hit.path)).split(path.sep).join('/') }
      if (!hit && fs_.via.length) { const v = findProp(fs_.via, names); if (v) hit = { symbol: v.symbol, path: `via ${v.path}` } }
      if (hit) hits[lib] = hit
    }
    ;(result.probes[c.id] ??= {})[f.id] = hits
  }
}
fs.writeFileSync(path.join(here, 'evidence', 'verification.json'), JSON.stringify(result, null, 1) + '\n')
const flat = Object.values(result.aliases).flatMap((o) => Object.entries(o))
console.log(`aliases: ${flat.filter(([, ok]) => ok).length} verified, ${flat.filter(([, ok]) => !ok).length} not found`)
for (const [cid, o] of Object.entries(result.aliases)) for (const [k, ok] of Object.entries(o)) if (!ok) console.log(`  ✗ ${cid}  ${k}`)
