/**
 * Theme builder: reference → semantic → component.
 * Output is a flat map of CSS custom properties applied to the document root, plus the resolved
 * semantic colors so tools (contrast table, JSON export) read the same values the UI renders.
 */
import { bestOn, contrast, isHex, mix } from './color'
import { amber, fonts, green, monoStack, motion, primaryPresets, red, stone, typeScale, type FontKey, type PrimaryPreset } from './reference'

export type Mode = 'light' | 'dark'
export type Density = 'compact' | 'default' | 'touch'
export type Radius = 0 | 4 | 8 | 12

export interface ThemeConfig {
  mode: Mode
  primary: PrimaryPreset
  customPrimary: string
  font: FontKey
  density: Density
  radius: Radius
}

export const DEFAULT_THEME: ThemeConfig = {
  mode: 'light',
  primary: 'ink',
  customPrimary: '#B0431F',
  font: 'plex',
  density: 'default',
  radius: 4,
}

export type SemanticRole =
  | 'bg.canvas'
  | 'bg.surface'
  | 'bg.sunken'
  | 'bg.raised'
  | 'bg.inverse'
  | 'text.primary'
  | 'text.secondary'
  | 'text.tertiary'
  | 'text.inverse'
  | 'text.link'
  | 'border.subtle'
  | 'border.default'
  | 'border.strong'
  | 'action.primary'
  | 'action.primary.hover'
  | 'action.primary.pressed'
  | 'action.on-primary'
  | 'action.soft'
  | 'action.on-soft'
  | 'focus.ring'
  | 'selection.bg'
  | 'danger.fg'
  | 'danger.bg'
  | 'danger.border'
  | 'success.fg'
  | 'success.bg'
  | 'warning.fg'
  | 'warning.bg'
  | 'info.fg'
  | 'info.bg'

export function primaryBase(config: ThemeConfig): string {
  if (config.primary === 'custom') return isHex(config.customPrimary) ? config.customPrimary.toUpperCase() : primaryPresets.ink.base
  return primaryPresets[config.primary].base
}

export function semanticColors(config: ThemeConfig): Record<SemanticRole, string> {
  const base = primaryBase(config)
  if (config.mode === 'light') {
    const action = base
    return {
      'bg.canvas': stone[50],
      'bg.surface': stone[25],
      'bg.sunken': stone[100],
      'bg.raised': stone[0],
      'bg.inverse': stone[900],
      'text.primary': stone[900],
      'text.secondary': stone[600],
      'text.tertiary': stone[500],
      'text.inverse': stone[50],
      'text.link': mix(base, '#000000', 0.08),
      'border.subtle': stone[150],
      'border.default': stone[200],
      'border.strong': stone[400],
      'action.primary': action,
      'action.primary.hover': mix(action, '#000000', 0.14),
      'action.primary.pressed': mix(action, '#000000', 0.26),
      'action.on-primary': bestOn(action),
      'action.soft': mix(base, '#FFFFFF', 0.9),
      'action.on-soft': mix(base, '#000000', 0.22),
      'focus.ring': base,
      'selection.bg': mix(base, '#FFFFFF', 0.86),
      'danger.fg': red[600],
      'danger.bg': red[50],
      'danger.border': red[500],
      'success.fg': green[600],
      'success.bg': green[50],
      'warning.fg': amber[700],
      'warning.bg': amber[50],
      'info.fg': stone[700],
      'info.bg': stone[100],
    }
  }
  const action = mix(base, '#FFFFFF', 0.42)
  return {
    'bg.canvas': stone[950],
    'bg.surface': stone[900],
    'bg.sunken': stone[1000],
    'bg.raised': stone[850],
    'bg.inverse': stone[100],
    'text.primary': '#EDEAE3',
    'text.secondary': '#B4AEA3',
    'text.tertiary': '#8F897E',
    'text.inverse': stone[900],
    'text.link': mix(base, '#FFFFFF', 0.55),
    'border.subtle': '#2A2825',
    'border.default': '#37342F',
    'border.strong': '#7A7468',
    'action.primary': action,
    'action.primary.hover': mix(action, '#FFFFFF', 0.16),
    'action.primary.pressed': mix(action, '#FFFFFF', 0.28),
    'action.on-primary': bestOn(action),
    'action.soft': mix(base, stone[900], 0.72),
    'action.on-soft': mix(base, '#FFFFFF', 0.66),
    'focus.ring': mix(base, '#FFFFFF', 0.5),
    'selection.bg': mix(base, stone[900], 0.62),
    'danger.fg': red[300],
    'danger.bg': red[900],
    'danger.border': red[400],
    'success.fg': green[300],
    'success.bg': green[900],
    'warning.fg': amber[300],
    'warning.bg': amber[900],
    'info.fg': '#D0CABF',
    'info.bg': stone[850],
  }
}

export const densityScale: Record<Density, { control: number; controlSm: number; padX: number; row: number; gap: number; touch: number }> = {
  compact: { control: 32, controlSm: 28, padX: 10, row: 36, gap: 12, touch: 32 },
  default: { control: 40, controlSm: 32, padX: 12, row: 44, gap: 16, touch: 40 },
  touch: { control: 48, controlSm: 40, padX: 16, row: 52, gap: 20, touch: 48 },
}

export function cssVar(role: string): string {
  return '--ax-' + role.replace(/\./g, '-')
}

/** Builds every CSS custom property for the given configuration. */
export function buildThemeVars(config: ThemeConfig): Record<string, string> {
  const colors = semanticColors(config)
  const d = densityScale[config.density]
  const vars: Record<string, string> = {}
  for (const [role, value] of Object.entries(colors)) vars[cssVar(role)] = value

  // Typography
  vars['--ax-font-sans'] = fonts[config.font].stack
  vars['--ax-font-mono'] = monoStack
  for (const [name, t] of Object.entries(typeScale)) {
    vars[`--ax-type-${name}-size`] = `${t.size}px`
    vars[`--ax-type-${name}-line`] = String(config.font === 'naskh' ? Math.round((t.line + 0.1) * 100) / 100 : t.line)
    vars[`--ax-type-${name}-weight`] = String(t.weight)
  }

  // Shape
  vars['--ax-radius-control'] = `${config.radius}px`
  vars['--ax-radius-surface'] = `${config.radius === 0 ? 0 : config.radius + 2}px`
  vars['--ax-radius-overlay'] = `${config.radius === 0 ? 0 : config.radius + 4}px`

  // Density (component roles derived from semantic density)
  vars['--ax-control-h'] = `${d.control}px`
  vars['--ax-control-h-sm'] = `${d.controlSm}px`
  vars['--ax-control-h-lg'] = `${d.control + 8}px`
  vars['--ax-control-pad-x'] = `${d.padX}px`
  vars['--ax-table-row-h'] = `${d.row}px`
  vars['--ax-field-gap'] = `${Math.round(d.gap / 2) - 2}px`
  vars['--ax-stack-gap'] = `${d.gap}px`

  // Elevation
  const shadowColor = config.mode === 'light' ? '28 25 20' : '0 0 0'
  vars['--ax-elevation-1'] = `0 1px 2px rgb(${shadowColor} / 0.06), 0 2px 8px rgb(${shadowColor} / 0.06)`
  vars['--ax-elevation-2'] = `0 2px 6px rgb(${shadowColor} / 0.08), 0 16px 40px rgb(${shadowColor} / ${config.mode === 'light' ? 0.16 : 0.5})`
  vars['--ax-scrim'] = config.mode === 'light' ? 'rgb(26 25 23 / 0.42)' : 'rgb(0 0 0 / 0.62)'

  // Motion
  vars['--ax-motion-fast'] = `${motion.fast}ms`
  vars['--ax-motion-base'] = `${motion.base}ms`
  vars['--ax-motion-slow'] = `${motion.slow}ms`
  vars['--ax-ease-standard'] = motion.standard
  vars['--ax-ease-emphasized'] = motion.emphasized

  // Component roles
  vars['--ax-control-bg'] = colors['bg.raised']
  vars['--ax-control-border'] = colors['border.strong']
  vars['--ax-control-border-hover'] = colors['text.secondary']
  vars['--ax-control-border-invalid'] = colors['danger.border']
  vars['--ax-control-bg-disabled'] = colors['bg.sunken']
  vars['--ax-focus-ring'] = `0 0 0 2px ${colors['bg.surface']}, 0 0 0 4px ${colors['focus.ring']}`
  return vars
}

export interface ContrastPair {
  fg: SemanticRole
  bg: SemanticRole
  min: number
  purpose: string
}

/** Pairs the system declares. Ratios are computed from the resolved values, never hard-coded. */
export const CONTRAST_PAIRS: ContrastPair[] = [
  { fg: 'text.primary', bg: 'bg.surface', min: 4.5, purpose: 'النص الأساسي على السطح' },
  { fg: 'text.secondary', bg: 'bg.surface', min: 4.5, purpose: 'النص الثانوي والمساعد' },
  { fg: 'text.tertiary', bg: 'bg.surface', min: 4.5, purpose: 'التسميات الخافتة وأرقام الجداول الثانوية' },
  { fg: 'action.on-primary', bg: 'action.primary', min: 4.5, purpose: 'نص الزر الأساسي' },
  { fg: 'text.link', bg: 'bg.surface', min: 4.5, purpose: 'الروابط والإجراءات النصية' },
  { fg: 'action.on-soft', bg: 'action.soft', min: 4.5, purpose: 'العنصر المحدد في التنقل' },
  { fg: 'border.strong', bg: 'bg.raised', min: 3, purpose: 'حدود الحقول (مكوّن واجهة)' },
  { fg: 'focus.ring', bg: 'bg.surface', min: 3, purpose: 'حلقة التركيز' },
  { fg: 'danger.fg', bg: 'bg.surface', min: 4.5, purpose: 'رسائل الخطأ' },
  { fg: 'danger.fg', bg: 'danger.bg', min: 4.5, purpose: 'نص لافتة الخطأ' },
  { fg: 'success.fg', bg: 'success.bg', min: 4.5, purpose: 'نص لافتة النجاح' },
  { fg: 'warning.fg', bg: 'warning.bg', min: 4.5, purpose: 'نص لافتة التنبيه' },
]

export function evaluateContrast(config: ThemeConfig) {
  const colors = semanticColors(config)
  return CONTRAST_PAIRS.map((p) => {
    const ratio = contrast(colors[p.fg], colors[p.bg])
    return { ...p, fgValue: colors[p.fg], bgValue: colors[p.bg], ratio, passes: ratio >= p.min }
  })
}

/** Supported configuration, as exported by the theme studio. */
export function exportTheme(config: ThemeConfig) {
  return {
    $schema: 'ax.theme.v0 (draft, not a published schema)',
    config: {
      mode: config.mode,
      primary: config.primary === 'custom' ? { custom: primaryBase(config) } : { preset: config.primary, base: primaryBase(config) },
      font: fonts[config.font].label,
      density: config.density,
      radius: config.radius,
    },
    semantic: semanticColors(config),
    component: {
      'control.height': `${densityScale[config.density].control}px`,
      'control.radius': `${config.radius}px`,
      'table.row-height': `${densityScale[config.density].row}px`,
    },
    contrast: evaluateContrast(config).map((r) => ({ fg: r.fg, bg: r.bg, ratio: Math.round(r.ratio * 100) / 100, minimum: r.min, meetsDeclaredMinimum: r.passes })),
  }
}
