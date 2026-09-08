"use client";

import Link from "next/link";
import {
  GeoFilterBar,
  ProvenanceNote,
  TagList,
  TagMenu,
} from "@/components/ContentMeta";
import { useContentFilters } from "@/lib/useContentFilters";
import type { ForumPlatform, Forum, Organization } from "@/lib/content-types";

const platformLabel: Record<ForumPlatform, string> = {
  SLACK: "Slack",
  DISCORD: "Discord",
  FORUM: "Forum",
  MAILING_LIST: "Mailing list",
  OTHER: "Other",
};

export function ForumList({
  forums,
  organizationsBySlug,
}: {
  forums: Forum[];
  organizationsBySlug: Record<string, Organization>;
}) {
  const { filtered, tag, setTag, geo, setGeo, allTags, clear } =
    useContentFilters(forums);

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
          No forums match these filters.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {filtered.map((forum) => {
            const org = forum.organizationSlug
              ? organizationsBySlug[forum.organizationSlug]
              : undefined;
            return (
              <li
                key={forum.slug}
                className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="font-medium text-zinc-950 dark:text-zinc-50">
                    <a
                      href={forum.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {forum.name}
                    </a>
                  </h2>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {platformLabel[forum.platform]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {forum.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {forum.memberCount !== undefined && (
                    <span>{forum.memberCount.toLocaleString()} members</span>
                  )}
                  {org && (
                    <>
                      {forum.memberCount !== undefined && <span aria-hidden>·</span>}
                      <span>
                        Run by{" "}
                        <Link
                          href={`/organizations/${org.slug}`}
                          className="hover:underline"
                        >
                          {org.name}
                        </Link>
                      </span>
                    </>
                  )}
                </div>
                <TagList
                  tags={forum.tags}
                  activeTag={tag}
                  onTagClick={(t) => setTag(tag === t ? null : t)}
                />
                <ProvenanceNote
                  sourceType={forum.sourceType}
                  verified={forum.verified}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
