# Atomic Token Engine — review follow-up prompt

Copy everything below into the agent working on the token engine.

---

Continue HayzoUI's Atomic Token Engine on `feat/atomic-token-engine`.

Review target: `b4fbf969fc77ad028d64d8c22cbed79ea5f1722d`.
Read `docs/architecture/ATOMIC_LAYERED_ARCHITECTURE.md` completely before editing.
If your branch has advanced, inspect the diff and reproduce which findings still apply.

Your current **29 tests passed** against that exact exported source tree. The four
characterization probes from the earlier review still reproduce the same behavior.
Five live adapter contract cases also pass through your public API. Additional
review reproduced the following issues. Fix these before expanding the engine.

The exhaustive-switch TypeScript error is now fixed. The strict consumer check
using your real public namespace with the integration port passes. Keep that fix;
do not reopen it as an outstanding task.

## Required fixes

1. **Malformed top-level input throws.** `validateTokenLayers(null)` and
   `resolveTokens({})` throw `TypeError` at runtime. Make the public validation and
   resolution boundaries accept unknown JSON input and return structured diagnostics.
   Add regressions for null, objects, strings, malformed layers, and malformed definitions.
   Preserve the no-partial-output failure contract.

2. **Resolved values alias input data.** Resolve a dimension token using
   `const value = { value: 16, unit: 'px' }`; modifying `value.value = 99` afterwards
   changes the already-returned result. Implement detached snapshot semantics for
   resolved values and provenance. Do not mutate or freeze caller-owned objects.
   Verify arrays, definitions, references, and metadata; document whether returned
   snapshots are frozen. Ensure traces and generated CSS remain consistent with
   the resolved snapshot after source data is edited.

3. **Generic font fallback loses its CSS semantics.**
   `['Noto Sans Arabic', 'sans-serif']` currently becomes
   `"Noto Sans Arabic", "sans-serif"`. Preserve generic fallback semantics. Make
   the representation explicit if literal and generic family names need distinction;
   document any API change. Retain escaping for actual family names and reject
   unsafe strings. Test a real named font followed by an actual generic fallback.

4. **Invalid shadow blur is accepted and emitted.**
   `0px 0px -2px #000` currently validates. Reject negative blur radius while
   retaining valid negative offsets and negative spread. Add meaningful cases for
   the documented supported grammar, including multi-shadow lists and inset.

## Architecture and coordination

- Confirm canonical layer precedence against the architecture. Explain how recipe
  variant/size/state contributions are represented at this stage. Do not silently
  invent precedence or start component implementations.
- Keep the core independent of React, DOM, browser globals, and runtime CSS-in-JS.
- Work only inside `src/atomic/tokens/` and relevant token-engine documentation.
- Do not merge `feat/atomic-context-foundations`, edit `src/atomic/foundations/`, or
  modify legacy `src/tokens/`, providers, UI components, package manifest, or lockfile.
- The foundation contracts reference assets/layers by exact `id` + `version`;
  `TokenLayer` currently carries `id` + `type`. Document the future adapter boundary:
  reference loading/version checks remain outside the pure resolver. Do not add a
  registry or implement the other agent's foundation layer.
- Foundation IDs currently allow lowercase dot-separated or hyphen-separated slugs,
  while your layer ID validator is narrower. Explain the mapping/compatibility
  expectation rather than assuming the example IDs can be passed through unchanged.
- The foundation branch now exposes `resolveExperienceContext`: it validates loaded
  profile/style assets, composes preferences, then checks effective density, input
  modality, and selected appearance. Consume a future explicit context snapshot;
  do not couple token resolution to React context or environment detection.

## Verification and delivery

Run scoped tests and strict typechecking. Repository installation now passes the
environment policy without exceptions. The foundation branch also fixes the legacy
DatePicker's undeclared direct `@internationalized/date` dependency using the exact
already-locked version; do not duplicate this unrelated fix on your engine branch.

`src/atomic/integration` on the foundation branch now exports `resolveExperienceTokens`.
It injects your public validation/resolution functions and binds exact versioned
payload envelopes. It does not import or modify your implementation. Its copied,
frozen input snapshots protect callers from source aliasing, but **that does not fix
the standalone engine's snapshot contract**: the original aliasing probe still passes.
Keep the standalone correction in scope. The light/dark, provenance, forbidden
override, and unknown-reference adapter contract tests do not certify the font/shadow
behavior or establish that the standalone snapshot/input contracts are fixed.

See `docs/reviews/EXPERIENCE_TOKEN_INTEGRATION_2026-11-06.md` on the foundation branch
for exact review evidence and remaining limits. Clearly separate your branch checks
from the foundation application's full suite and build.

Commit and push the finished work to `feat/atomic-token-engine`. Finish with:

- Concrete fixes, compatibility changes, and any remaining limitations.
- Commands and tool versions, passing/failing counts, and scope of verification.
- Final pushed commit SHA.

Do not claim production readiness, complete accessibility coverage, or 100% gap
coverage from these unit tests. Do not edit or merge the other agent's branch.
