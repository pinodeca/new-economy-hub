// Date helpers shared by the events page (a server component) and EventList
// (a client one), so they agree on what "upcoming" means.
//
// `startAt`/`endAt` are date-only ISO strings (see content-types.ts), which
// `new Date()` parses as UTC midnight — read them back with UTC getters (not
// toLocaleDateString's local-timezone defaults) so the displayed day doesn't
// shift for viewers west of UTC, and compare them against a UTC cutoff.

import type { Event } from "./content-types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDateRange(startAt: string, endAt?: string) {
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

/** An event stays upcoming through the whole of its final day. */
export function isPastEvent(event: Event, cutoff: number = utcToday()): boolean {
  return Date.parse(event.endAt ?? event.startAt) < cutoff;
}
