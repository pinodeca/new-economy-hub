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
spell out. Read [content/RESEARCH.md](content/RESEARCH.md) before doing
any organization/event/forum research pass — an organization record
without checking for its events/forums is an incomplete research pass,
not a finished one.

## Conventions specific to this repo

- **Provenance is not optional.** Any content file for an Organization,
  Event, or Forum must set `sourceType` correctly and must never set
  `verified: true` — a PR merge is the verification step, not something an
  agent grants itself.
- **Run `npm run validate:content` before opening a content PR.** It
  enforces the mechanical half of `content/README.md` (slug/filename
  agreement, `organizationSlugs` resolving, `verified: false`, tag
  spelling, real dates, research blocks matching reality) so review can
  spend its attention on whether the research is any good. It also runs in
  CI and via `prebuild`, so a mistake can't reach a deploy.
- **A negative research result must be recorded, not just mentioned.** If
  you check an organization for events/forums and find none, write that
  into its `research` block (see `content/RESEARCH.md`) — not only the PR
  description. Prose in a PR is invisible to the repo, so an org with
  nothing attached is otherwise indistinguishable from one nobody has
  looked at.
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
  stable release, not just trusting `@latest`. As of the Next 16 upgrade
  this was checked and `latest` was genuinely stable (16.3.4, with the
  prerelease builds parked on separate `preview`/`beta` tags) — the point
  is to check, not to assume either answer.
- **Turbopack is the default bundler now, and the old Tailwind warning
  here no longer applies.** This note used to say that switching to
  Turbopack would mean swapping `@tailwindcss/postcss` for
  `@tailwindcss/turbopack`, wired through `next.config.ts`. That stopped
  being true in Next 16: Turbopack processes `postcss.config.mjs`
  natively (see
  `node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md`),
  so this repo's existing Tailwind setup works unchanged and the `dev`
  and `build` scripts carry no bundler flag at all. What *is* still true
  is the failure mode: a broken CSS pipeline doesn't error, it silently
  serves unstyled pages. So if you touch it, check a computed style in a
  browser rather than trusting a green build — a build that emits no
  Tailwind utilities passes just as happily as one that does.
  `next build --webpack` is the escape hatch if Turbopack ever bites.
- **The `postcss` npm audit finding is resolved.** It was a build-time-only
  exposure bundled inside Next's own tooling, unfixable below Next 16 and
  knowingly accepted for a while. Upgrading to Next 16.3.4 cleared it;
  `npm audit` reports 0 vulnerabilities. If it comes back, suspect
  something pinned Next backwards rather than a new advisory.
