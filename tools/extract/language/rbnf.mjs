// Parser and reference interpreter for the subset of CLDR RBNF that the Arabic rule sets use.
// parseRbnf(text) -> [{ name, private, rules: [{ kind, descriptor, baseValue?, radix?, divisor?, body, tokens }] }]
// format(ruleSets, name, value) executes the parsed structure (BigInt for integers) — used to check that the
// structure in data/language/ar/spellout.json is executable; it is not a general RBNF engine.

function tokenize(body) {
  const tokens = []
  let i = 0
  let text = ''
  const flush = () => {
    if (text) tokens.push({ type: 'text', value: text })
    text = ''
  }
  while (i < body.length) {
    const c = body[i]
    if (c === '[') {
      const end = body.indexOf(']', i)
      flush()
      tokens.push({ type: 'optional', tokens: tokenize(body.slice(i + 1, end)) })
      i = end + 1
    } else if (c === '<' || c === '>' || c === '=') {
      const end = body.indexOf(c, i + 1)
      const inner = body.slice(i + 1, end)
      flush()
      const token = { type: c === '<' ? 'quotient' : c === '>' ? 'remainder' : 'same' }
      if (inner.startsWith('%')) token.ruleSet = inner
      else if (inner) token.decimalFormat = inner
      tokens.push(token)
      i = end + 1
    } else {
      text += c
      i++
    }
  }
  flush()
  return tokens
}

export function parseRbnf(text) {
  const sets = []
  let current = null
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const header = /^(%%?[\w-]+):$/.exec(line)
    if (header) {
      current = { name: header[1], private: header[1].startsWith('%%'), rules: [] }
      sets.push(current)
      continue
    }
    const m = /^([^:]+): ?(.*);$/.exec(line)
    if (!m || !current) throw new Error(`unparsed RBNF line: ${line}`)
    const descriptor = m[1]
    const body = m[2]
    const rule = { descriptor }
    if (descriptor === '-x') rule.kind = 'negative'
    else if (descriptor === 'x.x') rule.kind = 'fraction'
    else {
      const d = /^(\d+)(?:\/(\d+))?$/.exec(descriptor)
      if (!d) throw new Error(`unsupported descriptor: ${descriptor}`)
      rule.kind = 'base'
      const base = BigInt(d[1])
      const radix = BigInt(d[2] ?? 10)
      let divisor = 1n
      while (divisor * radix <= base) divisor *= radix
      rule.baseValue = base.toString()
      rule.radix = Number(radix)
      rule.divisor = divisor.toString()
    }
    rule.body = body
    rule.tokens = tokenize(body)
    current.rules.push(rule)
  }
  return sets
}

function group(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function format(ruleSets, name, value) {
  const set = ruleSets.find((s) => s.name === name)
  if (!set) throw new Error(`no rule set ${name}`)
  const str = String(value)
  const negative = str.startsWith('-')
  const [intPart, fracPart] = str.replace('-', '').split('.')
  const render = (tokens, ctx) => tokens.map((t) => {
    if (t.type === 'text') return t.value
    if (t.type === 'optional') return ctx.optional ? render(t.tokens, ctx) : ''
    const target = t.ruleSet ?? name
    if (t.type === 'same') return t.decimalFormat ? (t.decimalFormat === '0.0' ? str : group(ctx.n)) : format(ruleSets, target, ctx.same)
    if (t.type === 'quotient') return format(ruleSets, target, ctx.quotient)
    return ctx.remainder(target)
  }).join('')
  if (negative) {
    const rule = set.rules.find((r) => r.kind === 'negative')
    return render(rule.tokens, { remainder: (target) => format(ruleSets, target, str.slice(1)) })
  }
  if (fracPart !== undefined) {
    const rule = set.rules.find((r) => r.kind === 'fraction')
    return render(rule.tokens, { n: intPart, same: str, quotient: intPart, remainder: (target) => [...fracPart].map((d) => format(ruleSets, target, d)).join(' ') })
  }
  const n = BigInt(intPart)
  const bases = set.rules.filter((r) => r.kind === 'base')
  let rule = bases[0]
  for (const r of bases) if (BigInt(r.baseValue) <= n) rule = r
  const divisor = BigInt(rule.divisor)
  // UTS #35: if the rule has two substitutions and n is a multiple of the divisor, use the preceding rule. Not needed for ar.
  return render(rule.tokens, { n, same: n.toString(), quotient: (n / divisor).toString(), optional: n % divisor !== 0n, remainder: (target) => format(ruleSets, target, (n % divisor).toString()) })
}
