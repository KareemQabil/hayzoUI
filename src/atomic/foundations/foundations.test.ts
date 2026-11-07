import Ajv from 'ajv'
import { expect, test } from 'vitest'
import { isExperienceProfileDefinition, validateContextValues, validateExperienceProfile } from './context/validate'
import { profileToContextLayer, resolveContextLayers } from './context/resolve'
import { arabicPosTouchProfile } from './context/examples/profiles'
import profileSchema from './context/schema/experience-profile.v1.schema.json'
import styleSchema from './styles/schema/style-asset.v1.schema.json'
import { contextPresetToContextLayer } from './styles/bridge'
import { neutralBlueBrandTheme, posTouchContextPreset } from './styles/examples/assets'
import { validateBrandThemeDefinition, validateContextPresetDefinition } from './styles/validate'
import type { ExperienceProfileDefinition } from './context/types'

const ajv = new Ajv({ allErrors: true })
const validateProfileSchema = ajv.compile(profileSchema)
const validateStyleSchema = ajv.compile(styleSchema)

test.each(['0.1.0', '1.2.3-beta.0', '1.0.0-0', '1.0.0-alpha-1', '1.0.0+build.001'])('accepts exact version %s in runtime and schemas', (version) => {
  const profile = { ...arabicPosTouchProfile, version, visualSystem: { ...arabicPosTouchProfile.visualSystem, version } }
  const theme = { ...neutralBlueBrandTheme, version, tokenLayers: [{ id: 'brand.palette', version }] }
  expect(validateExperienceProfile(profile).valid).toBe(true)
  expect(validateProfileSchema(profile)).toBe(true)
  expect(validateBrandThemeDefinition(theme).valid).toBe(true)
  expect(validateStyleSchema(theme)).toBe(true)
})

test.each(['01.0.0', '1.0.0-01', '1.0.0-.', '1.0.0-a..b', '1.0.0+.', '1.0.0+', '^1.0.0', 'latest'])('rejects non-exact or malformed version %s', (version) => {
  const profile = { ...arabicPosTouchProfile, version }
  const theme = { ...neutralBlueBrandTheme, version }
  expect(validateExperienceProfile(profile).valid).toBe(false)
  expect(validateProfileSchema(profile)).toBe(false)
  expect(validateBrandThemeDefinition(theme).valid).toBe(false)
  expect(validateStyleSchema(theme)).toBe(false)
  expect(validateExperienceProfile({ ...arabicPosTouchProfile, visualSystem: { id: 'visual', version } }).valid).toBe(false)
  expect(validateBrandThemeDefinition({ ...neutralBlueBrandTheme, tokenLayers: [{ id: 'brand', version }] }).valid).toBe(false)
})

test('schemas and runtime reject whitespace-only names and malformed time zones', () => {
  for (const profile of [
    { ...arabicPosTouchProfile, name: '  \t' },
    { ...arabicPosTouchProfile, context: { timeZone: 'Asia//Riyadh' } },
  ]) {
    expect(validateProfileSchema(profile)).toBe(false)
    expect(isExperienceProfileDefinition(profile)).toBe(false)
  }
  expect(validateStyleSchema({ ...neutralBlueBrandTheme, name: ' ' })).toBe(false)
})

test('inherited values cannot bypass validation and become context overrides', () => {
  const values = Object.create({ density: 'unvalidated-value' })
  expect(validateContextValues(values, { partial: true }).valid).toBe(false)
  expect(resolveContextLayers([{ id: 'inherited', kind: 'scope', values }]).ok).toBe(false)
  const profile = Object.assign(Object.create({ context: values }), arabicPosTouchProfile)
  expect(validateExperienceProfile(profile).valid).toBe(false)
})

test('plain records without prototypes remain supported', () => {
  const values = Object.assign(Object.create(null), { density: 'touch' })
  const result = resolveContextLayers([{ id: 'plain', kind: 'scope', values }])
  expect(result.ok && result.context.density).toBe('touch')
})

test('unknown is a valid current modality hint, never an advertised input capability', () => {
  const validPreset = { ...posTouchContextPreset, environmentDefaults: { inputModality: 'unknown' } }
  expect(validateContextPresetDefinition(validPreset).valid).toBe(true)
  expect(validateStyleSchema(validPreset)).toBe(true)
  const invalidPreset = {
    ...posTouchContextPreset,
    requirements: { ...posTouchContextPreset.requirements, supportedInputModalities: ['touch', 'unknown'] },
  }
  expect(validateContextPresetDefinition(invalidPreset).valid).toBe(false)
  expect(validateStyleSchema(invalidPreset)).toBe(false)
})

test('bridge layers own a copy of their scalar environment values', () => {
  const profile: ExperienceProfileDefinition = structuredClone(arabicPosTouchProfile)
  const preset = structuredClone(posTouchContextPreset)
  const profileLayer = profileToContextLayer(profile)
  const presetLayer = contextPresetToContextLayer(preset)
  profile.context!.density = 'compact'
  preset.environmentDefaults!.density = 'compact'
  expect(profileLayer.values.density).toBe('touch')
  expect(presetLayer.values.density).toBe('touch')
  const result = resolveContextLayers([profileLayer, presetLayer])
  if (!result.ok) throw new Error('Valid layers must resolve')
  profileLayer.values.density = 'default'
  expect(result.context.density).toBe('touch')
  expect(result.trace.density?.value).toBe('touch')
})
