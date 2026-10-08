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

- **Record outcomes for the five September events once they're due.**
  Checked 2026-10-04 and too early: no recap, recording, or press for any
  of them yet, so recording outcomes now would only silence the
  validator's 30-day warning before anything could be found. They come due
  between 2026-10-12 (Solidarity Summer Dance Party) and 2026-11-02
  (Stone Maps, which moved to Oct 3 — date corrected 2026-10-04). Start
  points: Ujima's YouTube channel (where its site says past events go),
  the USFWC blog for the conference awards, local press.
- **Archive snapshots for six events.** Only the conference had a usable
  Wayback snapshot. The rest need one created via Save Page Now, which the
  agent sessions here can't reach — a human can do it in a minute per URL.
  Two can't be recovered: Ujima's rolling `/events` page already dropped
  Holy Currencies and Ujima Cafe: District 7, and its only snapshot
  (Aug 27) predates them.

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
