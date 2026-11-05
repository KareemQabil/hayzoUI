// Blind bidi scan (R-BIDI-003): visits every route, in both display numerals and two viewports, surfaces
// validation messages by typing stress values into inputs, and measures on screen whether two digit groups
// separated by spaces are drawn in reverse order. The oracle is geometric (range rects), not a text pattern,
// so it also catches cases a regex on the source would miss, and it ignores spaces that render correctly.
//
// Usage: node scripts/bidi-scan.mjs [baseUrl]   (ONLY=app,matrix/combobox limits routes)   (CHROMIUM=path/to/chrome overrides browser detection)
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
// ONLY=app,matrix/combobox limits the scan to some routes (for a quick or negative check).
if (process.env.ONLY) routes.splice(0, routes.length, ...process.env.ONLY.split(',').map((r) => '#/' + r.replace(/^#?\/?/, '')))
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

// Oracle 2 — mixed-script text (.ax-auto, auto-direction inputs), measured on screen:
//   own direction = first strong character · first character at the line's start (punctuation in place) ·
//   alignment per the mixedAlign preference: 'ui' = the container's start edge, 'content' = the text's own start.
async function measureMixed(page, mixedAlign) {
  return page.evaluate((mixedAlign) => {
    const STRONG = /[A-Za-z\u00c0-\u024f\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]/
    const RTL_CHAR = /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]/
    const out = { checked: 0, problems: [] }
    const side = (rtl) => (rtl ? 'right' : 'left')
    for (const el of document.querySelectorAll('.ax-auto:not(.ax-auto--inline)')) {
      const text = el.textContent.trim()
      const strong = text.match(STRONG)?.[0]
      const box = el.getBoundingClientRect()
      if (!strong || !box.width || el.closest('[aria-hidden="true"]')) continue
      const own = getComputedStyle(el).direction
      const parentDir = getComputedStyle(el.parentElement).direction
      const expectDir = RTL_CHAR.test(strong) ? 'rtl' : 'ltr'
      const label = text.slice(0, 40)
      out.checked++
      if (own !== expectDir) out.problems.push('direction ' + own + ', first strong says ' + expectDir + ': «' + label + '»')
      const range = document.createRange()
      range.selectNodeContents(el)
      const rects = [...range.getClientRects()].filter((r) => r.width)
      const lines = new Set(rects.map((r) => Math.round(r.top)))
      if (lines.size !== 1) continue // wrapped: alignment is not measurable on a single edge
      const t = { left: Math.min(...rects.map((r) => r.left)), right: Math.max(...rects.map((r) => r.right)) }
      const cs = getComputedStyle(el)
      const contentLeft = box.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth)
      const contentRight = box.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth)
      if (t.right - t.left >= contentRight - contentLeft - 2) continue // fills the line: every alignment looks the same
      const at = Math.abs(contentRight - t.right) < 2 ? 'right' : Math.abs(t.left - contentLeft) < 2 ? 'left' : 'middle'
      const expectSide = mixedAlign === 'ui' ? side(parentDir === 'rtl') : side(own === 'rtl')
      if (at !== expectSide) out.problems.push('aligned ' + at + ', expected ' + expectSide + ' (' + mixedAlign + '): «' + label + '»')
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode()
      while (node && !node.data.trim()) node = walker.nextNode()
      if (node) {
        const i = node.data.search(/\S/)
        const r = document.createRange()
        r.setStart(node, i)
        r.setEnd(node, i + 1)
        const c = r.getBoundingClientRect()
        const atStart = own === 'rtl' ? Math.abs(c.right - t.right) < 2 : Math.abs(c.left - t.left) < 2
        if (!atStart) out.problems.push('first character not at the line start (' + own + '): «' + label + '»')
      }
    }
    for (const input of document.querySelectorAll('input[dir="auto"]')) {
      if (!input.value || !input.getBoundingClientRect().width) continue
      out.checked++
      const align = getComputedStyle(input).textAlign
      const parentDir = getComputedStyle(input.parentElement).direction
      const expect = mixedAlign === 'ui' ? side(parentDir === 'rtl') : 'start'
      if (align !== expect) out.problems.push('<input> text-align ' + align + ', expected ' + expect + ' (' + mixedAlign + '): «' + input.value.slice(0, 30) + '»')
    }
    return out
  }, mixedAlign)
}
const mixedFindings = new Map()
let mixedChecked = 0

// Four passes with the default alignment, plus one with the other preference.
const PASSES = [
  ...['arab', 'latn'].flatMap((numerals) => [{ width: 1280, height: 900 }, { width: 390, height: 844 }].map((viewport) => ({ numerals, viewport, mixedAlign: 'ui' }))),
  { numerals: 'latn', viewport: { width: 1280, height: 900 }, mixedAlign: 'content' },
]
for (const { numerals, viewport, mixedAlign } of PASSES) {
  {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' })
    await ctx.addInitScript(([n, a]) => localStorage.setItem('ax.prefs.v0', JSON.stringify({ numerals: n, locale: 'ar-EG', mixedAlign: a })), [numerals, mixedAlign])
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
      const mixed = await measureMixed(page, mixedAlign)
      mixedChecked += mixed.checked
      for (const p of mixed.problems) {
        const key = mixedAlign + ' · ' + viewport.width + 'px · ' + p
        if (!mixedFindings.has(key)) mixedFindings.set(key, new Set())
        mixedFindings.get(key).add(route)
      }
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

console.log(`bidi-scan: ${routes.length} routes × ${PASSES.length} passes, ${checked} digit-group pairs and ${mixedChecked} mixed-text elements measured`)
if (findings.size === 0) console.log('no reversed digit groups')
for (const [key, where] of findings) console.log('REVERSED  ' + key + '\n          ' + [...where].join(', '))
if (mixedFindings.size === 0) console.log('mixed text: direction, punctuation and alignment as preferred')
for (const [key, where] of mixedFindings) console.log('MIXED     ' + key + '\n          ' + [...where].slice(0, 4).join(', '))
if (findings.size || mixedFindings.size) process.exitCode = 1
