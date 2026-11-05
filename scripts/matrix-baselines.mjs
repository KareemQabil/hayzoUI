// Visual baselines for the spec-driven state matrix (replaces the Figma Make approval step).
//   node scripts/matrix-baselines.mjs          compare every spec × content × density to design/baselines; exit 1 on a diff
//   node scripts/matrix-baselines.mjs --update  write new baselines (after a person approved the change)
// Diffs are written next to the baseline as *.diff.png. Same-app regression only: never compare across renderers.
import fs from 'node:fs'
import path from 'node:path'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { chromium } from 'playwright-core'
import { chromiumPath } from './chromium.mjs'

const update = process.argv.includes('--update')
const base = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5179/'
const OUT = 'design/baselines'
const DENSITIES = ['compact', 'default', 'touch']
// Fraction of differing pixels tolerated (anti-aliasing noise), and per-pixel color threshold.
const MAX_RATIO = 0.001
const THRESHOLD = 0.1

const specs = fs.readdirSync('spec/components').filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join('spec/components', f), 'utf8')))
const browser = await chromium.launch({ executablePath: chromiumPath() })
// Fixed viewport, scale, fonts loaded and motion off: the matrix must render the same on every run.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
const page = await ctx.newPage()
await page.goto(base + '#/matrix/' + specs[0].id, { waitUntil: 'networkidle' })

let compared = 0
const failures = []
for (const spec of specs) {
  fs.mkdirSync(path.join(OUT, spec.id), { recursive: true })
  // Every content variant at the default density, plus the first variant at the other densities.
  const combos = [...spec.content.map((c) => [c, 'default']), ...DENSITIES.filter((d) => d !== 'default').map((d) => [spec.content[0], d])]
  for (const [content, density] of combos) {
    {
      await page.evaluate((h) => (location.hash = h), `#/matrix/${spec.id}?content=${content}&density=${density}`)
      await page.waitForSelector(`[data-matrix-cell$="|${density}"]`)
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(150)
      const shot = await page.locator(`[data-matrix="${spec.id}"]`).screenshot({ animations: 'disabled', caret: 'hide' })
      const file = path.join(OUT, spec.id, `${content}--${density}.png`)
      if (update || !fs.existsSync(file)) {
        fs.writeFileSync(file, shot)
        console.log(`${update ? 'updated' : 'created'}  ${file}`)
        continue
      }
      const a = PNG.sync.read(fs.readFileSync(file))
      const b = PNG.sync.read(shot)
      compared++
      if (a.width !== b.width || a.height !== b.height) {
        failures.push(`${file}: size ${a.width}×${a.height} → ${b.width}×${b.height}`)
        fs.writeFileSync(file.replace('.png', '.actual.png'), shot)
        continue
      }
      const diff = new PNG({ width: a.width, height: a.height })
      const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: THRESHOLD })
      const ratio = n / (a.width * a.height)
      if (ratio > MAX_RATIO) {
        failures.push(`${file}: ${n} px (${(ratio * 100).toFixed(2)}%)`)
        fs.writeFileSync(file.replace('.png', '.diff.png'), PNG.sync.write(diff))
        fs.writeFileSync(file.replace('.png', '.actual.png'), shot)
      }
    }
  }
}
await browser.close()

if (!update) {
  console.log(`matrix-baselines: ${compared} compared, ${failures.length} changed`)
  for (const f of failures) console.log('CHANGED  ' + f)
  if (failures.length) process.exitCode = 1
}
