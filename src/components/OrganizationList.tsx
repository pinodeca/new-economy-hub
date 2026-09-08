"use client";

import Link from "next/link";
import {
  GeoFilterBar,
  ProvenanceNote,
  TagList,
  TagMenu,
  geoLabel,
} from "@/components/ContentMeta";
import { useContentFilters } from "@/lib/useContentFilters";
import type { Organization } from "@/lib/content-types";

export function OrganizationList({
  organizations,
}: {
  organizations: Organization[];
}) {
  const { filtered, tag, setTag, geo, setGeo, allTags, clear } =
    useContentFilters(organizations);

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
          No organizations match these filters.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {filtered.map((org) => (
            <li
              key={org.slug}
              className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-medium text-zinc-950 dark:text-zinc-50">
                  <Link href={`/organizations/${org.slug}`} className="hover:underline">
                    {org.name}
                  </Link>
                </h2>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {geoLabel[org.geoScope]}
                  {org.geoScope === "COUNTRY" && org.countryCode
                    ? ` (${org.countryCode})`
                    : ""}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {org.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                {org.memberCount !== undefined && (
                  <span>{org.memberCount.toLocaleString()} members</span>
                )}
                {org.activityLevel !== undefined && (
                  <>
                    {org.memberCount !== undefined && <span aria-hidden>·</span>}
                    <span>Activity {org.activityLevel}/5</span>
                  </>
                )}
                {org.url && (
                  <>
                    {(org.memberCount !== undefined || org.activityLevel !== undefined) && (
                      <span aria-hidden>·</span>
                    )}
                    <a
                      href={org.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Visit site ↗
                    </a>
                  </>
                )}
              </div>
              <TagList
                tags={org.tags}
                activeTag={tag}
                onTagClick={(t) => setTag(tag === t ? null : t)}
              />
              <ProvenanceNote
                sourceType={org.sourceType}
                verified={org.verified}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
