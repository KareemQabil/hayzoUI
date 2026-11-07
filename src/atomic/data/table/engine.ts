import { matchText, DEFAULT_SEARCH } from '../../../arabic/search'
import { normalizeDigits } from '../../../arabic/digits'
import { TableError, type ColumnDef, type Filter, type TableModel, type TableState } from './types'

const ARABIC_SEARCH = Object.freeze({ ...DEFAULT_SEARCH, hamza:true, alefMaqsura:true, taaMarbuta:true })
type RowEntry<R> = { key:string; row:R; depth:number; order:number }
type DisplayRow<R> = TableModel<R>['rows'][number]

const finite = (x:unknown):x is number => typeof x==='number' && Number.isFinite(x)
const nullish = (v:unknown):boolean => v===null || v===undefined || (typeof v==='number' && Number.isNaN(v))
const ascii = (v:unknown):string => normalizeDigits(String(v)).text
function numeric(v:unknown):number|null {
  if (v===null || v===undefined || v==='') return null
  const value = typeof v==='number' ? v : Number(ascii(v))
  return Number.isFinite(value) ? value : null
}
function money(v:unknown):number|null {
  if (v===null || v===undefined || v==='') return null
  const n = numeric(v)
  if (n===null || !Number.isSafeInteger(n)) throw new TableError('INVALID_MONEY','Money requires safe integer minor units')
  return n
}
function checkColumn<R>(key:string, columns:ReadonlyMap<string,ColumnDef<R>>):ColumnDef<R> {
  const c=columns.get(key)
  if(!c)throw new TableError('UNKNOWN_COLUMN','Unknown column: '+key)
  return c
}
function compareDefault<R>(a:unknown,b:unknown,c:ColumnDef<R>,collator:Intl.Collator):number {
  if (c.type==='number' || c.¶»§q«^