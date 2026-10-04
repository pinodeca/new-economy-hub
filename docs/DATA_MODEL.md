# Data model

There is no database. Content is git-tracked JSON files under `content/`,
reviewed and merged like code. See [DECISIONS.md](DECISIONS.md) for why,
and [`content/README.md`](../content/README.md) for the practical
how-do-I-add-a-record conventions (slugs, tags, file format, dedup
checking) — this file covers the schema and reasoning, that one covers the
mechanics.

The shape each content file must match lives in
[`src/lib/content-types.ts`](../src/lib/content-types.ts) — treat that file
as the schema. It's a direct carry-over of the relational model originally
designed for Prisma/Postgres; only the storage mechanism changed.

## Geography

`geoScope` is `US | INTERNATIONAL | COUNTRY` on organizations, events, and
forums, with an optional `countryCode` (ISO 3166-1 alpha-2):

- `US` — the default/primary scope, `countryCode` unused.
- `INTERNATIONAL` — efforts that intentionally span multiple countries,
  `countryCode` unused.
- `COUNTRY` — confined to one non-US country; `countryCode` required.

This is a filterable attribute, not separate directories or routes, so a
country can be split into its own section later purely by adding UI/routing
on top of the existing `COUNTRY` + `countryCode` filter.

## Provenance (`sourceType`)

Events/orgs/forums are expected to be populated mostly by AI agents via
pull request. Every record tracks `sourceType`:
`AI_GENERATED | AI_ASSISTED | HUMAN`, rendered on every card so a reader
knows who wrote it.

There used to be a `verified` flag as well. It was removed on 2026-09-09
because no verification process stood behind it — see
[DECISIONS.md](DECISIONS.md). A record being in `main` means a human
merged the PR, nothing more; the site doesn't claim otherwise.

## Recurring events (`Event.recurrence`)

An `Event` can repeat. `recurrence.schedule` is a plain-language cadence
shown to readers; an optional `recurrence.rule` (weekly / every N weeks, or
"nth weekday of the month") lets the build compute the next date;
`recurrence.confirmedAt` records when the cadence was last seen on the
org's own site. `startAt` is a real occurrence, and `endAt` ends a finite
series. See `content/README.md` for the conventions and
[DECISIONS.md](DECISIONS.md) for why this is a field on `Event` rather
than its own content type.

A recurring event with no `endAt` is never "past" on its own, so it lists
until it's removed — `confirmedAt` and the validator's 90-day staleness
warning are the counterweight. Like the upcoming/past split, the next date
is computed at build time and kept current by the daily rebuild.

## After the event (`Event.outcome`, `Event.archivedUrl`)

`outcome` records a post-event check: `checkedAt`, a `status`
(`HAPPENED` / `CANCELLED` / `UNCONFIRMED`), optional `links` (recordings,
recaps, photos, press — rendered under the event in the "already happened"
lists), and `notes`. `archivedUrl` is a snapshot of the event page, taken
when the event is added. Both exist because event pages rot faster than any
other link in `content/`, and a past event with neither is unverifiable —
see [DECISIONS.md](DECISIONS.md). Like `research`, a missing `outcome`
means "not yet checked"; the validator warns 30 days after an event ends.

## Research evidence (`Organization.research`)

An optional `ResearchPass` recording what a `content/RESEARCH.md` pass
looked for and concluded: `checkedAt`, an `events` and a `forums` finding
(`ADDED` / `NONE_FOUND` / `FOUND_NOT_REPRESENTABLE`), the `sourcesChecked`
URLs, and optional `notRepresentable` / `notes`.

The reason this is modeled at all: without it, "checked, this org runs
nothing public" and "nobody has ever looked" are the same thing in
`content/` — an organization with no events and no forums attached. The
distinction lived only in PR descriptions, which is outside the repo and
therefore invisible to the site and to any agent reading the files. Absence
of the block means genuinely unresearched; it should never be added
speculatively to make an organization look done.

`scripts/validate-content.mjs` cross-checks each finding against the
content that exists, which turns a prose convention into something CI can
fail on. It's rendered on the organization detail page, because "we looked
and there's nothing to join here" is useful to a reader deciding where to
spend their time.

## Activity signals

`activityLevel` (1–5) and `memberCount` on organizations/forums are
optional and expected to be refreshed by agents over time (e.g.
Slack/Discord member counts, GitHub activity, event cadence). Treat them as
best-effort signals, not verified facts.

## Podcast AI disclosure

`PodcastEpisode.aiGenerated` + `aiDisclosure` exist so AI-hosted episodes
can never ship without an explicit, human-reviewed disclosure string
rendered visibly in the UI. This is now enforced rather than conventional:
`scripts/validate-content.mjs` fails the build on any `content/podcast/`
episode with `aiGenerated: true` and no `aiDisclosure`. The check is in
place ahead of the feature, so the first episode can't slip through.

## Querying at build time

Next statically renders every page (`output: "export"` in
`next.config.ts` — see DECISIONS.md). The current implementation
(`src/lib/content.ts`) is simpler than originally planned here: it reads
every JSON file in `content/organizations|events|forums/` into a plain
array and does sorting/filtering/joins (e.g. resolving `organizationSlugs`)
with plain JS — no SQLite involved. That's deliberately the minimum that
works at today's content volume (low tens of records), not a permanent
decision.

The original, still-valid-if-needed plan: once list/filter pages need real
joins, tag/geo filtering, or full-text search across enough records that
array scans get slow or unwieldy, load content into a throwaway SQLite
file (`better-sqlite3`) at build time to do that querying, then discard
it — the SQLite file would be a build artifact, never the source of truth,
never shipped to the browser or a server. If fuzzy/semantic dedup across
agent-sourced entries becomes a real problem before then, look at the
`sqlite-vec` extension before reaching for a hosted vector database — see
DECISIONS.md for the tradeoff.
