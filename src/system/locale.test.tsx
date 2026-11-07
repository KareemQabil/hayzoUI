// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Digits, LocaleProvider } from './locale'

const shown = (text: string, numerals: 'latn' | 'arab') =>
  render(
    <LocaleProvider numerals={numerals}>
      <Digits>{text}</Digits>
    </LocaleProvider>,
  ).container.textContent

describe('Digits', () => {
  test('CT-02 static numbers follow the numerals and never keep an ASCII space between digit groups', () => {
    expect(shown('50 000', 'latn')).toBe('50 000')
    expect(shown('50 000', 'arab')).toBe('٥٠ ٠٠٠')
    // Spaces next to non-digits are left alone (a range dash, words).
    expect(shown('1 – 50', 'arab')).toBe('١ – ٥٠')
  })
})

describe('mixed-script alignment', () => {
  test('CT-03 the provider resolves mixedAlign to a side; AutoText takes its direction from the text', async () => {
    const { mixedAlignValue } = await import('./locale')
    const { AutoText } = await import('./components/text')
    expect(mixedAlignValue('rtl', 'ui')).toBe('right')
    expect(mixedAlignValue('ltr', 'ui')).toBe('left')
    expect(mixedAlignValue('rtl', 'content')).toBe('start')
    const { container } = render(
      <LocaleProvider dir="rtl" mixedAlign="content">
        <AutoText>Sara Haddad</AutoText>
      </LocaleProvider>,
    )
    const provider = container.firstElementChild as HTMLElement
    expect(provider.style.getPropertyValue('--ax-mixed-align')).toBe('start')
    expect(provider.querySelector('.ax-auto')?.getAttribute('dir')).toBe('auto')
  })
})

describe('numbers in prose', () => {
  test('CT-04 localizeNumbers follows the numerals, from either source system, and keeps Latin names and codes', async () => {
    const { localizeNumbers } = await import('../arabic')
    expect(localizeNumbers('آخر تحديث منذ 3 دقائق', 'arab')).toBe('آخر تحديث منذ ٣ دقائق')
    expect(localizeNumbers('آخر تحديث منذ ٣ دقائق', 'latn')).toBe('آخر تحديث منذ 3 دقائق')
    // Separators inside a number follow formatAmount: 1,234.50 ↔ ١ ٢٣٤٫٥٠.
    expect(localizeNumbers('مبلغ 1,234.50 ج.م', 'arab')).toBe('مبلغ ١\u202f٢٣٤٫٥٠ ج.م')
    expect(localizeNumbers('مبلغ ١٬٢٣٤٫٥٠ ج.م', 'latn')).toBe('مبلغ 1,234.50 ج.م')
    // Codes, units, colors, and numbers after a Latin word stay Latin.
    expect(localizeNumbers('الفاتورة INV-2026-0148 بعرض 390px واللون #284190', 'arab')).toBe('الفاتورة INV-2026-0148 بعرض 390px واللون #284190')
    expect(localizeNumbers('React 18 وVitest 5.1.0 — 12 حالة', 'arab')).toBe('React 18 وVitest 5.1.0 — ١٢ حالة')
    // Two digit groups never keep an ASCII space between them.
    expect(localizeNumbers('+20 10 1234', 'arab')).toBe('+٢٠\u202f١٠\u202f١٢٣٤')
  })

  test('CT-05 Prose keeps «…» literals as written and marks them for the numerals oracle', async () => {
    const { Prose, NumberText } = await import('./locale')
    const { container } = render(
      <LocaleProvider numerals="arab">
        <p id="a"><Prose>{'كتابة «1234,50» ثم 3 ضغطات Tab'}</Prose></p>
        <p id="b"><NumberText>{'87,500.00'}</NumberText></p>
      </LocaleProvider>,
    )
    expect(container.querySelector('#a')?.textContent).toBe('كتابة «1234,50» ثم ٣ ضغطات Tab')
    expect(container.querySelector('#a [data-verbatim]')?.textContent).toBe('«1234,50»')
    expect(container.querySelector('#b')?.textContent).toBe('٨٧\u202f٥٠٠٫٠٠')
    expect((container.firstElementChild as HTMLElement).dataset.numerals).toBe('arab')
  })
})
