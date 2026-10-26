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
bun run build       # tsdown: dist/ with esm + cjs + d.ts
bun run lint        # Biome, zero warnings
bun run format      # Biome format + import order, writes files
bun run check       # lint + typecheck + test + build, what CI and release run
```

## Releasing

Versions are computed, never edited by hand (`package.json` says
`0.0.0-development` on purpose). `scripts/version.ts` reads the last `vX.Y.Z`
git tag and the commit messages since then:

| Commits since the last release | Bump |
| --- | --- |
| any `feat!:` / `fix!:` / `BREAKING CHANGE:` footer | major (minor while on 0.x) |
| any `feat:` | minor |
| anything else | patch |

- **Alpha, automatic.** Every merge to `main` that touches code publishes
  `<next>-alpha.<n>` under the npm dist-tag `alpha` (`bun add @excited-live/tax@alpha`).
  `n` counts up per upcoming version.
- **Stable, on demand.** Actions → Release → Run workflow (on `main`). It
  publishes `<next>` under `latest`, tags `vX.Y.Z`, and creates a GitHub release
  with generated notes. The bump input overrides the computed one; pick `major`
  to cut 1.0.0.

PR titles must be conventional commits (the `PR title` check enforces it),
because the squash-merge commit subject is the PR title.

Preview the next version locally:

```bash
bun scripts/version.ts --channel alpha
bun scripts/version.ts --channel stable
```
