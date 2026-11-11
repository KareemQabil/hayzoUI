#!/usr/bin/env node
// Builds data/icons/mirror-evidence.json — every per-icon RTL direction signal that a published set ships, copied mechanically.
//   node tools/extract/icons/mirror-evidence.mjs --scratch <dir made by fetch.sh>
// Run catalogs.mjs first: the Material Symbols list is read from data/icons/sources/material-symbols.json.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { arg, DATA, detectLicense, envelope, listDir, readJson, readText, RETRIEVED, uniqSorted, writeData, zipEntryNames } from './lib.mjs'

const S = path.resolve(arg('scratch'))
const fluent = path.join(S, 'git', 'fluent')
const fluentHead = execFileSync('git', ['-C', fluent, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const snake = (s) => s.trim().toLowerCase().replace(/\s+/g, '_')

const mirror = [], unique = []
for (const folder of listDir(path.join(fluent, 'assets'))) {
  const f = path.join(fluent, 'assets', folder, 'metadata.json')
  if (!fs.existsSync(f)) continue
  const d = readJson(f).directionType
  if (d === 'mirror') mirror.push(snake(folder))
  else if (d === 'unique') unique.push(snake(folder))
  else if (d !== undefined) throw new Error(`unexpected directionType ${d} in ${folder}`)
}
const tree = execFileSync('git', ['-C', fluent, 'ls-tree', '--name-only', 'HEAD', 'assets/'], { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n').map((l) => l.replace(/^"?assets\//, '').replace(/"$/, ''))
const ltrRtl = tree.filter((n) => / (LTR|RTL)( |$)/.test(n)).map(snake)
const rtlTxt = readText(path.join(fluent, 'importer', 'rtl.txt')).split('\n').filter(Boolean).map((l) => l.replace(/^ic_fluent_/, '').replace(/_\d+_(filled|regular)$/, ''))

const compose = new Set()
const themes = new Set()
for (const jar of ['material-icons-core-desktop-1.7.8.jar', 'material-icons-extended-desktop-1.7.8.jar']) {
  for (const n of zipEntryNames(path.join(S, 'maven', jar))) {
    const m = n.match(/^androidx\/compose\/material\/icons\/automirrored\/(\w+)\/(\w+)Kt\.class$/)
    if (m) { themes.add(m[1]); if (m[1] === 'filled') compose.add(m[2]) }
  }
}
const symbols = readJson(path.join(DATA, 'sources', 'material-symbols.json'))
const symMirrored = symbols.data.content.icons.filter((i) => i.autoMirrored === true).map((i) => i.name)

const list = (id, source, signal, meaning, names, note) => ({ id, source, signal, meaning, count: uniqSorted(names).length, names: uniqSorted(names), ...(note ? { note } : {}) })
const lists = [
  list('fluent-direction-mirror', 'fluent', 'assets/<Icon>/metadata.json → directionType: "mirror"', 'mirror', mirror, 'Names are the asset folder names in snake_case.'),
  list('fluent-direction-unique', 'fluent', 'assets/<Icon>/metadata.json → directionType: "unique"', 'separate-rtl-artwork', unique, 'The icon has separately drawn LTR and RTL versions; it must not simply be flipped.'),
  list('fluent-ltr-rtl-assets', 'fluent', 'asset folders whose name carries LTR or RTL', 'separate-rtl-artwork', ltrRtl, 'Direction-specific artwork exists as its own asset, whether or not a metadata.json declares it.'),
  list('fluent-android-rtl-txt', 'fluent', 'importer/rtl.txt (drawables the Android importer marks auto-mirrored)', 'mirror-legacy', rtlTxt, 'Older, shorter list kept in the importer; size and style suffixes removed.'),
  list('compose-automirrored', 'compose-material-icons', 'classes in package androidx.compose.material.icons.automirrored.filled of material-icons-core and material-icons-extended 1.7.8', 'mirror', [...compose], `Class names (PascalCase Material icon names). The same set exists in ${[...themes].sort().join(', ')}.`),
  list('material-symbols-automirrored', 'material-symbols', 'android:autoMirrored="true" in symbols/android/<name>/materialsymbolsoutlined/<name>_24px.xml', 'mirror', symMirrored),
]
const fl = detectLicense(path.join(fluent, 'LICENSE')).spdx
const pom = readText(path.join(S, 'maven', 'material-icons-extended-desktop-1.7.8.pom'))
if (!/Apache Software License, Version 2\.0/.test(pom)) throw new Error('unexpected license in Compose POM')
const symSrc = symbols.provenance.sources[0]
writeData('mirror-evidence.json', envelope('mirror-evidence', {
  method: 'extracted', confidence: 'verified',
  sources: [
    { name: 'Fluent UI System Icons', url: 'https://github.com/microsoft/fluentui-system-icons', version: fluentHead, license: fl, retrievedAt: RETRIEVED, path: 'assets/*/metadata.json, asset folder names, importer/rtl.txt' },
    { name: 'Jetpack Compose material-icons-core and material-icons-extended (Google Maven)', url: 'https://dl.google.com/android/maven2/androidx/compose/material/material-icons-extended-desktop/1.7.8/material-icons-extended-desktop-1.7.8.jar', version: '1.7.8', license: 'Apache-2.0', retrievedAt: RETRIEVED, path: 'androidx/compose/material/icons/automirrored/filled/*Kt.class (entry names only)' },
    { ...symSrc, retrievedAt: RETRIEVED },
  ],
  script: 'tools/extract/icons/mirror-evidence.mjs',
  notes: 'A name on a "mirror" list means the publisher flips that icon in RTL. Absence from a list is weaker evidence: it means the publisher does not flip it, which may be a decision or an omission. The Compose list is read from the published 1.7.8 artifacts because the icon generator has been removed from androidx-main; 1.7.8 is the last release of these libraries.',
}, 'mirror-evidence', { lists }))
for (const l of lists) console.log(l.id, l.count)
