// Blind bidi scan (R-BIDI-003): visits every route, in both display numerals and two viewports, surfaces
// validation messages by typing stress values into inputs, and measures on screen whether two digit groups
// separated by spaces are drawn in reverse order. The oracle is geometric (range rects), not a text pattern,
// so it also catches cases a regex on the source would miss, and it ignores spaces that render correctly.
//
// Usage: node scripts/bidi-scan.mjs [baseUrl]   (CHROMIUM=path/to/chrome overrides browser detection)
// Exit code 1 when any reversed group is found.
import fs from 'node:fs'
import { chromium } from 'playwright-core'
import { chromiumPath } from './chromium.mjs'

const base = process.argv[2] ?? 'http://localhost:5179/'
const executablePath = chromiumPath()

// Routes are discovered from the knowledge base, so new components and patterns are scanned without edits here.
const ids = (file, rx) => [...fs.readFileSync(file, 'utf8').matchAll(rx)].map((m) => m[1])
const components = ids('src/knowledge/components.ts', /^\s*id: '([a-z-]+)'/gm)
const patterns = [...new Set(ids('src/knowledge/patterns.ts', /\bid: '(P-[A-Z-]+)'/g))]
const tabs = ['overview', 'lab', 'guidelines', 'behavior', 'code', 'provenance']
const routes = [
  '#/app', '#/ecosystem', '#/evidence', '#/patterns', '#/resources', '#/rules', '#/studio',
  ...tabs.map((t) => `#/components/currency-input/${t}`),
  ...components.filter((c) => c !== 'currency-input').map((c) => `#/components/${c}`),
  ...patterns.map((p) => `#/patterns/${p}`),
  // Every spec's state matrix: all states and variants, in both numerals, through the same oracle.
  ...fs.readdirSync('spec/components').filter((f) => f.endsWith('.json')).map((f) => `#/matrix/${f.replace('.json', '')}`),
]
// Values that make fields show messages containing numbers (examples, limits, counts).
const STRESS = { tel: '0101234', decimal: '12,5' }

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] })
const findings = new Map()
let checked = 0

async function measure(page) {
  return page.evaluate(() => {
    const RX = /([0-9\u0660-\u0669\u06f0-\u06f9]+)( +)([0-9\u0660-\u0669\u06f0-\u06f9]+)/g
    const rect = (node, i, len) => {
      const r = document.createRange()
      r.setStart(node, i)
      r.setEnd(node, i + len)
      return r.getBoundingClientRect()
    }
    const out = { checked: 0, reversed: [] }
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let n
    while ((n = w.nextNode())) {
      if (n.parentElement?.closest('script, style')) continue
      for (const m of n.data.matchAll(RX)) {
        const a = rect(n, m.index, m[1].length)
        const b = rect(n, m.index + m[1].length + m[2].length, m[3].length)
        if (!a.width || !b.width || Math.abs(a.top - b.top) > 2) continue // hidden, or wrapped to another line
        out.checked++
        if (a.left > b.left) out.reversed.push(n.data.trim().slice(0, 120))
      }
    }
    // Input values are not text nodes; check them through a mirror with the same direction context.
    for (const el of document.querySelectorAll('input')) {
      if (!el.value || !/[0-9\u0660-\u0669] +[0-9\u0660-\u0669]/.test(el.value)) continue
      const probe = document.createElement('span')
      probe.dir = el.dir || getComputedStyle(el).direction
      probe.style.cssText = 'position:fixed;inset-block-start:0;white-space:pre;font:inherit;unicode-bidi:isolate'
      probe.textContent = el.value
      el.parentElement.append(probe)
      const t = probe.firstChild
      for (const m of el.value.matchAll(RX)) {
        const a = rect(t, m.index, m[1].length)
        const b = rect(t, m.index + m[1].length + m[2].length, m[3].length)
        out.checked++
        if (a.left > b.left) out.reversed.push(`<input> ${el.value}`)
      }
      probe.remove()
    }
    return out
  })
}

for (const numerals of ['arab', 'latn']) {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' })
    await ctx.addInitScript((n) => localStorage.setItem('ax.prefs.v0', JSON.stringify({ numerals: n, locale: 'ar-EG' })), numerals)
    const page = await ctx.newPage()
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(150)
      const record = (res, phase) => {
        checked += res.checked
        for (const text of res.reversed) {
          const key = `${numerals} · ${viewport.width}px · ${text}`
          if (!findings.has(key)) findings.set(key, new Set())
          findings.get(key).add(`${route} (${phase})`)
        }
      }
      record(await measure(page), 'load')
      const tel = page.locator('input[type=tel]:visible:not([disabled]):not([readonly])')
      const dec = page.locator('input[inputmode=decimal]:visible:not([disabled]):not([readonly])')
      if ((await tel.count()) + (await dec.count()) === 0) continue
      for (const [loc, value] of [[tel, STRESS.tel], [dec, STRESS.decimal]]) {
        for (let i = 0; i < (await loc.count()); i++) {
          await loc.nth(i).fill(value).catch(() => {})
          await loc.nth(i).press('Tab').catch(() => {})
        }
      }
      await page.waitForTimeout(150)
      record(await measure(page), 'stress')
    }
    await ctx.close()
  }
}
await browser.close()

console.log(`bidi-scan: ${routes.length} routes × 2 numerals × 2 viewports, ${checked} digit-group pairs measured`)
if (findings.size === 0) {
  console.log('no reversed digit groups')
} else {
  for (const [key, where] of findings) console.log(`REVERSED  ${key}\n          ${[...where].join(', ')}`)
  process.exitCode = 1
}
