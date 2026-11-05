/** Tabs — automatic activation, roving tabindex, Home/End, direction-aware arrows. */
import { useRef, type ReactNode } from 'react'
import { useLocale } from '../locale'

export interface TabItem<V extends string> {
  value: V
  label: ReactNode
  count?: ReactNode
}

export interface TabsProps<V extends string> {
  idBase: string
  label: string
  value: V
  onValueChange: (value: V) => void
  items: TabItem<V>[]
  className?: string
  variant?: 'line' | 'contained'
}

export function tabPanelProps(idBase: string, value: string) {
  return { role: 'tabpanel' as const, id: `${idBase}-panel-${value}`, 'aria-labelledby': `${idBase}-tab-${value}`, tabIndex: 0 }
}

export function Tabs<V extends string>({ idBase, label, value, onValueChange, items, className, variant = 'line' }: TabsProps<V>) {
  const { dir } = useLocale()
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const focusAt = (i: number) => {
    const n = (i + items.length) % items.length
    onValueChange(items[n].value)
    refs.current[n]?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label={label}
      className={['ax-tabs', className].filter(Boolean).join(' ')}
      data-variant={variant}
      onKeyDown={(e) => {
        const i = items.findIndex((t) => t.value === value)
        const next = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
        const prev = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
        if (e.key === next) focusAt(i + 1)
        else if (e.key === prev) focusAt(i - 1)
        else if (e.key === 'Home') focusAt(0)
        else if (e.key === 'End') focusAt(items.length - 1)
        else return
        e.preventDefault()
      }}
    >
      {items.map((t, i) => {
        const selected = t.value === value
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            type="button"
            id={`${idBase}-tab-${t.value}`}
            aria-selected={selected}
            aria-controls={`${idBase}-panel-${t.value}`}
            tabIndex={selected ? 0 : -1}
            data-state={selected ? 'active' : 'inactive'}
            className="ax-tabs__tab"
            onClick={() => onValueChange(t.value)}
          >
            {t.label}
            {t.count != null ? <span className="ax-tabs__count">{t.count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
