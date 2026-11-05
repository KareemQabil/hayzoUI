/** Product-level helpers (not part of the component library). */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Badge, Icon, IconButton, LocaleProvider, useLocale, useSettings, useToast, type Dir, type IconName } from '../system'
import { getComponent, getPattern, getRule, MATURITY, RELATIONSHIP_LABEL, type Maturity, type Relationship } from '../knowledge'
import { buildThemeVars, type Density, type Mode } from '../tokens/theme'
import { toDisplayDigits, type DisplayNumerals } from '../arabic'

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {}
    ta.remove()
    return ok
  }
}

export function useCopy() {
  const toast = useToast()
  return async (text: string, what: string) => {
    const ok = await copyText(text)
    toast(ok ? { tone: 'success', title: `نُسخ ${what}` } : { tone: 'danger', title: 'تعذّر النسخ', body: 'المتصفح منع الوصول إلى الحافظة. حدّد النص وانسخه يدويًا.' })
  }
}

export function CodeBlock({ code, label, caption, maxHeight }: { code: string; label: string; caption?: ReactNode; maxHeight?: number }) {
  const copy = useCopy()
  return (
    <figure className="overflow-hidden rounded-[var(--ax-radius-surface)] border border-line bg-sunken">
      <figcaption className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
        <span className="t-caption text-fg-2">{caption ?? label}</span>
        <IconButton icon="copy" label={`نسخ ${label}`} size="sm" onClick={() => copy(code, label)} />
      </figcaption>
      <pre dir="ltr" className="t-code overflow-auto px-4 py-3 text-fg" style={{ maxHeight, tabSize: 2 }}>
        <code>{code}</code>
      </pre>
    </figure>
  )
}

export function Section({ id, eyebrow, title, intro, children, aside }: { id?: string; eyebrow?: string; title: ReactNode; intro?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-8 pb-12 first:border-t-0 first:pt-0">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[68ch]">
          {eyebrow ? <p className="t-eyebrow mb-1">{eyebrow}</p> : null}
          <h2 className="t-h2 text-fg">{title}</h2>
          {intro ? <p className="t-body mt-2 text-fg-2">{intro}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function MaturityBadge({ maturity }: { maturity: Maturity }) {
  const m = MATURITY[maturity]
  return (
    <Badge tone={m.tone} dot title={m.desc}>
      {m.label}
    </Badge>
  )
}

export function RelationshipBadge({ relationship }: { relationship: Relationship }) {
  const r = RELATIONSHIP_LABEL[relationship]
  return (
    <Badge tone={r.tone} variant="outline" title={r.desc}>
      {r.label}
    </Badge>
  )
}

export function RefLink({ kind, id }: { kind: 'component' | 'rule' | 'pattern'; id: string }) {
  const rec = kind === 'component' ? getComponent(id) : kind === 'rule' ? getRule(id) : getPattern(id)
  const label = kind === 'component' ? (rec as ReturnType<typeof getComponent>)?.name : (rec as { title?: string } | undefined)?.title
  const href = kind === 'component' ? `#/components/${id}` : kind === 'rule' ? `#/rules/${id}` : `#/patterns/${id}`
  const icon: IconName = kind === 'component' ? 'boxes' : kind === 'rule' ? 'book' : 'workflow'
  return (
    <a href={href} className="group inline-flex max-w-full items-center gap-1.5 rounded-[var(--ax-radius-control)] border border-line-2 bg-raised px-2 py-1 t-caption text-fg hover:border-line-3 hover:bg-sunken">
      <Icon name={icon} size={14} className="text-fg-3" />
      {kind !== 'component' ? (
        <bdi dir="ltr" className="ax-mono text-fg-3">
          {id}
        </bdi>
      ) : null}
      <span className="truncate">{label ?? id}</span>
    </a>
  )
}

export function Dl({ items, className }: { items: Array<[ReactNode, ReactNode]>; className?: string }) {
  return (
    <dl className={['grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-[minmax(7rem,max-content)_minmax(0,1fr)] sm:gap-y-3', className].filter(Boolean).join(' ')}>
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="t-caption text-fg-2 pt-0.5">{k}</dt>
          <dd className="t-body text-fg min-w-0 break-words max-sm:mb-3">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Scopes theme mode, density and direction to a preview without touching the global theme. */
export function PreviewFrame({ dir, mode, density, numerals, children, className, style, label }: { dir?: Dir; mode?: Mode; density?: Density; numerals?: DisplayNumerals; children: ReactNode; className?: string; style?: CSSProperties; label?: string }) {
  const { theme } = useSettings()
  const scoped = mode || density ? (buildThemeVars({ ...theme, mode: mode ?? theme.mode, density: density ?? theme.density }) as CSSProperties) : undefined
  return (
    <div style={{ ...scoped, ...style }} className={['bg-surface text-fg', className].filter(Boolean).join(' ')} data-theme={mode} role={label ? 'group' : undefined} aria-label={label}>
      <LocaleProvider dir={dir} lang={dir === 'ltr' ? 'en' : 'ar'} numerals={numerals} className="contents">
        {children}
      </LocaleProvider>
    </div>
  )
}

export function N({ children }: { children: string | number }) {
  const { numerals } = useLocale()
  return <>{toDisplayDigits(String(children), numerals)}</>
}

export function useMediaQuery(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return m
}

export function downloadJson(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
