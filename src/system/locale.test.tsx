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
