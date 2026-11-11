#!/usr/bin/env node
// Runs tools/extract/rules/lib/uax9.mjs against the Unicode conformance files of one UCD version.
//   node tools/extract/rules/uax9-conformance.mjs <dir with BidiTest.txt, BidiCharacterTest.txt and the UCD property files>
// The test files are read where they are; nothing is copied into the repository. Exit code 1 on any failure.
import fs from 'node:fs'
import path from 'node:path'
import { loadBidiData, resolve, resolveCodePoints } from './lib/uax9.mjs'

const dir = process.argv[2]
if (!dir) {
  console.error('usage: uax9-conformance.mjs <ucd-dir>')
  process.exit(2)
}
const data = loadBidiData(dir)
const same = (a, b) => a.length === b.length && a.every((v, i) => String(v) === String(b[i]))
let failures = 0
const report = (label, detail) => {
  if (++failures <= 10) console.error(`✗ ${label}: ${detail}`)
}

// BidiTest.txt: classes, with shared @Levels / @Reorder lines; bitset 1 = auto, 2 = LTR, 4 = RTL.
let classCases = 0
{
  let levels = []
  let reorder = []
  const lines = fs.readFileSync(path.join(dir, 'BidiTest.txt'), 'utf8').split('\n')
  lines.forEach((line, lineNo) => {
    if (line.startsWith('@Levels:')) levels = line.slice(8).trim().split(/\s+/).filter(Boolean)
    else if (line.startsWith('@Reorder:')) reorder = line.slice(9).trim().split(/\s+/).filter(Boolean)
    else if (line && !line.startsWith('#') && !line.startsWith('@')) {
      const [input, bitset] = line.split(';')
      const types = input.trim().split(/\s+/)
      const bits = parseInt(bitset.trim(), 10)
      for (const [bit, direction] of [[1, 2], [2, 0], [4, 1]]) {
        if (!(bits & bit)) continue
        classCases++
        const r = resolve(types, direction)
        if (!same(r.levels, levels) || !same(r.order, reorder)) report(`BidiTest.txt:${lineNo + 1} dir=${direction}`, `${input.trim()} → levels ${r.levels.join(' ')} order ${r.order.join(' ')}; expected ${levels.join(' ')} / ${reorder.join(' ')}`)
      }
    }
  })
}

// BidiCharacterTest.txt: code points ; direction ; paragraph level ; levels ; order.
let characterCases = 0
{
  const lines = fs.readFileSync(path.join(dir, 'BidiCharacterTest.txt'), 'utf8').split('\n')
  lines.forEach((line, lineNo) => {
    if (!line || line.startsWith('#')) return
    const f = line.split(';')
    const cps = f[0].trim().split(/\s+/).map((h) => parseInt(h, 16))
    const r = resolveCodePoints(cps, Number(f[1]), data)
    characterCases++
    const levels = f[3].trim().split(/\s+/)
    const order = f[4].trim() ? f[4].trim().split(/\s+/) : []
    if (r.paragraphLevel !== Number(f[2]) || !same(r.levels, levels) || !same(r.order, order)) report(`BidiCharacterTest.txt:${lineNo + 1}`, `${f[0]} dir=${f[1]} → P${r.paragraphLevel} levels ${r.levels.join(' ')} order ${r.order.join(' ')}; expected P${f[2]} ${f[3]} / ${f[4]}`)
  })
}

console.log(`UCD ${data.version}: BidiTest.txt ${classCases} cases, BidiCharacterTest.txt ${characterCases} cases, ${failures} failed`)
process.exit(failures ? 1 : 0)
