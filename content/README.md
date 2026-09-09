# Adding content

This directory is the site's database — see [`../docs/DATA_MODEL.md`](../docs/DATA_MODEL.md)
for why. Everything here is added or edited via PR; there is no in-app form
and no admin UI. This file is the practical "how do I add a record" guide
(file format, slugs, tags, sourcing); `DATA_MODEL.md` is the conceptual
one; [`RESEARCH.md`](RESEARCH.md) is the methodology one — what a
research pass has to actually find before it's done. Read that one before
starting a new organization/event/forum research pass, and
[`../docs/RESEARCH_QUEUE.md`](../docs/RESEARCH_QUEUE.md) for the current list
of candidate organizations waiting for one.

## Check your work before opening the PR

```bash
npm run validate:content
```

This checks everything this file describes that a machine can check — slugs
match filenames, `organizationSlugs` actually resolve, `verified` is false,
tags are lowercase-hyphenated, dates are real dates, research blocks agree
with the content that exists. It runs in CI, and again via `prebuild`, so
bad content can't reach a deploy — but running it yourself is faster than
waiting for a red check.

It doesn't check whether your research is any good. That's what the PR
review is for, which is exactly why it's worth having the mechanical part
automated.

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
A `.md` file dropped here would never render anywhere — `validate:content`
fails on one for that reason, since silently vanishing is worse than an
error.

## Slugs and filenames

- Filename = `<slug>.json`, and the `slug` field inside must match the
  filename (`validate:content` enforces this).
- Slug = lowercase, hyphen-separated, derived from the name
  (`us-federation-of-worker-cooperatives`). Keep it short but unambiguous.
- `Event.organizationSlugs` / `Forum.organizationSlugs` (plural — a
  co-hosted event or forum can list more than one) must each exactly match
  an existing organization's `slug`. A typo would silently orphan the
  reference, so `validate:content` fails on any slug that doesn't resolve.

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

## Recording the research pass

An organization may carry a `research` block recording what a
[`RESEARCH.md`](RESEARCH.md) pass looked for and what it concluded:

```json
"research": {
  "checkedAt": "2026-09-08",
  "events": "NONE_FOUND",
  "forums": "NONE_FOUND",
  "sourcesChecked": ["https://example.org/", "https://example.org/events"],
  "notRepresentable": ["Office hours are rolling booking slots, not a fixed date."],
  "notes": "Their mailing list is one-way, so it doesn't meet the Forum bar."
}
```

`events` and `forums` each answer one of RESEARCH.md's two questions with
`ADDED`, `NONE_FOUND`, or `FOUND_NOT_REPRESENTABLE`. **`NONE_FOUND` is a
result, not a gap** — that's the entire point of the block. Without it,
nothing in `content/` distinguishes "we checked and this org genuinely runs
nothing public" from "nobody has ever looked," and the two get treated the
same by anyone reading the files later, human or agent.

Rules `validate:content` enforces, so you don't have to remember them:

- `ADDED` requires an actual event/forum in `content/` referencing this org.
- `NONE_FOUND` requires that no such record exists.
- `FOUND_NOT_REPRESENTABLE` requires `notRepresentable` to say what was
  found, so a schema gap can't quietly swallow a real finding.
- `sourcesChecked` must be non-empty — an unauditable negative is just an
  assertion.

**Omit the block entirely if you didn't do the pass.** An empty or
invented one is worse than none: it converts "unknown" into a false
"checked."

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
