import { describe, expect, test } from 'vitest'
import Ajv from 'ajv'
import styleAssetSchema from './schema/style-asset.v1.schema.json'
import { profileToContextLayer, resolveContextLayers } from '../context/resolve'
import { contextPresetToContextLayer } from './bridge'
import {
  crmResponsiveContextPreset,
  darkOnlyBrandTheme,
  editorialCleanVisualSystem,
  erpCompactContextPreset,
  neutralBlueBrandTheme,
  posTouchContextPreset,
  quietEnterpriseVisualSystem,
} from './examples/assets'
import {
  validateBrandThemeDefinition,
  validateContextPresetDefinition,
  validateExperienceComposition,
  validateVisualSystemDefinition,
} from './validate'
import {
  arabicErpCompactProfile,
  arabicPosTouchProfile,
  englishCrmDefaultProfile,
} from '../context/examples/profiles'
import type { ContextPresetDefinition } from './types'

const validateStyleAssetSchema = new Ajv({ allErrors: true, strict: false }).compile(styleAssetSchema)

describe('style asset contracts', () => {
  test('STYLE-01 validates visual systems, brand themes, and context presets', () => {
    expect(validateVisualSystemDefinition(quietEnterpriseVisualSystem).valid).toBe(true)
    expect(validateVisualSystemDefinition(editorialCleanVisualSystem).valid).toBe(true)
    expect(validateBrandThemeDefinition(neutralBlueBrandTheme).valid).toBe(true)
    expect(validateContextPresetDefinition(posTouchContextPreset).valid).toBe(true)
    expect(validateContextPresetDefinition(erpCompactContextPreset).valid).toBe(true)
    expect(validateContextPresetDefinition(crmResponsiveContextPreset).valid).toBe(true)
  })

  test('STYLE-02 JSON Schema accepts all proposed style assets', () => {
    for (const asset of [
      quietEnterpriseVisualSystem,
      editorialCleanVisualSystem,
      neutralBlueBrandTheme,
      darkOnlyBrandTheme,
      posTouchContextPreset,
      erpCompactContextPreset,
      crmResponsiveContextPreset,
    ]) {
      expect(validateStyleAssetSchema(asset)).toBe(true)
    }
  })

  test('STYLE-03 rejects unknown fields and malformed references', () => {
    expect(validateVisualSystemDefinition({ ...quietEnterpriseVisualSystem, colors: {} }).valid).toBe(false)
    expect(validateBrandThemeDefinition({
      ...neutralBlueBrandTheme,
      tokenLayers: [{ id: 'Brand Colors', version: 'latest' }],
    }).valid).toBe(false)
  })

  test('STYLE-04 rejects duplicate references', () => {
    const result = validateVisualSystemDefinition({
      ...quietEnterpriseVisualSystem,
      tokenLayers: [
        ...quietEnterpriseVisualSystem.tokenLayers,
        { id: quietEnterpriseVisualSystem.tokenLayers[0].id, version: '0.2.0' },
      ],
    })
    expect(result.valid).toBe(false)
    expect(result.issues.some((entry) => entry.code === 'duplicate-reference')).toBe(true)
  })

  test('STYLE-05 rejects context defaults that violate preset capabilities', () => {
    const result = validateContextPresetDefinition({
      ...posTouchContextPreset,
      supportedDensities: ['default'],
      environmentDefaults: { density: 'touch', inputModality: 'touch' },
    })
    expect(result.valid).toBe(false)
    expect(result.issues.some((entry) => entry.code === 'incompatible-default')).toBe(true)
  })

  test('STYLE-06 accepts the Arabic POS profile composition', () => {
    const result = validateExperienceComposition(
      arabicPosTouchProfile,
      quietEnterpriseVisualSystem,
      neutralBlueBrandTheme,
      posTouchContextPreset,
    )
    expect(result.valid).toBe(true)
  })

  test('STYLE-07 accepts the Arabic ERP profile composition', () => {
    const result = validateExperienceComposition(
      arabicErpCompactProfile,
      quietEnterpriseVisualSystem,
      neutralBlueBrandTheme,
      erpCompactContextPreset,
    )
    expect(result.valid).toBe(true)
  })

  test('STYLE-08 accepts the English CRM profile composition', () => {
    const result = validateExperienceComposition(
      englishCrmDefaultProfile,
      editorialCleanVisualSystem,
      neutralBlueBrandTheme,
      crmResponsiveContextPreset,
    )
    expect(result.valid).toBe(true)
  })

  test('STYLE-09 detects a mismatched asset version or identifier', () => {
    const result = validateExperienceComposition(
      arabicPosTouchProfile,
      { ...quietEnterpriseVisualSystem, version: '0.2.0' },
      neutralBlueBrandTheme,
      posTouchContextPreset,
    )
    expect(result.valid).toBe(false)
    expect(result.issues.some((entry) => entry.code === 'profile-reference-mismatch')).toBe(true)
  })

  test('STYLE-10 detects incompatible appearance modes', () => {
    const profile = {
      ...englishCrmDefaultProfile,
      brandTheme: { id: darkOnlyBrandTheme.id, version: darkOnlyBrandTheme.version },
    }
    const result = validateExperienceComposition(
      profile,
      editorialCleanVisualSystem,
      darkOnlyBrandTheme,
      crmResponsiveContextPreset,
    )
    expect(result.valid).toBe(false)
    expect(result.issues.some((entry) => entry.code === 'no-shared-appearance-mode')).toBe(true)
  })

  test('STYLE-11 detects unsupported profile density and input modality', () => {
    const preset: ContextPresetDefinition = {
      ...posTouchContextPreset,
      supportedDensities: ['default'],
      requirements: {
        ...posTouchContextPreset.requirements,
        supportedInputModalities: ['keyboard', 'assistive'],
      },
    }
    const result = validateExperienceComposition(
      arabicPosTouchProfile,
      quietEnterpriseVisualSystem,
      neutralBlueBrandTheme,
      preset,
    )
    expect(result.valid).toBe(false)
    expect(result.issues.some((entry) => entry.code === 'unsupported-density')).toBe(true)
    expect(result.issues.some((entry) => entry.code === 'unsupported-input-modality')).toBe(true)
  })

  test('STYLE-12 converts context preset and profile into separate context layers', () => {
    const result = resolveContextLayers([
      contextPresetToContextLayer(posTouchContextPreset),
      profileToContextLayer(arabicPosTouchProfile),
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.context.direction).toBe('rtl')
    expect(result.context.density).toBe('touch')
    expect(result.appliedLayers).toEqual(['pos-touch', 'arabic-pos-touch'])
  })
  test('STYLE-13 validates the minimum target and keyboard support contract', () => {
    const result = validateContextPresetDefinition({
      ...erpCompactContextPreset,
      requirements: {
        ...erpCompactContextPreset.requirements,
        minimumTargetSize: 'touch',
        keyboardPriority: 'high',
        supportedInputModalities: ['pointer'],
      },
    })
    expect(result.valid).toBe(false)
    expect(result.issues.filter((entry) => entry.code === 'incompatible-default')).toHaveLength(2)
  })

  test('STYLE-14 JSON Schema rejects unsupported touch and keyboard requirements', () => {
    const invalidPreset = {
      ...erpCompactContextPreset,
      requirements: {
        ...erpCompactContextPreset.requirements,
        minimumTargetSize: 'touch',
        keyboardPriority: 'high',
        supportedInputModalities: ['pointer'],
      },
    }
    expect(validateStyleAssetSchema(invalidPreset)).toBe(false)
  })

})
