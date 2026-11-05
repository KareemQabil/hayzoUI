import type { AmountParseResult, CurrencyCode, DisplayNumerals, ParseStep } from '../../../arabic'
import { CURRENCIES, formatAmount, toDisplayDigits } from '../../../arabic'
import { amountErrorMessage } from '../../../content/messages'
import { Badge } from '../../../system'

export function visibleInput(s: string): string {
  return s.replace(/\u200f/g, '⟨RLM⟩').replace(/\u200e/g, '⟨LRM⟩').replace(/\u061c/g, '⟨ALM⟩')
}

export function stepLabel(step: ParseStep, numerals: DisplayNumerals): string {
  const n = (x: number | undefined) => toDisplayDigits(String(x ?? 0), numerals)
  switch (step.kind) {
    case 'bidi':
      return `أُزيلت ${n(step.count)} علامة اتجاه خفية (لا تحمل قيمة)`
    case 'trim':
      return 'أُزيلت المسافات في الطرفين'
    case 'digits':
      return step.detail === 'arab' ? `حُوّل ${n(step.count)} رقمًا مشرقيًا (٠-٩) إلى لاتيني` : `حُوّل ${n(step.count)} رقمًا فارسيًا (۰-۹) إلى لاتيني`
    case 'decimal':
      return step.detail === 'arabic' ? 'فُسّرت «٫» فاصلةً عشرية' : 'فُسّرت «.» فاصلةً عشرية'
    case 'grouping':
      return `أُزيل ${n(step.count)} فاصل آلاف في موضع صحيح`
    case 'sign':
      return 'قُرئت علامة السالب'
  }
}

export function StatusBadge({ result }: { result: AmountParseResult }) {
  if (result.status === 'valid') return <Badge tone="success" dot>صالح</Badge>
  if (result.status === 'empty') return <Badge tone="neutral" dot>فارغ</Badge>
  return (
    <Badge tone="danger" dot>
      مرفوض · <bdi dir="ltr" className="ax-mono">{result.error?.code}</bdi>
    </Badge>
  )
}

/** Input, storage, canonical and display contracts side by side. */
export function ContractStrip({ result, currency, numerals, compact = false }: { result: AmountParseResult; currency: CurrencyCode; numerals: DisplayNumerals; compact?: boolean }) {
  const def = CURRENCIES[currency]
  const cells: Array<{ k: string; sub: string; v: string; mono?: boolean; muted?: boolean }> = [
    { k: 'الإدخال', sub: 'ما كُتب حرفيًا', v: result.input === '' ? '""' : visibleInput(result.input), mono: true },
    { k: 'التخزين', sub: `value · ${def.minorNameAr}`, v: result.minor == null ? 'null' : String(result.minor), mono: true, muted: result.minor == null },
    { k: 'الصيغة القياسية', sub: 'للشرح فقط', v: result.canonical ?? '—', mono: true, muted: !result.canonical },
    { k: 'العرض', sub: numerals === 'arab' ? 'أرقام مشرقية' : 'أرقام لاتينية', v: result.minor == null ? '—' : `${formatAmount(result.minor, { currency, numerals })} ${def.symbolAr}`, muted: result.minor == null },
  ]
  return (
    <div className={compact ? 'grid grid-cols-2 gap-px bg-line' : 'grid grid-cols-2 gap-px bg-line md:grid-cols-4'} aria-live="polite">
      {cells.map((c) => (
        <div key={c.k} className="flex min-w-0 flex-col gap-1 bg-surface px-4 py-3">
          <span className="t-caption text-fg-2">
            <span className="font-medium text-fg">{c.k}</span> · {c.sub}
          </span>
          <bdi dir="ltr" className={['block truncate text-[16px] leading-7', c.mono ? 'font-mono text-[14.5px]' : 'ax-num', c.muted ? 'text-fg-3' : 'text-fg', 'text-end'].join(' ')}>
            {c.v}
          </bdi>
        </div>
      ))}
    </div>
  )
}

export function ErrorText({ result, currency, numerals }: { result: AmountParseResult; currency: CurrencyCode; numerals: DisplayNumerals }) {
  if (!result.error) return null
  return <>{amountErrorMessage(result.error, currency, numerals)}</>
}
