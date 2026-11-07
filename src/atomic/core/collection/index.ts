export interface CollectionItem<T> { key:string; value:T; textValue:string; disabled?:boolean; children?:CollectionItem<T>[] }
export interface Collection<T> {
  readonly items:readonly CollectionItem<T>[]; readonly size:number
  get(key:string):CollectionItem<T>|undefined
  keys():readonly string[]
  next(key:string|null,opts?:{wrap?:boolean;skipDisabled?:boolean}):string|null
  prev(key:string|null,opts?:{wrap?:boolean;skipDisabled?:boolean}):string|null
  first(skipDisabled?:boolean):string|null
  last(skipDisabled?:boolean):string|null
  flatten(expanded:ReadonlySet<string>):readonly {key:string;depth:number;parent:string|null}[]
}
export class CollectionError extends Error {
  readonly name='CollectionError'
  constructor(readonly code:'DUPLICATE_KEY'|'INVALID_ITEM'|'CYCLIC_ITEMS',readonly key:string,message:string){
    super(message);Object.setPrototypeOf(this,new.target.prototype)
  }
}
/** Stable preorder registry: expansion affects flatten, not the global key index. */
export function createCollection<T>(items:readonly CollectionItem<T>[]):Collection<T> {
  if(!Array.isArray(items))throw new CollectionError('INVALID_ITEM','','Expected an array')
  const map=new Map<string,CollectionItem<T>>(),order:string[]=[]
  const visiting=new WeakSet<object>()
  const visit=(node:CollectionItem<T>):CollectionItem<T>=>{
    if(node===null||typeof node!=='object'||!node.key||typeof node.key!=='string'
       ||typeof node.textValue!=='string'||(node.children!==undefined&&!Array.isArray(node.children)))
      throw new CollectionError('INVALID_ITEM',String((node as CollectionItem<T>|null)?.key??''),'Invalid collection node')
    if(visiting.has(node))throw new CollectionError('CYCLIC_ITEMS',node.key,'Circular item tree')
    if(map.has(node.key))throw new CollectionError('DUPLICATE_KEY',node.key,'Duplicate key: '+node.key)
    visiting.add(node)
    const copy:CollectionItem<T>={key:node.key,value:node.value,textValue:node.textValue}
    if(node.disabled!==undefined)copy.disabled=node.disabled
    map.set(node.key,copy);order.push(node.key)
    if(node.children)copy.children=Object.freeze(node.children.map(visit)) as CollectionItem<T>[]
    visiting.delete(node)
    return Object.freeze(copy)
  }
  const roots=Object.freeze(items.map(visit))
  const at=new Map(order.map((key,index)=>[key,index]))
  const allowed=(k:string,skip:boolean)=>!skip||!map.get(k)?.disabled
  const scan=(start:number,step:1|-1,skip:boolean):string|null=>{
    for(let i=start;i>=0&&i<order.length;i+=step){
      const key=order[i]!
      if(allowed(key,skip))return key
    }
    return null
  }
  const move=(key:string|null,step:1|-1,opts?:{wrap?:boolean;skipDisabled?:boolean}):string|null=>{
    const skip=opts?.skipDisabled??true
    if(key===null)return scan(step===1?0:order.length-1,step,skip)
    const index=at.get(key)
    if(index===undefined)return null
    return scan(index+step,step,skip)||(opts?.wrap?scan(step===1?0:order.length-1,step,skip):null)
  }
  return {
    items:roots,size:order.length,get:key=>map.get(key),keys:()=>[...order],
    next:(key,opts)=>move(key,1,opts),prev:(key,opts)=>move(key,-1,opts),
    first:(skip=true)=>scan(0,1,skip),last:(skip=true)=>scan(order.length-1,-1,skip),
    flatten(expanded){
      const out:{key:string;depth:number;parent:string|null}[]=[]
      const walk=(nodes:readonly CollectionItem<T>[],depth:number,parent:string|null)=>{
        for(const n of nodes){
          out.push({key:n.key,depth,parent})
          if(n.children&&expanded.has(n.key))walk(n.children,depth+1,n.key)
        }
      }
      walk(roots,0,null)
      return out
    },
  }
}
