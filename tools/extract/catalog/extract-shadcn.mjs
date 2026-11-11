#!/usr/bin/env node
// Records the shadcn/ui component registry as a library-api file. shadcn/ui publishes no types: a component is a
// source file copied into the consumer's project, so what can be measured is the registry itself — each item,
// the registry items and npm packages it depends on, and the names its file exports (read syntactically; the
// file is parsed, never type-checked or executed). Props are not recorded.
//
//   node tools/extract/catalog/extract-shadcn.mjs <clone of github.com/shadcn-ui/ui> [--out <dir>]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const RETRIEVED_AT = '2026-11-11'
const INDEX = 'apps/v4/public/r/index.json'
const SOURCE_DIRS = ['apps/v4/registry/new-york-v4', 'apps/v4/registry/bases/radix']
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

const args = process.argv.slice(2)
const outIndex = args.indexOf('--out')
const outDir = outIndex >= 0 ? path.resolve(args.splice(outIndex, 2)[1]) : path.join(ROOT, 'data', 'catalog', 'libraries')
if (args.length !== 1) {
  console.error('usage: extract-shadcn.mjs <clone-dir> [--out <dir>]')
  process.exit(2)
}
const clone = path.resolve(args[0])

function headCommit(dir) {
  const head = fs.readFileSync(path.join(dir, '.git', 'HEAD'), 'utf8').trim()
  if (!head.startsWith('ref: ')) return head
  const ref = head.slice(5)
  const loose = path.join(dir, '.git', ref)
  if (fs.existsSync(loose)) return fs.readFileSync(loose, 'utf8').trim()
  const packed = fs.readFileSync(path.join(dir, '.git', 'packed-refs'), 'utf8').split('\n').find((l) => l.endsWith(` ${ref}`))
  if (!packed) throw new Error(`cannot resolve ${ref}`)
  return packed.split(' ')[0]
}

function exportedNames(file) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, false, ts.ScriptKind.TSX)
  const names = new Set()
  for (const statement of sf.statements) {
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause) && !statement.isTypeOnly) {
      for (const el of statement.exportClause.elements) if (!el.isTypeOnly) names.add(el.name.text)
    } else if (ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) statement.name && names.add(statement.name.text)
      else if (ts.isVariableStatement(statement)) for (const d of statement.declarationList.declarations) ts.isIdentifier(d.name) && names.add(d.name.text)
    }
  }
  return [...names].sort(cmp)
}

const commit = headCommit(clone)
const license = JSON.parse(fs.readFileSync(path.join(clone, 'packages', 'shadcn', 'package.json'), 'utf8')).license
const items = JSON.parse(fs.readFileSync(path.join(clone, INDEX), 'utf8'))
const components = []
const withoutSource = []
for (const item of [...items].sort((a, b) => cmp(a.name, b.name))) {
  const record = { name: item.name, kind: 'registry-item', category: item.type }
  const exported = new Set()
  let source
  for (const file of item.files ?? []) {
    const found = SOURCE_DIRS.map((d) => path.join(d, file.path)).find((p) => fs.existsSync(path.join(clone, p)))
    if (!found) continue
    source ??= found
    for (const name of exportedNames(path.join(clone, found))) exported.add(name)
  }
  if (source) record.source = source
  else withoutSource.push(item.name)
  // Exported names that are components by convention (PascalCase); hooks and variant helpers are left out.
  const parts = [...exported].filter((n) => /^[A-Z]/.test(n) && !/^[A-Z0-9_]+$/.test(n)).sort(cmp)
  if (parts.length) record.parts = parts
  record.props = []
  if (item.registryDependencies?.length) record.registryDependencies = [...item.registryDependencies].sort(cmp)
  if (item.dependencies?.length) record.dependencies = [...item.dependencies].sort(cmp)
  components.push(record)
}

const doc = {
  kind: 'library-api',
  schemaVersion: 1,
  id: 'shadcn-ui',
  provenance: {
    method: 'extracted',
    confidence: 'verified',
    sources: [{ name: 'shadcn/ui registry', url: 'https://github.com/shadcn-ui/ui', version: commit, license, retrievedAt: RETRIEVED_AT, path: INDEX }],
    script: 'tools/extract/catalog/extract-shadcn.mjs',
    notes: [
      `Registry index ${INDEX} at commit ${commit}: ${items.length} items.`,
      'shadcn/ui ships source files, not typed packages, so props are not recorded (props is empty for every item); parts lists the PascalCase names each item file exports, read from the syntax tree of the first of ' + SOURCE_DIRS.join(', ') + ' that has the file.',
      'dependencies and registryDependencies are the ones the index declares; the index is shared by the base, aria and radix variants, so the primitive package each variant imports is not in it.',
      withoutSource.length ? `No source file found for: ${withoutSource.join(', ')}.` : '',
    ].filter(Boolean).join(' '),
  },
  data: {
    library: { name: 'shadcn/ui', package: 'shadcn', version: commit, license, repository: 'https://github.com/shadcn-ui/ui', homepage: 'https://ui.shadcn.com', kind: 'copy-paste' },
    components,
    stats: { components: components.length, props: 0, medianProps: 0, families: components.length, parts: components.reduce((n, c) => n + (c.parts?.length ?? 0), 0) },
  },
}
fs.mkdirSync(outDir, { recursive: true })
const file = path.join(outDir, 'shadcn-ui.json')
fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n')
console.log(`shadcn-ui: ${commit.slice(0, 12)} — ${components.length} registry items, ${doc.data.stats.parts} exported components, ${withoutSource.length} without a source file → ${path.relative(ROOT, file)}`)
