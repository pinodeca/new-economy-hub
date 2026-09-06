import { ProvenanceNote, TagList } from "@/components/ContentMeta";
import { getForums, getOrganizationBySlug } from "@/lib/content";
import type { ForumPlatform } from "@/lib/content-types";

const platformLabel: Record<ForumPlatform, string> = {
  SLACK: "Slack",
  DISCORD: "Discord",
  FORUM: "Forum",
  MAILING_LIST: "Mailing list",
  OTHER: "Other",
};

export default function ForumsPage() {
  const forums = getForums();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-24 sm:px-10">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Forums & communities
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Slack, Discord, mailing lists, and other places this community talks.
      </p>

      {forums.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-500">
          No forums yet.
        </p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {forums.map((forum) => {
            const org = forum.organizationSlug
              ? getOrganizationBySlug(forum.organizationSlug)
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
                      <span>Run by {org.name}</span>
                    </>
                  )}
                </div>
                <TagList tags={forum.tags} />
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
