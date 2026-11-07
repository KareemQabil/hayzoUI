import { describe, expect, it } from 'vitest'
import { gridKeyAction, listKeyAction, type Dir, type GridPos, type KeyInput } from './index'

const list = (key: string, orientation: 'vertical'|'horizontal'='vertical', dir: Dir='ltr', extras:Partial<KeyInput>={}) =>
  listKeyAction({key,...extras},{orientation,dir})
const grid = (key: string, pos:GridPos={row:2,col:2}, dir:Dir='ltr', extras:Partial<KeyInput>={}) =>
  gridKeyAction({key,...extras},{pos,dir,rows:5,cols:5,pageSize:2})

describe('pure keyboard actions', () => {
  it('KB-001 vertical down is next',()=>expect(list('ArrowDown')).toBe('next'))
  it('KB-002 vertical up is prev',()=>expect(list('ArrowUp')).toBe('prev'))
  it('KB-003 vertical right is ignored',()=>expect(list('ArrowRight')).toBeNull())
  it('KB-004 vertical left is ignored',()=>expect(list('ArrowLeft')).toBeNull())
  it('KB-005 horizontal LTR right is next',()=>expect(list('ArrowRight','horizontal')).toBe('next'))
  it('KB-006 horizontal LTR left is prev',()=>expect(list('ArrowLeft','horizontal')).toBe('prev'))
  it('KB-007 horizontal RTL left is next',()=>expect(list('ArrowLeft','horizontal','rtl')).toBe('next'))
  it('KB-008 horizontal RTL right is prev',()=>expect(list('ArrowRight','horizontal','rtl')).toBe('prev'))
  it('KB-009 horizontal down is ignored',()=>expect(list('ArrowDown','horizontal')).toBeNull())
  it('KB-010 horizontal up is ignored',()=>expect(list('ArrowUp','horizontal')).toBeNull())
  it('KB-011 Home maps to first',()=>expect(list('Ho¶»§q«^