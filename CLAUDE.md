@AGENTS.md

# New Economy Hub

Read [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md) first — it explains what
this site is and why. Read [docs/DATA_MODEL.md](docs/DATA_MODEL.md) and
[docs/DECISIONS.md](docs/DECISIONS.md) before touching
`src/lib/content-types.ts` or proposing content changes — there is no
database; content is git-tracked files reviewed via PR. Read
[content/README.md](content/README.md) before adding or editing any file
under `content/` — it has the concrete conventions (file format, slugs,
tags, dedup checking, sourcing) that this file and DATA_MODEL.md don't
spell out.

## Conventions specific to this repo

- **Provenance is not optional.** Any content file for an Organization,
  Event, or Forum must set `sourceType` correctly and must never set
  `verified: true` — a PR merge is the verification step, not something an
  agent grants itself.
- **AI-generated podcast content must be labeled.** Never let
  `PodcastEpisode.aiGenerated: true` ship without a non-null
  `aiDisclosure` string that gets rendered visibly in the UI.
- **Geography is a filter, not a folder.** Don't hardcode country-specific
  routes/pages — geography is `geoScope` + `countryCode` on records. See
  `docs/DATA_MODEL.md`.
- **This is a static site, on purpose.** `next.config.ts` sets
  `output: "export"` — no server, no API routes doing server-side work.
  See `docs/DECISIONS.md` before adding anything that assumes a live
  backend (SSR, API routes, middleware) — check whether it's actually
  needed first.
- **Cloud target is Azure.** Azure Static Web Apps for hosting. No database
  currently — Azure HorizonDB is a deferred goal, not the current
  architecture; don't reintroduce it without re-reading
  `docs/DECISIONS.md`.
- **This repo is meant to be agent-operated**, not just agent-assisted.
  When adding automation (CI, deploy scripts, monitoring), favor designs
  where an agent can safely propose a change and a human approves it —
  a PR is the natural mechanism for that here — over designs that require
  a human to drive every step by hand.

## Gotchas already hit once in this repo — don't rediscover them

- **Don't trust `npm view <pkg> dist-tags` blindly, especially for
  `next`.** When this repo was created, `next`'s `latest` npm tag pointed
  at a canary build (16.4.0-canary.12) — the current stable line was on a
  differently-named tag. Before upgrading Next.js, check
  `npm view next dist-tags` and confirm you're looking at an actual
  stable release, not just trusting `@latest`.
- **If you ever add `--turbopack` to the `dev`/`build` scripts**, the
  Tailwind plugin needs to change too: this repo uses
  `@tailwindcss/postcss` + `postcss.config.mjs` for the default webpack
  pipeline. Turbopack needs `@tailwindcss/turbopack` instead, wired via
  `next.config.ts`, not `postcss.config.mjs`. Mixing them up doesn't
  error — it just silently serves unstyled pages.
- **A known low-risk `npm audit` finding will persist**: `postcss` is
  bundled transitively inside Next's own build tooling and only gets
  fixed by moving to Next 16 (not stable as of this writing). It's a
  build-time-only exposure (arbitrary CSS/sourcemap file disclosure) —
  accepted, not missed. Don't burn time re-investigating it; do check
  whether a newer stable Next release has picked up the fix.
