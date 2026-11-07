# Atomic foundations — validation and token-engine review

## Scope

Foundation base: `ceb0d3130fff44009ce6c6d05adcd039c57350ea`, branch
`feat/atomic-context-foundations`.

Separately reviewed token engine: `b0c0874a6aeab344c3170cb1941718e6310fb361`, branch
`feat/atomic-token-engine`. This review did not merge or edit the token branch.

## Foundation result

**76 tests passed across four files; scoped strict TypeScript passed.**

Before the change, the existing foundation suite had 41 passing tests and one failing
schema acceptance test. Typechecking also found two foundation import/export errors.

The failing schema case was the CRM preset's `inputModality: 'unknown'` environment
default. The schema incorrectly excluded that neutral runtime hint while allowing
it in advertised input capabilities. Both directions are now corrected.

Changes also cover strict exact version syntax, whitespace names, structural time
zones, inherited property rejection, copied bridge values, and effective context
validation after preferences. `resolveExperienceContext` checks actual density,
modality, and selected appearance against loaded assets and returns no partial
context on failure. Existing component/provider/legacy token files are untouched.

## Verification environment

- Node `24.22.1` (the repository's `.mise.toml` requests Node 22).
- Vitest `5.1.0`.
- TypeScript `5.9.3`, strict mode.
- Ajv `8.20.0`.
- Node types `22.19.17`.
- Harness installation: pnpm `11.25.0` with policy checks enabled.

`pnpm install --frozen-lockfile` in the repository failed its minimum-release-age
policy for `jsdom@31.0.0`, `lucide-react@1.69.0`, and `undici@8.12.4`. The policy was
not disabled. Neither the package manifest nor lockfile was changed.

A separate harness installed only the tools above successfully. An exact copy of
the foundation source and root TypeScript configuration was placed under
`validation-harness/repository-snapshot`. The checked-in foundation configurations
were used directly against that snapshot:

```sh
./node_modules/.bin/vitest run --config repository-snapshot/src/atomic/foundations/vitest.config.ts
./node_modules/.bin/tsc --noEmit --project repository-snapshot/src/atomic/foundations/tsconfig.json
```

Results: **4 test files / 76 tests passed; TypeScript exit 0.** The scoped TypeScript
configuration uses `ES2020` without the DOM library. `git diff --check` passed.

After normal dependency installation, equivalent repository-root commands are:

```sh
pnpm exec vitest run --config src/atomic/foundations/vitest.config.ts
pnpm exec tsc --noEmit --project src/atomic/foundations/tsconfig.json
```

This is evidence for pure contracts and context composition. It is not a complete
application build, a Node 22 compatibility run, token-engine integration, browser
testing, rendered component testing, or accessibility certification. The full build
and complete repository suite remain unverified because installation was blocked.

## Token-engine review evidence

The reviewed token source was copied unchanged into the same isolated harness.
Its existing **27 tests passed**. Strict typechecking reported:

```text
src/tokens/validation.ts(199,61): error TS2339: Property 'path' does not exist on type 'never'.
```

Four additional characterization probes passed, confirming the current problematic
behavior. These probes assert the observed behavior, not the desired fixes:

```ts
expect(() => validateTokenLayers(null as never)).toThrow(TypeError)
expect(() => resolveTokens({} as never)).toThrow(TypeError)

const value = { value: 16, unit: 'px' as const }
const layers: TokenLayer[] = [{ id: 'base', type: 'primitive', tokens: [
  { path: 'space.control', type: 'dimension', value, overridableBy: [] },
] }]
const result = resolveTokens(layers)
value.value = 99
expect(result.tokens['space.control'].value).toEqual({ value: 99, unit: 'px' })

const fonts = resolveTokens([{ id: 'base', type: 'primitive', tokens: [
  { path: 'font.body', type: 'font-family', value: ['Noto Sans Arabic', 'sans-serif'], overridableBy: [] },
] }])
expect(generateCssVariables(fonts).css).toContain('"Noto Sans Arabic", "sans-serif"')

const shadows = resolveTokens([{ id: 'base', type: 'primitive', tokens: [
  { path: 'shadow.control', type: 'shadow', value: '0px 0px -2px #000', overridableBy: [] },
] }])
expect(shadows.isValid).toBe(true)
expect(generateCssVariables(shadows).css).toContain('0px 0px -2px #000')
```

The token follow-up prompt is at
[`../handoffs/TOKEN_ENGINE_FOLLOWUP_PROMPT.md`](../handoffs/TOKEN_ENGINE_FOLLOWUP_PROMPT.md).
The reviewed commit is a fixed target; subsequent agent changes require a fresh diff
review. This list is not a claim that all token-engine defects have been identified.
