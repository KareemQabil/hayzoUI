import { DEFAULT_SEARCH, normalizeForSearch } from '../../../arabic/search'

const SEARCH_OPTIONS = Object.freeze({ ...DEFAULT_SEARCH, hamza: true, alefMaqsura: true, taaMarbuta: true })
const normalized = (value: string): string => normalizeForSearch(value, SEARCH_OPTIONS).text.trim()

/**
 * Clock-injected, DOM-independent type-to-select state machine.
 * Normalized labels are indexed once per keys-array identity, not once per keypress.
 */
export function createTypeahead(o: { timeoutMs?: number; now: () => number }): {
  search(char: string, keys: readonly string[], textOf: (key: string) => string, from: string | null): string | null
  reset(): void
} {
  const timeoutMs = o.timeoutMs === undefined ? 700 : Math.max(0, o.timeoutMs)
  let buffer = ''
  let previousAt: number | null = null
  let cachedKeys: readonly string[] | null = null
  let labels: readonly string[] = []

  const clear = () => {
    buffer = ''
    previousAt = null
    cachedKeys = null
    labels = []
  }

  return {
    reset: clear,
    search(char, keys, textOf, from) {
      const time = o.now()
      if (typeof char !== 'string' || !char.length || !Number.isFinite(time)) return null
      if (previousAt !== null && (time < previousAt || time - previousAt >= timeoutMs)) buffer = ''
      previousAt = time

      // Pure Arabic normalization covers diacritics, tatweel, hamza, Ø©/Ù‡, Ù‰/ÙŠ and digits.
      const fragment = normalized(char)
      if (!fragment) return null
      if (cachedKeys !== key¶»§q«^