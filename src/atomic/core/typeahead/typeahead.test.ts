import { describe, expect, it } from 'vitest'
import { createTypeahead } from './index'

function fixture(names: readonly string[], timeoutMs=700) {
  let ms=0
  const keys=names.map((_,i)=>String(i))
  const textOf=(key:string)=>names[Number(key)]!
  const ta=createTypeahead({now:()=>ms,timeoutMs})
  return {keys,textOf,ta,clock:(n:number)=>{ms=n}}
}
describe('headless typeahead',()=>{
  it('TA-001 matches first item by initial',()=>{
    const f=fixture(['Apple','Banana'])
    expect(f.ta.search('a',f.keys,f.textOf,null)).toBe('0')
  })
  it('TA-002 case-folds Latin input',()=>{
    const f=fixture(['APPLE','Banana'])
    expect(f.ta.search('a',f.keys,f.textOf,null)).toBe('0')
  })
  it('TA-003 matches from next item and wraps',()=>{
    const f=fixture(['Apple','Apricot','Banana'])
    expect(f.ta.search('a',f.keys,f.textOf,'0')).toBe('1')
  })
  it('TA-004 wraps to first match at the end',()=>{
    const f=fixture(['Apple','Banana'])
    expect(f.ta.search('a',f.keys,f.textOf,'1')).toBe('0')
  })
  it('TA-005 returns null when none match',()=>{
    const f=fixture(['Apple','Banana'])
    expect(f.ta.search('z',f.keys,f.textOf,null)).toBeNull()
  })
  it('TA-006 returns null for empty keys',()=>{
    const f=fixture([])
    expect(f.ta.search('a',f.keys,f.textOf,null)).toBeNull()
  })
  it('TA-007 returns null for empty char',()=>{
    const f=fixture(['Apple'])
    expect(f.ta.search('',f.keys,f.textOf,null)).toBeNull()
  })
  it('TA-008 ignores diacritics in Arabic sourc¶»§q«^