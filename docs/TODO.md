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

- **Fix the recurring-events gap.** Promoted from IDEAS.md because it is now
  costing content rather than just being an open question: Cooperation
  Jackson runs monthly programming and shows zero events, and four
  organizations have hit it. Still needs the design call (a recurrence field
  on `Event` vs. a separate content type) — that part is in IDEAS.md — but
  the decision that it's worth doing before more research passes land is
  made. Every additional pass adds records that understate their orgs.
