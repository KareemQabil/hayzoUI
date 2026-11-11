#!/usr/bin/env node
// Mechanical skeleton of the WAI-ARIA Authoring Practices Guide pattern pages.
//   node tools/extract/patterns/apg-skeleton.mjs <path to a clone of w3c/aria-practices> [--out <file>]
// For every content/patterns/<dir>/*-pattern.html it records: the pattern title, the roles, states and properties
// the page references (class="role-reference" | "state-reference" | "property-reference"), and every list item or
// paragraph that names a key in <kbd>, with its heading context. No prose is copied: an item carries the key names,
// an "optional" flag, and a SHA-1 of its text so that upstream wording changes are detectable.
// Output is deterministic (sorted by directory, document order inside a page).
// The clone is read as files only; nothing in it is executed.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const outIndex = args.indexOf('--out')
const outFile = outIndex >= 0 ? path.resolve(args[outIndex + 1]) : path.join(HERE, 'apg-skeleton.json')
const src = args.find((a, i) => !a.startsWith('--') && (outIndex < 0 || i !== outIndex + 1))
if (!src) {
  console.error('usage: apg-skeleton.mjs <aria-practices clone> [--out file]')
  process.exit(2)
}
const patternsDir = path.join(path.resolve(src), 'content', 'patterns')

function readCommit(repo) {
  // Read .git without running git, so the clone stays inert.
  try {
    const head = fs.readFileSync(path.join(repo, '.git', 'HEAD'), 'utf8').trim()
    if (!head.startsWith('ref:')) return head
    const ref = head.slice(5).trim()
    const refFile = path.join(repo, '.git', ref)
    if (fs.existsSync(refFile)) return fs.readFileSync(refFile, 'utf8').trim()
    const packed = fs.readFileSync(path.join(repo, '.git', 'packed-refs'), 'utf8')
    const line = packed.split('\n').find((l) => l.endsWith(' ' + ref))
    return line ? line.split(' ')[0] : null
  } catch {
    return null
  }
}

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m])
const squash = (s) => decode(s).replace(/\s+/g, ' ').trim()

// "Shift + Down Arrow" -> "Shift+ArrowDown". Names follow KeyboardEvent.key, except the space bar, written "Space".
const KEY_NAMES = new Map(
  Object.entries({
    'down arrow': 'ArrowDown', 'up arrow': 'ArrowUp', 'left arrow': 'ArrowLeft', 'right arrow': 'ArrowRight',
    'page up': 'PageUp', 'page down': 'PageDown', 'pageup': 'PageUp', 'pagedown': 'PageDown',
    home: 'Home', end: 'End', enter: 'Enter', space: 'Space', spacebar: 'Space', tab: 'Tab', escape: 'Escape', esc: 'Escape',
    control: 'Control', ctrl: 'Control', shift: 'Shift', alt: 'Alt', option: 'Alt', command: 'Meta', meta: 'Meta',
    delete: 'Delete', backspace: 'Backspace', insert: 'Insert', '*': '*',
  }),
)
function normalizeKey(raw) {
  return raw
    .split('+')
    .map((part) => {
      const p = part.trim()
      const known = KEY_NAMES.get(p.toLowerCase())
      if (known) return known
      if (/^f\d{1,2}$/i.test(p)) return p.toUpperCase()
      if (/^[a-z]$/i.test(p)) return p.toUpperCase()
      return p
    })
    .join('+')
}

function parsePage(html) {
  const main = html.slice(html.indexOf('<main'), html.lastIndexOf('</main>'))
  const tokens = main.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) ?? []
  const headings = [] // [{level, text}]
  const sectionIds = []
  const refs = { roles: new Set(), states: new Set(), properties: new Set() }
  const items = []
  const liStack = []
  let title = null
  let heading = null
  let kbd = null
  let ref = null
  let paragraph = null

  const context = () => headings.filter((h) => h.level > 1).map((h) => h.text)
  const sink = () => liStack[liStack.length - 1] ?? paragraph
  const finish = (node, type) => {
    if (!node || node.keys.length === 0) return
    const text = squash(node.text)
    items.push({
      section: sectionIds.filter(Boolean).at(-1) ?? null,
      context: node.context,
      in: type,
      depth: node.depth,
      keys: node.keys.flatMap((k) => k.split(/\s+or\s+/i)).map(normalizeKey),
      keysRaw: node.keys,
      optional: /\(optional\)/i.test(text),
      textSha1: crypto.createHash('sha1').update(text).digest('hex'),
    })
  }

  for (const token of tokens) {
    if (token.startsWith('<!--')) continue
    if (token[0] !== '<') {
      if (heading) heading.text += token
      if (kbd !== null) kbd += token
      if (ref) ref.text += token
      const s = sink()
      if (s) s.text += token
      continue
    }
    const m = /^<\s*(\/)?\s*([a-zA-Z0-9]+)([^>]*)>$/.exec(token)
    if (!m) continue
    const closing = Boolean(m[1])
    const tag = m[2].toLowerCase()
    const attrs = m[3]
    if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag[1])
      if (!closing) heading = { level, text: '' }
      else if (heading) {
        const text = squash(heading.text)
        if (level === 1) title = text
        while (headings.length && headings.at(-1).level >= level) headings.pop()
        headings.push({ level, text })
        heading = null
      }
    } else if (tag === 'section') {
      if (!closing) sectionIds.push(/\bid="([^"]+)"/.exec(attrs)?.[1] ?? '')
      else sectionIds.pop()
    } else if (tag === 'li') {
      if (!closing) liStack.push({ text: '', keys: [], context: context(), depth: liStack.length + 1 })
      else finish(liStack.pop(), 'li')
    } else if (tag === 'p') {
      if (!closing) paragraph = { text: '', keys: [], context: context(), depth: 0 }
      else {
        if (liStack.length === 0) finish(paragraph, 'p')
        paragraph = null
      }
    } else if (tag === 'kbd') {
      if (!closing) kbd = ''
      else if (kbd !== null) {
        const s = sink()
        if (s) {
          // <kbd>Shift</kbd> + <kbd>Tab</kbd> is one combination: join when only "+" separates two <kbd>.
          const between = s.text.slice(s.afterKbd ?? 0, s.text.length - kbd.length)
          if (s.keys.length && s.afterKbd !== undefined && /^\s*\+\s*$/.test(decode(between))) s.keys[s.keys.length - 1] += ' + ' + squash(kbd)
          else s.keys.push(squash(kbd))
          s.afterKbd = s.text.length
        }
        kbd = null
      }
    } else if (tag === 'a') {
      if (!closing) {
        const cls = /\bclass="([^"]+)"/.exec(attrs)?.[1] ?? ''
        const kind = cls.includes('role-reference') ? 'roles' : cls.includes('state-reference') ? 'states' : cls.includes('property-reference') ? 'properties' : null
        ref = kind ? { kind, text: '' } : null
      } else if (ref) {
        refs[ref.kind].add(squash(ref.text))
        ref = null
      }
    }
  }
  // A key named in a nested <li> is also seen by its parent's text; keep only the item that directly owns the <kbd>.
  return {
    title,
    roles: [...refs.roles].sort(),
    states: [...refs.states].sort(),
    properties: [...refs.properties].sort(),
    keyItems: items,
    keys: [...new Set(items.flatMap((i) => i.keys))].sort(),
  }
}

const dirs = fs.readdirSync(patternsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
const patterns = []
for (const dir of dirs) {
  const file = fs.readdirSync(path.join(patternsDir, dir)).find((f) => f.endsWith('-pattern.html'))
  if (!file) continue
  const page = parsePage(fs.readFileSync(path.join(patternsDir, dir, file), 'utf8'))
  patterns.push({ dir, file: `content/patterns/${dir}/${file}`, url: `https://www.w3.org/WAI/ARIA/apg/patterns/${dir}/`, ...page })
}

const out = {
  source: {
    name: 'WAI-ARIA Authoring Practices Guide (APG)',
    repository: 'https://github.com/w3c/aria-practices',
    commit: readCommit(path.resolve(src)),
    license: 'W3C-20150513',
  },
  counts: {
    patterns: patterns.length,
    keyItems: patterns.reduce((n, p) => n + p.keyItems.length, 0),
    distinctKeys: new Set(patterns.flatMap((p) => p.keys)).size,
  },
  patterns,
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n')
console.log(`${patterns.length} pattern pages, ${out.counts.keyItems} key items, ${out.counts.distinctKeys} distinct key combinations -> ${path.relative(process.cwd(), outFile)}`)
