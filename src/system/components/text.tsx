import { Fragment, isValidElement, type ReactNode } from 'react'
import { formatAmount, scriptRuns, toDisplayDigits, type CurrencyCode } from '../../arabic'
import { useLocale } from '../locale'

export function VisuallyHidden({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <span className="ax-sr" id={id}>
      {children}
    </span>
  )
}

/**
 * Names and other free text whose script is not known in advance ("Sara Haddad", "Dr. سامي الحلبي").
 * Direction comes from the dominant script (scriptRuns), and runs of the other script are isolated in a
 * <bdi> so their punctuation stays with the word: «Dr. سامي الحلبي» is RTL with «Dr.» at the right.
 * Alignment follows the provider's mixedAlign preference (CONTRACTS.md §Mixed text).
 * Children: plain text (strings/numbers) or a single <Highlight>; anything else keeps dir="auto".
 */
export function AutoText({ children, as: Tag = 'span', inline = false, className, id }: { children: ReactNode; as?: 'span' | 'p' | 'h2' | 'h3' | 'dd' | 'div'; inline?: boolean; className?: string; id?: string }) {
  const cls = ['ax-auto', inline && 'ax-auto--inline', className].filter(Boolean).join(' ')
  const source = autoTextSource(children)
  if (!source) {
    return (
      <Tag id={id} dir="auto" className={cls}>
        {children}
      </Tag>
    )
  }
  const { dir, runs } = scriptRuns(source.text)
  let offset = 0
  const out = runs.map((run, i) => {
    const start = offset
    offset += run.text.length
    const content = source.ranges ? highlightSlice(source.text, source.ranges, start, offset) : run.text
    return run.isolate ? (
      <bdi key={i} dir={run.isolate}>
        {content}
      </bdi>
    ) : (
      <Fragment key={i}>{content}</Fragment>
    )
  })
  return (
    <Tag id={id} dir={dir ?? undefined} className={cls}>
      {out}
    </Tag>
  )
}

/** The text AutoText can split into runs: plain strings/numbers, or one <Highlight> (text + ranges). */
function autoTextSource(children: ReactNode): { text: string; ranges?: Array<[number, number]> } | null {
  if (typeof children === 'string' || typeof children === 'number') return { text: String(children) }
  if (isValidElement(children) && children.type === Highlight) {
    const p = children.props as { text: string; ranges: Array<[number, number]> }
    return { text: p.text, ranges: p.ranges }
  }
  if (Array.isArray(children) && children.every((c) => typeof c === 'string' || typeof c === 'number')) return { text: children.join('') }
  return null
}

/** The part [from,to) of a highlighted text, with its marks clipped to that part. */
function highlightSlice(text: string, ranges: Array<[number, number]>, from: number, to: number): ReactNode {
  const clipped = ranges.map(([s, e]) => [Math.max(s, from) - from, Math.min(e, to) - from] as [number, number]).filter(([s, e]) => e > s)
  return <Highlight text={text.slice(from, to)} ranges={clipped} />
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
