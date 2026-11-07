/**
 * Ant Design parity matrix — types. The data lives in ./antd.ts; the page is src/pages/ParityPage.tsx.
 * "We compete with Ant Design" is measured, not claimed: every row has a status, where it lives, and evidence.
 */

/** missing: we have nothing · partial: some of it · parity: equivalent · better: a concrete Arabic/RTL advantage that exists in code. */
export type ParityStatus = 'missing' | 'partial' | 'parity' | 'better'

/** Where our implementation lives: legacy = src/system, atomic = src/atomic, none = not implemented. */
export type ParityTrack = 'legacy' | 'atomic' | 'none'

export type ParityCategory = 'general' | 'layout' | 'navigation' | 'data-entry' | 'data-display' | 'feedback' | 'other'

export type ParityPriority = 'p0' | 'p1' | 'p2'

export interface ParityFeature {
  id: string
  name: string
  nameAr: string
  status: ParityStatus
  track: ParityTrack
  /** Test or check IDs (unit test names, browser checks, fixtures) that prove the status. */
  evidence?: string[]
  note?: string
  /** What Arabic/RTL-specific advantage or risk applies. Required when status is 'better'. */
  arabicEdge?: string
}

export interface ParityComponent {
  /** kebab-case, e.g. 'table' */
  id: string
  /** AntD export name, e.g. 'Table' */
  antd: string
  category: ParityCategory
  /** https://ant.design/components/<slug> */
  docs: string
  priority: ParityPriority
  status: ParityStatus
  track: ParityTrack
  /** Our component id (spec id), if any. */
  ours?: string
  features: ParityFeature[]
  note?: string
}

export type AntdEcosystemKind = 'pro-components' | 'charts' | 'templates' | 'mobile' | 'ai' | 'icons' | 'tooling' | 'docs' | 'design-kit'

/** Beyond-components items: what makes teams pick AntD besides the component list. */
export interface AntdEcosystemItem {
  id: string
  name: string
  nameAr: string
  kind: AntdEcosystemKind
  url: string
  priority: ParityPriority
  status: ParityStatus
  track: ParityTrack
  ours?: string
  evidence?: string[]
  note?: string
  arabicEdge?: string
}

export type AntdEcosystem = AntdEcosystemItem[]

export type StatusCounts = Record<ParityStatus, number>

export interface ParitySummary {
  components: { total: number; byStatus: StatusCounts; covered: number; coveredPercent: number }
  features: { total: number; byStatus: StatusCounts; covered: number; coveredPercent: number }
  table: { total: number; covered: number; coveredPercent: number }
  p0: { total: number; covered: number; coveredPercent: number }
  ecosystem: { total: number; byStatus: StatusCounts; covered: number }
  /** Feature rows (and ecosystem items) with status 'better'. */
  arabicAdvantages: number
}
