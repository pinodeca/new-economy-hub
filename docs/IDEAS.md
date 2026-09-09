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
- **Navigation — there's no way back to the homepage.** `layout.tsx` renders
  no shared header, and nothing under `/events`, `/forums`, `/map`,
  `/blog`, or `/organizations/[slug]` links to `/`. Once you follow a link
  in from anywhere, the browser back button is the only way out. Probably
  a persistent header (logo/wordmark home link + the section links the
  homepage already lists) in the root layout, so every page gets it.
- **We need a logo.** Currently the default Next.js `favicon.ico` and a
  text-only title. Wanted for the header/home link, the favicon, and
  eventually social/OG preview images. Also worth deciding at the same
  time whether "New Economy Hub" is the final name, since a wordmark
  bakes it in.
- **Give readers a way to participate.** Two overlapping needs: (a)
  feedback on the directory — "you got this wrong," "you missed this org"
  — and (b) discussion, which matters much more once the blog exists. The
  cheap option is pointing people at GitHub Issues, which costs nothing,
  keeps corrections next to the content they're about, and fits the
  "content is git-tracked files reviewed via PR" model — but it asks for
  a GitHub account and filters out most non-technical readers, who are
  much of the audience. Page-level comments are friendlier but need
  somewhere to write to, which the static export deliberately doesn't
  have (see DECISIONS.md) — so either a third-party embed
  (Giscus/Utterances back onto GitHub Discussions, or a hosted comment
  service) or the same "we need a write endpoint" decision already parked
  under **Public submissions** in ROADMAP.md. Worth resolving those two
  together rather than separately.
- **Say that the site is new and under construction.** It was created early
  September 2026 (first commit 2026-09-06) and the directory is visibly
  thin — a reader who lands on a near-empty section should know it's
  because the work is young, not because there's nothing out there. Wants
  a short note somewhere durable (homepage and/or footer): when the site
  started, that construction is very much in progress, and a link to
  https://github.com/pinodeca/new-economy-hub for anyone who wants to
  contribute, request a fix, or ask for an org we haven't reached yet.
  Overlaps with the participation item above — the same footer probably
  carries both.
- **Index New Orleans-area organizations.** The founder is in New Orleans
  and wants local efforts covered: known starting points include
  coopnola.org and community loan funds operating in the area. Open
  question on scope: food co-ops are a real part of the local landscape
  but sit further from the "get involved in building a new economy" pitch
  than worker co-ops or CDFIs do — decide whether they're in before
  researching them, rather than mid-pass. Note this is a content-research
  goal, not the data-model gap in **Find local efforts** above; the orgs
  can be added under the existing `US` geo-scope today, they just won't
  be filterable by city until that lands.
