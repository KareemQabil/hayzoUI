import {describe,it,expect} from 'vitest'
import {CollectionError,createCollection,type CollectionItem} from './index'
const item=(key:string,disabled=false):CollectionItem<string>=>({key,value:key,textValue:key,disabled})
const f=()=>createCollection([{key:'root',value:'R',textValue:'قسم',children:[item('a'),item('b',true),{key:'nested',value:'N',textValue:'فرعي',children:[item('c')]}]},item('last')])
describe('Collection',()=>{
it('CO-001 empty size',()=>expect(createCollection([]).size).toBe(0))
it('CO-002 empty keys',()=>expect(createCollection([]).keys()).toEqual([]))
it('CO-003 empty first',()=>expect(createCollection([]).first()).toBeNull())
it('CO-004 empty last',()=>expect(createCollection([]).last()).toBeNull())
it('CO-005 full tree size',()=>expect(f().size).toBe(6))
it('CO-006 preorder keys',()=>expect(f().keys()).toEqual(['root','a','b','nested','c','last']))
it('CO-007 get nested value',()=>expect(f().get('c')?.value).toBe('c'))
it('CO-008 missing get',()=>expect(f().get('absent')).toBeUndefined())
it('CO-009 get preserves Arabic',()=>expect(f().get('root')?.textValue).toBe('قسم'))
it('CO-010 first',()=>expect(f().first()).toBe('root'))
it('CO-011 last',()=>expect(f().last()).toBe('last'))
it('CO-012 next from null',()=>expect(f().next(null)).toBe('root'))
it('CO-013 prev from null',()=>expect(f().prev(null)).toBe('last'))
it('CO-014 next skips disabled',()=>expect(f().next('a')).toBe('nested'))
it('CO-015 prev skips disabled',()=>expect(f().prev('nested')).toBe('a'))
it('CO-016 disabled can be included',()=>expect(f().next('a',{skipDisabled:false})).toBe('b'))
it('CO-017 no wrap default',()=>expect(f().next('last')).toBeNull())
it('CO-018 explicit wrap',()=>expect(f().next('last',{wrap:true})).toBe('root'))
it('CO-019 reverse wrap',()=>expect(f().prev('root',{wrap:true})).toBe('last'))
it('CO-020 unknown key is null',()=>expect(f().next('unknown',{wrap:true})).toBeNull())
it('CO-021 collapsed flatten',()=>expect(f().flatten(new Set()).map(e=>e.key)).toEqual(['root','last']))
it('CO-022 one-level flatten',()=>expect(f().flatten(new Set(['root'])).map(e=>e.key)).toEqual(['root','a','b','nested','last']))
it('CO-023 parent and depth',()=>expect(f().flatten(new Set(['root','nested']))).toContainEqual({key:'c',depth:2,parent:'nested'}))
it('CO-024 orphan expansion hidden',()=>expect(f().flatten(new Set(['nested'])).map(e=>e.key)).toEqual(['root','last']))
it('CO-025 duplicate typed failure',()=>{
try{createCollection([item('x'),item('x')]);throw Error('not rejected')}
catch(e){expect(e).toMatchObject({code:'DUPLICATE_KEY',key:'x'})}
})
it('CO-026 invalid path failure',()=>expect(()=>createCollection([item('')])).toThrow(CollectionError))
it('CO-027 circular children failure',()=>{
const self=item('self');self.children=[self]
expect(()=>createCollection([self])).toThrow(CollectionError)
})
it('CO-028 copied wrappers resist input mutations',()=>{
const input=[item('original')];const col=createCollection(input)
input[0]!.textValue='changed';input.push(item('new'))
expect(col.keys()).toEqual(['original']);expect(col.get('original')?.textValue).toBe('original')
})
it('CO-029 fresh keys output',()=>expect(f().keys()).not.toBe(f().keys()))
it('CO-030 Arabic/RTL navigation remains document order',()=>{
const c=createCollection([item('يمين'),item('وسط'),item('يسار')])
expect(c.next('يمين')).toBe('وسط');expect(c.prev('يسار')).toBe('وسط')
})
it('CO-031 all disabled skips',()=>expect(createCollection([item('a',true)]).first()).toBeNull())
it('CO-032 seeded 700-case property',()=>{
let seed=123456;const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0}
for(let n=0;n<700;n++){
const len=1+(rnd()%80),values=Array.from({length:len},(_,i)=>item(String(i),rnd()%5===0))
const col=createCollection(values),enabled=values.filter(x=>!x.disabled)
expect(col.size).toBe(len);expect(col.first()).toBe(enabled[0]?.key??null)
expect(col.last()).toBe(enabled.at(-1)?.key??null)
expect(col.keys()).toEqual(values.map(x=>x.key))
}
})
it('CO-033 20k budget',()=>{
const values=Array.from({length:20000},(_,i)=>item(String(i)))
const start=performance.now(),c=createCollection(values)
expect(c.next('19998')).toBe('19999')
expect(performance.now()-start).toBeLessThan(5000)
})
})
