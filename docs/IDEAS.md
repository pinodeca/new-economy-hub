# Ideas / backlog

Informal, untriaged list of things worth thinking about — lower commitment
than a [ROADMAP.md](ROADMAP.md) line item, lower ceremony than opening an
Issue. Add a line whenever something comes up; move it to ROADMAP.md (or
delete it) once it's actually been thought through and scheduled.

- **Find local efforts.** Geography matters more when someone wants to
  actually show up in person than when they're fine joining remotely.
  Right now `geoScope`/`countryCode` are coarse (US / International /
  one-country bucket) — no city/region-level "what's near me" filtering.
  May need a real location field + distance/region filtering on Events (and
  maybe Organizations) to support this well.
- **Represent activity level and recency better.** `activityLevel` today is
  a static 1-5 best-effort number (see DATA_MODEL.md) with no sense of
  *when* an org/forum was last actually active. Want something that
  reflects "still alive" vs. "founded in 2015, hasn't posted since."
- **Make orgs/projects/communities easy to find on social media.** Add
  social links to the Organization (and maybe Forum) content shape.
- **Add a News tab.**
- **Aggregate a social media stream** — pull in relevant posts from these
  orgs' social accounts into a feed on the site.
- **Represent recurring things.** `Event.startAt` is a single ISO date —
  no way to model "office hours every Tuesday," a Calendly-style rolling
  open-booking slot, or an ongoing multi-week workshop series (found
  while researching L.A. Co-op Lab and A Bookkeeping Cooperative, see PRs
  #13 and #11). Don't know yet whether the right fix is a recurrence
  field on `Event` or a different content type entirely.
- **Surface newsletters, even though they're not Forums.** Per
  `content/RESEARCH.md`, a one-way announcement newsletter doesn't meet
  the "people actually talk to each other" bar for a `Forum` — correctly
  excluded for Democracy at Work Institute, L.A. Co-op Lab, and A
  Bookkeeping Cooperative (all three: Mailchimp-style email/name signups,
  not discussion). But "how do I stay in the loop with this org" is still
  a real, wanted answer, just a different kind of one from a Forum.
  Worth a lightweight way to surface these — e.g. an optional
  `newsletterUrl` on `Organization` — rather than either stretching
  `Forum`'s meaning to cover one-way lists or dropping newsletter links
  on the floor entirely.
