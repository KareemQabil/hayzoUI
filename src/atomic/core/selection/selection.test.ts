import { describe, expect, it } from 'vitest'
import { createCollection, type CollectionItem } from '../collection'
import { isSelected, selectedKeys, selectionReducer, type SelectionAction, type SelectionMode, type SelectionState } from './index'

const ids = (values: readonly string[], disabled: readonly string[] = []) =>
  createCollection(values.map(key => ({ key, value: key, textValue: key, disabled: disabled.includes(key) })))
const base = (): SelectionState => ({ selected: new Set(), anchor: null })
const fixture = () => ids(['a','b','c','d','e'],['c'])
const run = (action: SelectionAction, state: SelectionState = base(), mode: SelectionMode = 'multiple',
  disabled?: ReadonlySet<string>) =>
  selectionReducer(state, action, { mode, collection: fixture(), disabled })
const keys = (state: SelectionState) => selectedKeys(state, ['a','b','c','d','e'])

describe('headless selection', () => {
  it('SE-001 starts empty', () => expect(keys(base())).toEqual([]))
  it('SE-002 replace selects one key', () => expect(keys(run({type:'replace',key:'a'}))).toEqual(['a']))
  it('SE-003 replace sets anchor', () => expect(run({type:'replace',key:'d'}).anchor).toBe('d'))
  it('SE-004 toggle selects an unselected key', () => expect(keys(run({type:'toggle',key:'b'}))).toEqual(['b']))
  it('SE-005 toggle removes a selected key', () => expect(keys(run({type:'toggle',key:'b'},run({type:'toggle',key:'b'})))).toEqual([]))
  it('SE-006 toggle keeps other selected keys', () => {
    const initial¶»§q«^