// Finds a Chromium-based browser for playwright-core. CHROMIUM=/path overrides detection.
import fs from 'node:fs'

const CANDIDATES = [
  process.env.CHROMIUM,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
]

export function chromiumPath() {
  const found = CANDIDATES.filter(Boolean).find((p) => fs.existsSync(p))
  if (!found) throw new Error('No Chromium found; set CHROMIUM=/path/to/chrome')
  return found
}
