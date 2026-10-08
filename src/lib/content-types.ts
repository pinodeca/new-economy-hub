// Shape of the git-tracked content files under `content/` (see
// docs/DATA_MODEL.md). These are the source of truth — no database.
// A build step reads files matching these shapes, optionally indexes them
// into a throwaway SQLite file for querying, and Next statically renders
// pages from the result. Nothing here is enforced at runtime; treat it as
// the contract content files and the build pipeline agree on.

export type GeoScope = "US" | "INTERNATIONAL" | "COUNTRY";

// Who wrote a record. There is no `verified` flag alongside it — removed
// 2026-09-09, see docs/DECISIONS.md.
export type SourceType = "AI_GENERATED" | "AI_ASSISTED" | "HUMAN";

export type BarrierToEntry = "LOW" | "MEDIUM" | "HIGH";

export type ForumPlatform =
  | "SLACK"
  | "DISCORD"
  | "FORUM"
  | "MAILING_LIST"
  | "OTHER";

interface Provenance {
  sourceType: SourceType;
}

interface Geography {
  geoScope: GeoScope;
  /** ISO 3166-1 alpha-2. Required when geoScope is "COUNTRY". */
  countryCode?: string;
}

/**
 * The outcome of one of the two questions `content/RESEARCH.md` requires a
 * research pass to answer. `NONE_FOUND` is a real result, not a gap — the
 * whole point of recording this is that "checked, nothing there" and "nobody
 * ever looked" are different, and nothing else in `content/` can tell them
 * apart.
 */
export type ResearchFinding = "ADDED" | "NONE_FOUND" | "FOUND_NOT_REPRESENTABLE";

/**
 * Evidence that a `content/RESEARCH.md` pass actually happened, and what it
 * concluded. Absent means the organization has never had one — don't add an
 * empty block to make that go away.
 */
export interface ResearchPass {
  /** ISO 8601 date the check was made. Findings age; this is how you tell. */
  checkedAt: string;
  /** RESEARCH.md question 1: does this org run anything with a date? */
  events: ResearchFinding;
  /** RESEARCH.md question 2: anything people can join and talk in? */
  forums: ResearchFinding;
  /** URLs actually looked at, so a negative result is auditable, not trusted. */
  sourcesChecked: string[];
  /**
   * Things found that the current schema can't represent — recurring office
   * hours, rolling booking slots, one-way newsletters. Required when either
   * finding is `FOUND_NOT_REPRESENTABLE`, so they aren't silently lost.
   */
  notRepresentable?: string[];
  /** Anything else a reviewer would want, e.g. why something was excluded. */
  notes?: string;
}

export interface Organization extends Provenance, Geography {
  slug: string;
  name: string;
  description: string;
  url?: string;
  tags: string[];
  /** 1-5, best-effort signal, not a verified fact. */
  activityLevel?: number;
  memberCount?: number;
  research?: ResearchPass;
}

export type Weekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

/**
 * The cadences the site can compute a next date for. Deliberately small —
 * it covers everything research passes have actually hit (weekly, every
 * other week, "second Tuesday of the month") and nothing speculative. A
 * cadence this can't express still gets listed; it just omits `rule` and
 * relies on `Recurrence.schedule`.
 */
export type RecurrenceRule =
  | {
      frequency: "WEEKLY";
      weekday: Weekday;
      /** Every N weeks, counted from `Event.startAt`. Defaults to 1. */
      interval?: number;
    }
  | {
      frequency: "MONTHLY";
      weekday: Weekday;
      /** 1-4 for "first".."fourth", -1 for "last". */
      weekOfMonth: 1 | 2 | 3 | 4 | -1;
    };

/**
 * Makes an Event a repeating one (see docs/DECISIONS.md). On a recurring
 * event, `startAt` is a known occurrence the series runs from — and must
 * match `rule` when there is one — and `endAt`, if set, is the last session
 * of a finite series. With no `endAt` the event stays upcoming until someone
 * removes it, which is why `confirmedAt` exists.
 */
export interface Recurrence {
  /**
   * Plain-language cadence, shown to readers as-is, e.g. "Every Wednesday,
   * 6pm ET". Always required: it's the only description for cadences `rule`
   * can't express, and it carries the time of day, which `startAt` doesn't.
   */
  schedule: string;
  /** When present, the site computes and shows the next date. */
  rule?: RecurrenceRule;
  /**
   * ISO date the cadence was last confirmed on the organization's own site.
   * A one-off event goes stale on its own date; a recurring one can quietly
   * stop, and this is the only way to tell how old the claim is.
   */
  confirmedAt: string;
}

export type OutcomeStatus = "HAPPENED" | "CANCELLED" | "UNCONFIRMED";

export type OutcomeLinkKind = "RECORDING" | "RECAP" | "PHOTOS" | "NEWS" | "OTHER";

export interface OutcomeLink {
  url: string;
  kind: OutcomeLinkKind;
  /** Short label when the kind alone isn't enough, e.g. "Bay State Banner". */
  title?: string;
}

/**
 * What a post-event check found (see content/RESEARCH.md). Like
 * `ResearchPass`, absence means nobody has looked — not that nothing
 * happened. Only for events that have actually ended; an open-ended
 * recurring event never gets one.
 */
export interface EventOutcome {
  /** ISO date of the check. Must be on or after the event's last day. */
  checkedAt: string;
  /**
   * `UNCONFIRMED` is a real result — checked, and found no evidence either
   * way — not a placeholder; `notes` must say what was looked at.
   */
  status: OutcomeStatus;
  /** Recordings, recaps, photos, press — what a reader can still use. */
  links?: OutcomeLink[];
  notes?: string;
}

export interface Event extends Provenance, Geography {
  slug: string;
  title: string;
  description: string;
  url?: string;
  /**
   * A snapshot of `url` (e.g. web.archive.org), taken when the event is
   * added. Event pages get rewritten or vanish within days of the event —
   * rolling calendars especially — and this is what keeps a past record
   * checkable.
   */
  archivedUrl?: string;
  startAt: string; // ISO 8601
  endAt?: string;
  recurrence?: Recurrence;
  outcome?: EventOutcome;
  isVirtual: boolean;
  city?: string;
  barrierToEntry: BarrierToEntry;
  tags: string[];
  /** Slugs of every hosting/organizing Organization — a co-hosted event lists more than one. */
  organizationSlugs?: string[];
}

export interface Forum extends Provenance, Geography {
  slug: string;
  name: string;
  description: string;
  platform: ForumPlatform;
  url: string;
  memberCount?: number;
  activityLevel?: number;
  tags: string[];
  /** Slugs of every Organization that runs this forum. */
  organizationSlugs?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  body: string;
  author: string;
  publishedAt?: string;
}

export interface PodcastEpisode {
  slug: string;
  title: string;
  description: string;
  audioUrl: string;
  aiGenerated: boolean;
  /** Required, human-reviewed, rendered visibly in the UI when aiGenerated. */
  aiDisclosure?: string;
  publishedAt?: string;
}
