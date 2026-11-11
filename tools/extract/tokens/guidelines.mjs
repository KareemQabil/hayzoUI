#!/usr/bin/env node
// Touch-target minimums from platform and accessibility guidance. NOT extracted from a package: these four numbers
// are written from documentation (method "researched", confidence "needs-review") and kept in their own file so
// that no extracted file mixes in documentation values. The scratch-dir argument is accepted and ignored.
//   node tools/extract/tokens/guidelines.mjs [scratch-dir]
import fs from 'node:fs'
import path from 'node:path'
import { REPO, RETRIEVED_AT } from './lib.mjs'

const src = (name, url, license, p) => ({ name, url, license, retrievedAt: RETRIEVED_AT, path: p })
const doc = {
  kind: 'token-reference',
  schemaVersion: 1,
  id: 'platform-guidelines',
  provenance: {
    method: 'researched',
    confidence: 'needs-review',
    sources: [
      src('W3C Web Content Accessibility Guidelines 2.2', 'https://www.w3.org/TR/WCAG22/', 'W3C Document License', 'SC 2.5.8 Target Size (Minimum), SC 2.5.5 Target Size (Enhanced)'),
      src('Apple Human Interface Guidelines', 'https://developer.apple.com/design/human-interface-guidelines/accessibility', 'Proprietary (facts only)', 'Accessibility: control size'),
      src('Material Design 3 guidelines', 'https://m3.material.io/foundations/designing/structure', 'CC-BY-4.0', 'Accessibility: touch targets'),
    ],
    script: 'tools/extract/tokens/guidelines.mjs',
    notes: 'Numbers recalled from the cited documents and not re-read during this run; verify each against the page before relying on it. Only the Material 48px figure is corroborated by extracted data (material-3.json: 48px touch wrapper).',
  },
  data: {
    system: { name: 'Platform and accessibility guidance on target size', license: 'Facts from the cited documents', url: 'https://www.w3.org/TR/WCAG22/' },
    scales: {
      controls: {
        sizes: [],
        touchTarget: [
          { name: 'WCAG 2.2 SC 2.5.8 Target Size (Minimum), level AA', value: '24 CSS px', px: 24, note: 'With exceptions (spacing, inline, user-agent, essential).' },
          { name: 'WCAG 2.2 SC 2.5.5 Target Size (Enhanced), level AAA', value: '44 CSS px', px: 44 },
          { name: 'Apple Human Interface Guidelines minimum hit target', value: '44 pt', px: 44 },
          { name: 'Material Design minimum touch target', value: '48 dp', px: 48 },
        ],
        note: 'Documentation values, kept apart from the extracted files.',
      },
    },
  },
}
const file = path.join(REPO, 'data/tokens/reference/platform-guidelines.json')
fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n')
console.log('wrote data/tokens/reference/platform-guidelines.json  (researched, needs-review)')
