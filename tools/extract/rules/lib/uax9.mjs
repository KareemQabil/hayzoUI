// Reference implementation of the Unicode Bidirectional Algorithm (UAX #9), rules P2–P3, X1–X10, W1–W7,
// N0–N2, I1–I2, L1–L2, written for this project so that fixture expectations are computed, not guessed.
// It is a test oracle, not the L1 runtime: clarity over speed, one paragraph and one line per call.
// Property data is read from a Unicode Character Database directory passed by the caller
// (extracted/DerivedBidiClass.txt, BidiBrackets.txt, BidiMirroring.txt, UnicodeData.txt); nothing is bundled.
// Conformance is checked by tools/extract/rules/uax9-conformance.mjs against BidiTest.txt and
// BidiCharacterTest.txt of the same UCD version.
import fs from 'node:fs'
import path from 'node:path'

const LONG_TO_SHORT = {
  Left_To_Right: 'L', Right_To_Left: 'R', Arabic_Letter: 'AL', European_Number: 'EN', European_Separator: 'ES',
  European_Terminator: 'ET', Arabic_Number: 'AN', Common_Separator: 'CS', Nonspacing_Mark: 'NSM',
  Boundary_Neutral: 'BN', Paragraph_Separator: 'B', Segment_Separator: 'S', White_Space: 'WS', Other_Neutral: 'ON',
  Left_To_Right_Embedding: 'LRE', Left_To_Right_Override: 'LRO', Right_To_Left_Embedding: 'RLE',
  Right_To_Left_Override: 'RLO', Pop_Directional_Format: 'PDF', Left_To_Right_Isolate: 'LRI',
  Right_To_Left_Isolate: 'RLI', First_Strong_Isolate: 'FSI', Pop_Directional_Isolate: 'PDI',
}
export const BIDI_CLASSES = Object.values(LONG_TO_SHORT)
const MAX_DEPTH = 125
const MAX_BRACKET_STACK = 63

function findFile(dir, name) {
  for (const candidate of [path.join(dir, name), path.join(dir, 'extracted', name)]) if (fs.existsSync(candidate)) return candidate
  throw new Error(`UCD file ${name} not found under ${dir}`)
}

/** Reads the bidi properties of one UCD version. `dir` holds the files flat or in the UCD layout. */
export function loadBidiData(dir) {
  const classIndex = new Uint8Array(0x110000)
  const names = [...BIDI_CLASSES]
  const idx = (short) => {
    const i = names.indexOf(short)
    if (i < 0) throw new Error(`unknown bidi class ${short}`)
    return i
  }
  const fill = (from, to, short) => classIndex.fill(idx(short), from, to + 1)
  const text = fs.readFileSync(findFile(dir, 'DerivedBidiClass.txt'), 'utf8')
  const version = /DerivedBidiClass-([0-9.]+)\.txt/.exec(text)?.[1] ?? 'unknown'
  const lines = text.split('\n')
  // Defaults first, in file order (later @missing lines are more specific), then the explicit assignments.
  for (const line of lines) {
    const m = /^# @missing: ([0-9A-F]+)\.\.([0-9A-F]+); (\w+)/.exec(line)
    if (m) fill(parseInt(m[1], 16), parseInt(m[2], 16), LONG_TO_SHORT[m[3]] ?? m[3])
  }
  for (const line of lines) {
    const m = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*(\w+)/.exec(line)
    if (m) fill(parseInt(m[1], 16), parseInt(m[2] ?? m[1], 16), m[3])
  }
  // Canonical singleton decompositions, needed to pair U+2329/U+232A with U+3008/U+3009 (BD16).
  const canonical = new Map()
  for (const line of fs.readFileSync(findFile(dir, 'UnicodeData.txt'), 'utf8').split('\n')) {
    const f = line.split(';')
    if (f.length > 5 && /^[0-9A-F]+$/.test(f[5])) canonical.set(parseInt(f[0], 16), parseInt(f[5], 16))
  }
  const canon = (cp) => canonical.get(cp) ?? cp
  const brackets = new Map()
  for (const line of fs.readFileSync(findFile(dir, 'BidiBrackets.txt'), 'utf8').split('\n')) {
    const m = /^([0-9A-F]+);\s*([0-9A-F]+);\s*([oc])/.exec(line)
    if (m) brackets.set(parseInt(m[1], 16), { pair: canon(parseInt(m[2], 16)), self: canon(parseInt(m[1], 16)), type: m[3] })
  }
  const mirrors = new Map()
  for (const line of fs.readFileSync(findFile(dir, 'BidiMirroring.txt'), 'utf8').split('\n')) {
    const m = /^([0-9A-F]+);\s*([0-9A-F]+)/.exec(line)
    if (m) mirrors.set(parseInt(m[1], 16), parseInt(m[2], 16))
  }
  return { version, classOf: (cp) => names[classIndex[cp]], brackets, mirrors }
}

const isIsolateInitiator = (t) => t === 'LRI' || t === 'RLI' || t === 'FSI'
const isRemovedByX9 = (t) => t === 'RLE' || t === 'LRE' || t === 'RLO' || t === 'LRO' || t === 'PDF' || t === 'BN'
const isNI = (t) => t === 'B' || t === 'S' || t === 'WS' || t === 'ON' || t === 'FSI' || t === 'LRI' || t === 'RLI' || t === 'PDI'
const dirOfLevel = (level) => (level % 2 ? 'R' : 'L')

function firstStrongLevel(types, start, end, matchPDI) {
  for (let i = start; i < end; i++) {
    const t = types[i]
    if (t === 'L') return 0
    if (t === 'R' || t === 'AL') return 1
    if (isIsolateInitiator(t)) {
      if (matchPDI[i] < 0) return -1
      i = matchPDI[i]
    }
  }
  return -1
}

/**
 * Resolves one paragraph.
 * @param {string[]} originalTypes bidi class of each character
 * @param {0|1|2} paragraphDirection 0 LTR, 1 RTL, 2 auto (P2, P3)
 * @param {(null|{pair:number,self:number,type:'o'|'c'})[]} [bracketInfo] per character, for rule N0
 * @returns {{ paragraphLevel: number, levels: (number|'x')[], order: number[] }} order = logical indexes, left to right
 */
export function resolve(originalTypes, paragraphDirection, bracketInfo) {
  const n = originalTypes.length
  const types = originalTypes.slice()
  const levels = new Array(n).fill(0)

  // BD9: matching PDI of every isolate initiator.
  const matchPDI = new Array(n).fill(-1)
  const matchInitiator = new Array(n).fill(-1)
  {
    const open = []
    for (let i = 0; i < n; i++) {
      if (isIsolateInitiator(types[i])) open.push(i)
      else if (types[i] === 'PDI' && open.length) {
        const j = open.pop()
        matchPDI[j] = i
        matchInitiator[i] = j
      }
    }
  }

  // P2, P3 (or the direction given by a higher-level protocol, HL1).
  let paragraphLevel = paragraphDirection
  if (paragraphDirection === 2) paragraphLevel = Math.max(0, firstStrongLevel(types, 0, n, matchPDI))

  // X1–X8.
  const stack = [{ level: paragraphLevel, override: 'N', isolate: false }]
  let overflowIsolates = 0
  let overflowEmbeddings = 0
  let validIsolates = 0
  const nextLevel = (rtl) => {
    const current = stack[stack.length - 1].level
    return rtl ? (current + 1) | 1 : (current + 2) & ~1
  }
  for (let i = 0; i < n; i++) {
    const t = originalTypes[i]
    const top = stack[stack.length - 1]
    if (t === 'RLE' || t === 'LRE' || t === 'RLO' || t === 'LRO') {
      levels[i] = top.level
      const level = nextLevel(t === 'RLE' || t === 'RLO')
      if (level <= MAX_DEPTH && overflowIsolates === 0 && overflowEmbeddings === 0) {
        stack.push({ level, override: t === 'RLO' ? 'R' : t === 'LRO' ? 'L' : 'N', isolate: false })
      } else if (overflowIsolates === 0) overflowEmbeddings++
    } else if (isIsolateInitiator(t)) {
      levels[i] = top.level
      if (top.override !== 'N') types[i] = top.override
      let rtl = t === 'RLI'
      if (t === 'FSI') rtl = firstStrongLevel(originalTypes, i + 1, matchPDI[i] < 0 ? n : matchPDI[i], matchPDI) === 1
      const level = nextLevel(rtl)
      if (level <= MAX_DEPTH && overflowIsolates === 0 && overflowEmbeddings === 0) {
        validIsolates++
        stack.push({ level, override: 'N', isolate: true })
      } else overflowIsolates++
    } else if (t === 'PDI') {
      if (overflowIsolates > 0) overflowIsolates--
      else if (validIsolates > 0) {
        overflowEmbeddings = 0
        while (!stack[stack.length - 1].isolate) stack.pop()
        stack.pop()
        validIsolates--
      }
      const now = stack[stack.length - 1]
      levels[i] = now.level
      if (now.override !== 'N') types[i] = now.override
    } else if (t === 'PDF') {
      levels[i] = top.level
      if (overflowIsolates > 0) {
        // nothing
      } else if (overflowEmbeddings > 0) overflowEmbeddings--
      else if (!top.isolate && stack.length >= 2) stack.pop()
    } else if (t === 'B') {
      levels[i] = paragraphLevel
    } else if (t === 'BN') {
      levels[i] = top.level
    } else {
      levels[i] = top.level
      if (top.override !== 'N') types[i] = top.override
    }
  }

  // X9: characters removed from further processing.
  const kept = []
  for (let i = 0; i < n; i++) if (!isRemovedByX9(originalTypes[i])) kept.push(i)

  // X10: level runs, then isolating run sequences.
  const runs = []
  for (let k = 0; k < kept.length; k++) {
    const i = kept[k]
    const last = runs[runs.length - 1]
    if (last && levels[last[last.length - 1]] === levels[i]) last.push(i)
    else runs.push([i])
  }
  const runOfFirst = new Map(runs.map((run) => [run[0], run]))
  const sequences = []
  for (const run of runs) {
    const first = run[0]
    if (originalTypes[first] === 'PDI' && matchInitiator[first] >= 0) continue // continues an earlier sequence
    const sequence = run.slice()
    for (;;) {
      const lastIndex = sequence[sequence.length - 1]
      if (!isIsolateInitiator(originalTypes[lastIndex]) || matchPDI[lastIndex] < 0) break
      const next = runOfFirst.get(matchPDI[lastIndex])
      if (!next) break
      sequence.push(...next)
    }
    sequences.push(sequence)
  }

  const keptPosition = new Map(kept.map((i, k) => [i, k]))
  const embedding = levels.slice() // explicit levels, before I1/I2 raise them
  for (const seq of sequences) {
    const level = embedding[seq[0]]
    const e = dirOfLevel(level)
    const beforeK = keptPosition.get(seq[0]) - 1
    const before = beforeK >= 0 ? embedding[kept[beforeK]] : paragraphLevel
    const lastIndex = seq[seq.length - 1]
    const afterK = keptPosition.get(lastIndex) + 1
    const after = isIsolateInitiator(originalTypes[lastIndex]) || afterK >= kept.length ? paragraphLevel : embedding[kept[afterK]]
    const sos = dirOfLevel(Math.max(level, before))
    const eos = dirOfLevel(Math.max(level, after))
    const len = seq.length
    const T = seq.map((i) => types[i])
    const beforeW1 = T.slice()

    // W1
    for (let k = 0; k < len; k++) {
      if (T[k] !== 'NSM') continue
      const prev = k === 0 ? sos : T[k - 1]
      T[k] = k > 0 && (isIsolateInitiator(prev) || prev === 'PDI') ? 'ON' : prev
    }
    // W2
    for (let k = 0; k < len; k++) {
      if (T[k] !== 'EN') continue
      for (let j = k - 1; j >= -1; j--) {
        const t = j < 0 ? sos : T[j]
        if (t === 'L' || t === 'R' || t === 'AL') {
          if (t === 'AL') T[k] = 'AN'
          break
        }
      }
    }
    // W3
    for (let k = 0; k < len; k++) if (T[k] === 'AL') T[k] = 'R'
    // W4
    for (let k = 1; k < len - 1; k++) {
      if (T[k] === 'ES' && T[k - 1] === 'EN' && T[k + 1] === 'EN') T[k] = 'EN'
      else if (T[k] === 'CS' && T[k - 1] === T[k + 1] && (T[k - 1] === 'EN' || T[k - 1] === 'AN')) T[k] = T[k - 1]
    }
    // W5
    for (let k = 0; k < len; k++) {
      if (T[k] !== 'ET') continue
      let end = k
      while (end < len && T[end] === 'ET') end++
      const adjacent = (k > 0 && T[k - 1] === 'EN') || (end < len && T[end] === 'EN')
      if (adjacent) for (let j = k; j < end; j++) T[j] = 'EN'
      k = end - 1
    }
    // W6
    for (let k = 0; k < len; k++) if (T[k] === 'ES' || T[k] === 'ET' || T[k] === 'CS') T[k] = 'ON'
    // W7
    for (let k = 0; k < len; k++) {
      if (T[k] !== 'EN') continue
      for (let j = k - 1; j >= -1; j--) {
        const t = j < 0 ? sos : T[j]
        if (t === 'L' || t === 'R') {
          if (t === 'L') T[k] = 'L'
          break
        }
      }
    }

    // N0: bracket pairs (BD14–BD16).
    if (bracketInfo) {
      const pairs = []
      const open = []
      for (let k = 0; k < len; k++) {
        const info = bracketInfo[seq[k]]
        if (!info || T[k] !== 'ON') continue
        if (info.type === 'o') {
          if (open.length === MAX_BRACKET_STACK) break
          open.push({ pair: info.pair, at: k })
        } else {
          for (let s = open.length - 1; s >= 0; s--) {
            if (open[s].pair === info.self) {
              pairs.push([open[s].at, k])
              open.length = s
              break
            }
          }
        }
      }
      pairs.sort((a, b) => a[0] - b[0])
      const strong = (t) => (t === 'L' ? 'L' : t === 'R' || t === 'EN' || t === 'AN' ? 'R' : null)
      for (const [from, to] of pairs) {
        let foundE = false
        let foundOpposite = false
        for (let k = from + 1; k < to; k++) {
          const s = strong(T[k])
          if (s === e) foundE = true
          else if (s) foundOpposite = true
        }
        let set = null
        if (foundE) set = e
        else if (foundOpposite) {
          let context = sos
          for (let j = from - 1; j >= 0; j--) {
            const s = strong(T[j])
            if (s) {
              context = s
              break
            }
          }
          set = context === e ? e : context
        }
        if (!set) continue
        for (const k of [from, to]) {
          T[k] = set
          for (let j = k + 1; j < len && beforeW1[j] === 'NSM'; j++) T[j] = set
        }
      }
    }

    // N1, N2
    for (let k = 0; k < len; k++) {
      if (!isNI(T[k])) continue
      let end = k
      while (end < len && isNI(T[end])) end++
      const side = (t) => (t === 'L' ? 'L' : 'R') // R, EN and AN count as R here
      const left = k === 0 ? sos : side(T[k - 1])
      const right = end === len ? eos : side(T[end])
      const resolved = left === right ? left : e
      for (let j = k; j < end; j++) T[j] = resolved
      k = end - 1
    }

    // I1, I2
    for (let k = 0; k < len; k++) {
      const t = T[k]
      if (level % 2 === 0) {
        if (t === 'R') levels[seq[k]] = level + 1
        else if (t === 'AN' || t === 'EN') levels[seq[k]] = level + 2
      } else if (t === 'L' || t === 'EN' || t === 'AN') levels[seq[k]] = level + 1
    }
  }

  // L1
  let trailing = true
  for (let i = n - 1; i >= 0; i--) {
    const t = originalTypes[i]
    if (isRemovedByX9(t)) continue
    if (t === 'B' || t === 'S') {
      levels[i] = paragraphLevel
      trailing = true
    } else if (t === 'WS' || isIsolateInitiator(t) || t === 'PDI') {
      if (trailing) levels[i] = paragraphLevel
    } else trailing = false
  }

  // L2
  const order = kept.slice()
  const keptLevels = kept.map((i) => levels[i])
  let highest = 0
  let lowestOdd = Infinity
  for (const level of keptLevels) {
    if (level > highest) highest = level
    if (level % 2 && level < lowestOdd) lowestOdd = level
  }
  for (let level = highest; level >= lowestOdd; level--) {
    for (let k = 0; k < order.length; k++) {
      if (levels[order[k]] < level) continue
      let end = k
      while (end < order.length && levels[order[end]] >= level) end++
      for (let a = k, b = end - 1; a < b; a++, b--) [order[a], order[b]] = [order[b], order[a]]
      k = end
    }
  }

  const out = levels.map((level, i) => (isRemovedByX9(originalTypes[i]) ? 'x' : level))
  return { paragraphLevel, levels: out, order }
}

/** Resolves a sequence of code points with the properties of `data` (from loadBidiData). */
export function resolveCodePoints(codePoints, paragraphDirection, data) {
  const types = codePoints.map((cp) => data.classOf(cp))
  const bracketInfo = codePoints.map((cp) => data.brackets.get(cp) ?? null)
  const result = resolve(types, paragraphDirection, bracketInfo)
  // L4: a character with Bidi_Mirrored at an odd level is drawn with its mirrored glyph.
  const mirrored = []
  codePoints.forEach((cp, i) => {
    if (result.levels[i] !== 'x' && result.levels[i] % 2 === 1 && data.mirrors.has(cp)) mirrored.push(i)
  })
  return { ...result, types, mirrored }
}
