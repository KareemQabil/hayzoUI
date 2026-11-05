import type { CurrencyCode, DisplayNumerals } from '../../../arabic'
import type { Dir, Size } from '../../../system'
import type { Density, Mode } from '../../../tokens/theme'

export type LabState = 'interactive' | 'empty' | 'filled' | 'invalid' | 'required' | 'hover' | 'focus-visible' | 'disabled' | 'readonly'

export interface LabSettings {
  state: LabState
  size: Size
  density: Density
  dir: Dir
  numerals: DisplayNumerals
  mode: Mode
  currency: CurrencyCode
  currencyDisplay: 'symbol' | 'code' | 'none'
  optional: boolean
  allowNegative: boolean
  range: 'none' | 'payment'
  validateOn: 'blur' | 'change'
  label: 'short' | 'long' | 'english'
}

export const LABELS = {
  short: 'المبلغ المستلم',
  long: 'المبلغ المستلم من العميل نقدًا أو بتحويل بنكي، شاملًا رسوم الخدمة المتفق عليها',
  english: 'Amount received',
}

export const HELPER = {
  rtl: 'اكتب بالأرقام العربية أو اللاتينية. استخدم «.» أو «٫» للكسور.',
  ltr: 'Latin or Arabic-Indic digits are accepted. Use "." for decimals.',
}

export const PAYMENT_RANGE = { min: 100, max: 5000000 }

export function stateDraft(state: LabState): string | null {
  switch (state) {
    case 'filled':
    case 'disabled':
    case 'readonly':
    case 'hover':
      return '1234.5'
    case 'invalid':
      return '1234,50'
    case 'empty':
    case 'focus-visible':
    case 'required':
      return ''
    default:
      return null
  }
}

export function generateCode(s: LabSettings): string {
  const minorBounds = s.range === 'payment' ? `\n    min={${PAYMENT_RANGE.min}}\n    max={${PAYMENT_RANGE.max}}` : ''
  const attrs = [
    `label="${LABELS[s.label]}"`,
    s.currency !== 'EGP' && `currency="${s.currency}"`,
    s.currencyDisplay !== 'symbol' && `currencyDisplay="${s.currencyDisplay}"`,
    s.size !== 'md' && `size="${s.size}"`,
    s.optional && 'optional',
    s.allowNegative && 'allowNegative',
    s.validateOn !== 'blur' && `validateOn="${s.validateOn}"`,
    s.state === 'disabled' && 'disabled',
    s.state === 'readonly' && 'readOnly',
  ].filter(Boolean) as string[]
  return `import { useState } from 'react'
import { CurrencyInput, LocaleProvider } from '@/system'

export function AmountField() {
  // Minor units (${s.currency === 'KWD' ? 'fils' : s.currency === 'SAR' ? 'halalas' : 'piasters'}); null = empty
  const [amount, setAmount] = useState<number | null>(null)

  return (
    <LocaleProvider dir="${s.dir}" numerals="${s.numerals}">
      <CurrencyInput
        ${attrs.join('\n        ')}${minorBounds.replace(/\n    /g, '\n        ')}
        value={amount}
        onValueChange={(minor) => setAmount(minor)}
      />
    </LocaleProvider>
  )
}`
}
