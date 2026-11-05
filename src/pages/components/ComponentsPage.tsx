import { useState } from 'react'
import { COMPONENTS, FAMILY_LABEL, MATURITY, type ComponentRecord } from '../../knowledge'
import { Badge, Button, Drawer, Icon } from '../../system'
import { N, useMediaQuery } from '../../app/ui'
import { CurrencyInputPage } from './currency/CurrencyInputPage'
import { GenericComponentPage } from './GenericComponentPage'

const ORDER: ComponentRecord['family'][] = ['inputs', 'actions', 'navigation', 'overlays', 'feedback', 'data']

function ComponentNav({ current, onNavigate }: { current: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="فهرس المكونات" className="flex flex-col gap-5">
      {ORDER.map((fam) => {
        const items = COMPONENTS.filter((c) => c.family === fam)
        if (!items.length) return null
        return (
          <div key={fam}>
            <p className="t-eyebrow mb-1 px-3">{FAMILY_LABEL[fam]}</p>
            <ul>
              {items.map((c) => {
                const on = c.id === current
                return (
                  <li key={c.id}>
                    <a
                      href={`#/components/${c.id}`}
                      onClick={onNavigate}
                      aria-current={on ? 'page' : undefined}
                      className={[
                        'flex items-center justify-between gap-2 rounded-[var(--ax-radius-control)] px-3 py-1.5 text-[14px]',
                        on ? 'bg-soft font-medium text-on-soft' : c.maturity === 'planned' ? 'text-fg-3 hover:bg-sunken' : 'text-fg-2 hover:bg-sunken hover:text-fg',
                      ].join(' ')}
                    >
                      <span className="truncate">{c.name}</span>
                      {c.maturity === 'planned' ? <span className="t-caption text-fg-3">مخطط</span> : c.maturity === 'draft' ? <span className="t-caption text-fg-3">مسودة</span> : null}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
      <p className="border-t border-line px-3 pt-4 t-caption text-fg-3">
        <N>{COMPONENTS.filter((c) => c.maturity !== 'planned').length}</N> مكوّنًا مطبّقًا من <N>{COMPONENTS.length}</N> في الفهرس. لا يوجد مكوّن بدرجة بيتا أو مستقر بعد.
      </p>
    </nav>
  )
}

export function ComponentsPage({ id, tab }: { id: string; tab?: string }) {
  const wide = useMediaQuery('(min-width: 1024px)')
  const [pickerOpen, setPickerOpen] = useState(false)
  const record = COMPONENTS.find((c) => c.id === id) ?? COMPONENTS[0]

  return (
    <div className="mx-auto flex max-w-[1520px]">
      {wide ? (
        <aside className="sticky top-14 h-[calc(100dvh-3.5rem)] w-[248px] flex-none overflow-y-auto border-e border-line px-3 py-6">
          <ComponentNav current={record.id} />
        </aside>
      ) : null}
      <div className="min-w-0 flex-1">
        {!wide ? (
          <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-line bg-surface px-4 py-2">
            <Button variant="outline" size="sm" iconEnd="chevrons-up-down" onClick={() => setPickerOpen(true)} aria-label={`المكوّن الحالي: ${record.name}. اختر مكوّنًا آخر`}>
              <Icon name="boxes" size={16} />
              {record.name}
            </Button>
            <Badge tone={MATURITY[record.maturity].tone} dot>
              {MATURITY[record.maturity].label}
            </Badge>
          </div>
        ) : null}
        {record.id === 'currency-input' ? <CurrencyInputPage tab={tab} /> : <GenericComponentPage record={record} />}
      </div>
      <Drawer open={pickerOpen} onOpenChange={setPickerOpen} title="المكونات" labels={{ close: 'إغلاق فهرس المكونات' }}>
        <ComponentNav current={record.id} onNavigate={() => setPickerOpen(false)} />
      </Drawer>
    </div>
  )
}
