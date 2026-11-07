// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProgressPage } from './ProgressPage'
import { downloadJson } from '../app/ui'

vi.mock('../app/ui', () => ({ downloadJson: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks() })

test('an incompatible density blocks export until the experience is reset', () => {
  render(<ProgressPage />)
  const exportButton = screen.getByRole('button', { name: 'تنزيل خطة التجربة ↓' }) as HTMLButtonElement
  expect(exportButton.disabled).toBe(false)
  fireEvent.change(screen.getByRole('combobox', { name: 'كثافة الواجهة' }), { target: { value: 'compact' } })
  expect(screen.getByRole('alert').textContent).toContain('unsupported-density')
  expect(exportButton.disabled).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'إعادة الضبط' }))
  expect(screen.queryByRole('alert')).toBe(null)
  expect(exportButton.disabled).toBe(false)
})

test('direction overrides preserve the selected locale instead of inferring a new language', () => {
  const { container } = render(<ProgressPage />)
  fireEvent.change(screen.getByRole('combobox', { name: 'اتجاه الواجهة' }), { target: { value: 'ltr' } })
  expect(container.querySelector('[data-context-value="direction"]')?.textContent).toBe('ltr')
  expect(container.querySelector('[data-context-value="locale"]')?.textContent).toBe('ar-SA')
})

test('switching to CRM exports the actual English/default experience plan', () => {
  const { container } = render(<ProgressPage />)
  fireEvent.change(screen.getByRole('combobox', { name: 'ملف التجربة' }), { target: { value: 'crm' } })
  expect(container.querySelector('[data-context-value="locale"]')?.textContent).toBe('en-US')
  expect(container.querySelector('[data-context-value="density"]')?.textContent).toBe('default')
  fireEvent.click(screen.getByRole('button', { name: 'تنزيل خطة التجربة ↓' }))
  expect(downloadJson).toHaveBeenCalledWith('hayzoui-experience-plan.json', expect.objectContaining({
    profile: { id: 'english-crm-default', version: '0.1.0' },
    context: expect.objectContaining({ locale: 'en-US', direction: 'ltr', density: 'default' }),
  }))
})
