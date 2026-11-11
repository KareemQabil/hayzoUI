// Shared by the rules/fixtures scripts: the source registry, the envelope writer and code-point helpers.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')
export const RETRIEVED = '2026-11-11'

/** Every upstream artifact this layer cites. `SOURCES.x` goes into provenance.sources; `ref('x', section)` into a rule. */
export const SOURCES = {
  uax9: { name: 'Unicode Standard Annex #9: Unicode Bidirectional Algorithm', url: 'https://www.unicode.org/reports/tr9/tr9-52.html', version: 'Revision 52 (Unicode 18.0.0), 2026-09-01', license: 'Unicode-3.0', retrievedAt: RETRIEVED },
  ucd: { name: 'Unicode Character Database', url: 'https://www.unicode.org/Public/18.0.0/ucd/', version: '18.0.0', license: 'Unicode-3.0', retrievedAt: RETRIEVED },
  alreq: { name: 'W3C Arabic & Persian Layout Requirements', url: 'https://www.w3.org/TR/2025/DNOTE-alreq-20251002/', version: 'Group Draft Note 2025-10-02', license: 'W3C Document License', retrievedAt: RETRIEVED },
  inlineBidi: { name: 'W3C Internationalization: Inline markup and bidirectional text in HTML', url: 'https://www.w3.org/International/articles/inline-bidi-markup/', license: 'W3C Document License', retrievedAt: RETRIEVED },
  ubaBasics: { name: 'W3C Internationalization: Unicode Bidirectional Algorithm basics', url: 'https://www.w3.org/International/articles/inline-bidi-markup/uba-basics', license: 'W3C Document License', retrievedAt: RETRIEVED },
  structuralBidi: { name: 'W3C Internationalization: Structural markup and right-to-left text in HTML', url: 'https://www.w3.org/International/questions/qa-html-dir', license: 'W3C Document License', retrievedAt: RETRIEVED },
  bidiControls: { name: 'W3C Internationalization: How to use Unicode controls for bidi text', url: 'https://www.w3.org/International/questions/qa-bidi-unicode-controls', license: 'W3C Document License', retrievedAt: RETRIEVED },
  langDecl: { name: 'W3C Internationalization: Declaring language in HTML', url: 'https://www.w3.org/International/questions/qa-html-language-declarations', license: 'W3C Document License', retrievedAt: RETRIEVED },
  cssLogical: { name: 'CSS Logical Properties and Values Level 1', url: 'https://www.w3.org/TR/css-logical-1/', version: 'Working Draft 2025-12-04', license: 'W3C Document License', retrievedAt: RETRIEVED },
  cssWritingModes: { name: 'CSS Writing Modes Level 4', url: 'https://www.w3.org/TR/css-writing-modes-4/', version: 'Candidate Recommendation 2019-07-30', license: 'W3C Document License', retrievedAt: RETRIEVED },
  cssText3: { name: 'CSS Text Module Level 3', url: 'https://www.w3.org/TR/css-text-3/', version: 'Candidate Recommendation Draft 2026-08-14', license: 'W3C Document License', retrievedAt: RETRIEVED },
  cssText4: { name: 'CSS Text Module Level 4', url: 'https://www.w3.org/TR/css-text-4/', version: 'Working Draft 2026-08-14', license: 'W3C Document License', retrievedAt: RETRIEVED },
  cssOverflow: { name: 'CSS Overflow Module Level 3', url: 'https://www.w3.org/TR/css-overflow-3/', version: 'Working Draft 2025-10-07', license: 'W3C Document License', retrievedAt: RETRIEVED },
  cssFonts: { name: 'CSS Fonts Module Level 4', url: 'https://www.w3.org/TR/css-fonts-4/', version: 'Working Draft 2026-11-04', license: 'W3C Document License', retrievedAt: RETRIEVED },
  wcag: { name: 'Web Content Accessibility Guidelines (WCAG) 2.2', url: 'https://www.w3.org/TR/WCAG22/', version: 'W3C Recommendation 2024-12-12', license: 'W3C Document License', retrievedAt: RETRIEVED },
  html: { name: 'HTML Living Standard', url: 'https://html.spec.whatwg.org/multipage/', version: 'living standard, read 2026-11-11', license: 'CC-BY-4.0', retrievedAt: RETRIEVED },
  apg: { name: 'WAI-ARIA Authoring Practices Guide', url: 'https://www.w3.org/WAI/ARIA/apg/', license: 'W3C Document License', retrievedAt: RETRIEVED },
  appleRtl: { name: 'Apple Human Interface Guidelines: Right to left', url: 'https://developer.apple.com/design/human-interface-guidelines/right-to-left', version: 'page read 2026-11-11', license: 'Proprietary (© Apple Inc.; cited and re-expressed, no text kept)', retrievedAt: RETRIEVED },
  materialBidi: { name: 'Material Design 2: Bidirectionality', url: 'https://m2.material.io/design/usability/bidirectionality.html', version: 'not machine-readable on 2026-11-11 (JavaScript-only page); cited from prior knowledge', license: 'CC-BY-4.0', retrievedAt: RETRIEVED },
  msBidi: { name: 'Microsoft Learn, Globalization: Text directionality', url: 'https://learn.microsoft.com/en-us/globalization/fonts-layout/text-directionality', version: 'page read 2026-11-11', license: 'CC-BY-4.0', retrievedAt: RETRIEVED },
  msNumbers: { name: 'Microsoft Learn, Globalization: Format numbers', url: 'https://learn.microsoft.com/en-us/globalization/locale/number-formatting', version: 'page read 2026-11-11', license: 'CC-BY-4.0', retrievedAt: RETRIEVED },
  cldr: { name: 'Unicode CLDR', url: 'https://github.com/unicode-org/cldr-json', version: '48.0 (as shipped in ICU 78.3 with Node 22.23.4; plural rules compared with cldr-json main on 2026-11-11)', license: 'Unicode-3.0', retrievedAt: RETRIEVED },
  icu: { name: 'ICU (via Node.js Intl)', url: 'https://github.com/unicode-org/icu', version: 'ICU 78.3, CLDR 48.0, tzdata 2026e, Node 22.23.4', license: 'Unicode-3.0', retrievedAt: RETRIEVED },
  googleArabicType: { name: 'Google Design: Modernizing Arabic typography & type design', url: 'https://design.google/library/modernizing-arabic-typography-type-design', version: 'as cited by the owner; not re-read', license: 'Proprietary (cited only)', retrievedAt: RETRIEVED },
}

export function ownerSource(commit, filePath) {
  return { name: 'hayzoUI (the owner\'s earlier prototype)', url: 'https://github.com/KareemQabil/hayzoui', version: commit, license: 'MIT', retrievedAt: RETRIEVED, ...(filePath ? { path: filePath } : {}) }
}

export const ref = (key, section) => ({ name: SOURCES[key].name, url: SOURCES[key].url, ...(section ? { section } : {}) })

// Invisible and space-like characters are written as \uXXXX so that no file holds a raw bidi control (DATA_MODEL).
// The ranges are numeric on purpose: this source file must not contain the characters or their escapes either.
const INVISIBLE_RANGES = [[0xa0, 0xa0], [0xad, 0xad], [0x61c, 0x61c], [0x180e, 0x180e], [0x2000, 0x200f], [0x2028, 0x202f], [0x205f, 0x206f], [0xfeff, 0xfeff]]
const isInvisible = (code) => INVISIBLE_RANGES.some(([from, to]) => code >= from && code <= to)
const BACKSLASH = String.fromCharCode(92)
export function toJson(doc) {
  let out = ''
  for (const ch of JSON.stringify(doc, null, 2)) out += ch.length === 1 && isInvisible(ch.charCodeAt(0)) ? BACKSLASH + 'u' + ch.charCodeAt(0).toString(16).padStart(4, '0') : ch
  return out + String.fromCharCode(10)
}

export function writeData(relPath, doc) {
  const file = path.join(ROOT, relPath)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, toJson(doc))
}

export const codePoints = (text) => Array.from(text, (ch) => ch.codePointAt(0))
export const hex = (cp) => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0')
export const cpList = (text) => codePoints(text).map(hex)

export const NBSP = String.fromCharCode(0xa0)
export const NNBSP = String.fromCharCode(0x202f)
export const CH = { LRM: String.fromCharCode(0x200e), RLM: String.fromCharCode(0x200f), ALM: String.fromCharCode(0x61c), LRE: String.fromCharCode(0x202a), RLE: String.fromCharCode(0x202b), PDF: String.fromCharCode(0x202c), LRO: String.fromCharCode(0x202d), RLO: String.fromCharCode(0x202e), LRI: String.fromCharCode(0x2066), RLI: String.fromCharCode(0x2067), FSI: String.fromCharCode(0x2068), PDI: String.fromCharCode(0x2069), ZWNJ: String.fromCharCode(0x200c), ZWJ: String.fromCharCode(0x200d), ZWSP: String.fromCharCode(0x200b), THIN: String.fromCharCode(0x2009), BOM: String.fromCharCode(0xfeff), SHY: String.fromCharCode(0xad), WJ: String.fromCharCode(0x2060) }
