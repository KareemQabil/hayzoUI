import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { resolveTokens } from '../tokens'
import { ALL_SELECTIONS, BASE_LAYERS, CONTEXTS, resolveExperienceStyle, type ExperienceSelection } from './experience'

const style = (s: ExperienceSelection) => {
  const r = resolveExperienceStyle(s)
  if (!r.ok) throw new Error(`${JSON.stringify(s)} → ${r.stage}: ${JSON.stringify(r.issues).slice(0, 600)}`)
  return r.style
}

/** Every var(--hz-…) a recipe reads: the recipe token contract, read from the CSS itself. */
function recipeVariables(): string[] {
  const dir = fileURLToPath(new URL('./recipes/', import.meta.url))
  const names = new Set<string>()
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.css'))) {
    for (const m of fs.readFileSync(dir + file, 'utf8').matchAll(/var\((--hz-[a-z0-9-]+)/g)) names.add(m[1]!)
  }
  return [...names].sort()
}

describe('experience styles (first proof)', () => {
  test('AT-ST-01 all 18 compositions (3 visual systems × 3 contexts × ar/en) resolve with no issues', () => {
    expect(ALL_SELECTIONS).toHaveLength(18)
    for (const s of ALL_SELECTIONS) expect(Object.keys(style(s).variables).length).toBeGreaterThan(50)
  })

  test('AT-ST-02 recipes read only component tokens, and every one of them resolves in every composition', () => {
    const used = recipeVariables()
    expect(used.length).toBeGreaterThan(30)
    expect(used.filter((v) => !v.startsWith('--hz-component-'))).toEqual([])
    for (const s of ALL_SELECTIONS) {
      const vars = style(s).variables
      expect(used.filter((v) => !(v in vars)), JSON.stringify(s)).toEqual([])
    }
  })

  test('AT-ST-03 a context changes sizes only; a visual system changes treatment only; language changes neither', () => {
    const base = style({ visual: 'quiet', context: 'saas', language: 'ar' }).variables
    const diff = (other: Readonly<Record<string, string>>) => Object.keys(base).filter((k) => base[k] !== other[k] && k.startsWith('--hz-component-')).sort()
    const pos = diff(style({ visual: 'quiet', context: 'pos', language: 'ar' }).variables)
    expect(pos.length).toBeGreaterThan(5)
    expect(pos.every((k) => /height|padding|font-size|gap|target-min|label-size|help-size|label-size|size$/.test(k))).toBe(true)
    const soft = diff(style({ visual: 'soft', context: 'saas', language: 'ar' }).variables)
    expect(soft.length).toBeGreaterThan(3)
    expect(soft.some((k) => /height|font-size|padding-inline$|gap/.test(k) && !k.includes('field-padding'))).toBe(false)
    expect(diff(style({ visual: 'quiet', context: 'saas', language: 'en' }).variables)).toEqual([])
  })

  test('AT-ST-04 the three visual systems are materially different on the same component tokens', () => {
    const pick = (visual: ExperienceSelection['visual']) => {
      const v = style({ visual, context: 'saas', language: 'ar' }).variables
      return [v['--hz-component-button-radius'], v['--hz-component-field-border-width-block-start'], v['--hz-component-field-font-family']].join(' | ')
    }
    expect(new Set([pick('quiet'), pick('editorial'), pick('soft')]).size).toBe(3)
  })

  test('AT-ST-05 POS meets the 44px touch target; ERP stays dense', () => {
    for (const visual of ['quiet', 'editorial', 'soft'] as const) {
      const pos = style({ visual, context: 'pos', language: 'ar' }).variables
      const erp = style({ visual, context: 'erp', language: 'en' }).variables
      expect(parseFloat(pos['--hz-component-button-height-sm']!)).toBeGreaterThanOrEqual(44)
      expect(parseFloat(pos['--hz-component-button-target-min']!)).toBeGreaterThanOrEqual(44)
      expect(parseFloat(erp['--hz-component-button-height-md']!)).toBeLessThanOrEqual(32)
    }
    expect(CONTEXTS.pos.density).toBe('touch')
  })

  test('AT-ST-06 a context cannot change a color: the engine rejects the override', () => {
    const rogue = { ...CONTEXTS.pos.layer, id: 'context-rogue', tokens: [...CONTEXTS.pos.layer.tokens, { path: 'color.action.primary', type: 'color', value: '#FF0000', overridableBy: [] }] }
    const result = resolveTokens([...BASE_LAYERS, rogue])
    expect(result.isValid).toBe(false)
    expect(result.issues.map((i) => i.code)).toContain('UNAUTHORIZED_OVERRIDE')
  })

  test('AT-ST-07 resolution is deterministic and records the exact layers', () => {
    const a = style({ visual: 'editorial', context: 'erp', language: 'en' })
    const b = style({ visual: 'editorial', context: 'erp', language: 'en' })
    expect(a.variables).toEqual(b.variables)
    expect(a.layers).toEqual(['hz-primitives', 'hz-semantics', 'hz-components', 'hz-components-choice', 'hz-components-overlay', 'hz-components-table', 'brand.neutral-blue@0.1.0', 'visual.editorial@0.1.0', 'context.erp-compact@0.1.0'])
    expect(a.recipes).toEqual(['recipes.atomic-core@0.1.0'])
    expect(a.context.direction).toBe('ltr')
  })
})
