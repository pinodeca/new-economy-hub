import Link from "next/link";
import { notFound } from "next/navigation";
import { ProvenanceNote, TagList, geoLabel } from "@/components/ContentMeta";
import {
  getForums,
  getOrganizationBySlug,
  getOrganizations,
  getPastEvents,
  getUpcomingEvents,
} from "@/lib/content";
import { formatDateRange } from "@/lib/event-dates";
import type { Event, ResearchFinding, ResearchPass } from "@/lib/content-types";

// A research pass that found nothing is a real result, not an empty space —
// see content/RESEARCH.md. Saying so is more useful to a reader deciding where
// to spend their time than leaving the page silently blank, and it's the only
// way to tell "we looked" apart from "nobody has looked yet".
const eventsClause: Record<ResearchFinding, string> = {
  ADDED: "found the events listed above",
  NONE_FOUND: "found no public events",
  FOUND_NOT_REPRESENTABLE: "found events this site can't list yet",
};

const forumsClause: Record<ResearchFinding, string> = {
  ADDED: "found the communities listed above",
  NONE_FOUND: "found no community to join",
  FOUND_NOT_REPRESENTABLE: "found a community this site can't list yet",
};

function ResearchCheck({ research }: { research: ResearchPass }) {
  return (
    <section className="mt-10 rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Research check
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Checked {formatDateRange(research.checkedAt)} for ways to get involved:{" "}
        {eventsClause[research.events]}, and {forumsClause[research.forums]}.
      </p>

      {research.notRepresentable && research.notRepresentable.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Found, but this site has no way to show it yet:
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm text-zinc-500 dark:text-zinc-500">
            {research.notRepresentable.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {research.notes && (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">{research.notes}</p>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300">
          What was checked ({research.sourcesChecked.length})
        </summary>
        <ul className="mt-2 flex flex-col gap-1 pl-1 text-xs text-zinc-500 dark:text-zinc-500">
          {research.sourcesChecked.map((source) => (
            <li key={source}>
              <a
                href={source}
                target="_blank"
                rel="noreferrer"
                className="break-all hover:underline"
              >
                {source}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

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

  const hostedBy = (event: Event) => event.organizationSlugs?.includes(org.slug);
  const upcomingEvents = getUpcomingEvents().filter(hostedBy);
  const pastEvents = getPastEvents().filter(hostedBy);
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

      {upcomingEvents.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Upcoming events
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {upcomingEvents.map((event) => (
              <li
                key={event.slug}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
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
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {formatDateRange(event.startAt, event.endAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {event.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pastEvents.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Past events
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {pastEvents.map((event) => (
              <li
                key={event.slug}
                className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm"
              >
                <span className="text-zinc-600 dark:text-zinc-400">
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
                </span>
                <span className="text-zinc-500 dark:text-zinc-500">
                  {formatDateRange(event.startAt, event.endAt)}
                </span>
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

      {org.research && <ResearchCheck research={org.research} />}
    </div>
  );
}
