// Runs Vitest and records results to src/knowledge/evidence/unit-run.json.
// Test names start with a fixture/property id ("CI-F01 …"), which becomes the record id.
// Pages read counts and the run date from this file; nothing on a page is typed by hand.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const out = path.join(os.tmpdir(), `vitest-report-${process.pid}.json`)
const startedAt = new Date().toISOString()
try {
  execSync(`npx vitest run --reporter=json --outputFile="${out}"`, { stdio: 'inherit' })
} catch {
  // failures are recorded below
}
const report = JSON.parse(fs.readFileSync(out, 'utf8'))
fs.rmSync(out, { force: true })
const version = JSON.parse(fs.readFileSync('node_modules/vitest/package.json', 'utf8')).version
let commit = null
try { commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim() } catch { /* not a checkout */ }
const results = report.testResults.flatMap((f) =>
  f.assertionResults.map((a) => ({
    id: a.title.split(' ')[0],
    name: a.title,
    file: path.relative(process.cwd(), f.name).split(path.sep).join('/'),
    status: a.status === 'passed' ? 'passed' : a.status === 'failed' ? 'failed' : 'skipped',
    durationMs: Math.round(a.duration ?? 0),
    detail: a.failureMessages?.[0]?.slice(0, 300),
  })),
)
const run = { tool: `Vitest ${version}`, environment: `Node ${process.version} · ${os.platform()} ${os.arch()}`, startedAt, commit, results }
fs.writeFileSync('src/knowledge/evidence/unit-run.json', JSON.stringify(run, null, 2) + '\n')
console.log(`recorded ${results.length} results, ${results.filter((r) => r.status === 'passed').length} passed`)
