# Research methodology

[`../docs/RESEARCH_QUEUE.md`](../docs/RESEARCH_QUEUE.md) lists which
organizations are waiting for a pass. `content/README.md` covers the
mechanics of adding a record (file format, slugs, tags, sourcing). This
covers something different: what a research pass is actually supposed to
produce, and the questions it must answer before it counts as done.

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
   meetup, office hours, a workshop series. If yes, add it as an `Event` —
   recurring ones included (see "Recurring things" below).
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

## Say which case you're in — in the record, not just the PR

Every research PR's description must make clear which of these happened,
for each of the two questions above — a reviewer can't tell "checked,
found nothing" apart from "didn't check" just by looking at a thin PR:

- Found something → it's in the PR as an `Event`/`Forum`, sourced.
- Checked and found nothing → say so explicitly and briefly (what you
  looked at) — a stated negative is a real research result, not a gap.
- Genuinely not checked — don't ship this. Go check first.

**And write it into the organization's `research` block**, not only the PR
description. See [`README.md`](README.md#recording-the-research-pass) for
the shape; `npm run validate:content` checks that the block agrees with the
content that actually exists.

This matters more than it sounds. A PR description is prose in GitHub — the
repository itself, which is the declared source of truth, can't see it.
Anything reading `content/` later sees an organization with no events and
no forums attached and has no way to tell whether that means "checked,
genuinely runs nothing public" or "never looked." That has already caused a
wrong call: a status review of this repo reported six organizations as an
unresearched gap, when two of them (Agrarian Trust, Self-Help Credit Union)
had been properly checked under this document and correctly found to have
nothing. The evidence existed — it was just somewhere the repo couldn't
reach. Four organizations needed research; two were finished work.

## Recurring things

A recurring meetup, a monthly education series, or a multi-week workshop is
**one** `Event` with a `recurrence` block — not one file per occurrence, and
not a single arbitrary occurrence standing in for the series. See
[`README.md`](README.md#recurring-events) for the shape. This used to be a
schema gap that suppressed real content — Cooperation Jackson ran monthly
programming and showed zero events — so a recurring thing you find is now
an `ADDED` finding like any other.

What *still* doesn't fit, and stays `FOUND_NOT_REPRESENTABLE` with a
`notRepresentable` line:

- **Rolling booking** (a Calendly link for office hours). There's no time
  a reader can show up; it's a way to contact the org, not an event.
- **"Periodically," with no cadence and no published dates.** If you can't
  tell a reader roughly when, it isn't listable yet. A cadence the rule
  can't compute ("twice a month, dates on the calendar") is fine — omit
  `rule` and say it in `schedule`.

## After an event: the post-event check

An event's record isn't finished when its date passes. Event pages are
rewritten or deleted within days — Boston Ujima Project's calendar dropped
two September events within a week, and the Stone Maps reception was moved
from Sept 26 to Oct 3 with nothing in this repo noticing. So once an event
has ended, someone checks back and writes the answer into its `outcome`
block (shape in [`README.md`](README.md#recording-what-happened)):

1. **Did it happen as listed?** `HAPPENED`, `CANCELLED`, or `UNCONFIRMED`
   (looked, found no evidence either way — say where in `notes`). If it
   moved, fix `startAt`/`endAt` to the real dates and say so in `notes`;
   don't leave the record describing an event that never took place.
2. **What's left that a reader can use?** Recordings, recap posts, photo
   galleries, press coverage — as `outcome.links`. A recording of a past
   webinar is still worth something; this is the payoff for readers.
3. **Is the event page still there?** If `archivedUrl` is missing, add one
   now if a snapshot exists.

Timing: about **30 days** after the event's last day. Earlier mostly finds
nothing — one week after the 2026 Worker Co-op Conference, its own site
still described it as upcoming — and `validate:content` starts warning
about an unchecked event at the 30-day mark. Where to look: the event page
itself, the org's blog/news and YouTube, its newsletter archive, and a
search for the event's title (local press often covers what the org
doesn't).

A post-event check can be batched across organizations in one PR — it's a
small, uniform edit per event, unlike a research pass.

## PR granularity

One research unit (an org plus whatever events/forums it turns out to
have) is the natural size for a PR — but that's a default, not a rule.
For simple, individually-well-sourced units, batching a handful into one
PR is fine and reduces process overhead that isn't buying anything (each
unit's sourcing still stands on its own in the PR description either
way). Keep something in its own PR when it's complex, uncertain, or you'd
want it reviewable in isolation.
