import { describe, expect, it } from 'vitest'
import { createTableModel, DEFAULT_TABLE_STATE, parseTableState, serializeTableState, TableError,
  type ColumnDef, type TableState } from './index'

type Row={id:string;name:string;amount:number|null;qty:number;day:string|null;group:string;active:boolean}
const rows:Row[]=[
  {id:'1',name:'أحمد',amount:1200,qty:2,day:'2026-01-01',group:'مشروبات',active:true},
  {id:'2',name:'إيمان',amount:900,qty:1,day:'2026-02-01',group:'مأكولات',active:false},
  {id:'3',name:'مصطفى',amount:1500,qty:2,day:'2026-03-01',group:'مشروبات',active:true},
  {id:'4',name:'مدرسة',amount:null,qty:3,day:null,group:'مأكولات',active:true},
]
const cols:ColumnDef<Row>[]=[
  {key:'name',header:'الاسم',accessor:r=>r.name,type:'text',sortable:true,filterable:true},
  {key:'amount',header:'المبلغ',accessor:r=>r.amount,type:'money',sortable:true,filterable:true,aggregate:'sum'},
  {key:'qty',header:'الكمية',accessor:r=>r.qty,type:'number',sortable:true,filterable:true,aggregate:'avg'},
  {key:'day',header:'التاريخ',accessor:r=>r.day,type:'date',sortable:true,filterable:true},
  {key:'group',header:'الفئة',accessor:r=>r.group,type:'text',sortable:true,filterable:true},
  {key:'active',header:'نشط',accessor:r=>r.active,type:'boolean',sortable:true},
]
const withState=(s:Partial<TableState>={}):TableState=>({...DEFAULT_TABLE_STATE,...s})
const model=(data:readonly Row[]=rows,state:Partial<T���q�^