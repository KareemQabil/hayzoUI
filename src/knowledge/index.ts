import { COMPONENTS, FAMILY_LABEL } from './components'
import { FIXTURES } from './fixtures'
import { PATTERNS, PATTERN_STATUS } from './patterns'
import { RESOURCES, RELATIONSHIP_LABEL } from './resources'
import { RULES } from './rules'
import type { Maturity } from './types'

export { COMPONENTS, FAMILY_LABEL, FIXTURES, PATTERNS, PATTERN_STATUS, RESOURCES, RELATIONSHIP_LABEL, RULES }
export * from './types'

export const getComponent = (id: string) => COMPONENTS.find((c) => c.id === id)
export const getRule = (id: string) => RULES.find((r) => r.id === id)
export const getPattern = (id: string) => PATTERNS.find((p) => p.id === id)
export const getResource = (id: string) => RESOURCES.find((r) => r.id === id)

export const MATURITY: Record<Maturity, { label: string; tone: 'neutral' | 'warning' | 'accent' | 'success' | 'info'; desc: string }> = {
  planned: { label: 'مخطط', tone: 'neutral', desc: 'غير مطبّق. يظهر في الفهرس لتوضيح البنية فقط.' },
  draft: { label: 'مسودة', tone: 'warning', desc: 'مطبّق ويُستخدم، لكن العقد والحالات غير مكتملة.' },
  alpha: { label: 'ألفا', tone: 'accent', desc: 'مطبّق بعقد واضح؛ البوابات الآلية جزئية.' },
  beta: { label: 'بيتا', tone: 'info', desc: 'كل البوابات الآلية عدّت.' },
  stable: { label: 'مستقر', tone: 'success', desc: 'بيتا + فحص يدوي بقارئ شاشة وجهاز حقيقي + استخدام مرجعي + أسبوعان بلا تغيير.' },
}

export const REVIEW: Record<'proposed' | 'in-review' | 'accepted', string> = {
  proposed: 'مقترح',
  'in-review': 'قيد المراجعة',
  accepted: 'معتمد',
}

export type SearchEntry = { id: string; type: 'component' | 'rule' | 'pattern' | 'resource' | 'page'; title: string; subtitle: string; href: string; keywords: string }

export const SEARCH_INDEX: SearchEntry[] = [
  ...COMPONENTS.map((c) => ({ id: c.id, type: 'component' as const, title: c.name, subtitle: `${c.nameEn} · ${MATURITY[c.maturity].label}`, href: `#/components/${c.id}`, keywords: `${c.nameEn} ${c.summary}` })),
  ...PATTERNS.map((p) => ({ id: p.id, type: 'pattern' as const, title: p.title, subtitle: `${p.id} · ${PATTERN_STATUS[p.status].label}`, href: `#/patterns/${p.id}`, keywords: p.job })),
  ...RULES.map((r) => ({ id: r.id, type: 'rule' as const, title: r.title, subtitle: r.id, href: `#/rules/${r.id}`, keywords: `${r.problem} ${r.recommendation}` })),
  ...RESOURCES.map((r) => ({ id: r.id, type: 'resource' as const, title: r.title, subtitle: `${r.maintainer} · ${RELATIONSHIP_LABEL[r.relationship].label}`, href: `#/resources/${r.id}`, keywords: r.role })),
  { id: 'studio', type: 'page', title: 'استوديو السمات والطباعة', subtitle: 'الألوان والخط والكثافة والزوايا', href: '#/studio', keywords: 'theme tokens color font density' },
  { id: 'app', type: 'page', title: 'التطبيق المرجعي — دفتر التحصيل', subtitle: 'بحث عن عميل وتحصيل مبلغ (محاكاة)', href: '#/app', keywords: 'customer payment collect' },
  { id: 'evidence', type: 'page', title: 'الأدلة والفحوص', subtitle: 'الحالات المختبرة ونتائجها', href: '#/evidence', keywords: 'tests fixtures evidence' },
  { id: 'ecosystem', type: 'page', title: 'المنظومة وخارطة الطريق', subtitle: 'المجالات السبعة وما المطبّق منها', href: '#/ecosystem', keywords: 'roadmap ecosystem figma' },
]

/** Machine-readable knowledge for tools and agents. Only fields that exist in the dataset. */
export function knowledgeExport(componentIds: string[], ruleIds: string[] = [], patternIds: string[] = []) {
  const comps = COMPONENTS.filter((c) => componentIds.includes(c.id))
  const ruleSet = new Set([...ruleIds, ...comps.flatMap((c) => c.rules)])
  return {
    $schema: 'ax.knowledge.v0 (draft)',
    generatedAt: new Date().toISOString(),
    note: 'Synthetic prototype dataset. Rules are proposals (review: proposed). MCP endpoint: planned, not implemented.',
    components: comps.map((c) => ({
      id: c.id,
      name: { ar: c.name, en: c.nameEn },
      maturity: c.maturity,
      relationship: c.relationship,
      anatomy: c.anatomy,
      states: c.states,
      implementation: c.implementation,
      rules: c.rules,
      patterns: c.patterns,
      tests: c.tests,
      limitations: c.limitations,
    })),
    rules: RULES.filter((r) => ruleSet.has(r.id)).map((r) => ({ id: r.id, title: r.title, problem: r.problem, recommendation: r.recommendation, context: r.context, exceptions: r.exceptions, review: r.review, source: r.source.label, tests: r.tests })),
    patterns: PATTERNS.filter((p) => patternIds.includes(p.id)).map((p) => ({ id: p.id, title: p.title, job: p.job, status: p.status, components: p.components, rules: p.rules })),
    fixtures: FIXTURES.filter((f) => comps.some((c) => c.tests.includes(f.id))).map((f) => ({ id: f.id, requirement: f.requirement, input: f.input, expected: f.expected, rule: f.rule })),
  }
}
