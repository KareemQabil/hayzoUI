import type {
  Density,
  ExperienceContext,
  InputModality,
  VersionedReference,
} from '../context/types'

export type AppearanceMode = 'light' | 'dark'
export type ProductContextId = string
export type DataDensity = 'low' | 'medium' | 'high'
export type MinimumTargetSize = 'standard' | 'touch'
export type KeyboardPriority = 'standard' | 'high'
export type ResponsiveStrategy = 'mobile-first' | 'adaptive' | 'desktop-first'
export type SupportedInputModality = Exclude<InputModality, 'unknown'>

export interface StyleAssetBase {
  schemaVersion: 1
  id: string
  version: string
  name: string
  description?: string
}

export interface VisualSystemDefinition extends StyleAssetBase {
  kind: 'visual-system'
  /** Human-readable principles of the visual language; these are not executable styles. */
  principles: string[]
  /** Versioned references to token layers owned by the token engine. */
  tokenLayers: VersionedReference[]
  /** Versioned references to component recipe collections. */
  recipeLayers: VersionedReference[]
  supportedAppearanceModes: AppearanceMode[]
  supportedDensities: Density[]
}

export interface BrandThemeDefinition extends StyleAssetBase {
  kind: 'brand-theme'
  /** Brand identity values are supplied by referenced token layers, not inline component CSS. */
  tokenLayers: VersionedReference[]
  appearanceModes: AppearanceMode[]
}

export interface ContextPresetRequirements {
  minimumTargetSize: MinimumTargetSize
  dataDensity: DataDensity
  keyboardPriority: KeyboardPriority
  responsiveStrategy: ResponsiveStrategy
  supportedInputModalities: SupportedInputModality[]
}

export interface ContextPresetDefinition extends StyleAssetBase {
  kind: 'context-preset'
  /** Extensible slug such as pos, erp, crm, education, ecommerce, or healthcare. */
  productContext: ProductContextId
  tokenLayers: VersionedReference[]
  /** Optional recipes for context-specific compositions; behavior contracts remain unchanged. */
  recipeLayers?: VersionedReference[]
  supportedDensities: Density[]
  requirements: ContextPresetRequirements
  /** Environment defaults only. Style values belong in referenced token layers. */
  environmentDefaults?: Partial<ExperienceContext>
}

export type StyleAssetDefinition =
  | VisualSystemDefinition
  | BrandThemeDefinition
  | ContextPresetDefinition

export type StyleAssetIssueCode =
  | 'invalid-object'
  | 'unknown-field'
  | 'invalid-kind'
  | 'invalid-schema-version'
  | 'invalid-id'
  | 'invalid-version'
  | 'invalid-name'
  | 'invalid-description'
  | 'invalid-reference'
  | 'duplicate-reference'
  | 'invalid-list'
  | 'invalid-enum'
  | 'invalid-context'
  | 'incompatible-default'
  | 'profile-reference-mismatch'
  | 'no-shared-appearance-mode'
  | 'no-shared-density'
  | 'unsupported-density'
  | 'unsupported-input-modality'
  | 'unsupported-appearance-mode'
  | 'invalid-context-layer'

export interface StyleAssetIssue {
  code: StyleAssetIssueCode
  path: string
  message: string
  received?: unknown
}

export interface StyleAssetValidationResult {
  valid: boolean
  issues: StyleAssetIssue[]
}

export interface ExperienceCompositionValidationResult {
  valid: boolean
  issues: StyleAssetIssue[]
}
