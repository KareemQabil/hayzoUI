#!/usr/bin/env node
// Measures the public component API of one installed React library from its published type declarations.
//
//   node tools/extract/catalog/extract-api.mjs <install-dir> <config.json> [--out <dir>]
//
// <install-dir> is a directory that has the package in node_modules (created with `npm install --ignore-scripts`,
// see install.mjs), or the package directory itself. Nothing from the package is imported or executed: the
// TypeScript compiler reads the .d.ts files and this script walks the checker's view of the exports.
//
// What is recorded: every exported value whose type is a React component (function, forwardRef/memo exotic,
// class), compound members reached through namespaces or static properties (`Dialog.Root`, `Select.Option`),
// and for each its props: name, type text, required, `@default`, deprecated, the interface a prop was declared
// in when that is not the component's own props type, and the package when it is not the library's own.
// What is counted but not recorded: props declared in React's typings, csstype or the TypeScript DOM lib
// (`excluded.dom`), and props of the style-prop interfaces named in the config (`excluded.style`).
// JSDoc description prose is never copied.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const SCRIPT = 'tools/extract/catalog/extract-api.mjs'
const TYPE_MAX = 200
const DEFAULT_MAX = 80
const DOM_PACKAGES = new Set(['@types/react', '@types/react-dom', 'csstype', 'typescript', '@types/prop-types'])
const COMPONENT_NAME = /^(?:unstable_|Unstable_|UNSTABLE_|UNSAFE_|experimental_|Experimental_|unstable|experimental)?[A-Z][A-Za-z0-9_$]*$/

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

function main() {
  const args = process.argv.slice(2)
  const outIndex = args.indexOf('--out')
  const outDir = outIndex >= 0 ? path.resolve(args.splice(outIndex, 2)[1]) : path.join(ROOT, 'data', 'catalog', 'libraries')
  if (args.length !== 2) {
    console.error('usage: extract-api.mjs <install-dir> <config.json> [--out <dir>]')
    process.exit(2)
  }
  const config = JSON.parse(fs.readFileSync(args[1], 'utf8'))
  const doc = extract(path.resolve(args[0]), config)
  fs.mkdirSync(outDir, { recursive: true })
  const file = path.join(outDir, `${config.id}.json`)
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n')
  const s = doc.data.stats
  console.log(`${config.id}: ${doc.data.library.package}@${doc.data.library.version} — ${s.components} components, ${s.props} props, median ${s.medianProps}, ${s.families} families, excluded dom ${s.excludedDomProps} style ${s.excludedStyleProps} → ${path.relative(ROOT, file)} (${fs.statSync(file).size} bytes)`)
}

function locate(dir, pkgName) {
  const own = path.join(dir, 'package.json')
  if (fs.existsSync(own) && JSON.parse(fs.readFileSync(own, 'utf8')).name === pkgName) {
    const marker = `${path.sep}node_modules${path.sep}`
    const i = dir.lastIndexOf(marker)
    if (i < 0) throw new Error(`${dir} is the package itself but is not inside node_modules`)
    return { projectDir: dir.slice(0, i), packageDir: dir }
  }
  const packageDir = path.join(dir, 'node_modules', ...pkgName.split('/'))
  if (!fs.existsSync(path.join(packageDir, 'package.json'))) throw new Error(`${pkgName} is not installed under ${dir}`)
  return { projectDir: dir, packageDir }
}

export function extract(dir, config) {
  const { projectDir, packageDir } = locate(dir, config.package)
  const pkg = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'))
  if (config.version && config.version !== pkg.version) console.error(`warning: ${config.package} installed ${pkg.version}, config pins ${config.version}`)
  // "subpackages": every direct subdirectory that is its own typed entry point (primereact 10 has no root index).
  const entries = config.entries === 'subpackages'
    ? fs.readdirSync(packageDir).sort(cmp).filter((d) => {
        const manifest = path.join(packageDir, d, 'package.json')
        return fs.existsSync(manifest) && Boolean(JSON.parse(fs.readFileSync(manifest, 'utf8')).types)
      })
    : config.entries ?? ['.']
  const specifiers = entries.map((e) => (e === '.' ? config.package : `${config.package}/${e.replace(/^\.\//, '')}`))

  // A virtual entry file that imports every entry point; it exists only in memory.
  const entryPath = path.join(projectDir, '__hayzo_entry__.ts')
  const entrySource = specifiers.map((s, i) => `import * as m${i} from ${JSON.stringify(s)};`).join('\n') + '\n'
  const options = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.Preserve,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    types: [],
    esModuleInterop: true,
    resolveJsonModule: true,
    lib: ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  }
  const host = ts.createCompilerHost(options)
  const { getSourceFile, fileExists, readFile } = host
  host.getSourceFile = (f, ...rest) => (f === entryPath ? ts.createSourceFile(f, entrySource, ts.ScriptTarget.ESNext, true) : getSourceFile.call(host, f, ...rest))
  host.fileExists = (f) => f === entryPath || fileExists.call(host, f)
  host.readFile = (f) => (f === entryPath ? entrySource : readFile.call(host, f))
  host.getCurrentDirectory = () => projectDir
  const program = ts.createProgram([entryPath], options, host)
  const checker = program.getTypeChecker()
  const entryFile = program.getSourceFile(entryPath)

  const styleInterfaces = new Set(config.styleInterfaces ?? [])
  const domInterfaces = new Set(config.domInterfaces ?? [])
  const skip = new Set(config.skip ?? [])

  // ---- file classification -------------------------------------------------------------------------------------
  const fileInfoCache = new Map()
  function fileInfo(fileName) {
    let info = fileInfoCache.get(fileName)
    if (info) return info
    const marker = '/node_modules/'
    const i = fileName.lastIndexOf(marker)
    if (i < 0) info = { pkg: '', rel: fileName }
    else {
      const rest = fileName.slice(i + marker.length)
      const parts = rest.split('/')
      const name = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]
      info = { pkg: name, rel: rest.slice(name.length + 1) }
    }
    info.dom = DOM_PACKAGES.has(info.pkg)
    info.own = info.pkg === config.package
    fileInfoCache.set(fileName, info)
    return info
  }
  const sourceOf = (decl) => {
    const info = fileInfo(decl.getSourceFile().fileName)
    return info.own ? info.rel : `${info.pkg}/${info.rel}`
  }

  // ---- component detection -------------------------------------------------------------------------------------
  function isElementLike(t, depth = 0) {
    if (t.flags & ts.TypeFlags.Any) return true
    if (t.flags & ts.TypeFlags.Null) return true
    if (t.isUnion()) {
      const rest = t.types.filter((x) => !(x.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)))
      return rest.length === 0 ? t.types.some((x) => x.flags & ts.TypeFlags.Null) : rest.some((x) => isElementLike(x, depth + 1))
    }
    const names = [t.aliasSymbol?.name, t.symbol?.name]
    if (names.some((n) => n === 'Element' || n === 'ReactElement' || n === 'ReactPortal' || n === 'ReactNode')) return true
    if (depth < 2 && t.symbol?.name === 'Promise') {
      const [inner] = checker.getTypeArguments(t)
      return inner ? isElementLike(inner, depth + 1) : false
    }
    return false
  }
  function isPropsLike(t) {
    if (t.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return true
    const a = checker.getApparentType(t)
    if (a.isUnion()) return a.types.every((x) => x.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null) || isPropsLike(x))
    return Boolean(a.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection | ts.TypeFlags.NonPrimitive))
  }
  const isContext = (type) => Boolean(type.getProperty('Provider') && type.getProperty('Consumer'))
  // Returns the props types of a component type (one per call signature), or undefined when it is not a component.
  function componentShape(type) {
    if (type.isUnion()) {
      for (const member of type.types) {
        const shape = componentShape(member)
        if (shape) return shape
      }
      return undefined
    }
    if (type.getProperty('Provider') && type.getProperty('Consumer')) return undefined // a React context
    const propsTypes = []
    const typeParameters = new Set()
    for (const sig of type.getCallSignatures()) {
      if (sig.parameters.length > 2) continue
      if (!isElementLike(sig.getReturnType())) continue
      if (sig.parameters.length === 0) {
        propsTypes.push(undefined)
        continue
      }
      const p = checker.getTypeOfSymbolAtLocation(sig.parameters[0], entryFile)
      if (!isPropsLike(p)) continue
      propsTypes.push(p)
      for (const tp of sig.typeParameters ?? []) typeParameters.add(tp.symbol.name)
    }
    if (propsTypes.length === 0) {
      for (const sig of type.getConstructSignatures()) {
        const instance = sig.getReturnType()
        const render = instance.getProperty('render')
        const props = instance.getProperty('props')
        if (!render || !props) continue
        propsTypes.push(checker.getTypeOfSymbolAtLocation(props, entryFile))
        for (const tp of sig.typeParameters ?? []) typeParameters.add(tp.symbol.name)
      }
    }
    if (propsTypes.length === 0) return undefined
    return { propsTypes: propsTypes.filter(Boolean), typeParameters: [...typeParameters] }
  }

  // ---- props ---------------------------------------------------------------------------------------------------
  function declarationOwner(decl) {
    // The named interface or type alias a member declaration sits in.
    for (let node = decl.parent; node; node = node.parent) {
      if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isClassDeclaration(node)) return node.name?.text
      if (ts.isSourceFile(node)) return undefined
    }
    return undefined
  }
  function typeText(t, optional) {
    let text = checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation)
    text = text.replace(/import\("[^"]*\/node_modules\/([^"]+)"\)/g, 'import("$1")').replace(/\s+/g, ' ').trim()
    if (optional) text = text.replace(/ \| undefined$/, '')
    if (/^\(.*\)$/.test(text) && balanced(text.slice(1, -1))) text = text.slice(1, -1)
    // A bare alias of a small literal union says nothing by its name alone (Direction, SizeType): show its members.
    let core = t
    if (!core.aliasSymbol && optional && core.isUnion()) {
      const named = (core.origin?.isUnion() ? core.origin.types : []).filter((m) => !(m.flags & ts.TypeFlags.Undefined))
      core = named.length === 1 ? named[0] : checker.getNonNullableType(core)
    }
    if (/^[A-Za-z_$][\w$]*$/.test(text) && core.aliasSymbol && core.isUnion() && core.types.length <= 12 && core.types.every((m) => m.flags & (ts.TypeFlags.Literal | ts.TypeFlags.Undefined | ts.TypeFlags.Null))) {
      let members = checker.typeToString(core, undefined, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias).replace(/\s+/g, ' ')
      if (optional) members = members.replace(/ \| undefined$/, '')
      if (members !== text) text = `${text} = ${members}`
    }
    return text
  }
  const trim = (text, max) => (text.length > max ? text.slice(0, max - 1) + '…' : text)
  function tagText(tag) {
    const line = (tag.text ?? []).map((p) => p.text).join('').split('\n')[0].trim()
    const quoted = /^`([^`]+)`/.exec(line)
    return (quoted ? quoted[1] : line.replace(/`/g, '')).trim()
  }
  function branchesOf(type, out = [], depth = 0) {
    const a = checker.getApparentType(type)
    if (a.isUnion() && depth < 4) {
      for (const member of a.types) if (!(member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null))) branchesOf(member, out, depth + 1)
    } else out.push(a)
    return out
  }
  function propsTypeName(type) {
    if (type.aliasSymbol && /^(Readonly|Partial|Required|Omit|Pick)$/.test(type.aliasSymbol.name) && type.aliasTypeArguments?.[0]) return propsTypeName(type.aliasTypeArguments[0])
    const name = type.aliasSymbol?.name ?? type.symbol?.name
    if (name && !name.startsWith('__')) return name
    if (type.isIntersection()) {
      for (const member of type.types) {
        const symbol = member.aliasSymbol ?? member.symbol
        const decl = symbol?.declarations?.[0]
        if (!symbol || symbol.name.startsWith('__') || !decl || fileInfo(decl.getSourceFile().fileName).dom) continue
        return symbol.name
      }
    }
    return undefined
  }
  function collectProps(propsTypes, ownNames) {
    const branches = propsTypes.flatMap((t) => branchesOf(t))
    const merged = new Map()
    const excluded = { dom: 0, style: 0 }
    const excludedNames = { dom: new Set(), style: new Map() }
    for (const branch of branches) {
      for (const prop of checker.getPropertiesOfType(branch)) {
        const name = prop.name
        if (name.startsWith('__@') || name.startsWith('#')) continue
        const decls = prop.declarations ?? []
        const libDecls = decls.filter((d) => !fileInfo(d.getSourceFile().fileName).dom)
        if (decls.length > 0 && libDecls.length === 0) {
          excludedNames.dom.add(name)
          continue
        }
        const decl = libDecls[0]
        const owner = decl ? declarationOwner(decl) : undefined
        if (owner && domInterfaces.has(owner)) {
          excludedNames.dom.add(name)
          continue
        }
        if (owner && styleInterfaces.has(owner)) {
          excludedNames.style.set(name, owner)
          continue
        }
        const optional = Boolean(prop.flags & ts.SymbolFlags.Optional)
        let entry = merged.get(name)
        if (!entry) {
          entry = { name, types: [], requiredIn: 0, seenIn: 0, prop, decl, owner }
          merged.set(name, entry)
        }
        entry.seenIn++
        if (!optional) entry.requiredIn++
        const text = typeText(checker.getTypeOfSymbolAtLocation(prop, entryFile), optional)
        if (!entry.types.includes(text)) entry.types.push(text)
        if (!entry.tags) entry.tags = prop.getJsDocTags(checker)
      }
    }
    for (const name of merged.keys()) {
      excludedNames.dom.delete(name)
      excludedNames.style.delete(name)
    }
    excluded.dom = excludedNames.dom.size
    excluded.style = excludedNames.style.size
    const props = []
    for (const entry of [...merged.values()].sort((a, b) => cmp(a.name, b.name))) {
      const record = { name: entry.name, type: trim(entry.types.join(' | ') || 'unknown', TYPE_MAX), required: entry.seenIn === branches.length && entry.requiredIn === entry.seenIn }
      const tags = entry.tags ?? []
      const def = tags.find((t) => /^default(value)?$/i.test(t.name))
      if (def) {
        const value = tagText(def)
        // A default written as a sentence is documentation prose, not a value: leave it out and count it.
        if (value && /^[A-Z][a-z]+(?: [a-z]+){2,}/.test(value)) proseDefaults++
        else if (value) record.default = trim(value, DEFAULT_MAX)
      }
      if (tags.some((t) => t.name === 'deprecated')) record.deprecated = true
      if (entry.owner && !ownNames.has(entry.owner)) record.inheritedFrom = entry.owner
      if (entry.decl) {
        const info = fileInfo(entry.decl.getSourceFile().fileName)
        if (!info.own && info.pkg) record.declaredIn = info.pkg
      }
      props.push(record)
    }
    return { props, excluded, domDir: excludedNames.dom.has('dir'), styleNames: excludedNames.style }
  }

  // ---- walk the exports ----------------------------------------------------------------------------------------
  let proseDefaults = 0
  const records = new Map() // dotted name -> node
  const sharedStyle = new Map() // interface -> { names:Set, components:number }
  function declOf(symbol) {
    return symbol.valueDeclaration ?? symbol.declarations?.[0]
  }
  function visit(name, symbol, type, depth, trail) {
    if (records.has(name) || trail.includes(type)) return undefined
    if (isContext(type)) return undefined
    const shape = componentShape(type)
    const node = { name, type, symbol, shape, parts: [] }
    if (depth < 3) {
      for (const member of checker.getPropertiesOfType(type)) {
        if (!COMPONENT_NAME.test(member.name) || !/^[A-Z]/.test(member.name)) continue
        if (!(member.flags & (ts.SymbolFlags.Value | ts.SymbolFlags.Alias))) continue
        let target = member
        if (member.flags & ts.SymbolFlags.Alias) target = checker.getAliasedSymbol(member)
        if (!(target.flags & ts.SymbolFlags.Value)) continue
        const memberType = checker.getTypeOfSymbolAtLocation(target, entryFile)
        const child = visit(`${name}.${member.name}`, target, memberType, depth + 1, [...trail, type])
        if (child) node.parts.push(child.name)
      }
    }
    if (!shape && node.parts.length === 0) return undefined
    records.set(name, node)
    return node
  }

  const topLevel = new Map()
  const unresolvedEntries = []
  for (const statement of entryFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    const moduleSymbol = checker.getSymbolAtLocation(statement.moduleSpecifier)
    if (!moduleSymbol) {
      if (config.entries !== 'subpackages') throw new Error(`cannot resolve ${statement.moduleSpecifier.getText()} from ${projectDir}`)
      unresolvedEntries.push(statement.moduleSpecifier.text)
      continue
    }
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      if (topLevel.has(exported.name)) continue
      const target = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
      topLevel.set(exported.name, target)
    }
  }
  let skipped = 0
  for (const name of [...topLevel.keys()].sort(cmp)) {
    const symbol = topLevel.get(name)
    if (!COMPONENT_NAME.test(name) || !(symbol.flags & ts.SymbolFlags.Value)) continue
    if (skip.has(name)) {
      skipped++
      continue
    }
    visit(name, symbol, checker.getTypeOfSymbolAtLocation(symbol, entryFile), 0, [])
  }

  // ---- aliases: the same component reachable under two names ----------------------------------------------------
  // Two names are one component when they resolve to the same symbol or type, or — for declarations that inline
  // the function type again (HeroUI) — when their props types print identically. Only ever asked of two names
  // that are already related by the naming rule below.
  const propsKey = (node) => (node.propsKey ??= node.shape ? node.shape.propsTypes.map((t) => checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation)).join(' & ') : undefined)
  const propsKeys = (node) => (node.propsKeys ??= node.shape ? node.shape.propsTypes.map((t) => checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation)) : [])
  const sameComponent = (a, b) => a.symbol === b.symbol || (Boolean(a.shape) && Boolean(b.shape) && (a.type === b.type || propsKey(a) === propsKey(b)))
  const aliasOf = new Map()
  const resolveAlias = (name) => {
    for (let i = 0; i < 4 && aliasOf.has(name); i++) name = aliasOf.get(name)
    return name
  }
  for (const node of records.values()) {
    const dot = node.name.lastIndexOf('.')
    if (dot < 0) continue
    const parentName = node.name.slice(0, dot)
    const member = node.name.slice(dot + 1)
    const nsLast = parentName.slice(parentName.lastIndexOf('.') + 1).replace(/^(?:unstable|experimental|unsafe)_/i, '')
    const parent = records.get(parentName)
    if (member === 'Root' && parent?.shape && (sameComponent(parent, node) || propsKeys(node).every((k) => propsKeys(parent).includes(k)))) {
      // Button.Root is Button itself.
      aliasOf.set(node.name, parentName)
    } else if (member.startsWith(nsLast) && member.length > nsLast.length) {
      // Dialog.DialogTrigger is Dialog.Trigger.
      const short = records.get(`${parentName}.${member.slice(nsLast.length)}`)
      if (short && sameComponent(short, node)) aliasOf.set(node.name, short.name)
    } else if (member === nsLast) {
      // Dialog.Dialog is Dialog.Root.
      const root = records.get(`${parentName}.Root`)
      if (root && sameComponent(root, node)) aliasOf.set(node.name, root.name)
    }
  }
  const byFlatName = new Map()
  for (const node of [...records.values()].sort((a, b) => cmp(a.name, b.name))) {
    if (!node.name.includes('.')) continue
    const flat = node.name.replaceAll('.', '')
    const first = byFlatName.get(flat)
    if (!first) byFlatName.set(flat, node)
    // Calendar.YearPickerCell and CalendarYearPicker.Cell: one component offered by two families.
    else if (!aliasOf.has(node.name) && sameComponent(first, node)) aliasOf.set(node.name, first.name)
  }
  for (const node of records.values()) {
    if (node.name.includes('.')) continue
    const dotted = byFlatName.get(node.name)
    // DialogRoot is Dialog.Root — but never fold a component into its own static member.
    if (dotted && sameComponent(dotted, node) && !dotted.name.startsWith(`${node.name}.`)) aliasOf.set(node.name, dotted.name)
  }
  // An aliased name takes its whole subtree with it.
  for (const name of [...records.keys()]) {
    for (const alias of aliasOf.keys()) if (name.startsWith(`${alias}.`)) records.delete(name)
  }
  const aliases = new Map()
  for (const alias of [...aliasOf.keys()].sort(cmp)) {
    if (!records.has(alias)) continue
    const canonical = resolveAlias(alias)
    if (!records.has(canonical) || canonical === alias) continue
    records.delete(alias)
    if (!aliases.has(canonical)) aliases.set(canonical, [])
    aliases.get(canonical).push(alias)
  }

  // ---- interface mode (option objects of table engines) ----------------------------------------------------------
  const interfaceRecords = []
  for (const name of config.interfaces ?? []) {
    const symbol = topLevel.get(name)
    if (!symbol) throw new Error(`interface ${name} is not exported by ${specifiers.join(', ')}`)
    const type = checker.getDeclaredTypeOfSymbol(symbol)
    const decl = symbol.declarations?.[0]
    const { props, excluded } = collectProps([type], new Set([name]))
    const record = { name, kind: 'interface' }
    if (decl) record.source = sourceOf(decl)
    const tps = decl && (ts.isInterfaceDeclaration(decl) || ts.isTypeAliasDeclaration(decl)) ? (decl.typeParameters ?? []).map((t) => t.name.text) : []
    if (tps.length) record.typeParameters = tps
    record.props = props
    if (excluded.dom || excluded.style) record.excluded = excluded
    interfaceRecords.push(record)
  }

  // ---- records -------------------------------------------------------------------------------------------------
  const components = []
  let excludedDom = 0
  let excludedStyle = 0
  let domDirComponents = 0
  let namespaces = 0
  for (const node of [...records.values()].sort((a, b) => cmp(a.name, b.name))) {
    const record = { name: node.name }
    if (!node.shape) record.kind = 'namespace'
    const decl = declOf(node.symbol)
    if (decl) record.source = sourceOf(decl)
    const parts = node.parts.filter((p) => records.has(p)).sort(cmp)
    if (parts.length) record.parts = parts
    const names = (aliases.get(node.name) ?? []).sort(cmp)
    if (names.length) record.aliases = names
    if (node.shape) {
      const last = node.name.slice(node.name.lastIndexOf('.') + 1)
      const flat = node.name.replaceAll('.', '')
      const typeName = node.shape.propsTypes.map(propsTypeName).find(Boolean)
      const ownNames = new Set([typeName, ...[last, flat, ...names.map((n) => n.replaceAll('.', ''))].flatMap((n) => [`${n}Props`, `${n}OwnProps`, `${n}BaseProps`, `Base${n}Props`, `${n}ComponentProps`])].filter(Boolean))
      const { props, excluded, domDir, styleNames } = collectProps(node.shape.propsTypes, ownNames)
      if (typeName) record.propsType = typeName
      if (node.shape.typeParameters.length) record.typeParameters = node.shape.typeParameters
      record.props = props
      if (excluded.dom || excluded.style) record.excluded = excluded
      excludedDom += excluded.dom
      excludedStyle += excluded.style
      if (domDir) domDirComponents++
      const touched = new Set()
      for (const [prop, owner] of styleNames) {
        if (!sharedStyle.has(owner)) sharedStyle.set(owner, { names: new Set(), components: 0 })
        sharedStyle.get(owner).names.add(prop)
        touched.add(owner)
      }
      for (const owner of touched) sharedStyle.get(owner).components++
    } else {
      record.props = []
      namespaces++
    }
    components.push(record)
  }
  components.push(...interfaceRecords)

  // ---- unresolved imports inside the library: a measure of how much of the type graph was visible -----------------
  const unresolved = new Set()
  for (const sf of program.getSourceFiles()) {
    if (!fileInfo(sf.fileName).own) continue
    for (const statement of sf.statements) {
      if (!(ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) || !statement.moduleSpecifier) continue
      const spec = statement.moduleSpecifier.text
      if (!ts.resolveModuleName(spec, sf.fileName, options, host).resolvedModule) unresolved.add(spec.startsWith('.') ? `${fileInfo(sf.fileName).rel} → ${spec}` : spec)
    }
  }

  // ---- stats and envelope --------------------------------------------------------------------------------------
  const measured = components.filter((c) => c.kind !== 'namespace')
  const counts = measured.map((c) => c.props.length).sort((a, b) => a - b)
  const median = counts.length === 0 ? 0 : counts.length % 2 ? counts[(counts.length - 1) / 2] : (counts[counts.length / 2 - 1] + counts[counts.length / 2]) / 2
  const families = new Set(components.filter((c) => c.kind !== 'interface').map((c) => c.name.split('.')[0])).size
  const repository = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url
  const repoUrl = config.repository ?? normalizeRepo(repository)
  const license = config.license ?? (typeof pkg.license === 'string' ? pkg.license : pkg.license?.type)
  if (!license) throw new Error(`${config.package} has no license field`)
  const library = { name: config.name, package: pkg.name, version: pkg.version, license }
  if (repoUrl) library.repository = repoUrl
  const homepage = config.homepage ?? pkg.homepage
  if (homepage) library.homepage = homepage
  library.kind = config.kind
  library.entryPoints = specifiers.filter((s) => !unresolvedEntries.includes(s))

  const notes = [
    `Read from the type declarations of ${pkg.name}@${pkg.version} with TypeScript ${ts.version}; nothing was executed.`,
    `Not recorded: ${excludedDom} props declared in React's typings, csstype or the DOM lib (HTMLAttributes, AriaAttributes, DOMAttributes, ref, key, CSS properties) — counted per component in excluded.dom` + (excludedStyle ? `; ${excludedStyle} props of the style-prop interfaces listed in data.styleProps — counted in excluded.style.` : '.'),
    `${domDirComponents} components accept the DOM dir attribute through those excluded typings.`,
    aliases.size ? `${[...aliases.values()].reduce((n, a) => n + a.length, 0)} exports are a second name for a recorded component and are listed under aliases.` : '',
    unresolvedEntries.length ? `Entry points whose declared types file is missing from the package: ${unresolvedEntries.join(', ')}.` : '',
    proseDefaults ? `${proseDefaults} @default tags held a sentence instead of a value and were left out.` : '',
    skipped ? `${skipped} exports skipped by config.` : '',
    unresolved.size ? `${unresolved.size} import specifiers inside the package did not resolve (optional peers or untyped assets): ${[...unresolved].sort(cmp).slice(0, 12).join(', ')}${unresolved.size > 12 ? ', …' : ''}.` : '',
    config.notes ?? '',
  ].filter(Boolean).join(' ')

  const data = { library, components }
  data.stats = {
    components: measured.length,
    props: measured.reduce((n, c) => n + c.props.length, 0),
    medianProps: median,
    families,
    namespaces,
    interfaces: interfaceRecords.length,
    aliases: [...aliases.values()].reduce((n, a) => n + a.length, 0),
    excludedDomProps: excludedDom,
    excludedStyleProps: excludedStyle,
    componentsAcceptingDomDir: domDirComponents,
  }
  if (sharedStyle.size) {
    data.styleProps = [...sharedStyle].sort((a, b) => cmp(a[0], b[0])).map(([name, v]) => ({ name, components: v.components, props: [...v.names].sort(cmp) }))
  }
  return {
    kind: 'library-api',
    schemaVersion: 1,
    id: config.id,
    provenance: {
      method: 'extracted',
      confidence: 'verified',
      sources: [
        {
          name: pkg.name,
          url: `https://www.npmjs.com/package/${pkg.name}/v/${pkg.version}`,
          version: pkg.version,
          license,
          retrievedAt: config.retrievedAt,
          path: pkg.types ?? pkg.typings ?? 'package.json#exports',
        },
      ],
      script: SCRIPT,
      notes,
    },
    data,
  }
}

function balanced(text) {
  let depth = 0
  for (const ch of text) {
    if (ch === '(') depth++
    else if (ch === ')' && --depth < 0) return false
  }
  return depth === 0
}

function normalizeRepo(url) {
  if (!url) return undefined
  const cleaned = url.replace(/^git\+/, '').replace(/^git:\/\//, 'https://').replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '')
  if (/^[\w.-]+\/[\w.-]+$/.test(cleaned)) return `https://github.com/${cleaned}`
  return /^https?:\/\//.test(cleaned) ? cleaned : undefined
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
