/**
 * The React Aria adapter (CONTRACTS.md §Layers). The only module that knows React Aria's locale model.
 * Components built on React Aria wrap their tree in <AriaLocale>; nothing else imports I18nProvider.
 *
 * Our LocaleProvider separates three things React Aria folds into one BCP 47 tag:
 *   language (ar / en) · display numerals (latn / arab) · calendar (gregory / islamic-umalqura).
 * They are recombined here as Unicode extensions: ar-EG-u-ca-islamic-umalqura-nu-arab.
 */
import type { ReactNode } from 'react'
import { I18nProvider } from 'react-aria-components'
import { useLocale } from '../locale'

export type CalendarSystem = 'gregory' | 'islamic-umalqura'

export function ariaLocale(lang: 'ar' | 'en', numerals: 'latn' | 'arab', calendar: CalendarSystem = 'gregory'): string {
  const base = lang === 'ar' ? 'ar-EG' : 'en-US'
  const ext = [calendar !== 'gregory' ? `ca-${calendar}` : null, `nu-${numerals}`].filter(Boolean).join('-')
  return `${base}-u-${ext}`
}

export function AriaLocale({ calendar, children }: { calendar?: CalendarSystem; children: ReactNode }) {
  const { lang, numerals } = useLocale()
  return <I18nProvider locale={ariaLocale(lang, numerals, calendar)}>{children}</I18nProvider>
}
