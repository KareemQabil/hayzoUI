/**
 * Icon registry. Every icon declares how it behaves in RTL:
 *  - auto:  mirrors in RTL because it encodes reading direction (forward/back, next/previous)
 *  - never: depicts a real-world object or a universal symbol (search, clock, check, phone)
 * Upstream glyphs: lucide-react (ISC). Integrated dependency, not original artwork.
 */
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Code,
  Compass,
  Contrast,
  Copy,
  CornerDownLeft,
  Database,
  Download,
  ExternalLink,
  FileJson,
  FlaskConical,
  Info,
  Keyboard,
  Languages,
  Layers,
  Library,
  LoaderCircle,
  Menu,
  Moon,
  Palette,
  Phone,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  TriangleAlert,
  Undo2,
  User,
  UserPlus,
  Wallet,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react'

type Mirror = 'auto' | 'never'

// Glyphs are drawn for LTR. "forward" is the reading-direction next step.
export const ICONS = {
  forward: { icon: ChevronRight, mirror: 'auto', note: 'تقدّم في اتجاه القراءة؛ يُعكس في RTL' },
  back: { icon: ArrowLeft, mirror: 'auto', note: 'رجوع؛ يتبع اتجاه القراءة' },
  next: { icon: ArrowRight, mirror: 'auto', note: 'الخطوة التالية؛ يُعكس في RTL' },
  'chevron-down': { icon: ChevronDown, mirror: 'never', note: '' },
  'chevrons-up-down': { icon: ChevronsUpDown, mirror: 'never', note: '' },
  search: { icon: Search, mirror: 'never', note: 'رمز عدسة؛ لا يُعكس' },
  close: { icon: X, mirror: 'never', note: '' },
  copy: { icon: Copy, mirror: 'never', note: '' },
  check: { icon: Check, mirror: 'never', note: 'علامة صح عالمية؛ لا تُعكس' },
  error: { icon: CircleAlert, mirror: 'never', note: '' },
  warning: { icon: TriangleAlert, mirror: 'never', note: '' },
  success: { icon: CircleCheck, mirror: 'never', note: '' },
  info: { icon: Info, mirror: 'never', note: '' },
  plus: { icon: Plus, mirror: 'never', note: '' },
  moon: { icon: Moon, mirror: 'never', note: '' },
  sun: { icon: Sun, mirror: 'never', note: '' },
  menu: { icon: Menu, mirror: 'never', note: '' },
  reset: { icon: RotateCcw, mirror: 'never', note: 'دوران الساعة لا يتبع اتجاه النص' },
  undo: { icon: Undo2, mirror: 'auto', note: 'تراجع؛ يتبع الخط الزمني للقراءة' },
  download: { icon: Download, mirror: 'never', note: '' },
  external: { icon: ExternalLink, mirror: 'auto', note: '' },
  phone: { icon: Phone, mirror: 'never', note: 'سماعة هاتف؛ شيء مادي لا يُعكس' },
  user: { icon: User, mirror: 'never', note: '' },
  'user-plus': { icon: UserPlus, mirror: 'never', note: '' },
  wallet: { icon: Wallet, mirror: 'never', note: '' },
  receipt: { icon: Receipt, mirror: 'never', note: '' },
  loader: { icon: LoaderCircle, mirror: 'never', note: '' },
  book: { icon: BookOpen, mirror: 'never', note: '' },
  layers: { icon: Layers, mirror: 'never', note: '' },
  palette: { icon: Palette, mirror: 'never', note: '' },
  boxes: { icon: Boxes, mirror: 'never', note: '' },
  shield: { icon: ShieldCheck, mirror: 'never', note: '' },
  library: { icon: Library, mirror: 'never', note: '' },
  workflow: { icon: Workflow, mirror: 'never', note: '' },
  code: { icon: Code, mirror: 'never', note: '' },
  json: { icon: FileJson, mirror: 'never', note: '' },
  flask: { icon: FlaskConical, mirror: 'never', note: '' },
  keyboard: { icon: Keyboard, mirror: 'never', note: '' },
  languages: { icon: Languages, mirror: 'never', note: '' },
  sliders: { icon: SlidersHorizontal, mirror: 'never', note: '' },
  enter: { icon: CornerDownLeft, mirror: 'never', note: 'يطابق شكل مفتاح الإدخال الفعلي' },
  database: { icon: Database, mirror: 'never', note: '' },
  bot: { icon: Bot, mirror: 'never', note: '' },
  compass: { icon: Compass, mirror: 'never', note: '' },
  contrast: { icon: Contrast, mirror: 'never', note: '' },
  pending: { icon: CircleDashed, mirror: 'never', note: '' },
} satisfies Record<string, { icon: LucideIcon; mirror: Mirror; note: string }>

export type IconName = keyof typeof ICONS

export function Icon({ name, size = 18, className, label }: { name: IconName; size?: number; className?: string; label?: string }) {
  const def = ICONS[name]
  const Glyph = def.icon
  return (
    <Glyph
      size={size}
      strokeWidth={1.75}
      className={['ax-icon', className].filter(Boolean).join(' ')}
      data-mirror={def.mirror}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
    />
  )
}
