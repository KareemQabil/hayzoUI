#!/usr/bin/env node
// Reads the owner's Ant Design parity matrix as text (TypeScript AST, nothing is executed) and keeps only what
// describes the component universe: ids, AntD export name, category, priority, feature slug, English and Arabic
// feature names and the `arabicEdge` note. status / track / evidence / ours / note describe the old codebase and are dropped.
//   node tools/extract/universe/harvest-matrix.mjs /path/to/hayzoui/src/atomic/parity/antd.ts
// Writes tools/extract/universe/seed/antd-matrix.json
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const here = path.dirname(fileURLToPath(import.meta.url))
const file = process.argv[2]
if (!file) throw new Error('usage: harvest-matrix.mjs <antd.ts>')
const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
const str = (n) => (n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : undefined)
const prop = (obj, name) => obj.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(sf) === name)?.initializer

const components = []
const ecosystem = []
ts.forEachChild(sf, (node) => {
  if (!ts.isVariableStatement(node)) return
  for (const d of node.declarationList.declarations) {
    const name = d.name.getText(sf)
    if (!d.initializer || !ts.isArrayLiteralExpression(d.initializer)) continue
    for (const el of d.initializer.elements) {
      if (!ts.isObjectLiteralExpression(el)) continue
      if (name === 'ANTD_ECOSYSTEM') {
        const item = { id: str(prop(el, 'id')), name: str(prop(el, 'name')), nameAr: str(prop(el, 'nameAr')), kind: str(prop(el, 'kind')), priority: str(prop(el, 'priority')) }
        const edge = str(prop(el, 'arabicEdge'))
        if (edge) item.arabicEdge = edge
        ecosystem.push(item)
        continue
      }
      const features = []
      for (const f of prop(el, 'features')?.elements ?? []) {
        const [slug, en, ar, , extra] = f.elements
        const row = { slug: str(slug), name: str(en), nameAr: str(ar) }
        const edge = extra && ts.isObjectLiteralExpression(extra) ? str(prop(extra, 'arabicEdge')) : undefined
        if (edge) row.arabicEdge = edge
        features.push(row)
      }
      components.push({ id: str(prop(el, 'id')), antd: str(prop(el, 'antd')), category: str(prop(el, 'category')), priority: str(prop(el, 'priority')), features })
    }
  }
})
if (components.length < 60) throw new Error(`only ${components.length} components parsed; the matrix layout changed`)
for (const c of components) for (const f of c.features) if (!f.slug || !f.name || !f.nameAr) throw new Error(`incomplete feature in ${c.id}`)
const out = { source: 'src/atomic/parity/antd.ts', components, ecosystem }
fs.writeFileSync(path.join(here, 'seed', 'antd-matrix.json'), JSON.stringify(out, null, 2) + '\n')
console.log(`${components.length} components, ${components.reduce((n, c) => n + c.features.length, 0)} features, ${components.reduce((n, c) => n + c.features.filter((f) => f.arabicEdge).length, 0)} arabicEdge notes, ${ecosystem.length} ecosystem items`)
