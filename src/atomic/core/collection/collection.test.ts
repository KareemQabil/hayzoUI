import { describe, expect, it } from 'vitest'
import { CollectionError, createCollection, type CollectionItem } from './index'

const item = (key: string, disabled = false): CollectionItem<string> => ({ key, value: key, textValue: key, disabled })
const fixture = () => createCollection([
  { key: 'root', value: 'root', textValue: 'قسم', children: [
    item('a'), item('b', true),
    { key: 'nested', value: 'nested', textValue: 'فرعي', children: [item('c')] },
  ] },
  item('last'),
])
describe('headless collection', () => {
  it('CO-001 creates an empty collection', () => {
    const c = createCollection([])
    expect(c.size).toBe(0)
    expect(c.keys()).toEqual([])
  })
  it('CO-002 returns null for empty first', () => expect(createCollection([]).first()).toBeNull())
  it('CO-003 returns null for empty last', () => expect(createCollection([]).last()).toBeNull())
  it('CO-004 has flat size including nested descendants', () => expect(fixture().size).toBe(6))
  it('CO-005 keys are preorder and include collapsed descendants', () => expect(fixture().keys()).toEqual(['root','a','b','nested','c','last']))
  it('CO-006 retrieves nested items by key', () => expect(fixture().get('c')?.value).toBe('c'))
  it('CO-007 unknown key lookup is undefined', () => expect(fixture().get('???')).toBeUndefined())
  it('CO-008 get returns original text value', () => expect(fixture().get('root')?.textValue).toBe('قسم'))
  it('CO-009 first starts on first enabled root', () => expect(fixtur���q�^