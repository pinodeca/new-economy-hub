export default function EventsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-24 sm:px-10">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Events & meetings
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Coming soon: upcoming events and meetings, filterable by geography and
        barrier to entry. See <code>prisma/schema.prisma</code> for the
        planned data model.
      </p>
    </div>
  );
}
