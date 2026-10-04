// Date helpers shared by the events page (a server component) and EventList
// (a client one), so they agree on what "upcoming" means.
//
// `startAt`/`endAt` are date-only ISO strings (see content-types.ts), which
// `new Date()` parses as UTC midnight — read them back with UTC getters (not
// toLocaleDateString's local-timezone defaults) so the displayed day doesn't
// shift for viewers west of UTC, and compare them against a UTC cutoff.

import type { Event, RecurrenceRule, Weekday } from "./content-types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
// In getUTCDay() order, so WEEKDAYS[date.getUTCDay()] is that date's code.
const WEEKDAYS: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 86_400_000;

function formatDate(date: Date) {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function formatDateRange(startAt: string, endAt?: string) {
  const start = new Date(startAt);
  const startMonth = MONTHS[start.getUTCMonth()];
  const startDay = start.getUTCDate();
  const startYear = start.getUTCFullYear();

  if (!endAt) return formatDate(start);

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

/**
 * Midnight UTC today. This is a *build-time* value: the site is statically
 * exported (see docs/DECISIONS.md), so "today" is frozen at whenever the
 * last deploy ran. The scheduled rebuild in the Azure workflow is what keeps
 * it honest — without it, past events would sit in the upcoming list forever.
 */
export function utcToday(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * Whether a UTC-midnight timestamp falls on `rule`. `anchor` is the event's
 * `startAt`, which every-N-weeks rules count from. Mirrored in
 * scripts/validate-content.mjs, which checks `startAt` itself matches.
 */
function matchesRule(t: number, rule: RecurrenceRule, anchor: number): boolean {
  const date = new Date(t);
  if (WEEKDAYS[date.getUTCDay()] !== rule.weekday) return false;
  if (rule.frequency === "WEEKLY") {
    const weeks = Math.round((t - anchor) / (7 * DAY_MS));
    return weeks % (rule.interval ?? 1) === 0;
  }
  if (rule.weekOfMonth === -1) {
    // The last such weekday is the one a week before the month changes.
    return new Date(t + 7 * DAY_MS).getUTCMonth() !== date.getUTCMonth();
  }
  return Math.ceil(date.getUTCDate() / 7) === rule.weekOfMonth;
}

/**
 * The first date on or after `cutoff` that a recurring event's rule lands on,
 * as a date-only ISO string — or undefined when it has no rule, or its series
 * has finished. Day-by-day is plenty: no supported rule is more than ~5
 * weeks between dates, so this never walks far.
 */
export function nextOccurrence(event: Event, cutoff: number = utcToday()): string | undefined {
  const rule = event.recurrence?.rule;
  if (!rule) return undefined;
  const anchor = Date.parse(event.startAt);
  const last = event.endAt ? Date.parse(event.endAt) : Infinity;
  const from = Math.max(anchor, cutoff);
  for (let t = from; t <= last && t < from + 400 * DAY_MS; t += DAY_MS) {
    if (matchesRule(t, rule, anchor)) return new Date(t).toISOString().slice(0, 10);
  }
  return undefined;
}

/**
 * An event stays upcoming through the whole of its final day. A recurring
 * event with no `endAt` never passes on its own — it's ongoing until someone
 * removes it, which is what `Recurrence.confirmedAt` is there to prompt.
 */
export function isPastEvent(event: Event, cutoff: number = utcToday()): boolean {
  if (event.recurrence) {
    if (!event.endAt) return false;
    if (event.recurrence.rule) return nextOccurrence(event, cutoff) === undefined;
  }
  return Date.parse(event.endAt ?? event.startAt) < cutoff;
}

/**
 * The date line for an upcoming event's card: "Next: Wed, Oct 7, 2026" for a
 * recurring event with a rule, "Recurring" for one without, the plain date
 * range otherwise.
 */
export function formatEventWhen(event: Event, cutoff: number = utcToday()): string {
  if (!event.recurrence) return formatDateRange(event.startAt, event.endAt);
  const nextAt = nextOccurrence(event, cutoff);
  if (!nextAt) return "Recurring";
  const next = new Date(nextAt);
  return `Next: ${WEEKDAY_NAMES[next.getUTCDay()]}, ${formatDate(next)}`;
}

/** The plain-language cadence line, with the series' bounds where they matter. */
export function formatRecurrence(event: Event, cutoff: number = utcToday()): string | undefined {
  const recurrence = event.recurrence;
  if (!recurrence) return undefined;
  const parts = [recurrence.schedule];
  if (Date.parse(event.startAt) > cutoff) parts.push(`starts ${formatDate(new Date(event.startAt))}`);
  if (event.endAt) parts.push(`until ${formatDate(new Date(event.endAt))}`);
  parts.push(`schedule confirmed ${formatDate(new Date(recurrence.confirmedAt))}`);
  return parts.join(" · ");
}
