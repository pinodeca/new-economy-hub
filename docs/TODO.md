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

- **Upgrade Next past the 2026-10 advisories.** `npm audit` reports 5
  findings (1 critical, 4 high) against Next 16.3.4 and transitive build
  tooling; npm says a non-breaking fix exists, and Next 16.4.1+
  clears the critical one. Run the `npm view next dist-tags` check from
  CLAUDE.md first (on 2026-10-24 `latest` was 16.4.3), then build and
  check the site in a browser — including the events calendar views and
  that `/events.ics` and `/calendar/*.ics` still prerender. Exposure is
  low (static export, no `next/og`), and CI doesn't run `npm audit`, so
  nothing will flag it until someone does.
- **Record outcomes for the five September events once they're due.**
  Checked 2026-10-04 and too early: no recap, recording, or press for any
  of them yet, so recording outcomes now would only silence the
  validator's 30-day warning before anything could be found. They come due
  between 2026-10-12 (Solidarity Summer Dance Party) and 2026-11-02
  (Stone Maps, which moved to Oct 3 — date corrected 2026-10-04). Start
  points: Ujima's YouTube channel (where its site says past events go),
  the USFWC blog for the conference awards, local press. While on the
  conference: its record calls it "the annual national gathering," but
  conference.coop's past-events page lists 2020 and 2022 and no 2024, so
  it may be every two years — correct the description if a source says so.
- **Archive snapshots for six events.** Only the conference had a usable
  Wayback snapshot. The rest need one created via Save Page Now, which the
  agent sessions here can't reach — a human can do it in a minute per URL.
  Two can't be recovered: Ujima's rolling `/events` page already dropped
  Holy Currencies and Ujima Cafe: District 7, and its only snapshot
  (Aug 27) predates them. The ten events added by the 2026-10-21
  recurrence backfill, plus the Startup Webinar it converted, have no
  snapshots either — archive.org reset every connection from that session,
  even with full network access. Their URLs come down to five pages:
  Ujima's `/events`, USFWC's `/calendar/`, and three bookkeeping.coop
  workshop pages. The research batches after it (PRs #28, #29, #31,
  2026-10-21) also shipped every event without a snapshot — archive.org
  was rate-limiting those sessions — so these need one too, soonest first
  since event pages change after the fact: CoMinnesota's Own It! Co-op Fest
  (Eventbrite) and Co-ops 101 page; FIC's four CommUniversity pages; the
  ICA webinar; NAHC's conference; Platform Co-op's Solidarity AI
  conference; Project Equity's two webinar pages; Transition's Gathering
  journal post and New Moon page; and DEAL's `gdd2026` festival page. Each
  event file's `url` is the page to save. Three have already happened
  (FIC's Oak Park tour, the Ujima Pumpkin Party, Project Equity's
  Stanislaus webinar), so check a snapshot actually shows the event.
- **Re-check the backfill's loose ends when their dates come.** Ujima Cafe's
  2027 season (spring — the 2026 one ended 2026-10-22 and no dates are out);
  Cooperation Jackson's calendar, silent since August 2025 (if Build and
  Fight resumes, it's a ready-made second-Tuesday `recurrence`); and A
  Bookkeeping Cooperative's next Building Shared Futures and Patronage
  rounds. Each is written up in its organization's `research.notes`.
- **Tidy the Union Co-ops call's schedule after 2026-11-18.** Its
  `recurrence.schedule` (`usfwc-union-co-ops-council-call.json`) says
  "November 2026's call is on Wednesday, November 18" — true now, stale
  once that date passes, and nothing will warn. Re-check USFWC's calendar
  then: if the call is back to the last Wednesday, drop the exception and
  consider adding a `rule` (`MONTHLY`, `WE`, `-1`), which would also give
  it calendar entries.
- **Settle two possible forums that need an account to check.** FIC's
  Groups (https://www.ic.org/groups/) shows only a login screen, and
  USSEN's listserv (joined via https://ussen.org/get-involved/) doesn't say
  whether members can post. Both are recorded as `FOUND_NOT_REPRESENTABLE`
  in their organizations' research blocks. Someone with a free account (or
  who joins the list) can tell whether either clears the Forum bar, then
  add a Forum record or flip the finding to `NONE_FOUND`.
