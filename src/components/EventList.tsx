"use client";

import {
  GeoFilterBar,
  OrganizationLinks,
  ProvenanceNote,
  TagList,
  TagMenu,
} from "@/components/ContentMeta";
import { formatDateRange } from "@/lib/event-dates";
import { useContentFilters } from "@/lib/useContentFilters";
import type { BarrierToEntry, Event, Organization } from "@/lib/content-types";

const barrierLabel: Record<BarrierToEntry, string> = {
  LOW: "Low barrier to entry",
  MEDIUM: "Medium barrier to entry",
  HIGH: "High barrier to entry",
};

export function EventList({
  events,
  organizationsBySlug,
}: {
  events: Event[];
  organizationsBySlug: Record<string, Organization>;
}) {
  const { filtered, tag, setTag, geo, setGeo, allTags, clear } =
    useContentFilters(events);

  return (
    <div>
      <div className="mt-8 flex flex-col gap-3">
        <GeoFilterBar value={geo} onChange={setGeo} />
        <TagMenu tags={allTags} activeTag={tag} onChange={setTag} />
        {(tag !== null || geo !== null) && (
          <button
            type="button"
            onClick={clear}
            className="self-start text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-500">
          No events match these filters.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {filtered.map((event) => {
            const orgs = (event.organizationSlugs ?? [])
              .map((slug) => organizationsBySlug[slug])
              .filter((org): org is Organization => org !== undefined);
            return (
              <li
                key={event.slug}
                className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="font-medium text-zinc-950 dark:text-zinc-50">
                    {event.url ? (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {event.title}
                      </a>
                    ) : (
                      event.title
                    )}
                  </h2>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {formatDateRange(event.startAt, event.endAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {event.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <span>
                    {event.isVirtual ? "Virtual" : (event.city ?? "In person")}
                  </span>
                  <span aria-hidden>·</span>
                  <span>{barrierLabel[event.barrierToEntry]}</span>
                  {orgs.length > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span>
                        Hosted by <OrganizationLinks organizations={orgs} />
                      </span>
                    </>
                  )}
                </div>
                <TagList
                  tags={event.tags}
                  activeTag={tag}
                  onTagClick={(t) => setTag(tag === t ? null : t)}
                />
                <ProvenanceNote
                  sourceType={event.sourceType}
                  verified={event.verified}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
