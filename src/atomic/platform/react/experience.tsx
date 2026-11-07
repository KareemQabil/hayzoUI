/**
 * F1 platform adapter: applies one resolved experience to a subtree.
 *
 * The scope element carries everything downstream needs, so components never take `dir`, sizes or colors:
 *   dir, lang          — from the experience context (direction is explicit, never inferred from locale)
 *   data-numerals      — the numbering system (read by the numerals oracle)
 *   data-density, data-motion, data-hz-experience — for recipes and evidence
 *   style              — the resolved CSS custom properties
 * Resolution is pure and memoized per selection; a composition that fails is shown as an error, never styled by a fallback.
 */
import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from 'react'
import type { ExperienceContext } from '../../foundations'
import { resolveExperienceStyle, type ExperienceSelection, type ExperienceStyle } from '../../styles/experience'

const ExperienceContextReact = createContext<ExperienceContext | null>(null)

/** The resolved context of the nearest scope. Components read locale and direction here, never from props. */
export function useExperience(): ExperienceContext {
  const value = useContext(ExperienceContextReact)
  if (!value) throw new Error('Atomic components must be rendered inside an <ExperienceScope>.')
  return value
}

export function ExperienceScope({ selection, children, className }: { selection: ExperienceSelection; children: ReactNode; className?: string }) {
  const result = useMemo(() => resolveExperienceStyle(selection), [selection.visual, selection.context, selection.language])
  if (!result.ok) {
    return (
      <div role="alert" data-hz-experience-error={result.stage}>
        <strong>Experience could not be composed ({result.stage}).</strong>
        <pre dir="ltr">{JSON.stringify(result.issues, null, 2).slice(0, 2000)}</pre>
      </div>
    )
  }
  return <Scope style={result.style} className={className}>{children}</Scope>
}

function Scope({ style, children, className }: { style: ExperienceStyle; children: ReactNode; className?: string }) {
  const { context } = style
  return (
    <ExperienceContextReact.Provider value={context}>
      <div
        dir={context.direction}
        lang={context.locale}
        data-numerals={context.numberingSystem === 'arab' ? 'arab' : 'latn'}
        data-density={context.density}
        data-motion={context.motion}
        data-hz-experience={style.key}
        data-hz-layers={style.layers.join(' ')}
        className={className}
        style={style.variables as CSSProperties}
      >
        {children}
      </div>
    </ExperienceContextReact.Provider>
  )
}
