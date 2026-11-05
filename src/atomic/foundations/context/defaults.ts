import type { ExperienceContext } from './types'

/**
 * Arabic-first project defaults.
 *
 * These values are explicit project fallbacks, not locale inference. In particular,
 * changing locale to Arabic does not automatically change direction, region,
 * numbering system, calendar, or week rules.
 */
export const DEFAULT_EXPERIENCE_CONTEXT: Readonly<ExperienceContext> = Object.freeze({
  locale: 'ar-EG',
  direction: 'rtl',
  numberingSystem: 'latn',
  calendar: 'gregory',
  density: 'default',
  motion: 'full',
  contrast: 'normal',
  inputModality: 'unknown',
  mixedScriptAlignment: 'ui',
})
