/** Framework-agnostic form store. All validation time and scheduling is injected. */
export type FieldPath = string
export type Validator = (value:unknown, values:Readonly<Record<string,unknown>>, signal:AbortSignal) =>
  string|null|Promise<string|null>
export interface FieldConfig {
  validators?:readonly Validator[]; dependsOn?:readonly FieldPath[]
  validateOn?:'change'|'blur'|'submit'; debounceMs?:number
}
export interface FieldState { value:unknown; error:string|null; touched:boolean; dirty:boolean; validating:boolean }
export interface FormStore {
  register(path:FieldPath,config?:FieldConfig):()=>void
  getField(path:FieldPath):FieldState
  setValue(path:FieldPath,value:unknown):void
  blur(path:FieldPath):void
  list(path:FieldPath):{keys():readonly string[];append(v:unknown):void;remove(key:string):void;move(from:number,to:number):void}
  submit(onValid:(values:Record<string,unknown>)=>unknown|Promise<unknown>):Promise<{ok:true}|{ok:false;firstInvalid:FieldPath}>
  reset(values?:Record<string,unknown>):void
  subscribe(listener:()=>void):()=>void
  getSnapshot():{values:Record<string,unknown>;submitting:boolean;submitCount:number;valid:boolean}
}
interface Meta {error:string|null;touched:boolean;dirty:boolean;validating:boolean;revision:number;controller:AbortController|null;timer:ReturnType<typeof setTimeout>|null}
type Outcome={ok:true}|{ok:false;firstInvalid:FieldPath}
const plain=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v)
function copy(value:unknown):unknown {
  if(value==='')return null
  if(Array.isArray(value))return value.map(copy)
  if(plain(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null))
    return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,copy(v)]))
  return value
}
function same(a:unknown,b:unknown):boolean {
  if(Object.is(a,b))return true
  if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((x,i)=>same(x,b[i]))
  if(plain(a)&&plain(b)){
    const keys=Object.keys(a)
    return keys.length===Object.keys(b).length&&keys.every(k=>Object.prototype.hasOwnProperty.call(b,k)&&same(a[k],b[k]))
  }
  return false
}
function parts(path:FieldPath):string[] {
  if(typeof path!=='string'||!path.trim())throw new TypeError('Field path is required')
  const segments=path.split('.')
  if(segments.some(p=>!p||p==='__proto__'||p==='prototype'||p==='constructor'))
    throw new TypeError('Unsafe or malformed field path')
  return segments
}
const isIndex=(p:string)=>/^(0|[1-9]\d*)$/.test(p)
function getPath(root:unknown,path:string):unknown {
  let node=root
  for(const key of parts(path)){
    if(node===null||typeof node!=='object')return undefined
    node=(node as Record<string,unknown>)[key]
  }
  return node
}
function setPath(root:Record<string,unknown>,path:string,value:unknown):Record<string,unknown>{
  const keys=parts(path),updated={...root}
  let next:unknown=updated,old:unknown=root
  for(let i=0;i<keys.length;i++){
    const key=keys[i]!
    if(Array.isArray(next)&&!isIndex(key))throw new TypeError('Array path index must be numeric')
    const previous=old!==null&&typeof old==='object'?(old as Record<string,unknown>)[key]:undefined
    const result=i===keys.length-1?copy(value)
      :Array.isArray(previous)?[...previous]:plain(previous)?{...previous}:isIndex(keys[i+1]!)?[]:{}
    if(Array.isArray(next))next[Number(key)]=result
    else (next as Record<string,unknown>)[key]=result
    next=result
    old=previous
  }
  return updated
}
const emptyMeta=():Meta=>({error:null,touched:false,dirty:false,validating:false,revision:0,controller:null,timer:null})

export function createFormStore(o:{initialValues:Record<string,unknown>;scheduler?:{setTimeout:typeof setTimeout;clearTimeout:typeof clearTimeout}}):FormStore {
  const original=copy(o.initialValues) as Record<string,unknown>
  let values=copy(original) as Record<string,unknown>
  let baseline=copy(original) as Record<string,unknown>
  let submitting=false,submitCount=0,serial=0
  let inFlight:Promise<Outcome>|null=null
  const entries=new Map<string,Meta>()
  const registered=new Map<string,{config:FieldConfig;count:number}>()
  const itemKeys=new Map<string,string[]>()
  const listeners=new Set<()=>void>()
  const notify=()=>{for(const fn of [...listeners])fn()}
  const meta=(path:string):Meta=>{
    parts(path)
    let m=entries.get(path)
    if(!m){m=emptyMeta();entries.set(path,m)}
    return m
  }
  const abort=(m:Meta)=>{
    m.revision++
    m.controller?.abort()
    m.controller=null
    if(m.timer!==null&&o.scheduler)o.scheduler.clearTimeout(m.timer)
    m.timer=null
    m.validating=false
  }
  const dirty=(path:string)=>{meta(path).dirty=!same(getPath(values,path),getPath(baseline,path))}
  const validate=async(path:string):Promise<void>=>{
    const m=meta(path)
    abort(m)
    const rules=registered.get(path)?.config.validators??[]
    if(!rules.length){if(m.error!==null){m.error=null;notify()}return}
    const revision=m.revision,controller=new AbortController()
    m.controller=controller
    m.validating=true
    notify()
    let error:string|null=null
    try{
      for(const rule of rules){
        const code=await rule(copy(getPath(values,path)),copy(values) as Record<string,unknown>,controller.signal)
        if(controller.signal.aborted||revision!==m.revision)return
        if(code!==null){error=code;break}
      }
    }catch{
      if(controller.signal.aborted||revision!==m.revision)return
      error='VALIDATION_EXCEPTION'
    }finally{
      if(!controller.signal.aborted&&revision===m.revision){
        m.error=error;m.validating=false;m.controller=null;notify()
      }
    }
  }
  const schedule=(path:string,kind:'change'|'blur'|'submit')=>{
    if(kind==='submit'){void validate(path);return}
    const config=registered.get(path)?.config
    if(!config||(config.validateOn??'submit')!==kind)return
    const m=meta(path)
    abort(m)
    if(kind==='change'&&config.debounceMs&&config.debounceMs>0&&o.scheduler){
      m.validating=true
      m.timer=o.scheduler.setTimeout(()=>{m.timer=null;void validate(path)},config.debounceMs)
      notify()
    }else void validate(path)
  }
  const dependents=(source:string)=>{
    for(const [path,{config}] of registered)
      if(config.dependsOn?.some(dep=>dep===source||source.startsWith(dep+'.')||dep.startsWith(source+'.')))
        void validate(path)
  }
  const update=(path:string,value:unknown)=>{
    const next=copy(value)
    if(same(getPath(values,path),next))return
    values=setPath(values,path,next)
    const m=meta(path)
    abort(m);m.error=null;dirty(path)
    notify();schedule(path,'change');dependents(path)
  }
  const currentList=(path:string)=>{const value=getPath(values,path);return Array.isArray(value)?[...value]:[]}
  const keysFor=(path:string)=>{
    let list=itemKeys.get(path)
    if(!list){list=currentList(path).map(()=>path+':'+serial++);itemKeys.set(path,list)}
    return list
  }
  const updateList=(path:string,data:unknown[],keys:string[])=>{
    itemKeys.set(path,keys)
    values=setPath(values,path,data)
    for(const [field,m] of entries){
      if(field===path||field.startsWith(path+'.')){abort(m);m.error=null;dirty(field)}
    }
    notify();schedule(path,'change');dependents(path)
  }
  const submit=(onValid:(v:Record<string,unknown>)=>unknown|Promise<unknown>):Promise<Outcome>=>{
    if(inFlight)return inFlight
    submitting=true;submitCount++;notify()
    const work=(async():Promise<Outcome>=>{
      try{
        const fields=[...registered.keys()]
        await Promise.all(fields.map(path=>validate(path)))
        const bad=fields.find(path=>meta(path).error!==null)
        if(bad)return {ok:false,firstInvalid:bad}
        await onValid(copy(values) as Record<string,unknown>)
        return {ok:true}
      }finally{submitting=false;inFlight=null;notify()}
    })()
    inFlight=work
    return work
  }
  return {
    register(path,config={}){
      parts(path)
      const previous=registered.get(path)
      registered.set(path,{config:{...config},count:(previous?.count??0)+1})
      meta(path)
      let active=true
      return ()=>{
        if(!active)return
        active=false
        const last=registered.get(path)
        if(!last)return
        if(last.count<=1){registered.delete(path);abort(meta(path))}
        else registered.set(path,{...last,count:last.count-1})
      }
    },
    getField(path){const m=meta(path);return {value:copy(getPath(values,path)??null),error:m.error,touched:m.touched,dirty:m.dirty,validating:m.validating}},
    setValue:update,
    blur(path){const m=meta(path);m.touched=true;notify();schedule(path,'blur')},
    list(path){
      parts(path);keysFor(path)
      return {
        keys:()=>[...keysFor(path)],
        append(v){updateList(path,[...currentList(path),copy(v)],[...keysFor(path),path+':'+serial++])},
        remove(key){const ids=keysFor(path),i=ids.indexOf(key);if(i<0)return;const data=currentList(path),next=[...ids];data.splice(i,1);next.splice(i,1);updateList(path,data,next)},
        move(from,to){
          const data=currentList(path),ids=[...keysFor(path)]
          if(!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<0||to<0||from>=data.length||to>=data.length||from===to)return
          const [value]=data.splice(from,1),[key]=ids.splice(from,1)
          data.splice(to,0,value);ids.splice(to,0,key!)
          updateList(path,data,ids)
        },
      }
    },
    submit,
    reset(next){
      for(const m of entries.values())abort(m)
      values=copy(next??original) as Record<string,unknown>
      baseline=copy(values) as Record<string,unknown>
      entries.clear();itemKeys.clear();serial=0;submitting=false;submitCount=0;inFlight=null;notify()
    },
    subscribe(listener){listeners.add(listener);let active=true;return ()=>{if(active){active=false;listeners.delete(listener)}}},
    getSnapshot(){return {values:copy(values) as Record<string,unknown>,submitting,submitCount,
      valid:[...entries.values()].every(m=>m.error===null&&!m.validating)}},
  }
}

