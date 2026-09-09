# TODO

Concrete work that has been decided and isn't done yet. One line per item,
enough detail that it can be picked up cold, and a note on why it's decided
where that isn't obvious.

The split with [IDEAS.md](IDEAS.md) is *decidedness*, not size: IDEAS.md is
for things still being thought about, this file is for things where the
thinking is finished and only the doing is left. An item graduates from
there to here when a call gets made. Delete a line when it ships.

There is deliberately no roadmap. Work gets picked up by interest, not by
sequence — see [DECISIONS.md](DECISIONS.md#no-roadmap).

## Decided, not done

- **Remove the `verified` flag entirely.** Decided 2026-09-09: the founder
  isn't running a verification process they'd stand by, so a flag claiming
  one is a promise the project can't keep. `sourceType` carries provenance
  on its own, and "it's in `main`" already implies a human merged it. If a
  real verification process exists later — more people, an actual standard
  — it can come back then, meaning something. Touches:
  - `Provenance` in `src/lib/content-types.ts`
  - `ProvenanceNote` in `src/components/ContentMeta.tsx` (the rendered
    "AI-generated · Unverified" line)
  - the `verified: false` rule in `scripts/validate-content.mjs`
  - the flag in all 20 content JSON files
  - the prose in `CLAUDE.md`, `content/README.md`,
    `docs/DATA_MODEL.md`, and `docs/PROJECT_BRIEF.md`, all of which
    currently describe the merge as the verification step

  Do it as one focused PR — it's mechanical, but it touches the provenance
  rule that CLAUDE.md leads with, so it should be reviewable in isolation.

- **Fix the recurring-events gap.** Promoted from IDEAS.md because it is now
  costing content rather than just being an open question: Cooperation
  Jackson runs monthly programming and shows zero events, and four
  organizations have hit it. Still needs the design call (a recurrence field
  on `Event` vs. a separate content type) — that part is in IDEAS.md — but
  the decision that it's worth doing before more research passes land is
  made. Every additional pass adds records that understate their orgs.
