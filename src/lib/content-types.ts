// Shape of the git-tracked content files under `content/` (see
// docs/DATA_MODEL.md). These are the source of truth — no database.
// A build step reads files matching these shapes, optionally indexes them
// into a throwaway SQLite file for querying, and Next statically renders
// pages from the result. Nothing here is enforced at runtime; treat it as
// the contract content files and the build pipeline agree on.

export type GeoScope = "US" | "INTERNATIONAL" | "COUNTRY";

// AI-generated content must never mark itself verified — see CLAUDE.md.
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
  verified: boolean;
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

export interface Event extends Provenance, Geography {
  slug: string;
  title: string;
  description: string;
  url?: string;
  startAt: string; // ISO 8601
  endAt?: string;
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
