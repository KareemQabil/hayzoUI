import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { ANTD_COMPONENTS, ANTD_ECOSYSTEM, paritySummary } from './antd'
import type { ParityComponent, ParityStatus } from './types'

const ROOT = process.cwd()
const allFeatures = ANTD_COMPONENTS.flatMap((c) => c.features.map((f) => ({ c, f })))
const STATUSES: ParityStatus[] = ['missing', 'partial', 'parity', 'better']

/** All source text that can define an evidence ID: tests, fixtures, knowledge, browser checks. Excludes this folder. */
function repoText(): string {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || p === path.join(ROOT, 'src', 'atomic', 'parity')) continue
        walk(p)
      } else if (/\.(ts|tsx|mjs|js|json)$/.test(entry.name)) out.push(fs.readFileSync(p, 'utf8'))
    }
  }
  walk(path.join(ROOT, 'src'))
  out.push(fs.readFileSync(path.join(ROOT, 'scripts', 'browser-checks.mjs'), 'utf8'))
  return out.join('\n')
}

describe('Ant Design parity matrix', () => {
  test('PM-01 component ids are unique kebab-case and AntD names are unique', () => {
    const ids = ANTD_COMPONENTS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/)
    const names = ANTD_COMPONENTS.map((c) => c.antd)
    expect(new Set(names).size).toBe(names.length)
  })

  test('PM-02 feature ids are unique across the matrix and prefixed by their component', () => {
    const ids = allFeatures.map(({ f }) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const { c, f } of allFeatures) expect(f.id.startsWith(c.id + '.')).toBe(true)
  })

  test('PM-03 every feature has an English name and an Arabic name', () => {
    for (const { f } of allFeatures) {
      expect(f.name.trim(), f.id).not.toBe('')
      expect(f.nameAr, f.id).toMatch(/[؀-ۿ]/)
    }
    for (const e of ANTD_ECOSYSTEM) expect(e.nameAr, e.id).toMatch(/[؀-ۿ]/)
  })

  test('PM-04 docs URLs are well-formed AntD component links', () => {
    for (const c of ANTD_COMPONENTS) expect(c.docs, c.id).toMatch(/^https:\/\/ant\.design\/components\/[a-z]+(-[a-z]+)*$/)
    for (const e of ANTD_ECOSYSTEM) expect(() => new URL(e.url), e.id).not.toThrow()
  })

  test('PM-05 covers at least 65 AntD v5 components, every category, and Table has at least 35 features', () => {
    expect(ANTD_COMPONENTS.length).toBeGreaterThanOrEqual(65)
    const cats = new Set(ANTD_COMPONENTS.map((c) => c.category))
    for (const cat of ['general', 'layout', 'navigation', 'data-entry', 'data-display', 'feedback', 'other']) expect(cats.has(cat as ParityComponent['category'])).toBe(true)
    expect(ANTD_COMPONENTS.find((c) => c.id === 'table')!.features.length).toBeGreaterThanOrEqual(35)
    for (const c of ANTD_COMPONENTS) expect(c.features.length, c.id).toBeGreaterThan(0)
  })

  test('PM-06 status and track agree: implemented rows name a track, missing rows have none', () => {
    const rows = [...ANTD_COMPONENTS, ...allFeatures.map(({ f }) => f), ...ANTD_ECOSYSTEM]
    for (const r of rows) {
      expect(STATUSES).toContain(r.status)
      if (r.status === 'missing') expect(r.track, r.id).toBe('none')
      else expect(r.track, r.id).not.toBe('none')
    }
    // A component marked missing cannot hide implemented features.
    for (const c of ANTD_COMPONENTS) if (c.status === 'missing') expect(c.features.every((f) => f.status === 'missing'), c.id).toBe(true)
  })

  test("PM-07 every 'better' row states its Arabic edge and has evidence", () => {
    const better = [...allFeatures.map(({ f }) => f), ...ANTD_ECOSYSTEM].filter((r) => r.status === 'better')
    expect(better.length).toBeGreaterThan(0)
    for (const r of better) {
      expect(r.arabicEdge?.trim(), r.id).toBeTruthy()
      expect(r.evidence?.length ?? 0, r.id).toBeGreaterThan(0)
    }
  })

  test('PM-08 every evidence ID referenced exists somewhere in the repo', () => {
    const text = repoText()
    const ids = new Set([...allFeatures.flatMap(({ f }) => f.evidence ?? []), ...ANTD_ECOSYSTEM.flatMap((e) => e.evidence ?? [])])
    expect(ids.size).toBeGreaterThan(0)
    const missing = [...ids].filter((id) => !new RegExp(`(?<![A-Z0-9-])${id.replace(/[-]/g, '\\-')}(?![0-9])`).test(text))
    expect(missing).toEqual([])
  })

  test('PM-09 summary math is consistent with the data', () => {
    const s = paritySummary()
    const sum = (o: Record<ParityStatus, number>) => STATUSES.reduce((n, k) => n + o[k], 0)
    expect(s.components.total).toBe(ANTD_COMPONENTS.length)
    expect(sum(s.components.byStatus)).toBe(s.components.total)
    expect(s.features.total).toBe(allFeatures.length)
    expect(sum(s.features.byStatus)).toBe(s.features.total)
    expect(s.components.covered).toBe(ANTD_COMPONENTS.filter((c) => c.status !== 'missing').length)
    expect(s.components.coveredPercent).toBeCloseTo((100 * s.components.covered) / s.components.total, 1)
    const table = ANTD_COMPONENTS.find((c) => c.id === 'table')!
    expect(s.table.total).toBe(table.features.length)
    expect(s.table.covered).toBe(table.features.filter((f) => f.status !== 'missing').length)
    expect(s.arabicAdvantages).toBe(allFeatures.filter(({ f }) => f.status === 'better').length + ANTD_ECOSYSTEM.filter((e) => e.status === 'better').length)
    expect(sum(s.ecosystem.byStatus)).toBe(ANTD_ECOSYSTEM.length)
  })

  test('PM-10 paritySummary is pure: same input, same output, input untouched', () => {
    const before = JSON.stringify(ANTD_COMPONENTS)
    expect(paritySummary()).toEqual(paritySummary())
    expect(JSON.stringify(ANTD_COMPONENTS)).toBe(before)
    const empty = paritySummary([], [])
    expect(empty.components.coveredPercent).toBe(0)
    expect(empty.table.total).toBe(0)
  })

  test('PM-11 the ecosystem list names the items that decide adoption beyond components', () => {
    const ids = ANTD_ECOSYSTEM.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ['pro-table', 'pro-form', 'pro-layout', 'pro-list', 'pro-descriptions', 'antv-charts', 'pro-templates', 'antd-mobile', 'ant-design-x', 'icons', 'theme-editor', 'docs-site', 'figma-kit']) expect(ids).toContain(id)
  })

  test('PM-12 adoption-critical components carry detailed checklists', () => {
    const min: Record<string, number> = { table: 35, form: 20, select: 15, 'date-picker': 15, menu: 12, tree: 12, upload: 12, modal: 12, tabs: 12, input: 12, 'input-number': 12, cascader: 10, 'tree-select': 10 }
    for (const [id, n] of Object.entries(min)) expect(ANTD_COMPONENTS.find((c) => c.id === id)?.features.length ?? 0, id).toBeGreaterThanOrEqual(n)
  })
})
