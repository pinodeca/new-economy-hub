import type { Event, OutcomeLinkKind } from "@/lib/content-types";
import { formatDateRange } from "@/lib/event-dates";

const linkLabel: Record<OutcomeLinkKind, string> = {
  RECORDING: "Recording",
  RECAP: "Recap",
  PHOTOS: "Photos",
  NEWS: "News",
  OTHER: "More",
};

// The "already happened" list on the events page and each organization page.
// What a post-event check found (Event.outcome, see content/RESEARCH.md) is
// the useful part: a recording of a past webinar is still something a reader
// can use, and a cancelled event shouldn't read as one that ran.
export function PastEventList({ events }: { events: Event[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {events.map((event) => {
        const outcome = event.outcome;
        const cancelled = outcome?.status === "CANCELLED";
        return (
          <li key={event.slug} className="text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="text-zinc-600 dark:text-zinc-400">
                <span className={cancelled ? "line-through" : undefined}>
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
                {cancelled && (
                  <span className="ml-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Cancelled
                  </span>
                )}
              </span>
              <span className="text-zinc-500 dark:text-zinc-500">
                {formatDateRange(event.startAt, event.endAt)}
              </span>
            </div>
            {(Boolean(outcome?.links?.length) || event.archivedUrl) && (
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-500">
                {outcome?.links?.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    {link.title ? `${linkLabel[link.kind]}: ${link.title}` : linkLabel[link.kind]} ↗
                  </a>
                ))}
                {event.archivedUrl && (
                  <a
                    href={event.archivedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    Archived event page ↗
                  </a>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
