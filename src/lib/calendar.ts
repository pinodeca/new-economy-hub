// "Add to calendar" for events: iCalendar (.ics) files and Google Calendar
// links, generated at build time like everything else on this static site
// (see docs/DECISIONS.md, "Add to calendar").
//
// Two shapes, both from the same occurrence data:
// - an .ics file, which Apple Calendar, Outlook, and nearly everything else
//   open, served from /calendar/<slug>.ics, plus /events.ics with every
//   upcoming event for subscribing;
// - a Google Calendar "create event" link, since Google won't open an .ics
//   from a click.
//
// A recurring event becomes one repeating calendar entry (an RRULE), not a
// single date — but only when it has a `recurrence.rule`. A cadence the rule
// can't express ("last Wednesday, except November") has no faithful RRULE,
// so those events get no calendar entry rather than a wrong one.

import { tzlib_get_ical_block } from "timezones-ical-library";
import type { Event, RecurrenceRule } from "./content-types";
import { nextOccurrence, utcToday } from "./event-dates";

export const SITE_URL = "https://neweconomyhub.net";
export const FEED_PATH = "/events.ics";

const DAY_MS = 86_400_000;

export interface CalendarLinks {
  icsPath: string;
  googleUrl: string;
}

/**
 * What a calendar entry needs, worked out once so the .ics and the Google
 * link can't disagree. `undefined` when the event can't be represented.
 */
interface Occurrence {
  /** First date the entry covers, YYYY-MM-DD. */
  date: string;
  /** Last day of a multi-day one-off, YYYY-MM-DD. */
  lastDate?: string;
  rrule?: string;
}

function occurrence(event: Event, cutoff: number): Occurrence | undefined {
  const rule = event.recurrence?.rule;
  if (event.recurrence && !rule) return undefined;
  if (!rule) return { date: event.startAt, lastDate: event.endAt };

  // Start the series at its next date, so adding it doesn't also fill the
  // calendar with sessions that already happened.
  const date = nextOccurrence(event, cutoff);
  if (!date) return undefined;
  return { date, rrule: toRrule(rule, event) };
}

function toRrule(rule: RecurrenceRule, event: Event): string {
  const parts =
    rule.frequency === "WEEKLY"
      ? ["FREQ=WEEKLY", ...(rule.interval && rule.interval > 1 ? [`INTERVAL=${rule.interval}`] : []), `BYDAY=${rule.weekday}`]
      : ["FREQ=MONTHLY", `BYDAY=${rule.weekOfMonth}${rule.weekday}`];
  if (event.endAt) {
    // RFC 5545: with a timed, TZID'd start, UNTIL must be UTC. Two days past
    // the last session clears it in any timezone, and no supported rule
    // repeats sooner than weekly, so nothing extra slips in.
    parts.push(
      event.time
        ? `UNTIL=${compact(addDays(event.endAt, 2))}T000000Z`
        : `UNTIL=${compact(event.endAt)}`,
    );
  }
  return parts.join(";");
}

function addDays(date: string, days: number): string {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);
}

const compact = (date: string) => date.replaceAll("-", "");
const compactTime = (hhmm: string) => `${hhmm.replace(":", "")}00`;

/** DTSTART/DTEND values, as [start, end] for .ics and Google alike. */
function bounds(event: Event, occ: Occurrence): [string, string] {
  if (event.time) {
    const start = `${compact(occ.date)}T${compactTime(event.time.start)}`;
    const endDate = occ.lastDate ?? occ.date;
    // No published end: mark the start only, rather than invent a duration.
    const end = `${compact(endDate)}T${compactTime(event.time.end ?? event.time.start)}`;
    return [start, end];
  }
  // All-day: the end date is exclusive in both formats.
  return [compact(occ.date), compact(addDays(occ.lastDate ?? occ.date, 1))];
}

function location(event: Event): string {
  return event.isVirtual ? "Online" : (event.city ?? "");
}

/** Plain-text body shared by both formats. */
function details(event: Event): string {
  const lines = [event.description];
  if (event.recurrence) lines.push("", `Schedule: ${event.recurrence.schedule}`);
  if (event.url) lines.push("", `Details and registration: ${event.url}`);
  lines.push(
    "",
    event.sourceType === "HUMAN"
      ? `Listed on New Economy Hub: ${SITE_URL}/events`
      : `Listed on New Economy Hub (researched by an AI agent — check the organizer's page before you go): ${SITE_URL}/events`,
  );
  return lines.join("\n");
}

export function calendarLinks(event: Event, cutoff: number = utcToday()): CalendarLinks | undefined {
  const occ = occurrence(event, cutoff);
  if (!occ) return undefined;
  const [start, end] = bounds(event, occ);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: details(event),
    location: location(event),
  });
  if (event.time) params.set("ctz", event.time.timeZone);
  if (occ.rrule) params.set("recur", `RRULE:${occ.rrule}`);
  return {
    icsPath: `/calendar/${event.slug}.ics`,
    googleUrl: `https://calendar.google.com/calendar/render?${params}`,
  };
}

// --- iCalendar serialization (RFC 5545) ---

function escapeText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Lines longer than 75 octets are folded, continuing with a leading space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const len = new TextEncoder().encode(char).length;
    if (size + len > (out.length === 0 ? 75 : 74)) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += len;
  }
  out.push(current);
  return out.join("\r\n ");
}

function vevent(event: Event, occ: Occurrence, stamp: string): string[] {
  const [start, end] = bounds(event, occ);
  const when = event.time
    ? [`DTSTART;TZID=${event.time.timeZone}:${start}`, `DTEND;TZID=${event.time.timeZone}:${end}`]
    : [`DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`];
  return [
    "BEGIN:VEVENT",
    `UID:${event.slug}@neweconomyhub.net`,
    `DTSTAMP:${stamp}`,
    ...when,
    ...(occ.rrule ? [`RRULE:${occ.rrule}`] : []),
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(details(event))}`,
    ...(location(event) ? [`LOCATION:${escapeText(location(event))}`] : []),
    ...(event.url ? [`URL:${event.url}`] : []),
    "END:VEVENT",
  ];
}

/**
 * The VTIMEZONE block for an IANA zone. The library returns a string, not
 * a block, for a zone it doesn't know — fail the build then, rather than
 * ship a calendar file whose times silently float.
 */
function vtimezone(zone: string): string[] {
  const block = tzlib_get_ical_block(zone);
  if (!Array.isArray(block)) throw new Error(`No VTIMEZONE available for "${zone}": ${block}`);
  return block[0].split("\r\n");
}

/**
 * A VCALENDAR holding every given event that can be represented, with the
 * VTIMEZONE definitions their times need (clients get DST right from these
 * rather than guessing from the TZID alone).
 */
export function buildIcs(events: Event[], name: string, cutoff: number = utcToday()): string {
  const stamp = `${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
  const entries = events.flatMap((event) => {
    const occ = occurrence(event, cutoff);
    return occ ? [{ event, occ }] : [];
  });
  const zones = [...new Set(entries.flatMap(({ event }) => (event.time ? [event.time.timeZone] : [])))].sort();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//New Economy Hub//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    ...zones.flatMap((zone) => vtimezone(zone)),
    ...entries.flatMap(({ event, occ }) => vevent(event, occ, stamp)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function icsResponse(body: string): Response {
  return new Response(body, {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
}
