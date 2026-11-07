import { getComponent, getPattern, getResource, REVIEW, RULES } from '../knowledge'
import { automatedFor } from '../knowledge/evidence'
import { Badge, Button, Prose } from '../system'
import { navigate } from '../app/router'
import { RefLink, useMediaQuery } from '../app/ui'
import { AutomatedBadge } from './EvidencePage'

function RuleDetail({ id }: { id: string }) {
  const r = RULES.find((x) => x.id === id)
  if (!r) return <p className="t-body text-fg-2">القاعدة غير موجودة.</p>
  const res = r.source.resourceId ? getResource(r.source.resourceId) : undefined
  return (
    <article aria-labelledby="rule-h" className="max-w-[68ch]">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <bdi dir="ltr" className="ax-mono t-caption text-fg-2">{r.id}</bdi>
        <Badge tone="warning" dot>{REVIEW[r.review]}</Badge>
      </div>
      <h2 id="rule-h" className="t-h1 text-fg">{r.title}</h2>
      <dl className="mt-8 flex flex-col gap-6">
        <div>
          <dt className="t-eyebrow mb-1">المشكلة</dt>
          <dd className="t-body-lg text-fg"><Prose>{r.problem}</Prose></dd>
        </div>
        <div className="border-s-2 border-action ps-5">
          <dt className="t-eyebrow mb-1">التوصية</dt>
          <dd className="t-body-lg font-medium text-fg"><Prose>{r.recommendation}</Prose></dd>
        </div>
        <div>
          <dt className="t-eyebrow mb-1">السبب</dt>
          <dd className="t-body text-fg-2"><Prose>{r.rationale}</Prose></dd>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="t-eyebrow mb-1">السياق</dt>
            <dd className="t-body text-fg-2"><Prose>{r.context}</Prose></dd>
          </div>
          <div>
            <dt className="t-eyebrow mb-1">الاستثناءات</dt>
            <dd className="t-body text-fg-2"><Prose>{r.exceptions}</Prose></dd>
          </div>
        </div>
        <div>
          <dt className="t-eyebrow mb-1">المصدر</dt>
          <dd className="t-body text-fg">{res ? <a className="text-link hover:underline" href={`#/resources/${res.id}`}>{r.source.label}</a> : r.source.label}</dd>
        </div>
        {r.components.length || r.patterns.length ? (
          <div>
            <dt className="t-eyebrow mb-2">يطبّقها</dt>
            <dd className="flex flex-wrap gap-2">
              {r.components.filter((c) => getComponent(c)).map((c) => <RefLink key={c} kind="component" id={c} />)}
              {r.patterns.filter((p) => getPattern(p)).map((p) => <RefLink key={p} kind="pattern" id={p} />)}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="t-eyebrow mb-2">الأدلة</dt>
          <dd>
            {r.tests.length ? (
              <ul className="flex flex-col divide-y divide-line border-y border-line">
                {r.tests.map((t) => (
                  <li key={t} className="flex items-center justify-between gap-3 py-2">
                    <bdi dir="ltr" className="ax-mono text-fg-2">{t}</bdi>
                    <AutomatedBadge state={automatedFor(t)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="t-body text-fg-2">لا توجد حالة اختبار مرتبطة بعد. القاعدة مقترح مكتوب فقط.</p>
            )}
          </dd>
        </div>
      </dl>
    </article>
  )
}

export function RulesPage({ id }: { id?: string }) {
  const wide = useMediaQuery('(min-width: 1024px)')
  const current = id ?? (wide ? RULES[0].id : undefined)
  const list = (
    <nav aria-label="القواعد">
      <ul className="flex flex-col">
        {RULES.map((r) => {
          const on = r.id === current
          return (
            <li key={r.id}>
              <a href={`#/rules/${r.id}`} aria-current={on ? 'page' : undefined} className={['block rounded-[var(--ax-radius-control)] px-3 py-2.5', on ? 'bg-soft' : 'hover:bg-sunken'].join(' ')}>
                <bdi dir="ltr" className={['ax-mono block text-[12px]', on ? 'text-on-soft' : 'text-fg-3'].join(' ')}>{r.id}</bdi>
                <span className={['t-label block', on ? 'text-on-soft' : 'text-fg'].join(' ')}>{r.title}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-10 md:px-8">
      <header className="mb-8 max-w-[68ch]">
        <p className="t-eyebrow mb-2">المرجع</p>
        <h1 className="t-h1 text-fg">القواعد</h1>
        <p className="t-body-lg mt-3 text-fg-2">كل قاعدة مشكلة وتوصية وسياق واستثناءات ومصدر وأدلة. كلها في حالة «مقترح» حتى تُراجع؛ وجود اختبار لا يعني أن القاعدة معتمدة.</p>
      </header>
      {wide ? (
        <div className="grid grid-cols-[19rem_minmax(0,1fr)] gap-12">
          <div className="sticky top-20 self-start">{list}</div>
          {current ? <RuleDetail id={current} /> : null}
        </div>
      ) : current ? (
        <div>
          <Button variant="ghost" size="sm" iconStart="back" onClick={() => navigate('#/rules')} className="mb-4">كل القواعد</Button>
          <RuleDetail id={current} />
        </div>
      ) : (
        list
      )}
    </div>
  )
}
