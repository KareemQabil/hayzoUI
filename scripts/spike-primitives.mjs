// Primitive spike checks: the same integration invariants against React Aria, Base UI and Radix.
// Usage: node scripts/spike-primitives.mjs [baseUrl]  → writes spikes/primitives/results.json
import fs from 'node:fs'
import zlib from 'node:zlib'
import { execSync } from 'node:child_process'
import { chromium } from 'playwright-core'
import { chromiumPath } from './chromium.mjs'

const base = process.argv[2] ?? 'http://localhost:5179/'
const LIBS = ['react-aria', 'base-ui', 'radix']
const browser = await chromium.launch({ executablePath: chromiumPath() })
const results = []

async function fresh(lib, dir = 'rtl') {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(`${base}spikes/primitives/?lib=${lib}&dir=${dir}`, { waitUntil: 'networkidle' })
  await page.getByTestId('lib').waitFor()
  return { ctx, page }
}
async function check(lib, id, name, fn) {
  let r
  try {
    const detail = await fn()
    r = { lib, id, name, status: detail === 'n/a' ? 'n/a' : 'passed', detail }
  } catch (e) {
    r = { lib, id, name, status: 'failed', detail: String(e.message ?? e).split('\n')[0].slice(0, 200) }
  }
  results.push(r)
  console.log(`${r.status.padEnd(7)} ${lib.padEnd(10)} ${id} ${name}${r.detail && r.status !== 'passed' ? ` — ${r.detail}` : ''}`)
}
const assert = (c, m) => { if (!c) throw new Error(m) }
const dialog = (page) => page.getByTestId('dialog')
const isOpen = async (page) => (await dialog(page).count()) > 0 && (await dialog(page).isVisible())
const focusInDialog = (page) => page.evaluate(() => !!document.activeElement?.closest('[data-testid="dialog"]'))
const amount = (page) => page.getByLabel(/^المبلغ المستلم/)
async function openDialog(page) {
  await page.getByTestId('open').click()
  await dialog(page).waitFor({ state: 'visible' })
  await page.waitForTimeout(100)
}

for (const lib of LIBS) {
  await check(lib, 'D1', 'focus moves into the dialog on open', async () => {
    const { ctx, page } = await fresh(lib)
    await openDialog(page)
    assert(await focusInDialog(page), 'focus outside dialog')
    await ctx.close()
  })
  await check(lib, 'D2', 'Tab and Shift+Tab stay inside the dialog (12 presses)', async () => {
    const { ctx, page } = await fresh(lib)
    await openDialog(page)
    // Some traps use focus-guard sentinels that redirect asynchronously; allow 50 ms to settle and record it.
    let asyncRedirects = 0
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(i % 3 === 2 ? 'Shift+Tab' : 'Tab')
      if (!(await focusInDialog(page))) {
        asyncRedirects++
        await page.waitForTimeout(50)
        assert(await focusInDialog(page), `focus escaped after press ${i + 1}`)
      }
    }
    await ctx.close()
    return asyncRedirects ? `${asyncRedirects} async guard redirects (settled < 50 ms)` : 'synchronous'
  })
  await check(lib, 'D3', 'Escape in a field with a changed draft reverts it and keeps the dialog open', async () => {
    const { ctx, page } = await fresh(lib)
    await openDialog(page)
    await amount(page).click()
    await page.keyboard.type('1234,50')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
    const open = await isOpen(page)
    const value = open ? await amount(page).inputValue() : '(dialog closed)'
    await ctx.close()
    assert(open, 'dialog closed: the library handled Escape before the field could stop it')
    assert(value === '', `draft not reverted: "${value}"`)
    return 'open, draft reverted'
  })
  await check(lib, 'D4', 'Escape with no draft closes and returns focus to the trigger', async () => {
    const { ctx, page } = await fresh(lib)
    await openDialog(page)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    assert(!(await isOpen(page)), 'still open')
    const onTrigger = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    await ctx.close()
    assert(onTrigger === 'open', `focus on ${onTrigger}`)
  })
  await check(lib, 'D5', 'dialog role, accessible name from the title, background inert or aria-modal', async () => {
    const { ctx, page } = await fresh(lib)
    await openDialog(page)
    const info = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]')
      const labelId = d?.getAttribute('aria-labelledby')
      const name = labelId ? document.getElementById(labelId)?.textContent : d?.getAttribute('aria-label')
      const trigger = document.querySelector('[data-testid="open"]')
      const hidden = !!trigger?.closest('[aria-hidden="true"], [inert]')
      return { role: !!d, name, modal: d?.getAttribute('aria-modal'), hidden }
    })
    await ctx.close()
    assert(info.role, 'no role=dialog')
    assert(info.name === 'تحصيل مبلغ', `name: ${info.name}`)
    assert(info.modal === 'true' || info.hidden, 'background neither inert nor aria-modal')
    return `aria-modal=${info.modal} · background hidden=${info.hidden}`
  })
  await check(lib, 'D6', 'page scroll is locked while open', async () => {
    const { ctx, page } = await fresh(lib)
    await openDialog(page)
    await page.mouse.move(20, 20)
    await page.mouse.wheel(0, 600)
    await page.waitForTimeout(200)
    const y = await page.evaluate(() => window.scrollY)
    await ctx.close()
    assert(y === 0, `scrolled to ${y}`)
  })

  if (lib === 'radix') {
    for (const id of ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']) await check(lib, id, 'combobox', async () => 'n/a')
    continue
  }
  const combo = (page) => page.getByTestId('combo-input')
  const options = (page) => page.locator('[role="option"]:visible')
  await check(lib, 'C1', 'custom filter: «احمد» finds «أحمد Khaled» (hamza-tolerant L2 search)', async () => {
    const { ctx, page } = await fresh(lib)
    await combo(page).click()
    await page.keyboard.type('احمد')
    await page.waitForTimeout(250)
    const texts = await options(page).allInnerTexts()
    await ctx.close()
    assert(texts.length === 1 && texts[0].trim() === 'أحمد Khaled', `options: ${JSON.stringify(texts)}`)
  })
  await check(lib, 'C2', 'custom filter: «محمد» finds «مُحَمَّد السيد» (diacritics)', async () => {
    const { ctx, page } = await fresh(lib)
    await combo(page).click()
    await page.keyboard.type('محمد')
    await page.waitForTimeout(250)
    const texts = await options(page).allInnerTexts()
    await ctx.close()
    assert(texts.some((t) => t.includes('مُحَمَّد')), `options: ${JSON.stringify(texts)}`)
  })
  await check(lib, 'C3', 'ArrowDown highlights an option via aria-activedescendant; focus stays in the input', async () => {
    const { ctx, page } = await fresh(lib)
    await combo(page).click()
    await page.keyboard.type('س')
    await page.waitForTimeout(200)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(150)
    const info = await page.evaluate(() => {
      const el = document.activeElement
      const id = el?.getAttribute('aria-activedescendant')
      return { tag: el?.tagName, role: el?.getAttribute('role'), active: id ? document.getElementById(id)?.textContent : null }
    })
    await ctx.close()
    assert(info.tag === 'INPUT', `focus on ${info.tag}`)
    assert(info.active, 'no aria-activedescendant target')
    return `role=${info.role} · active=${info.active}`
  })
  await check(lib, 'C4', 'Enter selects: input shows the option text and the popup closes', async () => {
    const { ctx, page } = await fresh(lib)
    await combo(page).click()
    await page.keyboard.type('احمد')
    await page.waitForTimeout(200)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(250)
    const value = await combo(page).inputValue()
    const visible = await options(page).count()
    await ctx.close()
    assert(value === 'أحمد Khaled', `value: ${value}`)
    assert(visible === 0, 'popup still open')
  })
  for (const dir of ['rtl', 'ltr']) {
    await check(lib, dir === 'rtl' ? 'C5' : 'C5-ltr', `popup aligns with the input's inline-start edge (${dir})`, async () => {
      const { ctx, page } = await fresh(lib, dir)
      await combo(page).click()
      await page.keyboard.type(dir === 'rtl' ? 'ا' : 'O')
      await page.waitForTimeout(250)
      const r = await page.evaluate(() => {
        const i = document.querySelector('[data-testid="combo-input"]').getBoundingClientRect()
        const p = document.querySelector('[data-testid="popup"]')?.getBoundingClientRect()
        return p ? { il: i.left, ir: i.right, pl: p.left, pr: p.right } : null
      })
      await ctx.close()
      assert(r, 'popup not found')
      const delta = dir === 'rtl' ? Math.abs(r.ir - r.pr) : Math.abs(r.il - r.pl)
      assert(delta <= 2, `edge offset ${delta.toFixed(1)}px`)
      return `offset ${delta.toFixed(1)}px`
    })
  }
  await check(lib, 'C6', 'Escape closes the popup and keeps focus in the input', async () => {
    const { ctx, page } = await fresh(lib)
    await combo(page).click()
    await page.keyboard.type('س')
    await page.waitForTimeout(200)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
    const visible = await options(page).count()
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    await ctx.close()
    assert(visible === 0, 'popup still open')
    assert(focused === 'combo-input', `focus on ${focused}`)
  })
}
await browser.close()

// Bundle cost of exactly the parts used (minified + gzip, React external). Indicative, not a benchmark.
const ENTRIES = {
  'react-aria': "export { DialogTrigger, ModalOverlay, Modal, Dialog, Heading, Button, ComboBox, Input, Label, Popover, ListBox, ListBoxItem, I18nProvider } from 'react-aria-components'",
  'base-ui': "export { Dialog } from '@base-ui/react/dialog'; export { Combobox } from '@base-ui/react/combobox'; export { DirectionProvider } from '@base-ui/react/direction-provider'",
  radix: "export { Dialog, Direction } from 'radix-ui'",
}
const sizes = {}
for (const [lib, code] of Object.entries(ENTRIES)) {
  const out = execSync('npx -y esbuild@0.25.12 --bundle --minify --format=esm --external:react --external:react-dom --external:react/jsx-runtime --log-level=error', { input: code, maxBuffer: 64 * 1024 * 1024 })
  sizes[lib] = { minKB: +(out.length / 1024).toFixed(1), gzipKB: +(zlib.gzipSync(out).length / 1024).toFixed(1) }
}
console.log('bundle (used parts):', JSON.stringify(sizes))

const versions = Object.fromEntries(
  [['react-aria', 'react-aria-components'], ['base-ui', '@base-ui/react'], ['radix', 'radix-ui']].map(([k, p]) => [k, JSON.parse(fs.readFileSync(`node_modules/${p}/package.json`, 'utf8')).version]),
)
fs.writeFileSync('spikes/primitives/results.json', JSON.stringify({ ranAt: new Date().toISOString(), environment: `Chrome headless · ${process.platform}`, versions, sizes, results }, null, 2) + '\n')
