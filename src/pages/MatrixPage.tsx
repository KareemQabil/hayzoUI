/**
 * State matrix — generated from spec/components/<id>.json. Replaces hand-drawn state sheets:
 * rows are spec.states, columns are direction × theme, and density and content variant are page axes.
 * The same page is the target of visual baselines and browser checks (data-matrix-* attributes).
 * Query: #/matrix/<id>?density=default&content=short&numerals=latn
 */
import { useEffect, useMemo } from 'react'
import { type DisplayNumerals } from '../arabic'
import { PreviewFrame, Section } from '../app/ui'
import { navigate } from '../app/router'
import { FORCED, RENDERERS, type MatrixCase } from '../matrix/renderers'
import { installForcedStates } from '../matrix/force-states'
import { Digits, SegmentedControl, Select, useLocale } from '../system'
import type { Density, Mode } from '../tokens/theme'

const SPECS = import.meta.glob('../../spec/components/*.json', { eager: true, import: 'default' }) as Record<string, MatrixSpec>
interface MatrixSpec {
  id: string
  name: string
  nameEn?: string
  maturity: string
  states: string[]
  variants?: Array<{ prop: string; values: string[] }>
  content: string[]
}

/** Matrix rows: every spec state, then one row per visual variant value (drawn in the default state). */
function rowsOf(spec: MatrixSpec): Array<{ key: string; c: Omit<MatrixCase, 'content'> }> {
  return [
    ...spec.states.map((state) => ({ key: state, c: { state } })),
    ...(spec.variants ?? []).flatMap((v) => v.values.map((value) => ({ key: `${v.prop}=${value}`, c: { state: 'default', variant: { prop: v.prop, value } } }))),
  ]
}
const specs = Object.values(SPECS).sort((a, b) => a.id.localeCompare(b.id))

const COLUMNS: Array<{ dir: 'rtl' | 'ltr'; mode: Mode }> = [
  { dir: 'rtl', mode: 'light' },
  { dir: 'rtl', mode: 'dark' },
  { dir: 'ltr', mode: 'light' },
  { dir: 'ltr', mode: 'dark' },
]
const DENSITIES: Density[] = ['compact', 'default', 'touch']
const CONTENT_LABEL: Record<string, string> = {
  short: 'قصير',
  'long-arabic': 'عربي طويل',
  mixed: 'مختلط',
  latin: 'لاتيني كامل',
  'latin-first': 'يبدأ بلاتيني',
  'ltr-island': 'جزيرة LTR',
  diacritics: 'تشكيل',
  'arabic-digits': 'أرقام مشرقية',
  overflow: 'فائض',
}

function useQuery() {
  const raw = window.location.hash.split('?')[1] ?? ''
  return new URLSearchParams(raw)
}

export function MatrixPage({ id }: { id?: string }) {
  const q = useQuery()
  const spec = specs.find((s) => s.id === id) ?? specs[0]
  const renderer = RENDERERS[spec.id]
  const rows = rowsOf(spec)
  useEffect(installForcedStates, [])
  const density = (DENSITIES as string[]).includes(q.get('density') ?? '') ? (q.get('density') as Density) : 'default'
  const content = spec.content.includes(q.get('content') ?? '') ? q.get('content')! : spec.content[0]
  const preferred = useLocale().numerals
  // ?numerals= pins a sheet (baselines); without it the sheet follows the person's numerals preference.
  const asked = q.get('numerals')
  const numerals = (renderer?.numerals?.(content) ?? (asked === 'arab' || asked === 'latn' ? asked : preferred)) as DisplayNumerals
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(q)
    next.set(k, v)
    navigate(`#/matrix/${spec.id}?${next}`)
  }

  const missing = useMemo(
    () => (renderer ? rows.flatMap((r) => spec.content.filter((content) => renderer.render({ ...r.c, content }) == null).map((content) => `${r.key}/${content}`)) : ['renderer']),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spec, renderer],
  )

  return (
    <div className="flex flex-col gap-8">
      <Section
        eyebrow="مصفوفة الحالات"
        title={`${spec.name} · ${spec.id}`}
        intro="كل خلية مكوّن حقيقي يُولَّد من الـspec: الصفوف حالات الـspec، والأعمدة الاتجاه × السمة. الكثافة ومتغير المحتوى محوران للصفحة. الخلايا نفسها هدف الصور المرجعية وفحوص المتصفح."
      >
        <div className="flex flex-wrap items-end gap-4">
          {specs.length > 1 ? (
            <Select label="المكوّن" size="sm" value={spec.id} onValueChange={(v) => navigate(`#/matrix/${v}`)} options={specs.map((s) => ({ value: s.id, label: `${s.name} · ${s.id}` }))} />
          ) : null}
          <SegmentedControl label="الكثافة" value={density} onValueChange={(v) => set('density', v)} options={DENSITIES.map((d) => ({ value: d, label: d }))} />
          <SegmentedControl label="المحتوى" wrap value={content} onValueChange={(v) => set('content', v)} options={spec.content.map((c) => ({ value: c, label: CONTENT_LABEL[c] ?? c }))} />
        </div>
        <p className="t-caption text-fg-2" data-matrix-coverage={missing.length === 0 ? 'complete' : 'incomplete'}>
          {missing.length === 0
            ? <Digits>{`التغطية كاملة: ${rows.length} صفوف (حالات ومتغيرات) × ${spec.content.length} متغيرات محتوى × ${COLUMNS.length} أعمدة × ${DENSITIES.length} كثافات`}</Digits>
            : `حالات بلا renderer: ${missing.join('، ')}`}
        </p>
      </Section>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-2" data-matrix={spec.id}>
          <thead>
            <tr>
              <th className="t-caption text-fg-2 text-start">الحالة</th>
              {COLUMNS.map((c) => (
                <th key={`${c.dir}-${c.mode}`} className="t-caption text-fg-2 text-start">
                  <bdi dir="ltr">{`${c.dir} · ${c.mode}`}</bdi>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="t-label text-fg text-start align-top pt-3">
                  <bdi dir="ltr">{row.key}</bdi>
                </th>
                {COLUMNS.map((col) => {
                  const node = renderer?.render({ ...row.c, content })
                  const key = `${row.key}|${content}|${col.dir}|${col.mode}|${density}`
                  return (
                    <td key={key} className="align-top min-w-[16rem]">
                      {node == null ? (
                        <div data-matrix-missing={key} className="rounded border border-dashed border-line-2 p-4 t-caption text-fg-2">
                          لا يوجد renderer
                        </div>
                      ) : (
                        <PreviewFrame dir={col.dir} mode={col.mode} density={density} numerals={numerals} className="rounded-[var(--ax-radius-surface)] border border-line-2 p-4" label={key}>
                          <div data-matrix-cell={key} data-force-scope={FORCED.has(row.c.state) ? row.c.state : undefined}>
                            {node}
                          </div>
                        </PreviewFrame>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
