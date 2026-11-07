import { expect, test } from 'vitest'
import { resolveExperienceContext } from '../index'
import type { ExperienceContextInput } from '../index'
import { arabicErpCompactProfile, arabicPosTouchProfile, englishCrmDefaultProfile } from '../context/examples/profiles'
import {
  crmResponsiveContextPreset,
  editorialCleanVisualSystem,
  erpCompactContextPreset,
  neutralBlueBrandTheme,
  posTouchContextPreset,
  quietEnterpriseVisualSystem,
} from './examples/assets'

function posInput(overrides: Partial<ExperienceContextInput> = {}): ExperienceContextInput {
  return {
    profile: arabicPosTouchProfile,
    visualSystem: quietEnterpriseVisualSystem,
    brandTheme: neutralBlueBrandTheme,
    contextPreset: posTouchContextPreset,
    appearanceMode: 'light',
    ...overrides,
  }
}

test.each([
  [arabicPosTouchProfile, quietEnterpriseVisualSystem, posTouchContextPreset, 'touch', 'rtl'],
  [arabicErpCompactProfile, quietEnterpriseVisualSystem, erpCompactContextPreset, 'compact', 'rtl'],
  [englishCrmDefaultProfile, editorialCleanVisualSystem, crmResponsiveContextPreset, 'default', 'ltr'],
] as const)('resolves the effective environment of $0.id', (profile, visualSystem, contextPreset, density, direction) => {
  const result = resolveExperienceContext(posInput({ profile, visualSystem, contextPreset }))
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.context.density).toBe(density)
  expect(result.context.direction).toBe(direction)
  expect(result.appearanceMode).toBe('light')
})

test('validates density after scoped preferences and fails atomically', () => {
  const result = resolveExperienceContext(posInput({ preferenceLayers: [
    { id: 'nested', kind: 'scope', values: { density: 'compact' } },
  ] }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.issues).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 'unsupported-density', path: 'composition.context.density' }),
  ]))
  expect(result).not.toHaveProperty('context')
})

test('validates modality after user preferences', () => {
  const result = resolveExperienceContext(posInput({ preferenceLayers: [
    { id: 'operator', kind: 'user-preferences', values: { inputModality: 'pointer' } },
  ] }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.issues.some((issue) => issue.code === 'unsupported-input-modality')).toBe(true)
})

test('checks library defaults when neither profile nor preset specifies density', () => {
  const result = resolveExperienceContext(posInput({
    profile: { ...arabicPosTouchProfile, context: undefined },
    contextPreset: { ...posTouchContextPreset, supportedDensities: ['touch'], environmentDefaults: undefined },
  }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.issues.some((issue) => issue.code === 'unsupported-density')).toBe(true)
})

test('checks the actual appearance selection, beyond a nonempty mode intersection', () => {
  const result = resolveExperienceContext(posInput({
    profile: englishCrmDefaultProfile,
    visualSystem: editorialCleanVisualSystem,
    contextPreset: crmResponsiveContextPreset,
    appearanceMode: 'dark',
  }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.issues.some((issue) => issue.code === 'unsupported-appearance-mode')).toBe(true)
})

test('preserves context precedence and records the effective winning source', () => {
  const result = resolveExperienceContext(posInput({ preferenceLayers: [
    { id: 'local', kind: 'scope', values: { direction: 'ltr', density: 'default' } },
    { id: 'operator', kind: 'user-preferences', values: { direction: 'rtl' } },
    { id: 'os', kind: 'system-preferences', values: { motion: 'reduced' } },
  ] }))
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.context.direction).toBe('ltr')
  expect(result.context.locale).toBe('ar-SA')
  expect(result.context.motion).toBe('reduced')
  expect(result.trace.direction?.source.id).toBe('local')
  expect(JSON.parse(JSON.stringify(result))).toEqual(result)
})

test('reports all malformed assets without accessing invalid properties', () => {
  const result = resolveExperienceContext(posInput({ profile: null, visualSystem: {}, brandTheme: [], contextPreset: null }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  for (const path of ['profile', 'visualSystem', 'brandTheme', 'contextPreset']) {
    expect(result.issues.some((issue) => issue.path.startsWith(path))).toBe(true)
  }
})

test.each([null, {}, [null], [{ id: 'extra-preset', kind: 'context-preset', values: {} }]])('rejects invalid preference layers: %j', (preferenceLayers) => {
  expect(resolveExperienceContext(posInput({ preferenceLayers: preferenceLayers as never })).ok).toBe(false)
})

test('rejects invalid composition objects and absent appearance without throwing', () => {
  expect(resolveExperienceContext(null as never).ok).toBe(false)
  expect(resolveExperienceContext(posInput({ appearanceMode: undefined as never })).ok).toBe(false)
})

test('requires exact asset identities and versions', () => {
  const result = resolveExperienceContext(posInput({ brandTheme: { ...neutralBlueBrandTheme, version: '0.2.0' } }))
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.issues.some((issue) => issue.code === 'profile-reference-mismatch')).toBe(true)
})

test('does not mutate inputs and produces detached deterministic context snapshots', () => {
  const input = structuredClone(posInput())
  const before = JSON.stringify(input)
  const first = resolveExperienceContext(input)
  expect(resolveExperienceContext(input)).toEqual(first)
  expect(JSON.stringify(input)).toBe(before)
  Object.assign((input.profile as typeof arabicPosTouchProfile).context!, { direction: 'ltr' })
  expect(first.ok && first.context.direction).toBe('rtl')
})
