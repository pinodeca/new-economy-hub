# Decisions

Short log of architectural calls and the reasoning behind them, so later
readers (human or agent) don't relitigate settled questions without the
context that settled them. Newest first.

## 2026-10-04: Recurring events are a field on `Event`, not a new type

**Decision**: Add an optional `recurrence` block to `Event` — a required
plain-language `schedule`, an optional machine-readable `rule` (weekly,
every N weeks, or nth/last weekday of the month), and a required
`confirmedAt` date. Rolling-booking office hours and dateless "periodic"
things stay out of scope.

**Why**: Four organizations' research passes hit this, and it was
suppressing real content: Cooperation Jackson runs monthly programming and
showed zero events. A separate content type was the alternative, and lost
because a reader asks one question of both — "what can I show up to?" —
and every other `Event` field (hosts, city vs. virtual, barrier to entry,
tags, geography) applies unchanged. A second type would duplicate all of
that and add a third list to the events page and every org page.

The `rule` is deliberately tiny rather than RFC 5545 RRULE: it covers
every cadence actually found (every Wednesday; second Tuesday; third
Saturday; monthly councils) and nothing speculative, and a cadence it can't
express still lists — `schedule` alone, shown as "Recurring." `schedule`
is required even when `rule` is present because it carries the time of day,
which the date-only `startAt` can't.

**What it gives up**: automatic expiry. A one-off event drops off the site
on its own date; an open-ended recurring one lists until someone removes
it, even if the org quietly stopped. `confirmedAt` is shown on the card,
and `validate:content` warns once it's 90 days old — a warning, not a
failure, so a stale schedule prompts a re-check without blocking deploys.
Rolling booking (a Calendly link) was excluded because there's no time a
reader can turn up; it's a contact method, and belongs with the org.

## 2026-09-09: Remove the `verified` flag

**Decision**: Drop `verified` from `Provenance` entirely — from the type,
every content file, the validator, and the "AI-generated · Unverified"
line on every card. `sourceType` stays and is still shown.

**Why**: The flag described a process that doesn't exist. The founder
isn't running a verification standard they'd stand behind, so every
record was permanently `false` and "Unverified" was a label with no path
to ever reading anything else. The original framing — "the PR merge *is*
the verification step" — made it worse: if merging verifies, then every
record in `main` is verified and the flag should read `true`, which
nobody wanted to claim. `sourceType` already tells a reader who wrote a
record, and "it's in `main`" already tells them a human merged it.

**What it gives up**: a place to record a real verification later. That's
fine — if more people and an actual standard show up, the field can come
back then, meaning something specific. The validator now *rejects* a
`verified` key rather than ignoring it, so it can't drift back in through
habit or stale docs before that decision is made on purpose.

## 2026-09-09: Next 16 — accept Turbopack rather than pin webpack

**Decision**: Upgrade to Next 16.3.4 and run on Turbopack, which Next 16
makes the default bundler for both `next dev` and `next build`, instead of
pinning the previous pipeline with `--webpack`. Tailwind stays exactly as
it was: `@tailwindcss/postcss` plus `postcss.config.mjs`, no bundler flag
in either npm script.

**Why**: The upgrade was worth doing on its own — it clears the `postcss`
advisory that `npm audit` had been reporting as accepted-but-unfixable,
since the fix only ever existed above Next 16. Once upgrading, the real
question was whether to keep webpack.

Taking the default won because the thing that made Turbopack risky here
turned out to be obsolete. `CLAUDE.md` carried a warning that Turbopack
would need `@tailwindcss/turbopack` wired through `next.config.ts`, and
that mixing the two silently serves unstyled pages. Turbopack now
processes PostCSS config files natively, so the existing setup needed no
change — verified rather than assumed, by checking computed styles in a
browser (`text-2xl` → 24px, `max-w-3xl` → 768px, `rounded-lg` → 8px) and
confirming the emitted stylesheet actually contains Tailwind utilities.
Pinning `--webpack` would have meant carrying a flag, and an
increasingly off-the-beaten-path build, to avoid a problem that no longer
exists.

**What it gives up**: webpack-specific escape hatches, notably custom Sass
functions (`sassOptions.functions`), which Turbopack can't execute. This
repo uses no Sass. `next build --webpack` remains available if Turbopack
ever causes trouble.

**Also changed by the upgrade**: `eslint-config-next` 16 ships flat configs
directly, so `eslint.config.mjs` no longer goes through the
`@eslint/eslintrc` `FlatCompat` bridge — importing it that way now throws
a circular-structure error rather than working. And Next 16 requires
`jsx: "react-jsx"` in `tsconfig.json`; the build rewrites the file itself
if it's set to `preserve`, so that change is committed rather than left to
reappear on every build.

## 2026-09-06: No database for v1 — static site + git-based content

**Decision**: No Postgres/HorizonDB. Content (organizations, events,
forums) lives as git-tracked files, added/edited via PR, and the site
builds to fully static HTML (`output: "export"` in `next.config.ts`),
deployed to Azure Static Web Apps with no server process.

**Why**: The original plan (see git history — this repo briefly had a full
Prisma + Postgres/HorizonDB schema) assumed a database was needed. Working
through it:

- **Data volume doesn't require it.** This is a niche-topic directory
  site — realistically low thousands of rows, ever, across
  orgs/events/forums combined. Not a scale problem.
- **The concurrent-write argument for Postgres doesn't hold once agents
  write via PRs.** Git's merge process already serializes writes; there's
  no concurrent-write hazard for a database to protect against.
- **The site doesn't need a live backend.** Content only changes when a PR
  merges, never from a live user request (no accounts, no public
  submissions yet — see below). That means no per-request server logic is
  needed at all: a fully static site works, which is simpler and cheaper
  to run than App Service/Container Apps.
- **Query power isn't lost, just moved to build time.** A build step can
  load all content files into a throwaway SQLite database to do joins,
  filtering, and full-text search, then discard it — real SQL power
  without running a database server. See `docs/DATA_MODEL.md`.
- **The "agent proposes, human approves" philosophy maps naturally onto
  git PRs** — arguably a better fit than a database + a moderation UI
  we'd have to build ourselves. Review-and-merge *is* the approval step.

**What this gives up, on purpose**: semantic/fuzzy dedup across
agent-sourced entries (e.g. "Sustainable Business Alliance" vs. "The
Alliance for Sustainable Business") is weaker with plain SQLite full-text
search than with vector embedding similarity. If this turns out to matter
in practice, look at the `sqlite-vec` extension (adds vector search to
SQLite, still no server) before reaching for a hosted vector database.

**Not abandoned, deferred**: Azure HorizonDB was chosen originally partly
as a deliberate learning goal (the founder works on Azure's Postgres
managed service team), independent of whether the site technically needs
it. That goal is still valid — it's just decoupled from this project's
critical path now. Worth revisiting if: data volume genuinely grows past
what static generation handles comfortably, dedup quality becomes a real
problem SQLite can't solve, or public submissions get built (which need a
live write endpoint of *some* kind, database or otherwise) and Postgres
ends up being the natural place to land that data. The conditions are
also noted under **Public submissions** in `docs/IDEAS.md`.

**What got reverted to get here**: `prisma/schema.prisma`,
`prisma7.config.ts`, the `@prisma/client`/`prisma` npm packages, and the
Prisma-fetched agent-skill docs under `.agents/skills/` and
`.claude/skills/` were all removed. The schema modeling itself wasn't
wasted — it's carried forward as plain TypeScript types in
`src/lib/content-types.ts`.

## No roadmap

**Decision (2026-09-09)**: `docs/ROADMAP.md` is deleted. Planning now lives
in two files — [`IDEAS.md`](IDEAS.md) for things still being thought about,
and [`TODO.md`](TODO.md) for things where the thinking is finished and only
the doing is left. An item moves from one to the other when a call gets
made.

**Why**: the roadmap described a sequencing discipline the project doesn't
actually have. Its "Next, in order" list was four numbered steps that were
all finished, and the real process is the founder using the site himself and
picking up whatever catches his interest from a much longer list of ideas. A
document that implies committed order when the order isn't committed is
worse than no document: it goes stale silently, and it makes an honest
working style look like a failure to execute.

This is not a claim that roadmaps are bad — it's that this project is one
person working by interest, with no dependencies on anyone else's schedule
and nothing being promised to anyone. If that changes (more contributors,
funding, anything with a date attached to it), a roadmap becomes worth its
upkeep again and can come back.

**What was kept**: the "later / not yet scoped in detail" items moved to
`IDEAS.md` under "Carried over from the old roadmap"; the out-of-scope list
became the section below. The "Done" section was dropped — git history and
the running site both record that better than a hand-maintained list.

## Explicitly out of scope for now

- Payments / paid membership.
- User accounts.

Both were listed in the old roadmap and remain true. They are recorded here
rather than in `IDEAS.md` because they're decisions about what this project
*isn't*, which is exactly what this file is for — an idea list is where
things go to be reconsidered, and neither of these is currently up for
reconsideration.
