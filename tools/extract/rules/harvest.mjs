#!/usr/bin/env node
// Harvests the owner's earlier work into rule and fixture files.
//   node tools/extract/rules/harvest.mjs <path to a checkout of github.com/KareemQabil/hayzoui> [commit]
// The source files are parsed as text with the TypeScript parser and never executed. What is mechanical:
//   - src/knowledge/rules.ts        → data/rules/<ID>.json (Arabic fields verbatim; file paths and test ids dropped)
//   - src/knowledge/fixtures.ts     → amounts-harvested, phones-harvested (amount()/phone() calls, all fields),
//                                      formatting-harvested, search-harvested (id, requirement, rule, expected text)
//   - src/arabic/bidi-runs.test.ts  → mixed-text-runs-harvested (every expect() on a literal)
//   - src/atomic/data/table/table.test.ts → table-harvested (rows and every expect(ids(model(literal))).toEqual(literal))
// What is hand-written lives in harvest-overlay.mjs: English text, areas, checks, structured inputs of the
// irregular fixtures, and the transcribed property tests.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'
import { SOURCES, ownerSource, ref, writeData } from './lib/common.mjs'
import { FIXTURE_OVERLAY, PROPERTIES, REQUIREMENT_EN, RULE_OVERLAY } from './harvest-overlay.mjs'

const repo = process.argv[2]
if (!repo) {
  console.error('usage: harvest.mjs <hayzoui checkout> [commit]')
  process.exit(2)
}
const commit = process.argv[3] ?? execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const SCRIPT = 'tools/extract/rules/harvest.mjs'

// ---- a literal evaluator over the TypeScript AST (no code is run) -------------------------------------------
class NotLiteral extends Error {}
function literal(node, env = {}) {
  const K = ts.SyntaxKind
  switch (node.kind) {
    case K.StringLiteral:
    case K.NoSubstitutionTemplateLiteral:
      return node.text
    case K.NumericLiteral:
      return Number(node.text.replace(/_/g, ''))
    case K.TrueKeyword:
      return true
    case K.FalseKeyword:
      return false
    case K.NullKeyword:
      return null
    case K.PrefixUnaryExpression:
      if (node.operator === K.MinusToken) return -literal(node.operand, env)
      break
    case K.ParenthesizedExpression:
    case K.AsExpression:
    case K.NonNullExpression:
      return literal(node.expression, env)
    case K.ArrayLiteralExpression:
      return node.elements.map((e) => literal(e, env))
    case K.ObjectLiteralExpression: {
      const out = {}
      for (const p of node.properties) {
        if (p.kind !== K.PropertyAssignment) throw new NotLiteral()
        out[p.name.text] = literal(p.initializer, env)
      }
      return out
    }
    case K.NewExpression:
      if (node.expression.getText() === 'Set' && node.arguments?.length === 1) return literal(node.arguments[0], env)
      break
    case K.Identifier:
      if (node.text in env) return env[node.text]
      break
  }
  throw new NotLiteral(node.getText?.() ?? '')
}
const tryLiteral = (node, env) => {
  try {
    return { ok: true, value: literal(node, env) }
  } catch (e) {
    if (e instanceof NotLiteral) return { ok: false }
    throw e
  }
}
function parse(rel) {
  const text = fs.readFileSync(path.join(repo, rel), 'utf8')
  return ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true)
}
function topLevelConst(sf, name) {
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st)) continue
    for (const d of st.declarationList.declarations) if (d.name.getText() === name) return d.initializer
  }
  throw new Error(`${name} not found in ${sf.fileName}`)
}
const walk = (node, visit) => {
  visit(node)
  ts.forEachChild(node, (child) => walk(child, visit))
}
const callName = (node) => (ts.isCallExpression(node) ? node.expression.getText() : null)

// ---- rules -----------------------------------------------------------------------------------------------
const REFERENCE_BY_RESOURCE = {
  'res-uax9': ref('uax9'),
  'res-m2-bidi': ref('materialBidi'),
  'res-apg': { name: 'WAI-ARIA Authoring Practices Guide: Dialog (Modal) pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/' },
  'res-google-arabic-type': ref('googleArabicType'),
}
const RELATED = {
  'R-NUM-001': ['R-NUM-004'], 'R-NUM-002': ['R-NUM-001'], 'R-NUM-003': ['R-NUM-002'], 'R-NUM-004': ['R-NUM-001', 'R-BIDI-003'], 'R-NUM-005': ['R-NUM-003'],
  'R-BIDI-001': ['R-BIDI-003'], 'R-BIDI-003': ['R-BIDI-001', 'R-NUM-004'], 'R-SRCH-001': ['R-SRCH-002'], 'R-SRCH-002': ['R-SRCH-001'],
  'R-CNT-001': ['R-FLOW-001'], 'R-FLOW-001': ['R-A11Y-002'], 'R-A11Y-002': ['R-FLOW-001'],
}
{
  const sf = parse('src/knowledge/rules.ts')
  const own = literal(topLevelConst(sf, 'own'))
  const rules = literal(topLevelConst(sf, 'RULES'), { own })
  for (const rule of rules) {
    const o = RULE_OVERLAY[rule.id]
    if (!o) throw new Error(`no overlay for ${rule.id}`)
    const reference = rule.source.resourceId ? REFERENCE_BY_RESOURCE[rule.source.resourceId] : null
    if (rule.source.resourceId && !reference) throw new Error(`unknown resource ${rule.source.resourceId}`)
    writeData(`data/rules/${rule.id}.json`, {
      kind: 'rule',
      schemaVersion: 1,
      id: rule.id,
      provenance: {
        method: 'extracted',
        confidence: 'verified',
        sources: [ownerSource(commit, 'src/knowledge/rules.ts')],
        script: SCRIPT,
        notes: `Arabic title, problem, rationale, statement (the owner's "recommendation"), context and exceptions are copied verbatim from the owner's file, where the rule's review state is "${rule.review}". The English text, area, severity and checks come from tools/extract/rules/harvest-overlay.mjs: the English is a translation and the checks restate the owner's own tests; both need the owner's glance.${rule.source.resourceId ? ` Owner's source note: ${rule.source.label}.` : ''}`,
      },
      data: {
        id: rule.id,
        title: { ar: rule.title, en: o.en.title },
        statement: { ar: rule.recommendation, en: o.en.statement },
        rationale: { ar: rule.rationale, en: o.en.rationale },
        area: o.area,
        severity: o.severity,
        appliesTo: o.appliesTo,
        checks: o.checks,
        ...(RELATED[rule.id] ? { related: RELATED[rule.id] } : {}),
        problem: { ar: rule.problem, en: o.en.problem },
        context: { ar: rule.context, en: o.en.context },
        exceptions: { ar: rule.exceptions, en: o.en.exceptions },
        origin: 'harvested',
        status: rule.review,
        ...(reference ? { references: [reference] } : {}),
        ...(o.fixtures ? { fixtures: o.fixtures } : {}),
      },
    })
  }
  console.log(`rules: ${rules.length} harvested`)
}

// ---- fixture sets ----------------------------------------------------------------------------------------
function fixtureSet(id, files, data, notes, method = 'extracted', confidence = 'verified') {
  writeData(`data/fixtures/${id}.json`, {
    kind: 'fixture',
    schemaVersion: 1,
    id,
    provenance: { method, confidence, sources: files.map((f) => ownerSource(commit, f)), script: SCRIPT, notes },
    data,
  })
  console.log(`fixtures: ${id} — ${data.cases.length} cases`)
}

{
  const sf = parse('src/knowledge/fixtures.ts')
  const elements = topLevelConst(sf, 'FIXTURES').elements
  const sets = { amounts: [], phones: [], formatting: [], search: [] }
  for (const el of elements) {
    if (callName(el) === 'amount') {
      const [id, requirement, rule, input, expected, currency = 'EGP'] = el.arguments.map((a) => literal(a))
      const exp = expected.status === 'valid' ? { status: 'valid', canonical: expected.canonical } : expected.status === 'empty' ? { status: 'empty', minor: null } : { status: 'invalid', error: expected.code, ...(expected.suggestion ? { suggestions: [expected.suggestion] } : {}) }
      sets.amounts.push({ id, input: { text: input, currency, allowNegative: false }, expected: exp, tags: [expected.status, currency], note: `${REQUIREMENT_EN[id]} — ${requirement}`, origin: `hayzoui@${commit.slice(0, 7)} src/knowledge/fixtures.ts ${id}`, rules: [rule] })
    } else if (callName(el) === 'phone') {
      const [id, requirement, input, expected] = el.arguments.map((a) => literal(a))
      const rejected = /^مرفوض · (.+)$/.exec(expected)
      sets.phones.push({ id, input: { text: input, region: 'EG' }, expected: rejected ? { status: 'invalid', error: rejected[1] } : { status: 'valid', e164: expected }, tags: [rejected ? 'invalid' : 'valid', 'EG'], note: `${REQUIREMENT_EN[id]} — ${requirement}`, origin: `hayzoui@${commit.slice(0, 7)} src/knowledge/fixtures.ts ${id}`, rules: ['R-NUM-001'] })
    } else {
      const fields = {}
      for (const p of el.properties) {
        const v = ts.isPropertyAssignment(p) ? tryLiteral(p.initializer) : { ok: false }
        if (v.ok) fields[p.name.text] = v.value
      }
      const o = FIXTURE_OVERLAY[fields.id]
      if (!o) throw new Error(`no overlay for fixture ${fields.id}`)
      const expected = 'text' in o.expected ? { ...o.expected, text: fields.expected } : o.expected
      if ('text' in o.expected && o.expected.text !== fields.expected) throw new Error(`${fields.id}: overlay text differs from the source`)
      sets[o.set.replace('-harvested', '')].push({ id: fields.id, input: o.input, expected, tags: [fields.area, 'structured-by-hand'], note: `${REQUIREMENT_EN[fields.id]} — ${fields.requirement}. Source label: input «${fields.input}», expected «${fields.expected}».`, origin: `hayzoui@${commit.slice(0, 7)} src/knowledge/fixtures.ts ${fields.id}`, rules: [fields.rule] })
    }
  }
  const src = ['src/knowledge/fixtures.ts']
  fixtureSet('amounts-harvested', [...src, 'src/arabic/amount.ts', 'CONTRACTS.md'], {
    purpose: 'The owner\'s amount-parsing cases under the contract arabic.amount.v1: which typed strings are a valid amount, which are rejected and with which error code. Baseline for the L1 money parser.',
    appliesTo: ['money-parse', 'currency-input'],
    cases: sets.amounts,
    inputShape: '{ text, currency (ISO 4217), allowNegative }',
    expectedShape: 'valid: { status, canonical } where canonical is the decimal string with the currency\'s fraction digits; empty: { status, minor: null }; invalid: { status, error, suggestions? } with the error codes of arabic.amount.v1 (invalid-character, ambiguous-comma, multiple-decimal, invalid-grouping, negative-not-allowed, sign-position, too-many-fraction-digits, too-large, no-digits, below-min, above-max).',
    rules: ['R-NUM-001', 'R-NUM-002', 'R-NUM-003', 'R-NUM-005', 'R-BIDI-001'],
  }, 'Every field is copied by script from amount(...) calls; the English half of each note is from harvest-overlay.mjs.')
  fixtureSet('phones-harvested', [...src, 'src/arabic/phone.ts'], {
    purpose: 'The owner\'s Egyptian mobile-number cases under arabic.phone.eg.v1: typed input to E.164 or a rejection code. Baseline for the L1 phone parser; the phone layer owns the numbering plans.',
    appliesTo: ['phone-parse', 'phone-input'],
    cases: sets.phones,
    inputShape: '{ text, region }',
    expectedShape: 'valid: { status, e164 }; invalid: { status, error } with error in invalid-character, too-short, too-long, invalid-prefix. Only Egyptian mobile prefixes 010, 011, 012, 015 are valid under this contract.',
    rules: ['R-NUM-001'],
  }, 'Every field is copied by script from phone(...) calls.')
  fixtureSet('formatting-harvested', [...src, 'src/arabic/amount.ts', 'src/arabic/phone.ts', 'CONTRACTS.md'], {
    purpose: 'The owner\'s display-format cases: an amount or phone number to the exact string shown, including which space character joins digit groups (U+202F in amounts, U+00A0 in phones) so the groups keep their order under the bidi algorithm.',
    appliesTo: ['money-format', 'phone-format'],
    cases: sets.formatting,
    inputShape: '{ operation, minor | e164, currency?, numerals }',
    expectedShape: '{ text } exact string (code points matter: U+00A0 and U+202F are written as escapes), optionally mustNotContain.',
    rules: ['R-NUM-004', 'R-BIDI-003'],
  }, 'id, requirement, rule and the expected string are copied by script; the structured input is transcribed by hand from the body of each run() (harvest-overlay.mjs).')
  fixtureSet('search-harvested', [...src, 'src/arabic/search.ts', 'CONTRACTS.md'], {
    purpose: 'The owner\'s search cases under arabic.search.v1: tolerant and strict text matching with highlight ranges on the original string, digit matching for phones, and the similar-name warning.',
    appliesTo: ['search-match', 'search-field', 'combobox', 'table'],
    cases: sets.search,
    inputShape: '{ operation: matchText | matchDigits | similarNames, … }',
    expectedShape: 'matchText: { match, rangesUtf16? } with [start, end) UTF-16 offsets in the target; matchDigits: { match: boolean per query }; similarNames: { similar: names reported }.',
    rules: ['R-SRCH-001', 'R-SRCH-002'],
    shared: {
      tolerance: {
        default: { hamza: true, alefMaqsura: false, taaMarbuta: false, ignoreSpaces: false },
        strict: { hamza: false, alefMaqsura: false, taaMarbuta: false, ignoreSpaces: false },
        duplicateCheck: { hamza: true, alefMaqsura: true, taaMarbuta: true, ignoreSpaces: true },
        always: 'case-folding, digits to ASCII, removal of U+064B–U+065F, U+0670 and U+0640, whitespace runs collapsed',
      },
    },
  }, 'id, requirement and rule are copied by script; structured input and expected values are transcribed by hand from the body of each run() (harvest-overlay.mjs). The tolerance table is transcribed from src/arabic/search.ts.')
}

// bidi-runs.test.ts: "dominant script, isolated islands".
{
  const sf = parse('src/arabic/bidi-runs.test.ts')
  const cases = []
  const structuredRuns = (notation) => {
    const runs = []
    const re = /\[(ltr|rtl):([^\]]*)\]|([^[]+)/g
    let m
    while ((m = re.exec(notation))) runs.push(m[1] ? { text: m[2], isolate: m[1] } : { text: m[3], isolate: null })
    return runs
  }
  walk(sf, (node) => {
    if (callName(node) !== 'test') return
    const title = literal(node.arguments[0])
    const testId = title.split(' ')[0]
    let n = 0
    walk(node.arguments[1], (inner) => {
      if (!ts.isCallExpression(inner) || !ts.isPropertyAccessExpression(inner.expression)) return
      const matcher = inner.expression.name.text
      const subject = inner.expression.expression
      if ((matcher !== 'toEqual' && matcher !== 'toBe' && matcher !== 'toBeNull') || callName(subject) !== 'expect') return
      const actual = subject.arguments[0]
      const fn = callName(actual)
      if (!['shape', 'dominantDir', 'scriptRuns'].includes(fn)) return
      const text = tryLiteral(actual.arguments[0])
      const want = matcher === 'toBeNull' ? { ok: true, value: null } : tryLiteral(inner.arguments[0])
      if (!text.ok || !want.ok) return
      const expected = fn === 'dominantDir' ? { dir: want.value } : fn === 'shape' ? { dir: want.value.dir, runs: structuredRuns(want.value.runs) } : want.value
      cases.push({ id: `${testId}${String.fromCharCode(97 + n++)}`, input: { text: text.value }, expected, tags: [fn === 'dominantDir' ? 'direction-only' : 'runs', expected.dir ?? 'no-direction'], note: title.slice(testId.length + 1), origin: `hayzoui@${commit.slice(0, 7)} src/arabic/bidi-runs.test.ts ${testId}`, rules: ['R-BIDI-001'] })
    })
  })
  fixtureSet('mixed-text-runs-harvested', ['src/arabic/bidi-runs.test.ts', 'CONTRACTS.md'], {
    purpose: 'The owner\'s decision for free text of unknown script (names, company names): the line direction is the script of the majority of words, and every run of the other script is one isolated island. Each case gives the direction and the runs to wrap.',
    appliesTo: ['text-direction', 'auto-text'],
    cases,
    inputShape: '{ text }',
    expectedShape: '{ dir: "rtl" | "ltr" | null, runs?: [{ text, isolate: "ltr" | "rtl" | null }] } — runs concatenate to the input; isolate names the direction of the <bdi> to wrap the run in. dir null means no strong letters: keep the surrounding direction.',
    rules: ['R-BIDI-001'],
  }, 'Every expect() on a literal in BD-01…BD-08 is copied by script; the bracket notation of the test helper is converted to structured runs. Case ids are the test id plus a letter.')
}

// table.test.ts: Arabic filtering, sorting and digit search on five rows.
{
  const sf = parse('src/atomic/data/table/table.test.ts')
  const rows = literal(topLevelConst(sf, 'C'))
  const cases = []
  walk(sf, (node) => {
    if (callName(node) !== 'test') return
    const title = literal(node.arguments[0])
    const testId = title.split(' ')[0]
    let n = 0
    walk(node.arguments[1], (inner) => {
      if (!ts.isCallExpression(inner) || !ts.isPropertyAccessExpression(inner.expression) || inner.expression.name.text !== 'toEqual') return
      const subject = inner.expression.expression
      if (callName(subject) !== 'expect') return
      let actual = subject.arguments[0]
      let anyOrder = false
      if (ts.isCallExpression(actual) && ts.isPropertyAccessExpression(actual.expression) && actual.expression.name.text === 'sort' && actual.arguments.length === 0) {
        anyOrder = true
        actual = actual.expression.expression
      }
      if (callName(actual) !== 'ids' || callName(actual.arguments[0]) !== 'model' || actual.arguments[0].arguments.length !== 1) return
      const state = tryLiteral(actual.arguments[0].arguments[0])
      const want = tryLiteral(inner.arguments[0])
      if (!state.ok || !want.ok) return
      const kind = state.value.filters ? 'filter' : state.value.sort ? 'sort' : state.value.page ? 'page' : 'other'
      cases.push({ id: `${testId}${String.fromCharCode(97 + n++)}`, input: { state: state.value, locale: 'ar-EG' }, expected: { rowIds: want.value, ...(anyOrder ? { order: 'any' } : {}) }, tags: [kind], note: title.slice(testId.length + 1), origin: `hayzoui@${commit.slice(0, 7)} src/atomic/data/table/table.test.ts ${testId}` })
    })
  })
  fixtureSet('table-harvested', ['src/atomic/data/table/table.test.ts'], {
    purpose: 'The owner\'s table-model cases on five customer rows with Arabic, vocalised, mixed and Latin names: hamza- and diacritic-tolerant text filters, phone search by digits in any numeral system, numeric ranges and numeric sorting of values written in Arabic-Indic digits, empty values last, page clamping.',
    appliesTo: ['table-model', 'search-match'],
    cases,
    inputShape: '{ state: partial table state (filters, sort, page) applied to shared.rows, locale }',
    expectedShape: '{ rowIds: ids of the visible rows in order; order: "any" when the source compared a sorted copy }',
    rules: ['R-SRCH-001', 'R-NUM-001'],
    shared: { rows, columns: { id: 'text', name: 'text', phone: 'text', region: 'text', balance: 'money, integer minor units', since: 'date, ISO 8601', active: 'boolean', qty: 'number, may be written in Arabic-Indic digits, may be null' }, note: 'By default the text filter tolerates hamza and diacritics but not taa marbuta/haa: «الاسكندريه» does not find «الإسكندرية».' },
  }, 'Rows and every expect(ids(model(<literal>))).toEqual(<literal>) are copied by script. Tests whose expectation is computed (TE-06 collation, TE-08 first row, trees, groups, widths) are not harvested.')
}

// Seeded properties, transcribed.
fixtureSet('properties-harvested', [...new Set(PROPERTIES.map((p) => p.file))], {
  purpose: 'Invariants the owner checked with seeded random inputs. Each case states the invariant and its generator so the L1 suites can re-create it; there is no single input.',
  appliesTo: ['money-parse', 'money-format', 'phone-format', 'search-match', 'text-direction', 'table-model', 'messages'],
  cases: PROPERTIES.map((p) => ({ id: p.id, input: { invariant: p.invariant, cases: p.cases, ...(p.seed ? { seed: p.seed, generator: 'mulberry32' } : {}) }, expected: { holds: true }, tags: ['property', 'transcribed-by-hand'], origin: `hayzoui@${commit.slice(0, 7)} ${p.file} ${p.id}`, rules: p.rules })),
  inputShape: '{ invariant (prose), cases, seed?, generator? }',
  expectedShape: '{ holds: true }',
}, 'Transcribed by hand from the test bodies (harvest-overlay.mjs); the script only wraps them: the prose is the researcher\'s reading of the tests.', 'researched', 'needs-review')

void SOURCES
