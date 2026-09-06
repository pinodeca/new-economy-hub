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

export interface Organization extends Provenance, Geography {
  slug: string;
  name: string;
  description: string;
  url?: string;
  tags: string[];
  /** 1-5, best-effort signal, not a verified fact. */
  activityLevel?: number;
  memberCount?: number;
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
  organizationSlug?: string;
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
  organizationSlug?: string;
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
