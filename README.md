# @excited-live/tax

Pure, multi-jurisdiction individual income tax engine. Logic only: no UI, no
network, no DOM. Moved out of the excited.live monorepo (`packages/tax`) with
its git history.

## Decisions (2026-08-30)
- INDIVIDUAL tax only. Corporate tax out of scope (possible future module).
- Thailand first: TH 2026 is the real implementation (PND 91 style).
- US 2026 is a PLACEHOLDER skeleton proving the architecture. Every value is
  a 2025 stand-in flagged as such. Verify against the enacted 2026 schedule
  before any real use.
- Bilingual labels (`{en, th}`) from day one, English first.

## Install

```bash
bun add @excited-live/tax   # or npm i / pnpm add
```

## Usage

```ts
import { getTaxSystem } from "@excited-live/tax"
const thai = getTaxSystem("TH", 2026)   // registered systems: TH 2026, US 2026
const problems = thai.validate(input)   // [] = valid
const result = thai.compute(input)      // full breakdown
```

## Adding a country or tax year

1. Create `src/<country>/<country>-<year>.ts` implementing the `TaxSystem`
   contract (see `src/types.ts`): brackets, income categories, validate,
   compute, assumptions.
2. Register it in `src/registry.ts`.
3. Add tests next to the implementation (`bun:test`).

## Thai v1 simplifications (surfaced via `assumptions`)
- No interest 20,000 THB exemption, no dividend credit, no section 40(4)
  exemptions.
- Provident fund cap simplified to 15% of gross employment income.
- Donations cap = 10% of assessable income.
- Per-fund retirement caps (SSF 200k, RMF 30% of assessable, PF 15% of
  employment income) then a combined 500,000 THB cap.

## Commands

```bash
bun install
bun test            # 109 tests, incl. the TH 2026 golden suite
bun run typecheck
bun run build       # tsup: dist/ with esm + cjs + d.ts
bun run check       # all three, what CI and release run
```

## Releasing

Bump `version` in `package.json` in a PR and merge it. The `Release` workflow
sees a version that is not on npm yet, runs `bun run check`, publishes with
provenance, and creates the `vX.Y.Z` tag and GitHub release. Merging a PR that
leaves the version alone publishes nothing.

Follow semver: a changed number in a tax result is at least a minor bump, a
changed `TaxSystem` / `TaxInput` / `TaxResult` shape is a major bump (minor
while on 0.x).
