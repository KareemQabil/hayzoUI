#!/usr/bin/env node
// Runs every extractor of the token-reference layer against one scratch directory (after fetch.mjs).
//   node tools/extract/tokens/build-all.mjs <scratch-dir>
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = process.argv[2]
if (!root) {
  console.error('usage: build-all.mjs <scratch-dir>')
  process.exit(2)
}
for (const s of ['antd', 'material', 'mui', 'radix', 'tailwind', 'open-props', 'carbon', 'fluent', 'primer', 'spectrum', 'polaris', 'shadcn', 'mantine', 'chakra', 'guidelines']) execFileSync(process.execPath, [path.join(here, `${s}.mjs`), root], { stdio: 'inherit' })
