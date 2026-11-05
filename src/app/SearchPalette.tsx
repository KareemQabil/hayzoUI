import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_SEARCH, matchText } from '../arabic'
import { SEARCH_INDEX, type SearchEntry } from '../knowledge'
import { Dialog, Highlight, Icon, Kbd, type IconName } from '../system'
import { navigate } from './router'

const TYPE: Record<SearchEntry['type'], { label: string; icon: IconName }> = {
  component: { label: 'مكوّن', icon: 'boxes' },
  pattern: { label: 'نمط', icon: 'workflow' },
  rule: { label: 'قاعدة', icon: 'book' },
  resource: { label: 'مورد', icon: 'library' },
  page: { label: 'صفحة', icon: 'compass' },
}

export function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(() => {
    const scored = SEARCH_INDEX.map((e) => {
      const t = matchText(q, e.title, DEFAULT_SEARCH)
      const s = matchText(q, `${e.subtitle} ${e.id}`, DEFAULT_SEARCH)
      const k = matchText(q, e.keywords, DEFAULT_SEARCH)
      const score = t.match ? 3 : s.match ? 2 : k.match ? 1 : 0
      return { e, score, ranges: t.ranges }
    })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
    return q.trim() ? scored.slice(0, 12) : scored.filter((x) => x.e.type !== 'resource').slice(0, 10)
  }, [q])

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    if (!open) setQ('')
  }, [open])
  useEffect(() => {
    listRef.current?.querySelector('[data-active]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const go = (e: SearchEntry) => {
    onOpenChange(false)
    navigate(e.href)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)} title="البحث في المنظومة" description="المكونات والأنماط والقواعد والموارد. البحث متسامح مع الهمزة والتشكيل." size="md">
      <div className="flex flex-col gap-3">
        <div className="ax-control" data-size="lg">
          <span className="ax-control__affix ax-control__affix--start" aria-hidden="true">
            <Icon name="search" size={18} />
          </span>
          <input
            className="ax-control__input"
            dir={q === '' ? 'rtl' : 'auto'}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-autocomplete="list"
            aria-activedescendant={results[active] ? `pal-${results[active].e.id}` : undefined}
            aria-label="ابحث"
            placeholder="مثلًا: مبلغ، همزة، R-NUM-002، Dialog"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(results.length - 1, a + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(0, a - 1))
              } else if (e.key === 'Enter' && results[active]) {
                e.preventDefault()
                go(results[active].e)
              }
            }}
          />
        </div>
        <p className="ax-sr" aria-live="polite">
          {results.length ? `${results.length} نتيجة` : 'لا نتائج'}
        </p>
        <ul id="palette-list" role="listbox" aria-label="النتائج" ref={listRef} className="-mx-2 max-h-[min(52vh,420px)] overflow-auto">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center t-body text-fg-2" role="presentation">
              لا نتائج لـ «{q}». جرّب اسم المكوّن بالإنجليزية أو رقم القاعدة.
            </li>
          ) : (
            results.map(({ e, ranges }, i) => (
              <li
                key={e.type + e.id}
                id={`pal-${e.id}`}
                role="option"
                aria-selected={i === active}
                data-active={i === active || undefined}
                className="flex cursor-pointer items-center gap-3 rounded-[var(--ax-radius-control)] px-3 py-2.5 data-[active]:bg-soft"
                onMouseMove={() => setActive(i)}
                onClick={() => go(e)}
              >
                <span className="grid size-8 flex-none place-items-center rounded-[var(--ax-radius-control)] bg-sunken text-fg-2">
                  <Icon name={TYPE[e.type].icon} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate t-label text-fg">
                    <Highlight text={e.title} ranges={ranges} />
                  </span>
                  <span className="block truncate t-caption text-fg-2">
                    <bdi>{e.subtitle}</bdi>
                  </span>
                </span>
                <span className="t-caption text-fg-3">{TYPE[e.type].label}</span>
              </li>
            ))
          )}
        </ul>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 t-caption text-fg-3">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> للتنقل
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Enter</Kbd> للفتح
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Esc</Kbd> للإغلاق
          </span>
        </p>
      </div>
    </Dialog>
  )
}
