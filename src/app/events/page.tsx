import Link from "next/link";
import { EventList } from "@/components/EventList";
import {
  getBuildDate,
  getOrganizationsBySlug,
  getPastEvents,
  getUpcomingEvents,
} from "@/lib/content";
import { formatDateRange } from "@/lib/event-dates";

export default function EventsPage() {
  const upcoming = getUpcomingEvents();
  const past = getPastEvents();
  const organizationsBySlug = getOrganizationsBySlug();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-24 sm:px-10">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Events & meetings
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Upcoming gatherings, especially ones with a low barrier to just show
        up.
      </p>

      {upcoming.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-500">
          Nothing coming up right now.
        </p>
      ) : (
        <EventList
          events={upcoming}
          organizationsBySlug={organizationsBySlug}
        />
      )}

      {past.length > 0 && (
        <section className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Already happened
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Kept as a record of what these organizations actually run.
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {past.map((event) => (
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

      {/* This site is statically exported, so "upcoming" is only as fresh as
          the last build — say so rather than letting a stalled rebuild quietly
          present old events as current. */}
      <p className="mt-16 text-xs text-zinc-400 dark:text-zinc-600">
        Dates checked {getBuildDate()}. The site rebuilds daily; if something
        here has passed,{" "}
        <Link href="/map" className="underline hover:text-zinc-600 dark:hover:text-zinc-400">
          check the organization
        </Link>{" "}
        directly.
      </p>
    </div>
  );
}
