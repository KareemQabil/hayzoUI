// Usage: node scripts/shot.mjs <hash> <width> <out> [fullPage=1] [height=900]
import { chromium } from 'playwright-core'
const [hash = '', width = '1440', out = '/tmp/shots/a.png', full = '1', height = '900'] = process.argv.slice(2)
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] })
const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: +width, height: +height }, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(`http://localhost:3000/${hash}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.screenshot({ path: out, fullPage: full === '1' })
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
console.log(JSON.stringify({ out, overflow, errors: errors.slice(0, 5) }))
await browser.close()
