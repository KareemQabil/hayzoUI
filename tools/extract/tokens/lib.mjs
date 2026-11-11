// Shared helpers for the token-reference extractors. Everything here reads upstream files as TEXT:
// CSS and SCSS by a small tokenizer, JS/TS by the TypeScript parser (AST only, nothing is evaluated or imported).
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { PACKAGES, RETRIEVED_AT, pkgDir } from './sources.mjs'

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const require = createRequire(path.join(REPO, 'package.json'))
export const ts = require('typescript')

export function scratch() {
  const root = process.argv[2]
  if (!root) {
    console.error(`usage: ${path.basename(process.argv[1])} <scratch-dir>   (run fetch.mjs first)`)
    process.exit(2)
  }
  return root
}

/** Reader bound to one package; remembers which files were read so provenance can list them. */
export function pkg(root, name) {
  const dir = pkgDir(root, name)
  const used = new Set()
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  return {
    name,
    dir,
    version: meta.version,
    license: typeof meta.license === 'string' ? meta.license : String(meta.license?.type),
    used,
    read(rel) {
      used.add(rel)
      return fs.readFileSync(path.join(dir, rel), 'utf8')
    },
    exists: (rel) => fs.existsSync(path.join(dir, rel)),
    ls: (rel) => fs.readdirSync(path.join(dir, rel)).sort(),
  }
}

export const round = (n, d = 4) => Math.round(n * 10 ** d) / 10 ** d

/** px for a CSS length ("12px", "0.75rem", 12). rem at `base` px. Returns undefined for anything else. */
export function px(v, base = 16) {
  if (typeof v === 'number') return v
  const m = /^\s*(-?\d*\.?\d+)(px|rem)?\s*$/.exec(String(v))
  if (!m) return undefined
  if (m[2] === 'rem') return round(parseFloat(m[1]) * base)
  if (m[2] === 'px') return parseFloat(m[1])
  return m[1] === '0' ? 0 : undefined
}
export function ms(v) {
  if (typeof v === 'number') return v
  const m = /^\s*(-?\d*\.?\d+)(ms|s)\s*$/.exec(String(v))
  return m ? round(parseFloat(m[1]) * (m[2] === 's' ? 1000 : 1)) : undefined
}
/** Token entry; drops undefined fields. */
export function tok(name, value, extra = {}) {
  const t = { name, value, ...extra }
  for (const k of Object.keys(t)) if (t[k] === undefined) delete t[k]
  return t
}
export const tokPx = (name, value, extra = {}) => tok(name, value, { px: px(value), ...extra })
export const tokMs = (name, value, extra = {}) => tok(name, value, { ms: ms(value), ...extra })
export const clean = (o) => {
  for (const k of Object.keys(o)) if (o[k] === undefined || Number.isNaN(o[k])) delete o[k]
  return o
}

// ---------- CSS ----------
/** Flat list of rules: { sel, at: [...enclosing at-rules and parent selectors], decls: [[prop, value]] }. Handles nesting. */
export function cssRules(text) {
  text = text.replace(/\/\*[\s\S]*?\*\//g, '')
  const out = []
  const stack = [{ sel: '', at: [], decls: [] }]
  let buf = ''
  let depthParen = 0
  let quote = null
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      buf += c
      if (c === quote && text[i - 1] !== '\\') quote = null
      continue
    }
    if (c === '"' || c === "'") {
      quote = c
      buf += c
    } else if (c === '(') {
      depthParen++
      buf += c
    } else if (c === ')') {
      depthParen--
      buf += c
    } else if (depthParen > 0) buf += c
    else if (c === '{') {
      const parent = stack[stack.length - 1]
      const rule = { sel: buf.trim().replace(/\s+/g, ' '), at: parent.sel ? [...parent.at, parent.sel] : [...parent.at], decls: [] }
      stack.push(rule)
      out.push(rule)
      buf = ''
    } else if (c === '}') {
      decl(stack[stack.length - 1], buf)
      buf = ''
      if (stack.length > 1) stack.pop()
    } else if (c === ';') {
      decl(stack[stack.length - 1], buf)
      buf = ''
    } else buf += c
  }
  return out.filter((r) => r.decls.length)
  function decl(rule, s) {
    const i = s.indexOf(':')
    if (i < 0) return
    const prop = s.slice(0, i).trim()
    const value = s.slice(i + 1).trim().replace(/\s+/g, ' ')
    if (prop && !/[{}\s]/.test(prop)) rule.decls.push([prop, value])
  }
}
/** All custom properties: [{ name (without --), value, sel, at }] */
export function cssVars(text) {
  const out = []
  for (const r of cssRules(text)) for (const [p, v] of r.decls) if (p.startsWith('--')) out.push({ name: p.slice(2), value: v, sel: r.sel, at: r.at })
  return out
}
/** First value of a declaration in the first rule whose selector matches. */
export function decl(rules, selRe, prop) {
  for (const r of rules) if (selRe.test(r.sel)) for (const [p, v] of r.decls) if (p === prop) return v
  return undefined
}

// ---------- JS / TS (AST only) ----------
export function parseJs(text, file = 'x.ts') {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
}
/** Static value of a literal expression. Anything not literal becomes { $expr: sourceText }. `env` resolves identifiers. */
export function lit(node, env = {}) {
  if (!node) return undefined
  const K = ts.SyntaxKind
  while (node.kind === K.ParenthesizedExpression || node.kind === K.AsExpression || node.kind === K.SatisfiesExpression) node = node.expression
  if (ts.isStringLiteralLike(node)) return node.text
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (node.kind === K.TrueKeyword) return true
  if (node.kind === K.FalseKeyword) return false
  if (node.kind === K.NullKeyword) return null
  if (ts.isPrefixUnaryExpression(node) && node.operator === K.MinusToken) {
    const v = lit(node.operand, env)
    return typeof v === 'number' ? -v : { $expr: node.getText() }
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((e) => lit(e, env))
  if (ts.isObjectLiteralExpression(node)) {
    const o = {}
    for (const p of node.properties) {
      if (ts.isPropertyAssignment(p)) o[propName(p.name)] = lit(p.initializer, env)
      else if (ts.isShorthandPropertyAssignment(p)) o[p.name.text] = p.name.text in env ? env[p.name.text] : { $expr: p.name.text }
      else if (ts.isSpreadAssignment(p)) {
        const v = lit(p.expression, env)
        if (v && typeof v === 'object' && !('$expr' in v)) Object.assign(o, v)
        else o[`...${p.expression.getText()}`] = { $expr: p.expression.getText() }
      }
    }
    return o
  }
  if (ts.isIdentifier(node) && node.text in env) return env[node.text]
  if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  }
  return { $expr: node.getText().replace(/\s+/g, ' ') }
}
const propName = (n) => (ts.isIdentifier(n) || ts.isStringLiteralLike(n) || ts.isNumericLiteral(n) ? n.text : n.getText())
/** Map of every top-level (or nested) `const|let|var name = <initializer>` node in a source file. */
export function decls(sf) {
  const map = new Map()
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && !map.has(n.name.text)) map.set(n.name.text, n.initializer)
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return map
}
/** Static value of the variable `name` in JS/TS text. */
export function jsConst(text, name, env = {}) {
  const d = decls(parseJs(text))
  if (!d.has(name)) throw new Error(`const ${name} not found`)
  return lit(d.get(name), env)
}
export const isExpr = (v) => v && typeof v === 'object' && '$expr' in v
/** Fails loudly when a formula the extractor mirrors is no longer in the upstream source. */
export function assertSource(text, snippets, label) {
  const flat = text.replace(/\s+/g, ' ')
  for (const s of [].concat(snippets)) if (!flat.includes(s.replace(/\s+/g, ' '))) throw new Error(`${label}: upstream source no longer contains "${s}" — re-check the mirrored formula`)
}

// ---------- SCSS (Material token maps) ----------
/** 'key': if($exclude-hardcoded-values, null, VALUE)  |  'key': map.get($deps, 'group', 'token')  → { key: {value} | {alias} } */
export function mdScssMap(text) {
  const out = {}
  const re = /'([a-z0-9-]+)':\s*/g
  let m
  while ((m = re.exec(text))) {
    const rest = text.slice(re.lastIndex)
    let x
    if ((x = /^if\(\s*\$exclude-hardcoded-values,\s*null,\s*/.exec(rest))) {
      let depth = 1
      let i = x[0].length
      const start = i
      for (; i < rest.length && depth > 0; i++) {
        if (rest[i] === '(') depth++
        else if (rest[i] === ')') depth--
      }
      const v = rest.slice(start, i - 1).trim().replace(/\s+/g, ' ')
      if (!v.includes('/**') && !v.includes('map.get')) out[m[1]] = { value: v.replace(/^\((.*)\)$/, '$1') }
    } else if ((x = /^map\.get\(\s*\$deps,\s*'([a-z0-9-]+)',\s*'([a-z0-9-]+)'\s*\)/.exec(rest))) out[m[1]] = { alias: `${x[1]}.${x[2]}` }
  }
  return out
}

// ---------- direction / language / script scan ----------
const TEXT_EXT = /\.(css|scss|sass|less|js|mjs|cjs|ts|tsx|mts|json|json5|yml|yaml|md)$/
export const I18N_PATTERNS = [
  { id: 'arabic', regex: 'arabic|\\bfarsi\\b|persian|\\burdu\\b|naskh|kufi' },
  { id: 'arabic-script-chars', regex: '[\\u0600-\\u06FF]' },
  { id: 'locale-ar', regex: "['\"\\[=(:_\\-/]ar(?:[-_][A-Za-z]{2})?['\"\\])]|lang\\(ar\\b|\\bar[-_](?:SA|EG|AE)\\b" },
  { id: 'rtl', regex: 'rtl\\b|\\brtl[A-Z_-]|right-to-left|\\bis_?rtl' },
  { id: 'dir-selector', regex: ':dir\\(|\\[dir[=\\]~|]|\\bdir=|:host-context\\(\\[dir' },
  { id: 'bidi', regex: 'bidi|unicode-bidi|\\bbdi\\b|plaintext|\\u200f|\\u200e|\\\\u200[ef]|\\\\u202[a-e]|\\\\u206[6-9]' },
  { id: 'lang-selector', regex: ':lang\\(|\\[lang[=\\]~|^]' },
  { id: 'other-scripts', regex: '\\bcjk\\b|\\bhan[st]?\\b|hebrew|devanagari|\\bthai\\b|japanese|korean|chinese|hangul|kana\\b' },
  { id: 'logical-properties', regex: '(?:margin|padding|border|inset)-(?:inline|block)|inline-size|block-size|InlineStart|InlineEnd|paddingInline|marginInline' },
]
/** Scans package directories; `only` (regex on relative path) narrows to token sources, `skip` drops paths. */
export function scanI18n(targets) {
  const patterns = I18N_PATTERNS.map((p) => ({ ...p, re: new RegExp(p.regex, 'i'), hits: 0, byFile: new Map(), samples: [] }))
  const scanned = []
  for (const { p, only, skip } of targets) {
    let n = 0
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
        const full = path.join(dir, e.name)
        const rel = path.relative(p.dir, full)
        if (e.isDirectory()) {
          if (e.name !== 'node_modules') walk(full)
          continue
        }
        if (!TEXT_EXT.test(e.name) || /\.map$|\.min\.js$|CHANGELOG/i.test(e.name)) continue
        if (only && !only.test(rel)) continue
        if (skip && skip.test(rel)) continue
        if (fs.statSync(full).size > 3_000_000) continue
        n++
        const lines = fs.readFileSync(full, 'utf8').split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          for (const pt of patterns) {
            const m = pt.re.exec(line)
            if (!m) continue
            pt.hits++
            const key = `${p.name}:${rel}`
            pt.byFile.set(key, (pt.byFile.get(key) ?? 0) + 1)
            if (pt.samples.length < 4 && !pt.samples.some((s) => s.file === key)) {
              const at = Math.max(0, m.index - 50)
              // Arabic-script matches are counted, never copied: upstream locale strings are not ours to redistribute.
              pt.samples.push({ file: key, line: i + 1, text: pt.id === 'arabic-script-chars' ? '(Arabic-script text; counted, not copied)' : line.slice(at, at + 140).trim() })
            }
          }
        }
      }
    }
    walk(p.dir)
    scanned.push({ package: `${p.name}@${p.version}${only ? ` (${only.source})` : ''}`, files: n })
  }
  return {
    scanned,
    patterns: patterns.map((pt) => ({
      id: pt.id,
      regex: pt.regex,
      hits: pt.hits,
      files: pt.byFile.size,
      topFiles: [...pt.byFile].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 5).map(([file, hits]) => ({ file, hits })),
      samples: pt.samples,
    })),
  }
}

// ---------- output ----------
export function writeRef({ id, system, pkgs, extraSources = [], scales, notes, gaps, script, provenanceNotes }) {
  const sources = [
    ...pkgs.map((p) => ({
      name: p.name,
      url: `https://www.npmjs.com/package/${p.name}/v/${p.version}`,
      version: p.version,
      license: p.licenseOverride ?? p.license,
      retrievedAt: RETRIEVED_AT,
      ...(p.used.size ? { path: [...p.used].sort().join(', ').slice(0, 900) } : {}),
    })),
    ...extraSources,
  ]
  const doc = {
    kind: 'token-reference',
    schemaVersion: 1,
    id,
    provenance: clean({ method: 'extracted', confidence: 'verified', sources, script: `tools/extract/tokens/${script}`, notes: provenanceNotes }),
    data: clean({ system, scales, notes, gaps }),
  }
  const file = path.join(REPO, 'data/tokens/reference', `${id}.json`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n')
  const c = scales.controls?.sizes?.length ?? 0
  console.log(`wrote data/tokens/reference/${id}.json  (${c} control sizes, ${Object.keys(scales).length} scales)`)
}
export { PACKAGES, RETRIEVED_AT }
