import { describe, expect, it } from 'vitest'
import { createFormStore, type Validator } from './index'

const make=(values:Record<string,unknown>={})=>createFormStore({initialValues:values})
const required:Validator=value=>value===null||value===undefined?'REQUIRED':null
const settle=async()=>{for(let i=0;i<6;i++)await Promise.resolve()}

describe('headless forms',()=>{
  it('FE-001 initializes Arabic data',()=>expect(make({name:'محمد'}).getSnapshot().values).toEqual({name:'محمد'}))
  it('FE-002 resolves nested object paths',()=>expect(make({customer:{phone:'٠١٠'}}).getField('customer.phone').value).toBe('٠١٠'))
  it('FE-003 reports missing fields as null',()=>expect(make().getField('unknown').value).toBeNull())
  it('FE-004 normalizes empty initial text',()=>expect(make({name:''}).getField('name').value).toBeNull())
  it('FE-005 normalizes user-entered empty text',()=>{const s=make({name:'a'});s.setValue('name','');expect(s.getField('name').value).toBeNull()})
  it('FE-006 writes nested paths immutably',()=>{
    const init={customer:{name:'أحمد',phone:'١٢٣'}}
    const s=make(init);s.setValue('customer.name','منى')
    expect(init.customer.name).toBe('أحمد')
    expect(s.getField('customer.phone').value).toBe('١٢٣')
  })
  it('FE-007 writes numeric array indices',()=>{const s=make({items:[{qty:1}]});s.setValue('items.0.qty',2);expect(s.getField('items.0.qty').value).toBe(2)})
  it('FE-008 all snapshots are fresh objects',()=>{const s=make({data:{x:1}});expect(s.getSnapshot().values).not.toBe(s.getSnapshot().values)})
  it('FE-009 new fields are untouched clean and valid',()=>expect(make({x:1}).getField('x')).toMatchObject({touched:false,dirty:false,error:null,validating:false}))
  it('FE-010 dirty is true after changing a value',()=>{const s=make({x:1});s.setValue('x',2);expect(s.getField('x').dirty).toBe(true)})
  it('FE-011 dirty returns false after restoring baseline value',()=>{const s=make({x:1});s.setValue('x',2);s.setValue('x',1);expect(s.getField('x').dirty).toBe(false)})
  it('FE-012 blur marks field touched',()=>{const s=make({x:1});s.blur('x');expect(s.getField('x').touched).toBe(true)})
  it('FE-013 change validation returns content error code',async()=>{
    const s=make({x:'valid'});s.register('x',{validators:[required],validateOn:'change'});s.setValue('x','');await settle()
    expect(s.getField('x').error).toBe('REQUIRED')
  })
  it('FE-014 blur validation runs only on blur',async()=>{
    const s=make({x:'a'});s.register('x',{validators:[required],validateOn:'blur'});s.setValue('x','');await settle()
    expect(s.getField('x').error).toBeNull()
    s.blur('x');await settle();expect(s.getField('x').error).toBe('REQUIRED')
  })
  it('FE-015 submit runs default submit-only validation',async()=>{
    const s=make({x:null});s.register('x',{validators:[required]})
    expect(await s.submit(()=>null)).toEqual({ok:false,firstInvalid:'x'})
  })
  it('FE-016 successful submit calls callback',async()=>{
    const s=make({name:'أحمد'});let saved:unknown=null
    expect(await s.submit(v=>{saved=v})).toEqual({ok:true})
    expect(saved).toEqual({name:'أحمد'})
  })
  it('FE-017 submitCount increments on each completed distinct attempt',async()=>{
    const s=make();await s.submit(()=>null);await s.submit(()=>null)
    expect(s.getSnapshot().submitCount).toBe(2)
  })
  it('FE-018 first invalid follows registration order',async()=>{
    const s=make({a:null,b:null});s.register('b',{validators:[required]});s.register('a',{validators:[required]})
    expect(await s.submit(()=>null)).toEqual({ok:false,firstInvalid:'b'})
  })
  it('FE-019 dependent validators recheck when source changes',async()=>{
    const s=make({country:'EG',tax:'EG'});s.register('tax',{dependsOn:['country'],validators:[(v,all)=>v===all.country?null:'MISMATCH']})
    s.setValue('country','SA');await settle()
    expect(s.getField('tax').error).toBe('MISMATCH')
  })
  it('FE-020 nested dependsOn catches parent change',async()=>{
    const s=make({customer:{country:'EG'},tax:'EG'})
    s.register('tax',{dependsOn:['customer.country'],validators:[(v,all)=>v===(all.customer as {country:string}).country?null:'COUNTRY']})
    s.setValue('customer',{country:'SA'});await settle()
    expect(s.getField('tax').error).toBe('COUNTRY')
  })
  it('FE-021 stale validation aborts older AbortSignal',()=>{
    const signals:AbortSignal[]=[]
    const s=make({x:'a'});s.register('x',{validateOn:'change',validators:[(_,__,signal)=>{signals.push(signal);return new Promise(()=>{})}]})
    s.setValue('x','b');s.setValue('x','c')
    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)
  })
  it('FE-022 stale async results cannot overwrite current value',async()=>{
    const resolves:Array<(value:string|null)=>void>=[]
    const s=make({x:'a'});s.register('x',{validateOn:'change',validators:[()=>new Promise(resolve=>resolves.push(resolve))]})
    s.setValue('x','b');s.setValue('x','c')
    resolves[1]!(null);await settle();resolves[0]!('STALE');await settle()
    expect(s.getField('x').error).toBeNull()
  })
  it('FE-023 validator rejection maps to stable message code',async()=>{
    const s=make({x:1});s.register('x',{validators:[()=>{throw Error('NOPE')}]})
    expect(await s.submit(()=>null)).toEqual({ok:false,firstInvalid:'x'})
    expect(s.getField('x').error).toBe('VALIDATION_EXCEPTION')
  })
  it('FE-024 validators stop at the first code',async()=>{
    const s=make({x:null});let calls=0
    s.register('x',{validators:[()=>{calls++;return 'FIRST'},()=>{calls++;return 'SECOND'}]})
    await s.submit(()=>null);expect(calls).toBe(1)
  })
  it('FE-025 subscriptions fire and can be removed',()=>{
    const s=make({x:1});let events=0
    const unsubscribe=s.subscribe(()=>events++)
    s.setValue('x',2);expect(events).toBeGreaterThan(0)
    const previous=events;unsubscribe();s.setValue('x',3);expect(events).toBe(previous)
  })
  it('FE-026 list keys match existing item count',()=>expect(make({items:[1,2,3]}).list('items').keys()).toHaveLength(3))
  it('FE-027 append retains original stable keys',()=>{
    const s=make({items:[1]});const list=s.list('items');const first=list.keys()[0]
    list.append(2);expect(list.keys()[0]).toBe(first);expect(s.getField('items').value).toEqual([1,2])
  })
  it('FE-028 remove preserves identities of remaining items',()=>{
    const s=make({items:[1,2,3]});const list=s.list('items'),keys=list.keys()
    list.remove(keys[1]!);expect(list.keys()).toEqual([keys[0],keys[2]])
    expect(s.getField('items').value).toEqual([1,3])
  })
  it('FE-029 move reorders stable keys with the underlying values',()=>{
    const s=make({items:['أ','ب','ج']});const list=s.list('items'),keys=list.keys()
    list.move(0,2);expect(list.keys()).toEqual([keys[1],keys[2],keys[0]])
    expect(s.getField('items').value).toEqual(['ب','ج','أ'])
  })
  it('FE-030 invalid move or remove is a safe no-op',()=>{
    const s=make({items:[1]});const list=s.list('items'),keys=list.keys()
    list.move(-1,2);list.remove('unknown')
    expect(list.keys()).toEqual(keys)
  })
  it('FE-031 list empty input becomes null',()=>{
    const s=make({items:[]});s.list('items').append('')
    expect(s.getField('items.0').value).toBeNull()
  })
  it('FE-032 reset clears field metadata',async()=>{
    const s=make({name:'Original'});s.register('name',{validators:[required]})
    s.setValue('name','Changed');await s.submit(()=>null);s.reset()
    expect(s.getField('name')).toMatchObject({value:'Original',dirty:false,error:null,touched:false})
    expect(s.getSnapshot().submitCount).toBe(0)
  })
  it('FE-033 reset with explicit new values defines clean baseline',()=>{
    const s=make({x:1});s.reset({x:2});s.setValue('x',3);expect(s.getField('x').dirty).toBe(true)
    s.setValue('x',2);expect(s.getField('x').dirty).toBe(false)
  })
  it('FE-034 concurrent submit calls callback once',async()=>{
    const s=make({x:1});let release:()=>void=()=>{},count=0
    const gate=new Promise<void>(resolve=>release=resolve)
    const callback=()=>{count++;return gate}
    const a=s.submit(callback),b=s.submit(callback)
    await settle();expect(count).toBe(1);expect(s.getSnapshot().submitting).toBe(true)
    release();expect(await a).toEqual({ok:true});expect(await b).toEqual({ok:true})
  })
  it('FE-035 unsafe paths reject prototype pollution',()=>{
    const s=make()
    expect(()=>s.setValue('__proto__.bad',1)).toThrow()
    expect(()=>s.setValue('constructor.bad',1)).toThrow()
    expect(()=>s.register('a..b')).toThrow()
  })
  it('FE-036 600 seeded property scenarios preserve list key/value correspondence',()=>{
    let seed=0x7a55ab
    const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0}
    for(let round=0;round<600;round++){
      const len=rnd()%10
      const expected=Array.from({length:len},(_,i)=>i)
      const s=make({items:expected});const list=s.list('items'),keys=[...list.keys()]
      for(let i=0;i<12;i++){
        const action=rnd()%3
        if(action===0){const v=rnd()%1000;list.append(v);expected.push(v);keys.push(list.keys().at(-1)!)}
        if(action===1&&keys.length){const n=rnd()%keys.length;list.remove(keys[n]!);keys.splice(n,1);expected.splice(n,1)}
        if(action===2&&keys.length>1){
          const from=rnd()%keys.length,to=rnd()%keys.length;list.move(from,to)
          const [k]=keys.splice(from,1),[v]=expected.splice(from,1);keys.splice(to,0,k!);expected.splice(to,0,v!)
        }
        expect(list.keys()).toEqual(keys)
        expect(s.getField('items').value).toEqual(expected)
      }
    }
  })
  it('FE-037 10k updates stay under generous CI budget',()=>{
    const s=make({n:0}),start=performance.now()
    for(let i=1;i<=10_000;i++)s.setValue('n',i)
    expect(s.getField('n').value).toBe(10_000)
    expect(performance.now()-start).toBeLessThan(5000)
  })
})

