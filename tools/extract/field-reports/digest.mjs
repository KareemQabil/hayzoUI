#!/usr/bin/env node
// Field reports, step 3: print a compact reading digest of selected candidates, from the cache only (no network).
// For each issue: the mechanical header, the cleaned and truncated body returned by the search API, and the
// merged pull requests of the same repository that reference the issue number (from `search.mjs --prs`).
//
//   node tools/extract/field-reports/digest.mjs <out-dir> <owner/name> <number> [<number> …] [--body 600]
//
// The digest is reading material for the researcher; nothing from it is copied into data files.
// (The per-issue REST endpoints /repos/{owner}/{repo}/issues/{n} and …/timeline were not reachable from the
// research environment, so comment threads were read through page fetches where the resolution mattered.)
import fs from 'node:fs'
import path from 'node:path'
import { repoDir } from './config.mjs'

const args = process.argv.slice(2)
const bodyIdx = args.indexOf('--body')
const bodyMax = bodyIdx >= 0 ? Number(args[bodyIdx + 1]) : 600
const positional = args.filter((a, i) => !a.startsWith('--') && i !== bodyIdx + 1)
const [outDir, repo, ...numbers] = positional
if (!outDir || !repo || !numbers.length) {
  console.error('usage: digest.mjs <out-dir> <owner/name> <number>… [--body N]')
  process.exit(2)
}

// Strip what carries no information for a reader: HTML comments, images, long code blocks, issue-template
// boilerplate, long URLs.
export function clean(text, max) {
  let t = (text ?? '')
    .replace(/\r/g, '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/```[\s\S]*?```/g, (m) => (m.length > 200 ? `${m.slice(0, 160)}…\`\`\`` : m))
    .replace(/<details>[\s\S]*?<\/details>/gi, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '[img]')
    .replace(/<img[^>]*>/gi, '[img]')
    .replace(/<video[\s\S]*?<\/video>/gi, '[video]')
    .replace(/https?:\/\/\S{50,}/g, '[url]')
    .replace(/^\s*- \[[ xX]\s?\] .*$/gm, '')
    .replace(/^#+\s*(Dependencies check up|What version of[^\n]*|What package has an issue\??|What framework do you use\??|In which browsers?[^\n]*|If possible[^\n]*|Do you know how to fix[^\n]*|Possible fix|Self-service|Affected component\/components|Codesandbox\/StackBlitz link|Logs|System Info|Before submitting|Link to Reproduction[^\n]*|Chakra UI Version|Browser|Operating System|Additional Information|Package version\(s\)|Reproduction URL|Environment|Screenshots[^\n]*|Your Example Website[^\n]*|Which project does this relate to\?|Platform)\s*\n+(?!#)[^\n]*$/gim, '')
    .replace(/^#+\s*(Current behavior|Expected behavior|Steps to reproduce|Summary|Description)\s*\S*\s*$/gim, (m, h) => `[${h}]`)
    .replace(/^_No response_$/gm, '')
    .replace(/^#+\s*(Duplicates|Latest version|Search keywords|Your environment|Environment|Context|Order ID.*|Reproduction link|Reproducible in.*|Version|Browser.*|Operating system.*|Validations?)\s*[^\n]*$/gim, '')
    .replace(/\n\s*\n+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
  if (t.length > max) t = `${t.slice(0, max)}…`
  return t
}

const { candidates } = JSON.parse(fs.readFileSync(path.join(outDir, 'candidates', `${repoDir(repo)}.json`), 'utf8'))
const byNumber = new Map(candidates.map((c) => [c.number, c]))
const prFile = path.join(outDir, 'prs', `${repoDir(repo)}.json`)
const prs = fs.existsSync(prFile) ? JSON.parse(fs.readFileSync(prFile, 'utf8')).prs : []

for (const raw of numbers) {
  const n = Number(raw)
  const c = byNumber.get(n)
  if (!c) {
    console.log(`\n=== ${repo}#${n} NOT IN CACHE`)
    continue
  }
  const days = Math.round(((c.closedAt ? Date.parse(c.closedAt) : Date.now()) - Date.parse(c.createdAt)) / 86400000)
  console.log(`\n=== #${n} [${c.state}${c.stateReason ? `/${c.stateReason}` : ''}] ${c.createdAt.slice(0, 10)}→${c.closedAt ? c.closedAt.slice(0, 10) : 'open'} (${days}d) c${c.comments} r${c.reactions} [${c.labels.join(', ')}]`)
  console.log(`T: ${c.title}`)
  console.log(`B: ${clean(c.body, bodyMax)}`)
  const linked = prs.filter((p) => p.refs.includes(n))
  for (const p of linked.slice(0, 4)) console.log(`  PR #${p.number} merged ${p.mergedAt?.slice(0, 10)} ${p.closes.includes(n) ? '(closes)' : '(mentions)'} "${p.title}"`)
}
