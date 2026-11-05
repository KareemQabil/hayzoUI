/**
 * Matrix renderers: how each spec state and content variant becomes real props on a real component.
 * The matrix page renders spec.states × spec.content from these; a missing case is shown as a
 * visible gap (data-matrix-missing) and fails the browser check, so specs and renderers cannot drift.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import type { DisplayNumerals } from '../arabic'
import { CurrencyInput, type CurrencyInputHandle } from '../system'

export interface MatrixCase {
  state: string
  content: string
}

export interface MatrixRenderer {
  /** Display numerals a content variant needs (e.g. arabic-digits). Default: the page setting. */
  numerals?: (content: string) => DisplayNumerals | undefined
  /** Returns null when the state or content variant has no renderer yet. */
  render: (c: MatrixCase) => ReactNode | null
}

/** Applies a draft after mount, the way a person would type it, to reach states props cannot express. */
function WithDraft({ draft, children }: { draft: string; children: (ref: React.RefObject<CurrencyInputHandle | null>) => ReactNode }) {
  const ref = useRef<CurrencyInputHandle>(null)
  useEffect(() => {
    ref.current?.setDraft(draft)
  }, [draft])
  return <>{children(ref)}</>
}

const CURRENCY_CONTENT: Record<string, { label: string; value: number | null; helper?: string }> = {
  short: { label: 'المبلغ', value: 5000 },
  'arabic-digits': { label: 'المبلغ المستلم', value: 123450 },
  overflow: { label: 'المبلغ المستلم', value: 99999999999999 },
  'long-arabic': {
    label: 'المبلغ المستلم من العميل عن فاتورة توريد الأدوات المكتبية لشهر جمادى الأولى',
    value: 123450,
    helper: 'يُسجَّل المبلغ في دفتر العميل ويظهر في كشف الحساب الشهري المرسل إلى البريد المسجل.',
  },
}

export const RENDERERS: Record<string, MatrixRenderer> = {
  'currency-input': {
    numerals: (content) => (content === 'arabic-digits' ? 'arab' : undefined),
    render: ({ state, content }) => {
      const c = CURRENCY_CONTENT[content]
      if (!c) return null
      const common = { label: c.label, helper: c.helper, currency: 'EGP' as const }
      switch (state) {
        case 'default':
          return <CurrencyInput {...common} defaultValue={c.value} />
        case 'hover':
          return <CurrencyInput {...common} defaultValue={c.value} forceState="hover" />
        case 'focus-visible':
          return <CurrencyInput {...common} defaultValue={c.value} forceState="focus-visible" />
        case 'empty':
          return <CurrencyInput {...common} defaultValue={null} />
        case 'invalid':
          return <WithDraft draft="1234,50">{(ref) => <CurrencyInput ref={ref} {...common} />}</WithDraft>
        case 'disabled':
          return <CurrencyInput {...common} defaultValue={c.value} disabled />
        case 'readonly':
          return <CurrencyInput {...common} defaultValue={c.value} readOnly />
        case 'required':
          return <CurrencyInput {...common} defaultValue={null} showValidation />
        default:
          return null
      }
    },
  },
}
