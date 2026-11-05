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
