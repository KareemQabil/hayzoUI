/**
 * LocaleProvider — the only source of direction, language and display numerals for components.
 * Components never accept a `dir` prop; nest a provider to scope a preview.
 */
import { createContext, useContext, type ReactNode } from 'react'
import { NNBSP, toDisplayDigits, type DisplayNumerals } from '../arabic'
import { useSettings } from './settings'

export type Dir = 'rtl' | 'ltr'

export interface LocaleValue {
  dir: Dir
  lang: 'ar' | 'en'
  numerals: DisplayNumerals
}

const LocaleContext = createContext<LocaleValue>({ dir: 'rtl', lang: 'ar', numerals: 'latn' })

export function LocaleProvider({ dir, lang, numerals, children, as = 'div', className }: Partial<LocaleValue> & { children: ReactNode; as?: 'div' | 'section'; className?: string }) {
  const parent = useContext(LocaleContext)
  const value: LocaleValue = { dir: dir ?? parent.dir, lang: lang ?? parent.lang, numerals: numerals ?? parent.numerals }
  const Tag = as
  return (
    <LocaleContext.Provider value={value}>
      <Tag dir={value.dir} lang={value.lang} className={className}>
        {children}
      </Tag>
    </LocaleContext.Provider>
  )
}

/** Root provider: binds the user's global numeral preference. */
export function RootLocale({ children }: { children: ReactNode }) {
  const { prefs } = useSettings()
  return <LocaleContext.Provider value={{ dir: 'rtl', lang: 'ar', numerals: prefs.numerals }}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleValue {
  return useContext(LocaleContext)
}

/**
 * Static copy with numbers. Write Latin digits in source; they render in the provider's numerals, and a space
 * between two digits becomes U+202F so the groups keep their order inside Arabic text (R-BIDI-003).
 */
export function Digits({ children }: { children: string }) {
  const { numerals } = useLocale()
  return <>{toDisplayDigits(children.replace(/(\d) (?=\d)/g, `$1${NNBSP}`), numerals)}</>
}
