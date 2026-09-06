# New Economy Hub — Project Brief

## Mission

There are a lot of people who want to help build a more sustainable economy
that works for everyone — but "more sustainable economy" is deliberately not
narrowly defined here. There are already many projects and organizations in
this space, but no single one has critical mass, and there's no easy-to-join
umbrella community that meets regularly, welcomes newcomers, and helps them
find real ways to get involved (paid work, volunteering, or sweat equity).

This site's welcome pitch:

> **So you want to build a better economy.** This site exists to help you:
> (1) learn what's already happening across this space, (2) find the fastest
> way to actually get involved — events, forums, and communities to join this
> week or ASAP — and (3) push toward a shared, organization-agnostic
> center of gravity, so the movement compounds and reaches critical mass.

## Who this is for (v1)

Built initially for the founder's own use — a personal tool for tracking and
navigating this space — with the explicit intent to open it to others once
it's useful.

## Core features

1. **Welcome / orientation** — the pitch above, plus a clear "start here" path.
2. **Events & meetings finder** — especially low-barrier-to-entry ones
   (open to newcomers, free/cheap, virtual-friendly).
3. **Forum finder** — Slack/Discord/mailing-list/forum communities where
   people in this space actually talk to each other.
4. **Organization & project map** — who's active in this space, ideally with
   a sense of activity level and community size, not just a static list.
5. **Blog** (later) — short posts on specific communities/projects as the
   founder learns about them. Human-authored.
6. **Podcast** (later) — conversations with people in the space. Early
   episodes may be AI-generated/AI-hosted, but must be **visibly and clearly
   labeled as AI** — never presented as if from a human host.

## Geography model

- **US** — the default/primary scope.
- **International** — efforts that intentionally span multiple countries.
- **Country-specific (non-US)** — efforts confined to one non-US country.
  Any given country may eventually warrant its own dedicated sub-section if
  there's enough content, but starts as a shared bucket tagged by country.

This is modeled as a `geo_scope` enum (`US`, `INTERNATIONAL`, `COUNTRY`) plus
an optional ISO country code, not as separate hard-coded sub-sites — see
`docs/DATA_MODEL.md`.

## Content population strategy

- **Events, organizations, forums**: expected to be populated primarily by
  AI agents (research/scraping/summarization) opening pull requests, not
  hand-entered or written to a database directly. Every record carries a
  `sourceType` (`AI_GENERATED`, `AI_ASSISTED`, `HUMAN`) and a `verified`
  flag, defaulting to unverified for AI-generated content. Reviewing and
  merging the PR *is* the verification step — agents should never mark
  their own output as verified.
- **Blog**: human-authored.
- **Podcast**: human by default; AI-generated episodes are allowed but must
  carry an explicit, visible AI disclosure (not a footnote) in both the
  episode metadata and any rendered UI.

## Technical direction

- **Framework**: Next.js (TypeScript, App Router, Tailwind CSS), built as a
  fully static site (`output: "export"`) — no backend server. See
  `docs/DECISIONS.md` for why, `docs/DATA_MODEL.md` for the content shape.
- **Content**: git-tracked files under `content/`, added/edited via PR —
  no database. Query power (joins, filtering, full-text search) comes from
  a build-time step, not a live server.
- **Cloud/hosting**: Azure Static Web Apps. Azure HorizonDB
  (Postgres-compatible, currently in public preview) was the original plan
  and remains a deliberate learning goal for later — it's just decoupled
  from this project's critical path for now; see `docs/DECISIONS.md`.
- **Repo philosophy**: AI-first / agentic. The repo should be structured so
  that coding agents (not just humans) can safely operate on it — see
  `CLAUDE.md`. Longer-term goal: agents that deploy changes, monitor the live
  site for issues, propose fixes (holding for human approval before applying
  anything impactful), and send periodic site-stats reports.

## Explicitly out of scope for now

- Payments / paid membership.
- User accounts and public-submission workflows (may come after the
  AI-populated directory proves useful).
- Country-specific sub-sites (may spin out later from the `COUNTRY` bucket).
