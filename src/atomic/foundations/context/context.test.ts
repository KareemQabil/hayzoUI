import { describe, expect, test } from 'vitest'
import Ajv from 'ajv'
import experienceProfileSchema from './schema/experience-profile.v1.schema.json'
import { DEFAULT_EXPERIENCE_CONTEXT } from './defaults'
import { profileToContextLayer, resolveContextLayers } from './resolve'
import { isExperienceProfileDefinition, validateContextValues, validateExperienceProfile } from './validate'
import {
  arabicErpCompactProfile,
  arabicPosTouchProfile,
  englishCrmDefaultProfile,
} from './examples/profiles'
import type { ContextLayer, ExperienceContext } from './types'

const validateProfileSchema = new Ajv({ allErrors: true, strict: false }).compile(experienceProfileSchema)

describe('context validation', () => {
  test('CTX-01 accepts the complete Arabic-first project default context', () => {
    expect(validateContextValues(DEFAULT_EXPERIENCE_CONTEXT).valid).toBe(true)
  })

  test('CTX-02 permits a partial layer without inventing missing values', () => {
    expect(validateContextValues({ locale: 'ar-EG' }, { partial: true })).toEqual({ valid: true, issues: [] })
  })

  test('CTX-03 rejects a missing required field in a complete context', () => {
    const result = validateContextValues({ locale: 'ar-EG' })
    expect(result.valid).toBe(false)
    expect(result.issues.some((entry) => entry.code === 'missing-required-field' && entry.path === 'context.direction')).toBe(true)
  })

  test('CTX-04 rejects malformed BCP 47 locale tags', () => {
    const result = validateContextValues({ locale: 'arabic_EG' }, { partial: true })
    expect(result.issues[0]?.code).toBe('invalid-locale')
  })

  test('CTX-05 does not accept locale as a substitute for explicit direction', () => {
    const result = validateContextValues({ locale: 'ar-EG' })
    expect(result.issues.some((entry) => entry.path === 'context.direction')).toBe(true)
  })

  test('CTX-06 validates numbering systems and calendars independently', () => {
    const result = validateContextValues(
      { numberingSystem: 'arab', calendar: 'islamic-umalqura' },
      { partial: true },
    )
    expect(result.valid).toBe(true)
    const invalid = validateContextValues({ numberingSystem: 'Arabic Indic' }, { partial: true })
    expect(invalid.issues[0]?.code).toBe('invalid-numbering-system')
  })

  test('CTX-07 validates region, time-zone shape, and ISO weekday range', () => {
    const result = validateContextValues(
      { region: 'SA', defaultCurrency: 'SAR', timeZone: 'Asia/Riyadh', firstDayOfWeek: 7 },
      { partial: true },
    )
    expect(result.valid).toBe(true)

    const invalid = validateContextValues(
      { region: 'Saudi Arabia', defaultCurrency: 'Saudi Riyal', timeZone: '../Riyadh', firstDayOfWeek: 8 },
      { partial: true },
    )
    expect(invalid.issues.map((entry) => entry.code)).toEqual([
      'invalid-region',
      'invalid-currency',
      'invalid-time-zone-format',
      'invalid-first-day-of-week',
    ])
  })

  test('CTX-08 rejects unknown context fields instead of silently accepting typos', () => {
    const result = validateContextValues({ locale: 'en', direciton: 'rtl' }, { partial: true })
    expect(result.issues.some((entry) => entry.code === 'unknown-field')).toBe(true)
  })

  test('CTX-09 validates every enumerated preference', () => {
    const result = validateContextValues(
      {
        density: 'spacious',
        motion: 'auto',
        contrast: 'high',
        inputModality: 'trackpad',
        mixedScriptAlignment: 'physical-left',
      },
      { partial: true },
    )
    expect(result.issues.map((entry) => entry.code)).toEqual([
      'invalid-density',
      'invalid-motion',
      'invalid-contrast',
      'invalid-input-modality',
      'invalid-mixed-script-alignment',
    ])
  })
})

describe('experience profile contract', () => {
  test('CTX-10 accepts the Arabic POS touch reference profile', () => {
    expect(validateExperienceProfile(arabicPosTouchProfile).valid).toBe(true)
    expect(isExperienceProfileDefinition(arabicPosTouchProfile)).toBe(true)
  })

  test('CTX-11 accepts the Arabic ERP compact and English CRM reference profiles', () => {
    expect(validateExperienceProfile(arabicErpCompactProfile).valid).toBe(true)
    expect(validateExperienceProfile(englishCrmDefaultProfile).valid).toBe(true)
  })

  test('CTX-12 rejects unversioned or malformed profile references', () => {
    const result = validateExperienceProfile({
      ...arabicPosTouchProfile,
      visualSystem: { id: 'Quiet Enterprise', version: 'latest' },
    })
    expect(result.valid).toBe(false)
    expect(result.issues.some((entry) => entry.code === 'invalid-profile-reference')).toBe(true)
  })

  test('CTX-13 rejects unrecognized profile properties', () => {
    const result = validateExperienceProfile({ ...arabicPosTouchProfile, theme: 'blue' })
    expect(result.issues.some((entry) => entry.code === 'unknown-field')).toBe(true)
  })

  test('CTX-14 profile references remain separate from context values', () => {
    const layer = profileToContextLayer(arabicPosTouchProfile)
    expect(layer.kind).toBe('experience-profile')
    expect(layer.values.direction).toBe('rtl')
    expect(layer.values.density).toBe('touch')
    expect('visualSystem' in layer.values).toBe(false)
  })

})

describe('context layer resolution', () => {
  test('CTX-15 returns explicit library defaults when no layers are supplied', () => {
    const result = resolveContextLayers([])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.context).toEqual(DEFAULT_EXPERIENCE_CONTEXT)
    expect(result.appliedLayers).toEqual([])
  })

  test('CTX-16 does not infer RTL from an Arabic locale', () => {
    const result = resolveContextLayers([
      { id: 'arabic-locale-explicit-ltr', kind: 'experience-profile', values: { locale: 'ar-EG', direction: 'ltr' } },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.context.locale).toBe('ar-EG')
    expect(result.context.direction).toBe('ltr')
  })

  test('CTX-17 applies layers in fixed precedence, not caller array order', () => {
    const layers: ContextLayer[] = [
      { id: 'user', kind: 'user-preferences', values: { density: 'compact', motion: 'reduced' } },
      { id: 'preset', kind: 'context-preset', values: { density: 'touch', motion: 'full' } },
      { id: 'system', kind: 'system-preferences', values: { motion: 'full', contrast: 'more' } },
    ]
    const result = resolveContextLayers(layers)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.context.density).toBe('compact')
    expect(result.context.motion).toBe('reduced')
    expect(result.context.contrast).toBe('more')
    expect(result.appliedLayers).toEqual(['preset', 'system', 'user'])
  })

  test('CTX-18 applies later layers of the same kind in caller order', () => {
    const result = resolveContextLayers([
      { id: 'workspace', kind: 'user-preferences', values: { density: 'compact' } },
      { id: 'operator', kind: 'user-preferences', values: { density: 'touch' } },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.context.density).toBe('touch')
    expect(result.appliedLayers).toEqual(['workspace', 'operator'])
  })

  test('CTX-19 records the winning source and complete override history', () => {
    const result = resolveContextLayers([
      { id: 'pos', kind: 'context-preset', values: { density: 'touch' } },
      { id: 'profile', kind: 'experience-profile', values: { density: 'default' } },
      { id: 'operator', kind: 'user-preferences', values: { density: 'compact' } },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.trace.density?.source.id).toBe('operator')
    expect(result.trace.density?.contributions.map((entry) => entry.value)).toEqual([
      'default',
      'touch',
      'default',
      'compact',
    ])
  })

  test('CTX-20 rejects duplicate layer identifiers atomically', () => {
    const result = resolveContextLayers([
      { id: 'same', kind: 'context-preset', values: { density: 'touch' } },
      { id: 'same', kind: 'user-preferences', values: { density: 'compact' } },
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues[0]?.code).toBe('duplicate-layer-id')
  })

  test('CTX-21 fails the whole resolution when any layer is invalid', () => {
    const result = resolveContextLayers([
      { id: 'valid', kind: 'context-preset', values: { density: 'touch' } },
      { id: 'invalid', kind: 'user-preferences', values: { density: 'huge' } as unknown as Partial<ExperienceContext> },
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues[0]?.path).toBe('layers[1].values.density')
  })

  test('CTX-22 returns a provenance record for defaults and optional fields', () => {
    const result = resolveContextLayers([
      { id: 'sa-region', kind: 'experience-profile', values: { region: 'SA', defaultCurrency: 'SAR', timeZone: 'Asia/Riyadh' } },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.trace.direction?.source.kind).toBe('library-default')
    expect(result.trace.region?.source.id).toBe('sa-region')
    expect(result.trace.defaultCurrency?.value).toBe('SAR')
    expect(result.trace.timeZone?.value).toBe('Asia/Riyadh')
  })

  test('CTX-23 does not mutate layer inputs or default values', () => {
    const values = { locale: 'ar-SA', direction: 'rtl' as const, density: 'touch' as const }
    const layer: ContextLayer = { id: 'profile', kind: 'experience-profile', values }
    const before = JSON.stringify(layer)
    resolveContextLayers([layer])
    expect(JSON.stringify(layer)).toBe(before)
    expect(DEFAULT_EXPERIENCE_CONTEXT.locale).toBe('ar-EG')
  })

  test('CTX-24 produces stable output for the same inputs', () => {
    const layers: ContextLayer[] = [
      { id: 'preset', kind: 'context-preset', values: { density: 'touch' } },
      { id: 'user', kind: 'user-preferences', values: { direction: 'rtl', locale: 'ar-EG' } },
    ]
    expect(resolveContextLayers(layers)).toEqual(resolveContextLayers(layers))
  })

  test('CTX-25 composes independent Arabic POS and ERP profiles without component forks', () => {
    const pos = resolveContextLayers([profileToContextLayer(arabicPosTouchProfile)])
    const erp = resolveContextLayers([profileToContextLayer(arabicErpCompactProfile)])
    expect(pos.ok && pos.context.density).toBe('touch')
    expect(erp.ok && erp.context.density).toBe('compact')
    expect(pos.ok && pos.context.direction).toBe('rtl')
    expect(erp.ok && erp.context.direction).toBe('rtl')
  })

})

describe('additional context contracts', () => {
  test('CTX-26 JSON Schema accepts the proposed profile examples', () => {
    expect(validateProfileSchema(arabicPosTouchProfile)).toBe(true)
    expect(validateProfileSchema(arabicErpCompactProfile)).toBe(true)
    expect(validateProfileSchema(englishCrmDefaultProfile)).toBe(true)
  })

  test('CTX-27 JSON Schema rejects unknown profile and context properties', () => {
    expect(validateProfileSchema({ ...arabicPosTouchProfile, unexpected: true })).toBe(false)
    expect(validateProfileSchema({
      ...arabicPosTouchProfile,
      context: { ...arabicPosTouchProfile.context, direciton: 'rtl' },
    })).toBe(false)
  })
  test('CTX-28 rejects unknown context layer properties', () => {
    const result = resolveContextLayers([
      { id: 'preset', kind: 'context-preset', values: { density: 'touch' }, priority: 999 } as unknown as ContextLayer,
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((entry) => entry.code === 'unknown-field' && entry.path === 'layers[0].priority')).toBe(true)
  })
})
