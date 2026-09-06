import Link from "next/link";

const sections = [
  {
    href: "/events",
    title: "Events & meetings",
    description:
      "Find upcoming gatherings, especially ones with a low barrier to just show up.",
  },
  {
    href: "/forums",
    title: "Forums & communities",
    description: "Slack, Discord, and other places this community talks.",
  },
  {
    href: "/map",
    title: "Organization map",
    description:
      "Who's active in this space, with a sense of scale and momentum.",
  },
  {
    href: "/blog",
    title: "Blog",
    description: "Short write-ups on specific communities and projects.",
  },
];

const geoScopes = [
  { label: "United States", description: "The primary focus of this site." },
  {
    label: "International",
    description: "Efforts that intentionally span multiple countries.",
  },
  {
    label: "Country-specific",
    description: "Efforts confined to one country outside the US.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-16 px-6 py-24 sm:px-10">
        <section className="flex flex-col gap-6">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
            So you want to build a better economy.
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            This site exists to help you learn what&apos;s already happening
            across this space, find the fastest way to actually get
            involved&nbsp;&mdash; events, forums, and communities to join this
            week or ASAP&nbsp;&mdash; and push toward a shared,
            organization-agnostic center of gravity, so the movement compounds
            and reaches critical mass.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            >
              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                {section.title}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {section.description}
              </span>
            </Link>
          ))}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Geography
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {geoScopes.map((scope) => (
              <div key={scope.label} className="flex flex-col gap-1">
                <span className="font-medium text-zinc-950 dark:text-zinc-50">
                  {scope.label}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {scope.description}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
