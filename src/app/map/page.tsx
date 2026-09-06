import { ProvenanceNote, TagList } from "@/components/ContentMeta";
import { getOrganizations } from "@/lib/content";
import type { GeoScope } from "@/lib/content-types";

const geoLabel: Record<GeoScope, string> = {
  US: "United States",
  INTERNATIONAL: "International",
  COUNTRY: "Country-specific",
};

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
        <ul className="mt-10 flex flex-col gap-4">
          {organizations.map((org) => (
            <li
              key={org.slug}
              className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-medium text-zinc-950 dark:text-zinc-50">
                  {org.url ? (
                    <a
                      href={org.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {org.name}
                    </a>
                  ) : (
                    org.name
                  )}
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
              </div>
              <TagList tags={org.tags} />
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
