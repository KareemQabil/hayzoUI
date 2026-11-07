/**
 * F2 behavior primitive: press. No colors, sizes or class names — only semantics and state attributes.
 *
 * Contract
 *   - Activation: native <button> semantics (click, Enter, Space) — the platform owns keyboard activation.
 *   - Disabled: the native `disabled` attribute (not focusable, not announced as actionable).
 *   - Pending: stays focusable and in the accessibility tree, announced busy (aria-busy) and unavailable
 *     (aria-disabled), and swallows activation — a second press while pending never reaches onPress.
 *   - Automatic pending: when onPress returns a promise, the control is pending until it settles, so a
 *     double click or a repeated Enter submits once (R-FLOW-001), whoever renders the button.
 *   - State attributes for recipes: data-pressed (pointer down), data-pending.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'

export interface PressOptions {
  onPress?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<unknown>
  isDisabled?: boolean
  /** Externally controlled pending state (e.g. a form submission owned by the caller). */
  isPending?: boolean
}

export interface PressResult {
  pending: boolean
  props: {
    disabled: boolean
    'aria-disabled'?: true
    'aria-busy'?: true
    'data-pending'?: ''
    'data-pressed'?: ''
    onClick: (event: MouseEvent<HTMLButtonElement>) => void
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void
    onPointerUp: () => void
    onPointerLeave: () => void
    onPointerCancel: () => void
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  }
}

export function usePress({ onPress, isDisabled = false, isPending = false }: PressOptions): PressResult {
  const [auto, setAuto] = useState(false)
  const [pressed, setPressed] = useState(false)
  // A ref, not state: two clicks in the same frame must see the first one's pending flag.
  const inFlight = useRef(false)
  const mounted = useRef(true)
  // Set on every mount: StrictMode runs effect → cleanup → effect, and a cleanup-only flag would stay false,
  // leaving the button pending forever after its first async press (caught by BR-AT-02).
  useEffect(() => {
    mounted.current = true
    return () => void (mounted.current = false)
  }, [])

  const pending = isPending || auto
  const blocked = isDisabled || pending

  const onClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (isDisabled || isPending || inFlight.current) {
        event.preventDefault()
        return
      }
      const result = onPress?.(event)
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        inFlight.current = true
        setAuto(true)
        const settle = () => {
          inFlight.current = false
          if (mounted.current) setAuto(false)
        }
        ;(result as Promise<unknown>).then(settle, settle)
      }
    },
    [isDisabled, isPending, onPress],
  )

  const release = useCallback(() => setPressed(false), [])
  return {
    pending,
    props: {
      disabled: isDisabled,
      'aria-disabled': pending && !isDisabled ? true : undefined,
      'aria-busy': pending ? true : undefined,
      'data-pending': pending ? '' : undefined,
      'data-pressed': pressed && !blocked ? '' : undefined,
      onClick,
      onPointerDown: (event) => {
        if (event.button === 0 && !blocked) setPressed(true)
      },
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: release,
      // Enter on a pending button would submit an enclosing form natively; stop it here.
      onKeyDown: (event) => {
        if (pending && (event.key === 'Enter' || event.key === ' ')) event.preventDefault()
      },
    },
  }
}
