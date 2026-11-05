import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Drawer, Icon, IconButton, Kbd, SegmentedControl, useSettings } from '../system'
import { SearchPalette } from './SearchPalette'
import { useMediaQuery } from './ui'

interface NavItem {
  href: string
  label: string
  match: string
}

export const NAV: Array<{ group: string; items: NavItem[] }> = [
  {
    group: 'المرجع',
    items: [
      { href: '#/components/currency-input', label: 'المكونات', match: 'components' },
      { href: '#/patterns', label: 'الأنماط', match: 'patterns' },
      { href: '#/rules', label: 'القواعد', match: 'rules' },
    ],
  },
  {
    group: 'الأدوات',
    items: [
      { href: '#/studio', label: 'استوديو السمات', match: 'studio' },
      { href: '#/app', label: 'التطبيق المرجعي', match: 'app' },
    ],
  },
  {
    group: 'الثقة',
    items: [
      { href: '#/matrix/currency-input', label: 'مصفوفة الحالات', match: 'matrix' },
      { href: '#/evidence', label: 'الأدلة', match: 'evidence' },
      { href: '#/resources', label: 'الموارد', match: 'resources' },
    ],
  },
  { group: 'المنظومة', items: [{ href: '#/ecosystem', label: 'خارطة المنظومة', match: 'ecosystem' }] },
]

export function Brand() {
  return (
    <a href="#/components/currency-input" className="flex flex-none items-center gap-2.5 rounded-[var(--ax-radius-control)]" aria-label="التجربة العربية — الصفحة الرئيسية">
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-[calc(var(--ax-radius-control)+2px)] bg-fg text-[19px] font-semibold leading-none text-surface">
        ع
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold text-fg">التجربة العربية</span>
        <span className="text-[11px] text-fg-3">اسم عمل مؤقت · نموذج أول</span>
      </span>
    </a>
  )
}

export function Shell({ route, children }: { route: string[]; children: ReactNode }) {
  const { theme, setTheme, prefs, setPrefs } = useSettings()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const wide = useMediaQuery('(min-width: 1180px)')
  const searchBtn = useRef<HTMLButtonElement>(null)
  const current = route[0] ?? 'components'

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  useEffect(() => setMenuOpen(false), [route.join('/')])

  const regional = (
    <SegmentedControl
      label="أرقام العرض"
      hideLabel
      value={prefs.numerals}
      onValueChange={(v) => setPrefs({ numerals: v })}
      options={[
        { value: 'latn', label: <bdi dir="ltr">123</bdi>, ariaLabel: 'أرقام لاتينية' },
        { value: 'arab', label: '١٢٣', ariaLabel: 'أرقام عربية مشرقية' },
      ]}
    />
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="ax-sr focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[70] focus:rounded-md focus:bg-fg focus:px-3 focus:py-2 focus:text-surface">
        انتقل إلى المحتوى
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-[2px]">
        <div className="mx-auto flex h-14 max-w-[1520px] items-center gap-4 px-4 lg:px-6">
          {!wide ? <IconButton icon="menu" label="القائمة الرئيسية" onClick={() => setMenuOpen(true)} /> : null}
          <Brand />
          {wide ? (
            <nav aria-label="التنقل الرئيسي" className="ms-6 flex items-center">
              {NAV.map((g, gi) => (
                <div key={g.group} className={['flex items-center gap-0.5', gi > 0 ? 'ms-3 border-s border-line ps-3' : ''].join(' ')}>
                  {g.items.map((it) => {
                    const on = current === it.match
                    return (
                      <a
                        key={it.href}
                        href={it.href}
                        aria-current={on ? 'page' : undefined}
                        className={['rounded-[var(--ax-radius-control)] px-2.5 py-1.5 text-[14px] font-medium', on ? 'bg-soft text-on-soft' : 'text-fg-2 hover:bg-sunken hover:text-fg'].join(' ')}
                      >
                        {it.label}
                      </a>
                    )
                  })}
                </div>
              ))}
            </nav>
          ) : null}
          <div className="ms-auto flex items-center gap-2">
            <button
              ref={searchBtn}
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-9 items-center gap-2 rounded-[var(--ax-radius-control)] border border-line-2 bg-raised px-2.5 text-[13.5px] text-fg-2 hover:border-line-3 max-sm:w-9 max-sm:justify-center max-sm:px-0"
              aria-label="البحث في المنظومة"
              aria-keyshortcuts="Control+K"
              data-testid="open-search"
            >
              <Icon name="search" size={16} />
              <span className="max-sm:hidden">ابحث</span>
              <span className="ms-6 hidden items-center gap-0.5 md:inline-flex">
                <Kbd>Ctrl</Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>
            <div className="max-md:hidden">{regional}</div>
            <IconButton
              icon={theme.mode === 'light' ? 'moon' : 'sun'}
              label={theme.mode === 'light' ? 'التبديل إلى الوضع الداكن' : 'التبديل إلى الوضع الفاتح'}
              variant="outline"
              onClick={() => setTheme({ mode: theme.mode === 'light' ? 'dark' : 'light' })}
            />
          </div>
        </div>
      </header>

      <Drawer open={menuOpen} onOpenChange={setMenuOpen} title="القائمة" closeLabel="إغلاق القائمة">
        <nav aria-label="التنقل الرئيسي" className="flex flex-col gap-5">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="t-eyebrow mb-1.5">{g.group}</p>
              <ul className="flex flex-col">
                {g.items.map((it) => (
                  <li key={it.href}>
                    <a
                      href={it.href}
                      aria-current={current === it.match ? 'page' : undefined}
                      className={['flex items-center justify-between rounded-[var(--ax-radius-control)] px-3 py-2.5 text-[15px]', current === it.match ? 'bg-soft text-on-soft font-medium' : 'text-fg hover:bg-sunken'].join(' ')}
                    >
                      {it.label}
                      <Icon name="forward" size={16} className="text-fg-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="border-t border-line pt-4">
            <p className="t-eyebrow mb-2">أرقام العرض</p>
            {regional}
          </div>
        </nav>
      </Drawer>

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
    </div>
  )
}
