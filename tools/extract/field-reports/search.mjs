#!/usr/bin/env node
// Field reports, step 1: find candidate issues.
// Queries the GitHub issue search API for each repository and each term of a fixed list, caches every raw
// response, and writes one de-duplicated candidate list per repository.
//
//   node tools/extract/field-reports/search.mjs <out-dir> [--repos owner/name,owner/name] [--terms a,b] [--prs]
//
// With --prs it searches merged pull requests instead (same terms) and records which issue numbers each one
// references or closes, so a fix can be tied to a report mechanically.
// --terms limits fetching AND the merged list of a repository to those terms: run without it for the full list
// (cached pages are not fetched again).
//
// <out-dir> is a scratch directory OUTSIDE the repository. Layout written there:
//   raw/<owner>__<name>/<term-slug>.p<N>.json   one API response per page (never refetched when present)
//   candidates/<owner>__<name>.json             merged, de-duplicated candidates (with bodies)
//   candidates/index.json                       per-repository totals and the totals GitHub reported per term
//   raw-prs/…, prs/<owner>__<name>.json         the same for --prs: number, title, mergedAt, refs[], closes[]
//
// HTTP goes through `curl` (it honours HTTPS_PROXY and the CA bundle of the environment; Node's fetch does not).
// The User-Agent is generic. The script reads the x-ratelimit-* headers and sleeps until the window resets.
import fs from 'node:fs'
import path from 'node:path'
import { REPOS, TERMS, repoDir, slug, httpGetJson } from './config.mjs'

const args = process.argv.slice(2)
const outDir = args.find((a) => !a.startsWith('--'))
if (!outDir) {
  console.error('usage: search.mjs <out-dir> [--repos a/b,c/d] [--terms x,y] [--prs]')
  process.exit(2)
}
const opt = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const repos = opt('--repos') ? REPOS.filter((r) => opt('--repos').split(',').includes(r.repo)) : REPOS
const terms = opt('--terms') ? TERMS.filter((t) => opt('--terms').split(',').includes(t.q)) : TERMS

const PRS = args.includes('--prs')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function search(repo, term, page) {
  const dir = path.join(outDir, PRS ? 'raw-prs' : 'raw', repoDir(repo))
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${slug(term.q)}.p${page}.json`)
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'))
  const q = PRS ? `repo:${repo} is:pr is:merged ${term.q}` : `repo:${repo} is:issue ${term.q}`
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&per_page=100&page=${page}`
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = httpGetJson(url, path.join(outDir, PRS ? 'raw-prs' : 'raw', '.headers'))
    const remaining = Number(res.headers['x-ratelimit-remaining'] ?? 1)
    const reset = Number(res.headers['x-ratelimit-reset'] ?? 0) * 1000
    if (res.status === 200) {
      const json = JSON.parse(res.text)
      fs.writeFileSync(file, JSON.stringify(json))
      if (remaining <= 2 && reset) await sleep(Math.max(1000, reset - Date.now() + 1500))
      else await sleep(2300)
      return json
    }
    if (res.status === 403 || res.status === 429) {
      const wait = res.headers['retry-after'] ? Number(res.headers['retry-after']) * 1000 : Math.max(5000, reset - Date.now() + 1500)
      console.error(`  rate limited (${res.status}) on ${repo} "${term.q}"; waiting ${Math.round(wait / 1000)}s`)
      limits.push({ at: new Date().toISOString(), repo, term: term.q, status: res.status, waitedSeconds: Math.round(wait / 1000) })
      await sleep(Math.min(wait, 120000))
      continue
    }
    if (res.status === 422) {
      // Repository without issues, or a query GitHub refuses: record and move on.
      console.error(`  422 for ${repo} "${term.q}": ${res.text.slice(0, 200)}`)
      return { total_count: 0, items: [], error: 422 }
    }
    console.error(`  HTTP ${res.status} for ${repo} "${term.q}"; retrying`)
    await sleep(4000 * (attempt + 1))
  }
  throw new Error(`gave up on ${repo} "${term.q}" page ${page}`)
}

const limits = []
const index = []
fs.mkdirSync(path.join(outDir, PRS ? 'prs' : 'candidates'), { recursive: true })

for (const { repo } of repos) {
  const byNumber = new Map()
  const totals = {}
  for (const term of terms) {
    let total = 0
    for (let page = 1; page <= (term.pages ?? 1); page++) {
      const json = await search(repo, term, page)
      total = json.total_count ?? 0
      for (const it of json.items ?? []) {
        if (PRS) {
          if (!it.pull_request) continue
          const text = `${it.title}\n${it.body ?? ''}`
          const refs = [...new Set([...text.matchAll(/(?:#|issues\/)(\d{2,6})\b/g)].map((m) => Number(m[1])))].filter((n) => n !== it.number)
          const closes = [...new Set([...text.matchAll(/\b(?:clos(?:e|es|ed)|fix(?:es|ed)?|resolv(?:e|es|ed))\b:?\s+(?:https:\/\/github\.com\/[^\s/]+\/[^\s/]+\/issues\/|#)(\d{2,6})\b/gi)].map((m) => Number(m[1])))]
          byNumber.set(it.number, { number: it.number, title: it.title, mergedAt: it.pull_request.merged_at ?? it.closed_at, url: it.html_url, refs, closes })
          continue
        }
        if (it.pull_request) continue
        const c = byNumber.get(it.number) ?? {
          number: it.number,
          title: it.title,
          state: it.state,
          stateReason: it.state_reason ?? null,
          labels: (it.labels ?? []).map((l) => l.name).sort(),
          comments: it.comments,
          reactions: it.reactions?.total_count ?? 0,
          thumbsUp: it.reactions?.['+1'] ?? 0,
          createdAt: it.created_at,
          closedAt: it.closed_at,
          updatedAt: it.updated_at,
          url: it.html_url,
          author: it.user?.login ?? null,
          authorAssociation: it.author_association ?? null,
          matchedTerms: [],
          body: it.body ?? '',
        }
        if (!c.matchedTerms.includes(term.q)) c.matchedTerms.push(term.q)
        byNumber.set(it.number, c)
      }
      if ((json.items ?? []).length < 100) break
    }
    totals[term.q] = total
    console.error(`${repo}  ${term.q}: ${total}`)
  }
  const list = [...byNumber.values()].sort((a, b) => a.number - b.number)
  if (PRS) {
    fs.writeFileSync(path.join(outDir, 'prs', `${repoDir(repo)}.json`), JSON.stringify({ repo, totals, prs: list }, null, 1))
    console.error(`${repo}: ${list.length} merged pull requests`)
    continue
  }
  fs.writeFileSync(path.join(outDir, 'candidates', `${repoDir(repo)}.json`), JSON.stringify({ repo, totals, candidates: list }, null, 1))
  index.push({ repo, candidates: list.length, totals })
}

if (PRS) {
  console.error(`done: merged pull requests of ${repos.length} repositories; ${limits.length} rate-limit waits`)
  process.exit(0)
}
const indexFile = path.join(outDir, 'candidates', 'index.json')
const previous = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : { repos: [], limits: [] }
const merged = new Map(previous.repos.map((r) => [r.repo, r]))
for (const r of index) merged.set(r.repo, r)
fs.writeFileSync(indexFile, JSON.stringify({ repos: [...merged.values()].sort((a, b) => a.repo.localeCompare(b.repo)), limits: [...(previous.limits ?? []), ...limits] }, null, 1))
console.error(`done: ${index.reduce((n, r) => n + r.candidates, 0)} candidates in ${index.length} repositories; ${limits.length} rate-limit waits`)
