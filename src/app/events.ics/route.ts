// Every upcoming event as one calendar, at /events.ics, for subscribing.
// Calendar apps re-fetch a subscription on their own schedule, and the daily
// rebuild keeps the file current — so new events show up without anyone
// re-downloading anything.

import { buildIcs, icsResponse } from "@/lib/calendar";
import { getUpcomingEvents } from "@/lib/content";

export const dynamic = "force-static";

export function GET() {
  return icsResponse(buildIcs(getUpcomingEvents(), "New Economy Hub events"));
}
