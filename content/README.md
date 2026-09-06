# Adding content

This directory is the site's database — see [`../docs/DATA_MODEL.md`](../docs/DATA_MODEL.md)
for why. Everything here is added or edited via PR; there is no in-app form
and no admin UI. This file is the practical "how do I add a record" guide;
`DATA_MODEL.md` is the conceptual one.

## Before you add anything

**Check for an existing match first.** Full-text/tag search across
`content/` is the only dedup mechanism right now (see DECISIONS.md on why
that's weaker than semantic dedup and accepted as a known gap) — so it only
works if you actually look. Grep the target directory for the organization
name, obvious aliases, and its domain/URL before creating a new file. If a
close match exists, edit it rather than creating a near-duplicate
("Sustainable Business Alliance" vs "The Alliance for Sustainable
Business").

## File format

**JSON, one file per record.** Not Markdown-with-frontmatter — the build
step (`src/lib/content.ts`) only reads `*.json` files in these directories.
A `.md` file dropped here will not error; it will just never render
anywhere. This isn't enforced by any linter yet (worth adding if agents
start getting this wrong in practice).

## Slugs and filenames

- Filename = `<slug>.json`, and the `slug` field inside must match the
  filename (no build-time check enforces this yet — keep them in sync by
  hand).
- Slug = lowercase, hyphen-separated, derived from the name
  (`us-federation-of-worker-cooperatives`). Keep it short but unambiguous.
- `Event.organizationSlug` / `Forum.organizationSlug` must exactly match an
  existing organization's `slug`. Nothing currently validates this either —
  a typo silently orphans the reference. Double check it resolves before
  opening the PR.

## Tags

Free-text `tags: string[]`, no fixed taxonomy exists yet. Convention so
far: lowercase, hyphen-separated (`worker-cooperatives`, not `Worker Coops`
or `worker_coops`). **Grep existing files for a tag before inventing a new
one** — `worker-cooperatives` and `worker-coops` describing the same thing
across different files defeats tag-based filtering just as badly as
duplicate organizations do.

## Provenance — required, not optional

Every organization/event/forum file must set:

- `sourceType`: `AI_GENERATED` if you (the agent) researched and wrote the
  content yourself; `AI_ASSISTED` if a human wrote it with your help;
  `HUMAN` only if a human wrote it directly. Default to `AI_GENERATED` when
  in doubt about which describes your process.
- `verified: false`. Always. See [`../CLAUDE.md`](../CLAUDE.md) — merging
  the PR is the verification step, not something you grant yourself.

## Sourcing, for the human reviewer's sake

The PR description should say where the facts came from (URLs you
researched, not just "researched online") — member counts, mission
statements, and founding dates are exactly the kind of claims a reviewer
can't verify at a glance. A PR that's easy to check gets merged faster than
one that asks for blind trust.

## Best-effort fields

`activityLevel` (1-5) and `memberCount` on organizations/forums are
optional signals, not verified facts — see DATA_MODEL.md. Leave them out
rather than guessing a number you can't ground in something you actually
read (a stated membership figure, a visible community size, etc).

## Podcast AI disclosure

Not relevant to organizations/events/forums, but if you're ever adding a
`PodcastEpisode`: `aiGenerated: true` must never ship without a non-null
`aiDisclosure` string. See `PROJECT_BRIEF.md` and `DATA_MODEL.md`.
