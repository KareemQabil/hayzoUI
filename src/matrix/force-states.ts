/**
 * Forced interaction states for state sheets, derived from the real stylesheets.
 * Every rule whose selector uses :hover, :focus-visible or :active gets a twin scoped to
 * [data-force-scope~="hover|focus-visible|pressed"], so any component shows its interaction states
 * statically without a per-component prop. Runs once, on the matrix page only.
 */
const MAP: Array<[RegExp, string]> = [
  [/:hover\b/g, 'hover'],
  [/:focus-visible\b/g, 'focus-visible'],
  [/:active\b/g, 'pressed'],
]

function twin(selector: string): string[] {
  const out: string[] = []
  for (const part of selector.split(/,(?![^()]*\))/)) {
    for (const [rx, state] of MAP) {
      rx.lastIndex = 0
      if (!rx.test(part) || /:not\([^)]*:(hover|focus-visible|active)/.test(part)) continue
      out.push(`[data-force-scope~="${state}"] ${part.trim().replace(rx, '')}`)
    }
  }
  return out
}

function collect(rules: CSSRuleList, into: string[]) {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      const sel = twin(rule.selectorText)
      if (sel.length) into.push(`${sel.join(', ')} { ${rule.style.cssText} }`)
    } else if ('cssRules' in rule && !(rule instanceof CSSMediaRule && !matchMedia((rule as CSSMediaRule).conditionText).matches)) {
      collect((rule as CSSGroupingRule).cssRules, into)
    }
  }
}

let installed = false
export function installForcedStates() {
  if (installed || typeof document === 'undefined') return
  installed = true
  const rules: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      collect(sheet.cssRules, rules)
    } catch {
      // cross-origin sheet (fonts): no rules to read
    }
  }
  const style = document.createElement('style')
  style.dataset.matrixForcedStates = String(rules.length)
  style.textContent = rules.join('\n')
  document.head.append(style)
}
