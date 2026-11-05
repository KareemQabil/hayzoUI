/**
 * Spec gate (L0). Every spec in spec/components must:
 *  - pass the JSON Schema,
 *  - use only the closed vocabularies (states, content variants, contracts),
 *  - follow the prop naming contract (CONTRACTS.md §Props),
 *  - reference rules, patterns, a knowledge record and test ids that exist,
 *  - match the implementation's public props in both directions (spec ↔ code drift).
 */
import fs from 'node:fs'
import path from 'node:path'
import Ajv from 'ajv'
import { describe, expect, test } from 'vitest'
import { COMPONENTS, FIXTURES, PATTERNS, RULES } from '../knowledge'
import { BROWSER_CHECKS } from '../knowledge/evidence'
import schema from '../../spec/schema/component.schema.json'
import vocabulary from '../../spec/vocabulary.json'

const SPEC_DIR = path.resolve(__dirname, '../../spec/components')
const specs = fs
  .readdirSync(SPEC_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ file: f, spec: JSON.parse(fs.readFileSync(path.join(SPEC_DIR, f), 'utf8')) }))

// Test ids that exist anywhere: fixtures, browser checks, and ids at the start of test names in *.test.ts.
function knownTestIds(): Set<string> {
  const ids = new Set<string>([...FIXTURES.map((f) => f.id), ...BROWSER_CHECKS.map((b) => b.id)])
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
  for (const f of walk(path.resolve(__dirname, '..')).filter((f) => /\.test\.tsx?$/.test(f))) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/test\(['`]([A-Z]+-[A-Z0-9]+)\s/g)) ids.add(m[1])
  }
  return ids
}

/** Public prop names of `export interface <Name>Props { … }` in a component file (top-level members only). */
function codeProps(file: string, nameEn: string): string[] {
  const src = fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8')
  let iface = `${nameEn.split('/')[0].replace(/\s+/g, '')}Props`
  // Follow `export type DialogProps = OverlayProps` to the interface that declares the members.
  const alias = src.match(new RegExp(`export type ${iface} = ([A-Za-z]+)\\b`))
  if (alias) iface = alias[1]
  const start = src.indexOf(`export interface ${iface}`)
  if (start < 0) throw new Error(`${iface} not found in ${file}`)
  const body = src.slice(src.indexOf('{', start) + 1, src.indexOf('\n}', start))
  return [...body.matchAll(/^ {2}([a-zA-Z]+)\??:/gm)].map((m) => m[1])
}

// Props that exist in code but are not part of the public contract.
const INTERNAL_PROPS = new Set(['id', 'name', 'className', 'placeholder', 'forceState', 'onParse', 'presentation'])

const ajv = new Ajv({ allErrors: true, strict: false })
const validate = ajv.compile(schema)
const testIds = knownTestIds()

describe('spec gate', () => {
  test('SP-01 at least one spec exists', () => expect(specs.length).toBeGreaterThan(0))

  for (const { file, spec } of specs) {
    describe(file, () => {
      test(`SP-02 ${spec.id} passes the schema`, () => {
        const ok = validate(spec)
        expect(ok, ajv.errorsText(validate.errors, { separator: '\n' })).toBe(true)
        expect(file).toBe(`${spec.id}.json`)
        // Drafts from scripts/spec-draft.mjs mark judgment fields TODO; none may reach the gate unfilled.
        const todos = JSON.stringify(spec).match(/"[^"]*TODO[^"]*"/g) ?? []
        expect(todos, `unfilled: ${todos.slice(0, 4).join(', ')}`).toEqual([])
      })

      test(`SP-03 ${spec.id} uses only closed vocabularies`, () => {
        for (const s of spec.states) expect(vocabulary.states, `state ${s}`).toContain(s)
        for (const c of spec.content) expect(vocabulary.content, `content ${c}`).toContain(c)
        for (const c of spec.contracts ?? []) expect(vocabulary.contracts, `contract ${c}`).toContain(c)
        const closed: Record<string, string[]> = { tone: vocabulary.tones, size: vocabulary.sizes, variant: vocabulary.variants }
        for (const v of spec.variants ?? []) for (const x of v.values) if (closed[v.prop]) expect(closed[v.prop], `${v.prop} ${x}`).toContain(x)
      })

      test(`SP-04 ${spec.id} follows the prop naming contract`, () => {
        const names = new Set<string>(spec.props.map((p: { name: string }) => p.name))
        for (const f of vocabulary.forbiddenProps) expect(names.has(f), `forbidden prop ${f}`).toBe(false)
        if (names.has('value')) {
          expect(names.has('onValueChange'), 'value needs onValueChange').toBe(true)
          expect(names.has('defaultValue'), 'value needs defaultValue').toBe(true)
        }
        if (names.has('open')) expect(names.has('onOpenChange'), 'open needs onOpenChange').toBe(true)
        for (const p of spec.props) if (/^is[A-Z]/.test(p.name)) throw new Error(`boolean props are plain adjectives, not ${p.name}`)
        // Empty is null: required when the component can be empty (an `empty` state) or holds text ('' is not empty).
        // Single-choice components that always hold a value (tabs, segmented control) have no empty state.
        const valueProp = spec.props.find((p: { name: string }) => p.name === 'value')
        if (valueProp && (spec.states.includes('empty') || /\bstring\b/.test(valueProp.type))) expect(valueProp.type, 'empty value is null').toMatch(/null/)
      })

      test(`SP-05 ${spec.id} references existing records and tests`, () => {
        const record = COMPONENTS.find((c) => c.id === spec.id)
        expect(record, 'knowledge record').toBeDefined()
        expect(spec.family).toBe(record!.family)
        for (const r of spec.rules) expect(RULES.map((x) => x.id), `rule ${r}`).toContain(r)
        for (const p of spec.patterns ?? []) expect(PATTERNS.map((x) => x.id), `pattern ${p}`).toContain(p)
        for (const inv of spec.invariants) for (const t of inv.tests ?? []) expect(testIds.has(t), `test ${t} (${inv.id})`).toBe(true)
      })

      test(`SP-06 ${spec.id} props match the implementation`, () => {
        const record = COMPONENTS.find((c) => c.id === spec.id)!
        const file = record.implementation.split('·')[0].trim()
        const code = codeProps(file, spec.nameEn ?? record.nameEn).filter((p) => !INTERNAL_PROPS.has(p))
        const specNames = spec.props.map((p: { name: string }) => p.name)
        expect([...specNames].sort(), 'spec props vs code props').toEqual([...code].sort())
      })
    })
  }
})
