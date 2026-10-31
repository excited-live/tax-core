# AGENTS.md

Instructions for AI coding agents in `excited-live/tax-core` (`@excited-live/tax` on npm).

## Rules

1. Never commit to `main`. Branch (`feat/*`, `fix/*`, `docs/*`) and open a PR.
2. Never commit secrets or `.env` files. `NPM_TOKEN` lives in repo secrets only.
3. Pure package: no network, DOM, framework imports, or locale/timezone logic. The tax year is a constant per system, never derived from `Date`. `tsconfig.json` compiles `src` with no DOM, Node, or Bun types, so `fetch`/`process`/`document` fail typecheck; do not add `types` or `lib` entries to get around it.
4. Bun only: `bun install`, `bun test`, `bun run <script>`. Do not add npm/pnpm/yarn lockfiles.
5. Done means `bun run check` passes:
   - Biome lint with zero warnings.
   - File length limits: max 100 lines per source file, max 200 lines per test file (enforced by Biome).
   - Cognitive complexity: max 10 per function (enforced by Biome).
   - Strict isolatedDeclarations typecheck (`tsc -p tsconfig.json && tsc -p tsconfig.test.json`).
   - Test suite with **100.00% line coverage** threshold (`scripts/check-coverage.ts`).
   - Clean package build (`tsdown`), strict packaging (`publint --strict`), and node16 type checks (`attw`).
   - Run `bun run format` to auto-fix formatting and imports. Do not loosen `tsconfig.base.json` or `biome.json` to make an error go away.
6. Never edit `version` in `package.json` and never run `npm publish` locally. Merges to `main` publish alphas; a stable release is the manual Release workflow. PR titles are conventional commits (`feat:`, `fix:`, `feat!:` ...) because they decide the next version (see README "Releasing").

## Statutory Architecture Standards

When implementing statutory rules (e.g. Thailand PIT, US Federal):
1. **Parameters as data**: Statutory amounts, rates, allowances, and brackets live in `parameters.ts` per tax year as typed constants (e.g. `TH_2026_PARAMETERS`). Never inline hardcoded numbers into logic functions.
2. **One rule per file**: Keep statutory deduction, allowance, and expense calculations as pure functions in dedicated files under 100 lines, returning `{ value, breakdown }`.
3. **Staged pipeline**: Wire calculations into an ordered statutory stage pipeline: `assessable` -> `expenses` -> `allowances` -> `brackets` -> `credits` -> `result`. Avoid complex dynamic DAG solvers.
4. **Documentation (TSDoc)**: Every exported function, type, and rule must carry a concise TSDoc comment detailing **Purpose**, **Math**, **Units** (major vs integer minor units), **Throws**, and statutory citation (`@statute`).

## Agent skills

### Issue tracker

GitHub Issues in `excited-live/tax-core`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
