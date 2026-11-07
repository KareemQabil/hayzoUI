/**
 * LocaleProvider — the only source of direction, language and display numerals for components.
 * Components never accept a `dir` prop; nest a provider to scope a preview.
 */
import { createContext, useContext, useLayoutEffect, type CSSProperties, type ReactNode } from 'react'
import { localizeNumbers, NNBSP, toDisplayDigits, type DisplayNumerals } from '../arabic'
import { useSettings } from './settings'

export type Dir = 'rtl' | 'ltr'

/**
 * Where text in the other script (a Latin name in an Arabic list) is aligned:
 *   ui      — with the interface: every line starts at the container's start edge (right in RTL); default.
 *   content — with the text: each line starts on its own direction's side (Latin names on the left in RTL).
 * The text's own direction (first strong character) is the same in both; only alignment changes.
 */
export type MixedAlign = 'ui' | 'content'

export interface LocaleValue {
  dir: Dir
  lang: 'ar' | 'en'
  numerals: DisplayNumerals
  mixedAlign: MixedAlign
}

const LocaleContext = createContext<LocaleValue>({ dir: 'rtl', lang: 'ar', numerals: 'latn', mixedAlign: 'ui' })

/**
 * The CSS value read by .ax-auto and auto-direction inputs. Physical on purpose: `text-align: match-parent`
 * would express "the container's start" logically, but Chromium computes it as `start` (measured), which
 * aligns an LTR name to the left inside RTL. The provider knows its own direction, so it resolves the side.
 */
export function mixedAlignValue(dir: Dir, mixedAlign: MixedAlign): string {
  return mixedAlign === 'content' ? 'start' : dir === 'rtl' ? 'right' : 'left'
}

export function LocaleProvider({ dir, lang, numerals, mixedAlign, children, as = 'div', className }: Partial<LocaleValue> & { children: ReactNode; as?: 'div' | 'section'; className?: string }) {
  const parent = useContext(LocaleContext)
  const value: LocaleValue = { dir: dir ?? parent.dir, lang: lang ?? parent.lang, numerals: numerals ?? parent.numerals, mixedAlign: mixedAlign ?? parent.mixedAlign }
  const Tag = as
  const style = { '--ax-mixed-align': mixedAlignValue(value.dir, value.mixedAlign) } as CSSProperties
  return (
    <LocaleContext.Provider value={value}>
      <Tag dir={value.dir} lang={value.lang} data-numerals={value.numerals} className={className} style={style}>
        {children}
      </Tag>
    </LocaleContext.Provider>
  )
}

/** Root provider: binds the user's global numeral preference. */
export function RootLocale({ children }: { children: ReactNode }) {
  const { prefs } = useSettings()
  const value: LocaleValue = { dir: 'rtl', lang: 'ar', numerals: prefs.numerals, mixedAlign: prefs.mixedAlign }
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--ax-mixed-align', mixedAlignValue(value.dir, value.mixedAlign))
    // Read by the numerals oracle (scripts/bidi-scan.mjs): each number is checked against the nearest provider's setting.
    document.documentElement.dataset.numerals = value.numerals
  }, [value.dir, value.mixedAlign, value.numerals])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleValue {
  return useContext(LocaleContext)
}

/**
 * Static copy with numbers, shown in the provider's numerals (source may use either system). Codes and Latin
 * names keep Latin digits, and a space between two digits becomes U+202F (see localizeNumbers, R-BIDI-003).
 */
export function Digits({ children }: { children: string }) {
  const { numerals } = useLocale()
  return <>{localizeNumbers(children, numerals)}</>
}

/**
 * Text shown exactly as written: a value a person types, a code, a version. The numerals oracle skips it.
 * Use sparingly — everything else follows the numerals preference.
 */
export function Literal({ children, dir }: { children: ReactNode; dir?: 'ltr' | 'rtl' | 'auto' }) {
  return dir ? <bdi dir={dir} data-verbatim="">{children}</bdi> : <span data-verbatim="">{children}</span>
}

/**
 * Prose with numbers and literals. Numbers outside «…» follow the numerals preference (as in Digits);
 * text inside «…» is a literal (a typed value, an example output) and is shown as written.
 *   <Prose>{'كتابة «1234,50» ثم 3 ضغطات Tab'}</Prose>  →  arab: كتابة «1234,50» ثم ٣ ضغطات Tab
 */
export function Prose({ children }: { children: string }) {
  const parts = children.split(/(«[^»]*»)/)
  return <>{parts.map((part, i) => (part.startsWith('«') && part.endsWith('»') ? <Literal key={i}>{part}</Literal> : <Digits key={i}>{part}</Digits>))}</>
}

/**
 * A number already formatted the Latin way — "1,234.50", "42" — shown in the provider's numerals.
 * arab: Arabic-Indic digits, U+202F for grouping, U+066B (٫) as the decimal separator, as formatAmount does.
 */
export function NumberText({ children }: { children: string }) {
  const { numerals } = useLocale()
  if (numerals === 'latn') return <>{children}</>
  return <>{toDisplayDigits(children.replace(/,/g, NNBSP).replace(/[.]/g, '٫'), 'arab')}</>
}
