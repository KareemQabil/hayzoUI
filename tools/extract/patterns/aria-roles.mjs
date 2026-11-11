#!/usr/bin/env node
// Mechanical extraction of role requirements from the WAI-ARIA 1.2 Recommendation.
//   node tools/extract/patterns/aria-roles.mjs <path to a saved copy of https://www.w3.org/TR/wai-aria-1.2/> [--out file]
// Per role: required states and properties, required owned elements, required context role, name-from, and whether
// children are presentational. Output is sorted by role name. The file is read as text; nothing in it is executed.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const outIndex = args.indexOf('--out')
const outFile = outIndex >= 0 ? path.resolve(args[outIndex + 1]) : path.join(HERE, 'aria-roles.json')
const src = args.find((a, i) => !a.startsWith('--') && (outIndex < 0 || i !== outIndex + 1))
if (!src) {
  console.error('usage: aria-roles.mjs <saved wai-aria-1.2 html> [--out file]')
  process.exit(2)
}
const html = fs.readFileSync(path.resolve(src), 'utf8')
const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
const cell = (section, cls) => {
  const m = new RegExp(`<td class="${cls}"[^>]*>([\\s\\S]*?)</td>`).exec(section)
  return m ? m[1] : ''
}
// A cell lists alternatives; inside an <li> (or the whole cell) several role references mean "A containing B".
const refs = (fragment) => {
  const items = fragment.includes('<li') ? fragment.split(/<li[^>]*>/).slice(1) : [fragment]
  return items
    .map((item) => [...item.matchAll(/class="(?:role|property|state)-reference"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => text(m[1])).join(' > '))
    .filter(Boolean)
}
const published = /<time class="dt-published" datetime="([^"]+)"/.exec(html)?.[1] ?? null
const roles = []
const parts = html.split(/<section class="role[^"]*" id="/).slice(1)
for (const part of parts) {
  const id = part.slice(0, part.indexOf('"'))
  const end = part.indexOf('</section>')
  const section = end > 0 ? part.slice(0, end) : part
  roles.push({
    role: id,
    abstract: /Is Abstract:<\/th>\s*<td[^>]*>\s*True/i.test(section),
    requiredStatesAndProperties: refs(cell(section, 'role-required-properties')),
    requiredOwnedElements: refs(cell(section, 'role-mustcontain')),
    requiredContextRole: refs(cell(section, 'role-scope')),
    nameFrom: text(cell(section, 'role-namefrom')).split(' ').filter((w) => /^(author|contents|prohibited)$/.test(w)),
    childrenPresentational: /^True/i.test(text(cell(section, 'role-childpresentational'))),
  })
}
roles.sort((a, b) => a.role.localeCompare(b.role))
const out = {
  source: { name: 'Accessible Rich Internet Applications (WAI-ARIA) 1.2', url: 'https://www.w3.org/TR/wai-aria-1.2/', published, license: 'W3C-20150513' },
  counts: { roles: roles.length },
  roles,
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n')
console.log(`${roles.length} roles (published ${published}) -> ${path.relative(process.cwd(), outFile)}`)
