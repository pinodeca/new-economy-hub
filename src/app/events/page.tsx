import { EventList } from "@/components/EventList";
import { getEvents, getOrganizationsBySlug } from "@/lib/content";

export default function EventsPage() {
  const events = getEvents();
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

      {events.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-500">
          No events yet.
        </p>
      ) : (
        <EventList events={events} organizationsBySlug={organizationsBySlug} />
      )}
    </div>
  );
}
