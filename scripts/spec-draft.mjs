// Factory step 1: draft spec/components/<id>.json from the code and the knowledge record.
//   node scripts/spec-draft.mjs <id> [--force]
// Mechanical parts come from source: props (name, type, default, JSDoc) via the TypeScript compiler, and
// name/family/maturity/anatomy/rules/patterns from src/knowledge/components.ts. Judgment parts (purpose,
// keyboard, aria, invariants, contexts) are emitted as "TODO" and must be written by a person or an agent;
// the spec gate (SP-02) rejects any spec that still contains "TODO".
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const [id, ...flags] = process.argv.slice(2)
if (!id) throw new Error('usage: node scripts/spec-draft.mjs <id> [--force]')
const out = path.join('spec/components', `${id}.json`)
if (fs.existsSync(out) && !flags.includes('--force')) throw new Error(`${out} exists (use --force)`)

const vocab = JSON.parse(fs.readFileSync('spec/vocabulary.json', 'utf8'))
const knowledge = fs.readFileSync('src/knowledge/components.ts', 'utf8')
const recStart = knowledge.indexOf(`id: '${id}'`)
if (recStart < 0) throw new Error(`no knowledge record for ${id}`)
const rec = knowledge.slice(recStart, knowledge.indexOf('\n  },', recStart))
const str = (k) => rec.match(new RegExp(`${k}: '([^']*)'`))?.[1]
const arr = (k) => [...(rec.match(new RegExp(`${k}: \\[([^\\]]*)\\]`))?.[1] ?? '').matchAll(/'([^']*)'/g)].map((m) => m[1])

const nameEn = str('nameEn')
const file = str('implementation')?.split('·')[0].trim()
const iface = `${nameEn.split('/')[0].replace(/\s+/g, '')}Props`
const INTERNAL = new Set(['id', 'name', 'className', 'placeholder', 'forceState', 'onParse'])

function props() {
  if (!file || file === '—') return []
  const src = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  // Follow `export type DialogProps = OverlayProps` aliases to the interface that declares the members.
  const find = (name, depth = 0) => {
    let found
    src.forEachChild((n) => {
      if (ts.isInterfaceDeclaration(n) && n.name.text === name) found = n
      if (!found && ts.isTypeAliasDeclaration(n) && n.name.text === name && ts.isTypeReferenceNode(n.type) && depth < 3) found = find(n.type.typeName.getText(src), depth + 1)
    })
    return found
  }
  const node = find(iface)
  if (!node) throw new Error(`${iface} not found in ${file}`)
  // Defaults from the component's destructuring: `{ size = 'md', ... }`.
  const defaults = {}
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/\b([a-zA-Z]+)(?:: [a-zA-Z]+)? = ('[^']*'|true|false|null|\d+)(?=[,\s}])/g)) defaults[m[1]] ??= m[2]
  return node.members
    .filter(ts.isPropertySignature)
    .map((m) => {
      const name = m.name.getText(src)
      const doc = ts.getJSDocCommentsAndTags(m).map((d) => (typeof d.comment === 'string' ? d.comment : '')).join(' ').trim()
      const p = { name, type: m.type?.getText(src).replace(/\s+/g, ' ') ?? 'unknown', doc: doc || 'TODO' }
      if (!m.questionToken) p.required = true
      if (defaults[name] !== undefined) p.default = JSON.parse(defaults[name].replace(/^'(.*)'$/, '"$1"'))
      return p
    })
    .filter((p) => !INTERNAL.has(p.name))
}

const known = arr('states')
const states = known.filter((s) => vocab.states.includes(s))
const tones = known.filter((s) => vocab.tones.includes(s))
const spec = {
  $schema: '../schema/component.schema.json',
  id,
  name: str('name'),
  nameEn,
  family: str('family'),
  maturity: str('maturity'),
  purpose: str('summary') ?? 'TODO',
  anatomy: arr('anatomy').filter((a) => /^[a-z][a-z-]*$/.test(a)),
  props: props(),
  states: states.length ? states : ['default'],
  ...(tones.length ? { variants: [{ prop: 'tone', values: tones }] } : {}),
  content: ['short', 'long-arabic'],
  keyboard: [{ key: 'TODO', action: 'TODO' }],
  aria: { role: 'TODO', labelling: 'TODO' },
  locale: { numeralsInput: 'none', numeralsDisplay: 'provider', ltrIslands: [], mirroredIcons: [] },
  invariants: [{ id: 'todo', statement: 'TODO' }],
  contexts: { supported: ['rtl', 'ltr', 'react-19', 'chromium'], unsupported: [] },
  primitive: { source: 'own', relationship: str('relationship') ?? 'original' },
  rules: arr('rules'),
  patterns: arr('patterns'),
}
const dropped = known.filter((s) => !states.includes(s) && !tones.includes(s))
fs.writeFileSync(out, JSON.stringify(spec, null, 2) + '\n')
console.log(`${out}: ${spec.props.length} props, states ${spec.states.join(',')}${tones.length ? `, tones ${tones.join(',')}` : ''}${dropped.length ? ` — not in vocabulary, review: ${dropped.join(', ')}` : ''}`)
