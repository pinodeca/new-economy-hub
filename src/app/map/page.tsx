import { OrganizationList } from "@/components/OrganizationList";
import { getOrganizations } from "@/lib/content";

export default function MapPage() {
  const organizations = getOrganizations();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-24 sm:px-10">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Organization map
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Organizations and projects in this space, with a sense of activity
        level and community size where known.
      </p>

      {organizations.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-500">
          No organizations yet.
        </p>
      ) : (
        <OrganizationList organizations={organizations} />
      )}
    </div>
  );
}
