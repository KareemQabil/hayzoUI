// Browser checks against the running dev server (Chromium headless via playwright-core).
// Writes src/knowledge/evidence/browser-run.json. Usage: node scripts/browser-checks.mjs [baseUrl]
import fs from 'node:fs'
import { chromium } from 'playwright-core'
import { chromiumPath } from './chromium.mjs'

const base = process.argv[2] ?? 'http://localhost:5179/'
const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--no-sandbox'] })
const pwVersion = JSON.parse(fs.readFileSync('node_modules/playwright-core/package.json', 'utf8')).version
const startedAt = new Date().toISOString()
const results = []

async function fresh(hash, viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(base + hash, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  return { ctx, page }
}

async function check(id, name, fn) {
  try {
    const detail = await fn()
    results.push({ id, name, status: 'passed', detail })
  } catch (e) {
    results.push({ id, name, status: 'failed', detail: String(e.message ?? e).slice(0, 300) })
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}
const amountField = (page) => page.getByLabel(/^المبلغ المستلم/).first()
const inDialog = (page) => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))

await check('BR-CI-01', 'clear then blur stays empty', async () => {
  const { ctx, page } = await fresh('#/components/currency-input/overview')
  const f = amountField(page)
  await f.fill('1234.50')
  await f.press('Tab')
  await f.fill('')
  await f.press('Tab')
  const v = await f.inputValue()
  const err = await page.getByText('أدخل المبلغ.').first().isVisible()
  await ctx.close()
  assert(v === '', `value was "${v}"`)
  assert(err, 'required message not visible')
  return 'value="" · «أدخل المبلغ.» ظاهرة'
})

await check('BR-CI-02', 'arabic digits display after blur', async () => {
  const { ctx, page } = await fresh('#/components/currency-input/overview')
  const f = amountField(page)
  await f.fill('١٢٣٤٫٥')
  await f.press('Tab')
  const v = await f.inputValue()
  await ctx.close()
  assert(v === '1,234.50', `value was "${v}"`)
  return v
})

await check('BR-CI-03', 'ambiguous comma rejected, suggestion applies', async () => {
  const { ctx, page } = await fresh('#/components/currency-input/overview')
  const f = amountField(page)
  await f.fill('1234,50')
  await f.press('Tab')
  const kept = await f.inputValue()
  const err = await page.getByText(/قد تعني فاصلة عشرية أو فاصل آلاف/).first().isVisible()
  await page.locator('.ax-suggest__option').first().click()
  const after = await f.inputValue()
  await ctx.close()
  assert(kept === '1234,50', `text was changed to "${kept}"`)
  assert(err, 'error not visible')
  assert(after === '1234.50', `after suggestion "${after}"`)
  return `«${kept}» محفوظ ← «${after}»`
})

await check('BR-CI-04', 'tab into a filled field and type replaces the amount', async () => {
  const { ctx, page } = await fresh('#/components/currency-input/overview')
  const f = amountField(page)
  await f.fill('1234.50')
  await f.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.type('77')
  const v = await f.inputValue()
  await ctx.close()
  assert(v === '77', `value was "${v}"`)
  return '«1,234.50» ← Shift+Tab ← «77»'
})

await check('BR-DLG-01', 'focus enters dialog', async () => {
  const { ctx, page } = await fresh('#/components/currency-input')
  await page.locator('body').click({ position: { x: 5, y: 300 } })
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(150)
  const ok = await inDialog(page)
  await ctx.close()
  assert(ok, 'focus not inside dialog')
  return 'activeElement داخل role=dialog'
})

await check('BR-DLG-02', 'tab is contained', async () => {
  const { ctx, page } = await fresh('#/components/currency-input')
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(150)
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(i % 3 === 2 ? 'Shift+Tab' : 'Tab')
    assert(await inDialog(page), `focus left dialog at press ${i + 1}`)
  }
  await ctx.close()
  return '١٢ ضغطة (Tab وShift+Tab) داخل الحوار'
})

await check('BR-DLG-03', 'escape closes and restores focus', async () => {
  const { ctx, page } = await fresh('#/components/currency-input')
  await page.getByTestId('open-search').click()
  await page.waitForTimeout(150)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
  const open = await page.locator('[role="dialog"]').count()
  const back = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
  await ctx.close()
  assert(open === 0, 'dialog still open')
  assert(back === 'open-search', `focus on ${back}`)
  return 'مغلق · التركيز على زر البحث'
})

async function openAhmed(page) {
  await page.getByRole('button', { name: /أحمد Khaled/ }).click()
  return page.getByRole('region', { name: 'سجل تحصيلات العميل' }).locator('tbody tr')
}

await check('BR-APP-01', 'double activation records once', async () => {
  const { ctx, page } = await fresh('#/app')
  const rows = await openAhmed(page)
  const before = await rows.count()
  await amountField(page).fill('100')
  await page.getByRole('button', { name: 'مراجعة التحصيل' }).click()
  await page.getByTestId('confirm').dblclick()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1700)
  const after = await rows.count()
  await ctx.close()
  assert(after === before + 1, `rows ${before} → ${after}`)
  return `الصفوف ${before} ← ${after}`
})

await check('BR-APP-02', 'simulated failure preserves data, retry succeeds', async () => {
  const { ctx, page } = await fresh('#/app')
  await openAhmed(page)
  await page.getByRole('switch', { name: 'افشل المحاولة التالية' }).click()
  await amountField(page).fill('250')
  await page.getByRole('button', { name: 'مراجعة التحصيل' }).click()
  await page.getByTestId('confirm').click()
  await page.waitForTimeout(1500)
  const alert = await page.getByRole('alert').filter({ hasText: 'تعذّر تسجيل التحصيل' }).isVisible()
  const kept = await page.locator('[role="dialog"]').getByText('250.00').isVisible()
  await page.getByRole('button', { name: 'أعد المحاولة' }).click()
  await page.waitForTimeout(1600)
  const ok = await page.getByTestId('success').isVisible()
  await ctx.close()
  assert(alert, 'failure alert not shown')
  assert(kept, 'amount not preserved')
  assert(ok, 'success not shown after retry')
  return 'فشل ← المبلغ 250.00 باقٍ ← إيصال'
})

await check('BR-LAY-01', 'no page-level horizontal overflow at 390px', async () => {
  const routes = ['components/currency-input', 'components/currency-input/lab', 'components/currency-input/guidelines', 'components/currency-input/behavior', 'components/currency-input/code', 'components/currency-input/provenance', 'components/button', 'components/data-table', 'studio', 'patterns', 'patterns/P-COLLECT-PAYMENT', 'app', 'evidence', 'resources', 'rules/R-NUM-002', 'ecosystem']
  const { ctx, page } = await fresh('#/components/currency-input', { width: 390, height: 844 })
  const bad = []
  for (const r of routes) {
    await page.evaluate((h) => (location.hash = h), '#/' + r)
    await page.waitForTimeout(300)
    const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    if (o > 0) bad.push(`${r}:${o}px`)
  }
  await ctx.close()
  assert(!bad.length, bad.join(', '))
  return `${routes.length} شاشة بلا تجاوز`
})

const run = {
  tool: `Playwright (playwright-core ${pwVersion})`,
  environment: `Chromium ${browser.version()} headless · ${process.platform} · 1280×900 و390×844 · reduced motion`,
  startedAt,
  results,
}
await browser.close()
fs.writeFileSync('src/knowledge/evidence/browser-run.json', JSON.stringify(run, null, 2) + '\n')
for (const r of results) console.log(r.status.padEnd(7), r.id, r.detail ?? '')
