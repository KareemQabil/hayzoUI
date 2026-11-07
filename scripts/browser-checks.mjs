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

// ONLY=BR-AT runs a subset and does not overwrite the recorded run.
const ONLY = process.env.ONLY
async function check(id, name, fn) {
  if (ONLY && !id.startsWith(ONLY)) return
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
  const routes = ['components/currency-input', 'components/currency-input/lab', 'components/currency-input/guidelines', 'components/currency-input/behavior', 'components/currency-input/code', 'components/currency-input/provenance', 'components/button', 'components/data-table', 'studio', 'patterns', 'patterns/P-COLLECT-PAYMENT', 'app', 'evidence', 'resources', 'rules/R-NUM-002', 'ecosystem', 'matrix/currency-input']
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

await check('BR-DLG-04', 'nested dialogs: Escape closes only the inner one; focus and the background lock hold', async () => {
  const { ctx, page } = await fresh('spikes/primitives/?lib=own&nested=1')
  await page.getByTestId('open').click()
  await page.waitForTimeout(250)
  await page.getByTestId('open-b').click()
  await page.waitForTimeout(250)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  const s = await page.evaluate(() => ({ dialogs: document.querySelectorAll('[role="dialog"]').length, focus: document.activeElement?.getAttribute('data-testid'), blocked: !!document.querySelector('[data-testid="outside"]').closest('[inert],[aria-hidden="true"]') }))
  let escaped = false
  for (let i = 0; i < 10 && !escaped; i++) {
    await page.keyboard.press('Tab')
    escaped = await page.evaluate(() => !document.activeElement?.closest('[role="dialog"]'))
  }
  await ctx.close()
  assert(s.dialogs === 1, `${s.dialogs} dialogs open`)
  assert(s.focus === 'open-b', `focus on ${s.focus}`)
  assert(s.blocked && !escaped, `background blocked=${s.blocked}, Tab escaped=${escaped}`)
  return 'الداخلي فقط أُغلق · التركيز على «تأكيد» · الخلفية مقفلة'
})

// ---------- Combobox and DatePicker (React Aria behind the adapter) ----------
async function withNumerals(hash, numerals) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  await ctx.addInitScript((n) => localStorage.setItem('ax.prefs.v0', JSON.stringify({ numerals: n, locale: 'ar-EG' })), numerals)
  const page = await ctx.newPage()
  await page.goto(base + hash, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  return { ctx, page }
}
const comboInput = (page) => page.getByRole('combobox', { name: 'العميل' })
const visibleOptions = async (page) => (await page.locator('[role="option"]:visible').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim())

await check('BR-CB-01', 'combobox: tolerant matching with the match highlighted', async () => {
  const { ctx, page } = await fresh('#/components/combobox')
  const input = comboInput(page)
  const out = []
  for (const [q, expect] of [['احمد', 'أحمد Khaled'], ['محمد', 'مُحَمَّد السيد'], ['khaled', 'أحمد Khaled']]) {
    await input.fill('')
    await input.pressSequentially(q)
    await page.waitForTimeout(200)
    const opts = await visibleOptions(page)
    assert(opts.length === 1 && opts[0].startsWith(expect), `«${q}» → ${JSON.stringify(opts)}`)
    out.push(`${q}→${expect}`)
  }
  const marks = await page.locator('[role="option"] mark').count()
  await ctx.close()
  assert(marks > 0, 'no highlighted match')
  return out.join(' · ')
})

await check('BR-CB-02', 'combobox: phone search by digits in any numerals', async () => {
  const { ctx, page } = await fresh('#/components/combobox')
  const input = comboInput(page)
  for (const q of ['0101', '٠١٠١']) {
    await input.fill('')
    await input.pressSequentially(q)
    await page.waitForTimeout(200)
    const opts = await visibleOptions(page)
    assert(opts.length === 1 && opts[0].startsWith('أحمد Khaled'), `«${q}» → ${JSON.stringify(opts)}`)
  }
  await ctx.close()
  return '«0101» و«٠١٠١» ← أحمد Khaled'
})

await check('BR-CB-03', 'combobox: Enter selects the value; clear and leave reports null', async () => {
  const { ctx, page } = await fresh('#/components/combobox')
  const input = comboInput(page)
  await input.pressSequentially('احمد')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(200)
  const picked = await page.getByTestId('combobox-value').innerText()
  await input.fill('')
  await page.keyboard.press('Tab')
  await page.waitForTimeout(200)
  const cleared = await page.getByTestId('combobox-value').innerText()
  await ctx.close()
  assert(picked === 'CUS-0001', `picked ${picked}`)
  assert(cleared === 'null', `cleared ${cleared}`)
  return 'CUS-0001 ← null'
})

await check('BR-CB-04', 'combobox: popup aligned to the inline-start edge in RTL; Escape keeps focus', async () => {
  const { ctx, page } = await fresh('#/components/combobox')
  const input = comboInput(page)
  await input.pressSequentially('ا')
  await page.waitForTimeout(250)
  const r = await page.evaluate(() => {
    const c = document.querySelector('.ax-combobox .ax-control').getBoundingClientRect()
    const p = document.querySelector('.ax-combobox__popover').getBoundingClientRect()
    return { delta: Math.abs(c.right - p.right), width: Math.abs(c.width - p.width) }
  })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  const open = await page.locator('[role="option"]:visible').count()
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('role'))
  await ctx.close()
  assert(r.delta <= 2 && r.width <= 2, `offset ${r.delta}px, width diff ${r.width}px`)
  assert(open === 0 && focused === 'combobox', `open=${open} focus=${focused}`)
  return `محاذاة ${r.delta.toFixed(1)}px`
})

await check('BR-DP-01', 'date: Gregorian and Hijri show the same stored ISO date', async () => {
  const { ctx, page } = await fresh('#/components/date-picker')
  const texts = (await page.locator('.ax-date__group').allInnerTexts()).map((t) => t.replace(/[\s\u200f\u200e]+/g, ''))
  const stored = await page.getByTestId('date-value').innerText()
  await ctx.close()
  assert(stored === '2026-11-05', stored)
  assert(texts[0] === '5/11/2026' && texts[1].startsWith('25/5/1448'), JSON.stringify(texts))
  return `${texts[0]} = ${texts[1]} ← ${stored}`
})

await check('BR-DP-02', 'date: segments accept the other numeral system', async () => {
  const out = []
  for (const [numerals, typed] of [['latn', '١٢'], ['arab', '12']]) {
    const { ctx, page } = await withNumerals('#/components/date-picker', numerals)
    await page.locator('.ax-date__group').first().locator('[role="spinbutton"]').first().click()
    await page.keyboard.type(typed)
    await page.waitForTimeout(200)
    const stored = await page.getByTestId('date-value').innerText()
    await ctx.close()
    assert(stored === '2026-11-12', `${numerals}: «${typed}» → ${stored}`)
    out.push(`${numerals}: «${typed}»`)
  }
  return out.join(' · ') + ' ← 2026-11-12'
})

await check('BR-DP-03', 'date: ArrowLeft is the next day in RTL; selection stored as Gregorian ISO', async () => {
  const { ctx, page } = await fresh('#/components/date-picker')
  await page.getByRole('button', { name: 'فتح التقويم' }).nth(1).click()
  await page.waitForTimeout(300)
  const before = await page.evaluate(() => document.activeElement?.textContent)
  await page.keyboard.press('ArrowLeft')
  const after = await page.evaluate(() => document.activeElement?.textContent)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(200)
  const stored = await page.getByTestId('date-value').innerText()
  await ctx.close()
  assert(Number(after) === Number(before) + 1, `${before} → ${after}`)
  assert(stored === '2026-11-06', stored)
  return `هجري ${before} ← ${after} ← ${stored}`
})

await check('BR-DP-04', 'date: the Hijri calendar shows Hijri month names in Arabic', async () => {
  const { ctx, page } = await fresh('#/components/date-picker')
  await page.getByRole('button', { name: 'فتح التقويم' }).nth(1).click()
  await page.waitForTimeout(300)
  const title = await page.locator('.ax-calendar__title').innerText()
  await ctx.close()
  assert(/جمادى الأولى/.test(title) && /1448/.test(title), title)
  return title
})

// ---------- Mixed-script names: direction, punctuation, alignment preference ----------
async function withPrefs(hash, prefs) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  await ctx.addInitScript((p) => localStorage.setItem('ax.prefs.v0', JSON.stringify({ numerals: 'latn', locale: 'ar-EG', ...p })), prefs)
  const page = await ctx.newPage()
  await page.goto(base + hash, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  return { ctx, page }
}
/** Right and left edge of each customer name's text in the reference list, by name. */
const nameEdges = (page) =>
  page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll('li .ax-auto')].map((el) => {
        const r = document.createRange()
        r.selectNodeContents(el)
        const t = r.getBoundingClientRect()
        return [el.textContent.trim(), { left: Math.round(t.left), right: Math.round(t.right), boxLeft: Math.round(el.getBoundingClientRect().left), boxRight: Math.round(el.getBoundingClientRect().right) }]
      }),
    ),
  )

await check('BR-MIX-01', 'Latin names in an Arabic list follow the alignment preference', async () => {
  const out = []
  for (const mixedAlign of ['ui', 'content']) {
    const { ctx, page } = await withPrefs('#/app', { mixedAlign })
    const e = await nameEdges(page)
    await ctx.close()
    const arabic = e['هالة مؤمن']
    for (const latin of ['Sara Haddad', 'Dr. سامي الحلبي', '3M مصر']) {
      const x = e[latin]
      assert(x && arabic, `missing ${latin}`)
      if (mixedAlign === 'ui') assert(Math.abs(x.right - arabic.right) <= 1, `ui: «${latin}» ends at ${x.right}, Arabic names at ${arabic.right}`)
      // content: each line starts on its own direction's side. Arabic-dominant names («Dr. سامي الحلبي», «3M مصر»)
      // are RTL lines (dominant-script rule), so they start on the right like the Arabic names; only «Sara Haddad» is LTR.
      else if (latin === 'Sara Haddad') assert(Math.abs(x.left - x.boxLeft) <= 1, `content: «${latin}» starts at ${x.left}, box at ${x.boxLeft}`)
      else assert(Math.abs(x.right - arabic.right) <= 1, `content: «${latin}» ends at ${x.right}, Arabic names at ${arabic.right}`)
    }
    out.push(mixedAlign === 'ui' ? 'مع الواجهة: حافة واحدة' : 'مع النص: اللاتيني الخالص يسارًا، والعربي الغالب يمينًا')
  }
  return out.join(' · ')
})

await check('BR-MIX-02', 'a text field with a Latin name aligns by the preference', async () => {
  const out = []
  for (const [mixedAlign, expect] of [['ui', 'right'], ['content', 'start']]) {
    const { ctx, page } = await withPrefs('#/matrix/text-field?content=latin', { mixedAlign })
    const align = await page.locator('[data-matrix-cell^="default|latin|rtl|light"] input').evaluate((i) => getComputedStyle(i).textAlign)
    await ctx.close()
    assert(align === expect, `${mixedAlign}: text-align ${align}, expected ${expect}`)
    out.push(`${mixedAlign}: ${align}`)
  }
  return out.join(' · ')
})

await check('BR-MIX-03', 'Latin-first names keep punctuation in place: «Dr.» reads Dr then the period', async () => {
  const { ctx, page } = await withPrefs('#/app', { mixedAlign: 'ui' })
  const r = await page.evaluate(() => {
    const el = [...document.querySelectorAll('li .ax-auto')].find((e) => e.textContent.trim().startsWith('Dr.'))
    const node = el.querySelector('*')?.firstChild ?? el.firstChild
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let n = walker.nextNode()
    while (n && !n.data.includes('Dr.')) n = walker.nextNode()
    const at = (i) => {
      const range = document.createRange()
      range.setStart(n, i)
      range.setEnd(n, i + 1)
      return range.getBoundingClientRect().left
    }
    const i = n.data.indexOf('Dr.')
    const d = at(i), r = at(i + 1), dot = at(i + 2)
    // First Arabic letter of the name, wherever its text node is.
    const w2 = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let a = w2.nextNode()
    while (a && !/[؀-ۿ]/.test(a.data)) a = w2.nextNode()
    const ai = a.data.search(/[؀-ۿ]/)
    const range = document.createRange()
    range.setStart(a, ai)
    range.setEnd(a, ai + 1)
    return { d, r, dot, seen: range.getBoundingClientRect().left, dir: getComputedStyle(el).direction, node: !!node }
  })
  await ctx.close()
  // Dominant-script rule: an Arabic name with a Latin title is an RTL line; «Dr.» is an isolated LTR island at its start.
  assert(r.dir === 'rtl', `direction ${r.dir}`)
  assert(r.d < r.r && r.r < r.dot, `D=${r.d} r=${r.r} .=${r.dot}`)
  assert(r.d > r.seen, `«Dr.» (x=${r.d}) should be right of the Arabic name (x=${r.seen})`)
  return '«Dr.» يمين الاسم · D ← r ← . داخله · الاتجاه rtl'
})

await check('BR-MX-01', 'every spec state × content variant has a rendered matrix cell', async () => {
  const specs = fs.readdirSync('spec/components').filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync('spec/components/' + f, 'utf8')))
  const { ctx, page } = await fresh('#/matrix/' + specs[0].id)
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 120)))
  let cells = 0
  for (const s of specs) {
    for (const content of s.content) {
      await page.evaluate((h) => (location.hash = h), `#/matrix/${s.id}?content=${content}`)
      await page.waitForTimeout(250)
      const r = await page.evaluate(() => ({ cells: document.querySelectorAll('[data-matrix-cell]').length, missing: [...document.querySelectorAll('[data-matrix-missing]')].map((e) => e.getAttribute('data-matrix-missing')) }))
      assert(!r.missing.length, `missing: ${r.missing.slice(0, 3).join(', ')}`)
      const rows = s.states.length + (s.variants ?? []).reduce((n, v) => n + v.values.length, 0)
      assert(r.cells === rows * 4, `${s.id}/${content}: ${r.cells} cells, expected ${rows * 4}`)
      cells += r.cells
    }
  }
  await ctx.close()
  assert(!errors.length, 'console: ' + errors[0])
  return `${specs.length} spec · ${cells} خلية`
})

// Atomic first proof (#/proof): one Button and one TextField across 3 visual systems × 3 contexts × ar/en.
const EXPECTED_HEIGHT = { erp: 32, pos: 52, saas: 40 }
await check('BR-AT-01', 'proof: sizes come from the context only — same in every visual system and language', async () => {
  const { ctx, page } = await fresh('#/proof')
  const cells = await page.evaluate(() => [...document.querySelectorAll('[data-proof-cell]')].map((c) => ({
    key: c.dataset.proofCell,
    button: c.querySelector("[data-hz='button']").getBoundingClientRect().height,
    small: c.querySelector("[data-hz='button'][data-size='sm']").getBoundingClientRect().height,
    control: c.querySelector("[data-slot='control']").getBoundingClientRect().height,
  })))
  await ctx.close()
  assert(cells.length === 18, cells.length + ' cells')
  for (const c of cells) {
    const want = EXPECTED_HEIGHT[c.key.split('/')[1]]
    assert(Math.abs(c.button - want) < 0.5 && Math.abs(c.control - want) < 0.5, `${c.key}: button ${c.button}, field ${c.control}, want ${want}`)
    if (c.key.includes('/pos/')) assert(c.small >= 44, `${c.key}: small button ${c.small} < 44px touch target`)
  }
  return '18 خلية · ERP 32 · SaaS 40 · POS 52 (الصغير ≥ 44)'
})

await check('BR-AT-02', 'proof: keyboard reaches the action with a visible focus ring; Enter twice saves once', async () => {
  const { ctx, page } = await fresh('#/proof?visual=quiet')
  const cell = page.locator('[data-proof-cell="quiet/saas/ar"]')
  await cell.getByLabel(/اسم العميل/).click()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const focused = await page.evaluate(() => {
    const el = document.activeElement
    const cs = getComputedStyle(el)
    return { text: el?.querySelector("[data-slot='label']")?.textContent, style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) }
  })
  assert(focused.text === 'حفظ العميل', 'focus on ' + focused.text)
  assert(focused.style === 'solid' && focused.width >= 2, `ring ${focused.style} ${focused.width}`)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  const during = await cell.locator('[data-saves]').getAttribute('data-saves')
  const busy = await page.evaluate(() => document.activeElement?.getAttribute('aria-busy'))
  await page.waitForTimeout(1400)
  await page.keyboard.press('Enter')
  const after = await cell.locator('[data-saves]').getAttribute('data-saves')
  await ctx.close()
  assert(during === '1' && busy === 'true', `saves ${during}, aria-busy ${busy}`)
  assert(after === '2', 'after settling: ' + after)
  return 'Tab ← Tab ← Enter Enter = حفظ واحد · aria-busy · ثم Enter = الثاني'
})

await check('BR-AT-03', 'proof: the same component follows the scope direction; own-direction content aligns per policy', async () => {
  const { ctx, page } = await fresh('#/proof?visual=editorial')
  const m = await page.evaluate(() => Object.fromEntries(['ar', 'en'].map((l) => {
    const c = document.querySelector(`[data-proof-cell="editorial/saas/${l}"]`)
    const label = c.querySelector("[data-slot='label']").getBoundingClientRect()
    const control = c.querySelector("[data-slot='control']").getBoundingClientRect()
    const first = c.querySelector("[data-hz='button']").getBoundingClientRect()
    const row = c.querySelector("[data-hz='button']").parentElement.getBoundingClientRect()
    const email = c.querySelector("input[type='email']")
    return [l, { labelAtRight: Math.abs(label.right - control.right) < 2, labelAtLeft: Math.abs(label.left - control.left) < 2, firstAtRight: Math.abs(first.right - row.right) < 2, emailAlign: getComputedStyle(email).textAlign, emailDir: email.dir }]
  })))
  await ctx.close()
  assert(m.ar.labelAtRight && m.ar.firstAtRight, 'ar: ' + JSON.stringify(m.ar))
  assert(m.en.labelAtLeft && !m.en.firstAtRight, 'en: ' + JSON.stringify(m.en))
  assert(m.ar.emailDir === 'ltr' && m.ar.emailAlign === 'right' && m.en.emailAlign === 'left', `email ${m.ar.emailAlign}/${m.en.emailAlign}`)
  return 'ar: يمين · en: يسار · البريد ltr ومحاذاته مع الواجهة'
})

await check('BR-AT-04', 'proof: no horizontal page scroll at 390px, no console errors', async () => {
  const errors = []
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text().slice(0, 120)))
  await page.goto(base + '#/proof', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  await ctx.close()
  assert(r.sw <= r.cw, `scrollWidth ${r.sw} > ${r.cw}`)
  assert(!errors.length, 'console: ' + errors[0])
  return `${r.sw} ≤ ${r.cw}`
})

await check('BR-AT-05', 'proof: in RTL the first tab is on the right, ArrowLeft moves to the next tab and selects it', async () => {
  const { ctx, page } = await fresh('#/proof?visual=quiet')
  const cell = page.locator('[data-proof-cell="quiet/saas/ar"]')
  const tabs = cell.getByRole('tab')
  const [a, b] = [await tabs.nth(0).boundingBox(), await tabs.nth(1).boundingBox()]
  await tabs.nth(0).focus()
  await page.keyboard.press('ArrowLeft')
  const after = await page.evaluate(() => ({ text: document.activeElement?.textContent, selected: document.activeElement?.getAttribute('aria-selected') }))
  await page.keyboard.press('ArrowLeft') // the third tab is disabled: skipped, wraps to the first
  const wrapped = await page.evaluate(() => document.activeElement?.textContent)
  await ctx.close()
  assert(a.x > b.x, `first tab x ${a.x} should be right of second ${b.x}`)
  assert(after.text === 'السجل' && after.selected === 'true', JSON.stringify(after))
  assert(wrapped === 'البيانات', 'wrapped to ' + wrapped)
  return 'الأول يمين · ArrowLeft = التالي ويختار · المعطّل يُتخطّى'
})

await check('BR-AT-06', 'proof: native radios in RTL — ArrowLeft selects the next option; Space toggles the switch', async () => {
  const { ctx, page } = await fresh('#/proof?visual=quiet')
  const cell = page.locator('[data-proof-cell="quiet/saas/ar"]')
  await cell.getByRole('radio', { name: 'نقدًا' }).focus()
  await page.keyboard.press('ArrowLeft')
  const radio = await page.evaluate(() => document.activeElement?.closest('label')?.textContent ?? document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.id)
  const checkedCard = await cell.getByRole('radio', { name: 'بطاقة' }).isChecked()
  const sw = cell.getByRole('switch')
  const before = await sw.getAttribute('aria-checked')
  await sw.focus()
  await page.keyboard.press('Space')
  const after = await sw.getAttribute('aria-checked')
  await ctx.close()
  assert(checkedCard, 'ArrowLeft in RTL did not select «بطاقة» (focused: ' + radio + ')')
  assert(before === 'true' && after === 'false', `switch ${before} → ${after}`)
  return 'ArrowLeft ← بطاقة · Space يقلب المفتاح'
})

await check('BR-AT-07', 'proof: POS hit areas — checkbox, radio, switch and tabs are at least 44px in every visual system', async () => {
  const { ctx, page } = await fresh('#/proof')
  const small = await page.evaluate(() => [...document.querySelectorAll('[data-proof-cell*="/pos/"]')].flatMap((c) =>
    [...c.querySelectorAll("[data-hz='checkbox'] [data-slot='control'], [data-hz='radio-group'] [data-slot='control'], [data-hz='switch'] [data-slot='control'], [role='tab']")]
      .map((e) => ({ k: c.dataset.proofCell + ' ' + (e.getAttribute('role') ?? e.closest('[data-hz]')?.getAttribute('data-hz')), r: e.getBoundingClientRect() }))
      .filter((x) => x.r.height < 44 || x.r.width < 44)
      .map((x) => `${x.k} ${Math.round(x.r.width)}×${Math.round(x.r.height)}`)))
  await ctx.close()
  assert(!small.length, small.slice(0, 3).join(' · '))
  return 'كل أهداف اللمس ≥ 44px في 6 خلايا POS'
})

await check('BR-AT-08', 'proof: dialog — focus lands on the safe action, Tab stays inside, Escape closes and returns focus, scroll restored', async () => {
  const { ctx, page } = await fresh('#/proof?visual=soft')
  const cell = page.locator('[data-proof-cell="soft/saas/ar"]')
  const opener = cell.getByRole('button', { name: 'حذف العميل' })
  await opener.focus()
  await page.keyboard.press('Enter')
  await page.waitForSelector("[data-hz='dialog'] [role='dialog']")
  const first = await page.evaluate(() => document.activeElement?.textContent)
  const scope = await page.evaluate(() => {
    const p = document.querySelector("[data-hz='dialog']").closest('[data-hz-portal]')
    return { dir: p?.getAttribute('dir'), radius: p?.style.getPropertyValue('--hz-component-dialog-radius'), overflow: getComputedStyle(document.body).overflow }
  })
  let escaped = 0
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    if (!(await page.evaluate(() => !!document.activeElement?.closest("[role='dialog']")))) escaped++
  }
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)
  const after = await page.evaluate(() => ({ open: !!document.querySelector("[data-hz='dialog']"), focus: document.activeElement?.textContent, overflow: getComputedStyle(document.body).overflow }))
  await ctx.close()
  assert(first === 'إلغاء', 'initial focus on ' + first)
  assert(scope.dir === 'rtl' && scope.radius && scope.overflow === 'hidden', JSON.stringify(scope))
  assert(escaped === 0, `focus left the dialog ${escaped} times`)
  assert(!after.open && after.focus === 'حذف العميل' && after.overflow !== 'hidden', JSON.stringify(after))
  return 'تركيز على «إلغاء» · 8 Tab داخله · Escape يغلق ويرجع للزر · التمرير رجع'
})

await check('BR-AT-09', 'proof: drawer opens on the inline-end edge — left in Arabic, right in English', async () => {
  const { ctx, page } = await fresh('#/proof?visual=quiet')
  const edges = {}
  for (const lang of ['ar', 'en']) {
    const cell = page.locator(`[data-proof-cell="quiet/saas/${lang}"]`)
    await cell.locator('[data-proof-overlays] button').nth(3).click()
    await page.waitForSelector("[data-hz='drawer'] [role='dialog']")
    await page.waitForTimeout(250)
    edges[lang] = await page.evaluate(() => {
      const r = document.querySelector("[data-hz='drawer'] [role='dialog']").getBoundingClientRect()
      return { left: Math.round(r.left), right: Math.round(window.innerWidth - r.right) }
    })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
  }
  await ctx.close()
  assert(edges.ar.left <= 1 && edges.ar.right > 100, 'ar ' + JSON.stringify(edges.ar))
  assert(edges.en.right <= 1 && edges.en.left > 100, 'en ' + JSON.stringify(edges.en))
  return 'ar: الحافة اليسرى · en: الحافة اليمنى'
})

await check('BR-AT-10', 'proof: popover aligns to the trigger start and returns focus on Escape; tooltip shows on keyboard focus', async () => {
  const { ctx, page } = await fresh('#/proof?visual=quiet')
  const res = {}
  for (const lang of ['ar', 'en']) {
    const cell = page.locator(`[data-proof-cell="quiet/saas/${lang}"]`)
    const trigger = cell.locator('[data-proof-overlays] button').nth(1)
    await trigger.click()
    await page.waitForSelector("[data-hz='popover'][role='dialog']")
    const t = await trigger.boundingBox()
    const p = await page.locator("[data-hz='popover'][role='dialog']").boundingBox()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
    const back = await page.evaluate(() => document.activeElement?.closest("[data-slot='trigger']") !== null || document.activeElement?.getAttribute('aria-haspopup') !== null)
    res[lang] = { startAligned: lang === 'ar' ? Math.abs(t.x + t.width - (p.x + p.width)) < 2 : Math.abs(t.x - p.x) < 2, below: p.y >= t.y + t.height, back }
  }
  const help = page.locator('[data-proof-cell="quiet/saas/ar"] [data-proof-overlays] button').first()
  await help.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await page.waitForTimeout(150)
  const tip = await page.evaluate(() => {
    const el = document.activeElement
    const id = el?.getAttribute('aria-describedby')
    const t = id && document.getElementById(id.split(' ')[0])
    return t ? { role: t.getAttribute('role'), text: t.textContent } : null
  })
  await ctx.close()
  for (const l of ['ar', 'en']) assert(res[l].startAligned && res[l].below && res[l].back, l + ' ' + JSON.stringify(res[l]))
  assert(tip?.role === 'tooltip', 'tooltip ' + JSON.stringify(tip))
  return 'ar: محاذاة يمين · en: محاذاة يسار · Escape يرجع للزر · التلميح بالكيبورد'
})

const run = {
  tool: `Playwright (playwright-core ${pwVersion})`,
  environment: `Chromium ${browser.version()} headless · ${process.platform} · 1280×900 و390×844 · reduced motion`,
  startedAt,
  results,
}
await browser.close()
if (!ONLY) fs.writeFileSync('src/knowledge/evidence/browser-run.json', JSON.stringify(run, null, 2) + '\n')
for (const r of results) console.log(r.status.padEnd(7), r.id, r.detail ?? '')
