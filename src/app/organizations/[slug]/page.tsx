import Link from "next/link";
import { notFound } from "next/navigation";
import { ProvenanceNote, TagList, geoLabel } from "@/components/ContentMeta";
import { getEvents, getForums, getOrganizationBySlug, getOrganizations } from "@/lib/content";

export function generateStaticParams() {
  return getOrganizations().map((org) => ({ slug: org.slug }));
}

export async function generateMetadata({ params }: PageProps<"/organizations/[slug]">) {
  const { slug } = await params;
  const org = getOrganizationBySlug(slug);
  return { title: org ? `${org.name} · New Economy Hub` : "Organization not found" };
}

export default async function OrganizationDetailPage({
  params,
}: PageProps<"/organizations/[slug]">) {
  const { slug } = await params;
  const org = getOrganizationBySlug(slug);
  if (!org) notFound();

  const events = getEvents().filter((event) =>
    event.organizationSlugs?.includes(org.slug),
  );
  const forums = getForums().filter((forum) =>
    forum.organizationSlugs?.includes(org.slug),
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-24 sm:px-10">
      <Link
        href="/map"
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← Organization map
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {org.name}
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {geoLabel[org.geoScope]}
          {org.geoScope === "COUNTRY" && org.countryCode
            ? ` (${org.countryCode})`
            : ""}
        </span>
      </div>

      <p className="mt-4 text-zinc-600 dark:text-zinc-400">{org.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
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
              Visit organization site ↗
            </a>
          </>
        )}
      </div>

      <TagList tags={org.tags} />
      <ProvenanceNote sourceType={org.sourceType} verified={org.verified} />

      {events.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Events
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {events.map((event) => (
              <li
                key={event.slug}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h3 className="font-medium text-zinc-950 dark:text-zinc-50">
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
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {event.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {forums.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Forums
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {forums.map((forum) => (
              <li
                key={forum.slug}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h3 className="font-medium text-zinc-950 dark:text-zinc-50">
                  <a
                    href={forum.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {forum.name}
                  </a>
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {forum.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
