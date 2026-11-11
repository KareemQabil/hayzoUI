#!/usr/bin/env node
// Searches the source catalogs: node tools/extract/icons/search.mjs <regex> [source,source…] [--tags]
// Matches icon names (and aliases); with --tags also tags. Used to check "missing" claims by hand.
import { loadCatalogs } from './lib.mjs'
const [pattern, only] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const tags = process.argv.includes('--tags')
const re = new RegExp(pattern, 'i')
for (const [id, c] of Object.entries(loadCatalogs())) {
  if (only && !only.split(',').includes(id)) continue
  const hits = c.icons.filter((i) => re.test(i.name) || (i.aliases ?? []).some((a) => re.test(a)) || (tags && (i.tags ?? []).some((t) => re.test(t)))).map((i) => i.name)
  console.log(`${id} (${hits.length}): ${hits.slice(0, 40).join(' ')}`)
}
