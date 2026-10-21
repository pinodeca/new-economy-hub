// One .ics file per upcoming event, at /calendar/<slug>.ics — prerendered at
// build time (output: "export"), so this is a static file, not an endpoint.

import { buildIcs, calendarLinks, icsResponse } from "@/lib/calendar";
import { getUpcomingEvents } from "@/lib/content";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getUpcomingEvents()
    .filter((event) => calendarLinks(event))
    .map((event) => ({ file: `${event.slug}.ics` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const event = getUpcomingEvents().find((e) => `${e.slug}.ics` === file);
  if (!event) return new Response("Not found", { status: 404 });
  return icsResponse(buildIcs([event], event.title));
}
