# Roadmap

Status snapshot and the sequence of major work ahead. See
[PROJECT_BRIEF.md](PROJECT_BRIEF.md) for the why, [DATA_MODEL.md](DATA_MODEL.md)
for the content shape, and [DECISIONS.md](DECISIONS.md) for why there's no
database. This file tracks the what's-next, not day-to-day tasks — for
untriaged/informal ideas that haven't been scheduled yet, see
[IDEAS.md](IDEAS.md).

## Done

- [x] Repo scaffolded: Next.js (TypeScript, App Router, Tailwind), pinned to
      stable releases (Next 16.3.4, on Turbopack — see DECISIONS.md).
- [x] Homepage + route stubs for Events / Forums / Map / Blog / Podcast.
- [x] CI on GitHub Actions: install, lint, build — runs on every push/PR to
      `main`.
- [x] Static export configured (`output: "export"` in `next.config.ts`) —
      no backend server; see DECISIONS.md.
- [x] Content shape defined as plain TypeScript types
      (`src/lib/content-types.ts`) — no ORM/database, git files are the
      source of truth.

## Next, in order

1. **Content directory + conventions**
   Create `content/organizations/`, `content/events/`, `content/forums/`
   (JSON or Markdown-with-frontmatter, matching `src/lib/content-types.ts`).
   Write a couple of real seed entries by hand to prove out the shape
   before any agent writes to it.

2. **Build-time index + real pages**
   Turn the Events/Forums/Map stub pages into real list + detail views.
   Read content files at build time, optionally load them into a
   throwaway SQLite file (`better-sqlite3`) for joins/tag-filtering/search,
   and statically render the result. No live server, no API routes.

3. **First data-population agent**
   An agent that researches organizations/events/forums in this space and
   opens PRs with new content files (`sourceType: AI_GENERATED`,
   `verified: false`). Founder reviews and merges — the merge *is* the
   verification step. Start narrow (one metro area or one sub-topic)
   rather than trying to populate everything at once.

4. **Deploy to Azure Static Web Apps**
   Point Azure Static Web Apps at the `out/` build output. Should be
   mechanical once steps 1-3 work locally — no database to provision, no
   server to size.

## Later / not yet scoped in detail

- **Semantic dedup** for agent-sourced entries, if plain text matching
  turns out not to be good enough — look at the `sqlite-vec` extension
  before reaching for a hosted vector database (see DECISIONS.md).
- **Blog** — human-authored, no agent involvement planned for content
  itself (agents may assist research).
- **Podcast** — human by default; any AI-generated episode requires a
  visible, human-reviewed AI disclosure (`PodcastEpisode.aiDisclosure`)
  before publishing.
- **Public submissions** (people suggesting events/orgs/forums) — this is
  the point where a live write endpoint of *some* kind becomes necessary
  again (a form has to write somewhere). Worth reconsidering a database
  at that point rather than before. Not before the agent-populated
  directory proves useful.
- **Azure HorizonDB**, revisited on purpose rather than by default — see
  DECISIONS.md for the conditions that would justify it (real scale,
  dedup quality, or public submissions landing).
- **Operational agents**: deploy automation, uptime/error monitoring with
  human-approval-gated fixes, periodic site-stats reports to the founder.
  Depend on the app actually being live (step 4) and having something
  worth monitoring.
- **Country-specific sub-sections** spinning out of the `COUNTRY` geo-scope
  bucket, if/when any one country has enough content to warrant it.

## Explicitly out of scope for now

- Payments / paid membership.
- User accounts.
