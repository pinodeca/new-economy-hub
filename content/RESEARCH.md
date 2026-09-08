# Research methodology

`content/README.md` covers the mechanics of adding a record (file format,
slugs, tags, sourcing). This covers something different: what a research
pass is actually supposed to produce, and the questions it must answer
before it counts as done.

## The org is scaffolding, not the point

This site's whole pitch (see `PROJECT_BRIEF.md`) is helping someone find a
way to *actually get involved* — an event to show up to, a forum to join
this week. An organization record with a mission statement and a member
count doesn't get anyone closer to that on its own; it's the anchor that
events and forums attach to. A research pass that produces an org and
stops there has done the easy, low-value half of the job.

**A research unit isn't done until it has explicitly answered two
questions**, not just researched the org's own mission/history/scale:

1. **Does this org run anything with a date?** A conference, a recurring
   meetup, office hours, a workshop series. If yes, add it as an `Event`
   (see the schema note below for what doesn't fit yet).
2. **Does it run anything people can join and talk in?** A Slack,
   Discord, mailing list, or forum — something two-way, where people
   actually interact, not a one-way announcement channel. A newsletter
   signup does **not** count (see the Democracy at Work Institute PR for
   a case where that was checked and correctly excluded).

Where to actually look: the org's own site's events/calendar page, a
"get involved" or "connect"/"community" page, their resources page, and
(for recurring meetups) Eventbrite/Meetup/social presence. This is a real
search step, not something to infer from the homepage alone — the L.A.
Co-op Lab PR (#13) is the cautionary example: the initial research fetch
for that org's own "What We Do" page surfaced office hours, workshops,
*and* an active mailing list, and none of it made it into the PR, because
nobody explicitly asked the question.

## Say which case you're in

Every research PR's description must make clear which of these happened,
for each of the two questions above — a reviewer can't tell "checked,
found nothing" apart from "didn't check" just by looking at a thin PR:

- Found something → it's in the PR as an `Event`/`Forum`, sourced.
- Checked and found nothing → say so explicitly and briefly (what you
  looked at) — a stated negative is a real research result, not a gap.
- Genuinely not checked — don't ship this. Go check first.

## Known schema gap: recurring things

`Event.startAt` is a single ISO date — it has no way to represent
"office hours every Tuesday" or an ongoing workshop series. Don't force a
recurring thing into a single dated `Event` (picking one arbitrary
occurrence would be misleading) and don't drop it either — flag it in the
PR description as found-but-not-yet-representable, so it isn't silently
lost, and note it in `docs/IDEAS.md` if it isn't already there. This is a
real content-model gap, not something to solve ad hoc per-PR.

## PR granularity

One research unit (an org plus whatever events/forums it turns out to
have) is the natural size for a PR — but that's a default, not a rule.
For simple, individually-well-sourced units, batching a handful into one
PR is fine and reduces process overhead that isn't buying anything (each
unit's sourcing still stands on its own in the PR description either
way). Keep something in its own PR when it's complex, uncertain, or you'd
want it reviewable in isolation.
