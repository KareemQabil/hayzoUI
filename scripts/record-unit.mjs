// Runs Vitest and records results to src/knowledge/evidence/unit-run.json.
// Test names start with a fixture/property id ("CI-F01 …"), which becomes the record id.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'

const out = '/tmp/vitest-report.json'
const startedAt = new Date().toISOString()
try {
  execSync(`pnpm exec vitest run --reporter=json --outputFile=${out}`, { stdio: 'inherit' })
} catch {
  // failures are recorded below
}
const report = JSON.parse(fs.readFileSync(out, 'utf8'))
const version = JSON.parse(fs.readFileSync('node_modules/vitest/package.json', 'utf8')).version
const results = report.testResults.flatMap((f) =>
  f.assertionResults.map((a) => ({
    id: a.title.split(' ')[0],
    name: a.title,
    status: a.status === 'passed' ? 'passed' : a.status === 'failed' ? 'failed' : 'skipped',
    durationMs: Math.round(a.duration ?? 0),
    detail: a.failureMessages?.[0]?.slice(0, 300),
  })),
)
const run = { tool: `Vitest ${version}`, environment: `Node ${process.version} · ${os.platform()} ${os.arch()}`, startedAt, results }
fs.writeFileSync('src/knowledge/evidence/unit-run.json', JSON.stringify(run, null, 2) + '\n')
console.log(`recorded ${results.length} results, ${results.filter((r) => r.status === 'passed').length} passed`)
