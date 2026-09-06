# Data model

Schema lives at `prisma/schema.prisma`. Connection config lives in
`prisma7.config.ts`, **not** in the schema file — Prisma 7 removed
`datasource.url` from `schema.prisma`. When you write the first real
`PrismaClient` usage, it needs an explicit driver adapter (e.g.
`@prisma/adapter-pg` for Postgres), not an implicit datasource URL — see
https://pris.ly/d/prisma7-client-config before wiring that up.

Notes on the non-obvious data-model choices:

## Geography

`GeoScope` is `US | INTERNATIONAL | COUNTRY` on `Organization`, `Event`, and
`Forum`, with an optional `countryCode` (ISO 3166-1 alpha-2):

- `US` — the default/primary scope, `countryCode` unused.
- `INTERNATIONAL` — efforts that intentionally span multiple countries,
  `countryCode` unused.
- `COUNTRY` — confined to one non-US country; `countryCode` required.

This is a filterable attribute, not separate tables or routes, so a country
can be split into its own section later purely by adding UI/routing on top
of the existing `COUNTRY` + `countryCode` filter — no migration needed.

## Provenance (`sourceType` / `verified`)

Per `docs/PROJECT_BRIEF.md`, events/orgs/forums are expected to be populated
mostly by AI agents. Every record tracks:

- `sourceType`: `AI_GENERATED | AI_ASSISTED | HUMAN`
- `verified`: defaults to `false`. An agent that creates or edits a record
  must never set `verified = true` on its own output — that's a human
  action (initially the site owner). This is the seam where a future
  moderation/review UI hooks in.

## Activity signals

`activityLevel` (1–5) and `memberCount` on `Organization`/`Forum` are
optional and expected to be inferred/refreshed by agents over time (e.g.
Slack/Discord member counts, GitHub activity, event cadence) rather than
hand-maintained. Treat them as best-effort signals, not verified facts.

## Podcast AI disclosure

`PodcastEpisode.aiGenerated` + `aiDisclosure` exist specifically so AI-hosted
episodes can never ship without an explicit, human-reviewed disclosure
string to render in the UI. Don't let `aiGenerated = true` ship with a null
`aiDisclosure` — enforce this in application code (Prisma doesn't do
conditional-required-field constraints).
