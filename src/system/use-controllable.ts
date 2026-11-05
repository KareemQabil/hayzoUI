/**
 * Controlled / uncontrolled state with one rule set (CONTRACTS.md §Props):
 * `value` present (even null) = controlled; otherwise `defaultValue` seeds internal state.
 * `onChange` fires for every user change in both modes; it never fires for a prop update.
 */
import { useCallback, useRef, useState } from 'react'

export function useControllable<T, D = undefined>(value: T | undefined, defaultValue: T, onChange?: (next: T, details: D) => void) {
  const controlled = value !== undefined
  const [internal, setInternal] = useState<T>(defaultValue)
  const current = controlled ? (value as T) : internal
  const latest = useRef(current)
  latest.current = current
  const set = useCallback(
    (next: T, details: D) => {
      if (!controlled) setInternal(next)
      if (!Object.is(next, latest.current)) onChange?.(next, details)
    },
    [controlled, onChange],
  )
  return [current, set] as const
}

/** Text value contract: empty text is null, never ''. */
export const textOrNull = (s: string): string | null => (s === '' ? null : s)
