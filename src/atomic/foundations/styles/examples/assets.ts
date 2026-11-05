import type {
  BrandThemeDefinition,
  ContextPresetDefinition,
  VisualSystemDefinition,
} from '../types'

/**
 * Proposed registry assets used to exercise composition contracts.
 * These are examples, not published themes or claims of visual test coverage.
 */
export const quietEnterpriseVisualSystem: VisualSystemDefinition = {
  schemaVersion: 1,
  kind: 'visual-system',
  id: 'quiet-enterprise',
  version: '0.1.0',
  name: 'Quiet Enterprise',
  description: 'A restrained, information-first visual language.',
  principles: [
    'Clear hierarchy before decoration',
    'Consistent geometry and restrained elevation',
    'Readable information density',
    'Motion communicates state rather than ornament',
  ],
  tokenLayers: [{ id: 'visual.quiet-enterprise', version: '0.1.0' }],
  recipeLayers: [{ id: 'recipes.quiet-enterprise', version: '0.1.0' }],
  supportedAppearanceModes: ['light', 'dark'],
  supportedDensities: ['compact', 'default', 'touch'],
}

export const editorialCleanVisualSystem: VisualSystemDefinition = {
  schemaVersion: 1,
  kind: 'visual-system',
  id: 'editorial-clean',
  version: '0.1.0',
  name: 'Editorial Clean',
  description: 'A typography-led visual language with generous content rhythm.',
  principles: [
    'Typography carries the primary hierarchy',
    'Generous reading rhythm and restrained surfaces',
    'Content-first responsive composition',
  ],
  tokenLayers: [{ id: 'visual.editorial-clean', version: '0.1.0' }],
  recipeLayers: [{ id: 'recipes.editorial-clean', version: '0.1.0' }],
  supportedAppearanceModes: ['light'],
  supportedDensities: ['default', 'touch'],
}

export const neutralBlueBrandTheme: BrandThemeDefinition = {
  schemaVersion: 1,
  kind: 'brand-theme',
  id: 'neutral-blue',
  version: '0.1.0',
  name: 'Neutral Blue',
  description: 'A neutral foundation with a blue primary brand accent.',
  tokenLayers: [{ id: 'brand.neutral-blue', version: '0.1.0' }],
  appearanceModes: ['light', 'dark'],
}

export const darkOnlyBrandTheme: BrandThemeDefinition = {
  schemaVersion: 1,
  kind: 'brand-theme',
  id: 'dark-only',
  version: '0.1.0',
  name: 'Dark Only',
  description: 'A deliberately limited theme for compatibility testing.',
  tokenLayers: [{ id: 'brand.dark-only', version: '0.1.0' }],
  appearanceModes: ['dark'],
}

export const posTouchContextPreset: ContextPresetDefinition = {
  schemaVersion: 1,
  kind: 'context-preset',
  id: 'pos-touch',
  version: '0.1.0',
  name: 'POS Touch',
  description: 'Touch-first operational defaults for point-of-sale workflows.',
  productContext: 'pos',
  tokenLayers: [{ id: 'context.pos-touch', version: '0.1.0' }],
  recipeLayers: [{ id: 'recipes.pos-touch', version: '0.1.0' }],
  supportedDensities: ['touch', 'default'],
  requirements: {
    minimumTargetSize: 'touch',
    dataDensity: 'medium',
    keyboardPriority: 'standard',
    responsiveStrategy: 'adaptive',
    supportedInputModalities: ['touch', 'keyboard', 'assistive'],
  },
  environmentDefaults: {
    direction: 'rtl',
    density: 'touch',
    inputModality: 'touch',
  },
}

export const erpCompactContextPreset: ContextPresetDefinition = {
  schemaVersion: 1,
  kind: 'context-preset',
  id: 'erp-compact',
  version: '0.1.0',
  name: 'ERP Compact',
  description: 'Keyboard-efficient, information-dense desktop defaults.',
  productContext: 'erp',
  tokenLayers: [{ id: 'context.erp-compact', version: '0.1.0' }],
  recipeLayers: [{ id: 'recipes.erp-compact', version: '0.1.0' }],
  supportedDensities: ['compact', 'default'],
  requirements: {
    minimumTargetSize: 'standard',
    dataDensity: 'high',
    keyboardPriority: 'high',
    responsiveStrategy: 'desktop-first',
    supportedInputModalities: ['pointer', 'keyboard', 'assistive'],
  },
  environmentDefaults: {
    density: 'compact',
    inputModality: 'pointer',
  },
}

export const crmResponsiveContextPreset: ContextPresetDefinition = {
  schemaVersion: 1,
  kind: 'context-preset',
  id: 'crm-responsive',
  version: '0.1.0',
  name: 'CRM Responsive',
  description: 'Responsive record and relationship workflows across desktop and mobile.',
  productContext: 'crm',
  tokenLayers: [{ id: 'context.crm-responsive', version: '0.1.0' }],
  recipeLayers: [{ id: 'recipes.crm-responsive', version: '0.1.0' }],
  supportedDensities: ['default', 'touch'],
  requirements: {
    minimumTargetSize: 'touch',
    dataDensity: 'medium',
    keyboardPriority: 'high',
    responsiveStrategy: 'mobile-first',
    supportedInputModalities: ['pointer', 'touch', 'keyboard', 'assistive'],
  },
  environmentDefaults: {
    direction: 'ltr',
    density: 'default',
    inputModality: 'unknown',
  },
}
