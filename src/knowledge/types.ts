/** Shared knowledge model. Every record has a stable id; relations are by id only. */
export type Maturity = 'planned' | 'draft' | 'alpha' | 'beta' | 'stable'
export type Relationship = 'original' | 'adapted' | 'integrated' | 'referenced'
export type ReviewStatus = 'proposed' | 'in-review' | 'accepted'
export type EvidenceStatus = 'proposed' | 'demo' | 'manual' | 'automated' | 'unchecked'

export interface Rule {
  id: string
  title: string
  problem: string
  rationale: string
  recommendation: string
  context: string
  exceptions: string
  source: { label: string; resourceId?: string }
  review: ReviewStatus
  components: string[]
  patterns: string[]
  tests: string[]
}

export interface ComponentRecord {
  id: string
  name: string
  nameEn: string
  family: 'actions' | 'inputs' | 'navigation' | 'feedback' | 'overlays' | 'data' | 'foundations'
  maturity: Maturity
  summary: string
  anatomy: string[]
  states: string[]
  relationship: Relationship
  primitive: string
  implementation: string
  rules: string[]
  patterns: string[]
  tests: string[]
  usedIn: string[]
  limitations: string[]
}

export interface PatternStep {
  title: string
  detail: string
  components: string[]
  states: string[]
}

export interface Pattern {
  id: string
  title: string
  job: string
  status: 'demonstrated' | 'partial' | 'proposed' | 'planned'
  trigger: string
  prerequisites: string[]
  steps: PatternStep[]
  decisions: Array<{ question: string; decision: string; rule?: string }>
  copy: Array<{ situation: string; text: string }>
  components: string[]
  rules: string[]
  risks: string[]
  reference?: string
}

export interface Resource {
  id: string
  title: string
  maintainer: string
  url: string
  kind: 'guidance' | 'research' | 'library' | 'font' | 'standard' | 'tool' | 'audit'
  relationship: Relationship
  license: string
  licenseStatus: 'verified-locally' | 'pending'
  licenseNote: string
  version: string
  environment: string
  role: string
  validation: string
}

export interface Fixture {
  id: string
  area: 'amount' | 'phone' | 'search' | 'format'
  requirement: string
  rule: string
  input: string
  expected: string
  run: () => { actual: string; pass: boolean }
}
