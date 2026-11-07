# HayzoUI development deployment

- Project: `hayzoui`, linked to `KareemQabil/hayzoUI` on Vercel.
- Address: https://hayzoui.vercel.app
- Source branch: `feat/atomic-context-foundations`.
- Framework/build: Vite, Node 22, `pnpm install --frozen-lockfile`, `pnpm run build`, output `dist`.
- The new project automatically deployed this branch with Vercel target `production`.
  This serves the development/reference site; it does not promote the atomic library
  to Stable or merge the independent feature branches.
- Default Vercel access protection is retained. Authorized share links can be created
  for reviewers without disabling project protection.

The homepage is the progress lab. It calls the actual foundation plan resolver for
POS/ERP/CRM selections, exposes context provenance and exact layer requests, and
allows downloading the resulting JSON. It explicitly distinguishes the existing
reference components/studio/application from the future Atomic component slice.
The token engine itself is not loaded into this frontend.

## Verification on 2026-11-07

- Full unit/contract suite: 318 passing tests, with the five external-engine cases
  enabled using the reviewed engine snapshot from the integration checkpoint.
- Full TypeScript and local production build: passed.
- Vercel Git deployment: READY; HTML fetched successfully with HTTP 200.
- Added DOM workflow checks: incompatible density blocks export/reset restores it;
  direction changes preserve locale; CRM selection exports the actual English plan.
- Arabic document language, RTL direction, application title, and noindex metadata
  are supplied from the initial HTML response.

Visual/browser QA remains limited: local Chromium could not start because of the
environment's IPC restrictions, and the connected remote browser service had no
credits. No screenshot, mobile visual, or browser-interaction pass is claimed.
The DOM workflow tests and deployment/source checks are separate evidence.
