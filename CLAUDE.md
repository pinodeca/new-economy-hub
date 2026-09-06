@AGENTS.md

# New Economy Hub

Read [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md) first — it explains what
this site is and why. Read [docs/DATA_MODEL.md](docs/DATA_MODEL.md) before
touching `prisma/schema.prisma` or writing queries against it.

## Conventions specific to this repo

- **Provenance is not optional.** Any code that creates/updates an
  `Organization`, `Event`, or `Forum` record must set `sourceType`
  correctly and must never set `verified = true` — that flag flips only
  through an explicit human-review action.
- **AI-generated podcast content must be labeled.** Never let
  `PodcastEpisode.aiGenerated = true` ship without a non-null
  `aiDisclosure` string that gets rendered visibly in the UI.
- **Geography is a filter, not a folder.** Don't hardcode country-specific
  routes/pages — geography is `geoScope` + `countryCode` on records. See
  `docs/DATA_MODEL.md`.
- **Cloud target is Azure.** Production database is Azure HorizonDB
  (Postgres-compatible); assume Azure for any hosting, storage, secrets, or
  CI/CD deployment targets unless told otherwise.
- **This repo is meant to be agent-operated**, not just agent-assisted.
  When adding automation (CI, deploy scripts, monitoring), favor designs
  where an agent can safely propose a change and a human approves it,
  over designs that require a human to drive every step by hand.
