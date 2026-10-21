"use client";

import { useEffect, useState } from "react";
import { EventCalendarView } from "@/components/EventCalendarView";
import {
  CadenceLine,
  GeoFilterBar,
  OrganizationLinks,
  ProvenanceNote,
  TagList,
  TagMenu,
} from "@/components/ContentMeta";
import type { EventCalendar, UpcomingEvent } from "@/lib/content";
import { useContentFilters } from "@/lib/useContentFilters";
import type { BarrierToEntry, Organization } from "@/lib/content-types";

const barrierLabel: Record<BarrierToEntry, string> = {
  LOW: "Low barrier to entry",
  MEDIUM: "Medium barrier to entry",
  HIGH: "High barrier to entry",
};

type View = "list" | "calendar";

// The chosen view lives in the URL hash (#calendar), so a link to the
// calendar opens on the calendar. Read after mount: the prerendered HTML
// can't know the hash, so the first render is always the list.
function useViewFromHash(): [View, (view: View) => void] {
  const [view, setViewState] = useState<View>("list");
  useEffect(() => {
    const sync = () => setViewState(window.location.hash === "#calendar" ? "calendar" : "list");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const setView = (next: View) => {
    setViewState(next);
    const url = `${window.location.pathname}${window.location.search}${next === "calendar" ? "#calendar" : ""}`;
    window.history.replaceState(null, "", url);
  };
  return [view, setView];
}

export function EventList({
  events,
  calendar,
  organizationsBySlug,
}: {
  events: UpcomingEvent[];
  calendar: EventCalendar;
  organizationsBySlug: Record<string, Organization>;
}) {
  const { filtered, tag, setTag, geo, setGeo, allTags, clear } =
    useContentFilters(events);
  const [view, setView] = useViewFromHash();
  const toggleTag = (t: string) => setTag(tag === t ? null : t);

  return (
    <div>
      <div className="mt-8 flex flex-col gap-3">
        <ViewToggle view={view} onChange={setView} />
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

      {view === "calendar" ? (
        <EventCalendarView
          events={filtered}
          calendar={calendar}
          renderEvent={(event) => (
            <EventCard
              event={event}
              organizationsBySlug={organizationsBySlug}
              activeTag={tag}
              onTagClick={toggleTag}
            />
          )}
        />
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-500">
          No events match these filters.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {filtered.map((event) => (
            <li
              key={event.slug}
              className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <EventCard
                event={event}
                organizationsBySlug={organizationsBySlug}
                activeTag={tag}
                onTagClick={toggleTag}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  const option = (value: View, label: string) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={view === value}
      className={
        view === value
          ? "rounded-md bg-white px-3 py-1 text-sm font-medium text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
          : "rounded-md px-3 py-1 text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
      }
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="View" className="flex self-start rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
      {option("list", "List")}
      {option("calendar", "Calendar")}
    </div>
  );
}

/** One event's full details — the list's cards, and the calendar's popup. */
export function EventCard({
  event,
  organizationsBySlug,
  activeTag,
  onTagClick,
}: {
  event: UpcomingEvent;
  organizationsBySlug: Record<string, Organization>;
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}) {
  const orgs = (event.organizationSlugs ?? [])
    .map((slug) => organizationsBySlug[slug])
    .filter((org): org is Organization => org !== undefined);
  return (
    <>
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
          {event.when}
        </span>
      </div>
      {event.cadence && <CadenceLine cadence={event.cadence} />}
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {event.description}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
        <span>
          {event.isVirtual ? "Virtual" : (event.city ?? "In person")}
        </span>
        <span aria-hidden>·</span>
        <span>{barrierLabel[event.barrierToEntry]}</span>
        {orgs.length > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>
              Hosted by <OrganizationLinks organizations={orgs} />
            </span>
          </>
        )}
      </div>
      <AddToCalendar event={event} />
      <TagList tags={event.tags} activeTag={activeTag} onTagClick={onTagClick} />
      <ProvenanceNote sourceType={event.sourceType} />
    </>
  );
}

const calendarLink =
  "underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700 dark:decoration-zinc-700 dark:hover:text-zinc-200";

function AddToCalendar({ event }: { event: UpcomingEvent }) {
  if (!event.calendar) {
    // Only recurring events without a rule land here: their dates shift
    // month to month, so a repeating entry would put sessions on wrong days.
    return (
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
        Dates vary, so there&apos;s no calendar entry — check the schedule
        above.
      </p>
    );
  }
  return (
    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
      Add to calendar:{" "}
      <a href={event.calendar.googleUrl} target="_blank" rel="noreferrer" className={calendarLink}>
        Google
      </a>
      <span aria-hidden> · </span>
      <a href={event.calendar.icsPath} download className={calendarLink}>
        Apple, Outlook &amp; others (.ics)
      </a>
    </p>
  );
}
