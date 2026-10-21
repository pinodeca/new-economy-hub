// Reads content files from `content/` at build time. No database, no live
// server — see docs/DECISIONS.md and docs/DATA_MODEL.md.
//
// This is deliberately simple (read JSON, return arrays) rather than the
// throwaway-SQLite build step described in DATA_MODEL.md: at today's content
// volume, plain array filter/sort is enough. Reach for the SQLite step (or
// this file gets slow/unwieldy) once join/filter/search needs grow.

import fs from "fs";
import path from "path";
import { calendarLinks, type CalendarLinks } from "./calendar";
import type { Event, Forum, Organization } from "./content-types";
import {
  eventInstant,
  formatEventWhen,
  formatRecurrence,
  isPastEvent,
  nextOccurrence,
  occurrenceDates,
  utcToday,
} from "./event-dates";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readJsonDir<T>(subdir: string): T[] {
  const dir = path.join(CONTENT_DIR, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as T);
}

export function getOrganizations(): Organization[] {
  return readJsonDir<Organization>("organizations").sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function getEvents(): Event[] {
  return readJsonDir<Event>("events").sort(
    (a, b) => Date.parse(a.startAt) - Date.parse(b.startAt),
  );
}

export function getForums(): Forum[] {
  return readJsonDir<Forum>("forums").sort((a, b) => a.name.localeCompare(b.name));
}

export function getOrganizationBySlug(slug: string): Organization | undefined {
  return getOrganizations().find((org) => org.slug === slug);
}

export function getOrganizationsBySlug(): Record<string, Organization> {
  return Object.fromEntries(getOrganizations().map((org) => [org.slug, org]));
}

// Events are split by date at BUILD time — the site is statically exported,
// so an event only moves from upcoming to past when the site is rebuilt. The
// scheduled rebuild in .github/workflows/azure-static-web-apps-*.yml is what
// makes that happen without a push; see docs/INFRASTRUCTURE.md.

/**
 * An upcoming event plus its display strings, worked out at build time. They
 * depend on "today" (a recurring event's next date, whether it has started
 * yet), so they're computed here once rather than in the client-side list,
 * where the browser's today would disagree with the prerendered HTML.
 */
export interface UpcomingEvent extends Event {
  when: string;
  cadence?: string;
  /** Absent when the event can't be a faithful calendar entry (calendar.ts). */
  calendar?: CalendarLinks;
}

/**
 * Soonest first. A recurring event sorts by its next date; one with no rule
 * to compute that from sorts as happening now, ahead of later one-offs —
 * it's something a reader can join this week or next.
 */
export function getUpcomingEvents(): UpcomingEvent[] {
  const cutoff = utcToday();
  const sortKey = (event: Event) => {
    const next = nextOccurrence(event, cutoff);
    if (next) return Date.parse(next);
    return Math.max(Date.parse(event.startAt), event.recurrence ? cutoff : -Infinity);
  };
  return getEvents()
    .filter((event) => !isPastEvent(event, cutoff))
    .sort((a, b) => sortKey(a) - sortKey(b))
    .map((event) => ({
      ...event,
      when: formatEventWhen(event, cutoff),
      cadence: formatRecurrence(event, cutoff),
      calendar: calendarLinks(event, cutoff),
    }));
}

/** One day an upcoming event happens on, for the calendar view. */
export interface CalendarEntry {
  /** The date in the event's own timezone — where an all-day entry goes. */
  date: string;
  slug: string;
  /**
   * UTC instants (ISO) for a timed entry. The calendar converts these to
   * the viewer's timezone, which can also move the entry to another day.
   */
  start?: string;
  end?: string;
}

export interface EventCalendar {
  /** First day of each month the view can show, "YYYY-MM-01". */
  months: string[];
  entries: CalendarEntry[];
}

const CALENDAR_MONTHS = 12;

/**
 * Every date each upcoming event falls on, from today through the end of
 * the 12th month — worked out here at build time, like the rest of the
 * events page, so the client only has to page through it and convert times
 * to the viewer's timezone.
 */
export function getEventCalendar(events: Event[]): EventCalendar {
  const cutoff = utcToday();
  const now = new Date(cutoff);
  const months = Array.from({ length: CALENDAR_MONTHS }, (_, i) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1)).toISOString().slice(0, 10),
  );
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + CALENDAR_MONTHS, 0);
  const entries: CalendarEntry[] = events.flatMap((event) =>
    occurrenceDates(event, cutoff, end).map((date) => {
      const time = event.time;
      if (!time) return { date, slug: event.slug };
      return {
        date,
        slug: event.slug,
        start: eventInstant(date, time.start, time.timeZone),
        ...(time.end ? { end: eventInstant(date, time.end, time.timeZone) } : {}),
      };
    }),
  );
  return { months, entries };
}

/** Most recently finished first — the reverse of the upcoming list's order. */
export function getPastEvents(): Event[] {
  const cutoff = utcToday();
  return getEvents()
    .filter((event) => isPastEvent(event, cutoff))
    .reverse();
}

/** The date this build ran, as a date-only ISO string, for "as of" notes. */
export function getBuildDate(): string {
  return new Date().toISOString().slice(0, 10);
}
