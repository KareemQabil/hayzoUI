/**
 * Reference tokens — raw values with no meaning attached.
 * Semantic roles (semantic.ts) choose from these; components never read them directly.
 */
export const stone = {
  0: '#FFFFFF',
  25: '#FDFCFA',
  50: '#F6F4EF',
  100: '#EEEBE4',
  150: '#E4E0D7',
  200: '#D6D1C6',
  300: '#B9B2A4',
  400: '#8F887B',
  500: '#716B62',
  600: '#59544D',
  700: '#433F3A',
  800: '#2C2A27',
  850: '#22201E',
  900: '#1A1917',
  950: '#121110',
  1000: '#0B0A09',
} as const

export const red = { 50: '#FCEEEC', 100: '#F7D7D2', 300: '#EE9284', 400: '#E36B5B', 500: '#C8412D', 600: '#A63322', 700: '#84291C', 900: '#3A1712' }
export const green = { 50: '#EAF5EC', 100: '#CFE8D4', 300: '#83C592', 400: '#57A86A', 500: '#33834A', 600: '#286A3B', 700: '#1F532E', 900: '#14291B' }
export const amber = { 50: '#FBF3E3', 100: '#F4E1BA', 300: '#E5B35A', 400: '#D69A35', 500: '#B57A1C', 600: '#8F5E12', 700: '#6E480E', 900: '#30220B' }

/** Primary emphasis presets. Every action/focus/selection role is derived from one base value. */
export const primaryPresets = {
  ink: { label: 'حبر', base: '#2F4BA8' },
  teal: { label: 'فيروزي داكن', base: '#1C6F66' },
  burgundy: { label: 'عنّابي', base: '#87344A' },
} as const
export type PrimaryPreset = keyof typeof primaryPresets | 'custom'

export const fonts = {
  plex: {
    label: 'IBM Plex Sans Arabic',
    stack: "'IBM Plex Sans Arabic', 'IBM Plex Sans', system-ui, sans-serif",
    note: 'خط واجهات بخطوط لاتينية مطابقة من عائلة Plex نفسها. الافتراضي.',
  },
  notoSans: {
    label: 'Noto Sans Arabic',
    stack: "'Noto Sans Arabic', 'Noto Sans', system-ui, sans-serif",
    note: 'تغطية واسعة للحروف. اللاتيني يأتي من Noto Sans.',
  },
  readex: {
    label: 'Readex Pro',
    stack: "'Readex Pro', system-ui, sans-serif",
    note: 'عائلة حديثة باتساع أعرض، مناسبة للعناوين والواجهات اللمسية.',
  },
  naskh: {
    label: 'Noto Naskh Arabic',
    stack: "'Noto Naskh Arabic', 'Noto Serif', Georgia, serif",
    note: 'نسخ للقراءة الطويلة. ارتفاعه الرأسي أكبر، فراجع الكثافة المضغوطة.',
  },
} as const
export type FontKey = keyof typeof fonts

export const monoStack = "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace"

/** 4px base spacing scale. */
export const space = { 0: 0, 0.5: 2, 1: 4, 1.5: 6, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80 } as const

/** Type scale, in px. Line heights were chosen by rendering Arabic with diacritics at each size. */
export const typeScale = {
  display: { size: 44, line: 1.3, weight: 600 },
  h1: { size: 32, line: 1.4, weight: 600 },
  h2: { size: 23, line: 1.5, weight: 600 },
  h3: { size: 18, line: 1.55, weight: 600 },
  bodyLg: { size: 17, line: 1.85, weight: 400 },
  body: { size: 15, line: 1.8, weight: 400 },
  label: { size: 14, line: 1.55, weight: 500 },
  table: { size: 14, line: 1.6, weight: 400 },
  caption: { size: 13, line: 1.6, weight: 400 },
  code: { size: 13, line: 1.65, weight: 400 },
} as const

export const motion = {
  fast: 120,
  base: 180,
  slow: 260,
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasized: 'cubic-bezier(0.3, 0, 0, 1)',
} as const
