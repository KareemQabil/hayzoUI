#!/usr/bin/env node
// Builds data/icons/sources/<id>.json — names and metadata of each open icon set. No geometry is copied.
//   node tools/extract/icons/catalogs.mjs --scratch <dir made by fetch.sh> [--only lucide,tabler,…]
// Every set's license is identified from the LICENSE file inside the downloaded artifact.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { arg, byName, detectLicense, drawingFrom, envelope, listDir, parseCsv, readJson, readText, RETRIEVED, svgFacts, uniqSorted, writeData } from './lib.mjs'

const S = path.resolve(arg('scratch'))
const only = arg('only', false)?.split(',')
const SCRIPT = 'tools/extract/icons/catalogs.mjs'
const npmDir = (pkg) => path.join(S, 'npm', pkg.replace(/[/@]/g, '_'), 'package')
const gitDir = (name) => path.join(S, 'git', name)
const head = (repo) => execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const svgNames = (dir) => listDir(dir).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4))
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0)))
const strs = (xs) => uniqSorted((xs ?? []).map((x) => String(x).trim()).filter(Boolean))

function emit(id, set, icons, sources, notes) {
  icons.sort(byName)
  const names = new Set(icons.map((i) => i.name))
  if (names.size !== icons.length) throw new Error(`${id}: duplicate icon names`)
  set.iconCount = icons.length
  set.metadata = {
    tags: icons.filter((i) => i.tags?.length).length,
    categories: icons.filter((i) => i.categories?.length).length,
  }
  writeData(`sources/${id}.json`, envelope(id, { method: 'extracted', confidence: 'verified', sources, script: SCRIPT, ...(notes ? { notes } : {}) }, 'source-catalog', { set, icons }))
}
const src = (name, url, version, license, p) => ({ name, url, version, license, retrievedAt: RETRIEVED, ...(p ? { path: p } : {}) })

const builders = {
  lucide() {
    const repo = gitDir('lucide'), pkg = npmDir('lucide-static')
    const version = readJson(path.join(pkg, 'package.json')).version
    const license = detectLicense(path.join(repo, 'LICENSE'))
    const icons = listDir(path.join(repo, 'icons')).filter((f) => f.endsWith('.json')).map((f) => {
      const j = readJson(path.join(repo, 'icons', f))
      const tags = (j.tags ?? []).map(String)
      return clean({
        name: f.slice(0, -5),
        tags: strs(tags.filter((t) => !t.startsWith('$group:'))),
        groups: strs(tags.filter((t) => t.startsWith('$group:')).map((t) => t.slice(7))),
        categories: strs(j.categories),
        aliases: strs((j.aliases ?? []).map((a) => (typeof a === 'string' ? a : a.name))),
      })
    })
    const facts = svgFacts(path.join(pkg, 'icons'))
    emit('lucide', {
      name: 'Lucide', repository: 'https://github.com/lucide-icons/lucide', npm: 'lucide-static', version, commit: head(repo),
      license: { ...license, file: 'LICENSE', note: 'ISC for the set; the LICENSE file lists the icons derived from Feather, which stay under MIT.' },
      drawing: drawingFrom(facts), styles: [{ id: 'default', iconCount: icons.length }],
      categoryIds: listDir(path.join(repo, 'categories')).map((f) => f.replace(/\.json$/, '')),
    }, icons, [
      src('Lucide', 'https://github.com/lucide-icons/lucide', head(repo), license.spdx, 'icons/*.json, categories/*.json, LICENSE'),
      src('lucide-static (npm)', 'https://www.npmjs.com/package/lucide-static', version, license.spdx, 'icons/*.svg root attributes'),
    ], 'Names, tags and categories from the per-icon JSON files at the commit tagged with the npm version. Tags of the form $group:<id> are kept separately as `groups` (Lucide\'s shared tag groups, e.g. direction-left). Grid and stroke width are the modal root <svg> attributes of the published SVG files.')
  },

  tabler() {
    const pkg = npmDir('@tabler/icons')
    const version = readJson(path.join(pkg, 'package.json')).version
    const license = detectLicense(path.join(pkg, 'LICENSE'))
    const meta = readJson(path.join(pkg, 'icons.json'))
    const icons = Object.values(meta).map((i) => clean({ name: i.name, tags: strs(i.tags), categories: strs(i.category ? [i.category] : []), styles: Object.keys(i.styles ?? {}).sort() }))
    const styleCount = (s) => icons.filter((i) => i.styles?.includes(s)).length
    emit('tabler', {
      name: 'Tabler Icons', repository: 'https://github.com/tabler/tabler-icons', npm: '@tabler/icons', version,
      license: { ...license, file: 'LICENSE' },
      drawing: drawingFrom(svgFacts(path.join(pkg, 'icons', 'outline'))),
      styles: [
        { id: 'outline', iconCount: styleCount('outline'), drawing: drawingFrom(svgFacts(path.join(pkg, 'icons', 'outline'))) },
        { id: 'filled', iconCount: styleCount('filled'), drawing: drawingFrom(svgFacts(path.join(pkg, 'icons', 'filled'))) },
      ],
    }, icons, [src('@tabler/icons (npm)', 'https://www.npmjs.com/package/@tabler/icons', version, license.spdx, 'icons.json, icons/{outline,filled}/*.svg, LICENSE')])
  },

  phosphor() {
    const pkg = npmDir('@phosphor-icons/core')
    const version = readJson(path.join(pkg, 'package.json')).version
    const license = detectLicense(path.join(pkg, 'LICENSE'))
    const text = readText(path.join(pkg, 'dist', 'index.mjs'))
    // The bundle declares its enums as `x = ((i) => (i.KEY = "value", …, i))(x || {})`; resolve `x.KEY` references textually.
    const enums = {}
    for (const m of text.matchAll(/(\w+) = \/\* @__PURE__ \*\/ \(\(i\) => \(([^]*?), i\)\)\(\1 \|\| \{\}\)/g)) {
      enums[m[1]] = Object.fromEntries([...m[2].matchAll(/i\.(\w+) = "([^"]*)"/g)].map((x) => [x[1], x[2]]))
    }
    const resolve = (ref) => { const [e, k] = ref.trim().split('.'); const v = enums[e]?.[k]; if (!v) throw new Error('unresolved enum ' + ref); return v }
    const icons = []
    for (const m of text.matchAll(/\{\s*name: "([^"]+)",\s*pascal_name: "[^"]+",\s*(?:alias: \{ name: "([^"]+)"[^}]*\},\s*)?categories: \[([^\]]*)\],\s*figma_category: ([\w.]+),\s*tags: \[([^\]]*)\]/g)) {
      const tags = [...m[5].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]).filter((t) => !/^\*.*\*$/.test(t))
      icons.push(clean({ name: m[1], tags: strs(tags), categories: strs(m[3].split(',').filter((s) => s.trim()).map(resolve)), figmaCategory: resolve(m[4]), aliases: m[2] ? [m[2]] : [] }))
    }
    const declared = (text.match(/\n    pascal_name:/g) ?? []).length
    if (icons.length !== declared) throw new Error(`phosphor: parsed ${icons.length} of ${declared} entries`)
    const weights = listDir(path.join(pkg, 'assets'))
    emit('phosphor', {
      name: 'Phosphor Icons', repository: 'https://github.com/phosphor-icons/core', npm: '@phosphor-icons/core', version,
      license: { ...license, file: 'LICENSE' },
      drawing: drawingFrom(svgFacts(path.join(pkg, 'assets', 'regular'))),
      styles: weights.map((w) => ({ id: w, iconCount: svgNames(path.join(pkg, 'assets', w)).length })),
    }, icons, [src('@phosphor-icons/core (npm)', 'https://www.npmjs.com/package/@phosphor-icons/core', version, license.spdx, 'dist/index.mjs (icon metadata array), assets/<weight>/*.svg, LICENSE')],
    'Every icon ships in all six weights, so styles are recorded on the set, not per icon. Outlines are expanded to filled paths on a 256-unit grid: the model is "fill" even for the line weights.')
  },

  heroicons() {
    const pkg = npmDir('heroicons')
    const version = readJson(path.join(pkg, 'package.json')).version
    const license = detectLicense(path.join(pkg, 'LICENSE'))
    const styleDirs = ['24/outline', '24/solid', '20/solid', '16/solid']
    const map = new Map()
    for (const s of styleDirs) for (const n of svgNames(path.join(pkg, s))) map.set(n, [...(map.get(n) ?? []), s])
    const icons = [...map].map(([name, styles]) => ({ name, styles }))
    emit('heroicons', {
      name: 'Heroicons', repository: 'https://github.com/tailwindlabs/heroicons', npm: 'heroicons', version,
      license: { ...license, file: 'LICENSE' },
      drawing: drawingFrom(svgFacts(path.join(pkg, '24/outline'))),
      styles: styleDirs.map((s) => ({ id: s, iconCount: svgNames(path.join(pkg, s)).length, drawing: drawingFrom(svgFacts(path.join(pkg, s))) })),
    }, icons, [src('heroicons (npm)', 'https://www.npmjs.com/package/heroicons', version, license.spdx, '{24/outline,24/solid,20/solid,16/solid}/*.svg, LICENSE')],
    'The package publishes no tags or categories; none are recorded.')
  },

  carbon() {
    const pkg = npmDir('@carbon/icons')
    const version = readJson(path.join(pkg, 'package.json')).version
    const license = detectLicense(path.join(pkg, 'LICENSE'))
    const meta = readJson(path.join(pkg, 'metadata.json'))
    const icons = meta.icons.map((i) => clean({
      name: [...i.namespace, i.name].join('/'),
      tags: strs(i.aliases), categories: strs([i.category, i.subcategory].filter(Boolean)),
      sizes: [...new Set((i.output ?? []).map((o) => o.size).filter((n) => typeof n === 'number'))].sort((a, b) => a - b),
      deprecated: i.deprecated ? true : undefined,
    }))
    const sizes = listDir(path.join(pkg, 'svg')).filter((d) => /^\d+$/.test(d)).map(Number).sort((a, b) => a - b)
    emit('carbon', {
      name: 'Carbon Icons', repository: 'https://github.com/carbon-design-system/carbon', npm: '@carbon/icons', version,
      license: { ...license, file: 'LICENSE' },
      drawing: { ...drawingFrom(svgFacts(path.join(pkg, 'svg', '32'))), sizes },
      styles: [{ id: 'default', iconCount: icons.length }],
    }, icons, [src('@carbon/icons (npm)', 'https://www.npmjs.com/package/@carbon/icons', version, license.spdx, 'metadata.json, svg/32/*.svg, LICENSE')],
    'Names carry their namespace as a path prefix (e.g. watson-health/…). `tags` are the published aliases; `categories` are [category, subcategory]. Filled variants are separate icons named …--filled.')
  },

  iconoir() {
    const pkg = npmDir('iconoir'), repo = gitDir('iconoir')
    const version = readJson(path.join(pkg, 'package.json')).version
    const license = detectLicense(path.join(pkg, 'LICENSE'))
    const rows = parseCsv(readText(path.join(repo, 'iconoir.com', 'icons.csv'))).slice(1)
    const csv = new Map(rows.map((r) => [r[0], { category: r[1], tags: (r[2] ?? '').split(',') }]))
    const styles = listDir(path.join(pkg, 'icons'))
    const map = new Map()
    for (const s of styles) for (const n of svgNames(path.join(pkg, 'icons', s))) map.set(n, [...(map.get(n) ?? []), s])
    let unmatched = 0
    const icons = [...map].map(([name, st]) => {
      const c = csv.get(name)
      if (!c) unmatched++
      return clean({ name, tags: strs(c?.tags), categories: strs(c?.category ? [c.category] : []), styles: st })
    })
    emit('iconoir', {
      name: 'Iconoir', repository: 'https://github.com/iconoir-icons/iconoir', npm: 'iconoir', version,
      license: { ...license, file: 'LICENSE' },
      drawing: drawingFrom(svgFacts(path.join(pkg, 'icons', 'regular'))),
      styles: styles.map((s) => ({ id: s, iconCount: svgNames(path.join(pkg, 'icons', s)).length, drawing: drawingFrom(svgFacts(path.join(pkg, 'icons', s))) })),
    }, icons, [
      src('iconoir (npm)', 'https://www.npmjs.com/package/iconoir', version, license.spdx, 'icons/{regular,solid}/*.svg, LICENSE'),
      src('Iconoir repository', 'https://github.com/iconoir-icons/iconoir', head(repo), license.spdx, 'iconoir.com/icons.csv'),
    ], `Names and styles from the npm package; category and tags joined from iconoir.com/icons.csv at the repository head (${csv.size} rows). ${unmatched} packaged icons have no row in the CSV and carry no tags.`)
  },

  bootstrap() {
    const pkg = npmDir('bootstrap-icons'), repo = gitDir('bootstrap-icons')
    const version = readJson(path.join(pkg, 'package.json')).version
    const repoVersion = readJson(path.join(repo, 'package.json')).version
    const license = detectLicense(path.join(pkg, 'LICENSE'))
    const docs = path.join(repo, 'docs', 'content', 'icons')
    const front = (name) => {
      const f = path.join(docs, name + '.md')
      if (!fs.existsSync(f)) return undefined
      const fm = readText(f).split(/^---\s*$/m)[1] ?? ''
      const out = { categories: [], tags: [] }
      let key
      for (const line of fm.split('\n')) {
        const k = line.match(/^(\w+):\s*(.*)$/)
        if (k) { key = k[1]; continue }
        const item = line.match(/^\s+-\s+(.*)$/)
        if (item && out[key]) out[key].push(item[1].replace(/^["']|["']$/g, ''))
      }
      return out
    }
    let unmatched = 0
    const icons = svgNames(path.join(pkg, 'icons')).map((name) => {
      const m = front(name)
      if (!m) unmatched++
      return clean({ name, tags: strs(m?.tags), categories: strs(m?.categories) })
    })
    emit('bootstrap', {
      name: 'Bootstrap Icons', repository: 'https://github.com/twbs/icons', npm: 'bootstrap-icons', version,
      license: { ...license, file: 'LICENSE' },
      drawing: drawingFrom(svgFacts(path.join(pkg, 'icons'))),
      styles: [{ id: 'default', iconCount: icons.length }],
    }, icons, [
      src('bootstrap-icons (npm)', 'https://www.npmjs.com/package/bootstrap-icons', version, license.spdx, 'icons/*.svg, LICENSE'),
      src('Bootstrap Icons repository', 'https://github.com/twbs/icons', head(repo), license.spdx, 'docs/content/icons/*.md front matter'),
    ], `Names from the npm package; categories and tags from the front matter of the documentation pages at the repository head (package.json version ${repoVersion}). ${unmatched} packaged icons have no page. Filled variants are separate icons named …-fill.`)
  },

  fluent() {
    const repo = gitDir('fluent')
    const license = detectLicense(path.join(repo, 'LICENSE'))
    const version = readJson(path.join(repo, 'packages', 'svg-icons', 'package.json')).version
    const tree = execFileSync('git', ['-C', repo, 'ls-tree', '-r', '--name-only', 'HEAD', 'assets'], { encoding: 'utf8', maxBuffer: 1 << 28 }).split('\n')
    const byIcon = new Map() // base name -> { folder, sizes:Set, styles:Set }
    const folderSet = new Set()
    for (const line of tree) {
      const m = line.match(/^assets\/([^/]+)\/SVG\/ic_fluent_(.+)_(\d+)_([a-z]+)\.svg$/)
      if (!m) continue
      folderSet.add(m[1])
      const f = byIcon.get(m[2]) ?? { folder: m[1], sizes: new Set(), styles: new Set() }
      f.sizes.add(Number(m[3])); f.styles.add(m[4])
      byIcon.set(m[2], f)
    }
    const folders = folderSet
    const icons = []
    const metaFolders = new Set()
    for (const [name, f] of byIcon) {
      const folder = f.folder
      const metaFile = path.join(repo, 'assets', folder, 'metadata.json')
      const meta = fs.existsSync(metaFile) ? readJson(metaFile) : undefined
      if (meta) metaFolders.add(folder)
      const variant = (folder.match(/ (LTR|RTL)( |$)/) ?? [])[1]?.toLowerCase()
      icons.push(clean({
        name, title: folder,
        tags: strs([...(Array.isArray(meta?.metaphor) ? meta.metaphor : []), ...(typeof meta?.keyword === 'string' ? meta.keyword.split(',') : []).filter((k) => k !== 'fluent-icon')]),
        styles: [...f.styles].sort(), sizes: [...f.sizes].sort((a, b) => a - b),
        direction: meta?.directionType, singleton: meta?.singleton, directionVariant: variant,
      }))
    }
    const withMeta = metaFolders.size
    const all = (k) => uniqSorted(icons.flatMap((i) => i[k]))
    emit('fluent', {
      name: 'Fluent UI System Icons', repository: 'https://github.com/microsoft/fluentui-system-icons', npm: '@fluentui/svg-icons', version, commit: head(repo),
      license: { ...license, file: 'LICENSE' },
      drawing: { model: 'fill', sizes: [...new Set(icons.flatMap((i) => i.sizes))].sort((a, b) => a - b) },
      styles: all('styles').map((s) => ({ id: s, iconCount: icons.filter((i) => i.styles.includes(s)).length })),
      rtl: {
        mechanism: 'metadata.json directionType: "mirror" (flip the asset) or "unique" (separately drawn LTR and RTL assets, named …_ltr / …_rtl); `singleton` names the default direction.',
        mirror: icons.filter((i) => i.direction === 'mirror').length,
        unique: icons.filter((i) => i.direction === 'unique').length,
        ltrRtlNamedAssets: icons.filter((i) => i.directionVariant).length,
        withMetadata: withMeta,
      },
    }, icons, [src('Fluent UI System Icons', 'https://github.com/microsoft/fluentui-system-icons', head(repo), license.spdx, 'assets/*/metadata.json, asset file names (git tree), packages/svg-icons/package.json, LICENSE')],
    `One entry per icon base name (a few asset folders hold more than one). Sizes and styles come from the asset file names in the git tree (ic_fluent_<name>_<size>_<style>.svg); tags are metadata.json metaphor plus keyword (minus the constant "fluent-icon"). ${withMeta} of ${folders.size} folders have a metadata.json. The model is recorded as "fill" from the published style names (regular/filled/light/color are all filled outlines); SVG files were not downloaded, so no grid attribute was tallied — sizes are the pixel sizes in the file names. Version is that of packages/svg-icons at the commit.`)
  },

  'material-symbols'() {
    const repo = gitDir('mdi')
    const license = detectLicense(path.join(repo, 'LICENSE'))
    const commit = head(repo)
    const fontFiles = listDir(path.join(repo, 'variablefont')).filter((f) => f.endsWith('.codepoints'))
    const families = fontFiles.map((f) => ({ file: f, style: f.match(/MaterialSymbols(\w+)\[/)[1].toLowerCase(), axes: f.match(/\[([^\]]+)\]/)[1].split(','), names: readText(path.join(repo, 'variablefont', f)).split('\n').filter(Boolean).map((l) => l.split(' ')[0]) }))
    const names = uniqSorted(families.flatMap((f) => f.names))
    const gf = JSON.parse(readText(path.join(S, 'gfonts', 'icons.json')).replace(/^\)\]\}'\n/, ''))
    const gmeta = new Map(gf.icons.filter((i) => !i.unsupported_families.includes('Material Symbols Outlined')).map((i) => [i.name, i]))
    // autoMirrored: read the plain 24px outlined Android drawable of each symbol straight from the object store.
    const listing = readText(path.join(S, 'git', 'mdi-24.txt')).split('\n').filter(Boolean).map((l) => { const [a, p] = l.split('\t'); return { oid: a.split(' ')[2], name: p.split('/')[2] } })
    const batch = spawnSync('git', ['-C', repo, 'cat-file', '--batch'], { input: listing.map((l) => l.oid).join('\n') + '\n', maxBuffer: 1 << 28 })
    if (batch.status !== 0) throw new Error('git cat-file failed: ' + batch.stderr)
    const buf = batch.stdout
    const mirrored = new Set(), drawable = new Set()
    let p = 0
    for (const l of listing) {
      const nl = buf.indexOf(10, p)
      const [, type, size] = buf.toString('utf8', p, nl).split(' ')
      if (type !== 'blob') throw new Error(`missing blob for ${l.name}`)
      const body = buf.toString('utf8', nl + 1, nl + 1 + Number(size))
      p = nl + 1 + Number(size) + 1
      drawable.add(l.name)
      if (/android:autoMirrored="true"/.test(body)) mirrored.add(l.name)
    }
    let noMeta = 0
    const icons = names.map((name) => {
      const g = gmeta.get(name)
      if (!g) noMeta++
      return clean({
        name,
        tags: strs((g?.tags ?? []).filter((t) => !/^disable_ios$/i.test(t))),
        categories: strs(g?.categories),
        autoMirrored: drawable.has(name) ? mirrored.has(name) : undefined,
      })
    })
    emit('material-symbols', {
      name: 'Material Symbols', repository: 'https://github.com/google/material-design-icons', npm: 'material-symbols', version: commit, commit,
      license: { ...license, file: 'LICENSE' },
      drawing: { model: 'fill', grid: 24, sizes: uniqSorted(gf.icons.flatMap((i) => i.sizes_px ?? [])).map(Number).sort((a, b) => a - b), variableAxes: families[0].axes },
      styles: families.map((f) => ({ id: f.style, iconCount: f.names.length })),
      rtl: {
        mechanism: 'android:autoMirrored="true" on the Android vector drawable of a symbol (symbols/android/<name>/materialsymbolsoutlined/<name>_24px.xml).',
        drawablesRead: drawable.size, autoMirrored: mirrored.size,
      },
      npmNote: 'Google publishes no npm package; `material-symbols` (and @material-symbols/svg-*) is a third-party repackaging by marella under Apache-2.0.',
    }, icons, [
      src('Material Design Icons repository (Material Symbols)', 'https://github.com/google/material-design-icons', commit, license.spdx, 'variablefont/*.codepoints, symbols/android/*/materialsymbolsoutlined/*_24px.xml, LICENSE'),
      src('Google Fonts icon metadata', 'https://fonts.google.com/metadata/icons?key=material_symbols&incomplete=true', `retrieved ${RETRIEVED}`, license.spdx, 'icons[].categories, icons[].tags, icons[].sizes_px'),
    ], `Names are the union of the three variable-font codepoint files at the commit; the repository has no release tags, so the commit is the version. Tags and categories are joined from the Google Fonts metadata endpoint (unversioned; ${noMeta} names have no entry there). autoMirrored was read from ${drawable.size} Android drawables; names without a drawable omit the field. Grid 24 is the android:width of those drawables (viewport 960). The model is "fill": outlines are filled paths, with weight, fill, grade and optical size as font axes.`)
  },
}

for (const [id, build] of Object.entries(builders)) {
  if (only && !only.includes(id)) continue
  build()
}
