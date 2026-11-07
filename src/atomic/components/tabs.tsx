/**
 * F3 atom: Tabs — atomic.tabs@0.1.0. Contract: ./choice-contracts.ts (TABS_CONTRACT).
 * WAI-ARIA tabs: tablist > tab (button) ↔ tabpanel, wired with aria-controls / aria-labelledby.
 *
 * Value contract: `value` / `defaultValue` / `onValueChange(value)`. Tabs always hold a value (no empty state):
 * uncontrolled, the first enabled tab is selected by default.
 *
 * Keyboard (behavior/roving.ts): one tab stop — the selected tab (or the first enabled tab when the value matches
 * none). Arrows move focus in the experience direction (RTL: ArrowLeft = next, first tab on the right), Home/End,
 * disabled tabs are skipped, focus wraps. Activation 'automatic' (default) selects the tab focus lands on;
 * 'manual' moves focus only, and Enter/Space (the native button click) selects. Horizontal only for now.
 */
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { rovingKeyDown } from '../behavior/roving'
import { useControllableState } from '../platform/react/controllable'
import { useExperience } from '../platform/react/experience'
import '../styles/recipes/choice.css'

export interface TabItem<V extends string = string> {
  value: V
  label: ReactNode
  /** The panel content; rendered in a tabpanel, hidden while its tab is not selected. */
  content: ReactNode
  disabled?: boolean
}

export interface TabsProps<V extends string = string> {
  /** Accessible name of the tablist (what the tabs switch between). */
  label: string
  items: readonly TabItem<V>[]
  value?: V
  defaultValue?: V
  onValueChange?: (value: V) => void
  activation?: 'automatic' | 'manual'
  id?: string
}

const TAB = "[role='tab']"

export function Tabs<V extends string = string>({ label, items, value, defaultValue, onValueChange, activation = 'automatic', id }: TabsProps<V>) {
  const { direction } = useExperience()
  const base = id ?? 'hz' + useId().replace(/:/g, '')
  const firstEnabled = items.find((item) => !item.disabled)?.value
  const [current, setCurrent] = useControllableState<V | undefined>(value, defaultValue ?? firstEnabled, onValueChange ? (next) => next !== undefined && onValueChange(next) : undefined)
  const list = useRef<HTMLDivElement>(null)
  const tabId = (i: number) => `${base}-tab-${i}`
  const panelId = (i: number) => `${base}-panel-${i}`
  const selectedEnabled = items.some((item) => item.value === current && !item.disabled)
  const tabStop = selectedEnabled ? current : firstEnabled

  const select = (next: V) => {
    if (next !== current) setCurrent(next, undefined)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!list.current) return
    const target = rovingKeyDown(event, list.current, { itemSelector: TAB, orientation: 'horizontal', dir: direction, manageTabIndex: false })
    if (target && activation === 'automatic') {
      const item = items[Number(target.dataset.index)]
      if (item && !item.disabled) select(item.value)
    }
  }

  return (
    <div data-hz="tabs" data-activation={activation} data-orientation="horizontal">
      <div data-slot="list" role="tablist" aria-label={label} aria-orientation="horizontal" ref={list} onKeyDown={onKeyDown}>
        {items.map((item, i) => {
          const selected = item.value === current
          return (
            <button
              key={item.value}
              data-slot="tab"
              data-index={i}
              data-selected={selected ? '' : undefined}
              type="button"
              role="tab"
              id={tabId(i)}
              aria-selected={selected}
              aria-controls={panelId(i)}
              tabIndex={item.value === tabStop ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.value)}
            >
              <span data-slot="tab-label">{item.label}</span>
            </button>
          )
        })}
      </div>
      {items.map((item, i) => (
        <div key={item.value} data-slot="panel" role="tabpanel" id={panelId(i)} aria-labelledby={tabId(i)} tabIndex={0} hidden={item.value !== current}>
          {item.content}
        </div>
      ))}
    </div>
  )
}
