import type { ReactNode } from 'react'
import { formatAmount, toDisplayDigits, type CurrencyCode } from '../../arabic'
import { useLocale } from '../locale'

export function VisuallyHidden({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <span className="ax-sr" id={id}>
      {children}
    </span>
  )
}

/** Isolates LTR data (codes, phones, e-mail, URLs) inside RTL text without reordering its neighbours. */
export function LtrIsland({ children, mono = false, className }: { children: ReactNode; mono?: boolean; className?: string }) {
  return (
    <bdi dir="ltr" className={['ax-ltr', mono && 'ax-mono', className].filter(Boolean).join(' ')}>
      {children}
    </bdi>
  )
}

/** Monetary value for display. Follows the provider's numeral preference; isolated so it never reorders. */
export function AmountText({ minor, currency, symbol = true, className }: { minor: number; currency: CurrencyCode; symbol?: boolean; className?: string }) {
  const { numerals } = useLocale()
  const text = formatAmount(minor, { currency, numerals })
  return (
    <span className={['ax-amount', className].filter(Boolean).join(' ')}>
      <bdi dir="ltr" className="ax-num">
        {text}
      </bdi>
      {symbol ? <span className="ax-amount__symbol"> {currencySymbol(currency)}</span> : null}
    </span>
  )
}

function currencySymbol(c: CurrencyCode) {
  return { EGP: 'ج.م', SAR: 'ر.س', KWD: 'د.ك' }[c]
}

/** Number shown in the user's numeral preference (counts, dates, versions). */
export function Num({ children }: { children: string | number }) {
  const { numerals } = useLocale()
  return <span className="ax-num">{toDisplayDigits(String(children), numerals)}</span>
}

/** Highlights [start,end) ranges of the ORIGINAL string. The stored text is rendered unchanged. */
export function Highlight({ text, ranges }: { text: string; ranges: Array<[number, number]> }) {
  if (!ranges.length) return <>{text}</>
  const out: ReactNode[] = []
  let cursor = 0
  ranges.forEach(([s, e], i) => {
    if (s > cursor) out.push(text.slice(cursor, s))
    out.push(
      <mark key={i} className="ax-mark">
        {text.slice(s, e)}
      </mark>,
    )
    cursor = e
  })
  if (cursor < text.length) out.push(text.slice(cursor))
  return <>{out}</>
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="ax-kbd" dir="ltr">
      {children}
    </kbd>
  )
}
