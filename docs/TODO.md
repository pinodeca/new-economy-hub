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

- **Run the first post-event check** on the five events that passed in
  September 2026 (see `content/RESEARCH.md`). Includes one known error: the
  Stone Maps reception moved from Sept 26 to Oct 3 for weather (per its
  Eventbrite page), and `ujima-stone-maps-opening-reception-2026.json`
  still says Sept 26. Also back-fill `archivedUrl` for all seven events.

- **Backfill the recurring events the schema couldn't hold.** `Event.recurrence`
  exists now, so the four organizations whose `research.notRepresentable`
  lists a fixed cadence should get those events: Cooperation Jackson (Build
  and Fight series, 2nd Tuesday; membership orientation, 3rd Saturday),
  Boston Ujima Project (#UjimaWednesdays, Biplaw Mondays, Ujima Cafe), USFWC
  (monthly peer councils — check which are open to newcomers), and A
  Bookkeeping Cooperative (multi-week workshop series). Each needs the
  cadence re-confirmed on the org's site, not copied from the September
  notes, and its `research` block updated to match. L.A. Co-op Lab's
  Calendly office hours stay out — see IDEAS.md.
