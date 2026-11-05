import { useState } from 'react'
import { getComponent, knowledgeExport } from '../../../knowledge'
import { Button, Tabs, tabPanelProps, useSettings } from '../../../system'
import { navigate } from '../../../app/router'
import { MaturityBadge, RelationshipBadge, useCopy } from '../../../app/ui'
import { Assistant } from '../Assistant'
import type { LabSettings } from './lab'
import { OverviewTab } from './OverviewTab'
import { LabTab } from './LabTab'
import { GuidelinesTab } from './GuidelinesTab'
import { BehaviorTab } from './BehaviorTab'
import { CodeTab } from './CodeTab'
import { ProvenanceTab } from './ProvenanceTab'

const TABS = [
  { value: 'overview', label: 'نظرة عامة' },
  { value: 'lab', label: 'المعمل' },
  { value: 'guidelines', label: 'الإرشادات والمحتوى' },
  { value: 'behavior', label: 'السلوك وإمكانية الوصول' },
  { value: 'code', label: 'الكود والواجهة البرمجية' },
  { value: 'provenance', label: 'المصدر والأدلة' },
] as const
type TabValue = (typeof TABS)[number]['value']

export function CurrencyInputPage({ tab }: { tab?: string }) {
  const record = getComponent('currency-input')!
  const { theme, prefs } = useSettings()
  const active: TabValue = (TABS.find((t) => t.value === tab)?.value ?? 'overview') as TabValue
  const [assistantOpen, setAssistantOpen] = useState(false)
  const copy = useCopy()
  const [lab, setLab] = useState<LabSettings>(() => ({
    state: 'interactive',
    size: 'lg',
    density: theme.density,
    dir: 'rtl',
    numerals: prefs.numerals,
    mode: theme.mode,
    currency: 'EGP',
    currencyDisplay: 'symbol',
    optional: false,
    allowNegative: false,
    range: 'none',
    validateOn: 'blur',
    label: 'short',
  }))

  return (
    <article className="mx-auto max-w-[1080px] px-4 pb-24 pt-8 md:px-8 lg:pt-10">
      <header className="mb-8">
        <p className="t-caption mb-3 text-fg-2">
          <a href="#/components/currency-input" className="hover:text-fg">
            المكونات
          </a>
          <span className="mx-2 text-fg-3">/</span>
          الإدخال
        </p>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="t-display text-fg max-sm:text-[34px]">{record.name}</h1>
          <bdi dir="ltr" className="font-mono text-[15px] text-fg-3">
            CurrencyInput
          </bdi>
        </div>
        <p className="t-body-lg mt-3 max-w-[62ch] text-fg-2">{record.summary}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <MaturityBadge maturity={record.maturity} />
            <RelationshipBadge relationship={record.relationship} />
            <span className="t-caption text-fg-2">
              العقد <bdi dir="ltr" className="ax-mono text-fg">arabic.amount.v1</bdi>
            </span>
            <span className="t-caption text-fg-3">·</span>
            <span className="t-caption text-fg-2">المكتبة السلوكية الأساسية: لم تُعتمد بعد</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" iconStart="json" onClick={() => copy(JSON.stringify(knowledgeExport(['currency-input'], [], ['P-COLLECT-PAYMENT']), null, 2), 'معرفة المكوّن بصيغة JSON')}>
              نسخ المعرفة JSON
            </Button>
            <Button variant="soft" size="sm" iconStart="sliders" onClick={() => setAssistantOpen(true)}>
              مساعد الاختيار
            </Button>
          </div>
        </div>
      </header>

      <Tabs idBase="ci" label="أقسام مرجع حقل المبلغ" value={active} onValueChange={(v) => navigate(`#/components/currency-input/${v}`)} items={TABS.map((t) => ({ ...t }))} className="sticky top-14 z-10 -mx-4 bg-canvas px-4 md:-mx-8 md:px-8 max-lg:top-[6.5rem]" />

      <div {...tabPanelProps('ci', active)} className="pt-8 outline-none">
        {active === 'overview' && <OverviewTab onOpenLab={() => navigate('#/components/currency-input/lab')} />}
        {active === 'lab' && <LabTab settings={lab} onChange={(p) => setLab((s) => ({ ...s, ...p }))} />}
        {active === 'guidelines' && <GuidelinesTab />}
        {active === 'behavior' && <BehaviorTab />}
        {active === 'code' && <CodeTab settings={lab} />}
        {active === 'provenance' && <ProvenanceTab />}
      </div>
      <Assistant open={assistantOpen} onOpenChange={setAssistantOpen} context="currency-input" />
    </article>
  )
}
