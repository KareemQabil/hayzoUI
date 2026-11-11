// Shared configuration of the field-report extraction scripts: which repositories, which search terms,
// and the one HTTP helper.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

// id: the file name under data/field-reports/. repo: GitHub owner/name. license: SPDX id of the repository
// (issues are user content under the GitHub Terms of Service; we record facts and our own summaries only).
export const REPOS = [
  { id: 'material-ui', name: 'Material UI', repo: 'mui/material-ui' },
  { id: 'mui-x', name: 'MUI X', repo: 'mui/mui-x' },
  { id: 'ant-design', name: 'Ant Design', repo: 'ant-design/ant-design' },
  { id: 'shadcn-ui', name: 'shadcn/ui', repo: 'shadcn-ui/ui' },
  { id: 'radix-primitives', name: 'Radix Primitives', repo: 'radix-ui/primitives' },
  { id: 'mantine', name: 'Mantine', repo: 'mantinedev/mantine' },
  { id: 'chakra-ui', name: 'Chakra UI', repo: 'chakra-ui/chakra-ui' },
  { id: 'react-spectrum', name: 'React Spectrum / React Aria', repo: 'adobe/react-spectrum' },
  { id: 'base-ui', name: 'Base UI', repo: 'mui/base-ui' },
  { id: 'headlessui', name: 'Headless UI', repo: 'tailwindlabs/headlessui' },
  { id: 'tailwindcss', name: 'Tailwind CSS', repo: 'tailwindlabs/tailwindcss' },
  { id: 'tanstack-table', name: 'TanStack Table', repo: 'TanStack/table' },
  { id: 'ag-grid', name: 'AG Grid', repo: 'ag-grid/ag-grid' },
  { id: 'primereact', name: 'PrimeReact', repo: 'primefaces/primereact' },
  { id: 'fluentui', name: 'Fluent UI', repo: 'microsoft/fluentui' },
  { id: 'floating-ui', name: 'Floating UI', repo: 'floating-ui/floating-ui' },
  { id: 'react-hook-form', name: 'React Hook Form', repo: 'react-hook-form/react-hook-form' },
  { id: 'date-fns', name: 'date-fns', repo: 'date-fns/date-fns' },
  { id: 'dayjs', name: 'Day.js', repo: 'iamkun/dayjs' },
  { id: 'moment-hijri', name: 'moment-hijri', repo: 'xsoh/moment-hijri' },
  { id: 'recharts', name: 'Recharts', repo: 'recharts/recharts' },
  { id: 'chartjs', name: 'Chart.js', repo: 'chartjs/Chart.js' },
  { id: 'react-day-picker', name: 'React DayPicker', repo: 'gpbl/react-day-picker' },
  { id: 'react-datepicker', name: 'React Datepicker', repo: 'Hacker0x01/react-datepicker' },
]

// The fixed term list. `pages` is how many pages of 100 results to read (best-match order).
export const TERMS = [
  { q: 'rtl', pages: 5 },
  { q: '"right-to-left"', pages: 2 },
  { q: 'arabic', pages: 2 },
  { q: 'bidi' },
  { q: 'bidirectional' },
  { q: 'hijri' },
  { q: '"umm al-qura"' },
  { q: '"arabic numerals"' },
  { q: '"eastern arabic"' },
  { q: 'persian' },
  { q: 'farsi' },
  { q: 'hebrew' },
  { q: 'jalali' },
  { q: '"dir=rtl"' },
  { q: 'mirror' },
  { q: '"logical properties"' },
  // Supplementary terms, added after the first pass showed that libraries which take direction from the locale
  // (React Aria) file these defects without the word "rtl".
  { q: 'islamic' },
  { q: '"numbering system"' },
  { q: '"text direction"' },
  { q: 'ltr' },
]

export const repoDir = (repo) => repo.replace('/', '__')
export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// GET through curl (honours HTTPS_PROXY and the environment's CA bundle; Node's fetch does not). Generic User-Agent.
export function httpGetJson(url, headerFile) {
  const out = execFileSync(
    'curl',
    ['-sS', '--max-time', '60', '-D', headerFile, '-A', 'hayzo-field-reports-research', '-H', 'Accept: application/vnd.github+json', '-H', 'X-GitHub-Api-Version: 2022-11-28', url],
    { maxBuffer: 256 * 1024 * 1024 },
  ).toString('utf8')
  const headerText = fs.readFileSync(headerFile, 'utf8')
  // With a proxy the first block can be the CONNECT response; the last block is the real one.
  const blocks = headerText.split(/\r?\n\r?\n/).filter((b) => b.trim())
  const last = blocks[blocks.length - 1] ?? ''
  const status = Number((last.match(/^HTTP\/[\d.]+ (\d+)/m) ?? [])[1] ?? 0)
  const headers = {}
  for (const line of last.split(/\r?\n/).slice(1)) {
    const i = line.indexOf(':')
    if (i > 0) headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim()
  }
  return { status, headers, text: out }
}
