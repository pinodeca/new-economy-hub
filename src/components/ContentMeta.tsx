import type { SourceType } from "@/lib/content-types";

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

// Provenance is not optional here: agents populate this content via PR, and
// verification is the human merge step, not something a record grants
// itself — see CLAUDE.md and docs/DATA_MODEL.md. Surface it on every card
// rather than hiding it behind a detail page that doesn't exist yet.
export function ProvenanceNote({
  sourceType,
  verified,
}: {
  sourceType: SourceType;
  verified: boolean;
}) {
  const sourceLabel =
    sourceType === "HUMAN"
      ? "Human-submitted"
      : sourceType === "AI_ASSISTED"
        ? "AI-assisted"
        : "AI-generated";
  return (
    <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-600">
      {sourceLabel} · {verified ? "Verified" : "Unverified"}
    </p>
  );
}
