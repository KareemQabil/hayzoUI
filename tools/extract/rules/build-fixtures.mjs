#!/usr/bin/env node
// Builds the authored fixture sets in data/fixtures/ from fixtures-src/.
//   node tools/extract/rules/build-fixtures.mjs <ucd-dir>
// <ucd-dir> holds DerivedBidiClass.txt, BidiBrackets.txt, BidiMirroring.txt, UnicodeData.txt and, for the
// conformance record, BidiTest.txt and BidiCharacterTest.txt of one Unicode version (https://www.unicode.org/Public/<v>/ucd/).
// Inputs are hand-written; expectations are computed here: bidi levels and visual order by lib/uax9.mjs,
// lengths and grapheme clusters by the runtime's ICU, calendar conversions and plural categories by Intl, and the
// hand-written amount/phone/search expectations are re-derived by lib/contracts.mjs and must agree.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { CH, ROOT, SOURCES, codePoints, cpList, hex, ownerSource, writeData } from './lib/common.mjs'
import { loadBidiData, resolveCodePoints } from './lib/uax9.mjs'
import { TOLERANCE, localizeNumbers, matchText, parseAmount, parsePhoneEG, searchKey, stripBidiControls } from './lib/contracts.mjs'
import { MIXED } from './fixtures-src/mixed.mjs'
import { NAMES, STRESS } from './fixtures-src/text.mjs'
import { AMOUNTS, COPY, COUNTS, DECIMAL_COUNTS, NOUNS, PHONES, SEARCH } from './fixtures-src/values.mjs'

const ucdDir = process.argv[2]
if (!ucdDir) {
  console.error('usage: build-fixtures.mjs <ucd-dir>')
  process.exit(2)
}
const bidi = loadBidiData(ucdDir)
const SCRIPT = 'tools/extract/rules/build-fixtures.mjs'
const OWNER_COMMIT = '9b4eb3271c64872768f0a5533796a8a36b67e6eb'
const AUTHORED = 'authored for this project (synthetic)'
const ucdSource = { ...SOURCES.ucd, version: bidi.version, url: `https://www.unicode.org/Public/${bidi.version}/ucd/` }

function emit(id, provenance, data) {
  const ids = new Set()
  for (const c of data.cases) {
    assert.ok(!ids.has(c.id), `${id}: duplicate case id ${c.id}`)
    ids.add(c.id)
    if (c.expected === undefined) {
      delete c.expected
      if (!c.tags.includes('needs-expected')) c.tags.push('needs-expected')
    }
  }
  writeData(`data/fixtures/${id}.json`, { kind: 'fixture', schemaVersion: 1, id, provenance: { ...provenance, script: SCRIPT }, data })
  const open = data.cases.filter((c) => c.tags?.includes('needs-expected')).length
  console.log(`${id}: ${data.cases.length} cases${open ? `, ${open} needs-expected` : ''}`)
}

// ---- bidi helpers ------------------------------------------------------------------------------------------
const DIRECTION = { ltr: 0, rtl: 1, auto: 2 }
/** Visual runs, left to right: maximal stretches of consecutive logical indexes. direction rtl = drawn right to left. */
function visualRuns(cps, levels, order) {
  const runs = []
  for (let k = 0; k < order.length; ) {
    let end = k
    let step = 0
    if (k + 1 < order.length && Math.abs(order[k + 1] - order[k]) === 1) {
      step = order[k + 1] - order[k]
      end = k + 1
      while (end + 1 < order.length && order[end + 1] - order[end] === step) end++
    }
    const from = Math.min(order[k], order[end])
    const to = Math.max(order[k], order[end])
    const direction = step === 1 ? 'ltr' : step === -1 ? 'rtl' : levels[order[k]] % 2 ? 'rtl' : 'ltr'
    runs.push({ text: String.fromCodePoint(...cps.slice(from, to + 1)), from, to: to + 1, direction })
    k = end + 1
  }
  return runs
}
function render(cps, dir) {
  const r = resolveCodePoints(cps, DIRECTION[dir], bidi)
  return r
}
function describe(cps, r, keep = cps.map((_, i) => i)) {
  // keep: indexes of the characters to report (drops inserted controls); positions are re-based onto them.
  const rebased = new Map(keep.map((i, k) => [i, k]))
  const order = r.order.filter((i) => rebased.has(i)).map((i) => rebased.get(i))
  const levels = keep.map((i) => r.levels[i])
  const kept = keep.map((i) => cps[i])
  return {
    paragraphLevel: r.paragraphLevel,
    levels,
    visualOrder: order,
    visualRuns: visualRuns(kept, levels, order),
    ...(r.mirrored.some((i) => rebased.has(i)) ? { mirrored: r.mirrored.filter((i) => rebased.has(i)).map((i) => rebased.get(i)) } : {}),
  }
}

// ---- mixed-direction ---------------------------------------------------------------------------------------
{
  const cases = MIXED.map((m) => {
    const cps = codePoints(m.text)
    for (const cp of cps) assert.ok(!['LRE', 'RLE', 'LRO', 'RLO', 'PDF', 'LRI', 'RLI', 'FSI', 'PDI'].includes(bidi.classOf(cp)), `${m.id}: control character in input`)
    const plain = describe(cps, render(cps, m.dir))
    const islands = (m.islands ?? []).map((island) => {
      const [text, direction] = Array.isArray(island) ? island : [island, 'ltr']
      const at = m.text.indexOf(text)
      assert.ok(at >= 0 && m.text.indexOf(text, at + 1) < 0, `${m.id}: island «${text}» must occur exactly once`)
      const from = codePoints(m.text.slice(0, at)).length
      return { text, from, to: from + codePoints(text).length, direction }
    })
    const expected = { plain }
    const tags = [...m.tags, m.dir === 'auto' ? 'dir-auto' : `dir-${m.dir}`]
    if (islands.length) {
      // Insert LRI/RLI … PDI around every island and resolve again; report positions of the original characters.
      const withControls = []
      const keep = []
      cps.forEach((cp, i) => {
        for (const island of islands) if (island.from === i) withControls.push((island.direction === 'ltr' ? CH.LRI : CH.RLI).codePointAt(0))
        keep.push(withControls.length)
        withControls.push(cp)
        for (const island of islands) if (island.to === i + 1) withControls.push(CH.PDI.codePointAt(0))
      })
      expected.isolated = describe(withControls, render(withControls, m.dir), keep)
      expected.plainMatchesIsolated = JSON.stringify(plain.visualOrder) === JSON.stringify(expected.isolated.visualOrder) && plain.paragraphLevel === expected.isolated.paragraphLevel
      tags.push(expected.plainMatchesIsolated ? 'plain-is-correct' : 'plain-is-wrong')
    } else tags.push('no-island')
    return { id: m.id, input: { text: m.text, codePoints: cpList(m.text), paragraphDirection: m.dir, ...(islands.length ? { islands } : {}) }, expected, tags, note: m.note, origin: AUTHORED }
  })
  emit('mixed-direction', {
    method: 'derived', confidence: 'verified', sources: [SOURCES.uax9, ucdSource],
    notes: `Inputs are written by hand. Every level and visual order is computed by tools/extract/rules/lib/uax9.mjs with the bidi properties of UCD ${bidi.version}; that implementation passes all 770,241 cases of BidiTest.txt and all 91,707 cases of BidiCharacterTest.txt of the same version (tools/extract/rules/uax9-conformance.mjs). Which substrings count as islands, and therefore which rendering is "intended", is the researcher's judgment and needs review; the computed orders do not.`,
  }, {
    purpose: 'The classic shapes of mixed Arabic/Latin text, each with its logical string and the visual order the Unicode Bidirectional Algorithm produces for it: once as a bare string ("plain") and once with every opposite-direction unit wrapped in a directional isolate ("isolated"). Where the two differ, the bare string is displayed wrongly and the case is the proof that isolation is required. Use it to test a bidi implementation (levels and order), an isolation helper (which ranges to wrap), and rendering (the order of characters on screen).',
    appliesTo: ['bidi-resolve', 'bidi-isolate', 'text', 'table', 'input'],
    cases,
    inputShape: '{ text: logical string without control characters; codePoints: the same string, one "U+XXXX" per code point; paragraphDirection: rtl | ltr | auto (first strong, UAX #9 P2–P3); islands?: [{ text, from, to, direction }] — code-point ranges [from, to) that are one opposite-direction unit }',
    expectedShape: 'plain: result for the bare string. isolated: result when each island is wrapped in LRI…PDI (direction ltr) or RLI…PDI (rtl) — the same as <bdi dir> or unicode-bidi: isolate — reported for the original characters only. Each result = { paragraphLevel, levels: resolved embedding level per code point, visualOrder: code-point indexes from the left edge to the right edge of the line, visualRuns: the line from left to right as [{ text: logical substring, from, to, direction }] where direction rtl means the run\'s characters are drawn right to left, mirrored?: indexes drawn with a mirrored glyph (UAX #9 L4) }. plainMatchesIsolated: false means the bare string is misordered. The whole line is assumed to fit on one line (L1/L2 applied once).',
    rules: ['R-BIDI-001', 'R-BIDI-003', 'R-BIDI-004', 'R-BIDI-005', 'R-BIDI-006', 'R-BIDI-007', 'R-BIDI-008', 'R-BIDI-009', 'R-BIDI-010', 'R-MONEY-003'],
    tagVocabulary: { 'plain-is-wrong': 'isolating the islands changes the visual order: the bare string is a failure shape', 'plain-is-correct': 'the algorithm already orders the bare string as intended; isolation is harmless', 'no-island': 'nothing to isolate; the plain result is the expected rendering', 'first-strong': 'paragraph direction detected from the first strong character' },
  })
}

// ---- names ---------------------------------------------------------------------------------------------------
const graphemes = (text) => [...new Intl.Segmenter('ar', { granularity: 'grapheme' }).segment(text)].length
const strongOf = (cp) => {
  const t = bidi.classOf(cp)
  return t === 'L' ? 'ltr' : t === 'R' || t === 'AL' ? 'rtl' : null
}
const firstStrong = (text) => {
  for (const cp of codePoints(text)) if (strongOf(cp)) return strongOf(cp)
  return null
}
/** The owner's rule (CONTRACTS.md "Mixed text"): words vote, a tie goes RTL, no strong letters gives null. */
function dominantDirection(text) {
  let rtl = 0
  let ltr = 0
  for (const word of text.split(/\s+/).filter(Boolean)) {
    let r = 0
    let l = 0
    for (const cp of codePoints(word)) {
      const s = strongOf(cp)
      if (s === 'rtl') r++
      else if (s === 'ltr') l++
    }
    if (r === 0 && l === 0) continue
    assert.notEqual(r, l, `word «${word}» has as many RTL as LTR letters: the rule does not say`)
    if (r > l) rtl++
    else ltr++
  }
  return rtl === 0 && ltr === 0 ? null : rtl >= ltr ? 'rtl' : 'ltr'
}
{
  // The re-implementation must agree with the owner's own cases before it is used.
  const harvested = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fixtures/mixed-text-runs-harvested.json'), 'utf8'))
  for (const c of harvested.data.cases) assert.equal(dominantDirection(c.input.text), c.expected.dir, `dominantDirection disagrees with ${c.id}`)

  const cases = NAMES.map((n) => ({
    id: n.id,
    input: { text: n.text, codePoints: cpList(n.text) },
    expected: {
      codePoints: codePoints(n.text).length,
      utf16Length: n.text.length,
      graphemes: graphemes(n.text),
      firstStrongDirection: firstStrong(n.text),
      dominantDirection: dominantDirection(n.text),
      searchKeys: { strict: searchKey(n.text, TOLERANCE.strict).trim(), default: searchKey(n.text, TOLERANCE.default).trim(), duplicateCheck: searchKey(stripBidiControls(n.text), TOLERANCE.duplicateCheck).trim() },
    },
    tags: [...n.tags, ...(n.group ? [`group:${n.group}`] : [])],
    ...(n.note ? { note: n.note } : {}),
    origin: AUTHORED,
  }))
  const groups = {}
  for (const c of cases) for (const t of c.tags) if (t.startsWith('group:')) (groups[t.slice(6)] ??= []).push(c)
  const groupSummary = Object.fromEntries(Object.entries(groups).map(([g, members]) => [g, { members: members.map((c) => c.id), distinctDuplicateKeys: new Set(members.map((c) => c.expected.searchKeys.duplicateCheck)).size, distinctDefaultKeys: new Set(members.map((c) => c.expected.searchKeys.default)).size }]))
  emit('names', {
    method: 'authored', confidence: 'needs-review', sources: [ucdSource, SOURCES.icu, ownerSource(OWNER_COMMIT, 'src/arabic/search.ts')],
    notes: 'Synthetic names composed by the researcher from common given and family names; not records of real people. The expected values are computed: lengths and grapheme clusters by ICU (Intl.Segmenter), directions from UCD bidi classes, search keys by a re-implementation of the owner\'s arabic.search.v1 normalisation (lib/contracts.mjs). The choice and spelling of the names is from model knowledge and needs a native reviewer.',
  }, {
    purpose: 'Arabic personal names that stress an interface: compound names written joined and apart, particles, very long full names, vocalised names, spelling variants of one name, mixed Arabic and Latin, initials and honorific prefixes. Use it for truncation and wrapping, avatar initials, direction of free text, sorting, search and duplicate warnings. Every name must be stored and displayed exactly as typed.',
    appliesTo: ['text-direction', 'search-match', 'avatar', 'table', 'text-field'],
    cases,
    inputShape: '{ text, codePoints }',
    expectedShape: '{ codePoints, utf16Length, graphemes (extended grapheme clusters), firstStrongDirection (what dir="auto" gives), dominantDirection (the owner\'s words-vote rule; differs from first-strong for Latin-first Arabic names), searchKeys: the comparison key at each tolerance level of arabic.search.v1 — two names with the same duplicateCheck key must raise a similar-record warning and are never merged }. No expected value for how a name is split into parts: that is not decidable from the string.',
    rules: ['R-SRCH-001', 'R-SRCH-002', 'R-SRCH-003', 'R-BIDI-001', 'R-BIDI-005', 'R-TYPE-004', 'R-CNT-006'],
    tagVocabulary: { 'group:<name>': 'spellings a person may use for the same name (or, where the note says so, names easily confused)' },
    shared: { groups: groupSummary },
  })
}

// ---- text stress -------------------------------------------------------------------------------------------
{
  const CONTROL_NAMES = { 0x200e: 'LRM', 0x200f: 'RLM', 0x061c: 'ALM', 0x202a: 'LRE', 0x202b: 'RLE', 0x202c: 'PDF', 0x202d: 'LRO', 0x202e: 'RLO', 0x2066: 'LRI', 0x2067: 'RLI', 0x2068: 'FSI', 0x2069: 'PDI' }
  const cases = STRESS.map((s) => {
    const cps = codePoints(s.text)
    const controls = cps.map((cp, i) => (CONTROL_NAMES[cp] ? { index: i, name: CONTROL_NAMES[cp], codePoint: hex(cp) } : null)).filter(Boolean)
    const nfc = s.text.normalize('NFC')
    const nfkc = s.text.normalize('NFKC')
    const expected = {
      codePoints: cps.length,
      utf16Length: s.text.length,
      graphemes: graphemes(s.text),
      nfcEqualsInput: nfc === s.text,
      ...(nfc !== s.text ? { nfc: cpList(nfc) } : {}),
      ...(nfkc !== nfc ? { nfkc: cpList(nfkc) } : {}),
    }
    if (controls.length) {
      // Unbalanced: an initiator without its terminator, or a terminator with nothing to close.
      let embeddings = 0
      let isolates = 0
      let unmatchedClose = 0
      for (const c of controls) {
        if (['LRE', 'RLE', 'LRO', 'RLO'].includes(c.name)) embeddings++
        else if (['LRI', 'RLI', 'FSI'].includes(c.name)) isolates++
        else if (c.name === 'PDF') embeddings > 0 ? embeddings-- : unmatchedClose++
        else if (c.name === 'PDI') isolates > 0 ? isolates-- : unmatchedClose++
      }
      expected.bidiControls = controls.length > 12 ? { count: controls.length, names: [...new Set(controls.map((c) => c.name))] } : controls
      expected.unbalanced = embeddings > 0 || isolates > 0 || unmatchedClose > 0
      expected.withoutBidiControls = stripBidiControls(s.text)
      if (s.tags.includes('spoof')) {
        const r = describe(cps, render(cps, 'ltr'))
        expected.asDisplayedInLtr = r.visualRuns.map(({ text, direction }) => ({ text, direction }))
      }
    }
    return { id: s.id, input: { text: s.text, codePoints: cps.length > 64 ? [...cpList(s.text).slice(0, 16), `… ${cps.length - 16} more`] : cpList(s.text) }, expected, tags: s.tags, ...(s.note ? { note: s.note } : {}), origin: AUTHORED }
  })
  emit('text-stress', {
    method: 'authored', confidence: 'needs-review', sources: [ucdSource, SOURCES.icu, SOURCES.uax9, SOURCES.alreq],
    notes: 'Strings composed by the researcher. Computed fields: counts and normalisation by the runtime (ICU 78.3, Unicode 17 data in Node 22 — grapheme counts of characters added in Unicode 18 are not covered), bidi-control inventory and display order by lib/uax9.mjs. The choice of strings is from model knowledge.',
  }, {
    purpose: 'Strings that break layouts and text handling: unbreakable runs, kashida, lam-alef and wide ligatures, joining controls, stacked marks, emoji beside Arabic, bidi controls used to spoof or left unbalanced, decomposed and look-alike letters, stray invisible characters. Use it for wrapping and truncation, line-height, caret movement and deletion by grapheme, sanitising of pasted or user-supplied text, and search normalisation.',
    appliesTo: ['text', 'text-field', 'truncate', 'sanitize', 'search-match'],
    cases,
    inputShape: '{ text, codePoints (first 16 only when the string is longer than 64 code points) }',
    expectedShape: '{ codePoints, utf16Length, graphemes, nfcEqualsInput, nfc?, nfkc? (when different), bidiControls?: [{ index, name, codePoint }], unbalanced?: true when a directional initiator is not closed or a terminator closes nothing, withoutBidiControls?: the string with the twelve bidi control characters removed, asDisplayedInLtr?: for spoofing strings, the visual runs from left to right in an LTR paragraph }. There is no expected pixel result: line height and wrapping depend on the font and are measured by the harness.',
    rules: ['R-TYPE-001', 'R-TYPE-002', 'R-TYPE-003', 'R-TYPE-004', 'R-TYPE-007', 'R-BIDI-006', 'R-BIDI-011', 'R-INPUT-001', 'R-INPUT-002'],
  })
}

// ---- amounts, phones, search, numerals in copy -------------------------------------------------------------
{
  const cases = AMOUNTS.map(([id, text, currency, allowNegative, expected, tags, note]) => {
    if (expected !== undefined) assert.deepEqual(parseAmount(text, { currency, allowNegative }), expected, `${id}: hand-written expectation differs from the contract`)
    return { id, input: { text, codePoints: cpList(text), ...(currency ? { currency } : { kind: 'percent' }), allowNegative }, expected, tags: [...tags], ...(note ? { note } : {}), origin: AUTHORED }
  })
  emit('amounts', {
    method: 'authored', confidence: 'needs-review', sources: [ownerSource(OWNER_COMMIT, 'CONTRACTS.md'), ownerSource(OWNER_COMMIT, 'src/arabic/amount.ts')],
    notes: 'Inputs and expectations written by hand under the owner\'s contract arabic.amount.v1 and cross-checked against a re-implementation of that contract (lib/contracts.mjs); the two agree on every case that has an expectation. The contract itself is the owner\'s and still marked draft; it knows only EGP, SAR and KWD. Percent inputs have no contract and carry no expectation.',
  }, {
    purpose: 'Typed and pasted amounts in every shape people produce: three numeral systems, both decimal marks, every grouping separator, signs, leading zeros, currency symbols, invisible characters. Each case gives the integer minor-unit value or the rejection the parser must return. Extends amounts-harvested.',
    appliesTo: ['money-parse', 'currency-input', 'numeric-input'],
    cases,
    inputShape: '{ text, codePoints, currency (ISO 4217) or kind: "percent", allowNegative }',
    expectedShape: 'Under arabic.amount.v1 — valid: { status, minor: integer minor units, canonical }; empty: { status, minor: null }; invalid: { status, error, suggestions?: canonical strings offered to the person }. Absent for needs-expected cases.',
    rules: ['R-NUM-001', 'R-NUM-002', 'R-NUM-003', 'R-NUM-005', 'R-NUM-006', 'R-MONEY-001', 'R-MONEY-002', 'R-MONEY-005', 'R-BIDI-006'],
    tagVocabulary: { 'needs-expected': 'no contract decides the outcome yet', latn: 'ASCII digits', arab: 'Arabic-Indic digits U+0660–U+0669', arabext: 'Extended Arabic-Indic digits U+06F0–U+06F9' },
  })
}
{
  const cases = PHONES.map(([id, text, region, expected, tags, note]) => {
    if (region === 'EG') assert.deepEqual(parsePhoneEG(text), expected, `${id}: hand-written expectation differs from the contract`)
    return { id, input: { text, codePoints: cpList(text), region }, expected, tags: [...tags, region], ...(note ? { note } : {}), origin: AUTHORED }
  })
  emit('phone-inputs', {
    method: 'authored', confidence: 'needs-review', sources: [ownerSource(OWNER_COMMIT, 'src/arabic/phone.ts'), ownerSource(OWNER_COMMIT, 'CONTRACTS.md')],
    notes: 'Egyptian cases are written under the owner\'s arabic.phone.eg.v1 (mobile numbers only) and cross-checked against a re-implementation (lib/contracts.mjs). The numbers are placeholders (digit sequences such as 1234 5678), not subscribers. Cases for other countries give only the E.164 string that removing formatting yields; whether the number is valid is the phone layer\'s data.',
  }, {
    purpose: 'Phone numbers as people type and paste them: Arabic-Indic and Persian digits, spaces, dashes, dots, parentheses, +, 00, with and without the leading zero, with pasted direction marks. Each Egyptian case gives the E.164 value or the rejection. Extends phones-harvested.',
    appliesTo: ['phone-parse', 'phone-input'],
    cases,
    inputShape: '{ text, codePoints, region: the country the field is set to }',
    expectedShape: 'EG — valid: { status, e164 }; invalid: { status, error } (arabic.phone.eg.v1). Other regions tagged format-only: { e164 } obtained by removing formatting, with no claim of validity. Absent for needs-expected cases.',
    rules: ['R-NUM-001', 'R-PHONE-001', 'R-PHONE-002', 'R-PHONE-003', 'R-BIDI-006'],
    tagVocabulary: { 'format-only': 'expected value is the cleaned string, not a validity verdict', 'needs-expected': 'the answer depends on the numbering plan held by the phone layer' },
  })
}
{
  const cases = SEARCH.map(([id, query, target, strict, dflt, duplicateCheck, tags, note]) => {
    const computed = { strict: matchText(query, target, TOLERANCE.strict), default: matchText(query, target, TOLERANCE.default), duplicateCheck: matchText(query, target, TOLERANCE.duplicateCheck) }
    assert.deepEqual(computed, { strict, default: dflt, duplicateCheck }, `${id}: hand-written expectation differs from the contract`)
    return { id, input: { query, target, queryCodePoints: cpList(query), targetCodePoints: cpList(target) }, expected: computed, tags: [...tags], ...(note ? { note } : {}), origin: AUTHORED }
  })
  emit('search-pairs', {
    method: 'authored', confidence: 'needs-review', sources: [ownerSource(OWNER_COMMIT, 'src/arabic/search.ts'), ownerSource(OWNER_COMMIT, 'CONTRACTS.md')],
    notes: 'Pairs written by hand; the three verdicts are those of the owner\'s arabic.search.v1 at its three tolerance levels, cross-checked against a re-implementation (lib/contracts.mjs). Tags false-positive-risk, v1-gap and out-of-scope are the researcher\'s reading of where the contract over- or under-matches.',
  }, {
    purpose: 'Query/target pairs with the verdict at each tolerance level, including the pairs where a level is wrong: tolerance that joins two different words (false-positive-risk) and equivalences the contract does not cover (v1-gap). Use it to test the matcher and to decide the default level per field.',
    appliesTo: ['search-match', 'search-field', 'combobox', 'table'],
    cases,
    inputShape: '{ query, target, queryCodePoints, targetCodePoints }',
    expectedShape: '{ strict, default, duplicateCheck }: whether the query matches the target (substring match on normalised text) at each level of arabic.search.v1.',
    rules: ['R-SRCH-001', 'R-SRCH-002', 'R-SRCH-003', 'R-SRCH-004', 'R-SRCH-005'],
    tagVocabulary: { 'false-positive-risk': 'the pair are different words or names; a match at this level is a known cost of the tolerance', 'v1-gap': 'a person would expect a match (or a strict match) that arabic.search.v1 does not give', 'out-of-scope': 'not an orthographic variant; no normalisation level should claim it' },
    shared: { levels: { always: 'case folding; digits to ASCII; U+064B–U+065F, U+0670 and U+0640 removed; whitespace runs collapsed', ...TOLERANCE } },
  })
}
{
  const cases = COPY.map(([id, text, numerals, expected, tags, note]) => {
    assert.equal(localizeNumbers(text, numerals), expected, `${id}: hand-written expectation differs from the contract`)
    return { id, input: { text, numerals }, expected: { text: expected, codePoints: cpList(expected) }, tags: [...tags], ...(note ? { note } : {}), origin: `${AUTHORED}; shapes listed in the owner's CONTRACTS.md` }
  })
  emit('numerals-in-copy', {
    method: 'authored', confidence: 'needs-review', sources: [ownerSource(OWNER_COMMIT, 'CONTRACTS.md'), ownerSource(OWNER_COMMIT, 'src/arabic/digits.ts')],
    notes: 'Sentences written by hand around the examples the owner lists in CONTRACTS.md ("Numerals in copy"); expectations cross-checked against a re-implementation of that rule (lib/contracts.mjs).',
  }, {
    purpose: 'Numbers inside running interface text shown in the reader\'s preferred numerals: quantities, amounts, phones and dates follow the preference; identifiers and numbers that belong to a Latin name keep Latin digits.',
    appliesTo: ['numerals-localize', 'text'],
    cases,
    inputShape: '{ text, numerals: latn | arab — the display preference }',
    expectedShape: '{ text, codePoints } after localisation.',
    rules: ['R-NUM-004', 'R-NUM-007', 'R-BIDI-003'],
  })
}

// ---- plural agreement --------------------------------------------------------------------------------------
{
  // CLDR rule for ar, evaluated here and compared with the runtime's ICU.
  const category = (n) => {
    if (n === 0) return 'zero'
    if (n === 1) return 'one'
    if (n === 2) return 'two'
    if (Number.isInteger(n) && n % 100 >= 3 && n % 100 <= 10) return 'few'
    if (Number.isInteger(n) && n % 100 >= 11 && n % 100 <= 99) return 'many'
    return 'other'
  }
  const pr = new Intl.PluralRules('ar')
  const cases = []
  for (const noun of NOUNS) {
    for (const n of COUNTS) {
      const cat = category(n)
      assert.equal(pr.select(n), cat, `plural category of ${n}`)
      cases.push({ id: `PL-${noun.key}-${n}`, input: { count: n, noun: noun.key }, expected: { category: cat, text: noun.forms[cat].replace('{n}', String(n)) }, tags: [cat, noun.key], origin: AUTHORED })
    }
  }
  for (const text of DECIMAL_COUNTS) {
    const n = Number(text)
    assert.equal(pr.select(n), category(n))
    cases.push({ id: `PL-decimal-${text}`, input: { count: n, written: text }, expected: { category: category(n) }, tags: [category(n), 'decimal'], note: 'Category only: the wording of a noun after a fraction is not settled here.', origin: AUTHORED })
  }
  emit('plural-agreement', {
    method: 'authored', confidence: 'needs-review', sources: [SOURCES.cldr],
    notes: 'Categories are computed from the CLDR plural rule for ar (zero: n = 0; one: n = 1; two: n = 2; few: n % 100 = 3..10; many: n % 100 = 11..99; other) and agree with Intl.PluralRules in ICU 78.3 / CLDR 48 for every count. The Arabic noun forms are the researcher\'s wording, in the nominative, unvocalised, and need a native reviewer; numbers are written in Latin digits because display numerals are a separate preference.',
  }, {
    purpose: 'Counts with a noun, tagged with the CLDR plural category, to test that messages use all six Arabic forms: none, singular, dual, plural for 3–10, singular accusative for 11–99, singular for hundreds and thousands — and that 101, 102, 103 follow their last two digits.',
    appliesTo: ['plural-select', 'messages'],
    cases,
    inputShape: '{ count, noun: key into shared.nouns } or { count, written } for fractions',
    expectedShape: '{ category: CLDR plural category for ar, text?: the phrase built from the noun\'s form for that category }',
    rules: ['R-CNT-004', 'R-CNT-005'],
    shared: { nouns: Object.fromEntries(NOUNS.map((n) => [n.key, { en: n.en, forms: n.forms }])), rule: { zero: 'n = 0', one: 'n = 1', two: 'n = 2', few: 'n % 100 = 3..10', many: 'n % 100 = 11..99', other: 'everything else, including fractions' }, note: 'The dual and sound plural change with grammatical case (ملفان / ملفين); a message catalogue needs the form that fits its sentence, not only the category.' },
  })
}

// ---- dates -------------------------------------------------------------------------------------------------
{
  const parts = (calendar, y, m, d) => {
    const f = new Intl.DateTimeFormat(`en-u-ca-${calendar}-nu-latn`, { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' })
    const p = Object.fromEntries(f.formatToParts(Date.UTC(y, m - 1, d)).map((x) => [x.type, x.value]))
    return { year: Number(p.year), month: Number(p.month), day: Number(p.day) }
  }
  const iso = (t) => new Date(t).toISOString().slice(0, 10)
  const cases = []
  const CONVERT = [
    ['2000-01-01', 'millennium'], ['2024-02-28', 'leap-year'], ['2024-02-29', 'leap-day'], ['2024-03-01', 'leap-year'], ['2025-02-28', 'month-end'], ['2025-03-01', 'month-end'],
    ['2025-12-31', 'gregorian-year-end'], ['2026-01-01', 'gregorian-year-start'], ['2026-02-17', 'ramadan-1447-start'], ['2026-02-18', 'ramadan-1447-start'], ['2026-02-19', 'ramadan-1447-start'],
    ['2026-03-18', 'ramadan-1447-end'], ['2026-03-19', 'ramadan-1447-end'], ['2026-03-20', 'ramadan-1447-end'], ['2026-03-21', 'ramadan-1447-end'],
    ['2026-06-15', 'hijri-year-end'], ['2026-06-16', 'hijri-year-end'], ['2026-06-17', 'hijri-year-start'], ['2026-06-18', 'hijri-year-start'],
    ['2026-11-11', 'today'], ['2026-12-31', 'gregorian-year-end'], ['2027-01-01', 'gregorian-year-start'], ['2027-06-05', 'hijri-year-end'], ['2027-06-06', 'hijri-year-start'], ['2027-06-07', 'hijri-year-start'],
  ]
  for (const [date, tag] of CONVERT) {
    const [y, m, d] = date.split('-').map(Number)
    const expected = { 'islamic-umalqura': parts('islamic-umalqura', y, m, d), 'islamic-civil': parts('islamic-civil', y, m, d), 'islamic-tbla': parts('islamic-tbla', y, m, d) }
    const differ = new Set(Object.values(expected).map((v) => JSON.stringify(v))).size > 1
    cases.push({ id: `DT-conv-${date}`, input: { operation: 'toHijri', date }, expected, tags: ['convert', tag, 'source-icu', ...(differ ? ['calendars-differ'] : [])], origin: 'computed with ICU 78.3 (Node Intl)' })
  }
  // Month lengths of two Umm al-Qura years, found by walking Gregorian days.
  for (const year of [1447, 1448]) {
    const months = Array.from({ length: 12 }, () => ({ days: 0 }))
    for (let t = Date.UTC(2025, 4, 1); t < Date.UTC(2027, 7, 1); t += 86400000) {
      const dt = new Date(t)
      const h = parts('islamic-umalqura', dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
      if (h.year !== year) continue
      const m = months[h.month - 1]
      m.days++
      if (h.day === 1) m.starts = iso(t)
    }
    cases.push({ id: `DT-months-${year}`, input: { operation: 'monthLengths', calendar: 'islamic-umalqura', year }, expected: { months: months.map((m, i) => ({ month: i + 1, days: m.days, starts: m.starts })), daysInYear: months.reduce((a, m) => a + m.days, 0) }, tags: ['month-length', 'source-icu'], note: 'Umm al-Qura months are 29 or 30 days by table, not by rule: a day 30 exists only in some months.', origin: 'computed with ICU 78.3 (Node Intl)' })
  }
  // Validity of Gregorian ISO strings (proleptic rules; computed by round trip).
  for (const [text, tag] of [['2024-02-29', 'leap-day'], ['2025-02-29', 'leap-day'], ['2026-02-30', 'month-end'], ['2026-04-31', 'month-end'], ['2026-13-01', 'month-range'], ['2026-00-10', 'month-range'], ['2026-11-00', 'day-range'], ['2100-02-29', 'leap-day'], ['2000-02-29', 'leap-day']]) {
    const [y, m, d] = text.split('-').map(Number)
    const t = new Date(Date.UTC(y, m - 1, d))
    const valid = t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
    cases.push({ id: `DT-valid-${text}`, input: { operation: 'validate', calendar: 'gregory', text }, expected: { valid }, tags: ['validate', tag], origin: AUTHORED })
  }
  // Ambiguous and locale-shaped typed dates.
  const AMBIGUOUS = [
    ['DT-typed-01', '03/04/2026', { readings: [{ order: 'dmy', date: '2026-04-03' }, { order: 'mdy', date: '2026-03-04' }] }, ['ambiguous-order'], 'Both readings are real dates: the field must know its order or ask.'],
    ['DT-typed-02', '13/04/2026', { readings: [{ order: 'dmy', date: '2026-04-13' }] }, ['order-forced-by-value']],
    ['DT-typed-03', '04/13/2026', { readings: [{ order: 'mdy', date: '2026-04-13' }] }, ['order-forced-by-value']],
    ['DT-typed-04', '٠٣/٠٤/٢٠٢٦', { readings: [{ order: 'dmy', date: '2026-04-03' }, { order: 'mdy', date: '2026-03-04' }] }, ['ambiguous-order', 'arabic-digits']],
    ['DT-typed-05', '2026/11/11', { readings: [{ order: 'ymd', date: '2026-11-11' }] }, ['year-first']],
    ['DT-typed-06', '11/11/2026', { readings: [{ order: 'dmy', date: '2026-11-11' }, { order: 'mdy', date: '2026-11-11' }] }, ['order-irrelevant'], 'Day equals month: either order gives the same date.'],
    ['DT-typed-07', '3-4-26', undefined, ['ambiguous-order', 'two-digit-year'], 'Two-digit year: which century, and in which calendar?'],
    ['DT-typed-08', '1447/09/01', undefined, ['hijri-typed', 'calendar-unknown'], 'Looks like a year-first date; only the field\'s calendar says it is Hijri. Read as Gregorian it is a date fourteen centuries ago.'],
    ['DT-typed-09', '01/09/1447', undefined, ['hijri-typed', 'calendar-unknown', 'ambiguous-order']],
    ['DT-typed-10', '30/02/1447', undefined, ['hijri-typed', 'month-end'], 'Safar 1447: whether a day 30 exists depends on the calendar variant.'],
  ]
  for (const [id, text, expected, tags, note] of AMBIGUOUS) cases.push({ id, input: { operation: 'parseTyped', text }, expected, tags: ['typed', ...tags], ...(note ? { note } : {}), origin: AUTHORED })
  // An instant is not a date: the calendar day depends on the zone.
  const localDay = (instant, timeZone) => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(instant)).replace(', ', 'T')
  for (const [instant, zones, tag] of [
    ['2026-01-01T00:00:00Z', ['Africa/Cairo', 'Asia/Riyadh', 'Asia/Dubai', 'Africa/Casablanca', 'America/New_York'], 'year-boundary'],
    ['2026-03-19T21:30:00Z', ['Africa/Cairo', 'Asia/Riyadh', 'Asia/Dubai'], 'day-boundary'],
    ['2026-04-23T21:30:00Z', ['Africa/Cairo'], 'dst'], ['2026-04-23T22:30:00Z', ['Africa/Cairo'], 'dst'], ['2026-10-29T20:30:00Z', ['Africa/Cairo'], 'dst'], ['2026-10-29T21:30:00Z', ['Africa/Cairo'], 'dst'],
  ]) cases.push({ id: `DT-zone-${instant.replace(/[:]/g, '')}`, input: { operation: 'localDateTime', instant, timeZones: zones }, expected: Object.fromEntries(zones.map((z) => [z, localDay(instant, z)])), tags: ['time-zone', tag, 'source-icu'], origin: 'computed with ICU 78.3, tzdata 2026e (Node Intl)' })
  // Display: the same stored date under different locale, calendar and numerals.
  for (const locale of ['ar-EG', 'ar-SA', 'ar-AE', 'ar-MA', 'ar-JO', 'ar']) {
    for (const calendar of ['gregory', 'islamic-umalqura']) {
      for (const nu of ['latn', 'arab']) {
        const tag = `${locale}-u-ca-${calendar}-nu-${nu}`
        const text = new Intl.DateTimeFormat(tag, { timeZone: 'UTC', dateStyle: 'long' }).format(Date.UTC(2026, 10, 11))
        const short = new Intl.DateTimeFormat(tag, { timeZone: 'UTC', dateStyle: 'short' }).format(Date.UTC(2026, 10, 11))
        cases.push({ id: `DT-format-${tag}`, input: { operation: 'format', date: '2026-11-11', locale: tag }, expected: { long: text, longCodePoints: cpList(text), short, shortCodePoints: cpList(short) }, tags: ['format', calendar, nu, 'source-icu'], origin: 'computed with ICU 78.3 / CLDR 48 (Node Intl)' })
      }
    }
  }
  // First day of the week, as the runtime reports it.
  for (const region of ['EG', 'SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'SY', 'IQ', 'PS', 'YE', 'LY', 'SD', 'TN', 'DZ', 'MA', 'MR']) {
    const info = new Intl.Locale(`ar-${region}`).getWeekInfo?.() ?? new Intl.Locale(`ar-${region}`).weekInfo
    cases.push({ id: `DT-week-${region}`, input: { operation: 'weekInfo', region }, expected: { firstDay: info.firstDay, weekend: info.weekend }, tags: ['week', 'source-icu'], note: '1 = Monday … 7 = Sunday. The regions layer is the authority; this records what ICU 78.3 / CLDR 48 returns so a difference is noticed.', origin: 'computed with ICU 78.3 / CLDR 48 (Node Intl)' })
  }
  emit('dates', {
    method: 'derived', confidence: 'needs-review', sources: [SOURCES.icu, SOURCES.cldr],
    notes: 'Conversions, month lengths, formatted strings, zone offsets and week data are computed with the ICU 78.3 / CLDR 48 / tzdata 2026e bundled in Node 22.23.4, not with this project\'s calendar data: they are a second opinion for the calendar layer, not the authority. Umm al-Qura dates follow ICU\'s table; an official announcement can differ by a day. Typed-date cases and their readings are written by hand.',
  }, {
    purpose: 'Dates where interfaces go wrong: Gregorian month and year ends, leap days, the days around Ramadan and the Hijri new year in three Islamic calendar variants, Umm al-Qura month lengths, typed dates whose day/month order or calendar is ambiguous, instants that fall on different days in different zones, the same stored date displayed under different locales, calendars and numerals, and the first day of the week by country.',
    appliesTo: ['date-convert', 'date-parse', 'date-format', 'calendar-grid', 'date-field'],
    cases,
    inputShape: '{ operation: toHijri | monthLengths | validate | parseTyped | localDateTime | format | weekInfo, … } with dates as ISO 8601 Gregorian YYYY-MM-DD',
    expectedShape: 'toHijri: { <calendar id>: { year, month, day } }; monthLengths: { months: [{ month, days, starts }], daysInYear }; validate: { valid }; parseTyped: { readings: [{ order, date }] } — more than one reading means the input is ambiguous; localDateTime: { <zone>: "YYYY-MM-DDTHH:mm" }; format: { long, short } with code points (ICU inserts direction marks in some patterns); weekInfo: { firstDay, weekend }.',
    rules: ['R-DATE-001', 'R-DATE-002', 'R-DATE-003', 'R-DATE-004', 'R-DATE-005', 'R-DATE-006'],
    tagVocabulary: { 'source-icu': 'expected value comes from the runtime\'s ICU, not from this repository\'s data', 'calendars-differ': 'the three Islamic variants give different dates for this day', 'needs-expected': 'the correct reading depends on a decision not yet made (century window, field calendar)' },
  })
}

// ---- Unicode conformance files (recorded, not copied) --------------------------------------------------------
{
  const record = (name, cases, format) => {
    const file = path.join(ucdDir, name)
    const buf = fs.readFileSync(file)
    const text = buf.toString('utf8')
    const header = text.split('\n').slice(0, 2).join(' ')
    return { name, url: `https://www.unicode.org/Public/${bidi.version}/ucd/${name}`, version: `${bidi.version} (${/Date: ([0-9-]+)/.exec(header)?.[1] ?? 'undated'})`, license: 'Unicode-3.0', bytes: buf.length, lines: text.split('\n').length - 1, cases, sha256: crypto.createHash('sha256').update(buf).digest('hex'), format, retrievedAt: SOURCES.ucd.retrievedAt }
  }
  const files = [
    record('BidiTest.txt', 770241, 'Lines of bidi classes with a bitset of paragraph directions (1 auto, 2 LTR, 4 RTL), grouped under @Levels and @Reorder lines. No bracket pairs; B only as the last character.'),
    record('BidiCharacterTest.txt', 91707, 'code points ; paragraph direction (0 LTR, 1 RTL, 2 auto) ; resolved paragraph level ; levels (x = removed by X9) ; visual order. Covers paired brackets (N0) and the UAX #9 examples.'),
  ]
  emit('unicode-bidi-conformance', {
    method: 'derived', confidence: 'verified', sources: [ucdSource, SOURCES.uax9],
    notes: 'The two files stay at unicode.org; sizes, hashes and case counts were measured on the copies downloaded on 2026-11-11. "cases" counts one test per input line and paragraph direction, as run by tools/extract/rules/uax9-conformance.mjs. The Unicode License V3 permits copying and redistribution with the notice; the files are left upstream only to keep the repository small.',
  }, {
    purpose: 'Where the Unicode conformance tests for the Bidirectional Algorithm live, so the L1 harness can download and run them against its own implementation. They test levels and reordering through rule L2 on a single line; shaping, mirroring glyphs (L4) and line breaking are out of their scope.',
    appliesTo: ['bidi-resolve'],
    cases: files.map((f) => ({ id: f.name.replace('.txt', ''), input: { file: f.name, url: f.url, sha256: f.sha256 }, expected: { cases: f.cases, failures: 0 }, tags: ['external', 'conformance'], note: `Reference run: tools/extract/rules/lib/uax9.mjs passes all ${f.cases} cases.`, origin: `Unicode Character Database ${bidi.version}` })),
    inputShape: '{ file, url, sha256 }',
    expectedShape: '{ cases: number of tests the file yields, failures: 0 }',
    rules: ['R-BIDI-012'],
    externalFiles: files,
  })
}
