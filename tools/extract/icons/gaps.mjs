#!/usr/bin/env node
// Builds data/icons/gaps.json: concepts an Arabic-first product needs, each with the catalog search that backs
// the claim. The list, statuses and notes are authored below; the hits are found by this script.
//   node tools/extract/icons/gaps.mjs
// A term is a case-insensitive regular expression tested against icon names and aliases; `tag:<word>` matches an
// icon that carries exactly that tag. `exclude` drops names that match by accident.
import { envelope, loadCatalogs, RETRIEVED, writeData } from './lib.mjs'

const cat = loadCatalogs()
const g = (id, en, ar, status, priority, need, terms, o = {}) => ({ id, en, ar, status, priority, need, terms, ...o })

const GAPS = [
  g('saudi-riyal-sign', 'Saudi riyal sign (new symbol, 2025)', 'رمز الريال السعودي', 'partial', 'p0',
    'Prices, totals, currency fields and currency pickers in Saudi products. The official symbol was introduced in 2025; the older ligature «﷼» is not it.',
    ['riyal', 'saudi', '(^|[-_])sar($|[-_])'], { exclude: ['iranian'], note: 'Lucide has saudi-riyal. Tabler has currency-riyal, which predates the 2025 symbol and has to be checked visually before use. The other seven sets have nothing. Better still: render the sign as text from a font that carries the character (currency and font layers), and keep an icon only as fallback.' }),
  g('uae-dirham-sign', 'UAE dirham symbol (2025)', 'رمز الدرهم الإماراتي', 'partial', 'p0',
    'Same uses as the riyal sign, for UAE products.',
    ['dirham', '(^|[-_])aed($|[-_])'], { note: 'Lucide has emirati-dirham; Tabler has currency-dirham (verify which drawing it is). Missing from the other seven.' }),
  g('other-arab-currency-marks', 'Marks for other Arab currencies (EGP, KWD, BHD, QAR, OMR, JOD, MAD, DZD, TND, IQD, LYD …)', 'رموز العملات العربية الأخرى', 'partial', 'p1',
    'Currency pickers and multi-currency ledgers. Most of these currencies have no single-glyph sign; products show the Arabic abbreviation (ج.م, د.ك) as text.',
    ['dinar', 'bahraini', 'currency[-_]lyd', 'kuwait', 'egypt', 'tag:egp', 'tag:kwd', 'tag:qar'], { note: 'Only Tabler has any (currency-dinar, currency-bahraini, currency-lyd). Recommendation: no icons; a text badge component fed by the currencies layer.' }),
  g('hijri-calendar', 'Hijri calendar / calendar-system switch', 'التقويم الهجري', 'missing', 'p0',
    'Date pickers that switch between Gregorian and Hijri, dual-date fields, Ramadan working-hours settings.',
    ['hijri', 'islamic', 'lunar', 'tag:hijri', 'tag:islamic calendar'], { note: 'No set has a calendar icon marked as Hijri. Crescent or moon icons exist (see crescent) but mean night mode in every set. Needs original artwork: calendar page with a crescent.' }),
  g('crescent', 'Crescent (as a calendar or Ramadan marker)', 'هلال', 'poor', 'p2',
    'Building block for the Hijri calendar icon; Ramadan schedules.',
    ['crescent', '^moon$', 'star[-_]and[-_]crescent'], { note: 'A moon exists in most sets but is the dark-mode icon; reusing it for Hijri would overload it. Phosphor has star-and-crescent.' }),
  g('arabic-letter-text-format', 'Text-format icons with an Arabic letter («أ» / «ع» instead of «A»): text size, text colour, font, spell-check', 'أيقونات تنسيق النص بحرف عربي', 'missing', 'p0',
    'Rich-text toolbar, font and size pickers in an Arabic interface (mirror rule letters-in-icons).',
    ['arabic', 'abjad', 'alef'], { exclude: ['augmented', 'badge[-_]ar'], note: 'The only hit is Tabler alphabet-arabic (a script picker glyph, not a format icon). No set has Arabic-letter variants of bold, text-size or text-colour. Needs original artwork.' }),
  g('arabic-letter-sort', 'Alphabetical sort with Arabic letters (أ → ي)', 'فرز أبجدي بحروف عربية', 'missing', 'p1',
    'Column sort menus and list sort controls (mirror rule sort-alphabetical).',
    ['sort.*(arab|alef)', '(arab|alef).*sort', 'a[-_]z', 'sort[-_]by[-_]alpha', 'sort[-_]alpha'], { note: 'Hits are the Latin A–Z icons only. Needs original artwork, or use the letter-free sort-ascending/descending icons.' }),
  g('arabic-indic-numbered-list', 'Numbered list with Arabic-Indic digits (١ ٢ ٣)', 'قائمة مرقمة بأرقام عربية مشرقية', 'missing', 'p1',
    'Editor toolbar when the numbering system is arab (mirror rule numbered-list).',
    ['list.*(arab|indic)', 'numbered[-_]rtl', 'number[-_]list[-_]rtl', 'tag:arabic numerals'], { note: 'Material Symbols (format_list_numbered_rtl) and Fluent (text_number_list_rtl) ship an RTL numbered list, both with Latin digits. None has Arabic-Indic digits.' }),
  g('arabic-indic-digit-glyphs', 'Digit icons with Arabic-Indic digits: 123 keyboard toggle, numeric sort, counters', 'أيقونات بأرقام عربية مشرقية', 'missing', 'p2',
    'Numeral-system switch, numeric sort, numeric keypad toggle.',
    ['^123$', 'number[-_]123', 'keyboard[-_]123', 'sort[-_]numeric', 'sort.*numbers', 'sort[-_]0[-_]9', 'arrow[-_]down[-_]0[-_]1'], { note: 'All hits use Latin digits. Prefer live text over baked digits (mirror rule digits-in-icons).' }),
  g('rtl-list-variants', 'RTL variants of list icons (bulleted, numbered, checklist, indent)', 'نسخ من اليمين لليسار لأيقونات القوائم', 'partial', 'p0',
    'Editor toolbar and any list affordance. Bulleted and indent can be mirrored; numbered and checklist need separate artwork.',
    ['list.*rtl', 'rtl.*list', 'checklist[-_]rtl', 'indent.*rtl'], { note: 'Only Fluent and Material Symbols publish RTL-specific list assets. The stroke sets (Lucide, Tabler, Phosphor, Heroicons, Iconoir) have none, so a Hayzo set built on them must draw list-numbered and list-checks for RTL.' }),
  g('text-direction-pair', 'Text-direction controls (LTR / RTL paragraph)', 'أزرار اتجاه النص', 'partial', 'p0',
    'Every editor and text field that mixes Arabic and Latin text needs both buttons.',
    ['text[-_]?direction', 'textdirection', 'pilcrow[-_](left|right)'], { note: 'Present in Lucide, Tabler, Material Symbols and Fluent; absent from Phosphor, Heroicons, Carbon, Iconoir and Bootstrap.' }),
  g('arabic-question-mark', 'Help icon with the Arabic question mark «؟»', 'أيقونة مساعدة بعلامة الاستفهام العربية', 'missing', 'p1',
    'Help, tooltips and FAQ entry points in Arabic-script locales (mirror rule question-mark).',
    ['question.*(rtl|arab)', '(rtl|arab).*question'], { note: 'Only Fluent has one hand-drawn RTL question-mark asset (book_question_mark_rtl). Elsewhere the glyph has to be mirrored at render time, by script not by direction.' }),
  g('language-switch-arabic', 'Language switch showing an Arabic letter («ع» / A)', 'تبديل اللغة بحرف عربي', 'poor', 'p1',
    'The language toggle is the most used control of a bilingual product. Existing translate icons pair a Latin A with a CJK character.',
    ['^translate$', '^languages?$', 'language[-_]', 'alphabet'], { exclude: ['katakana', 'hiragana', 'hangul', 'korean', 'thai', 'bangla', 'hebrew', 'greek', 'cyrillic', 'polish', 'runes', 'latin'], note: 'No set has an Arabic/Latin pair; Tabler alphabet-arabic is the nearest. Needs original artwork (ع | A).' }),
  g('mosque', 'Mosque (map point, branch finder)', 'مسجد', 'partial', 'p2',
    'Store locators and maps list mosques as landmarks; not needed by ERP/POS screens themselves.',
    ['mosque', 'masjid'], { note: 'Present in Lucide, Tabler, Phosphor, Material Symbols and Fluent.' }),
  g('prayer-times', 'Prayer times / prayer-break marker', 'أوقات الصلاة', 'partial', 'p1',
    'Retail and scheduling: shop hours, shift planners and booking calendars in Saudi Arabia and elsewhere show prayer breaks.',
    ['pray', 'salah', 'salat'], { exclude: ['spray'], note: 'Material Symbols has prayer_times; Phosphor hands-praying and Tabler pray are generic. No stroke set has a schedule-oriented icon.' }),
  g('qibla', 'Qibla direction / Kaaba', 'اتجاه القبلة', 'missing', 'p2',
    'Hospitality and travel products only; listed for completeness, not needed by business applications.',
    ['qibla', 'kaaba', 'kaba', 'tag:qibla', 'tag:kaaba'], { exclude: ['kabaddi'], note: 'No hits in any set.' }),
  g('national-payment-schemes', 'National payment scheme marks: mada, Meeza, KNET, Benefit, NAPS, OmanNet, Fawry, STC Pay, Tabby, Tamara', 'علامات شبكات الدفع الوطنية', 'trademark', 'p0',
    'Checkout, POS tender buttons, receipts and settlement reports must show the scheme the customer used.',
    ['(^|[-_])mada($|[-_])', 'meeza', 'knet', '(^|[-_])benefit[-_]?pay', 'fawry', '(^|[-_])stc[-_]?pay', 'tabby', 'tamara', 'omannet', '(^|[-_])naps($|[-_])'], { note: 'No hits. These are registered trademarks with their own brand guidelines: Hayzo should define the slot (size, clear space, monochrome fallback label) and let the integrator supply the artwork under the scheme\'s licence. Not collected here. International marks appear only in Tabler (brand-visa, brand-mastercard) and Iconoir (mastercard-card).' }),
  g('cash-on-delivery', 'Cash on delivery', 'الدفع عند الاستلام', 'missing', 'p1',
    'A dominant payment method in MENA e-commerce: checkout option, order status, courier reconciliation.',
    ['cash[-_]on', '(^|[-_])cod($|[-_])', 'tag:cash on delivery', 'tag:cod'], { note: 'No hits. Compose from hand-coins/banknote plus truck, or draw one.' }),
  g('installments-bnpl', 'Instalments / buy now pay later', 'التقسيط والدفع الآجل', 'poor', 'p1',
    'Checkout and invoices with split payments.',
    ['installment', 'instalment', 'pay[-_]later', 'bnpl', 'credit[-_]card[-_]clock', 'tag:installments'], { note: 'Only a loose match: credit_card_clock in Material Symbols and Fluent.' }),
  g('halal-mark', 'Halal certification marker', 'علامة حلال', 'trademark', 'p2',
    'Product catalogues and food POS show certification.',
    ['halal', 'tag:halal'], { note: 'No hits. Certification marks belong to the certifying bodies; treat like payment marks (slot plus text fallback «حلال»).' }),
  g('e-invoice-qr', 'Tax invoice with QR code (e-invoicing)', 'فاتورة ضريبية برمز QR', 'missing', 'p1',
    'ZATCA-style simplified tax invoices carry a QR code; lists and status chips distinguish them from plain receipts.',
    ['(invoice|receipt).*qr', 'qr.*(invoice|receipt)'], { note: 'No hits; compose receipt + qr-code.' }),
]

const out = GAPS.map((x) => {
  const res = x.terms.filter((t) => !t.startsWith('tag:')).map((t) => new RegExp(t, 'i'))
  const tagWords = new Set(x.terms.filter((t) => t.startsWith('tag:')).map((t) => t.slice(4).toLowerCase()))
  const ex = (x.exclude ?? []).map((t) => new RegExp(t, 'i'))
  const hits = {}, hitCounts = {}
  for (const [id, c] of Object.entries(cat)) {
    const found = c.icons.filter((i) => {
      const labels = [i.name, ...(i.aliases ?? [])]
      if (ex.some((r) => labels.some((l) => r.test(l)))) return false
      return res.some((r) => labels.some((l) => r.test(l))) || (i.tags ?? []).some((t) => tagWords.has(t.toLowerCase()))
    }).map((i) => i.name)
    if (found.length) { hits[id] = found.slice(0, 12); hitCounts[id] = found.length }
  }
  return { id: x.id, name: { ar: x.ar, en: x.en }, status: x.status, priority: x.priority, need: x.need, ...(x.note ? { note: x.note } : {}), search: { terms: x.terms, ...(x.exclude ? { exclude: x.exclude } : {}), hits, hitCounts } }
})
writeData('gaps.json', envelope('gaps', {
  method: 'authored', confidence: 'needs-review',
  sources: Object.entries(cat).map(([id, c]) => ({ name: c.set.name, url: c.set.repository, version: c.set.version, license: c.set.license.spdx, retrievedAt: RETRIEVED, path: `data/icons/sources/${id}.json` })),
  script: 'tools/extract/icons/gaps.mjs',
  notes: 'Which concepts are needed, their status and priority are the author\'s judgement. `search.hits` is produced by the script from the nine source catalogs (names, aliases and exact tags; at most 12 names per source, full count in hitCounts), so every "missing" is "no icon whose name, alias or tag matches these terms", not a visual review. An icon can exist under a name the terms do not anticipate. Arabic names are the author\'s. No trademarked artwork was collected.',
}, 'gaps', { method: 'Name, alias and exact-tag search over data/icons/sources/*.json; see tools/extract/icons/gaps.mjs.', gaps: out }))
for (const x of out) console.log(`${x.status.padEnd(9)} ${x.id.padEnd(28)} ${Object.entries(x.search.hits).map(([s, n]) => s + ':' + n.slice(0, 4).join(',')).join(' | ').slice(0, 230)}`)
