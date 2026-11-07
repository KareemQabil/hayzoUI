import type { ExperienceProfileDefinition } from '../types'

/**
 * Illustrative compositions only. Referenced visual systems, themes, and context
 * presets are identifiers for future registry entries; these examples are not
 * evidence that those assets have shipped or passed a support matrix.
 */
export const arabicPosTouchProfile: ExperienceProfileDefinition = {
  schemaVersion: 1,
  id: 'arabic-pos-touch',
  version: '0.1.0',
  name: 'Arabic POS — Touch',
  description: 'Arabic-first touch environment for a point-of-sale workflow.',
  visualSystem: { id: 'quiet-enterprise', version: '0.1.0' },
  brandTheme: { id: 'neutral-blue', version: '0.1.0' },
  contextPreset: { id: 'pos-touch', version: '0.1.0' },
  context: {
    locale: 'ar-SA',
    direction: 'rtl',
    region: 'SA',
    defaultCurrency: 'SAR',
    numberingSystem: 'arab',
    calendar: 'gregory',
    timeZone: 'Asia/Riyadh',
    firstDayOfWeek: 7,
    density: 'touch',
    motion: 'full',
    contrast: 'normal',
    inputModality: 'touch',
    mixedScriptAlignment: 'ui',
  },
}

export const arabicErpCompactProfile: ExperienceProfileDefinition = {
  schemaVersion: 1,
  id: 'arabic-erp-compact',
  version: '0.1.0',
  name: 'Arabic ERP — Compact',
  description: 'Dense Arabic desktop environment for information-heavy workflows.',
  visualSystem: { id: 'quiet-enterprise', version: '0.1.0' },
  brandTheme: { id: 'neutral-blue', version: '0.1.0' },
  contextPreset: { id: 'erp-compact', version: '0.1.0' },
  context: {
    locale: 'ar-EG',
    direction: 'rtl',
    region: 'EG',
    defaultCurrency: 'EGP',
    numberingSystem: 'latn',
    calendar: 'gregory',
    timeZone: 'Africa/Cairo',
    firstDayOfWeek: 6,
    density: 'compact',
    motion: 'full',
    contrast: 'normal',
    inputModality: 'pointer',
    mixedScriptAlignment: 'ui',
  },
}

export const englishCrmDefaultProfile: ExperienceProfileDefinition = {
  schemaVersion: 1,
  id: 'english-crm-default',
  version: '0.1.0',
  name: 'English CRM — Default',
  description: 'English-language responsive CRM environment.',
  visualSystem: { id: 'editorial-clean', version: '0.1.0' },
  brandTheme: { id: 'neutral-blue', version: '0.1.0' },
  contextPreset: { id: 'crm-responsive', version: '0.1.0' },
  context: {
    locale: 'en-US',
    direction: 'ltr',
    region: 'US',
    defaultCurrency: 'USD',
    numberingSystem: 'latn',
    calendar: 'gregory',
    timeZone: 'America/New_York',
    firstDayOfWeek: 7,
    density: 'default',
    motion: 'reduced',
    contrast: 'normal',
    inputModality: 'unknown',
    mixedScriptAlignment: 'ui',
  },
}
