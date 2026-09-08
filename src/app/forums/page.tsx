import { ForumList } from "@/components/ForumList";
import { getForums, getOrganizationsBySlug } from "@/lib/content";

export default function ForumsPage() {
  const forums = getForums();
  const organizationsBySlug = getOrganizationsBySlug();

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
        <ForumList forums={forums} organizationsBySlug={organizationsBySlug} />
      )}
    </div>
  );
}
