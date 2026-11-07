import { describe, expect, test } from 'vitest'
import { computePosition, fitsOnSide, parsePlacement, type Direction, type Placement, type PositionInput, type Side } from './position'

/** mulberry32: small, fast, deterministic. Fixed seed so every run checks the same cases. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SIDES: Side[] = ['block-start', 'block-end', 'inline-start', 'inline-end']
const PLACEMENTS: Placement[] = SIDES.flatMap((s) => [s, `${s}-start`, `${s}-end`] as Placement[])
const OPPOSITE: Record<Side, Side> = { 'block-start': 'block-end', 'block-end': 'block-start', 'inline-start': 'inline-end', 'inline-end': 'inline-start' }
const CASES = 1000

/** Integer inputs only, so every comparison is exact and mirror symmetry is testable with toBe. */
function* cases(seed: number, dir: Direction): Generator<PositionInput> {
  const r = rng(seed)
  const int = (min: number, max: number) => min + Math.floor(r() * (max - min + 1))
  for (let i = 0; i < CASES; i++) {
    const viewport = { x: int(0, 40), y: int(0, 40), width: int(200, 1200), height: int(200, 900) }
    const padding = int(0, 16)
    const width = int(0, 200)
    const height = int(0, 80)
    // Anchor inside the viewport padding box (an on-screen trigger).
    const x = int(viewport.x + padding, Math.max(viewport.x + padding, viewport.x + viewport.width - padding - width))
    const y = int(viewport.y + padding, Math.max(viewport.y + padding, viewport.y + viewport.height - padding - height))
    yield { anchor: { x, y, width, height }, floating: { width: int(10, 500), height: int(10, 400) }, viewport, placement: PLACEMENTS[int(0, PLACEMENTS.length - 1)]!, dir, offset: int(0, 16), padding }
  }
}

const crossFits = (input: PositionInput, side: Side) => {
  const pad = 2 * (input.padding ?? 0)
  return side.startsWith('block') ? input.floating.width <= input.viewport.width - pad : input.floating.height <= input.viewport.height - pad
}

describe('computePosition (property tests, fixed seed, 1000 cases each)', () => {
  test('OV-01 the result stays inside the viewport padding whenever it can fit', () => {
    let checked = 0
    for (const dir of ['ltr', 'rtl'] as const) {
      for (const input of cases(0xc0ffee + (dir === 'rtl' ? 1 : 0), dir)) {
        const { side } = parsePlacement(input.placement)
        if (!(fitsOnSide(input, side) || fitsOnSide(input, OPPOSITE[side])) || !crossFits(input, side)) continue
        checked++
        const out = computePosition(input)
        const p = input.padding ?? 0
        const v = input.viewport
        expect(out.x, JSON.stringify(input)).toBeGreaterThanOrEqual(v.x + p)
        expect(out.y, JSON.stringify(input)).toBeGreaterThanOrEqual(v.y + p)
        expect(out.x + input.floating.width, JSON.stringify(input)).toBeLessThanOrEqual(v.x + v.width - p)
        expect(out.y + input.floating.height, JSON.stringify(input)).toBeLessThanOrEqual(v.y + v.height - p)
      }
    }
    expect(checked).toBeGreaterThan(500)
  })

  test('OV-02 RTL is the exact mirror image of LTR (all placements and alignments)', () => {
    for (const input of cases(0xbada55, 'ltr')) {
      const v = input.viewport
      const mirroredAnchor = { ...input.anchor, x: 2 * v.x + v.width - input.anchor.x - input.anchor.width }
      const ltr = computePosition(input)
      const rtl = computePosition({ ...input, anchor: mirroredAnchor, dir: 'rtl' })
      expect(rtl.placement, JSON.stringify(input)).toBe(ltr.placement)
      expect(rtl.y).toBe(ltr.y)
      expect(rtl.x, JSON.stringify(input)).toBe(2 * v.x + v.width - ltr.x - input.floating.width)
      if (ltr.arrow?.x !== undefined) expect(rtl.arrow?.x).toBe(input.floating.width - ltr.arrow.x)
      if (ltr.arrow?.y !== undefined) expect(rtl.arrow?.y).toBe(ltr.arrow.y)
    }
  })

  test('OV-03 flip happens only when needed, and keeps the alignment', () => {
    let flips = 0
    for (const dir of ['ltr', 'rtl'] as const) {
      for (const input of cases(0x5eed + (dir === 'rtl' ? 7 : 0), dir)) {
        const { side, align } = parsePlacement(input.placement)
        const out = parsePlacement(computePosition(input).placement)
        expect(out.align).toBe(align)
        if (fitsOnSide(input, side)) expect(out.side, JSON.stringify(input)).toBe(side)
        if (out.side !== side) {
          flips++
          expect(fitsOnSide(input, side)).toBe(false)
          expect(out.side).toBe(OPPOSITE[side])
        }
        if (!fitsOnSide(input, side) && fitsOnSide(input, OPPOSITE[side])) expect(out.side).toBe(OPPOSITE[side])
      }
    }
    expect(flips).toBeGreaterThan(20) // the generator actually exercises flipping
  })

  test('OV-04 logical sides and alignment: inline-start is the right side in RTL; -start aligns reading-start edges', () => {
    const base = { anchor: { x: 400, y: 300, width: 100, height: 40 }, floating: { width: 200, height: 100 }, viewport: { x: 0, y: 0, width: 1000, height: 800 }, offset: 8, padding: 8 }
    expect(computePosition({ ...base, placement: 'inline-start', dir: 'ltr' }).x).toBe(400 - 8 - 200)
    expect(computePosition({ ...base, placement: 'inline-start', dir: 'rtl' }).x).toBe(500 + 8)
    expect(computePosition({ ...base, placement: 'inline-end', dir: 'rtl' }).x).toBe(400 - 8 - 200)
    expect(computePosition({ ...base, placement: 'block-end-start', dir: 'ltr' })).toMatchObject({ x: 400, y: 348 })
    expect(computePosition({ ...base, placement: 'block-end-start', dir: 'rtl' })).toMatchObject({ x: 500 - 200, y: 348 })
    expect(computePosition({ ...base, placement: 'block-start-end', dir: 'rtl' })).toMatchObject({ x: 400, y: 300 - 8 - 100 })
    expect(computePosition({ ...base, placement: 'inline-end-end', dir: 'ltr' })).toMatchObject({ x: 508, y: 340 - 100 })
    expect(computePosition({ ...base, placement: 'block-end', dir: 'ltr' }).arrow).toEqual({ x: 100 })
  })

  test('OV-05 shift: the cross axis is clamped into the padding; oversized content pins to the reading start', () => {
    const base = { floating: { width: 300, height: 100 }, viewport: { x: 0, y: 0, width: 1000, height: 800 }, offset: 0, padding: 10 }
    expect(computePosition({ ...base, anchor: { x: 0, y: 300, width: 20, height: 20 }, placement: 'block-end', dir: 'ltr' }).x).toBe(10)
    expect(computePosition({ ...base, anchor: { x: 980, y: 300, width: 20, height: 20 }, placement: 'block-end', dir: 'ltr' }).x).toBe(1000 - 10 - 300)
    const huge = { ...base, floating: { width: 1200, height: 100 }, anchor: { x: 500, y: 300, width: 20, height: 20 }, placement: 'block-end' as const }
    expect(computePosition({ ...huge, dir: 'ltr' }).x).toBe(10)
    expect(computePosition({ ...huge, dir: 'rtl' }).x + 1200).toBe(1000 - 10)
  })

  test('OV-06 when neither side fits, the side with more room wins', () => {
    const input = { anchor: { x: 0, y: 100, width: 50, height: 20 }, floating: { width: 100, height: 500 }, viewport: { x: 0, y: 0, width: 400, height: 400 }, placement: 'block-start' as const, dir: 'ltr' as const }
    expect(computePosition(input).placement).toBe('block-end')
    expect(computePosition({ ...input, anchor: { ...input.anchor, y: 300 } }).placement).toBe('block-start')
  })
})
