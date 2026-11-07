# Experience/token integration — 2026-11-06

Foundation base: `a5f3a685f68d6b3a6330a70d73fab97535f4cbdb`.
Delivery branch: `feat/atomic-context-foundations`.
External engine tested: `b4fbf969fc77ad028d64d8c22cbed79ea5f1722d`.

## Result

**315 tests passed across 12 files, including five contract cases against the actual
external engine. Full repository TypeScript and production build passed.**

The new `src/atomic/integration` module binds exact versioned token payloads, verifies
their explicit engine IDs, creates copied/frozen input snapshots, and delegates to
the supplied engine's public validator/resolver. It returns engine diagnostics with
their original codes and data. The foundation exports a shared exact-reference guard.
The token engine's implementation is neither copied into production source nor edited.

The 315 tests comprise the existing 261 tests, 49 adapter unit cases, and five live
engine cases. Live cases cover light/dark POS values, alias resolution/provenance,
forbidden overrides, unknown references, and isolation from source payload mutation.

## Installation and existing build failure

Installation now passes the environment's release-age policy without exceptions:

```sh
pnpm install --frozen-lockfile
```

Before the dependency fix, the baseline's 261 tests passed but TypeScript and Vite
failed because the existing DatePicker imports `@internationalized/date` without a
direct manifest dependency. Version `3.12.4` was already in the lockfile transitively.
It is now declared directly; only the manifest and importer section changed. No
DatePicker implementation, UI, or dependency versions were rewritten.

The frozen-lockfile installation was checked again after this declaration.

## Commands actually run

The external engine's exact tree was exported, without merging branches:

```sh
mkdir -p ../hayzo-live-token-snapshot
git archive b4fbf969fc77ad028d64d8c22cbed79ea5f1722d src/atomic/tokens | tar -xf - -C ../hayzo-live-token-snapshot
```

The public entry was passed explicitly to the checked-in contract tests:

```sh
HAYZO_TOKEN_ENGINE_ENTRY=/workspace/scratch/d5dfe27e786c/hayzo-live-token-snapshot/src/atomic/tokens/index.ts pnpm exec vitest run
pnpm exec tsc --noEmit
pnpm exec tsc --noEmit --project src/atomic/integration/tsconfig.json
pnpm exec tsc --noEmit --project src/atomic/foundations/tsconfig.json
pnpm run build
git diff --check
```

All passed. The scoped compiler configurations exclude DOM libraries. Production
integration code imports only the foundation's public entry point and its local
JSON snapshot helper. The build retains a warning about a pre-existing large chunk;
no code-splitting changes were made as part of this foundation work.

Tools: Node `24.22.1`, pnpm `11.25.0`, TypeScript `5.9.3`, Vitest `5.1.0`, Vite
`8.0.5`, Ajv `8.20.0`. A separate Node 22 compatibility run was not performed.

## Independent engine review

The exported engine's own **29 tests passed**. The final reviewed engine commit
removes the unreachable exhaustive-switch fallback that caused a TypeScript error
in the earlier `6688496` snapshot. The real public engine namespace now also passes
a combined strict static port-consumer check with the adapter, without casts at the
port call. The engine remains an external snapshot, not a merged production import.

The static consumer imports `resolveExperienceTokens`, imports the engine's public
namespace, calls `resolveExperienceTokens(input, engine)`, and accesses its typed
resolved token value. It was checked with:

```sh
../hayzoUI-context-next/node_modules/.bin/tsc --noEmit --target ES2020 --moduleResolution bundler --module ESNext --strict --skipLibCheck --types node --lib ES2020 adapter-contract.typecheck.ts
```

The four earlier characterization probes were rerun against this newer engine SHA.
All four confirmed the still-existing behavior:

1. Non-array top-level validation/resolution inputs can throw `TypeError`.
2. Standalone resolved dimension values still alias mutable source objects.
3. Generic font fallback names are still quoted as literal families.
4. Negative shadow blur is still accepted and emitted.

The adapter's copied/frozen input graphs protect its own callers from source aliasing;
they do not fix or certify the standalone engine. Characterization probes assert
observed problems, not desirable behavior. The updated follow-up is at
[`../handoffs/TOKEN_ENGINE_FOLLOWUP_PROMPT.md`](../handoffs/TOKEN_ENGINE_FOLLOWUP_PROMPT.md).

## Limits

- No feature-branch merge, production engine promotion, or deployment occurred.
- Envelope ID/version attestation is supplied by the catalog producer; it is not a
  cryptographic origin check. Appearance/density payload selection stays explicit.
- Recipe collection requests remain in the plan; this adapter does not execute them.
- The live fixture includes the engine's recipe token aliases as explicit base token
  data. That does not implement the referenced component recipe collections.
- CSS generation, accessibility constraints, component behavior, rendered UI,
  assistive technology, devices, and visual matrices were not tested in this change.
- Existing user baseline image edits were left untouched.

The adapter is a verified token-integration step. A combined static port check now
passes; the independent engine's remaining behavioral findings still require fixes
before broader source promotion or production-readiness claims.
