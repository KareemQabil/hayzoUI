import type { Dir } from '../keyboard'

export interface VirtualWindow { start: number; end: number; offsetStart: number; totalSize: number }

export function createSizeCache(count: number, estimate: number): {
  set(index: number, size: number): void
  offsetOf(index: number): number
  indexAt(offset: number): number
  total(): number
} {
  if (!Number.isSafeInteger(count) || count < 0 || !Number.isFinite(estimate) || estimate <= 0) {
    throw new RangeError('Count must be a nonnegative integer and estimate a positive finite size')
  }
  const values = new Float64Array(count)
  const fenwick = new Float64Array(count + 1)
  values.fill(estimate)
  // O(n) Fenwick build, rather than n repeated log(n) insertions.
  for (let i = 1; i <= count; i++) {
    fenwick[i]! += estimate
    const next = i + (i & -i)
    if (next <= count) fenwick[next]! += fenwick[i]!
  }
  let totalSize = count * estimate

  const validIndex = (index: number, allowEnd = false): boolean =>
    Number.isSafeInteger(index) && index >= 0 && index <= (allowEnd ? count : count - 1)
  const prefix = (end: number): number => {
    let result = 0
    for (let i = end; i > 0; i -= i & -i) result += fenwick[i]!
    return result
  }

  return {
    set(index, size) {
      if (!validIndex(index) || !Number.isFinite(size) || size <= 0) {
        throw new RangeError('Invalid size cache index or item size')
      }
      const delta = size - values[index]!
      values[index] = size
      totalSize += delta
      f¶»§q«^