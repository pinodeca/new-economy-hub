"use client";

import Link from "next/link";
import type { GeoScope, Organization, SourceType } from "@/lib/content-types";

// Renders "X", "X and Y", or "X, Y, and Z" with each org linked to its
// detail page — a co-hosted event/forum can have more than one.
export function OrganizationLinks({
  organizations,
}: {
  organizations: Organization[];
}) {
  return (
    <>
      {organizations.map((org, i) => (
        <span key={org.slug}>
          {i > 0 &&
            (i === organizations.length - 1
              ? organizations.length > 2
                ? ", and "
                : " and "
              : ", ")}
          <Link href={`/organizations/${org.slug}`} className="hover:underline">
            {org.name}
          </Link>
        </span>
      ))}
    </>
  );
}

function TagPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (!onClick) {
    return (
      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white dark:bg-zinc-50 dark:text-zinc-900"
          : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }
    >
      {children}
    </button>
  );
}

export function TagList({
  tags,
  activeTag,
  onTagClick,
}: {
  tags: string[];
  activeTag?: string | null;
  onTagClick?: (tag: string) => void;
}) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <TagPill
          key={tag}
          active={tag === activeTag}
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
        >
          {tag}
        </TagPill>
      ))}
    </div>
  );
}

// A browsable menu of every tag present, for filtering from the top of a
// list page — distinct from TagList's per-card display, though both share
// the same pill styling and active state.
export function TagMenu({
  tags,
  activeTag,
  onChange,
}: {
  tags: string[];
  activeTag: string | null;
  onChange: (tag: string | null) => void;
}) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <TagPill
          key={tag}
          active={tag === activeTag}
          onClick={() => onChange(activeTag === tag ? null : tag)}
        >
          {tag}
        </TagPill>
      ))}
    </div>
  );
}

export const geoLabel: Record<GeoScope, string> = {
  US: "United States",
  INTERNATIONAL: "International",
  COUNTRY: "Country-specific",
};

const GEO_SCOPES: GeoScope[] = ["US", "INTERNATIONAL", "COUNTRY"];

function GeoPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-zinc-50 dark:text-zinc-900"
          : "rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
      }
    >
      {children}
    </button>
  );
}

// Fixed to the site's three-value geography model (see PROJECT_BRIEF.md)
// rather than derived from what's present in the data — geography is a
// permanent filter here, not something to hide just because seed content
// is thin.
export function GeoFilterBar({
  value,
  onChange,
}: {
  value: GeoScope | null;
  onChange: (value: GeoScope | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <GeoPill active={value === null} onClick={() => onChange(null)}>
        All
      </GeoPill>
      {GEO_SCOPES.map((scope) => (
        <GeoPill
          key={scope}
          active={value === scope}
          onClick={() => onChange(scope)}
        >
          {geoLabel[scope]}
        </GeoPill>
      ))}
    </div>
  );
}

// Provenance is not optional here: agents populate this content via PR, and
// verification is the human merge step, not something a record grants
// itself — see CLAUDE.md and docs/DATA_MODEL.md. Surface it on every card
// rather than hiding it behind a detail page that doesn't exist yet.
export function ProvenanceNote({
  sourceType,
  verified,
}: {
  sourceType: SourceType;
  verified: boolean;
}) {
  const sourceLabel =
    sourceType === "HUMAN"
      ? "Human-submitted"
      : sourceType === "AI_ASSISTED"
        ? "AI-assisted"
        : "AI-generated";
  return (
    <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-600">
      {sourceLabel} · {verified ? "Verified" : "Unverified"}
    </p>
  );
}
