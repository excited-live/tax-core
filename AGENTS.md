# AGENTS.md

Instructions for AI coding agents in `excited-live/tax-core` (`@excited-live/tax` on npm).

## Rules

1. Never commit to `main`. Branch (`feat/*`, `fix/*`, `docs/*`) and open a PR.
2. Never commit secrets or `.env` files. `NPM_TOKEN` lives in repo secrets only.
3. Pure package: no network, DOM, framework imports, or locale/timezone logic. The tax year is a constant per system, never derived from `Date`. `tsconfig.json` compiles `src` with no DOM, Node, or Bun types, so `fetch`/`process`/`document` fail typecheck; do not add `types` or `lib` entries to get around it.
4. Bilingual labels are `{ en, th }`, English first.
5. Bun only: `bun install`, `bun test`, `bun run <script>`. Do not add npm/pnpm/yarn lockfiles.
6. Done means `bun run check` passes (Biome lint with zero warnings, strict typecheck, tests, build). `bun run format` fixes formatting and import order. Do not loosen `tsconfig.base.json` or `biome.json` to make an error go away.
7. Changing a tax number means the golden suite (`src/thai/thai-2026.golden.test.ts`) changes in the same PR, recomputed by hand, not by pasting the new output.
8. Releasing is a `version` bump in `package.json` merged to `main` (see README). Do not run `npm publish` locally.

## Skills

- `tax_engine` (`.agents/skills/tax_engine/SKILL.md`): load before touching anything under `src/`.
