// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LocaleProvider } from '../system'
import { ParityPage } from './ParityPage'
import { ANTD_COMPONENTS, paritySummary } from '../atomic/parity/antd'

afterEach(cleanup)

const renderPage = () => render(<LocaleProvider numerals="arab"><ParityPage /></LocaleProvider>)

test('PM-20 renders the headline and every AntD component (at least 65)', () => {
  const { container } = renderPage()
  expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Ant Design')
  const rows = container.querySelectorAll('[data-parity-component]')
  expect(rows.length).toBe(ANTD_COMPONENTS.length)
  expect(rows.length).toBeGreaterThanOrEqual(65)
})

test('PM-21 headline numbers are shown in Arabic-Indic digits under numerals="arab"', () => {
  const { container } = renderPage()
  const s = paritySummary()
  const stat = container.querySelector('[data-parity-stat="مكوّنات لها مقابل لدينا"]')!.textContent!
  const arab = (n: number) => String(n).replace(/[0-9]/g, (d) => String.fromCodePoint(0x0660 + Number(d)))
  expect(stat).toContain(arab(s.components.covered))
  expect(stat).toContain(arab(s.components.total))
  // Only identifiers keep Latin digits (R-NUM-004): «v5» after a Latin word.
  expect(stat.replace('Ant Design v5', '')).not.toMatch(/[0-9]/)
})

test('PM-22 status and category filters narrow the list', () => {
  const { container } = renderPage()
  fireEvent.click(screen.getByRole('radio', { name: 'جزئي' }))
  const partial = ANTD_COMPONENTS.filter((c) => c.status === 'partial').length
  expect(container.querySelectorAll('[data-parity-component]').length).toBe(partial)
  fireEvent.click(screen.getByRole('radio', { name: 'التخطيط' }))
  expect(container.querySelectorAll('[data-parity-component]').length).toBe(ANTD_COMPONENTS.filter((c) => c.status === 'partial' && c.category === 'layout').length)
})

test('PM-23 each component expands to its feature checklist', () => {
  const { container } = renderPage()
  const table = container.querySelector('[data-parity-component="table"]') as HTMLDetailsElement
  expect(table.querySelector('table')).not.toBe(null)
  const rows = table.querySelectorAll('tbody tr').length
  expect(rows).toBe(ANTD_COMPONENTS.find((c) => c.id === 'table')!.features.length)
})
