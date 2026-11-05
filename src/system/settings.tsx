/**
 * SettingsProvider — owns the theme configuration and regional preferences.
 * Theme, density, direction, locale and numerals are separate concerns and are stored separately.
 */
import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { buildThemeVars, DEFAULT_THEME, type ThemeConfig } from '../tokens/theme'
import type { DisplayNumerals } from '../arabic'
import type { MixedAlign } from './locale'

export type RegionLocale = 'ar-EG' | 'ar-SA'

export interface Prefs {
  numerals: DisplayNumerals
  locale: RegionLocale
  /** Alignment of text in the other script (a Latin name in an Arabic list). */
  mixedAlign: MixedAlign
}

const DEFAULT_PREFS: Prefs = { numerals: 'latn', locale: 'ar-EG', mixedAlign: 'ui' }

interface SettingsValue {
  theme: ThemeConfig
  setTheme: (patch: Partial<ThemeConfig>) => void
  resetTheme: () => void
  prefs: Prefs
  setPrefs: (patch: Partial<Prefs>) => void
}

const SettingsContext = createContext<SettingsValue | null>(null)
const THEME_KEY = 'ax.theme.v0'
const PREFS_KEY = 'ax.prefs.v0'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(() => load(THEME_KEY, DEFAULT_THEME))
  const [prefs, setPrefsState] = useState<Prefs>(() => load(PREFS_KEY, DEFAULT_PREFS))

  useLayoutEffect(() => {
    const root = document.documentElement
    for (const [k, v] of Object.entries(buildThemeVars(theme))) root.style.setProperty(k, v)
    root.dataset.theme = theme.mode
    root.dataset.density = theme.density
    root.style.colorScheme = theme.mode
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(theme))
    } catch {}
  }, [theme])

  useLayoutEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {}
  }, [prefs])

  const value = useMemo<SettingsValue>(
    () => ({
      theme,
      setTheme: (patch) => setThemeState((t) => ({ ...t, ...patch })),
      resetTheme: () => setThemeState(DEFAULT_THEME),
      prefs,
      setPrefs: (patch) => setPrefsState((p) => ({ ...p, ...patch })),
    }),
    [theme, prefs],
  )
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
