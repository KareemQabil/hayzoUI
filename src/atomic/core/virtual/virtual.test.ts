import { describe, expect, it } from 'vitest'
import { computeWindow, createSizeCache, normalizeScrollLeft, scrollToIndex } from './index'

const cache=(count=10,estimate=10)=>createSizeCache(count,estimate)
const windowOf=(count=10,viewport=20,scroll=0,overscan=0)=>{
 const sizes=cache(count)
 return computeWindow({count,viewport,scroll,overscan,sizes})
}
describe('headless virtualization',()=>{
  it('VW-001 empty cache has zero total',()=>expect(cache(0).total()).toBe(0))
  it('VW-002 empty cache indexAt returns zero sentinel',()=>expect(cache(0).indexAt(42)).toBe(0))
  it('VW-003 uniform estimate sets total',()=>expect(cache(10,12).total()).toBe(120))
  it('VW-004 offsetOf zero is zero',()=>expect(cache().offsetOf(0)).toBe(0))
  it('VW-005 offsetOf count reaches total',()=>expect(cache().offsetOf(10)).toBe(100))
  it('VW-006 uniform prefix offsets are exact',()=>expect(cache().offsetOf(4)).toBe(40))
  it('VW-007 indexAt zero starts at first row',()=>expect(cache().indexAt(0)).toBe(0))
  it('VW-008 indexAt positive interior returns containing row',()=>expect(cache().indexAt(19)).toBe(1))
  it('VW-009 indexAt exact boundary returns next row',()=>expect(cache().indexAt(20)).toBe(2))
  it('VW-010 indexAt total clamps to last row',()=>expect(cache().indexAt(100)).toBe(9))
  it('VW-011 indexAt negative clamps to first row',()=>expect(cache().indexAt(-100)).toBe(0))
  it('VW-012 indexAt overshoot clamps to last row',()=>expect(cache().indexAt(100000)).toBe(9))
  it('VW-013 set ch¶»§q«^