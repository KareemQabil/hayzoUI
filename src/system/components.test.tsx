// @vitest-environment jsdom
/**
 * Component invariants referenced by spec/components/*.json (CMP-xx). Each test is one invariant;
 * the spec gate (SP-05) fails if a spec links an id that is not defined here or elsewhere.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { LocaleProvider } from './locale'
import { PhoneInput } from './components/phone-input'
import { TextField } from './components/field'
import { SearchField } from './components/search-field'
import { Select } from './components/select'
import { SegmentedControl, Switch } from './components/choice'
import { Tabs } from './components/tabs'
import { ToastProvider, useToast, type ToastProps } from './components/feedback'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
const rtl = (ui: React.ReactNode, dir: 'rtl' | 'ltr' = 'rtl') => render(<LocaleProvider dir={dir} lang={dir === 'rtl' ? 'ar' : 'en'}>{ui}</LocaleProvider>)

describe('components', () => {
  test('CMP-01 TextField reports null, not "", when the text is cleared', () => {
    const spy = vi.fn()
    rtl(<TextField label="اسم العميل" onValueChange={spy} />)
    const input = screen.getByLabelText(/اسم العميل/) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'أحمد' } })
    fireEvent.change(input, { target: { value: '' } })
    expect(spy.mock.calls.map((c) => c[0])).toEqual(['أحمد', null])
  })

  test('CMP-02 empty TextField follows the UI direction; typed text resolves automatically', () => {
    rtl(<TextField label="الاسم" />)
    const input = screen.getByLabelText(/الاسم/) as HTMLInputElement
    expect(input.dir).toBe('rtl')
    fireEvent.change(input, { target: { value: 'Khaled' } })
    expect(input.dir).toBe('auto')
  })

  test('CMP-03 first Escape clears the search (null) and does not reach the parent', () => {
    const spy = vi.fn()
    const parent = vi.fn()
    rtl(
      <div onKeyDown={parent}>
        <SearchField label="بحث" defaultValue="احمد" onValueChange={spy} />
      </div>,
    )
    const input = screen.getByRole('searchbox') as HTMLInputElement
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(spy).toHaveBeenLastCalledWith(null, undefined)
    expect(input.value).toBe('')
    expect(parent).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(parent).toHaveBeenCalledTimes(1)
  })

  test('CMP-04 uncontrolled PhoneInput keeps typed text and reports E.164', () => {
    const spy = vi.fn()
    rtl(<PhoneInput label="رقم المحمول" onValueChange={spy} />)
    const input = screen.getByLabelText(/رقم المحمول/) as HTMLInputElement
    fireEvent.change(input, { target: { value: '٠١٠١٢٣٤٥٦٧٨' } })
    expect(input.value).toBe('٠١٠١٢٣٤٥٦٧٨')
    expect(spy.mock.calls.at(-1)?.[0]).toBe('+201012345678')
  })

  test('CMP-05 uncontrolled Select starts at the first option and follows the selection', () => {
    const spy = vi.fn()
    rtl(<Select label="المنطقة" options={[{ value: 'cairo', label: 'القاهرة' }, { value: 'giza', label: 'الجيزة' }]} onValueChange={spy} />)
    const select = screen.getByLabelText(/المنطقة/) as HTMLSelectElement
    expect(select.value).toBe('cairo')
    fireEvent.change(select, { target: { value: 'giza' } })
    expect(select.value).toBe('giza')
    expect(spy).toHaveBeenCalledWith('giza', undefined)
  })

  test('CMP-06 SegmentedControl arrows follow the visual direction and skip disabled options', () => {
    const options = [{ value: 'a', label: 'أ' }, { value: 'b', label: 'ب', disabled: true }, { value: 'c', label: 'ج' }]
    for (const [dir, nextKey] of [['rtl', 'ArrowLeft'], ['ltr', 'ArrowRight']] as const) {
      const spy = vi.fn()
      const { unmount } = rtl(<SegmentedControl label="الفترة" options={options} onValueChange={spy} />, dir)
      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: nextKey })
      expect(spy, dir).toHaveBeenLastCalledWith('c', undefined)
      expect(screen.getByRole('radio', { name: 'ج' }).getAttribute('aria-checked')).toBe('true')
      unmount()
    }
  })

  test('CMP-07 uncontrolled Switch toggles and reports the new state', () => {
    const spy = vi.fn()
    rtl(<Switch label="إشعارات" onCheckedChange={spy} />)
    const sw = screen.getByRole('switch')
    fireEvent.click(sw)
    fireEvent.click(sw)
    expect(spy.mock.calls.map((c) => c[0])).toEqual([true, false])
    expect(sw.getAttribute('aria-checked')).toBe('false')
  })

  test('CMP-08 Tabs: ArrowLeft is next in RTL; only the selected tab has data-selected', () => {
    rtl(<Tabs idBase="t" label="أقسام" items={[{ value: 'a', label: 'التحصيلات' }, { value: 'b', label: 'الفواتير' }]} />)
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' })
    const [a, b] = screen.getAllByRole('tab')
    expect(b.getAttribute('aria-selected')).toBe('true')
    expect(b.hasAttribute('data-selected')).toBe(true)
    expect(a.hasAttribute('data-selected')).toBe(false)
    expect(a.getAttribute('data-state')).toBeNull()
  })

  function Pusher({ t }: { t: ToastProps }) {
    const toast = useToast()
    return <button onClick={() => toast(t)}>push</button>
  }
  const stack = () => document.querySelector('.ax-toasts') as HTMLElement

  test('CMP-09 the toast stack takes dir and lang from the LocaleProvider', () => {
    rtl(
      <ToastProvider>
        <Pusher t={{ tone: 'success', title: 'Saved' }} />
      </ToastProvider>,
      'ltr',
    )
    expect(stack().dir).toBe('ltr')
    expect(stack().lang).toBe('en')
  })

  test('CMP-10 toast timers pause on hover and errors never auto-dismiss', () => {
    vi.useFakeTimers()
    rtl(
      <ToastProvider>
        <Pusher t={{ tone: 'success', title: 'حُفظ' }} />
      </ToastProvider>,
    )
    const push = screen.getByText('push')
    fireEvent.click(push)
    act(() => vi.advanceTimersByTime(3000))
    fireEvent.pointerEnter(stack())
    act(() => vi.advanceTimersByTime(20000))
    expect(screen.queryByText('حُفظ')).not.toBeNull()
    fireEvent.pointerLeave(stack())
    act(() => vi.advanceTimersByTime(3100))
    expect(screen.queryByText('حُفظ')).toBeNull()
    cleanup()
    rtl(
      <ToastProvider>
        <Pusher t={{ tone: 'danger', title: 'تعذّر الحفظ' }} />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('push'))
    act(() => vi.advanceTimersByTime(60000))
    expect(screen.queryByText('تعذّر الحفظ')).not.toBeNull()
  })
})
