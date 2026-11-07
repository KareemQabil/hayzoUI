/**
 * F1 platform adapter: controlled/uncontrolled state with one contract —
 * `value` (controlled) or `defaultValue` (uncontrolled), and `onValueChange(next, details)`.
 */
import { useCallback, useRef, useState } from 'react'

export function useControllableState<T, D = undefined>(
  value: T | undefined,
  defaultValue: T,
  onValueChange?: (next: T, details: D) => void,
): [T, (next: T, details: D) => void] {
  const controlled = value !== undefined
  const [inner, setInner] = useState(defaultValue)
  const callback = useRef(onValueChange)
  callback.current = onValueChange
  const set = useCallback(
    (next: T, details: D) => {
      if (!controlled) setInner(next)
      callback.current?.(next, details)
    },
    [controlled],
  )
  return [controlled ? (value as T) : inner, set]
}
