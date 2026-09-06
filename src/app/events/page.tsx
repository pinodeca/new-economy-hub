import { ProvenanceNote, TagList } from "@/components/ContentMeta";
import { getEvents, getOrganizationBySlug } from "@/lib/content";
import type { BarrierToEntry } from "@/lib/content-types";

const barrierLabel: Record<BarrierToEntry, string> = {
  LOW: "Low barrier to entry",
  MEDIUM: "Medium barrier to entry",
  HIGH: "High barrier to entry",
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// startAt/endAt are date-only ISO strings (see content-types.ts), which
// `new Date()` parses as UTC midnight — read them back with UTC getters
// (not toLocaleDateString's local-timezone defaults) so the displayed day
// doesn't shift for viewers west of UTC.
function formatDateRange(startAt: string, endAt?: string) {
  const start = new Date(startAt);
  const startMonth = MONTHS[start.getUTCMonth()];
  const startDay = start.getUTCDate();
  const startYear = start.getUTCFullYear();

  if (!endAt) return `${startMonth} ${startDay}, ${startYear}`;

  const end = new Date(endAt);
  const endMonth = MONTHS[end.getUTCMonth()];
  const endDay = end.getUTCDate();
  const endYear = end.getUTCFullYear();

  if (startYear === endYear && startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}, ${startYear}`;
  }
  if (startYear === endYear) {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;
  }
  return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
}

export default function EventsPage() {
  const events = getEvents();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-24 sm:px-10">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Events & meetings
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Upcoming gatherings, especially ones with a low barrier to just show
        up.
      </p>

      {events.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-500">
          No events yet.
        </p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {events.map((event) => {
            const org = event.organizationSlug
              ? getOrganizationBySlug(event.organizationSlug)
              : undefined;
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
                  {org && (
                    <>
                      <span aria-hidden>·</span>
                      <span>Hosted by {org.name}</span>
                    </>
                  )}
                </div>
                <TagList tags={event.tags} />
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
